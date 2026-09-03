/**
 * POST /api/news/refresh
 * Fetches latest PSX news from RSS sources, processes with Claude AI,
 * and writes to the file cache. Called by the GET route when stale,
 * and can be called by an external cron (e.g. Vercel Cron, uptime robot).
 *
 * Protected by x-internal-secret header.
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchAllNews } from "@/lib/news-fetcher";
import { processArticlesWithAI } from "@/lib/news-processor";
import { writeCache, readCache, isCacheStale } from "@/lib/news-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // seconds

export async function POST(req: NextRequest) {
  // Simple auth to prevent abuse
  const secret = req.headers.get("x-internal-secret");
  const expected = process.env.NEWS_REFRESH_SECRET ?? "stockifyy-internal";
  if (secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Skip if cache is still fresh (avoid double-refresh race)
  const existing = readCache();
  if (!isCacheStale(existing)) {
    return NextResponse.json({ status: "skipped", reason: "cache still fresh", lastRefreshed: existing?.lastRefreshed });
  }

  try {
    const rawArticles = await fetchAllNews();
    const processed = await processArticlesWithAI(rawArticles.slice(0, 20));
    const cache = writeCache(processed);

    return NextResponse.json({
      status: "ok",
      count: processed.length,
      lastRefreshed: cache.lastRefreshed,
      nextRefresh: cache.nextRefresh,
    });
  } catch (err) {
    console.error("[news/refresh] failed:", err);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}

// Allow GET for manual browser trigger during dev
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Use POST" }, { status: 405 });
  }
  return POST(req);
}
