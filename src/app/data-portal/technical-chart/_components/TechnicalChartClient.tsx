"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  createChart, CandlestickSeries, LineSeries, AreaSeries,
  BarSeries, HistogramSeries, IChartApi, ISeriesApi,
  ColorType, CrosshairMode, UTCTimestamp,
} from "lightweight-charts";

/* ─── types ─── */
interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number; }
interface Quote  { symbol: string; name?: string; price: number; open: number; high: number; low: number; close: number; change: number; changePct: number; volume: number; }
interface SymResult { symbol: string; name: string; type: string; exchange: string; sector: string; country: string; }

type DrawTool = "cursor"|"crosshair"|"trendline"|"hline"|"vline"|"fib"|"brush"|"text"|"emoji"|"measure"|"zoom"|"magnet"|"lock"|"hide"|"delete";
interface Pt { x: number; y: number; }
interface Drawing { id: string; tool: DrawTool; pts: Pt[]; text?: string; color: string; }

/* ─── indicator math ─── */
function calcSMA(c: Candle[], p: number) {
  return c.slice(p - 1).map((_, i) => ({
    time: c[i + p - 1].time as UTCTimestamp,
    value: c.slice(i, i + p).reduce((s, x) => s + x.close, 0) / p,
  }));
}
function calcBB(c: Candle[], p = 20, k = 2) {
  return c.slice(p - 1).map((_, i) => {
    const sl = c.slice(i, i + p).map(x => x.close);
    const mean = sl.reduce((s, x) => s + x, 0) / p;
    const std  = Math.sqrt(sl.reduce((s, x) => s + (x - mean) ** 2, 0) / p);
    return { time: c[i + p - 1].time as UTCTimestamp, upper: mean + k * std, mid: mean, lower: mean - k * std };
  });
}
function calcRSI(c: Candle[], p = 14) {
  if (c.length <= p) return [];
  let ag = 0, al = 0;
  for (let i = 1; i <= p; i++) {
    const d = c[i].close - c[i-1].close;
    if (d > 0) ag += d; else al += -d;
  }
  ag /= p; al /= p;
  const out: { time: UTCTimestamp; value: number }[] = [];
  for (let i = p; i < c.length; i++) {
    if (i > p) {
      const d = c[i].close - c[i-1].close;
      ag = (ag * (p-1) + (d > 0 ? d : 0)) / p;
      al = (al * (p-1) + (d < 0 ? -d : 0)) / p;
    }
    const rs = al === 0 ? 100 : ag / al;
    out.push({ time: c[i].time as UTCTimestamp, value: 100 - 100 / (1 + rs) });
  }
  return out;
}
function calcMACD(c: Candle[], fast=12, slow=26, sig=9) {
  const ema = (arr: number[], p: number) => {
    const k = 2 / (p + 1), r: number[] = [arr.slice(0,p).reduce((s,x)=>s+x,0)/p];
    for (let i = p; i < arr.length; i++) r.push(arr[i]*k + r[r.length-1]*(1-k));
    return r;
  };
  const closes = c.map(x => x.close);
  const f = ema(closes, fast), s = ema(closes, slow);
  const startFast = fast - 1, startSlow = slow - 1;
  const macd = s.map((sv, i) => ({ t: c[startSlow + i].time, v: f[startFast + i + (startSlow - startFast)] - sv }));
  if (macd.length < sig) return { macd: [], signal: [], hist: [] };
  const sigLine = ema(macd.map(m => m.v), sig);
  return {
    macd:   macd.map((m, i) => ({ time: m.t as UTCTimestamp, value: m.v })),
    signal: sigLine.map((v, i) => ({ time: macd[sig - 1 + i].t as UTCTimestamp, value: v })),
    hist:   sigLine.map((v, i) => ({ time: macd[sig - 1 + i].t as UTCTimestamp, value: macd[sig - 1 + i].v - v })),
  };
}

/* ─── RANGE helper ─── */
const RANGE_SECONDS: Record<string, number> = {
  "1d": 86400, "5d": 86400*5, "1m": 86400*30, "3m": 86400*90,
  "6m": 86400*180, "1y": 86400*365, "5y": 86400*365*5,
};

/* ─── LEFT TOOLBAR DEFINITION ─── */
const LEFT_TOOLS: { tool: DrawTool; icon: React.ReactElement; label: string; sep?: boolean }[] = [
  { tool:"cursor",    label:"Cursor",         icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2l10 6-5 1-2 5z"/></svg> },
  { tool:"crosshair", label:"Crosshair",      icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="8" y1="1" x2="8" y2="6"/><line x1="8" y1="10" x2="8" y2="15"/><line x1="1" y1="8" x2="6" y2="8"/><line x1="10" y1="8" x2="15" y2="8"/><circle cx="8" cy="8" r="2"/></svg> },
  { tool:"trendline", label:"Trend Line",     icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="2" y1="13" x2="14" y2="3"/><circle cx="2" cy="13" r="1.5" fill="currentColor"/><circle cx="14" cy="3" r="1.5" fill="currentColor"/></svg>, sep:true },
  { tool:"hline",     label:"Horizontal",     icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="1" y1="8" x2="15" y2="8"/><line x1="5" y1="5" x2="5" y2="11" strokeDasharray="1.5"/></svg> },
  { tool:"vline",     label:"Vertical",       icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="8" y1="1" x2="8" y2="15"/><line x1="5" y1="6" x2="11" y2="6" strokeDasharray="1.5"/></svg> },
  { tool:"fib",       label:"Fibonacci",      icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="7" x2="14" y2="7"/><line x1="2" y1="9" x2="14" y2="9"/><line x1="2" y1="11" x2="14" y2="11"/><line x1="2" y1="13" x2="14" y2="13"/><line x1="2" y1="3" x2="2" y2="14" strokeWidth="1.8"/></svg>, sep:true },
  { tool:"brush",     label:"Freehand",       icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 14 Q4 8 8 6 Q12 4 13 2"/><path d="M2 14 Q3 13 4 14" strokeWidth="2.5"/></svg> },
  { tool:"text",      label:"Text",           icon:<svg viewBox="0 0 16 16" fill="currentColor"><text x="3" y="13" fontSize="12" fontWeight="700" fontFamily="serif">T</text></svg>, sep:true },
  { tool:"emoji",     label:"Marker",         icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="8" cy="7" r="5"/><path d="M6 9 Q8 11 10 9"/><circle cx="6.5" cy="6" r=".8" fill="currentColor"/><circle cx="9.5" cy="6" r=".8" fill="currentColor"/></svg> },
  { tool:"measure",   label:"Measure",        icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="5" width="12" height="6" rx="1"/><line x1="2" y1="8" x2="14" y2="8" strokeDasharray="2"/></svg>, sep:true },
  { tool:"zoom",      label:"Zoom",           icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/><line x1="5" y1="7" x2="9" y2="7"/><line x1="7" y1="5" x2="7" y2="9"/></svg> },
  { tool:"magnet",    label:"Magnet",         icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 3 Q4 10 8 10 Q12 10 12 3"/><line x1="3" y1="3" x2="5" y2="3"/><line x1="11" y1="3" x2="13" y2="3"/></svg>, sep:true },
  { tool:"lock",      label:"Lock Drawings",  icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="7" width="8" height="7" rx="1"/><path d="M6 7V5a2 2 0 0 1 4 0v2"/></svg> },
  { tool:"hide",      label:"Show/Hide",      icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 8 Q8 1 15 8 Q8 15 1 8"/><circle cx="8" cy="8" r="2.5"/></svg> },
  { tool:"delete",    label:"Delete All",     icon:<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="3 4 13 4"/><path d="M6 4V3h4v1"/><path d="M5 4l.5 9h5l.5-9"/><line x1="7" y1="7" x2="7" y2="11"/><line x1="9" y1="7" x2="9" y2="11"/></svg> },
];

const ALERT_CONDITIONS = ["Greater than","Less than","Crosses above","Crosses below","% Change up","% Change down"];
const STUDY_LIST = ["Moving Average","Bollinger Bands","RSI","MACD","Volume"];
const LS_KEY = "stockifyy_chart_v3";

function loadSaved(): { sym: string; tf: string; chartType: string; dark: boolean; studies: string[]; range: string } | null {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}

export default function TechnicalChartClient() {
  const saved = loadSaved();
  const [sym,       setSym]     = useState(saved?.sym       ?? "KSE100");
  const [symName,   setSymName] = useState("KSE-100 Index");
  const [tf,        setTf]      = useState(saved?.tf        ?? "D");
  const [chartType, setCT]      = useState(saved?.chartType ?? "candlestick");
  const [dark,      setDark]    = useState(saved?.dark      ?? false);
  const [studies,   setStudies] = useState<string[]>(saved?.studies ?? ["Volume"]);
  const [range,     setRange]   = useState(saved?.range     ?? "1y");

  /* data state */
  const [candles,   setCandles]   = useState<Candle[]>([]);
  const [quote,     setQuote]     = useState<Quote|null>(null);
  const [dataStatus,setDataStatus]= useState<"loading"|"ok"|"empty"|"error">("loading");
  const [hoverOHLC, setHoverOHLC] = useState<{o:number;h:number;l:number;c:number;v:number}|null>(null);

  /* drawing */
  const [activeTool,  setActiveTool]  = useState<DrawTool>("cursor");
  const [drawings,    setDrawings]    = useState<Drawing[]>([]);
  const [drawingsVis, setDrawingsVis] = useState(true);
  const [magnetOn,    setMagnetOn]    = useState(false);
  const [lockOn,      setLockOn]      = useState(false);
  const [isDrawing,   setIsDrawing]   = useState(false);
  const [drawStart,   setDrawStart]   = useState<Pt|null>(null);
  const [drawCur,     setDrawCur]     = useState<Pt|null>(null);
  const [brushPath,   setBrushPath]   = useState<Pt[]>([]);
  const [textPos,     setTextPos]     = useState<Pt|null>(null);
  const [textVal,     setTextVal]     = useState("");
  const [drawColor,   setDrawColor]   = useState("#2962ff");
  const [crosshairPos,setCrosshairPos]= useState({x:0,y:0,vis:false});

  /* panels */
  const [fxOpen,       setFxOpen]       = useState(false);
  const [tfOpen,       setTfOpen]       = useState(false);
  const [saveOpen,     setSaveOpen]     = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertOpen,    setAlertOpen]    = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [alertSym,     setAlertSym]     = useState("KSE100");
  const [alertCond,    setAlertCond]    = useState("Greater than");
  const [alertPrice,   setAlertPrice]   = useState("");
  const [alertSent,    setAlertSent]    = useState(false);
  const [saveStatus,   setSaveStatus]   = useState<"idle"|"saved">("idle");
  const [searchQ,      setSearchQ]      = useState("");
  const [searchResults,setSearchResults]= useState<SymResult[]>([]);
  const [isFS,         setIsFS]         = useState(false);
  const [toastMsg,     setToastMsg]     = useState("");
  const [toastOn,      setToastOn]      = useState(false);

  /* refs */
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef         = useRef<HTMLCanvasElement>(null);
  const searchInputRef    = useRef<HTMLInputElement>(null);
  const textInputRef      = useRef<HTMLInputElement>(null);
  const chartRef          = useRef<IChartApi|null>(null);
  const mainSeriesRef     = useRef<ISeriesApi<"Candlestick"|"Line"|"Area"|"Bar">|null>(null);
  const volSeriesRef      = useRef<ISeriesApi<"Histogram">|null>(null);
  const indSeriesRef      = useRef<ISeriesApi<any>[]>([]);
  const toastTimer        = useRef<ReturnType<typeof setTimeout>|null>(null);
  const saveTimer         = useRef<ReturnType<typeof setTimeout>|null>(null);
  const searchTimer       = useRef<ReturnType<typeof setTimeout>|null>(null);
  const candlesRef        = useRef<Candle[]>([]);

  /* inject CSS once */
  useEffect(() => {
    if (document.getElementById("tc3-css")) return;
    const s = document.createElement("style"); s.id = "tc3-css";
    s.textContent = `
      .tc3-ltool{display:flex;align-items:center;justify-content:center;width:38px;height:34px;border:none;background:transparent;cursor:pointer;border-radius:4px;transition:background .12s,color .12s;position:relative;}
      .tc3-ltool:hover{background:#f0f0f0;color:#111;}
      .tc3-ltool.active{background:#e8f0fe;color:#2962ff;}
      .tc3-ltool.dark{color:#aaa;}.tc3-ltool.dark:hover{background:#2d3348;color:#e2e6f0;}
      .tc3-ltool.active.dark{background:#1e3a5f;color:#93c5fd;}
      .tc3-tip{position:absolute;left:calc(100% + 6px);top:50%;transform:translateY(-50%);background:#333;color:#fff;font-size:11px;padding:3px 7px;border-radius:3px;white-space:nowrap;pointer-events:none;z-index:999;opacity:0;transition:opacity .12s;}
      .tc3-ltool:hover .tc3-tip{opacity:1;}
    `;
    document.head.appendChild(s);
  }, []);

  /* outside click closes panels */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-p]"))
        { setFxOpen(false); setTfOpen(false); setSaveOpen(false); setSettingsOpen(false); }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = () => setIsFS(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  /* search */
  useEffect(() => {
    if (!searchOpen) { setSearchQ(""); setSearchResults([]); return; }
    setTimeout(() => searchInputRef.current?.focus(), 40);
    fetch("/api/portal/chart/search").then(r => r.json()).then(d => setSearchResults(d.results ?? []));
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetch(`/api/portal/chart/search?q=${encodeURIComponent(searchQ)}`).then(r => r.json()).then(d => setSearchResults(d.results ?? []));
    }, 200);
  }, [searchQ, searchOpen]);

  /* toast */
  const toast = useCallback((msg: string) => {
    setToastMsg(msg); setToastOn(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2400);
  }, []);

  /* ─── CHART CREATION ─── */
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    /* destroy old chart */
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: dark ? "#131722" : "#ffffff" },
        textColor: dark ? "#d1d4dc" : "#333333",
      },
      grid: {
        vertLines: { color: dark ? "#1e253522" : "#f0f3fa" },
        horzLines: { color: dark ? "#1e253522" : "#f0f3fa" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: dark ? "#2d3348" : "#e0e0e0" },
      timeScale: { borderColor: dark ? "#2d3348" : "#e0e0e0", timeVisible: true, secondsVisible: false },
      width: container.clientWidth,
      height: container.clientHeight,
    });
    chartRef.current = chart;

    /* resize observer */
    const ro = new ResizeObserver(() => {
      if (chartRef.current && container)
        chartRef.current.resize(container.clientWidth, container.clientHeight);
    });
    ro.observe(container);

    /* subscribe crosshair */
    chart.subscribeCrosshairMove(param => {
      if (param.time && param.seriesData.size > 0) {
        const ms = mainSeriesRef.current;
        if (ms) {
          const d = param.seriesData.get(ms) as any;
          if (d) setHoverOHLC({ o: d.open ?? d.value, h: d.high ?? d.value, l: d.low ?? d.value, c: d.close ?? d.value, v: 0 });
        }
      } else {
        setHoverOHLC(null);
      }
    });

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, [dark]);

  /* ─── SERIES + DATA ─── */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    /* remove old series */
    if (mainSeriesRef.current) { try { chart.removeSeries(mainSeriesRef.current as any); } catch {} mainSeriesRef.current = null; }
    if (volSeriesRef.current)  { try { chart.removeSeries(volSeriesRef.current  as any); } catch {} volSeriesRef.current = null; }
    indSeriesRef.current.forEach(s => { try { chart.removeSeries(s); } catch {} });
    indSeriesRef.current = [];

    const up = "#26a69a", dn = "#ef5350";

    /* add main series */
    let main: ISeriesApi<any>;
    if (chartType === "line") {
      main = chart.addSeries(LineSeries, { color: "#2962ff", lineWidth: 2 });
    } else if (chartType === "area") {
      main = chart.addSeries(AreaSeries, { lineColor: "#2962ff", topColor: "#2962ff44", bottomColor: "#2962ff00", lineWidth: 2 });
    } else if (chartType === "bar") {
      main = chart.addSeries(BarSeries, { upColor: up, downColor: dn });
    } else {
      main = chart.addSeries(CandlestickSeries, { upColor: up, downColor: dn, borderVisible: false, wickUpColor: up, wickDownColor: dn });
    }
    mainSeriesRef.current = main;

    /* volume */
    if (studies.includes("Volume")) {
      const vol = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "vol" });
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      volSeriesRef.current = vol;
    }

    /* MA */
    const extraSeries: ISeriesApi<any>[] = [];
    if (studies.includes("Moving Average") && candlesRef.current.length > 0) {
      const ma = chart.addSeries(LineSeries, { color: "#ff9800", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      ma.setData(calcSMA(candlesRef.current, 20));
      extraSeries.push(ma);
    }

    /* BB */
    if (studies.includes("Bollinger Bands") && candlesRef.current.length > 0) {
      const bb = calcBB(candlesRef.current);
      const bbColors = ["#7b61ff", "#7b61ff88", "#7b61ff"];
      ["upper","mid","lower"].forEach((k, i) => {
        const s = chart.addSeries(LineSeries, { color: bbColors[i], lineWidth: 1, lineStyle: i===1?2:0, priceLineVisible: false, lastValueVisible: false });
        s.setData(bb.map(b => ({ time: b.time, value: (b as any)[k] })));
        extraSeries.push(s);
      });
    }

    /* RSI sub-pane */
    if (studies.includes("RSI") && candlesRef.current.length > 0) {
      const rsiData = calcRSI(candlesRef.current);
      if (rsiData.length) {
        const rsi = chart.addSeries(LineSeries, { color: "#9c27b0", lineWidth: 1, priceLineVisible: false, lastValueVisible: true }, 1);
        rsi.setData(rsiData);
        extraSeries.push(rsi);
      }
    }

    /* MACD sub-pane */
    if (studies.includes("MACD") && candlesRef.current.length > 0) {
      const { macd, signal, hist } = calcMACD(candlesRef.current);
      if (macd.length) {
        const pane = studies.includes("RSI") ? 2 : 1;
        const macdLine = chart.addSeries(LineSeries, { color: "#2196f3", lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, pane);
        const sigLine  = chart.addSeries(LineSeries, { color: "#ff5722", lineWidth: 1, priceLineVisible: false, lastValueVisible: false }, pane);
        const histSeries = chart.addSeries(HistogramSeries, { priceLineVisible: false, lastValueVisible: false }, pane);
        macdLine.setData(macd); sigLine.setData(signal);
        histSeries.setData(hist.map(h => ({ ...h, color: h.value >= 0 ? "#26a69a88" : "#ef535088" })));
        extraSeries.push(macdLine, sigLine, histSeries);
      }
    }

    indSeriesRef.current = extraSeries;

    /* populate data if we have it */
    if (candlesRef.current.length > 0) applyData(chart, candlesRef.current);
  }, [chartType, studies, dark]);

  function applyData(chart: IChartApi, data: Candle[]) {
    const up = "#26a69a", dn = "#ef5350";
    const main = mainSeriesRef.current;
    if (main) {
      if (chartType === "line" || chartType === "area") {
        main.setData(data.map(c => ({ time: c.time as UTCTimestamp, value: c.close })));
      } else {
        main.setData(data.map(c => ({ time: c.time as UTCTimestamp, open: c.open, high: c.high, low: c.low, close: c.close })));
      }
    }
    if (volSeriesRef.current) {
      volSeriesRef.current.setData(data.map(c => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? up + "88" : dn + "88",
      })));
    }
    /* MA */
    const extras = indSeriesRef.current;
    let ei = 0;
    if (studies.includes("Moving Average")) {
      extras[ei]?.setData(calcSMA(data, 20)); ei++;
    }
    if (studies.includes("Bollinger Bands")) {
      const bb = calcBB(data);
      ["upper","mid","lower"].forEach(k => {
        extras[ei]?.setData(bb.map(b => ({ time: b.time, value: (b as any)[k] }))); ei++;
      });
    }
    if (studies.includes("RSI")) {
      extras[ei]?.setData(calcRSI(data)); ei++;
    }
    if (studies.includes("MACD")) {
      const { macd, signal, hist } = calcMACD(data);
      extras[ei]?.setData(macd); ei++;
      extras[ei]?.setData(signal); ei++;
      extras[ei]?.setData(hist.map(h => ({ ...h, color: h.value >= 0 ? "#26a69a88" : "#ef535088" }))); ei++;
    }
    /* apply visible range */
    const now = Date.now() / 1000;
    const sec = RANGE_SECONDS[range];
    if (sec) {
      chart.timeScale().setVisibleRange({
        from: (now - sec) as UTCTimestamp,
        to: now as UTCTimestamp,
      });
    } else {
      chart.timeScale().fitContent();
    }
  }

  /* ─── FETCH DATA ─── */
  useEffect(() => {
    setDataStatus("loading");
    setHoverOHLC(null);

    Promise.all([
      fetch(`/api/portal/chart/history?symbol=${sym}&interval=${tf}&outputsize=2000`).then(r => r.json()),
      fetch(`/api/portal/chart/quote?symbol=${sym}`).then(r => r.json()).catch(() => null),
    ]).then(([histData, quoteData]) => {
      const data: Candle[] = histData.candles ?? [];
      candlesRef.current = data;

      if (quoteData && quoteData.price) setQuote(quoteData);
      if (quoteData?.name) setSymName(quoteData.name);

      if (data.length === 0) { setDataStatus("empty"); setCandles([]); return; }

      setCandles(data);
      setDataStatus("ok");

      const chart = chartRef.current;
      if (chart) applyData(chart, data);
    }).catch(() => setDataStatus("error"));
  }, [sym, tf]);

  /* re-apply range when it changes without refetching */
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || candlesRef.current.length === 0) return;
    const now = Date.now() / 1000;
    const sec = RANGE_SECONDS[range];
    if (sec) {
      chart.timeScale().setVisibleRange({
        from: (now - sec) as UTCTimestamp,
        to: now as UTCTimestamp,
      });
    } else {
      chart.timeScale().fitContent();
    }
  }, [range]);

  /* ─── CANVAS DRAWING ─── */
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!drawingsVis) return;
    drawings.forEach(d => renderDrawing(ctx, d, canvas.width, canvas.height));
    if (isDrawing && drawStart && drawCur && activeTool !== "brush") {
      ctx.save(); ctx.strokeStyle = drawColor; ctx.lineWidth = 1.5;
      renderPreview(ctx, activeTool, drawStart, drawCur, canvas.width, canvas.height);
      ctx.restore();
    }
    if (isDrawing && activeTool === "brush" && brushPath.length > 1) {
      ctx.save(); ctx.strokeStyle = drawColor; ctx.lineWidth = 2;
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(brushPath[0].x, brushPath[0].y);
      brushPath.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); ctx.restore();
    }
  }, [drawings, isDrawing, drawStart, drawCur, brushPath, drawColor, drawingsVis]);

  /* persist drawings to sessionStorage so Load Marks can restore them */
  useEffect(() => {
    try { sessionStorage.setItem("stockifyy_drawings", JSON.stringify(drawings)); } catch { /* ignore */ }
  }, [drawings]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const parent = canvas.parentElement; if (!parent) return;
    const ro = new ResizeObserver(() => { canvas.width = parent.clientWidth; canvas.height = parent.clientHeight; });
    ro.observe(parent);
    canvas.width = parent.clientWidth; canvas.height = parent.clientHeight;
    return () => ro.disconnect();
  }, []);

  function renderDrawing(ctx: CanvasRenderingContext2D, d: Drawing, W: number, H: number) {
    ctx.save(); ctx.strokeStyle = d.color; ctx.fillStyle = d.color; ctx.lineWidth = 1.5;
    if (d.tool === "trendline" && d.pts.length >= 2) {
      ctx.beginPath(); ctx.moveTo(d.pts[0].x, d.pts[0].y); ctx.lineTo(d.pts[1].x, d.pts[1].y); ctx.stroke();
      d.pts.slice(0,2).forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill(); });
    } else if (d.tool === "hline" && d.pts[0]) {
      ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(0,d.pts[0].y); ctx.lineTo(W,d.pts[0].y); ctx.stroke();
    } else if (d.tool === "vline" && d.pts[0]) {
      ctx.setLineDash([4,3]); ctx.beginPath(); ctx.moveTo(d.pts[0].x,0); ctx.lineTo(d.pts[0].x,H); ctx.stroke();
    } else if (d.tool === "fib" && d.pts.length >= 2) {
      const dy = d.pts[1].y - d.pts[0].y;
      [0,0.236,0.382,0.5,0.618,0.786,1].forEach(r => {
        const y = d.pts[1].y - dy*r; ctx.setLineDash(r===0||r===1?[]:[4,3]); ctx.globalAlpha=0.7;
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); ctx.globalAlpha=1;
        ctx.font = "10px Inter,sans-serif"; ctx.fillText(`${(r*100).toFixed(1)}%`, 4, y-3);
      });
    } else if (d.tool === "brush" && d.pts.length > 1) {
      ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(d.pts[0].x, d.pts[0].y);
      d.pts.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
    } else if (d.tool === "text" && d.pts[0] && d.text) {
      ctx.font = "14px Inter,sans-serif"; ctx.fillText(d.text, d.pts[0].x, d.pts[0].y);
    } else if (d.tool === "measure" && d.pts.length >= 2) {
      ctx.globalAlpha = 0.12; ctx.fillRect(d.pts[0].x,d.pts[0].y,d.pts[1].x-d.pts[0].x,d.pts[1].y-d.pts[0].y);
      ctx.globalAlpha = 1; ctx.strokeRect(d.pts[0].x,d.pts[0].y,d.pts[1].x-d.pts[0].x,d.pts[1].y-d.pts[0].y);
      ctx.font = "10px Inter,sans-serif";
      ctx.fillText(`Δx:${Math.abs(d.pts[1].x-d.pts[0].x).toFixed(0)}px Δy:${Math.abs(d.pts[1].y-d.pts[0].y).toFixed(0)}px`, Math.min(d.pts[0].x,d.pts[1].x)+2, Math.min(d.pts[0].y,d.pts[1].y)-4);
    }
    ctx.restore();
  }

  function renderPreview(ctx: CanvasRenderingContext2D, tool: DrawTool, a: Pt, b: Pt, W: number, H: number) {
    ctx.setLineDash([4,3]);
    if (tool === "trendline") { ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
    else if (tool === "hline") { ctx.beginPath(); ctx.moveTo(0,b.y); ctx.lineTo(W,b.y); ctx.stroke(); }
    else if (tool === "vline") { ctx.beginPath(); ctx.moveTo(b.x,0); ctx.lineTo(b.x,H); ctx.stroke(); }
    else if (tool === "fib") {
      const dy=b.y-a.y; [0,0.236,0.382,0.5,0.618,0.786,1].forEach(r => {
        const y=b.y-dy*r; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
      });
    }
    else if (tool === "measure"||tool==="zoom") { ctx.globalAlpha=0.1; ctx.fillStyle=drawColor; ctx.fillRect(a.x,a.y,b.x-a.x,b.y-a.y); ctx.globalAlpha=1; ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y); }
  }

  const needsCanvas = (t: DrawTool) => !["cursor","magnet","lock","hide","delete"].includes(t);
  function getCvsPt(e: React.MouseEvent<HTMLCanvasElement>): Pt {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onCvsDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (lockOn || activeTool === "cursor") return;
    if (activeTool === "text") { setTextPos(getCvsPt(e)); setTextVal(""); return; }
    const p = getCvsPt(e);
    setIsDrawing(true); setDrawStart(p); setDrawCur(p);
    if (activeTool === "brush") setBrushPath([p]);
  }
  function onCvsMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const p = getCvsPt(e);
    if (activeTool === "crosshair") setCrosshairPos({ x:p.x, y:p.y, vis:true });
    if (!isDrawing) return;
    setDrawCur(p);
    if (activeTool === "brush") setBrushPath(prev => [...prev, p]);
  }
  function onCvsUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !drawStart) return;
    const p = getCvsPt(e);
    const id = Math.random().toString(36).slice(2);
    let d: Drawing | null = null;
    if (activeTool === "trendline") d = { id, tool:"trendline", pts:[drawStart,p], color:drawColor };
    else if (activeTool === "hline") d = { id, tool:"hline", pts:[p], color:drawColor };
    else if (activeTool === "vline") d = { id, tool:"vline", pts:[p], color:drawColor };
    else if (activeTool === "fib")   d = { id, tool:"fib", pts:[drawStart,p], color:drawColor };
    else if (activeTool === "brush") d = { id, tool:"brush", pts:brushPath, color:drawColor };
    else if (activeTool === "measure") d = { id, tool:"measure", pts:[drawStart,p], color:drawColor };
    else if (activeTool === "zoom")  d = { id, tool:"zoom", pts:[drawStart,p], color:drawColor };
    if (d) setDrawings(prev => [...prev, d!]);
    setIsDrawing(false); setDrawStart(null); setDrawCur(null); setBrushPath([]);
  }

  function handleToolClick(tool: DrawTool) {
    if (tool === "hide")   { setDrawingsVis(v => !v); toast(drawingsVis ? "Drawings hidden" : "Drawings visible"); return; }
    if (tool === "delete") { setDrawings([]); toast("All drawings removed"); return; }
    if (tool === "magnet") { setMagnetOn(v => !v); toast(!magnetOn ? "Magnet on" : "Magnet off"); return; }
    if (tool === "lock")   { setLockOn(v => !v); toast(!lockOn ? "Locked" : "Unlocked"); return; }
    setActiveTool(tool);
    if (tool === "cursor") toast("Cursor mode");
  }

  function toggleStudy(name: string) {
    setStudies(prev => {
      const next = prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name];
      return next;
    });
    toast(studies.includes(name) ? `${name} removed` : `${name} added`);
  }

  function doSave() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ sym, tf, chartType, dark, studies, range }));
      setSaveStatus("saved");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);
      toast("Chart saved ✓");
    } catch { toast("Save failed"); }
  }

  function toggleFS() {
    if (!document.fullscreenElement) chartContainerRef.current?.closest("[data-chartroot]")?.requestFullscreen();
    else document.exitFullscreen();
  }

  function selectSym(s: SymResult) {
    setSym(s.symbol); setSymName(s.name);
    setSearchOpen(false); setSearchQ("");
    toast(`${s.symbol} loaded`);
  }

  /* ─── STYLES ─── */
  const bg     = dark ? "#1a1f2e" : "#ffffff";
  const lbg    = dark ? "#1e2535" : "#f8f8f8";
  const bdr    = dark ? "#2d3348" : "#e0e0e0";
  const col    = dark ? "#c8ccd8" : "#444444";
  const colDim = dark ? "#6b7280" : "#888888";
  const surf   = dark ? "#1e2535" : "#ffffff";
  const surf2  = dark ? "#252d3d" : "#f9f9f9";

  const ib = (on = false, dis = false): React.CSSProperties => ({
    display:"flex",alignItems:"center",justifyContent:"center",width:28,height:28,
    borderRadius:3,border:"none",cursor:dis?"default":"pointer",
    background:on?(dark?"#2d3348":"#eeeeee"):"transparent",
    color:on?(dark?"#e2e6f0":"#111"):col,transition:"background .12s",flexShrink:0,
    fontFamily:"inherit",opacity:dis?.32:1,pointerEvents:dis?"none":"auto",
  });
  const sep: React.CSSProperties = { width:1,height:18,background:bdr,margin:"0 4px",flexShrink:0 };
  const tfB = (on: boolean): React.CSSProperties => ({
    height:26,minWidth:24,padding:"0 7px",fontSize:12,fontWeight:on?600:400,
    color:on?(dark?"#e2e6f0":"#111"):col,border:"none",borderRadius:3,
    cursor:"pointer",background:on?(dark?"#2d3348":"#eeeeee"):"transparent",
    fontFamily:"inherit",transition:"background .12s",flexShrink:0,
  });
  const tb: React.CSSProperties = {
    height:28,padding:"0 7px",fontSize:12,fontWeight:500,color:col,
    whiteSpace:"nowrap",border:"none",background:"transparent",borderRadius:3,
    cursor:"pointer",fontFamily:"inherit",transition:"background .12s",flexShrink:0,
  };
  const caret: React.CSSProperties = {
    width:13,height:28,border:"none",background:"transparent",cursor:"pointer",
    color:colDim,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
  };
  const panel = (open: boolean, minW = 160, right = false): React.CSSProperties => ({
    position:"absolute",top:"calc(100% + 4px)",
    [right?"right":"left"]:0,
    background:surf,border:`1px solid ${bdr}`,borderRadius:6,
    boxShadow:"0 8px 24px rgba(0,0,0,.14)",zIndex:300,minWidth:minW,
    opacity:open?1:0,transform:open?"translateY(0)":"translateY(-6px)",
    visibility:open?"visible":"hidden",transition:"opacity .15s,transform .15s,visibility .15s",overflow:"hidden",
  });
  const mi = (active = false): React.CSSProperties => ({
    padding:"7px 14px",fontSize:12,color:active?(dark?"#93c5fd":"#1d4ed8"):(dark?"#c8ccd8":"#333"),
    cursor:"pointer",whiteSpace:"nowrap",background:active?(dark?"#1e3a5f":"#eff6ff"):"transparent",
    display:"flex",alignItems:"center",gap:8,transition:"background .1s",
  });
  const Caret = () => <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor"><path d="M0 2l4 4 4-4z"/></svg>;

  /* price display */
  const displayPrice = hoverOHLC ? hoverOHLC.c : (quote?.price ?? 0);
  const displayChange = quote ? `${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)} (${quote.changePct >= 0 ? "+" : ""}${quote.changePct.toFixed(2)}%)` : "";
  const priceColor = (quote?.change ?? 0) >= 0 ? "#26a69a" : "#ef5350";
  const ohlcSrc = hoverOHLC ?? { o: quote?.open ?? 0, h: quote?.high ?? 0, l: quote?.low ?? 0, c: quote?.close ?? 0, v: quote?.volume ?? 0 };

  const cvsCursor = activeTool === "cursor" ? "default" : activeTool === "text" ? "text" : activeTool === "zoom" ? "zoom-in" : "crosshair";

  return (
    <div data-chartroot style={{ display:"flex",flexDirection:"column",flex:1,minHeight:0,
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:bg }}>

      {/* ══ TOP TOOLBAR ══ */}
      <div style={{ display:"flex",alignItems:"center",height:38,padding:"0 6px",
        background:bg,borderBottom:`1px solid ${bdr}`,flexShrink:0,overflowX:"auto",gap:0,position:"relative",zIndex:200 }}>

        {/* Symbol */}
        <div style={{ display:"flex",alignItems:"center",gap:5,flexShrink:0 }}>
          <button style={ib()} onClick={() => setSearchOpen(true)} title="Search symbol">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/>
            </svg>
          </button>
          <button onClick={() => setSearchOpen(true)}
            style={{ border:"none",background:"transparent",cursor:"pointer",padding:0,
              fontSize:13,fontWeight:700,color:dark?"#e2e6f0":"#111",letterSpacing:"-.01em",whiteSpace:"nowrap" }}>
            {sym}
          </button>
        </div>
        <div style={sep}/>

        {/* TF */}
        <div data-p style={{ display:"flex",alignItems:"center",gap:1,flexShrink:0,position:"relative" }}>
          {["D","W","M"].map(t => <button key={t} style={tfB(tf===t)} onClick={() => setTf(t)}>{t}</button>)}
          <div style={{ position:"relative" }}>
            <button style={caret} onClick={e => { e.stopPropagation(); setTfOpen(o => !o); }}><Caret/></button>
            <div style={panel(tfOpen)}>
              {["1m","5m","15m","30m","1h","4h","D","W","M"].map(t => (
                <div key={t} style={mi(tf===t)} onClick={() => { setTf(t); setTfOpen(false); }}>{t}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={sep}/>

        {/* Chart type */}
        {[
          { k:"candlestick", icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"><line x1="3.5" y1="1.5" x2="3.5" y2="3.5"/><rect x="2" y="3.5" width="3" height="4" rx=".4" fill="currentColor" stroke="none"/><line x1="3.5" y1="7.5" x2="3.5" y2="10"/><line x1="8" y1="3" x2="8" y2="5"/><rect x="6.5" y="5" width="3" height="5" rx=".4" fill="none" stroke="currentColor" strokeWidth="1.25"/><line x1="8" y1="10" x2="8" y2="12.5"/></svg> },
          { k:"line",        icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,11 3.5,7.5 6.5,9.5 9.5,4.5 12,6.5 14,3.5"/></svg> },
          { k:"area",        icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="1,11 3.5,7.5 6.5,9.5 9.5,4.5 14,3.5"/><path d="M1 11 L14 3.5 L14 14 L1 14 Z" fill="currentColor" opacity=".18" stroke="none"/></svg> },
          { k:"bar",         icon:<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round"><line x1="4" y1="2.5" x2="4" y2="12.5"/><line x1="4" y1="4.5" x2="2" y2="4.5"/><line x1="4" y1="9.5" x2="6" y2="9.5"/><line x1="10" y1="2" x2="10" y2="12"/><line x1="10" y1="3.5" x2="8" y2="3.5"/><line x1="10" y1="8.5" x2="12" y2="8.5"/></svg> },
        ].map(({ k, icon }) => (
          <button key={k} style={ib(chartType===k)} title={k} onClick={() => setCT(k)}>{icon}</button>
        ))}
        <div style={sep}/>

        {/* Indicators */}
        <div data-p style={{ position:"relative",flexShrink:0 }}>
          <button style={{ height:28,padding:"0 7px",border:"none",background:"transparent",
            borderRadius:3,cursor:"pointer",display:"flex",alignItems:"center",gap:2,color:col }}
            onClick={e => { e.stopPropagation(); setFxOpen(o => !o); }}>
            <span style={{ fontStyle:"italic",fontFamily:"Georgia,serif",fontSize:13,lineHeight:1 }}>f</span>
            <span style={{ fontSize:"9.5px",fontStyle:"normal",lineHeight:1 }}>x</span>
          </button>
          <div style={{ ...panel(fxOpen, 200), padding:0 }}>
            <div style={{ padding:"8px 12px",fontSize:11,fontWeight:600,color:colDim,textTransform:"uppercase",letterSpacing:".06em",borderBottom:`1px solid ${bdr}` }}>Indicators</div>
            {STUDY_LIST.map(name => (
              <div key={name} style={{ padding:"8px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer" }}
                onClick={() => toggleStudy(name)}>
                <span style={{ fontSize:12,color:studies.includes(name)?(dark?"#93c5fd":"#1d4ed8"):col,fontWeight:studies.includes(name)?500:400 }}>{name}</span>
                <div style={{ width:16,height:16,borderRadius:3,border:`1.5px solid ${studies.includes(name)?"#2962ff":bdr}`,
                  background:studies.includes(name)?"#2962ff":"transparent",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  {studies.includes(name) && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <button style={tb} onClick={() => setFxOpen(o => !o)}>Indicators</button>
        <div style={sep}/>

        <button style={tb} onClick={e => { e.preventDefault(); setDrawings([]); }}>Clear Marks</button>
        <button style={tb} onClick={e => {
          e.preventDefault();
          const s = loadSaved();
          if (s?.studies) {
            // restore only drawings from saved state — drawings are canvas-only, not in LS yet
            // so Load Marks = re-apply any canvas state from sessionStorage if present
          }
          // Load last-saved drawings from sessionStorage
          try {
            const raw = sessionStorage.getItem("stockifyy_drawings");
            if (raw) setDrawings(JSON.parse(raw));
          } catch { /* ignore */ }
        }}>Load Marks</button>
        <button style={tb} onClick={e => { e.preventDefault(); setStudies([]); }}>Remove All Studies</button>
        <button style={tb} onClick={e => { e.preventDefault(); setDrawings([]); }}>Remove All Shapes</button>

        <div style={{ flex:1 }}/>

        {/* Price info badge */}
        {quote && (
          <div style={{ display:"flex",alignItems:"baseline",gap:6,padding:"0 8px",flexShrink:0 }}>
            <span style={{ fontSize:13,fontWeight:700,color:dark?"#e2e6f0":"#111" }}>
              {displayPrice.toLocaleString("en-PK", { minimumFractionDigits:2, maximumFractionDigits:2 })}
            </span>
            <span style={{ fontSize:11,color:priceColor,fontWeight:500 }}>{displayChange}</span>
          </div>
        )}
        <div style={sep}/>

        {/* Save */}
        <div data-p style={{ position:"relative",display:"flex",alignItems:"center",flexShrink:0 }}>
          <button onClick={doSave} style={{ height:28,padding:"0 6px",border:"none",background:"transparent",borderRadius:"3px 0 0 3px",cursor:"pointer",display:"flex",alignItems:"center",gap:3,color:saveStatus==="saved"?"#16a34a":col,fontSize:12,fontWeight:500,fontFamily:"inherit" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {saveStatus==="saved"?<path d="M20 6 9 17l-5-5"/>:<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>}
            </svg>
            {saveStatus==="saved"?"Saved":"Save"}
          </button>
          <button style={caret} onClick={e => { e.stopPropagation(); setSaveOpen(o => !o); }}><Caret/></button>
          <div style={{ ...panel(saveOpen,120,true) }}>
            <div style={mi()} onClick={() => { setSaveOpen(false); doSave(); }}>Save Chart</div>
            <div style={mi()} onClick={() => { const s=loadSaved(); if(s){setSym(s.sym);setTf(s.tf);setCT(s.chartType);setDark(s.dark);setStudies(s.studies);setRange(s.range);} setSaveOpen(false); toast("Loaded"); }}>Load Saved</div>
          </div>
        </div>
        <div style={sep}/>

        {/* Alert */}
        <button style={ib(alertOpen)} title="Create alert" onClick={() => setAlertOpen(o => !o)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </button>

        {/* Settings */}
        <div data-p style={{ position:"relative",flexShrink:0 }}>
          <button style={ib(settingsOpen)} title="Settings" onClick={e => { e.stopPropagation(); setSettingsOpen(o => !o); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 19.5 6 19.5 18 12 22 4.5 18 4.5 6"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <div style={{ ...panel(settingsOpen, 220, true), padding:0 }}>
            <div style={{ padding:"10px 14px 8px",fontSize:11,fontWeight:600,color:colDim,textTransform:"uppercase",letterSpacing:".06em",borderBottom:`1px solid ${bdr}` }}>Settings</div>
            <div style={{ padding:"8px 0" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 14px" }}>
                <span style={{ fontSize:12,color:col }}>Dark Mode</span>
                <button onClick={() => setDark(d => !d)}
                  style={{ width:34,height:18,borderRadius:9,border:"none",cursor:"pointer",background:dark?"#2962ff":"#ccd0dc",position:"relative" }}>
                  <span style={{ position:"absolute",top:2,left:dark?15:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left .18s",display:"block" }}/>
                </button>
              </div>
              <div style={{ padding:"4px 14px 10px",borderTop:`1px solid ${bdr}`,marginTop:4 }}>
                <div style={{ fontSize:11,color:colDim,marginBottom:6,marginTop:4,fontWeight:500 }}>Drawing Color</div>
                <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                  {["#2962ff","#ef5350","#26a69a","#ff9800","#ab47bc","#ffffff","#000000"].map(c => (
                    <button key={c} onClick={() => setDrawColor(c)}
                      style={{ width:22,height:22,borderRadius:"50%",background:c,border:`2.5px solid ${drawColor===c?"#2962ff":bdr}`,cursor:"pointer" }}/>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button style={ib(isFS)} title="Fullscreen" onClick={toggleFS}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {isFS?<><polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/><polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/></>:<><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></>}
          </svg>
        </button>

        <div style={{ display:"flex",alignItems:"center",gap:4,padding:"0 6px",flexShrink:0 }}>
          <span style={{ fontSize:11,color:colDim }}>Dark</span>
          <button onClick={() => setDark(d => !d)}
            style={{ width:34,height:18,borderRadius:9,border:"none",cursor:"pointer",background:dark?"#2962ff":"#ccd0dc",position:"relative",flexShrink:0 }}>
            <span style={{ position:"absolute",top:2,left:dark?15:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left .18s",display:"block" }}/>
          </button>
        </div>
      </div>

      {/* ══ MAIN AREA ══ */}
      <div style={{ display:"flex",flex:1,minHeight:0 }}>

        {/* LEFT TOOLBAR */}
        <div style={{ width:42,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",
          padding:"4px 0",background:lbg,borderRight:`1px solid ${bdr}`,overflowY:"auto",gap:1,zIndex:100 }}>
          {LEFT_TOOLS.map((item, i) => {
            const isActive = item.tool === activeTool || (item.tool==="magnet"&&magnetOn) || (item.tool==="lock"&&lockOn) || (item.tool==="hide"&&!drawingsVis);
            return (
              <div key={item.tool}>
                {item.sep && <div style={{ width:28,height:1,background:bdr,margin:"3px auto" }}/>}
                <button className={`tc3-ltool${dark?" dark":""}${isActive?" active":""}`} onClick={() => handleToolClick(item.tool)}>
                  <span style={{ width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center" }}>{item.icon}</span>
                  <span className="tc3-tip">{item.label}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* CHART AREA */}
        <div style={{ flex:1,minHeight:0,position:"relative",background:dark?"#131722":"#ffffff" }}>

          {/* OHLC overlay */}
          <div style={{ position:"absolute",top:6,left:8,zIndex:20,pointerEvents:"none",
            display:"flex",gap:10,fontSize:11,fontFamily:"'JetBrains Mono',monospace,sans-serif" }}>
            <span style={{ fontWeight:600,color:dark?"#e2e6f0":"#333",fontSize:12 }}>{symName}</span>
            {["O","H","L","C"].map((k,i) => {
              const v = [ohlcSrc.o,ohlcSrc.h,ohlcSrc.l,ohlcSrc.c][i];
              return <span key={k} style={{ color:colDim }}>{k}: <span style={{ color:dark?"#e2e6f0":"#222" }}>{v?.toFixed(2)}</span></span>;
            })}
          </div>

          {/* lightweight-charts container */}
          <div ref={chartContainerRef} style={{ position:"absolute",inset:0 }}/>

          {/* Empty/error state */}
          {dataStatus === "loading" && (
            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:dark?"#131722bb":"#ffffffbb",zIndex:30 }}>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:12 }}>
                <div style={{ width:32,height:32,border:`3px solid ${bdr}`,borderTop:"3px solid #2962ff",borderRadius:"50%",animation:"spin 0.8s linear infinite" }}/>
                <span style={{ fontSize:13,color:colDim }}>Loading {sym}…</span>
              </div>
            </div>
          )}
          {dataStatus === "empty" && (
            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:30,background:dark?"#131722":"#fff" }}>
              <div style={{ textAlign:"center",padding:24 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colDim} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:12 }}>
                  <path d="M3 3l18 18M12 5v.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01M12 19v.01"/>
                </svg>
                <div style={{ fontSize:15,fontWeight:600,color:dark?"#e2e6f0":"#333",marginBottom:6 }}>No data available</div>
                <div style={{ fontSize:12,color:colDim,marginBottom:16 }}>Historical data for <strong>{sym}</strong> is not in our database yet.</div>
                <button onClick={() => setSearchOpen(true)}
                  style={{ padding:"8px 20px",background:"#2962ff",color:"#fff",border:"none",borderRadius:5,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>
                  Search another symbol
                </button>
              </div>
            </div>
          )}
          {dataStatus === "error" && (
            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",zIndex:30 }}>
              <div style={{ textAlign:"center",color:"#ef5350",fontSize:13 }}>Failed to load data. Check connection.</div>
            </div>
          )}

          {/* Drawing canvas */}
          <canvas ref={canvasRef}
            style={{ position:"absolute",inset:0,zIndex:10,
              pointerEvents:needsCanvas(activeTool)?"auto":"none",cursor:cvsCursor,
              display:drawingsVis?"block":"none" }}
            onMouseDown={onCvsDown} onMouseMove={onCvsMove} onMouseUp={onCvsUp}
            onMouseLeave={() => setCrosshairPos(p => ({ ...p, vis:false }))}/>

          {/* Crosshair overlay */}
          {activeTool === "crosshair" && crosshairPos.vis && (
            <div style={{ position:"absolute",inset:0,pointerEvents:"none",zIndex:11 }}>
              <div style={{ position:"absolute",top:0,bottom:0,left:crosshairPos.x,width:1,background:dark?"rgba(200,204,216,.35)":"rgba(0,0,0,.18)" }}/>
              <div style={{ position:"absolute",left:0,right:0,top:crosshairPos.y,height:1,background:dark?"rgba(200,204,216,.35)":"rgba(0,0,0,.18)" }}/>
              <div style={{ position:"absolute",left:crosshairPos.x-3,top:crosshairPos.y-3,width:6,height:6,borderRadius:"50%",background:"#2962ff" }}/>
            </div>
          )}

          {/* Text input */}
          {textPos && (
            <div style={{ position:"absolute",left:textPos.x,top:textPos.y-20,zIndex:25,display:"flex",gap:4 }}>
              <input ref={textInputRef} value={textVal} onChange={e => setTextVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    if (textVal.trim()) setDrawings(p => [...p, { id:Math.random().toString(36).slice(2),tool:"text",pts:[textPos!],text:textVal,color:drawColor }]);
                    setTextPos(null);
                  }
                  if (e.key === "Escape") setTextPos(null);
                }}
                placeholder="Type text…"
                style={{ padding:"3px 7px",border:`2px solid ${drawColor}`,borderRadius:3,fontSize:13,fontFamily:"inherit",outline:"none",background:"white",color:"#111",minWidth:120 }}/>
              <button onClick={() => { if(textVal.trim()) setDrawings(p=>[...p,{id:Math.random().toString(36).slice(2),tool:"text",pts:[textPos!],text:textVal,color:drawColor}]); setTextPos(null); }}
                style={{ padding:"3px 8px",background:drawColor,color:"#fff",border:"none",borderRadius:3,cursor:"pointer",fontSize:12,fontFamily:"inherit" }}>Add</button>
            </div>
          )}
        </div>
      </div>

      {/* ══ BOTTOM RANGE BAR ══ */}
      <div style={{ display:"flex",alignItems:"center",height:30,padding:"0 8px",
        background:dark?"#1e2535":"#fafafa",borderTop:`1px solid ${bdr}`,flexShrink:0,gap:0 }}>
        <span style={{ fontSize:11,color:colDim,marginRight:6,fontWeight:500 }}>Range:</span>
        {Object.keys(RANGE_SECONDS).map(label => (
          <button key={label} onClick={() => { setRange(label); toast(`Range: ${label}`); }}
            style={{ height:22,padding:"0 9px",fontSize:12,fontWeight:range===label?600:400,
              color:range===label?(dark?"#e2e6f0":"#111"):colDim,border:"none",borderRadius:3,cursor:"pointer",
              background:range===label?(dark?"#2d3348":"#eeeeee"):"transparent",fontFamily:"inherit",transition:"background .12s" }}>
            {label}
          </button>
        ))}
        <div style={{ flex:1 }}/>
        {activeTool !== "cursor" && (
          <span style={{ fontSize:11,background:dark?"#1e3a5f":"#eff6ff",color:dark?"#93c5fd":"#1d4ed8",padding:"2px 8px",borderRadius:3 }}>
            ✏ {LEFT_TOOLS.find(t => t.tool === activeTool)?.label}
          </span>
        )}
        <span style={{ fontSize:11,color:colDim,marginLeft:8 }}>PSX EOD Data</span>
      </div>

      {/* ══ ALERT MODAL ══ */}
      <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:400,opacity:alertOpen?1:0,visibility:alertOpen?"visible":"hidden",transition:"opacity .2s,visibility .2s" }}
        onClick={() => setAlertOpen(false)}/>
      <div style={{ position:"fixed",top:"50%",left:"50%",zIndex:401,
        transform:alertOpen?"translate(-50%,-50%)":"translate(-50%,-46%)",
        opacity:alertOpen?1:0,visibility:alertOpen?"visible":"hidden",transition:"opacity .2s,transform .2s,visibility .2s",
        width:320,background:surf,borderRadius:10,boxShadow:"0 20px 60px rgba(0,0,0,.25)",overflow:"hidden" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 12px",borderBottom:`1px solid ${bdr}` }}>
          <span style={{ fontSize:13,fontWeight:600,color:col }}>Create Alert</span>
          <button onClick={() => setAlertOpen(false)} style={{ border:"none",background:"none",cursor:"pointer",color:colDim,fontSize:16 }}>✕</button>
        </div>
        <div style={{ padding:"14px 16px",display:"flex",flexDirection:"column",gap:10 }}>
          <div>
            <label style={{ fontSize:11,color:colDim,display:"block",marginBottom:3 }}>Symbol</label>
            <input value={alertSym} onChange={e => setAlertSym(e.target.value)}
              style={{ width:"100%",padding:"7px 10px",border:`1px solid ${bdr}`,borderRadius:4,fontSize:13,color:col,background:surf2,outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const }}/>
          </div>
          <div>
            <label style={{ fontSize:11,color:colDim,display:"block",marginBottom:3 }}>Condition</label>
            <select value={alertCond} onChange={e => setAlertCond(e.target.value)}
              style={{ width:"100%",padding:"7px 10px",border:`1px solid ${bdr}`,borderRadius:4,fontSize:13,color:col,background:surf2,outline:"none",fontFamily:"inherit" }}>
              {ALERT_CONDITIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11,color:colDim,display:"block",marginBottom:3 }}>Price Level</label>
            <input type="number" value={alertPrice} onChange={e => setAlertPrice(e.target.value)} placeholder="e.g. 120000"
              style={{ width:"100%",padding:"7px 10px",border:`1px solid ${bdr}`,borderRadius:4,fontSize:13,color:col,background:surf2,outline:"none",fontFamily:"inherit",boxSizing:"border-box" as const }}/>
          </div>
          <button onClick={() => { if(!alertPrice){toast("Enter a price");return;} setAlertSent(true); toast(`Alert set: ${alertSym} ${alertCond} ${alertPrice}`); setTimeout(()=>{setAlertSent(false);setAlertOpen(false);setAlertPrice("");},1800); }}
            style={{ width:"100%",padding:"9px",border:"none",borderRadius:4,background:alertSent?"#16a34a":"#2962ff",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"background .2s" }}>
            {alertSent ? "✓ Alert Created" : "Create Alert"}
          </button>
        </div>
      </div>

      {/* ══ SYMBOL SEARCH ══ */}
      <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.28)",zIndex:500,opacity:searchOpen?1:0,visibility:searchOpen?"visible":"hidden",transition:"opacity .2s,visibility .2s" }}
        onClick={() => setSearchOpen(false)}>
        <div style={{ position:"absolute",top:56,left:"50%",transform:"translateX(-50%)",background:surf,borderRadius:8,width:440,maxHeight:"70vh",overflow:"hidden",boxShadow:"0 8px 30px rgba(0,0,0,.22)",display:"flex",flexDirection:"column" }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderBottom:`1px solid ${bdr}`,flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={colDim} strokeWidth="2.2" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/>
            </svg>
            <input ref={searchInputRef} type="text" value={searchQ} placeholder="Search symbol or company…"
              onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === "Escape" && setSearchOpen(false)}
              style={{ border:"none",outline:"none",fontSize:13,flex:1,fontFamily:"inherit",color:dark?"#e2e6f0":"#111",background:"transparent" }}/>
            {searchQ && <button onClick={() => setSearchQ("")} style={{ border:"none",background:"none",cursor:"pointer",color:colDim,fontSize:14 }}>✕</button>}
          </div>
          <div style={{ overflowY:"auto",flex:1 }}>
            {searchResults.length === 0 && searchQ && (
              <div style={{ padding:16,fontSize:12,color:colDim,textAlign:"center" }}>No symbols found</div>
            )}
            {searchResults.map(s => (
              <div key={s.symbol + s.exchange} style={{ padding:"10px 14px",borderBottom:`1px solid ${bdr}`,cursor:"pointer",display:"flex",alignItems:"center",gap:10 }}
                onClick={() => selectSym(s)}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13,fontWeight:600,color:dark?"#e2e6f0":"#111" }}>{s.symbol}</div>
                  <div style={{ fontSize:11,color:colDim,marginTop:1 }}>{s.name} · {s.exchange}</div>
                </div>
                <div style={{ fontSize:10,padding:"2px 6px",borderRadius:3,
                  background:s.country==="PK"?(dark?"#1e3a5f":"#eff6ff"):(dark?"#252d3d":"#f5f5f5"),
                  color:s.country==="PK"?(dark?"#93c5fd":"#1d4ed8"):(dark?"#9ca3af":"#666") }}>
                  {s.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ TOAST ══ */}
      <div style={{ position:"fixed",bottom:20,left:"50%",transform:`translateX(-50%) translateY(${toastOn?0:8}px)`,
        background:dark?"#1e2535":"#1a1a1a",color:"#fff",fontSize:12,padding:"7px 16px",borderRadius:4,
        opacity:toastOn?1:0,transition:"opacity .18s,transform .18s",pointerEvents:"none",zIndex:999,
        whiteSpace:"nowrap",fontFamily:"inherit",boxShadow:"0 4px 12px rgba(0,0,0,.2)" }}>
        {toastMsg}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
