import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyStockPrices, companies, sectors } from "@/db/schema";
import { eq, and, desc, asc, like, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Cache the latest available date for 60s to avoid a redundant query every request
let _latestDateCache: { date: string; ts: number } | null = null;

async function getLatestDate(requestedDate: string | null): Promise<string> {
  if (requestedDate) return requestedDate;
  const now = Date.now();
  if (_latestDateCache && now - _latestDateCache.ts < 60_000) return _latestDateCache.date;
  const [row] = await db
    .select({ d: sql<string>`max(trading_date)` })
    .from(dailyStockPrices);
  const date = row?.d ?? new Date().toISOString().slice(0, 10);
  _latestDateCache = { date, ts: now };
  return date;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const date = await getLatestDate(sp.get("date"));
    const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(10, parseInt(sp.get("limit") ?? "50")));
    const offset = (page - 1) * limit;
    const search = sp.get("search") ?? "";
    const sectorId = sp.get("sectorId");
    const shariah = sp.get("shariah");
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

    const [rows, [{ count }]] = await Promise.all([
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
    ]);

    return NextResponse.json({
      data: rows,
      pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) },
      date,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch daily data" }, { status: 500 });
  }
}
