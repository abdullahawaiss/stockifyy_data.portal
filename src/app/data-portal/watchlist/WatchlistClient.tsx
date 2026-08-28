"use client";
import { useState, useEffect, useMemo } from "react";
import { PSX_STOCKS, searchPsxStocks } from "@/lib/psx-stocks-static";

interface WatchItem {
  id: string;
  symbol: string;
  name: string;
  addedPrice: number;
  addedAt: string;
}

interface LiveQuote {
  symbol: string;
  close: number;
  change: number;
  percentageChange: number;
  volume: number;
}

const POPULAR: { symbol: string; name: string }[] = [
  { symbol: "OGDC", name: "Oil & Gas Dev. Co. Limited" },
  { symbol: "PPL", name: "Pakistan Petroleum Limited" },
  { symbol: "HBL", name: "Habib Bank Limited" },
  { symbol: "UBL", name: "United Bank Limited" },
  { symbol: "MCB", name: "MCB Bank Limited" },
  { symbol: "MEBL", name: "Meezan Bank Limited" },
  { symbol: "ENGRO", name: "Engro Corporation Limited" },
  { symbol: "LUCK", name: "Lucky Cement Limited" },
  { symbol: "PSMC", name: "Pak Suzuki Motor Co. Ltd" },
  { symbol: "SYS", name: "Systems Limited" },
  { symbol: "TRG", name: "TRG Pakistan Limited" },
  { symbol: "PSO", name: "Pakistan State Oil Co. Ltd" },
  { symbol: "MARI", name: "Mari Petroleum Company Limited" },
  { symbol: "FFC", name: "Fauji Fertilizer Company Limited" },
  { symbol: "EFERT", name: "Engro Fertilizers Limited" },
  { symbol: "HUBC", name: "Hub Power Company Limited" },
  { symbol: "DGKC", name: "DG Khan Cement Company Limited" },
  { symbol: "BWCL", name: "Bestway Cement Limited" },
  { symbol: "NBP", name: "National Bank of Pakistan" },
  { symbol: "ABL", name: "Allied Bank Limited" },
  { symbol: "BAFL", name: "Bank Alfalah Limited" },
  { symbol: "INDU", name: "Indus Motor Company Limited" },
  { symbol: "NML", name: "Nishat Mills Limited" },
  { symbol: "ICI", name: "ICI Pakistan Limited" },
  { symbol: "SEARL", name: "The Searle Company Limited" },
  { symbol: "SNGP", name: "Sui Northern Gas Pipelines Ltd" },
  { symbol: "FCCL", name: "Fauji Cement Co. Limited" },
  { symbol: "MLCF", name: "Maple Leaf Cement Factory Limited" },
  { symbol: "PTC", name: "Pakistan Telecommunication Co. Ltd" },
  { symbol: "MUGHAL", name: "Mughal Iron & Steel Industries Ltd" },
];

const DEMO_PRICES: Record<string, { close: number; change: number; pct: number; vol: number; sector?: string }> = {
  OGDC:  { close: 181.50, change: -1.21, pct: -0.66, vol: 3_450_000, sector: "Oil & Gas" },
  PPL:   { close: 89.30,  change: -0.70, pct: -0.78, vol: 1_890_000, sector: "Oil & Gas" },
  HBL:   { close: 177.30, change: 1.80,  pct: 1.03,  vol: 2_100_000, sector: "Banks" },
  UBL:   { close: 232.40, change: 2.10,  pct: 0.91,  vol: 980_000,  sector: "Banks" },
  MCB:   { close: 225.60, change: -2.10, pct: -0.92, vol: 540_000,  sector: "Banks" },
  MEBL:  { close: 218.50, change: 1.80,  pct: 0.83,  vol: 760_000,  sector: "Banks" },
  ENGRO: { close: 285.40, change: 4.20,  pct: 1.49,  vol: 1_240_000, sector: "Fertilizer" },
  LUCK:  { close: 932.00, change: -8.50, pct: -0.90, vol: 318_000,  sector: "Cement" },
  PSMC:  { close: 830.00, change: 12.10, pct: 1.47,  vol: 42_000,   sector: "Auto" },
  SYS:   { close: 724.00, change: 9.10,  pct: 1.26,  vol: 320_000,  sector: "Technology" },
  TRG:   { close: 101.50, change: 1.50,  pct: 1.50,  vol: 1_900_000, sector: "Technology" },
  PSO:   { close: 341.60, change: -3.40, pct: -0.99, vol: 670_000,  sector: "Oil & Gas" },
  MARI:  { close: 2145.0, change: 22.50, pct: 1.06,  vol: 98_000,   sector: "Oil & Gas" },
  FFC:   { close: 139.30, change: -0.90, pct: -0.64, vol: 870_000,  sector: "Fertilizer" },
  EFERT: { close: 87.60,  change: 0.60,  pct: 0.69,  vol: 1_100_000, sector: "Fertilizer" },
  HUBC:  { close: 107.80, change: 0.80,  pct: 0.75,  vol: 2_300_000, sector: "Power" },
  DGKC:  { close: 97.80,  change: -0.80, pct: -0.81, vol: 440_000,  sector: "Cement" },
  BWCL:  { close: 312.00, change: 2.50,  pct: 0.81,  vol: 210_000,  sector: "Cement" },
  NBP:   { close: 43.20,  change: 0.30,  pct: 0.70,  vol: 5_200_000, sector: "Banks" },
  ABL:   { close: 136.70, change: 0.90,  pct: 0.66,  vol: 490_000,  sector: "Banks" },
  BAFL:  { close: 54.60,  change: 0.40,  pct: 0.74,  vol: 3_800_000, sector: "Banks" },
  INDU:  { close: 1702.0, change: 18.00, pct: 1.07,  vol: 65_000,   sector: "Auto" },
  NML:   { close: 138.00, change: 1.00,  pct: 0.73,  vol: 290_000,  sector: "Textile" },
  ICI:   { close: 832.00, change: 6.00,  pct: 0.73,  vol: 84_000,   sector: "Chemicals" },
  SEARL: { close: 228.00, change: 2.00,  pct: 0.88,  vol: 560_000,  sector: "Pharma" },
  SNGP:  { close: 28.10,  change: 0.40,  pct: 1.44,  vol: 7_200_000, sector: "Gas" },
  FCCL:  { close: 22.10,  change: 0.20,  pct: 0.91,  vol: 9_800_000, sector: "Cement" },
  MLCF:  { close: 40.80,  change: -0.40, pct: -0.97, vol: 3_400_000, sector: "Cement" },
  PTC:   { close: 18.80,  change: -0.20, pct: -1.05, vol: 4_100_000, sector: "Telecom" },
  MUGHAL:{ close: 78.50,  change: 0.70,  pct: 0.90,  vol: 1_300_000, sector: "Steel" },
};

const LS_KEY = "stockifyy_watchlist_v1";
type FilterTab = "All" | "Gaining" | "Losing" | "Neutral";
type ViewMode = "list" | "grid";

function loadWatchlist(): WatchItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveWatchlist(items: WatchItem[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
}
function fmtVol(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}
function fmtPrice(n: number) {
  return n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (sym: string, name: string, price: number) => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ symbol: string; name: string } | null>(null);
  const [price, setPrice] = useState("");
  const [apiResults, setApiResults] = useState<{ symbol: string; name: string }[]>([]);

  useEffect(() => {
    setApiResults([]);
    const url = query ? `/api/portal/companies?search=${encodeURIComponent(query)}&limit=500` : `/api/portal/companies?limit=2000`;
    const t = setTimeout(() => {
      fetch(url).then(r => r.json()).then(j => { const live = (j.data ?? []).map((c: { symbol: string; name: string }) => ({ symbol: c.symbol, name: c.name })); if (live.length > 0) setApiResults(live); }).catch(() => {});
    }, query ? 150 : 0);
    return () => clearTimeout(t);
  }, [query]);

  const staticList = query ? searchPsxStocks(query, 2000) : PSX_STOCKS;
  const base = staticList.map(s => ({ symbol: s.symbol, name: s.name }));
  const rawFiltered = apiResults.length > base.length ? apiResults : base;
  const seen = new Set<string>();
  const filtered = rawFiltered.filter(p => { if (seen.has(p.symbol)) return false; seen.add(p.symbol); return true; });

  function pick(p: { symbol: string; name: string }) {
    setSelected(p);
    const demo = DEMO_PRICES[p.symbol];
    setPrice(demo ? fmtPrice(demo.close) : "");
  }

  function submit() {
    if (!selected) return;
    const p = parseFloat(price.replace(/,/g, ""));
    if (!p || p <= 0) return;
    onAdd(selected.symbol, selected.name, p);
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--card-bg, #fff)", borderRadius: 12, padding: "28px 28px 24px", width: 420, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--navy, #0f172a)" }}>Add to Watchlist</div>
            <div style={{ fontSize: 12, color: "var(--text-muted, #64748b)", marginTop: 2 }}>Search PSX stocks to track</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "var(--text-muted, #64748b)" }}>✕</button>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted, #64748b)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Symbol / Company</label>
          <input value={query} onChange={e => { setQuery(e.target.value); setSelected(null); setApiResults([]); }} placeholder="e.g. OGDC, HBL, LUCK…" style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border, #e2e8f0)", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none", background: "var(--background, #f8fafc)" }} />
        </div>
        <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--border, #e2e8f0)", borderRadius: 8, marginBottom: 14 }}>
          {filtered.map(p => (
            <div key={p.symbol} onClick={() => pick(p)} style={{ padding: "9px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: selected?.symbol === p.symbol ? "rgba(212,175,55,0.10)" : "transparent", borderBottom: "1px solid var(--border, #e2e8f0)" }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#C8860A" }}>{p.symbol}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted, #64748b)", marginLeft: 8 }}>{p.name}</span>
              </div>
              {DEMO_PRICES[p.symbol] && <span style={{ fontSize: 12, fontWeight: 600, color: "var(--navy, #0f172a)" }}>{fmtPrice(DEMO_PRICES[p.symbol].close)}</span>}
            </div>
          ))}
        </div>
        {selected && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted, #64748b)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Added Price (Rs)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Enter your buy price" style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border, #e2e8f0)", borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none", background: "var(--background, #f8fafc)" }} />
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid var(--border, #e2e8f0)", background: "none", fontSize: 13, cursor: "pointer", color: "var(--navy, #0f172a)" }}>Cancel</button>
          <button onClick={submit} disabled={!selected || !price} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: selected && price ? "#C8860A" : "#e2e8f0", color: selected && price ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: 700, cursor: selected && price ? "pointer" : "default" }}>Add to Watchlist</button>
        </div>
      </div>
    </div>
  );
}

// Grid card for grid view
function WatchCard({ item, q, onRemove }: { item: WatchItem; q: LiveQuote | undefined; onRemove: () => void }) {
  const price = q?.close ?? item.addedPrice;
  const pct = q?.percentageChange ?? 0;
  const chg = q?.change ?? 0;
  const vol = q?.volume ?? 0;
  const up = pct > 0;
  const down = pct < 0;
  const clr = down ? "#dc2626" : up ? "#16a34a" : "var(--text-muted)";
  const priceDiff = price - item.addedPrice;
  const priceDiffPct = item.addedPrice > 0 ? (priceDiff / item.addedPrice) * 100 : 0;

  return (
    <div className="card" style={{ padding: "16px", position: "relative", transition: "box-shadow 150ms, transform 150ms" }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = ""; }}>
      <button onClick={onRemove} title="Remove" style={{ position: "absolute", top: 10, right: 10, border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14, lineHeight: 1, padding: "2px 5px", borderRadius: 4 }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#dc2626"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}>✕</button>
      <div style={{ fontWeight: 800, fontSize: 15, color: "#C8860A", marginBottom: 2 }}>{item.symbol}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--navy)", fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>{fmtPrice(price)}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        {pct !== 0 && <span style={{ fontSize: 12 }}>{up ? "▲" : "▼"}</span>}
        <span style={{ fontSize: 13, fontWeight: 700, color: clr, fontVariantNumeric: "tabular-nums" }}>{chg >= 0 ? "+" : ""}{fmtPrice(Math.abs(chg))} ({pct >= 0 ? "+" : ""}{pct.toFixed(2)}%)</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
        <span>Added: <span style={{ color: priceDiff >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{priceDiff >= 0 ? "+" : ""}{priceDiffPct.toFixed(2)}%</span></span>
        <span>Vol: {fmtVol(vol)}</span>
      </div>
    </div>
  );
}

export default function WatchlistClient() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [quotes, setQuotes] = useState<Record<string, LiveQuote>>({});
  const [filterTab, setFilterTab] = useState<FilterTab>("All");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    setItems(loadWatchlist());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const q: Record<string, LiveQuote> = {};
    for (const item of items) {
      const demo = DEMO_PRICES[item.symbol];
      if (demo) q[item.symbol] = { symbol: item.symbol, close: demo.close, change: demo.change, percentageChange: demo.pct, volume: demo.vol };
    }
    setQuotes(q);
    if (items.length === 0) return;
    const symbols = items.map(i => i.symbol);
    fetch(`/api/portal/daily?limit=100`).then(r => r.json()).then(json => {
      const liveMap: Record<string, LiveQuote> = { ...q };
      for (const row of (json.data ?? [])) {
        if (symbols.includes(row.symbol)) {
          liveMap[row.symbol] = { symbol: row.symbol, close: parseFloat(row.close), change: parseFloat(row.change ?? "0"), percentageChange: parseFloat(row.percentageChange), volume: parseFloat(row.volume) };
        }
      }
      setQuotes(liveMap);
    }).catch(() => {});
  }, [items, mounted]);

  function addStock(symbol: string, name: string, addedPrice: number) {
    if (items.find(i => i.symbol === symbol)) return;
    const next = [...items, { id: Date.now().toString(), symbol, name, addedPrice, addedAt: new Date().toISOString() }];
    setItems(next); saveWatchlist(next);
  }

  function removeStock(id: string) {
    const next = items.filter(i => i.id !== id);
    setItems(next); saveWatchlist(next);
  }

  // Counts for filter tabs
  const gaining = useMemo(() => items.filter(i => (quotes[i.symbol]?.percentageChange ?? 0) > 0), [items, quotes]);
  const losing  = useMemo(() => items.filter(i => (quotes[i.symbol]?.percentageChange ?? 0) < 0), [items, quotes]);
  const neutral = useMemo(() => items.filter(i => (quotes[i.symbol]?.percentageChange ?? 0) === 0), [items, quotes]);

  const filtered = useMemo(() => {
    if (filterTab === "Gaining") return gaining;
    if (filterTab === "Losing")  return losing;
    if (filterTab === "Neutral") return neutral;
    return items;
  }, [filterTab, items, gaining, losing, neutral]);

  const tabs: { id: FilterTab; label: string; count: number; color?: string }[] = [
    { id: "All",     label: "All",     count: items.length },
    { id: "Gaining", label: "Gaining", count: gaining.length, color: "#16a34a" },
    { id: "Losing",  label: "Losing",  count: losing.length,  color: "#dc2626" },
    { id: "Neutral", label: "Neutral", count: neutral.length },
  ];

  if (!mounted) return <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading watchlist…</div>;

  return (
    <div suppressHydrationWarning className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addStock} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}><span style={{ color: "var(--navy)" }}>Watch</span><span style={{ color: "#C8860A" }}>list</span></h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>Stocks you are tracking</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {items.length > 0 && (
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{items.length} symbol{items.length !== 1 ? "s" : ""}</span>
          )}
          {/* Grid / List toggle */}
          {items.length > 0 && (
            <div style={{ display: "flex", border: "1.5px solid var(--border)", borderRadius: 7, overflow: "hidden" }}>
              <button onClick={() => setViewMode("list")} title="List view" style={{ padding: "6px 10px", border: "none", cursor: "pointer", background: viewMode === "list" ? "#C8860A" : "var(--card-bg)", color: viewMode === "list" ? "#fff" : "var(--text-muted)", display: "flex", alignItems: "center" }}>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="0" y="2" width="16" height="2.5" rx="1"/><rect x="0" y="6.75" width="16" height="2.5" rx="1"/><rect x="0" y="11.5" width="16" height="2.5" rx="1"/></svg>
              </button>
              <button onClick={() => setViewMode("grid")} title="Grid view" style={{ padding: "6px 10px", border: "none", cursor: "pointer", background: viewMode === "grid" ? "#C8860A" : "var(--card-bg)", color: viewMode === "grid" ? "#fff" : "var(--text-muted)", display: "flex", alignItems: "center" }}>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="0" y="0" width="7" height="7" rx="1"/><rect x="9" y="0" width="7" height="7" rx="1"/><rect x="0" y="9" width="7" height="7" rx="1"/><rect x="9" y="9" width="7" height="7" rx="1"/></svg>
              </button>
            </div>
          )}
          <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "#C8860A", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Stock
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      {items.length > 0 && (
        <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: "2px solid var(--border)" }}>
          {tabs.map(tb => (
            <button key={tb.id} onClick={() => setFilterTab(tb.id)} style={{
              padding: "8px 16px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
              background: "transparent", marginBottom: -2,
              borderBottom: `2px solid ${filterTab === tb.id ? (tb.color ?? "#C8860A") : "transparent"}`,
              color: filterTab === tb.id ? (tb.color ?? "#C8860A") : "var(--text-muted)", transition: "all 150ms",
            }}>
              {tb.label}
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 12, background: filterTab === tb.id ? `${tb.color ?? "#C8860A"}18` : "rgba(0,0,0,0.05)", color: filterTab === tb.id ? (tb.color ?? "#C8860A") : "var(--text-muted)" }}>
                {tb.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 ? (
        <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👁️</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)", marginBottom: 6 }}>Your watchlist is empty</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Add stocks to monitor their prices and performance</div>
          <button onClick={() => setShowAdd(true)} style={{ padding: "10px 24px", background: "#C8860A", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Add your first stock</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No {filterTab.toLowerCase()} stocks in your watchlist</div>
        </div>
      ) : viewMode === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {filtered.map(item => <WatchCard key={item.id} item={item} q={quotes[item.symbol]} onRemove={() => removeStock(item.id)} />)}
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["SYMBOL","COMPANY","ADDED PRICE","PRICE","CHANGE","% CHG","VOLUME",""].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: h === "" ? "right" : "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const q = quotes[item.symbol];
                  const price = q?.close ?? item.addedPrice;
                  const chg = q?.change ?? 0;
                  const pct = q?.percentageChange ?? 0;
                  const vol = q?.volume ?? 0;
                  const up = pct >= 0;
                  const clr = pct === 0 ? "var(--text-muted)" : up ? "#16a34a" : "#dc2626";
                  return (
                    <tr key={item.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", transition: "background 150ms" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "13px 16px", fontWeight: 700, fontSize: 13, color: "#C8860A", whiteSpace: "nowrap" }}>{item.symbol}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--text)", whiteSpace: "nowrap" }}>{item.name}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{fmtPrice(item.addedPrice)}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: "var(--navy)", fontVariantNumeric: "tabular-nums" }}>{fmtPrice(price)}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: clr, fontVariantNumeric: "tabular-nums" }}>{chg >= 0 ? "+" : ""}{fmtPrice(Math.abs(chg))}</td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: clr, fontWeight: 600, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {pct !== 0 && <svg viewBox="0 0 16 16" width="12" height="12" fill={clr}>{up ? <path d="M8 3l5 7H3l5-7z"/> : <path d="M8 13L3 6h10l-5 7z"/>}</svg>}
                          {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{fmtVol(vol)}</td>
                      <td style={{ padding: "13px 16px", textAlign: "right" }}>
                        <button onClick={() => removeStock(item.id)} title="Remove from watchlist" style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px 6px", borderRadius: 4, fontSize: 15, lineHeight: 1 }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#dc2626"}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}>
                          🗑
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12, textAlign: "right" }}>
        Prices update live from PSX market data. Added Price is your reference price.
      </p>
    </div>
  );
}
