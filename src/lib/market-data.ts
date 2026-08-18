/**
 * Shared market data fetcher — called directly by server components (no HTTP round-trip).
 * The API route also calls this so the in-memory cache is shared.
 */
import { db } from "@/db";
import { dailyStockPrices, dailyIndexValues } from "@/db/schema/market";
import { eq, desc, sql } from "drizzle-orm";
import { getPsxRows, getPsxIndices } from "@/lib/psx-live";

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

let _cache: { data: MarketSummary; ts: number } | null = null;
const CACHE_TTL = 60_000;

export async function getMarketSummary(): Promise<MarketSummary> {
  const now = Date.now();
  if (_cache && now - _cache.ts < CACHE_TTL) return _cache.data;

  try {
    const [latestStock, latestIndex] = await Promise.all([
      db.select({ d: sql<string>`max(${dailyStockPrices.tradingDate})` }).from(dailyStockPrices),
      db.select({ d: sql<string>`max(${dailyIndexValues.tradingDate})` }).from(dailyIndexValues),
    ]);
    const stockDate = latestStock[0]?.d;
    const indexDate = latestIndex[0]?.d;

    const [dbStocks, dbIndices] = await Promise.all([
      stockDate
        ? db.select({ symbol: dailyStockPrices.symbol, close: dailyStockPrices.close, change: dailyStockPrices.priceChange, pct: dailyStockPrices.percentageChange, vol: dailyStockPrices.volume })
            .from(dailyStockPrices).where(eq(dailyStockPrices.tradingDate, stockDate))
        : Promise.resolve([]),
      indexDate
        ? db.select({ code: dailyIndexValues.indexCode, close: dailyIndexValues.close, change: dailyIndexValues.change, pct: dailyIndexValues.percentageChange, vol: dailyIndexValues.volume })
            .from(dailyIndexValues).where(eq(dailyIndexValues.tradingDate, indexDate)).orderBy(desc(dailyIndexValues.close))
        : Promise.resolve([]),
    ]);

    const idxRows = toIdxRows(dbIndices);

    if (dbStocks.length > 50) {
      const summary = build(toStockRows(dbStocks), idxRows.length > 0 ? idxRows : await getPsxIndices(), "db");
      return cache(summary, now);
    }

    if (idxRows.length > 0) {
      const live = await getPsxRows();
      const liveStocks = live ? live.rows.map(toRowFromPsx) : toStockRows(dbStocks);
      const summary = build(liveStocks, idxRows, "db");
      return cache(summary, now);
    }
  } catch { /* fall through */ }

  // Full live fallback
  const live = await getPsxRows();
  const liveRows = live ? live.rows.map(toRowFromPsx) : [];
  const psxIdx = await getPsxIndices();
  const summary = build(liveRows, psxIdx, "live");
  return cache(summary, now);
}

function cache(data: MarketSummary, ts: number) {
  _cache = { data, ts };
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toIdxRows(raw: any[]) {
  return raw.map(i => ({
    code:   String(i.code ?? ""),
    close:  parseFloat(String(i.close))  || 0,
    change: parseFloat(String(i.change)) || 0,
    pct:    parseFloat(String(i.pct))    || 0,
    vol:    parseFloat(String(i.vol))    || 0,
  })).filter(i => i.code && i.close > 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toStockRows(raw: any[]) {
  return raw.map(s => ({ symbol: String(s.symbol), name: String(s.symbol), sector: "Unknown", close: parseFloat(String(s.close)) || 0, change: parseFloat(String(s.change)) || 0, pct: parseFloat(String(s.pct)) || 0, vol: parseInt(String(s.vol)) || 0 }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRowFromPsx(r: any) {
  return { symbol: r.symbol, name: r.companyName, sector: r.sectorName, close: parseFloat(r.close) || 0, change: parseFloat(r.priceChange) || 0, pct: parseFloat(r.percentageChange) || 0, vol: parseInt(r.volume) || 0 };
}

function build(
  stocks: { symbol: string; name: string; sector: string; close: number; change: number; pct: number; vol: number }[],
  indices: MarketSummary["indices"],
  source: "db" | "live"
): MarketSummary {
  const sorted = stocks.filter(r => r.close > 0);
  const gainers = [...sorted].filter(r => r.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 10).map(r => ({ symbol: r.symbol, name: r.name, close: r.close, change: r.change, pct: r.pct, vol: r.vol }));
  const losers  = [...sorted].filter(r => r.pct < 0).sort((a, b) => a.pct - b.pct).slice(0, 10).map(r => ({ symbol: r.symbol, name: r.name, close: r.close, change: r.change, pct: r.pct, vol: r.vol }));
  const volume  = [...sorted].sort((a, b) => b.vol - a.vol).slice(0, 10).map(r => ({ symbol: r.symbol, name: r.name, close: r.close, pct: r.pct, vol: r.vol }));
  const advances  = sorted.filter(r => r.pct > 0).length;
  const declines  = sorted.filter(r => r.pct < 0).length;
  const unchanged = sorted.filter(r => r.pct === 0).length;
  const breadth   = { advances, declines, unchanged, total: sorted.length };
  const sectorMap = new Map<string, number[]>();
  for (const r of sorted) {
    if (!r.sector || r.sector === "Unknown") continue;
    if (!sectorMap.has(r.sector)) sectorMap.set(r.sector, []);
    sectorMap.get(r.sector)!.push(r.pct);
  }
  const sectors = [...sectorMap.entries()].map(([name, pcts]) => ({ name, pct: +(pcts.reduce((a, b) => a + b, 0) / pcts.length).toFixed(2), count: pcts.length })).sort((a, b) => b.count - a.count).slice(0, 12);
  return { indices, gainers, losers, volume, breadth, sectors, updatedAt: new Date().toISOString(), source };
}
