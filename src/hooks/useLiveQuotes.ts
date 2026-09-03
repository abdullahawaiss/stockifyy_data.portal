"use client";
/**
 * useLiveQuotes — React hook for real-time PSX stock data via SSE.
 *
 * Usage:
 *   const { quotes, summary, connected, lastTs } = useLiveQuotes();
 *   const { quotes: kse100 } = useLiveQuotes({ index: "kse100" });
 *
 * The hook connects once via /api/live/stream (SSE) and streams tick-by-tick
 * updates. Falls back to polling /api/live/quotes every 10s if SSE fails.
 *
 * Zero dependencies beyond React — no SWR, no external library required.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import type { PsxQuote, MarketSummary } from "@/lib/psx-live";

export type { PsxQuote, MarketSummary };

interface Options {
  /** Filter to specific symbols, e.g. ["HBL","OGDC"] */
  symbols?: string[];
  /** Filter to an index: "kse100" | "kse30" | "kmi30" */
  index?: "kse100" | "kse30" | "kmi30";
  /** Disable the SSE connection and use polling only */
  pollingOnly?: boolean;
  /** Polling interval in ms (default 10 000). Only used when SSE fails or pollingOnly=true */
  pollInterval?: number;
}

interface LiveData {
  quotes:    PsxQuote[];
  summary:   MarketSummary | null;
  connected: boolean;  // SSE is live
  lastTs:    number;   // unix ms of last update
  error:     string | null;
}

function applyFilter(quotes: PsxQuote[], opts: Options): PsxQuote[] {
  let r = quotes;
  if (opts.symbols?.length) {
    const s = new Set(opts.symbols.map(x => x.toUpperCase()));
    r = r.filter(q => s.has(q.sym));
  } else if (opts.index) {
    if      (opts.index === "kse100") r = r.filter(q => q.kse100);
    else if (opts.index === "kse30")  r = r.filter(q => q.kse30);
    else if (opts.index === "kmi30")  r = r.filter(q => q.kmi30);
  }
  return r;
}

export function useLiveQuotes(opts: Options = {}): LiveData {
  const [quotes,    setQuotes]    = useState<PsxQuote[]>([]);
  const [summary,   setSummary]   = useState<MarketSummary | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastTs,    setLastTs]    = useState(0);
  const [error,     setError]     = useState<string | null>(null);

  const optsRef      = useRef(opts);
  const esRef        = useRef<EventSource | null>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef(0);

  optsRef.current = opts;

  // ── REST poll fallback ────────────────────────────────────────────────────
  const fetchOnce = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (optsRef.current.symbols?.length) params.set("sym", optsRef.current.symbols.join(","));
      else if (optsRef.current.index)      params.set("index", optsRef.current.index);

      const res = await fetch(`/api/live/quotes?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { quotes: PsxQuote[]; summary: MarketSummary; ts: number };
      setQuotes(applyFilter(data.quotes, optsRef.current));
      setSummary(data.summary);
      setLastTs(data.ts);
      setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  // ── SSE connection ────────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    if (opts.pollingOnly) {
      fetchOnce();
      const iv = opts.pollInterval ?? 10_000;
      pollRef.current = setInterval(fetchOnce, iv);
      return;
    }

    const es = new EventSource("/api/live/stream");
    esRef.current = es;

    es.addEventListener("connected", () => {
      setConnected(true);
      setError(null);
      retryCountRef.current = 0;
      // Stop polling if we had it running
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    });

    es.addEventListener("tick", (e: MessageEvent) => {
      try {
        const { quotes: all, summary: sum, ts } = JSON.parse(e.data) as {
          quotes: PsxQuote[]; summary: MarketSummary; ts: number;
        };
        setQuotes(applyFilter(all, optsRef.current));
        setSummary(sum);
        setLastTs(ts);
        setError(null);
      } catch {}
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;

      // Exponential back-off retry: 2s, 4s, 8s … max 30s
      retryCountRef.current += 1;
      const delay = Math.min(30_000, 1_000 * 2 ** retryCountRef.current);

      // While SSE is down, fall back to polling
      if (!pollRef.current) {
        fetchOnce();
        pollRef.current = setInterval(fetchOnce, opts.pollInterval ?? 10_000);
      }

      setTimeout(connect, delay);
    };
  }, [fetchOnce, opts.pollInterval, opts.pollingOnly]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { quotes, summary, connected, lastTs, error };
}

// ── Convenience: single quote ─────────────────────────────────────────────────
export function useLiveQuote(sym: string): PsxQuote | null {
  const { quotes } = useLiveQuotes({ symbols: [sym] });
  return quotes[0] ?? null;
}

// ── Convenience: market summary only ─────────────────────────────────────────
export function useMarketSummary(): MarketSummary | null {
  const { summary } = useLiveQuotes({ pollingOnly: true, pollInterval: 15_000 });
  return summary;
}
