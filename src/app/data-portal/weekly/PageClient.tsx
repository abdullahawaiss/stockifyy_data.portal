"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatNumber, formatVolume, formatPct, getWeekLabel } from "@/lib/utils";
import { PctCell } from "@/components/ui/DataTable";
import { format, startOfWeek, addWeeks, subWeeks } from "date-fns";

interface WeeklyRecord {
  symbol: string;
  weekStartDate: string;
  weekEndDate: string;
  firstTradingDay: string;
  lastTradingDay: string;
  weeklyOpen: string;
  weeklyHigh: string;
  weeklyLow: string;
  weeklyClose: string;
  previousWeekClose: string;
  weeklyPriceChange: string;
  weeklyPctChange: string;
  totalWeeklyVolume: string;
  avgDailyVolume: string;
  totalWeeklyValue: string;
  totalWeeklyTrades: number;
  tradingSessionsCount: number;
  weeklyVolatility: string;
  dataCompleteness: string;
  companyName: string;
  sectorName: string;
  shariahStatus: string;
  isDemo: boolean;
}

export default function WeeklyPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<WeeklyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [currentWeek, setCurrentWeek] = useState(() => {
    return sp.get("weekStart") ?? format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  });
  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [sortBy, setSortBy] = useState("symbol");
  const [sortDir, setSortDir] = useState("asc");
  const page = parseInt(sp.get("page") ?? "1");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        weekStart: currentWeek,
        page: String(page),
        limit: "50",
        ...(search && { search }),
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/portal/weekly?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setPagination(json.pagination ?? { page: 1, total: 0, pages: 1 });
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentWeek, search, sortBy, sortDir, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function updateUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k));
    params.delete("page");
    router.push(`/data-portal/weekly?${params.toString()}`);
  }

  function navigateWeek(dir: "prev" | "next") {
    const d = new Date(currentWeek);
    const newWeek = format(dir === "prev" ? subWeeks(d, 1) : addWeeks(d, 1), "yyyy-MM-dd");
    setCurrentWeek(newWeek);
    updateUrl({ weekStart: newWeek });
  }

  function handleSort(col: string) {
    const newDir = sortBy === col && sortDir === "asc" ? "desc" : "asc";
    setSortBy(col);
    setSortDir(newDir);
  }

  const SortTh = ({ col, label }: { col: string; label: string }) => (
    <th
      className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-right whitespace-nowrap cursor-pointer"
      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      onClick={() => handleSort(col)}
    >
      {label} {sortBy === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--navy)" }}>Weekly Market Data</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {data[0]?.isDemo && <span className="badge-demo mr-2">Demo Data</span>}
            Week: {getWeekLabel(currentWeek)} · {pagination.total} records
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Link href="/data-portal/daily" className="px-3 py-1.5 rounded border text-sm" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            Daily View
          </Link>
          <button onClick={() => navigateWeek("prev")} className="px-3 py-1.5 rounded border text-sm" style={{ borderColor: "var(--border)" }}>← Prev Week</button>
          <button onClick={() => navigateWeek("next")} className="px-3 py-1.5 rounded border text-sm" style={{ borderColor: "var(--border)" }}>Next Week →</button>
        </div>
      </div>

      {/* Week selector */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div>
          <label className="text-xs font-medium mr-2" style={{ color: "var(--text-muted)" }}>Week starting:</label>
          <input
            type="date"
            value={currentWeek}
            onChange={(e) => { setCurrentWeek(e.target.value); updateUrl({ weekStart: e.target.value }); }}
            className="px-3 py-2 rounded border text-sm"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
        <input
          type="text"
          placeholder="Search symbol…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateUrl({ search })}
          className="px-3 py-2 rounded border text-sm w-40"
          style={{ borderColor: "var(--border)" }}
        />
        <button onClick={() => updateUrl({ search })} className="px-4 py-2 rounded text-sm font-medium" style={{ background: "var(--navy)", color: "var(--gold)" }}>
          Search
        </button>
        <a
          href={`/api/portal/weekly/export?weekStart=${currentWeek}&format=csv`}
          className="px-4 py-2 rounded border text-sm font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          Export CSV
        </a>
      </div>

      {/* Weekly summary cards */}
      {data.length > 0 && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          {[
            {
              label: "Weekly Advancers",
              value: String(data.filter(r => parseFloat(r.weeklyPctChange) > 0).length),
              color: "var(--positive)"
            },
            {
              label: "Weekly Decliners",
              value: String(data.filter(r => parseFloat(r.weeklyPctChange) < 0).length),
              color: "var(--negative)"
            },
            {
              label: "Unchanged",
              value: String(data.filter(r => parseFloat(r.weeklyPctChange) === 0).length),
              color: "var(--neutral)"
            },
            {
              label: "Total Records",
              value: String(pagination.total),
              color: "var(--navy)"
            },
          ].map((s) => (
            <div key={s.label} className="card p-3 text-center">
              <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <p className="text-sm">Loading weekly data…</p>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-4 my-2 mx-8" />)}
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <p className="text-lg font-medium">No weekly data for this period</p>
            <p className="text-sm mt-2">Run <code>pnpm aggregate:weekly</code> or trigger aggregation from the Admin panel.</p>
            <Link href="/data-portal/admin" className="inline-block mt-4 px-4 py-2 rounded text-sm" style={{ background: "var(--navy)", color: "var(--gold)" }}>
              Go to Admin Panel →
            </Link>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: "var(--light-bg)" }}>
                  <SortTh col="symbol" label="Symbol" />
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-left" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Company</th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-left" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Sector</th>
                  <SortTh col="weeklyClose" label="W. Close" />
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>W. Open</th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>W. High</th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>W. Low</th>
                  <SortTh col="weeklyPctChange" label="W. Change %" />
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Prev W. Close</th>
                  <SortTh col="totalWeeklyVolume" label="W. Volume" />
                  <SortTh col="totalWeeklyValue" label="W. Value" />
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Sessions</th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Volatility</th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-center" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Data</th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-center" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Shariah</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={row.symbol}
                    style={{ background: i % 2 === 0 ? "var(--white)" : "var(--light-bg)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "var(--white)" : "var(--light-bg)")}
                  >
                    <td className="px-3 py-2.5 border-b font-semibold" style={{ borderColor: "var(--border)" }}>
                      <Link href={`/data-portal/company/${row.symbol}?period=weekly`} className="hover:underline" style={{ color: "var(--navy)" }}>{row.symbol}</Link>
                    </td>
                    <td className="px-3 py-2.5 border-b text-xs" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{row.companyName ?? "—"}</td>
                    <td className="px-3 py-2.5 border-b text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{row.sectorName ?? "—"}</td>
                    <td className="px-3 py-2.5 border-b text-right font-medium" style={{ borderColor: "var(--border)" }}>{formatNumber(row.weeklyClose)}</td>
                    <td className="px-3 py-2.5 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatNumber(row.weeklyOpen)}</td>
                    <td className="px-3 py-2.5 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--positive)" }}>{formatNumber(row.weeklyHigh)}</td>
                    <td className="px-3 py-2.5 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--negative)" }}>{formatNumber(row.weeklyLow)}</td>
                    <td className="px-3 py-2.5 border-b text-right font-semibold" style={{ borderColor: "var(--border)" }}>
                      <PctCell value={row.weeklyPctChange} />
                    </td>
                    <td className="px-3 py-2.5 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{formatNumber(row.previousWeekClose)}</td>
                    <td className="px-3 py-2.5 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatVolume(row.totalWeeklyVolume)}</td>
                    <td className="px-3 py-2.5 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatVolume(row.totalWeeklyValue)}</td>
                    <td className="px-3 py-2.5 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{row.tradingSessionsCount}</td>
                    <td className="px-3 py-2.5 border-b text-right text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{formatNumber(row.weeklyVolatility, 2)}%</td>
                    <td className="px-3 py-2.5 border-b text-center" style={{ borderColor: "var(--border)" }}>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{
                        background: row.dataCompleteness === "complete" ? "#D1FAE5" : "#FEF3C7",
                        color: row.dataCompleteness === "complete" ? "#065F46" : "#92400E",
                      }}>
                        {row.dataCompleteness}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 border-b text-center" style={{ borderColor: "var(--border)" }}>
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{
                        background: row.shariahStatus === "compliant" ? "#D1FAE5" : "#FEE2E2",
                        color: row.shariahStatus === "compliant" ? "#065F46" : "#991B1B",
                      }}>
                        {row.shariahStatus === "compliant" ? "✓" : row.shariahStatus === "non_compliant" ? "✗" : "?"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Page {pagination.page} of {pagination.pages} · {pagination.total} records</p>
            <div className="flex gap-2">
              {pagination.page > 1 && (
                <button onClick={() => updateUrl({ page: String(pagination.page - 1) })} className="px-3 py-1 rounded border text-xs" style={{ borderColor: "var(--border)" }}>← Prev</button>
              )}
              {pagination.page < pagination.pages && (
                <button onClick={() => updateUrl({ page: String(pagination.page + 1) })} className="px-3 py-1 rounded border text-xs" style={{ borderColor: "var(--border)" }}>Next →</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
