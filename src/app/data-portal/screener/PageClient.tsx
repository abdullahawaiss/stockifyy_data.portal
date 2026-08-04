"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { formatNumber, formatVolume, formatPct } from "@/lib/utils";

interface ScreenerResult {
  symbol: string;
  companyName: string;
  sectorName: string;
  close: string;
  percentageChange: string;
  volume: string;
  shariahStatus: string;
  tradingDate: string;
}

export default function ScreenerPage() {
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [filters, setFilters] = useState({
    minChange: "",
    maxChange: "",
    minVolume: "",
    shariah: "",
    search: "",
  });

  async function runScreener() {
    setLoading(true);
    setRan(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filters.search) params.set("search", filters.search);
      if (filters.shariah) params.set("shariah", filters.shariah);
      const res = await fetch(`/api/portal/daily?${params}`);
      const json = await res.json();
      let data = json.data ?? [] as ScreenerResult[];
      if (filters.minChange) data = data.filter((r: ScreenerResult) => parseFloat(r.percentageChange) >= parseFloat(filters.minChange));
      if (filters.maxChange) data = data.filter((r: ScreenerResult) => parseFloat(r.percentageChange) <= parseFloat(filters.maxChange));
      if (filters.minVolume) data = data.filter((r: ScreenerResult) => parseFloat(r.volume) >= parseFloat(filters.minVolume));
      setResults(data);
    } catch { setResults([]); } finally { setLoading(false); }
  }

  function downloadCsv() {
    const header = "Symbol,Company,Sector,Close,Change%,Volume,Shariah,Date\n";
    const rows = results.map(r => `${r.symbol},"${r.companyName}","${r.sectorName}",${r.close},${r.percentageChange},${r.volume},${r.shariahStatus},${r.tradingDate}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "screener-results.csv"; a.click();
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: "var(--navy)" }}>Stock Screener</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Filter stocks by multiple criteria · Demo Data</p>
      </div>

      {/* Filter panel */}
      <div className="card p-5 mb-5">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--navy)" }}>Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Symbol / Company</label>
            <input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="e.g. OGDC" className="w-full px-3 py-2 rounded border text-sm" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Shariah Status</label>
            <select value={filters.shariah} onChange={(e) => setFilters({ ...filters, shariah: e.target.value })}
              className="w-full px-3 py-2 rounded border text-sm" style={{ borderColor: "var(--border)" }}>
              <option value="">All</option>
              <option value="compliant">Compliant</option>
              <option value="non_compliant">Non-Compliant</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Min Change %</label>
            <input type="number" value={filters.minChange} onChange={(e) => setFilters({ ...filters, minChange: e.target.value })}
              placeholder="-10" className="w-full px-3 py-2 rounded border text-sm" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Max Change %</label>
            <input type="number" value={filters.maxChange} onChange={(e) => setFilters({ ...filters, maxChange: e.target.value })}
              placeholder="10" className="w-full px-3 py-2 rounded border text-sm" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Min Volume</label>
            <input type="number" value={filters.minVolume} onChange={(e) => setFilters({ ...filters, minVolume: e.target.value })}
              placeholder="100000" className="w-full px-3 py-2 rounded border text-sm" style={{ borderColor: "var(--border)" }} />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={runScreener} className="px-5 py-2 rounded text-sm font-semibold" style={{ background: "var(--navy)", color: "var(--gold)" }}>
            Run Screener
          </button>
          {results.length > 0 && (
            <button onClick={downloadCsv} className="px-4 py-2 rounded border text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="card">
        {!ran && !loading && (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <p>Set your criteria above and click <strong>Run Screener</strong>.</p>
          </div>
        )}
        {loading && <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Screening stocks…</div>}
        {ran && !loading && results.length === 0 && (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>No stocks match your criteria.</div>
        )}
        {ran && !loading && results.length > 0 && (
          <>
            <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>{results.length} results</p>
            </div>
            <div className="table-scroll">
              <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr style={{ background: "var(--light-bg)" }}>
                    {["Symbol", "Company", "Sector", "Close", "Chg %", "Volume", "Shariah", "Date"].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-left" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const pct = formatPct(r.percentageChange);
                    return (
                      <tr key={r.symbol} style={{ background: i % 2 === 0 ? "var(--white)" : "var(--light-bg)" }}>
                        <td className="px-3 py-2.5 border-b font-bold" style={{ borderColor: "var(--border)" }}>
                          <Link href={`/data-portal/company/${r.symbol}`} className="hover:underline" style={{ color: "var(--navy)" }}>{r.symbol}</Link>
                        </td>
                        <td className="px-3 py-2.5 border-b text-xs" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{r.companyName}</td>
                        <td className="px-3 py-2.5 border-b text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{r.sectorName}</td>
                        <td className="px-3 py-2.5 border-b font-medium" style={{ borderColor: "var(--border)" }}>{formatNumber(r.close)}</td>
                        <td className="px-3 py-2.5 border-b font-semibold" style={{ borderColor: "var(--border)", color: pct.positive === true ? "var(--positive)" : pct.positive === false ? "var(--negative)" : "var(--neutral)" }}>{pct.text}</td>
                        <td className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatVolume(r.volume)}</td>
                        <td className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: r.shariahStatus === "compliant" ? "#D1FAE5" : "#FEE2E2", color: r.shariahStatus === "compliant" ? "#065F46" : "#991B1B" }}>
                            {r.shariahStatus === "compliant" ? "✓" : "✗"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 border-b text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{r.tradingDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
