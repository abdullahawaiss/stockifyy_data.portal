"use client";

// AuthAdvisoryHero — full-bleed Stockifyy advisory visual for auth right panels.
// No API calls, no market data. CSS animations only. prefers-reduced-motion respected.

// ──── PALETTE ────────────────────────────────────────────────────────

const G = {
  bg:     "linear-gradient(145deg, #FEF9EE 0%, #FBF3DC 55%, #F5EBC6 100%)",
  gold:   "#E79A00",
  goldLt: "#F5C518" as string,
  bronze: "#B87B1A",
  dark:   "#1E2B3C",
  green:  "#059669",
  red:    "#DC2626",
  border: "rgba(231,154,0,0.16)",
  grid:   "rgba(231,154,0,0.055)",
  card:   "rgba(255,255,255,0.70)",
  shadow: "0 2px 16px rgba(180,120,0,0.09), 0 1px 3px rgba(0,0,0,0.05)",
} as const;

// ──── CSS ────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes ahEntry {
    from { opacity:0; transform:translateY(8px) }
    to   { opacity:1; transform:none }
  }
  @keyframes ahDraw {
    to { stroke-dashoffset:0 }
  }
  @keyframes ahPulse {
    0%,100% { opacity:.5; transform:scale(1) }
    50%     { opacity:1;  transform:scale(1.6) }
  }
  @keyframes ahGauge {
    0%   { transform:rotate(-58deg) }
    62%  { transform:rotate(8deg) }
    80%  { transform:rotate(-3deg) }
    100% { transform:rotate(0deg) }
  }
  @keyframes ahBar {
    from { transform:scaleY(0) }
    to   { transform:scaleY(1) }
  }
  .ah-e  { animation:ahEntry .6s cubic-bezier(.22,1,.36,1) both }
  .ah-d1 { animation-delay:.08s }
  .ah-d2 { animation-delay:.18s }
  .ah-d3 { animation-delay:.30s }
  .ah-d4 { animation-delay:.42s }
  .ah-d5 { animation-delay:.54s }
  @media (prefers-reduced-motion:reduce) {
    .ah-e,.ah-bar,.ah-draw,.ah-pulse,.ah-gauge {
      animation:none !important;
      stroke-dashoffset:0 !important;
      transform:none !important;
      opacity:1 !important;
    }
  }
`;

// ──── CHART DATA ─────────────────────────────────────────────────────

const NODES: [number, number][] = [
  [8,88],[40,76],[72,70],[104,58],[132,64],[162,46],[192,32],[222,20],[256,9],
];

function buildLine(pts: [number, number][]): string {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return d;
}

function buildArea(pts: [number, number][], bottom: number): string {
  const lp = pts[pts.length - 1];
  return `${buildLine(pts)} L${lp[0]},${bottom} L${pts[0][0]},${bottom} Z`;
}

const LINE_PATH = buildLine(NODES);
const AREA_PATH = buildArea(NODES, 96);

// Donut (r=28, circumference ≈ 175.93)
const R_DONUT  = 28;
const C_PERIM  = 2 * Math.PI * R_DONUT;
const SEGS = [
  { pct: 0.60, color: "#E79A00", label: "Equities",  pct_s: "60%" },
  { pct: 0.25, color: "#C17F24", label: "Fixed Inc.", pct_s: "25%" },
  { pct: 0.15, color: "#E8D5A3", label: "Cash",       pct_s: "15%" },
];

// Bars
const BARS = [
  { h: 40, m: "Jul" }, { h: 58, m: "Aug" }, { h: 46, m: "Sep" },
  { h: 72, m: "Oct" }, { h: 52, m: "Nov" }, { h: 88, m: "Dec" }, { h: 66, m: "Jan" },
];

const PAK_PATH =
  "M55,4 L66,7 L75,16 L80,29 L84,44 L86,60 L82,74 L74,85 " +
  "L64,96 L54,104 L44,100 L33,90 L22,76 L16,60 L14,44 L18,30 L26,18 L38,9 Z";

// ──── SHARED CARD STYLE ───────────────────────────────────────────────

const card: React.CSSProperties = {
  background: G.card,
  border: `1px solid ${G.border}`,
  borderRadius: 14,
  boxShadow: G.shadow,
  overflow: "hidden",
};

const label: React.CSSProperties = {
  fontSize: 8.5, fontWeight: 700, letterSpacing: ".09em",
  textTransform: "uppercase", color: G.dark,
  fontFamily: "system-ui,sans-serif", marginBottom: 8,
};

// ──── SUB-COMPONENTS ─────────────────────────────────────────────────

function DonutChart() {
  let angle = -90;
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" style={{ flexShrink: 0, display: "block" }}>
      {SEGS.map((s, i) => {
        const len = s.pct * C_PERIM;
        const gap = C_PERIM - len;
        const rot = angle;
        angle += s.pct * 360;
        return (
          <circle key={i} cx="38" cy="38" r={R_DONUT}
            fill="none" stroke={s.color} strokeWidth="10"
            strokeDasharray={`${len} ${gap}`}
            style={{ transform: `rotate(${rot}deg)`, transformOrigin: "38px 38px" }}
          />
        );
      })}
      <text x="38" y="35" textAnchor="middle" fontSize="9" fontWeight="800"
        fill={G.gold} fontFamily="system-ui,sans-serif">PSX</text>
      <text x="38" y="46" textAnchor="middle" fontSize="7"
        fill={G.bronze} fontFamily="system-ui,sans-serif">Fund</text>
    </svg>
  );
}

function RiskGauge() {
  const cx = 60, cy = 52, r = 38;
  const pt = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${(cx + r * Math.cos(rad)).toFixed(2)},${(cy + r * Math.sin(rad)).toFixed(2)}`;
  };
  const arc = (a1: number, a2: number) => {
    const [x1, y1] = pt(a1).split(",");
    const [x2, y2] = pt(a2).split(",");
    return `M ${x1},${y1} A ${r},${r} 0 0 1 ${x2},${y2}`;
  };
  const nRad = (268 * Math.PI) / 180;
  const nx = (cx + 28 * Math.cos(nRad)).toFixed(2);
  const ny = (cy + 28 * Math.sin(nRad)).toFixed(2);

  return (
    <svg width="100%" viewBox="0 0 120 66" style={{ display: "block" }}>
      <path d={arc(210, 250)} fill="none" stroke={G.green} strokeWidth="9" strokeLinecap="round"/>
      <path d={arc(252, 290)} fill="none" stroke={G.gold}  strokeWidth="9" strokeLinecap="round"/>
      <path d={arc(292, 330)} fill="none" stroke={G.red}   strokeWidth="9" strokeLinecap="round" opacity=".6"/>
      <line x1={cx} y1={cy} x2={nx} y2={ny}
        stroke={G.dark} strokeWidth="2.2" strokeLinecap="round"
        className="ah-gauge"
        style={{ transformOrigin: `${cx}px ${cy}px`,
          animation: "ahGauge 2.4s cubic-bezier(.34,1.56,.64,1) .7s both" }}
      />
      <circle cx={cx} cy={cy} r="4" fill={G.dark}/>
      <text x="22"  y="64" textAnchor="middle" fontSize="7.5" fill={G.green}  fontFamily="system-ui" fontWeight="600">Low</text>
      <text x="60"  y="18" textAnchor="middle" fontSize="7.5" fill={G.gold}   fontFamily="system-ui" fontWeight="700">Mod</text>
      <text x="98"  y="64" textAnchor="middle" fontSize="7.5" fill={G.red}    fontFamily="system-ui" fontWeight="600" opacity=".8">High</text>
    </svg>
  );
}

function IconWave() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.gold} strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function IconShieldCheck() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.gold} strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>;
}
function IconTrendUp() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.gold} strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>;
}

// ──── MAIN COMPONENT ─────────────────────────────────────────────────

export default function AuthAdvisoryHero() {
  return (
    <div
      aria-hidden="true"
      style={{
        flex: 1, height: "100vh", minWidth: 0,
        position: "relative", overflow: "hidden",
        background: G.bg,
        pointerEvents: "none",
        display: "flex", flexDirection: "column",
        padding: "3.5% 4% 3%",
        gap: 10,
        boxSizing: "border-box",
      }}
    >
      <style>{STYLES}</style>

      {/* ── Background grid ── */}
      <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }} aria-hidden="true">
        <defs>
          <pattern id="ah-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke={G.grid} strokeWidth=".5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ah-grid)"/>
      </svg>

      {/* ── Pakistan map silhouette ── */}
      <svg style={{
        position:"absolute", left:"50%", top:"50%",
        transform:"translate(-50%,-50%)",
        width:"75%", maxWidth:500, opacity:.07, pointerEvents:"none",
      }} viewBox="0 0 100 115" aria-hidden="true">
        <path d={PAK_PATH} fill={G.gold} stroke={G.bronze} strokeWidth="1"/>
      </svg>

      {/* ── Ambient gold glow ── */}
      <div style={{
        position:"absolute", top:"-8%", left:"30%",
        width:420, height:320, borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(ellipse,rgba(231,154,0,.07) 0%,transparent 70%)",
      }}/>

      {/* ══════════════════════════════
          CONTENT — fills full panel
      ══════════════════════════════ */}

      {/* Eyebrow */}
      <div className="ah-e ah-d1" style={{ position:"relative", zIndex:2, display:"flex" }}>
        <div style={{
          display:"flex", alignItems:"center", gap:6,
          padding:"4px 12px", borderRadius:999,
          background:"rgba(231,154,0,0.08)",
          border:`1px solid ${G.border}`,
        }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:G.green, display:"inline-block", boxShadow:"0 0 0 2px rgba(5,150,105,0.18)" }}/>
          <span style={{ fontSize:8.5, fontWeight:700, letterSpacing:".16em", textTransform:"uppercase", color:G.bronze, fontFamily:"system-ui,sans-serif" }}>
            PSX Market Intelligence
          </span>
        </div>
      </div>

      {/* ── Main two-column grid ── */}
      <div style={{ flex:1, position:"relative", zIndex:2, display:"flex", gap:10, minHeight:0 }}>

        {/* LEFT COLUMN */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10, minHeight:0, minWidth:0 }}>

          {/* Portfolio chart — fills remaining space */}
          <div className="ah-e ah-d2" style={{ ...card, flex:1, padding:"14px 16px 12px", display:"flex", flexDirection:"column", minHeight:0 }}>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, flexShrink:0 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:G.dark, fontFamily:"system-ui,sans-serif" }}>Portfolio Performance</div>
                <div style={{ fontSize:8, color:G.bronze, marginTop:1, letterSpacing:".08em", textTransform:"uppercase", fontFamily:"system-ui,sans-serif" }}>KSE-100 Benchmark</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:16, fontWeight:800, color:G.gold, letterSpacing:"-.02em", fontFamily:"system-ui,sans-serif" }}>+18.4%</div>
                <div style={{ fontSize:8, color:G.green, fontWeight:600, fontFamily:"system-ui,sans-serif" }}>↑ YTD Return</div>
              </div>
            </div>
            {/* Chart — fills remaining flex space */}
            <div style={{ flex:1, minHeight:0, position:"relative" }}>
              <svg viewBox="0 0 266 100" width="100%" height="100%" style={{ display:"block", position:"absolute", inset:0 }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ah-af" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={G.gold}   stopOpacity=".18"/>
                    <stop offset="100%" stopColor={G.gold}   stopOpacity="0"/>
                  </linearGradient>
                  <linearGradient id="ah-lg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor={G.bronze}/>
                    <stop offset="100%" stopColor={G.goldLt}/>
                  </linearGradient>
                </defs>
                {[25, 50, 75].map(y => (
                  <line key={y} x1="0" y1={y} x2="266" y2={y}
                    stroke={G.grid} strokeWidth=".6" strokeDasharray="4 6"/>
                ))}
                <path d={AREA_PATH} fill="url(#ah-af)"/>
                <path d={LINE_PATH} fill="none" stroke="url(#ah-lg)"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  pathLength="1" strokeDasharray="1" strokeDashoffset="1"
                  className="ah-draw"
                  style={{ animation:"ahDraw 2s cubic-bezier(.37,0,.63,1) .5s forwards" }}
                />
                {NODES.map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="4"
                    fill="white" stroke={G.gold} strokeWidth="1.8"
                    className="ah-pulse"
                    style={{ transformOrigin:`${x}px ${y}px`,
                      animation:`ahPulse 2.6s ease-in-out ${.9 + i * .14}s infinite` }}
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* Research cards row */}
          <div className="ah-e ah-d4" style={{ display:"flex", gap:8, flexShrink:0 }}>
            {[
              { Icon: IconWave,        label: "Sector Analysis", sub: "35 KSE Sectors" },
              { Icon: IconShieldCheck, label: "Risk Score",      sub: "Div. Index 8.2" },
              { Icon: IconTrendUp,     label: "FY26 Outlook",    sub: "Est. +22% growth" },
            ].map(({ Icon, label: lbl, sub }) => (
              <div key={lbl} style={{ ...card, flex:1, padding:"10px 10px 8px" }}>
                <Icon/>
                <div style={{ fontSize:8, fontWeight:700, color:G.dark, marginTop:5, lineHeight:1.3, fontFamily:"system-ui,sans-serif" }}>{lbl}</div>
                <div style={{ fontSize:7.5, color:G.bronze, marginTop:2, fontFamily:"system-ui,sans-serif" }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width:"33%", display:"flex", flexDirection:"column", gap:10, flexShrink:0, minHeight:0 }}>

          {/* Portfolio allocation */}
          <div className="ah-e ah-d3" style={{ ...card, flex:1.4, padding:"12px 14px", display:"flex", flexDirection:"column", minHeight:0 }}>
            <div style={label}>Allocation</div>
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:10, minHeight:0 }}>
              <DonutChart/>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {SEGS.map(s => (
                  <div key={s.label} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:7, height:7, borderRadius:2, background:s.color, flexShrink:0 }}/>
                    <div>
                      <div style={{ fontSize:8.5, fontWeight:700, color:G.dark, fontFamily:"system-ui,sans-serif" }}>{s.pct_s}</div>
                      <div style={{ fontSize:7, color:G.bronze, fontFamily:"system-ui,sans-serif" }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk gauge */}
          <div className="ah-e ah-d3" style={{ ...card, flex:1, padding:"12px 14px", display:"flex", flexDirection:"column", minHeight:0 }}>
            <div style={label}>Risk Profile</div>
            <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", minHeight:0 }}>
              <RiskGauge/>
              <div style={{ textAlign:"center", marginTop:4 }}>
                <span style={{ fontSize:9, fontWeight:700, color:G.gold, fontFamily:"system-ui,sans-serif" }}>Moderate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div style={{ position:"relative", zIndex:2, display:"flex", gap:10, flexShrink:0 }}>

        {/* Monthly bars */}
        <div className="ah-e ah-d5" style={{ ...card, flex:1, padding:"10px 14px 8px" }}>
          <div style={label}>Monthly Returns</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:44 }}>
            {BARS.map((b, i) => (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                <div className="ah-bar" style={{
                  width:"100%", height: b.h * 0.42,
                  borderRadius:"3px 3px 0 0",
                  background: i === 5 ? G.gold : `rgba(231,154,0,${.16 + i * .07})`,
                  transformOrigin:"center bottom",
                  animation:`ahBar .55s cubic-bezier(.34,1.56,.64,1) ${.8 + i * .07}s both`,
                }}/>
                <div style={{ fontSize:6, color:G.bronze, fontFamily:"system-ui,sans-serif" }}>{b.m}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SECP shield */}
        <div className="ah-e ah-d5" style={{
          ...card, padding:"12px 14px",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          flexShrink:0, minWidth:72,
        }}>
          <svg width="30" height="34" viewBox="0 0 30 34" fill="none" aria-hidden="true">
            <path d="M15 2 L27 7 L27 18 C27 25 15 31 15 31 C15 31 3 25 3 18 L3 7 Z"
              fill="rgba(231,154,0,0.10)" stroke={G.gold} strokeWidth="1.5"/>
            <polyline points="10,17 13,20 20,13"
              stroke={G.gold} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          </svg>
          <div style={{ fontSize:8.5, fontWeight:700, color:G.dark, marginTop:4, fontFamily:"system-ui,sans-serif" }}>SECP</div>
          <div style={{ fontSize:7.5, color:G.bronze, fontFamily:"system-ui,sans-serif" }}>Certified</div>
        </div>
      </div>

    </div>
  );
}
