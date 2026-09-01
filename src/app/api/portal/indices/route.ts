import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyIndexValues, weeklyIndexValues, indices } from "@/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { format, startOfWeek } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const period = sp.get("period") ?? "daily";
    const date = sp.get("date") ?? new Date().toISOString().slice(0, 10);

    if (period === "weekly") {
      const weekStart = sp.get("weekStart") ?? format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const rows = await db
        .select({
          indexCode: weeklyIndexValues.indexCode,
          indexName: indices.name,
          weekStartDate: weeklyIndexValues.weekStartDate,
          weekEndDate: weeklyIndexValues.weekEndDate,
          weeklyOpen: weeklyIndexValues.weeklyOpen,
          weeklyHigh: weeklyIndexValues.weeklyHigh,
          weeklyLow: weeklyIndexValues.weeklyLow,
          weeklyClose: weeklyIndexValues.weeklyClose,
          previousWeekClose: weeklyIndexValues.previousWeekClose,
          weeklyChange: weeklyIndexValues.weeklyChange,
          weeklyPctChange: weeklyIndexValues.weeklyPctChange,
          isDemo: weeklyIndexValues.isDemo,
        })
        .from(weeklyIndexValues)
        .leftJoin(indices, eq(weeklyIndexValues.indexId, indices.id))
        .where(eq(weeklyIndexValues.weekStartDate, weekStart))
        .orderBy(weeklyIndexValues.indexCode);
      const res = NextResponse.json({ data: rows, period: "weekly", weekStart });
      res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      return res;
    }

    // Daily
    const rows = await db
      .select({
        indexCode: dailyIndexValues.indexCode,
        indexName: indices.name,
        tradingDate: dailyIndexValues.tradingDate,
        open: dailyIndexValues.open,
        high: dailyIndexValues.high,
        low: dailyIndexValues.low,
        close: dailyIndexValues.close,
        previousClose: dailyIndexValues.previousClose,
        change: dailyIndexValues.change,
        percentageChange: dailyIndexValues.percentageChange,
        isDemo: dailyIndexValues.isDemo,
      })
      .from(dailyIndexValues)
      .leftJoin(indices, eq(dailyIndexValues.indexId, indices.id))
      .where(eq(dailyIndexValues.tradingDate, date))
      .orderBy(dailyIndexValues.indexCode);

    const res2 = NextResponse.json({ data: rows, period: "daily", date });
    res2.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res2;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch index data" }, { status: 500 });
  }
}
