"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { fmtNum, fmtVol } from "../_data";
import StockDetailModal, { type StockInfo } from "./StockDetailModal";
import type { MarketSummary } from "@/app/api/portal/market-summary/route";

type Row = MarketSummary["gainers"][number];

function StockTable({ rows, positive, loading }: { rows: Row[]; positive: boolean; loading: boolean }) {
  const color = positive ? "#16A34A" : "#DC2626";
  const label = positive ? "Top Advancers" : "Top Decliners";
  const icon  = positive ? "▲" : "▼";

  return (
    <div className="card overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <span aria-hidden="true" style={{ color, fontSize: 11 }}>{icon}</span>
        <h2 className="text-sm font-bold" style={{ color }}>{label}</h2>
      </div>
      <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide border-b"
        style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--light-bg)" }}>
        <div className="col-span-3">Symbol</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-4 text-right">Change</div>
        <div className="col-span-3 text-right">Volume</div>
      </div>
      <div className="flex-1 divide-y" style={{ borderColor: "var(--border)" }}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 items-center px-4 py-2 animate-pulse">
              <div className="col-span-3 h-4 bg-gray-100 rounded" />
              <div className="col-span-2 h-4 bg-gray-100 rounded ml-auto w-10" />
              <div className="col-span-4 h-4 bg-gray-100 rounded ml-auto w-16" />
              <div className="col-span-3 h-4 bg-gray-100 rounded ml-auto w-12" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>No data available</div>
        ) : (
          rows.map(s => (
            <Link key={s.symbol} href={`/data-portal/company/${s.symbol}`}
              className="grid grid-cols-12 items-center px-4 py-2 transition-colors"
              style={{ textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.background = positive ? "rgba(22,163,74,0.04)" : "rgba(220,38,38,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}
            >
              <div className="col-span-3">
                <span className="inline-block font-mono font-semibold text-[10.5px] tracking-wide px-1.5 py-0.5 rounded"
                  style={{ color: "var(--navy)", background: "var(--navy-tint)" }}>{s.symbol}</span>
              </div>
              <div className="col-span-2 text-right font-semibold text-[11px] tabular-nums" style={{ color: "var(--text-primary)" }}>
                {fmtNum(s.close)}
              </div>
              <div className="col-span-4 text-right text-[10px] font-bold tabular-nums" style={{ color }}>
                {positive ? "▲" : "▼"}{Math.abs(s.change).toFixed(2)} ({Math.abs(s.pct).toFixed(2)}%)
              </div>
              <div className="col-span-3 text-right text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                {fmtVol(s.vol)}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function GainersLosersSection() {
  const [gainers, setGainers] = useState<Row[]>([]);
  const [losers,  setLosers]  = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/market-summary")
      .then(r => r.json())
      .then((d: MarketSummary) => {
        setGainers(d.gainers ?? []);
        setLosers(d.losers ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      <StockTable rows={gainers} positive loading={loading} />
      <StockTable rows={losers}  positive={false} loading={loading} />
    </div>
  );
}

// Standalone for sidebar use
export function VolumeLeadersPanel() {
  const [rows, setRows]   = useState<MarketSummary["volume"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/market-summary")
      .then(r => r.json())
      .then((d: MarketSummary) => setRows(d.volume ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm font-bold" style={{ color: "var(--navy)" }}>Volume Leaders</h2>
      </div>
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-2 animate-pulse flex gap-2">
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-12 bg-gray-100 rounded ml-auto" />
            </div>
          ))
        ) : rows.slice(0, 8).map(s => (
          <Link key={s.symbol} href={`/data-portal/company/${s.symbol}`}
            className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
            style={{ textDecoration: "none" }}>
            <span className="font-mono font-semibold text-[11px] px-1.5 py-0.5 rounded"
              style={{ color: "var(--navy)", background: "var(--navy-tint)" }}>{s.symbol}</span>
            <div className="text-right">
              <div className="text-[10px] font-bold tabular-nums" style={{ color: s.pct >= 0 ? "#16A34A" : "#DC2626" }}>
                {s.pct >= 0 ? "+" : ""}{s.pct.toFixed(2)}%
              </div>
              <div className="text-[9px] tabular-nums" style={{ color: "var(--text-muted)" }}>{fmtVol(s.vol)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Keep export for any existing imports
export { StockDetailModal };
export type { StockInfo };
