"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useDarkTokens } from "@/hooks/useDarkMode";

type IndexDef = { code: string; label: string; val: number; chg: number; pct: number; vol: number; high: number; low: number; prevClose: number; yr1Pct: number; ytdPct: number };

type TF = "1D"|"1M"|"6M"|"YTD"|"1Y"|"3Y"|"5Y";
const TF_TABS: TF[] = ["1D","1M","6M","YTD","1Y","3Y","5Y"];

// zoom levels: fraction of candles to show from the end
const ZOOM_LEVELS = [1, 0.6, 0.35, 0.18, 0.08];
const ZOOM_MIN = 0; const ZOOM_MAX = ZOOM_LEVELS.length - 1;

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

  // hour label for intra-day (15-min bars for 1M)
  const hourLabel = (hoursAgo: number): string => {
    const d = new Date(now.getTime() - hoursAgo * 3600000);
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getHours()}:00`;
  };

  return {
    "1D":  genCandles(bars1D,   idxVal*0.993, idxVal*0.003,  i => fmtHour(i * 5)),
    // 1M: 30 days × 6 trading hours × 4 (15-min bars) = ~480 bars → use hourly = 132
    "1M":  genCandles(132,      idxVal*0.962, idxVal*0.004,  i => hourLabel(131 - i)),
    "6M":  genCandles(126,      idxVal*0.88,  idxVal*0.012,  i => tradingLabel(125 - i)),
    "YTD": genCandles(ytdBars,  idxVal*0.84,  idxVal*0.013,  i => { const d=addTradingDays(jan1,i); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; }),
    // 1Y: daily bars (252 trading days) for dense candles
    "1Y":  genCandles(252,      idxVal*0.77,  idxVal*0.011,  i => tradingLabel(251 - i)),
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

  const W=900, H=300, padL=6, padR=76, padT=14, padB=24;
  const volH = 36;
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

  // candle slot & width — reference style: thin body (~55% of slot), max 10px
  const slot  = chartW / pts.length;
  const candW = Math.max(1, Math.min(10, slot * 0.55));
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

  // scroll-wheel zoom: pass onWheel from parent via prop if needed (no-op here, handled at panel level)


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
              <g key={i} style={{animation:`cFadeIn 0.25s ease ${Math.min(i,40)*1.5}ms both`}}>
                {/* wick */}
                <line x1={cx} y1={toY(p.h)} x2={cx} y2={toY(p.l)} stroke={col} strokeWidth={isHov ? 1.5 : 1} opacity={0.85}/>
                {/* body */}
                <rect x={cx - candW/2} y={bodyTop} width={candW} height={bodyH}
                  fill={bull ? "#16a34a" : "#dc2626"}
                  stroke={isHov ? (bull ? "#4ade80" : "#f87171") : "none"}
                  strokeWidth={isHov ? 0.8 : 0}
                  rx={candW > 4 ? 1 : 0}
                />
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
          const bh = Math.max(1,(p.vol/maxVol)*(volH-6));
          const isHov = hover?.idx===i;
          return (
            <rect key={i}
              x={toX(i)-candW/2} y={volBaseY-bh} width={Math.max(1, candW)} height={bh}
              fill={bull ? "rgba(22,163,74,0.45)" : "rgba(220,38,38,0.45)"}
              opacity={isHov ? 1 : 0.65}
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
type RawIndex = { code: string; close: number; change: number; pct: number; vol: number };
function mapIndices(raw: RawIndex[]): IndexDef[] {
  return raw.map(ix => {
    const close = Number(ix.close) || 0;
    const change = Number(ix.change) || 0;
    return { code: ix.code, label: ix.code, val: close, chg: change, pct: Number(ix.pct) || 0, vol: Number(ix.vol) || 0, high: close * 1.005, low: close * 0.995, prevClose: close - change, yr1Pct: 0, ytdPct: 0 };
  });
}

export default function KseDetailPanel({ initialIndices }: { initialIndices?: RawIndex[] }) {
  const [indices, setIndices] = useState<IndexDef[]>(() => initialIndices ? mapIndices(initialIndices) : []);
  const [loading, setLoading] = useState(!initialIndices);

  useEffect(() => {
    if (initialIndices) return;
    fetch("/api/portal/market-summary")
      .then(r => r.json())
      .then(d => setIndices(mapIndices(d.indices ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialIndices]);

  if (loading) {
    return <div className="card animate-pulse" style={{ height: 420 }} />;
  }
  if (indices.length === 0) {
    return (
      <div className="card p-6 text-center" style={{ color: "var(--text-muted)" }}>
        <div className="text-sm font-semibold mb-1" style={{ color: "var(--navy)" }}>Index Chart — No data available</div>
        <div className="text-xs">Connect to DB or wait for market hours.</div>
      </div>
    );
  }
  return <KseDetailPanelInner indices={indices} />;
}

function KseDetailPanelInner({ indices }: { indices: IndexDef[] }) {
  const t = useDarkTokens();
  const [activeCode, setActiveCode] = useState(indices[0].code);
  const [activeTf,   setActiveTf]   = useState<TF>("1D");
  const [zoomLevel,  setZoomLevel]  = useState(0); // index into ZOOM_LEVELS
  const [chartData, setChartData] = useState<Record<TF,Point[]>>({} as Record<TF,Point[]>);
  const [liveVal,    setLiveVal]    = useState(indices[0].val);
  const [flash,      setFlash]      = useState<"up"|"down"|null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const prevRef = useRef(indices[0].val);

  const idx = indices.find(i=>i.code===activeCode) ?? indices[0];
  const isKSE100 = activeCode === indices[0].code;
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
    if (activeCode !== indices[0].code) return;
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

  const allPts = chartData[activeTf] ?? [];
  const zoomFrac = ZOOM_LEVELS[zoomLevel];
  const showCount = Math.max(5, Math.round(allPts.length * zoomFrac));
  const pts = allPts.slice(allPts.length - showCount);
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
            {indices.map(ix=>(
              <button key={ix.code} onClick={()=>{ setActiveCode(ix.code); if(ix.code===indices[0].code) setLiveVal(ix.val); }}
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
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{display:"flex",gap:2}}>
            {TF_TABS.map(tf=>(
              <button key={tf} onClick={()=>{ setActiveTf(tf); setZoomLevel(0); }}
                style={{padding:"3px 8px",borderRadius:4,border:"none",cursor:"pointer",fontSize:10,fontWeight:700,background:activeTf===tf?"#16A34A":"transparent",color:activeTf===tf?"#fff":t.textMuted,transition:"all 120ms ease"}}>
                {tf}
              </button>
            ))}
          </div>
          {/* Zoom controls */}
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <button
              onClick={()=>setZoomLevel(z=>Math.min(z+1,ZOOM_MAX))}
              disabled={zoomLevel>=ZOOM_MAX}
              title="Zoom In"
              style={{width:24,height:24,borderRadius:4,border:`1px solid ${t.border}`,background:t.dark?"rgba(255,255,255,0.06)":"#f5f5f5",color:zoomLevel>=ZOOM_MAX?t.textMuted:t.text,cursor:zoomLevel>=ZOOM_MAX?"not-allowed":"pointer",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
              +
            </button>
            <span style={{fontSize:9,color:t.textMuted,minWidth:22,textAlign:"center",fontVariantNumeric:"tabular-nums"}}>
              {zoomLevel===0?"All":`${Math.round(ZOOM_LEVELS[zoomLevel]*100)}%`}
            </span>
            <button
              onClick={()=>setZoomLevel(z=>Math.max(z-1,ZOOM_MIN))}
              disabled={zoomLevel<=ZOOM_MIN}
              title="Zoom Out"
              style={{width:24,height:24,borderRadius:4,border:`1px solid ${t.border}`,background:t.dark?"rgba(255,255,255,0.06)":"#f5f5f5",color:zoomLevel<=ZOOM_MIN?t.textMuted:t.text,cursor:zoomLevel<=ZOOM_MIN?"not-allowed":"pointer",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
              −
            </button>
          </div>
        </div>
        <div onWheel={e=>{ e.preventDefault(); setZoomLevel(z=>e.deltaY<0?Math.min(z+1,ZOOM_MAX):Math.max(z-1,ZOOM_MIN)); }} style={{touchAction:"none"}}>
          <CandleChart points={pts} liveVal={dispVal} isLive={activeCode==="KSE100"&&activeTf==="1D"} dark={t.dark}/>
        </div>
      </div>
    </div>
  );
}
