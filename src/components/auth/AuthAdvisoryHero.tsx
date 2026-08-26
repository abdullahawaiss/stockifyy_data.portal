"use client";

const GOLD   = "#E79A00";
const BRONZE = "#B87B1A";
const NAVY   = "#0F1B2D";
const BG     = "#FBF8F1";
const CARD   = "rgba(255,255,255,0.82)";
const BORDER = "rgba(231,154,0,0.18)";
const GREEN  = "#16A34A";
const RED    = "#DC2626";

const STYLES = `
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(12px) }
    to   { opacity:1; transform:none }
  }
  .fu { animation: fadeUp .7s cubic-bezier(.22,1,.36,1) both }
  .d1 { animation-delay:.08s } .d2 { animation-delay:.18s }
  .d3 { animation-delay:.28s } .d4 { animation-delay:.38s }
  .d5 { animation-delay:.48s } .d6 { animation-delay:.58s }
  @media (prefers-reduced-motion:reduce) {
    .fu { animation:none !important; opacity:1 !important }
  }
`;

// KSE-100 style upward path (decorative background art)
const BG_PATH =
  "M0,340 C60,320 90,280 140,260 C190,240 220,270 270,240 " +
  "C320,210 350,170 400,145 C450,120 480,140 530,110 " +
  "C580,80 610,55 660,35 L660,440 L0,440 Z";

const BG_LINE =
  "M0,340 C60,320 90,280 140,260 C190,240 220,270 270,240 " +
  "C320,210 350,170 400,145 C450,120 480,140 530,110 " +
  "C580,80 610,55 660,35";

// Grid lines positions
const GRID_Y = [100, 180, 260, 340, 420];

// PSX key metrics (illustrative, not live)
const STATS = [
  { label: "KSE-100 Index",    value: "113,842",  change: "+1.24%",  up: true  },
  { label: "KSE-30 Index",     value: "37,604",   change: "+0.87%",  up: true  },
  { label: "Market Cap (PKR)", value: "11.2 Tn",  change: "+0.63%",  up: true  },
  { label: "Turnover (Shares)","value": "523 Mn",  change: "-3.1%",   up: false },
];

const SECTORS = [
  { name: "Technology",  pct: 88 },
  { name: "Energy",      pct: 74 },
  { name: "Banking",     pct: 66 },
  { name: "Cement",      pct: 51 },
  { name: "Fertilizer",  pct: 43 },
];

const card: React.CSSProperties = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  boxShadow: "0 2px 14px rgba(180,120,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
};

export default function AuthAdvisoryHero() {
  return (
    <div aria-hidden="true" style={{
      flex:1, height:"100vh", minWidth:0,
      position:"relative", overflow:"hidden",
      background: BG,
      pointerEvents:"none",
      display:"flex", flexDirection:"column",
      padding:"4% 5% 4%",
      gap:12, boxSizing:"border-box",
    }}>
      <style>{STYLES}</style>

      {/* ── Background chart art ── */}
      <svg style={{
        position:"absolute", inset:0, width:"100%", height:"100%",
        pointerEvents:"none",
      }} viewBox="0 0 660 440" preserveAspectRatio="xMidYMid slice">
        {/* Grid */}
        {GRID_Y.map(y => (
          <line key={y} x1="0" y1={y} x2="660" y2={y}
            stroke="rgba(231,154,0,0.07)" strokeWidth="1" strokeDasharray="6 8"/>
        ))}
        {/* Area fill */}
        <defs>
          <linearGradient id="bgfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={GOLD} stopOpacity=".09"/>
            <stop offset="100%" stopColor={GOLD} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={BG_PATH} fill="url(#bgfill)"/>
        {/* Line */}
        <path d={BG_LINE} fill="none" stroke={GOLD} strokeWidth="1.8" strokeOpacity=".22" strokeLinecap="round"/>
      </svg>

      {/* ── Content ── */}

      {/* Header */}
      <div className="fu d1" style={{ position:"relative", zIndex:2 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{
            width:7, height:7, borderRadius:"50%",
            background:GREEN, display:"inline-block",
            boxShadow:"0 0 0 2px rgba(22,163,74,0.20)",
          }}/>
          <span style={{
            fontSize:9, fontWeight:700, letterSpacing:".18em",
            textTransform:"uppercase", color:BRONZE,
            fontFamily:"system-ui,sans-serif",
          }}>Pakistan Stock Exchange — Live Session</span>
        </div>
        <div style={{
          marginTop:10,
          fontSize:22, fontWeight:800, color:NAVY,
          letterSpacing:"-.02em", lineHeight:1.2,
          fontFamily:"system-ui,sans-serif",
        }}>
          Institutional-Grade<br/>
          <span style={{ color:GOLD }}>Market Intelligence</span>
        </div>
        <div style={{ marginTop:6, fontSize:11, color:BRONZE, fontFamily:"system-ui,sans-serif" }}>
          Real-time KSE analytics for informed investors
        </div>
      </div>

      {/* ── Stat cards row ── */}
      <div className="fu d2" style={{ position:"relative", zIndex:2, display:"flex", gap:8 }}>
        {STATS.map((s, i) => (
          <div key={s.label} className={`fu d${i + 2}`} style={{
            ...card, flex:1, padding:"10px 10px 8px",
          }}>
            <div style={{ fontSize:7.5, color:BRONZE, fontFamily:"system-ui,sans-serif", fontWeight:600, letterSpacing:".06em", textTransform:"uppercase" }}>{s.label}</div>
            <div style={{ fontSize:13, fontWeight:800, color:NAVY, fontFamily:"system-ui,sans-serif", marginTop:3 }}>{s.value}</div>
            <div style={{ fontSize:9, fontWeight:700, color: s.up ? GREEN : RED, fontFamily:"system-ui,sans-serif", marginTop:2 }}>
              {s.change}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main two-column section ── */}
      <div style={{ flex:1, position:"relative", zIndex:2, display:"flex", gap:12, minHeight:0 }}>

        {/* Left: KSE-100 chart card */}
        <div className="fu d3" style={{
          ...card, flex:1, padding:"14px 16px 12px",
          display:"flex", flexDirection:"column", minHeight:0,
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10, flexShrink:0 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:NAVY, fontFamily:"system-ui,sans-serif" }}>KSE-100 Performance</div>
              <div style={{ fontSize:8, color:BRONZE, fontFamily:"system-ui,sans-serif", marginTop:1 }}>52-Week Range · PKR</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <span style={{ fontSize:18, fontWeight:800, color:GOLD, fontFamily:"system-ui,sans-serif" }}>+38.6%</span>
              <div style={{ fontSize:8, color:GREEN, fontWeight:600, fontFamily:"system-ui,sans-serif" }}>↑ 52W Return</div>
            </div>
          </div>
          {/* Chart */}
          <div style={{ flex:1, minHeight:0, position:"relative" }}>
            <svg width="100%" height="100%" viewBox="0 0 300 120" style={{ position:"absolute", inset:0, display:"block" }} preserveAspectRatio="none">
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GOLD} stopOpacity=".22"/>
                  <stop offset="100%" stopColor={GOLD} stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="cl" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={BRONZE}/>
                  <stop offset="100%" stopColor={GOLD}/>
                </linearGradient>
              </defs>
              {[30,60,90].map(y=>(
                <line key={y} x1="0" y1={y} x2="300" y2={y}
                  stroke="rgba(231,154,0,0.08)" strokeWidth=".6" strokeDasharray="4 6"/>
              ))}
              <path d="M0,105 C30,95 50,85 75,72 C100,60 115,68 140,55 C165,42 185,48 210,35 C235,22 255,28 280,14 L280,118 L0,118 Z"
                fill="url(#cg)"/>
              <path d="M0,105 C30,95 50,85 75,72 C100,60 115,68 140,55 C165,42 185,48 210,35 C235,22 255,28 280,14"
                fill="none" stroke="url(#cl)" strokeWidth="2.2" strokeLinecap="round"/>
              {([[0,105],[75,72],[140,55],[210,35],[280,14]] as [number,number][]).map(([x,y],i)=>(
                <circle key={i} cx={x} cy={y} r="3.5" fill="white" stroke={GOLD} strokeWidth="1.5"/>
              ))}
            </svg>
          </div>
        </div>

        {/* Right: Sector allocation */}
        <div className="fu d4" style={{
          ...card, width:"35%", flexShrink:0,
          padding:"14px 14px 12px",
          display:"flex", flexDirection:"column",
        }}>
          <div style={{ fontSize:11, fontWeight:700, color:NAVY, fontFamily:"system-ui,sans-serif", marginBottom:12 }}>
            Top Sectors
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:9, flex:1, justifyContent:"center" }}>
            {SECTORS.map((s, i) => (
              <div key={s.name}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:9, fontWeight:600, color:NAVY, fontFamily:"system-ui,sans-serif" }}>{s.name}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:GOLD, fontFamily:"system-ui,sans-serif" }}>{s.pct}%</span>
                </div>
                <div style={{ height:5, borderRadius:99, background:"rgba(231,154,0,0.12)" }}>
                  <div style={{
                    height:"100%", borderRadius:99,
                    width:`${s.pct}%`,
                    background:`linear-gradient(90deg,${BRONZE},${GOLD})`,
                  }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="fu d5" style={{ position:"relative", zIndex:2, display:"flex", gap:12, flexShrink:0 }}>

        {/* Trust badges */}
        {[
          { icon:"🛡", title:"SECP Regulated", sub:"Fully compliant" },
          { icon:"🔒", title:"Secure Sessions", sub:"HTTP-only · bcrypt" },
          { icon:"📊", title:"KSE Listed Data", sub:"All sectors covered" },
          { icon:"⚡", title:"Real-Time Feeds", sub:"Live market data" },
        ].map((b, i) => (
          <div key={b.title} className={`fu d${i + 5}`} style={{
            ...card, flex:1, padding:"10px 10px 8px",
            display:"flex", alignItems:"center", gap:8,
          }}>
            <span style={{ fontSize:16, flexShrink:0 }}>{b.icon}</span>
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:NAVY, fontFamily:"system-ui,sans-serif" }}>{b.title}</div>
              <div style={{ fontSize:7.5, color:BRONZE, fontFamily:"system-ui,sans-serif", marginTop:1 }}>{b.sub}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
