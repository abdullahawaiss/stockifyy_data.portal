"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResearchPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [type, setType] = useState(sp.get("type") ?? "");
  const page = parseInt(sp.get("page") ?? "1");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), ...(type && { type }) });
      const res = await fetch(`/api/portal/research?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setPagination(json.pagination ?? { page: 1, total: 0, pages: 1 });
    } catch { setData([]); } finally { setLoading(false); }
  }, [type, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function updateUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k));
    params.delete("page");
    router.push(`/data-portal/research?${params.toString()}`);
  }

  const TYPES: Record<string, string> = { "": "All Reports", weekly_market: "Weekly Market", daily_market: "Daily Market", company_analysis: "Company Analysis", sector_report: "Sector Report" };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: "var(--navy)" }}>Research Reports</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Stockifyy market research and analysis</p>
      </div>

      <div className="card p-4 mb-4 flex gap-3 flex-wrap">
        <select value={type} onChange={(e) => { setType(e.target.value); updateUrl({ type: e.target.value }); }}
          className="px-3 py-2 rounded border text-sm" style={{ borderColor: "var(--border)" }}>
          {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card p-5"><div className="skeleton h-4 w-3/4 mb-3" /><div className="skeleton h-4 w-1/2 mb-2" /><div className="skeleton h-16" /></div>
          ))
        ) : data.length === 0 ? (
          <div className="col-span-3 card p-8 text-center" style={{ color: "var(--text-muted)" }}>No research reports available.</div>
        ) : (
          data.map((r) => (
            <div key={r.id} className="card p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: "var(--light-bg)", color: "var(--text-muted)" }}>
                  {TYPES[r.reportType] ?? r.reportType}
                </span>
                
              </div>
              <h3 className="font-semibold text-sm mb-2 leading-snug flex-1" style={{ color: "var(--navy)" }}>{r.title}</h3>
              <p className="text-xs leading-relaxed mb-3 line-clamp-3" style={{ color: "var(--text-secondary)" }}>{r.summary ?? "No summary available."}</p>
              <div className="flex items-center justify-between mt-auto pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{r.author ?? "Stockifyy Research"}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.publicationDate}</p>
                </div>
                {r.fileUrl ? (
                  <a href={r.fileUrl} className="text-xs font-medium px-3 py-1.5 rounded" style={{ background: "var(--navy)", color: "var(--gold)" }}>Download PDF</a>
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>No file</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
