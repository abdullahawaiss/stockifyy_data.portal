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

  const featured = filtered.filter(r => r.featured);
  const byType = (t: ReportType) => filtered.filter(r => !r.featured && r.type === t);

  const pillStyle = (f: FilterType): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 16px", borderRadius: 8,
    background: filter === f ? "#C8860A" : "var(--card-bg,#fff)",
    color: filter === f ? "#fff" : "var(--text-muted,#64748b)",
    border: `1.5px solid ${filter === f ? "#C8860A" : "var(--border,#e2e8f0)"}`,
    fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 150ms",
  });

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      {openReport && <ReportModal r={openReport} onClose={() => setOpenReport(null)} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
            <span style={{ color: "var(--navy)" }}>Stockifyy</span> <span style={{ color: "#C8860A" }}>Reports</span>
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>In-depth research, technical and fundamental analysis by the Stockifyy team</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>{filtered.length} report{filtered.length !== 1 ? "s" : ""}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports…"
            style={{ padding: "9px 14px", border: "1.5px solid var(--border,#e2e8f0)", borderRadius: 8, fontSize: 13, background: "var(--background,#f8fafc)", color: "var(--text)", outline: "none", width: 200 }} />
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {([["All Reports", counts.all], ["Research", counts.Research], ["Technical", counts.Technical], ["Fundamental", counts.Fundamental]] as [string, number][]).map(([label, count]) => {
          const f = label as FilterType;
          return (
            <button key={label} style={pillStyle(f)} onClick={() => setFilter(f)}>
              {label === "Research" && "🔍 "}{label === "Technical" && "📈 "}{label === "Fundamental" && "📊 "}
              {label} <span style={{ fontSize: 11, opacity: 0.75, marginLeft: 2 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", background: "#C8860A", borderRadius: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>⭐ Featured Reports</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
            {featured.map(r => <ReportCard key={r.id} r={r} onClick={() => setOpenReport(r)} />)}
          </div>
        </div>
      )}

      {/* By type sections */}
      {(["Research", "Technical", "Fundamental"] as ReportType[]).map(type => {
        const reps = byType(type);
        if (!reps.length) return null;
        const cfg = TYPE_CONFIG[type];
        return (
          <div key={type} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 8, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 800 }}>
                {cfg.icon} {type}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{cfg.desc}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
              {reps.map(r => <ReportCard key={r.id} r={r} onClick={() => setOpenReport(r)} />)}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          No reports match your search. Try different keywords.
        </div>
      )}
    </div>
  );
}
