"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatNumber, formatPct, formatChange, getWeekLabel } from "@/lib/utils";

export default function IndicesPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [period, setPeriod] = useState(sp.get("period") ?? "daily");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(sp.get("date") ?? "");

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period, ...(date && { date }) });
      const res = await fetch(`/api/portal/indices?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      if (!date && json.date) setDate(json.date);
    } catch { setData([]); } finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, [period, date]);

  function switchPeriod(p: string) {
    setPeriod(p);
    const params = new URLSearchParams(sp.toString());
    params.set("period", p);
    router.push(`/data-portal/indices?${params.toString()}`);
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--navy)" }}>Market Indices</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{date || "Latest available"}</p>
        </div>
        <div className="inline-flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
          {["daily", "weekly"].map((p) => (
            <button key={p} onClick={() => switchPeriod(p)} className="px-4 py-1.5 text-sm font-medium capitalize transition-colors"
              style={{ background: period === p ? "var(--navy)" : "var(--white)", color: period === p ? "var(--gold)" : "var(--text-secondary)" }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="card p-5"><div className="skeleton h-4 w-20 mb-2" /><div className="skeleton h-8 w-32 mb-2" /><div className="skeleton h-4 w-16" /></div>)
        ) : data.length === 0 ? (
          <div className="col-span-4 card p-8 text-center" style={{ color: "var(--text-muted)" }}>No index data available for this {period} period.</div>
        ) : (
          data.map((idx) => {
            const pct = formatPct(period === "daily" ? idx.percentageChange : idx.weeklyPctChange);
            const chg = formatChange(period === "daily" ? idx.change : idx.weeklyChange);
            const val = period === "daily" ? idx.close : idx.weeklyClose;
            return (
              <div key={idx.indexCode} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{idx.indexCode}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{idx.indexName}</p>
                  </div>
                  {idx.isDemo && <span className="badge-demo">Demo</span>}
                </div>
                <p className="text-2xl font-bold mb-1" style={{ color: "var(--navy)" }}>{formatNumber(val, 2)}</p>
                <p className="text-sm font-semibold" style={{ color: pct.positive === true ? "var(--positive)" : pct.positive === false ? "var(--negative)" : "var(--neutral)" }}>
                  {chg.text} ({pct.text})
                </p>
                {period === "daily" && (
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2" style={{ borderColor: "var(--border)" }}>
                    <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>High</p><p className="text-xs font-medium">{formatNumber(idx.high, 2)}</p></div>
                    <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>Low</p><p className="text-xs font-medium">{formatNumber(idx.low, 2)}</p></div>
                    <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>Open</p><p className="text-xs font-medium">{formatNumber(idx.open, 2)}</p></div>
                    <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>Prev Close</p><p className="text-xs font-medium">{formatNumber(idx.previousClose, 2)}</p></div>
                  </div>
                )}
                {period === "weekly" && (
                  <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2" style={{ borderColor: "var(--border)" }}>
                    <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>W. High</p><p className="text-xs font-medium">{formatNumber(idx.weeklyHigh, 2)}</p></div>
                    <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>W. Low</p><p className="text-xs font-medium">{formatNumber(idx.weeklyLow, 2)}</p></div>
                    <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>W. Open</p><p className="text-xs font-medium">{formatNumber(idx.weeklyOpen, 2)}</p></div>
                    <div><p className="text-xs" style={{ color: "var(--text-muted)" }}>Prev W. Close</p><p className="text-xs font-medium">{formatNumber(idx.previousWeekClose, 2)}</p></div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
