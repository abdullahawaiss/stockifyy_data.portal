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
}

const REPORTS: Report[] = [
  { id:1,  type:"Research",    featured:true,  date:"15 Aug 2025", readMin:12, title:"Pakistan Market Outlook — Q3 2025", summary:"A comprehensive analysis of macroeconomic indicators, SBP policy direction, and sector rotation trends expected in Q3 2025.", tags:["Macro","Market Outlook","SBP Policy"] },
  { id:2,  type:"Technical",   featured:true,  date:"16 Aug 2025", readMin:5,  title:"KSE-100 Weekly Technical Outlook",   summary:"KSE-100 approaching strong resistance at 118,000. RSI divergence forming. Key support levels, breakout scenarios, and trade setups for the week.", tags:["KSE-100","RSI","Support & Resistance"] },
  { id:3,  type:"Fundamental", featured:true,  date:"14 Aug 2025", readMin:11, title:"LUCK — FY25 Results Review & FY26 Estimates", summary:"FY25 EPS came in at Rs 84.2, beating estimates by 7%. Revised FY26 earnings model, DCF valuation, and updated price target of Rs 1,250.", tags:["LUCK","Earnings Review","DCF","Price Target"], symbol:"LUCK" },
  { id:4,  type:"Research",    featured:false, date:"10 Aug 2025", readMin:8,  title:"Banking Sector: Rate Cut Impact Analysis", summary:"Deep dive into how the recent 150bps rate reduction affects NIM compression, loan growth, and valuations across PSX-listed banks.", tags:["Banking","Interest Rates","NIM"] },
  { id:5,  type:"Research",    featured:false, date:"5 Aug 2025",  readMin:10, title:"Cement Sector Update: Demand Recovery & Margins", summary:"Industry dispatches recovering post-monsoon. Cost normalization and CPEC Phase-II project pipeline outlook for FY26.", tags:["Cement","Dispatches","FY26"] },
  { id:6,  type:"Research",    featured:false, date:"28 Jul 2025", readMin:9,  title:"Energy Chain: RLNG Pricing & Power Sector Dynamics", summary:"Impact of revised RLNG tariffs on gas distribution companies and the downstream effect on power-sector circular debt.", tags:["Energy","RLNG","Circular Debt"] },
  { id:7,  type:"Technical",   featured:false, date:"12 Aug 2025", readMin:4,  title:"ENGRO — Cup & Handle Breakout in Progress", summary:"ENGRO completing a 14-week cup-and-handle pattern on the weekly chart. Volume confirmation observed. Target and stop-loss levels defined.", tags:["ENGRO","Chart Pattern","Breakout"], symbol:"ENGRO" },
  { id:8,  type:"Technical",   featured:false, date:"8 Aug 2025",  readMin:3,  title:"HBL — Golden Cross Signal on Daily Chart", summary:"50-DMA has crossed above 200-DMA for HBL, generating a classic golden cross. Historical performance of similar setups on PSX banking stocks.", tags:["HBL","Moving Averages","Golden Cross"], symbol:"HBL" },
  { id:9,  type:"Technical",   featured:false, date:"30 Jul 2025", readMin:6,  title:"Sector Rotation: Inflows Moving to Textile", summary:"Relative strength analysis shows capital rotating out of defensive sectors into textile exporters ahead of PKR stabilisation trade.", tags:["Sector Rotation","Textile","Relative Strength"] },
  { id:10, type:"Fundamental", featured:false, date:"9 Aug 2025",  readMin:9,  title:"MARI Gas — Reserve Upgrade & Valuation", summary:"Newly certified reserves add 15% upside to our NAV estimate. Full model update with revised production profile and SRO pricing assumptions.", tags:["MARI","NAV","Reserves","Gas"], symbol:"MARI" },
  { id:11, type:"Fundamental", featured:false, date:"3 Aug 2025",  readMin:14, title:"MCB Bank — Initiating Coverage: BUY", summary:"Initiating coverage on MCB with a BUY rating. Strong CASA base, below-peer NPL ratio, and rising dividend yield make it a top pick in the banking space.", tags:["MCB","Initiation","BUY","Banking"], symbol:"MCB" },
  { id:12, type:"Fundamental", featured:false, date:"25 Jul 2025", readMin:8,  title:"OGDC — Quarterly Cash Flow & Receivables Deep-Dive", summary:"Analysing Rs 340Bn+ in outstanding receivables, expected recovery timeline, and impact on dividend sustainability over the next 3 years.", tags:["OGDC","Cash Flow","Receivables","Dividend"], symbol:"OGDC" },
];

const TYPE_CONFIG: Record<ReportType, { color: string; bg: string; icon: string; desc: string }> = {
  Research:    { color:"#2563eb", bg:"rgba(37,99,235,0.10)",  icon:"🔍", desc:"Macro, sector & industry analysis" },
  Technical:   { color:"#16a34a", bg:"rgba(22,163,74,0.10)",  icon:"📈", desc:"Charts, patterns & price action" },
  Fundamental: { color:"#7c3aed", bg:"rgba(124,58,237,0.10)", icon:"📊", desc:"Earnings, valuations & company models" },
};

function TypeBadge({ type, featured }: { type: ReportType; featured?: boolean }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, background:cfg.bg, color:cfg.color, fontSize:11, fontWeight:700, marginRight:4 }}>
      {type}
    </span>
  );
}

function ReportCard({ r }: { r: Report }) {
  return (
    <div className="card" style={{ padding:"18px 20px", transition:"box-shadow 150ms, transform 150ms", cursor:"pointer" }}
      onMouseEnter={e=>{ const el=e.currentTarget as HTMLElement; el.style.transform="translateY(-2px)"; el.style.boxShadow="0 8px 24px rgba(0,0,0,0.10)"; }}
      onMouseLeave={e=>{ const el=e.currentTarget as HTMLElement; el.style.transform="none"; el.style.boxShadow=""; }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          <TypeBadge type={r.type} />
          {r.featured && <span style={{ padding:"3px 10px", borderRadius:20, background:"rgba(200,134,10,0.12)", color:"#C8860A", fontSize:11, fontWeight:700 }}>Featured</span>}
        </div>
        <div style={{ display:"flex", gap:10, fontSize:11, color:"var(--text-muted)", whiteSpace:"nowrap", flexShrink:0 }}>
          <span>📅 {r.date}</span>
          <span>⏱ {r.readMin} min</span>
        </div>
      </div>
      <h3 style={{ fontSize:15, fontWeight:800, color:"var(--navy)", margin:"0 0 6px", lineHeight:1.4 }}>{r.title}</h3>
      <p style={{ fontSize:12, color:"var(--text-muted)", margin:"0 0 12px", lineHeight:1.6 }}>{r.summary}</p>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {r.tags.map(t=>(
            <span key={t} style={{ padding:"2px 8px", borderRadius:20, background:"var(--border,#e2e8f0)", color:"var(--text-muted)", fontSize:10, fontWeight:600 }}>{t}</span>
          ))}
        </div>
        {r.symbol ? (
          <Link href={`/data-portal/company/${r.symbol}`} style={{ fontSize:12, color:"#C8860A", fontWeight:700, textDecoration:"none", whiteSpace:"nowrap" }} onClick={e=>e.stopPropagation()}>
            Read Report →
          </Link>
        ) : (
          <span style={{ fontSize:12, color:"#C8860A", fontWeight:700, whiteSpace:"nowrap" }}>Read Report →</span>
        )}
      </div>
    </div>
  );
}

export default function ReportsClient() {
  const [filter, setFilter] = useState<FilterType>("All Reports");
  const [search, setSearch] = useState("");

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
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"7px 16px", borderRadius:8,
    background: filter===f ? "#C8860A" : "var(--card-bg,#fff)",
    color: filter===f ? "#fff" : "var(--text-muted,#64748b)",
    border: `1.5px solid ${filter===f ? "#C8860A" : "var(--border,#e2e8f0)"}`,
    fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 150ms",
  });

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>
            <span style={{ color:"var(--navy)" }}>Stockifyy</span> <span style={{ color:"#C8860A" }}>Reports</span>
          </h1>
          <p style={{ fontSize:13, color:"var(--text-muted)", margin:"4px 0 0" }}>In-depth research, technical and fundamental analysis by the Stockifyy team</p>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search reports…"
          style={{ padding:"9px 14px", border:"1.5px solid var(--border,#e2e8f0)", borderRadius:8, fontSize:13, background:"var(--background,#f8fafc)", color:"var(--text)", outline:"none", width:220 }} />
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:24 }}>
        {([["All Reports", counts.all], ["Research", counts.Research], ["Technical Analysis", counts.Technical], ["Fundamental", counts.Fundamental]] as [FilterType|string, number][]).map(([label, count]) => {
          const f = label === "Technical Analysis" ? "Technical" : label as FilterType;
          return (
            <button key={label} style={pillStyle(f)} onClick={()=>setFilter(f)}>
              {label === "Research" && "🔍"} {label === "Technical Analysis" && "📈"} {label === "Fundamental" && "📊"}
              {label} <span style={{ fontSize:11, opacity:0.75, marginLeft:2 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 14px", background:"#C8860A", borderRadius:8, marginBottom:14 }}>
            <span style={{ fontSize:12, fontWeight:800, color:"#fff" }}>⭐ Featured</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
            {featured.map(r => <ReportCard key={r.id} r={r} />)}
          </div>
        </div>
      )}

      {/* By type sections */}
      {(["Research","Technical","Fundamental"] as ReportType[]).map(type => {
        const reps = byType(type);
        if (!reps.length) return null;
        const cfg = TYPE_CONFIG[type];
        return (
          <div key={type} style={{ marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 14px", borderRadius:8, background:cfg.bg, color:cfg.color, fontSize:12, fontWeight:800 }}>
                {cfg.icon} {type}
              </span>
              <span style={{ fontSize:12, color:"var(--text-muted)" }}>{cfg.desc}</span>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
              {reps.map(r => <ReportCard key={r.id} r={r} />)}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ padding:"60px 20px", textAlign:"center", color:"var(--text-muted)", fontSize:13 }}>
          No reports match your search. Try different keywords.
        </div>
      )}
    </div>
  );
}
