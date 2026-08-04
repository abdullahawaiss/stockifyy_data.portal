import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { weeklyStockPrices, companies, sectors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { format, startOfWeek } from "date-fns";
import { getSession, canAccess } from "@/lib/auth";
import { sanitizeCsvField } from "@/lib/csvSanitize";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!canAccess(session, "client")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const weekStart = sp.get("weekStart") ?? format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  if (!DATE_RE.test(weekStart)) {
    return NextResponse.json({ error: "Invalid weekStart format. Use YYYY-MM-DD." }, { status: 400 });
  }

  const rows = await db
    .select({
      symbol: weeklyStockPrices.symbol,
      companyName: companies.name,
      sectorName: sectors.name,
      weekStartDate: weeklyStockPrices.weekStartDate,
      weekEndDate: weeklyStockPrices.weekEndDate,
      weeklyOpen: weeklyStockPrices.weeklyOpen,
      weeklyHigh: weeklyStockPrices.weeklyHigh,
      weeklyLow: weeklyStockPrices.weeklyLow,
      weeklyClose: weeklyStockPrices.weeklyClose,
      previousWeekClose: weeklyStockPrices.previousWeekClose,
      weeklyPriceChange: weeklyStockPrices.weeklyPriceChange,
      weeklyPctChange: weeklyStockPrices.weeklyPctChange,
      totalWeeklyVolume: weeklyStockPrices.totalWeeklyVolume,
      totalWeeklyValue: weeklyStockPrices.totalWeeklyValue,
      totalWeeklyTrades: weeklyStockPrices.totalWeeklyTrades,
      tradingSessionsCount: weeklyStockPrices.tradingSessionsCount,
      weeklyVolatility: weeklyStockPrices.weeklyVolatility,
      dataCompleteness: weeklyStockPrices.dataCompleteness,
      shariahStatus: companies.shariahStatus,
    })
    .from(weeklyStockPrices)
    .leftJoin(companies, eq(weeklyStockPrices.companyId, companies.id))
    .leftJoin(sectors, eq(companies.sectorId, sectors.id))
    .where(eq(weeklyStockPrices.weekStartDate, weekStart))
    .orderBy(weeklyStockPrices.symbol);

  const header = "Symbol,Company,Sector,WeekStart,WeekEnd,W.Open,W.High,W.Low,W.Close,PrevWeekClose,W.Change,W.Chg%,W.Volume,W.Value,W.Trades,Sessions,Volatility,Completeness,Shariah\n";
  const csv = rows.map((r) =>
    [
      sanitizeCsvField(r.symbol),
      `"${sanitizeCsvField(r.companyName)}"`,
      `"${sanitizeCsvField(r.sectorName)}"`,
      r.weekStartDate,
      r.weekEndDate,
      r.weeklyOpen ?? "",
      r.weeklyHigh ?? "",
      r.weeklyLow ?? "",
      r.weeklyClose ?? "",
      r.previousWeekClose ?? "",
      r.weeklyPriceChange ?? "",
      r.weeklyPctChange ?? "",
      r.totalWeeklyVolume ?? "",
      r.totalWeeklyValue ?? "",
      r.totalWeeklyTrades ?? "",
      r.tradingSessionsCount ?? "",
      r.weeklyVolatility ?? "",
      r.dataCompleteness,
      sanitizeCsvField(r.shariahStatus),
    ].join(",")
  ).join("\n");

  return new NextResponse(header + csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="stockifyy-weekly-${weekStart}.csv"`,
    },
  });
}
