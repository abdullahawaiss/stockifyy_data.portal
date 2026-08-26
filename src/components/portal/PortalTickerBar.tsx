"use client";

import { useState, useEffect } from "react";
import { getMarketStatus } from "@/app/data-portal/_data";

const TICKER_ITEMS = [
  { symbol: "KSE 100",  price: "180,059.79", pct: -0.69 },
  { symbol: "KSE ALL",  price: "108,894.65", pct: -0.46 },
  { symbol: "KMI ALL",  price:  "69,823.76", pct: -0.56 },
  { symbol: "KMI 30",   price: "253,326.40", pct: -0.94 },
  { symbol: "OLPL",     price:     "49.95",  pct: -0.03 },
  { symbol: "PABC",     price:    "108.89",  pct: -2.06 },
  { symbol: "HALEON",   price:    "748.99",  pct: -0.49 },
  { symbol: "SCBPL",    price:     "66.00",  pct:  0.00 },
  { symbol: "HINO",     price:    "380.99",  pct: -0.06 },
  { symbol: "COLG",     price:  "1,227.77",  pct: -0.58 },
  { symbol: "PTL",      price:     "53.75",  pct:  0.45 },
  { symbol: "ATBA",     price:    "204.80",  pct:  0.45 },
  { symbol: "FEROZ",    price:    "380.00",  pct:  0.07 },
  { symbol: "INDU",     price:  "1,924.25",  pct: -0.23 },
];

const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

export default function PortalTickerBar() {
  const [s, setS] = useState<ReturnType<typeof getMarketStatus> | null>(null);

  useEffect(() => {
    setS(getMarketStatus());
    const id = setInterval(() => setS(getMarketStatus()), 30_000);
    return () => clearInterval(id);
  }, []);

  const open = s?.open ?? false;
  const label = s?.label ?? "Market Closed";
  const cfg = open
    ? { dot: "#22c55e", glow: "0 0 7px rgba(34,197,94,0.75)", text: "#D4971A" }
    : { dot: "#ef4444", glow: "0 0 7px rgba(239,68,68,0.75)", text: "#D4971A" };

  return (
    <div
      className="sticky top-0 z-30 flex overflow-hidden"
      style={{
        height: 28,
        background: "#0D1E30",
        borderBottom: "1px solid rgba(212,175,55,0.15)",
      }}
    >
      {/* ── Market Status — width matches sidebar so no gap ── */}
      <div
        className="flex items-center gap-1.5 shrink-0"
        style={{
          padding: "0 10px 0 12px",
          background: "rgba(255,255,255,0.022)",
          borderRight: "1px solid rgba(212,175,55,0.16)",
          justifyContent: "flex-start",
        }}
      >
        <span style={{ position: "relative", display: "inline-flex", width: 6, height: 6, flexShrink: 0 }}>
          <span style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: s ? cfg.dot : "#f59e0b",
            animation: "tickerPulse 1.4s ease-in-out infinite",
            opacity: 0.6,
          }} />
          <span style={{
            position: "relative", width: 6, height: 6, borderRadius: "50%",
            background: s ? cfg.dot : "#f59e0b",
            boxShadow: s ? cfg.glow : "none",
            display: "inline-block",
          }} />
          <style>{`@keyframes tickerPulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(2.2);opacity:0} }`}</style>
        </span>
        <span style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: "0.025em",
          whiteSpace: "nowrap",
          color: s ? cfg.text : "#fbbf24",
        }}>
          {label}
        </span>
      </div>

      {/* ── Scrolling Ticker ── */}
      <div className="flex-1 overflow-hidden flex items-center">
        <div className="ticker-premium">
          {doubled.map((item, i) => {
            const up = item.pct > 0;
            const neutral = item.pct === 0;
            const color = neutral ? "rgba(255,255,255,0.42)" : up ? "#4ade80" : "#f87171";
            const arrow = neutral ? "—" : up ? "▲" : "▼";
            return (
              <span key={i} className="flex items-center shrink-0" style={{ padding: "0 13px", gap: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 10.5, color: "rgba(255,255,255,0.9)", letterSpacing: "0.05em" }}>
                  {item.symbol}
                </span>
                <span style={{ fontWeight: 400, fontSize: 10.5, color: "rgba(255,255,255,0.5)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.01em" }}>
                  {item.price}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>
                  {arrow}{neutral ? "" : ` ${Math.abs(item.pct).toFixed(2)}%`}
                </span>
                <span style={{ color: "rgba(212,175,55,0.18)", marginLeft: 2, fontSize: 11, lineHeight: 1 }}>|</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
