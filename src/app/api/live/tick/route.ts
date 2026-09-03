/**
 * POST /api/live/tick
 *
 * Cron-safe endpoint that forces a single poll cycle.
 * Call this from Vercel Cron (vercel.json) or an external scheduler
 * every 5 seconds during market hours.
 *
 * vercel.json example:
 * {
 *   "crons": [{ "path": "/api/live/tick", "schedule": "* * * * *" }]
 * }
 *
 * Protected by CRON_SECRET to prevent public abuse.
 */
import { NextRequest, NextResponse } from "next/server";
import { startPoller, getAllQuotes, getSummary } from "@/lib/psx-live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret   = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  const expected = process.env.CRON_SECRET;
  if (expected && secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  startPoller(); // idempotent — only starts once

  return NextResponse.json({
    ok:      true,
    count:   getAllQuotes().length,
    summary: getSummary(),
    ts:      Date.now(),
  });
}

// Allow GET for Vercel Cron (which uses GET on free plans)
export async function GET(req: NextRequest) {
  return POST(req);
}
