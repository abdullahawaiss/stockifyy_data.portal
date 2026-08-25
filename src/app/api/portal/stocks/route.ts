import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyStockPrices, companies, sectors, dailyIndexValues, indices } from "@/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// ── Server-side in-memory cache (survives within the same process/request pool) ──
// Keyed by date string so stale days don't bleed through.
const _stockCache = new Map<string, { data: unknown; ts: number }>();
const STOCK_TTL = 5 * 60_000; // 5 minutes

function getCached(key: string) {
  const hit = _stockCache.get(key);
  if (hit && Date.now() - hit.ts < STOCK_TTL) return hit.data;
  return null;
}
function setCached(key: string, data: unknown) {
  _stockCache.set(key, { data, ts: Date.now() });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPsxLive(date: string): Promise<any | null> {
  try {
    const { getPsxRows } = await import("@/lib/psx-live");
    const data = await getPsxRows();
    if (!data) return null;
    const { rows, sectors: liveSectors } = data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowsForDate = rows.map((r: any) => ({ ...r, tradingDate: date }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalVolume = rows.reduce((s: number, r: any) => s + (parseInt(r.volume || "0") || 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalValue  = rows.reduce((s: number, r: any) => s + (parseFloat(r.marketValue || "0") || 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const advancers   = rows.filter((r: any) => parseFloat(r.priceChange || "0") > 0).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decliners   = rows.filter((r: any) => parseFloat(r.priceChange || "0") < 0).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unchanged   = rows.filter((r: any) => parseFloat(r.priceChange || "0") === 0).length;
    return {
      date,
      rows: rowsForDate,
      totals: { totalVolume, totalValue, totalTrades: Math.floor(totalVolume / 1200), totalStocks: rows.length, advancers, decliners, unchanged, avgChange: 0 },
      indices: [],
      sectors: liveSectors,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rawDate   = sp.get("date")      ?? "";
  const search    = (sp.get("search")   ?? "").trim().toLowerCase();
  const sectorId  = sp.get("sectorId")  ?? "";
  const indexCode = sp.get("indexCode") ?? "";
  const sortBy    = sp.get("sortBy")    ?? "symbol";
  const sortDir   = sp.get("sortDir")   === "desc" ? "desc" : "asc";

  const date = rawDate || new Date().toISOString().slice(0, 10);

  // Cache key only for unfiltered requests (the most common case: stocks page load)
  const cacheKey = !search && !sectorId && !indexCode ? `${date}:${sortBy}:${sortDir}` : null;
  if (cacheKey) {
    const hit = getCached(cacheKey);
    if (hit) return NextResponse.json(hit, { headers: { "X-Cache": "HIT" } });
  }

  try {
    // ── Build WHERE conditions ──────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [eq(dailyStockPrices.tradingDate, date)];
    if (search) {
      conditions.push(
        sql`(${dailyStockPrices.symbol} ILIKE ${`%${search}%`} OR ${companies.name} ILIKE ${`%${search}%`})`
      );
    }
    if (sectorId) conditions.push(eq(companies.sectorId, Number(sectorId)));
    if (indexCode) {
      const idxRows = await db.select({ id: indices.id }).from(indices)
        .where(eq(indices.code, indexCode));
      const idx = idxRows[0];
      if (idx) {
        conditions.push(
          sql`${dailyStockPrices.companyId} IN (
            SELECT company_id FROM index_constituents
            WHERE index_id = ${idx.id} AND is_active = true
          )`
        );
      }
    }

    // ── ORDER BY ──────────────────────────────────────────────
    const dir = sortDir === "desc" ? desc : asc;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colMap: Record<string,any> = {
      symbol: dir(dailyStockPrices.symbol),
      close: dir(dailyStockPrices.close),
      percentageChange: dir(dailyStockPrices.percentageChange),
      priceChange: dir(dailyStockPrices.priceChange),
      volume: dir(dailyStockPrices.volume),
      marketValue: dir(dailyStockPrices.marketValue),
      numberOfTrades: dir(dailyStockPrices.numberOfTrades),
      open: dir(dailyStockPrices.open),
      high: dir(dailyStockPrices.high),
      low: dir(dailyStockPrices.low),
      previousClose: dir(dailyStockPrices.previousClose),
    };
    const orderClause = colMap[sortBy] ?? asc(dailyStockPrices.symbol);

    // ── Run all queries in parallel with a 4s timeout ────────
    const qRows = db
      .select({
        symbol:           dailyStockPrices.symbol,
        tradingDate:      dailyStockPrices.tradingDate,
        open:             dailyStockPrices.open,
        high:             dailyStockPrices.high,
        low:              dailyStockPrices.low,
        close:            dailyStockPrices.close,
        previousClose:    dailyStockPrices.previousClose,
        priceChange:      dailyStockPrices.priceChange,
        percentageChange: dailyStockPrices.percentageChange,
        volume:           dailyStockPrices.volume,
        marketValue:      dailyStockPrices.marketValue,
        numberOfTrades:   dailyStockPrices.numberOfTrades,
        weekHigh52:       dailyStockPrices.weekHigh52,
        weekLow52:        dailyStockPrices.weekLow52,
        upperCircuit:     dailyStockPrices.upperCircuit,
        lowerCircuit:     dailyStockPrices.lowerCircuit,
        isDemo:           dailyStockPrices.isDemo,
        companyName:      companies.name,
        sectorName:       sectors.name,
        sectorId:         companies.sectorId,
        shariahStatus:    companies.shariahStatus,
      })
      .from(dailyStockPrices)
      .leftJoin(companies, eq(dailyStockPrices.companyId, companies.id))
      .leftJoin(sectors, eq(companies.sectorId, sectors.id))
      .where(and(...conditions))
      .orderBy(orderClause);

    const qAgg = db
      .select({
        totalVolume: sql<string>`COALESCE(SUM(${dailyStockPrices.volume}),0)`,
        totalValue:  sql<string>`COALESCE(SUM(${dailyStockPrices.marketValue}),0)`,
        totalTrades: sql<string>`COALESCE(SUM(${dailyStockPrices.numberOfTrades}),0)`,
        totalStocks: sql<number>`COUNT(*)`,
        advancers:   sql<number>`COUNT(*) FILTER (WHERE ${dailyStockPrices.percentageChange} > 0)`,
        decliners:   sql<number>`COUNT(*) FILTER (WHERE ${dailyStockPrices.percentageChange} < 0)`,
        unchanged:   sql<number>`COUNT(*) FILTER (WHERE ${dailyStockPrices.percentageChange} = 0)`,
        avgChange:   sql<string>`COALESCE(AVG(${dailyStockPrices.percentageChange}),0)`,
      })
      .from(dailyStockPrices)
      .where(eq(dailyStockPrices.tradingDate, date));

    const qIdx = db
      .select({
        indexCode:        dailyIndexValues.indexCode,
        indexName:        indices.name,
        close:            dailyIndexValues.close,
        change:           dailyIndexValues.change,
        percentageChange: dailyIndexValues.percentageChange,
        high:             dailyIndexValues.high,
        low:              dailyIndexValues.low,
        previousClose:    dailyIndexValues.previousClose,
      })
      .from(dailyIndexValues)
      .leftJoin(indices, eq(dailyIndexValues.indexId, indices.id))
      .where(eq(dailyIndexValues.tradingDate, date))
      .orderBy(dailyIndexValues.indexCode);

    const qSec = db
      .select({ id: sectors.id, name: sectors.name })
      .from(sectors)
      .orderBy(asc(sectors.name));

    const dbTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB timeout")), 5000)
    );

    const [rows, aggRows, indexRows, sectorList] = await Promise.race([
      Promise.all([qRows, qAgg, qIdx, qSec]),
      dbTimeout,
    ]);
    const agg = aggRows[0];

    // ── If DB has no stocks for this date, try PSX live; otherwise serve DB immediately ──
    if (rows.length === 0) {
      const liveTimeout = new Promise<null>(r => setTimeout(() => r(null), 6_000));
      const live = await Promise.race([fetchPsxLive(date), liveTimeout]);
      if (live) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let filtered: any[] = live.rows;
        if (search) {
          const qFlat = search.replace(/[^a-z0-9]/g, "");
          const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          filtered = filtered.filter((r: any) =>
            r.symbol.toLowerCase().includes(search) ||
            (r.companyName ?? "").toLowerCase().includes(search) ||
            flat(r.symbol).includes(qFlat) ||
            flat(r.companyName ?? "").includes(qFlat)
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (sectorId) filtered = filtered.filter((r: any) => String(r.sectorId) === sectorId);
        return NextResponse.json({ ...live, rows: filtered, date });
      }
      // PSX live unavailable and DB sparse — return real empty state
      return NextResponse.json({
        date, rows: [], indices: [], sectors: sectorList,
        totals: { totalVolume:0, totalValue:0, totalTrades:0, totalStocks:0, advancers:0, decliners:0, unchanged:0, avgChange:0 },
      });
    }

    const payload = {
      date,
      rows,
      totals: {
        totalVolume: Number(agg?.totalVolume ?? 0),
        totalValue:  Number(agg?.totalValue  ?? 0),
        totalTrades: Number(agg?.totalTrades ?? 0),
        totalStocks: Number(agg?.totalStocks ?? 0),
        advancers:   Number(agg?.advancers   ?? 0),
        decliners:   Number(agg?.decliners   ?? 0),
        unchanged:   Number(agg?.unchanged   ?? 0),
        avgChange:   Number(agg?.avgChange   ?? 0),
      },
      indices: indexRows.length ? indexRows : [],
      sectors: sectorList,
    };
    if (cacheKey) setCached(cacheKey, payload);
    return NextResponse.json(payload);

  } catch (err) {
    console.error("[stocks api] query failed, trying PSX live:", err instanceof Error ? err.message : "unknown");
    const liveTimeout = new Promise<null>(r => setTimeout(() => r(null), 6_000));
    const live = await Promise.race([fetchPsxLive(date), liveTimeout]);
    if (live) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let filtered: any[] = live.rows;
      if (search) {
        const qFlat = search.replace(/[^a-z0-9]/g, "");
        const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filtered = filtered.filter((r: any) =>
          r.symbol.toLowerCase().includes(search) ||
          (r.companyName ?? "").toLowerCase().includes(search) ||
          flat(r.symbol).includes(qFlat) ||
          flat(r.companyName ?? "").includes(qFlat)
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (sectorId) filtered = filtered.filter((r: any) => String(r.sectorId) === sectorId);
      return NextResponse.json({ ...live, rows: filtered, date });
    }
    // DB error and PSX live unavailable — return real empty state, never demo
    return NextResponse.json(
      { date, rows: [], indices: [], sectors: [], totals: { totalVolume:0, totalValue:0, totalTrades:0, totalStocks:0, advancers:0, decliners:0, unchanged:0, avgChange:0 } },
      { status: 503 }
    );
  }
}
