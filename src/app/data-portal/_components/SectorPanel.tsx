"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { MarketSummary } from "@/app/api/portal/market-summary/route";

export default function SectorPanel() {
  const [sectors, setSectors] = useState<MarketSummary["sectors"]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/market-summary")
      .then(r => r.json())
      .then((d: MarketSummary) => setSectors(d.sectors ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
        <Link href="/data-portal/sectors" className="text-xs" style={{ color: "var(--gold)" }}>
          Full →
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mt-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg p-2 animate-pulse" style={{ background: "var(--light-bg)", height: 48 }} />
          ))}
        </div>
      ) : sectors.length === 0 ? (
        <div className="py-6 text-center text-xs" style={{ color: "var(--text-muted)" }}>No sector data available</div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mt-2">
          {sectors.map(sec => {
            const up = sec.pct >= 0;
            const intensity = Math.min(Math.abs(sec.pct) / 3, 1);
            return (
              <div
                key={sec.name}
                className="rounded-lg p-2 text-center transition-all hover:scale-105"
                style={{
                  background: up ? `rgba(34,197,94,${0.07 + intensity * 0.2})` : `rgba(239,68,68,${0.07 + intensity * 0.2})`,
                  border: `1px solid ${up ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}
              >
                <div className="text-[9px] font-bold leading-tight truncate" style={{ color: up ? "#065F46" : "#991B1B" }}>
                  {sec.name.replace("Oil & Gas Exploration Companies","O&G Exp").replace("Commercial Banks","Banks").replace("Fertilizer","Fertilizer")}
                </div>
                <div className="text-[11px] font-black mt-0.5" style={{ color: up ? "#16A34A" : "#DC2626" }}>
                  {up ? "▲" : "▼"}{Math.abs(sec.pct).toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
