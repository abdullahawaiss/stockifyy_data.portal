/**
 * PSX Live Data Fetcher — in-memory cache layer
 *
 * HOW TO CONNECT YOUR AUTHORIZED DATA SOURCE:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. If you have Capital Stake API credentials:
 *    Set PSX_API_URL and PSX_API_KEY in .env.local
 *    The fetchFromSource() function below calls that endpoint.
 *
 * 2. If you have a different provider (Twelve Data, METTIS, etc.):
 *    Replace the fetch call in fetchFromSource() with your authorized endpoint.
 *    Map the response to the PsxQuote interface.
 *
 * 3. No API yet?
 *    The module falls back to realistic demo data with simulated price movement
 *    so the UI stays fully functional during development.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Architecture:
 *   - Single background polling loop (runs in Node.js server process)
 *   - In-memory Map acts as the cache (< 1ms read latency)
 *   - SSE clients subscribe and receive push updates on each poll cycle
 *   - Next.js API routes read from the cache — never block on upstream calls
 */

export interface PsxQuote {
  sym:    string;
  name:   string;
  sector: string;
  price:  number;
  open:   number;
  high:   number;
  low:    number;
  prev:   number;
  chg:    number;   // % change vs prev close
  chgAmt: number;   // absolute change (price - prev)
  vol:    number;   // volume in thousands
  val:    number;   // value traded in millions PKR
  cap:    number;   // market cap in millions PKR
  shariah: boolean;
  kse100:  boolean;
  kse30:   boolean;
  kmi30:   boolean;
  ts:     number;   // unix ms of last tick
}

export interface MarketSummary {
  kse100Index:   number;
  kse100Chg:     number;
  kse100ChgPct:  number;
  kse30Index:    number;
  kse30ChgPct:   number;
  totalVolume:   number;  // all stocks, thousands
  totalValue:    number;  // millions PKR
  advances:      number;
  declines:      number;
  unchanged:     number;
  marketOpen:    boolean;
  lastUpdated:   number;  // unix ms
}

// ── In-memory store ──────────────────────────────────────────────────────────
const quoteMap  = new Map<string, PsxQuote>();
let   summary: MarketSummary | null = null;
let   listeners: Array<(quotes: PsxQuote[], sum: MarketSummary) => void> = [];
let   pollerStarted = false;

// ── Subscriber pattern for SSE ────────────────────────────────────────────────
export function subscribe(cb: (quotes: PsxQuote[], sum: MarketSummary) => void): () => void {
  listeners.push(cb);
  // Immediately emit current state to new subscriber
  if (quoteMap.size > 0 && summary) {
    cb(Array.from(quoteMap.values()), summary);
  }
  return () => { listeners = listeners.filter(l => l !== cb); };
}

function broadcast() {
  if (!summary || quoteMap.size === 0) return;
  const quotes = Array.from(quoteMap.values());
  listeners.forEach(l => { try { l(quotes, summary!); } catch {} });
}

// ── Market status ─────────────────────────────────────────────────────────────
function isMarketOpen(): boolean {
  const now = new Date();
  const pk = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const day = pk.getDay(); // 0=Sun, 6=Sat
  if (day === 0 || day === 6) return false;
  const h = pk.getHours(), m = pk.getMinutes();
  const mins = h * 60 + m;
  return mins >= 9 * 60 + 32 && mins < 15 * 60 + 30; // 9:32 – 15:30 PKT
}

// ── Fetch from your authorized API source ────────────────────────────────────
// Replace this function body with your licensed API call.
// Expected response shape: { quotes: PsxQuote[], summary: MarketSummary }
async function fetchFromSource(): Promise<{ quotes: PsxQuote[]; sum: MarketSummary } | null> {
  const apiUrl = process.env.PSX_API_URL;
  const apiKey = process.env.PSX_API_KEY;

  if (!apiUrl) return null; // No authorized source configured — use demo fallback

  try {
    const res = await fetch(apiUrl, {
      headers: {
        "Authorization": `Bearer ${apiKey ?? ""}`,
        "Accept": "application/json",
        "User-Agent": "Stockifyy-Portal/1.0",
      },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = await res.json();

    // ── Adapt the response to PsxQuote[] ──────────────────────────────────────
    // If your provider returns a different shape, map it here.
    // The example below handles a generic { data: [{symbol, lastPrice, change, ...}] } shape.
    const raw: Array<Record<string, unknown>> = data?.data ?? data?.quotes ?? [];
    const quotes: PsxQuote[] = raw.map((r, i) => ({
      sym:    String(r.symbol ?? r.sym ?? ""),
      name:   String(r.name ?? r.company ?? ""),
      sector: String(r.sector ?? ""),
      price:  Number(r.lastPrice ?? r.price ?? 0),
      open:   Number(r.open ?? 0),
      high:   Number(r.high ?? 0),
      low:    Number(r.low ?? 0),
      prev:   Number(r.prevClose ?? r.prev ?? 0),
      chg:    Number(r.changePercent ?? r.chgPct ?? 0),
      chgAmt: Number(r.change ?? r.chgAmt ?? 0),
      vol:    Number(r.volume ?? r.vol ?? 0),
      val:    Number(r.value ?? r.val ?? 0),
      cap:    Number(r.marketCap ?? r.cap ?? 0),
      shariah: Boolean(r.shariah ?? false),
      kse100:  Boolean(r.kse100 ?? false),
      kse30:   Boolean(r.kse30 ?? false),
      kmi30:   Boolean(r.kmi30 ?? false),
      ts:     Date.now() + i,
    })).filter(q => q.sym);

    const s = data?.summary ?? data?.index ?? {};
    const sum: MarketSummary = {
      kse100Index:  Number(s.kse100 ?? s.index ?? 0),
      kse100Chg:    Number(s.kse100Chg ?? 0),
      kse100ChgPct: Number(s.kse100ChgPct ?? 0),
      kse30Index:   Number(s.kse30 ?? 0),
      kse30ChgPct:  Number(s.kse30ChgPct ?? 0),
      totalVolume:  quotes.reduce((a, q) => a + q.vol, 0),
      totalValue:   quotes.reduce((a, q) => a + q.val, 0),
      advances:     quotes.filter(q => q.chg > 0).length,
      declines:     quotes.filter(q => q.chg < 0).length,
      unchanged:    quotes.filter(q => q.chg === 0).length,
      marketOpen:   isMarketOpen(),
      lastUpdated:  Date.now(),
    };

    return { quotes, sum };
  } catch {
    return null;
  }
}

// ── Demo fallback — simulates live tick movement ───────────────────────────────
// Uses the same STOCKS data as the existing heatmap to keep the demo identical.
// Prices drift ±0.3% per poll cycle when the market is "open".
import { STOCKS as DEMO_STOCKS } from "@/app/data-portal/heatmap/_data/stocks";

function buildDemoQuotes(): PsxQuote[] {
  return DEMO_STOCKS.map(s => ({
    sym:    s.sym,
    name:   s.name,
    sector: s.sector,
    price:  s.price,
    open:   s.price * (1 - s.chg / 100 / 2),
    high:   s.price * 1.012,
    low:    s.price * 0.988,
    prev:   +(s.price / (1 + s.chg / 100)).toFixed(2),
    chg:    s.chg,
    chgAmt: +(s.price - s.price / (1 + s.chg / 100)).toFixed(2),
    vol:    s.vol,
    val:    +(s.vol * s.price / 1000).toFixed(1),
    cap:    s.cap,
    shariah: s.shariah,
    kse100:  s.kse100,
    kse30:   s.kse30,
    kmi30:   s.kmi30,
    ts:     Date.now(),
  }));
}

function tickDemoQuotes() {
  const open = isMarketOpen();
  if (!open && quoteMap.size > 0) {
    // Market closed — no price movement, just update ts
    quoteMap.forEach((q, k) => quoteMap.set(k, { ...q, ts: Date.now() }));
    return;
  }

  quoteMap.forEach((q, k) => {
    const drift = (Math.random() - 0.498) * 0.006; // ±0.3% random walk
    const newPrice = Math.max(q.price * (1 + drift), 0.01);
    const chgAmt  = +(newPrice - q.prev).toFixed(2);
    const chg     = +((chgAmt / q.prev) * 100).toFixed(2);
    const newVol  = Math.max(0, q.vol + Math.floor((Math.random() - 0.4) * 500));
    quoteMap.set(k, {
      ...q, price: +newPrice.toFixed(2), chg, chgAmt,
      high: Math.max(q.high, newPrice),
      low:  Math.min(q.low,  newPrice),
      vol:  newVol,
      val:  +(newVol * newPrice / 1000).toFixed(1),
      ts:   Date.now(),
    });
  });
}

function buildSummary(): MarketSummary {
  const quotes = Array.from(quoteMap.values());
  const adv = quotes.filter(q => q.chg > 0).length;
  const dec = quotes.filter(q => q.chg < 0).length;
  const kse100s = quotes.filter(q => q.kse100);
  const indexLevel = 132_240 + (kse100s.reduce((s, q) => s + q.chg, 0) / (kse100s.length || 1)) * 200;
  const chgPct = kse100s.reduce((s, q) => s + q.chg, 0) / (kse100s.length || 1);
  return {
    kse100Index:  +indexLevel.toFixed(2),
    kse100Chg:    +chgPct.toFixed(2),
    kse100ChgPct: +chgPct.toFixed(2),
    kse30Index:   +(indexLevel * 0.72).toFixed(2),
    kse30ChgPct:  +chgPct.toFixed(2),
    totalVolume:  quotes.reduce((s, q) => s + q.vol, 0),
    totalValue:   +quotes.reduce((s, q) => s + q.val, 0).toFixed(1),
    advances:     adv,
    declines:     dec,
    unchanged:    quotes.length - adv - dec,
    marketOpen:   isMarketOpen(),
    lastUpdated:  Date.now(),
  };
}

// ── Poller ────────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = isMarketOpen() ? 5_000 : 60_000; // 5s open, 60s closed

async function poll() {
  const live = await fetchFromSource();

  if (live) {
    // Live source available — load it
    live.quotes.forEach(q => quoteMap.set(q.sym, q));
    summary = live.sum;
  } else {
    // Demo / no source — tick the simulated prices
    if (quoteMap.size === 0) {
      buildDemoQuotes().forEach(q => quoteMap.set(q.sym, q));
    } else {
      tickDemoQuotes();
    }
    summary = buildSummary();
  }

  broadcast();
}

// ── Singleton poller ─────────────────────────────────────────────────────────
export function startPoller() {
  if (pollerStarted) return;
  pollerStarted = true;

  poll(); // immediate first fetch
  setInterval(poll, POLL_INTERVAL_MS);
}

// ── Accessors (synchronous, <1ms) ─────────────────────────────────────────────
export function getAllQuotes(): PsxQuote[] {
  return Array.from(quoteMap.values());
}

export function getQuote(sym: string): PsxQuote | undefined {
  return quoteMap.get(sym.toUpperCase());
}

export function getSummary(): MarketSummary | null {
  return summary;
}

export function isReady(): boolean {
  return quoteMap.size > 0 && summary !== null;
}

// ── Legacy scraper-compat adapters ────────────────────────────────────────────
// These let older routes (market-data.ts, heatmap/route.ts, etc.) continue to
// work without any changes — they just read from the same in-memory cache.

export interface PsxLegacyRow {
  symbol:           string;
  companyName:      string;
  sectorName:       string;
  sectorId:         string | null;
  close:            string;
  priceChange:      string;
  percentageChange: string;
  volume:           string;
  marketValue:      string;
  open:             string;
  high:             string;
  low:              string;
  prevClose:        string;
  previousClose:    string;
  tradingDate:      string;
  numberOfTrades:   string;
  shariahStatus:    string | null;
  indexCodes:       string[];
}

export interface PsxLegacyIndex {
  code:   string;
  close:  number;
  change: number;
  pct:    number;
  vol:    number;
}

function quoteToPsxRow(q: PsxQuote): PsxLegacyRow {
  const today = new Date().toISOString().slice(0, 10);
  return {
    symbol:           q.sym,
    companyName:      q.name,
    sectorName:       q.sector,
    sectorId:         null,
    close:            String(q.price),
    priceChange:      String(q.chgAmt),
    percentageChange: String(q.chg),
    volume:           String(q.vol * 1000),
    marketValue:      String(q.cap * 1_000_000),
    open:             String(q.open),
    high:             String(q.high),
    low:              String(q.low),
    prevClose:        String(q.prev),
    previousClose:    String(q.prev),
    tradingDate:      today,
    numberOfTrades:   "0",
    shariahStatus:    q.kmi30 ? "Shariah Compliant" : null,
    indexCodes: [
      ...(q.kse100 ? ["KSE100"] : []),
      ...(q.kse30  ? ["KSE30"]  : []),
      ...(q.kmi30  ? ["KMIALL"] : []),
    ],
  };
}

export async function getPsxRows(): Promise<{ rows: PsxLegacyRow[]; sectors: string[] } | null> {
  if (!isReady()) await new Promise(r => setTimeout(r, 800));
  const quotes = getAllQuotes();
  if (!quotes.length) return null;
  const rows = quotes.map(quoteToPsxRow);
  const sectors = [...new Set(quotes.map(q => q.sector).filter(Boolean))];
  return { rows, sectors };
}

export async function getPsxRow(sym: string): Promise<PsxLegacyRow | null> {
  if (!isReady()) await new Promise(r => setTimeout(r, 800));
  const q = getQuote(sym.toUpperCase());
  return q ? quoteToPsxRow(q) : null;
}

export async function getPsxIndices(): Promise<PsxLegacyIndex[]> {
  if (!isReady()) await new Promise(r => setTimeout(r, 800));
  const sum = getSummary();
  if (!sum) return [];
  return [
    { code: "KSE100", close: sum.kse100Index,  change: sum.kse100Chg,    pct: sum.kse100ChgPct, vol: 0 },
    { code: "KSE30",  close: sum.kse30Index,   change: sum.kse30ChgPct,  pct: sum.kse30ChgPct,  vol: 0 },
  ];
}
