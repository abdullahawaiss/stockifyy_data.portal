/**
 * GET /api/news
 * Returns cached PSX news articles. If the cache is stale (>1hr),
 * triggers a background refresh without blocking the response.
 */
import { NextResponse } from "next/server";
import { readCache, isCacheStale, getSeedCache } from "@/lib/news-store";

export const dynamic = "force-dynamic";

// In-memory flag to prevent concurrent background refreshes
let _refreshing = false;

function triggerBackgroundRefresh() {
  if (_refreshing) return;
  _refreshing = true;
  // Fire and forget — non-blocking
  fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/news/refresh`, {
    method: "POST",
    headers: { "x-internal-secret": process.env.NEWS_REFRESH_SECRET ?? "stockifyy-internal" },
  })
    .catch(() => {})
    .finally(() => { _refreshing = false; });
}

export async function GET() {
  const cache = readCache();

  if (isCacheStale(cache)) {
    triggerBackgroundRefresh();
  }

  if (!cache || cache.articles.length === 0) {
    // First-ever load: return seed articles immediately; background refresh will replace with real RSS
    const seed = getSeedCache();
    triggerBackgroundRefresh();
    return NextResponse.json({ articles: seed.articles, lastRefreshed: null, refreshing: true });
  }

  const res = NextResponse.json({
    articles: cache.articles,
    lastRefreshed: cache.lastRefreshed,
    nextRefresh: cache.nextRefresh,
    refreshing: isCacheStale(cache),
  });
  res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return res;
}
