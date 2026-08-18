import { NextResponse } from "next/server";
import { getPsxRows } from "@/lib/psx-live";
import { db } from "@/db";
import { dailyStockPrices, dailyIndexValues, indices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Cache for 60 seconds
let _cache: { data: MarketSummary; ts: number } | null = null;

export interface MarketSummary {
  indices: { code: string; close: number; change: number; pct: number; vol: number }[];
  gainers: { symbol: string; name: string; close: number; change: number; pct: number; vol: number }[];
  losers:  { symbol: string; name: string; close: number; change: number; pct: number; vol: number }[];
  volume:  { symbol: string; name: string; close: number; pct: number; vol: number }[];
  breadth: { advances: number; declines: number; unchanged: number; total: number };
  sectors: { name: string; pct: number; count: number }[];
  updatedAt: string;
  source: "db" | "live";
}

export async function GET() {
  const now = Date.now();
  if (_cache && now - _cache.ts < 60_000) {
    return NextResponse.json(_cache.data);
  }

  // Try DB first
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [dbStocks, dbIndices] = await Promise.all([
      db.select({
        symbol: dailyStockPrices.symbol,
        close: dailyStockPrices.close,
        change: dailyStockPrices.priceChange,
        pct: dailyStockPrices.percentageChange,
        vol: dailyStockPrices.volume,
      }).from(dailyStockPrices).where(eq(dailyStockPrices.tradingDate, today)),
      db.select({
        code: dailyIndexValues.indexCode,
        close: dailyIndexValues.close,
        change: dailyIndexValues.change,
        pct: dailyIndexValues.percentageChange,
      }).from(dailyIndexValues)
        .leftJoin(indices, eq(dailyIndexValues.indexId, indices.id))
        .where(eq(dailyIndexValues.tradingDate, today))
        .orderBy(desc(dailyIndexValues.close)),
    ]);

    if (dbStocks.length > 50) {
      const summary = buildSummary(dbStocks, dbIndices, "db");
      _cache = { data: summary, ts: now };
      return NextResponse.json(summary);
    }
  } catch {
    // fall through to live
  }

  // Fall back to PSX live scrape
  const live = await getPsxRows();
  if (!live) {
    return NextResponse.json({ error: "Market data unavailable" }, { status: 503 });
  }

  const rows = live.rows.map(r => ({
    symbol: r.symbol,
    name: r.companyName,
    sector: r.sectorName,
    close: parseFloat(r.close) || 0,
    change: parseFloat(r.priceChange) || 0,
    pct: parseFloat(r.percentageChange) || 0,
    vol: parseInt(r.volume) || 0,
  }));

  const summary = buildSummaryFromLive(rows);
  _cache = { data: summary, ts: now };
  return NextResponse.json(summary);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSummary(stocks: any[], dbIndices: any[], source: "db" | "live"): MarketSummary {
  const rows = stocks.map(s => ({
    symbol: s.symbol,
    name: s.symbol,
    sector: "Unknown",
    close: parseFloat(s.close) || 0,
    change: parseFloat(s.change) || 0,
    pct: parseFloat(s.pct) || 0,
    vol: parseInt(s.vol) || 0,
  }));
  const idxRows = (dbIndices || []).map((i: Record<string, unknown>) => ({
    code: String(i.code ?? ""),
    close: parseFloat(String(i.close)) || 0,
    change: parseFloat(String(i.change)) || 0,
    pct: parseFloat(String(i.pct)) || 0,
    vol: 0,
  })).filter(i => i.code);

  return { ...deriveDashboard(rows), indices: idxRows, updatedAt: new Date().toISOString(), source };
}

function buildSummaryFromLive(rows: { symbol: string; name: string; sector: string; close: number; change: number; pct: number; vol: number }[]): MarketSummary {
  return { ...deriveDashboard(rows), indices: [], updatedAt: new Date().toISOString(), source: "live" };
}

function deriveDashboard(rows: { symbol: string; name: string; sector: string; close: number; change: number; pct: number; vol: number }[]) {
  const sorted = [...rows].filter(r => r.close > 0);

  const gainers = [...sorted].filter(r => r.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 10)
    .map(r => ({ symbol: r.symbol, name: r.name, close: r.close, change: r.change, pct: r.pct, vol: r.vol }));

  const losers = [...sorted].filter(r => r.pct < 0).sort((a, b) => a.pct - b.pct).slice(0, 10)
    .map(r => ({ symbol: r.symbol, name: r.name, close: r.close, change: r.change, pct: r.pct, vol: r.vol }));

  const volume = [...sorted].sort((a, b) => b.vol - a.vol).slice(0, 10)
    .map(r => ({ symbol: r.symbol, name: r.name, close: r.close, pct: r.pct, vol: r.vol }));

  const advances = sorted.filter(r => r.pct > 0).length;
  const declines = sorted.filter(r => r.pct < 0).length;
  const unchanged = sorted.filter(r => r.pct === 0).length;
  const breadth = { advances, declines, unchanged, total: sorted.length };

  // Sector avg pct
  const sectorMap = new Map<string, number[]>();
  for (const r of sorted) {
    if (!r.sector || r.sector === "Unknown") continue;
    if (!sectorMap.has(r.sector)) sectorMap.set(r.sector, []);
    sectorMap.get(r.sector)!.push(r.pct);
  }
  const sectors = [...sectorMap.entries()].map(([name, pcts]) => ({
    name,
    pct: +(pcts.reduce((a, b) => a + b, 0) / pcts.length).toFixed(2),
    count: pcts.length,
  })).sort((a, b) => b.count - a.count).slice(0, 12);

  return { gainers, losers, volume, breadth, sectors };
}
