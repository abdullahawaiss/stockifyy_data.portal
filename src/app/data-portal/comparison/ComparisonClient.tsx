"use client";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { searchPsxStocks, PSX_STOCKS } from "@/lib/psx-stocks-static";
import { useDarkTokens } from "@/hooks/useDarkMode";

/* ── Seeded RNG ──────────────────────────────────────────────── */
function seedRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

const PALETTE = ["#D4971A","#3b82f6","#22c55e","#f97316","#a78bfa","#ec4899","#14b8a6","#ef4444"];
const GOLD = "#D4971A", NAVY = "#07111F";

/* ── Data shape ──────────────────────────────────────────────── */
interface StockData {
  symbol: string; name: string; sector: string;
  price: number; changePct: number; change: number; positive: boolean;
  vol: number; pe: number; eps: number; high52: number; low52: number;
  mktCap: number; divYield: number; roe: number; beta: number; volatility: number;
  history: number[];      // 30 raw prices
  norm: number[];         // indexed to 100
}

function buildStock(symbol: string): StockData {
  const s = PSX_STOCKS.find(x => x.symbol === symbol);
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = seedRand(seed);
  const price = Math.round((30 + r() * 1200) * 100) / 100;
  const changePct = parseFloat(((r() - 0.48) * 10).toFixed(2));
  const change = parseFloat((price * changePct / 100).toFixed(2));
  const positive = changePct >= 0;
  const vol = Math.round(500000 + r() * 10000000);
  const pe = parseFloat((4 + r() * 30).toFixed(1));
  const eps = parseFloat((price / pe).toFixed(2));
  const high52 = parseFloat((price * (1.05 + r() * 0.45)).toFixed(2));
  const low52 = parseFloat((price * (0.50 + r() * 0.35)).toFixed(2));
  const mktCap = parseFloat((price * (10_000_000 + r() * 990_000_000)).toFixed(0));
  const divYield = parseFloat((r() * 8).toFixed(2));
  const roe = parseFloat((5 + r() * 35).toFixed(1));
  const beta = parseFloat((0.4 + r() * 1.8).toFixed(2));
  // build 30-day history
  const history: number[] = [price];
  for (let i = 1; i < 30; i++) history.unshift(Math.max(1, history[0] * (1 + (r() - 0.5) * 0.04)));
  // daily return std-dev = volatility
  const returns = history.slice(1).map((v, i) => (v - history[i]) / history[i] * 100);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const volatility = parseFloat(Math.sqrt(returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length).toFixed(2));
  const base = history[0];
  const norm = history.map(v => (v / base) * 100);
  return { symbol, name: s?.name ?? symbol, sector: s?.sector ?? "—", price, changePct, change, positive, vol, pe, eps, high52, low52, mktCap, divYield, roe, beta, volatility, history, norm };
}

/* ── Correlation (Pearson on daily returns) ──────────────────── */
function pearson(a: number[], b: number[]): number {
  const ra = a.slice(1).map((v, i) => (v - a[i]) / a[i]);
  const rb = b.slice(1).map((v, i) => (v - b[i]) / b[i]);
  const n = ra.length;
  const ma = ra.reduce((s, v) => s + v, 0) / n;
  const mb = rb.reduce((s, v) => s + v, 0) / n;
  const num = ra.reduce((s, v, i) => s + (v - ma) * (rb[i] - mb), 0);
  const da = Math.sqrt(ra.reduce((s, v) => s + (v - ma) ** 2, 0));
  const db = Math.sqrt(rb.reduce((s, v) => s + (v - mb) ** 2, 0));
  return da * db === 0 ? 0 : parseFloat((num / (da * db)).toFixed(2));
}

/* ── Interactive 30-day chart ────────────────────────────────── */
function OverlayChart({ stocks, colors }: { stocks: StockData[]; colors: string[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  // cursorX = exact SVG-space X (continuous, for smooth line)
  // day = snapped index for data lookup
  // svgX = viewBox-space x for crosshair, px/py = real pixel offsets for tooltip
  const [cursor, setCursor] = useState<{ svgX: number; day: number; px: number; py: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const W = 800, H = 220, PX = 48, PY = 16;

  const allNorm = stocks.flatMap(s => s.norm);
  const rawMin = Math.min(...allNorm), rawMax = Math.max(...allNorm);
  const pad = (rawMax - rawMin) * 0.08 || 2;
  const min = rawMin - pad, max = rawMax + pad, range = max - min;
  const days = stocks[0]?.norm.length ?? 30;

  const toX = useCallback((i: number) => PX + (i / (days - 1)) * (W - PX - 12), [days]);
  const toY = useCallback((v: number) => PY + (1 - (v - min) / range) * (H - PY - 24), [min, range]);

  const gridLines = useMemo(() => {
    const step = range > 20 ? 10 : range > 8 ? 4 : 2;
    const start = Math.ceil(min / step) * step;
    const lines: number[] = [];
    for (let v = start; v <= max; v += step) lines.push(v);
    return lines;
  }, [min, max, range]);

  // rAF-throttled mouse handler — tracks exact pixel + SVG-space position
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const evt = e.nativeEvent;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const svgRect = svgRef.current?.getBoundingClientRect();
      const wrapRect = wrapRef.current?.getBoundingClientRect();
      if (!svgRect || !wrapRect) return;
      // SVG viewBox coordinate for crosshair
      const rawX = ((evt.clientX - svgRect.left) / svgRect.width) * W;
      const svgX = Math.max(PX, Math.min(W - 12, rawX));
      const frac = (svgX - PX) / (W - PX - 12);
      const day = Math.max(0, Math.min(days - 1, Math.round(frac * (days - 1))));
      // Pixel position relative to wrapper div for tooltip placement
      const px = evt.clientX - wrapRect.left;
      const py = evt.clientY - wrapRect.top;
      setCursor({ svgX, day, px, py });
    });
  }, [days]);

  // Interpolate Y on the line at exact svgX (linear between surrounding day points)
  function interpY(norm: number[], svgX: number): number {
    const frac = (svgX - PX) / (W - PX - 12);
    const exact = frac * (days - 1);
    const lo = Math.max(0, Math.floor(exact));
    const hi = Math.min(days - 1, lo + 1);
    const t = exact - lo;
    return toY(norm[lo] + t * (norm[hi] - norm[lo]));
  }

  const paths = useMemo(() => stocks.map(s => ({
    line: s.norm.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" "),
    area: s.norm.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v)}`).join(" ")
      + ` L${toX(days - 1)},${toY(min)} L${toX(0)},${toY(min)} Z`,
  })), [stocks, toX, toY, days, min]);

  const baselineY = toY(100);

  return (
    <div ref={wrapRef} style={{ position: "relative", userSelect: "none" }}>
      <svg ref={svgRef} width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        style={{ display: "block", cursor: "crosshair", height: 220 }}
        onMouseMove={handleMouseMove} onMouseLeave={() => { cancelAnimationFrame(rafRef.current); setCursor(null); }}>
        <defs>
          {stocks.map((_, i) => (
            <linearGradient key={i} id={`ag${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[i]} stopOpacity="0.18" />
              <stop offset="100%" stopColor={colors[i]} stopOpacity="0" />
            </linearGradient>
          ))}
          <clipPath id="chartclip"><rect x={PX} y={0} width={W - PX - 12} height={H} /></clipPath>
        </defs>

        {/* Grid */}
        {gridLines.map(v => {
          const y = toY(v);
          return y > 0 && y < H ? (
            <g key={v}>
              <line x1={PX} y1={y} x2={W - 12} y2={y} stroke="var(--border)" strokeWidth={v === 100 ? 1.5 : 0.8} strokeDasharray={v === 100 ? "0" : "4 4"} />
              <text x={PX - 5} y={y + 3.5} fontSize="9" fill="var(--text-muted)" textAnchor="end">{v.toFixed(0)}</text>
            </g>
          ) : null;
        })}

        {/* Day labels */}
        {[0, 6, 13, 20, 29].map(d => (
          <text key={d} x={toX(d)} y={H - 4} fontSize="8.5" fill="var(--text-muted)" textAnchor="middle">D{d + 1}</text>
        ))}

        {/* Area fills */}
        <g clipPath="url(#chartclip)">
          {paths.map((p, i) => <path key={`a${i}`} d={p.area} fill={`url(#ag${i})`} />)}
        </g>

        {/* Lines */}
        <g clipPath="url(#chartclip)">
          {paths.map((p, i) => (
            <path key={`l${i}`} d={p.line} fill="none" stroke={colors[i]} strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </g>

        {/* Cursor crosshair — uses exact svgX so line is perfectly smooth */}
        {cursor && (
          <g>
            {/* Thin vertical line */}
            <line x1={cursor.svgX} y1={PY} x2={cursor.svgX} y2={H - 18}
              stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Dots follow the interpolated Y on each line */}
            {stocks.map((s, i) => {
              const cy = interpY(s.norm, cursor.svgX);
              return (
                <g key={i}>
                  <circle cx={cursor.svgX} cy={cy} r="5.5" fill={colors[i]} opacity="0.18" />
                  <circle cx={cursor.svgX} cy={cy} r="3.5" fill={colors[i]} stroke="var(--card-bg)" strokeWidth="1.5" />
                </g>
              );
            })}
          </g>
        )}

        {/* Baseline label */}
        {baselineY > PY && baselineY < H - 18 && (
          <text x={PX - 5} y={baselineY + 3.5} fontSize="9" fill="var(--text-muted)" textAnchor="end" fontWeight="700">100</text>
        )}
      </svg>

      {/* Glass tooltip — follows cursor, white light blur */}
      {cursor && (() => {
        // Flip left/right so tooltip never clips out of the chart area
        const TOOLTIP_W = 200;
        const goLeft = cursor.px > TOOLTIP_W + 40;
        const left = goLeft ? cursor.px - TOOLTIP_W - 16 : cursor.px + 16;
        const top = Math.max(0, cursor.py - 10);
        return (
        <div style={{
          position: "absolute",
          left, top,
          width: TOOLTIP_W,
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 12, padding: "10px 14px",
          pointerEvents: "none", zIndex: 30,
          boxShadow: "0 4px 20px rgba(0,0,0,0.14)",
          transition: "left 0.04s linear, top 0.04s linear",
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Day {cursor.day + 1}</div>
          {stocks.map((s, i) => {
            const idx = s.norm[cursor.day];
            const pct = (idx - 100).toFixed(2);
            const rawPx = s.history[cursor.day];
            return (
              <div key={s.symbol} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5, gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: colors[i], flexShrink: 0, boxShadow: `0 0 5px ${colors[i]}` }} />
                  <span style={{ fontSize: 11, fontWeight: 800, color: colors[i] }}>{s.symbol}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: "#0f172a", fontVariantNumeric: "tabular-nums" }}>₨{rawPx.toFixed(2)}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: parseFloat(pct) >= 0 ? "#16a34a" : "#dc2626", marginLeft: 6, fontVariantNumeric: "tabular-nums" }}>
                    {parseFloat(pct) >= 0 ? "+" : ""}{pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        );
      })()}
    </div>
  );
}

/* ── Circular Arc Gauge (per-stock) ──────────────────────────── */
function ArcGauge({ pct, color, symbol, label }: { pct: number; color: string; symbol: string; label: string }) {
  const R = 28, CX = 36, CY = 36, SW = 7;
  const MAX_PCT = 15; // ±15% range
  const clamp = Math.max(-MAX_PCT, Math.min(MAX_PCT, pct));
  const norm = (clamp + MAX_PCT) / (2 * MAX_PCT); // 0→1
  // Arc from 210° to 330° = 120° total (open at bottom)
  const startDeg = 210, totalDeg = 120;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcStart = toRad(startDeg);
  const arcEnd = toRad(startDeg + totalDeg);
  const fillEnd = toRad(startDeg + totalDeg * norm);
  const pt = (a: number) => ({ x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) });
  const s = pt(arcStart), e = pt(arcEnd), f = pt(fillEnd);
  const trackPath = `M${s.x},${s.y} A${R},${R} 0 ${totalDeg > 180 ? 1 : 0},1 ${e.x},${e.y}`;
  const fillPath = `M${s.x},${s.y} A${R},${R} 0 ${totalDeg * norm > 180 ? 1 : 0},1 ${f.x},${f.y}`;
  const fillColor = pct >= 0 ? "#4ade80" : "#f87171";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <svg width={72} height={52} viewBox={`0 0 ${CX * 2} ${CY * 2}`} style={{ overflow: "visible" }}>
        <path d={trackPath} fill="none" stroke="var(--border)" strokeWidth={SW} strokeLinecap="round" />
        {Math.abs(clamp) > 0.1 && <path d={fillPath} fill="none" stroke={fillColor} strokeWidth={SW} strokeLinecap="round" />}
        {/* Needle dot at fill end */}
        <circle cx={f.x} cy={f.y} r={3.5} fill={color} stroke="var(--card-bg)" strokeWidth={1.5} />
        {/* Center label */}
        <text x={CX} y={CY - 2} textAnchor="middle" fontSize="9" fontWeight="800" fill={color}>{symbol}</text>
        <text x={CX} y={CY + 8} textAnchor="middle" fontSize="8" fill={pct >= 0 ? "#4ade80" : "#f87171"} fontWeight="700">
          {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
        </text>
      </svg>
      <div style={{ fontSize: 8.5, color: "var(--text-muted)", textAlign: "center", maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
}

/* ── 52-Week Position Bar ────────────────────────────────────── */
function RangeBar({ low, high, current, color }: { low: number; high: number; current: number; color: string }) {
  const pct = high > low ? ((current - low) / (high - low)) * 100 : 50;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ position: "relative", height: 6, background: "var(--border)", borderRadius: 3, overflow: "visible" }}>
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, rgba(220,38,38,0.5), ${color})`, borderRadius: 3 }} />
        <div style={{ position: "absolute", left: `${pct}%`, top: -3, width: 12, height: 12, borderRadius: "50%", background: color, border: "2px solid var(--card-bg)", transform: "translateX(-50%)", boxShadow: `0 0 6px ${color}99` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "var(--text-muted)" }}>
        <span>₨{low.toFixed(0)}</span>
        <span style={{ fontWeight: 700, color, fontSize: 9.5 }}>{pct.toFixed(0)}%</span>
        <span>₨{high.toFixed(0)}</span>
      </div>
    </div>
  );
}

/* ── Strength Meter ──────────────────────────────────────────── */
function StrengthMeter({ score, color }: { score: number; color: string }) {
  // 0-100 composite score
  const label = score >= 70 ? "Strong Buy" : score >= 55 ? "Buy" : score >= 45 ? "Neutral" : score >= 30 ? "Sell" : "Weak";
  const labelColor = score >= 60 ? "#4ade80" : score >= 45 ? GOLD : "#f87171";
  return (
    <div>
      <div style={{ height: 8, background: "var(--border)", borderRadius: 4, overflow: "hidden", marginBottom: 4 }}>
        <div style={{ width: `${score}%`, height: "100%", background: `linear-gradient(90deg, #dc2626 0%, ${GOLD} 50%, #16a34a 100%)`, borderRadius: 4, transition: "width 0.5s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9.5, fontWeight: 800, color: labelColor }}>{label}</span>
        <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{score}/100</span>
      </div>
    </div>
  );
}

/* ── Correlation heatmap cell ────────────────────────────────── */
function CorrCell({ val, self }: { val: number; self: boolean }) {
  if (self) return <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 800, fontSize: 12, color: "var(--text-muted)", background: "var(--light-bg)" }}>—</td>;
  const abs = Math.abs(val);
  const bg = val > 0
    ? `rgba(34,197,94,${0.08 + abs * 0.45})`
    : `rgba(239,68,68,${0.08 + abs * 0.45})`;
  const fg = val > 0 ? "#4ade80" : "#f87171";
  return (
    <td style={{ padding: "8px 12px", textAlign: "center", background: bg, fontWeight: 700, fontSize: 12, color: fg, fontVariantNumeric: "tabular-nums" }}>
      {val.toFixed(2)}
    </td>
  );
}

/* ── Stock search ────────────────────────────────────────────── */
function StockSearch({ onAdd, existing }: { onAdd: (sym: string) => void; existing: string[] }) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  // Show top 12 of PSX_STOCKS when no query, or all matches when querying
  const results = useMemo(() => {
    if (q.length < 1) return focused ? PSX_STOCKS.slice(0, 20) : [];
    return searchPsxStocks(q, 999); // return all matches
  }, [q, focused]);

  return (
    <div style={{ position: "relative" }}>
      <input value={q} onChange={e => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="+ Search & add stock…"
        style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 12.5, outline: "none", width: 230 }} />
      {results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: 320, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, zIndex: 100, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", maxHeight: 320, overflowY: "auto" }}>
          {q.length < 1 && <div style={{ padding: "6px 14px", fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid var(--border)" }}>All PSX Stocks</div>}
          {results.map(r => (
            <div key={r.symbol}
              onMouseDown={() => { if (!existing.includes(r.symbol)) onAdd(r.symbol); setQ(""); setFocused(false); }}
              style={{ padding: "8px 14px", cursor: existing.includes(r.symbol) ? "not-allowed" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", opacity: existing.includes(r.symbol) ? 0.4 : 1 }}
              onMouseEnter={e => { if (!existing.includes(r.symbol)) (e.currentTarget as HTMLDivElement).style.background = "var(--light-bg)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>{r.symbol}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{r.name?.slice(0, 26)}</span>
              </div>
              <span style={{ fontSize: 9.5, color: "var(--text-muted)", flexShrink: 0 }}>{r.sector?.slice(0, 10)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Stat bar ────────────────────────────────────────────────── */
function StatBar({ values, colors, max }: { values: number[]; colors: string[]; max: number }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 22 }}>
      {values.map((v, i) => (
        <div key={i} style={{ width: 16, height: Math.max(3, (Math.abs(v) / (max || 1)) * 22), background: colors[i], borderRadius: "2px 2px 0 0", opacity: 0.9 }} title={`${v}`} />
      ))}
    </div>
  );
}

/* ── Volume Heatbar ──────────────────────────────────────────── */
function VolBar({ vol, maxVol, color }: { vol: number; maxVol: number; color: string }) {
  const pct = maxVol > 0 ? (vol / maxVol) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", minWidth: 40, textAlign: "right" }}>
        {vol >= 1e6 ? `${(vol / 1e6).toFixed(1)}M` : `${(vol / 1e3).toFixed(0)}K`}
      </span>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
const DEFAULT_STOCKS = ["ENGRO", "LUCK", "HBL", "PSO"];

export default function ComparisonClient() {
  useDarkTokens();
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_STOCKS);
  const stocks = useMemo(() => symbols.map(buildStock), [symbols]);
  const colors = symbols.map((_, i) => PALETTE[i % PALETTE.length]);

  const removeStock = (sym: string) => setSymbols(s => s.filter(x => x !== sym));
  const addStock = (sym: string) => { if (symbols.length < 8) setSymbols(s => [...s, sym]); };

  // Correlation matrix
  const corrMatrix = useMemo(() =>
    stocks.map(a => stocks.map(b => a.symbol === b.symbol ? 1 : pearson(a.history, b.history))),
    [stocks]);

  // Composite score 0-100
  function score(s: StockData): number {
    const divScore = Math.min(30, s.divYield * 4);
    const roeScore = Math.min(25, s.roe * 0.7);
    const peScore = s.pe < 10 ? 20 : s.pe < 20 ? 15 : s.pe < 35 ? 8 : 3;
    const momScore = s.changePct >= 0 ? Math.min(15, s.changePct * 2) : Math.max(0, 15 + s.changePct * 1.5);
    const volScore = Math.max(0, 10 - s.volatility * 1.5);
    return Math.round(divScore + roeScore + peScore + momScore + volScore);
  }

  const METRICS: { key: keyof StockData; label: string; fmt: (v: number) => string; higherIsBetter: boolean }[] = [
    { key: "price",     label: "Price (PKR)",    fmt: v => `₨${v.toFixed(2)}`,                          higherIsBetter: true  },
    { key: "changePct", label: "Change %",        fmt: v => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`,     higherIsBetter: true  },
    { key: "pe",        label: "P/E Ratio",       fmt: v => `${v.toFixed(1)}x`,                         higherIsBetter: false },
    { key: "eps",       label: "EPS (PKR)",       fmt: v => `₨${v.toFixed(2)}`,                         higherIsBetter: true  },
    { key: "divYield",  label: "Div Yield %",     fmt: v => `${v.toFixed(2)}%`,                         higherIsBetter: true  },
    { key: "roe",       label: "ROE %",           fmt: v => `${v.toFixed(1)}%`,                         higherIsBetter: true  },
    { key: "beta",      label: "Beta",            fmt: v => v.toFixed(2),                               higherIsBetter: false },
    { key: "volatility",label: "Volatility %",   fmt: v => `${v.toFixed(2)}%`,                         higherIsBetter: false },
    { key: "mktCap",    label: "Mkt Cap",         fmt: v => v >= 1e9 ? `${(v/1e9).toFixed(1)}B` : `${(v/1e6).toFixed(0)}M`, higherIsBetter: true },
    { key: "vol",       label: "Volume",          fmt: v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${(v/1e3).toFixed(0)}K`, higherIsBetter: true },
  ];

  const maxVol = Math.max(...stocks.map(s => s.vol));

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1440, margin: "0 auto" }}>

      {/* ── Header ──────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Analytics</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            <span style={{ color: "var(--text-primary)" }}>Stock </span><span style={{ color: GOLD }}>Comparison</span>
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>Compare up to 8 PSX stocks — live crosshair · arc gauges · correlation</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <StockSearch onAdd={addStock} existing={symbols} />
          {symbols.length >= 8 && <span style={{ fontSize: 11, color: "#dc2626" }}>Max 8 stocks</span>}
        </div>
      </div>

      {/* ── Stock chips ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {stocks.map((s, i) => (
          <div key={s.symbol} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px 6px 8px", borderRadius: 10, border: `1.5px solid ${colors[i]}40`, background: colors[i] + "0d" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[i], flexShrink: 0, boxShadow: `0 0 6px ${colors[i]}` }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: colors[i] }}>{s.symbol}</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{s.name?.slice(0, 14)}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: s.positive ? "#4ade80" : "#f87171", fontVariantNumeric: "tabular-nums" }}>
              {s.positive ? "▲" : "▼"}{Math.abs(s.changePct).toFixed(2)}%
            </span>
            <button onClick={() => removeStock(s.symbol)}
              style={{ width: 16, height: 16, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.08)", color: "var(--text-muted)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>×</button>
          </div>
        ))}
      </div>

      {stocks.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 14 }}>Add stocks above to start comparing</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── 30-Day Chart + Arc Gauges ─────────────────── */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            {/* Chart header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px 10px", flexWrap: "wrap", gap: 10 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>30-Day Performance</span>
                <span style={{ fontSize: 10.5, color: "var(--text-muted)", marginLeft: 8 }}>Indexed to 100 · hover to inspect</span>
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {stocks.map((s, i) => (
                  <div key={s.symbol} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 22, height: 2.5, background: colors[i], borderRadius: 1, display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: colors[i], fontWeight: 800 }}>{s.symbol}</span>
                    <span style={{ fontSize: 10, color: s.norm[s.norm.length - 1] >= 100 ? "#4ade80" : "#f87171", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                      {(s.norm[s.norm.length - 1] - 100).toFixed(1) > "0" ? "+" : ""}{(s.norm[s.norm.length - 1] - 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "0 20px" }}>
              <OverlayChart stocks={stocks} colors={colors} />
            </div>

            {/* Arc gauges strip below chart */}
            <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", padding: "12px 20px 18px", borderTop: "1px solid var(--border)", background: "var(--light-bg,rgba(0,0,0,0.02))" }}>
              {stocks.map((s, i) => (
                <ArcGauge key={s.symbol} pct={s.norm[s.norm.length - 1] - 100} color={colors[i]} symbol={s.symbol} label={s.sector?.slice(0, 10) ?? ""} />
              ))}
            </div>
          </div>

          {/* ── Stock cards row ───────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stocks.length, 4)}, 1fr)`, gap: 10 }}>
            {stocks.map((s, i) => {
              const sc = score(s);
              return (
                <div key={s.symbol} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderTop: `3px solid ${colors[i]}`, borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: colors[i] }}>{s.symbol}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{s.name?.slice(0, 22)}</div>
                      <div style={{ fontSize: 9.5, color: "var(--text-muted)" }}>{s.sector}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>₨{s.price.toFixed(2)}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.positive ? "#4ade80" : "#f87171", fontVariantNumeric: "tabular-nums" }}>
                        {s.positive ? "+" : ""}{s.changePct.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* 52W bar */}
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>52-Week Range</div>
                    <RangeBar low={s.low52} high={s.high52} current={s.price} color={colors[i]} />
                  </div>

                  {/* Strength score */}
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Signal Strength</div>
                    <StrengthMeter score={sc} color={colors[i]} />
                  </div>

                  {/* Key stats grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                    {[["P/E", `${s.pe}x`], ["Div%", `${s.divYield.toFixed(1)}%`], ["ROE", `${s.roe.toFixed(0)}%`], ["Beta", s.beta.toFixed(2)], ["Vol", `${s.volatility.toFixed(1)}%`], ["EPS", `₨${s.eps.toFixed(0)}`]].map(([k, v]) => (
                      <div key={k} style={{ background: "var(--light-bg,rgba(0,0,0,0.03))", borderRadius: 6, padding: "5px 6px", textAlign: "center" }}>
                        <div style={{ fontSize: 8.5, color: "var(--text-muted)", fontWeight: 600 }}>{k}</div>
                        <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Volume bar */}
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Volume</div>
                    <VolBar vol={s.vol} maxVol={maxVol} color={colors[i]} />
                  </div>

                  <Link href={`/data-portal/company/${s.symbol}`} style={{ display: "block", textAlign: "center", padding: "6px 0", borderRadius: 7, border: `1px solid ${colors[i]}40`, color: colors[i], fontSize: 11, textDecoration: "none", fontWeight: 800 }}>
                    View Full Profile →
                  </Link>
                </div>
              );
            })}
          </div>

          {/* ── Detailed comparison table ─────────────────── */}
          <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Detailed Comparison</span>
              <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>★ = best in category</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                <thead>
                  <tr style={{ background: "var(--light-bg)" }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "var(--text-muted)", textTransform: "uppercase", minWidth: 130 }}>Metric</th>
                    {stocks.map((s, i) => (
                      <th key={s.symbol} style={{ padding: "10px 16px", textAlign: "right", fontSize: 11.5, fontWeight: 800, color: colors[i] }}>{s.symbol}</th>
                    ))}
                    <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map(m => {
                    const values = stocks.map(s => s[m.key] as number);
                    const best = m.higherIsBetter ? Math.max(...values) : Math.min(...values);
                    const maxVal = Math.max(...values.map(Math.abs));
                    return (
                      <tr key={m.key} style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "var(--light-bg)"}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                      >
                        <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{m.label}</td>
                        {values.map((v, i) => (
                          <td key={i} style={{ padding: "10px 16px", textAlign: "right", fontSize: 13, fontWeight: v === best ? 900 : 600, fontVariantNumeric: "tabular-nums",
                            color: v === best ? colors[i] : "var(--text-primary)" }}>
                            {v === best && <span style={{ fontSize: 8, marginRight: 3 }}>★</span>}
                            {m.fmt(v)}
                          </td>
                        ))}
                        <td style={{ padding: "10px 16px", textAlign: "center", display: "table-cell", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", justifyContent: "center" }}>
                            <StatBar values={values} colors={colors} max={maxVal} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Correlation matrix ────────────────────────── */}
          {stocks.length >= 2 && (
            <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>30-Day Return Correlation</span>
                <span style={{ fontSize: 10.5, color: "var(--text-muted)", marginLeft: 8 }}>Green = move together · Red = move opposite</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", minWidth: 300 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "8px 12px", fontSize: 10, color: "var(--text-muted)", textAlign: "center" }}></th>
                      {stocks.map((s, i) => (
                        <th key={s.symbol} style={{ padding: "8px 12px", fontSize: 11.5, fontWeight: 800, color: colors[i], textAlign: "center" }}>{s.symbol}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map((row, ri) => (
                      <tr key={row.symbol}>
                        <td style={{ padding: "8px 12px", fontSize: 11.5, fontWeight: 800, color: colors[ri], whiteSpace: "nowrap" }}>{row.symbol}</td>
                        {corrMatrix[ri].map((val, ci) => (
                          <CorrCell key={ci} val={val} self={ri === ci} />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Signal & P&L summary ─────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stocks.length, 4)}, 1fr)`, gap: 10 }}>
            {stocks.map((s, i) => {
              const sc = score(s);
              const scoreLabel = sc >= 70 ? "Strong Buy" : sc >= 55 ? "Buy" : sc >= 45 ? "Neutral" : sc >= 30 ? "Sell" : "Weak";
              const scoreColor = sc >= 60 ? "#4ade80" : sc >= 45 ? GOLD : "#f87171";
              return (
                <div key={s.symbol} style={{ background: "var(--card-bg)", border: `1px solid ${s.positive ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`, borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: colors[i] }}>{s.symbol}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: scoreColor, background: scoreColor + "18", padding: "3px 8px", borderRadius: 6, border: `1px solid ${scoreColor}30` }}>{scoreLabel}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: s.positive ? "#4ade80" : "#f87171", fontVariantNumeric: "tabular-nums", marginBottom: 2 }}>
                    {s.positive ? "+" : ""}{s.changePct.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginBottom: 10 }}>
                    ₨{s.price.toFixed(2)} · Vol: {s.vol >= 1e6 ? `${(s.vol / 1e6).toFixed(1)}M` : `${(s.vol / 1e3).toFixed(0)}K`}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 7, padding: "6px 10px" }}>
                      <div style={{ fontSize: 8.5, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Beta</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#f87171" }}>{s.beta.toFixed(2)}</div>
                    </div>
                    <div style={{ background: "rgba(212,151,26,0.08)", border: "1px solid rgba(212,151,26,0.2)", borderRadius: 7, padding: "6px 10px" }}>
                      <div style={{ fontSize: 8.5, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Div Yield</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>{s.divYield.toFixed(1)}%</div>
                    </div>
                    <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 7, padding: "6px 10px" }}>
                      <div style={{ fontSize: 8.5, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>ROE</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>{s.roe.toFixed(0)}%</div>
                    </div>
                    <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 7, padding: "6px 10px" }}>
                      <div style={{ fontSize: 8.5, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Mkt Cap</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#3b82f6" }}>{s.mktCap >= 1e9 ? `${(s.mktCap / 1e9).toFixed(0)}B` : `${(s.mktCap / 1e6).toFixed(0)}M`}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
