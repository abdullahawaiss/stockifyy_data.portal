"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { fmtNum, fmtVol } from "../_data";
import type { MarketSummary } from "@/app/api/portal/market-summary/route";

type Tab = "Top Active" | "Advancers" | "Decliners";
type Row = MarketSummary["volume"][number];

function MiniBar({ pct, max, color, bgColor }: { pct: number; max: number; color: string; bgColor: string }) {
  const w = max > 0 ? Math.round((Math.abs(pct) / max) * 52) : 0;
  return (
    <svg width={54} height={14} style={{ display: "block", flexShrink: 0 }}>
      <rect x={0} y={2} width={54} height={10} rx={3} fill={bgColor} />
      <rect x={0} y={2} width={w} height={10} rx={3} fill={color} />
    </svg>
  );
}

// Module-level cache so re-mounts don't re-fetch
let _mktCache: MarketSummary | null = null;

export default function MarketPerformers({ initialData }: { initialData?: MarketSummary | null }) {
  const [tab, setTab] = useState<Tab>("Top Active");
  const seed = initialData ?? _mktCache ?? null;
  const [summary, setSummary] = useState<MarketSummary | null>(seed);
  const [loading, setLoading] = useState(!seed);

  // Purely presentational — DashboardClient owns all fetching.
  useEffect(() => {
    if (initialData) { _mktCache = initialData; setSummary(initialData); setLoading(false); }
  }, [initialData]);

  const rows: Row[] =
    tab === "Top Active" ? (summary?.volume  ?? []).slice(0, 12) :
    tab === "Advancers"  ? (summary?.gainers  ?? []).slice(0, 10) :
                           (summary?.losers   ?? []).slice(0, 10);

  const isActive = tab === "Top Active";
  const maxVal = rows.length
    ? isActive
      ? Math.max(...rows.map(r => r.vol)) || 1
      : Math.max(...rows.map(r => Math.abs(r.pct))) || 1
    : 1;

  const accentColor = isActive ? "var(--navy)" : tab === "Advancers" ? "#16A34A" : "#DC2626";
  const accentBg    = isActive ? "rgba(7,17,31,0.07)" : tab === "Advancers" ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)";

  return (
    <div className="card overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm font-bold" style={{ color: "var(--navy)" }}>Market Performers</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--border)", background: "var(--light-bg)" }}>
        {(["Top Active", "Advancers", "Decliners"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 text-[11px] font-semibold transition-all"
            style={{
              color: tab === t ? "var(--gold)" : "var(--text-muted)",
              background: "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--gold)" : "2px solid transparent",
              cursor: "pointer",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="grid px-3 py-1.5 text-[9.5px] font-semibold uppercase tracking-wide border-b"
        style={{
          gridTemplateColumns: "2fr 1.4fr 54px 1.2fr",
          gap: "0 6px",
          color: "var(--text-muted)",
          borderColor: "var(--border)",
          background: "var(--light-bg)",
        }}>
        <div>Symbol</div>
        <div className="text-right">Price</div>
        <div />
        <div className="text-right">{isActive ? "Volume" : "Change"}</div>
      </div>

      {/* Rows */}
      <div className="flex-1 divide-y" style={{ borderColor: "var(--border)" }}>
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="grid items-center px-3 py-2 animate-pulse"
              style={{ gridTemplateColumns: "2fr 1.4fr 54px 1.2fr", gap: "0 6px" }}>
              <div className="h-4 bg-gray-100 rounded w-12" />
              <div className="h-4 bg-gray-100 rounded ml-auto w-10" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded ml-auto w-10" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>No data available</div>
        ) : (
          rows.map(r => {
            const up = r.pct >= 0;
            const rowColor = isActive ? accentColor : up ? "#16A34A" : "#DC2626";
            const rowBg    = isActive ? accentBg    : up ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)";
            const barVal   = isActive ? r.vol : Math.abs(r.pct);
            return (
              <Link key={r.symbol} href={`/data-portal/company/${r.symbol}`}
                className="grid items-center px-3 py-2 transition-colors"
                style={{ gridTemplateColumns: "2fr 1.4fr 54px 1.2fr", gap: "0 6px", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = rowBg)}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
              >
                {/* Symbol */}
                <span className="font-mono font-semibold text-[10.5px] px-1.5 py-0.5 rounded truncate"
                  style={{ color: "var(--navy)", background: "var(--navy-tint)" }}>
                  {r.symbol}
                </span>

                {/* Price */}
                <span className="text-right font-semibold text-[10.5px] tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {fmtNum(r.close)}
                </span>

                {/* Mini bar */}
                <MiniBar pct={barVal} max={maxVal} color={rowColor} bgColor={rowBg} />

                {/* Change / Volume */}
                <span className="text-right text-[10px] font-bold tabular-nums" style={{ color: rowColor }}>
                  {isActive
                    ? fmtVol(r.vol)
                    : `${up ? "+" : ""}${r.pct.toFixed(2)}%`}
                </span>
              </Link>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t flex items-center" style={{ borderColor: "var(--border)", background: "var(--light-bg)" }}>
        <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "#16A34A" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
          LIVE
        </span>
        <Link href="/data-portal/stocks" className="ml-auto text-[10px]" style={{ color: "var(--gold)" }}>
          All Stocks →
        </Link>
      </div>
    </div>
  );
}
