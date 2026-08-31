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

export default function WatchlistClient() {
  const tk = useDarkTokens();
  const [items, setItems] = useState<WatchItem[]>([]);
  const [query, setQuery] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [mounted, setMounted] = useState(false);
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

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: bg, padding: "24px 20px", color: text, fontFamily: "inherit" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: text, margin: 0 }}>
              My Watchlist
            </h1>
            <p style={{ fontSize: 13, color: muted, margin: "4px 0 0" }}>
              Track and monitor your favourite PSX stocks
            </p>
          </div>
          <div style={{ fontSize: 12, color: muted, background: card, border: `1px solid ${border}`, borderRadius: 8, padding: "6px 14px" }}>
            {new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>

        {/* Stats Strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Watched", value: items.length.toString(), icon: "👁", color: gold },
            { label: "Up Today", value: stats.up.toString(), icon: "▲", color: "#16a34a" },
            { label: "Down Today", value: stats.down.toString(), icon: "▼", color: "#dc2626" },
            { label: "Avg Change", value: (stats.avgChg >= 0 ? "+" : "") + stats.avgChg.toFixed(2) + "%", icon: "~", color: stats.avgChg >= 0 ? "#16a34a" : "#dc2626" },
            { label: "Total P&L", value: "PKR " + fmt(stats.totalPnl), icon: "₨", color: stats.totalPnl >= 0 ? "#16a34a" : "#dc2626" },
          ].map(stat => (
            <div key={stat.label} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: stat.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{stat.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: stat.color, marginTop: 2 }}>{stat.value}</div>
              </div>
            </div>
          ))}
          {/* Donut mini */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "10px 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <DonutStat up={stats.up} down={stats.down} total={items.length} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Portfolio Mix</div>
              <div style={{ fontSize: 11, color: "#16a34a", marginTop: 2 }}>▲ {stats.up} Up</div>
              <div style={{ fontSize: 11, color: "#dc2626" }}>▼ {stats.down} Down</div>
            </div>
          </div>
        </div>

        {/* Search + Add Bar */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 220, position: "relative" }} ref={dropRef}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: muted, fontSize: 16 }}>🔍</span>
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowDrop(true); }}
                  onFocus={() => setShowDrop(true)}
                  placeholder="Search symbol or company name..."
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "10px 12px 10px 38px",
                    border: `1.5px solid ${border}`, borderRadius: 10, fontSize: 14,
                    background: tk.dark ? "#07111F" : "#F8F6F1", color: text, outline: "none",
                  }}
                />
              </div>
              {showDrop && suggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
                  background: card, border: `1px solid ${border}`, borderRadius: 10,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.18)", marginTop: 4, maxHeight: 260, overflowY: "auto",
                }}>
                  {suggestions.map(s => (
                    <button key={s.symbol} onClick={() => addStock(s.symbol, s.name)} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "10px 14px", background: "none", border: "none",
                      borderBottom: `1px solid ${border}`, cursor: "pointer", textAlign: "left",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = tk.dark ? "rgba(255,255,255,0.04)" : "#f8fafc")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                      <div>
                        <span style={{ fontWeight: 700, color: gold, fontSize: 13 }}>{s.symbol}</span>
                        <span style={{ color: muted, fontSize: 12, marginLeft: 8 }}>{s.name}</span>
                      </div>
                      <span style={{ fontSize: 11, color: muted, background: tk.dark ? "rgba(255,255,255,0.06)" : "#F1F5F9", padding: "2px 8px", borderRadius: 6 }}>{s.sector}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Popular chips */}
          <div>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginRight: 10 }}>Quick Add:</span>
            <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {POPULAR_CHIPS.filter(sym => !items.some(i => i.symbol === sym)).slice(0, 14).map(sym => {
                const s = PSX_STOCKS.find(x => x.symbol === sym);
                return (
                  <button key={sym} onClick={() => addStock(sym, s?.name ?? sym)} style={{
                    padding: "4px 12px", borderRadius: 20, border: `1px solid ${border}`,
                    background: "none", color: text, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = gold + "20"; e.currentTarget.style.borderColor = gold; e.currentTarget.style.color = gold; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = border; e.currentTarget.style.color = text; }}>
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stock Cards Grid */}
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", background: card, borderRadius: 16, border: `1px solid ${border}` }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📋</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: text, margin: "0 0 8px" }}>Start building your watchlist</h3>
            <p style={{ color: muted, fontSize: 14, marginBottom: 24 }}>Search for stocks above or pick from popular stocks to begin tracking</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 600, margin: "0 auto" }}>
              {POPULAR_CHIPS.slice(0, 10).map(sym => {
                const s = PSX_STOCKS.find(x => x.symbol === sym);
                return (
                  <button key={sym} onClick={() => addStock(sym, s?.name ?? sym)} style={{
                    padding: "8px 16px", borderRadius: 20, border: `1.5px solid ${gold}40`,
                    background: gold + "10", color: gold, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}>
                    + {sym}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
            {items.map(item => {
              const q = getQuote(item.symbol);
              const pnl = q.close - item.addedPrice;
              const pnlPct = (pnl / item.addedPrice) * 100;
              const isUp = q.pct >= 0;
              const isShariah = SHARIAH_SYMBOLS.has(item.symbol);

              return (
                <div key={item.id} style={{
                  background: card, border: `1px solid ${border}`, borderRadius: 14,
                  padding: "16px", position: "relative", transition: "box-shadow 0.2s",
                  borderTop: `3px solid ${isUp ? "#16a34a" : "#dc2626"}`,
                }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.12)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>

                  {/* Remove button */}
                  <button onClick={() => removeStock(item.id)} style={{
                    position: "absolute", top: 10, right: 10, background: "none", border: "none",
                    cursor: "pointer", color: muted, fontSize: 16, lineHeight: 1, padding: "2px 4px",
                    borderRadius: 4, transition: "color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#dc2626")}
                  onMouseLeave={e => (e.currentTarget.style.color = muted)}
                  title="Remove from watchlist">✕</button>

                  {/* Symbol + Name */}
                  <Link href={`/data-portal/company/${item.symbol}`} style={{ textDecoration: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingRight: 24 }}>
                      <span style={{
                        background: navy, color: gold, fontWeight: 800, fontSize: 13,
                        padding: "3px 10px", borderRadius: 6, letterSpacing: "0.04em",
                      }}>{item.symbol}</span>
                      {isShariah && (
                        <span style={{ background: "#16a34a20", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10 }}>☪ SHARIAH</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: muted, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 24 }}>{item.name}</div>
                  </Link>

                  {/* Price Row */}
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: text, fontVariantNumeric: "tabular-nums" }}>
                        {fmt(q.close)}
                      </div>
                      <div style={{ fontSize: 12, color: isUp ? "#16a34a" : "#dc2626", fontWeight: 700, marginTop: 2 }}>
                        {isUp ? "▲" : "▼"} {fmt(Math.abs(q.change))} ({isUp ? "+" : ""}{q.pct.toFixed(2)}%)
                      </div>
                    </div>
                    <SparkLine pct={q.pct} />
                  </div>

                  {/* Sector badge + P&L from add price */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 600, padding: "3px 10px", borderRadius: 10,
                      background: tk.dark ? "rgba(255,255,255,0.06)" : "#F1F5F9", color: muted,
                    }}>{item.sector.replace("Commercial Banks", "Banks").replace("Oil & Gas Exploration", "Oil & Gas")}</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: muted }}>Since Added</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: pnl >= 0 ? "#16a34a" : "#dc2626" }}>
                        {pnl >= 0 ? "+" : ""}{fmt(pnl)} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)
                      </div>
                    </div>
                  </div>

                  {/* Vol */}
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${border}`, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10.5, color: muted }}>Volume</span>
                    <span style={{ fontSize: 10.5, color: text, fontWeight: 600 }}>{fmtVol(q.vol)}</span>
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
