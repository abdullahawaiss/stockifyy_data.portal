/**
 * Browser-side singleton cache for portal REST API calls.
 * Each key maps to its own TTL + in-flight deduplication slot.
 * Pattern mirrors market-cache.ts — one fetch per endpoint per TTL window,
 * all concurrent callers share the same promise.
 */

interface Slot<T> {
  data: T | null;
  ts: number;
  inflight: Promise<T> | null;
}

const TTL_DEFAULT = 5 * 60_000;  // 5 min for stock/sector data
const TTL_SHORT   = 60_000;       // 1 min for frequently-changing data

const _slots = new Map<string, Slot<unknown>>();

function slot<T>(key: string): Slot<T> {
  if (!_slots.has(key)) _slots.set(key, { data: null, ts: 0, inflight: null });
  return _slots.get(key) as Slot<T>;
}

export async function cachedFetch<T>(
  url: string,
  ttl = TTL_DEFAULT,
): Promise<T> {
  const s = slot<T>(url);
  const now = Date.now();

  if (s.data && now - s.ts < ttl) return s.data;
  if (s.inflight) return s.inflight;

  s.inflight = fetch(url)
    .then(r => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json() as Promise<T>;
    })
    .then(d => {
      s.data = d;
      s.ts = Date.now();
      s.inflight = null;
      return d;
    })
    .catch(err => {
      s.inflight = null;
      if (s.data) return s.data;       // return stale on error
      throw err;
    });

  return s.inflight;
}

/** Pre-warm a URL in the background so subsequent navigation is instant. */
export function prefetch(url: string, ttl = TTL_DEFAULT): void {
  const s = slot<unknown>(url);
  const now = Date.now();
  if ((s.data && now - s.ts < ttl) || s.inflight) return;
  cachedFetch(url, ttl).catch(() => {});
}

export { TTL_DEFAULT, TTL_SHORT };
