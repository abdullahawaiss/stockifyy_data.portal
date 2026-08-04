"use client";
import { useState } from "react";
import Link from "next/link";
import { GAINERS, LOSERS, fmtNum } from "../_data";

export default function GainersLosers() {
  const [tab, setTab] = useState<"gainers" | "losers">("gainers");
  const rows = tab === "gainers" ? GAINERS : LOSERS;

  return (
    <div className="lg:col-span-2 card overflow-hidden">
      <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
        {(["gainers", "losers"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-xs sm:text-sm font-semibold transition-all"
            style={{
              color: tab === t ? (t === "gainers" ? "#16A34A" : "#DC2626") : "var(--text-muted)",
              borderBottom: tab === t ? `2px solid ${t === "gainers" ? "#16A34A" : "#DC2626"}` : "2px solid transparent",
              background: "none",
            }}
          >
            {t === "gainers" ? "🟢 Top Gainers" : "🔴 Top Losers"}
          </button>
        ))}
        <Link href="/data-portal/daily" className="px-3 sm:px-4 py-3 text-xs self-center whitespace-nowrap" style={{ color: "var(--gold)" }}>All →</Link>
      </div>
      {rows.map((s, i) => {
        const up = s.pct >= 0;
        return (
          <div key={s.symbol} className="flex items-center justify-between px-4 sm:px-5 py-3 border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="w-5 text-center text-xs font-bold shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
              <div className="min-w-0">
                <Link href={`/data-portal/company/${s.symbol}`} className="font-black text-sm hover:underline block" style={{ color: "var(--navy)" }}>{s.symbol}</Link>
                <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{s.name}</div>
              </div>
            </div>
            <div className="text-right shrink-0 ml-2">
              <div className="font-bold text-sm tabular-nums" style={{ color: "var(--navy)" }}>{fmtNum(s.close)}</div>
              <div className="text-xs font-bold" style={{ color: up ? "#16A34A" : "#DC2626" }}>{up ? "▲" : "▼"} {Math.abs(s.pct).toFixed(2)}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
