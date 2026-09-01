import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailySectorSummaries, weeklySectorSummaries, sectors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { format, startOfWeek } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const period = sp.get("period") ?? "daily";

    if (period === "weekly") {
      const weekStart = sp.get("weekStart") ?? format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const rows = await db
        .select({
          sectorId: weeklySectorSummaries.sectorId,
          sectorName: sectors.name,
          sectorCode: sectors.code,
          weekStartDate: weeklySectorSummaries.weekStartDate,
          weekEndDate: weeklySectorSummaries.weekEndDate,
          totalCompanies: weeklySectorSummaries.totalCompanies,
          weeklyAdvancers: weeklySectorSummaries.weeklyAdvancers,
          weeklyDecliners: weeklySectorSummaries.weeklyDecliners,
          weeklyUnchanged: weeklySectorSummaries.weeklyUnchanged,
          totalWeeklyVolume: weeklySectorSummaries.totalWeeklyVolume,
          totalWeeklyValue: weeklySectorSummaries.totalWeeklyValue,
          avgWeeklyPctChange: weeklySectorSummaries.avgWeeklyPctChange,
        })
        .from(weeklySectorSummaries)
        .leftJoin(sectors, eq(weeklySectorSummaries.sectorId, sectors.id))
        .where(eq(weeklySectorSummaries.weekStartDate, weekStart))
        .orderBy(desc(weeklySectorSummaries.avgWeeklyPctChange));
      const res = NextResponse.json({ data: rows, period: "weekly", weekStart });
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res;
    }

    const date = sp.get("date") ?? new Date().toISOString().slice(0, 10);
    const rows = await db
      .select({
        sectorId: dailySectorSummaries.sectorId,
        sectorName: sectors.name,
        sectorCode: sectors.code,
        tradingDate: dailySectorSummaries.tradingDate,
        totalCompanies: dailySectorSummaries.totalCompanies,
        advancers: dailySectorSummaries.advancers,
        decliners: dailySectorSummaries.decliners,
        unchanged: dailySectorSummaries.unchanged,
        totalVolume: dailySectorSummaries.totalVolume,
        totalValue: dailySectorSummaries.totalValue,
        totalMarketCap: dailySectorSummaries.totalMarketCap,
        avgPercentageChange: dailySectorSummaries.avgPercentageChange,
      })
      .from(dailySectorSummaries)
      .leftJoin(sectors, eq(dailySectorSummaries.sectorId, sectors.id))
      .where(eq(dailySectorSummaries.tradingDate, date))
      .orderBy(desc(dailySectorSummaries.avgPercentageChange));
    const res2 = NextResponse.json({ data: rows, period: "daily", date });
    res2.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res2;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch sector data" }, { status: 500 });
  }
}
