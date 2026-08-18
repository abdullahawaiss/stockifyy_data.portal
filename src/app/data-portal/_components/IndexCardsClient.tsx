"use client";
import { useState, useEffect } from "react";
import { fmtNum, fmtVol, getMarketStatus } from "../_data";

type IndexRow = { code: string; close: number; change: number; pct: number; vol: number };

// 5 key indices we always want shown (in order)
const INDEX_ORDER = ["KSE-100", "KSE-30", "KSE ALL", "KMI-30", "KMI ALL"];

function Sparkline({ up }: { up: boolean }) {
  const pts = up
    ? "0,18 10,14 20,15 30,10 40,12 50,7 60,9 72,3"
    : "0,3 10,7 20,5 30,10 40,8 50,13 60,11 72,17";
  const color = up ? "#16A34A" : "#DC2626";
  return (
    <svg viewBox="0 0 72 20" className="w-full" style={{ height: 24 }} aria-hidden="true">
      <defs>
        <linearGradient id={`sg${up ? "u" : "d"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pts} 72,20 0,20`} fill={`url(#sg${up ? "u" : "d"})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IdxCard({ idx, isOpen }: { idx: IndexRow; isOpen: boolean }) {
  const up    = idx.pct >= 0;
  const color = up ? "#16A34A" : "#DC2626";

  return (
    <div className="card relative overflow-hidden" style={{ borderTop: `3px solid ${color}` }}>
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
            {idx.code}
          </span>
          {isOpen ? (
            <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "#16A34A" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="text-[9px] font-semibold" style={{ color: "#94a3b8" }}>CLOSED</span>
          )}
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
          <Sparkline up={up} />
        </div>

        {idx.vol > 0 && (
          <div className="text-[9px] tabular-nums mt-0.5" style={{ color: "var(--text-muted)" }}>
            Vol: {fmtVol(idx.vol)}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse" style={{ borderTop: "3px solid #e5e7eb" }}>
      <div className="p-3 sm:p-4 space-y-2">
        <div className="h-3 w-16 bg-gray-100 rounded" />
        <div className="h-6 w-24 bg-gray-100 rounded" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-5 w-full bg-gray-100 rounded mt-1" />
      </div>
    </div>
  );
}

export default function IndexCardsClient({ initialData }: { initialData?: { indices: IndexRow[] } }) {
  const [indices, setIndices] = useState<IndexRow[]>(() => initialData?.indices ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [isOpen,  setIsOpen]  = useState(() => getMarketStatus().open);

  useEffect(() => {
    const id = setInterval(() => setIsOpen(getMarketStatus().open), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (initialData) return; // already have data from server
    function load() {
      fetch("/api/portal/market-summary")
        .then(r => r.json())
        .then(d => {
          // If DB has index data use it, otherwise build from stocks summary
          if (Array.isArray(d.indices) && d.indices.length > 0) {
            const map = new Map<string, IndexRow>();
            for (const idx of d.indices) {
              const code = normalizeCode(String(idx.code ?? ""));
              if (!code) continue;
              map.set(code, {
                code,
                close:  parseFloat(String(idx.close))  || 0,
                change: parseFloat(String(idx.change)) || 0,
                pct:    parseFloat(String(idx.pct))    || 0,
                vol:    parseInt(String(idx.vol))       || 0,
              });
            }
            // Try ordered list first, fallback to whatever we got
            const ordered = INDEX_ORDER.map(c => map.get(c)).filter(Boolean) as IndexRow[];
            if (ordered.length > 0) {
              setIndices(ordered);
            } else {
              // DB/PSX returned different codes — show top 5 by close value
              setIndices([...map.values()].filter(r => r.close > 0).sort((a,b) => b.close - a.close).slice(0, 5));
            }
          }
          // else: no index data available — show nothing rather than fake data
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [initialData]);

  if (loading) {
    return (
      <div className="grid grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (indices.length === 0) return null;

  return (
    <div className="grid grid-cols-5 gap-3 sm:gap-4">
      {indices.map(idx => <IdxCard key={idx.code} idx={idx} isOpen={isOpen} />)}
    </div>
  );
}

function normalizeCode(raw: string): string {
  const m: Record<string, string> = {
    "KSE100": "KSE-100", "KSE-100": "KSE-100", "KSE 100": "KSE-100",
    "KSE100PR": "KSE-100",
    "KSE30":  "KSE-30",  "KSE-30":  "KSE-30",  "KSE 30":  "KSE-30",
    "ALLSHR": "KSE ALL", "KSE ALL": "KSE ALL",  "KSE-ALL": "KSE ALL",
    "KMI30":  "KMI-30",  "KMI-30":  "KMI-30",   "KMI 30":  "KMI-30",
    "KMIALLSHR": "KMI ALL", "KMI ALL": "KMI ALL", "KMI-ALL": "KMI ALL", "KMIALL": "KMI ALL",
  };
  return m[raw.trim().toUpperCase()] ?? m[raw.trim()] ?? raw;
}
