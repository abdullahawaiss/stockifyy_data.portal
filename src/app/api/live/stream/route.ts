/**
 * GET /api/live/stream
 *
 * Server-Sent Events (SSE) endpoint — pushes real-time quote updates
 * to any subscribed Next.js client without polling.
 *
 * Each event:
 *   event: tick
 *   data: { quotes: PsxQuote[], summary: MarketSummary, ts: number }
 *
 * Usage in the browser:
 *   const es = new EventSource("/api/live/stream");
 *   es.addEventListener("tick", e => {
 *     const { quotes, summary } = JSON.parse(e.data);
 *   });
 *
 * Works in Next.js 15 App Router with runtime = "nodejs".
 * Compatible with Vercel Edge when adapted (switch to runtime = "edge").
 */
import { NextRequest } from "next/server";
import { startPoller, subscribe } from "@/lib/psx-live";
import type { PsxQuote, MarketSummary } from "@/lib/psx-live";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

startPoller();

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let unsub: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // SSE headers are set on the Response below.
      // Send an initial connection message
      controller.enqueue(
        encoder.encode("event: connected\ndata: {\"ok\":true}\n\n")
      );

      // Subscribe to live ticks
      unsub = subscribe((quotes: PsxQuote[], summary: MarketSummary) => {
        try {
          const payload = JSON.stringify({ quotes, summary, ts: Date.now() });
          controller.enqueue(
            encoder.encode(`event: tick\ndata: ${payload}\n\n`)
          );
        } catch {
          // Client disconnected — will be cleaned up below
        }
      });

      // Heartbeat every 25s to keep the connection alive through proxies
      const hb = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(hb);
        }
      }, 25_000);

      // Cleanup when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(hb);
        unsub?.();
        unsub = null;
        try { controller.close(); } catch {}
      });
    },
    cancel() {
      unsub?.();
      unsub = null;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-store, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no", // disables Nginx buffering
    },
  });
}
