"use client";
import { useState } from "react";
import Link from "next/link";
import { SECTORS_DATA } from "../_data";

type Period = "Daily" | "Weekly" | "Monthly";

export default function SectorPanel() {
  const [period, setPeriod] = useState<Period>("Daily");
  const sectors = SECTORS_DATA[period];

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold" style={{ color: "var(--navy)" }}>Sector Performance</h2>
          <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "#16A34A" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(["Daily", "Weekly", "Monthly"] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-2.5 py-1 rounded text-[10px] font-semibold transition-all"
              style={{
                background: period === p ? "var(--navy)" : "var(--light-bg)",
                color: period === p ? "#fff" : "var(--text-muted)",
                border: `1px solid ${period === p ? "var(--navy)" : "var(--border)"}`,
              }}
            >
              {p}
            </button>
          ))}
          <Link href="/dashboard/sectors" className="text-xs ml-2" style={{ color: "var(--gold)" }}>
            Full →
          </Link>
        </div>
      </div>

      {/* Heat tiles */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mt-2">
        {sectors.map(sec => {
          const up = sec.pct >= 0;
          const intensity = Math.min(Math.abs(sec.pct) / (period === "Monthly" ? 10 : period === "Weekly" ? 5 : 3), 1);
          return (
            <div
              key={sec.name}
              className="rounded-lg p-2 text-center transition-all hover:scale-105"
              style={{
                background: up
                  ? `rgba(34,197,94,${0.07 + intensity * 0.2})`
                  : `rgba(239,68,68,${0.07 + intensity * 0.2})`,
                border: `1px solid ${up ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              }}
            >
              <div className="text-[9px] font-bold leading-tight truncate" style={{ color: up ? "#065F46" : "#991B1B" }}>
                {sec.name}
              </div>
              <div className="text-[11px] font-black mt-0.5" style={{ color: up ? "#16A34A" : "#DC2626" }}>
                {up ? "▲" : "▼"}{Math.abs(sec.pct).toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
