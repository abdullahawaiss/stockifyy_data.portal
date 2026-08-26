"use client";

// AuthAdvisoryHero — Stockifyy premium advisory visual for auth right panels.
// Purely decorative. CSS animations only. No API calls. No market data.
// prefers-reduced-motion: renders polished static version.

// ──── PALETTE ────────────────────────────────────────────────────────

const G = {
  bg:     "#FBF8F1",
  gold:   "#E79A00",
  goldLt: "#F5C518",
  bronze: "#B87B1A",
  dark:   "#1E2B3C",
  green:  "#059669",
  red:    "#DC2626",
  border: "rgba(231,154,0,0.16)",
  grid:   "rgba(231,154,0,0.065)",
} as const;

// ──── CSS ANIMATIONS ─────────────────────────────────────────────────

const STYLES = `
  @keyframes ahEntry {
    from { opacity:0; transform:translateY(10px) }
    to   { opacity:1; transform:none }
  }
  @keyframes ahDraw {
    to { stroke-dashoffset:0 }
  }
  @keyframes ahPulse {
    0%,100% { opacity:.5; transform:scale(1) }
    50%     { opacity:1; transform:scale(1.65) }
  }
  @keyframes ahRingRot {
    to { transform:rotate(360deg) }
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
  @keyframes ahFloat {
    0%,100% { transform:translateY(0) }
    50%     { transform:translateY(-4px) }
  }
  @keyframes ahSweep {
    0%   { transform:translateX(-120%) skewX(-18deg) }
    100% { transform:translateX(380%)  skewX(-18deg) }
  }
  @keyframes ahDrift {
    0%,100% { transform:translate(0,0) }
    50%     { transform:translate(var(--px,6px),var(--py,-5px)) }
  }
  .ah-e  { animation:ahEntry .65s cubic-bezier(.22,1,.36,1) both }
  .ah-d1 { animation-delay:.10s }
  .ah-d2 { animation-delay:.22s }
  .ah-d3 { animation-delay:.36s }
  .ah-d4 { animation-delay:.50s }
  .ah-d5 { animation-delay:.64s }
  @media (prefers-reduced-motion:reduce) {
    .ah-e,.ah-sweep,.ah-float,.ah-bar,.ah-drift {
      animation:none !important;
    }
    .ah-draw { stroke-dashoffset:0 !important; animation:none !important; }
    .ah-pulse { animation:none !important; opacity:1 !important; transform:none !important; }
    .ah-ring  { animation:none !important; }
    .ah-gauge { animation:none !important; transform:none !important; }
  }
`;

// ──── CHART DATA ─────────────────────────────────────────────────────

// Market line nodes [x, y] in a 248×82 chart viewport — upward trend
const NODES: [number, number][] = [
  [6,76],[34,66],[62,62],[90,52],[116,57],[144,40],[170,28],[198,17],[236,9],
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
const AREA_PATH = buildArea(NODES, 82);

// Donut segments (r=24, circumference ≈ 150.80)
const C_PERIM = 2 * Math.PI * 24;
const DONUT_SEGS = [
  { pct: 0.60, color: "#E79A00", label: "Equities",  pctStr: "60%" },
  { pct: 0.25, color: "#C17F24", label: "Fixed Inc.", pctStr: "25%" },
  { pct: 0.15, color: "#E8D5A3", label: "Cash",       pctStr: "15%" },
];

// Monthly bars
const BARS = [
  { h: 40, m: "Jul" }, { h: 58, m: "Aug" }, { h: 46, m: "Sep" },
  { h: 72, m: "Oct" }, { h: 54, m: "Nov" }, { h: 86, m: "Dec" }, { h: 67, m: "Jan" },
];

// Pakistan simplified decorative map path (normalized to 100×110 viewBox)
const PAK_PATH =
  "M55,4 L66,7 L75,16 L80,29 L84,44 L86,60 L82,74 L74,85 " +
  "L64,96 L54,104 L44,100 L33,90 L22,76 L16,60 L14,44 L18,30 L26,18 L38,9 Z";

// ──── SUB-COMPONENTS ─────────────────────────────────────────────────

function DonutChart() {
  let angle = -90; // start from 12-o'clock
  return (
    <svg width="70" height="70" viewBox="0 0 70 70" style={{ flexShrink: 0 }}>
      {DONUT_SEGS.map((s, i) => {
        const len = s.pct * C_PERIM;
        const gap = C_PERIM - len;
        const rot = angle;
        angle += s.pct * 360;
        return (
          <circle key={i} cx="35" cy="35" r="24"
            fill="none" stroke={s.color} strokeWidth="9"
            strokeDasharray={`${len} ${gap}`}
            style={{ transform: `rotate(${rot}deg)`, transformOrigin: "35px 35px" }}
          />
        );
      })}
      {/* Slow rotating highlight arc */}
      <circle cx="35" cy="35" r="24"
        fill="none"
        stroke="rgba(255,255,255,0.50)"
        strokeWidth="11"
        strokeDasharray={`${C_PERIM * 0.10} ${C_PERIM * 0.90}`}
        className="ah-ring"
        style={{ transformOrigin: "35px 35px", animation: "ahRingRot 10s linear 1.2s infinite" }}
      />
      <text x="35" y="32" textAnchor="middle" fontSize="8" fontWeight="800"
        fill={G.gold} fontFamily="system-ui,sans-serif">PSX</text>
      <text x="35" y="42" textAnchor="middle" fontSize="6"
        fill={G.bronze} fontFamily="system-ui,sans-serif">Fund</text>
    </svg>
  );
}

function RiskGauge() {
  const cx = 55, cy = 50, r = 35;
  const pt = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${(cx + r * Math.cos(rad)).toFixed(2)},${(cy + r * Math.sin(rad)).toFixed(2)}`;
  };
  const arc = (a1: number, a2: number) => {
    const [x1, y1] = pt(a1).split(",");
    const [x2, y2] = pt(a2).split(",");
    return `M ${x1},${y1} A ${r},${r} 0 0 1 ${x2},${y2}`;
  };
  // Needle drawn at 268° (moderate); animation rotates from -58° to 0°
  const nRad = (268 * Math.PI) / 180;
  const nx = (cx + 26 * Math.cos(nRad)).toFixed(2);
  const ny = (cy + 26 * Math.sin(nRad)).toFixed(2);

  return (
    <svg width="100%" viewBox="0 0 110 62" style={{ display: "block" }}>
      {/* Zone arcs: Low · Moderate · High */}
      <path d={arc(210, 250)} fill="none" stroke={G.green} strokeWidth="8" strokeLinecap="round"/>
      <path d={arc(252, 290)} fill="none" stroke={G.gold}  strokeWidth="8" strokeLinecap="round"/>
      <path d={arc(292, 330)} fill="none" stroke={G.red}   strokeWidth="8" strokeLinecap="round" opacity=".65"/>
      {/* Needle */}
      <line x1={cx} y1={cy} x2={nx} y2={ny}
        stroke={G.dark} strokeWidth="2" strokeLinecap="round"
        className="ah-gauge"
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          animation: "ahGauge 2.4s cubic-bezier(.34,1.56,.64,1) .7s both",
        }}
      />
      <circle cx={cx} cy={cy} r="3.5" fill={G.dark}/>
      {/* Labels */}
      <text x="20"  y="60" textAnchor="middle" fontSize="7" fill={G.green}  fontFamily="system-ui" fontWeight="600">Low</text>
      <text x="55"  y="20" textAnchor="middle" fontSize="7" fill={G.gold}   fontFamily="system-ui" fontWeight="700">Mod</text>
      <text x="90"  y="60" textAnchor="middle" fontSize="7" fill={G.red}    fontFamily="system-ui" fontWeight="600" opacity=".8">High</text>
    </svg>
  );
}

// Small SVG icons for research cards
function IconWave() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={G.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function IconShieldCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={G.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  );
}
function IconTrendUp() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={G.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  );
}
function ShieldBadgeSVG() {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" fill="none" aria-hidden="true">
      <path d="M15 2 L27 7 L27 18 C27 25 15 31 15 31 C15 31 3 25 3 18 L3 7 Z"
        fill="rgba(231,154,0,0.10)" stroke={G.gold} strokeWidth="1.5"/>
      <polyline points="10,17 13,20 20,13"
        stroke={G.gold} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ──── MAIN COMPONENT ─────────────────────────────────────────────────

export default function AuthAdvisoryHero() {
  const researchCards = [
    { Icon: IconWave,       label: "Sector Analysis", sub: "35 KSE Sectors" },
    { Icon: IconShieldCheck, label: "Risk Score",     sub: "Div. Index 8.2" },
    { Icon: IconTrendUp,    label: "FY26 Outlook",    sub: "Est. +22% growth" },
  ];

  return (
    <div
      aria-hidden="true"
      style={{
        flex: 1, height: "100vh",
        position: "relative", overflow: "hidden",
        background: G.bg, minWidth: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <style>{STYLES}</style>

      {/* ── Financial grid background ── */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
        <defs>
          <pattern id="ah-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke={G.grid} strokeWidth=".5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ah-grid)"/>
      </svg>

      {/* ── Pakistan map silhouette ── */}
      <svg style={{
        position: "absolute", right: "6%", top: "50%", transform: "translateY(-50%)",
        width: "44%", maxWidth: 230, opacity: 0.05,
      }} viewBox="0 0 100 115" aria-hidden="true">
        <path d={PAK_PATH} fill={G.gold} stroke={G.bronze} strokeWidth="1.2"/>
      </svg>

      {/* ── Ambient glow ── */}
      <div style={{
        position: "absolute", top: "-12%", left: "50%", transform: "translateX(-50%)",
        width: 380, height: 280, borderRadius: "50%",
        background: `radial-gradient(ellipse,rgba(231,154,0,.07) 0%,transparent 70%)`,
      }}/>

      {/* ── Floating particles ── */}
      {([
        { l: "12%", t: "16%", r: 2.5, px: "7px",  py: "-5px", dur: 7,  dly: "0s"   },
        { l: "83%", t: "11%", r: 2,   px: "-5px", py: "6px",  dur: 8,  dly: "1.3s" },
        { l: "19%", t: "80%", r: 2,   px: "5px",  py: "-6px", dur: 6.5,dly: "2.2s" },
        { l: "76%", t: "74%", r: 3,   px: "-6px", py: "4px",  dur: 9,  dly: "0.6s" },
        { l: "54%", t: "92%", r: 2,   px: "4px",  py: "-4px", dur: 7.5,dly: "1.9s" },
        { l: "91%", t: "44%", r: 2.5, px: "-5px", py: "-4px", dur: 8,  dly: "3.1s" },
      ] as const).map((p, i) => (
        <div key={i} className="ah-drift" style={{
          position: "absolute", left: p.l, top: p.t,
          width: p.r * 2, height: p.r * 2, borderRadius: "50%",
          background: G.gold, opacity: 0.10,
          animation: `ahDrift ${p.dur}s ease-in-out ${p.dly} infinite`,
          "--px": p.px, "--py": p.py,
        } as React.CSSProperties}/>
      ))}

      {/* ══════════════════════════════
          MAIN CONTENT
      ══════════════════════════════ */}
      <div style={{
        width: "100%", maxWidth: 406,
        position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column", gap: 10,
        padding: "0 22px",
      }}>

        {/* Eyebrow badge */}
        <div className="ah-e ah-d1" style={{ display: "flex" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 999,
            background: "rgba(231,154,0,0.08)",
            border: `1px solid ${G.border}`,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: G.green, display: "inline-block",
              boxShadow: "0 0 0 2px rgba(5,150,105,0.18)",
            }}/>
            <span style={{
              fontSize: 8.5, fontWeight: 700, letterSpacing: ".16em",
              textTransform: "uppercase", color: G.bronze,
              fontFamily: "system-ui,sans-serif",
            }}>
              PSX Market Intelligence
            </span>
          </div>
        </div>

        {/* ── Central glass panel ── */}
        <div className="ah-e ah-d2" style={{
          background: "rgba(255,255,255,0.74)",
          border: `1px solid ${G.border}`,
          borderRadius: 14, padding: "14px 16px 10px",
          position: "relative", overflow: "hidden",
          boxShadow: "0 2px 20px rgba(231,154,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        }}>
          {/* Gold light sweep */}
          <div className="ah-sweep" style={{
            position: "absolute", top: 0, left: 0, bottom: 0, width: "24%",
            background: "linear-gradient(90deg,transparent,rgba(231,154,0,0.08),transparent)",
            animation: "ahSweep 4.5s ease-in-out 2s infinite",
          }}/>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: G.dark, letterSpacing: ".02em", fontFamily: "system-ui,sans-serif" }}>
                Portfolio Performance
              </div>
              <div style={{ fontSize: 8, color: G.bronze, marginTop: 1, letterSpacing: ".08em", textTransform: "uppercase", fontFamily: "system-ui,sans-serif" }}>
                KSE-100 Benchmark
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: G.gold, letterSpacing: "-.02em", fontFamily: "system-ui,sans-serif" }}>+18.4%</div>
              <div style={{ fontSize: 7.5, color: G.green, fontWeight: 600, fontFamily: "system-ui,sans-serif" }}>↑ YTD Return</div>
            </div>
          </div>
          {/* Chart */}
          <svg viewBox="0 0 248 85" width="100%" style={{ display: "block", overflow: "visible" }}>
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
            {[22, 44, 66].map(y => (
              <line key={y} x1="0" y1={y} x2="248" y2={y}
                stroke={G.grid} strokeWidth=".5" strokeDasharray="4 6"/>
            ))}
            <path d={AREA_PATH} fill="url(#ah-af)"/>
            <path d={LINE_PATH} fill="none" stroke="url(#ah-lg)"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              pathLength="1" strokeDasharray="1" strokeDashoffset="1"
              className="ah-draw"
              style={{ animation: "ahDraw 1.9s cubic-bezier(.37,0,.63,1) .5s forwards" }}
            />
            {NODES.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3.5"
                fill="white" stroke={G.gold} strokeWidth="1.5"
                className="ah-pulse"
                style={{
                  transformOrigin: `${x}px ${y}px`,
                  animation: `ahPulse 2.5s ease-in-out ${0.9 + i * 0.14}s infinite`,
                }}
              />
            ))}
          </svg>
        </div>

        {/* ── Portfolio allocation + Risk gauge ── */}
        <div className="ah-e ah-d3" style={{ display: "flex", gap: 10 }}>
          {/* Donut card */}
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.65)",
            border: `1px solid ${G.border}`, borderRadius: 12,
            padding: "10px 12px",
            boxShadow: "0 1px 10px rgba(231,154,0,0.06)",
          }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: G.dark, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6, fontFamily: "system-ui,sans-serif" }}>
              Allocation
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <DonutChart/>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {DONUT_SEGS.map(s => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 2, background: s.color, flexShrink: 0 }}/>
                    <div>
                      <div style={{ fontSize: 8, fontWeight: 700, color: G.dark, fontFamily: "system-ui,sans-serif" }}>{s.pctStr}</div>
                      <div style={{ fontSize: 6.5, color: G.bronze, fontFamily: "system-ui,sans-serif" }}>{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Risk gauge card */}
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.65)",
            border: `1px solid ${G.border}`, borderRadius: 12,
            padding: "10px 12px",
            boxShadow: "0 1px 10px rgba(231,154,0,0.06)",
          }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: G.dark, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 4, fontFamily: "system-ui,sans-serif" }}>
              Risk Profile
            </div>
            <RiskGauge/>
            <div style={{ textAlign: "center", marginTop: 2 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: G.gold, fontFamily: "system-ui,sans-serif" }}>Moderate</span>
            </div>
          </div>
        </div>

        {/* ── Research insight cards ── */}
        <div className="ah-e ah-d4" style={{ display: "flex", gap: 8 }}>
          {researchCards.map(({ Icon, label, sub }, i) => (
            <div key={label} style={{
              flex: 1, background: "rgba(255,255,255,0.58)",
              border: `1px solid ${G.border}`, borderRadius: 10,
              padding: "9px 9px 7px",
              boxShadow: "0 1px 6px rgba(231,154,0,0.04)",
              animation: `ahFloat ${3.5 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
            }}>
              <Icon/>
              <div style={{ fontSize: 7.5, fontWeight: 700, color: G.dark, marginTop: 5, lineHeight: 1.3, fontFamily: "system-ui,sans-serif" }}>{label}</div>
              <div style={{ fontSize: 7, color: G.bronze, marginTop: 2, fontFamily: "system-ui,sans-serif" }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Analytical bars + SECP shield ── */}
        <div className="ah-e ah-d5" style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
          {/* Bars */}
          <div style={{
            flex: 1, background: "rgba(255,255,255,0.52)",
            border: `1px solid ${G.border}`, borderRadius: 10,
            padding: "9px 11px 7px",
            boxShadow: "0 1px 6px rgba(231,154,0,0.03)",
          }}>
            <div style={{ fontSize: 7.5, fontWeight: 700, color: G.dark, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6, fontFamily: "system-ui,sans-serif" }}>
              Monthly Returns
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36 }}>
              {BARS.map((b, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div className="ah-bar" style={{
                    width: "100%",
                    height: b.h * 0.36,
                    borderRadius: "2px 2px 0 0",
                    background: i === 5 ? G.gold : `rgba(231,154,0,${0.18 + i * 0.065})`,
                    transformOrigin: "center bottom",
                    animation: `ahBar .55s cubic-bezier(.34,1.56,.64,1) ${0.8 + i * 0.07}s both`,
                  }}/>
                  <div style={{ fontSize: 5.5, color: G.bronze, fontFamily: "system-ui,sans-serif" }}>{b.m}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Shield */}
          <div style={{
            background: "rgba(255,255,255,0.52)",
            border: `1px solid ${G.border}`, borderRadius: 10,
            padding: "10px 12px", textAlign: "center",
            boxShadow: "0 1px 6px rgba(231,154,0,0.03)",
            minWidth: 68, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <ShieldBadgeSVG/>
            <div style={{ fontSize: 8, fontWeight: 700, color: G.dark, marginTop: 4, fontFamily: "system-ui,sans-serif" }}>SECP</div>
            <div style={{ fontSize: 7, color: G.bronze, fontFamily: "system-ui,sans-serif" }}>Certified</div>
          </div>
        </div>

      </div>
    </div>
  );
}
