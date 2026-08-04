import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyStockPrices, companies, sectors } from "@/db/schema";
import { eq } from "drizzle-orm";
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
  const dateParam = sp.get("date") ?? new Date().toISOString().slice(0, 10);

  if (!DATE_RE.test(dateParam)) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }

  const rows = await db
    .select({
      symbol: dailyStockPrices.symbol,
      companyName: companies.name,
      sectorName: sectors.name,
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
      shariahStatus: companies.shariahStatus,
    })
    .from(dailyStockPrices)
    .leftJoin(companies, eq(dailyStockPrices.companyId, companies.id))
    .leftJoin(sectors, eq(companies.sectorId, sectors.id))
    .where(eq(dailyStockPrices.tradingDate, dateParam))
    .orderBy(dailyStockPrices.symbol);

  const header = "Symbol,Company,Sector,Date,Open,High,Low,Close,PrevClose,Change,Chg%,Volume,Value,Trades,Shariah\n";
  const csv = rows.map((r) =>
    [
      sanitizeCsvField(r.symbol),
      `"${sanitizeCsvField(r.companyName)}"`,
      `"${sanitizeCsvField(r.sectorName)}"`,
      r.tradingDate,
      r.open ?? "",
      r.high ?? "",
      r.low ?? "",
      r.close ?? "",
      r.previousClose ?? "",
      r.priceChange ?? "",
      r.percentageChange ?? "",
      r.volume ?? "",
      r.marketValue ?? "",
      r.numberOfTrades ?? "",
      sanitizeCsvField(r.shariahStatus),
    ].join(",")
  ).join("\n");

  return new NextResponse(header + csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="stockifyy-daily-${dateParam}.csv"`,
    },
  });
}
