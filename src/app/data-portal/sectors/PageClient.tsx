"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatNumber, formatVolume, formatPct } from "@/lib/utils";

export default function SectorsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [period, setPeriod] = useState(sp.get("period") ?? "daily");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/sectors?period=${period}`);
      const json = await res.json();
      setData(json.data ?? []);
    } catch { setData([]); } finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, [period]);

  function switchPeriod(p: string) {
    setPeriod(p);
    const params = new URLSearchParams(sp.toString());
    params.set("period", p);
    router.push(`/data-portal/sectors?${params.toString()}`);
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--navy)" }}>Sector Summary</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Performance by market sector</p>
        </div>
        <div className="inline-flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
          {["daily", "weekly"].map((p) => (
            <button key={p} onClick={() => switchPeriod(p)} className="px-4 py-1.5 text-sm font-medium capitalize"
              style={{ background: period === p ? "var(--navy)" : "var(--white)", color: period === p ? "var(--gold)" : "var(--text-secondary)" }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading sector data…</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
            <p>No sector data available. Import daily data and run sector aggregation.</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: "var(--light-bg)" }}>
                  {["Sector", "Companies", period === "daily" ? "Avg Chg %" : "Avg W. Chg %", "Advancers", "Decliners", "Unchanged", "Volume", "Value"].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-left" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const pctVal = period === "daily" ? row.avgPercentageChange : row.avgWeeklyPctChange;
                  const pct = formatPct(pctVal);
                  const advancers = period === "daily" ? row.advancers : row.weeklyAdvancers;
                  const decliners = period === "daily" ? row.decliners : row.weeklyDecliners;
                  const unchanged = period === "daily" ? row.unchanged : row.weeklyUnchanged;
                  const volume = period === "daily" ? row.totalVolume : row.totalWeeklyVolume;
                  const value = period === "daily" ? row.totalValue : row.totalWeeklyValue;
                  return (
                    <tr key={row.sectorCode ?? row.sectorId} style={{ background: i % 2 === 0 ? "var(--white)" : "var(--light-bg)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#EFF6FF")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "var(--white)" : "var(--light-bg)")}>
                      <td className="px-3 py-2.5 border-b font-medium" style={{ borderColor: "var(--border)" }}>{row.sectorName ?? "—"}</td>
                      <td className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{row.totalCompanies ?? "—"}</td>
                      <td className="px-3 py-2.5 border-b font-semibold" style={{ borderColor: "var(--border)", color: pct.positive === true ? "var(--positive)" : pct.positive === false ? "var(--negative)" : "var(--neutral)" }}>{pct.text}</td>
                      <td className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)", color: "var(--positive)" }}>{advancers ?? "—"}</td>
                      <td className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)", color: "var(--negative)" }}>{decliners ?? "—"}</td>
                      <td className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{unchanged ?? "—"}</td>
                      <td className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatVolume(volume)}</td>
                      <td className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatVolume(value)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
