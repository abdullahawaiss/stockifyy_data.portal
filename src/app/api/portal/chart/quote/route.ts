import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyStockPrices, dailyIndexValues } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const PSX_INDEX_CODES: Record<string, string> = {
  KSE100: "KSE 100",
  KSE30:  "KSE 30",
  KMI30:  "KMI 30",
  KMIALL: "KMI All Share",
  KSEALL: "KSE All Share",
};

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.toUpperCase() ?? "";
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  // PSX index symbols → dailyIndexValues
  if (PSX_INDEX_CODES[symbol]) {
    try {
      const rows = await db
        .select()
        .from(dailyIndexValues)
        .where(eq(dailyIndexValues.indexCode, symbol))
        .orderBy(desc(dailyIndexValues.tradingDate))
        .limit(2);

      if (rows.length) {
        const r = rows[0];
        const prev = rows[1];
        const close = parseFloat(String(r.close ?? 0));
        const prevClose = prev ? parseFloat(String(prev.close ?? 0)) : parseFloat(String(r.previousClose ?? close));
        const change = close - prevClose;
        const changePct = prevClose ? (change / prevClose) * 100 : 0;
        return NextResponse.json({
          symbol,
          name: PSX_INDEX_CODES[symbol],
          price: close,
          open: parseFloat(String(r.open ?? close)),
          high: parseFloat(String(r.high ?? close)),
          low: parseFloat(String(r.low ?? close)),
          close,
          change: parseFloat(change.toFixed(2)),
          changePct: parseFloat(changePct.toFixed(2)),
          volume: parseFloat(String(r.volume ?? 0)),
          tradingDate: r.tradingDate,
          status: "PSX_EOD",
          provider: "psx_db",
        });
      }
    } catch { /* fall through */ }
  }

  // PSX stock symbols → dailyStockPrices
  try {
    const rows = await db
      .select()
      .from(dailyStockPrices)
      .where(eq(dailyStockPrices.symbol, symbol))
      .orderBy(desc(dailyStockPrices.tradingDate))
      .limit(1);

    if (rows.length) {
      const r = rows[0];
      return NextResponse.json({
        symbol,
        name: symbol,
        price: parseFloat(String(r.close ?? 0)),
        open: parseFloat(String(r.open ?? 0)),
        high: parseFloat(String(r.high ?? 0)),
        low: parseFloat(String(r.low ?? 0)),
        close: parseFloat(String(r.close ?? 0)),
        change: parseFloat(String(r.priceChange ?? 0)),
        changePct: parseFloat(String(r.percentageChange ?? 0)),
        volume: parseFloat(String(r.volume ?? 0)),
        tradingDate: r.tradingDate,
        status: "PSX_EOD",
        provider: "psx_db",
      });
    }
  } catch { /* fall through to Twelve Data */ }

  // International — Twelve Data
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured", status: "API_KEY_NOT_CONFIGURED" });
  }

  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return NextResponse.json({ error: "provider error" }, { status: 502 });
    const json = await res.json();
    if (json.status === "error") return NextResponse.json({ error: json.message }, { status: 404 });

    return NextResponse.json({
      symbol: json.symbol, name: json.name, exchange: json.exchange,
      price:     parseFloat(json.close ?? json.price ?? "0"),
      open:      parseFloat(json.open      ?? "0"),
      high:      parseFloat(json.high      ?? "0"),
      low:       parseFloat(json.low       ?? "0"),
      close:     parseFloat(json.close     ?? "0"),
      change:    parseFloat(json.change    ?? "0"),
      changePct: parseFloat(json.percent_change ?? "0"),
      volume:    parseFloat(json.volume    ?? "0"),
      status: "DELAYED", provider: "twelve_data",
    });
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
