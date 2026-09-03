/**
 * GET /api/live/quotes
 *
 * Returns all PSX quotes from the in-memory cache.
 * The cache is pre-populated by the background poller — this route
 * NEVER blocks on an upstream API call. Response time: <5ms.
 *
 * Query params:
 *   ?sym=HBL,OGDC     — filter to specific symbols
 *   ?index=kse100     — filter to kse100|kse30|kmi30
 */
import { NextRequest, NextResponse } from "next/server";
import { startPoller, getAllQuotes, getSummary, isReady, getQuote } from "@/lib/psx-live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // needs setInterval

// Start the background poller the first time any Next.js worker handles a request.
// In production (Vercel), use a cron job calling /api/live/tick instead.
startPoller();

export async function GET(req: NextRequest) {
  // If not ready yet, trigger an immediate poll and wait briefly
  if (!isReady()) {
    await new Promise(r => setTimeout(r, 800));
  }

  const { searchParams } = req.nextUrl;
  const symParam   = searchParams.get("sym");
  const indexParam = searchParams.get("index");

  let quotes = getAllQuotes();

  if (symParam) {
    const syms = new Set(symParam.toUpperCase().split(",").map(s => s.trim()));
    quotes = quotes.filter(q => syms.has(q.sym));
  } else if (indexParam) {
    const idx = indexParam.toLowerCase();
    if      (idx === "kse100") quotes = quotes.filter(q => q.kse100);
    else if (idx === "kse30")  quotes = quotes.filter(q => q.kse30);
    else if (idx === "kmi30")  quotes = quotes.filter(q => q.kmi30);
  }

  const res = NextResponse.json({
    quotes,
    summary: getSummary(),
    count:   quotes.length,
    ts:      Date.now(),
  });

  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.headers.set("X-Accel-Buffering", "no");
  return res;
}
