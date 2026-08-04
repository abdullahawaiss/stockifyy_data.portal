import { NextRequest, NextResponse } from "next/server";
import { getSession, canAccess } from "@/lib/auth";
import { db } from "@/db";
import { aggregationJobs, dailyStockPrices, weeklyStockPrices, dataQualityIssues } from "@/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { format, startOfWeek, endOfWeek, parseISO, addDays } from "date-fns";

export const dynamic = "force-dynamic";

async function aggregateWeek(weekStartDate: string, weekEndDate: string, triggeredBy: string) {
  const [job] = await db.insert(aggregationJobs).values({
    jobType: "weekly_stock_prices",
    weekStartDate,
    weekEndDate,
    status: "running",
    startedAt: new Date(),
    triggeredBy,
  }).returning();

  try {
    const symbolsResult = await db
      .selectDistinct({ symbol: dailyStockPrices.symbol, companyId: dailyStockPrices.companyId })
      .from(dailyStockPrices)
      .where(and(
        gte(dailyStockPrices.tradingDate, weekStartDate),
        lte(dailyStockPrices.tradingDate, weekEndDate)
      ));

    let symbolsProcessed = 0;
    let warningsCount = 0;

    for (const { symbol, companyId } of symbolsResult) {
      const dailyRecords = await db
        .select()
        .from(dailyStockPrices)
        .where(and(
          eq(dailyStockPrices.symbol, symbol),
          gte(dailyStockPrices.tradingDate, weekStartDate),
          lte(dailyStockPrices.tradingDate, weekEndDate)
        ))
        .orderBy(dailyStockPrices.tradingDate);

      if (!dailyRecords.length) continue;

      const first = dailyRecords[0];
      const last = dailyRecords[dailyRecords.length - 1];
      const weeklyOpen = parseFloat(first.open ?? "0");
      const weeklyClose = parseFloat(last.close ?? "0");
      const weeklyHigh = Math.max(...dailyRecords.map(r => parseFloat(r.high ?? "0")));
      const weeklyLow = Math.min(...dailyRecords.map(r => parseFloat(r.low ?? "0")));
      const totalVolume = dailyRecords.reduce((s, r) => s + parseFloat(r.volume ?? "0"), 0);
      const totalValue = dailyRecords.reduce((s, r) => s + parseFloat(r.marketValue ?? "0"), 0);
      const totalTrades = dailyRecords.reduce((s, r) => s + (r.numberOfTrades ?? 0), 0);

      const pctChanges = dailyRecords.map(r => parseFloat(r.percentageChange ?? "0"));
      const mean = pctChanges.reduce((a, b) => a + b, 0) / pctChanges.length;
      const volatility = Math.sqrt(pctChanges.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pctChanges.length);

      const [prevWeekRecord] = await db
        .select({ close: weeklyStockPrices.weeklyClose })
        .from(weeklyStockPrices)
        .where(and(
          eq(weeklyStockPrices.symbol, symbol),
          lte(weeklyStockPrices.weekEndDate, format(addDays(parseISO(weekStartDate), -1), "yyyy-MM-dd"))
        ))
        .orderBy(desc(weeklyStockPrices.weekEndDate))
        .limit(1);

      const prevWeekClose = prevWeekRecord ? parseFloat(prevWeekRecord.close ?? "0") : null;
      const weeklyChange = prevWeekClose ? +(weeklyClose - prevWeekClose).toFixed(4) : null;
      const weeklyPctChange = prevWeekClose && weeklyChange !== null ? +((weeklyChange / prevWeekClose) * 100).toFixed(4) : null;

      await db.insert(weeklyStockPrices).values({
        companyId,
        symbol,
        weekStartDate,
        weekEndDate,
        firstTradingDay: first.tradingDate,
        lastTradingDay: last.tradingDate,
        weeklyOpen: String(weeklyOpen),
        weeklyHigh: String(weeklyHigh),
        weeklyLow: String(weeklyLow),
        weeklyClose: String(weeklyClose),
        previousWeekClose: prevWeekClose ? String(prevWeekClose) : null,
        weeklyPriceChange: weeklyChange !== null ? String(weeklyChange) : null,
        weeklyPctChange: weeklyPctChange !== null ? String(weeklyPctChange) : null,
        totalWeeklyVolume: String(Math.round(totalVolume)),
        avgDailyVolume: String(Math.round(totalVolume / dailyRecords.length)),
        totalWeeklyValue: String(totalValue.toFixed(2)),
        avgDailyValue: String((totalValue / dailyRecords.length).toFixed(2)),
        totalWeeklyTrades: totalTrades,
        tradingSessionsCount: dailyRecords.length,
        weeklyVolatility: String(volatility.toFixed(4)),
        dataCompleteness: "complete",
        calculationVersion: 1,
        sourceDailyIds: dailyRecords.map(r => r.id).join(","),
        lastCalculatedAt: new Date(),
        isDemo: dailyRecords.some(r => r.isDemo),
      }).onConflictDoUpdate({
        target: [weeklyStockPrices.symbol, weeklyStockPrices.weekStartDate],
        set: {
          weeklyOpen: String(weeklyOpen),
          weeklyHigh: String(weeklyHigh),
          weeklyLow: String(weeklyLow),
          weeklyClose: String(weeklyClose),
          previousWeekClose: prevWeekClose ? String(prevWeekClose) : null,
          weeklyPriceChange: weeklyChange !== null ? String(weeklyChange) : null,
          weeklyPctChange: weeklyPctChange !== null ? String(weeklyPctChange) : null,
          totalWeeklyVolume: String(Math.round(totalVolume)),
          totalWeeklyTrades: totalTrades,
          tradingSessionsCount: dailyRecords.length,
          weeklyVolatility: String(volatility.toFixed(4)),
          lastCalculatedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      symbolsProcessed++;
    }

    await db.update(aggregationJobs)
      .set({ status: "completed", completedAt: new Date(), symbolsProcessed, warningsCount })
      .where(eq(aggregationJobs.id, job.id));

    return { jobId: job.id, symbolsProcessed, warningsCount };
  } catch (err) {
    await db.update(aggregationJobs)
      .set({ status: "failed", completedAt: new Date(), errorMessage: String(err) })
      .where(eq(aggregationJobs.id, job.id));
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!canAccess(session, "data_manager")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { weekStart, weekEnd } = await req.json();
    const ws = weekStart ?? format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const we = weekEnd ?? format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

    const result = await aggregateWeek(ws, we, session!.email);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Aggregation failed" }, { status: 500 });
  }
}
