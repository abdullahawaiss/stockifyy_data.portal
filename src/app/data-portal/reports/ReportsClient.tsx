"use client";
import { useState, useMemo } from "react";
import Link from "next/link";

/* ── Types ───────────────────────────────────────────────────────────────────── */
type ReportType = "Research" | "Technical" | "Fundamental";
type FilterType = "All Reports" | ReportType;

interface Report {
  id: number; type: ReportType; featured: boolean; date: string; readMin: number;
  title: string; summary: string; tags: string[];
  symbol?: string; content?: string; analyst?: string; rating?: string; target?: string;
}

/* ── Reports data ────────────────────────────────────────────────────────────── */
const REPORTS: Report[] = [
  { id:1,  type:"Research",    featured:true,  date:"28 Aug 2026", readMin:14, analyst:"Stockifyy Research",
    title:"Pakistan Market Outlook — H2 2026: Turning the Corner",
    summary:"IMF programme on track, PKR stable at 278–282, SBP policy rate at 11%. KSE-100 at 132,000+ eyes 145,000 by December. In-depth sector rotation, macro risks, and our top 10 conviction picks for H2 2026.",
    tags:["Macro","H2 2026 Outlook","KSE-100","IMF","SBP Policy"],
    content:`**Executive Summary**\n\nKSE-100 has delivered YTD returns of 22.4% as of August 2026, making Pakistan one of Asia's best-performing markets.\n\n**Macro Picture — August 2026**\n\n1. **SBP Rate**: Policy rate cut to 11% in July 2026 (down 900bps from the peak of 22%). Another 100bps cut expected in October.\n2. **Inflation**: CPI at 9.2% YoY — first single-digit print in 3 years.\n3. **PKR**: Stable at 278–282 vs USD.\n4. **IMF**: 5th review completed; $1.2Bn tranche disbursed in June 2026.\n5. **Remittances**: $3.1Bn in July 2026 — a record monthly inflow.\n\n**Sector Rotation Strategy H2 2026**\n\n- **Overweight**: Banking (MEBL, HBL, MCB), Cement (LUCK, MLCF), Technology (SYS, TRG)\n- **Neutral**: Energy (OGDC, PPL), Fertilizer (FFC, EFERT)\n- **Underweight**: Textiles, Auto\n\n**Top 10 Conviction Picks**: MEBL, LUCK, HBL, TRG, SYS, MCB, ENGRO, BAHL, MLCF, MARI\n\n**Risk Factors**: Geopolitical tensions, oil price spike, IMF programme derailment.`,
  },
  { id:2,  type:"Technical",   featured:true,  date:"27 Aug 2026", readMin:6,  analyst:"Technical Desk",
    title:"KSE-100 Weekly Technical: Breakout Confirmed at 132K",
    summary:"KSE-100 has confirmed a weekly close above the 131,500 neckline — a classic inverse head-and-shoulders breakout with measured target of 145,000. RSI healthy at 62.",
    tags:["KSE-100","Inverse H&S","Breakout","RSI","Support & Resistance"],
    content:`**Technical Picture — Week Ending 29 Aug 2026**\n\nKSE-100 closed at 132,240, confirming a breakout from a 16-week inverse head-and-shoulders pattern.\n\n**Key Levels**\n- Breakout Level (now support): 131,500\n- Immediate Resistance: 134,200\n- H&S Measured Target: 145,000 (12-week view)\n- 50-DMA: 124,800 (rising fast)\n\n**Oscillators**\n- RSI (14): 62 — positive, room before overbought\n- MACD: Bullish crossover on daily, expanding histogram\n\n**Trade Setups**\n1. **Primary**: Long on any retest of 131,500–132,000. Target 140,000. Stop 129,800.\n2. **Momentum**: Add on breakout above 134,200 with volume. Target 138,000.`,
  },
  { id:3,  type:"Fundamental", featured:true,  date:"26 Aug 2026", readMin:13, analyst:"Equity Research", symbol:"MEBL", rating:"BUY", target:"Rs 285",
    title:"Meezan Bank — FY26 Results Review: Record Profitability",
    summary:"MEBL delivered FY26 EPS of Rs 24.8 (up 31% YoY), beating consensus by 9%. ROE hits 35% — highest in Pakistan's banking history. Revised PT of Rs 285 with BUY.",
    tags:["MEBL","FY26 Results","BUY","Banking","Islamic Finance"],
    content:`**Investment Thesis — MEBL: Pakistan's Premier Islamic Bank**\n\nWe reiterate our BUY rating on Meezan Bank with a revised 12-month price target of Rs 285 (upside: 38% from CMP of Rs 207).\n\n**FY26 Results Highlights**\n- EPS: Rs 24.8 vs consensus Rs 22.7 (+9.3% beat)\n- Net Income: Rs 52.8Bn (+31% YoY)\n- ROE: 35.1% — record high; best in sector\n- CASA Ratio: 68.2%\n- NPL Ratio: 0.8% — lowest in Pakistan\n- DPS: Rs 6.50 final + Rs 4.00 interim = Rs 10.50 total FY26\n\n**FY27 Estimates**\n- EPS (Stockifyy): Rs 29.5 (+19% YoY)\n- ROE: 36%+\n- DPS estimate: Rs 12.00\n\n**Valuation**: 2.0× FY27 P/B → Rs 285 target.`,
  },
  { id:4,  type:"Research",    featured:true,  date:"25 Aug 2026", readMin:9,  analyst:"Sector Research",
    title:"Banking Sector: NIM Dynamics in a Declining Rate Environment",
    summary:"SBP's 900bps rate cut cycle has compressed NIMs differently across banks. MEBL and MCB best positioned. Modelling NIM trajectories for FY27 for all PSX-listed commercial banks.",
    tags:["Banking","NIM","Rate Cut","FY27 Estimates"],
    content:`**NIM Rankings FY26 (Estimated)**\n- MEBL: 5.8% (stable — Islamic model)\n- MCB: 5.1%\n- HBL: 4.9%\n- UBL: 4.7%\n- NBP: 3.8%\n\n**FY27 Catalysts**\n- Loan growth recovering: +18% industry advance growth expected\n- Fee income rising: trade finance, FX, and digital banking\n\n**Top Picks**: MEBL (BUY, Rs 285), MCB (BUY, Rs 270), HBL (ACCUMULATE, Rs 215)`,
  },
  { id:5,  type:"Fundamental", featured:true,  date:"23 Aug 2026", readMin:12, analyst:"Equity Research", symbol:"MCB", rating:"BUY", target:"Rs 270",
    title:"MCB Bank FY26 Preview: EPS of Rs 35 Expected",
    summary:"MCB reports on September 5. We model EPS of Rs 35 — a 16% beat on consensus Rs 30.2. Strong CASA of 55%, well-positioned in declining rate cycle.",
    tags:["MCB","FY26 Preview","BUY","EPS Estimate","Banking"],
    content:`**MCB Bank — FY26 Preview & Initiation**\n\nWe initiate coverage on MCB Bank with a BUY rating and 12-month price target of Rs 270.\n\n**Our FY26 Estimates vs Consensus**\n- EPS (Stockifyy): Rs 35.0 vs consensus Rs 30.2 (+16% above)\n- Net Income: Rs 40.5Bn\n- ROE: 24.8%\n- DPS: Rs 10.0 final\n\n**Valuation**: 1.9× FY27 P/B → Rs 270 target.`,
  },
  { id:6,  type:"Technical",   featured:true,  date:"24 Aug 2026", readMin:4,  analyst:"Technical Desk", symbol:"LUCK",
    title:"LUCK — Weekly Bullish Flag Targets Rs 1,350",
    summary:"Lucky Cement is consolidating within a textbook 4-week bullish flag at Rs 1,180. Volume is contracting on the flag — classic pattern. Measured move targets Rs 1,350.",
    tags:["LUCK","Flag Pattern","Breakout","Chart Setup"],
  },
  { id:7,  type:"Research",    featured:false, date:"22 Aug 2026", readMin:11, analyst:"Sector Research",
    title:"Cement Sector H2 2026: Volume Recovery & Pricing Power",
    summary:"Cement dispatches rose 14% YoY in July 2026 driven by infrastructure spending. Local retention prices up Rs 60–80/bag. Updated model for LUCK, MLCF, DGKC.",
    tags:["Cement","LUCK","MLCF","Dispatches","FY27"],
  },
  { id:8,  type:"Research",    featured:false, date:"18 Aug 2026", readMin:8,  analyst:"Sector Research",
    title:"Technology Sector: IT Exports Hit $3.8Bn — New Record",
    summary:"Pakistan's IT exports reached $3.8Bn in FY26, growing 28% YoY. TRG, SYS, and AVN benefitting from global nearshoring trend.",
    tags:["Technology","TRG","SYS","IT Exports","SECP"],
  },
  { id:9,  type:"Research",    featured:false, date:"14 Aug 2026", readMin:10, analyst:"Sector Research",
    title:"Fertilizer Sector: Urea Prices, Gas Allocation & FY27 Dividends",
    summary:"Urea prices stabilized at Rs 3,850/bag. FFC and EFERT remain cash cows with >10% dividend yields.",
    tags:["Fertilizer","FFC","EFERT","Urea","Dividend Yield"],
  },
  { id:10, type:"Research",    featured:false, date:"10 Aug 2026", readMin:7,  analyst:"Sector Research",
    title:"Oil & Gas E&P: Pakistan's Exploration Renaissance",
    summary:"OGDC and MARI are drilling 12 new wells in FY27 — the highest exploration activity since 2018. Bullish on MARI (target Rs 2,700).",
    tags:["OGDC","MARI","PPL","Exploration","E&P"],
  },
  { id:11, type:"Technical",   featured:false, date:"21 Aug 2026", readMin:5,  analyst:"Technical Desk", symbol:"TRG",
    title:"TRG — Base Breakout with 52-Week High Volume",
    summary:"TRG broke above its 14-month base at Rs 175 with volume 3× the 20-DMA — a major technical signal. Measured target Rs 240.",
    tags:["TRG","Volume Breakout","52-Week High","Technology"],
  },
  { id:12, type:"Technical",   featured:false, date:"17 Aug 2026", readMin:3,  analyst:"Technical Desk", symbol:"HBL",
    title:"HBL — Golden Cross Confirms Uptrend; Target Rs 220",
    summary:"50-DMA crossed above 200-DMA on HBL for the first time in 18 months. RSI at 58 — clean momentum.",
    tags:["HBL","Golden Cross","Moving Averages","Banking"],
  },
  { id:13, type:"Technical",   featured:false, date:"12 Aug 2026", readMin:6,  analyst:"Technical Desk",
    title:"PSX Sector Relative Strength — August 2026 Update",
    summary:"Banking and Cement leading; Textile lagging. Relative strength rankings across all 10 PSX sectors.",
    tags:["Sector Rotation","Relative Strength","PSX Sectors"],
  },
  { id:14, type:"Technical",   featured:false, date:"8 Aug 2026",  readMin:4,  analyst:"Technical Desk", symbol:"ENGRO",
    title:"ENGRO — Inverse H&S at Multi-Month Support Zone",
    summary:"ENGRO has formed a 9-week inverse head-and-shoulders at Rs 295–310 support. Neckline at Rs 340. Risk-reward at current levels is 3.8:1.",
    tags:["ENGRO","Inverse H&S","Support Zone","Chart Pattern"],
  },
  { id:15, type:"Fundamental", featured:false, date:"20 Aug 2026", readMin:10, analyst:"Equity Research", symbol:"OGDC", rating:"ACCUMULATE", target:"Rs 185",
    title:"OGDC — Receivable Recovery & Dividend Sustainability",
    summary:"Rs 380Bn in government receivables remain a key overhang. FY26 cash recovery of Rs 65Bn signals progress. Dividend of Rs 9/share for FY26.",
    tags:["OGDC","Receivables","Dividend","E&P","Government Policy"],
  },
  { id:16, type:"Fundamental", featured:false, date:"16 Aug 2026", readMin:8,  analyst:"Equity Research", symbol:"SYS", rating:"BUY", target:"Rs 850",
    title:"Systems Limited — Record IT Exports; Raising PT to Rs 850",
    summary:"SYS delivered FY26 revenue of Rs 29Bn (+35% YoY). EPS Rs 72. Raising price target from Rs 730 to Rs 850.",
    tags:["SYS","IT Exports","FY26 Results","BUY","Technology"],
  },
  { id:17, type:"Fundamental", featured:false, date:"11 Aug 2026", readMin:9,  analyst:"Equity Research", symbol:"FFC", rating:"BUY", target:"Rs 145",
    title:"FFC — Initiating Coverage: 11.5% Dividend Yield, BUY",
    summary:"Fauji Fertilizers' high payout policy (Rs 16/share DPS expected FY26) and defensive earnings make it ideal for income investors.",
    tags:["FFC","Fertilizer","Dividend","Initiation","BUY"],
  },
  { id:18, type:"Fundamental", featured:false, date:"5 Aug 2026",  readMin:11, analyst:"Equity Research", symbol:"MARI", rating:"BUY", target:"Rs 2,700",
    title:"MARI Gas — Reserve Upgrade Adds 18% to NAV; Raising PT",
    summary:"Newly certified 2P reserves of 3.8Tcf represent an 18% upside. Full NAV model updated with revised production profile.",
    tags:["MARI","NAV","Reserve Upgrade","Gas","BUY"],
  },
];

const TYPE_CONFIG: Record<ReportType, { color: string; bg: string; icon: string }> = {
  Research:    { color:"#2563eb", bg:"rgba(37,99,235,0.10)",  icon:"🔍" },
  Technical:   { color:"#16a34a", bg:"rgba(22,163,74,0.10)",  icon:"📈" },
  Fundamental: { color:"#7c3aed", bg:"rgba(124,58,237,0.10)", icon:"📊" },
};

/* ── Report modal ── */
function ReportModal({ r, onClose }: { r: Report; onClose: () => void }) {
  const cfg = TYPE_CONFIG[r.type];
  const lines = r.content?.split("\n") ?? [];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.50)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"var(--card-bg,#fff)", borderRadius:14, width:"min(760px,100%)", maxHeight:"88vh", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.3)", overflow:"hidden" }}>
        <div style={{ padding:"18px 24px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexShrink:0 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
              <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:20, background:cfg.bg, color:cfg.color, fontSize:11, fontWeight:700 }}>{cfg.icon} {r.type}</span>
              {r.rating && <span style={{ padding:"3px 10px", borderRadius:20, background:"rgba(22,163,74,0.10)", color:"#16a34a", fontSize:11, fontWeight:700 }}>● {r.rating}</span>}
              {r.target && <span style={{ padding:"3px 10px", borderRadius:20, background:"rgba(37,99,235,0.08)", color:"#2563eb", fontSize:11, fontWeight:700 }}>🎯 {r.target}</span>}
            </div>
            <h2 style={{ margin:"0 0 6px", fontSize:17, fontWeight:800, color:"var(--navy)", lineHeight:1.35 }}>{r.title}</h2>
            <div style={{ display:"flex", gap:14, fontSize:11, color:"var(--text-muted)", flexWrap:"wrap" }}>
              {r.analyst && <span>✍️ {r.analyst}</span>}
              <span>📅 {r.date}</span>
              <span>⏱ {r.readMin} min read</span>
              {r.symbol && <Link href={`/data-portal/company/${r.symbol}`} style={{ color:"#C8860A", fontWeight:700, textDecoration:"none" }}>View {r.symbol} →</Link>}
            </div>
          </div>
          <button onClick={onClose} style={{ border:"none", background:"rgba(0,0,0,0.06)", borderRadius:8, width:32, height:32, fontSize:18, color:"var(--text-muted)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginLeft:12 }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px" }}>
          <p style={{ fontSize:13, color:"var(--text-muted)", marginBottom:16, lineHeight:1.7, borderLeft:"3px solid var(--border)", paddingLeft:12 }}>{r.summary}</p>
          {r.content ? (
            <div style={{ fontSize:13, color:"var(--text)", lineHeight:1.8 }}>
              {lines.map((line, i) => {
                if (line.startsWith("**") && line.endsWith("**")) return <h3 key={i} style={{ fontSize:14, fontWeight:800, color:"var(--navy)", margin:"16px 0 6px" }}>{line.slice(2,-2)}</h3>;
                if (line.startsWith("- ")) return <div key={i} style={{ paddingLeft:16, marginBottom:3 }}>• {line.slice(2).replace(/\*\*(.*?)\*\*/g,"$1")}</div>;
                if (line.match(/^\d\./)) return <div key={i} style={{ paddingLeft:16, marginBottom:3 }}>{line}</div>;
                if (!line.trim()) return <div key={i} style={{ height:6 }} />;
                return <p key={i} style={{ margin:"0 0 8px" }}>{line.replace(/\*\*(.*?)\*\*/g,"$1")}</p>;
              })}
            </div>
          ) : (
            <div style={{ padding:"40px 20px", textAlign:"center", color:"var(--text-muted)", fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📰</div>
              Full report available to Stockifyy Premium subscribers.
            </div>
          )}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:16, paddingTop:16, borderTop:"1px solid var(--border)" }}>
            {r.tags.map(tag => <span key={tag} style={{ padding:"3px 10px", borderRadius:20, background:"var(--border,#e2e8f0)", color:"var(--text-muted)", fontSize:11, fontWeight:600 }}>{tag}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function ReportsClient() {
  const [filter, setFilter]     = useState<FilterType>("All Reports");
  const [search, setSearch]     = useState("");
  const [openReport, setOpenReport] = useState<Report|null>(null);

  const filtered = useMemo(() => {
    let r = REPORTS;
    if (filter !== "All Reports") r = r.filter(x => x.type === filter);
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(x => x.title.toLowerCase().includes(q) || x.summary.toLowerCase().includes(q) || x.tags.some(t => t.toLowerCase().includes(q)));
    }
    return r;
  }, [filter, search]);

  const featured = useMemo(() => filtered.filter(r => r.featured), [filtered]);
  const rest     = useMemo(() => filtered.filter(r => !r.featured), [filtered]);

  const counts = {
    all: REPORTS.length,
    Research:    REPORTS.filter(r => r.type==="Research").length,
    Technical:   REPORTS.filter(r => r.type==="Technical").length,
    Fundamental: REPORTS.filter(r => r.type==="Fundamental").length,
  };

  const allTags = useMemo(() => {
    const freq: Record<string,number> = {};
    REPORTS.forEach(r => r.tags.forEach(t => { freq[t]=(freq[t]||0)+1; }));
    return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,18).map(([t])=>t);
  }, []);

  const FILTERS: [FilterType,string,number][] = [
    ["All Reports","📰",counts.all],
    ["Research","🔍",counts.Research],
    ["Technical","📈",counts.Technical],
    ["Fundamental","📊",counts.Fundamental],
  ];

  return (
    <div style={{ minHeight:"calc(100vh - 60px)", background:"var(--background)" }}>
      {openReport && <ReportModal r={openReport} onClose={() => setOpenReport(null)} />}

      {/* ── Header ── */}
      <div style={{ background:"linear-gradient(135deg, var(--navy) 0%, #1a3560 100%)", padding:"28px 32px 20px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:16, paddingBottom:20 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:800, color:"rgba(212,151,26,0.8)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:6 }}>STOCKIFYY · RESEARCH DESK</div>
              <h1 style={{ fontSize:26, fontWeight:900, color:"#fff", margin:"0 0 5px", lineHeight:1.1 }}>Research <span style={{ color:"#D4971A" }}>Reports</span></h1>
              <p style={{ fontSize:13, color:"rgba(255,255,255,0.5)", margin:"0 0 14px" }}>In-depth market analysis by the Stockifyy research team</p>
              <Link href="/data-portal/news"
                style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:8, background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", color:"#fca5a5", fontSize:12, fontWeight:700, textDecoration:"none" }}>
                <span style={{ width:7, height:7, borderRadius:"50%", background:"#dc2626", animation:"pulse 1.5s infinite", display:"inline-block" }} />
                View PSX Live News →
              </Link>
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {FILTERS.slice(1).map(([type,icon,count]) => (
                <div key={type} style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 18px", borderRadius:10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.12)", minWidth:80 }}>
                  <div style={{ fontSize:18 }}>{icon}</div>
                  <div style={{ fontSize:18, fontWeight:900, color:TYPE_CONFIG[type as ReportType].color }}>{count}</div>
                  <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.45)", textTransform:"uppercase" }}>{type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"24px 32px", display:"flex", gap:28, alignItems:"flex-start" }}>

        {/* ── Sidebar ── */}
        <div style={{ width:210, flexShrink:0, position:"sticky", top:72 }}>
          <div className="card" style={{ padding:"16px 14px", marginBottom:14 }}>
            <div style={{ fontSize:9.5, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:10 }}>Filter By Type</div>
            {FILTERS.map(([f,icon,count]) => (
              <button key={f} onClick={() => setFilter(f as FilterType)} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                width:"100%", padding:"8px 10px", borderRadius:8, border:"none",
                background: filter===f ? "rgba(200,134,10,0.12)" : "transparent",
                cursor:"pointer", marginBottom:3,
                borderLeft: filter===f ? "3px solid #C8860A" : "3px solid transparent",
              }}>
                <span style={{ fontSize:12, fontWeight:filter===f?700:500, color:filter===f?"#C8860A":"var(--text-muted)" }}>{icon} {f}</span>
                <span style={{ fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:10, background:filter===f?"#C8860A":"var(--border)", color:filter===f?"#fff":"var(--text-muted)" }}>{count}</span>
              </button>
            ))}
          </div>

          <div className="card" style={{ padding:"12px 14px", marginBottom:14 }}>
            <div style={{ fontSize:9.5, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:8 }}>Search</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Report title, ticker…"
              style={{ width:"100%", padding:"8px 10px", border:"1.5px solid var(--border)", borderRadius:7, fontSize:12, background:"var(--background)", color:"var(--text)", outline:"none", boxSizing:"border-box" }} />
            {search && <div style={{ marginTop:6, fontSize:11, color:"var(--text-muted)" }}>{filtered.length} result{filtered.length!==1?"s":""}</div>}
          </div>

          <div className="card" style={{ padding:"14px" }}>
            <div style={{ fontSize:9.5, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:8 }}>Popular Tags</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {allTags.slice(0,16).map(tag => (
                <button key={tag} onClick={() => setSearch(search===tag?"":tag)} style={{
                  padding:"3px 8px", borderRadius:12, fontSize:10, fontWeight:600, cursor:"pointer",
                  background:search===tag?"#C8860A":"var(--border)", color:search===tag?"#fff":"var(--text-muted)", border:"none",
                }}>{tag}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{ flex:1, minWidth:0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding:"60px 20px", textAlign:"center", color:"var(--text-muted)", fontSize:13 }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🔍</div>
              No reports match your search.
              {search && <button onClick={() => setSearch("")} style={{ display:"block", margin:"12px auto 0", padding:"7px 16px", border:"none", background:"#C8860A", color:"#fff", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>Clear Search</button>}
            </div>
          ) : (
            <>
              {/* ── Featured ── */}
              {featured.length > 0 && (
                <div style={{ marginBottom:32 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                    <div style={{ height:3, width:24, borderRadius:2, background:"#C8860A" }} />
                    <span style={{ fontSize:11, fontWeight:800, color:"#C8860A", textTransform:"uppercase", letterSpacing:"0.08em" }}>Featured Reports</span>
                    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:"rgba(200,134,10,0.12)", color:"#C8860A", fontWeight:700 }}>{featured.length}</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:16 }}>
                    {featured.map(r => {
                      const cfg = TYPE_CONFIG[r.type];
                      return (
                        <div key={r.id} onClick={() => setOpenReport(r)} className="card"
                          style={{ padding:"20px", cursor:"pointer", borderTop:`3px solid ${cfg.color}`, transition:"transform 150ms, box-shadow 150ms" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 10px 30px rgba(0,0,0,0.12)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform="none"; (e.currentTarget as HTMLElement).style.boxShadow=""; }}>
                          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
                            <span style={{ padding:"2px 9px", borderRadius:20, background:cfg.bg, color:cfg.color, fontSize:10, fontWeight:700 }}>{cfg.icon} {r.type}</span>
                            {r.rating && <span style={{ padding:"2px 9px", borderRadius:20, background:"rgba(22,163,74,0.10)", color:"#16a34a", fontSize:10, fontWeight:700 }}>● {r.rating}</span>}
                            {r.target && <span style={{ padding:"2px 9px", borderRadius:20, background:"rgba(37,99,235,0.08)", color:"#2563eb", fontSize:10, fontWeight:700 }}>🎯 {r.target}</span>}
                          </div>
                          <h3 style={{ margin:"0 0 8px", fontSize:14, fontWeight:800, color:"var(--navy)", lineHeight:1.4 }}>{r.title}</h3>
                          <p style={{ margin:"0 0 12px", fontSize:12, color:"var(--text-muted)", lineHeight:1.6 }}>{r.summary}</p>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:11, color:"var(--text-muted)" }}>📅 {r.date} · ⏱ {r.readMin}m</span>
                            <span style={{ fontSize:12, color:"#C8860A", fontWeight:700 }}>Read →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── All Reports ── */}
              {rest.length > 0 && (
                <>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                    <div style={{ flex:1, height:1, background:"var(--border)" }} />
                    <span style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em" }}>All Reports · {rest.length} reports</span>
                    <div style={{ flex:1, height:1, background:"var(--border)" }} />
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:14 }}>
                    {rest.map(r => {
                      const cfg = TYPE_CONFIG[r.type];
                      return (
                        <div key={r.id} onClick={() => setOpenReport(r)} className="card"
                          style={{ padding:"18px 20px", cursor:"pointer", transition:"box-shadow 150ms, transform 150ms" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 8px 24px rgba(0,0,0,0.10)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform="none"; (e.currentTarget as HTMLElement).style.boxShadow=""; }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                              <span style={{ padding:"2px 9px", borderRadius:20, background:cfg.bg, color:cfg.color, fontSize:10, fontWeight:700 }}>{r.type}</span>
                              {r.rating && <span style={{ padding:"2px 9px", borderRadius:20, background:"rgba(22,163,74,0.10)", color:"#16a34a", fontSize:10, fontWeight:700 }}>{r.rating}</span>}
                            </div>
                            <span style={{ fontSize:10, color:"var(--text-muted)", whiteSpace:"nowrap" }}>⏱ {r.readMin}m</span>
                          </div>
                          <h3 style={{ fontSize:13.5, fontWeight:800, color:"var(--navy)", margin:"0 0 6px", lineHeight:1.4 }}>{r.title}</h3>
                          <p style={{ fontSize:12, color:"var(--text-muted)", margin:"0 0 10px", lineHeight:1.6 }}>{r.summary}</p>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:10, color:"var(--text-muted)" }}>📅 {r.date}</span>
                            <span style={{ fontSize:11, color:"#C8860A", fontWeight:700 }}>Read Report →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}
