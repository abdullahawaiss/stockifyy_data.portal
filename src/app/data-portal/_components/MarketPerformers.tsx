"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { MarketSummary } from "@/app/api/portal/market-summary/route";

type Tab = "Top Active" | "Advancers" | "Decliners";
type Row = MarketSummary["volume"][number];

export default function MarketPerformers({ initialData }: { initialData?: MarketSummary | null }) {
  const [tab, setTab] = useState<Tab>("Top Active");
  const [summary, setSummary] = useState<MarketSummary | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return;
    fetch("/api/portal/market-summary")
      .then(r => r.json())
      .then(setSummary)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialData]);

  const rows: Row[] =
    tab === "Top Active"  ? (summary?.volume  ?? []).slice(0, 8) :
    tab === "Advancers"   ? (summary?.gainers  ?? []).slice(0, 8) :
                            (summary?.losers   ?? []).slice(0, 8);

  const maxAbs = rows.length ? Math.max(...rows.map(r => Math.abs(r.pct))) || 1 : 1;

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

      {/* Bar chart rows */}
      <div className="flex-1 flex flex-col px-3 py-2 gap-1.5 overflow-auto">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-2">
              <div className="h-3 w-10 bg-gray-100 rounded shrink-0" />
              <div className="h-4 bg-gray-100 rounded flex-1" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>No data available</div>
        ) : (
          rows.map(r => {
            const up = r.pct >= 0;
            const barPct = (Math.abs(r.pct) / maxAbs) * 100;
            const color = tab === "Top Active" ? "var(--navy)" : up ? "#16A34A" : "#DC2626";
            const bgColor = tab === "Top Active"
              ? "rgba(7,17,31,0.08)"
              : up ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)";
            return (
              <Link key={r.symbol} href={`/data-portal/company/${r.symbol}`}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                style={{ textDecoration: "none" }}>
                <span className="text-[10px] font-mono font-bold shrink-0 w-16 text-right tabular-nums"
                  style={{ color: "var(--navy)" }}>
                  {r.symbol}
                </span>
                <div className="flex-1 relative h-5 rounded overflow-hidden"
                  style={{ background: "var(--light-bg)" }}>
                  <div className="absolute left-0 top-0 h-full rounded transition-all"
                    style={{ width: `${barPct}%`, background: bgColor }} />
                  <div className="absolute inset-0 flex items-center justify-end pr-2">
                    <span className="text-[10px] font-bold tabular-nums" style={{ color }}>
                      {tab === "Top Active"
                        ? (r.vol >= 1e6 ? `${(r.vol / 1e6).toFixed(1)}M` : `${(r.vol / 1e3).toFixed(0)}K`)
                        : `${up ? "+" : ""}${r.pct.toFixed(2)}%`}
                    </span>
                  </div>
                </div>
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
