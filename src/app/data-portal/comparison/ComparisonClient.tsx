"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { searchPsxStocks, PSX_STOCKS } from "@/lib/psx-stocks-static";
import { useDarkTokens } from "@/hooks/useDarkMode";

// ── Deterministic demo data ───────────────────────────────────
function seedRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

const PALETTE = ["#D4971A","#3b82f6","#22c55e","#f97316","#a78bfa","#ec4899","#14b8a6","#f59e0b"];
const GOLD = "#D4971A", NAVY = "#07111F";

interface StockData {
  symbol: string; name: string; sector: string;
  price: number; changePct: number; change: number; positive: boolean;
  vol: number; pe: number; eps: number; high52: number; low52: number;
  mktCap: number; divYield: number; roe: number;
  sparkline: number[]; history: number[];
}

function buildStock(symbol: string): StockData {
  const s = PSX_STOCKS.find(x => x.symbol === symbol);
  const r = seedRand(symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  const price = Math.round((30 + r() * 1200) * 100) / 100;
  const changePct = parseFloat(((r() - 0.48) * 10).toFixed(2));
  const change = parseFloat((price * changePct / 100).toFixed(2));
  const positive = changePct >= 0;
  const vol = Math.round(500000 + r() * 10000000);
  const pe = parseFloat((4 + r() * 30).toFixed(1));
  const eps = parseFloat((price / pe).toFixed(2));
  const high52 = parseFloat((price * (1 + r() * 0.5)).toFixed(2));
  const low52 = parseFloat((price * (0.5 + r() * 0.4)).toFixed(2));
  const mktCap = parseFloat((price * (10000000 + r() * 990000000)).toFixed(0));
  const divYield = parseFloat((r() * 8).toFixed(2));
  const roe = parseFloat((5 + r() * 35).toFixed(1));
  const history: number[] = [price];
  for (let i = 1; i < 30; i++) history.unshift(Math.max(1, history[0] * (1 + (r() - 0.5) * 0.04)));
  const sparkline = history.slice(-20);
  return { symbol, name: s?.name ?? symbol, sector: s?.sector ?? "—", price, changePct, change, positive, vol, pe, eps, high52, low52, mktCap, divYield, roe, sparkline, history };
}

// ── Sparkline SVG ─────────────────────────────────────────────
function SparkSVG({ pts, color, width = 120, height = 40 }: { pts: number[]; color: string; width?: number; height?: number }) {
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * width);
  const ys = pts.map(v => height - ((v - min) / range) * (height - 6) - 3);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const fill = `${d} L${width},${height} L0,${height} Z`;
  const gid = `cg${color.replace("#", "")}`;
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1]} cy={ys[ys.length - 1]} r="3" fill={color} />
    </svg>
  );
}

// ── Overlapping chart (normalized to base 100) ────────────────
function OverlayChart({ stocks, colors, width = 600, height = 200 }: { stocks: StockData[]; colors: string[]; width?: number; height?: number }) {
  if (stocks.length === 0) return null;
  const normalized = stocks.map(s => { const base = s.history[0]; return s.history.map(v => (v / base) * 100); });
  const allVals = normalized.flat();
  const min = Math.min(...allVals) - 1, max = Math.max(...allVals) + 1, range = max - min || 1;
  const toX = (i: number) => (i / (stocks[0].history.length - 1)) * width;
  const toY = (v: number) => height - ((v - min) / range) * (height - 20) - 10;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>{stocks.map((_, i) => (
        <linearGradient key={i} id={`ocg${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors[i]} stopOpacity="0.15" />
          <stop offset="100%" stopColor={colors[i]} stopOpacity="0" />
        </linearGradient>
      ))}</defs>
      {[95, 100, 105].map(v => {
        const y = toY(v);
        return y > 0 && y < height ? (
          <g key={v}>
            <line x1={0} y1={y} x2={width} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={4} y={y - 3} fontSize="9" fill="var(--text-muted)">{v}%</text>
          </g>
        ) : null;
      })}
      <line x1={0} y1={toY(100)} x2={width} y2={toY(100)} stroke="var(--border)" strokeWidth="1.5" />
      {normalized.map((pts, i) => {
        const d = pts.map((v, j) => `${j === 0 ? "M" : "L"}${toX(j)},${toY(v)}`).join(" ");
        const fillD = `${d} L${toX(pts.length - 1)},${height} L0,${height} Z`;
        return (
          <g key={i}>
            <path d={fillD} fill={`url(#ocg${i})`} />
            <path d={d} fill="none" stroke={colors[i]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </svg>
  );
}

// ── Stat bar ──────────────────────────────────────────────────
function StatBar({ values, colors, max }: { values: number[]; colors: string[]; max: number }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 20 }}>
      {values.map((v, i) => (
        <div key={i} style={{ width: 18, height: Math.max(3, (Math.abs(v) / (max || 1)) * 20), background: colors[i], borderRadius: "2px 2px 0 0" }} title={`${v}`} />
      ))}
    </div>
  );
}

// ── Stock search ──────────────────────────────────────────────
function StockSearch({ onAdd, existing }: { onAdd: (sym: string) => void; existing: string[] }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => q.length >= 1 ? searchPsxStocks(q, 8) : [], [q]);
  return (
    <div style={{ position: "relative" }}>
      <input value={q} onChange={e => setQ(e.target.value)}
        placeholder="+ Add stock (symbol or name)…"
        style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 12.5, outline: "none", width: 240 }} />
      {results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, width: 300, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 10, zIndex: 100, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
          {results.map(r => (
            <div key={r.symbol}
              onClick={() => { if (!existing.includes(r.symbol)) onAdd(r.symbol); setQ(""); }}
              style={{ padding: "9px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", opacity: existing.includes(r.symbol) ? 0.4 : 1 }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--light-bg)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
            >
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>{r.symbol}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{r.name?.slice(0, 28)}</span>
              </div>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{r.sector?.slice(0, 10)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
const DEFAULT_STOCKS = ["ENGRO", "LUCK", "HBL", "PSO"];

export default function ComparisonClient() {
  useDarkTokens(); // ensure CSS variables are loaded
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_STOCKS);
  const stocks = useMemo(() => symbols.map(buildStock), [symbols]);
  const colors = symbols.map((_, i) => PALETTE[i % PALETTE.length]);

  const removeStock = (sym: string) => setSymbols(s => s.filter(x => x !== sym));
  const addStock = (sym: string) => { if (symbols.length < 8) setSymbols(s => [...s, sym]); };

  const METRICS: { key: keyof StockData; label: string; fmt: (v: number) => string; higherIsBetter: boolean }[] = [
    { key: "price",    label: "Price (PKR)",   fmt: v => v.toFixed(2),                       higherIsBetter: true },
    { key: "changePct",label: "Change %",       fmt: v => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`, higherIsBetter: true },
    { key: "pe",       label: "P/E Ratio",      fmt: v => `${v.toFixed(1)}x`,                higherIsBetter: false },
    { key: "eps",      label: "EPS (PKR)",      fmt: v => v.toFixed(2),                       higherIsBetter: true },
    { key: "high52",   label: "52W High",       fmt: v => v.toFixed(2),                       higherIsBetter: true },
    { key: "low52",    label: "52W Low",        fmt: v => v.toFixed(2),                       higherIsBetter: false },
    { key: "divYield", label: "Div Yield %",    fmt: v => `${v.toFixed(2)}%`,                higherIsBetter: true },
    { key: "roe",      label: "ROE %",          fmt: v => `${v.toFixed(1)}%`,                higherIsBetter: true },
    { key: "mktCap",   label: "Mkt Cap",        fmt: v => v >= 1e9 ? `${(v/1e9).toFixed(1)}B` : `${(v/1e6).toFixed(0)}M`, higherIsBetter: true },
    { key: "vol",      label: "Volume",         fmt: v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${(v/1e3).toFixed(0)}K`, higherIsBetter: true },
  ];

  const cardBg = "var(--card-bg)";
  const border = "var(--border)";
  const textPrimary = "var(--text-primary)";
  const textMuted = "var(--text-muted)";
  const lightBg = "var(--light-bg)";

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }}>
      {/* ── Header ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>Analytics</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            <span style={{ color: textPrimary }}>Stock </span><span style={{ color: "#D4971A" }}>Comparison</span>
          </h1>
          <p style={{ fontSize: 12, color: textMuted, margin: "3px 0 0" }}>Compare up to 8 PSX stocks side-by-side</p>
        </div>
        <StockSearch onAdd={addStock} existing={symbols} />
        {symbols.length >= 8 && <span style={{ fontSize: 11, color: "#dc2626", alignSelf: "center" }}>Max 8 stocks</span>}
      </div>

      {/* ── Stock chips ────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {stocks.map((s, i) => (
          <div key={s.symbol} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 10, border: `1px solid ${border}`, background: cardBg }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: colors[i], flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: colors[i] }}>{s.symbol}</span>
            <span style={{ fontSize: 10.5, color: textMuted }}>{s.name?.slice(0, 16)}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: s.positive ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>
              {s.positive ? "+" : ""}{s.changePct.toFixed(2)}%
            </span>
            <button onClick={() => removeStock(s.symbol)}
              style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${border}`, background: lightBg, color: textMuted, cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, marginLeft: 2 }}>×</button>
          </div>
        ))}
      </div>

      {stocks.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, color: textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 14 }}>Add stocks above to start comparing</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* ── 30-day overlay chart ────────────────────── */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>30-Day Performance</div>
                <div style={{ fontSize: 11, color: textMuted, marginTop: 1 }}>Indexed to 100 for fair comparison</div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {stocks.map((s, i) => (
                  <div key={s.symbol} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 20, height: 2.5, background: colors[i], borderRadius: 1, display: "inline-block" }} />
                    <span style={{ fontSize: 11, color: colors[i], fontWeight: 800 }}>{s.symbol}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: 200, overflow: "hidden" }}>
              <OverlayChart stocks={stocks} colors={colors} />
            </div>
          </div>

          {/* ── Sparkline cards ─────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stocks.length, 4)}, 1fr)`, gap: 10 }}>
            {stocks.map((s, i) => (
              <div key={s.symbol} style={{ background: cardBg, border: `1px solid ${border}`, borderTop: `3px solid ${colors[i]}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: colors[i] }}>{s.symbol}</div>
                    <div style={{ fontSize: 10.5, color: textMuted, marginTop: 1 }}>{s.name?.slice(0, 20)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: textPrimary, fontVariantNumeric: "tabular-nums" }}>{s.price.toFixed(2)}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: s.positive ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>
                      {s.positive ? "+" : ""}{s.changePct.toFixed(2)}% ({s.positive ? "+" : ""}{s.change.toFixed(2)})
                    </div>
                  </div>
                </div>
                <SparkSVG pts={s.sparkline} color={colors[i]} width={160} height={44} />
                <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
                  {[["P/E", `${s.pe}x`], ["Div%", `${s.divYield.toFixed(1)}%`], ["ROE", `${s.roe.toFixed(0)}%`]].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 9.5, color: textMuted, letterSpacing: "0.06em" }}>{k}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: textPrimary, fontVariantNumeric: "tabular-nums" }}>{v}</div>
                    </div>
                  ))}
                </div>
                <Link href={`/data-portal/company/${s.symbol}`} style={{ display: "inline-block", marginTop: 10, fontSize: 11, color: colors[i], textDecoration: "none", fontWeight: 700 }}>View Profile →</Link>
              </div>
            ))}
          </div>

          {/* ── Comparison table ────────────────────────── */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${border}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>Detailed Comparison</span>
              <span style={{ fontSize: 11, color: textMuted, marginLeft: 8 }}>★ = best in category</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                <thead>
                  <tr style={{ background: lightBg }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.07em", color: textMuted, textTransform: "uppercase", width: 140 }}>Metric</th>
                    {stocks.map((s, i) => (
                      <th key={s.symbol} style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 800, color: colors[i], letterSpacing: "0.04em" }}>
                        {s.symbol}
                      </th>
                    ))}
                    <th style={{ padding: "10px 16px", textAlign: "center", fontSize: 10.5, fontWeight: 700, color: textMuted, textTransform: "uppercase" }}>Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map(m => {
                    const values = stocks.map(s => s[m.key] as number);
                    const best = m.higherIsBetter ? Math.max(...values) : Math.min(...values);
                    const maxVal = Math.max(...values.map(Math.abs));
                    return (
                      <tr key={m.key} style={{ borderBottom: `1px solid ${border}` }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = lightBg}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                      >
                        <td style={{ padding: "10px 16px", fontSize: 12, color: textMuted, fontWeight: 600 }}>{m.label}</td>
                        {values.map((v, i) => (
                          <td key={i} style={{ padding: "10px 16px", textAlign: "right", fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                            color: v === best ? colors[i] : textPrimary }}>
                            {v === best && <span style={{ fontSize: 8, marginRight: 3 }}>★</span>}
                            {m.fmt(v)}
                          </td>
                        ))}
                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                          <StatBar values={values} colors={colors} max={maxVal} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── P&L Status badges ───────────────────────── */}
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>Today&apos;s P&amp;L Status</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {stocks.map((s, i) => (
                <div key={s.symbol} style={{ padding: "10px 18px", borderRadius: 12, border: `1px solid ${s.positive ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`, background: s.positive ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.07)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{s.positive ? "📈" : "📉"}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: colors[i] }}>{s.symbol}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: s.positive ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>
                      {s.positive ? "PROFIT" : "LOSS"} · {s.positive ? "+" : ""}{s.changePct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
