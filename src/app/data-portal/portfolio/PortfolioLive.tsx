"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { searchPsxStocks, PSX_STOCKS } from "@/lib/psx-stocks-static";
import { useDarkTokens } from "@/hooks/useDarkMode";

interface Holding {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  quantity: number;
  avgPrice: number;
  addedDate: string;
}

interface Transaction {
  id: string;
  symbol: string;
  name: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  date: string;
  note: string;
}

const DEMO_PRICES: Record<string, { price: number; chg: number; sector: string }> = {
  OGDC: { price: 181.50, chg: -0.66, sector: "Oil & Gas" },
  PPL:  { price: 89.30,  chg: -0.78, sector: "Oil & Gas" },
  MARI: { price: 2210.0, chg: 0.68,  sector: "Oil & Gas" },
  HBL:  { price: 178.50, chg: 1.02,  sector: "Banks" },
  UBL:  { price: 232.40, chg: 0.91,  sector: "Banks" },
  MCB:  { price: 219.80, chg: -0.68, sector: "Banks" },
  NBP:  { price: 43.20,  chg: 0.70,  sector: "Banks" },
  MEBL: { price: 218.50, chg: 0.83,  sector: "Banks" },
  LUCK: { price: 1125.0, chg: 0.76,  sector: "Cement" },
  DGKC: { price: 97.80,  chg: -0.81, sector: "Cement" },
  ENGRO:{ price: 312.50, chg: 1.13,  sector: "Fertilizer" },
  EFERT:{ price: 87.60,  chg: 0.69,  sector: "Fertilizer" },
  FFC:  { price: 139.30, chg: -0.64, sector: "Fertilizer" },
  HUBC: { price: 107.80, chg: 0.75,  sector: "Power" },
  TRG:  { price: 101.50, chg: 1.50,  sector: "Technology" },
  SYS:  { price: 724.0,  chg: 1.26,  sector: "Technology" },
  PTC:  { price: 18.80,  chg: -1.05, sector: "Telecom" },
  FCCL: { price: 22.10,  chg: 0.91,  sector: "Cement" },
  BWCL: { price: 312.0,  chg: 0.81,  sector: "Cement" },
  PSO:  { price: 478.0,  chg: 0.95,  sector: "Oil & Gas" },
  SNGP: { price: 28.10,  chg: 1.44,  sector: "Gas" },
  SEARL:{ price: 228.0,  chg: 0.88,  sector: "Pharma" },
  MLCF: { price: 40.80,  chg: -0.97, sector: "Cement" },
  PSMC: { price: 830.0,  chg: 1.47,  sector: "Auto" },
  INDU: { price: 1702.0, chg: 1.07,  sector: "Auto" },
  NML:  { price: 138.0,  chg: 0.73,  sector: "Textile" },
  ICI:  { price: 832.0,  chg: 0.73,  sector: "Chemicals" },
  BAFL: { price: 54.60,  chg: 0.74,  sector: "Banks" },
  ABL:  { price: 136.70, chg: 0.66,  sector: "Banks" },
};

function getPrice(sym: string) {
  return DEMO_PRICES[sym] ?? { price: 100, chg: 0, sector: "Other" };
}
function getSector(sym: string) {
  const d = DEMO_PRICES[sym];
  if (d) return d.sector;
  const s = PSX_STOCKS.find(x => x.symbol === sym);
  return s?.sector ?? "Other";
}
function fmt(n: number, d = 2) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtShort(n: number) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return fmt(n);
}

const LS_HOLD = "stockifyy_portfolio_holdings";
const LS_TX   = "stockifyy_portfolio_tx";
function loadHoldings(): Holding[] { try { return JSON.parse(localStorage.getItem(LS_HOLD) ?? "[]"); } catch { return []; } }
function saveHoldings(h: Holding[]) { try { localStorage.setItem(LS_HOLD, JSON.stringify(h)); } catch {} }
function loadTx(): Transaction[] { try { return JSON.parse(localStorage.getItem(LS_TX) ?? "[]"); } catch { return []; } }
function saveTx(t: Transaction[]) { try { localStorage.setItem(LS_TX, JSON.stringify(t)); } catch {} }

// Arc path helpers for interactive donut
function polarXY(cx: number, cy: number, r: number, a: number): [number, number] {
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}
function arcPath(cx: number, cy: number, R: number, ri: number, a0: number, a1: number): string {
  const [x1, y1] = polarXY(cx, cy, R, a0);
  const [x2, y2] = polarXY(cx, cy, R, a1);
  const [ix1, iy1] = polarXY(cx, cy, ri, a0);
  const [ix2, iy2] = polarXY(cx, cy, ri, a1);
  const lg = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x1} ${y1} A${R} ${R} 0 ${lg} 1 ${x2} ${y2} L${ix2} ${iy2} A${ri} ${ri} 0 ${lg} 0 ${ix1} ${iy1}Z`;
}

interface StockSlice {
  symbol: string;
  name: string;
  value: number;
  shares: number;
  color: string;
}

function StockDonutChart({ slices, totalVal, gold, text, muted, border, card }: {
  slices: StockSlice[];
  totalVal: number;
  gold: string; text: string; muted: string; border: string; card: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = slices.reduce((a, s) => a + s.value, 0);
  if (total === 0 || slices.length === 0) {
    return (
      <div style={{ textAlign: "center", color: muted, fontSize: 13, padding: "20px 0" }}>
        No holdings yet
      </div>
    );
  }

  const cx = 100, cy = 100, R = 78, ri = 50;
  let angle = -Math.PI / 2;
  const paths = slices.map((s, i) => {
    const span = (s.value / total) * 2 * Math.PI;
    const a0 = angle, a1 = angle + span;
    angle = a1;
    const isHov = hovered === i;
    const scale = isHov ? 1.04 : 1;
    // expand hovered slice outward
    const midA = (a0 + a1) / 2;
    const dx = isHov ? Math.cos(midA) * 5 : 0;
    const dy = isHov ? Math.sin(midA) * 5 : 0;
    return { path: arcPath(cx, cy, R, ri, a0, a1), color: s.color, i, dx, dy, scale, midA };
  });

  const hov = hovered !== null ? slices[hovered] : null;
  const hovPct = hov ? (hov.value / total * 100).toFixed(1) : null;

  return (
    <div ref={containerRef} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative" }}>
        <svg width={200} height={200} viewBox="0 0 200 200">
          {paths.map(p => (
            <path
              key={p.i}
              d={p.path}
              fill={p.color}
              opacity={hovered === null ? 0.9 : hovered === p.i ? 1 : 0.4}
              transform={`translate(${p.dx}, ${p.dy})`}
              style={{ cursor: "pointer", transition: "opacity 0.15s, transform 0.15s" }}
              onMouseEnter={() => setHovered(p.i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* center hole */}
          <circle cx={cx} cy={cy} r={ri - 2} fill={card} />
          {/* center text */}
          {hov ? (
            <>
              <text x={cx} y={cy - 8} textAnchor="middle" fontSize={11} fontWeight={800} fill={hov.color}>{hov.symbol}</text>
              <text x={cx} y={cy + 6} textAnchor="middle" fontSize={10} fill={text}>{hovPct}%</text>
              <text x={cx} y={cy + 20} textAnchor="middle" fontSize={9} fill={muted}>of portfolio</text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize={10} fill={muted}>Total Value</text>
              <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fontWeight={800} fill={text}>
                ₨{totalVal >= 1_000_000 ? (totalVal / 1_000_000).toFixed(1) + "M" : totalVal >= 1000 ? (totalVal / 1000).toFixed(0) + "K" : totalVal.toFixed(0)}
              </text>
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hov && (
          <div style={{
            position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)",
            background: card, border: `1.5px solid ${hov.color}`, borderRadius: 10,
            padding: "10px 14px", minWidth: 170, pointerEvents: "none", zIndex: 10,
            boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
          }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: hov.color, marginBottom: 2 }}>{hov.symbol}</div>
            <div style={{ fontSize: 11, color: text, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 }}>{hov.name}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 10px" }}>
              {[
                ["Shares", hov.shares.toLocaleString("en-PK", { maximumFractionDigits: 0 })],
                ["Weight", hovPct + "%"],
                ["Value", "₨" + (hov.value >= 1_000_000 ? (hov.value / 1_000_000).toFixed(2) + "M" : (hov.value / 1000).toFixed(1) + "K")],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 9, color: muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// SVG Donut for sector allocation
function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  if (total === 0) return <div style={{ width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>No data</div>;
  const r = 60, cx = 80, cy = 80;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={160} height={160} viewBox="0 0 160 160">
      {slices.map((s, i) => {
        const frac = s.value / total;
        const dash = circ * frac;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={22}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={circ * 0.25 - offset * circ}
          />
        );
        offset += frac;
        return el;
      })}
      <circle cx={cx} cy={cy} r={46} fill="var(--card-bg,#fff)" />
    </svg>
  );
}

// SVG Bar chart for P&L by stock
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => Math.abs(d.value)), 1);
  const bw = 28, gap = 10, h = 120, pad = 20;
  const w = data.length * (bw + gap) + pad * 2;
  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={Math.max(w, 300)} height={h + 40} viewBox={`0 0 ${Math.max(w, 300)} ${h + 40}`}>
        {data.map((d, i) => {
          const barH = Math.max(2, (Math.abs(d.value) / max) * (h - 20));
          const x = pad + i * (bw + gap);
          const color = d.value >= 0 ? "#16a34a" : "#dc2626";
          const barY = h - barH;
          return (
            <g key={d.label}>
              <rect x={x} y={barY} width={bw} height={barH} rx={4} fill={color} opacity={0.85} />
              <text x={x + bw / 2} y={h + 14} textAnchor="middle" fontSize={10} fill="#94a3b8">{d.label}</text>
              <text x={x + bw / 2} y={barY - 4} textAnchor="middle" fontSize={9} fill={color} fontWeight="700">
                {d.value >= 0 ? "+" : ""}{fmtShort(d.value)}
              </text>
            </g>
          );
        })}
        <line x1={pad - 4} y1={h} x2={Math.max(w, 300) - 4} y2={h} stroke="var(--border,#e2e8f0)" strokeWidth={1} />
      </svg>
    </div>
  );
}

type SortKey = "symbol" | "qty" | "avgPrice" | "curPrice" | "value" | "pnlPct" | "dayChg";
type AnalyticsPeriod = "Day" | "Weekly" | "Monthly" | "Yearly";

// Period multipliers for sector performance estimation
const PERIOD_MULT: Record<AnalyticsPeriod, number> = { Day: 1, Weekly: 5, Monthly: 22, Yearly: 252 };
const PERIOD_LABEL: Record<AnalyticsPeriod, string> = { Day: "Today", Weekly: "This Week", Monthly: "This Month", Yearly: "This Year" };

function AnalyticsTab({ holdings, sectorAlloc, fmt, fmtShort, navy, gold, text, muted, border }: {
  holdings: { symbol: string; quantity: number; avgPrice: number }[];
  sectorAlloc: { label: string; value: number; color: string }[];
  fmt: (n: number, d?: number) => string;
  fmtShort: (n: number) => string;
  navy: string; gold: string; text: string; muted: string; border: string;
}) {
  const [period, setPeriod] = useState<AnalyticsPeriod>("Day");

  const sectorPerf = useMemo(() => {
    const mult = PERIOD_MULT[period];
    const map: Record<string, { chgSum: number; weight: number; value: number }> = {};
    holdings.forEach(h => {
      const p = getPrice(h.symbol);
      const sec = getSector(h.symbol);
      const val = h.quantity * p.price;
      const dailyChg = p.chg;
      // Scale daily % change by period
      // deterministic scaling: longer periods smooth out single-day spikes
      const periodChg = dailyChg * mult * (period === "Day" ? 1 : 0.7);
      if (!map[sec]) map[sec] = { chgSum: 0, weight: 0, value: 0 };
      map[sec].chgSum += periodChg * val;
      map[sec].weight += val;
      map[sec].value += val;
    });
    return Object.entries(map)
      .map(([label, d]) => ({
        label,
        chg: d.weight > 0 ? d.chgSum / d.weight : 0,
        value: d.value,
        color: sectorAlloc.find(s => s.label === label)?.color ?? gold,
      }))
      .sort((a, b) => b.chg - a.chg);
  }, [holdings, period, sectorAlloc, gold]);

  const pnlData = useMemo(() => {
    const mult = PERIOD_MULT[period];
    return holdings.map(h => {
      const p = getPrice(h.symbol);
      const periodChgPct = p.chg * mult;
      const pnl = h.quantity * p.price * (periodChgPct / 100);
      return { label: h.symbol, value: pnl };
    });
  }, [holdings, period]);

  const totalPnl = useMemo(() => pnlData.reduce((a, d) => a + d.value, 0), [pnlData]);

  if (holdings.length === 0) {
    return <div style={{ textAlign: "center", color: muted, padding: "60px 0", fontSize: 13 }}>Add holdings to see analytics</div>;
  }

  return (
    <div>
      {/* Period Selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["Day","Weekly","Monthly","Yearly"] as AnalyticsPeriod[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: "6px 16px", borderRadius: 8, border: `1.5px solid ${period === p ? gold : border}`,
            background: period === p ? gold + "18" : "transparent",
            color: period === p ? gold : muted, fontWeight: period === p ? 700 : 500,
            fontSize: 12, cursor: "pointer", transition: "all 0.15s",
          }}>{p}</button>
        ))}
      </div>

      {/* Period P&L Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ background: (totalPnl >= 0 ? "#16a34a" : "#dc2626") + "12", border: `1px solid ${(totalPnl >= 0 ? "#16a34a" : "#dc2626")}30`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{PERIOD_LABEL[period]} P&L</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: totalPnl >= 0 ? "#16a34a" : "#dc2626" }}>{totalPnl >= 0 ? "+" : ""}{fmtShort(totalPnl)}</div>
        </div>
        <div style={{ background: navy + "60", border: `1px solid ${border}`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Active Sectors</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: text }}>{sectorPerf.length}</div>
        </div>
      </div>

      {/* Sector Performance Table */}
      <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 10 }}>Sector Performance — {PERIOD_LABEL[period]}</div>
      <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${border}`, marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: navy }}>
              {["Sector", "Exposure", "Change %", "P&L"].map(c => (
                <th key={c} style={{ padding: "9px 12px", textAlign: c === "Sector" ? "left" : "right", color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectorPerf.map(s => {
              const pnl = s.value * (s.chg / 100);
              return (
                <tr key={s.label} style={{ borderBottom: `1px solid ${border}` }}>
                  <td style={{ padding: "9px 12px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: text }}>{s.label}</span>
                    </span>
                  </td>
                  <td style={{ padding: "9px 12px", textAlign: "right", color: muted, fontVariantNumeric: "tabular-nums" }}>{fmtShort(s.value)}</td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: s.chg >= 0 ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      {s.chg >= 0 ? "▲" : "▼"} {Math.abs(s.chg).toFixed(2)}%
                    </span>
                  </td>
                  <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 700, color: pnl >= 0 ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>
                    {pnl >= 0 ? "+" : ""}{fmtShort(pnl)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* P&L Bar Chart */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 12 }}>P&L by Stock — {PERIOD_LABEL[period]}</div>
        <BarChart data={pnlData} />
      </div>

      {/* Best/Worst Performers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {(() => {
          const sorted = holdings.map(h => {
            const p = getPrice(h.symbol);
            const pct = p.chg * PERIOD_MULT[period];
            return { symbol: h.symbol, pct };
          }).sort((a, b) => b.pct - a.pct);
          const best = sorted[0], worst = sorted[sorted.length - 1];
          return [
            { label: "Best Performer", stock: best, color: "#16a34a" },
            { label: "Worst Performer", stock: worst, color: "#dc2626" },
          ].map(({ label, stock, color }) => stock ? (
            <div key={label} style={{ background: color + "10", border: `1px solid ${color}30`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color }}>{stock.symbol}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color }}>{stock.pct >= 0 ? "+" : ""}{fmt(stock.pct)}%</div>
            </div>
          ) : null);
        })()}
      </div>

      {/* Sector Allocation Table */}
      <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 10 }}>Portfolio Allocation</div>
      <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${border}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: navy }}>
              {["Sector","Value (PKR)","Weight %"].map(c => (
                <th key={c} style={{ padding: "8px 12px", textAlign: c === "Sector" ? "left" : "right", color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sectorAlloc.map(s => {
              const total = sectorAlloc.reduce((a, x) => a + x.value, 0);
              const pct = total > 0 ? (s.value / total * 100) : 0;
              return (
                <tr key={s.label} style={{ borderBottom: `1px solid ${border}` }}>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                      <span style={{ color: text }}>{s.label}</span>
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: muted }}>{fmtShort(s.value)}</td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: s.color }}>{fmt(pct)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PortfolioLive() {
  const tk = useDarkTokens();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [txHistory, setTxHistory] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"holdings" | "transactions" | "analytics">("holdings");
  const [showAddModal, setShowAddModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortAsc, setSortAsc] = useState(false);

  // Add form state
  const [addSym, setAddSym] = useState("");
  const [addName, setAddName] = useState("");
  const [addQty, setAddQty] = useState("");
  const [addAvg, setAddAvg] = useState("");
  const [addDate, setAddDate] = useState(new Date().toISOString().slice(0, 10));
  const [addSearch, setAddSearch] = useState("");
  const [addSuggs, setAddSuggs] = useState<{ symbol: string; name: string }[]>([]);

  // Tx form state
  const [txSym, setTxSym] = useState("");
  const [txName, setTxName] = useState("");
  const [txType, setTxType] = useState<"BUY"|"SELL">("BUY");
  const [txQty, setTxQty] = useState("");
  const [txPrice, setTxPrice] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [txNote, setTxNote] = useState("");
  const [txSearch, setTxSearch] = useState("");
  const [txSuggs, setTxSuggs] = useState<{ symbol: string; name: string }[]>([]);

  useEffect(() => {
    setMounted(true);
    setHoldings(loadHoldings());
    setTxHistory(loadTx());
  }, []);

  useEffect(() => { if (mounted) saveHoldings(holdings); }, [holdings, mounted]);
  useEffect(() => { if (mounted) saveTx(txHistory); }, [txHistory, mounted]);

  const summary = useMemo(() => {
    let invested = 0, currentVal = 0, todayChg = 0;
    holdings.forEach(h => {
      const p = getPrice(h.symbol);
      invested += h.quantity * h.avgPrice;
      currentVal += h.quantity * p.price;
      todayChg += h.quantity * p.price * (p.chg / 100);
    });
    const pnl = currentVal - invested;
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
    // Naive XIRR estimate: annualized based on avg hold period
    const xirrEst = pnlPct * 1.2; // rough proxy
    return { invested, currentVal, pnl, pnlPct, todayChg, xirrEst };
  }, [holdings]);

  const stockSlices = useMemo((): StockSlice[] => {
    const COLORS = ["#D4971A","#16a34a","#2563eb","#7c3aed","#0891b2","#dc2626","#f59e0b","#10b981","#6366f1","#ec4899","#f97316","#14b8a6","#8b5cf6","#e11d48","#0ea5e9"];
    return [...holdings]
      .map((h, i) => {
        const p = getPrice(h.symbol);
        return { symbol: h.symbol, name: h.name || h.symbol, value: h.quantity * p.price, shares: h.quantity, color: COLORS[i % COLORS.length] };
      })
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  const sectorAlloc = useMemo(() => {
    const map: Record<string, number> = {};
    holdings.forEach(h => {
      const p = getPrice(h.symbol);
      const v = h.quantity * p.price;
      const sec = getSector(h.symbol);
      map[sec] = (map[sec] ?? 0) + v;
    });
    const COLORS = ["#D4971A","#16a34a","#2563eb","#7c3aed","#0891b2","#dc2626","#f59e0b","#10b981","#6366f1","#ec4899"];
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: COLORS[i % COLORS.length] }));
  }, [holdings]);

  const top3Holdings = useMemo(() => {
    return [...holdings]
      .map(h => ({ ...h, curVal: h.quantity * getPrice(h.symbol).price }))
      .sort((a, b) => b.curVal - a.curVal)
      .slice(0, 3);
  }, [holdings]);

  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((a, b) => {
      const pa = getPrice(a.symbol), pb = getPrice(b.symbol);
      const vals: Record<SortKey, number> = {
        symbol: a.symbol.localeCompare(b.symbol) * (sortAsc ? 1 : -1),
        qty: (a.quantity - b.quantity) * (sortAsc ? 1 : -1),
        avgPrice: (a.avgPrice - b.avgPrice) * (sortAsc ? 1 : -1),
        curPrice: (pa.price - pb.price) * (sortAsc ? 1 : -1),
        value: (a.quantity * pa.price - b.quantity * pb.price) * (sortAsc ? 1 : -1),
        pnlPct: (((pa.price - a.avgPrice) / a.avgPrice) - ((pb.price - b.avgPrice) / b.avgPrice)) * (sortAsc ? 1 : -1),
        dayChg: (pa.chg - pb.chg) * (sortAsc ? 1 : -1),
      };
      return vals[sortKey];
    });
  }, [holdings, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const addHolding = useCallback(() => {
    if (!addSym || !addQty || !addAvg) return;
    const qty = parseFloat(addQty), avg = parseFloat(addAvg);
    if (!isFinite(qty) || !isFinite(avg) || qty <= 0 || avg <= 0) return;
    setHoldings(prev => {
      const existing = prev.find(h => h.symbol === addSym);
      if (existing) {
        return prev.map(h => h.symbol === addSym
          ? { ...h, quantity: h.quantity + qty, avgPrice: (h.avgPrice * h.quantity + avg * qty) / (h.quantity + qty) }
          : h);
      }
      return [...prev, { id: Date.now().toString(), symbol: addSym, name: addName, sector: getSector(addSym), quantity: qty, avgPrice: avg, addedDate: addDate }];
    });
    setAddSym(""); setAddName(""); setAddQty(""); setAddAvg(""); setAddSearch(""); setShowAddModal(false);
  }, [addSym, addName, addQty, addAvg, addDate]);

  const addTransaction = useCallback(() => {
    if (!txSym || !txQty || !txPrice) return;
    const qty = parseFloat(txQty), price = parseFloat(txPrice);
    if (!isFinite(qty) || !isFinite(price)) return;
    setTxHistory(prev => [...prev, { id: Date.now().toString(), symbol: txSym, name: txName, type: txType, quantity: qty, price, date: txDate, note: txNote }]);
    setTxSym(""); setTxName(""); setTxQty(""); setTxPrice(""); setTxNote(""); setTxSearch("");
  }, [txSym, txName, txType, txQty, txPrice, txDate, txNote]);

  const card = tk.dark ? "#0A1825" : "#ffffff";
  const border = tk.dark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
  const text = tk.dark ? "#BDD0E8" : "#07111F";
  const muted = tk.dark ? "#5C8099" : "#718096";
  const bg = tk.dark ? "#0E1F30" : "#F8F6F1";
  const navy = "#07111F";
  const gold = "#D4971A";

  const INP: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "9px 12px",
    border: `1.5px solid ${border}`, borderRadius: 8, fontSize: 13,
    background: tk.dark ? "#07111F" : "#F8F6F1", color: text, outline: "none",
  };

  const pnlColor = summary.pnl >= 0 ? "#16a34a" : "#dc2626";

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: bg, padding: "24px 20px", color: text, fontFamily: "inherit", overflowX: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
              <span style={{ color: text }}>Portfolio </span><span style={{ color: "#D4971A" }}>Tracker</span>
            </h1>
            <p style={{ fontSize: 13, color: muted, margin: "4px 0 0" }}>Track your PSX holdings, P&L, and performance</p>
          </div>
          <button onClick={() => setShowAddModal(true)} style={{
            padding: "10px 20px", background: `linear-gradient(135deg, ${gold}, #B8810E)`,
            color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>+ Add Holding</button>
        </div>

        {/* Main Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(260px,300px) minmax(0,1fr)", gap: 20, alignItems: "start" }}>

          {/* LEFT: Summary Panel */}
          <div>
            {/* Portfolio Value Card */}
            <div style={{ background: `linear-gradient(135deg, ${navy}, #0E2D47)`, borderRadius: 16, padding: "20px", marginBottom: 16, color: "#fff" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Current Value</div>
              <div style={{ fontSize: 30, fontWeight: 900, fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>₨ {fmtShort(summary.currentVal)}</div>
              <div style={{ fontSize: 13, color: pnlColor, fontWeight: 700, marginBottom: 16 }}>
                {summary.pnl >= 0 ? "+" : ""}₨ {fmtShort(summary.pnl)} ({summary.pnlPct >= 0 ? "+" : ""}{fmt(summary.pnlPct)}%)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Invested", value: "₨ " + fmtShort(summary.invested) },
                  { label: "Today's Chg", value: (summary.todayChg >= 0 ? "+" : "") + "₨ " + fmtShort(summary.todayChg), color: summary.todayChg >= 0 ? "#4ade80" : "#f87171" },
                  { label: "Total P&L %", value: (summary.pnlPct >= 0 ? "+" : "") + fmt(summary.pnlPct) + "%", color: pnlColor === "#16a34a" ? "#4ade80" : "#f87171" },
                  { label: "Est. XIRR", value: (summary.xirrEst >= 0 ? "+" : "") + fmt(summary.xirrEst) + "%", color: "#D4971A" },
                ].map(it => (
                  <div key={it.label} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{it.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: it.color ?? "#fff", fontVariantNumeric: "tabular-nums" }}>{it.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Allocation Donut */}
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Stock Allocation</div>
              <StockDonutChart slices={stockSlices} totalVal={summary.currentVal} gold={gold} text={text} muted={muted} border={border} card={card} />
              {stockSlices.length > 0 && (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 5, marginTop: 16 }}>
                  {stockSlices.slice(0, 7).map(s => {
                    const pct = summary.currentVal > 0 ? (s.value / summary.currentVal * 100) : 0;
                    return (
                      <div key={s.symbol} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: text, fontWeight: 600 }}>{s.symbol}</span>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: muted }}>{pct.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                  {stockSlices.length > 7 && (
                    <div style={{ fontSize: 10, color: muted, textAlign: "center", marginTop: 2 }}>+{stockSlices.length - 7} more</div>
                  )}
                </div>
              )}
            </div>

            {/* Sector Donut */}
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px", marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Sector Allocation</div>
              {sectorAlloc.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <DonutChart slices={sectorAlloc} />
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                    {sectorAlloc.slice(0, 6).map(s => {
                      const total = sectorAlloc.reduce((a, x) => a + x.value, 0);
                      const pct = total > 0 ? (s.value / total * 100) : 0;
                      return (
                        <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: text }}>{s.label}</span>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: muted }}>{pct.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : <div style={{ textAlign: "center", color: muted, fontSize: 13, padding: "20px 0" }}>No holdings yet</div>}
            </div>

            {/* Top 3 Holdings */}
            {top3Holdings.length > 0 && (
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Top Holdings</div>
                {top3Holdings.map((h, i) => {
                  const p = getPrice(h.symbol);
                  const pnlPct = ((p.price - h.avgPrice) / h.avgPrice) * 100;
                  const totalVal = h.quantity * p.price;
                  const totalPortVal = summary.currentVal || 1;
                  const weight = (totalVal / totalPortVal) * 100;
                  return (
                    <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 2 ? 10 : 0, paddingBottom: i < 2 ? 10 : 0, borderBottom: i < 2 ? `1px solid ${border}` : "none" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: gold + "20", color: gold, fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        #{i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: text }}>{h.symbol}</div>
                        <div style={{ fontSize: 10, color: muted }}>{weight.toFixed(1)}% of portfolio</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: pnlPct >= 0 ? "#16a34a" : "#dc2626" }}>
                          {pnlPct >= 0 ? "+" : ""}{fmt(pnlPct)}%
                        </div>
                        <div style={{ fontSize: 10, color: muted }}>₨ {fmtShort(totalVal)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Tabs Panel */}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden" }}>
            {/* Tab Bar */}
            <div style={{ display: "flex", borderBottom: `1px solid ${border}` }}>
              {(["holdings", "transactions", "analytics"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: "14px 22px", background: "none", border: "none", cursor: "pointer",
                  fontWeight: activeTab === tab ? 700 : 500, fontSize: 14,
                  color: activeTab === tab ? gold : muted,
                  borderBottom: activeTab === tab ? `2px solid ${gold}` : "2px solid transparent",
                  transition: "all 0.15s", textTransform: "capitalize",
                }}>{tab}</button>
              ))}
            </div>

            <div style={{ padding: "20px" }}>
              {/* HOLDINGS TAB */}
              {activeTab === "holdings" && (
                <div>
                  {sortedHoldings.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 20px", color: muted }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No holdings yet</div>
                      <div style={{ fontSize: 13 }}>Click "+ Add Holding" to start tracking your portfolio</div>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: navy }}>
                            {([
                              ["symbol","Symbol"],["qty","Qty"],["avgPrice","Avg Price"],["curPrice","Cur Price"],
                              ["value","Value (PKR)"],["pnlPct","P&L %"],["dayChg","Day Chg"],
                            ] as [SortKey, string][]).map(([key, label]) => (
                              <th key={key} onClick={() => toggleSort(key)} style={{
                                padding: "9px 12px", textAlign: "right", color: "rgba(255,255,255,0.8)",
                                fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                                cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
                              }}>
                                {label} {sortKey === key ? (sortAsc ? "▲" : "▼") : ""}
                              </th>
                            ))}
                            <th style={{ padding: "9px 12px", color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 700 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedHoldings.map(h => {
                            const p = getPrice(h.symbol);
                            const val = h.quantity * p.price;
                            const pnl = val - h.quantity * h.avgPrice;
                            const pnlPct = ((p.price - h.avgPrice) / h.avgPrice) * 100;
                            const pColor = pnl >= 0 ? "#16a34a" : "#dc2626";
                            const dColor = p.chg >= 0 ? "#16a34a" : "#dc2626";
                            return (
                              <tr key={h.id} style={{ borderBottom: `1px solid ${border}` }}
                                onMouseEnter={e => (e.currentTarget.style.background = tk.dark ? "rgba(255,255,255,0.03)" : "#f8fafc")}
                                onMouseLeave={e => (e.currentTarget.style.background = "")}>
                                <td style={{ padding: "10px 12px", textAlign: "right" }}>
                                  <span style={{ background: navy, color: gold, fontWeight: 800, fontSize: 12, padding: "2px 8px", borderRadius: 5 }}>{h.symbol}</span>
                                </td>
                                <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(h.quantity, 0)}</td>
                                <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(h.avgPrice)}</td>
                                <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{fmt(p.price)}</td>
                                <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{fmtShort(val)}</td>
                                <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: pColor, fontWeight: 700 }}>
                                  {pnlPct >= 0 ? "+" : ""}{fmt(pnlPct)}%
                                </td>
                                <td style={{ padding: "10px 12px", textAlign: "right", color: dColor, fontWeight: 600 }}>
                                  {p.chg >= 0 ? "+" : ""}{fmt(p.chg)}%
                                </td>
                                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                  <button onClick={() => setHoldings(prev => prev.filter(x => x.id !== h.id))} style={{
                                    background: "#dc262610", color: "#dc2626", border: "none", borderRadius: 6,
                                    padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 700,
                                  }}>Remove</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TRANSACTIONS TAB */}
              {activeTab === "transactions" && (
                <div>
                  {/* Add transaction form */}
                  <div style={{ background: tk.dark ? "rgba(255,255,255,0.03)" : "#F8F6F1", borderRadius: 12, padding: "16px", marginBottom: 20, border: `1px solid ${border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 12 }}>Record Transaction</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10 }}>
                      <div style={{ position: "relative" }}>
                        <input value={txSearch} onChange={e => { setTxSearch(e.target.value); setTxSuggs(searchPsxStocks(e.target.value, 6)); }}
                          placeholder="Symbol..." style={INP} />
                        {txSuggs.length > 0 && (
                          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: card, border: `1px solid ${border}`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 200, overflowY: "auto" }}>
                            {txSuggs.map(s => (
                              <button key={s.symbol} onClick={() => { setTxSym(s.symbol); setTxName(s.name); setTxSearch(s.symbol); setTxSuggs([]); const p = getPrice(s.symbol); setTxPrice(p.price.toString()); }}
                                style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, color: text, borderBottom: `1px solid ${border}` }}>
                                <strong>{s.symbol}</strong> — {s.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <select value={txType} onChange={e => setTxType(e.target.value as "BUY"|"SELL")} style={{ ...INP, background: txType === "BUY" ? "#16a34a18" : "#dc262618" }}>
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                      </select>
                      <input type="number" value={txQty} onChange={e => setTxQty(e.target.value)} placeholder="Quantity" style={INP} />
                      <input type="number" value={txPrice} onChange={e => setTxPrice(e.target.value)} placeholder="Price" style={INP} />
                      <input type="date" value={txDate} onChange={e => setTxDate(e.target.value)} style={INP} />
                      <input value={txNote} onChange={e => setTxNote(e.target.value)} placeholder="Note (optional)" style={INP} />
                    </div>
                    <button onClick={addTransaction} style={{
                      marginTop: 12, padding: "9px 20px", background: `linear-gradient(135deg, ${gold}, #B8810E)`,
                      color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
                    }}>Record</button>
                  </div>

                  {/* Tx History */}
                  {txHistory.length === 0 ? (
                    <div style={{ textAlign: "center", color: muted, padding: "40px 0", fontSize: 13 }}>No transactions recorded yet</div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: navy }}>
                            {["Date","Symbol","Type","Qty","Price","Total","Note"].map(c => (
                              <th key={c} style={{ padding: "9px 12px", textAlign: "right", color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...txHistory].reverse().map(tx => (
                            <tr key={tx.id} style={{ borderBottom: `1px solid ${border}` }}
                              onMouseEnter={e => (e.currentTarget.style.background = tk.dark ? "rgba(255,255,255,0.03)" : "#f8fafc")}
                              onMouseLeave={e => (e.currentTarget.style.background = "")}>
                              <td style={{ padding: "9px 12px", textAlign: "right", color: muted }}>{tx.date}</td>
                              <td style={{ padding: "9px 12px", textAlign: "right" }}>
                                <span style={{ background: navy, color: gold, fontWeight: 800, fontSize: 11, padding: "2px 7px", borderRadius: 4 }}>{tx.symbol}</span>
                              </td>
                              <td style={{ padding: "9px 12px", textAlign: "right" }}>
                                <span style={{ color: tx.type === "BUY" ? "#16a34a" : "#dc2626", fontWeight: 700, fontSize: 12 }}>{tx.type}</span>
                              </td>
                              <td style={{ padding: "9px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(tx.quantity, 0)}</td>
                              <td style={{ padding: "9px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(tx.price)}</td>
                              <td style={{ padding: "9px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{fmtShort(tx.quantity * tx.price)}</td>
                              <td style={{ padding: "9px 12px", textAlign: "right", color: muted, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ANALYTICS TAB */}
              {activeTab === "analytics" && (
                <AnalyticsTab holdings={holdings} sectorAlloc={sectorAlloc} fmt={fmt} fmtShort={fmtShort} navy={navy} gold={gold} text={text} muted={muted} border={border} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Holding Modal */}
      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: card, borderRadius: 16, padding: "28px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: text }}>Add Holding</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: muted, fontSize: 20 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <input value={addSearch} onChange={e => { setAddSearch(e.target.value); setAddSuggs(searchPsxStocks(e.target.value, 6)); }}
                  placeholder="Search symbol..." style={INP} />
                {addSuggs.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: card, border: `1px solid ${border}`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", maxHeight: 200, overflowY: "auto" }}>
                    {addSuggs.map(s => (
                      <button key={s.symbol} onClick={() => { setAddSym(s.symbol); setAddName(s.name); setAddSearch(s.symbol); setAddSuggs([]); const p = getPrice(s.symbol); setAddAvg(p.price.toString()); }}
                        style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, color: text, borderBottom: `1px solid ${border}` }}>
                        <strong style={{ color: gold }}>{s.symbol}</strong> — {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input type="number" value={addQty} onChange={e => setAddQty(e.target.value)} placeholder="Quantity (shares)" style={INP} />
              <input type="number" value={addAvg} onChange={e => setAddAvg(e.target.value)} placeholder="Average Buy Price (PKR)" style={INP} />
              <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} style={INP} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "10px", background: "none", border: `1px solid ${border}`, borderRadius: 8, color: muted, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={addHolding} style={{ flex: 2, padding: "10px", background: `linear-gradient(135deg, ${gold}, #B8810E)`, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Add to Portfolio</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
