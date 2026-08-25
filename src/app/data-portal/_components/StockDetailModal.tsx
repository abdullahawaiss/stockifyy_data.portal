"use client";
import { useEffect } from "react";

export type StockInfo = {
  symbol: string;
  name: string;
  close: number;
  pct: number;
};

export default function StockDetailModal({ stock, onClose }: { stock: StockInfo; onClose: () => void }) {
  const up          = stock.pct >= 0;
  const accentColor = up ? "#16A34A" : "#DC2626";
  const prevClose   = +(stock.close / (1 + stock.pct / 100)).toFixed(2);
  const change      = +(stock.close - prevClose).toFixed(2);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: "min(520px, 100vw)",
          background: "var(--card-bg)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.25)",
          animation: "slideInRight 0.25s cubic-bezier(0.34,1.1,0.64,1) both",
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <span
              className="px-2.5 py-1 rounded-lg text-sm font-black text-white"
              style={{ background: accentColor }}
            >
              {stock.symbol}
            </span>
            <div>
              <div className="text-sm font-bold" style={{ color: "var(--navy)" }}>{stock.name}</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>PSX · End of Day</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:opacity-70"
            style={{ background: "var(--light-bg)", color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Price area */}
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="text-4xl font-black tabular-nums" style={{ color: "var(--navy)", letterSpacing: "-1px" }}>
              {stock.close.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 pb-1">
              <span className="text-sm font-bold tabular-nums" style={{ color: accentColor }}>
                {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded"
                style={{ background: up ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: accentColor }}>
                {stock.pct > 0 ? "+" : ""}{stock.pct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Chart unavailable */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6" style={{ color: "var(--text-muted)" }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="2" y="2" width="32" height="32" rx="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M7 25 L12 17 L18 20 L24 12 L29 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="29" cy="16" r="2" fill="currentColor"/>
          </svg>
          <span className="text-xs font-medium text-center">Intraday chart data is temporarily unavailable.</span>
          <span className="text-[10px] opacity-60 text-center">Use the Technical Chart for detailed historical data.</span>
        </div>

        {/* Footer stats */}
        <div className="grid grid-cols-3 gap-3 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          {[
            { label: "Prev Close", value: prevClose.toFixed(2) },
            { label: "Close",      value: stock.close.toFixed(2) },
            { label: "Change%",    value: `${stock.pct > 0 ? "+" : ""}${stock.pct.toFixed(2)}%` },
            { label: "HIGH",       value: "--" },
            { label: "LOW",        value: "--" },
            { label: "Exchange",   value: "PSX" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-[9px] uppercase tracking-wide font-semibold" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              <div className="text-xs font-bold tabular-nums mt-0.5" style={{ color: "var(--navy)" }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
