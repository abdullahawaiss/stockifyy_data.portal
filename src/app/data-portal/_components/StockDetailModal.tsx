"use client";
import { useEffect, useRef, useCallback, useState } from "react";

type Candle = { o: number; h: number; l: number; c: number; v: number; t: string };

export type StockInfo = {
  symbol: string;
  name: string;
  close: number;
  pct: number;
};

// Generate intraday candles trending from open-of-day to current close
function generateCandles(close: number, pct: number): Candle[] {
  const startPrice = close / (1 + pct / 100);
  const n = 16; // 16 candles × 15 min = 4 hrs
  const times = [
    "09:30","09:45","10:00","10:15","10:30","10:45",
    "11:00","11:15","11:30","11:45","12:00","12:15",
    "12:30","12:45","13:00","13:15",
  ];
  const candles: Candle[] = [];
  let prev = startPrice;
  const range = Math.abs(close - startPrice);

  for (let i = 0; i < n; i++) {
    const progress = (i + 1) / n;
    const trend = startPrice + (close - startPrice) * progress;
    const noise = (Math.random() - 0.5) * range * 0.35;
    const c = i === n - 1 ? close : +(trend + noise).toFixed(2);
    const o = +(prev).toFixed(2);
    const h = +(Math.max(o, c) + Math.random() * range * 0.08).toFixed(2);
    const l = +(Math.min(o, c) - Math.random() * range * 0.08).toFixed(2);
    const v = 500000 + Math.random() * 4000000;
    candles.push({ o, h, l, c, v, t: times[i] });
    prev = c;
  }
  return candles;
}

function MiniCandleChart({ candles, liveClose, pct }: { candles: Candle[]; liveClose: number; pct: number }) {
  const VW = 600, chartH = 160, volH = 40, gapV = 6, padR = 60, padL = 4, labelH = 16;
  const totalH = chartH + gapV + volH + labelH;
  const up = pct >= 0;
  const accentColor = up ? "#16A34A" : "#DC2626";

  const cs = candles.map((c, i) =>
    i === candles.length - 1 ? { ...c, c: liveClose, h: Math.max(c.h, liveClose), l: Math.min(c.l, liveClose) } : c
  );

  const n = cs.length;
  const slotW = (VW - padL - padR) / n;
  const bodyW = Math.max(slotW * 0.6, 2);

  const pad = Math.abs(liveClose - cs[0].o) * 0.15 + 0.05;
  const minP = Math.min(...cs.map(c => c.l)) - pad;
  const maxP = Math.max(...cs.map(c => c.h)) + pad;
  const rng  = maxP - minP || 1;
  const toY  = (p: number) => chartH - ((p - minP) / rng) * chartH;

  const maxVol = Math.max(...cs.map(c => c.v));
  const lastClose = cs[n - 1].c;
  const livePY = toY(lastClose);

  const yPrices = Array.from({ length: 5 }, (_, i) => minP + (i / 4) * rng);

  return (
    <svg viewBox={`0 0 ${VW} ${totalH}`} preserveAspectRatio="none"
      className="w-full h-full" aria-label={`${cs[0]?.t} chart`}>
      <defs>
        <clipPath id="mc"><rect x={padL} y={0} width={VW - padL - padR} height={chartH} /></clipPath>
      </defs>
      <rect x={padL} y={0} width={VW - padL - padR} height={chartH} fill="var(--card-bg)" />

      {yPrices.map((p, i) => (
        <line key={i} x1={padL} y1={toY(p)} x2={VW - padR} y2={toY(p)}
          stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="3 3" />
      ))}

      <g clipPath="url(#mc)">
        {cs.map((c, i) => {
          const cx  = padL + i * slotW + slotW / 2;
          const bull = c.c >= c.o;
          const col  = bull ? "#16A34A" : "#DC2626";
          const top  = toY(Math.max(c.o, c.c));
          const bot  = toY(Math.min(c.o, c.c));
          const bh   = Math.max(bot - top, 1);
          return (
            <g key={i}>
              <line x1={cx} y1={toY(c.h)} x2={cx} y2={toY(c.l)} stroke={col} strokeWidth="1" />
              <rect x={cx - bodyW / 2} y={top} width={bodyW} height={bh} fill={col} opacity={0.88} rx="1" />
            </g>
          );
        })}
      </g>

      {/* Live price dashed line */}
      <line x1={padL} y1={livePY} x2={VW - padR} y2={livePY}
        stroke={accentColor} strokeWidth="1" strokeDasharray="4 3" opacity={0.6} />

      {/* Volume bars */}
      <rect x={padL} y={chartH + gapV} width={VW - padL - padR} height={volH} fill="var(--light-bg)" />
      {cs.map((c, i) => {
        const x   = padL + i * slotW;
        const bull = c.c >= c.o;
        const vH  = Math.max((c.v / maxVol) * volH * 0.88, 1);
        return (
          <rect key={i} x={x + 1} y={chartH + gapV + volH - vH} width={slotW - 2} height={vH}
            fill={bull ? "rgba(22,163,74,0.45)" : "rgba(220,38,38,0.45)"} rx="1" />
        );
      })}

      {/* Y-axis labels */}
      {yPrices.map((p, i) => (
        <text key={i} x={VW - padR + 5} y={toY(p)} fontSize="9" fill="var(--text-muted)" dominantBaseline="middle">
          {p.toFixed(2)}
        </text>
      ))}

      {/* Live price box */}
      <rect x={VW - padR + 2} y={livePY - 9} width={padR - 5} height={17} fill={accentColor} rx="3" />
      <text x={VW - padR + 30} y={livePY + 1} fontSize="9" fill="white" fontWeight="bold"
        textAnchor="middle" dominantBaseline="middle">
        {lastClose.toFixed(2)}
      </text>

      {/* X-axis */}
      {cs.filter((_, i) => i % 4 === 0).map((c, j) => {
        const cx = padL + (j * 4) * slotW + slotW / 2;
        return (
          <text key={c.t} x={cx} y={chartH + gapV + volH + 12}
            fontSize="8.5" fill="var(--text-muted)" textAnchor="middle">{c.t}</text>
        );
      })}
    </svg>
  );
}

export default function StockDetailModal({ stock, onClose }: { stock: StockInfo; onClose: () => void }) {
  const [candles]    = useState(() => generateCandles(stock.close, stock.pct));
  const [liveClose,  setLiveClose]  = useState(stock.close);
  const [flash,      setFlash]      = useState<"up"|"down"|null>(null);
  const prevRef      = useRef(stock.close);
  const tickRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const up           = stock.pct >= 0;
  const accentColor  = up ? "#16A34A" : "#DC2626";

  const tick = useCallback(() => {
    tickRef.current = setInterval(() => {
      setLiveClose(prev => {
        // bias tick in direction of pct
        const bias  = stock.pct >= 0 ? 0.55 : 0.45;
        const delta = (Math.random() - bias) * stock.close * 0.002;
        const next  = +(prev + delta).toFixed(2);
        const went  = next > prevRef.current ? "up" : "down";
        prevRef.current = next;
        setFlash(went);
        setTimeout(() => setFlash(null), 300);
        return next;
      });
    }, 1500);
  }, [stock.close, stock.pct]);

  useEffect(() => {
    tick();
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [tick]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const liveChange = +(liveClose - stock.close / (1 + stock.pct / 100)).toFixed(2);
  const livePct    = +((liveClose / (stock.close / (1 + stock.pct / 100)) - 1) * 100).toFixed(2);

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
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>PSX · Intraday</div>
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
            <div
              className="text-4xl font-black tabular-nums transition-colors duration-200 rounded px-1"
              style={{
                color: flash === "up" ? "#16A34A" : flash === "down" ? "#DC2626" : "var(--navy)",
                background: flash === "up" ? "rgba(22,163,74,0.08)" : flash === "down" ? "rgba(220,38,38,0.08)" : "transparent",
                letterSpacing: "-1px",
              }}
            >
              {liveClose.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 pb-1">
              <span className="text-sm font-bold tabular-nums" style={{ color: accentColor }}>
                {up ? "▲" : "▼"} {Math.abs(liveChange).toFixed(2)}
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{ background: up ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)", color: accentColor }}
              >
                {livePct > 0 ? "+" : ""}{livePct.toFixed(2)}%
              </span>
              <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "#16A34A" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 relative p-2 min-h-0">
          <MiniCandleChart candles={candles} liveClose={liveClose} pct={stock.pct} />
        </div>

        {/* Footer stats */}
        <div className="grid grid-cols-3 gap-3 px-5 py-4 border-t" style={{ borderColor: "var(--border)" }}>
          {[
            { label: "Open",      value: (stock.close / (1 + stock.pct / 100)).toFixed(2) },
            { label: "High",      value: (Math.max(...candles.map(c => c.h))).toFixed(2) },
            { label: "Low",       value: (Math.min(...candles.map(c => c.l))).toFixed(2) },
            { label: "Close",     value: liveClose.toFixed(2) },
            { label: "Change%",   value: `${livePct > 0 ? "+" : ""}${livePct.toFixed(2)}%` },
            { label: "Exchange",  value: "PSX" },
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
