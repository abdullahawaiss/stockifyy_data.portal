"use client";

import { useState, useEffect } from "react";

type MarketState = "open" | "pre-open" | "closed";

function getStatus(): { state: MarketState; label: string } {
  const pkt = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const d = pkt.getDay();
  const mins = pkt.getHours() * 60 + pkt.getMinutes();
  if (d === 0 || d === 6) return { state: "closed", label: "Market Closed" };
  if (mins >= 540 && mins < 570) return { state: "pre-open", label: "Pre-Open" };
  if (mins >= 570 && mins < 930) return { state: "open", label: "Market Open" };
  return { state: "closed", label: "Market Closed" };
}

const STATUS_CFG: Record<MarketState, { dot: string; glow: string; pulse: boolean; text: string }> = {
  "open":     { dot: "#22c55e", glow: "0 0 7px rgba(34,197,94,0.75)",   pulse: true, text: "#D4AF37" },
  "pre-open": { dot: "#60a5fa", glow: "0 0 6px rgba(96,165,250,0.55)",  pulse: true, text: "#D4AF37" },
  "closed":   { dot: "#ef4444", glow: "0 0 7px rgba(239,68,68,0.75)",   pulse: true, text: "#D4AF37" },
};

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
  const [status, setStatus] = useState<{ state: MarketState; label: string } | null>(null);

  useEffect(() => {
    setStatus(getStatus());
    const id = setInterval(() => setStatus(getStatus()), 30_000);
    return () => clearInterval(id);
  }, []);

  const cfg = status ? STATUS_CFG[status.state] : STATUS_CFG.closed;
  const isOpen = status?.state === "open";

  return (
    <div
      className="sticky top-0 z-30 flex overflow-hidden"
      style={{
        height: 28,
        background: "#0D1E30",
        borderBottom: "1px solid rgba(212,175,55,0.15)",
      }}
    >
      {/* ── Market Status ─────────────────── */}
      <div
        className="flex items-center gap-1.5 shrink-0"
        style={{
          padding: "0 10px 0 12px",
          background: "rgba(255,255,255,0.022)",
          borderRight: "1px solid rgba(212,175,55,0.16)",
        }}
      >
        <span
          className={status ? "ticker-status-pulse" : ""}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            display: "inline-block",
            flexShrink: 0,
            background: status ? cfg.dot : "#f59e0b",
            boxShadow: status ? cfg.glow : "none",
            transition: "background 250ms ease, box-shadow 250ms ease",
          }}
        />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: "0.025em",
            whiteSpace: "nowrap",
            color: status ? cfg.text : "#fbbf24",
            transition: "color 250ms ease",
          }}
        >
          {status ? status.label : "Market Closed"}
        </span>
      </div>

      {/* ── Scrolling Ticker ──────────────── */}
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
                  {arrow}{neutral ? "" : ` ${Math.abs(item.pct).toFixed(2)}%`}
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
