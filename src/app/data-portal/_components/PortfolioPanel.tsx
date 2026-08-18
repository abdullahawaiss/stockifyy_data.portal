"use client";
import { useState } from "react";
import { PORTFOLIO_FIPI } from "../_data";

type Mode = "FIPI" | "LIPI";
type Period = "10 Days" | "3 Months" | "1 Year";
type View = "By Client" | "By Sector";

function PortfolioChart({ data }: { data: typeof PORTFOLIO_FIPI }) {
  const W = 600, H = 160;
  const barW = Math.floor(W / (data.length * 1.6));
  const gap = (W - data.length * barW) / (data.length + 1);
  const maxAbs = Math.max(...data.map(d => Math.abs(d.net)));
  const zeroY = H * 0.55;

  // Cumulative line
  const cumMin = Math.min(...data.map(d => d.cumulative));
  const cumMax = Math.max(...data.map(d => d.cumulative));
  const cumRange = cumMax - cumMin || 1;
  const linePoints = data.map((d, i) => {
    const x = gap + i * (barW + gap) + barW / 2;
    const y = H * 0.9 - ((d.cumulative - cumMin) / cumRange) * (H * 0.75);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-64" style={{ height: 170 }} aria-label="Portfolio investments chart">
        {/* Dashed grid */}
        {[0.2,0.45,0.7,0.9].map(f => (
          <line key={f} x1="0" y1={H*f} x2={W} y2={H*f} stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        {/* Zero line */}
        <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="rgba(0,0,0,0.18)" strokeWidth="1" />

        {/* Bars */}
        {data.map((d, i) => {
          const x = gap + i * (barW + gap);
          const barH = (Math.abs(d.net) / maxAbs) * zeroY * 0.85;
          const y = d.net >= 0 ? zeroY - barH : zeroY;
          const color = d.net >= 0 ? "#16A34A" : "#DC2626";
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={Math.max(barH, 2)} fill={color} rx="2" opacity="0.8" />
              <text x={x + barW/2} y={H - 2} textAnchor="middle" fontSize="7" fill="#718096">{d.date}</text>
            </g>
          );
        })}

        {/* Animated glow behind line */}
        <polyline
          points={linePoints.join(" ")}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.15"
          style={{ filter: "blur(3px)" }}
        />
        {/* Cumulative line — animated marching */}
        <polyline
          points={linePoints.join(" ")}
          fill="none"
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 4"
          opacity="0.9"
          style={{
            animation: "marchLine 1.2s linear infinite",
          }}
        />
        {/* Dots on line */}
        {data.map((d, i) => {
          const x = gap + i * (barW + gap) + barW / 2;
          const y = H * 0.9 - ((d.cumulative - cumMin) / cumRange) * (H * 0.75);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3.5" fill="#D4AF37" opacity="0.2" />
              <circle cx={x} cy={y} r="2" fill="#D4AF37" opacity="0.9" />
            </g>
          );
        })}
        <style>{`
          @keyframes marchLine {
            from { stroke-dashoffset: 0; }
            to   { stroke-dashoffset: -20; }
          }
        `}</style>
      </svg>
    </div>
  );
}

export default function PortfolioPanel() {
  const [mode, setMode] = useState<Mode>("FIPI");
  const [period, setPeriod] = useState<Period>("10 Days");
  const [view, setView] = useState<View>("By Client");

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm font-bold" style={{ color: "var(--navy)" }}>Portfolio Investments</h2>
        <div className="flex gap-1">
          {(["FIPI","LIPI"] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1 rounded text-xs font-bold transition-all"
              style={{
                background: mode === m ? "var(--navy)" : "transparent",
                color: mode === m ? "#fff" : "var(--text-muted)",
                border: "1px solid",
                borderColor: mode === m ? "var(--navy)" : "var(--border)",
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 pt-2">
        <PortfolioChart data={PORTFOLIO_FIPI} />
      </div>

      {/* Axis labels */}
      <div className="flex items-center gap-3 px-4 pb-2 text-[9px]" style={{ color: "var(--text-muted)" }}>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#16A34A" }} /> Net Positive</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm inline-block" style={{ background: "#DC2626" }} /> Net Negative</span>
        <span className="flex items-center gap-1"><span className="w-4 h-px inline-block border-t-2 border-dashed" style={{ borderColor: "#D4AF37" }} /> Cumulative</span>
        <span className="ml-auto text-[9px]">Net foreign (in $USD)</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t flex-wrap" style={{ borderColor: "var(--border)", background: "var(--light-bg)" }}>
        <div className="flex gap-1">
          {(["10 Days","3 Months","1 Year"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-2.5 py-1 rounded text-[10px] font-semibold transition-all"
              style={{ background: period === p ? "var(--navy)" : "#fff", color: period === p ? "#fff" : "var(--text-muted)", border: "1px solid var(--border)" }}
            >{p}</button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["By Client","By Sector"] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="px-2.5 py-1 rounded text-[10px] font-semibold transition-all"
              style={{ background: view === v ? "var(--navy)" : "#fff", color: view === v ? "#fff" : "var(--text-muted)", border: "1px solid var(--border)" }}
            >{v}</button>
          ))}
        </div>
        <span className="ml-auto text-[9px] font-semibold px-2 py-0.5 rounded" style={{ background: "var(--border)", color: "var(--text-secondary)" }}>
          Source: NCCPL
        </span>
      </div>
    </div>
  );
}
