/**
 * Shared market data fetcher — called by server components and API routes.
 * In-memory cache keeps hot data instantly available within the same process.
 */
import { db } from "@/db";
import { dailyStockPrices, dailyIndexValues, companyAnnouncements } from "@/db/schema/market";
import { eq, desc, sql } from "drizzle-orm";
import { getPsxRows, getPsxIndices } from "@/lib/psx-live";

export interface MarketSummary {
  indices: { code: string; close: number; change: number; pct: number; vol: number }[];
  gainers: { symbol: string; name: string; close: number; change: number; pct: number; vol: number }[];
  losers:  { symbol: string; name: string; close: number; change: number; pct: number; vol: number }[];
  volume:  { symbol: string; name: string; close: number; pct: number; vol: number }[];
  breadth: { advances: number; declines: number; unchanged: number; total: number };
  sectors: { name: string; pct: number; count: number }[];
  updatedAt: string;
  source: "db" | "live";
}

let _cache: { data: MarketSummary; ts: number } | null = null;
const CACHE_TTL = 60_000;

// Background PSX warming — fires and never blocks the caller
let _psxPending = false;
function warmPsxBackground() {
  if (_psxPending) return;
  _psxPending = true;
  Promise.all([getPsxRows(), getPsxIndices()])
    .finally(() => { _psxPending = false; });
}

export async function getMarketSummary(): Promise<MarketSummary> {
  const t0 = Date.now();
  const now = t0;

  if (_cache && now - _cache.ts < CACHE_TTL) {
    console.log(`[market-data] cache hit (${Date.now() - t0}ms)`);
    return _cache.data;
  }

  try {
    // ── Single round-trip: fetch latest stocks + latest indices in parallel
    //    Each query uses a subquery so we skip the separate "max(date)" round-trip.
    const [dbStocks, dbIndices] = await Promise.all([
      db.select({
          symbol: dailyStockPrices.symbol,
          close:  dailyStockPrices.close,
          change: dailyStockPrices.priceChange,
          pct:    dailyStockPrices.percentageChange,
          vol:    dailyStockPrices.volume,
        })
        .from(dailyStockPrices)
        .where(eq(
          dailyStockPrices.tradingDate,
          sql<string>`(SELECT max(trading_date) FROM daily_stock_prices)`,
        )),
      db.select({
          code:   dailyIndexValues.indexCode,
          close:  dailyIndexValues.close,
          change: dailyIndexValues.change,
          pct:    dailyIndexValues.percentageChange,
          vol:    dailyIndexValues.volume,
        })
        .from(dailyIndexValues)
        .where(eq(
          dailyIndexValues.tradingDate,
          sql<string>`(SELECT max(trading_date) FROM daily_index_values)`,
        ))
        .orderBy(desc(dailyIndexValues.close)),
    ]);
    console.log(`[market-data] DB queries done (${Date.now() - t0}ms) — stocks:${dbStocks.length} indices:${dbIndices.length}`);

    const idxRows = toIdxRows(dbIndices);

    if (dbStocks.length > 50) {
      // Enough stock data from DB — build summary immediately
      const summary = build(toStockRows(dbStocks), idxRows.length > 0 ? idxRows : [], "db");
      console.log(`[market-data] built from DB (${Date.now() - t0}ms)`);
      // Warm PSX cache in background so next 60s refresh is faster
      warmPsxBackground();
      return cache(summary, now);
    }

    if (idxRows.length > 0) {
      // Indices from DB, stocks from PSX live
      const t1 = Date.now();
      const live = await getPsxRows();
      console.log(`[market-data] PSX rows (${Date.now() - t1}ms)`);
      const liveStocks = live ? live.rows.map(toRowFromPsx) : toStockRows(dbStocks);
      const summary = build(liveStocks, idxRows, "db");
      console.log(`[market-data] built from DB+PSX (${Date.now() - t0}ms)`);
      return cache(summary, now);
    }

    // ── Full live fallback
    console.warn(`[market-data] no DB data — falling back to full PSX scrape`);
    const t1 = Date.now();
    const [live, psxIdx] = await Promise.all([getPsxRows(), getPsxIndices()]);
    console.log(`[market-data] PSX fallback done (${Date.now() - t1}ms)`);
    const liveRows = live ? live.rows.map(toRowFromPsx) : [];
    const summary = build(liveRows, psxIdx, "live");
    console.log(`[market-data] built from PSX-only (${Date.now() - t0}ms)`);
    return cache(summary, now);
  } catch (err) {
    console.error(`[market-data] error (${Date.now() - t0}ms)`, err);
    // Return stale cache if available
    if (_cache) return _cache.data;
    // No cache — try PSX live as last resort instead of crashing
    try {
      console.warn(`[market-data] DB unavailable, attempting full PSX fallback`);
      const [live, psxIdx] = await Promise.all([getPsxRows(), getPsxIndices()]);
      const liveRows = live ? live.rows.map(toRowFromPsx) : [];
      const summary = build(liveRows, psxIdx, "live");
      return cache(summary, now);
    } catch (psxErr) {
      console.error(`[market-data] PSX fallback also failed`, psxErr);
      // Return an empty-but-valid summary so the route always returns 200
      return {
        indices: [], gainers: [], losers: [], volume: [],
        breadth: { advances: 0, declines: 0, unchanged: 0, total: 0 },
        sectors: [], updatedAt: new Date().toISOString(), source: "live" as const,
      };
    }
  }
}

function cache(data: MarketSummary, ts: number) {
  _cache = { data, ts };
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toIdxRows(raw: any[]) {
  return raw.map(i => ({
    code:   String(i.code ?? ""),
    close:  parseFloat(String(i.close))  || 0,
    change: parseFloat(String(i.change)) || 0,
    pct:    parseFloat(String(i.pct))    || 0,
    vol:    parseFloat(String(i.vol))    || 0,
  })).filter(i => i.code && i.close > 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toStockRows(raw: any[]) {
  return raw.map(s => ({
    symbol: String(s.symbol),
    name:   String(s.symbol),
    sector: "Unknown",
    close:  parseFloat(String(s.close))  || 0,
    change: parseFloat(String(s.change)) || 0,
    pct:    parseFloat(String(s.pct))    || 0,
    vol:    parseInt(String(s.vol))      || 0,
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRowFromPsx(r: any) {
  return {
    symbol: r.symbol,
    name:   r.companyName,
    sector: r.sectorName,
    close:  parseFloat(r.close)             || 0,
    change: parseFloat(r.priceChange)       || 0,
    pct:    parseFloat(r.percentageChange)  || 0,
    vol:    parseInt(r.volume)              || 0,
  };
}

function build(
  stocks: { symbol: string; name: string; sector: string; close: number; change: number; pct: number; vol: number }[],
  indices: MarketSummary["indices"],
  source: "db" | "live"
): MarketSummary {
  const sorted = stocks.filter(r => r.close > 0);
  const gainers = [...sorted].filter(r => r.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 10)
    .map(r => ({ symbol: r.symbol, name: r.name, close: r.close, change: r.change, pct: r.pct, vol: r.vol }));
  const losers = [...sorted].filter(r => r.pct < 0).sort((a, b) => a.pct - b.pct).slice(0, 10)
    .map(r => ({ symbol: r.symbol, name: r.name, close: r.close, change: r.change, pct: r.pct, vol: r.vol }));
  const volume = [...sorted].sort((a, b) => b.vol - a.vol).slice(0, 10)
    .map(r => ({ symbol: r.symbol, name: r.name, close: r.close, pct: r.pct, vol: r.vol }));
  const advances  = sorted.filter(r => r.pct > 0).length;
  const declines  = sorted.filter(r => r.pct < 0).length;
  const unchanged = sorted.filter(r => r.pct === 0).length;
  const breadth   = { advances, declines, unchanged, total: sorted.length };
  const sectorMap = new Map<string, number[]>();
  for (const r of sorted) {
    if (!r.sector || r.sector === "Unknown") continue;
    if (!sectorMap.has(r.sector)) sectorMap.set(r.sector, []);
    sectorMap.get(r.sector)!.push(r.pct);
  }
  const sectors = [...sectorMap.entries()]
    .map(([name, pcts]) => ({ name, pct: +(pcts.reduce((a, b) => a + b, 0) / pcts.length).toFixed(2), count: pcts.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  return { indices, gainers, losers, volume, breadth, sectors, updatedAt: new Date().toISOString(), source };
}

// ── Announcements ─────────────────────────────────────────────────────────

export interface AnnouncementItem {
  id: number;
  symbol: string | null;
  announcementType: string;
  title: string;
  content: string | null;
  announcementDate: string;
  fileUrl: string | null;
}

let _annCache: { data: AnnouncementItem[]; ts: number } | null = null;
const ANN_TTL = 120_000;

export async function getAnnouncements(limit = 30): Promise<AnnouncementItem[]> {
  const now = Date.now();
  if (_annCache && now - _annCache.ts < ANN_TTL) return _annCache.data;

  const t0 = Date.now();
  try {
    const rows = await db
      .select({
        id:               companyAnnouncements.id,
        symbol:           companyAnnouncements.symbol,
        announcementType: companyAnnouncements.announcementType,
        title:            companyAnnouncements.title,
        content:          companyAnnouncements.content,
        announcementDate: companyAnnouncements.announcementDate,
        fileUrl:          companyAnnouncements.fileUrl,
      })
      .from(companyAnnouncements)
      .where(eq(companyAnnouncements.isPublic, true))
      .orderBy(desc(companyAnnouncements.announcementDate))
      .limit(limit);
    console.log(`[market-data] announcements query (${Date.now() - t0}ms) rows:${rows.length}`);
    const data = rows as AnnouncementItem[];
    _annCache = { data, ts: now };
    return data;
  } catch {
    console.warn(`[market-data] announcements query failed (${Date.now() - t0}ms), using cache`);
    return _annCache?.data ?? [];
  }
}

// ── Startup cache warming ─────────────────────────────────────────────────
// Fires immediately when the module first loads (i.e. on `npm run dev` / server start).
// By the time the first browser request arrives the cache is already populated,
// so every user gets sub-5ms data instead of a cold-start wait.
if (process.env.NODE_ENV !== "test") {
  Promise.all([
    getMarketSummary().catch(e => console.warn("[market-data] startup warm failed:", e)),
    getAnnouncements(30).catch(() => {}),
  ]);
}

