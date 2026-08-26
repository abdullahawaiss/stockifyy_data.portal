"use client";

const G = {
  gold:   "#E79A00",
  goldLt: "#F5C518",
  bronze: "#B87B1A",
  navy:   "#0F1B2D",
  dark:   "#1E2B3C",
  green:  "#16A34A",
  red:    "#DC2626",
  border: "rgba(231,154,0,0.16)",
  card:   "rgba(255,255,255,0.80)",
} as const;

const STYLES = `
  @keyframes fu { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
  @keyframes drawLine { to{stroke-dashoffset:0} }
  .fu{animation:fu .7s cubic-bezier(.22,1,.36,1) both}
  .d1{animation-delay:.06s} .d2{animation-delay:.15s}
  .d3{animation-delay:.25s} .d4{animation-delay:.35s}
  .d5{animation-delay:.45s}
  @media(prefers-reduced-motion:reduce){
    .fu{animation:none!important;opacity:1!important}
    .dl{stroke-dashoffset:0!important;animation:none!important}
  }
`;

// Hero chart path (KSE-style upward trend)
const LINE = "M0,200 C40,188 70,165 110,148 C150,131 175,145 215,120 C255,95 280,105 320,80 C360,55 390,62 430,40 C470,18 500,25 540,8";
const AREA = `${LINE} L540,230 L0,230 Z`;

// Sectors
const SECTORS = [
  { n:"Technology", p:88 },
  { n:"Energy",     p:74 },
  { n:"Banking",    p:66 },
  { n:"Cement",     p:51 },
];

const STATS = [
  { label:"KSE-100",    val:"113,842",  chg:"+1.24%", up:true  },
  { label:"Market Cap", val:"11.2 Tn",  chg:"+0.63%", up:true  },
  { label:"Turnover",   val:"523 Mn",   chg:"-3.1%",  up:false },
];

export default function AuthAdvisoryHero() {
  return (
    <div aria-hidden="true" style={{
      flex:1, height:"100vh", minWidth:0,
      position:"relative", overflow:"hidden",
      background:"linear-gradient(150deg, #FEFAF0 0%, #FBF4E0 50%, #F6EDD0 100%)",
      pointerEvents:"none",
      display:"flex", flexDirection:"column",
      boxSizing:"border-box",
    }}>
      <style>{STYLES}</style>

      {/* ── Full-bleed background chart ── */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
        viewBox="0 0 540 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="bg-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={G.gold} stopOpacity=".13"/>
            <stop offset="100%" stopColor={G.gold} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Horizontal grid */}
        {[60,110,160,210].map(y=>(
          <line key={y} x1="0" y1={y} x2="540" y2={y}
            stroke="rgba(231,154,0,0.07)" strokeWidth=".8" strokeDasharray="6 8"/>
        ))}
        {/* Area */}
        <path d={AREA} fill="url(#bg-fill)"/>
        {/* Chart line — drawn on load */}
        <path d={LINE} fill="none" stroke={G.gold} strokeWidth="2.4" strokeOpacity=".30"
          strokeLinecap="round"
          pathLength="1" strokeDasharray="1" strokeDashoffset="1"
          className="dl"
          style={{ animation:"drawLine 2.2s cubic-bezier(.37,0,.63,1) .3s forwards" }}
        />
      </svg>

      {/* ── Top live badge ── */}
      <div className="fu d1" style={{
        position:"absolute", top:28, left:"50%", transform:"translateX(-50%)",
        display:"flex", alignItems:"center", gap:6, zIndex:3,
        padding:"5px 14px", borderRadius:999,
        background:"rgba(255,255,255,0.75)",
        border:`1px solid ${G.border}`,
        boxShadow:"0 2px 12px rgba(180,120,0,0.08)",
        whiteSpace:"nowrap",
      }}>
        <span style={{ width:7, height:7, borderRadius:"50%", background:G.green, display:"inline-block",
          boxShadow:"0 0 0 2px rgba(22,163,74,.20)" }}/>
        <span style={{ fontSize:9, fontWeight:700, letterSpacing:".18em", textTransform:"uppercase",
          color:G.bronze, fontFamily:"system-ui,sans-serif" }}>
          Pakistan Stock Exchange — Live Session
        </span>
      </div>

      {/* ── HERO number block ── */}
      <div style={{
        position:"absolute", top:"17%", left:0, right:0,
        display:"flex", flexDirection:"column", alignItems:"center",
        zIndex:3, textAlign:"center",
      }}>
        <div className="fu d2" style={{
          fontSize:10, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase",
          color:G.bronze, fontFamily:"system-ui,sans-serif", marginBottom:6,
        }}>KSE-100 Index</div>
        <div className="fu d2" style={{
          fontSize:58, fontWeight:900, color:G.navy,
          fontFamily:"system-ui,sans-serif", letterSpacing:"-.04em", lineHeight:1,
        }}>113,842</div>
        <div className="fu d3" style={{
          display:"flex", alignItems:"center", gap:10, marginTop:8,
        }}>
          <span style={{
            fontSize:20, fontWeight:800, color:G.gold,
            fontFamily:"system-ui,sans-serif", letterSpacing:"-.01em",
          }}>+38.6%</span>
          <span style={{
            fontSize:11, color:G.green, fontWeight:600,
            fontFamily:"system-ui,sans-serif",
          }}>↑ 52-Week Return</span>
        </div>
      </div>

      {/* ── Bottom content area ── */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        padding:"0 5% 4%",
        display:"flex", flexDirection:"column", gap:10, zIndex:3,
      }}>

        {/* 3 stat cards */}
        <div className="fu d3" style={{ display:"flex", gap:10 }}>
          {STATS.map(s => (
            <div key={s.label} style={{
              flex:1, padding:"10px 12px 8px",
              background:G.card, border:`1px solid ${G.border}`, borderRadius:12,
              boxShadow:"0 2px 14px rgba(180,120,0,0.07)",
            }}>
              <div style={{ fontSize:8, fontWeight:700, color:G.bronze, letterSpacing:".09em",
                textTransform:"uppercase", fontFamily:"system-ui,sans-serif" }}>{s.label}</div>
              <div style={{ fontSize:15, fontWeight:800, color:G.navy,
                fontFamily:"system-ui,sans-serif", marginTop:3, letterSpacing:"-.01em" }}>{s.val}</div>
              <div style={{ fontSize:10, fontWeight:700,
                color: s.up ? G.green : G.red,
                fontFamily:"system-ui,sans-serif", marginTop:2 }}>{s.chg}</div>
            </div>
          ))}
        </div>

        {/* Two column: sectors + trust */}
        <div className="fu d4" style={{ display:"flex", gap:10 }}>

          {/* Top sectors */}
          <div style={{
            flex:1, padding:"12px 14px",
            background:G.card, border:`1px solid ${G.border}`, borderRadius:12,
            boxShadow:"0 2px 14px rgba(180,120,0,0.07)",
          }}>
            <div style={{ fontSize:9, fontWeight:700, color:G.dark, letterSpacing:".09em",
              textTransform:"uppercase", fontFamily:"system-ui,sans-serif", marginBottom:10 }}>
              Top Sectors
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
              {SECTORS.map(s => (
                <div key={s.n}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                    <span style={{ fontSize:9.5, fontWeight:600, color:G.navy,
                      fontFamily:"system-ui,sans-serif" }}>{s.n}</span>
                    <span style={{ fontSize:9.5, fontWeight:700, color:G.gold,
                      fontFamily:"system-ui,sans-serif" }}>{s.p}%</span>
                  </div>
                  <div style={{ height:5, borderRadius:99, background:"rgba(231,154,0,0.12)" }}>
                    <div style={{ height:"100%", borderRadius:99, width:`${s.p}%`,
                      background:`linear-gradient(90deg,${G.bronze},${G.gold})` }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div style={{
            width:"38%", flexShrink:0, padding:"12px 14px",
            background:G.card, border:`1px solid ${G.border}`, borderRadius:12,
            boxShadow:"0 2px 14px rgba(180,120,0,0.07)",
            display:"flex", flexDirection:"column", justifyContent:"center", gap:10,
          }}>
            {[
              { icon:"🛡️", t:"SECP Regulated",   s:"Fully compliant" },
              { icon:"🔒", t:"Bank-Grade Security", s:"HTTP-only sessions" },
              { icon:"📊", t:"All KSE Sectors",  s:"Real-time coverage" },
            ].map(b=>(
              <div key={b.t} style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:17, flexShrink:0 }}>{b.icon}</span>
                <div>
                  <div style={{ fontSize:9, fontWeight:700, color:G.navy,
                    fontFamily:"system-ui,sans-serif" }}>{b.t}</div>
                  <div style={{ fontSize:8, color:G.bronze,
                    fontFamily:"system-ui,sans-serif" }}>{b.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
