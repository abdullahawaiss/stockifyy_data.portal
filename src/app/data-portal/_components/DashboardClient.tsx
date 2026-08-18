"use client";
import { useState, useEffect, useCallback } from "react";
import { fmtNum, fmtVol, getMarketStatus } from "../_data";
import KseDetailPanel from "./KseDetailPanel";
import SectorPanel from "./SectorPanel";
import GainersLosersSection from "./GainersLosersSection";
import MarketPerformers from "./MarketPerformers";
import type { MarketSummary } from "@/lib/market-data";

// ── Normalise raw DB/PSX index codes → display labels ──────────────────
const CODE_MAP: Record<string, string> = {
  KSE100: "KSE-100", "KSE-100": "KSE-100", "KSE100PR": "KSE-100",
  KSE30:  "KSE-30",  "KSE-30":  "KSE-30",
  ALLSHR: "KSE ALL", "KSE ALL": "KSE ALL",
  KMI30:  "KMI-30",  "KMI-30":  "KMI-30",
  KMIALLSHR: "KMI ALL", "KMIALL": "KMI ALL", "KMI ALL": "KMI ALL",
};
const INDEX_ORDER = ["KSE-100", "KSE-30", "KSE ALL", "KMI-30", "KMI ALL"];

function normalize(raw: string) {
  const u = raw.trim().toUpperCase().replace(/\s+/g, "");
  return CODE_MAP[raw.trim()] ?? CODE_MAP[u] ?? raw.trim();
}

type IdxRow = { code: string; close: number; change: number; pct: number; vol: number };
type RawIdx = MarketSummary["indices"][number];

function toIdxRows(raw: RawIdx[]): IdxRow[] {
  const map = new Map<string, IdxRow>();
  for (const ix of raw) {
    const code  = normalize(String(ix.code ?? ""));
    const close = parseFloat(String(ix.close))  || 0;
    if (!code || close <= 0) continue;
    map.set(code, { code, close, change: parseFloat(String(ix.change)) || 0, pct: parseFloat(String(ix.pct)) || 0, vol: parseFloat(String(ix.vol)) || 0 });
  }
  const ordered = INDEX_ORDER.map(c => map.get(c)).filter(Boolean) as IdxRow[];
  return ordered.length > 0 ? ordered : [...map.values()].sort((a, b) => b.close - a.close).slice(0, 5);
}

// ── Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ up, active }: { up: boolean; active: boolean }) {
  const pts = up
    ? "0,18 10,14 20,15 30,10 40,12 50,7 60,9 72,3"
    : "0,3 10,7 20,5 30,10 40,8 50,13 60,11 72,17";
  const color = up ? "#16A34A" : "#DC2626";
  const id = `sg${up ? "u" : "d"}${active ? "a" : ""}`;
  return (
    <svg viewBox="0 0 72 20" className="w-full" style={{ height: 22 }} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={active ? 0.3 : 0.15} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pts} 72,20 0,20`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={active ? 2 : 1.5}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Single index card ───────────────────────────────────────────────────
function IdxCard({ idx, isOpen, active, onClick }: { idx: IdxRow; isOpen: boolean; active: boolean; onClick: () => void }) {
  const up    = idx.pct >= 0;
  const color = up ? "#16A34A" : "#DC2626";

  return (
    <button onClick={onClick} className="card relative overflow-hidden text-left w-full transition-all"
      style={{
        borderTop: `3px solid ${color}`,
        outline: active ? `2px solid ${color}` : "none",
        outlineOffset: "-1px",
        cursor: "pointer",
        background: active ? (up ? "rgba(22,163,74,0.04)" : "rgba(220,38,38,0.04)") : undefined,
        transform: active ? "translateY(-1px)" : undefined,
        boxShadow: active ? `0 4px 16px ${up ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)"}` : undefined,
      }}>
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
            {idx.code}
          </span>
          {isOpen
            ? <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "#16A34A" }}><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />LIVE</span>
            : <span className="text-[9px] font-semibold" style={{ color: "#94a3b8" }}>CLOSED</span>}
        </div>
        <div className="text-lg sm:text-xl font-semibold tabular-nums leading-none" style={{ color: "var(--navy)", letterSpacing: "-0.5px" }}>
          {fmtNum(idx.close, 2)}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] font-bold tabular-nums" style={{ color }}>
            {up ? "▲" : "▼"} {fmtNum(Math.abs(idx.change), 2)}
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: up ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)", color }}>
            {up ? "+" : ""}{idx.pct.toFixed(2)}%
          </span>
        </div>
        <div className="mt-1.5 -mx-1">
          <Sparkline up={up} active={active} />
        </div>
        {idx.vol > 0 && (
          <div className="text-[9px] tabular-nums mt-0.5" style={{ color: "var(--text-muted)" }}>
            Vol: {fmtVol(idx.vol)}
          </div>
        )}
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse" style={{ borderTop: "3px solid #e5e7eb" }}>
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-3 w-16 rounded" style={{ background: "var(--light-bg)" }} />
        <div className="h-6 w-24 rounded" style={{ background: "var(--light-bg)" }} />
        <div className="h-3 w-20 rounded" style={{ background: "var(--light-bg)" }} />
        <div className="h-5 w-full rounded mt-1" style={{ background: "var(--light-bg)" }} />
      </div>
    </div>
  );
}

// ── Main dashboard client component ─────────────────────────────────────
export default function DashboardClient({ initialData }: { initialData: MarketSummary | null }) {
  const [data, setData]         = useState<MarketSummary | null>(initialData);
  const [activeCode, setActive] = useState<string | null>(null);
  const [isOpen, setIsOpen]     = useState(() => getMarketStatus().open);

  // Market open/close ticker
  useEffect(() => {
    const id = setInterval(() => setIsOpen(getMarketStatus().open), 60_000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(() => {
    fetch("/api/portal/market-summary")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Always do one immediate fetch on mount — updates placeholder data to live,
    // or confirms the SSR data is still current. Silent (no loading state).
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const indices = data ? toIdxRows(data.indices) : [];
  const active  = activeCode ?? indices[0]?.code ?? null;

  // Build raw indices for KseDetailPanel (it expects the original format)
  const rawIndices = data?.indices ?? [];

  return (
    <>
      {/* ── Index Cards ── */}
      <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {indices.length === 0
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : indices.map(idx => (
              <IdxCard key={idx.code} idx={idx} isOpen={isOpen}
                active={idx.code === active}
                onClick={() => setActive(idx.code)} />
            ))}
      </div>

      {/* ── Index Chart — synced to selected card ── */}
      <KseDetailPanel initialIndices={rawIndices} activeIndexCode={active} />

      {/* ── Sector Performance ── */}
      <SectorPanel initialData={data?.sectors} />

      {/* ── Gainers | Losers | Market Performers ── */}
      <div style={{ display: "flex", gap: 12, alignItems: "stretch", width: "100%" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <GainersLosersSection gainersOnly
            initialData={data ? { gainers: data.gainers, losers: data.losers } : undefined} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <GainersLosersSection losersOnly
            initialData={data ? { gainers: data.gainers, losers: data.losers } : undefined} />
        </div>
        <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <MarketPerformers initialData={data} />
        </div>
      </div>
    </>
  );
}
