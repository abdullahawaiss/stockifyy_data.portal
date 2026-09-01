"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { cachedFetch, TTL_SHORT } from "@/lib/portal-cache";

export default function AnnouncementsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [type, setType] = useState(sp.get("type") ?? "");
  const [symbol, setSymbol] = useState(sp.get("symbol") ?? "");
  const [expanded, setExpanded] = useState<string | null>(null);
  const page = parseInt(sp.get("page") ?? "1");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), ...(type && { type }), ...(symbol && { symbol }) });
      const json = await cachedFetch<{ data: any[]; pagination: any }>(`/api/portal/announcements?${params}`, TTL_SHORT);
      setData(json.data ?? []);
      setPagination(json.pagination ?? { page: 1, total: 0, pages: 1 });
    } catch { setData([]); } finally { setLoading(false); }
  }, [type, symbol, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function updateUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k));
    params.delete("page");
    router.push(`/data-portal/announcements?${params.toString()}`);
  }

  const TYPES = ["", "announcement", "board_meeting", "financial_result", "dividend", "insider_trading", "agm_eogm", "material_info", "corporate_action"];
  const TYPE_LABELS: Record<string, string> = {
    "": "All Events", announcement: "Announcement", board_meeting: "Board Meeting",
    financial_result: "Result Announcement", dividend: "Dividend", insider_trading: "Insider Trading",
    agm_eogm: "AGM/EOGM", material_info: "Material Info", corporate_action: "Corporate Action",
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold">
          <span style={{ color: "var(--text-primary)" }}>Company </span><span style={{ color: "#D4971A" }}>Announcements</span>
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{pagination.total} announcements</p>
      </div>

      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <input type="text" placeholder="Symbol…" value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && updateUrl({ symbol })}
          className="px-3 py-2 rounded border text-sm w-36" style={{ borderColor: "var(--border)" }} />
        <select value={type} onChange={(e) => { setType(e.target.value); updateUrl({ type: e.target.value }); }}
          className="px-3 py-2 rounded border text-sm" style={{ borderColor: "var(--border)" }}>
          {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
        <button onClick={() => updateUrl({ symbol })} className="px-4 py-2 rounded text-sm font-medium" style={{ background: "var(--navy)", color: "var(--gold)" }}>
          Filter
        </button>
      </div>

      <div className="card divide-y" style={{ borderColor: "var(--border)" }}>
        {loading ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Loading announcements…</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--text-muted)" }}>No announcements found.</div>
        ) : (
          data.map((a) => {
            const isOpen = expanded === String(a.id);
            const typeLabel = TYPE_LABELS[a.announcementType] ?? a.announcementType;
            const typeColor = a.announcementType === "board_meeting" ? "#1a3a6b"
              : a.announcementType === "dividend" ? "#1a6b3a"
              : a.announcementType === "financial_result" ? "#6b1a1a"
              : a.announcementType === "insider_trading" ? "#4a1a6b"
              : "var(--navy)";
            return (
              <div key={a.id}>
                <button
                  onClick={() => setExpanded(isOpen ? null : String(a.id))}
                  style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "14px 20px", display: "block" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--light-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-xs px-2 py-0.5 rounded font-semibold shrink-0" style={{ background: typeColor, color: "#fff" }}>
                      {a.symbol ?? "GEN"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-0.5" style={{ color: "var(--navy)" }}>{a.title}</p>
                      <div className="flex flex-wrap gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span>{a.announcementDate}</span>
                        <span>·</span>
                        <span style={{ color: typeColor, fontWeight: 600 }}>{typeLabel}</span>
                      </div>
                      {!isOpen && a.content && (
                        <p className="text-xs mt-1.5 leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>{a.content}</p>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 20px 16px 20px", borderTop: "1px solid var(--border)" }}>
                    <div style={{ padding: "14px 16px", background: "var(--light-bg)", borderRadius: 8, marginTop: 8 }}>
                      {a.content ? (
                        <p style={{ fontSize: 13, lineHeight: 1.75, color: "var(--text-primary)", margin: 0, whiteSpace: "pre-wrap" }}>{a.content}</p>
                      ) : (
                        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>No additional content available.</p>
                      )}
                      {a.pdfUrl && (
                        <a href={a.pdfUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, fontSize: 12, fontWeight: 700, color: "var(--gold)", textDecoration: "none" }}>
                          📄 View PDF Document →
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {!loading && pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Page {pagination.page} of {pagination.pages}</p>
          <div className="flex gap-2">
            {pagination.page > 1 && <button onClick={() => updateUrl({ page: String(pagination.page - 1) })} className="px-3 py-1.5 rounded border text-xs" style={{ borderColor: "var(--border)" }}>← Prev</button>}
            {pagination.page < pagination.pages && <button onClick={() => updateUrl({ page: String(pagination.page + 1) })} className="px-3 py-1.5 rounded border text-xs" style={{ borderColor: "var(--border)" }}>Next →</button>}
          </div>
        </div>
      )}
    </div>
  );
}
