import { NextResponse } from "next/server";
import { db } from "@/db";
import { dailyStockPrices, companies, sectors } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// 5-minute server-side cache
const _cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 5 * 60_000;

function getCached(key: string) {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;
  return null;
}
function setCached(key: string, data: unknown) {
  _cache.set(key, { data, ts: Date.now() });
}


export async function GET() {
  const cacheKey = "heatmap";
  const hit = getCached(cacheKey);
  if (hit) return NextResponse.json(hit, { headers: { "X-Cache": "HIT" } });

  try {
    // Get latest trading date
    const latestDateRow = await db
      .select({ date: dailyStockPrices.tradingDate })
      .from(dailyStockPrices)
      .orderBy(desc(dailyStockPrices.tradingDate))
      .limit(1);

    if (!latestDateRow.length) throw new Error("No data");
    const date = latestDateRow[0].date;

    // Query stocks with sector and shariah status
    const rows = await db
      .select({
        symbol:           dailyStockPrices.symbol,
        close:            dailyStockPrices.close,
        percentageChange: dailyStockPrices.percentageChange,
        volume:           dailyStockPrices.volume,
        marketValue:      dailyStockPrices.marketValue,
        companyName:      companies.name,
        sectorName:       sectors.name,
        shariahStatus:    companies.shariahStatus,
      })
      .from(dailyStockPrices)
      .leftJoin(companies, eq(dailyStockPrices.companyId, companies.id))
      .leftJoin(sectors, eq(companies.sectorId, sectors.id))
      .where(eq(dailyStockPrices.tradingDate, date));

    if (rows.length < 20) throw new Error("Insufficient data");

    // Get index membership (KSE-100, KSE-30, KMI-30, KMI-All)
    type IndexRow = { symbol: string; indexCode: string };
    const indexMembership = await db.execute<IndexRow>(
      sql`SELECT dp.symbol, i.code as "indexCode"
          FROM daily_stock_prices dp
          JOIN index_constituents ic ON ic.company_id = dp.company_id
          JOIN indices i ON i.id = ic.index_id
          WHERE dp.trading_date = ${date}
            AND ic.is_active = true
            AND i.code IN ('KSE100','KSE30','KMI30','KMIALL')`
    );

    // Build membership sets
    const kse100 = new Set<string>();
    const kse30  = new Set<string>();
    const kmi30  = new Set<string>();
    const kmiAll = new Set<string>();
    for (const r of (indexMembership as unknown as IndexRow[])) {
      if (r.indexCode === "KSE100") kse100.add(r.symbol);
      if (r.indexCode === "KSE30")  kse30.add(r.symbol);
      if (r.indexCode === "KMI30")  kmi30.add(r.symbol);
      if (r.indexCode === "KMIALL") kmiAll.add(r.symbol);
    }

    const stocks = rows.map(r => ({
      sym:     r.symbol,
      name:    r.companyName ?? r.symbol,
      sector:  r.sectorName  ?? "Other",
      price:   Number(r.close ?? 0),
      chg:     Number(r.percentageChange ?? 0),
      vol:     Math.round(Number(r.volume ?? 0) / 1000), // convert to thousands
      cap:     Math.round(Number(r.marketValue ?? 0) / 1000), // convert to thousands
      shariah: r.shariahStatus === "compliant",
      kse100:  kse100.has(r.symbol),
      kse30:   kse30.has(r.symbol),
      kmi30:   kmi30.has(r.symbol),
      kmiAll:  kmiAll.has(r.symbol),
    }));

    const payload = { stocks, date, source: "live" };
    setCached(cacheKey, payload);
    return NextResponse.json(payload);

  } catch {
    // Try PSX live scraper before falling back to demo
    try {
      const { getPsxRows } = await import("@/lib/psx-live");
      const live = await getPsxRows();
      if (live && live.rows.length >= 20) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stocks = live.rows.map((r: any) => {
          const codes: string[] = r.indexCodes ?? [];
          const isKmiAll = codes.includes("KMIALL");
          return {
            sym:     r.symbol ?? "",
            name:    r.companyName ?? r.symbol ?? "",
            sector:  r.sectorName ?? "Other",
            price:   parseFloat(r.close ?? "0") || 0,
            chg:     parseFloat(r.percentageChange ?? r.priceChange ?? "0") || 0,
            vol:     Math.round((parseInt(r.volume ?? "0") || 0) / 1000),
            cap:     Math.round((parseFloat(r.marketValue ?? "0") || 0) / 1000),
            shariah: isKmiAll,
            kse100:  codes.includes("KSE100"),
            kse30:   codes.includes("KSE30"),
            kmi30:   codes.includes("KMI30"),
            kmiAll:  isKmiAll,
          };
        });
        const payload = { stocks, date: new Date().toISOString().slice(0, 10), source: "live" };
        setCached(cacheKey, payload);
        return NextResponse.json(payload);
      }
    } catch { /* fall through */ }

    // No real data available — return empty, never fabricated demo data
    return NextResponse.json({
      stocks: [],
      date: new Date().toISOString().slice(0, 10),
      source: "unavailable",
    });
  }
}
