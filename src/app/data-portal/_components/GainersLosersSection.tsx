"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { GAINERS, LOSERS, MARKET_LEADERS, fmtNum } from "../_data";
import StockDetailModal, { type StockInfo } from "./StockDetailModal";

// ── Shared row click handler type ──
type OnSelect = (s: StockInfo) => void;

// ── Top Gainers panel ──
function TopGainers({ onSelect }: { onSelect: OnSelect }) {
  return (
    <div className="card overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <span aria-hidden="true">🔺</span>
        <h2 className="text-sm font-bold" style={{ color: "#16A34A" }}>Top Advancers</h2>
      </div>
      <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide border-b"
        style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--light-bg)" }}>
        <div className="col-span-3">Symbol</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-4 text-right">Change</div>
        <div className="col-span-3 text-right">Volume</div>
      </div>
      <div className="flex-1 divide-y" style={{ borderColor: "var(--border)" }}>
        {GAINERS.map((s, i) => (
          <motion.div key={s.symbol}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
            className="grid grid-cols-12 items-center px-4 py-2 hover:bg-green-50/30 transition-colors cursor-pointer"
            onClick={() => onSelect({ symbol: s.symbol, name: s.name, close: s.close, pct: s.pct })}
          >
            <div className="col-span-3">
              <span className="inline-block font-mono font-semibold text-[10.5px] tracking-wide px-1.5 py-0.5 rounded"
                style={{ color: "var(--navy)", background: "var(--navy-tint)", letterSpacing:"0.04em" }}>{s.symbol}</span>
            </div>
            <div className="col-span-2 text-right font-semibold text-[11px] tabular-nums" style={{ color: "var(--text-primary)" }}>{fmtNum(s.close)}</div>
            <div className="col-span-4 text-right text-[10px] font-bold tabular-nums" style={{ color: "#16A34A" }}>
              ▲{s.change.toFixed(2)} ({s.pct.toFixed(2)}%)
            </div>
            <div className="col-span-3 text-right text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
              {s.vol.toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Top Losers panel ──
function TopLosers({ onSelect }: { onSelect: OnSelect }) {
  return (
    <div className="card overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <span aria-hidden="true">🔻</span>
        <h2 className="text-sm font-bold" style={{ color: "#DC2626" }}>Top Decliners</h2>
      </div>
      <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide border-b"
        style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--light-bg)" }}>
        <div className="col-span-3">Symbol</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-4 text-right">Change</div>
        <div className="col-span-3 text-right">Volume</div>
      </div>
      <div className="flex-1 divide-y" style={{ borderColor: "var(--border)" }}>
        {LOSERS.map((s, i) => (
          <motion.div key={s.symbol}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: "easeOut" }}
            className="grid grid-cols-12 items-center px-4 py-2 hover:bg-red-50/30 transition-colors cursor-pointer"
            onClick={() => onSelect({ symbol: s.symbol, name: s.name, close: s.close, pct: s.pct })}
          >
            <div className="col-span-3">
              <span className="inline-block font-mono font-semibold text-[10.5px] tracking-wide px-1.5 py-0.5 rounded"
                style={{ color: "var(--navy)", background: "var(--navy-tint)", letterSpacing:"0.04em" }}>{s.symbol}</span>
            </div>
            <div className="col-span-2 text-right font-semibold text-[11px] tabular-nums" style={{ color: "var(--text-primary)" }}>{fmtNum(s.close)}</div>
            <div className="col-span-4 text-right text-[10px] font-bold tabular-nums" style={{ color: "#DC2626" }}>
              ▼{Math.abs(s.change).toFixed(2)} ({Math.abs(s.pct).toFixed(2)}%)
            </div>
            <div className="col-span-3 text-right text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
              {s.vol.toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Market Performance panel ──
type MTab = "Top Active" | "Advancers" | "Decliners";

type BarItem = { symbol: string; pct: number; price: number; vol: number; neg: boolean; name: string };

function BarChart({ data, accentUp }: { data: BarItem[]; accentUp: boolean | null }) {
  const W = 420, H = 200, padT = 24, padB = 28, padX = 8;
  const chartH = H - padT - padB;
  const max = Math.max(...data.map(d => Math.abs(d.pct))) || 1;

  // Split: all-positive → bars grow from bottom; all-negative → bars drop from top; mixed → zero line
  const allUp  = data.every(d => d.pct >= 0);
  const allDn  = data.every(d => d.pct < 0);
  const zeroY  = allUp ? padT + chartH : allDn ? padT : padT + chartH * (max / (max * 2));

  const n    = data.length;
  const slot = (W - padX * 2) / n;
  const barW = Math.max(slot * 0.52, 8);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 190 }} aria-label="Market performance chart">
      <defs>
        {data.map((d) => {
          const up = d.pct >= 0;
          const c  = up ? "#16A34A" : "#DC2626";
          return (
            <linearGradient key={d.symbol} id={`bg-${d.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={c} stopOpacity={up ? "0.9" : "0.7"} />
              <stop offset="100%" stopColor={c} stopOpacity={up ? "0.5" : "0.9"} />
            </linearGradient>
          );
        })}
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f}
          x1={padX} y1={padT + chartH * f} x2={W - padX} y2={padT + chartH * f}
          stroke="rgba(128,128,128,0.1)" strokeWidth="1" />
      ))}

      {/* Zero line */}
      <line x1={padX} y1={zeroY} x2={W - padX} y2={zeroY}
        stroke="rgba(128,128,128,0.25)" strokeWidth="1" strokeDasharray="4 3" />

      {data.map((d, i) => {
        const up    = d.pct >= 0;
        const color = up ? "#16A34A" : "#DC2626";
        const cx    = padX + i * slot + slot / 2;
        const x     = cx - barW / 2;
        const maxBarH = up ? zeroY - padT - 2 : (padT + chartH) - zeroY - 2;
        const barH  = Math.max((Math.abs(d.pct) / max) * maxBarH, 3);
        const barY  = up ? zeroY - barH : zeroY;
        const pctY  = up ? barY - 5 : barY + barH + 11;

        return (
          <g key={d.symbol}>
            {/* Bar with gradient */}
            <rect x={x} y={barY} width={barW} height={barH}
              fill={`url(#bg-${d.symbol})`} rx="4" />
            {/* Highlight stripe */}
            <rect x={x + 2} y={barY + (up ? 2 : 0)} width={3} height={Math.min(barH * 0.4, 14)}
              fill="rgba(255,255,255,0.22)" rx="2" />
            {/* Pct label */}
            <text x={cx} y={pctY} textAnchor="middle" fontSize="8.5" fill={color} fontWeight="700">
              {up ? "+" : ""}{d.pct.toFixed(2)}%
            </text>
            {/* Symbol label */}
            <text x={cx} y={H - 6} textAnchor="middle" fontSize="8" fill="var(--text-muted)" fontWeight="600">
              {d.symbol}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function MarketPerfPanel({ onSelect }: { onSelect: OnSelect }) {
  const [tab, setTab] = useState<MTab>("Top Active");

  const leaderRows: BarItem[] = MARKET_LEADERS.map(s => ({
    symbol: s.symbol, name: s.symbol, price: s.price, pct: s.pct, vol: s.vol, neg: s.neg,
  }));

  const gainerRows: BarItem[] = GAINERS.slice(0, 5).map(s => ({
    symbol: s.symbol, name: s.name, price: s.close, pct: s.pct, vol: 0, neg: false,
  }));

  const loserRows: BarItem[] = LOSERS.slice(0, 5).map(s => ({
    symbol: s.symbol, name: s.name, price: s.close, pct: s.pct, vol: 0, neg: true,
  }));

  const tabData: Record<MTab, BarItem[]> = {
    "Top Active": leaderRows,
    "Advancers":  gainerRows,
    "Decliners":  loserRows,
  };

  const rows   = tabData[tab];
  const accentUp = tab === "Advancers" ? true : tab === "Decliners" ? false : null;

  return (
    <div className="card overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm font-bold" style={{ color: "var(--navy)" }}>Market Performers</h2>
      </div>
      <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
        {(["Top Active","Advancers","Decliners"] as MTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 text-xs font-semibold transition-all"
            style={{
              color: tab === t ? "var(--navy)" : "var(--text-muted)",
              borderBottom: tab === t ? "2px solid var(--gold)" : "2px solid transparent",
              background: tab === t ? "rgba(212,175,55,0.05)" : "none",
            }}>{t}</button>
        ))}
      </div>

      {/* Chart — keyed so it re-mounts on tab change */}
      <div className="px-2 pt-3 pb-1">
        <BarChart key={tab} data={rows} accentUp={accentUp} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ background: "var(--light-bg)" }}>
              <th className="px-3 py-2 text-left font-semibold" style={{ color: "var(--text-muted)" }}>Symbol</th>
              <th className="px-3 py-2 text-right font-semibold" style={{ color: "var(--text-muted)" }}>Price</th>
              <th className="px-3 py-2 text-right font-semibold" style={{ color: "var(--text-muted)" }}>%</th>
              {tab === "Top Active" && (
                <th className="px-3 py-2 text-right font-semibold hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Volume</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.symbol}
                className="border-t hover:bg-blue-50/30 transition-colors cursor-pointer"
                style={{ borderColor: "var(--border)" }}
                onClick={() => onSelect({ symbol: s.symbol, name: s.name, close: s.price, pct: s.pct })}
              >
                <td className="px-3 py-2.5">
                  <span className="inline-block font-mono font-semibold text-[10.5px] px-1.5 py-0.5 rounded"
                    style={{
                      letterSpacing:"0.04em",
                      color: s.neg ? "#DC2626" : "var(--navy)",
                      background: s.neg ? "rgba(220,38,38,0.08)" : "var(--navy-tint)",
                    }}>
                    {s.symbol}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>
                  Rs.{fmtNum(s.price)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums font-bold"
                  style={{ color: s.neg ? "#DC2626" : "#16A34A" }}>
                  {s.neg ? "" : "+"}{s.pct.toFixed(2)}%
                </td>
                {tab === "Top Active" && (
                  <td className="px-3 py-2.5 text-right tabular-nums hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>
                    {(s.vol / 1e6).toFixed(1)}M
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex-1" style={{ borderTop: "1px solid var(--border)", minHeight: 0 }} />
      </div>
    </div>
  );
}

// ── Standalone Market Performance (for sidebar use) ──
export function MarketPerformancePanel() {
  const [selected, setSelected] = useState<StockInfo | null>(null);
  return (
    <>
      <MarketPerfPanel onSelect={setSelected} />
      {selected && <StockDetailModal stock={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

// ── Main section wrapper ──
export default function GainersLosersSection({ gainersOnly, losersOnly }: { gainersOnly?: boolean; losersOnly?: boolean } = {}) {
  const [selected, setSelected] = useState<StockInfo | null>(null);

  return (
    <div>
      {gainersOnly ? (
        <TopGainers onSelect={setSelected} />
      ) : losersOnly ? (
        <TopLosers onSelect={setSelected} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <TopGainers onSelect={setSelected} />
          <TopLosers  onSelect={setSelected} />
        </div>
      )}
      {selected && <StockDetailModal stock={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
