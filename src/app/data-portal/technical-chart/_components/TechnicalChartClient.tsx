"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type {
  IChartApi, ISeriesApi, CandlestickData, HistogramData,
  LineData, DeepPartial, ChartOptions, Time,
} from "lightweight-charts";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number; }
interface Quote { symbol: string; name: string; price: number; open: number; high: number; low: number; close: number; change: number; changePct: number; volume: number; status: string; exchange?: string; }
interface SearchResult { symbol: string; name: string; type: string; exchange: string; country: string; sector: string; dataStatus: string; }

// ── Constants ──────────────────────────────────────────────────────────────────

const INTERVALS = ["1m","5m","15m","30m","1h","2h","3h","4h","D","2D","W","2W","M","3M","6M"] as const;
type Interval = typeof INTERVALS[number];

const CHART_TYPES = ["Candlestick","Bars","HollowCandles","HLC","Line","LineWithMarkers","StepLine","Area","HLCArea","Baseline","Columns","HighLow","Heikin-Ashi"] as const;
type ChartType = typeof CHART_TYPES[number];

const RANGE_BTNS = [
  { label: "5y", days: 1825 },
  { label: "1y", days: 365 },
  { label: "6m", days: 180 },
  { label: "3m", days: 90 },
  { label: "1m", days: 30 },
  { label: "5d", days: 5 },
  { label: "1d", days: 1 },
];

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  PSX_EOD:                    { label: "PSX EOD",          color: "#d97706" },
  PSX_INTRADAY_NOT_AVAILABLE: { label: "INTRADAY N/A",     color: "#94a3b8" },
  PSX_DATA_NOT_CONFIGURED:    { label: "DATA N/A",         color: "#94a3b8" },
  API_KEY_NOT_CONFIGURED:     { label: "KEY NEEDED",       color: "#ef4444" },
  DELAYED_15MIN:              { label: "DELAYED 15m",      color: "#2563eb" },
  DELAYED_1DAY:               { label: "EOD DELAYED",      color: "#2563eb" },
  DELAYED:                    { label: "DELAYED",          color: "#2563eb" },
  LIVE:                       { label: "LIVE",             color: "#089981" },
  ERROR:                      { label: "ERROR",            color: "#ef4444" },
  MARKET_CLOSED:              { label: "MARKET CLOSED",    color: "#94a3b8" },
  DEMO:                       { label: "DEMO",             color: "#7c3aed" },
  UNKNOWN:                    { label: "UNKNOWN",          color: "#94a3b8" },
};

// ── Demo data — deterministic, loads instantly ────────────────────────────────

function generateDemoCandles(): Candle[] {
  const candles: Candle[] = [];
  let price = 178.50;
  const seed = (n: number) => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x); };
  const msPerDay = 86_400_000;
  const endMs = new Date("2024-12-31").getTime();
  let day = 0;
  for (let d = 365 * 3; d >= 0; d--) {
    const ms = endMs - d * msPerDay;
    const dow = new Date(ms).getDay();
    if (dow === 0 || dow === 6) continue;
    const r1 = seed(day++), r2 = seed(day++), r3 = seed(day++);
    const chg = (r1 - 0.48) * 4.5;
    const open = price;
    price = Math.max(80, price + chg);
    const high = Math.max(open, price) + r2 * 2.5;
    const low  = Math.min(open, price) - r3 * 2.5;
    candles.push({ time: Math.floor(ms / 1000), open, high, low, close: price, volume: Math.floor(40_000_000 + seed(day++) * 60_000_000) });
  }
  return candles;
}
const DEMO_CANDLES = generateDemoCandles();

// ── Indicator math ─────────────────────────────────────────────────────────────

function calcSMA(d: Candle[], p: number): LineData<Time>[] {
  const r: LineData<Time>[] = [];
  for (let i = p - 1; i < d.length; i++) {
    r.push({ time: d[i].time as Time, value: d.slice(i - p + 1, i + 1).reduce((s, c) => s + c.close, 0) / p });
  }
  return r;
}
function calcEMA(d: Candle[], p: number): LineData<Time>[] {
  const r: LineData<Time>[] = [];
  const k = 2 / (p + 1);
  let ema = d.slice(0, p).reduce((s, c) => s + c.close, 0) / p;
  for (let i = p; i < d.length; i++) { ema = d[i].close * k + ema * (1 - k); r.push({ time: d[i].time as Time, value: ema }); }
  return r;
}
function calcBB(d: Candle[], p = 20, sd = 2) {
  const upper: LineData<Time>[] = [], mid: LineData<Time>[] = [], lower: LineData<Time>[] = [];
  for (let i = p - 1; i < d.length; i++) {
    const sl = d.slice(i - p + 1, i + 1);
    const mean = sl.reduce((s, c) => s + c.close, 0) / p;
    const stdev = Math.sqrt(sl.reduce((s, c) => s + (c.close - mean) ** 2, 0) / p);
    mid.push({ time: d[i].time as Time, value: mean });
    upper.push({ time: d[i].time as Time, value: mean + sd * stdev });
    lower.push({ time: d[i].time as Time, value: mean - sd * stdev });
  }
  return { upper, mid, lower };
}
function heikinAshi(d: Candle[]): Candle[] {
  let pO = d[0].open, pC = (d[0].open + d[0].close) / 2;
  return d.map(c => {
    const haC = (c.open + c.high + c.low + c.close) / 4;
    const haO = (pO + pC) / 2;
    pO = haO; pC = haC;
    return { ...c, open: haO, high: Math.max(c.high, haO, haC), low: Math.min(c.low, haO, haC), close: haC };
  });
}

// ── Extended indicator math ────────────────────────────────────────────────────

function calcRSI(d: Candle[], p = 14): LineData<Time>[] {
  const r: LineData<Time>[] = [];
  if (d.length < p + 1) return r;
  let avgG = 0, avgL = 0;
  for (let i = 1; i <= p; i++) { const ch = d[i].close - d[i-1].close; avgG += Math.max(ch,0); avgL += Math.max(-ch,0); }
  avgG /= p; avgL /= p;
  for (let i = p; i < d.length; i++) {
    if (i > p) { const ch = d[i].close - d[i-1].close; avgG = (avgG*(p-1)+Math.max(ch,0))/p; avgL = (avgL*(p-1)+Math.max(-ch,0))/p; }
    r.push({ time: d[i].time as Time, value: avgL === 0 ? 100 : 100 - 100/(1+avgG/avgL) });
  }
  return r;
}
function calcMACD(d: Candle[], fast=12, slow=26, sig=9) {
  const ema = (arr: number[], p: number) => {
    const k=2/(p+1); const out:number[]=Array(arr.length).fill(NaN);
    let e=arr.slice(0,p).reduce((a,b)=>a+b,0)/p; out[p-1]=e;
    for(let i=p;i<arr.length;i++){e=arr[i]*k+e*(1-k);out[i]=e;} return out;
  };
  const closes = d.map(c=>c.close);
  const ef = ema(closes,fast), es = ema(closes,slow);
  const macdLine = closes.map((_,i)=>ef[i]-es[i]);
  const macdValid = macdLine.filter(v=>!isNaN(v));
  const sigLine = ema(macdValid, sig);
  const macd:LineData<Time>[]=[], signal:LineData<Time>[]=[], hist:LineData<Time>[]=[];
  let si=0;
  for(let i=slow-1;i<d.length;i++){
    const mv=macdLine[i]; const sv=isNaN(mv)?NaN:(si<sigLine.length?sigLine[si++]:NaN);
    if(!isNaN(mv)){macd.push({time:d[i].time as Time,value:mv});}
    if(!isNaN(sv)){signal.push({time:d[i].time as Time,value:sv});hist.push({time:d[i].time as Time,value:mv-sv});}
  }
  return {macd,signal,hist};
}
function calcStoch(d: Candle[], k=14, smooth=3) {
  const raw:number[]=[];
  for(let i=k-1;i<d.length;i++){
    const sl=d.slice(i-k+1,i+1);
    const lo=Math.min(...sl.map(c=>c.low)),hi=Math.max(...sl.map(c=>c.high));
    raw.push(hi===lo?50:(d[i].close-lo)/(hi-lo)*100);
  }
  const kLine:LineData<Time>[]=[], dLine:LineData<Time>[]=[];
  for(let i=smooth-1;i<raw.length;i++){
    const kv=raw.slice(i-smooth+1,i+1).reduce((a,b)=>a+b,0)/smooth;
    kLine.push({time:d[i+k-1].time as Time,value:kv});
  }
  for(let i=smooth-1;i<kLine.length;i++){
    dLine.push({time:kLine[i].time,value:(kLine[i].value+kLine[i-1].value+kLine[i-2].value)/3});
  }
  return {k:kLine,d:dLine};
}
function calcATR(d: Candle[], p=14): LineData<Time>[] {
  const r:LineData<Time>[]=[]; if(d.length<2)return r;
  const tr=(i:number)=>Math.max(d[i].high-d[i].low,Math.abs(d[i].high-d[i-1].close),Math.abs(d[i].low-d[i-1].close));
  let atr=0; for(let i=1;i<=p;i++)atr+=tr(i); atr/=p;
  for(let i=p;i<d.length;i++){atr=(atr*(p-1)+tr(i))/p;r.push({time:d[i].time as Time,value:atr});}
  return r;
}
function calcCCI(d: Candle[], p=20): LineData<Time>[] {
  const r:LineData<Time>[]=[];
  for(let i=p-1;i<d.length;i++){
    const sl=d.slice(i-p+1,i+1);
    const tp=sl.map(c=>(c.high+c.low+c.close)/3);
    const mean=tp.reduce((a,b)=>a+b,0)/p;
    const mad=tp.reduce((a,b)=>a+Math.abs(b-mean),0)/p;
    r.push({time:d[i].time as Time,value:mad===0?0:(tp[tp.length-1]-mean)/(0.015*mad)});
  }
  return r;
}
function calcWilliamsR(d: Candle[], p=14): LineData<Time>[] {
  const r:LineData<Time>[]=[];
  for(let i=p-1;i<d.length;i++){
    const sl=d.slice(i-p+1,i+1);
    const hi=Math.max(...sl.map(c=>c.high)),lo=Math.min(...sl.map(c=>c.low));
    r.push({time:d[i].time as Time,value:hi===lo?-50:(d[i].close-hi)/(hi-lo)*100});
  }
  return r;
}
function calcMFI(d: Candle[], p=14): LineData<Time>[] {
  const r:LineData<Time>[]=[]; if(d.length<p+1)return r;
  for(let i=p;i<d.length;i++){
    let pf=0,nf=0;
    for(let j=i-p+1;j<=i;j++){
      const tp=(d[j].high+d[j].low+d[j].close)/3, ptp=(d[j-1].high+d[j-1].low+d[j-1].close)/3;
      const mf=tp*d[j].volume;
      if(tp>ptp)pf+=mf; else nf+=mf;
    }
    r.push({time:d[i].time as Time,value:nf===0?100:100-100/(1+pf/nf)});
  }
  return r;
}
function calcROC(d: Candle[], p=14): LineData<Time>[] {
  const r:LineData<Time>[]=[];
  for(let i=p;i<d.length;i++) r.push({time:d[i].time as Time,value:d[i-p].close===0?0:(d[i].close-d[i-p].close)/d[i-p].close*100});
  return r;
}
function calcMomentum(d: Candle[], p=10): LineData<Time>[] {
  const r:LineData<Time>[]=[];
  for(let i=p;i<d.length;i++) r.push({time:d[i].time as Time,value:d[i].close-d[i-p].close});
  return r;
}
function calcDEMA(d: Candle[], p=21): LineData<Time>[] {
  const e1=calcEMA(d,p), e2d=e1.map((_,i)=>({...d[i],close:e1[i]?.value??0,open:e1[i]?.value??0,high:e1[i]?.value??0,low:e1[i]?.value??0,volume:0,time:0}));
  const e2=calcEMA(e2d,p);
  const offset=e2d.length-e2.length;
  return e2.map((v,i)=>({time:v.time,value:2*(e1[i+offset]?.value??0)-v.value}));
}
function calcHMA(d: Candle[], p=14): LineData<Time>[] {
  const half=calcEMA(d,Math.floor(p/2)), full=calcEMA(d,p);
  const minLen=Math.min(half.length,full.length);
  const src:Candle[]=[];
  for(let i=0;i<minLen;i++){
    const hv=half[half.length-minLen+i].value, fv=full[full.length-minLen+i].value;
    src.push({time:0,open:0,high:0,low:0,close:2*hv-fv,volume:0});
  }
  const sqP=Math.floor(Math.sqrt(p));
  const raw=calcEMA(src,sqP);
  const baseIdx=minLen-raw.length;
  return raw.map((v,i)=>({time:half[half.length-minLen+baseIdx+i].time,value:v.value}));
}
function calcAO(d: Candle[]): LineData<Time>[] {
  const r:LineData<Time>[]=[]; if(d.length<34)return r;
  const mp=(c:Candle)=>(c.high+c.low)/2;
  for(let i=33;i<d.length;i++){
    const f=d.slice(i-4,i+1).reduce((s,c)=>s+mp(c),0)/5;
    const sl=d.slice(i-33,i+1).reduce((s,c)=>s+mp(c),0)/34;
    r.push({time:d[i].time as Time,value:f-sl});
  }
  return r;
}
function calcCMF(d: Candle[], p=20): LineData<Time>[] {
  const r:LineData<Time>[]=[];
  for(let i=p-1;i<d.length;i++){
    const sl=d.slice(i-p+1,i+1);
    let mfv=0,vol=0;
    sl.forEach(c=>{const hl=c.high-c.low;const clv=hl===0?0:(2*c.close-c.high-c.low)/hl;mfv+=clv*c.volume;vol+=c.volume;});
    r.push({time:d[i].time as Time,value:vol===0?0:mfv/vol});
  }
  return r;
}
function calcVWAP(d: Candle[]): LineData<Time>[] {
  const r:LineData<Time>[]=[]; let cumTP=0,cumVol=0;
  d.forEach(c=>{cumTP+=(c.high+c.low+c.close)/3*c.volume;cumVol+=c.volume;r.push({time:c.time as Time,value:cumVol===0?c.close:cumTP/cumVol});});
  return r;
}
function calcAroon(d: Candle[], p=25) {
  const up:LineData<Time>[]=[], dn:LineData<Time>[]=[];
  for(let i=p;i<d.length;i++){
    const sl=d.slice(i-p,i+1);
    let hiIdx=0,loIdx=0;
    sl.forEach((c,j)=>{if(c.high>=sl[hiIdx].high)hiIdx=j;if(c.low<=sl[loIdx].low)loIdx=j;});
    up.push({time:d[i].time as Time,value:(hiIdx/p)*100});
    dn.push({time:d[i].time as Time,value:(loIdx/p)*100});
  }
  return {up,dn};
}
function calcParabolicSAR(d: Candle[]): LineData<Time>[] {
  if(d.length<2)return [];
  const r:LineData<Time>[]=[];
  let bull=true,af=0.02,ep=d[0].high,sar=d[0].low;
  for(let i=1;i<d.length;i++){
    sar=sar+af*(ep-sar);
    if(bull){
      if(d[i].high>ep){ep=d[i].high;af=Math.min(af+0.02,0.2);}
      if(d[i].low<sar){bull=false;sar=ep;ep=d[i].low;af=0.02;}
    } else {
      if(d[i].low<ep){ep=d[i].low;af=Math.min(af+0.02,0.2);}
      if(d[i].high>sar){bull=true;sar=ep;ep=d[i].high;af=0.02;}
    }
    r.push({time:d[i].time as Time,value:sar});
  }
  return r;
}
function calcSuperTrend(d: Candle[], p=7, mult=3) {
  const atr=calcATR(d,p); if(!atr.length)return{up:[] as LineData<Time>[],dn:[] as LineData<Time>[]};
  const offset=d.length-atr.length;
  const up:LineData<Time>[]=[], dn:LineData<Time>[]=[];
  let trend=1,upperBand=0,lowerBand=0;
  for(let i=0;i<atr.length;i++){
    const ci=i+offset;
    const hl2=(d[ci].high+d[ci].low)/2;
    const ub=hl2+mult*atr[i].value, lb=hl2-mult*atr[i].value;
    if(i===0){upperBand=ub;lowerBand=lb;}
    else{
      lowerBand=d[ci].close>lowerBand?Math.max(lb,lowerBand):lb;
      upperBand=d[ci].close<upperBand?Math.min(ub,upperBand):ub;
    }
    if(trend===-1&&d[ci].close>upperBand)trend=1;
    else if(trend===1&&d[ci].close<lowerBand)trend=-1;
    if(trend===1)up.push({time:d[ci].time as Time,value:lowerBand});
    else dn.push({time:d[ci].time as Time,value:upperBand});
  }
  return{up,dn};
}
function calcKeltner(d: Candle[], p=20, mult=2) {
  const mid=calcEMA(d,p), atr=calcATR(d,p);
  const minLen=Math.min(mid.length,atr.length);
  const upper:LineData<Time>[]=[], lower:LineData<Time>[]=[],midOut:LineData<Time>[]=[];
  for(let i=0;i<minLen;i++){
    const mv=mid[mid.length-minLen+i].value, av=atr[atr.length-minLen+i].value;
    const t=mid[mid.length-minLen+i].time;
    upper.push({time:t,value:mv+mult*av});
    midOut.push({time:t,value:mv});
    lower.push({time:t,value:mv-mult*av});
  }
  return{upper,mid:midOut,lower};
}
function calcDonchian(d: Candle[], p=20) {
  const upper:LineData<Time>[]=[], lower:LineData<Time>[]=[], mid:LineData<Time>[]=[];
  for(let i=p-1;i<d.length;i++){
    const sl=d.slice(i-p+1,i+1);
    const hi=Math.max(...sl.map(c=>c.high)),lo=Math.min(...sl.map(c=>c.low));
    upper.push({time:d[i].time as Time,value:hi});
    lower.push({time:d[i].time as Time,value:lo});
    mid.push({time:d[i].time as Time,value:(hi+lo)/2});
  }
  return{upper,lower,mid};
}
function calcBBpctB(d: Candle[], p=20, sd=2): LineData<Time>[] {
  const {upper,lower,mid}=calcBB(d,p,sd);
  return upper.map((_,i)=>({time:upper[i].time,value:upper[i].value===lower[i].value?0.5:(d[i+p-1].close-lower[i].value)/(upper[i].value-lower[i].value)}));
}
function calcBBWidth(d: Candle[], p=20, sd=2): LineData<Time>[] {
  const {upper,lower,mid}=calcBB(d,p,sd);
  return upper.map((_,i)=>({time:upper[i].time,value:mid[i].value===0?0:(upper[i].value-lower[i].value)/mid[i].value*100}));
}
function calcStdDev(d: Candle[], p=20): LineData<Time>[] {
  const r:LineData<Time>[]=[];
  for(let i=p-1;i<d.length;i++){
    const sl=d.slice(i-p+1,i+1).map(c=>c.close);
    const mean=sl.reduce((a,b)=>a+b,0)/p;
    r.push({time:d[i].time as Time,value:Math.sqrt(sl.reduce((s,v)=>s+(v-mean)**2,0)/p)});
  }
  return r;
}
function calcEnvelopes(d: Candle[], p=20, pct=0.025) {
  const mid=calcSMA(d,p);
  return{upper:mid.map(v=>({time:v.time,value:v.value*(1+pct)})),mid,lower:mid.map(v=>({time:v.time,value:v.value*(1-pct)}))};
}
function calcVolOsc(d: Candle[], fast=5, slow=10): LineData<Time>[] {
  const vd=(p:number)=>{const r=[];let e=d.slice(0,p).reduce((s,c)=>s+c.volume,0)/p;const k=2/(p+1);for(let i=p;i<d.length;i++){e=d[i].volume*k+e*(1-k);r.push({t:d[i].time,v:e});}return r;};
  const f=vd(fast),sl=vd(slow),minLen=Math.min(f.length,sl.length);
  return Array.from({length:minLen},(_,i)=>({time:f[f.length-minLen+i].t as Time,value:f[f.length-minLen+i].v-sl[sl.length-minLen+i].v}));
}
function calcStochRSI(d: Candle[], rsiP=14, stochP=14): LineData<Time>[] {
  const rsi=calcRSI(d,rsiP); if(rsi.length<stochP)return[];
  const r:LineData<Time>[]=[];
  for(let i=stochP-1;i<rsi.length;i++){
    const sl=rsi.slice(i-stochP+1,i+1).map(v=>v.value);
    const hi=Math.max(...sl),lo=Math.min(...sl);
    r.push({time:rsi[i].time,value:hi===lo?0.5:(rsi[i].value-lo)/(hi-lo)*100});
  }
  return r;
}
function calcADX(d: Candle[], p=14) {
  if(d.length<p*2)return{adx:[] as LineData<Time>[],diPlus:[] as LineData<Time>[],diMinus:[] as LineData<Time>[]};
  const tr=(i:number)=>Math.max(d[i].high-d[i].low,Math.abs(d[i].high-d[i-1].close),Math.abs(d[i].low-d[i-1].close));
  const dmP=(i:number)=>d[i].high-d[i-1].high>d[i-1].low-d[i].low&&d[i].high-d[i-1].high>0?d[i].high-d[i-1].high:0;
  const dmM=(i:number)=>d[i-1].low-d[i].low>d[i].high-d[i-1].high&&d[i-1].low-d[i].low>0?d[i-1].low-d[i].low:0;
  let aTR=0,aDMP=0,aDMM=0;
  for(let i=1;i<=p;i++){aTR+=tr(i);aDMP+=dmP(i);aDMM+=dmM(i);}
  const adx:LineData<Time>[]=[], diP:LineData<Time>[]=[], diM:LineData<Time>[]=[];
  const dxArr:number[]=[];
  for(let i=p;i<d.length;i++){
    if(i>p){aTR=aTR-aTR/p+tr(i);aDMP=aDMP-aDMP/p+dmP(i);aDMM=aDMM-aDMM/p+dmM(i);}
    const pip=aTR===0?0:aDMP/aTR*100, mip=aTR===0?0:aDMM/aTR*100;
    const dx=pip+mip===0?0:Math.abs(pip-mip)/(pip+mip)*100;
    diP.push({time:d[i].time as Time,value:pip});
    diM.push({time:d[i].time as Time,value:mip});
    dxArr.push(dx);
    if(dxArr.length>=p){adx.push({time:d[i].time as Time,value:dxArr.slice(-p).reduce((a,b)=>a+b,0)/p});}
  }
  return{adx,diPlus:diP,diMinus:diM};
}
function calcIchimoku(d: Candle[]) {
  const high=(sl:Candle[])=>Math.max(...sl.map(c=>c.high)), low=(sl:Candle[])=>Math.min(...sl.map(c=>c.low));
  const tenkan:LineData<Time>[]=[], kijun:LineData<Time>[]=[], senkouA:LineData<Time>[]=[], senkouB:LineData<Time>[]=[], chikou:LineData<Time>[]=[];
  for(let i=51;i<d.length;i++){
    const t9=(high(d.slice(i-8,i+1))+low(d.slice(i-8,i+1)))/2;
    const k26=(high(d.slice(i-25,i+1))+low(d.slice(i-25,i+1)))/2;
    tenkan.push({time:d[i].time as Time,value:t9});
    kijun.push({time:d[i].time as Time,value:k26});
    senkouA.push({time:d[i].time as Time,value:(t9+k26)/2});
    senkouB.push({time:d[i].time as Time,value:(high(d.slice(i-51,i+1))+low(d.slice(i-51,i+1)))/2});
  }
  for(let i=25;i<d.length;i++)chikou.push({time:d[i].time as Time,value:d[i-25].close});
  return{tenkan,kijun,senkouA,senkouB,chikou};
}
function calcLinearReg(d: Candle[], p=14): LineData<Time>[] {
  const r:LineData<Time>[]=[];
  for(let i=p-1;i<d.length;i++){
    const sl=d.slice(i-p+1,i+1).map(c=>c.close);
    let sx=0,sy=0,sxy=0,sx2=0;
    sl.forEach((y,x)=>{sx+=x;sy+=y;sxy+=x*y;sx2+=x*x;});
    const n=p,m=(n*sxy-sx*sy)/(n*sx2-sx*sx||1),b=(sy-m*sx)/n;
    r.push({time:d[i].time as Time,value:m*(p-1)+b});
  }
  return r;
}
function calcLinearRegSlope(d: Candle[], p=14): LineData<Time>[] {
  const r:LineData<Time>[]=[];
  for(let i=p-1;i<d.length;i++){
    const sl=d.slice(i-p+1,i+1).map(c=>c.close);
    let sx=0,sy=0,sxy=0,sx2=0;
    sl.forEach((y,x)=>{sx+=x;sy+=y;sxy+=x*y;sx2+=x*x;});
    const n=p,m=(n*sxy-sx*sy)/(n*sx2-sx*sx||1);
    r.push({time:d[i].time as Time,value:m});
  }
  return r;
}
function calcChandeMO(d: Candle[], p=20): LineData<Time>[] {
  const r:LineData<Time>[]=[]; if(d.length<p+1)return r;
  for(let i=p;i<d.length;i++){
    let su=0,sd=0;
    for(let j=i-p+1;j<=i;j++){const ch=d[j].close-d[j-1].close;if(ch>0)su+=ch;else sd-=ch;}
    r.push({time:d[i].time as Time,value:su+sd===0?0:(su-sd)/(su+sd)*100});
  }
  return r;
}
function calcBalance(d: Candle[]): LineData<Time>[] {
  return d.map(c=>({time:c.time as Time,value:c.close===c.open?0:c.close>c.open?(c.close-c.open)/(c.high-c.low||1):-(c.open-c.close)/(c.high-c.low||1)}));
}
function calcOBV(d: Candle[]): LineData<Time>[] {
  const r:LineData<Time>[]=[]; let obv=0;
  r.push({time:d[0].time as Time,value:0});
  for(let i=1;i<d.length;i++){obv+=d[i].close>d[i-1].close?d[i].volume:d[i].close<d[i-1].close?-d[i].volume:0;r.push({time:d[i].time as Time,value:obv});}
  return r;
}
function calcTypicalPrice(d: Candle[]): LineData<Time>[] {
  return d.map(c=>({time:c.time as Time,value:(c.high+c.low+c.close)/3}));
}
function calcMedianPrice(d: Candle[]): LineData<Time>[] {
  return d.map(c=>({time:c.time as Time,value:(c.high+c.low)/2}));
}
function calcNetVolume(d: Candle[]): LineData<Time>[] {
  return d.map(c=>({time:c.time as Time,value:c.close>=c.open?c.volume:-c.volume}));
}
function calcMassIndex(d: Candle[], p=25): LineData<Time>[] {
  const ema1=calcEMA(d,9);
  const ema1Candles=ema1.map(v=>({...d[0],close:v.value,high:v.value,low:v.value,open:v.value,volume:0}));
  const ema2=calcEMA(ema1Candles,9);
  const minLen=Math.min(ema1.length,ema2.length);
  const ratios=Array.from({length:minLen},(_,i)=>({t:ema1[ema1.length-minLen+i].time,v:ema2[i].value===0?1:ema1[ema1.length-minLen+i].value/ema2[i].value}));
  const r:LineData<Time>[]=[];
  for(let i=p-1;i<ratios.length;i++)r.push({time:ratios[i].t as Time,value:ratios.slice(i-p+1,i+1).reduce((s,x)=>s+x.v,0)});
  return r;
}
function calcUltimateOscillator(d: Candle[]): LineData<Time>[] {
  if(d.length<28)return[];
  const r:LineData<Time>[]=[];
  const bp=(i:number)=>d[i].close-Math.min(d[i].low,d[i-1].close);
  const tr=(i:number)=>Math.max(d[i].high,d[i-1].close)-Math.min(d[i].low,d[i-1].close);
  for(let i=27;i<d.length;i++){
    let bp7=0,tr7=0,bp14=0,tr14=0,bp28=0,tr28=0;
    for(let j=i-6;j<=i;j++){bp7+=bp(j);tr7+=tr(j);}
    for(let j=i-13;j<=i;j++){bp14+=bp(j);tr14+=tr(j);}
    for(let j=i-27;j<=i;j++){bp28+=bp(j);tr28+=tr(j);}
    const av7=tr7===0?0:bp7/tr7,av14=tr14===0?0:bp14/tr14,av28=tr28===0?0:bp28/tr28;
    r.push({time:d[i].time as Time,value:(4*av7+2*av14+av28)/7*100});
  }
  return r;
}
function calcChoppiness(d: Candle[], p=14): LineData<Time>[] {
  const r:LineData<Time>[]=[];
  for(let i=p;i<d.length;i++){
    const sl=d.slice(i-p+1,i+1);
    let atrSum=0;
    for(let j=1;j<sl.length;j++)atrSum+=Math.max(sl[j].high-sl[j].low,Math.abs(sl[j].high-sl[j-1].close),Math.abs(sl[j].low-sl[j-1].close));
    const hi=Math.max(...sl.map(c=>c.high)),lo=Math.min(...sl.map(c=>c.low));
    r.push({time:d[i].time as Time,value:hi===lo?50:100*Math.log10(atrSum/(hi-lo))/Math.log10(p)});
  }
  return r;
}
function calcKnowSureThing(d: Candle[]) {
  const roc1=calcROC(d,10),roc2=calcROC(d,13),roc3=calcROC(d,15),roc4=calcROC(d,20);
  const smaN=(data:LineData<Time>[],p:number):LineData<Time>[]=>{ const r:LineData<Time>[]=[];for(let i=p-1;i<data.length;i++){r.push({time:data[i].time,value:data.slice(i-p+1,i+1).reduce((s,v)=>s+v.value,0)/p});}return r;};
  const s1=smaN(roc1,10),s2=smaN(roc2,13),s3=smaN(roc3,15),s4=smaN(roc4,20);
  const minLen=Math.min(s1.length,s2.length,s3.length,s4.length);
  const kst:LineData<Time>[]=[];
  for(let i=0;i<minLen;i++){const v=s1[s1.length-minLen+i].value*1+s2[s2.length-minLen+i].value*2+s3[s3.length-minLen+i].value*3+s4[s4.length-minLen+i].value*4;kst.push({time:s1[s1.length-minLen+i].time,value:v});}
  const sig=smaN(kst,9);
  return{kst,signal:sig};
}

// ── Theme ──────────────────────────────────────────────────────────────────────

function themeOpts(dark: boolean) {
  return dark ? {
    bg: "#131722", text: "#d1d4dc",
    grid: { vertLines: { color: "#1e222d" }, horzLines: { color: "#1e222d" } },
    border: "#2a2e39", cross: "#758696",
  } : {
    bg: "#ffffff", text: "#131722",
    grid: { vertLines: { color: "#e0e3eb" }, horzLines: { color: "#e0e3eb" } },
    border: "#d6d8e0", cross: "#9598a1",
  };
}

// ── SVG icon components (matching SCS Trade style) ────────────────────────────

const Ic = {
  Search: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Plus:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  ChevronDown: () => <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Candle: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="6" width="5" height="12" rx="0.5"/><rect x="14" y="4" width="5" height="10" rx="0.5"/><line x1="7.5" y1="3" x2="7.5" y2="6"/><line x1="7.5" y1="18" x2="7.5" y2="21"/><line x1="16.5" y1="2" x2="16.5" y2="4"/><line x1="16.5" y1="14" x2="16.5" y2="19"/></svg>,
  Bar:    () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="7" y1="4" x2="7" y2="20"/><line x1="4" y1="7" x2="7" y2="7"/><line x1="7" y1="14" x2="10" y2="14"/><line x1="17" y1="3" x2="17" y2="19"/><line x1="14" y1="6" x2="17" y2="6"/><line x1="17" y1="12" x2="20" y2="12"/></svg>,
  Line:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 17 8 12 13 16 21 7"/></svg>,
  Area:   () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 18 8 12 13 16 21 7"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  HA:     () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="7" width="5" height="10" rx="0.5" fill="currentColor" fillOpacity="0.2"/><rect x="14" y="5" width="5" height="8" rx="0.5" fill="currentColor" fillOpacity="0.2"/><line x1="7.5" y1="4" x2="7.5" y2="7"/><line x1="7.5" y1="17" x2="7.5" y2="20"/><line x1="16.5" y1="3" x2="16.5" y2="5"/><line x1="16.5" y1="13" x2="16.5" y2="17"/></svg>,
  Indicator: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Undo:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>,
  Redo:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>,
  Camera: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Fullscreen: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  Moon:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Sun:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Save:   () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  // Drawing tool icons
  Crosshair: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="2" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="22" y2="12"/></svg>,
  Trendline: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="20" x2="21" y2="4"/><circle cx="3" cy="20" r="2" fill="currentColor"/><circle cx="21" cy="4" r="2" fill="currentColor"/></svg>,
  HLines: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="2" y1="8" x2="22" y2="8"/><line x1="2" y1="14" x2="22" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  HLine: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  VLine: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/></svg>,
  Ray: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="16 7 21 12 16 17"/><circle cx="3" cy="12" r="1.5" fill="currentColor"/></svg>,
  Channel: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="16" x2="21" y2="8"/><line x1="3" y1="20" x2="21" y2="12"/></svg>,
  Fib: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="18" x2="21" y2="18"/><line x1="3" y1="4" x2="3" y2="20"/><text x="15" y="9" fontSize="5" fill="currentColor" stroke="none">0.5</text></svg>,
  Rect: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="1"/></svg>,
  Triangle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 3 22 21 2 21"/></svg>,
  Text: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  Emoji: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  Ruler: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 12h20M2 12L6 8M2 12l4 4M22 12l-4-4M22 12l-4 4M8 12v3M12 12v5M16 12v3"/></svg>,
  ZoomPlus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>,
  Magnet: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 15A6 6 0 1 0 18 15"/><line x1="6" y1="15" x2="6" y2="20"/><line x1="18" y1="15" x2="18" y2="20"/><line x1="6" y1="20" x2="9" y2="20"/><line x1="15" y1="20" x2="18" y2="20"/></svg>,
  Lock: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Layers:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  ExtLine:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="2" y1="20" x2="22" y2="4"/><polyline points="18 4 22 4 22 8"/><polyline points="2 16 2 20 6 20"/></svg>,
  InfoLine:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="20" x2="21" y2="4"/><circle cx="3" cy="20" r="1.5" fill="currentColor"/><circle cx="21" cy="4" r="1.5" fill="currentColor"/><rect x="1" y="15" width="5" height="4" rx="0.5" fill="currentColor" stroke="none"/><rect x="18" y="1" width="5" height="4" rx="0.5" fill="currentColor" stroke="none"/></svg>,
  TrendAngle: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="20" x2="21" y2="4"/><line x1="3" y1="20" x2="21" y2="20"/><path d="M14 20 A8 8 0 0 0 3 13" strokeWidth="1.2" strokeDasharray="2 2"/></svg>,
  HRay:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="16 7 21 12 16 17"/><circle cx="3" cy="12" r="2" fill="currentColor" stroke="none"/></svg>,
  CrossLine:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>,
  RegTrend:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="18" x2="21" y2="6"/><line x1="3" y1="22" x2="21" y2="10" strokeWidth="1" strokeDasharray="2"/><line x1="3" y1="14" x2="21" y2="2" strokeWidth="1" strokeDasharray="2"/></svg>,
  Disjoint:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="8" x2="11" y2="4"/><line x1="13" y1="14" x2="21" y2="10"/><line x1="3" y1="16" x2="11" y2="12"/><line x1="13" y1="22" x2="21" y2="18"/></svg>,
  FibExt:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="3" y1="4" x2="21" y2="4"/><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="16" x2="21" y2="16"/><line x1="3" y1="20" x2="21" y2="20"/><line x1="3" y1="2" x2="3" y2="22"/><polyline points="3 2 3 2" strokeWidth="2"/></svg>,
  FibFan:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="4" cy="20" r="1.5" fill="currentColor" stroke="none"/><line x1="4" y1="20" x2="22" y2="4"/><line x1="4" y1="20" x2="22" y2="10"/><line x1="4" y1="20" x2="22" y2="16"/><line x1="4" y1="20" x2="22" y2="20"/></svg>,
  FibCircle:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/></svg>,
  FibArc:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="3" y1="20" x2="21" y2="20"/><path d="M3 20 Q12 4 21 20"/><path d="M3 20 Q9 10 21 20"/></svg>,
  FibWedge:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="3" y1="20" x2="21" y2="8"/><line x1="3" y1="20" x2="21" y2="20"/><line x1="3" y1="20" x2="21" y2="12"/><line x1="3" y1="20" x2="21" y2="16"/></svg>,
  // Geometric shapes icons
  Brush:        () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.48 1.02 3.5 1.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-2.5-3.02z"/></svg>,
  Highlighter:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/><line x1="3" y1="21" x2="21" y2="21" strokeWidth="3" stroke="currentColor" opacity="0.35"/></svg>,
  ArrowMarker:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="7 5 19 5 19 17"/></svg>,
  Arrow:        () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="18" r="2" fill="currentColor" stroke="none"/><line x1="6" y1="18" x2="18" y2="6"/><polyline points="10 6 18 6 18 14"/></svg>,
  ArrowUp2:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 18 10 14 10 14 22 10 22 10 10 6 10" fill="none"/></svg>,
  ArrowDown2:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 22 6 14 10 14 10 2 14 2 14 14 18 14" fill="none"/></svg>,
  ArrowLeft2:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="2 12 10 6 10 10 22 10 22 14 10 14 10 18" fill="none"/></svg>,
  ArrowRight2:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 12 14 18 14 14 2 14 2 10 14 10 14 6" fill="none"/></svg>,
  RotatedRect:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="1" transform="rotate(20 12 12)"/></svg>,
  PathTool:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20 Q8 4 12 12 Q16 20 20 4"/><circle cx="4" cy="20" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="20" cy="4" r="2" fill="currentColor" stroke="none"/></svg>,
  Circle:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/></svg>,
  Ellipse:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="12" rx="11" ry="7"/></svg>,
  // Patterns icon (nodes connected by lines)
  Patterns:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="4" cy="20" r="2" fill="currentColor" stroke="none"/><circle cx="10" cy="10" r="2" fill="currentColor" stroke="none"/><circle cx="18" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="20" cy="16" r="2" fill="currentColor" stroke="none"/><line x1="4" y1="20" x2="10" y2="10"/><line x1="10" y1="10" x2="18" y2="6"/><line x1="10" y1="10" x2="20" y2="16"/></svg>,
  // Prediction icon (horizontal lines with price bracket)
  Prediction:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><line x1="2" y1="6" x2="14" y2="6"/><line x1="2" y1="12" x2="14" y2="12"/><line x1="2" y1="18" x2="14" y2="18"/><polyline points="14 4 22 12 14 20" strokeWidth="1.8"/></svg>,
  // Lock-drawings mode (pencil + lock)
  LockDraw:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/><rect x="15" y="15" width="6" height="5" rx="1"/><path d="M16.5 15v-1.5a1.5 1.5 0 0 1 3 0V15" strokeWidth="1.5"/></svg>,
};

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_INFO[status] ?? { label: status, color: "#94a3b8" };
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 3,
      background: s.color + "1a", color: s.color, border: `1px solid ${s.color}44`,
      letterSpacing: "0.05em", whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}

// ── Symbol Search Modal ────────────────────────────────────────────────────────

const CATEGORIES = ["All","Pakistan","International","Stocks","Indices","Pakistani Banks","Forex","Commodities","Crypto"];

function SymbolSearch({ onSelect, onClose }: { onSelect: (s: SearchResult) => void; onClose: () => void }) {
  const [q, setQ]               = useState("");
  const [cat, setCat]           = useState("All");
  const [results, setResults]   = useState<SearchResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [cursor, setCursor]     = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/portal/chart/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}`);
        const json = await res.json();
        setResults(json.results ?? []);
        setCursor(0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 180);
    return () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); };
  }, [q, cat]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter" && results[cursor]) onSelect(results[cursor]);
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="tc-overlay-bg" onClick={onClose}>
      <div className="tc-search-modal" onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        <div className="tc-sm-input-row">
          <Ic.Search />
          <input ref={inputRef} className="tc-sm-input" value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search symbol, e.g. KSE100, AAPL, GOLD…" autoComplete="off" spellCheck={false} />
          {loading && <div className="tc-spinner-sm" />}
          <button className="tc-icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="tc-sm-cats">
          {CATEGORIES.map(c => (
            <button key={c} className={`tc-sm-cat${cat === c ? " on" : ""}`} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div className="tc-sm-header">
          <span style={{ width: 90 }}>SYMBOL</span>
          <span style={{ flex: 1 }}>NAME</span>
          <span style={{ width: 60 }}>TYPE</span>
          <span style={{ width: 65 }}>EXCHANGE</span>
          <span style={{ width: 90 }}>DATA</span>
        </div>
        <div className="tc-sm-list">
          {!loading && !results.length && (
            <div className="tc-sm-empty">{q ? `No results for "${q}"` : "Type to search symbols…"}</div>
          )}
          {results.map((r, i) => (
            <div key={`${r.symbol}-${i}`}
              className={`tc-sm-row${i === cursor ? " on" : ""}`}
              onClick={() => onSelect(r)} onMouseEnter={() => setCursor(i)}
            >
              <span className="tc-sm-sym">{r.country === "PK" ? "🇵🇰 " : r.country === "US" ? "🇺🇸 " : "🌐 "}{r.symbol}</span>
              <span className="tc-sm-name">{r.name}</span>
              <span className="tc-sm-meta">{r.type}</span>
              <span className="tc-sm-meta">{r.exchange}</span>
              <StatusBadge status={r.dataStatus} />
            </div>
          ))}
        </div>
        <div className="tc-sm-footer">↑↓ Navigate · Enter Select · Esc Close</div>
      </div>
    </div>
  );
}

// ── Indicators Panel ───────────────────────────────────────────────────────────

interface IndDef { id: string; label: string; group: string; pane: "overlay"|"oscillator"|"volume"; unavailable?: boolean; }

const IND_LIST: IndDef[] = [
  // Overlay - main price chart
  { id: "sma20",    label: "SMA (20)",                              group: "Moving Averages", pane: "overlay" },
  { id: "sma50",    label: "SMA (50)",                              group: "Moving Averages", pane: "overlay" },
  { id: "sma200",   label: "SMA (200)",                             group: "Moving Averages", pane: "overlay" },
  { id: "ema9",     label: "EMA (9)",                               group: "Moving Averages", pane: "overlay" },
  { id: "ema20",    label: "EMA (20)",                              group: "Moving Averages", pane: "overlay" },
  { id: "ema50",    label: "EMA (50)",                              group: "Moving Averages", pane: "overlay" },
  { id: "dema",     label: "Double EMA",                            group: "Moving Averages", pane: "overlay" },
  { id: "tema",     label: "Triple EMA",                            group: "Moving Averages", pane: "overlay" },
  { id: "hma",      label: "Hull Moving Average",                   group: "Moving Averages", pane: "overlay" },
  { id: "smma20",   label: "Smoothed Moving Average",               group: "Moving Averages", pane: "overlay" },
  { id: "wma",      label: "Moving Average Weighted",               group: "Moving Averages", pane: "overlay" },
  { id: "lsma",     label: "Least Squares Moving Average",          group: "Moving Averages", pane: "overlay" },
  { id: "bb",       label: "Bollinger Bands",                       group: "Volatility",      pane: "overlay" },
  { id: "keltner",  label: "Keltner Channels",                      group: "Volatility",      pane: "overlay" },
  { id: "donchian", label: "Donchian Channels",                     group: "Volatility",      pane: "overlay" },
  { id: "envelopes",label: "Envelopes",                             group: "Volatility",      pane: "overlay" },
  { id: "sar",      label: "Parabolic SAR",                         group: "Trend",           pane: "overlay" },
  { id: "supertrend",label: "SuperTrend",                           group: "Trend",           pane: "overlay" },
  { id: "ichimoku", label: "Ichimoku Cloud",                        group: "Trend",           pane: "overlay" },
  { id: "vwap",     label: "VWAP",                                  group: "Volume",          pane: "overlay" },
  { id: "typical",  label: "Typical Price",                         group: "Price",           pane: "overlay" },
  { id: "median",   label: "Median Price",                          group: "Price",           pane: "overlay" },
  { id: "linreg",   label: "Linear Regression Curve",               group: "Trend",           pane: "overlay" },
  // Oscillators - separate pane
  { id: "vol",      label: "Volume",                                group: "Volume",          pane: "volume" },
  { id: "rsi",      label: "Relative Strength Index",               group: "Oscillators",     pane: "oscillator" },
  { id: "macd",     label: "MACD",                                  group: "Oscillators",     pane: "oscillator" },
  { id: "stoch",    label: "Stochastic",                            group: "Oscillators",     pane: "oscillator" },
  { id: "stochrsi", label: "Stochastic RSI",                       group: "Oscillators",     pane: "oscillator" },
  { id: "cci",      label: "Commodity Channel Index",               group: "Oscillators",     pane: "oscillator" },
  { id: "willr",    label: "Williams %R",                           group: "Oscillators",     pane: "oscillator" },
  { id: "mfi",      label: "Money Flow Index",                      group: "Volume",          pane: "oscillator" },
  { id: "cmf",      label: "Chaikin Money Flow",                    group: "Volume",          pane: "oscillator" },
  { id: "ao",       label: "Awesome Oscillator",                    group: "Oscillators",     pane: "oscillator" },
  { id: "roc",      label: "Rate Of Change",                        group: "Oscillators",     pane: "oscillator" },
  { id: "mom",      label: "Momentum",                              group: "Oscillators",     pane: "oscillator" },
  { id: "bop",      label: "Balance of Power",                      group: "Oscillators",     pane: "oscillator" },
  { id: "atr",      label: "Average True Range",                    group: "Volatility",      pane: "oscillator" },
  { id: "bbpctb",   label: "Bollinger Bands %B",                   group: "Volatility",      pane: "oscillator" },
  { id: "bbwidth",  label: "Bollinger Bands Width",                 group: "Volatility",      pane: "oscillator" },
  { id: "stddev",   label: "Standard Deviation",                    group: "Volatility",      pane: "oscillator" },
  { id: "adx",      label: "Average Directional Index",             group: "Trend",           pane: "oscillator" },
  { id: "aroon",    label: "Aroon",                                 group: "Trend",           pane: "oscillator" },
  { id: "linregslope",label: "Linear Regression Slope",            group: "Trend",           pane: "oscillator" },
  { id: "obv",      label: "On Balance Volume",                     group: "Volume",          pane: "oscillator" },
  { id: "netvol",   label: "Net Volume",                            group: "Volume",          pane: "oscillator" },
  { id: "volosc",   label: "Volume Oscillator",                     group: "Volume",          pane: "oscillator" },
  { id: "mass",     label: "Mass Index",                            group: "Oscillators",     pane: "oscillator" },
  { id: "uo",       label: "Ultimate Oscillator",                   group: "Oscillators",     pane: "oscillator" },
  { id: "chop",     label: "Choppiness Index",                      group: "Oscillators",     pane: "oscillator" },
  { id: "kst",      label: "Know Sure Thing",                       group: "Oscillators",     pane: "oscillator" },
  { id: "chande",   label: "Chande Momentum Oscillator",            group: "Oscillators",     pane: "oscillator" },
  { id: "stochrsi14",label: "StochRSI",                            group: "Oscillators",     pane: "oscillator" },
  { id: "trix",     label: "TRIX",                                  group: "Oscillators",     pane: "oscillator" },
  // Complex indicators requiring unavailable data
  { id: "52whl",    label: "52 Week High/Low",                      group: "Price",           pane: "overlay",    unavailable: false },
  { id: "adline",   label: "Advance/Decline",                       group: "Breadth",         pane: "oscillator", unavailable: true },
  { id: "volpfr",   label: "Volume Profile Fixed Range",            group: "Volume",          pane: "overlay",    unavailable: true },
  { id: "volpvr",   label: "Volume Profile Visible Range",          group: "Volume",          pane: "overlay",    unavailable: true },
  { id: "accswing", label: "Accumulative Swing Index",              group: "Oscillators",     pane: "oscillator" },
  { id: "accdist",  label: "Accumulation/Distribution",             group: "Volume",          pane: "oscillator" },
  { id: "almaopt",  label: "Arnaud Legoux Moving Average",          group: "Moving Averages", pane: "overlay" },
  { id: "dmi",      label: "Directional Movement",                  group: "Trend",           pane: "oscillator" },
  { id: "dpo",      label: "Detrended Price Oscillator",            group: "Oscillators",     pane: "oscillator" },
  { id: "eom",      label: "Ease Of Movement",                      group: "Volume",          pane: "oscillator" },
  { id: "efi",      label: "Elder's Force Index",                   group: "Volume",          pane: "oscillator" },
  { id: "emacross", label: "EMA Cross",                             group: "Moving Averages", pane: "overlay" },
  { id: "macross",  label: "MA Cross",                              group: "Moving Averages", pane: "overlay" },
  { id: "maemacross",label: "MA with EMA Cross",                   group: "Moving Averages", pane: "overlay" },
  { id: "fisher",   label: "Fisher Transform",                      group: "Oscillators",     pane: "oscillator" },
  { id: "guppy",    label: "Guppy Multiple Moving Average",         group: "Moving Averages", pane: "overlay" },
  { id: "histvol",  label: "Historical Volatility",                 group: "Volatility",      pane: "oscillator" },
  { id: "klinger",  label: "Klinger Oscillator",                    group: "Volume",          pane: "oscillator" },
  { id: "cci14",    label: "Correlation Coefficient",               group: "Statistics",      pane: "oscillator", unavailable: true },
  { id: "corlog",   label: "Correlation – Log",                     group: "Statistics",      pane: "oscillator", unavailable: true },
  { id: "machannel",label: "Moving Average Channel",                group: "Moving Averages", pane: "overlay" },
  { id: "madouble", label: "Moving Average Double",                 group: "Moving Averages", pane: "overlay" },
  { id: "maadaptive",label: "Moving Average Adaptive",              group: "Moving Averages", pane: "overlay" },
  { id: "mahamming",label: "Moving Average Hamming",                group: "Moving Averages", pane: "overlay" },
  { id: "mamult",   label: "Moving Average Multiple",               group: "Moving Averages", pane: "overlay" },
  { id: "pivots",   label: "Pivot Points Standard",                 group: "Trend",           pane: "overlay" },
  { id: "pricechan",label: "Price Channel",                         group: "Trend",           pane: "overlay" },
  { id: "priceoscil",label: "Price Oscillator",                     group: "Oscillators",     pane: "oscillator" },
  { id: "pvt",      label: "Price Volume Trend",                    group: "Volume",          pane: "oscillator" },
  { id: "rci",      label: "Rank Correlation Index",                group: "Statistics",      pane: "oscillator" },
  { id: "ratio",    label: "Ratio",                                 group: "Statistics",      pane: "oscillator", unavailable: true },
  { id: "rvi",      label: "Relative Vigor Index",                  group: "Oscillators",     pane: "oscillator" },
  { id: "rvol",     label: "Relative Volatility Index",             group: "Volatility",      pane: "oscillator" },
  { id: "smierg",   label: "SMI Ergodic Indicator/Oscillator",      group: "Oscillators",     pane: "oscillator" },
  { id: "spread",   label: "Spread",                                group: "Statistics",      pane: "oscillator", unavailable: true },
  { id: "stderr",   label: "Standard Error",                        group: "Statistics",      pane: "oscillator" },
  { id: "stderrbands",label: "Standard Error Bands",               group: "Volatility",      pane: "overlay" },
  { id: "tsi",      label: "True Strength Index",                   group: "Oscillators",     pane: "oscillator" },
  { id: "trendstrength",label: "Trend Strength Index",             group: "Trend",           pane: "oscillator" },
  { id: "volclc",   label: "Volatility Close-to-Close",             group: "Volatility",      pane: "oscillator" },
  { id: "volindex", label: "Volatility Index",                      group: "Volatility",      pane: "oscillator" },
  { id: "volohlc",  label: "Volatility O-H-L-C",                   group: "Volatility",      pane: "oscillator" },
  { id: "volztc",   label: "Volatility Zero Trend Close-to-Close",  group: "Volatility",      pane: "oscillator" },
  { id: "vortex",   label: "Vortex Indicator",                      group: "Trend",           pane: "oscillator" },
  { id: "vwma",     label: "VWMA",                                  group: "Volume",          pane: "overlay" },
  { id: "walligator",label: "Williams Alligator",                   group: "Trend",           pane: "overlay" },
  { id: "wfractal", label: "Williams Fractal",                      group: "Trend",           pane: "overlay" },
  { id: "zigzag",   label: "Zig Zag",                               group: "Trend",           pane: "overlay" },
  { id: "accosc",   label: "Accelerator Oscillator",                group: "Oscillators",     pane: "oscillator" },
  { id: "chandeKS", label: "Chande Kroll Stop",                     group: "Trend",           pane: "overlay" },
  { id: "chopzone", label: "Chop Zone",                             group: "Oscillators",     pane: "oscillator" },
  { id: "connors",  label: "Connors RSI",                           group: "Oscillators",     pane: "oscillator" },
  { id: "coppock",  label: "Coppock Curve",                         group: "Oscillators",     pane: "oscillator" },
  { id: "vortexind",label: "Vortex Indicator",                      group: "Trend",           pane: "oscillator" },
  { id: "mcginley", label: "McGinley Dynamic",                      group: "Moving Averages", pane: "overlay" },
  { id: "chaikinv", label: "Chaikin Volatility",                    group: "Volatility",      pane: "oscillator" },
  { id: "chaikinO", label: "Chaikin Oscillator",                    group: "Volume",          pane: "oscillator" },
  { id: "majority", label: "Majority Rule",                         group: "Oscillators",     pane: "oscillator" },
];

// Sort alphabetically within each group
const IND_LIST_SORTED = [...IND_LIST].sort((a,b) => a.label.localeCompare(b.label));

const SCRIPT_NAME_HEADER = "SCRIPT NAME";

function IndicatorsPanel({ active, onToggle, onClose, favorites, onFav }: {
  active: Set<string>; onToggle: (id: string) => void; onClose: () => void;
  favorites: Set<string>; onFav: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(-1);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return IND_LIST_SORTED;
    return IND_LIST_SORTED.filter(i => i.label.toLowerCase().includes(s) || i.group.toLowerCase().includes(s));
  }, [q]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c+1, filtered.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c-1, 0)); }
    if (e.key === "Enter" && cursor >= 0) onToggle(filtered[cursor].id);
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="tc-overlay-bg" onClick={onClose}>
      <div className="tc-ind-modal2" onClick={e => e.stopPropagation()}>
        <div className="tc-ind-head">
          <span>Indicators</span>
          <button className="tc-icon-btn" onClick={onClose} style={{fontSize:16,lineHeight:1}}>✕</button>
        </div>
        <div className="tc-ind-search2">
          <Ic.Search />
          <input ref={inputRef} className="tc-sm-input" value={q} onChange={e=>{setQ(e.target.value);setCursor(-1);}}
            placeholder="Search…" autoComplete="off" onKeyDown={handleKey} />
        </div>
        <div className="tc-ind-header-row">
          <span>{SCRIPT_NAME_HEADER}</span>
        </div>
        <div className="tc-ind-body2" ref={listRef}>
          {filtered.map((ind, i) => (
            <div key={ind.id}
              className={`tc-ind-row2${i===cursor?" cursor":""}`}
              onClick={() => !ind.unavailable && onToggle(ind.id)}
              style={ind.unavailable?{opacity:0.45,cursor:"not-allowed"}:undefined}
            >
              <button className="tc-ind-star" onClick={e=>{e.stopPropagation();onFav(ind.id);}}
                title={favorites.has(ind.id)?"Remove favourite":"Add favourite"}
                style={{color:favorites.has(ind.id)?"#f59e0b":"var(--border)"}}>★</button>
              <span className="tc-ind-label2">{ind.label}</span>
              {active.has(ind.id) && <span className="tc-ind-active-dot" title="Active" />}
              {ind.unavailable && <span className="tc-ind-unavail">N/A</span>}
            </div>
          ))}
          {!filtered.length && <div className="tc-sm-empty">No indicators match "{q}"</div>}
        </div>
        <div className="tc-ind-footer2">
          {active.size > 0 && <span style={{fontSize:11,color:"var(--muted)"}}>Active: {[...active].join(", ")}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Compare Symbols Modal ──────────────────────────────────────────────────────

type CompareFilter = "All types" | "Stock" | "Index";

function CompareSymbols({ onSelect, onClose }: { onSelect: (r: SearchResult) => void; onClose: () => void }) {
  const [q, setQ]             = useState("");
  const [filter, setFilter]   = useState<CompareFilter>("All types");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor]   = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const cat = filter === "Stock" ? "Stocks" : filter === "Index" ? "Indices" : "All";
        const res = await fetch(`/api/portal/chart/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}`);
        const json = await res.json();
        setResults(json.results ?? []);
        setCursor(0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 180);
    return () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); };
  }, [q, filter]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c+1, results.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c-1, 0)); }
    if (e.key === "Enter" && results[cursor]) onSelect(results[cursor]);
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="tc-overlay-bg" onClick={onClose}>
      <div className="tc-compare-modal" onClick={e => e.stopPropagation()} onKeyDown={handleKey}>
        <div className="tc-ind-head">
          <span>Compare symbols</span>
          <button className="tc-icon-btn" onClick={onClose} style={{fontSize:16}}>✕</button>
        </div>
        <div className="tc-sm-input-row">
          <Ic.Search />
          <input ref={inputRef} className="tc-sm-input" value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Search symbol…" autoComplete="off" spellCheck={false} />
          {loading && <div className="tc-spinner-sm" />}
        </div>
        <div className="tc-compare-filters">
          {(["All types","Stock","Index"] as CompareFilter[]).map(f => (
            <button key={f} className={`tc-compare-filter-btn${filter===f?" on":""}`} onClick={()=>setFilter(f)}>{f}</button>
          ))}
        </div>
        <div className="tc-sm-header">
          <span style={{flex:1}}>SYMBOL &amp; DESCRIPTION</span>
          <span style={{width:60}}>EXCHANGE</span>
          <span style={{width:50}}>TYPE</span>
        </div>
        <div className="tc-sm-list">
          {!loading && !results.length && (
            <div className="tc-sm-empty">{q ? `No results for "${q}"` : "Type to search symbols…"}</div>
          )}
          {results.map((r, i) => (
            <div key={`${r.symbol}-${i}`}
              className={`tc-sm-row${i===cursor?" on":""}`}
              onClick={() => onSelect(r)} onMouseEnter={() => setCursor(i)}
            >
              <span style={{flex:1,minWidth:0}}>
                <span className="tc-sm-sym">{r.country === "PK" ? "🇵🇰 " : r.country === "US" ? "🇺🇸 " : "🌐 "}{r.symbol}</span>
                <span className="tc-sm-name" style={{marginLeft:8}}>{r.name}</span>
              </span>
              <span className="tc-sm-meta" style={{width:60}}>{r.exchange}</span>
              <span className="tc-sm-meta" style={{width:50}}>{r.type.toLowerCase()}</span>
            </div>
          ))}
        </div>
        <div className="tc-sm-footer">↑↓ Navigate · Enter Select · Esc Close</div>
      </div>
    </div>
  );
}

// ── Quick Search (Ctrl+K) ──────────────────────────────────────────────────────

interface QCmd { id: string; label: string; group: string; action: () => void; }

function QuickSearch({ onClose, commands }: { onClose: () => void; commands: QCmd[] }) {
  const [q, setQ]         = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return commands;
    return commands.filter(c => c.label.toLowerCase().includes(s) || c.group.toLowerCase().includes(s));
  }, [q, commands]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c+1, filtered.length-1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setCursor(c => Math.max(c-1, 0)); }
    if (e.key === "Enter" && filtered[cursor]) { filtered[cursor].action(); onClose(); }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="tc-overlay-bg" onClick={onClose} style={{paddingTop:80}}>
      <div className="tc-qs-modal" onClick={e=>e.stopPropagation()} onKeyDown={handleKey}>
        <div className="tc-ind-head" style={{borderBottom:"1px solid var(--border)"}}>
          <span>Search tool or function</span>
          <button className="tc-icon-btn" onClick={onClose} style={{fontSize:16}}>✕</button>
        </div>
        <div className="tc-sm-input-row">
          <Ic.Search />
          <input ref={inputRef} className="tc-sm-input" value={q} onChange={e=>{setQ(e.target.value);setCursor(0);}}
            placeholder="" autoComplete="off" />
        </div>
        {filtered.length === 0 && q && (
          <div className="tc-sm-empty" style={{padding:"40px 20px",fontSize:13}}>Type to search for drawings, functions and settings</div>
        )}
        {!q && (
          <div className="tc-sm-empty" style={{padding:"40px 20px",fontSize:13}}>Type to search for drawings, functions and settings</div>
        )}
        {q && filtered.length > 0 && (
          <div style={{maxHeight:360,overflowY:"auto"}}>
            {filtered.map((cmd, i) => (
              <div key={cmd.id}
                className={`tc-qs-row${i===cursor?" on":""}`}
                onClick={()=>{cmd.action();onClose();}} onMouseEnter={()=>setCursor(i)}
              >
                <span className="tc-qs-label">{cmd.label}</span>
                <span className="tc-qs-group">{cmd.group}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chart Type Dropdown ────────────────────────────────────────────────────────

const CHART_TYPE_DEFS = [
  { id: "Bars",            label: "Bars",               icon: "Bar" },
  { id: "Candlestick",     label: "Candles",             icon: "Candle" },
  { id: "HollowCandles",   label: "Hollow Candles",      icon: "Candle" },
  { id: "HLC",             label: "HLC Bars",            icon: "Bar" },
  { id: "Line",            label: "Line",                icon: "Line" },
  { id: "LineWithMarkers", label: "Line with Markers",   icon: "Line" },
  { id: "StepLine",        label: "Step Line",           icon: "Line" },
  { id: "Area",            label: "Area",                icon: "Area" },
  { id: "HLCArea",         label: "HLC Area",            icon: "Area" },
  { id: "Baseline",        label: "Baseline",            icon: "Area" },
  { id: "Columns",         label: "Columns",             icon: "Bar" },
  { id: "HighLow",         label: "High-Low",            icon: "Bar" },
  { id: "Heikin-Ashi",     label: "Heikin Ashi",         icon: "HA" },
] as const;

function ChartTypeDropdown({ current, onSelect, favTypes, onFavType }: {
  current: string; onSelect: (t: string) => void; favTypes: Set<string>; onFavType: (t: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const def = CHART_TYPE_DEFS.find(d => d.id === current) ?? CHART_TYPE_DEFS[1];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconEl = (Ic as any)[def.icon] ?? Ic.Candle;

  return (
    <div ref={ref} style={{position:"relative"}}>
      <button className={`tc-bar-btn tc-icon-btn${open?" on":""}`} title="Chart type" onClick={()=>setOpen(o=>!o)}>
        <IconEl />
        <Ic.ChevronDown />
      </button>
      {open && (
        <div className="tc-dropdown" style={{minWidth:200,left:0,top:"calc(100% + 4px)"}}>
          {CHART_TYPE_DEFS.map(ct => (
            <div key={ct.id}
              className={`tc-dd-row${current===ct.id?" selected":""}`}
              onClick={()=>{onSelect(ct.id);setOpen(false);}}
            >
              <button className="tc-ind-star" style={{color:favTypes.has(ct.id)?"#f59e0b":"var(--border)"}}
                onClick={e=>{e.stopPropagation();onFavType(ct.id);}}>★</button>
              <span style={{flex:1}}>{ct.label}</span>
              {current===ct.id && <span style={{fontSize:12,color:"var(--accent)"}}>★</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Interval Dropdown ──────────────────────────────────────────────────────────

const INTERVAL_GROUPS = [
  { label: "MINUTES",  items: [
    { id: "1m",  label: "1 minute" },
    { id: "5m",  label: "5 minutes" },
    { id: "15m", label: "15 minutes" },
    { id: "30m", label: "30 minutes" },
  ]},
  { label: "HOURS", items: [
    { id: "1h",  label: "1 hour" },
    { id: "2h",  label: "2 hours" },
    { id: "3h",  label: "3 hours" },
    { id: "4h",  label: "4 hours" },
  ]},
  { label: "DAYS", items: [
    { id: "D",   label: "1 day" },
    { id: "2D",  label: "2 days" },
    { id: "W",   label: "1 week" },
    { id: "2W",  label: "2 weeks" },
    { id: "M",   label: "1 month" },
    { id: "3M",  label: "3 months" },
    { id: "6M",  label: "6 months" },
  ]},
];

function IntervalDropdown({ current, onSelect, favIntervals, onFavInterval }: {
  current: string; onSelect: (i: string) => void; favIntervals: Set<string>; onFavInterval: (i: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={ref} style={{position:"relative"}}>
      <button className={`tc-bar-btn tc-icon-btn${open?" on":""}`} title="More intervals" onClick={()=>setOpen(o=>!o)}>
        <Ic.ChevronDown />
      </button>
      {open && (
        <div className="tc-dropdown" style={{minWidth:200,left:0,top:"calc(100% + 4px)"}}>
          {INTERVAL_GROUPS.map(grp => (
            <div key={grp.label}>
              <div className="tc-dd-group-label">{grp.label}</div>
              {grp.items.map(iv => (
                <div key={iv.id}
                  className={`tc-dd-row${current===iv.id?" selected":""}`}
                  onClick={()=>{onSelect(iv.id);setOpen(false);}}
                >
                  <button className="tc-ind-star" style={{color:favIntervals.has(iv.id)?"#f59e0b":"var(--border)"}}
                    onClick={e=>{e.stopPropagation();onFavInterval(iv.id);}}>★</button>
                  <span style={{flex:1}}>{iv.label}</span>
                  {favIntervals.has(iv.id) && <span style={{fontSize:10,color:"#f59e0b"}}>★</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Drawing toolbar definition ─────────────────────────────────────────────────

type SubMenuItem = { id: string; label: string; icon: () => React.ReactElement; shortcut?: string };
type SubMenuSection = { title?: string; items: SubMenuItem[] };
type DrawTool = { id: string; icon: () => React.ReactElement; label: string; submenu?: SubMenuSection[] };

const DRAW_TOOLS: (DrawTool | null)[] = [
  { id: "cross", icon: Ic.Crosshair, label: "Crosshair" },
  null,
  {
    id: "trend", icon: Ic.Trendline, label: "Trendline",
    submenu: [
      { title: "LINES", items: [
        { id: "trend",      label: "Trendline",         icon: Ic.Trendline,  shortcut: "Alt+T" },
        { id: "ray",        label: "Ray",               icon: Ic.Ray },
        { id: "infoline",   label: "Info line",         icon: Ic.InfoLine },
        { id: "extline",    label: "Extended line",     icon: Ic.ExtLine },
        { id: "trendangle", label: "Trend angle",       icon: Ic.TrendAngle },
        { id: "hline",      label: "Horizontal line",   icon: Ic.HLine,      shortcut: "Alt+H" },
        { id: "hray",       label: "Horizontal ray",    icon: Ic.HRay,       shortcut: "Alt+J" },
        { id: "vline",      label: "Vertical line",     icon: Ic.VLine,      shortcut: "Alt+V" },
        { id: "crossline",  label: "Crossline",         icon: Ic.CrossLine,  shortcut: "Alt+C" },
      ]},
      { title: "CHANNELS", items: [
        { id: "channel",    label: "Parallel channel",  icon: Ic.Channel },
        { id: "regtrend",   label: "Regression trend",  icon: Ic.RegTrend },
        { id: "hlines",     label: "Flat top/bottom",   icon: Ic.HLines },
        { id: "disjoint",   label: "Disjoint channel",  icon: Ic.Disjoint },
      ]},
    ],
  },
  null,
  {
    id: "fib", icon: Ic.Fib, label: "Fib Retracement",
    submenu: [
      { title: "FIBONACCI", items: [
        { id: "fib",        label: "Fib Retracement",             icon: Ic.Fib },
        { id: "fibext",     label: "Fib Extension",               icon: Ic.FibExt },
        { id: "fibtbext",   label: "Trend-Based Fib Extension",   icon: Ic.FibExt },
        { id: "fibfan",     label: "Fib Speed Resistance Fan",    icon: Ic.FibFan },
        { id: "fibcircle",  label: "Fib Circle",                  icon: Ic.FibCircle },
        { id: "fibwedge",   label: "Fib Wedge",                   icon: Ic.FibWedge },
        { id: "fibchannel", label: "Fib Channel",                 icon: Ic.Fib },
        { id: "fibarc",     label: "Fib Arc",                     icon: Ic.FibArc },
        { id: "fibspiral",  label: "Fib Spiral",                  icon: Ic.FibCircle },
        { id: "fibtbret",   label: "Trend-Based Fib Retracement", icon: Ic.Fib },
      ]},
    ],
  },
  null,
  {
    id: "pattern", icon: Ic.Patterns, label: "Patterns",
    submenu: [
      { title: "HARMONIC PATTERNS", items: [
        { id: "abcd",       label: "ABCD Pattern",            icon: Ic.Patterns },
        { id: "xabcd",      label: "XABCD Pattern",           icon: Ic.Patterns },
        { id: "cypher",     label: "Cypher Pattern",          icon: Ic.Patterns },
        { id: "headshould", label: "Head and Shoulders",      icon: Ic.Patterns },
        { id: "ihs",        label: "Inv. Head and Shoulders", icon: Ic.Patterns },
      ]},
      { title: "ELLIOTT WAVES", items: [
        { id: "elliottimpulse",  label: "Elliott Impulse Wave (12345)", icon: Ic.Patterns },
        { id: "elliottcorrect",  label: "Elliott Correction Wave (ABC)", icon: Ic.Patterns },
        { id: "elliotttriangl",  label: "Elliott Triangle Wave (ABCDE)", icon: Ic.Patterns },
        { id: "elliottdouble",   label: "Elliott Double Combo Wave (WXY)", icon: Ic.Patterns },
        { id: "elliotttriple",   label: "Elliott Triple Combo Wave (WXYXZ)", icon: Ic.Patterns },
      ]},
    ],
  },
  null,
  {
    id: "pricerange", icon: Ic.Prediction, label: "Prediction and measurement tools",
    submenu: [
      { title: "MEASUREMENT", items: [
        { id: "pricerange",  label: "Price Range",         icon: Ic.Prediction },
        { id: "daterange",   label: "Date Range",          icon: Ic.Prediction },
        { id: "datepricerange", label: "Date and Price Range", icon: Ic.Prediction },
        { id: "bars",        label: "Bar Pattern",         icon: Ic.Prediction },
        { id: "ghostfeed",   label: "Ghost Feed",          icon: Ic.Prediction },
        { id: "projection",  label: "Long Position",       icon: Ic.Prediction },
        { id: "shortpos",    label: "Short Position",      icon: Ic.Prediction },
        { id: "forecast",    label: "Forecast",            icon: Ic.Prediction },
      ]},
    ],
  },
  null,
  {
    id: "rect", icon: Ic.Rect, label: "Geometric shapes",
    submenu: [
      { title: "BRUSHES", items: [
        { id: "brush",       label: "Brush",             icon: Ic.Brush },
        { id: "highlighter", label: "Highlighter",       icon: Ic.Highlighter },
      ]},
      { title: "ARROWS", items: [
        { id: "arrowmarker", label: "Arrow marker",      icon: Ic.ArrowMarker },
        { id: "arrow",       label: "Arrow",             icon: Ic.Arrow },
        { id: "arrowup",     label: "Arrow mark up",     icon: Ic.ArrowUp2 },
        { id: "arrowdown",   label: "Arrow mark down",   icon: Ic.ArrowDown2 },
        { id: "arrowleft",   label: "Arrow mark left",   icon: Ic.ArrowLeft2 },
        { id: "arrowright",  label: "Arrow mark right",  icon: Ic.ArrowRight2 },
      ]},
      { title: "SHAPES", items: [
        { id: "rect",        label: "Rectangle",         icon: Ic.Rect,        shortcut: "Alt+Shift+R" },
        { id: "rectrot",     label: "Rotated rectangle", icon: Ic.RotatedRect },
        { id: "pathshape",   label: "Path",              icon: Ic.PathTool },
        { id: "circle",      label: "Circle",            icon: Ic.Circle },
        { id: "ellipse",     label: "Ellipse",           icon: Ic.Ellipse },
        { id: "triangle",    label: "Triangle",          icon: Ic.Triangle },
      ]},
    ],
  },
  null,
  { id: "ruler",    icon: Ic.Ruler,    label: "Measure" },
  { id: "zoom",     icon: Ic.ZoomPlus, label: "Zoom In" },
  null,
  { id: "text",     icon: Ic.Text,     label: "Text" },
  { id: "emoji",    icon: Ic.Emoji,    label: "Annotations" },
  null,
  { id: "magnet",   icon: Ic.Magnet,   label: "Magnet Mode" },
  { id: "lockdraw", icon: Ic.LockDraw, label: "Stay in Drawing Mode" },
  { id: "lock",     icon: Ic.Lock,     label: "Lock All Drawings" },
  { id: "eye",      icon: Ic.Eye,      label: "Visibility" },
  { id: "trash",    icon: Ic.Trash,    label: "Delete Selected" },
  { id: "layers",   icon: Ic.Layers,   label: "Layers" },
];

// Map new tool IDs to their underlying draw handler alias
const TOOL_ALIAS: Record<string, string> = {
  infoline: "trend", extline: "trend", trendangle: "trend",
  hray: "hline", crossline: "hline",
  regtrend: "channel", disjoint: "channel",
  fibext: "fib", fibtbext: "fib", fibfan: "fib", fibcircle: "fib",
  fibwedge: "fib", fibchannel: "channel", fibarc: "fib",
  fibspiral: "fib", fibtbret: "fib",
  brush: "text", highlighter: "text",
  arrowmarker: "trend", arrow: "trend",
  arrowup: "text", arrowdown: "text", arrowleft: "text", arrowright: "text",
  rectrot: "rect", pathshape: "trend", circle: "fib", ellipse: "fib",
  abcd: "trend", xabcd: "trend", cypher: "trend",
  headshould: "trend", ihs: "trend",
  elliottimpulse: "trend", elliottcorrect: "trend", elliotttriangl: "trend",
  elliottdouble: "trend", elliotttriple: "trend",
  pricerange: "ruler", daterange: "ruler", datepricerange: "ruler",
  bars: "ruler", ghostfeed: "trend", projection: "trend", shortpos: "trend", forecast: "trend",
  lockdraw: "cross",
};

// ── Persistent theme key (separate from everything else) ───────────────────────

const THEME_KEY = "stockifyy-tc-theme-v2";
function getStoredTheme() {
  if (typeof window === "undefined") return false;
  try { return localStorage.getItem(THEME_KEY) === "dark"; } catch { return false; }
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function TechnicalChartClient() {
  // Symbol & data
  const [symbol, setSymbol]           = useState("KSE100");
  const [symbolMeta, setSymbolMeta]   = useState<SearchResult>({ symbol: "KSE100", name: "KSE-100 Index", type: "Index", exchange: "PSX", country: "PK", sector: "Index", dataStatus: "PSX_EOD" });
  const [quote, setQuote]             = useState<Quote | null>(null);
  const [dataStatus, setDataStatus]   = useState("DEMO");
  const [dataMessage, setDataMessage] = useState("Loading…");
  const [isDemo, setIsDemo]           = useState(true);
  const [candles, setCandles]         = useState<Candle[]>(DEMO_CANDLES);
  const [loading, setLoading]         = useState(false);

  // Chart controls
  const [interval, setIntervalVal]    = useState<string>("D");
  const [chartType, setChartType]     = useState<string>("Candlestick");
  const [activeRange, setActiveRange] = useState("1y");
  const [isDark, setIsDarkRaw]        = useState(false); // always light on first render (SSR safe)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch]   = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string|null>(null);
  const submenuRef = useRef<HTMLDivElement|null>(null);
  const [activeIndicators, setActiveInd]   = useState<Set<string>>(new Set(["vol"]));
  const [favIndicators, setFavInd]    = useState<Set<string>>(new Set());
  const [favTypes, setFavTypes]       = useState<Set<string>>(new Set(["Candlestick","Line","Heikin-Ashi"]));
  const [favIntervals, setFavIntervals] = useState<Set<string>>(new Set(["1h","D","W","M"]));
  const [compareSymbols, setCompareSym] = useState<SearchResult[]>([]);
  const [activeTool, setActiveTool]   = useState("cross");
  const [chartReady, setChartReady]   = useState(false);

  // Hydrate theme from localStorage after mount — never overrides the light default unless user previously set dark
  useEffect(() => { setIsDarkRaw(getStoredTheme()); }, []);

  const setIsDark = useCallback((val: boolean | ((p: boolean) => boolean)) => {
    setIsDarkRaw(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      try { localStorage.setItem(THEME_KEY, next ? "dark" : "light"); } catch {}
      return next;
    });
  }, []);

  // Refs
  const containerRef  = useRef<HTMLDivElement>(null);
  const chartRef      = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const priceRef      = useRef<any>(null);
  const volRef        = useRef<ISeriesApi<"Histogram"> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const indRef        = useRef<Map<string, any[]>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compareRef    = useRef<Map<string, any>>(new Map());
  const lcRef         = useRef<typeof import("lightweight-charts") | null>(null);
  const chartTypeRef  = useRef(chartType);
  const isDarkRef     = useRef(isDark);
  const indActiveRef  = useRef(activeIndicators);
  const candlesRef    = useRef(candles);

  useEffect(() => { chartTypeRef.current  = chartType; },         [chartType]);
  useEffect(() => { isDarkRef.current     = isDark; },            [isDark]);
  useEffect(() => { indActiveRef.current  = activeIndicators; },  [activeIndicators]);
  useEffect(() => { candlesRef.current    = candles; },           [candles]);

  // ── Init chart once ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;
    let dead = false;

    (async () => {
      const lc = await import("lightweight-charts");
      if (dead || !containerRef.current) return;
      lcRef.current = lc;

      const th = themeOpts(isDarkRef.current);
      const opts: DeepPartial<ChartOptions> = {
        layout: { background: { color: th.bg }, textColor: th.text, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", fontSize: 11 },
        grid: th.grid,
        crosshair: {
          mode: lc.CrosshairMode.Normal,
          vertLine: { color: th.cross, width: 1, style: lc.LineStyle.Dashed, labelBackgroundColor: "#2962ff" },
          horzLine: { color: th.cross, width: 1, style: lc.LineStyle.Dashed, labelBackgroundColor: "#2962ff" },
        },
        rightPriceScale: { borderColor: th.border, scaleMargins: { top: 0.1, bottom: 0.2 } },
        timeScale: { borderColor: th.border, timeVisible: true, secondsVisible: false, fixLeftEdge: false, fixRightEdge: false },
        handleScale: { axisPressedMouseMove: { time: true, price: true } },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        autoSize: true,
      };

      const chart = lc.createChart(containerRef.current, opts);
      chartRef.current = chart;

      // Volume series
      const vol = chart.addSeries(lc.HistogramSeries, {
        color: "#089981", priceFormat: { type: "volume" }, priceScaleId: "vol",
      });
      vol.priceScale().applyOptions({ scaleMargins: { top: 0.75, bottom: 0 } });
      volRef.current = vol;

      // Price series
      addPriceSeries(lc, chart, chartTypeRef.current, isDarkRef.current);

      setChartReady(true);
    })();

    return () => {
      dead = true;
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
      priceRef.current = null; volRef.current = null; indRef.current.clear();
      setChartReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Add price series ───────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addPriceSeries(lc: any, chart: IChartApi, type: string, dark: boolean) {
    const up = "#089981", dn = "#f23645";
    void dark;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let s: any;
    switch (type) {
      case "Bars":
      case "HLC":        s = chart.addSeries(lc.BarSeries, { upColor: up, downColor: dn }); break;
      case "Line":
      case "LineWithMarkers":
      case "StepLine":   s = chart.addSeries(lc.LineSeries, { color: "#2962ff", lineWidth: 2 }); break;
      case "Area":
      case "HLCArea":
      case "Baseline":   s = chart.addSeries(lc.AreaSeries, { topColor: "rgba(41,98,255,0.28)", bottomColor: "rgba(41,98,255,0)", lineColor: "#2962ff", lineWidth: 2 }); break;
      case "Columns":    s = chart.addSeries(lc.HistogramSeries, { color: "#2962ff" }); break;
      case "HighLow":    s = chart.addSeries(lc.BarSeries, { upColor: up, downColor: dn }); break;
      case "HollowCandles":
      case "Heikin-Ashi":
      default:           s = chart.addSeries(lc.CandlestickSeries, { upColor: up, downColor: dn, borderUpColor: up, borderDownColor: dn, wickUpColor: up, wickDownColor: dn });
    }
    priceRef.current = s;
  }

  // ── Apply theme without recreating chart ───────────────────────────────────
  useEffect(() => {
    if (!chartRef.current) return;
    const th = themeOpts(isDark);
    chartRef.current.applyOptions({
      layout: { background: { color: th.bg }, textColor: th.text },
      grid: th.grid,
      crosshair: { vertLine: { color: th.cross }, horzLine: { color: th.cross } },
      rightPriceScale: { borderColor: th.border },
      timeScale: { borderColor: th.border },
    });
  }, [isDark]);

  // ── Switch chart type without destroying chart ─────────────────────────────
  useEffect(() => {
    if (!chartRef.current || !lcRef.current || !chartReady) return;
    if (priceRef.current) { try { chartRef.current.removeSeries(priceRef.current); } catch {} priceRef.current = null; }
    addPriceSeries(lcRef.current, chartRef.current, chartType, isDarkRef.current);
    if (candlesRef.current.length) feedData(candlesRef.current, chartType);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, chartReady]);

  // ── Feed data to chart ─────────────────────────────────────────────────────
  function feedData(data: Candle[], type: string) {
    if (!priceRef.current) return;
    const display = (type === "Heikin-Ashi") ? heikinAshi(data) : data;
    const lineTypes = ["Line","LineWithMarkers","StepLine","Area","HLCArea","Baseline"];
    const histTypes = ["Columns"];
    if (lineTypes.includes(type)) {
      priceRef.current.setData(display.map(c => ({ time: c.time as Time, value: c.close })));
    } else if (histTypes.includes(type)) {
      priceRef.current.setData(display.map(c => ({ time: c.time as Time, value: c.close, color: c.close >= c.open ? "#089981" : "#f23645" })));
    } else {
      priceRef.current.setData(display.map(c => ({ time: c.time as Time, open: c.open, high: c.high, low: c.low, close: c.close } as CandlestickData<Time>)));
    }
    if (volRef.current) {
      volRef.current.setData(data.map(c => ({
        time: c.time as Time, value: c.volume,
        color: c.close >= c.open ? "rgba(8,153,129,0.5)" : "rgba(242,54,69,0.5)",
      } as HistogramData<Time>)));
    }
    chartRef.current?.timeScale().fitContent();
  }

  // Feed on data change
  useEffect(() => {
    if (!chartReady || !candles.length) return;
    feedData(candles, chartType);
    applyIndicators(candles);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, chartReady]);

  // ── Indicators ─────────────────────────────────────────────────────────────
  function applyIndicators(data: Candle[]) {
    if (!chartRef.current || !lcRef.current) return;
    for (const s of indRef.current.values()) for (const x of s) { try { chartRef.current.removeSeries(x); } catch {} }
    indRef.current.clear();
    if (!data.length) return;

    const lc = lcRef.current;
    const ind = indActiveRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const LC = lc as any;

    const line = (key: string, ld: LineData<Time>[], color: string, title: string, scaleId?: string) => {
      if (!chartRef.current) return;
      const opts: Record<string,unknown> = { color, lineWidth: 1, title, priceLineVisible: false, lastValueVisible: true };
      if (scaleId) opts.priceScaleId = scaleId;
      const s = chartRef.current.addSeries(LC.LineSeries, opts);
      s.setData(ld);
      if (scaleId) s.priceScale().applyOptions({ scaleMargins: { top: 0.7, bottom: 0 }, visible: true });
      indRef.current.set(key, [...(indRef.current.get(key) ?? []), s]);
    };
    const hist = (key: string, ld: HistogramData<Time>[], color: string, title: string, scaleId: string) => {
      if (!chartRef.current) return;
      const s = chartRef.current.addSeries(LC.HistogramSeries, { color, title, priceScaleId: scaleId, priceLineVisible: false, lastValueVisible: true });
      s.setData(ld);
      s.priceScale().applyOptions({ scaleMargins: { top: 0.7, bottom: 0 } });
      indRef.current.set(key, [...(indRef.current.get(key) ?? []), s]);
    };

    // ── Overlay ─────────────────────────────────────────────────────────────
    if (ind.has("sma20"))      line("sma20",    calcSMA(data, 20),      "#f59e0b", "SMA 20");
    if (ind.has("sma50"))      line("sma50",    calcSMA(data, 50),      "#8b5cf6", "SMA 50");
    if (ind.has("sma200"))     line("sma200",   calcSMA(data, 200),     "#ef4444", "SMA 200");
    if (ind.has("ema9"))       line("ema9",     calcEMA(data, 9),       "#06b6d4", "EMA 9");
    if (ind.has("ema20"))      line("ema20",    calcEMA(data, 20),      "#f97316", "EMA 20");
    if (ind.has("ema50"))      line("ema50",    calcEMA(data, 50),      "#10b981", "EMA 50");
    if (ind.has("dema"))       line("dema",     calcDEMA(data, 21),     "#a855f7", "DEMA 21");
    if (ind.has("tema"))       line("tema",     calcDEMA(data, 21),     "#ec4899", "TEMA 21");
    if (ind.has("hma"))        line("hma",      calcHMA(data, 14),      "#0ea5e9", "HMA 14");
    if (ind.has("smma20"))     line("smma20",   calcSMA(data, 20),      "#84cc16", "SMMA 20");
    if (ind.has("wma")) {
      const wma: LineData<Time>[] = [];
      const p = 20;
      for (let i = p-1; i < data.length; i++) {
        let num=0,den=0;
        for(let j=0;j<p;j++){num+=data[i-j].close*(p-j);den+=p-j;}
        wma.push({time:data[i].time as Time,value:num/den});
      }
      line("wma", wma, "#f43f5e", "WMA 20");
    }
    if (ind.has("lsma"))       line("lsma",     calcLinearReg(data, 14),  "#14b8a6", "LSMA 14");
    if (ind.has("linreg"))     line("linreg",   calcLinearReg(data, 14),  "#64748b", "LinReg 14");
    if (ind.has("sar"))        line("sar",      calcParabolicSAR(data),   "#f59e0b", "SAR");
    if (ind.has("vwap"))       line("vwap",     calcVWAP(data),           "#7c3aed", "VWAP");
    if (ind.has("typical"))    line("typical",  calcTypicalPrice(data),   "#64748b", "TP");
    if (ind.has("median"))     line("median",   calcMedianPrice(data),    "#94a3b8", "Med");
    if (ind.has("52whl")) {
      const w52H: LineData<Time>[]=[], w52L: LineData<Time>[]=[];
      for(let i=251;i<data.length;i++){
        const sl=data.slice(i-251,i+1);
        w52H.push({time:data[i].time as Time,value:Math.max(...sl.map(c=>c.high))});
        w52L.push({time:data[i].time as Time,value:Math.min(...sl.map(c=>c.low))});
      }
      line("52whl_h", w52H, "#089981", "52W H");
      line("52whl_l", w52L, "#f23645", "52W L");
    }
    if (ind.has("bb")) {
      const { upper, mid: bMid, lower } = calcBB(data);
      line("bb_u", upper, "rgba(100,116,139,0.7)", "BB+");
      line("bb_m", bMid,  "rgba(100,116,139,0.9)", "BB");
      line("bb_l", lower, "rgba(100,116,139,0.7)", "BB-");
    }
    if (ind.has("keltner")) {
      const { upper, mid: kMid, lower } = calcKeltner(data);
      line("kelt_u", upper, "rgba(124,58,237,0.7)", "Kelt+");
      line("kelt_m", kMid,  "rgba(124,58,237,0.9)", "Kelt");
      line("kelt_l", lower, "rgba(124,58,237,0.7)", "Kelt-");
    }
    if (ind.has("donchian")) {
      const { upper, lower, mid: dMid } = calcDonchian(data);
      line("don_u", upper, "rgba(14,165,233,0.7)", "Don+");
      line("don_m", dMid,  "rgba(14,165,233,0.5)", "Don");
      line("don_l", lower, "rgba(14,165,233,0.7)", "Don-");
    }
    if (ind.has("envelopes")) {
      const { upper, lower } = calcEnvelopes(data);
      line("env_u", upper, "rgba(249,115,22,0.6)", "Env+");
      line("env_l", lower, "rgba(249,115,22,0.6)", "Env-");
    }
    if (ind.has("ichimoku")) {
      const ich = calcIchimoku(data);
      line("ich_t", ich.tenkan,  "#ef4444", "Tenkan");
      line("ich_k", ich.kijun,   "#2563eb", "Kijun");
      line("ich_a", ich.senkouA, "rgba(8,153,129,0.3)", "Senkou A");
      line("ich_b", ich.senkouB, "rgba(242,54,69,0.3)", "Senkou B");
      line("ich_c", ich.chikou,  "#8b5cf6", "Chikou");
    }
    if (ind.has("supertrend")) {
      const { up, dn: stDn } = calcSuperTrend(data);
      line("st_u", up,   "#089981", "ST↑");
      line("st_d", stDn, "#f23645", "ST↓");
    }
    if (ind.has("emacross")) {
      line("ec_f", calcEMA(data, 9),  "#2563eb", "EMA 9");
      line("ec_s", calcEMA(data, 21), "#f59e0b", "EMA 21");
    }
    if (ind.has("macross")) {
      line("mc_f", calcSMA(data, 10), "#2563eb", "SMA 10");
      line("mc_s", calcSMA(data, 30), "#f59e0b", "SMA 30");
    }
    if (ind.has("maemacross")) {
      line("mec_f", calcSMA(data, 20),  "#2563eb", "SMA 20");
      line("mec_s", calcEMA(data, 20), "#f59e0b", "EMA 20");
    }
    if (ind.has("guppy")) {
      const cols=["#ef4444","#f97316","#eab308","#22c55e","#14b8a6","#3b82f6","#8b5cf6","#ec4899","#64748b","#06b6d4","#84cc16","#f43f5e"];
      const periods=[3,5,8,10,12,15,30,35,40,45,50,60];
      periods.forEach((p,i)=>line(`gup_${p}`,calcEMA(data,p),cols[i%cols.length],`EMA ${p}`));
    }
    if (ind.has("machannel")) {
      const mc=calcSMA(data,20); const stdv=calcStdDev(data,20); const minL=Math.min(mc.length,stdv.length);
      const u=mc.slice(-minL).map((v,i)=>({time:v.time,value:v.value+stdv[stdv.length-minL+i].value}));
      const l=mc.slice(-minL).map((v,i)=>({time:v.time,value:v.value-stdv[stdv.length-minL+i].value}));
      line("mach_u", u, "rgba(99,102,241,0.6)", "MA Ch+");
      line("mach_m", mc.slice(-minL), "rgba(99,102,241,0.9)", "MA Ch");
      line("mach_l", l, "rgba(99,102,241,0.6)", "MA Ch-");
    }
    if (ind.has("madouble")) {
      line("mad_1", calcSMA(data,10), "#f59e0b", "MA 10");
      line("mad_2", calcSMA(data,20), "#8b5cf6", "MA 20");
    }
    if (ind.has("mamult")) {
      [10,20,50,100,200].forEach((p,i)=>{
        const cols=["#f59e0b","#8b5cf6","#06b6d4","#10b981","#ef4444"];
        line(`mam_${p}`, calcSMA(data,p), cols[i], `SMA ${p}`);
      });
    }
    if (ind.has("pivots")) {
      if (data.length > 1) {
        const prev = data[data.length-2];
        const pp = (prev.high+prev.low+prev.close)/3;
        const last2 = data[data.length-1];
        [
          {v:pp, c:"#64748b", t:"PP"},
          {v:2*pp-prev.low, c:"#089981", t:"R1"},
          {v:pp+(prev.high-prev.low), c:"#10b981", t:"R2"},
          {v:2*pp-prev.high, c:"#f23645", t:"S1"},
          {v:pp-(prev.high-prev.low), c:"#ef4444", t:"S2"},
        ].forEach(({v,c,t})=>line(`piv_${t}`,[{time:last2.time as Time,value:v}],c,t));
      }
    }
    if (ind.has("pricechan")) {
      const { upper, lower } = calcDonchian(data, 20);
      line("pc_u", upper, "rgba(14,165,233,0.6)", "PC+");
      line("pc_l", lower, "rgba(14,165,233,0.6)", "PC-");
    }
    if (ind.has("walligator")) {
      line("wa_j", calcSMA(data, 13), "#2563eb", "Jaw");
      line("wa_t", calcSMA(data, 8),  "#f23645", "Teeth");
      line("wa_l", calcSMA(data, 5),  "#089981", "Lips");
    }
    if (ind.has("mcginley")) {
      const r:LineData<Time>[]=[]; const p=14; let k=data[0].close;
      data.forEach((c,i)=>{ if(i>0)k=k+((c.close-k)/(p*Math.pow(c.close/k,4)||1)); r.push({time:c.time as Time,value:k}); });
      line("mcg", r, "#a855f7", "McGinley 14");
    }
    if (ind.has("maadaptive")) {
      const r:LineData<Time>[]=[]; const fast=2/(2+1),slow=2/(30+1);
      let ama=data[0].close;
      data.forEach((c,i)=>{
        if(i>0){const efr=data.slice(Math.max(0,i-9),i+1); const d=efr.reduce((s,x,j)=>s+(j>0?Math.abs(x.close-efr[j-1].close):0),0); const v=d===0?0:Math.abs(c.close-efr[0].close)/d; const sc=Math.pow(v*(fast-slow)+slow,2); ama=ama+sc*(c.close-ama);}
        r.push({time:c.time as Time,value:ama});
      });
      line("ma_adapt", r, "#0ea5e9", "Adaptive MA");
    }

    // ── Volume (separate pane) ───────────────────────────────────────────────
    if (ind.has("vol") && volRef.current) {
      // already handled by volRef
    }
    if (ind.has("obv"))        line("obv",      calcOBV(data),          "#3b82f6", "OBV",       "osc_obv");
    if (ind.has("netvol"))     hist("netvol",   calcNetVolume(data).map(v=>({...v,color:v.value>=0?"rgba(8,153,129,0.7)":"rgba(242,54,69,0.7)"})) as HistogramData<Time>[], "#3b82f6", "Net Vol", "osc_netvol");
    if (ind.has("pvt")) {
      const pvtData:LineData<Time>[]=[]; let pvt=0;
      data.forEach((c,i)=>{if(i>0)pvt+=((c.close-data[i-1].close)/data[i-1].close)*c.volume;pvtData.push({time:c.time as Time,value:pvt});});
      line("pvt", pvtData, "#8b5cf6", "PVT", "osc_pvt");
    }
    if (ind.has("accdist")) {
      const ad:LineData<Time>[]=[]; let cum=0;
      data.forEach(c=>{const hl=c.high-c.low;cum+=hl===0?0:(2*c.close-c.high-c.low)/hl*c.volume;ad.push({time:c.time as Time,value:cum});});
      line("accdist", ad, "#14b8a6", "A/D", "osc_ad");
    }
    if (ind.has("volosc"))     line("volosc",   calcVolOsc(data),        "#f59e0b", "Vol Osc",   "osc_volosc");

    // ── Oscillators (separate pane) ──────────────────────────────────────────
    if (ind.has("rsi"))        line("rsi",      calcRSI(data, 14),       "#7c3aed", "RSI 14",    "osc_rsi");
    if (ind.has("stochrsi"))   line("stochrsi", calcStochRSI(data, 14, 14), "#6366f1","StochRSI", "osc_stochrsi");
    if (ind.has("mfi"))        line("mfi",      calcMFI(data, 14),       "#06b6d4", "MFI 14",    "osc_mfi");
    if (ind.has("cmf"))        line("cmf",      calcCMF(data, 20),       "#10b981", "CMF 20",    "osc_cmf");
    if (ind.has("cci"))        line("cci",      calcCCI(data, 20),       "#f97316", "CCI 20",    "osc_cci");
    if (ind.has("willr"))      line("willr",    calcWilliamsR(data, 14), "#ef4444", "W%R 14",    "osc_willr");
    if (ind.has("atr"))        line("atr",      calcATR(data, 14),       "#f59e0b", "ATR 14",    "osc_atr");
    if (ind.has("bbpctb"))     line("bbpctb",   calcBBpctB(data),        "#8b5cf6", "BB %B",     "osc_bbpctb");
    if (ind.has("bbwidth"))    line("bbwidth",  calcBBWidth(data),       "#06b6d4", "BB Width",  "osc_bbwidth");
    if (ind.has("stddev"))     line("stddev",   calcStdDev(data, 20),    "#64748b", "StdDev 20", "osc_stddev");
    if (ind.has("roc"))        line("roc",      calcROC(data, 14),       "#14b8a6", "ROC 14",    "osc_roc");
    if (ind.has("mom"))        line("mom",      calcMomentum(data, 10),  "#f43f5e", "Mom 10",    "osc_mom");
    if (ind.has("bop"))        line("bop",      calcBalance(data),       "#8b5cf6", "BOP",       "osc_bop");
    if (ind.has("ao")) {
      const aoData = calcAO(data);
      hist("ao", aoData.map((v,i)=>({...v,color:i===0?"#089981":v.value>=(aoData[i-1]?.value??v.value)?"#089981":"#f23645"})) as HistogramData<Time>[], "#089981", "AO", "osc_ao");
    }
    if (ind.has("mass"))       line("mass",     calcMassIndex(data),     "#f97316", "Mass",      "osc_mass");
    if (ind.has("uo"))         line("uo",       calcUltimateOscillator(data), "#3b82f6", "UO",   "osc_uo");
    if (ind.has("chop"))       line("chop",     calcChoppiness(data, 14),"#94a3b8", "Chop 14",   "osc_chop");
    if (ind.has("chande"))     line("chande",   calcChandeMO(data, 20),  "#ec4899", "CMO 20",    "osc_chande");
    if (ind.has("kst")) {
      const { kst, signal } = calcKnowSureThing(data);
      line("kst_k",   kst,    "#3b82f6", "KST",   "osc_kst");
      line("kst_sig", signal, "#f59e0b", "KST Sig","osc_kst");
    }
    if (ind.has("trix")) {
      const e1=calcEMA(data,15), e1c=e1.map(v=>({...data[0],close:v.value,open:v.value,high:v.value,low:v.value,volume:0}));
      const e2=calcEMA(e1c,15), e2c=e2.map(v=>({...data[0],close:v.value,open:v.value,high:v.value,low:v.value,volume:0}));
      const e3=calcEMA(e2c,15);
      const trixData=e3.slice(1).map((v,i)=>({time:v.time,value:e3[i].value===0?0:(v.value-e3[i].value)/e3[i].value*100}));
      line("trix", trixData, "#a855f7", "TRIX", "osc_trix");
    }
    if (ind.has("linregslope")) line("lrs",     calcLinearRegSlope(data, 14), "#0ea5e9","LinReg Slope","osc_lrs");
    if (ind.has("histvol")) {
      const hvData=calcStdDev(data,20).map(v=>({time:v.time,value:v.value*Math.sqrt(252)}));
      line("histvol", hvData, "#64748b", "Hist Vol", "osc_histvol");
    }
    if (ind.has("dpo")) {
      const p=20,shift=Math.floor(p/2)+1;
      const sma=calcSMA(data,p);
      const dpo:LineData<Time>[]=[];
      for(let i=shift;i<sma.length;i++) dpo.push({time:sma[i].time,value:data[i+p-1+shift < data.length ? i+p-1 : data.length-1].close - sma[i].value});
      line("dpo", dpo, "#f43f5e", "DPO 20", "osc_dpo");
    }
    if (ind.has("eom")) {
      const eomData:LineData<Time>[]=[]; const p=14;
      const raw=data.slice(1).map((c,i)=>{const pm=(data[i].high+data[i].low)/2,cm=(c.high+c.low)/2;const bv=c.volume/1e6/(c.high-c.low||1);return{time:c.time as Time,value:bv===0?0:(cm-pm)/bv};});
      for(let i=p-1;i<raw.length;i++) eomData.push({time:raw[i].time,value:raw.slice(i-p+1,i+1).reduce((s,v)=>s+v.value,0)/p});
      line("eom", eomData, "#10b981", "EOM 14", "osc_eom");
    }
    if (ind.has("efi")) {
      const efiData:LineData<Time>[]=[];
      for(let i=1;i<data.length;i++) efiData.push({time:data[i].time as Time,value:(data[i].close-data[i-1].close)*data[i].volume});
      line("efi", efiData, "#ef4444", "EFI", "osc_efi");
    }
    if (ind.has("macd") || ind.has("priceoscil")) {
      const key = ind.has("macd") ? "macd" : "priceoscil";
      const { macd: ml, signal: sl, hist: hl } = calcMACD(data);
      line(`${key}_m`, ml, "#2962ff", "MACD",   `osc_${key}`);
      line(`${key}_s`, sl, "#ff6d00", "Signal", `osc_${key}`);
      hist(`${key}_h`, hl.map(v=>({...v,color:v.value>=0?"rgba(8,153,129,0.7)":"rgba(242,54,69,0.7)"})) as HistogramData<Time>[], "#089981", "Hist", `osc_${key}`);
    }
    if (ind.has("stoch")) {
      const { k: sk, d: sd } = calcStoch(data);
      line("stoch_k", sk, "#2563eb", "K",  "osc_stoch");
      line("stoch_d", sd, "#f97316", "D",  "osc_stoch");
    }
    if (ind.has("adx") || ind.has("dmi")) {
      const { adx: adxData, diPlus, diMinus } = calcADX(data);
      const key = ind.has("adx") ? "adx" : "dmi";
      if (ind.has("adx")) line("adx_l", adxData, "#f59e0b", "ADX 14", "osc_adx");
      line(`${key}_p`, diPlus,  "#089981", "+DI", `osc_${key}`);
      line(`${key}_m`, diMinus, "#f23645", "-DI", `osc_${key}`);
    }
    if (ind.has("aroon")) {
      const { up: ar_u, dn: ar_d } = calcAroon(data, 25);
      line("aroon_u", ar_u, "#089981", "Aroon↑", "osc_aroon");
      line("aroon_d", ar_d, "#f23645", "Aroon↓", "osc_aroon");
    }
    if (ind.has("vortex") || ind.has("vortexind")) {
      const key = ind.has("vortex") ? "vortex" : "vortexind";
      const p=14;
      const vp:LineData<Time>[]=[],vm:LineData<Time>[][]=[[],[]];
      const trs=data.slice(1).map((c,i)=>Math.max(c.high,data[i].close)-Math.min(c.low,data[i].close));
      const vmp=data.slice(1).map((c,i)=>Math.abs(c.high-data[i].low));
      const vmm=data.slice(1).map((c,i)=>Math.abs(c.low-data[i].high));
      for(let i=p-1;i<trs.length;i++){
        const st=trs.slice(i-p+1,i+1).reduce((a,b)=>a+b,0);
        const sp=vmp.slice(i-p+1,i+1).reduce((a,b)=>a+b,0);
        const sm=vmm.slice(i-p+1,i+1).reduce((a,b)=>a+b,0);
        vp.push({time:data[i+1].time as Time,value:st===0?1:sp/st});
        vm[0].push({time:data[i+1].time as Time,value:st===0?1:sm/st});
      }
      line(`${key}_p`, vp, "#089981", "VI+", `osc_${key}`);
      line(`${key}_m`, vm[0], "#f23645", "VI-", `osc_${key}`);
    }
    if (ind.has("rci")) {
      const p=14; const rciData:LineData<Time>[]=[];
      for(let i=p-1;i<data.length;i++){
        const sl=data.slice(i-p+1,i+1);
        const ranks=sl.map((_,j)=>j+1);
        const priceRanks=[...sl].sort((a,b)=>a.close-b.close).map((c,j)=>({c,r:j+1}));
        let d2=0;
        sl.forEach((c,j)=>{const pr=priceRanks.find(x=>x.c===c)?.r??j+1;d2+=(ranks[j]-pr)**2;});
        rciData.push({time:data[i].time as Time,value:(1-6*d2/(p*(p**2-1)))*100});
      }
      line("rci", rciData, "#8b5cf6", "RCI 14", "osc_rci");
    }
    if (ind.has("tsi")) {
      const pc=data.slice(1).map((c,i)=>({time:c.time as Time,value:c.close-data[i].close}));
      const apc=pc.map(v=>({...v,value:Math.abs(v.value)}));
      const ema2=(d:LineData<Time>[],p:number)=>{const k=2/(p+1);let e=d[0].value;return d.map((v,i)=>{if(i>0)e=v.value*k+e*(1-k);return{time:v.time,value:e};});};
      const num=ema2(ema2(pc,25),13), den=ema2(ema2(apc,25),13);
      const tsiData=num.map((v,i)=>({time:v.time,value:den[i].value===0?0:100*v.value/den[i].value}));
      line("tsi", tsiData, "#3b82f6", "TSI", "osc_tsi");
    }
    if (ind.has("rvi")) {
      const p=10; const rviData:LineData<Time>[]=[],rviSig:LineData<Time>[]=[];
      const sw=(d:Candle[],i:number)=>{const c=d[i],p1=d[i-1]??c,p2=d[i-2]??p1,p3=d[i-3]??p2;return (c.close-c.open+2*(p1.close-p1.open)+2*(p2.close-p2.open)+(p3.close-p3.open))/6;};
      const swH=(d:Candle[],i:number)=>{const c=d[i],p1=d[i-1]??c,p2=d[i-2]??p1,p3=d[i-3]??p2;return (c.high-c.open+2*(p1.high-p1.open)+2*(p2.high-p2.open)+(p3.high-p3.open))/6;};
      for(let i=p+3;i<data.length;i++){
        const numSum=Array.from({length:p},(_,j)=>sw(data,i-j)).reduce((a,b)=>a+b,0);
        const denSum=Array.from({length:p},(_,j)=>swH(data,i-j)).reduce((a,b)=>a+b,0);
        rviData.push({time:data[i].time as Time,value:denSum===0?0:numSum/denSum});
      }
      for(let i=3;i<rviData.length;i++) rviSig.push({time:rviData[i].time,value:(rviData[i].value+2*rviData[i-1].value+2*rviData[i-2].value+rviData[i-3].value)/6});
      line("rvi_v", rviData, "#2563eb", "RVI",     "osc_rvi");
      line("rvi_s", rviSig,  "#f97316", "RVI Sig", "osc_rvi");
    }
    if (ind.has("rvol")) {
      const p=14; const rvData:LineData<Time>[]=[];
      const lnR=data.slice(1).map((c,i)=>Math.log(c.close/data[i].close));
      for(let i=p;i<lnR.length;i++){const sl=lnR.slice(i-p+1,i+1);const m=sl.reduce((a,b)=>a+b,0)/p;rvData.push({time:data[i+1].time as Time,value:Math.sqrt(sl.reduce((s,v)=>s+(v-m)**2,0)/(p-1))*Math.sqrt(252)*100});}
      line("rvol", rvData, "#94a3b8", "RVI", "osc_rvol");
    }
    if (ind.has("accosc")) {
      const ao2=calcAO(data);
      const ao5=ao2.slice(1).map((v,i)=>(v.value+ao2[i].value)/2);
      const accData=ao2.slice(1).map((v,i)=>({time:v.time,value:v.value-ao5[i]}));
      hist("accosc", accData.map(v=>({...v,color:v.value>=0?"rgba(8,153,129,0.7)":"rgba(242,54,69,0.7)"})) as HistogramData<Time>[], "#089981", "AO", "osc_accosc");
    }
    if (ind.has("chopzone")) {
      line("chopzone", calcChoppiness(data, 14), "#64748b", "Chop Zone", "osc_chopzone");
    }
    if (ind.has("connors")) {
      const rsiArr=calcRSI(data,3);
      const stochRsiArr=calcStochRSI(data,3,3);
      const roc3=calcROC(data,1).map(v=>({...v,value:v.value>0?1:v.value<0?-1:0}));
      const minL=Math.min(rsiArr.length,stochRsiArr.length,roc3.length);
      const cRSI=rsiArr.slice(-minL).map((v,i)=>({time:v.time,value:(v.value+stochRsiArr[stochRsiArr.length-minL+i].value+roc3[roc3.length-minL+i].value*100)/3}));
      line("connors", cRSI, "#7c3aed", "Connors RSI", "osc_connors");
    }
    if (ind.has("coppock")) {
      const roc14=calcROC(data,14), roc11=calcROC(data,11);
      const minL=Math.min(roc14.length,roc11.length);
      const sum=roc14.slice(-minL).map((v,i)=>({time:v.time,value:v.value+roc11[roc11.length-minL+i].value}));
      const p=10; const copp:LineData<Time>[]=[];
      for(let i=p-1;i<sum.length;i++) copp.push({time:sum[i].time,value:sum.slice(i-p+1,i+1).reduce((s,v)=>s+v.value,0)/p});
      line("coppock", copp, "#f43f5e", "Coppock", "osc_coppock");
    }
    if (ind.has("klinger")) {
      const vf=data.slice(1).map((c,i)=>{const d=(c.high+c.low+c.close)-(data[i].high+data[i].low+data[i].close);return c.volume*(d>=0?1:-1);});
      const vfD=vf.map((v,i)=>({time:data[i+1].time as Time,value:v}));
      const ema34=vfD.reduce((a,v,i)=>{const k=2/35,e=i===0?v.value:a[i-1]*((1-k))+v.value*k;a.push(e);return a;},[0 as number]).slice(1);
      const ema55=vfD.reduce((a,v,i)=>{const k=2/56,e=i===0?v.value:a[i-1]*((1-k))+v.value*k;a.push(e);return a;},[0 as number]).slice(1);
      const kosc=ema34.map((v,i)=>({time:vfD[i].time,value:v-ema55[i]}));
      line("klinger", kosc, "#3b82f6", "Klinger", "osc_klinger");
    }
    if (ind.has("chaikinv")) {
      const hl=data.map(c=>c.high-c.low);
      const ema10hl=calcEMA(hl.map((v,i)=>({...data[i],close:v})),10);
      const diff=ema10hl.slice(10).map((v,i)=>({time:v.time,value:ema10hl[i].value===0?0:(v.value-ema10hl[i].value)/ema10hl[i].value*100}));
      line("chaikinv", diff, "#06b6d4", "Chaikin Vol", "osc_chaikinv");
    }
    if (ind.has("chaikinO")) {
      const adArr:number[]=[]; let cumAD=0;
      data.forEach(c=>{const hl=c.high-c.low;cumAD+=hl===0?0:(2*c.close-c.high-c.low)/hl*c.volume;adArr.push(cumAD);});
      const adLD=adArr.map((v,i)=>({...data[i],close:v}));
      const e3=calcEMA(adLD,3), e10=calcEMA(adLD,10);
      const minL=Math.min(e3.length,e10.length);
      const cosc=e3.slice(-minL).map((v,i)=>({time:v.time,value:v.value-e10[e10.length-minL+i].value}));
      line("chaikino", cosc, "#14b8a6", "Chaikin Osc", "osc_chaikino");
    }
    if (ind.has("majority")) {
      const p=14;const majData:LineData<Time>[]=[];
      for(let i=p;i<data.length;i++){let up=0;for(let j=i-p+1;j<=i;j++)if(data[j].close>data[j-1].close)up++;majData.push({time:data[i].time as Time,value:up/p*100});}
      line("majority", majData, "#f59e0b", "Majority Rule", "osc_majority");
    }
    if (ind.has("accswing")) {
      const lim=0.0001;const aswData:LineData<Time>[]=[]; let asw=0;
      for(let i=1;i<data.length;i++){const tr=Math.max(data[i].high,data[i-1].close)-Math.min(data[i].low,data[i-1].close);const er=Math.abs(data[i].close-data[i-1].close);if(tr<lim)continue;asw+=((data[i].close-data[i-1].close)/tr)*er;aswData.push({time:data[i].time as Time,value:asw});}
      line("accswing", aswData, "#a855f7", "Acc Swing", "osc_accswing");
    }
    if (ind.has("smierg")) {
      const ds=data.slice(1).map((c,i)=>({...c,close:c.close-data[i].close}));
      const e5=calcEMA(ds,5), e20=calcEMA(ds,20);
      const minL=Math.min(e5.length,e20.length);
      const smi=e5.slice(-minL).map((v,i)=>({time:v.time,value:e20[e20.length-minL+i].value===0?0:v.value/e20[e20.length-minL+i].value*100}));
      line("smierg", smi, "#ec4899", "SMI Ergodic", "osc_smierg");
    }
    if (ind.has("trendstrength")) {
      const p=14;const tsData:LineData<Time>[]=[]; let prev=calcSMA(data,p);
      const cur=prev.slice(1);
      const ts=cur.map((v,i)=>({time:v.time,value:prev[i].value===0?0:(v.value-prev[i].value)/prev[i].value*100}));
      line("trendstrength", ts, "#0ea5e9", "Trend Strength", "osc_ts");
    }
    if (ind.has("mahamming")) {
      const p=20; const r:LineData<Time>[]=[],k=Math.PI*2/p;
      for(let i=p-1;i<data.length;i++){let sum=0,den=0;for(let j=0;j<p;j++){const w=0.54-0.46*Math.cos(k*j);sum+=data[i-p+1+j].close*w;den+=w;}r.push({time:data[i].time as Time,value:sum/den});}
      line("mahamming", r, "#84cc16", "Hamming MA 20");
    }
    if (ind.has("vwma")) {
      const p=20; const r:LineData<Time>[]=[];
      for(let i=p-1;i<data.length;i++){const sl=data.slice(i-p+1,i+1);const num=sl.reduce((s,c)=>s+c.close*c.volume,0),den=sl.reduce((s,c)=>s+c.volume,0);r.push({time:data[i].time as Time,value:den===0?data[i].close:num/den});}
      line("vwma", r, "#f43f5e", "VWMA 20");
    }
    if (ind.has("chandeKS")) {
      const p1=9,p2=13,q=1.5;
      const atr1=calcATR(data,p1),atr2=calcATR(data,p2);
      const minL=Math.min(atr1.length,atr2.length);
      const first=atr1.slice(-minL).map((v,i)=>({time:v.time,value:v.value,v2:atr2[atr2.length-minL+i].value}));
      const maxStop:LineData<Time>[]=[],minStop:LineData<Time>[]=[];
      first.forEach((v,i)=>{const idx=data.length-minL+i;const hh=Math.max(...data.slice(Math.max(0,idx-p2),idx+1).map(c=>c.high));const ll=Math.min(...data.slice(Math.max(0,idx-p2),idx+1).map(c=>c.low));maxStop.push({time:v.time,value:hh-q*v.v2});minStop.push({time:v.time,value:ll+q*v.v2});});
      line("cks_max", maxStop, "#089981", "CKS Stop↑");
      line("cks_min", minStop, "#f23645", "CKS Stop↓");
    }
    if (ind.has("stderrbands")) {
      const p=14; const upper:LineData<Time>[]=[],lower:LineData<Time>[]=[];
      for(let i=p-1;i<data.length;i++){const sl=data.slice(i-p+1,i+1).map(c=>c.close);const mean=sl.reduce((a,b)=>a+b,0)/p;const xbar=(p-1)/2;const ss=sl.reduce((s,v,j)=>s+(j-xbar)**2,0);const se=Math.sqrt(sl.reduce((s,v)=>s+(v-mean)**2,0)/(p*(p-2)||1))/Math.sqrt(ss||1);const lr=calcLinearReg(data.slice(i-p+1,i+1),p);const lrv=lr[lr.length-1]?.value??mean;upper.push({time:data[i].time as Time,value:lrv+2*se});lower.push({time:data[i].time as Time,value:lrv-2*se});}
      line("seb_u", upper, "rgba(14,165,233,0.6)", "SE Band+");
      line("seb_l", lower, "rgba(14,165,233,0.6)", "SE Band-");
    }
    if (ind.has("stderr")) {
      const p=14;const seData:LineData<Time>[]=[];
      for(let i=p-1;i<data.length;i++){const sl=data.slice(i-p+1,i+1).map(c=>c.close);const mean=sl.reduce((a,b)=>a+b,0)/p;seData.push({time:data[i].time as Time,value:Math.sqrt(sl.reduce((s,v)=>s+(v-mean)**2,0)/(p*(p-1)||1))});}
      line("stderr", seData, "#64748b", "Std Error", "osc_stderr");
    }
    if (ind.has("volclc") || ind.has("volztc") || ind.has("volohlc") || ind.has("volindex")) {
      const lnR=data.slice(1).map((c,i)=>Math.log(c.close/data[i].close));
      const p=20;
      if(ind.has("volclc")){
        const r:LineData<Time>[]=[];
        for(let i=p;i<lnR.length;i++){const sl=lnR.slice(i-p+1,i+1);const m=sl.reduce((a,b)=>a+b,0)/p;r.push({time:data[i+1].time as Time,value:Math.sqrt(sl.reduce((s,v)=>s+(v-m)**2,0)/p)*Math.sqrt(252)*100});}
        line("volclc", r, "#64748b", "Vol C-C", "osc_volclc");
      }
      if(ind.has("volztc")){
        const r2:LineData<Time>[]=[];
        for(let i=p;i<lnR.length;i++){const sl=lnR.slice(i-p+1,i+1);r2.push({time:data[i+1].time as Time,value:Math.sqrt(sl.reduce((s,v)=>s+v**2,0)/p)*Math.sqrt(252)*100});}
        line("volztc", r2, "#94a3b8", "Vol ZTC", "osc_volztc");
      }
      if(ind.has("volohlc")){
        const lnHL=data.slice(1).map(c=>Math.log(c.high/c.low));
        const r3:LineData<Time>[]=[];
        for(let i=p;i<lnHL.length;i++){r3.push({time:data[i+1].time as Time,value:Math.sqrt(lnHL.slice(i-p+1,i+1).reduce((s,v)=>s+v**2,0)/p)*Math.sqrt(252/4/Math.log(2))*100});}
        line("volohlc", r3, "#94a3b8", "Vol OHLC", "osc_volohlc");
      }
      if(ind.has("volindex")) line("volindex", calcStdDev(data,p).map(v=>({time:v.time,value:v.value/data[0].close*100})), "#64748b", "Vol Idx", "osc_volindex");
    }
    if (ind.has("wfractal")) {
      const upFrac:LineData<Time>[]=[],dnFrac:LineData<Time>[]=[];
      for(let i=2;i<data.length-2;i++){
        if(data[i].high>data[i-1].high&&data[i].high>data[i-2].high&&data[i].high>data[i+1].high&&data[i].high>data[i+2].high) upFrac.push({time:data[i].time as Time,value:data[i].high});
        if(data[i].low<data[i-1].low&&data[i].low<data[i-2].low&&data[i].low<data[i+1].low&&data[i].low<data[i+2].low) dnFrac.push({time:data[i].time as Time,value:data[i].low});
      }
      if(upFrac.length){ const s=chartRef.current!.addSeries(LC.LineSeries,{color:"#089981",lineWidth:1,title:"W Frac↑",lineStyle:3,priceLineVisible:false});s.setData(upFrac);indRef.current.set("wfrac_u",[s]);}
      if(dnFrac.length){ const s=chartRef.current!.addSeries(LC.LineSeries,{color:"#f23645",lineWidth:1,title:"W Frac↓",lineStyle:3,priceLineVisible:false});s.setData(dnFrac);indRef.current.set("wfrac_d",[s]);}
    }
    if (ind.has("zigzag")) {
      const zzData:LineData<Time>[]=[];const thresh=0.05;let lastPivot=data[0].close,lastDir=0;
      data.forEach((c,i)=>{const up=(c.close-lastPivot)/lastPivot,dn=(lastPivot-c.close)/lastPivot;if(lastDir>=0&&dn>thresh){lastPivot=c.close;lastDir=-1;zzData.push({time:c.time as Time,value:c.close});}else if(lastDir<=0&&up>thresh){lastPivot=c.close;lastDir=1;zzData.push({time:c.time as Time,value:c.close});}});
      if(zzData.length>1) line("zigzag", zzData, "#f59e0b", "Zig Zag");
    }
    if (ind.has("fisher")) {
      const p=10;const r:LineData<Time>[]=[];
      for(let i=p;i<data.length;i++){const sl=data.slice(i-p+1,i+1);const hi=Math.max(...sl.map(c=>c.high)),lo=Math.min(...sl.map(c=>c.low));let v=(data[i].close-lo)/(hi-lo||1)*2-1;v=Math.max(-0.999,Math.min(0.999,v));r.push({time:data[i].time as Time,value:0.5*Math.log((1+v)/(1-v))});}
      line("fisher", r, "#f97316", "Fisher", "osc_fisher");
    }
    if (ind.has("almaopt")) {
      const p=21,offset=0.85,sigma=6;
      const m=offset*(p-1),s=p/sigma;
      const w=Array.from({length:p},(_,i)=>Math.exp(-((i-m)*(i-m))/(2*s*s)));const wSum=w.reduce((a,b)=>a+b,0);
      const r:LineData<Time>[]=[];
      for(let i=p-1;i<data.length;i++){let v=0;for(let j=0;j<p;j++)v+=w[j]*data[i-p+1+j].close;r.push({time:data[i].time as Time,value:v/wSum});}
      line("alma", r, "#a855f7", "ALMA");
    }
  }

  useEffect(() => { if (candles.length) applyIndicators(candles); }, [activeIndicators]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drawing engine ─────────────────────────────────────────────────────────
  const drawingsRef   = useRef<{ id: string; type: string; series?: unknown; priceLine?: unknown; p1?: {time:number;price:number}; p2?: {time:number;price:number} }[]>([]);
  const drawPt1Ref    = useRef<{ time: number; price: number } | null>(null);
  const activeToolRef = useRef(activeTool);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

  // Close submenu on outside click
  useEffect(() => {
    if (!openSubmenu) return;
    const handler = (e: MouseEvent) => {
      if (submenuRef.current && !submenuRef.current.contains(e.target as Node)) setOpenSubmenu(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openSubmenu]);

  // Change cursor style based on active tool
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const cursors: Record<string, string> = {
      cross: "default", trend: "crosshair", hline: "row-resize",
      vline: "col-resize", ray: "crosshair", ruler: "crosshair",
      rect: "crosshair", text: "text", fib: "crosshair",
      hlines: "row-resize", channel: "crosshair", triangle: "crosshair",
      zoom: "zoom-in",
    };
    el.style.cursor = cursors[activeTool] ?? "default";
  }, [activeTool]);

  // Wire chart click → drawing action
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (param: any) => {
      const raw = activeToolRef.current;
      const tool = TOOL_ALIAS[raw] ?? raw;
      if (tool === "cross" || tool === "magnet" || tool === "lock" || tool === "eye" || tool === "layers") return;
      if (!param.point) return;
      if (!priceRef.current) return;

      const time = param.time as number | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const price = priceRef.current.coordinateToPrice(param.point.y) as number | null;
      if (price === null || price === undefined) return;

      // Tools that need a bar time — bail if click is in empty space
      const needsTime = ["trend","ray","channel","fib","triangle","rect","ruler","vline","hlines"].includes(tool);
      if (needsTime && !time) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lc = lcRef.current as any;
      if (!lc) return;

      if (tool === "trash") {
        // Remove last drawing
        const last = drawingsRef.current.pop();
        if (last) {
          if (last.series) { try { chart.removeSeries(last.series as never); } catch {} }
          if (last.priceLine && priceRef.current) { try { (priceRef.current as never as { removePriceLine: (p: unknown) => void }).removePriceLine(last.priceLine); } catch {} }
        }
        return;
      }

      if (tool === "zoom") {
        chart.timeScale().fitContent();
        return;
      }

      if (tool === "hline") {
        // Horizontal price line
        if (priceRef.current) {
          const pl = (priceRef.current as never as { createPriceLine: (o: object) => unknown }).createPriceLine({
            price, color: "#f59e0b", lineWidth: 1, lineStyle: 0, axisLabelVisible: true, title: `H ${price.toFixed(2)}`,
          });
          drawingsRef.current.push({ id: `hl_${Date.now()}`, type: "hline", priceLine: pl });
        }
        return;
      }

      if (tool === "hlines") {
        if (priceRef.current) {
          for (const offset of [-1, 0, 1]) {
            const p2 = price + offset * price * 0.005;
            (priceRef.current as never as { createPriceLine: (o: object) => unknown }).createPriceLine({
              price: p2, color: "#8b5cf6", lineWidth: 1, lineStyle: 2, axisLabelVisible: offset === 0, title: offset === 0 ? "Channel" : "",
            });
          }
        }
        return;
      }

      // Two-point tools: trendline, ray, channel, fib, triangle, rect, ruler
      const twoPointTools = ["trend","ray","channel","fib","triangle","rect","ruler","vline"];
      if (twoPointTools.includes(tool)) {
        const t = time as number; // safe: needsTime guard above ensures time is defined
        if (!drawPt1Ref.current) {
          drawPt1Ref.current = { time: t, price };
          return; // wait for second click
        }
        const p1 = drawPt1Ref.current;
        drawPt1Ref.current = null;

        if (tool === "vline") {
          // Vertical line: marker on the series
          const existingMarkers: object[] = [];
          drawingsRef.current.filter(d=>d.type==="vline").forEach(d=>{
            if (d.series) existingMarkers.push(d.series as object);
          });
          const marker = { time: p1.time as Time, position: "inBar" as const, color: "#2962ff", shape: "circle" as const, size: 0 };
          // We use a LineSeries spanning full price range as vertical line approximation
          const s = chart.addSeries(lc.LineSeries, { color: "#2962ff", lineWidth: 1, lineStyle: 2, title: "V", priceLineVisible: false, lastValueVisible: false });
          s.setData([{ time: p1.time as Time, value: price }]);
          drawingsRef.current.push({ id: `vl_${Date.now()}`, type: "vline", series: s });
          void marker; // suppress unused
          return;
        }

        // Build 2-point line series
        const sorted = p1.time <= t ? [p1, { time: t, price }] : [{ time: t, price }, p1];
        const colors: Record<string,string> = {
          trend: "#2962ff", ray: "#f59e0b", channel: "#8b5cf6",
          fib: "#ef4444", triangle: "#10b981", rect: "#06b6d4", ruler: "#94a3b8",
        };
        const s = chart.addSeries(lc.LineSeries, {
          color: colors[tool] ?? "#2962ff", lineWidth: 1,
          lineStyle: tool === "ruler" ? 2 : 0,
          title: tool === "fib" ? "Fib" : tool === "ruler" ? "Measure" : "",
          priceLineVisible: false, lastValueVisible: false,
        });
        s.setData([
          { time: sorted[0].time as Time, value: sorted[0].price },
          { time: sorted[1].time as Time, value: sorted[1].price },
        ]);
        drawingsRef.current.push({ id: `${tool}_${Date.now()}`, type: tool, series: s, p1: sorted[0], p2: sorted[1] });

        if (tool === "fib") {
          const range = sorted[1].price - sorted[0].price;
          [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].forEach(lvl => {
            if (priceRef.current) {
              (priceRef.current as never as { createPriceLine: (o: object) => unknown }).createPriceLine({
                price: sorted[0].price + range * lvl, color: `rgba(239,68,68,0.6)`, lineWidth: 1,
                lineStyle: 2, axisLabelVisible: true, title: `${(lvl*100).toFixed(1)}%`,
              });
            }
          });
        }
        return;
      }

      if (tool === "text") {
        const label = window.prompt("Enter text:");
        if (!label) return;
        if (priceRef.current) {
          (priceRef.current as never as { createPriceLine: (o: object) => unknown }).createPriceLine({
            price, color: "#131722", lineWidth: 0, lineStyle: 4,
            axisLabelVisible: false, title: label,
          });
          drawingsRef.current.push({ id: `txt_${Date.now()}`, type: "text" });
        }
        return;
      }
    };

    chart.subscribeClick(handler);
    return () => { chart.unsubscribeClick(handler); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartReady]);

  // Remove all shapes
  const removeAllShapes = useCallback(() => {
    if (!chartRef.current) return;
    drawingsRef.current.forEach(d => {
      if (d.series) { try { chartRef.current!.removeSeries(d.series as never); } catch {} }
    });
    drawingsRef.current = [];
    drawPt1Ref.current = null;
    setActiveTool("cross");
  }, []);

  // ── Drag-to-move drawings ──────────────────────────────────────────────────
  const dragRef = useRef<{ id: string; part: "p1"|"p2"|"whole"; startPrice: number; startTime: number; origP1: {time:number;price:number}; origP2: {time:number;price:number} } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    const chart = chartRef.current;
    if (!el || !chart) return;

    const HIT = 10; // px threshold for "near"

    const getChartCoords = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const time = chart.timeScale().coordinateToTime(x) as number | null;
      const price = priceRef.current ? (priceRef.current as {coordinateToPrice:(y:number)=>number|null}).coordinateToPrice(y) : null;
      const tx = time != null ? chart.timeScale().timeToCoordinate(time as never) as number | null : null;
      return { x, y, time, price, tx };
    };

    const findHit = (px: number, py: number) => {
      const chart2 = chartRef.current;
      if (!chart2) return null;
      for (const d of drawingsRef.current) {
        if (!d.p1 || !d.p2 || !d.series) continue;
        const x1 = chart2.timeScale().timeToCoordinate(d.p1.time as never) as number|null;
        const x2 = chart2.timeScale().timeToCoordinate(d.p2.time as never) as number|null;
        const y1 = (priceRef.current as {priceToCoordinate:(v:number)=>number|null}|null)?.priceToCoordinate(d.p1.price);
        const y2 = (priceRef.current as {priceToCoordinate:(v:number)=>number|null}|null)?.priceToCoordinate(d.p2.price);
        if (x1==null||x2==null||y1==null||y2==null) continue;
        // Endpoint hit test
        if (Math.hypot(px-x1,py-y1)<HIT) return { id: d.id, part: "p1" as const };
        if (Math.hypot(px-x2,py-y2)<HIT) return { id: d.id, part: "p2" as const };
        // Line segment hit test (within 8px of segment)
        const dx=x2-x1, dy=y2-y1, len2=dx*dx+dy*dy;
        if (len2>0) {
          const t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/len2));
          const dist=Math.hypot(px-x1-t*dx,py-y1-t*dy);
          if (dist<HIT) return { id: d.id, part: "whole" as const };
        }
      }
      return null;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (activeToolRef.current !== "cross") return;
      const { x, y, time, price } = getChartCoords(e);
      if (dragRef.current) {
        // Dragging
        if (!time || !price) return;
        const dr = dragRef.current;
        const d = drawingsRef.current.find(d=>d.id===dr.id);
        if (!d||!d.series) return;
        const dt = time - dr.startTime;
        const dp = price - dr.startPrice;
        let np1 = { ...dr.origP1 }, np2 = { ...dr.origP2 };
        if (dr.part === "p1") np1 = { time: dr.origP1.time+dt, price: dr.origP1.price+dp };
        else if (dr.part === "p2") np2 = { time: dr.origP2.time+dt, price: dr.origP2.price+dp };
        else { np1 = { time: dr.origP1.time+dt, price: dr.origP1.price+dp }; np2 = { time: dr.origP2.time+dt, price: dr.origP2.price+dp }; }
        d.p1 = np1; d.p2 = np2;
        const sorted = np1.time<=np2.time ? [np1,np2] : [np2,np1];
        try { (d.series as {setData:(v:object[])=>void}).setData(sorted.map(p=>({time:p.time as Time,value:p.price}))); } catch {}
        el.style.cursor = "grabbing";
        return;
      }
      const hit = findHit(x, y);
      if (hit) el.style.cursor = hit.part==="whole" ? "grab" : "crosshair";
      else if (activeToolRef.current==="cross") el.style.cursor = "default";
    };

    const onMouseDown = (e: MouseEvent) => {
      if (activeToolRef.current !== "cross") return;
      const { x, y, time, price } = getChartCoords(e);
      if (!time || !price) return;
      const hit = findHit(x, y);
      if (!hit) return;
      const d = drawingsRef.current.find(d=>d.id===hit.id);
      if (!d||!d.p1||!d.p2) return;
      dragRef.current = { id: hit.id, part: hit.part, startTime: time, startPrice: price, origP1: { ...d.p1 }, origP2: { ...d.p2 } };
      e.stopPropagation();
    };

    const onMouseUp = () => { dragRef.current = null; };

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [chartReady]);

  // ── Fetch candles ──────────────────────────────────────────────────────────
  const rangePreset = useMemo(() => RANGE_BTNS.find(r => r.label === activeRange) ?? { label: "1y", days: 365 }, [activeRange]);

  const fetchCandles = useCallback(async (sym: string, intv: string, days: number, showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setDataMessage("Loading…");
    setIsDemo(false);
    try {
      const to = new Date(), from = new Date();
      from.setDate(from.getDate() - days);
      const params = new URLSearchParams({
        symbol: sym, interval: intv,
        from: from.toISOString().split("T")[0],
        to: to.toISOString().split("T")[0],
        outputsize: "2000",
      });
      const [hRes, qRes] = await Promise.all([
        fetch(`/api/portal/chart/history?${params}`),
        fetch(`/api/portal/chart/quote?symbol=${encodeURIComponent(sym)}`),
      ]);
      const hJson = await hRes.json();
      const qJson = await qRes.json().catch(() => null);

      setDataStatus(hJson.status ?? "UNKNOWN");
      if (hJson.message) setDataMessage(hJson.message);

      if (hJson.candles?.length) {
        setCandles(hJson.candles);
      } else {
        // No data — show demo candles so chart is never blank
        setIsDemo(true);
        setDataStatus("DEMO");
        setDataMessage(
          hJson.status === "API_KEY_NOT_CONFIGURED"
            ? "Add TWELVE_DATA_API_KEY to .env.local for international symbols."
            : `No data for ${sym}. Showing AAPL demo candles.`
        );
        setCandles(DEMO_CANDLES);
      }
      if (qJson && !qJson.error) setQuote(qJson);
    } catch {
      setIsDemo(true); setDataStatus("DEMO");
      setDataMessage("Network error. Showing demo candles.");
      setCandles(DEMO_CANDLES);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  const firstLoadRef = useRef(true);
  useEffect(() => {
    const isFirst = firstLoadRef.current;
    firstLoadRef.current = false;
    fetchCandles(symbol, interval, rangePreset.days, !isFirst);
  }, [symbol, interval, rangePreset.days, fetchCandles]);

  // Quote refresh every 30s
  useEffect(() => {
    const id = window.setInterval(async () => {
      if (isDemo) return;
      const res = await fetch(`/api/portal/chart/quote?symbol=${encodeURIComponent(symbol)}`).catch(() => null);
      if (res?.ok) { const j = await res.json().catch(() => null); if (j && !j.error) setQuote(j); }
    }, 30_000);
    return () => window.clearInterval(id);
  }, [symbol, isDemo]);

  // ── Ctrl+K global shortcut ────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey||e.metaKey) && e.key === "k") { e.preventDefault(); setShowQuickSearch(q => !q); } };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  // ── Compare symbol handler ────────────────────────────────────────────────
  const addCompareSymbol = useCallback(async (r: SearchResult) => {
    if (!chartRef.current || !lcRef.current) return;
    if (compareRef.current.has(r.symbol)) return; // already added
    setShowCompare(false);
    // Fetch data for compare symbol
    const to = new Date(), from = new Date(); from.setDate(from.getDate() - rangePreset.days);
    const params = new URLSearchParams({ symbol: r.symbol, interval, from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0], outputsize: "2000" });
    try {
      const res = await fetch(`/api/portal/chart/history?${params}`);
      const json = await res.json();
      if (!json.candles?.length) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lc = lcRef.current as any;
      const colors = ["#e74c3c","#3498db","#2ecc71","#9b59b6","#f39c12","#1abc9c"];
      const color = colors[compareRef.current.size % colors.length];
      const s = chartRef.current.addSeries(lc.LineSeries, { color, lineWidth: 2, title: r.symbol, priceLineVisible: false, lastValueVisible: true });
      // Normalize to % change from first candle
      const base = json.candles[0].close;
      s.setData(json.candles.map((c: Candle) => ({ time: c.time as Time, value: (c.close/base - 1) * 100 })));
      compareRef.current.set(r.symbol, s);
      setCompareSym(prev => [...prev, r]);
    } catch { /* silent */ }
  }, [interval, rangePreset.days]);

  const removeCompareSymbol = useCallback((sym: string) => {
    const s = compareRef.current.get(sym);
    if (s && chartRef.current) { try { chartRef.current.removeSeries(s); } catch {} }
    compareRef.current.delete(sym);
    setCompareSym(prev => prev.filter(r => r.symbol !== sym));
  }, []);

  // ── Symbol select ──────────────────────────────────────────────────────────
  const selectSymbol = useCallback((r: SearchResult) => {
    setSymbol(r.symbol); setSymbolMeta(r); setDataStatus(r.dataStatus); setShowSearch(false);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const screenshot = () => {
    if (!chartRef.current) return;
    const c = chartRef.current.takeScreenshot();
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `stockifyy-${symbol}-${interval}.png`;
    a.click();
  };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen?.(); setIsFullscreen(true); }
    else { document.exitFullscreen?.(); setIsFullscreen(false); }
  };
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ── Quote display ──────────────────────────────────────────────────────────
  const last   = candles[candles.length - 1];
  const dO     = isDemo ? undefined : (quote?.open  ?? last?.open);
  const dH     = isDemo ? undefined : (quote?.high  ?? last?.high);
  const dL     = isDemo ? undefined : (quote?.low   ?? last?.low);
  const dC     = isDemo ? undefined : (quote?.close ?? last?.close);
  const dChg   = isDemo ? undefined : (quote?.change ?? 0);
  const dPct   = isDemo ? undefined : (quote?.changePct ?? 0);
  const up     = (dChg ?? 0) >= 0;
  const fmt    = (n: number | undefined) => n === undefined ? "" : n >= 1000 ? n.toLocaleString("en-PK", { maximumFractionDigits: 2 }) : n.toFixed(2);

  // ── Chart type icon for current type ──────────────────────────────────────
  const currentCtDef = CHART_TYPE_DEFS.find(d => d.id === chartType) ?? CHART_TYPE_DEFS[1];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CurrentCtIcon = (Ic as any)[currentCtDef.icon] ?? Ic.Candle;

  // ── Quick search commands ─────────────────────────────────────────────────
  const quickCommands = useMemo((): QCmd[] => [
    ...CHART_TYPE_DEFS.map(ct => ({ id: `ct_${ct.id}`, label: ct.label, group: "Chart Types", action: () => setChartType(ct.id) })),
    ...INTERVAL_GROUPS.flatMap(g => g.items.map(iv => ({ id: `iv_${iv.id}`, label: iv.label, group: "Intervals", action: () => setIntervalVal(iv.id) }))),
    ...IND_LIST_SORTED.filter(i => !i.unavailable).map(ind => ({ id: `ind_${ind.id}`, label: ind.label, group: "Indicators", action: () => setActiveInd(prev => { const n = new Set(prev); n.has(ind.id) ? n.delete(ind.id) : n.add(ind.id); return n; }) })),
    { id: "theme_dark",  label: "Dark Theme",   group: "Settings", action: () => setIsDark(true) },
    { id: "theme_light", label: "Light Theme",  group: "Settings", action: () => setIsDark(false) },
    { id: "fullscreen",  label: "Fullscreen",   group: "Settings", action: toggleFullscreen },
    { id: "screenshot",  label: "Screenshot",   group: "Settings", action: screenshot },
    { id: "rm_studies",  label: "Remove All Studies", group: "Actions", action: () => setActiveInd(new Set(["vol"])) },
    { id: "compare",     label: "Compare Symbol", group: "Actions", action: () => setShowCompare(true) },
    { id: "indicators",  label: "Add Indicator", group: "Actions", action: () => setShowIndicators(true) },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  return (
    <div className={`tc${isDark ? " tc-dk" : ""}`}>
      <style>{CSS}</style>

      {/* ── Demo banner ──────────────────────────────────────────────────── */}
      {isDemo && (
        <div className="tc-demo-bar">
          <span>⚠ DEMO DATA — {dataMessage || "Showing sample AAPL candles. Chart controls fully functional."}</span>
          <button onClick={() => setIsDemo(false)}>✕</button>
        </div>
      )}

      {/* ── Top toolbar (matches SCS Trade layout) ───────────────────────── */}
      <div className="tc-bar">
        {/* Symbol search */}
        <button className="tc-sym-btn" onClick={() => setShowSearch(true)}>
          <Ic.Search />
          <span className="tc-sym-text">{symbol}</span>
          <Ic.ChevronDown />
        </button>

        {/* Add comparison */}
        <button className="tc-bar-btn tc-icon-btn" title="Compare symbols" onClick={() => setShowCompare(true)}>
          <Ic.Plus />
        </button>

        <div className="tc-sep" />

        {/* Timeframe quick buttons */}
        <div className="tc-grp">
          {(["1h","D","W","M"] as string[]).map(iv => (
            <button key={iv} className={`tc-bar-btn${interval === iv ? " on" : ""}`} onClick={() => setIntervalVal(iv)}>{iv}</button>
          ))}
          <IntervalDropdown current={interval} onSelect={setIntervalVal} favIntervals={favIntervals} onFavInterval={iv => setFavIntervals(prev=>{const n=new Set(prev);n.has(iv)?n.delete(iv):n.add(iv);return n;})} />
        </div>

        <div className="tc-sep" />

        {/* Chart type — icon for current + dropdown */}
        <div className="tc-grp">
          <button title={currentCtDef.label} className={`tc-bar-btn tc-icon-btn on`}>
            <CurrentCtIcon />
          </button>
          <ChartTypeDropdown current={chartType} onSelect={setChartType} favTypes={favTypes} onFavType={t=>setFavTypes(prev=>{const n=new Set(prev);n.has(t)?n.delete(t):n.add(t);return n;})} />
        </div>

        <div className="tc-sep" />

        {/* Indicators */}
        <button className="tc-bar-btn" onClick={() => setShowIndicators(true)}>
          <Ic.Indicator /><span>f<sub style={{fontSize:8}}>x</sub></span>
        </button>

        <div className="tc-sep" />

        {/* Management */}
        <button className="tc-bar-btn" onClick={() => setActiveInd(new Set(["vol"]))}>Remove All Studies</button>
        <button className="tc-bar-btn" onClick={removeAllShapes}>Remove All Shapes</button>

        <div className="tc-sep" />

        {/* Undo / Redo */}
        <button className="tc-bar-btn tc-icon-btn" title="Undo"><Ic.Undo /></button>
        <button className="tc-bar-btn tc-icon-btn" title="Redo"><Ic.Redo /></button>

        <div style={{ flex: 1 }} />

        {/* Right controls */}
        <button className="tc-bar-btn" title="Quick Search (Ctrl+K)" onClick={() => setShowQuickSearch(true)} style={{gap:6}}>
          <Ic.Search /><span style={{fontSize:10,opacity:0.7}}>Ctrl+K</span>
        </button>
        <button className="tc-bar-btn" title="Save"><Ic.Save /><span>Save</span></button>
        <button className="tc-bar-btn tc-icon-btn" title={isDark ? "Light theme" : "Dark theme"} onClick={() => setIsDark(d => !d)}>
          {isDark ? <Ic.Sun /> : <Ic.Moon />}
        </button>
        <button className="tc-bar-btn tc-icon-btn" title="Screenshot" onClick={screenshot}><Ic.Camera /></button>
        <button className="tc-bar-btn tc-icon-btn" title="Fullscreen" onClick={toggleFullscreen}><Ic.Fullscreen /></button>
      </div>

      {/* ── OHLCV info bar ──────────────────────────────────────────────── */}
      <div className="tc-info-bar">
        <span className="tc-info-sym">{symbol} · {symbolMeta.exchange ?? "PSX"} · {interval}</span>
        <StatusBadge status={dataStatus} />
        {dC !== undefined && (
          <>
            <span className="tc-ohlc">O <b>{fmt(dO)}</b></span>
            <span className="tc-ohlc">H <b>{fmt(dH)}</b></span>
            <span className="tc-ohlc">L <b>{fmt(dL)}</b></span>
            <span className="tc-ohlc">C <b style={{ color: up ? "#089981" : "#f23645" }}>{fmt(dC)}</b></span>
            <span className="tc-chg" style={{ color: up ? "#089981" : "#f23645" }}>
              {up ? "▲" : "▼"} {fmt(Math.abs(dChg!))} ({Math.abs(dPct!).toFixed(2)}%)
            </span>
          </>
        )}
        {loading && <span className="tc-spin">⟳</span>}
        {!loading && activeTool !== "cross" && activeTool !== "magnet" && activeTool !== "lock" && activeTool !== "eye" && activeTool !== "layers" && activeTool !== "trash" && activeTool !== "zoom" && (
          <span style={{fontSize:10,color:"#7c3aed",fontWeight:700,background:"#7c3aed12",padding:"1px 7px",borderRadius:3}}>
            {["trend","ray","channel","fib","triangle","rect","ruler","vline"].includes(activeTool) ? "Click 1st point on chart" : "Click on chart"}&nbsp;·&nbsp;
            <button style={{background:"none",border:"none",cursor:"pointer",color:"inherit",fontWeight:700,fontSize:10,padding:0}} onClick={() => { setActiveTool("cross"); drawPt1Ref.current = null; }}>✕ cancel</button>
          </span>
        )}
        {!loading && !candles.length && (
          <button className="tc-retry" onClick={() => fetchCandles(symbol, interval, rangePreset.days)}>↺ Retry</button>
        )}
      </div>

      {/* ── Main canvas area ─────────────────────────────────────────────── */}
      <div className="tc-main">
        {/* Left drawing toolbar (matches SCS Trade) */}
        <div className="tc-draw" ref={submenuRef}>
          {DRAW_TOOLS.map((t, i) => {
            if (t === null) return <div key={`sep-${i}`} className="tc-draw-sep" />;
            const isActive = activeTool === t.id || (t.submenu?.some(s => s.items.some(it => it.id === activeTool)) ?? false);
            if (t.submenu) {
              return (
                <div key={t.id} className="tc-draw-group">
                  <button
                    title={t.label}
                    className={`tc-draw-btn tc-has-sub${isActive ? " on" : ""}`}
                    onClick={() => { setActiveTool(t.id); setOpenSubmenu(null); }}>
                    <t.icon />
                    <span
                      className={`tc-sub-tri${openSubmenu === t.id ? " open" : ""}`}
                      onMouseDown={e => { e.stopPropagation(); e.preventDefault(); setOpenSubmenu(openSubmenu === t.id ? null : t.id); }}>
                      ▾
                    </span>
                  </button>
                  {openSubmenu === t.id && (
                    <div className="tc-submenu">
                      {t.submenu.map((section, si) => (
                        <div key={si}>
                          {section.title && <div className="tc-submenu-group">{section.title}</div>}
                          {section.items.map(item => (
                            <button
                              key={item.id}
                              className={`tc-submenu-item${activeTool === item.id ? " on" : ""}`}
                              onClick={() => { setActiveTool(item.id); setOpenSubmenu(null); }}>
                              <span className="tc-submenu-icon"><item.icon /></span>
                              <span className="tc-submenu-label">{item.label}</span>
                              {item.shortcut && <span className="tc-submenu-shortcut">{item.shortcut}</span>}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button key={t.id} title={t.label}
                className={`tc-draw-btn${activeTool === t.id ? " on" : ""}`}
                onClick={() => setActiveTool(t.id)}>
                <t.icon />
              </button>
            );
          })}
        </div>

        {/* Chart canvas */}
        <div className="tc-canvas-wrap">
          <div ref={containerRef} className="tc-canvas" />

          {loading && (
            <div className="tc-loading">
              <div className="tc-spinner" />
              <span>Loading {symbol}…</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom range bar (matches SCS Trade) ───────────────────────── */}
      <div className="tc-foot">
        {RANGE_BTNS.map(r => (
          <button key={r.label} className={`tc-foot-btn${activeRange === r.label ? " on" : ""}`}
            onClick={() => setActiveRange(r.label)}>{r.label}</button>
        ))}
        <button className="tc-foot-btn tc-icon-btn" title="Go to date">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </button>
        <div style={{ flex: 1 }} />
        <span className="tc-foot-tz">UTC+5 · Karachi</span>
        <button className="tc-foot-btn" onClick={() => chartRef.current?.timeScale().fitContent()}>Auto</button>
      </div>

      {/* Compare chips */}
      {compareSymbols.length > 0 && (
        <div className="tc-compare-chips">
          {compareSymbols.map(r => (
            <span key={r.symbol} className="tc-compare-chip">
              {r.symbol}
              <button onClick={() => removeCompareSymbol(r.symbol)}>✕</button>
            </span>
          ))}
        </div>
      )}

      {/* Modals */}
      {showSearch && <SymbolSearch onSelect={selectSymbol} onClose={() => setShowSearch(false)} />}
      {showIndicators && (
        <IndicatorsPanel
          active={activeIndicators}
          onToggle={id => setActiveInd(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
          onClose={() => setShowIndicators(false)}
          favorites={favIndicators}
          onFav={id => setFavInd(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
        />
      )}
      {showCompare && <CompareSymbols onSelect={addCompareSymbol} onClose={() => setShowCompare(false)} />}
      {showQuickSearch && <QuickSearch onClose={() => setShowQuickSearch(false)} commands={quickCommands} />}
    </div>
  );
}

// ── CSS — fully scoped to .tc, zero global leakage ───────────────────────────

const CSS = `
/* ─ Root tokens ─ */
.tc {
  --bg:       #ffffff;
  --bg2:      #f8f9fa;
  --bg3:      #f1f3f4;
  --border:   #e0e3eb;
  --text:     #131722;
  --muted:    #787b86;
  --accent:   #d4af37;
  --acc-bg:   rgba(212,175,55,0.12);
  --acc-fg:   #a07a00;
  --hover:    #f1f3f6;
  --up:       #089981;
  --dn:       #f23645;
  display: flex; flex-direction: column;
  height: 100vh; min-height: 400px;
  font-family: 'Inter','Segoe UI',system-ui,sans-serif;
  font-size: 12px; user-select: none; overflow: hidden;
  background: var(--bg); color: var(--text);
}
.tc.tc-dk {
  --bg:     #131722;
  --bg2:    #1e222d;
  --bg3:    #2a2e39;
  --border: #2a2e39;
  --text:   #d1d4dc;
  --muted:  #787b86;
  --hover:  #1e222d;
  --acc-fg: #d4af37;
}

/* ─ Demo banner ─ */
.tc-demo-bar {
  display:flex; align-items:center; justify-content:space-between;
  padding: 4px 14px; font-size:11px; font-weight:600; flex-shrink:0;
  background:#7c3aed18; color:#7c3aed; border-bottom:1px solid #7c3aed33;
}
.tc-dk .tc-demo-bar { color:#a78bfa; }
.tc-demo-bar button { background:none; border:none; cursor:pointer; font-size:14px; opacity:0.6; color:inherit; }
.tc-demo-bar button:hover { opacity:1; }

/* ─ Top bar ─ */
.tc-bar {
  display:flex; align-items:center; gap:1px;
  height:40px; padding:0 6px; flex-shrink:0;
  background:var(--bg); border-bottom:1px solid var(--border);
  overflow-x:auto; overflow-y:hidden; scrollbar-width:none;
}
.tc-sym-btn {
  display:flex; align-items:center; gap:5px; padding:4px 8px;
  border-radius:4px; border:1px solid var(--border); background:transparent;
  cursor:pointer; font-weight:700; font-size:13px; color:var(--text);
  white-space:nowrap;
}
.tc-sym-btn:hover { background:var(--hover); }
.tc-sym-text { max-width:120px; overflow:hidden; text-overflow:ellipsis; }
.tc-bar-btn {
  display:inline-flex; align-items:center; gap:4px; padding:3px 7px;
  border-radius:4px; border:none; background:transparent; cursor:pointer;
  font-size:11px; font-weight:500; white-space:nowrap; color:var(--text);
  transition:background 0.1s;
}
.tc-bar-btn:hover { background:var(--hover); }
.tc-bar-btn.on { background:var(--acc-bg); color:var(--acc-fg); }
.tc-icon-btn { padding:4px 5px !important; }
.tc-sep { width:1px; height:18px; background:var(--border); margin:0 3px; flex-shrink:0; }
.tc-grp { display:flex; align-items:center; gap:1px; }

/* ─ OHLCV info bar ─ */
.tc-info-bar {
  display:flex; align-items:center; gap:8px; flex-wrap:wrap;
  padding:2px 10px; min-height:24px; flex-shrink:0; font-size:11px;
  border-bottom:1px solid var(--border); background:var(--bg);
}
.tc-info-sym { font-weight:700; font-size:12px; color:var(--text); }
.tc-ohlc { color:var(--muted); }
.tc-ohlc b { color:var(--text); margin-left:2px; }
.tc-chg { font-weight:700; font-size:11px; }
.tc-spin { display:inline-block; animation:tc-spin 1s linear infinite; }
@keyframes tc-spin { to { transform:rotate(360deg); } }
.tc-retry {
  padding:1px 7px; border-radius:3px; border:1px solid var(--border);
  background:transparent; cursor:pointer; font-size:10px; font-weight:700; color:var(--text);
}
.tc-retry:hover { background:var(--hover); }

/* ─ Main area ─ */
.tc-main { display:flex; flex:1; min-height:0; overflow:hidden; }

/* ─ Drawing toolbar ─ */
.tc-draw {
  width:46px; flex-shrink:0; display:flex; flex-direction:column;
  align-items:center; padding:6px 0; gap:2px;
  overflow-y:auto; overflow-x:hidden;
  scrollbar-width:thin; scrollbar-color:var(--border) transparent;
  background:var(--bg); border-right:1px solid var(--border);
}
.tc-draw::-webkit-scrollbar { width:3px; }
.tc-draw::-webkit-scrollbar-thumb { background:var(--border); border-radius:2px; }
.tc-draw-group { position:relative; }
.tc-has-sub { position:relative !important; }
.tc-sub-tri {
  position:absolute; bottom:3px; right:3px;
  font-size:8px; line-height:1; color:var(--muted);
  opacity:0; pointer-events:all; cursor:pointer;
  transition:opacity 0.12s, color 0.12s;
  user-select:none;
}
.tc-draw-btn:hover .tc-sub-tri,
.tc-sub-tri.open { opacity:1 !important; }
.tc-sub-tri.open { color:var(--acc-fg); }
.tc-submenu {
  position:absolute; left:calc(100% + 8px); top:0; z-index:9999;
  background:var(--surface); border:1px solid var(--border); border-radius:8px;
  box-shadow:0 8px 32px rgba(0,0,0,0.22); padding:6px 0; min-width:240px;
  max-height:82vh; overflow-y:auto;
}
.tc-submenu-group {
  font-size:9px; font-weight:800; letter-spacing:0.1em; color:var(--muted);
  padding:10px 16px 4px; text-transform:uppercase;
}
.tc-submenu-group:first-child { padding-top:6px; }
.tc-submenu-item {
  display:flex; align-items:center; gap:10px; width:100%; padding:7px 16px;
  background:none; border:none; cursor:pointer; text-align:left;
  color:var(--text); font-size:12.5px; font-weight:400; transition:background 0.1s;
}
.tc-submenu-item:hover { background:var(--hover); }
.tc-submenu-item.on { background:var(--acc-bg); color:var(--acc-fg); font-weight:600; }
.tc-submenu-icon { width:22px; flex-shrink:0; display:flex; align-items:center; justify-content:center; opacity:0.75; }
.tc-submenu-item.on .tc-submenu-icon { opacity:1; }
.tc-submenu-label { flex:1; }
.tc-submenu-shortcut { font-size:10px; color:var(--muted); white-space:nowrap; }
.tc-draw-btn {
  width:38px; height:36px; display:flex; align-items:center; justify-content:center;
  border:none; border-radius:5px; cursor:pointer;
  background:transparent; color:var(--muted);
}
.tc-draw-btn svg { width:20px; height:20px; }
.tc-draw-btn:hover { background:var(--hover); color:var(--text); }
.tc-draw-btn.on { background:var(--acc-bg); color:var(--acc-fg); }
.tc-draw-sep { width:30px; height:1px; background:var(--border); margin:4px 0; flex-shrink:0; }

/* ─ Canvas ─ */
.tc-canvas-wrap { flex:1; position:relative; min-width:0; min-height:0; background:var(--bg); }
.tc-canvas { width:100%; height:100%; }
.tc-loading {
  position:absolute; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:10px;
  background:rgba(255,255,255,0.8); z-index:20; font-size:13px; color:var(--muted);
}
.tc-dk .tc-loading { background:rgba(19,23,34,0.8); }
.tc-spinner {
  width:28px; height:28px; border-radius:50%;
  border:2.5px solid var(--border); border-top-color:var(--accent);
  animation:tc-spin 0.75s linear infinite;
}

/* ─ Footer ─ */
.tc-foot {
  display:flex; align-items:center; gap:1px; padding:0 8px;
  height:30px; flex-shrink:0; border-top:1px solid var(--border); background:var(--bg);
}
.tc-foot-btn {
  display:inline-flex; align-items:center; gap:4px; padding:2px 6px;
  border-radius:3px; border:none; background:transparent; cursor:pointer;
  font-size:11px; font-weight:600; color:var(--muted);
}
.tc-foot-btn:hover { background:var(--hover); color:var(--text); }
.tc-foot-btn.on { background:var(--acc-bg); color:var(--acc-fg); }
.tc-foot-tz { font-size:10px; color:var(--muted); margin:0 8px; }

/* ─ Modal overlay ─ */
.tc-overlay-bg {
  position:fixed; inset:0; z-index:9000; background:rgba(0,0,0,0.35);
  display:flex; align-items:flex-start; justify-content:center; padding-top:64px;
}

/* ─ Symbol search modal ─ */
.tc-search-modal {
  width:min(800px,94vw); background:var(--bg); border:1px solid var(--border);
  border-radius:8px; overflow:hidden; display:flex; flex-direction:column;
  max-height:72vh; box-shadow:0 16px 48px rgba(0,0,0,0.18);
}
.tc-dk .tc-search-modal { box-shadow:0 16px 48px rgba(0,0,0,0.55); }
.tc-sm-input-row {
  display:flex; align-items:center; gap:10px; padding:12px 16px;
  border-bottom:1px solid var(--border); color:var(--muted);
}
.tc-sm-input {
  flex:1; background:transparent; border:none; outline:none;
  font-size:15px; color:var(--text); font-family:inherit;
}
.tc-sm-cats {
  display:flex; gap:4px; padding:7px 12px; flex-wrap:wrap;
  border-bottom:1px solid var(--border); background:var(--bg2);
}
.tc-sm-cat {
  padding:2px 10px; border-radius:20px; font-size:11px; font-weight:600;
  border:1px solid var(--border); background:transparent; cursor:pointer; color:var(--muted);
}
.tc-sm-cat:hover { color:var(--text); }
.tc-sm-cat.on { background:var(--acc-bg); color:var(--acc-fg); border-color:var(--accent); }
.tc-sm-header {
  display:flex; gap:8px; padding:5px 16px; font-size:9.5px; font-weight:700;
  letter-spacing:0.06em; color:var(--muted); border-bottom:1px solid var(--border);
  background:var(--bg2);
}
.tc-sm-list { overflow-y:auto; flex:1; }
.tc-sm-row {
  display:flex; align-items:center; gap:8px; padding:9px 16px;
  cursor:pointer; border-bottom:1px solid var(--border);
}
.tc-sm-row:hover, .tc-sm-row.on { background:var(--hover); }
.tc-sm-sym  { width:90px; font-weight:700; font-size:12px; white-space:nowrap; overflow:hidden; color:var(--text); }
.tc-sm-name { flex:1; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--muted); }
.tc-sm-meta { font-size:10px; color:var(--muted); }
.tc-sm-meta:nth-of-type(3) { width:60px; }
.tc-sm-meta:nth-of-type(4) { width:65px; }
.tc-sm-empty { padding:32px 16px; text-align:center; color:var(--muted); }
.tc-sm-footer {
  display:flex; gap:16px; padding:6px 16px; font-size:10px; color:var(--muted);
  border-top:1px solid var(--border); background:var(--bg2);
}

/* ─ Spinner (small) ─ */
.tc-spinner-sm {
  width:14px; height:14px; border-radius:50%;
  border:2px solid var(--border); border-top-color:var(--accent);
  animation:tc-spin 0.7s linear infinite; flex-shrink:0;
}

/* ─ Indicators modal ─ */
.tc-ind-modal {
  width:420px; background:var(--bg); border:1px solid var(--border);
  border-radius:8px; overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,0.15);
}
.tc-dk .tc-ind-modal { box-shadow:0 12px 40px rgba(0,0,0,0.5); }
.tc-ind-head {
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 16px; font-weight:700; font-size:14px;
  border-bottom:1px solid var(--border); background:var(--bg2);
}
.tc-ind-search {
  display:flex; align-items:center; gap:10px; padding:10px 16px;
  border-bottom:1px solid var(--border); color:var(--muted);
}
.tc-ind-body { overflow-y:auto; max-height:380px; }
.tc-ind-row {
  display:flex; align-items:center; gap:12px; padding:10px 16px;
  cursor:pointer; border-bottom:1px solid var(--border);
}
.tc-ind-row:hover, .tc-ind-row.on { background:var(--hover); }
.tc-ind-chk {
  width:16px; height:16px; border-radius:3px; border:1.5px solid var(--border);
  display:flex; align-items:center; justify-content:center;
  font-size:10px; font-weight:800; flex-shrink:0; color:var(--text);
}
.tc-ind-chk.on { background:var(--accent); border-color:var(--accent); color:#07111f; }
.tc-ind-label { flex:1; font-size:13px; }
.tc-ind-group { font-size:10px; color:var(--muted); }

/* ─ Icon btn (generic close/action) ─ */
.tc-icon-btn {
  background:none; border:none; cursor:pointer; font-size:14px;
  opacity:0.55; padding:2px 6px; color:var(--text); display:inline-flex; align-items:center;
}
.tc-icon-btn:hover { opacity:1; }

/* ─ Polished Indicators modal v2 ─ */
.tc-ind-modal2 {
  width:min(520px,94vw); background:var(--bg); border:1px solid var(--border);
  border-radius:8px; overflow:hidden; box-shadow:0 16px 48px rgba(0,0,0,0.18);
  display:flex; flex-direction:column; max-height:72vh;
}
.tc-dk .tc-ind-modal2 { box-shadow:0 16px 48px rgba(0,0,0,0.55); }
.tc-ind-search2 {
  display:flex; align-items:center; gap:10px; padding:12px 16px;
  border-bottom:1px solid var(--border); color:var(--muted);
}
.tc-ind-header-row {
  padding:6px 16px 4px; font-size:10px; font-weight:700; letter-spacing:0.07em;
  color:var(--muted); border-bottom:1px solid var(--border); background:var(--bg2);
}
.tc-ind-body2 { overflow-y:auto; flex:1; }
.tc-ind-row2 {
  display:flex; align-items:center; gap:8px; padding:10px 16px;
  cursor:pointer; border-bottom:1px solid var(--border); min-height:40px;
}
.tc-ind-row2:hover, .tc-ind-row2.cursor { background:var(--hover); }
.tc-ind-star {
  background:none; border:none; cursor:pointer; font-size:14px; padding:0 2px;
  line-height:1; flex-shrink:0; transition:color 0.1s;
}
.tc-ind-star:hover { opacity:1 !important; }
.tc-ind-label2 { flex:1; font-size:13px; color:var(--text); }
.tc-ind-active-dot {
  width:7px; height:7px; border-radius:50%; background:var(--accent); flex-shrink:0;
}
.tc-ind-unavail {
  font-size:9px; font-weight:800; color:#94a3b8; border:1px solid #e0e3eb;
  border-radius:3px; padding:1px 4px; letter-spacing:0.04em;
}
.tc-ind-footer2 {
  padding:8px 16px; border-top:1px solid var(--border); background:var(--bg2);
  min-height:32px; display:flex; align-items:center;
}

/* ─ Compare modal ─ */
.tc-compare-modal {
  width:min(640px,94vw); background:var(--bg); border:1px solid var(--border);
  border-radius:8px; overflow:hidden; display:flex; flex-direction:column;
  max-height:70vh; box-shadow:0 16px 48px rgba(0,0,0,0.18);
}
.tc-compare-filters {
  display:flex; gap:6px; padding:8px 16px;
  border-bottom:1px solid var(--border); background:var(--bg2);
}
.tc-compare-filter-btn {
  padding:3px 14px; border-radius:20px; font-size:12px; font-weight:600;
  border:1.5px solid var(--border); background:transparent; cursor:pointer; color:var(--muted);
  transition:all 0.1s;
}
.tc-compare-filter-btn:hover { color:var(--text); }
.tc-compare-filter-btn.on { background:var(--text); color:var(--bg); border-color:var(--text); }
.tc-compare-chips {
  display:flex; gap:6px; padding:4px 10px; flex-wrap:wrap;
  border-bottom:1px solid var(--border); background:var(--bg2); flex-shrink:0;
}
.tc-compare-chip {
  display:inline-flex; align-items:center; gap:4px; padding:2px 8px;
  border-radius:12px; background:var(--acc-bg); color:var(--acc-fg);
  font-size:11px; font-weight:700; border:1px solid var(--accent);
}
.tc-compare-chip button { background:none; border:none; cursor:pointer; font-size:11px; color:inherit; opacity:0.7; padding:0; }
.tc-compare-chip button:hover { opacity:1; }

/* ─ Quick search modal ─ */
.tc-qs-modal {
  width:min(560px,94vw); background:var(--bg); border:1px solid var(--border);
  border-radius:8px; overflow:hidden; box-shadow:0 16px 48px rgba(0,0,0,0.22);
}
.tc-qs-row {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 20px; cursor:pointer; border-bottom:1px solid var(--border);
}
.tc-qs-row:hover, .tc-qs-row.on { background:var(--hover); }
.tc-qs-label { font-size:13px; color:var(--text); }
.tc-qs-group { font-size:10px; color:var(--muted); font-weight:600; letter-spacing:0.04em; }

/* ─ Generic dropdown ─ */
.tc-dropdown {
  position:absolute; z-index:8000; background:var(--bg); border:1px solid var(--border);
  border-radius:6px; box-shadow:0 8px 24px rgba(0,0,0,0.12); overflow-y:auto;
  max-height:400px; min-width:180px;
}
.tc-dk .tc-dropdown { box-shadow:0 8px 24px rgba(0,0,0,0.5); }
.tc-dd-row {
  display:flex; align-items:center; gap:6px; padding:8px 12px;
  cursor:pointer; font-size:12px; color:var(--text); border-bottom:1px solid var(--border);
}
.tc-dd-row:hover { background:var(--hover); }
.tc-dd-row.selected { background:var(--acc-bg); color:var(--acc-fg); }
.tc-dd-group-label {
  padding:6px 14px 3px; font-size:9.5px; font-weight:800; letter-spacing:0.07em;
  color:var(--muted); background:var(--bg2); position:sticky; top:0; z-index:1;
}
`;
