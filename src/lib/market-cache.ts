/**
 * Browser-side singleton cache for market-summary.
 * All components share one in-flight request so the same data
 * is never fetched more than once per 55-second window.
 */
import type { MarketSummary } from "@/lib/market-data";

const TTL = 55_000;

let _data: MarketSummary | null = null;
let _ts   = 0;
let _inflight: Promise<MarketSummary> | null = null;

export async function fetchMarketSummary(): Promise<MarketSummary> {
  const now = Date.now();
  if (_data && now - _ts < TTL) return _data;
  if (_inflight) return _inflight;

  _inflight = fetch("/api/portal/market-summary")
    .then(r => r.json() as Promise<MarketSummary>)
    .then(d => {
      _data = d;
      _ts   = Date.now();
      _inflight = null;
      return d;
    })
    .catch(err => {
      _inflight = null;
      if (_data) return _data;
      throw err;
    });

  return _inflight;
}

export function getMarketCache(): MarketSummary | null { return _data; }
