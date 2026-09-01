import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companies, sectors } from "@/db/schema";
import { eq, like, and, sql } from "drizzle-orm";
import { PSX_STOCKS, searchPsxStocks } from "@/lib/psx-stocks-static";

export const dynamic = "force-dynamic";

// Server-side in-memory cache keyed by full query string (10 min TTL)
const _cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 10 * 60_000;
function getCached(key: string) { const h = _cache.get(key); return h && Date.now() - h.ts < CACHE_TTL ? h.data : null; }
function setCached(key: string, data: unknown) { _cache.set(key, { data, ts: Date.now() }); }

// Fast timeout helper — fails after ms milliseconds
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout")), ms))]);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const search = sp.get("search") ?? "";
  const sectorCode = sp.get("sector") ?? "";
  const shariah = sp.get("shariah") ?? "";
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  // Raised cap from 100 → 2000 so watchlist / screener can load all stocks
  const limit = Math.min(2000, Math.max(10, parseInt(sp.get("limit") ?? "50")));
  const offset = (page - 1) * limit;

  // Return cached response if fresh
  const cacheKey = `${search}|${sectorCode}|${shariah}|${page}|${limit}`;
  const hit = getCached(cacheKey);
  if (hit) {
    const res = NextResponse.json(hit);
    res.headers.set("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1200");
    return res;
  }

  try {

    const conditions = [eq(companies.isActive, true)];
    if (search) {
      conditions.push(
        sql`(${companies.symbol} ILIKE ${`%${search}%`} OR ${companies.name} ILIKE ${`%${search}%`})`
      );
    }
    if (shariah) conditions.push(eq(companies.shariahStatus, shariah as "compliant" | "non_compliant" | "under_review" | "unknown"));

    const [rows, [{ count }]] = await withTimeout(Promise.all([
      db
        .select({
          id: companies.id,
          symbol: companies.symbol,
          name: companies.name,
          sectorId: companies.sectorId,
          sectorName: sectors.name,
          sectorCode: sectors.code,
          shariahStatus: companies.shariahStatus,
          listingDate: companies.listingDate,
          website: companies.website,
          freeFloat: companies.freeFloat,
          marketCapCategory: companies.marketCapCategory,
        })
        .from(companies)
        .leftJoin(sectors, eq(companies.sectorId, sectors.id))
        .where(and(...conditions))
        .orderBy(companies.symbol)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(companies).where(and(...conditions)),
    ]), 2000); // fail fast after 2s when DB is unavailable

    const payload = {
      data: rows,
      pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) },
    };
    setCached(cacheKey, payload);
    const res = NextResponse.json(payload);
    res.headers.set("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1200");
    return res;
  } catch {
    // DB unavailable — return static PSX list so clients always get data fast
    const src = search ? searchPsxStocks(search, limit) : PSX_STOCKS.slice(offset, offset + limit);
    const data = src.map(s => ({
      id: null, symbol: s.symbol, name: s.name, sectorId: null,
      sectorName: s.sector, sectorCode: null,
      shariahStatus: s.shariah ? "compliant" : "non_compliant",
      listingDate: null, website: null, freeFloat: null, marketCapCategory: null,
    }));
    return NextResponse.json({
      data,
      pagination: { page, limit, total: data.length, pages: 1 },
    });
  }
}

