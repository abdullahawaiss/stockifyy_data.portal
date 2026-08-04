"use client";
import { useState } from "react";
import Link from "next/link";
import { formatNumber, formatVolume, formatPct } from "@/lib/utils";

export default function HistoricalDataPage() {
  const [symbol, setSymbol] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [period, setPeriod] = useState("daily");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  async function fetchHistorical() {
    if (!symbol) return;
    setLoading(true); setRan(true);
    try {
      const params = new URLSearchParams({ search: symbol.toUpperCase(), limit: "100", ...(from && { date: from }) });
      const endpoint = period === "weekly" ? "/api/portal/weekly" : "/api/portal/daily";
      const res = await fetch(`${endpoint}?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
    } catch { setData([]); } finally { setLoading(false); }
  }

  function downloadCsv() {
    if (!data.length) return;
    const isWeekly = period === "weekly";
    const header = isWeekly
      ? "Symbol,Week Start,Week End,W.Open,W.High,W.Low,W.Close,W.Chg%,W.Volume\n"
      : "Symbol,Date,Open,High,Low,Close,Chg%,Volume,Value\n";
    const rows = data.map((r: any) => isWeekly
      ? `${r.symbol},${r.weekStartDate},${r.weekEndDate},${r.weeklyOpen},${r.weeklyHigh},${r.weeklyLow},${r.weeklyClose},${r.weeklyPctChange},${r.totalWeeklyVolume}`
      : `${r.symbol},${r.tradingDate},${r.open},${r.high},${r.low},${r.close},${r.percentageChange},${r.volume},${r.marketValue}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${symbol}-${period}-history.csv`; a.click();
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: "var(--navy)" }}>Historical Data</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Retrieve daily or weekly price history for any listed company</p>
      </div>

      <div className="card p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Symbol *</label>
            <input type="text" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="e.g. OGDC" className="w-full px-3 py-2 rounded border text-sm" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Period</label>
            <div className="inline-flex rounded-lg overflow-hidden border w-full" style={{ borderColor: "var(--border)" }}>
              {["daily", "weekly"].map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className="flex-1 py-2 text-sm font-medium capitalize"
                  style={{ background: period === p ? "var(--navy)" : "var(--white)", color: period === p ? "var(--gold)" : "var(--text-secondary)" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>From Date</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm" style={{ borderColor: "var(--border)" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>To Date</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 rounded border text-sm" style={{ borderColor: "var(--border)" }} />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchHistorical} disabled={!symbol}
            className="px-5 py-2 rounded text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--navy)", color: "var(--gold)" }}>
            Load Data
          </button>
          {data.length > 0 && (
            <button onClick={downloadCsv} className="px-4 py-2 rounded border text-sm font-medium" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              Download CSV
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {!ran && <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Enter a symbol and click Load Data.</div>}
        {loading && <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading historical data…</div>}
        {ran && !loading && data.length === 0 && (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <p>No {period} data found for <strong>{symbol}</strong>.</p>
            {period === "weekly" && <p className="text-sm mt-2">Try running <code>pnpm aggregate:weekly</code> to generate weekly records.</p>}
          </div>
        )}
        {ran && !loading && data.length > 0 && (
          <>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>{data.length} records for {symbol} ({period})</p>
              {data[0]?.isDemo && <span className="badge-demo">Demo Data</span>}
            </div>
            <div className="table-scroll">
              {period === "daily" ? (
                <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                  <thead><tr style={{ background: "var(--light-bg)" }}>
                    {["Date", "Open", "High", "Low", "Close", "Chg %", "Volume", "Value"].map((h) => (
                      <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b text-right first:text-left" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {data.map((r: any, i: number) => {
                      const pct = formatPct(r.percentageChange);
                      return (
                        <tr key={r.tradingDate} style={{ background: i % 2 === 0 ? "var(--white)" : "var(--light-bg)" }}>
                          <td className="px-3 py-2 border-b text-left" style={{ borderColor: "var(--border)" }}>{r.tradingDate}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)" }}>{formatNumber(r.open)}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--positive)" }}>{formatNumber(r.high)}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--negative)" }}>{formatNumber(r.low)}</td>
                          <td className="px-3 py-2 border-b text-right font-medium" style={{ borderColor: "var(--border)" }}>{formatNumber(r.close)}</td>
                          <td className="px-3 py-2 border-b text-right font-semibold" style={{ borderColor: "var(--border)", color: pct.positive === true ? "var(--positive)" : pct.positive === false ? "var(--negative)" : "var(--neutral)" }}>{pct.text}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatVolume(r.volume)}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatVolume(r.marketValue)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                  <thead><tr style={{ background: "var(--light-bg)" }}>
                    {["Week Start", "Week End", "W.Open", "W.High", "W.Low", "W.Close", "W.Chg%", "W.Volume", "Sessions"].map((h) => (
                      <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b text-right first:text-left" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {data.map((r: any, i: number) => {
                      const pct = formatPct(r.weeklyPctChange);
                      return (
                        <tr key={r.weekStartDate} style={{ background: i % 2 === 0 ? "var(--white)" : "var(--light-bg)" }}>
                          <td className="px-3 py-2 border-b text-left" style={{ borderColor: "var(--border)" }}>{r.weekStartDate}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)" }}>{r.weekEndDate}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)" }}>{formatNumber(r.weeklyOpen)}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--positive)" }}>{formatNumber(r.weeklyHigh)}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--negative)" }}>{formatNumber(r.weeklyLow)}</td>
                          <td className="px-3 py-2 border-b text-right font-medium" style={{ borderColor: "var(--border)" }}>{formatNumber(r.weeklyClose)}</td>
                          <td className="px-3 py-2 border-b text-right font-semibold" style={{ borderColor: "var(--border)", color: pct.positive === true ? "var(--positive)" : pct.positive === false ? "var(--negative)" : "var(--neutral)" }}>{pct.text}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatVolume(r.totalWeeklyVolume)}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{r.tradingSessionsCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
