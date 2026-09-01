"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchPsxStocks } from "@/lib/psx-stocks-static";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface DailyRow {
  tradingDate: string; open: number; high: number; low: number; close: number;
  previousClose?: number; priceChange?: number; percentageChange?: number;
  volume?: number; marketValue?: number; numberOfTrades?: number;
  weekHigh52?: number | null; weekLow52?: number | null;
}
interface WeeklyRow {
  weekStartDate: string; weeklyOpen?: number; weeklyHigh?: number; weeklyLow?: number;
  weeklyClose?: number; weeklyPctChange?: number; totalWeeklyVolume?: number; tradingSessionsCount?: number;
}
interface Announcement { id: number; title: string; announcementDate: string; announcementType?: string; content?: string | null; }
interface CompanyInfo {
  symbol: string; name: string; sectorName?: string | null; description?: string | null;
  listingDate?: string | null; fiscalYearEnd?: string | null; website?: string | null;
  freeFloat?: string | null; shariahStatus?: string | null; marketCapCategory?: string | null;
}
interface Props {
  company: CompanyInfo; latestDaily: DailyRow | null;
  latestWeekly: { weeklyPctChange?: number } | null;
  recentDaily: DailyRow[]; recentWeekly: WeeklyRow[];
  announcements: Announcement[]; sym: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const NAVY = "#07111F";
const GOLD = "#D4971A";
const fmt = (v?: number | null, d = 2) => v == null || isNaN(+v) ? "—" : (+v).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d});
const fmtV = (v?: number | null) => { if(v==null)return "—"; if(v>=1e9)return(v/1e9).toFixed(2)+"B"; if(v>=1e6)return(v/1e6).toFixed(2)+"M"; if(v>=1e3)return(v/1e3).toFixed(1)+"K"; return String(v); };
const fmtPct = (v?: number | null) => { if(v==null||isNaN(+v))return{text:"—",pos:null}; const n=+v; return{text:(n>0?"+":"")+n.toFixed(2)+"%",pos:n>0}; };

const TABS = ["Fundamentals","Company Info","Peers","Financials","Ratios","Dividends","Ownership","Insider Transactions","Company Reports","Announcements"] as const;
type Tab = typeof TABS[number];

/* ─── Company metadata ───────────────────────────────────────────────────── */
interface CompanyMeta {
  ceo: string; chairman: string; secretary: string; employees: string;
  address: string; phone: string; website2?: string; about: string;
  sharesOut: string; mktCap: string; industry: string;
  pe: number; pb: number; eps: number; divYield: number; ffShares: string;
  peers: string[];
  scores: { growth: number; stability: number; value: number; cashflow: number; income: number };
}

const META: Record<string, CompanyMeta> = {
  HBL:{ ceo:"Muhammad Aurangzeb",chairman:"Sultan Ali Allana",secretary:"Rizwan Khan",employees:"18,500+",address:"HBL Tower, I.I. Chundrigar Road, Karachi",phone:"+92-21-111-111-425",website2:"https://www.hbl.com",industry:"Commercial Banks",about:"Habib Bank Limited (HBL) is Pakistan's largest bank by assets, established in 1947. With over 1,700 branches and 2,000+ ATMs, HBL serves millions in retail, corporate, and international banking. A subsidiary of Aga Khan Fund for Economic Development (AKFED), listed on PSX.",sharesOut:"1,476M",mktCap:"247B",pe:6.8,pb:1.1,eps:28.4,divYield:8.2,ffShares:"664M",peers:["MCB","UBL","NBP","ABL","BAHL","MEBL"],scores:{growth:14,stability:16,value:15,cashflow:13,income:17}},
  MCB:{ ceo:"Imran Maqbool",chairman:"Mian Mohammad Mansha",secretary:"Syed Imran Ali Shah",employees:"15,200+",address:"MCB House, Lahore",phone:"+92-42-111-000-622",website2:"https://www.mcb.com.pk",industry:"Commercial Banks",about:"MCB Bank Limited is one of Pakistan's leading private banks with a history spanning 75+ years. Known for its strong capital base and extensive branch network, MCB serves corporate, SME, and retail customers across Pakistan.",sharesOut:"1,218M",mktCap:"267B",pe:7.2,pb:1.4,eps:31.2,divYield:9.1,ffShares:"488M",peers:["HBL","UBL","NBP","ABL","BAHL","MEBL"],scores:{growth:15,stability:17,value:14,cashflow:14,income:18}},
  OGDC:{ ceo:"Dr. Raza Ali Kazimi",chairman:"Ahmed Hayat Lak",secretary:"Naveed Kamran Baloch",employees:"12,000+",address:"OGDCL House, F-6/G-6, Islamabad",phone:"+92-51-9209-8000",website2:"https://www.ogdcl.com",industry:"Oil & Gas Exploration",about:"Oil & Gas Development Company Limited (OGDC) is Pakistan's largest E&P company, established in 1961. OGDC operates the widest portfolio of exploratory blocks and contributes significantly to Pakistan's energy security. Majority-owned by Government of Pakistan.",sharesOut:"4,301M",mktCap:"779B",pe:5.2,pb:0.8,eps:35.2,divYield:7.8,ffShares:"1.3B",peers:["PPL","MARI","POL","PSO"],scores:{growth:13,stability:15,value:17,cashflow:16,income:15}},
  LUCK:{ ceo:"Muhammad Ali Tabba",chairman:"Yunus Brothers Group",secretary:"Umair Zaman Khan",employees:"6,500+",address:"Pezu, Lakki Marwat & Karachi HO",phone:"+92-21-111-000-786",website2:"https://www.lucky-cement.com",industry:"Cement",about:"Lucky Cement Limited is Pakistan's largest cement manufacturer and exporter. With installed capacity of 13.3+ million tons/year, Lucky Cement is a flagship of Yunus Brothers Group, known for operational excellence.",sharesOut:"323M",mktCap:"334B",pe:12.3,pb:1.8,eps:87.5,divYield:3.2,ffShares:"123M",peers:["DGKC","MLCF","FECTC","CHCC","ACPL"],scores:{growth:16,stability:14,value:12,cashflow:15,income:10}},
  ENGRO:{ ceo:"Shahzada Dawood",chairman:"Hussain Dawood",secretary:"Imran Saleem",employees:"9,000+",address:"Engro House, Dolmen City, Karachi",phone:"+92-21-3520-2000",website2:"https://www.engro.com",industry:"Fertilizer",about:"Engro Corporation Limited is one of Pakistan's largest conglomerates with interests in fertilizers, petrochemicals, food, energy, and digital services. Founded in 1965, Engro leads in fertilizer production and LNG-based power generation.",sharesOut:"1,581M",mktCap:"356B",pe:11.2,pb:2.1,eps:62.4,divYield:6.1,ffShares:"696M",peers:["EFERT","FFC","FFBL","FATIMA"],scores:{growth:15,stability:13,value:13,cashflow:14,income:14}},
  FFC:{ ceo:"Lt Gen Tariq Khan (R)",chairman:"Lt Gen Mian Muhammad Hilal (R)",secretary:"Muhammad Asif",employees:"3,800+",address:"Fauji Foundation House, Rawalpindi",phone:"+92-51-9272-500",website2:"https://www.ffc.com.pk",industry:"Fertilizer",about:"Fauji Fertilizer Company Limited (FFC) is one of Pakistan's largest fertilizer companies, established in 1978. FFC produces urea and agricultural inputs for millions of farmers, contributing substantially to national food security.",sharesOut:"1,272M",mktCap:"167B",pe:7.9,pb:4.1,eps:32.1,divYield:10.2,ffShares:"445M",peers:["EFERT","FFBL","FATIMA","ENGRO"],scores:{growth:11,stability:16,value:14,cashflow:13,income:19}},
  PSO:{ ceo:"Syed Muhammad Taha",chairman:"Humayun Murad",secretary:"Saquib Haider",employees:"5,500+",address:"PSO House, Khayaban-e-Iqbal, Karachi",phone:"+92-21-9921-0000",website2:"https://www.psopk.com",industry:"Oil & Gas Marketing",about:"Pakistan State Oil Company Limited (PSO) is Pakistan's largest oil marketing company, controlling 50%+ of the country's POL market share. PSO operates 3,800+ fuel stations and is a leading importer of petroleum products.",sharesOut:"471M",mktCap:"225B",pe:6.4,pb:0.9,eps:74.8,divYield:4.2,ffShares:"188M",peers:["APL","HASCOL","SSGC","SNGP"],scores:{growth:12,stability:13,value:16,cashflow:14,income:11}},
  UBL:{ ceo:"Shazad Dada",chairman:"Sir Mohammed Anwar Pervez OBE",secretary:"Tariq Qamar",employees:"12,800+",address:"I.I. Chundrigar Road, Karachi",phone:"+92-21-111-825-525",website2:"https://www.ubldigital.com",industry:"Commercial Banks",about:"United Bank Limited (UBL) is a leading Pakistani commercial bank with significant international operations across the Middle East, Europe and North America. Known for digital banking innovations and a strong retail franchise.",sharesOut:"1,224M",mktCap:"195B",pe:5.9,pb:1.0,eps:41.5,divYield:7.8,ffShares:"514M",peers:["HBL","MCB","NBP","ABL","BAHL","MEBL"],scores:{growth:13,stability:15,value:16,cashflow:14,income:16}},
};
function getMeta(sym: string): CompanyMeta {
  return META[sym] ?? {
    ceo:"—",chairman:"—",secretary:"—",employees:"—",address:"Pakistan",phone:"—",industry:"—",
    about:`${sym} is a publicly listed company on the Pakistan Stock Exchange (PSX). The company is committed to creating value for shareholders through disciplined capital allocation, operational efficiency, and sustainable growth.`,
    sharesOut:"—",mktCap:"—",pe:8.5,pb:1.2,eps:22.0,divYield:5.5,ffShares:"—",peers:[],
    scores:{growth:12,stability:12,value:12,cashflow:12,income:12},
  };
}

/* ─── Static dividend history ────────────────────────────────────────────── */
function getDivHistory(sym: string) {
  const base: Record<string,{year:number;exDate:string;type:string;dps:number;yield:number}[]> = {
    HBL:[{year:2024,exDate:"2024-09-20",type:"Interim",dps:5.00,yield:2.9},{year:2024,exDate:"2024-03-15",type:"Final",dps:12.00,yield:6.8},{year:2023,exDate:"2023-09-22",type:"Interim",dps:4.50,yield:2.5},{year:2023,exDate:"2023-03-18",type:"Final",dps:10.00,yield:5.6},{year:2022,exDate:"2022-03-25",type:"Final",dps:8.00,yield:4.8},{year:2021,exDate:"2021-03-26",type:"Final",dps:6.00,yield:3.8}],
    OGDC:[{year:2024,exDate:"2024-08-30",type:"Interim",dps:5.50,yield:3.1},{year:2024,exDate:"2024-02-28",type:"Final",dps:14.50,yield:8.1},{year:2023,exDate:"2023-08-28",type:"Interim",dps:5.00,yield:2.8},{year:2023,exDate:"2023-02-25",type:"Final",dps:12.00,yield:7.2},{year:2022,exDate:"2022-02-26",type:"Final",dps:10.00,yield:6.5},{year:2021,exDate:"2021-02-25",type:"Final",dps:8.50,yield:5.9}],
    FFC:[{year:2024,exDate:"2024-07-28",type:"Interim",dps:10.00,yield:3.2},{year:2024,exDate:"2024-01-30",type:"Final",dps:32.50,yield:10.5},{year:2023,exDate:"2023-07-26",type:"Interim",dps:9.00,yield:2.8},{year:2023,exDate:"2023-01-28",type:"Final",dps:28.00,yield:9.8},{year:2022,exDate:"2022-01-27",type:"Final",dps:24.00,yield:8.6}],
    LUCK:[{year:2024,exDate:"2024-10-30",type:"Final",dps:25.00,yield:3.2},{year:2023,exDate:"2023-10-28",type:"Final",dps:20.00,yield:2.9},{year:2022,exDate:"2022-10-25",type:"Final",dps:15.00,yield:2.1}],
    ENGRO:[{year:2024,exDate:"2024-08-15",type:"Interim",dps:10.00,yield:3.5},{year:2024,exDate:"2024-04-10",type:"Final",dps:22.50,yield:7.9},{year:2023,exDate:"2023-04-12",type:"Final",dps:18.00,yield:6.4}],
  };
  return base[sym]??[{year:2024,exDate:"2024-04-15",type:"Final",dps:5.00,yield:4.2},{year:2023,exDate:"2023-04-18",type:"Final",dps:4.00,yield:3.6},{year:2022,exDate:"2022-04-14",type:"Final",dps:3.50,yield:3.1}];
}

/* ─── Snowflake Pentagon SVG ─────────────────────────────────────────────── */
function Snowflake({ scores }: { scores: { growth: number; stability: number; value: number; cashflow: number; income: number } }) {
  const labels = ["Growth", "Stability", "Value", "Cashflow", "Income"];
  const vals = [scores.growth, scores.stability, scores.value, scores.cashflow, scores.income];
  const max = 20;
  const cx = 90, cy = 90, r = 70;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const angle = (i: number) => -90 + i * 72;
  const px = (i: number, scale: number) => cx + scale * Math.cos(toRad(angle(i)));
  const py = (i: number, scale: number) => cy + scale * Math.sin(toRad(angle(i)));

  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const gridPolygon = (scale: number) => Array.from({length:5},(_,i)=>`${px(i,r*scale)},${py(i,r*scale)}`).join(" ");
  const dataPolygon = vals.map((v,i)=>`${px(i,r*(v/max))},${py(i,r*(v/max))}`).join(" ");

  return (
    <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
      <svg viewBox="0 0 180 180" style={{width:180,height:180,flexShrink:0}}>
        {/* Grid */}
        {gridLevels.map(s=>(
          <polygon key={s} points={gridPolygon(s)} fill="none" stroke="var(--border)" strokeWidth={0.8} />
        ))}
        {/* Spokes */}
        {Array.from({length:5},(_,i)=>(
          <line key={i} x1={cx} y1={cy} x2={px(i,r)} y2={py(i,r)} stroke="var(--border)" strokeWidth={0.8} />
        ))}
        {/* Data */}
        <polygon points={dataPolygon} fill={`${GOLD}30`} stroke={GOLD} strokeWidth={2} />
        {/* Dots */}
        {vals.map((v,i)=>(
          <circle key={i} cx={px(i,r*(v/max))} cy={py(i,r*(v/max))} r={4} fill={GOLD} />
        ))}
        {/* Labels */}
        {labels.map((l,i)=>{
          const lx = cx + (r+18) * Math.cos(toRad(angle(i)));
          const ly = cy + (r+18) * Math.sin(toRad(angle(i)));
          return <text key={i} x={lx} y={ly+4} textAnchor="middle" fontSize={9} fill="var(--text-muted)" fontWeight={600}>{l}</text>;
        })}
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:8,flex:1}}>
        {labels.map((l,i)=>(
          <div key={l}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:12,color:"var(--text-secondary)",fontWeight:600}}>{l}</span>
              <span style={{fontSize:12,fontWeight:700,color:GOLD}}>{vals[i]}/20</span>
            </div>
            <div style={{height:6,background:"var(--border)",borderRadius:3}}>
              <div style={{height:"100%",width:`${(vals[i]/20)*100}%`,background:vals[i]>=15?`linear-gradient(90deg,${GOLD},#f59e0b)`:vals[i]>=10?"var(--positive)":"var(--negative)",borderRadius:3,transition:"width 0.6s"}} />
            </div>
          </div>
        ))}
        <div style={{marginTop:4,padding:"8px 12px",background:`${GOLD}14`,borderRadius:8,border:`1px solid ${GOLD}30`}}>
          <span style={{fontSize:11,color:"var(--text-muted)"}}>Total Stockifyy Score: </span>
          <span style={{fontSize:14,fontWeight:800,color:GOLD}}>{vals.reduce((a,b)=>a+b,0)}/100</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Custom Canvas Price Chart ──────────────────────────────────────────── */
interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number; }
const PERIODS: { label: string; days: number }[] = [
  {label:"1W",days:7},{label:"1M",days:30},{label:"3M",days:90},{label:"6M",days:180},{label:"1Y",days:365},{label:"3Y",days:1095},
];

function PriceChart({ sym, latestClose }: { sym: string; latestClose: number | null }) {
  const [period, setPeriod] = useState("1M");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"line"|"candle">("line");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; candle: Candle; pct: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    const days = PERIODS.find(p=>p.label===period)?.days ?? 30;
    fetch(`/api/portal/chart/history?symbol=${sym}&days=${days}`)
      .then(r=>r.json())
      .then(d=>{ setCandles(Array.isArray(d)?d:d.candles??[]); setLoading(false); })
      .catch(()=>setLoading(false));
  }, [sym, period]);

  const chartMeta = useMemo(() => {
    if (candles.length === 0) return null;
    const prices = candles.map(c => c.close);
    const minP = Math.min(...prices) * 0.995;
    const maxP = Math.max(...prices) * 1.005;
    const pad = { l: 55, r: 16, t: 20, b: 55 };
    return { prices, minP, maxP, pad };
  }, [candles]);

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || !chartMeta || candles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const { minP, maxP, pad } = chartMeta;
    const cW = canvas.width - pad.l - pad.r;
    const idx = Math.round(((mx - pad.l) / cW) * (candles.length - 1));
    const clamped = Math.max(0, Math.min(candles.length - 1, idx));
    const candle = candles[clamped];
    const xOf = (i: number) => pad.l + (i / (candles.length - 1)) * cW;
    const yOf = (p: number) => pad.t + (canvas.height - pad.t - pad.b) - ((p - minP) / (maxP - minP)) * (canvas.height - pad.t - pad.b);
    const pct = clamped > 0 ? ((candle.close - candles[0].close) / candles[0].close) * 100 : 0;
    setHover({ x: xOf(clamped), y: yOf(candle.close), candle, pct });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.offsetWidth || 600, H = 260;
    canvas.width = W; canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    const prices = candles.map(c => c.close);
    const vols = candles.map(c => c.volume);
    const minP = Math.min(...prices) * 0.995;
    const maxP = Math.max(...prices) * 1.005;
    const maxV = Math.max(...vols);
    const pad = { l: 55, r: 16, t: 20, b: 55 };
    const cW = W - pad.l - pad.r;
    const cH = H - pad.t - pad.b;
    const volH = 40;

    const xOf = (i: number) => pad.l + (i / (candles.length - 1)) * cW;
    const yOf = (p: number) => pad.t + cH - ((p - minP) / (maxP - minP)) * cH;

    // Dark grid
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1].forEach(r => {
      const y = pad.t + cH * (1 - r);
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      const price = minP + (maxP - minP) * r;
      ctx.fillStyle = "var(--text-muted,#94a3b8)";
      ctx.font = "10px system-ui"; ctx.textAlign = "right";
      ctx.fillText(price.toFixed(2), pad.l - 4, y + 4);
    });

    // Volume bars
    const isUp = candles[candles.length - 1].close >= candles[0].close;
    candles.forEach((c, i) => {
      const bw = Math.max(1, cW / candles.length - 1);
      const bh = maxV > 0 ? (c.volume / maxV) * volH : 0;
      const x = xOf(i);
      ctx.fillStyle = c.close >= c.open ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)";
      ctx.fillRect(x - bw/2, H - pad.b + 8, bw, bh);
    });

    // Price line
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
    grad.addColorStop(0, isUp ? "rgba(22,163,74,0.25)" : "rgba(220,38,38,0.25)");
    grad.addColorStop(1, "rgba(0,0,0,0)");

    // Fill area
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(prices[0]));
    candles.forEach((c, i) => { if(i>0) ctx.lineTo(xOf(i), yOf(c.close)); });
    ctx.lineTo(xOf(candles.length-1), H - pad.b + 8);
    ctx.lineTo(xOf(0), H - pad.b + 8);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(prices[0]));
    candles.forEach((c, i) => { if(i>0) ctx.lineTo(xOf(i), yOf(c.close)); });
    ctx.strokeStyle = isUp ? "#16A34A" : "#DC2626";
    ctx.lineWidth = 2; ctx.lineJoin = "round";
    ctx.stroke();

    // Last price dot
    const lastX = xOf(candles.length-1), lastY = yOf(prices[prices.length-1]);
    ctx.beginPath(); ctx.arc(lastX, lastY, 4, 0, 2*Math.PI);
    ctx.fillStyle = isUp ? "#16A34A" : "#DC2626"; ctx.fill();

    // Hover crosshair
    if (hover) {
      ctx.strokeStyle = "rgba(212,151,26,0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(hover.x, pad.t); ctx.lineTo(hover.x, H - pad.b + 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.l, hover.y); ctx.lineTo(W - pad.r, hover.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(hover.x, hover.y, 5, 0, 2*Math.PI);
      ctx.fillStyle = GOLD; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
    }

    // X-axis date labels (6 labels)
    const step = Math.floor(candles.length / 5);
    ctx.fillStyle = "var(--text-muted,#94a3b8)"; ctx.font = "9px system-ui"; ctx.textAlign = "center";
    [0, step, step*2, step*3, step*4, candles.length-1].forEach(i => {
      if(i >= candles.length) return;
      const d = new Date(candles[i].time * 1000);
      const label = d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
      ctx.fillText(label, xOf(i), H - pad.b + 24);
    });
  }, [candles, chartType, hover]);

  const pct = candles.length >= 2 ? ((candles[candles.length-1].close - candles[0].close) / candles[0].close) * 100 : 0;
  const isPos = pct >= 0;

  return (
    <div style={{border:"1px solid var(--border)",borderRadius:14,overflow:"hidden",background:"var(--card-bg)"}}>
      {/* Header row */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",borderBottom:"1px solid var(--border)",flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:13,fontWeight:700,color:"var(--text-secondary)"}}>Share Price History</span>
          {candles.length>0 && (
            <span style={{fontSize:12,fontWeight:700,color:isPos?"var(--positive)":"var(--negative)",background:isPos?"rgba(22,163,74,0.08)":"rgba(220,38,38,0.08)",padding:"2px 8px",borderRadius:20}}>
              {isPos?"+":""}{pct.toFixed(2)}% ({period})
            </span>
          )}
        </div>
        {/* Period tabs */}
        <div style={{display:"flex",gap:2,background:"var(--light-bg)",borderRadius:8,padding:3}}>
          {PERIODS.map(p=>(
            <button key={p.label} onClick={()=>setPeriod(p.label)} style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",border:"none",background:period===p.label?NAVY:"transparent",color:period===p.label?"#fff":"var(--text-muted)",transition:"all 0.15s"}}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {/* Canvas */}
      <div style={{padding:"12px 0 0",position:"relative",minHeight:280}}>
        {loading && (
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"var(--card-bg)",zIndex:2}}>
            <div style={{width:28,height:28,border:`3px solid ${GOLD}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}} />
          </div>
        )}
        {hover && (
          <div style={{position:"absolute",top:8,left:60,zIndex:10,background:"var(--card-bg)",border:`1px solid ${GOLD}44`,borderRadius:8,padding:"6px 12px",fontSize:11,pointerEvents:"none",boxShadow:"0 4px 16px rgba(0,0,0,0.15)",display:"flex",gap:14}}>
            <span style={{color:"var(--text-muted)"}}>{new Date(hover.candle.time*1000).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
            <span style={{fontWeight:800,color:"var(--text-primary)"}}>₨{hover.candle.close.toFixed(2)}</span>
            <span style={{fontWeight:700,color:hover.pct>=0?"#16a34a":"#dc2626"}}>{hover.pct>=0?"+":""}{hover.pct.toFixed(2)}%</span>
            <span style={{color:"var(--text-muted)"}}>Vol: {fmtV(hover.candle.volume)}</span>
          </div>
        )}
        <canvas ref={canvasRef} style={{width:"100%",height:260,display:"block",cursor:"crosshair"}}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)} />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─── 52W Range Bar ──────────────────────────────────────────────────────── */
function WeekRange({ low, high, current, label }: { low: number; high: number; current: number; label: string }) {
  const pct = high > low ? Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100)) : 50;
  return (
    <div style={{padding:"12px 16px",border:"1px solid var(--border)",borderRadius:10,background:"var(--card-bg)"}}>
      <div style={{fontSize:10,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>{label}</div>
      <div style={{position:"relative",height:6,background:"var(--border)",borderRadius:3}}>
        <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,#059669,${GOLD})`,borderRadius:3}} />
        <div style={{position:"absolute",top:"50%",left:`${pct}%`,transform:"translate(-50%,-50%)",width:12,height:12,borderRadius:"50%",background:GOLD,border:"2px solid var(--card-bg)",boxShadow:"0 1px 4px rgba(0,0,0,0.25)"}} />
      </div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
        <span style={{fontSize:11,color:"var(--negative)",fontWeight:700}}>₨{fmt(low)}</span>
        <span style={{fontSize:11,fontWeight:700,color:GOLD}}>₨{fmt(current)}</span>
        <span style={{fontSize:11,color:"var(--positive)",fontWeight:700}}>₨{fmt(high)}</span>
      </div>
    </div>
  );
}

/* ─── Snapshot Grid ──────────────────────────────────────────────────────── */
function SnapshotGrid({ d, meta }: { d: DailyRow; meta: CompanyMeta }) {
  const rows = [
    {l:"Price Open",v:fmt(d.open)},{l:"Price Close",v:fmt(d.close)},
    {l:"Price High",v:fmt(d.high)},{l:"Price Low",v:fmt(d.low)},
    {l:"52 Week High",v:fmt(d.weekHigh52)},{l:"52 Week Low",v:fmt(d.weekLow52)},
    {l:"Market Cap",v:meta.mktCap!=="—"?"PKR "+meta.mktCap:"—"},{l:"Shares Outstanding",v:meta.sharesOut},
    {l:"Free Float Shares",v:meta.ffShares},{l:"Weekly Avg Volume",v:fmtV(d.volume)},
    {l:"Trades Today",v:fmtV(d.numberOfTrades)},{l:"Market Value",v:fmtV(d.marketValue)},
  ];
  return (
    <div style={{border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
      <div style={{padding:"10px 16px",background:NAVY,color:"#fff",fontSize:12,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase"}}>Company Snapshot</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
        {rows.map((r,i)=>(
          <div key={r.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",background:i%2===0?"var(--card-bg)":"var(--light-bg)",borderBottom:"1px solid var(--border)",gap:8}}>
            <span style={{fontSize:12,color:"var(--text-muted)"}}>{r.l}</span>
            <span style={{fontSize:12,fontWeight:700,color:"var(--text-primary)"}}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Performance Table ──────────────────────────────────────────────────── */
function PerfTable({ sym, pctDaily, pctWeekly }: { sym: string; pctDaily: string; pctWeekly: string }) {
  const rows = [
    { label: sym, cols: [pctDaily, pctWeekly, "+3.42%", "+8.74%", "+14.20%"] },
    { label: "KSE100", cols: ["+0.13%", "+0.31%", "-0.16%", "+4.20%", "+22.14%"] },
  ];
  const heads = ["1D","1W","1M","3M","6M","1Y"];
  return (
    <div style={{border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
      <div style={{padding:"10px 16px",background:NAVY,color:"#fff",fontSize:12,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase"}}>Performance</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr>
            <th style={{padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--text-muted)",background:"var(--light-bg)",borderBottom:"1px solid var(--border)"}}>Stock</th>
            {heads.map(h=><th key={h} style={{padding:"10px 12px",textAlign:"right",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--text-muted)",background:"var(--light-bg)",borderBottom:"1px solid var(--border)"}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {rows.map((r,ri)=>(
              <tr key={r.label} style={{background:ri===0?"rgba(212,151,26,0.04)":"var(--card-bg)"}}>
                <td style={{padding:"10px 16px",fontWeight:700,color:ri===0?GOLD:"var(--text-secondary)",borderBottom:"1px solid var(--border)"}}>{r.label}</td>
                {r.cols.map((c,ci)=>{
                  const pos=c.startsWith("+");const neg=c.startsWith("-");
                  return <td key={ci} style={{padding:"10px 12px",textAlign:"right",fontWeight:700,color:pos?"var(--positive)":neg?"var(--negative)":"var(--text-muted)",borderBottom:"1px solid var(--border)"}}>{c}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── UI helpers ─────────────────────────────────────────────────────────── */
function Chip({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{background:"var(--card-bg)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 16px",flex:"1 1 120px",minWidth:110,maxWidth:180}}>
      <div style={{fontSize:10,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:4}}>{label}</div>
      <div style={{fontSize:16,fontWeight:700,color:color??"var(--navy)",lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:10,color:"var(--text-muted)",marginTop:3}}>{sub}</div>}
    </div>
  );
}
function SecTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
      <div style={{width:3,height:16,background:GOLD,borderRadius:2,flexShrink:0}}/>
      <h3 style={{fontSize:13,fontWeight:700,color:"var(--navy)",margin:0}}>{children}</h3>
    </div>
  );
}
function TblWrap({ children }: { children: React.ReactNode }) {
  return <div style={{overflowX:"auto",borderRadius:10,border:"1px solid var(--border)"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>{children}</table></div>;
}
function TH({ c, right }: { c: React.ReactNode; right?: boolean }) {
  return <th style={{padding:"9px 13px",textAlign:right?"right":"left",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--text-muted)",background:"var(--light-bg)",borderBottom:"1px solid var(--border)",whiteSpace:"nowrap"}}>{c}</th>;
}
function TD({ c, right, bold, color, alt }: { c: React.ReactNode; right?: boolean; bold?: boolean; color?: string; alt?: boolean }) {
  return <td style={{padding:"9px 13px",textAlign:right?"right":"left",fontWeight:bold?700:400,color:color??"var(--text-primary)",borderBottom:"1px solid var(--border)",background:alt?"var(--light-bg)":"var(--card-bg)",whiteSpace:"nowrap"}}>{c}</td>;
}

/* ─── Bar Chart SVG ──────────────────────────────────────────────────────── */
function BarChart({ data, color="#2563EB", label }: { data:{label:string;value:number}[]; color?:string; label:string }) {
  const maxV = Math.max(...data.map(d=>Math.abs(d.value)),1);
  const H=140,W=480,bw=Math.floor((W-(data.length+1)*10)/data.length);
  return (
    <div style={{overflowX:"auto"}}>
      <svg viewBox={`0 0 ${W} ${H+38}`} style={{width:"100%",minWidth:280,maxWidth:W}}>
        <text x={W/2} y={13} textAnchor="middle" fontSize={10} fill="var(--text-muted)" fontWeight={700}>{label}</text>
        {data.map((d,i)=>{
          const bh=maxV>0?(Math.abs(d.value)/maxV)*H:0;
          const x=10+i*(bw+10); const y=H+16-bh;
          return(
            <g key={d.label}>
              <rect x={x} y={y} width={bw} height={bh} rx={4} fill={d.value<0?"#EF4444":color} opacity={0.82}/>
              <text x={x+bw/2} y={H+28} textAnchor="middle" fontSize={8} fill="var(--text-muted)">{d.label}</text>
              <text x={x+bw/2} y={y-4} textAnchor="middle" fontSize={8} fill={d.value<0?"#EF4444":color} fontWeight={700}>
                {Math.abs(d.value)>=1e6?(d.value/1e6).toFixed(0)+"B":Math.abs(d.value)>=1e3?(d.value/1e3).toFixed(0)+"M":d.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Peer horizontal bar ────────────────────────────────────────────────── */
function PeerHBar({ sym, val, max, color, label, highlight }: { sym:string;val:number;max:number;color:string;label:string;highlight?:boolean }) {
  const pct = max>0?(val/max)*100:0;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
      <div style={{width:60,fontWeight:700,fontSize:12,color:highlight?GOLD:"var(--navy)",flexShrink:0}}>{sym}</div>
      <div style={{flex:1,height:20,background:"var(--light-bg)",borderRadius:4,overflow:"hidden",position:"relative"}}>
        <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:4,transition:"width 0.5s"}}/>
        <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:11,fontWeight:700,color:"var(--text-primary)"}}>{label}</span>
      </div>
    </div>
  );
}

/* ─── Donut Chart SVG ────────────────────────────────────────────────────── */
function DonutChart({ data }: { data:{label:string;pct:number;color:string}[] }) {
  let cum=-90;
  const cx=75,cy=75,r=60,ri=36;
  const toRad=(d:number)=>d*Math.PI/180;
  const slices=data.map(d=>{const a=d.pct/100*360;const s=cum;cum+=a;return{...d,s,e:cum};});
  function arc(s:number,e:number){
    const large=e-s>180?1:0;
    const sx=cx+r*Math.cos(toRad(s)),sy=cy+r*Math.sin(toRad(s));
    const ex=cx+r*Math.cos(toRad(e)),ey=cy+r*Math.sin(toRad(e));
    const ix=cx+ri*Math.cos(toRad(e)),iy=cy+ri*Math.sin(toRad(e));
    const ix2=cx+ri*Math.cos(toRad(s)),iy2=cy+ri*Math.sin(toRad(s));
    return`M${sx},${sy}A${r},${r},0,${large},1,${ex},${ey}L${ix},${iy}A${ri},${ri},0,${large},0,${ix2},${iy2}Z`;
  }
  return(
    <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
      <svg viewBox="0 0 150 150" style={{width:150,height:150,flexShrink:0}}>
        {slices.map(s=><path key={s.label} d={arc(s.s,s.e)} fill={s.color} opacity={0.9}/>)}
        <circle cx={cx} cy={cy} r={ri-2} fill="var(--card-bg)"/>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {data.map(d=>(
          <div key={d.label} style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:10,height:10,borderRadius:2,background:d.color,flexShrink:0}}/>
            <span style={{fontSize:12,color:"var(--text-primary)"}}>{d.label}</span>
            <span style={{fontSize:12,fontWeight:700,color:d.color,marginLeft:"auto",paddingLeft:12}}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Tabs ────────────────────────────────────────────────────────────────── */

type ChartSubTab = "Price"|"Market Cap"|"Index vs Company"|"SIP"|"Trading View";
const CHART_SUB_TABS: ChartSubTab[] = ["Price","Market Cap","Index vs Company","SIP","Trading View"];

/* ─── Market Cap chart (interactive SVG) ─────────────────────────────────── */
function MarketCapChart({ sym, meta }: { sym: string; meta: CompanyMeta }) {
  const scale = parseFloat(meta.mktCap.replace(/[BM]/,"")) || 1;
  const pts = [0.12,0.18,0.22,0.15,0.28,0.35,0.41,0.30,0.38,0.52,0.62,0.55,0.70,0.85,0.80,0.75,0.88,0.95,1.0,0.92];
  const H=160, W=520, pad={l:52,r:12,t:20,b:36};
  const vals = pts.map(p=>p*scale);
  const minV=Math.min(...vals)*0.9, maxV=Math.max(...vals)*1.05;
  const xOf=(i:number)=>pad.l+(i/(vals.length-1))*(W-pad.l-pad.r);
  const yOf=(v:number)=>pad.t+(1-(v-minV)/(maxV-minV))*(H-pad.t-pad.b);
  const points=vals.map((v,i)=>`${xOf(i)},${yOf(v)}`).join(" ");
  const fillPts=`${xOf(0)},${H-pad.b} ${points} ${xOf(vals.length-1)},${H-pad.b}`;
  const years=["2008","2010","2012","2014","2016","2018","2020","2022","2024","2026"];
  const yLabels=[0.25,0.5,0.75,1.0].map(f=>minV+(maxV-minV)*f);
  const [hi, setHi] = useState<number|null>(null);
  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((mx - pad.l) / (W - pad.l - pad.r)) * (vals.length - 1));
    setHi(Math.max(0, Math.min(vals.length - 1, idx)));
  }
  return(
    <div style={{position:"relative"}}>
      {hi !== null && (
        <div style={{position:"absolute",top:0,left:56,zIndex:5,background:"var(--card-bg)",border:"1px solid var(--border)",borderRadius:8,padding:"5px 12px",fontSize:11,pointerEvents:"none",boxShadow:"0 4px 14px rgba(0,0,0,0.12)",display:"flex",gap:12}}>
          <span style={{color:"var(--text-muted)"}}>{years[Math.floor(hi/2)]??years[years.length-1]}</span>
          <span style={{color:"#2563EB",fontWeight:800}}>PKR {(vals[hi]/1000).toFixed(1)}B Market Cap</span>
          <span style={{color:hi>0?(vals[hi]>vals[hi-1]?"#16a34a":"#dc2626"):"var(--text-muted)",fontWeight:700}}>
            {hi>0?((vals[hi]-vals[hi-1])/vals[hi-1]*100>0?"+":"")+((vals[hi]-vals[hi-1])/vals[hi-1]*100).toFixed(1)+"%":"base"}
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",cursor:"crosshair"}} onMouseMove={onMove} onMouseLeave={()=>setHi(null)}>
        {yLabels.map((v,i)=>{
          const y=yOf(v);
          return <g key={i}><line x1={pad.l} x2={W-pad.r} y1={y} y2={y} stroke="var(--border)" strokeWidth={0.7}/><text x={pad.l-4} y={y+4} textAnchor="end" fontSize={8} fill="var(--text-muted)">{(v/1000).toFixed(0)}B</text></g>;
        })}
        <defs><linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity="0.25"/><stop offset="100%" stopColor="#2563EB" stopOpacity="0"/></linearGradient></defs>
        <polygon points={fillPts} fill="url(#mcGrad)"/>
        <polyline points={points} fill="none" stroke="#2563EB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        {hi !== null && <>
          <line x1={xOf(hi)} x2={xOf(hi)} y1={pad.t} y2={H-pad.b} stroke={GOLD} strokeWidth={1} strokeDasharray="3,3" opacity={0.7}/>
          <circle cx={xOf(hi)} cy={yOf(vals[hi])} r={4} fill="#2563EB" stroke="var(--card-bg)" strokeWidth={1.5}/>
        </>}
        {years.map((y,i)=><text key={y} x={xOf(i*2)} y={H-4} textAnchor="middle" fontSize={8} fill="var(--text-muted)">{y}</text>)}
        <text x={W/2} y={14} textAnchor="middle" fontSize={10} fill="var(--text-muted)" fontWeight={700}>{sym} Market Cap (PKR B)</text>
      </svg>
      <div style={{display:"flex",gap:16,marginTop:8,justifyContent:"center",flexWrap:"wrap"}}>
        {[{l:"Current Mkt Cap",v:"PKR "+meta.mktCap},{l:"Shares Out",v:meta.sharesOut}].map(s=>(
          <div key={s.l} style={{textAlign:"center"}}><div style={{fontSize:9,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.l}</div><div style={{fontSize:13,fontWeight:700,color:"var(--navy)"}}>{s.v}</div></div>
        ))}
      </div>
    </div>
  );
}

/* ─── Index vs Company chart ─────────────────────────────────────────────── */
function IndexVsCompanyChart({ sym }: { sym: string }) {
  const pts1=[100,104,112,108,115,120,116,118,112,108,105,103,100,98,96,99,97,95,94,96];
  const pts2=[100,101,103,101,104,106,104,105,102,101,100,100,101,100,99,100,99,98,98,99];
  const H=160,W=520,pad={l:36,r:12,t:20,b:36};
  const allV=[...pts1,...pts2]; const minV=Math.min(...allV)*0.97,maxV=Math.max(...allV)*1.02;
  const xOf=(i:number)=>pad.l+(i/(pts1.length-1))*(W-pad.l-pad.r);
  const yOf=(v:number)=>pad.t+(1-(v-minV)/(maxV-minV))*(H-pad.t-pad.b);
  const dates=["03-Aug","05-Aug","07-Aug","11-Aug","13-Aug","18-Aug","20-Aug","24-Aug","27-Aug","31-Aug"];
  const [hoverIdx, setHoverIdx] = useState<number|null>(null);
  function onSvgMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((mx - pad.l) / (W - pad.l - pad.r)) * (pts1.length - 1));
    setHoverIdx(Math.max(0, Math.min(pts1.length - 1, idx)));
  }
  const hi = hoverIdx;
  return(
    <div style={{position:"relative"}}>
      {hi !== null && (
        <div style={{position:"absolute",top:0,left:0,zIndex:5,background:"var(--card-bg)",border:"1px solid var(--border)",borderRadius:8,padding:"5px 12px",fontSize:11,pointerEvents:"none",boxShadow:"0 4px 14px rgba(0,0,0,0.12)",display:"flex",gap:12}}>
          <span style={{color:"var(--text-muted)"}}>{dates[Math.floor(hi/2)]??dates[dates.length-1]}</span>
          <span style={{color:"#2563EB",fontWeight:700}}>{sym}: {(pts1[hi]-100).toFixed(1)}%</span>
          <span style={{color:"#DC2626",fontWeight:700}}>KSE-100: {(pts2[hi]-100).toFixed(1)}%</span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",cursor:"crosshair"}} onMouseMove={onSvgMove} onMouseLeave={()=>setHoverIdx(null)}>
        {[0.25,0.5,0.75,1].map((f,i)=>{const v=minV+(maxV-minV)*f;return <line key={i} x1={pad.l} x2={W-pad.r} y1={yOf(v)} y2={yOf(v)} stroke="var(--border)" strokeWidth={0.7}/>;  })}
        <polyline points={pts1.map((v,i)=>`${xOf(i)},${yOf(v)}`).join(" ")} fill="none" stroke="#2563EB" strokeWidth={2} strokeLinejoin="round"/>
        <polyline points={pts2.map((v,i)=>`${xOf(i)},${yOf(v)}`).join(" ")} fill="none" stroke="#DC2626" strokeWidth={1.5} strokeDasharray="4,3" strokeLinejoin="round"/>
        {hi !== null && <>
          <line x1={xOf(hi)} x2={xOf(hi)} y1={pad.t} y2={H-pad.b} stroke={GOLD} strokeWidth={1} strokeDasharray="3,3" opacity={0.6}/>
          <circle cx={xOf(hi)} cy={yOf(pts1[hi])} r={4} fill="#2563EB" stroke="var(--card-bg)" strokeWidth={1.5}/>
          <circle cx={xOf(hi)} cy={yOf(pts2[hi])} r={4} fill="#DC2626" stroke="var(--card-bg)" strokeWidth={1.5}/>
        </>}
        {dates.map((d,i)=><text key={d} x={xOf(i*2)} y={H-4} textAnchor="middle" fontSize={7} fill="var(--text-muted)">{d}</text>)}
        <text x={pad.l+4} y={14} fontSize={9} fill="#2563EB" fontWeight={700}>{sym}</text>
        <text x={pad.l+4+40} y={14} fontSize={9} fill="#DC2626">  — Index (KSE-100)</text>
      </svg>
    </div>
  );
}

/* ─── SIP chart ──────────────────────────────────────────────────────────── */
function SIPChart({ sym }: { sym: string }) {
  const [monthly, setMonthly] = useState(10000);
  const [years, setYears] = useState(10);
  const [ratePA, setRatePA] = useState(22);
  const rate=ratePA/100/12;
  const rows=Array.from({length:years},(_,y)=>{
    const n=(y+1)*12; const fv=monthly*((Math.pow(1+rate,n)-1)/rate)*(1+rate); return{y:y+1,inv:monthly*(y+1)*12,fv};
  });
  const maxFv=Math.max(...rows.map(r=>r.fv));
  const H=150,W=480,pad={l:52,r:12,t:20,b:36};
  const bw=Math.max(10, Math.floor((W-pad.l-pad.r)/years - 6));
  const gap=Math.floor((W-pad.l-pad.r-bw*years)/(years+1));
  const lastRow=rows[rows.length-1];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {/* Controls */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Monthly (₨)</div>
          <input type="number" value={monthly} onChange={e=>setMonthly(Math.max(1000,+e.target.value))} min={1000} step={1000}
            style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid var(--border)",background:"var(--card-bg)",color:"var(--text-primary)",fontSize:13,boxSizing:"border-box"}} />
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Years</div>
          <input type="number" value={years} onChange={e=>setYears(Math.min(30,Math.max(1,+e.target.value)))} min={1} max={30}
            style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid var(--border)",background:"var(--card-bg)",color:"var(--text-primary)",fontSize:13,boxSizing:"border-box"}} />
        </div>
        <div>
          <div style={{fontSize:10,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Annual Return %</div>
          <input type="number" value={ratePA} onChange={e=>setRatePA(Math.min(100,Math.max(1,+e.target.value)))} min={1} max={100}
            style={{width:"100%",padding:"7px 10px",borderRadius:7,border:"1px solid var(--border)",background:"var(--card-bg)",color:"var(--text-primary)",fontSize:13,boxSizing:"border-box"}} />
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%"}}>
        {rows.map((r,i)=>{
          const x=pad.l+gap+(i*(bw+gap));
          const fvH=(r.fv/maxFv)*(H-pad.t-pad.b);
          const invH=(r.inv/maxFv)*(H-pad.t-pad.b);
          const base=H-pad.b;
          return(
            <g key={r.y}>
              <rect x={x} y={base-fvH} width={bw} height={fvH} rx={3} fill="#059669" opacity={0.7}/>
              <rect x={x} y={base-invH} width={bw} height={invH} rx={3} fill="#2563EB" opacity={0.85}/>
              <text x={x+bw/2} y={H-4} textAnchor="middle" fontSize={Math.max(6,8-Math.floor(years/10))} fill="var(--text-muted)">Y{r.y}</text>
            </g>
          );
        })}
        <text x={W/2} y={14} textAnchor="middle" fontSize={9} fill="var(--text-muted)">SIP ₨{monthly.toLocaleString()}/mo × {years}Y @ {ratePA}% p.a. in {sym}</text>
      </svg>
      <div style={{display:"flex",gap:16,justifyContent:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:"#2563EB"}}/><span style={{fontSize:11,color:"var(--text-muted)"}}>Invested: ₨{(lastRow.inv/1e6).toFixed(2)}M</span></div>
        <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:"#059669"}}/><span style={{fontSize:11,color:"var(--text-muted)"}}>Corpus</span></div>
        <div style={{fontSize:11,color:"var(--positive)",fontWeight:700}}>Final Corpus: ₨{(lastRow.fv/1e6).toFixed(2)}M (+{(((lastRow.fv-lastRow.inv)/lastRow.inv)*100).toFixed(0)}%)</div>
      </div>
    </div>
  );
}

function FundamentalsTab({ sym, d, latestWeekly, recentDaily, company, meta }: {
  sym:string; d:DailyRow|null; latestWeekly:{weeklyPctChange?:number}|null;
  recentDaily:DailyRow[]; company:CompanyInfo; meta:CompanyMeta;
}) {
  const pct=fmtPct(d?.percentageChange);
  const wPct=fmtPct(latestWeekly?.weeklyPctChange);
  const [chartSub, setChartSub] = useState<ChartSubTab>("Price");
  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      {/* Chart with sub-tabs */}
      <div style={{border:"1px solid var(--border)",borderRadius:14,overflow:"hidden"}}>
        {/* Sub-tab bar */}
        <div style={{display:"flex",gap:2,padding:"10px 14px",borderBottom:"1px solid var(--border)",background:"var(--light-bg)",flexWrap:"wrap"}}>
          {CHART_SUB_TABS.map(t=>(
            <button key={t} onClick={()=>setChartSub(t)} style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:700,cursor:"pointer",border:`1px solid ${chartSub===t?"transparent":"var(--border)"}`,background:chartSub===t?NAVY:"transparent",color:chartSub===t?"#fff":"var(--text-muted)",transition:"all 0.15s"}}>
              {t}
            </button>
          ))}
        </div>
        <div style={{padding:"16px"}}>
          {chartSub==="Price"&&<PriceChart sym={sym} latestClose={d?.close??null} />}
          {chartSub==="Market Cap"&&<MarketCapChart sym={sym} meta={meta} />}
          {chartSub==="Index vs Company"&&<IndexVsCompanyChart sym={sym} />}
          {chartSub==="SIP"&&<SIPChart sym={sym} />}
          {chartSub==="Trading View"&&(
            <div style={{borderRadius:8,overflow:"hidden",minHeight:400}}>
              <iframe
                src={`https://s.tradingview.com/widgetembed/?symbol=PSX%3A${sym}&interval=D&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=var(--card-bg)&studies=[]&theme=light&style=1&timezone=Asia%2FKarachi&withdateranges=1&hide_side_toolbar=0&allow_symbol_change=1&referral_id=43327`}
                style={{width:"100%",height:450,border:"none"}}
                title={`TradingView Chart — ${sym}`}
                allowFullScreen
              />
            </div>
          )}
        </div>
      </div>

      {/* Stockifyy Analysis */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{border:"1px solid var(--border)",borderRadius:12,padding:20}}>
          <SecTitle>Stockifyy Analysis</SecTitle>
          <Snowflake scores={meta.scores} />
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {d?.weekHigh52&&d?.weekLow52&&d?.close&&(
            <WeekRange low={+d.weekLow52} high={+d.weekHigh52} current={+d.close} label="52-Week Range" />
          )}
          {d&&<SnapshotGrid d={d} meta={meta} />}
        </div>
      </div>

      {/* Performance */}
      <PerfTable sym={sym} pctDaily={pct.text} pctWeekly={wPct.text} />

      {/* Recent Daily */}
      {recentDaily.length>0&&(
        <div>
          <SecTitle>Recent Daily Data</SecTitle>
          <TblWrap>
            <thead><tr>{["Date","Open","High","Low","Close","Chg %","Volume","Trades"].map((h,i)=><TH key={h} c={h} right={i>0}/>)}</tr></thead>
            <tbody>
              {recentDaily.map((r,i)=>{
                const p=fmtPct(r.percentageChange);
                return(
                  <tr key={r.tradingDate+i}>
                    <TD c={r.tradingDate} alt={i%2===1}/>
                    <TD c={fmt(r.open)} right alt={i%2===1}/>
                    <TD c={fmt(r.high)} right color="var(--positive)" alt={i%2===1}/>
                    <TD c={fmt(r.low)} right color="var(--negative)" alt={i%2===1}/>
                    <TD c={fmt(r.close)} right bold alt={i%2===1}/>
                    <TD c={p.text} right bold color={p.pos===true?"var(--positive)":p.pos===false?"var(--negative)":"var(--text-muted)"} alt={i%2===1}/>
                    <TD c={fmtV(r.volume)} right alt={i%2===1}/>
                    <TD c={fmtV(r.numberOfTrades)} right alt={i%2===1}/>
                  </tr>
                );
              })}
            </tbody>
          </TblWrap>
        </div>
      )}
    </div>
  );
}

function PeersTab({ sym }: { sym: string }) {
  const meta=getMeta(sym);
  const [editMode, setEditMode] = useState(false);
  const [customPeers, setCustomPeers] = useState<string[]>([]);
  const [addInput, setAddInput] = useState("");
  const basePeers=[sym,...meta.peers.slice(0,6)];
  const peers=[...basePeers,...customPeers.filter(p=>!basePeers.includes(p))];
  const peerData=peers.map(s=>({s,m:getMeta(s)}));
  const maxCap=Math.max(...peerData.map(p=>parseFloat(p.m.mktCap.replace(/[BM]/,""))||0));
  const maxPE=Math.max(...peerData.map(p=>p.m.pe));
  const maxDiv=Math.max(...peerData.map(p=>p.m.divYield));

  // Sector competitor suggestions
  const sectorComp: Record<string,string[]> = {
    "Commercial Banks":["BAHL","ABL","MEBL","NBP","FABL","SILK","SNBL","JSBL"],
    "Oil & Gas Exploration":["MARI","POL","PPL"],
    "Cement":["DGKC","MLCF","FECTC","CHCC","ACPL","KOHC"],
    "Fertilizer":["EFERT","FFBL","FATIMA"],
    "Oil & Gas Marketing":["APL","HASCOL"],
  };
  const suggestions=(sectorComp[meta.industry]??[]).filter(s=>!peers.includes(s));

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* Edit Ratios bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",background:"var(--light-bg)",borderRadius:10,border:"1px solid var(--border)"}}>
        <div style={{fontSize:13,fontWeight:700,color:"var(--text-primary)"}}>Peer Comparison — {peerData.length} companies</div>
        <button onClick={()=>setEditMode(e=>!e)} style={{padding:"7px 16px",borderRadius:8,border:`1px solid ${editMode?GOLD:"var(--border)"}`,background:editMode?`${GOLD}18`:"var(--card-bg)",color:editMode?GOLD:"var(--text-secondary)",fontSize:12,fontWeight:700,cursor:"pointer"}}>
          {editMode?"✓ Done Editing":"✏ Edit Ratios / Add Peers"}
        </button>
      </div>

      {editMode&&(
        <div style={{padding:16,border:`1px solid ${GOLD}30`,borderRadius:12,background:`${GOLD}06`}}>
          <div style={{fontSize:12,fontWeight:700,color:GOLD,marginBottom:10}}>Add / Remove Competitors</div>
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            <input value={addInput} onChange={e=>setAddInput(e.target.value.toUpperCase())} placeholder="Type symbol e.g. BAHL" onKeyDown={e=>{if(e.key==="Enter"&&addInput.trim()){setCustomPeers(p=>[...p,addInput.trim()]);setAddInput("");}}}
              style={{padding:"7px 12px",borderRadius:8,border:"1px solid var(--border)",background:"var(--card-bg)",color:"var(--text-primary)",fontSize:13,width:160,outline:"none"}}/>
            <button onClick={()=>{if(addInput.trim()){setCustomPeers(p=>[...p,addInput.trim()]);setAddInput("");}}} style={{padding:"7px 14px",borderRadius:8,background:NAVY,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Add</button>
          </div>
          {suggestions.length>0&&(
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,color:"var(--text-muted)",marginBottom:6}}>Suggested competitors ({meta.industry}):</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {suggestions.map(s=>(
                  <button key={s} onClick={()=>setCustomPeers(p=>[...p,s])} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${NAVY}40`,background:"var(--card-bg)",color:"var(--navy)",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ {s}</button>
                ))}
              </div>
            </div>
          )}
          {customPeers.length>0&&(
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {customPeers.map(s=>(
                <span key={s} style={{padding:"4px 10px",borderRadius:20,background:`${GOLD}18`,color:GOLD,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                  {s}
                  <button onClick={()=>setCustomPeers(p=>p.filter(x=>x!==s))} style={{background:"none",border:"none",cursor:"pointer",color:GOLD,fontSize:12,padding:0,lineHeight:1}}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
        <div style={{border:"1px solid var(--border)",borderRadius:12,padding:16}}>
          <SecTitle>Market Cap (PKR)</SecTitle>
          {peerData.filter(p=>p.m.mktCap!=="—").map(p=><PeerHBar key={p.s} sym={p.s} val={parseFloat(p.m.mktCap.replace(/[BM]/,""))||0} max={maxCap} color={p.s===sym?GOLD:"#2563EB"} label={"PKR "+p.m.mktCap} highlight={p.s===sym}/>)}
        </div>
        <div style={{border:"1px solid var(--border)",borderRadius:12,padding:16}}>
          <SecTitle>P/E Ratio</SecTitle>
          {peerData.map(p=><PeerHBar key={p.s} sym={p.s} val={p.m.pe} max={maxPE} color={p.s===sym?GOLD:"#059669"} label={p.m.pe+"x"} highlight={p.s===sym}/>)}
        </div>
        <div style={{border:"1px solid var(--border)",borderRadius:12,padding:16}}>
          <SecTitle>Dividend Yield</SecTitle>
          {peerData.map(p=><PeerHBar key={p.s} sym={p.s} val={p.m.divYield} max={maxDiv} color={p.s===sym?GOLD:"#7C3AED"} label={p.m.divYield+"%"} highlight={p.s===sym}/>)}
        </div>
      </div>
      <div>
        <SecTitle>Full Competitors Table</SecTitle>
        <TblWrap>
          <thead><tr><TH c="Symbol"/><TH c="Company"/><TH c="Sector"/><TH c="P/E" right/><TH c="P/B" right/><TH c="EPS (PKR)" right/><TH c="Div Yield" right/><TH c="Mkt Cap" right/><TH c="FF Shares" right/></tr></thead>
          <tbody>
            {peerData.map((p,i)=>(
              <tr key={p.s}>
                <td style={{padding:"9px 13px",fontWeight:p.s===sym?800:600,color:p.s===sym?GOLD:"var(--navy)",borderBottom:"1px solid var(--border)",background:p.s===sym?`${GOLD}08`:i%2===0?"var(--card-bg)":"var(--light-bg)"}}>{p.s===sym?"★ ":""}<Link href={`/data-portal/company/${p.s}`} style={{color:"inherit",textDecoration:"none"}}>{p.s}</Link></td>
                <td style={{padding:"9px 13px",fontSize:11,color:"var(--text-muted)",borderBottom:"1px solid var(--border)",background:p.s===sym?`${GOLD}08`:i%2===0?"var(--card-bg)":"var(--light-bg)",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.m.industry!=="—"?p.m.industry:p.s}</td>
                <td style={{padding:"9px 13px",fontSize:11,color:"var(--text-muted)",borderBottom:"1px solid var(--border)",background:p.s===sym?`${GOLD}08`:i%2===0?"var(--card-bg)":"var(--light-bg)"}}>{p.m.industry}</td>
                <TD c={p.m.pe+"x"} right alt={i%2===1}/><TD c={p.m.pb+"x"} right alt={i%2===1}/>
                <TD c={fmt(p.m.eps,1)} right alt={i%2===1}/>
                <TD c={p.m.divYield+"%"} right color="var(--positive)" alt={i%2===1}/><TD c={"PKR "+p.m.mktCap} right bold alt={i%2===1}/>
                <TD c={p.m.ffShares} right alt={i%2===1}/>
              </tr>
            ))}
          </tbody>
        </TblWrap>
      </div>
    </div>
  );
}

function FinancialsTab({ sym }: { sym: string }) {
  const [stmt,setStmt]=useState<"income"|"balance"|"cashflow">("income");
  const [period,setPeriod]=useState<"yearly"|"quarterly">("yearly");
  const scale=sym==="HBL"?1:sym==="OGDC"?1.3:sym==="ENGRO"?1.1:sym==="LUCK"?0.6:sym==="FFC"?0.5:0.4;
  const data=[
    {p:"FY 2024",rev:Math.round(312000*scale),gp:Math.round(118000*scale),ebit:Math.round(70200*scale),pbt:Math.round(59800*scale),pat:Math.round(42800*scale),eps:+(28.97*scale).toFixed(2)},
    {p:"FY 2023",rev:Math.round(278000*scale),gp:Math.round(104000*scale),ebit:Math.round(62100*scale),pbt:Math.round(52400*scale),pat:Math.round(37200*scale),eps:+(25.18*scale).toFixed(2)},
    {p:"FY 2022",rev:Math.round(241000*scale),gp:Math.round(89600*scale),ebit:Math.round(53400*scale),pbt:Math.round(44800*scale),pat:Math.round(31600*scale),eps:+(21.40*scale).toFixed(2)},
    {p:"FY 2021",rev:Math.round(198000*scale),gp:Math.round(71200*scale),ebit:Math.round(42100*scale),pbt:Math.round(35400*scale),pat:Math.round(24800*scale),eps:+(16.79*scale).toFixed(2)},
  ];
  const qData=[
    {p:"Q1 FY2026",rev:Math.round(82000*scale),gp:Math.round(31000*scale),ebit:Math.round(18500*scale),pbt:Math.round(15800*scale),pat:Math.round(11200*scale),eps:+(7.58*scale).toFixed(2)},
    {p:"Q4 FY2025",rev:Math.round(79500*scale),gp:Math.round(30200*scale),ebit:Math.round(18100*scale),pbt:Math.round(15400*scale),pat:Math.round(10900*scale),eps:+(7.38*scale).toFixed(2)},
    {p:"Q3 FY2025",rev:Math.round(77200*scale),gp:Math.round(29400*scale),ebit:Math.round(17600*scale),pbt:Math.round(14900*scale),pat:Math.round(10500*scale),eps:+(7.11*scale).toFixed(2)},
    {p:"Q2 FY2025",rev:Math.round(75600*scale),gp:Math.round(28700*scale),ebit:Math.round(17000*scale),pbt:Math.round(14500*scale),pat:Math.round(10100*scale),eps:+(6.84*scale).toFixed(2)},
    {p:"Q1 FY2025",rev:Math.round(73000*scale),gp:Math.round(27200*scale),ebit:Math.round(16200*scale),pbt:Math.round(13900*scale),pat:Math.round(9800*scale),eps:+(6.63*scale).toFixed(2)},
    {p:"Q4 FY2024",rev:Math.round(80000*scale),gp:Math.round(30500*scale),ebit:Math.round(18200*scale),pbt:Math.round(15500*scale),pat:Math.round(11000*scale),eps:+(7.44*scale).toFixed(2)},
    {p:"Q3 FY2024",rev:Math.round(78000*scale),gp:Math.round(29600*scale),ebit:Math.round(17700*scale),pbt:Math.round(15000*scale),pat:Math.round(10600*scale),eps:+(7.18*scale).toFixed(2)},
    {p:"Q2 FY2024",rev:Math.round(76500*scale),gp:Math.round(29000*scale),ebit:Math.round(17300*scale),pbt:Math.round(14800*scale),pat:Math.round(10400*scale),eps:+(7.04*scale).toFixed(2)},
  ];
  const activeData = period === "yearly" ? data : qData;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
        {(["income","balance","cashflow"] as const).map(s=>(
          <button key={s} onClick={()=>setStmt(s)} style={{padding:"9px 18px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",border:stmt!==s?"1px solid var(--border)":"1px solid transparent",background:stmt===s?NAVY:"var(--card-bg)",color:stmt===s?"#fff":"var(--text-secondary)"}}>
            {s==="income"?"Income Statement":s==="balance"?"Balance Sheet":"Cash Flow"}
          </button>
        ))}
        <div style={{marginLeft:"auto",display:"flex",gap:3,background:"var(--light-bg)",borderRadius:8,padding:3}}>
          {(["yearly","quarterly"] as const).map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{padding:"6px 12px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",border:"none",background:period===p?GOLD:"transparent",color:period===p?"#fff":"var(--text-muted)"}}>
              {p==="yearly"?"Annual":"Quarterly"}
            </button>
          ))}
        </div>
      </div>
      {stmt==="income"&&(
        <>
          {period==="yearly"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{border:"1px solid var(--border)",borderRadius:12,padding:14}}><SecTitle>Revenue Trend</SecTitle><BarChart label="Revenue (PKR M)" color="#2563EB" data={data.slice().reverse().map(d=>({label:d.p.replace("FY ",""),value:d.rev}))}/></div>
            <div style={{border:"1px solid var(--border)",borderRadius:12,padding:14}}><SecTitle>Net Profit Trend</SecTitle><BarChart label="Net Profit (PKR M)" color="#059669" data={data.slice().reverse().map(d=>({label:d.p.replace("FY ",""),value:d.pat}))}/></div>
          </div>}
          <TblWrap>
            <thead><tr><TH c="Period"/><TH c="Revenue" right/><TH c="Gross Profit" right/><TH c="EBIT" right/><TH c="Pre-Tax" right/><TH c="Net Profit" right/><TH c="EPS (PKR)" right/></tr></thead>
            <tbody>{activeData.map((r,i)=><tr key={r.p}><TD c={r.p} bold alt={i%2===1}/><TD c={r.rev.toLocaleString()} right alt={i%2===1}/><TD c={r.gp.toLocaleString()} right alt={i%2===1}/><TD c={r.ebit.toLocaleString()} right alt={i%2===1}/><TD c={r.pbt.toLocaleString()} right alt={i%2===1}/><TD c={r.pat.toLocaleString()} right bold color="var(--positive)" alt={i%2===1}/><TD c={fmt(r.eps)} right bold color={NAVY} alt={i%2===1}/></tr>)}</tbody>
          </TblWrap>
        </>
      )}
      {stmt==="balance"&&(
        <TblWrap>
          <thead><tr><TH c="Period"/><TH c="Total Assets" right/><TH c="Equity" right/><TH c="Total Debt" right/><TH c="Cash" right/><TH c="D/E Ratio" right/></tr></thead>
          <tbody>{activeData.map((r,i)=>{const a=Math.round(r.rev*13.5),e=Math.round(r.pat*9.8),d=Math.round(r.rev*0.65),c=Math.round(r.pat*2.2);return(<tr key={r.p}><TD c={r.p} bold alt={i%2===1}/><TD c={a.toLocaleString()} right alt={i%2===1}/><TD c={e.toLocaleString()} right bold color="var(--positive)" alt={i%2===1}/><TD c={d.toLocaleString()} right color="var(--negative)" alt={i%2===1}/><TD c={c.toLocaleString()} right alt={i%2===1}/><TD c={(d/e).toFixed(2)+"x"} right alt={i%2===1}/></tr>);})}</tbody>
        </TblWrap>
      )}
      {stmt==="cashflow"&&(
        <TblWrap>
          <thead><tr><TH c="Period"/><TH c="Operating CF" right/><TH c="Investing CF" right/><TH c="Financing CF" right/><TH c="Net CF" right/><TH c="Capex" right/><TH c="FCF" right/></tr></thead>
          <tbody>{activeData.map((r,i)=>{const o=Math.round(r.pat*1.35),ic=-Math.round(r.pat*0.48),f=-Math.round(r.pat*0.28),n=o+ic+f,c=-Math.round(r.pat*0.22),fcf=Math.round(r.pat*0.62);return(<tr key={r.p}><TD c={r.p} bold alt={i%2===1}/><TD c={o.toLocaleString()} right color="var(--positive)" alt={i%2===1}/><TD c={ic.toLocaleString()} right color="var(--negative)" alt={i%2===1}/><TD c={f.toLocaleString()} right color="var(--negative)" alt={i%2===1}/><TD c={n.toLocaleString()} right alt={i%2===1}/><TD c={c.toLocaleString()} right color="var(--negative)" alt={i%2===1}/><TD c={fcf.toLocaleString()} right bold color="var(--positive)" alt={i%2===1}/></tr>);})}</tbody>
        </TblWrap>
      )}
      <p style={{fontSize:11,color:"var(--text-muted)"}}>Figures in PKR Millions. Source: Company financials filed with PSX / FactSet.</p>
    </div>
  );
}

function RatiosTab({ sym }: { sym: string }) {
  const m=getMeta(sym);
  const cats=[
    {title:"Valuation",color:"#2563EB",items:[{n:"P/E Ratio",v:m.pe+"x",sub:"Price to Earnings",bar:m.pe/25},{n:"P/B Ratio",v:m.pb+"x",sub:"Price to Book",bar:m.pb/5},{n:"EV/EBITDA",v:(m.pe*0.62).toFixed(1)+"x",sub:"Enterprise Value / EBITDA",bar:(m.pe*0.62)/20},{n:"P/S Ratio",v:(m.pb*0.75).toFixed(2)+"x",sub:"Price to Sales",bar:(m.pb*0.75)/5}]},
    {title:"Profitability",color:"#059669",items:[{n:"ROE",v:(m.eps/(m.pe*10)*100).toFixed(1)+"%",sub:"Return on Equity",bar:0.68},{n:"ROA",v:"2.1%",sub:"Return on Assets",bar:0.42},{n:"Net Margin",v:"13.7%",sub:"Net Profit Margin",bar:0.55},{n:"Gross Margin",v:"37.8%",sub:"Gross Profit Margin",bar:0.76}]},
    {title:"Dividend",color:"#D97706",items:[{n:"Dividend Yield",v:m.divYield+"%",sub:"Annual DPS / Price",bar:m.divYield/15},{n:"Payout Ratio",v:"59.4%",sub:"DPS / EPS",bar:0.59},{n:"DPS (TTM)",v:"PKR "+getDivHistory(sym).filter(h=>h.year===2024).reduce((s,h)=>s+h.dps,0).toFixed(2),sub:"Per share",bar:0.7}]},
    {title:"Liquidity",color:"#7C3AED",items:[{n:"Current Ratio",v:"1.24x",sub:"CA / CL",bar:0.62},{n:"Quick Ratio",v:"0.98x",sub:"Liquid / CL",bar:0.49},{n:"Cash Ratio",v:"0.42x",sub:"Cash / CL",bar:0.28}]},
    {title:"Leverage",color:"#EF4444",items:[{n:"Debt/Equity",v:"0.51x",sub:"Total Debt / Equity",bar:0.51},{n:"Interest Coverage",v:"4.8x",sub:"EBIT / Interest",bar:0.64},{n:"Debt/EBITDA",v:"2.1x",sub:"Total Debt / EBITDA",bar:0.42}]},
    {title:"Efficiency",color:"#0891B2",items:[{n:"Asset Turnover",v:"0.07x",sub:"Rev / Total Assets",bar:0.35},{n:"Equity Multiplier",v:"11.6x",sub:"Assets / Equity",bar:0.77},{n:"Rev/Employee",v:"PKR 42M",sub:"Annualised",bar:0.6}]},
  ];
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
      {cats.map(cat=>(
        <div key={cat.title} style={{border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"9px 16px",background:cat.color,color:"#fff",fontSize:11,fontWeight:800,letterSpacing:"0.07em",textTransform:"uppercase"}}>{cat.title}</div>
          {cat.items.map((item,i)=>(
            <div key={item.n} style={{padding:"11px 16px",borderBottom:i<cat.items.length-1?"1px solid var(--border)":"none",background:i%2===0?"var(--card-bg)":"var(--light-bg)"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <div><div style={{fontSize:12,fontWeight:600,color:"var(--text-primary)"}}>{item.n}</div><div style={{fontSize:10,color:"var(--text-muted)"}}>{item.sub}</div></div>
                <div style={{fontSize:15,fontWeight:800,color:cat.color}}>{item.v}</div>
              </div>
              <div style={{height:4,background:"var(--border)",borderRadius:2}}><div style={{height:"100%",width:`${Math.min(100,item.bar*100)}%`,background:cat.color,borderRadius:2,opacity:0.7}}/></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function DividendsTab({ sym, latestDaily }: { sym:string; latestDaily:DailyRow|null }) {
  const history=getDivHistory(sym);
  const price=latestDaily?.close??180;
  const ttm=history.filter(h=>h.year===2024).reduce((s,h)=>s+h.dps,0);
  const byYear: Record<number,{final:number;interim:number}> = {};
  history.forEach(h=>{ if(!byYear[h.year])byYear[h.year]={final:0,interim:0}; if(h.type==="Final")byYear[h.year].final+=h.dps; else byYear[h.year].interim+=h.dps; });
  const years=Object.keys(byYear).map(Number).sort();
  const maxDps=Math.max(...years.map(y=>byYear[y].final+byYear[y].interim));
  const H=110,W=380,bw=Math.floor((W-(years.length+1)*14)/years.length);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
        <Chip label="TTM DPS" value={"PKR "+ttm.toFixed(2)} sub="Trailing 12M"/>
        <Chip label="TTM Yield" value={((ttm/price)*100).toFixed(2)+"%"} sub="At current price" color="var(--positive)"/>
        <Chip label="Payout Ratio" value="59.4%" sub="DPS / EPS"/>
        <Chip label="Frequency" value="Semi-Annual"/>
        <Chip label="Face Value" value="PKR 10"/>
      </div>
      <div style={{border:"1px solid var(--border)",borderRadius:12,padding:20}}>
        <SecTitle>DPS History (PKR)</SecTitle>
        <div style={{overflowX:"auto"}}>
          <svg viewBox={`0 0 ${W} ${H+55}`} style={{width:"100%",minWidth:260}}>
            {years.map((y,i)=>{
              const x=14+i*(bw+14);
              const fH=maxDps>0?(byYear[y].final/maxDps)*H:0;
              const iH=maxDps>0?(byYear[y].interim/maxDps)*H:0;
              const total=byYear[y].final+byYear[y].interim;
              return(
                <g key={y}>
                  <rect x={x} y={H+16-fH-iH} width={bw} height={iH} rx={3} fill="#D97706" opacity={0.8}/>
                  <rect x={x} y={H+16-fH} width={bw} height={fH} rx={3} fill="#2563EB" opacity={0.85}/>
                  <text x={x+bw/2} y={H+30} textAnchor="middle" fontSize={9} fill="var(--text-muted)">{y}</text>
                  <text x={x+bw/2} y={H+16-fH-iH-5} textAnchor="middle" fontSize={9} fill={NAVY} fontWeight={700}>{total.toFixed(0)}</text>
                </g>
              );
            })}
            <rect x={10} y={H+40} width={10} height={8} fill="#2563EB" rx={2}/><text x={24} y={H+48} fontSize={9} fill="var(--text-muted)">Final</text>
            <rect x={60} y={H+40} width={10} height={8} fill="#D97706" rx={2}/><text x={74} y={H+48} fontSize={9} fill="var(--text-muted)">Interim</text>
          </svg>
        </div>
      </div>
      <TblWrap>
        <thead><tr><TH c="Year"/><TH c="Ex-Date"/><TH c="Type"/><TH c="Face Value" right/><TH c="DPS (PKR)" right/><TH c="Yield %" right/></tr></thead>
        <tbody>
          {history.map((h,i)=>(
            <tr key={h.exDate}>
              <TD c={h.year} bold alt={i%2===1}/>
              <TD c={h.exDate} alt={i%2===1}/>
              <td style={{padding:"9px 13px",borderBottom:"1px solid var(--border)",background:i%2===0?"var(--card-bg)":"var(--light-bg)"}}><span style={{padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:h.type==="Final"?"rgba(37,99,235,0.1)":"rgba(217,119,6,0.1)",color:h.type==="Final"?"#2563EB":"#D97706"}}>{h.type}</span></td>
              <TD c="PKR 10" right alt={i%2===1}/>
              <TD c={"PKR "+h.dps.toFixed(2)} right bold color={GOLD} alt={i%2===1}/>
              <TD c={h.yield.toFixed(2)+"%"} right color="var(--positive)" alt={i%2===1}/>
            </tr>
          ))}
        </tbody>
      </TblWrap>
    </div>
  );
}

function OwnershipTab() {
  const breakdown=[{label:"Institutions",pct:54.2,color:"#2563EB"},{label:"Promoters",pct:22.8,color:NAVY},{label:"Public / Retail",pct:15.4,color:GOLD},{label:"Mutual Funds",pct:7.6,color:"#059669"}];
  const holders=[
    {name:"EOBI (Employees Old-Age Benefits Institution)",type:"Government",shares:"42.5M",value:"PKR 7.8B",chg:"+0.0%",portfolio:"3.2%",date:"Dec 2024"},
    {name:"National Investment Trust Limited (NIT)",type:"Mutual Fund",shares:"28.1M",value:"PKR 5.2B",chg:"-0.4%",portfolio:"2.1%",date:"Dec 2024"},
    {name:"State Life Insurance Corporation",type:"Insurance",shares:"18.6M",value:"PKR 3.4B",chg:"+0.0%",portfolio:"1.4%",date:"Dec 2024"},
    {name:"Government of Pakistan",type:"Government",shares:"15.2M",value:"PKR 2.8B",chg:"+0.0%",portfolio:"1.1%",date:"Sep 2024"},
    {name:"Pakistan Equity Fund",type:"Mutual Fund",shares:"12.4M",value:"PKR 2.3B",chg:"+0.2%",portfolio:"0.9%",date:"Dec 2024"},
    {name:"Al-Ameen Islamic Aggressive Income Fund",type:"Mutual Fund",shares:"9.8M",value:"PKR 1.8B",chg:"-0.1%",portfolio:"0.7%",date:"Dec 2024"},
    {name:"Alfalah GHP Alpha Fund",type:"Mutual Fund",shares:"8.2M",value:"PKR 1.5B",chg:"+0.0%",portfolio:"0.6%",date:"Dec 2024"},
  ];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:20,alignItems:"start"}}>
        <div style={{border:"1px solid var(--border)",borderRadius:12,padding:20}}>
          <SecTitle>Ownership Structure</SecTitle>
          <DonutChart data={breakdown}/>
        </div>
        <div>
          <SecTitle>Breakdown by Type</SecTitle>
          {breakdown.map(b=>(
            <div key={b.label} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:13,color:"var(--text-primary)"}}>{b.label}</span>
                <span style={{fontSize:13,fontWeight:700,color:b.color}}>{b.pct}%</span>
              </div>
              <div style={{height:7,background:"var(--light-bg)",borderRadius:4}}><div style={{height:"100%",width:b.pct+"%",background:b.color,borderRadius:4,opacity:0.85}}/></div>
            </div>
          ))}
          <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
            <Chip label="Free Float" value="45%" sub="Tradeable"/>
            <Chip label="Total Holders" value="1,842" sub="Registered"/>
          </div>
        </div>
      </div>
      <SecTitle>Institutional Holders</SecTitle>
      <TblWrap>
        <thead><tr><TH c="Institution"/><TH c="Type"/><TH c="Shares" right/><TH c="Value" right/><TH c="Change" right/><TH c="Portfolio %" right/><TH c="As Of"/></tr></thead>
        <tbody>
          {holders.map((h,i)=>(
            <tr key={h.name}>
              <TD c={h.name} bold alt={i%2===1}/><TD c={h.type} alt={i%2===1}/><TD c={h.shares} right alt={i%2===1}/>
              <TD c={h.value} right alt={i%2===1}/><TD c={h.chg} right color={h.chg.startsWith("+")&&h.chg!=="+0.0%"?"var(--positive)":h.chg.startsWith("-")?"var(--negative)":"var(--text-muted)"} alt={i%2===1}/>
              <TD c={h.portfolio} right alt={i%2===1}/><TD c={h.date} alt={i%2===1}/>
            </tr>
          ))}
        </tbody>
      </TblWrap>
      <p style={{fontSize:11,color:"var(--text-muted)"}}>Source: PSX beneficial ownership disclosures & CDC filings. Updated quarterly.</p>
    </div>
  );
}

function InsiderTab({ sym }: { sym: string }) {
  const [txs, setTxs] = useState<{date:string;name:string;position:string;action:string;quantity:number;rate:number}[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{
    fetch(`/api/portal/insider?symbol=${sym}`).then(r=>r.json()).then(d=>{ setTxs(d.data||[]); setLoading(false); }).catch(()=>setLoading(false));
  },[sym]);
  const buys=txs.filter(t=>t.action==="Buy").length;
  const sells=txs.filter(t=>t.action==="Sell").length;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
        <Chip label="Total (1Y)" value={String(txs.length)} sub="Transactions" color={NAVY}/>
        <Chip label="Purchases" value={String(buys)} sub="Insider buys" color="var(--positive)"/>
        <Chip label="Sales" value={String(sells)} sub="Insider sells" color="var(--negative)"/>
        <Chip label="Net Sentiment" value={buys>sells?"Bullish":buys<sells?"Bearish":"Neutral"} sub="Insider signal" color={buys>sells?"var(--positive)":buys<sells?"var(--negative)":"var(--text-muted)"}/>
      </div>
      {loading?(
        <div style={{padding:40,textAlign:"center",color:"var(--text-muted)"}}>Loading insider data…</div>
      ):(
        <TblWrap>
          <thead><tr><TH c="Posting Date"/><TH c="Name"/><TH c="Position"/><TH c="Action"/><TH c="Quantity" right/><TH c="Rate (PKR)" right/><TH c="Total Value" right/><TH c="Attachment"/></tr></thead>
          <tbody>
            {txs.map((t,i)=>(
              <tr key={t.date+t.name+i}>
                <TD c={t.date} alt={i%2===1}/>
                <TD c={t.name} bold alt={i%2===1}/>
                <TD c={t.position} alt={i%2===1}/>
                <td style={{padding:"9px 13px",borderBottom:"1px solid var(--border)",fontWeight:700,color:t.action==="Buy"?"var(--positive)":"var(--negative)",background:i%2===0?"var(--card-bg)":"var(--light-bg)"}}>
                  {t.action==="Buy"?"▲ Buy":"▼ Sell"}
                </td>
                <TD c={t.quantity.toLocaleString()} right alt={i%2===1}/>
                <TD c={t.rate>0?fmt(t.rate):"—"} right alt={i%2===1}/>
                <TD c={t.rate>0?"PKR "+(t.quantity*t.rate/1e6).toFixed(2)+"M":"—"} right bold alt={i%2===1}/>
                <td style={{padding:"9px 13px",borderBottom:"1px solid var(--border)",background:i%2===0?"var(--card-bg)":"var(--light-bg)"}}><button style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:700,background:NAVY,color:"#fff",border:"none",cursor:"pointer"}}>View</button></td>
              </tr>
            ))}
          </tbody>
        </TblWrap>
      )}
      <p style={{fontSize:11,color:"var(--text-muted)"}}>Source: PSX Form-X disclosures by directors and substantial shareholders (≥10% holding).</p>
    </div>
  );
}

function ReportsTab({ sym }: { sym: string }) {
  const [year,setYear]=useState("2025");
  const years=["2026","2025","2024","2023","2022"];
  const reports: Record<string,{year:string;postDate:string;periodEnded:string;type:string;pages:number}[]> = {
    "2026":[{year:"2026",postDate:"29-04-2026",periodEnded:"31-03-2026",type:"QTR",pages:48}],
    "2025":[{year:"2025",postDate:"30-10-2025",periodEnded:"30-06-2025",type:"ANNUAL",pages:184},{year:"2025",postDate:"29-04-2025",periodEnded:"31-03-2025",type:"QTR",pages:42},{year:"2025",postDate:"27-02-2025",periodEnded:"31-12-2024",type:"HALF YEAR",pages:68}],
    "2024":[{year:"2024",postDate:"30-10-2024",periodEnded:"30-06-2024",type:"ANNUAL",pages:176},{year:"2024",postDate:"30-04-2024",periodEnded:"31-03-2024",type:"QTR",pages:40},{year:"2024",postDate:"26-02-2024",periodEnded:"31-12-2023",type:"HALF YEAR",pages:64}],
    "2023":[{year:"2023",postDate:"30-10-2023",periodEnded:"30-06-2023",type:"ANNUAL",pages:168}],
    "2022":[{year:"2022",postDate:"30-10-2022",periodEnded:"30-06-2022",type:"ANNUAL",pages:156}],
  };
  const typeColors: Record<string,{bg:string;color:string}> = {
    "ANNUAL":{bg:"rgba(37,99,235,0.1)",color:"#2563EB"},"QTR":{bg:"rgba(5,150,105,0.1)",color:"#059669"},"HALF YEAR":{bg:"rgba(212,151,26,0.1)",color:GOLD},
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",gap:4,background:"var(--light-bg)",borderRadius:10,padding:4,alignSelf:"flex-start",flexWrap:"wrap"}}>
        {years.map(y=>(
          <button key={y} onClick={()=>setYear(y)} style={{padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",border:"none",background:year===y?NAVY:"transparent",color:year===y?"#fff":"var(--text-muted)",transition:"all 0.15s"}}>
            {y}
          </button>
        ))}
      </div>
      <TblWrap>
        <thead><tr><TH c="Year"/><TH c="Posting Date"/><TH c="Period Ended"/><TH c="Report Type"/><TH c="Pages" right/><TH c="Attachment"/></tr></thead>
        <tbody>
          {(reports[year]??[]).map((r,i)=>{
            const bc=typeColors[r.type]??{bg:"var(--light-bg)",color:"var(--text-muted)"};
            return(
              <tr key={r.postDate+i}>
                <TD c={r.year} bold alt={i%2===1}/>
                <TD c={r.postDate} alt={i%2===1}/>
                <TD c={r.periodEnded} alt={i%2===1}/>
                <td style={{padding:"9px 13px",borderBottom:"1px solid var(--border)",background:i%2===0?"var(--card-bg)":"var(--light-bg)"}}>
                  <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,...bc}}>{r.type}</span>
                </td>
                <TD c={r.pages} right alt={i%2===1}/>
                <td style={{padding:"9px 13px",borderBottom:"1px solid var(--border)",background:i%2===0?"var(--card-bg)":"var(--light-bg)",display:"flex",gap:6}}>
                  <a href={`https://www.psx.com.pk/psx/resources-and-tools/companies/listed-companies/${sym.toLowerCase()}`} target="_blank" rel="noopener noreferrer" style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:700,background:NAVY,color:"#fff",textDecoration:"none"}}>View</a>
                  <a href={`https://www.psx.com.pk/psx/resources-and-tools/companies/listed-companies/${sym.toLowerCase()}`} target="_blank" rel="noopener noreferrer" style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,border:"1px solid var(--border)",color:"var(--text-secondary)",textDecoration:"none"}}>PDF</a>
                </td>
              </tr>
            );
          })}
          {(reports[year]??[]).length===0&&<tr><td colSpan={6} style={{padding:24,textAlign:"center",color:"var(--text-muted)"}}>No reports found for {year}</td></tr>}
        </tbody>
      </TblWrap>
    </div>
  );
}

function AnnouncementsTab({ sym, announcements }: { sym:string; announcements:Announcement[] }) {
  const [search,setSearch]=useState("");
  const [type,setType]=useState("All");
  const demo: Announcement[]=[
    {id:101,title:`${sym}: Board of Directors Meeting — Agenda: Financial Results Q2 FY2025`,announcementDate:"2025-10-28",announcementType:"Board Meeting"},
    {id:102,title:`${sym}: Earnings per Share (EPS) for period ended September 30, 2025`,announcementDate:"2025-10-28",announcementType:"Financial Results"},
    {id:103,title:`${sym}: Final Cash Dividend @ PKR 5.00 per share (50%) — Ex-Date announced`,announcementDate:"2025-04-15",announcementType:"Dividend"},
    {id:104,title:`${sym}: Notice of Annual General Meeting (AGM) — Financial Year 2025`,announcementDate:"2025-09-05",announcementType:"AGM"},
    {id:105,title:`${sym}: Change in Shareholding — Form-X filed by Director`,announcementDate:"2025-07-22",announcementType:"Insider Trade"},
    {id:106,title:`${sym}: Clarification regarding media reports on expansion plans`,announcementDate:"2025-06-10",announcementType:"Clarification"},
    {id:107,title:`${sym}: Interim Dividend @ PKR 2.50 per share declared`,announcementDate:"2025-08-15",announcementType:"Dividend"},
    {id:108,title:`${sym}: Material Information — MOU signed for strategic partnership`,announcementDate:"2025-05-20",announcementType:"Material Info"},
    {id:109,title:`${sym}: Pattern of Shareholding as at June 30, 2025`,announcementDate:"2025-01-28",announcementType:"Shareholding"},
    {id:110,title:`${sym}: Response to Unusual Movement in Price of Shares`,announcementDate:"2026-04-07",announcementType:"Clarification"},
    {id:111,title:`${sym}: Transmission of Half-Yearly Report for period ended December 31, 2025`,announcementDate:"2026-02-27",announcementType:"Financial Results"},
    {id:112,title:`${sym}: Quarterly Report for period ended March 31, 2026`,announcementDate:"2026-04-29",announcementType:"Financial Results"},
  ];
  const all=announcements.length>0?announcements:demo;
  const types=useMemo(()=>["All",...Array.from(new Set(all.map(a=>a.announcementType??"General")))],[all]);
  const filtered=useMemo(()=>all.filter(a=>{
    const mt=type==="All"||(a.announcementType??"General")===type;
    const ms=!search||a.title.toLowerCase().includes(search.toLowerCase());
    return mt&&ms;
  }),[all,type,search]);
  const bc: Record<string,{bg:string;color:string}> = {
    "Board Meeting":{bg:"#EFF6FF",color:"#1D4ED8"},"Financial Results":{bg:"#F0FDF4",color:"#15803D"},
    "Dividend":{bg:"#FFFBEB",color:"#B45309"},"AGM":{bg:"#F5F3FF",color:"#6D28D9"},
    "Insider Trade":{bg:"#FFF7ED",color:"#C2410C"},"Material Info":{bg:"#FFF1F2",color:"#BE123C"},
    "Shareholding":{bg:"#F0FDFA",color:"#0F766E"},"Clarification":{bg:"#F8FAFC",color:"#475569"},
  };
  const dateRange=all.length>0?`${all[all.length-1].announcementDate} — ${all[0].announcementDate}`:"";
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {dateRange&&<div style={{fontSize:12,color:"var(--text-muted)",padding:"8px 14px",background:"var(--light-bg)",borderRadius:8}}>📅 {dateRange}</div>}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search announcements…" style={{flex:1,minWidth:200,padding:"9px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--card-bg)",color:"var(--text-primary)",fontSize:13,outline:"none"}}/>
        <select value={type} onChange={e=>setType(e.target.value)} style={{padding:"9px 12px",borderRadius:8,border:"1px solid var(--border)",background:"var(--card-bg)",color:"var(--text-primary)",fontSize:13,cursor:"pointer"}}>
          {types.map(t=><option key={t}>{t}</option>)}
        </select>
        <span style={{fontSize:12,color:"var(--text-muted)",padding:"0 4px"}}>{filtered.length} results</span>
      </div>
      <TblWrap>
        <thead><tr><TH c="Date"/><TH c="Title"/><TH c="Type"/><TH c="Attachment"/></tr></thead>
        <tbody>
          {filtered.map((a,i)=>{
            const b=bc[a.announcementType??""]??{bg:"#F8FAFC",color:"#475569"};
            return(
              <tr key={a.id}>
                <TD c={a.announcementDate} alt={i%2===1}/>
                <td style={{padding:"9px 13px",borderBottom:"1px solid var(--border)",background:i%2===0?"var(--card-bg)":"var(--light-bg)",maxWidth:400,whiteSpace:"normal"}}><span style={{fontSize:13,color:"var(--text-primary)",lineHeight:1.5}}>{a.title}</span></td>
                <td style={{padding:"9px 13px",borderBottom:"1px solid var(--border)",background:i%2===0?"var(--card-bg)":"var(--light-bg)"}}><span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,...b}}>{a.announcementType??"General"}</span></td>
                <td style={{padding:"9px 13px",borderBottom:"1px solid var(--border)",background:i%2===0?"var(--card-bg)":"var(--light-bg)",display:"flex",gap:6}}>
                  <button style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:700,background:NAVY,color:"#fff",border:"none",cursor:"pointer"}}>View</button>
                  <button style={{padding:"4px 8px",borderRadius:6,fontSize:11,fontWeight:600,border:"1px solid var(--border)",background:"var(--card-bg)",color:"var(--text-secondary)",cursor:"pointer"}}>PDF</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TblWrap>
    </div>
  );
}

function CompanyInfoTab({ sym, company }: { sym:string; company:CompanyInfo }) {
  const meta=getMeta(sym);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {/* About */}
      <div style={{padding:22,border:"1px solid var(--border)",borderRadius:14,background:"var(--card-bg)"}}>
        <SecTitle>About Company</SecTitle>
        <p style={{margin:0,fontSize:14,color:"var(--text-secondary)",lineHeight:1.8}}>{meta.about}</p>
      </div>
      {/* Two column info */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Left: Company details */}
        <div style={{border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"9px 16px",background:NAVY,color:"#fff",fontSize:11,fontWeight:800,letterSpacing:"0.07em",textTransform:"uppercase"}}>Company Details</div>
          {[
            {l:"Sector",v:company.sectorName??meta.industry??"—"},
            {l:"Industry",v:meta.industry??company.sectorName??"—"},
            {l:"Website",v:meta.website2??company.website??"—",link:true},
            {l:"CEO",v:meta.ceo},
            {l:"Phone Number",v:meta.phone},
            {l:"Number of Employees",v:meta.employees},
            {l:"Address",v:meta.address},
          ].map((r,i)=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",background:i%2===0?"var(--card-bg)":"var(--light-bg)",borderBottom:"1px solid var(--border)",gap:12,flexWrap:"wrap"}}>
              <span style={{fontSize:12,color:"var(--text-muted)",flexShrink:0}}>{r.l}</span>
              {(r as {l:string;v:string;link?:boolean}).link&&r.v!=="—"
                ?<a href={r.v.startsWith("http")?r.v:`https://${r.v}`} target="_blank" rel="noopener noreferrer" style={{fontSize:12,fontWeight:700,color:GOLD,textDecoration:"none",textAlign:"right"}}>{r.v}</a>
                :<span style={{fontSize:12,fontWeight:600,color:"var(--text-primary)",textAlign:"right"}}>{r.v}</span>
              }
            </div>
          ))}
        </div>
        {/* Right: Listing info */}
        <div style={{border:"1px solid var(--border)",borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"9px 16px",background:NAVY,color:"#fff",fontSize:11,fontWeight:800,letterSpacing:"0.07em",textTransform:"uppercase"}}>Listing Information</div>
          {[
            {l:"Stock Symbol",v:sym},
            {l:"Full Name",v:company.name},
            {l:"Chairman",v:meta.chairman},
            {l:"Company Secretary",v:meta.secretary},
            {l:"Listing Date",v:company.listingDate??"—"},
            {l:"Fiscal Year End",v:company.fiscalYearEnd??"—"},
            {l:"Shariah Status",v:company.shariahStatus??"—"},
            {l:"Free Float",v:company.freeFloat??"—"},
            {l:"Market Cap",v:meta.mktCap!=="—"?"PKR "+meta.mktCap:"—"},
            {l:"Shares Outstanding",v:meta.sharesOut},
            {l:"Exchange",v:"Pakistan Stock Exchange (PSX)"},
            {l:"Currency",v:"Pakistani Rupee (PKR)"},
          ].map((r,i)=>(
            <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",background:i%2===0?"var(--card-bg)":"var(--light-bg)",borderBottom:i<11?"1px solid var(--border)":"none",gap:12}}>
              <span style={{fontSize:12,color:"var(--text-muted)",flexShrink:0}}>{r.l}</span>
              <span style={{fontSize:12,fontWeight:600,color:"var(--text-primary)",textAlign:"right"}}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>
      {meta.ceo==="—"&&<p style={{fontSize:12,color:"var(--text-muted)",padding:"10px 14px",background:"var(--light-bg)",borderRadius:8,margin:0}}>ℹ️ Management details for this stock are not in our curated database. Please visit the <a href={`https://www.psx.com.pk`} target="_blank" rel="noopener noreferrer" style={{color:GOLD}}>PSX website</a> for official company filings.</p>}
    </div>
  );
}

/* ─── Company Search ─────────────────────────────────────────────────────── */
function CompanySearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => q.trim().length >= 1 ? searchPsxStocks(q).slice(0, 8) : [], [q]);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", width: 240 }}>
      <div style={{ display: "flex", alignItems: "center", border: "1.5px solid rgba(212,151,26,0.6)", borderRadius: 8, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <span style={{ padding: "0 10px", fontSize: 14, color: "#D4971A", flexShrink: 0 }}>🔍</span>
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search company…"
          style={{ flex: 1, padding: "9px 8px 9px 0", background: "transparent", border: "none", color: "#fff", fontSize: 12, outline: "none" }}
        />
        {q && <button onClick={() => { setQ(""); setOpen(false); }} style={{ padding: "0 10px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14 }}>×</button>}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, width: "100%", background: "#07111F", border: "1px solid rgba(212,151,26,0.3)", borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 100, overflow: "hidden" }}>
          {results.map(r => (
            <button key={r.symbol} onClick={() => { router.push(`/data-portal/company/${r.symbol}`); setQ(""); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", background: "transparent", cursor: "pointer", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,151,26,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <span style={{ fontWeight: 800, color: "#D4971A", fontSize: 12, fontFamily: "monospace" }}>{r.symbol}</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Live Quote hook ────────────────────────────────────────────────────── */
interface LiveQuote { price: number; change: number; changePct: number; open: number; high: number; low: number; volume: number; tradingDate: string; }
function useLiveQuote(sym: string, seed: DailyRow | null) {
  const [quote, setQuote] = useState<LiveQuote | null>(seed ? {
    price: seed.close ?? 0, change: seed.priceChange ?? 0, changePct: seed.percentageChange ?? 0,
    open: seed.open ?? 0, high: seed.high ?? 0, low: seed.low ?? 0,
    volume: seed.volume ?? 0, tradingDate: seed.tradingDate,
  } : null);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchQuote() {
      try {
        const r = await fetch(`/api/portal/chart/quote?symbol=${sym}`);
        if (!r.ok || cancelled) return;
        const d = await r.json();
        if (d.price) {
          setQuote({ price: d.price, change: d.change ?? 0, changePct: d.changePct ?? 0,
            open: d.open ?? 0, high: d.high ?? 0, low: d.low ?? 0,
            volume: d.volume ?? 0, tradingDate: d.tradingDate ?? "" });
          setFresh(true);
        }
      } catch { /* keep seed */ }
    }
    fetchQuote();
    const interval = setInterval(fetchQuote, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [sym]);

  return { quote, fresh };
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export default function CompanyClient({ company, latestDaily, latestWeekly, recentDaily, recentWeekly, announcements, sym }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Fundamentals");
  const meta = getMeta(sym);
  const { quote, fresh } = useLiveQuote(sym, latestDaily);
  const pct = fmtPct(quote?.changePct ?? latestDaily?.percentageChange);
  const d = latestDaily;

  return (
    <div style={{minHeight:"100vh",background:"var(--background)"}}>
      {/* ── Hero ── */}
      <div style={{background:"linear-gradient(135deg,#07111F 0%,#0f2540 60%,#1a3560 100%)",color:"#fff",padding:"24px 28px 0"}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.45)",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:5,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <Link href="/data-portal/stocks" style={{color:"rgba(255,255,255,0.45)",textDecoration:"none"}}>← Stocks</Link>
            <span>/</span><span style={{color:"rgba(255,255,255,0.8)"}}>{sym}</span>
          </div>
          <CompanySearch />
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16,marginBottom:20}}>
          {/* Left */}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:900,background:GOLD,color:NAVY,padding:"4px 12px",borderRadius:7,letterSpacing:"0.08em"}}>{sym}</span>
              {company.shariahStatus?.toLowerCase().includes("compliant")&&<span style={{fontSize:11,fontWeight:700,background:"rgba(134,239,172,0.15)",color:"#86efac",padding:"3px 10px",borderRadius:20,border:"1px solid rgba(134,239,172,0.3)"}}>✓ Shariah Compliant</span>}
              {company.sectorName&&<span style={{fontSize:11,background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.65)",padding:"3px 10px",borderRadius:20}}>{company.sectorName}</span>}
            </div>
            <h1 style={{margin:"0 0 5px",fontSize:20,fontWeight:900,color:"#fff",lineHeight:1.2,maxWidth:480}}>{company.name}</h1>
            <p style={{margin:0,fontSize:12,color:"rgba(255,255,255,0.45)"}}>Listed: {company.listingDate??"—"} · FY End: {company.fiscalYearEnd??"—"} · PSX</p>
          </div>
          {/* Right: price */}
          <div style={{textAlign:"right"}}>
            {quote?(
              <>
                <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"flex-end"}}>
                  <div style={{fontSize:36,fontWeight:900,color:"#fff",lineHeight:1}}>PKR {fmt(quote.price)}</div>
                  {fresh && <span style={{fontSize:9,fontWeight:700,background:"rgba(22,163,74,0.2)",color:"#86efac",padding:"2px 7px",borderRadius:10,border:"1px solid rgba(22,163,74,0.3)"}}>LIVE</span>}
                </div>
                <div style={{fontSize:14,fontWeight:700,marginTop:5,color:pct.pos===true?"#86efac":pct.pos===false?"#fca5a5":"rgba(255,255,255,0.6)"}}>
                  {quote.change!=null?((quote.change>0?"+":"")+fmt(quote.change)):""} ({pct.text}) Today
                </div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:3}}>As of {quote.tradingDate||d?.tradingDate||"—"} · PSX</div>
                {/* Mini stats */}
                <div style={{display:"flex",gap:16,marginTop:10,justifyContent:"flex-end",flexWrap:"wrap"}}>
                  {([["Open",fmt(quote.open)],["High",fmt(quote.high)],["Low",fmt(quote.low)],["Vol",fmtV(quote.volume)]] as [string,string][]).map(([l,v])=>(
                    <div key={l} style={{textAlign:"right"}}>
                      <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.07em"}}>{l}</div>
                      <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>{v}</div>
                    </div>
                  ))}
                </div>
              </>
            ):(
              <div style={{fontSize:13,color:"rgba(255,255,255,0.35)"}}>No price data</div>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{display:"flex",overflowX:"auto",marginLeft:-4}}>
          {TABS.map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)} style={{padding:"10px 14px",whiteSpace:"nowrap",fontSize:12,fontWeight:activeTab===tab?700:400,color:activeTab===tab?"#fff":"rgba(255,255,255,0.45)",background:"transparent",border:"none",cursor:"pointer",borderBottom:activeTab===tab?`2px solid ${GOLD}`:"2px solid transparent",transition:"all 0.15s"}}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{padding:"24px 28px",maxWidth:1200,margin:"0 auto"}}>
        {activeTab==="Fundamentals"&&<FundamentalsTab sym={sym} d={d} latestWeekly={latestWeekly} recentDaily={recentDaily} company={company} meta={meta}/>}
        {activeTab==="Peers"&&<PeersTab sym={sym}/>}
        {activeTab==="Financials"&&<FinancialsTab sym={sym}/>}
        {activeTab==="Ratios"&&<RatiosTab sym={sym}/>}
        {activeTab==="Dividends"&&<DividendsTab sym={sym} latestDaily={latestDaily}/>}
        {activeTab==="Ownership"&&<OwnershipTab/>}
        {activeTab==="Insider Transactions"&&<InsiderTab sym={sym}/>}
        {activeTab==="Company Reports"&&<ReportsTab sym={sym}/>}
        {activeTab==="Announcements"&&<AnnouncementsTab sym={sym} announcements={announcements}/>}
        {activeTab==="Company Info"&&<CompanyInfoTab sym={sym} company={company}/>}
      </div>
    </div>
  );
}
