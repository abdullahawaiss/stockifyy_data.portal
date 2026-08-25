"use client";

import { useState, useEffect, useRef } from "react";
import { getMarketStatus } from "@/app/data-portal/_data";

interface TickerItem {
  symbol: string;
  price: string;
  pct: number;
  isReal: boolean;
}

// Module-level cache so multiple mounts share one fetch result
let _tickerCache: { items: TickerItem[]; ts: number } | null = null;
const TICKER_TTL = 60_000;

async function fetchTickerItems(): Promise<TickerItem[]> {
  const now = Date.now();
  if (_tickerCache && now - _tickerCache.ts < TICKER_TTL) return _tickerCache.items;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const res = await fetch("/api/portal/market-summary", { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    clearTimeout(timer);

    const indices: { code: string; close: number; pct: number }[] = data.indices ?? [];
    if (!indices.length) return _tickerCache?.items ?? [];

    const items: TickerItem[] = indices.map(idx => ({
      symbol: idx.code,
      price: idx.close.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      pct: Number(idx.pct ?? 0),
      isReal: true,
    }));

    _tickerCache = { items, ts: Date.now() };
    return items;
  } catch {
    clearTimeout(timer);
    // Return last known real data; never return hardcoded prices
    return _tickerCache?.items ?? [];
  }
}

export default function PortalTickerBar() {
  const [s, setS]           = useState<ReturnType<typeof getMarketStatus> | null>(null);
  const [items, setItems]   = useState<TickerItem[]>([]);
  const intervalRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setS(getMarketStatus());
    const statusId = setInterval(() => setS(getMarketStatus()), 30_000);

    // Initial fetch + 60s refresh
    fetchTickerItems().then(setItems);
    intervalRef.current = setInterval(() => {
      _tickerCache = null; // invalidate so next fetch goes fresh
      fetchTickerItems().then(setItems);
    }, TICKER_TTL);

    return () => {
      clearInterval(statusId);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const open  = s?.open  ?? false;
  const label = s?.label ?? "Market Closed";
  const cfg   = open
    ? { dot: "#22c55e", glow: "0 0 7px rgba(34,197,94,0.75)", text: "#D4AF37" }
    : { dot: "#ef4444", glow: "0 0 7px rgba(239,68,68,0.75)", text: "#D4AF37" };

  // Double the list for seamless scroll; show placeholder dashes while loading
  const display = items.length ? [...items, ...items] : [];

  return (
    <div
      className="sticky top-0 z-30 flex overflow-hidden"
      style={{ height: 28, background: "#0D1E30", borderBottom: "1px solid rgba(212,175,55,0.15)" }}
    >
      {/* Market Status */}
      <div
        className="flex items-center gap-1.5 shrink-0"
        style={{
          padding: "0 10px 0 12px",
          background: "rgba(255,255,255,0.022)",
          borderRight: "1px solid rgba(212,175,55,0.16)",
        }}
      >
        <span style={{ position: "relative", display: "inline-flex", width: 6, height: 6, flexShrink: 0 }}>
          <span style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: s ? cfg.dot : "#f59e0b",
            animation: "tickerPulse 1.4s ease-in-out infinite", opacity: 0.6,
          }} />
          <span style={{
            position: "relative", width: 6, height: 6, borderRadius: "50%",
            background: s ? cfg.dot : "#f59e0b",
            boxShadow: s ? cfg.glow : "none", display: "inline-block",
          }} />
          <style>{`@keyframes tickerPulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(2.2);opacity:0} }`}</style>
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.025em", whiteSpace: "nowrap", color: s ? cfg.text : "#fbbf24" }}>
          {label}
        </span>
      </div>

      {/* Scrolling Ticker */}
      <div className="flex-1 overflow-hidden flex items-center">
        {display.length === 0 ? (
          // Loading state — no hardcoded prices, no fabricated data
          <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", padding: "0 16px" }}>
            Loading market data…
          </span>
        ) : (
          <div className="ticker-premium">
            {display.map((item, i) => {
              const up      = item.pct > 0;
              const neutral = item.pct === 0;
              const color   = neutral ? "rgba(255,255,255,0.42)" : up ? "#4ade80" : "#f87171";
              const arrow   = neutral ? "—" : up ? "▲" : "▼";
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
        )}
      </div>
    </div>
  );
}
