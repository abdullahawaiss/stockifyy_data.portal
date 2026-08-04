/**
 * Weekly Aggregation Script
 * Calculates weekly OHLCV data from daily records.
 * Safe to rerun (idempotent via upsert).
 * Usage: pnpm aggregate:weekly [YYYY-MM-DD]
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { format, startOfWeek, endOfWeek, addDays, parseISO } from "date-fns";
dotenv.config({ path: ".env.local" });

import * as schema from "../src/db/schema";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });

async function getWeekRange(refDate: Date) {
  const weekStart = startOfWeek(refDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(refDate, { weekStartsOn: 1 });     // Sunday
  return {
    weekStartDate: format(weekStart, "yyyy-MM-dd"),
    weekEndDate: format(weekEnd, "yyyy-MM-dd"),
  };
}

async function aggregateWeek(weekStartDate: string, weekEndDate: string) {
  console.log(`\nAggregating week: ${weekStartDate} to ${weekEndDate}`);

  // Record job start
  const [job] = await db.insert(schema.aggregationJobs).values({
    jobType: "weekly_stock_prices",
    weekStartDate,
    weekEndDate,
    status: "running",
    startedAt: new Date(),
    triggeredBy: "script",
  }).returning();

  try {
    // Get all trading days for this week from calendar
    const calendarDays = await db
      .select()
      .from(schema.tradingCalendar)
      .where(
        and(
          gte(schema.tradingCalendar.tradingDate, weekStartDate),
          lte(schema.tradingCalendar.tradingDate, weekEndDate),
          eq(schema.tradingCalendar.isTrading, true)
        )
      );
    const expectedTradingDays = calendarDays.length;

    // Get all distinct symbols with daily data in this week
    const symbolsResult = await db
      .selectDistinct({ symbol: schema.dailyStockPrices.symbol, companyId: schema.dailyStockPrices.companyId })
      .from(schema.dailyStockPrices)
      .where(
        and(
          gte(schema.dailyStockPrices.tradingDate, weekStartDate),
          lte(schema.dailyStockPrices.tradingDate, weekEndDate)
        )
      );

    let symbolsProcessed = 0;
    let warningsCount = 0;

    for (const { symbol, companyId } of symbolsResult) {
      // Get all daily records for this symbol in the week, ordered by date
      const dailyRecords = await db
        .select()
        .from(schema.dailyStockPrices)
        .where(
          and(
            eq(schema.dailyStockPrices.symbol, symbol),
            gte(schema.dailyStockPrices.tradingDate, weekStartDate),
            lte(schema.dailyStockPrices.tradingDate, weekEndDate)
          )
        )
        .orderBy(schema.dailyStockPrices.tradingDate);

      if (dailyRecords.length === 0) continue;

      const firstDay = dailyRecords[0];
      const lastDay = dailyRecords[dailyRecords.length - 1];

      const weeklyOpen = parseFloat(firstDay.open ?? "0");
      const weeklyClose = parseFloat(lastDay.close ?? "0");
      const weeklyHigh = Math.max(...dailyRecords.map(r => parseFloat(r.high ?? "0")));
      const weeklyLow = Math.min(...dailyRecords.map(r => parseFloat(r.low ?? "0")));
      const totalVolume = dailyRecords.reduce((s, r) => s + parseFloat(r.volume ?? "0"), 0);
      const totalValue = dailyRecords.reduce((s, r) => s + parseFloat(r.marketValue ?? "0"), 0);
      const totalTrades = dailyRecords.reduce((s, r) => s + (r.numberOfTrades ?? 0), 0);
      const avgDailyVol = totalVolume / dailyRecords.length;
      const avgDailyVal = totalValue / dailyRecords.length;

      // Best/worst day
      const sorted = [...dailyRecords].sort((a, b) =>
        parseFloat(b.percentageChange ?? "0") - parseFloat(a.percentageChange ?? "0")
      );
      const bestDay = sorted[0]?.tradingDate ?? null;
      const worstDay = sorted[sorted.length - 1]?.tradingDate ?? null;

      // Weekly volatility (std dev of daily % changes)
      const pctChanges = dailyRecords.map(r => parseFloat(r.percentageChange ?? "0"));
      const mean = pctChanges.reduce((a, b) => a + b, 0) / pctChanges.length;
      const variance = pctChanges.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pctChanges.length;
      const volatility = Math.sqrt(variance);

      // Previous week close
      const prevWeekEnd = format(addDays(parseISO(weekStartDate), -1), "yyyy-MM-dd");
      const prevWeekStart = format(addDays(parseISO(weekStartDate), -7), "yyyy-MM-dd");
      const [prevWeekRecord] = await db
        .select({ close: schema.weeklyStockPrices.weeklyClose })
        .from(schema.weeklyStockPrices)
        .where(
          and(
            eq(schema.weeklyStockPrices.symbol, symbol),
            lte(schema.weeklyStockPrices.weekEndDate, prevWeekEnd)
          )
        )
        .orderBy(sql`week_end_date DESC`)
        .limit(1);

      const prevWeekClose = prevWeekRecord ? parseFloat(prevWeekRecord.close ?? "0") : null;
      const weeklyChange = prevWeekClose ? +(weeklyClose - prevWeekClose).toFixed(4) : null;
      const weeklyPctChange = prevWeekClose ? +((weeklyChange! / prevWeekClose) * 100).toFixed(4) : null;

      // 52 week metrics
      const high52 = parseFloat(lastDay.weekHigh52 ?? "0");
      const low52 = parseFloat(lastDay.weekLow52 ?? "0");
      const distFromHigh = high52 > 0 ? +((weeklyClose - high52) / high52 * 100).toFixed(4) : null;
      const distFromLow = low52 > 0 ? +((weeklyClose - low52) / low52 * 100).toFixed(4) : null;

      // Data completeness
      const completeness = expectedTradingDays > 0 && dailyRecords.length < expectedTradingDays
        ? "partial" : "complete";
      if (completeness === "partial") {
        warningsCount++;
        await db.insert(schema.dataQualityIssues).values({
          entityType: "weekly_stock_price",
          entityId: `${symbol}:${weekStartDate}`,
          issueType: "partial_week_data",
          description: `${symbol}: Expected ${expectedTradingDays} trading days, found ${dailyRecords.length}`,
          severity: "warning",
        }).onConflictDoNothing();
      }

      const sourceIds = dailyRecords.map(r => r.id).join(",");
      const isDemo = dailyRecords.some(r => r.isDemo);

      // Upsert weekly record
      await db.insert(schema.weeklyStockPrices).values({
        companyId,
        symbol,
        weekStartDate,
        weekEndDate,
        firstTradingDay: firstDay.tradingDate,
        lastTradingDay: lastDay.tradingDate,
        weeklyOpen: String(weeklyOpen),
        weeklyHigh: String(weeklyHigh),
        weeklyLow: String(weeklyLow),
        weeklyClose: String(weeklyClose),
        previousWeekClose: prevWeekClose ? String(prevWeekClose) : null,
        weeklyPriceChange: weeklyChange !== null ? String(weeklyChange) : null,
        weeklyPctChange: weeklyPctChange !== null ? String(weeklyPctChange) : null,
        totalWeeklyVolume: String(Math.round(totalVolume)),
        avgDailyVolume: String(Math.round(avgDailyVol)),
        totalWeeklyValue: String(totalValue.toFixed(2)),
        avgDailyValue: String(avgDailyVal.toFixed(2)),
        totalWeeklyTrades: totalTrades,
        tradingSessionsCount: dailyRecords.length,
        bestDayDate: bestDay,
        worstDayDate: worstDay,
        weeklyVolatility: String(volatility.toFixed(4)),
        distFrom52WeekHigh: distFromHigh !== null ? String(distFromHigh) : null,
        distFrom52WeekLow: distFromLow !== null ? String(distFromLow) : null,
        dataCompleteness: completeness,
        calculationVersion: 1,
        sourceDailyIds: sourceIds,
        lastCalculatedAt: new Date(),
        isDemo,
      }).onConflictDoUpdate({
        target: [schema.weeklyStockPrices.symbol, schema.weeklyStockPrices.weekStartDate],
        set: {
          weeklyOpen: String(weeklyOpen),
          weeklyHigh: String(weeklyHigh),
          weeklyLow: String(weeklyLow),
          weeklyClose: String(weeklyClose),
          previousWeekClose: prevWeekClose ? String(prevWeekClose) : null,
          weeklyPriceChange: weeklyChange !== null ? String(weeklyChange) : null,
          weeklyPctChange: weeklyPctChange !== null ? String(weeklyPctChange) : null,
          totalWeeklyVolume: String(Math.round(totalVolume)),
          totalWeeklyValue: String(totalValue.toFixed(2)),
          totalWeeklyTrades: totalTrades,
          tradingSessionsCount: dailyRecords.length,
          weeklyVolatility: String(volatility.toFixed(4)),
          dataCompleteness: completeness,
          lastCalculatedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      symbolsProcessed++;
    }

    // Update job
    await db.update(schema.aggregationJobs)
      .set({ status: "completed", completedAt: new Date(), symbolsProcessed, warningsCount })
      .where(eq(schema.aggregationJobs.id, job.id));

    console.log(`✅ Aggregated ${symbolsProcessed} symbols. Warnings: ${warningsCount}`);
    return { symbolsProcessed, warningsCount };
  } catch (err) {
    await db.update(schema.aggregationJobs)
      .set({ status: "failed", completedAt: new Date(), errorMessage: String(err) })
      .where(eq(schema.aggregationJobs.id, job.id));
    throw err;
  }
}

async function main() {
  const refDateStr = process.argv[2];
  const refDate = refDateStr ? parseISO(refDateStr) : new Date();

  // Aggregate last 6 weeks
  let current = addDays(refDate, -35);
  while (current <= refDate) {
    const { weekStartDate, weekEndDate } = await getWeekRange(current);
    await aggregateWeek(weekStartDate, weekEndDate);
    current = addDays(current, 7);
  }

  console.log("\n🎉 Weekly aggregation complete!");
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
