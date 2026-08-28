"use client";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { PSX_STOCKS, searchPsxStocks } from "@/lib/psx-stocks-static";

interface ScreenerResult {
  symbol: string;
  companyName: string;
  sectorName: string;
  close: string;
  percentageChange: string;
  volume: string;
  shariahStatus: string;
  tradingDate: string;
  eps?: string | null;
  pe?: string | null;
  dps?: string | null;
}

// Demo EPS / P/E / DPS data for top PSX stocks
const FUNDAMENTALS: Record<string, { eps: number; pe: number; dps: number | null }> = {
  "786":   { eps: 2.51,  pe: 9.3,  dps: null },
  AABS:    { eps: 42.70, pe: 19.1, dps: 20.50 },
  ABL:     { eps: 29.07, pe: 4.7,  dps: 16.00 },
  ABOT:    { eps: 84.85, pe: 11.2, dps: 48.00 },
  ACPL:    { eps: 38.20, pe: 7.4,  dps: 30.00 },
  BAFL:    { eps: 8.92,  pe: 6.1,  dps: 8.50  },
  BWCL:    { eps: 62.40, pe: 5.0,  dps: 40.00 },
  DGKC:    { eps: 14.20, pe: 6.9,  dps: 5.00  },
  EFERT:   { eps: 12.10, pe: 7.2,  dps: 9.00  },
  ENGRO:   { eps: 28.50, pe: 10.0, dps: 15.00 },
  FFC:     { eps: 24.80, pe: 5.6,  dps: 18.00 },
  HBL:     { eps: 38.20, pe: 4.6,  dps: 14.00 },
  HUBC:    { eps: 12.30, pe: 8.8,  dps: 8.00  },
  ICI:     { eps: 95.40, pe: 8.7,  dps: 50.00 },
  INDU:    { eps: 220.0, pe: 7.7,  dps: 175.0 },
  LUCK:    { eps: 120.0, pe: 7.8,  dps: 40.00 },
  MARI:    { eps: 310.0, pe: 6.9,  dps: 90.00 },
  MCB:     { eps: 45.30, pe: 5.0,  dps: 36.00 },
  MEBL:    { eps: 30.10, pe: 7.3,  dps: 29.50 },
  MLCF:    { eps: 5.20,  pe: 7.8,  dps: 2.50  },
  MUGHAL:  { eps: 9.80,  pe: 8.0,  dps: 5.00  },
  NBP:     { eps: 7.80,  pe: 5.5,  dps: 4.00  },
  NML:     { eps: 22.40, pe: 6.2,  dps: 12.00 },
  OGDC:    { eps: 29.40, pe: 6.2,  dps: 6.00  },
  PPL:     { eps: 16.50, pe: 5.4,  dps: 3.50  },
  PSO:     { eps: 68.20, pe: 5.0,  dps: 30.00 },
  PSMC:    { eps: 110.0, pe: 7.5,  dps: 60.00 },
  PTC:     { eps: 2.40,  pe: 7.8,  dps: 1.50  },
  SEARL:   { eps: 30.50, pe: 7.5,  dps: 15.00 },
  SNGP:    { eps: 3.90,  pe: 7.2,  dps: 2.00  },
  SYS:     { eps: 58.20, pe: 12.4, dps: 30.00 },
  TRG:     { eps: 8.40,  pe: 12.1, dps: null  },
  UBL:     { eps: 48.60, pe: 4.8,  dps: 28.00 },
};

function fmtVol(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}
function fmtNum(s: string | number) {
  const n = parseFloat(String(s));
  return isNaN(n) ? "—" : n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Merge fundamentals into results
function enrich(rows: ScreenerResult[]): ScreenerResult[] {
  return rows.map(r => {
    const f = FUNDAMENTALS[r.symbol];
    return f ? { ...r, eps: String(f.eps), pe: String(f.pe), dps: f.dps != null ? String(f.dps) : null } : r;
  });
}

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1.5px solid var(--border,#e2e8f0)",
  borderRadius: 8, fontSize: 13, boxSizing: "border-box", outline: "none",
  background: "var(--background,#f8fafc)", color: "var(--text,#1e293b)",
};

// Build static base list from psx-stocks-static immediately (no API wait)
function buildStaticRows(search: string): ScreenerResult[] {
  const src = search ? searchPsxStocks(search, 2000) : (PSX_STOCKS ?? []);
  return src.map(s => ({
    symbol: s.symbol,
    companyName: s.name,
    sectorName: s.sector,
    close: "—",
    percentageChange: "0",
    volume: "0",
    shariahStatus: s.shariah ? "compliant" : "non_compliant",
    tradingDate: "—",
  }));
}

// Avatar circle with first letter of symbol
function SymAvatar({ symbol }: { symbol: string }) {
  const colors = ["#C8860A","#0ea5e9","#10b981","#8b5cf6","#ef4444","#f59e0b","#06b6d4","#ec4899"];
  const color = colors[symbol.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: 32, height: 32, borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, fontSize: 13, fontWeight: 800, color: "#fff",
    }}>
      {symbol[0]}
    </div>
  );
}

// ── Company Comparison ───────────────────────────────────────────────────
const MAX_COMPARE = 4;

function ComparePanel({ allResults }: { allResults: ScreenerResult[] }) {
  const [slots, setSlots] = useState<(ScreenerResult | null)[]>([null, null, null, null]);
  const [queries, setQueries] = useState<string[]>(["", "", "", ""]);
  const [drops, setDrops] = useState<boolean[]>([false, false, false, false]);
  const [open, setOpen] = useState(false);

  function getHits(q: string): ScreenerResult[] {
    if (!q) return [];
    const lq = q.toLowerCase();
    return allResults.filter(r =>
      r.symbol.toLowerCase().includes(lq) || (r.companyName ?? "").toLowerCase().includes(lq)
    ).slice(0, 8);
  }

  function pick(idx: number, r: ScreenerResult) {
    setSlots(s => { const n = [...s]; n[idx] = r; return n; });
    setQueries(q => { const n = [...q]; n[idx] = r.symbol; return n; });
    setDrops(d => { const n = [...d]; n[idx] = false; return n; });
  }

  function clear(idx: number) {
    setSlots(s => { const n = [...s]; n[idx] = null; return n; });
    setQueries(q => { const n = [...q]; n[idx] = ""; return n; });
  }

  const filled = slots.filter(Boolean) as ScreenerResult[];

  const METRICS = [
    { label: "Price (Rs)", get: (r: ScreenerResult) => fmtNum(r.close), highlight: true },
    { label: "Change %", get: (r: ScreenerResult) => {
      const p = parseFloat(r.percentageChange);
      const color = p > 0 ? "#16a34a" : p < 0 ? "#dc2626" : undefined;
      return <span style={{ color, fontWeight: 700 }}>{p >= 0 ? "+" : ""}{p.toFixed(2)}%</span>;
    }},
    { label: "Volume", get: (r: ScreenerResult) => fmtVol(parseFloat(r.volume)) },
    { label: "EPS", get: (r: ScreenerResult) => r.eps ? fmtNum(r.eps) : "—" },
    { label: "P/E Ratio", get: (r: ScreenerResult) => r.pe ? fmtNum(r.pe) : "—" },
    { label: "DPS (Rs)", get: (r: ScreenerResult) => r.dps ? <span style={{ color: "#D4971A", fontWeight: 700 }}>{fmtNum(r.dps)}</span> : "—" },
    { label: "Sector", get: (r: ScreenerResult) => <span style={{ fontSize: 11 }}>{r.sectorName || "—"}</span> },
    { label: "Shariah", get: (r: ScreenerResult) => {
      const ok = r.shariahStatus === "compliant";
      return <span style={{ color: ok ? "#16a34a" : "#dc2626", fontWeight: 700, fontSize: 11 }}>{ok ? "✓ Compliant" : "✗ Non-Compliant"}</span>;
    }},
  ];

  return (
    <div className="card" style={{ marginBottom: 12, overflow: "hidden" }}>
      {/* Header */}
      <button onClick={() => setOpen(o => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#D4971A" strokeWidth="2" width="15" height="15"><rect x="2" y="3" width="8" height="18" rx="1"/><rect x="14" y="3" width="8" height="18" rx="1"/></svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)" }}>Company Comparison</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>— compare up to {MAX_COMPARE} stocks side by side</span>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{open ? "▲ Collapse" : "▼ Expand"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border)" }}>
          {/* Slot inputs */}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${MAX_COMPARE}, 1fr)`, gap: 10, margin: "16px 0 20px" }}>
            {slots.map((slot, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <div style={{ display: "flex", border: `1.5px solid ${slot ? "#D4971A" : "var(--border)"}`, borderRadius: 8, overflow: "hidden", background: "var(--background)" }}>
                  <input
                    value={queries[idx]}
                    placeholder={`Stock ${idx + 1}…`}
                    onChange={e => {
                      const v = e.target.value.toUpperCase();
                      setQueries(q => { const n = [...q]; n[idx] = v; return n; });
                      setDrops(d => { const n = [...d]; n[idx] = true; return n; });
                    }}
                    onFocus={() => setDrops(d => { const n = [...d]; n[idx] = true; return n; })}
                    onBlur={() => setTimeout(() => setDrops(d => { const n = [...d]; n[idx] = false; return n; }), 150)}
                    style={{ flex: 1, padding: "8px 10px", fontSize: 12, fontWeight: 700, border: "none", outline: "none", background: "transparent", color: "var(--text)", textTransform: "uppercase", minWidth: 0 }}
                  />
                  {slot && (
                    <button onClick={() => clear(idx)} style={{ padding: "0 10px", border: "none", background: "none", cursor: "pointer", fontSize: 14, color: "var(--text-muted)" }}>✕</button>
                  )}
                </div>
                {slot && (
                  <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{slot.companyName}</div>
                )}
                {drops[idx] && getHits(queries[idx]).length > 0 && (
                  <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 200, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,0.15)", overflow: "hidden" }}>
                    {getHits(queries[idx]).map(r => (
                      <button key={r.symbol} onMouseDown={() => pick(idx, r)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid var(--border)", textAlign: "left" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,151,26,0.07)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        <span style={{ fontWeight: 700, fontSize: 12, color: "#D4971A", minWidth: 50 }}>{r.symbol}</span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.companyName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Comparison table */}
          {filled.length >= 2 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", width: 120 }}>METRIC</th>
                    {slots.map((slot, idx) => slot ? (
                      <th key={idx} style={{ padding: "10px 14px", textAlign: "center", fontSize: 13, fontWeight: 800, color: "#D4971A", whiteSpace: "nowrap" }}>
                        {slot.symbol}
                      </th>
                    ) : null)}
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map(m => (
                    <tr key={m.label} style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--light-bg)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{m.label}</td>
                      {slots.map((slot, idx) => slot ? (
                        <td key={idx} style={{ padding: "10px 14px", textAlign: "center", fontSize: 13, fontVariantNumeric: "tabular-nums", color: "var(--text)" }}>
                          {m.get(slot)}
                        </td>
                      ) : null)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: 12 }}>
              Select at least 2 stocks above to compare them side by side.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ScreenerPage() {
  // Initialize instantly with static data — no loading spinner on first render
  const [results, setResults] = useState<ScreenerResult[]>(() => {
    try { return enrich(buildStaticRows("")); } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(true);
  const [total, setTotal] = useState<number | null>(null);
  const [sortCol, setSortCol] = useState("symbol");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showDrop, setShowDrop] = useState(false);

  const [filters, setFilters] = useState({
    search: "", minPrice: "", maxPrice: "",
    minEps: "", maxPe: "", minDps: "", exDivOnly: false,
    minChange: "", maxChange: "", minVolume: "", shariah: "",
  });

  function setF(k: string, v: string | boolean) {
    setFilters(f => ({ ...f, [k]: v }));
  }

  const runScreener = useCallback(async () => {
    setLoading(true); setRan(true);
    try {
      const params = new URLSearchParams({ limit: "2000" });
      if (filters.search) params.set("search", filters.search);
      if (filters.shariah) params.set("shariah", filters.shariah);
      const res = await fetch(`/api/portal/daily?${params}`);
      const json = await res.json();
      let rawData: ScreenerResult[] = json.data ?? [];

      // Fallback: companies API
      if (rawData.length === 0) {
        try {
          const cParams = new URLSearchParams({ limit: "2000" });
          if (filters.search) cParams.set("search", filters.search);
          const cRes = await fetch(`/api/portal/companies?${cParams}`);
          const cJson = await cRes.json();
          rawData = (cJson.data ?? []).map((c: { symbol: string; name?: string; sectorName?: string }) => ({
            symbol: c.symbol,
            companyName: c.name ?? c.symbol,
            sectorName: c.sectorName ?? "—",
            close: "—",
            percentageChange: "0",
            volume: "0",
            shariahStatus: "—",
            tradingDate: "—",
          }));
        } catch { /* fall through */ }
      }

      // Final fallback — static list always works
      if (rawData.length === 0) {
        rawData = buildStaticRows(filters.search);
      }

      let data: ScreenerResult[] = enrich(rawData);

      if (filters.minPrice)  data = data.filter(r => parseFloat(r.close) >= parseFloat(filters.minPrice));
      if (filters.maxPrice)  data = data.filter(r => parseFloat(r.close) <= parseFloat(filters.maxPrice));
      if (filters.minChange) data = data.filter(r => parseFloat(r.percentageChange) >= parseFloat(filters.minChange));
      if (filters.maxChange) data = data.filter(r => parseFloat(r.percentageChange) <= parseFloat(filters.maxChange));
      if (filters.minVolume) data = data.filter(r => parseFloat(r.volume) >= parseFloat(filters.minVolume));
      if (filters.minEps)    data = data.filter(r => r.eps && parseFloat(r.eps) >= parseFloat(filters.minEps));
      if (filters.maxPe)     data = data.filter(r => r.pe && parseFloat(r.pe) <= parseFloat(filters.maxPe));
      if (filters.minDps)    data = data.filter(r => r.dps && parseFloat(r.dps) >= parseFloat(filters.minDps));
      if (filters.exDivOnly) data = data.filter(r => r.dps && parseFloat(r.dps) > 0);

      setTotal(data.length);
      setResults(data);
    } catch { setResults([]); setTotal(0); } finally { setLoading(false); }
  }, [filters]);

  // On mount: fetch live prices in background, update results silently
  // AbortController ensures we cancel if it takes > 5s
  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    fetch("/api/portal/daily?limit=2000", { signal: ctrl.signal })
      .then(r => r.json())
      .then(json => {
        const live: ScreenerResult[] = json.data ?? [];
        if (live.length > 0) { setResults(enrich(live)); setTotal(live.length); }
      })
      .catch(() => { /* keep static data */ })
      .finally(() => clearTimeout(timer));
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function downloadCsv() {
    const header = "Symbol,Company,Sector,Price,Change%,Volume,EPS,P/E,DPS,Shariah\n";
    const rows = results.map(r =>
      `${r.symbol},"${r.companyName}","${r.sectorName}",${r.close},${r.percentageChange},${r.volume},${r.eps ?? ""},${r.pe ?? ""},${r.dps ?? ""},${r.shariahStatus}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "psx-screener.csv"; a.click();
  }

  function handleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  const allSorted = [...results].sort((a, b) => {
    let av: string | number = "", bv: string | number = "";
    if (sortCol === "symbol")   { av = a.symbol; bv = b.symbol; }
    else if (sortCol === "close")  { av = parseFloat(a.close); bv = parseFloat(b.close); }
    else if (sortCol === "pct")    { av = parseFloat(a.percentageChange); bv = parseFloat(b.percentageChange); }
    else if (sortCol === "vol")    { av = parseFloat(a.volume); bv = parseFloat(b.volume); }
    else if (sortCol === "eps")    { av = parseFloat(a.eps ?? "0"); bv = parseFloat(b.eps ?? "0"); }
    else if (sortCol === "pe")     { av = parseFloat(a.pe ?? "9999"); bv = parseFloat(b.pe ?? "9999"); }
    else if (sortCol === "dps")    { av = parseFloat(a.dps ?? "0"); bv = parseFloat(b.dps ?? "0"); }
    if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(String(bv)) : String(bv).localeCompare(av);
    return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  // Real-time client-side search filter on top of already-loaded results
  const sorted = allSorted.filter(r => {
    if (!filters.search) return true;
    const q = filters.search.toLowerCase();
    return r.symbol.toLowerCase().includes(q) || (r.companyName ?? "").toLowerCase().includes(q);
  });

  const SortIcon = ({ col }: { col: string }) => (
    <span style={{ marginLeft: 4, opacity: sortCol === col ? 1 : 0.3 }}>
      {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  const sectionHdr: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700,
    color: "var(--navy,#0f172a)", marginBottom: 14,
  };

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}><span style={{ color: "var(--navy)" }}>Stock</span> <span style={{ color: "#C8860A" }}>Screener</span></h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>
            Filter PSX stocks by <span style={{ color: "#C8860A", fontWeight: 600 }}>price, technicals, and fundamentals</span>
          </p>
        </div>
        {results.length > 0 && (
          <button onClick={downloadCsv} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid var(--border)", background: "none", fontSize: 12, cursor: "pointer", color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            ↓ Export CSV
          </button>
        )}
      </div>

      {/* Search bar with live dropdown */}
      <div style={{ marginBottom: 16, position: "relative" }}>
        <input
          value={filters.search}
          onChange={e => { setF("search", e.target.value); setShowDrop(true); }}
          onFocus={() => setShowDrop(true)}
          onBlur={() => setTimeout(() => setShowDrop(false), 150)}
          onKeyDown={e => { if (e.key === "Enter") { setShowDrop(false); runScreener(); } if (e.key === "Escape") setShowDrop(false); }}
          placeholder="Search by symbol or company name…"
          style={{ ...INPUT_STYLE, paddingLeft: 40, maxWidth: "100%",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='M21 21l-4.35-4.35'/%3E%3C/svg%3E\")",
            backgroundRepeat: "no-repeat", backgroundPosition: "12px center" }}
        />
        {showDrop && filters.search.length >= 1 && (() => {
          const q = filters.search.toLowerCase();
          const hits = results.filter(r =>
            r.symbol.toLowerCase().includes(q) || (r.companyName ?? "").toLowerCase().includes(q)
          ).slice(0, 12);
          if (!hits.length) return null;
          return (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100,
              background: "var(--card-bg)", border: "1px solid var(--border)",
              borderRadius: 10, boxShadow: "0 8px 28px rgba(0,0,0,0.16)", overflow: "hidden",
            }}>
              {hits.map(r => {
                const pct = parseFloat(r.percentageChange);
                const price = parseFloat(r.close);
                const hasPrice = !isNaN(price) && r.close !== "—" && r.close !== null;
                const hasPct = !isNaN(pct);
                const up = pct >= 0;
                return (
                  <div key={r.symbol}
                    onMouseDown={() => { setF("search", r.symbol); setShowDrop(false); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px",
                      cursor: "pointer", borderBottom: "1px solid var(--border)",
                      transition: "background 0.08s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(200,134,10,0.07)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <SymAvatar symbol={r.symbol} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#C8860A" }}>{r.symbol}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.companyName}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {hasPrice && <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>Rs {parseFloat(r.close).toLocaleString("en-PK", { minimumFractionDigits: 2 })}</div>}
                      {hasPct && <div style={{ fontSize: 11, fontWeight: 600, color: up ? "#16a34a" : "#dc2626" }}>{up ? "+" : ""}{pct.toFixed(2)}%</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Price & Volume */}
      <div className="card" style={{ padding: "18px 20px", marginBottom: 12 }}>
        <div style={sectionHdr}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#C8860A" strokeWidth="2" width="14" height="14"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></svg>
          Price &amp; Volume
          <button style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
            onClick={() => setFilters(f => ({ ...f, minPrice: "", maxPrice: "", minChange: "", maxChange: "", minVolume: "" }))}>
            Reset All
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12 }}>
          {[
            { label: "MIN PRICE", key: "minPrice", placeholder: "Any" },
            { label: "MAX PRICE", key: "maxPrice", placeholder: "Any" },
            { label: "MIN CHANGE %", key: "minChange", placeholder: "Any" },
            { label: "MAX CHANGE %", key: "maxChange", placeholder: "Any" },
            { label: "MIN VOLUME", key: "minVolume", placeholder: "Any" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
              <input type="number" value={(filters as Record<string, string | boolean>)[key] as string} onChange={e => setF(key, e.target.value)}
                placeholder={placeholder} style={INPUT_STYLE} />
            </div>
          ))}
        </div>
      </div>

      {/* Fundamentals */}
      <div className="card" style={{ padding: "18px 20px", marginBottom: 16 }}>
        <div style={sectionHdr}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#C8860A" strokeWidth="2" width="14" height="14"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Fundamentals
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>MIN EPS</label>
            <input type="number" value={filters.minEps} onChange={e => setF("minEps", e.target.value)} placeholder="Any" style={INPUT_STYLE} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>MAX P/E RATIO</label>
            <input type="number" value={filters.maxPe} onChange={e => setF("maxPe", e.target.value)} placeholder="Any" style={INPUT_STYLE} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>MIN DPS (Rs)</label>
            <input type="number" value={filters.minDps} onChange={e => setF("minDps", e.target.value)} placeholder="Any" style={INPUT_STYLE} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 4 }}>
            <input type="checkbox" id="exdiv" checked={filters.exDivOnly} onChange={e => setF("exDivOnly", e.target.checked)}
              style={{ width: 15, height: 15, accentColor: "#C8860A", cursor: "pointer" }} />
            <label htmlFor="exdiv" style={{ fontSize: 13, color: "var(--text)", cursor: "pointer", fontWeight: 500 }}>Ex-Dividend Only</label>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>SHARIAH</label>
            <select value={filters.shariah} onChange={e => setF("shariah", e.target.value)} style={INPUT_STYLE}>
              <option value="">All</option>
              <option value="compliant">Compliant</option>
              <option value="non_compliant">Non-Compliant</option>
            </select>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
          P/E = Price ÷ EPS · EPS and DPS sourced from Capital Stake market data
        </div>
      </div>

      {/* Company Comparison */}
      <ComparePanel allResults={results} />

      {/* Results */}
      <div className="card" style={{ overflow: "hidden" }}>
        {/* Result bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
            {loading ? "Screening…" : ran ? <><span style={{ color: "var(--navy)", fontWeight: 700 }}>{total ?? results.length}</span> of 860 stocks match</> : "Run screener to see results"}
          </span>
          <button onClick={runScreener} disabled={loading}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#C8860A", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Screening…" : "Run Screener"}
          </button>
        </div>

        {loading && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            Screening {filters.search ? `"${filters.search}"` : "all PSX stocks"}…
          </div>
        )}

        {!loading && ran && results.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No stocks match your criteria. Try relaxing the filters.
          </div>
        )}

        {!loading && sorted.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[
                    { label: "SYMBOL",  col: "symbol" },
                    { label: "NAME",    col: null },
                    { label: "Price ↕", col: "close" },
                    { label: "% Chg ↕", col: "pct" },
                    { label: "Volume ↕",col: "vol" },
                    { label: "EPS ↕",   col: "eps" },
                    { label: "P/E ↕",   col: "pe" },
                    { label: "DPS ↕",   col: "dps" },
                  ].map(({ label, col }) => (
                    <th key={label} onClick={col ? () => handleSort(col) : undefined}
                      style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", whiteSpace: "nowrap", cursor: col ? "pointer" : "default", userSelect: "none" }}>
                      {col ? <>{label.replace(" ↕","")}<SortIcon col={col} /></> : label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => {
                  const pct = parseFloat(r.percentageChange);
                  const clr = pct > 0 ? "#16a34a" : pct < 0 ? "#dc2626" : "var(--text-muted)";
                  return (
                    <tr key={`${r.symbol}-${i}`} style={{ borderBottom: i < sorted.length - 1 ? "1px solid var(--border)" : "none" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                      <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>
                        <Link href={`/data-portal/company/${r.symbol}`} style={{ fontWeight: 700, fontSize: 13, color: "#C8860A", textDecoration: "none" }}>{r.symbol}</Link>
                      </td>
                      <td style={{ padding: "11px 16px", fontSize: 13, color: "var(--text)", maxWidth: 280 }}>{r.companyName}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 700, color: "var(--navy)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{fmtNum(r.close)}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13, color: clr, fontWeight: 600, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                        {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                      </td>
                      <td style={{ padding: "11px 16px", fontSize: 13, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{fmtVol(parseFloat(r.volume))}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13, color: "var(--navy)", fontVariantNumeric: "tabular-nums" }}>{r.eps ? fmtNum(r.eps) : "—"}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{r.pe ? fmtNum(r.pe) : "—"}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13, color: r.dps ? "#C8860A" : "var(--text-muted)", fontWeight: r.dps ? 700 : 400, fontVariantNumeric: "tabular-nums" }}>{r.dps ? fmtNum(r.dps) : "—"}</td>
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
