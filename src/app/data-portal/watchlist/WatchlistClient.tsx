"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { PSX_STOCKS, searchPsxStocks } from "@/lib/psx-stocks-static";
import { useDarkTokens } from "@/hooks/useDarkMode";

interface WatchItem {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  addedPrice: number;
  addedAt: string;
}

const SHARIAH_SYMBOLS = new Set([
  "MEBL","FABL","BAHL","AKBL","SNBL","JSBL","MCB","HUBC","EFERT","ENGRO",
  "LUCK","MLCF","FCCL","BWCL","DGKC","CHCC","MUGHAL","SYS","TRG","NETSOL",
  "MARI","OGDC","PPL","SNGP","SSGC","FFC","FFBL","FATIMA","NML","KTML",
  "SEARL","ABOT","GLAXO","HINOON","ILP","SITC","INDU","PSMC","HCAR",
]);

const DEMO_PRICES: Record<string, { close: number; change: number; pct: number; vol: number }> = {
  OGDC:  { close: 181.50, change: -1.21, pct: -0.66, vol: 3_450_000 },
  PPL:   { close: 89.30,  change: -0.70, pct: -0.78, vol: 1_890_000 },
  HBL:   { close: 177.30, change: 1.80,  pct: 1.03,  vol: 2_100_000 },
  UBL:   { close: 232.40, change: 2.10,  pct: 0.91,  vol: 980_000 },
  MCB:   { close: 225.60, change: -2.10, pct: -0.92, vol: 540_000 },
  MEBL:  { close: 218.50, change: 1.80,  pct: 0.83,  vol: 760_000 },
  ENGRO: { close: 285.40, change: 4.20,  pct: 1.49,  vol: 1_240_000 },
  LUCK:  { close: 932.00, change: -8.50, pct: -0.90, vol: 318_000 },
  PSMC:  { close: 830.00, change: 12.10, pct: 1.47,  vol: 42_000 },
  SYS:   { close: 724.00, change: 9.10,  pct: 1.26,  vol: 320_000 },
  TRG:   { close: 101.50, change: 1.50,  pct: 1.50,  vol: 1_900_000 },
  PSO:   { close: 341.60, change: -3.40, pct: -0.99, vol: 670_000 },
  MARI:  { close: 2145.0, change: 22.50, pct: 1.06,  vol: 98_000 },
  FFC:   { close: 139.30, change: -0.90, pct: -0.64, vol: 870_000 },
  EFERT: { close: 87.60,  change: 0.60,  pct: 0.69,  vol: 1_100_000 },
  HUBC:  { close: 107.80, change: 0.80,  pct: 0.75,  vol: 2_300_000 },
  DGKC:  { close: 97.80,  change: -0.80, pct: -0.81, vol: 440_000 },
  BWCL:  { close: 312.00, change: 2.50,  pct: 0.81,  vol: 210_000 },
  NBP:   { close: 43.20,  change: 0.30,  pct: 0.70,  vol: 5_200_000 },
  ABL:   { close: 136.70, change: 0.90,  pct: 0.66,  vol: 490_000 },
  BAFL:  { close: 54.60,  change: 0.40,  pct: 0.74,  vol: 3_800_000 },
  INDU:  { close: 1702.0, change: 18.00, pct: 1.07,  vol: 65_000 },
  NML:   { close: 138.00, change: 1.00,  pct: 0.73,  vol: 290_000 },
  ICI:   { close: 832.00, change: 6.00,  pct: 0.73,  vol: 84_000 },
  SEARL: { close: 228.00, change: 2.00,  pct: 0.88,  vol: 560_000 },
  SNGP:  { close: 28.10,  change: 0.40,  pct: 1.44,  vol: 7_200_000 },
  FCCL:  { close: 22.10,  change: 0.20,  pct: 0.91,  vol: 4_100_000 },
  MLCF:  { close: 40.80,  change: -0.40, pct: -0.97, vol: 2_800_000 },
  PTC:   { close: 18.80,  change: -0.20, pct: -1.05, vol: 6_500_000 },
  MUGHAL:{ close: 78.50,  change: 0.70,  pct: 0.90,  vol: 950_000 },
};

const POPULAR_CHIPS = [
  "OGDC","HBL","MEBL","ENGRO","LUCK","SYS","TRG","PSO","MARI","FFC",
  "EFERT","HUBC","MCB","UBL","INDU","PSMC","NBP","BWCL","BAFL","DGKC",
];

function getQuote(sym: string) {
  return DEMO_PRICES[sym] ?? { close: 100 + Math.random() * 50, change: 0, pct: 0, vol: 100_000 };
}

function getSector(sym: string): string {
  const s = PSX_STOCKS.find(x => x.symbol === sym);
  return s?.sector ?? "Other";
}

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtVol(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

// Generate a fake 7-point sparkline path inside a 100x32 viewBox
function sparklinePath(pct: number): string {
  const up = pct >= 0;
  const base = [32, 28, 25, 20, 18, 15, 10];
  const points = base.map((y, i) => {
    const noise = (Math.sin(i * 2.3 + (up ? 1 : -1)) * 6);
    const trend = up ? -(i * 2) : (i * 2);
    return { x: i * 16, y: Math.max(2, Math.min(30, y + noise + trend * 0.3)) };
  });
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
}

function SparkLine({ pct }: { pct: number }) {
  const path = useMemo(() => sparklinePath(pct), [pct]);
  const color = pct >= 0 ? "#16a34a" : "#dc2626";
  return (
    <svg viewBox="0 0 96 32" width={96} height={32} style={{ display: "block" }}>
      <path d={path} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path + " L96,32 L0,32 Z"} fill={color} opacity={0.08} />
    </svg>
  );
}

function DonutStat({ up, down, total }: { up: number; down: number; total: number }) {
  if (total === 0) return null;
  const r = 22, cx = 28, cy = 28, circ = 2 * Math.PI * r;
  const upFrac = up / total;
  const downFrac = down / total;
  const flatFrac = 1 - upFrac - downFrac;
  const upDash = circ * upFrac;
  const downDash = circ * downFrac;
  const flatDash = circ * flatFrac;
  return (
    <svg width={56} height={56} viewBox="0 0 56 56">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth={5} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#16a34a" strokeWidth={5}
        strokeDasharray={`${upDash} ${circ - upDash}`}
        strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#dc2626" strokeWidth={5}
        strokeDasharray={`${downDash} ${circ - downDash}`}
        strokeDashoffset={circ * (0.25 - upFrac)} strokeLinecap="round" />
      {flatFrac > 0.01 && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeWidth={5}
          strokeDasharray={`${flatDash} ${circ - flatDash}`}
          strokeDashoffset={circ * (0.25 - upFrac - downFrac)} strokeLinecap="round" />
      )}
    </svg>
  );
}

const LS_KEY = "stockifyy_watchlist";
function loadWatchlist(): WatchItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveWatchlist(items: WatchItem[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
}

// Stock icon component (consistent with stocks table)
const SYM_COLORS: [number,number,number][] = [
  [37,99,235],[5,150,105],[220,38,38],[124,58,237],[217,119,6],
  [14,165,233],[239,68,68],[16,185,129],[168,85,247],[245,158,11],
];
function symColor(sym: string): string {
  let h = 0; for (const c of sym) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [r,g,b] = SYM_COLORS[h % SYM_COLORS.length]; return `rgb(${r},${g},${b})`;
}
function WLStockIcon({ symbol, size = 32 }: { symbol: string; size?: number }) {
  const color = symColor(symbol);
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: color + "18", border: `1.5px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: size * 0.36, fontWeight: 800, color, letterSpacing: "-0.5px", fontFamily: "monospace" }}>{symbol.slice(0,2)}</span>
    </div>
  );
}

type ViewMode = "cards" | "list" | "sector";

export default function WatchlistClient() {
  const tk = useDarkTokens();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [query, setQuery] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); setItems(loadWatchlist()); }, []);
  useEffect(() => { if (mounted) saveWatchlist(items); }, [items, mounted]);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDrop(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return searchPsxStocks(query, 8).filter(s => !items.some(i => i.symbol === s.symbol));
  }, [query, items]);

  function addStock(symbol: string, name: string) {
    if (items.some(i => i.symbol === symbol)) return;
    const q = getQuote(symbol);
    const sector = getSector(symbol);
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      symbol, name, sector,
      addedPrice: q.close,
      addedAt: new Date().toISOString(),
    }]);
    setQuery(""); setShowDrop(false);
  }

  function removeStock(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const stats = useMemo(() => {
    let up = 0, down = 0, flat = 0, totalPnl = 0;
    items.forEach(item => {
      const q = getQuote(item.symbol);
      const pnl = q.close - item.addedPrice;
      totalPnl += pnl;
      if (q.pct > 0) up++;
      else if (q.pct < 0) down++;
      else flat++;
    });
    const avgChg = items.length
      ? items.reduce((a, i) => a + getQuote(i.symbol).pct, 0) / items.length
      : 0;
    return { up, down, flat, totalPnl, avgChg };
  }, [items]);

  const bg = tk.dark ? "#0E1F30" : "#F8F6F1";
  const card = tk.dark ? "#0A1825" : "#ffffff";
  const border = tk.dark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
  const text = tk.dark ? "#BDD0E8" : "#07111F";
  const muted = tk.dark ? "#5C8099" : "#718096";
  const navy = "#07111F";
  const gold = "#D4971A";

  // Group items by sector for sector view
  const sectorMap = useMemo(() => {
    const map = new Map<string, WatchItem[]>();
    items.forEach(item => {
      const s = item.sector || "Other";
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(item);
    });
    return map;
  }, [items]);

  if (!mounted) return null;

  // Sector icons
  const SECTOR_ICONS2: Record<string,string> = {
    "banks":"🏦","cement":"🏗","oil":"⛽","fertilizer":"🌾","tech":"💻","textile":"🧵",
    "power":"⚡","auto":"🚗","food":"🍽","insurance":"🛡","pharma":"💊","chemical":"⚗",
  };
  function getSectorIcon2(sector: string): string {
    const l = sector.toLowerCase();
    for (const [k, v] of Object.entries(SECTOR_ICONS2)) { if (l.includes(k)) return v; }
    return "🏢";
  }

  return (
    <div style={{ minHeight: "100vh", background: bg, padding: "24px 20px", color: text, fontFamily: "inherit" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              <span style={{ color: text }}>My </span><span style={{ color: "#D4971A" }}>Watchlist</span>
            </h1>
            <p style={{ fontSize: 12, color: muted, margin: "3px 0 0" }}>Track &amp; monitor favourite PSX stocks in real-time</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {/* View mode switcher */}
            <div style={{ display: "flex", background: card, border: `1px solid ${border}`, borderRadius: 10, padding: 3, gap: 2 }}>
              {(["cards","list","sector"] as ViewMode[]).map(vm => {
                const icons: Record<ViewMode, string> = { cards: "⊞", list: "☰", sector: "⊙" };
                const labels: Record<ViewMode, string> = { cards: "Cards", list: "List", sector: "Sector" };
                return (
                  <button key={vm} onClick={() => setViewMode(vm)} style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: viewMode === vm ? navy : "transparent", color: viewMode === vm ? gold : muted, transition: "all 0.15s" }}>
                    {icons[vm]} {labels[vm]}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: muted, background: card, border: `1px solid ${border}`, borderRadius: 8, padding: "6px 12px" }}>
              {new Date().toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" })}
            </div>
          </div>
        </div>

        {/* ── Stats Strip ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Watched", value: items.length.toString(), icon: "⊙", color: gold },
            { label: "Up Today", value: stats.up.toString(), icon: "▲", color: "#16a34a" },
            { label: "Down Today", value: stats.down.toString(), icon: "▼", color: "#dc2626" },
            { label: "Unchanged", value: stats.flat.toString(), icon: "─", color: muted },
            { label: "Avg Change", value: (stats.avgChg >= 0 ? "+" : "") + stats.avgChg.toFixed(2) + "%", icon: "~", color: stats.avgChg >= 0 ? "#16a34a" : "#dc2626" },
            { label: "Total P&L", value: "₨ " + (Math.abs(stats.totalPnl) >= 1e3 ? (stats.totalPnl/1e3).toFixed(1)+"K" : fmt(stats.totalPnl)), icon: "₨", color: stats.totalPnl >= 0 ? "#16a34a" : "#dc2626" },
          ].map(stat => (
            <div key={stat.label} style={{ background: card, border: `1px solid ${border}`, borderLeft: `3px solid ${stat.color}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{stat.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: stat.color, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* ── Search + Quick Add ── */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 18px", marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 220, position: "relative" }} ref={dropRef}>
              <input
                value={query}
                onChange={e => { setQuery(e.target.value); setShowDrop(true); }}
                onFocus={() => setShowDrop(true)}
                placeholder="🔍  Search symbol or company…"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 14px", border: `1.5px solid ${border}`, borderRadius: 9, fontSize: 13, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, outline: "none" }}
              />
              {showDrop && suggestions.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: card, border: `1px solid ${border}`, borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", marginTop: 4, maxHeight: 240, overflowY: "auto" }}>
                  {suggestions.map(s => (
                    <button key={s.symbol} onClick={() => addStock(s.symbol, s.name)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", background: "none", border: "none", borderBottom: `1px solid ${border}`, cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={e => (e.currentTarget.style.background = tk.dark ? "rgba(255,255,255,0.04)" : "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <WLStockIcon symbol={s.symbol} size={28} />
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 800, color: gold, fontSize: 12 }}>{s.symbol}</span>
                        <span style={{ color: muted, fontSize: 11, marginLeft: 8 }}>{s.name}</span>
                      </div>
                      <span style={{ fontSize: 10, color: muted, background: tk.dark ? "rgba(255,255,255,0.06)" : "#F1F5F9", padding: "2px 8px", borderRadius: 6 }}>{s.sector}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Quick Add:</span>
              {POPULAR_CHIPS.filter(sym => !items.some(i => i.symbol === sym)).slice(0, 12).map(sym => {
                const s = PSX_STOCKS.find(x => x.symbol === sym);
                const isSh = SHARIAH_SYMBOLS.has(sym);
                return (
                  <button key={sym} onClick={() => addStock(sym, s?.name ?? sym)} style={{ padding: "4px 10px", borderRadius: 16, border: `1px solid ${isSh ? "#16a34a40" : border}`, background: isSh ? "#16a34a0a" : "none", color: isSh ? "#16a34a" : text, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = gold + "20"; e.currentTarget.style.borderColor = gold; e.currentTarget.style.color = gold; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isSh ? "#16a34a0a" : "none"; e.currentTarget.style.borderColor = isSh ? "#16a34a40" : border; e.currentTarget.style.color = isSh ? "#16a34a" : text; }}>
                    {isSh ? "☾ " : "+ "}{sym}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Empty State ── */}
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 20px", background: card, borderRadius: 16, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: text, margin: "0 0 6px" }}>Start building your watchlist</h3>
            <p style={{ color: muted, fontSize: 13, marginBottom: 20 }}>Search above or click to add popular PSX stocks</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 560, margin: "0 auto" }}>
              {POPULAR_CHIPS.slice(0, 12).map(sym => {
                const s = PSX_STOCKS.find(x => x.symbol === sym);
                return (
                  <button key={sym} onClick={() => addStock(sym, s?.name ?? sym)} style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${gold}40`, background: gold + "10", color: gold, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    + {sym}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CARDS VIEW ── */}
        {items.length > 0 && viewMode === "cards" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
            {items.map(item => {
              const q = getQuote(item.symbol);
              const pnl = q.close - item.addedPrice;
              const pnlPct = (pnl / item.addedPrice) * 100;
              const isUp = q.pct >= 0;
              const isShariah = SHARIAH_SYMBOLS.has(item.symbol);
              const sIcon = getSectorIcon2(item.sector);
              return (
                <div key={item.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px", position: "relative", transition: "box-shadow 0.2s, transform 0.2s", borderTop: `3px solid ${isUp ? "#16a34a" : "#dc2626"}` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(0,0,0,0.14)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                  <button onClick={() => removeStock(item.id)} style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", cursor: "pointer", color: muted, fontSize: 14, padding: "2px 5px", borderRadius: 4 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")} onMouseLeave={e => (e.currentTarget.style.color = muted)}>✕</button>

                  <Link href={`/data-portal/company/${item.symbol}`} style={{ textDecoration: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingRight: 24 }}>
                      <WLStockIcon symbol={item.symbol} size={36} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontWeight: 900, fontSize: 14, color: navy, fontFamily: "monospace" }}>{item.symbol}</span>
                          {isShariah && <svg viewBox="0 0 14 14" width={11} height={11}><path d="M7,1.5 A5.5,5.5 0 1 0 7,12.5 A3.8,3.8 0 1 1 7,1.5 Z" fill="#16A34A"/><circle cx="10" cy="4.5" r="1.1" fill="#16A34A"/></svg>}
                        </div>
                        <div style={{ fontSize: 11, color: muted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: text, fontVariantNumeric: "tabular-nums" }}>{fmt(q.close)}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isUp ? "#16a34a" : "#dc2626", marginTop: 1 }}>
                          {isUp ? "▲" : "▼"} {fmt(Math.abs(q.change))} ({isUp ? "+" : ""}{q.pct.toFixed(2)}%)
                        </div>
                      </div>
                      <SparkLine pct={q.pct} />
                    </div>
                  </Link>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, paddingTop: 10, borderTop: `1px solid ${border}` }}>
                    <div>
                      <div style={{ fontSize: 9, color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sector</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: text, marginTop: 2 }}>{sIcon} {item.sector.replace("Commercial Banks","Banking").replace("Oil & Gas Exploration","Oil & Gas")}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Since Added</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: pnl >= 0 ? "#16a34a" : "#dc2626", marginTop: 2 }}>{pnl >= 0 ? "+" : ""}{fmt(pnl)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Volume</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: text, marginTop: 2 }}>{fmtVol(q.vol)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Add Price</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: text, marginTop: 2 }}>{fmt(item.addedPrice)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {items.length > 0 && viewMode === "list" && (
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: navy }}>
                    {["#","Stock","Sector","Price","Change","Change %","Volume","Add Price","P&L","Action"].map((h,i) => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: i > 2 ? "right" : "left", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap", color: "#94a3b8" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const q = getQuote(item.symbol);
                    const pnl = q.close - item.addedPrice;
                    const pnlPct = (pnl / item.addedPrice) * 100;
                    const isUp = q.pct >= 0;
                    const isShariah = SHARIAH_SYMBOLS.has(item.symbol);
                    const sIcon = getSectorIcon2(item.sector);
                    return (
                      <tr key={item.id} style={{ borderBottom: `1px solid ${border}`, background: idx % 2 === 0 ? card : (tk.dark ? "rgba(255,255,255,0.02)" : "#FAFAFA") }}
                      onMouseEnter={e => (e.currentTarget.style.background = tk.dark ? "rgba(212,151,26,0.05)" : "#FFFBEB")}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? card : (tk.dark ? "rgba(255,255,255,0.02)" : "#FAFAFA"))}>
                        <td style={{ padding: "10px 14px", color: muted, fontSize: 11 }}>{idx + 1}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <WLStockIcon symbol={item.symbol} size={30} />
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <Link href={`/data-portal/company/${item.symbol}`} style={{ fontWeight: 800, color: text, fontFamily: "monospace", fontSize: 12, textDecoration: "none" }}>{item.symbol}</Link>
                                {isShariah && <svg viewBox="0 0 14 14" width={11} height={11}><path d="M7,1.5 A5.5,5.5 0 1 0 7,12.5 A3.8,3.8 0 1 1 7,1.5 Z" fill="#16A34A"/><circle cx="10" cy="4.5" r="1.1" fill="#16A34A"/></svg>}
                              </div>
                              <div style={{ fontSize: 10, color: muted, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 11, color: muted }}>{sIcon} {item.sector.replace("Commercial Banks","Banking")}</span></td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: text, fontVariantNumeric: "tabular-nums" }}>{fmt(q.close)}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: isUp ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>{isUp ? "▲" : "▼"} {fmt(Math.abs(q.change))}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: isUp ? "#16a34a" : "#dc2626" }}>
                          <span style={{ background: isUp ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", padding: "2px 8px", borderRadius: 12 }}>{isUp ? "+" : ""}{q.pct.toFixed(2)}%</span>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: muted, fontVariantNumeric: "tabular-nums", fontSize: 11 }}>{fmtVol(q.vol)}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: muted, fontVariantNumeric: "tabular-nums" }}>{fmt(item.addedPrice)}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: pnl >= 0 ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>
                          {pnl >= 0 ? "+" : ""}{fmt(pnl)}<br/><span style={{ fontSize: 10, fontWeight: 600 }}>({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)</span>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right" }}>
                          <button onClick={() => removeStock(item.id)} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #dc2626", background: "none", color: "#dc2626", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SECTOR VIEW ── */}
        {items.length > 0 && viewMode === "sector" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[...sectorMap.entries()].map(([sector, sectorItems]) => {
              const sIcon = getSectorIcon2(sector);
              const up = sectorItems.filter(i => getQuote(i.symbol).pct >= 0).length;
              return (
                <div key={sector} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 18px", background: navy, gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{sIcon}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{sector}</span>
                      <span style={{ fontSize: 10, background: "rgba(255,255,255,0.1)", color: "#94a3b8", padding: "2px 8px", borderRadius: 10 }}>{sectorItems.length} stocks</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
                      <span style={{ color: "#86efac" }}>▲ {up} Up</span>
                      <span style={{ color: "#fca5a5" }}>▼ {sectorItems.length - up} Down</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 0 }}>
                    {sectorItems.map((item, i) => {
                      const q = getQuote(item.symbol);
                      const pnl = q.close - item.addedPrice;
                      const isUp = q.pct >= 0;
                      const isShariah = SHARIAH_SYMBOLS.has(item.symbol);
                      return (
                        <div key={item.id} style={{ padding: "14px 16px", borderBottom: `1px solid ${border}`, borderRight: (i + 1) % 4 !== 0 ? `1px solid ${border}` : "none", display: "flex", gap: 10, alignItems: "center" }}>
                          <WLStockIcon symbol={item.symbol} size={32} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                              <Link href={`/data-portal/company/${item.symbol}`} style={{ fontWeight: 800, fontSize: 12, color: text, fontFamily: "monospace", textDecoration: "none" }}>{item.symbol}</Link>
                              {isShariah && <svg viewBox="0 0 14 14" width={10} height={10}><path d="M7,1.5 A5.5,5.5 0 1 0 7,12.5 A3.8,3.8 0 1 1 7,1.5 Z" fill="#16A34A"/><circle cx="10" cy="4.5" r="1.1" fill="#16A34A"/></svg>}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: text, fontVariantNumeric: "tabular-nums" }}>{fmt(q.close)}</div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: isUp ? "#16a34a" : "#dc2626" }}>
                              {isUp ? "▲" : "▼"} {q.pct.toFixed(2)}%
                              {" · "}
                              <span style={{ color: pnl >= 0 ? "#16a34a" : "#dc2626" }}>P&L: {pnl >= 0 ? "+" : ""}{fmt(pnl)}</span>
                            </div>
                          </div>
                          <button onClick={() => removeStock(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: muted, fontSize: 13 }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")} onMouseLeave={e => (e.currentTarget.style.color = muted)}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
