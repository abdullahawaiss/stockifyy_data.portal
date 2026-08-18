"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useDarkTokens } from "@/hooks/useDarkMode";

// ── Index definitions ─────────────────────────────────────────────────
const ALL_INDICES = [
  { code:"KSE100",   label:"KSE100",    val:180059.79, chg:-1250.49, pct:-0.69, vol:322003264, high:181158.86, low:180393.34, prevClose:181319.24, yr1Pct:23.26, ytdPct:3.74 },
  { code:"KSE100PR", label:"KSE100PR",  val:262845.32, chg:-1824.21, pct:-0.69, vol:322003264, high:264200.00, low:262100.00, prevClose:264669.53, yr1Pct:21.14, ytdPct:2.98 },
  { code:"ALLSHR",   label:"ALLSHR",    val:108894.65, chg:-507.67,  pct:-0.46, vol:412000000, high:109500.00, low:108400.00, prevClose:109402.32, yr1Pct:18.42, ytdPct:2.31 },
  { code:"KSE30",    label:"KSE30",     val:53632.56,  chg:-373.31,  pct:-0.69, vol:185412000, high:54010.00,  low:53480.00,  prevClose:54005.87,  yr1Pct:19.87, ytdPct:2.54 },
  { code:"KMI30",    label:"KMI30",     val:253326.40, chg:-2398.79, pct:-0.94, vol:97240000,  high:256000.00, low:252800.00, prevClose:255725.19, yr1Pct:24.11, ytdPct:4.12 },
  { code:"BKTI",     label:"BKTI",      val:18429.33,  chg:124.50,   pct:0.68,  vol:48200000,  high:18520.00,  low:18290.00,  prevClose:18304.83,  yr1Pct:31.20, ytdPct:5.84 },
  { code:"OGTI",     label:"OGTI",      val:32841.20,  chg:-218.40,  pct:-0.66, vol:62100000,  high:33120.00,  low:32780.00,  prevClose:33059.60,  yr1Pct:15.33, ytdPct:1.92 },
  { code:"KMIALLSHR",label:"KMIALLSHR", val:69727.60,  chg:-394.10,  pct:-0.56, vol:210000000, high:70200.00,  low:69500.00,  prevClose:70121.70,  yr1Pct:20.45, ytdPct:2.78 },
  { code:"PSXDIV20", label:"PSXDIV20",  val:14832.45,  chg:98.20,    pct:0.67,  vol:38400000,  high:14920.00,  low:14710.00,  prevClose:14734.25,  yr1Pct:12.84, ytdPct:1.64 },
  { code:"UPP9",     label:"UPP9",      val:28441.80,  chg:-192.30,  pct:-0.67, vol:52100000,  high:28700.00,  low:28380.00,  prevClose:28634.10,  yr1Pct:17.62, ytdPct:2.18 },
  { code:"NITPGI",   label:"NITPGI",    val:8234.60,   chg:54.20,    pct:0.66,  vol:14200000,  high:8290.00,   low:8170.00,   prevClose:8180.40,   yr1Pct:14.28, ytdPct:1.81 },
  { code:"NBPPGI",   label:"NBPPGI",    val:11842.30,  chg:-78.90,   pct:-0.66, vol:22400000,  high:11940.00,  low:11800.00,  prevClose:11921.20,  yr1Pct:16.54, ytdPct:2.09 },
  { code:"MZNPI",    label:"MZNPI",     val:6429.80,   chg:42.80,    pct:0.67,  vol:9800000,   high:6480.00,   low:6390.00,   prevClose:6387.00,   yr1Pct:11.92, ytdPct:1.52 },
  { code:"JSMFI",    label:"JSMFI",     val:9284.50,   chg:-61.80,   pct:-0.66, vol:18200000,  high:9360.00,   low:9260.00,   prevClose:9346.30,   yr1Pct:13.74, ytdPct:1.74 },
  { code:"ACI",      label:"ACI",       val:4829.20,   chg:32.10,    pct:0.67,  vol:8100000,   high:4860.00,   low:4800.00,   prevClose:4797.10,   yr1Pct:10.84, ytdPct:1.38 },
  { code:"JSGE",     label:"JSGE",      val:7341.60,   chg:-48.90,   pct:-0.66, vol:13400000,  high:7400.00,   low:7310.00,   prevClose:7390.50,   yr1Pct:12.38, ytdPct:1.58 },
];

type TF = "1D"|"1M"|"6M"|"YTD"|"1Y"|"3Y"|"5Y";
const TF_TABS: TF[] = ["1D","1M","6M","YTD","1Y","3Y","5Y"];

type Point = { t: string; o: number; h: number; l: number; c: number; vol: number };
type HoverState = { idx: number; x: number; mouseX: number };

// ── Generate OHLC candle data ─────────────────────────────────────────
function genCandles(n: number, start: number, volatility: number, labelFn: (i:number)=>string): Point[] {
  let close = start;
  let momentum = 0;
  return Array.from({ length: n }, (_, i) => {
    momentum = momentum * 0.35 + (Math.random() - 0.48) * volatility * 0.9;
    const open  = close;
    close = Math.max(start * 0.6, close + momentum);
    const bodyRange = Math.abs(close - open);
    const wickMult  = 0.3 + Math.random() * 0.5;
    const high = Math.max(open, close) + bodyRange * wickMult + volatility * 0.18 * Math.random();
    const low  = Math.min(open, close) - bodyRange * wickMult - volatility * 0.18 * Math.random();
    return {
      t:   labelFn(i),
      o:   Math.round(open  * 100) / 100,
      h:   Math.round(high  * 100) / 100,
      l:   Math.round(low   * 100) / 100,
      c:   Math.round(close * 100) / 100,
      vol: Math.round((2 + Math.random() * 8) * 1e6),
    };
  });
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function fmtHour(totalMin: number): string {
  const h = 9 + Math.floor((totalMin + 30) / 60);
  const m = (totalMin + 30) % 60;
  if (m === 0) return h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function addTradingDays(base: Date, days: number): Date {
  const d = new Date(base);
  let added = 0;
  const dir = days >= 0 ? 1 : -1;
  while (added < Math.abs(days)) {
    d.setDate(d.getDate() + dir);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d;
}

function genChartData(idxVal: number): Record<TF, Point[]> {
  const now = new Date();

  // ── 1D: PSX 9:30–3:30 PKT, only bars elapsed so far ──
  const pktNow  = new Date(now.getTime() + 5 * 3600000);
  const pktH    = pktNow.getUTCHours(), pktM = pktNow.getUTCMinutes();
  const elapsed = Math.max(5, Math.min(360, pktH * 60 + pktM - (9 * 60 + 30)));
  const bars1D  = Math.ceil(elapsed / 5);

  // ── helpers ──
  const tradingLabel = (tradingDaysAgo: number): string => {
    const d = addTradingDays(now, -tradingDaysAgo);
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  };
  const weekLabel = (weeksAgo: number): string => {
    const d = new Date(now); d.setDate(d.getDate() - weeksAgo * 7);
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  };
  const monthLabel = (monthsAgo: number): string => {
    const d = new Date(now); d.setMonth(d.getMonth() - monthsAgo);
    return `${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
  };

  // YTD trading days
  const jan1 = new Date(now.getFullYear(), 0, 1);
  let ytdBars = 0;
  const tmp = new Date(jan1);
  while (tmp <= now) { const dow = tmp.getDay(); if (dow!==0&&dow!==6) ytdBars++; tmp.setDate(tmp.getDate()+1); }
  ytdBars = Math.max(1, ytdBars);

  return {
    "1D":  genCandles(bars1D,   idxVal*0.993, idxVal*0.003,  i => fmtHour(i * 5)),
    "1M":  genCandles(22,       idxVal*0.962, idxVal*0.008,  i => tradingLabel(21 - i)),
    "6M":  genCandles(126,      idxVal*0.88,  idxVal*0.012,  i => tradingLabel(125 - i)),
    "YTD": genCandles(ytdBars,  idxVal*0.84,  idxVal*0.013,  i => { const d=addTradingDays(jan1,i); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; }),
    "1Y":  genCandles(52,       idxVal*0.77,  idxVal*0.020,  i => weekLabel(51 - i)),
    "3Y":  genCandles(36,       idxVal*0.48,  idxVal*0.040,  i => monthLabel(35 - i)),
    "5Y":  genCandles(60,       idxVal*0.30,  idxVal*0.055,  i => monthLabel(59 - i)),
  };
}

// ── Range slider ──────────────────────────────────────────────────────
function RangeSlider({ label, lo, hi, cur }: { label:string; lo:number; hi:number; cur:number }) {
  const pct = Math.min(100, Math.max(0, ((cur-lo)/(hi-lo))*100));
  const fmt = (n:number) => n.toLocaleString("en-PK", {minimumFractionDigits:2,maximumFractionDigits:2});
  return (
    <div style={{marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
        <span style={{fontSize:10,fontWeight:700,color:"#444",textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</span>
        <span style={{fontSize:10,color:"#666"}}>{fmt(lo)} — {fmt(hi)}</span>
      </div>
      <div style={{position:"relative",height:4,background:"#e5e7eb",borderRadius:2}}>
        <div style={{position:"absolute",top:"50%",left:`${pct}%`,transform:"translate(-50%,-50%)",width:11,height:11,borderRadius:"50%",background:"#111",border:"2px solid #fff",boxShadow:"0 1px 3px rgba(0,0,0,0.3)",zIndex:1}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:3,fontSize:9,color:"#999"}}>
        <span>{fmt(lo)}</span><span>{fmt(hi)}</span>
      </div>
    </div>
  );
}

// ── Candle Tooltip ────────────────────────────────────────────────────
function TooltipBox({ pt, pct }: { pt: Point; pct: number }) {
  const { dark } = useDarkTokens();
  const bull = pt.c >= pt.o;
  const col  = bull ? "#16a34a" : "#dc2626";
  const fmt  = (n: number) => n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bg   = dark ? "rgba(14,31,48,0.85)" : "rgba(255,255,255,0.15)";
  const textC  = dark ? "#BDD0E8" : "#444";
  const lblC   = dark ? "#5C8099" : "#bbb";
  const oC     = dark ? "#7A9AB8" : "#555";
  const divC   = dark ? "rgba(255,255,255,0.08)" : "#f0f0f0";
  return (
    <div style={{
      position: "absolute", top: 8, pointerEvents: "none", zIndex: 30,
      left:  pct < 0.6 ? `calc(${(pct*100).toFixed(1)}% + 12px)` : "auto",
      right: pct >= 0.6 ? `calc(${((1-pct)*100).toFixed(1)}% + 12px)` : "auto",
      background: bg, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      border: `1.5px solid ${col}`,
      borderRadius: 8, padding: "9px 13px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      minWidth: 160,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: textC, marginBottom: 7 }}>{pt.t}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 5, columnGap: 10 }}>
        {([["O", pt.o, oC], ["H", pt.h, "#16a34a"], ["L", pt.l, "#dc2626"], ["C", pt.c, col]] as [string,number,string][]).map(([lbl, val, c]) => (
          <div key={lbl}>
            <span style={{ fontSize: 8, color: lblC, fontWeight: 700, marginRight: 4 }}>{lbl}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: c, fontVariantNumeric: "tabular-nums" }}>{fmt(val)}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, color: lblC, marginTop: 6, paddingTop: 5, borderTop: `1px solid ${divC}` }}>
        Vol  <span style={{ fontWeight: 700, color: oC }}>{(pt.vol / 1e6).toFixed(2)}M</span>
      </div>
    </div>
  );
}

// ── Candlestick Chart ─────────────────────────────────────────────────
function CandleChart({ points, liveVal, isLive, dark }: { points: Point[]; liveVal: number; isLive: boolean; dark?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<HoverState|null>(null);
  const hoverRef = useRef<HoverState|null>(null);
  const rafRef   = useRef<number|null>(null);

  const W=900, H=260, padL=6, padR=76, padT=12, padB=22;
  const volH = 40;
  const chartW = W-padL-padR, chartH = H-padT-padB-volH;

  const pts = isLive
    ? points.map((p,i) => i===points.length-1 ? {...p, c:liveVal, h:Math.max(p.h,liveVal), l:Math.min(p.l,liveVal)} : p)
    : points;

  if (!pts.length) return <div style={{height:H}}/>;

  // ── Tight Y autoscale on visible OHLC ──
  const allH = pts.map(p=>p.h), allL = pts.map(p=>p.l);
  const minV = Math.min(...allL), maxV = Math.max(...allH);
  const rng  = maxV - minV || minV * 0.01;
  const pad  = rng * 0.08;          // 8% padding top & bottom
  const lo = minV - pad, hi = maxV + pad;

  // candle slot & width — body 8–12px, wick 1.5px
  const slot  = chartW / pts.length;
  const candW = Math.max(4, Math.min(12, slot * 0.6));
  const toX   = (i:number) => padL + i * slot + slot / 2;
  const toY   = (v:number) => padT + chartH - ((v - lo) / (hi - lo)) * chartH;

  // Y ticks
  const yTicks = 5;
  const yPrices = Array.from({length:yTicks},(_,i)=>lo+(i/(yTicks-1))*(hi-lo));

  // X labels ~6
  const xStep = Math.max(1, Math.floor(pts.length / 6));

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) / rect.width * W;
    const idx = Math.max(0, Math.min(pts.length-1, Math.floor((mx - padL) / slot)));
    const next: HoverState = { idx, x: toX(idx), mouseX: mx };
    hoverRef.current = next;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => { rafRef.current = null; setHover(hoverRef.current); });
  };
  const handleMouseLeave = () => {
    hoverRef.current = null;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setHover(null);
  };

  const hPt = hover ? pts[hover.idx] : null;
  const maxVol = Math.max(...pts.map(p=>p.vol)) || 1;
  const volBaseY = padT + chartH + volH - 4;

  const chartBg   = dark ? "#0E1F30" : "#fff";
  const gridH     = dark ? "rgba(255,255,255,0.06)" : "#f3f4f6";
  const gridV     = dark ? "rgba(255,255,255,0.04)" : "#f0f0f0";
  const yFill     = dark ? "#5C8099" : "#aaa";
  const xFill     = dark ? "#3A6080" : "#bbb";
  const crossH    = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";
  const crossV    = dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
  const borderCol = dark ? "rgba(255,255,255,0.09)" : "#e5e7eb";

  return (
    <div style={{position:"relative",border:`1px solid ${borderCol}`,borderRadius:6,overflow:"hidden",background:chartBg}}>
      <style>{`@keyframes cFadeIn{from{opacity:0;transform:scaleY(0.3)}to{opacity:1;transform:scaleY(1)}}`}</style>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
        style={{width:"100%",height:"auto",display:"block",cursor:"crosshair"}}
        onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>

        {/* Background */}
        <rect x="0" y="0" width={W} height={H} fill={chartBg}/>

        <clipPath id="cc"><rect x={padL} y={padT} width={chartW} height={chartH}/></clipPath>

        {/* Grid */}
        {yPrices.map((p,i)=>(
          <line key={i} x1={padL} y1={toY(p)} x2={W-padR} y2={toY(p)}
            stroke={gridH} strokeWidth="1"/>
        ))}
        {/* Vertical grid lines */}
        {pts.filter((_,i)=> i % Math.max(1,Math.floor(pts.length/6)) === 0).map((_,i,arr)=>{
          const oi = pts.indexOf(arr[i] as Point);
          return <line key={i} x1={toX(oi)} y1={padT} x2={toX(oi)} y2={padT+chartH} stroke={gridV} strokeWidth="1"/>;
        })}

        {/* Candles */}
        <g clipPath="url(#cc)">
          {pts.map((p,i)=>{
            const bull  = p.c >= p.o;
            const col   = bull ? "#16a34a" : "#dc2626";
            const cx    = toX(i);
            const bodyTop = toY(Math.max(p.o, p.c));
            const bodyBot = toY(Math.min(p.o, p.c));
            const bodyH   = Math.max(2, bodyBot - bodyTop);
            const isHov   = hover?.idx === i;
            return (
              <g key={i} style={{animation:`cFadeIn 0.3s ease ${i*2}ms both`}}>
                <line x1={cx} y1={toY(p.h)} x2={cx} y2={toY(p.l)} stroke={col} strokeWidth={isHov ? 2 : 1.5}/>
                <rect x={cx - candW/2} y={bodyTop} width={candW} height={bodyH} fill={col} stroke="none"/>
              </g>
            );
          })}
        </g>

        {/* Y labels */}
        {yPrices.map((p,i)=>(
          <text key={i} x={W-padR+5} y={toY(p)} fontSize="8.5" fill={yFill} dominantBaseline="middle">
            {p>=1000 ? (p/1000).toFixed(1)+"K" : p.toFixed(0)}
          </text>
        ))}

        {/* Volume bars */}
        {pts.map((p,i)=>{
          const bull = p.c >= p.o;
          const bh = Math.max(1,(p.vol/maxVol)*(volH-8));
          const isHov = hover?.idx===i;
          return (
            <rect key={i}
              x={toX(i)-candW/2} y={volBaseY-bh} width={candW} height={bh}
              fill={bull ? "rgba(22,163,74,0.4)" : "rgba(220,38,38,0.4)"}
              opacity={isHov?1:0.7}
              style={{animation:`cFadeIn 0.5s ease ${i*3}ms both`}}
            />
          );
        })}

        {/* X labels */}
        {pts.map((p,i)=> i%xStep===0 || i===pts.length-1 ? (
          <text key={i} x={toX(i)} y={H-4} fontSize="8" fill={xFill} textAnchor="middle">{p.t}</text>
        ) : null)}

        {/* Hover crosshair */}
        {hover && (
          <>
            <line x1={hover.mouseX} y1={padT} x2={hover.mouseX} y2={padT+chartH}
              stroke={crossH} strokeWidth="1" strokeDasharray="4 3"/>
            <line x1={padL} y1={toY(pts[hover.idx].c)} x2={W-padR} y2={toY(pts[hover.idx].c)}
              stroke={crossV} strokeWidth="1" strokeDasharray="3 3"/>
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hover && hPt && (
        <TooltipBox pt={hPt} pct={hover.mouseX / W} />
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function KseDetailPanel() {
  const t = useDarkTokens();
  const [activeCode, setActiveCode] = useState("KSE100");
  const [activeTf,   setActiveTf]   = useState<TF>("1D");
  const [chartData, setChartData] = useState<Record<TF,Point[]>>({} as Record<TF,Point[]>);
  const [liveVal,    setLiveVal]    = useState(ALL_INDICES[0].val);
  const [flash,      setFlash]      = useState<"up"|"down"|null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const prevRef = useRef(ALL_INDICES[0].val);

  const idx = ALL_INDICES.find(i=>i.code===activeCode) ?? ALL_INDICES[0];
  const isKSE100 = activeCode === "KSE100";
  const dispVal  = isKSE100 ? liveVal : idx.val;
  const dispChg  = isKSE100 ? (liveVal - idx.prevClose) : idx.chg;
  const dispPct  = isKSE100 ? ((liveVal - idx.prevClose)/idx.prevClose*100) : idx.pct;
  const isUp     = dispChg >= 0;
  const color    = isUp ? "#16A34A" : "#DC2626";

  // Generate chart data on index change
  useEffect(() => {
    setChartData(genChartData(idx.val));
  }, [activeCode]);

  // Live tick — updates last candle price + flashes every 1.5s
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (activeCode !== "KSE100") return;
    tickRef.current = setInterval(() => {
      const delta = (Math.random()-0.51)*80 + (Math.random()-0.5)*40;
      setLiveVal(prev => {
        const nv = Math.max(idx.low * 0.95, Math.round((prev + delta) * 100) / 100);
        const up = nv > prevRef.current;
        setFlash(up ? "up" : "down");
        setTimeout(() => setFlash(null), 350);
        prevRef.current = nv;
        return nv;
      });
    }, 1500);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [activeCode, idx.low]);

  const scrollNav = (dir: "left"|"right") => {
    navRef.current?.scrollBy({ left: dir==="right" ? 160 : -160, behavior:"smooth" });
  };

  const [asOf, setAsOf] = useState("");
  useEffect(() => {
    const now = new Date();
    setAsOf(now.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})
      + " " + now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}));
  }, []);

  const pts = chartData[activeTf] ?? [];
  const high52 = idx.val * 1.06;
  const low52  = idx.val * 0.76;

  return (
    <div style={{
      background:t.bg, border:`1px solid ${t.border}`, borderRadius:8,
      boxShadow:t.cardShadow, overflow:"hidden", fontFamily:"inherit",
    }}>
      {/* ── Heading ── */}
      <div style={{padding:"10px 12px 0"}}>
        <h2 style={{fontSize:16,fontWeight:700,color:t.text,marginBottom:8}}>Indices</h2>

        {/* ── Index navigation bar ── */}
        <div style={{display:"flex",alignItems:"center",gap:0}}>
          <button onClick={()=>scrollNav("left")}
            style={{flexShrink:0,width:28,height:28,borderRadius:"50%",border:"none",
              background:"#16A34A",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",marginRight:6}}>‹</button>

          <div ref={navRef} style={{flex:1,overflowX:"auto",scrollbarWidth:"none",display:"flex",gap:0,borderBottom:`2px solid ${t.border}`}}>
            {ALL_INDICES.map(ix=>(
              <button key={ix.code} onClick={()=>{ setActiveCode(ix.code); if(ix.code==="KSE100") setLiveVal(ix.val); }}
                style={{
                  flexShrink:0, padding:"8px 14px", background:"none", border:"none",
                  borderBottom: activeCode===ix.code ? "2px solid #16A34A" : "2px solid transparent",
                  marginBottom:-2,
                  fontWeight: activeCode===ix.code ? 700 : 500,
                  fontSize:12, color: activeCode===ix.code ? t.text : t.textMuted,
                  cursor:"pointer", whiteSpace:"nowrap", transition:"all 120ms ease",
                }}>
                {ix.label}
              </button>
            ))}
          </div>

          <button onClick={()=>scrollNav("right")}
            style={{flexShrink:0,width:28,height:28,borderRadius:"50%",border:"none",
              background:"#16A34A",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",marginLeft:6}}>›</button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",padding:"8px 14px",borderBottom:`1px solid ${t.border}`,gap:0}}>
        <div style={{marginRight:16}}>
          <span style={{fontSize:"1.15rem",fontWeight:700,letterSpacing:"-0.5px",color:flash==="up"?"#16A34A":flash==="down"?"#DC2626":t.text,transition:"color 200ms",fontVariantNumeric:"tabular-nums"}}>
            {dispVal.toLocaleString("en-PK",{minimumFractionDigits:2,maximumFractionDigits:2})}
          </span>
          <span style={{fontSize:11,fontWeight:700,color,marginLeft:8,fontVariantNumeric:"tabular-nums"}}>
            {isUp?"▲":"▼"} {Math.abs(dispChg).toLocaleString("en-PK",{minimumFractionDigits:2,maximumFractionDigits:2})} ({dispPct>0?"+":""}{dispPct.toFixed(2)}%)
          </span>
        </div>
        {[
          {label:"HIGH",val:idx.high.toLocaleString("en-PK",{minimumFractionDigits:2,maximumFractionDigits:2})},
          {label:"LOW", val:idx.low.toLocaleString("en-PK",{minimumFractionDigits:2,maximumFractionDigits:2})},
          {label:"VOL", val:(idx.vol/1e6).toFixed(1)+"M"},
          {label:"PREV",val:idx.prevClose.toLocaleString("en-PK",{minimumFractionDigits:2,maximumFractionDigits:2})},
          {label:"1Y",  val:idx.yr1Pct>=0?`▲${idx.yr1Pct.toFixed(2)}%`:`▼${Math.abs(idx.yr1Pct).toFixed(2)}%`,col:idx.yr1Pct>=0?"#16A34A":"#DC2626"},
          {label:"YTD", val:idx.ytdPct>=0?`▲${idx.ytdPct.toFixed(2)}%`:`▼${Math.abs(idx.ytdPct).toFixed(2)}%`,col:idx.ytdPct>=0?"#16A34A":"#DC2626"},
        ].map((item,i)=>(
          <div key={i} style={{padding:"3px 12px",borderLeft:`1px solid ${t.border}`}}>
            <div style={{fontSize:8,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:t.textMuted}}>{item.label}</div>
            <div style={{fontSize:10,fontWeight:700,color:(item as {col?:string}).col??t.text,fontVariantNumeric:"tabular-nums"}}>{item.val}</div>
          </div>
        ))}
        <span style={{marginLeft:"auto",fontSize:9,color:t.textMuted}}>{asOf}</span>
      </div>

      {/* ── Full-width chart ── */}
      <div style={{padding:"10px 10px 8px"}}>
        <div style={{display:"flex",gap:2,marginBottom:8}}>
          {TF_TABS.map(tf=>(
            <button key={tf} onClick={()=>setActiveTf(tf)}
              style={{padding:"3px 8px",borderRadius:4,border:"none",cursor:"pointer",fontSize:10,fontWeight:700,background:activeTf===tf?"#16A34A":"transparent",color:activeTf===tf?"#fff":t.textMuted,transition:"all 120ms ease"}}>
              {tf}
            </button>
          ))}
        </div>
        <CandleChart points={pts} liveVal={dispVal} isLive={activeCode==="KSE100"&&activeTf==="1D"} dark={t.dark}/>
      </div>
    </div>
  );
}
