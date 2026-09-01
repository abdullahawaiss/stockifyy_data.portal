import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { weeklyStockPrices, companies, sectors } from "@/db/schema";
import { eq, and, gte, lte, desc, asc, like, sql } from "drizzle-orm";
import { format, startOfWeek, endOfWeek } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const refDate = sp.get("weekStart");
    let weekStart: string;
    if (refDate) {
      weekStart = refDate;
    } else {
      const now = new Date();
      weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    }

    const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(10, parseInt(sp.get("limit") ?? "50")));
    const offset = (page - 1) * limit;
    const search = sp.get("search") ?? "";
    const sortBy = sp.get("sortBy") ?? "symbol";
    const sortDir = sp.get("sortDir") === "desc" ? desc : asc;

    const conditions = [eq(weeklyStockPrices.weekStartDate, weekStart)];
    if (search) conditions.push(like(weeklyStockPrices.symbol, `%${search.toUpperCase()}%`));

    const sortCol = {
      symbol: weeklyStockPrices.symbol,
      weeklyClose: weeklyStockPrices.weeklyClose,
      weeklyPctChange: weeklyStockPrices.weeklyPctChange,
      totalWeeklyVolume: weeklyStockPrices.totalWeeklyVolume,
      totalWeeklyValue: weeklyStockPrices.totalWeeklyValue,
    }[sortBy] ?? weeklyStockPrices.symbol;

    const [rows, [{ count }]] = await Promise.all([
      db
        .select({
          symbol: weeklyStockPrices.symbol,
          weekStartDate: weeklyStockPrices.weekStartDate,
          weekEndDate: weeklyStockPrices.weekEndDate,
          firstTradingDay: weeklyStockPrices.firstTradingDay,
          lastTradingDay: weeklyStockPrices.lastTradingDay,
          weeklyOpen: weeklyStockPrices.weeklyOpen,
          weeklyHigh: weeklyStockPrices.weeklyHigh,
          weeklyLow: weeklyStockPrices.weeklyLow,
          weeklyClose: weeklyStockPrices.weeklyClose,
          previousWeekClose: weeklyStockPrices.previousWeekClose,
          weeklyPriceChange: weeklyStockPrices.weeklyPriceChange,
          weeklyPctChange: weeklyStockPrices.weeklyPctChange,
          totalWeeklyVolume: weeklyStockPrices.totalWeeklyVolume,
          avgDailyVolume: weeklyStockPrices.avgDailyVolume,
          totalWeeklyValue: weeklyStockPrices.totalWeeklyValue,
          totalWeeklyTrades: weeklyStockPrices.totalWeeklyTrades,
          tradingSessionsCount: weeklyStockPrices.tradingSessionsCount,
          weeklyVolatility: weeklyStockPrices.weeklyVolatility,
          dataCompleteness: weeklyStockPrices.dataCompleteness,
          lastCalculatedAt: weeklyStockPrices.lastCalculatedAt,
          companyName: companies.name,
          sectorName: sectors.name,
          shariahStatus: companies.shariahStatus,
          isDemo: weeklyStockPrices.isDemo,
        })
        .from(weeklyStockPrices)
        .leftJoin(companies, eq(weeklyStockPrices.companyId, companies.id))
        .leftJoin(sectors, eq(companies.sectorId, sectors.id))
        .where(and(...conditions))
        .orderBy(sortDir(sortCol))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(weeklyStockPrices)
        .where(and(...conditions)),
    ]);

    const res = NextResponse.json({
      data: rows,
      pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) },
      weekStart,
    });
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch weekly data" }, { status: 500 });
  }
}
