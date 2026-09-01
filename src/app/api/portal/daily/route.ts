import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyStockPrices, companies, sectors } from "@/db/schema";
import { eq, and, desc, asc, like, sql } from "drizzle-orm";
import { PSX_STOCKS, searchPsxStocks } from "@/lib/psx-stocks-static";

export const dynamic = "force-dynamic";

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);
}

// Cache the latest available date for 60s to avoid a redundant query every request
let _latestDateCache: { date: string; ts: number } | null = null;

async function getLatestDate(requestedDate: string | null): Promise<string> {
  if (requestedDate) return requestedDate;
  const now = Date.now();
  if (_latestDateCache && now - _latestDateCache.ts < 60_000) return _latestDateCache.date;
  const [row] = await withTimeout(
    db.select({ d: sql<string>`max(trading_date)` }).from(dailyStockPrices),
    2000
  );
  const date = row?.d ?? new Date().toISOString().slice(0, 10);
  _latestDateCache = { date, ts: now };
  return date;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit = Math.min(2000, Math.max(10, parseInt(sp.get("limit") ?? "50")));
  const offset = (page - 1) * limit;
  const search = sp.get("search") ?? "";
  const shariah = sp.get("shariah");

  try {
    const date = await getLatestDate(sp.get("date"));
    const sectorId = sp.get("sectorId");
    const sortBy = sp.get("sortBy") ?? "symbol";
    const sortDir = sp.get("sortDir") === "desc" ? desc : asc;

    const conditions = [eq(dailyStockPrices.tradingDate, date)];
    if (search) conditions.push(like(dailyStockPrices.symbol, `%${search.toUpperCase()}%`));

    const sortCol = {
      symbol: dailyStockPrices.symbol,
      close: dailyStockPrices.close,
      percentageChange: dailyStockPrices.percentageChange,
      volume: dailyStockPrices.volume,
      marketValue: dailyStockPrices.marketValue,
    }[sortBy] ?? dailyStockPrices.symbol;

    const [rows, [{ count }]] = await withTimeout(Promise.all([
      db
        .select({
          symbol: dailyStockPrices.symbol,
          tradingDate: dailyStockPrices.tradingDate,
          open: dailyStockPrices.open,
          high: dailyStockPrices.high,
          low: dailyStockPrices.low,
          close: dailyStockPrices.close,
          previousClose: dailyStockPrices.previousClose,
          priceChange: dailyStockPrices.priceChange,
          percentageChange: dailyStockPrices.percentageChange,
          volume: dailyStockPrices.volume,
          marketValue: dailyStockPrices.marketValue,
          numberOfTrades: dailyStockPrices.numberOfTrades,
          weekHigh52: dailyStockPrices.weekHigh52,
          weekLow52: dailyStockPrices.weekLow52,
          companyName: companies.name,
          sectorName: sectors.name,
          shariahStatus: companies.shariahStatus,
          isDemo: dailyStockPrices.isDemo,
        })
        .from(dailyStockPrices)
        .leftJoin(companies, eq(dailyStockPrices.companyId, companies.id))
        .leftJoin(sectors, eq(companies.sectorId, sectors.id))
        .where(and(...conditions))
        .orderBy(sortDir(sortCol))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(dailyStockPrices)
        .where(and(...conditions)),
    ]), 2000); // fail fast after 2s when DB is unavailable

    const res = NextResponse.json({
      data: rows,
      pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) },
      date,
    });
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res;
  } catch {
    const today = new Date().toISOString().slice(0, 10);

    // Try PSX live scraper first — gives real prices even without DB
    try {
      const { getPsxRows } = await import("@/lib/psx-live");
      const live = await withTimeout(getPsxRows(), 4000);
      if (live && live.rows.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let rows: any[] = live.rows;
        if (search) {
          const q = search.toUpperCase();
          rows = rows.filter((r: any) => (r.symbol ?? "").toUpperCase().includes(q) || (r.companyName ?? "").toUpperCase().includes(q));
        }
        const sliced = rows.slice(offset, offset + limit);
        const data = sliced.map((r: any) => ({
          symbol: r.symbol, tradingDate: r.tradingDate ?? today,
          open: r.open, high: r.high, low: r.low, close: r.close,
          previousClose: r.previousClose, priceChange: r.priceChange,
          percentageChange: r.percentageChange, volume: r.volume,
          marketValue: r.marketValue, numberOfTrades: r.numberOfTrades,
          weekHigh52: r.weekHigh52 ?? null, weekLow52: r.weekLow52 ?? null,
          companyName: r.companyName ?? r.symbol, sectorName: r.sectorName ?? "—",
          shariahStatus: (r.indexCodes ?? []).includes("KMIALL") ? "compliant" : "non_compliant",
          isDemo: false,
        }));
        return NextResponse.json({ data, pagination: { page, limit, total: rows.length, pages: Math.ceil(rows.length / limit) }, date: today });
      }
    } catch { /* fall through to static */ }

    // Final fallback — static PSX list (no prices)
    const src = search ? searchPsxStocks(search, limit) : PSX_STOCKS.slice(offset, offset + limit);
    const data = src.map(s => ({
      symbol: s.symbol, tradingDate: today,
      open: null, high: null, low: null, close: null,
      previousClose: null, priceChange: null, percentageChange: null,
      volume: null, marketValue: null, numberOfTrades: null,
      weekHigh52: null, weekLow52: null,
      companyName: s.name, sectorName: s.sector,
      shariahStatus: s.shariah ? "compliant" : "non_compliant",
      isDemo: true,
    }));
    return NextResponse.json({
      data,
      pagination: { page, limit, total: data.length, pages: 1 },
      date: today,
    });
  }
}

