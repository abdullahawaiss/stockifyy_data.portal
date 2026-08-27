"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PSX_STOCKS, searchPsxStocks } from "@/lib/psx-stocks-static";

interface Company {
  id: number;
  symbol: string;
  name: string;
  sectorName: string;
  shariahStatus: string;
  listingDate: string;
  website: string;
}

export default function CompaniesPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [shariah, setShariah] = useState(sp.get("shariah") ?? "");
  const page = parseInt(sp.get("page") ?? "1");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "900", ...(search && { search }), ...(shariah && { shariah }) });
      const res = await fetch(`/api/portal/companies?${params}`);
      const json = await res.json();
      let rows: Company[] = json.data ?? [];
      // Fallback: if DB has no data, use the static PSX list
      if (rows.length === 0) {
        const staticSrc = search ? searchPsxStocks(search, 1000) : PSX_STOCKS;
        rows = staticSrc.map((s, i) => ({
          id: i + 1, symbol: s.symbol, name: s.name,
          sectorName: s.sector, shariahStatus: "—", listingDate: "—", website: "—",
        }));
      }
      setData(rows);
      setPagination(json.pagination ?? { page: 1, total: rows.length, pages: 1 });
    } catch { setData([]); } finally { setLoading(false); }
  }, [search, shariah, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function updateUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k));
    params.delete("page");
    router.push(`/data-portal/companies?${params.toString()}`);
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: "var(--navy)" }}>Company Directory</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{pagination.total} companies listed</p>
      </div>

      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Search symbol or company name…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && updateUrl({ search })}
          className="px-3 py-2 rounded border text-sm flex-1 min-w-48" style={{ borderColor: "var(--border)" }} />
        <select value={shariah} onChange={(e) => { setShariah(e.target.value); updateUrl({ shariah: e.target.value }); }}
          className="px-3 py-2 rounded border text-sm" style={{ borderColor: "var(--border)" }}>
          <option value="">All Shariah Status</option>
          <option value="compliant">Shariah Compliant</option>
          <option value="non_compliant">Non-Compliant</option>
          <option value="under_review">Under Review</option>
        </select>
        <button onClick={() => updateUrl({ search })} className="px-4 py-2 rounded text-sm font-medium" style={{ background: "var(--navy)", color: "var(--gold)" }}>Search</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading companies…</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>No companies found.</div>
        ) : (
          <div className="table-scroll">
            <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: "var(--light-bg)" }}>
                  {["Symbol", "Company Name", "Sector", "Shariah", "Listed", ""].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider border-b text-left" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((co, i) => (
                  <tr key={co.symbol} style={{ background: i % 2 === 0 ? "var(--white)" : "var(--light-bg)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--row-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "var(--white)" : "var(--light-bg)")}>
                    <td className="px-3 py-2.5 border-b font-bold" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>{co.symbol}</td>
                    <td className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>{co.name}</td>
                    <td className="px-3 py-2.5 border-b text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{co.sectorName ?? "—"}</td>
                    <td className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${co.shariahStatus === "compliant" ? "badge-compliant" : "badge-non-compliant"}`} style={{
                        background: co.shariahStatus === "compliant" ? "var(--badge-compliant-bg)" : "var(--badge-noncompliant-bg)",
                        color: co.shariahStatus === "compliant" ? "var(--badge-compliant-color)" : "var(--badge-noncompliant-color)",
                      }}>
                        {co.shariahStatus === "compliant" ? "Compliant" : co.shariahStatus === "non_compliant" ? "Non-Compliant" : co.shariahStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 border-b text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{co.listingDate ?? "—"}</td>
                    <td className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                      <Link href={`/data-portal/company/${co.symbol}`} className="text-xs font-medium hover:underline" style={{ color: "var(--gold)" }}>View Profile →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && pagination.pages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Page {pagination.page} of {pagination.pages} · {pagination.total} total</p>
            <div className="flex gap-2">
              {pagination.page > 1 && <button onClick={() => updateUrl({ page: String(pagination.page - 1) })} className="px-3 py-1 rounded border text-xs" style={{ borderColor: "var(--border)" }}>← Prev</button>}
              {pagination.page < pagination.pages && <button onClick={() => updateUrl({ page: String(pagination.page + 1) })} className="px-3 py-1 rounded border text-xs" style={{ borderColor: "var(--border)" }}>Next →</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
