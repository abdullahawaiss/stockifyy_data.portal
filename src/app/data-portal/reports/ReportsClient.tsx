"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

type ReportType = "Research" | "Technical" | "Fundamental";
type FilterType = "All Reports" | ReportType;

interface Report {
  id: number;
  type: ReportType;
  featured: boolean;
  date: string;
  readMin: number;
  title: string;
  summary: string;
  tags: string[];
  symbol?: string;
  content?: string;
  analyst?: string;
  rating?: string;
  target?: string;
}

const REPORTS: Report[] = [
  {
    id: 1, type: "Research", featured: true, date: "15 Aug 2025", readMin: 12, analyst: "Stockifyy Research",
    title: "Pakistan Market Outlook — Q3 2025",
    summary: "A comprehensive analysis of macroeconomic indicators, SBP policy direction, and sector rotation trends expected in Q3 2025.",
    tags: ["Macro", "Market Outlook", "SBP Policy"],
    content: `**Executive Summary**\n\nKSE-100 has delivered strong year-to-date returns of 18.2%, outperforming regional peers. SBP has cut policy rate by 700bps over 12 months to 12%, and further easing is expected. This creates a favorable backdrop for equities, particularly rate-sensitive sectors like Banking, Cement, and Real Estate.\n\n**Key Themes for Q3 2025**\n\n1. **Rate Cut Cycle**: Another 100–150bps cut expected before year-end. Banks will see NIM compression but improved loan demand.\n2. **PKR Stability**: Rupee has stabilized near 278–282 against USD, supported by IMF inflows and current account improvement.\n3. **Sector Rotation**: Capital flowing from defensive sectors to high-beta plays (Technology, Auto, Textile).\n4. **Corporate Earnings**: Q1FY26 results expected to be strong across Cement, Fertilizer and Banking sectors.\n\n**Top Picks**: MEBL, LUCK, ENGRO, SYS, TRG`,
  },
  {
    id: 2, type: "Technical", featured: true, date: "16 Aug 2025", readMin: 5, analyst: "Technical Desk",
    title: "KSE-100 Weekly Technical Outlook",
    summary: "KSE-100 approaching strong resistance at 118,000. RSI divergence forming. Key support levels, breakout scenarios, and trade setups for the week.",
    tags: ["KSE-100", "RSI", "Support & Resistance"],
    content: `**Technical Picture**\n\nKSE-100 closed at 116,742 — approaching the critical 118,000 resistance zone. RSI (14) at 68 showing bearish divergence on the weekly chart.\n\n**Key Levels**\n- Resistance: 118,000 / 119,500\n- Support: 114,500 / 112,800\n- 50-DMA: 111,200 (strong support)\n\n**Scenarios**\n1. **Bull Case**: Break above 118,000 with volume → target 122,000–125,000\n2. **Bear Case**: Rejection at 118,000 → pullback to 114,500\n\n**Trade Setup**: Wait for close above 118,200 before adding longs. Tight stop at 116,000.`,
  },
  {
    id: 3, type: "Fundamental", featured: true, date: "14 Aug 2025", readMin: 11, analyst: "Equity Research", symbol: "LUCK", rating: "BUY", target: "Rs 1,250",
    title: "LUCK — FY25 Results Review & FY26 Estimates",
    summary: "FY25 EPS came in at Rs 84.2, beating estimates by 7%. Revised FY26 earnings model, DCF valuation, and updated price target of Rs 1,250.",
    tags: ["LUCK", "Earnings Review", "DCF", "Price Target"],
    content: `**Investment Thesis**\n\nLucky Cement remains our top pick in the Cement sector with a BUY rating and revised 12-month price target of Rs 1,250 (upside: 34% from CMP of Rs 932).\n\n**FY25 Results Beat**\n- EPS: Rs 84.2 vs estimate of Rs 78.8 (+7% beat)\n- Revenue: Rs 142Bn (+11% YoY)\n- EBITDA Margin: 28.4% (vs 25.1% last year)\n- DPS: Rs 20 (final dividend)\n\n**FY26 Outlook**\n- Volume growth: +8–10% supported by CPEC Phase-II infrastructure\n- Retention price recovery: PKR 50–60/bag improvement expected\n- Export contribution increasing — Iraq, Afghanistan routes\n\n**Valuation**: DCF intrinsic value Rs 1,180; P/E target multiple 15× → Rs 1,263`,
  },
  {
    id: 4, type: "Research", featured: false, date: "10 Aug 2025", readMin: 8, analyst: "Sector Research",
    title: "Banking Sector: Rate Cut Impact Analysis",
    summary: "Deep dive into how the recent 150bps rate reduction affects NIM compression, loan growth, and valuations across PSX-listed banks.",
    tags: ["Banking", "Interest Rates", "NIM"],
    content: `**Impact of 150bps Rate Cut on Banks**\n\nThe SBP's 150bps policy rate cut will compress NIMs by 30–50bps across the banking sector. However, improved loan demand and declining NPLs provide partial offset.\n\n**Winners vs Losers**\n- **Better positioned**: Banks with high CASA ratios (MEBL, MCB, HBL) will see smaller NIM compression.\n- **More exposed**: Banks with investment-heavy portfolios will see larger book mark-to-market.\n\n**Key Metrics to Watch**: CASA ratio, Advance-to-Deposit ratio, NPL coverage ratio.\n\n**Top Picks**: MEBL (BUY, target Rs 260), HBL (BUY, target Rs 210)`,
  },
  {
    id: 5, type: "Research", featured: false, date: "5 Aug 2025", readMin: 10, analyst: "Sector Research",
    title: "Cement Sector Update: Demand Recovery & Margins",
    summary: "Industry dispatches recovering post-monsoon. Cost normalization and CPEC Phase-II project pipeline outlook for FY26.",
    tags: ["Cement", "Dispatches", "FY26"],
  },
  {
    id: 6, type: "Research", featured: false, date: "28 Jul 2025", readMin: 9, analyst: "Sector Research",
    title: "Energy Chain: RLNG Pricing & Power Sector Dynamics",
    summary: "Impact of revised RLNG tariffs on gas distribution companies and the downstream effect on power-sector circular debt.",
    tags: ["Energy", "RLNG", "Circular Debt"],
  },
  {
    id: 7, type: "Technical", featured: false, date: "12 Aug 2025", readMin: 4, analyst: "Technical Desk", symbol: "ENGRO",
    title: "ENGRO — Cup & Handle Breakout in Progress",
    summary: "ENGRO completing a 14-week cup-and-handle pattern on the weekly chart. Volume confirmation observed. Target and stop-loss levels defined.",
    tags: ["ENGRO", "Chart Pattern", "Breakout"],
  },
  {
    id: 8, type: "Technical", featured: false, date: "8 Aug 2025", readMin: 3, analyst: "Technical Desk", symbol: "HBL",
    title: "HBL — Golden Cross Signal on Daily Chart",
    summary: "50-DMA has crossed above 200-DMA for HBL, generating a classic golden cross. Historical performance of similar setups on PSX banking stocks.",
    tags: ["HBL", "Moving Averages", "Golden Cross"],
  },
  {
    id: 9, type: "Technical", featured: false, date: "30 Jul 2025", readMin: 6, analyst: "Technical Desk",
    title: "Sector Rotation: Inflows Moving to Textile",
    summary: "Relative strength analysis shows capital rotating out of defensive sectors into textile exporters ahead of PKR stabilisation trade.",
    tags: ["Sector Rotation", "Textile", "Relative Strength"],
  },
  {
    id: 10, type: "Fundamental", featured: false, date: "9 Aug 2025", readMin: 9, analyst: "Equity Research", symbol: "MARI", rating: "BUY", target: "Rs 2,400",
    title: "MARI Gas — Reserve Upgrade & Valuation",
    summary: "Newly certified reserves add 15% upside to our NAV estimate. Full model update with revised production profile and SRO pricing assumptions.",
    tags: ["MARI", "NAV", "Reserves", "Gas"],
  },
  {
    id: 11, type: "Fundamental", featured: false, date: "3 Aug 2025", readMin: 14, analyst: "Equity Research", symbol: "MCB", rating: "BUY", target: "Rs 260",
    title: "MCB Bank — Initiating Coverage: BUY",
    summary: "Initiating coverage on MCB with a BUY rating. Strong CASA base, below-peer NPL ratio, and rising dividend yield make it a top pick in the banking space.",
    tags: ["MCB", "Initiation", "BUY", "Banking"],
  },
  {
    id: 12, type: "Fundamental", featured: false, date: "25 Jul 2025", readMin: 8, analyst: "Equity Research", symbol: "OGDC",
    title: "OGDC — Quarterly Cash Flow & Receivables Deep-Dive",
    summary: "Analysing Rs 340Bn+ in outstanding receivables, expected recovery timeline, and impact on dividend sustainability over the next 3 years.",
    tags: ["OGDC", "Cash Flow", "Receivables", "Dividend"],
  },
];

const TYPE_CONFIG: Record<ReportType, { color: string; bg: string; icon: string; desc: string }> = {
  Research:    { color: "#2563eb", bg: "rgba(37,99,235,0.10)",  icon: "🔍", desc: "Macro, sector & industry analysis" },
  Technical:   { color: "#16a34a", bg: "rgba(22,163,74,0.10)",  icon: "📈", desc: "Charts, patterns & price action" },
  Fundamental: { color: "#7c3aed", bg: "rgba(124,58,237,0.10)", icon: "📊", desc: "Earnings, valuations & company models" },
};

// ── Report Detail Modal ──────────────────────────────────────────────────────
function ReportModal({ r, onClose }: { r: Report; onClose: () => void }) {
  const cfg = TYPE_CONFIG[r.type];
  const lines = r.content?.split("\n") ?? [];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.50)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--card-bg,#fff)", borderRadius: 14, width: "min(760px, 100%)", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", overflow: "hidden" }}>
        {/* Modal header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>{cfg.icon} {r.type}</span>
              {r.featured && <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(200,134,10,0.12)", color: "#C8860A", fontSize: 11, fontWeight: 700 }}>⭐ Featured</span>}
              {r.rating && <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(22,163,74,0.10)", color: "#16a34a", fontSize: 11, fontWeight: 700 }}>● {r.rating}</span>}
              {r.target && <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(37,99,235,0.08)", color: "#2563eb", fontSize: 11, fontWeight: 700 }}>Target: {r.target}</span>}
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "var(--navy)", lineHeight: 1.35 }}>{r.title}</h2>
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--text-muted)" }}>
              {r.analyst && <span>✍️ {r.analyst}</span>}
              <span>📅 {r.date}</span>
              <span>⏱ {r.readMin} min read</span>
              {r.symbol && <Link href={`/data-portal/company/${r.symbol}`} style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>View {r.symbol} →</Link>}
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "rgba(0,0,0,0.06)", borderRadius: 8, width: 32, height: 32, fontSize: 18, color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 }}>×</button>
        </div>

        {/* Modal body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.7, borderLeft: "3px solid var(--border)", paddingLeft: 12 }}>{r.summary}</p>

          {r.content ? (
            <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.8 }}>
              {lines.map((line, i) => {
                if (line.startsWith("**") && line.endsWith("**")) {
                  return <h3 key={i} style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)", margin: "16px 0 6px" }}>{line.slice(2, -2)}</h3>;
                }
                if (line.startsWith("- ")) {
                  return <div key={i} style={{ paddingLeft: 16, color: "var(--text)", marginBottom: 3 }}>• {line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</div>;
                }
                if (line.startsWith("1. ") || line.match(/^\d\./)) {
                  return <div key={i} style={{ paddingLeft: 16, color: "var(--text)", marginBottom: 3 }}>{line}</div>;
                }
                if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
                return <p key={i} style={{ margin: "0 0 8px", color: "var(--text)" }}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}</p>;
              })}
            </div>
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📰</div>
              Full report available to Stockifyy Premium subscribers.
            </div>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            {r.tags.map(tag => (
              <span key={tag} style={{ padding: "3px 10px", borderRadius: 20, background: "var(--border,#e2e8f0)", color: "var(--text-muted)", fontSize: 11, fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ r, onClick }: { r: Report; onClick: () => void }) {
  const cfg = TYPE_CONFIG[r.type];
  return (
    <div className="card" style={{ padding: "18px 20px", transition: "box-shadow 150ms, transform 150ms", cursor: "pointer" }}
      onClick={onClick}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = ""; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>{r.type}</span>
          {r.featured && <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(200,134,10,0.12)", color: "#C8860A", fontSize: 11, fontWeight: 700 }}>Featured</span>}
          {r.rating && <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(22,163,74,0.10)", color: "#16a34a", fontSize: 11, fontWeight: 700 }}>{r.rating}</span>}
        </div>
        <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
          <span>📅 {r.date}</span>
          <span>⏱ {r.readMin} min</span>
        </div>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)", margin: "0 0 6px", lineHeight: 1.4 }}>{r.title}</h3>
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px", lineHeight: 1.6 }}>{r.summary}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {r.tags.slice(0, 3).map(t => (
            <span key={t} style={{ padding: "2px 8px", borderRadius: 20, background: "var(--border,#e2e8f0)", color: "var(--text-muted)", fontSize: 10, fontWeight: 600 }}>{t}</span>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "#C8860A", fontWeight: 700, whiteSpace: "nowrap", marginLeft: 8 }}>Read Report →</span>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ReportsClient() {
  const [filter, setFilter] = useState<FilterType>("All Reports");
  const [search, setSearch] = useState("");
  const [openReport, setOpenReport] = useState<Report | null>(null);

  const filtered = useMemo(() => {
    let r = REPORTS;
    if (filter !== "All Reports") r = r.filter(x => x.type === filter);
    if (search) { const q = search.toLowerCase(); r = r.filter(x => x.title.toLowerCase().includes(q) || x.summary.toLowerCase().includes(q) || x.tags.some(t => t.toLowerCase().includes(q))); }
    return r;
  }, [filter, search]);

  const counts = useMemo(() => ({
    all: REPORTS.length,
    Research: REPORTS.filter(r => r.type === "Research").length,
    Technical: REPORTS.filter(r => r.type === "Technical").length,
    Fundamental: REPORTS.filter(r => r.type === "Fundamental").length,
  }), []);

  const allTags = useMemo(() => {
    const freq: Record<string, number> = {};
    REPORTS.forEach(r => r.tags.forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 18).map(([t]) => t);
  }, []);

  const featured = filtered.filter(r => r.featured);
  const rest = filtered.filter(r => !r.featured);

  const FILTERS: [FilterType, string, number][] = [
    ["All Reports", "📰", counts.all],
    ["Research",    "🔍", counts.Research],
    ["Technical",   "📈", counts.Technical],
    ["Fundamental", "📊", counts.Fundamental],
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: "var(--background)" }}>
      {openReport && <ReportModal r={openReport} onClose={() => setOpenReport(null)} />}

      {/* ── Page header ── */}
      <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, #1a3560 100%)", padding: "28px 32px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(212,151,26,0.8)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>STOCKIFYY · RESEARCH DESK</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 6px", lineHeight: 1.1 }}>
              Market Reports <span style={{ color: "#D4971A" }}>& Analysis</span>
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: 0 }}>In-depth research, technical and fundamental coverage by the Stockifyy team</p>
          </div>
          {/* Stats chips */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {FILTERS.slice(1).map(([type, icon, count]) => {
              const cfg = TYPE_CONFIG[type as ReportType];
              return (
                <div key={type} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 18px", borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 80 }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: cfg.color }}>{count}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{type}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + content ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px", display: "flex", gap: 28, alignItems: "flex-start" }}>

        {/* ── Left sidebar ── */}
        <div style={{ width: 210, flexShrink: 0, position: "sticky", top: 72 }}>
          {/* Filter by type */}
          <div className="card" style={{ padding: "16px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>Filter By Type</div>
            {FILTERS.map(([f, icon, count]) => (
              <button key={f} onClick={() => setFilter(f as FilterType)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "8px 10px", borderRadius: 8, border: "none",
                background: filter === f ? "rgba(200,134,10,0.12)" : "transparent",
                cursor: "pointer", marginBottom: 3,
                borderLeft: filter === f ? "3px solid #C8860A" : "3px solid transparent",
              }}>
                <span style={{ fontSize: 12, fontWeight: filter === f ? 700 : 500, color: filter === f ? "#C8860A" : "var(--text-muted)" }}>{icon} {f}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: filter === f ? "#C8860A" : "var(--border)", color: filter === f ? "#fff" : "var(--text-muted)" }}>{count}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="card" style={{ padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>Search</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Report title, ticker…"
              style={{ width: "100%", padding: "8px 10px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 12, background: "var(--background)", color: "var(--text)", outline: "none", boxSizing: "border-box" }} />
            {search && <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>}
          </div>

          {/* Tags cloud */}
          <div className="card" style={{ padding: "14px" }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>Popular Tags</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {allTags.map(tag => (
                <button key={tag} onClick={() => setSearch(tag)} style={{
                  padding: "3px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, cursor: "pointer",
                  background: search === tag ? "#C8860A" : "var(--border)", color: search === tag ? "#fff" : "var(--text-muted)",
                  border: "none",
                }}>{tag}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Featured reports — prominent cards */}
          {featured.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ height: 3, width: 24, borderRadius: 2, background: "#C8860A" }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: "#C8860A", textTransform: "uppercase", letterSpacing: "0.08em" }}>Featured</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
                {featured.map(r => (
                  <div key={r.id} onClick={() => setOpenReport(r)} className="card" style={{
                    padding: "20px", cursor: "pointer", borderTop: `3px solid ${TYPE_CONFIG[r.type].color}`,
                    transition: "transform 150ms, box-shadow 150ms",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 10px 30px rgba(0,0,0,0.12)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = ""; }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                      <span style={{ padding: "2px 9px", borderRadius: 20, background: TYPE_CONFIG[r.type].bg, color: TYPE_CONFIG[r.type].color, fontSize: 10, fontWeight: 700 }}>{TYPE_CONFIG[r.type].icon} {r.type}</span>
                      {r.rating && <span style={{ padding: "2px 9px", borderRadius: 20, background: "rgba(22,163,74,0.10)", color: "#16a34a", fontSize: 10, fontWeight: 700 }}>● {r.rating}</span>}
                      {r.target && <span style={{ padding: "2px 9px", borderRadius: 20, background: "rgba(37,99,235,0.08)", color: "#2563eb", fontSize: 10, fontWeight: 700 }}>🎯 {r.target}</span>}
                    </div>
                    <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "var(--navy)", lineHeight: 1.4 }}>{r.title}</h3>
                    <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{r.summary}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {r.tags.slice(0,2).map(t => <span key={t} style={{ padding: "2px 7px", borderRadius: 10, background: "var(--border)", color: "var(--text-muted)", fontSize: 10, fontWeight: 600 }}>{t}</span>)}
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>📅 {r.date} · ⏱ {r.readMin}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {featured.length > 0 && rest.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>All Reports</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
          )}

          {/* Report grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
            {rest.map(r => <ReportCard key={r.id} r={r} onClick={() => setOpenReport(r)} />)}
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              No reports match your search. Try different keywords or clear the filter.
              {search && <button onClick={() => setSearch("")} style={{ display: "block", margin: "12px auto 0", padding: "7px 16px", border: "none", background: "#C8860A", color: "#fff", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Clear Search</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
