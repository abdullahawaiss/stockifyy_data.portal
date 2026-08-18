"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatNumber, formatVolume, formatChange, formatPct } from "@/lib/utils";
import { ChangeCell, PctCell } from "@/components/ui/DataTable";

interface DailyRecord {
  symbol: string;
  tradingDate: string;
  open: string;
  high: string;
  low: string;
  close: string;
  previousClose: string;
  priceChange: string;
  percentageChange: string;
  volume: string;
  marketValue: string;
  numberOfTrades: number;
  weekHigh52: string;
  weekLow52: string;
  companyName: string;
  sectorName: string;
  shariahStatus: string;
  isDemo: boolean;
}

export default function DailyPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [date, setDate] = useState(sp.get("date") ?? "");
  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [sortBy, setSortBy] = useState(sp.get("sortBy") ?? "symbol");
  const [sortDir, setSortDir] = useState(sp.get("sortDir") ?? "asc");
  const page = parseInt(sp.get("page") ?? "1");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        ...(date && { date }),
        ...(search && { search }),
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/portal/daily?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setPagination(json.pagination ?? { page: 1, total: 0, pages: 1 });
      if (!date && json.date) setDate(json.date);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [date, search, sortBy, sortDir, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function updateUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k));
    params.delete("page");
    router.push(`/data-portal/daily?${params.toString()}`);
  }

  function handleSort(col: string) {
    const newDir = sortBy === col && sortDir === "asc" ? "desc" : "asc";
    setSortBy(col);
    setSortDir(newDir);
    updateUrl({ sortBy: col, sortDir: newDir });
  }

  const SortHeader = ({ col, label, align = "right" }: { col: string; label: string; align?: string }) => (
    <th
      className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b whitespace-nowrap cursor-pointer select-none"
      style={{ borderColor: "var(--border)", color: "var(--text-muted)", textAlign: align as "left" | "right" }}
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
          <h1 className="text-xl font-bold" style={{ color: "var(--navy)" }}>Daily Market Data</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            
            {pagination.total} records · Last updated: {date || "Loading…"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/data-portal/weekly" className="px-3 py-1.5 rounded border text-sm" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            Weekly View →
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); updateUrl({ date: e.target.value }); }}
          className="px-3 py-2 rounded border text-sm"
          style={{ borderColor: "var(--border)" }}
        />
        <input
          type="text"
          placeholder="Search symbol…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateUrl({ search })}
          className="px-3 py-2 rounded border text-sm w-40"
          style={{ borderColor: "var(--border)" }}
        />
        <button
          onClick={() => updateUrl({ search })}
          className="px-4 py-2 rounded text-sm font-medium"
          style={{ background: "var(--navy)", color: "var(--gold)" }}
        >
          Search
        </button>
        <a
          href={`/api/portal/daily/export?date=${date}&format=csv`}
          className="px-4 py-2 rounded border text-sm font-medium"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          Export CSV
        </a>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <div className="skeleton h-4 w-32 mx-auto mb-2" />
            <div className="skeleton h-4 w-48 mx-auto" />
            <p className="mt-4 text-sm">Loading market data…</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <p className="text-lg font-medium">No data for this date</p>
            <p className="text-sm mt-2">Try a different date or ensure data has been imported.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: "var(--light-bg)" }}>
                  <SortHeader col="symbol" label="Symbol" align="left" />
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-left" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Company</th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-left" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Sector</th>
                  <SortHeader col="close" label="Close" />
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Open</th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>High</th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Low</th>
                  <SortHeader col="percentageChange" label="Change %" />
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Chg</th>
                  <SortHeader col="volume" label="Volume" />
                  <SortHeader col="marketValue" label="Value (PKR)" />
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Trades</th>
                  <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-center" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Shariah</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={row.symbol}
                    style={{ background: i % 2 === 0 ? "var(--white)" : "var(--light-bg)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--row-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "var(--white)" : "var(--light-bg)")}
                  >
                    <td className="px-3 py-2.5 border-b font-semibold" style={{ borderColor: "var(--border)" }}>
                      <Link href={`/data-portal/company/${row.symbol}`} className="hover:underline" style={{ color: "var(--navy)" }}>{row.symbol}</Link>
                    </td>
                    <td className="px-3 py-2.5 border-b text-xs" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{row.companyName ?? "—"}</td>
                    <td className="px-3 py-2.5 border-b text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{row.sectorName ?? "—"}</td>
                    <td className="px-3 py-2.5 border-b text-right font-medium" style={{ borderColor: "var(--border)" }}>{formatNumber(row.close)}</td>
                    <td className="px-3 py-2.5 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatNumber(row.open)}</td>
                    <td className="px-3 py-2.5 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--positive)" }}>{formatNumber(row.high)}</td>
                    <td className="px-3 py-2.5 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--negative)" }}>{formatNumber(row.low)}</td>
                    <td className="px-3 py-2.5 border-b text-right font-semibold" style={{ borderColor: "var(--border)" }}>
                      <PctCell value={row.percentageChange} />
                    </td>
                    <td className="px-3 py-2.5 border-b text-right" style={{ borderColor: "var(--border)" }}>
                      <ChangeCell value={row.priceChange} />
                    </td>
                    <td className="px-3 py-2.5 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatVolume(row.volume)}</td>
                    <td className="px-3 py-2.5 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatVolume(row.marketValue)}</td>
                    <td className="px-3 py-2.5 border-b text-right text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{row.numberOfTrades?.toLocaleString() ?? "—"}</td>
                    <td className="px-3 py-2.5 border-b text-center" style={{ borderColor: "var(--border)" }}>
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{
                        background: row.shariahStatus === "compliant" ? "var(--badge-compliant-bg)" : "var(--badge-noncompliant-bg)",
                        color: row.shariahStatus === "compliant" ? "var(--badge-compliant-color)" : "var(--badge-noncompliant-color)",
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

        {/* Pagination */}
        {!loading && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Page {pagination.page} of {pagination.pages} · {pagination.total} records
            </p>
            <div className="flex gap-2">
              {pagination.page > 1 && (
                <button onClick={() => updateUrl({ page: String(pagination.page - 1) })}
                  className="px-3 py-1 rounded border text-xs" style={{ borderColor: "var(--border)" }}>
                  ← Prev
                </button>
              )}
              {pagination.page < pagination.pages && (
                <button onClick={() => updateUrl({ page: String(pagination.page + 1) })}
                  className="px-3 py-1 rounded border text-xs" style={{ borderColor: "var(--border)" }}>
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
