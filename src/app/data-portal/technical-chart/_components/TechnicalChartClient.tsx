"use client";
import { useState, useRef, useEffect, useCallback } from "react";

/* ─── constants ─── */
const SYMS = [
  { sym:"NASDAQ:AAPL",     label:"AAPL",  full:"Apple Inc — NASDAQ"             },
  { sym:"NASDAQ:MSFT",     label:"MSFT",  full:"Microsoft Corporation — NASDAQ" },
  { sym:"NASDAQ:GOOGL",    label:"GOOGL", full:"Alphabet Inc — NASDAQ"          },
  { sym:"NASDAQ:TSLA",     label:"TSLA",  full:"Tesla Inc — NASDAQ"             },
  { sym:"NASDAQ:NVDA",     label:"NVDA",  full:"NVIDIA Corporation — NASDAQ"    },
  { sym:"NYSE:JPM",        label:"JPM",   full:"JPMorgan Chase — NYSE"          },
  { sym:"TVC:GOLD",        label:"GOLD",  full:"Gold — Spot"                   },
  { sym:"TVC:USOIL",       label:"OIL",   full:"Crude Oil — WTI"               },
  { sym:"BINANCE:BTCUSDT", label:"BTC",   full:"Bitcoin / USD"                 },
  { sym:"BINANCE:ETHUSDT", label:"ETH",   full:"Ethereum / USD"                },
];
const TF_MAP: Record<string,string> = {
  "1m":"1","5m":"5","15m":"15","30m":"30","1h":"60","4h":"240","D":"D","W":"W","M":"M",
};
const STYLE_MAP: Record<string,string> = {
  candlestick:"1", line:"2", bar:"0", area:"3",
};
const STUDY_IDS: Record<string,string> = {
  "Moving Average":  "MASimple@tv-basicstudies",
  "RSI":             "RSI@tv-basicstudies",
  "MACD":            "MACD@tv-basicstudies",
  "Bollinger Bands": "BB@tv-basicstudies",
  "Stochastic":      "Stoch@tv-basicstudies",
  "ATR":             "ATR@tv-basicstudies",
  "Volume":          "Volume@tv-basicstudies",
};
const ALERT_CONDITIONS = ["Greater than","Less than","Crosses above","Crosses below","% Change up","% Change down"];
const LS_KEY = "stockifyy_chart_state";

interface Snapshot { sym:string; tf:string; chartType:string; dark:boolean; studies:string[]; }
function loadSaved(): Snapshot|null {
  try { const r=localStorage.getItem(LS_KEY); return r?JSON.parse(r):null; } catch { return null; }
}

export default function TechnicalChartClient() {
  const saved = loadSaved();
  const [sym,       setSym]     = useState(saved?.sym      ?? "NASDAQ:AAPL");
  const [tf,        setTf]      = useState(saved?.tf       ?? "M");
  const [chartType, setCT]      = useState(saved?.chartType?? "candlestick");
  const [dark,      setDark]    = useState(saved?.dark     ?? false);
  const [studies,   setStudies] = useState<string[]>(saved?.studies??[]);

  /* history */
  const [history, setHistory] = useState<Snapshot[]>([{sym:saved?.sym??"NASDAQ:AAPL",tf:saved?.tf??"M",chartType:saved?.chartType??"candlestick",dark:saved?.dark??false,studies:saved?.studies??[]}]);
  const [hIdx,    setHIdx]    = useState(0);

  /* UI panels — always mounted, animated via CSS transitions */
  const [fxOpen,       setFxOpen]       = useState(false);
  const [fxSearch,     setFxSearch]     = useState("");
  const [tfOpen,       setTfOpen]       = useState(false);
  const [curOpen,      setCurOpen]      = useState(false);
  const [saveOpen,     setSaveOpen]     = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [alertOpen,    setAlertOpen]    = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);

  /* crosshair overlay */
  const [crosshairOn,  setCrosshairOn]  = useState(false);
  const [cursorPos,    setCursorPos]    = useState({x:0,y:0,vis:false});

  /* alert form */
  const [alertSym,  setAlertSym]  = useState("");
  const [alertCond, setAlertCond] = useState("Greater than");
  const [alertPrice,setAlertPrice]= useState("");
  const [alertSent, setAlertSent] = useState(false);

  /* save status */
  const [saveStatus, setSaveStatus] = useState<"idle"|"saved">("idle");

  /* iframe */
  const [iframeKey, setIframeKey] = useState(()=>Date.now());

  /* search */
  const [searchQ, setSearchQ] = useState("");

  /* refs */
  const chartWrap   = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const toastTimer  = useRef<ReturnType<typeof setTimeout>|null>(null);
  const saveTimer   = useRef<ReturnType<typeof setTimeout>|null>(null);
  const [toastMsg,  setToastMsg]  = useState("");
  const [toastOn,   setToastOn]   = useState(false);
  const [isFS,      setIsFS]      = useState(false);

  /* inject animation CSS once */
  useEffect(()=>{
    const id = "tv-anim";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      .tv-panel{transition:opacity .18s ease,transform .18s ease,visibility .18s;pointer-events:none;}
      .tv-panel.open{opacity:1!important;transform:translateY(0) scaleY(1)!important;visibility:visible!important;pointer-events:auto;}
      .tv-modal{transition:opacity .2s ease,transform .2s ease,visibility .2s;pointer-events:none;}
      .tv-modal.open{opacity:1!important;transform:translateY(0)!important;visibility:visible!important;pointer-events:auto;}
      .tv-btn:hover{background:var(--tv-hover)!important;}
      .tv-tb:hover{background:var(--tv-hover)!important;color:var(--tv-col)!important;}
    `;
    document.head.appendChild(s);
  },[]);

  /* close all panels on outside click */
  useEffect(()=>{
    const h=(e:MouseEvent)=>{
      const t=e.target as Element;
      if(!t.closest("[data-panel]")) {
        setFxOpen(false); setTfOpen(false); setCurOpen(false);
        setSaveOpen(false); setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

  /* fullscreen listener */
  useEffect(()=>{
    const h=()=>setIsFS(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange",h);
    return ()=>document.removeEventListener("fullscreenchange",h);
  },[]);

  /* rebuild iframe */
  useEffect(()=>{ setIframeKey(Date.now()); },[sym,tf,chartType,dark,studies]);

  /* focus search input */
  useEffect(()=>{ if(searchOpen) setTimeout(()=>searchInput.current?.focus(),40); },[searchOpen]);

  /* sync alert symbol */
  useEffect(()=>{
    setAlertSym(SYMS.find(s=>s.sym===sym)?.label??sym.replace(/^[A-Z]+:/,""));
  },[sym]);

  const toast = useCallback((msg:string)=>{
    setToastMsg(msg); setToastOn(true);
    if(toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current=setTimeout(()=>setToastOn(false),2400);
  },[]);

  /* ── history helpers ── */
  const snap = useCallback(():Snapshot=>({sym,tf,chartType,dark,studies:[...studies]}),[sym,tf,chartType,dark,studies]);
  const push  = useCallback((s:Snapshot)=>{
    setHistory(prev=>[...prev.slice(0,hIdx+1),s]);
    setHIdx(p=>p+1);
  },[hIdx]);
  const apply = useCallback((s:Snapshot)=>{
    setSym(s.sym); setTf(s.tf); setCT(s.chartType);
    setDark(s.dark); setStudies(s.studies);
  },[]);

  function change(partial:Partial<Snapshot>){
    const s={...snap(),...partial};
    apply(s); push(s);
  }

  function doUndo(){ if(hIdx<=0){toast("Nothing to undo");return;} const i=hIdx-1; setHIdx(i); apply(history[i]); toast("Undone"); }
  function doRedo(){ if(hIdx>=history.length-1){toast("Nothing to redo");return;} const i=hIdx+1; setHIdx(i); apply(history[i]); toast("Redone"); }

  function doSave(){
    try{ localStorage.setItem(LS_KEY,JSON.stringify(snap())); setSaveStatus("saved");
      if(saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current=setTimeout(()=>setSaveStatus("idle"),2000);
      toast("Chart state saved ✓");
    }catch{ toast("Save failed"); }
  }
  function doLoad(){
    const s=loadSaved(); if(!s){toast("No saved state found");return;}
    apply(s); push(s); toast("Layout restored ✓");
  }

  function toggleStudy(name:string){
    const id=STUDY_IDS[name];
    const next=studies.includes(id)?studies.filter(x=>x!==id):[...studies,id];
    change({studies:next});
    toast(studies.includes(id)?`${name} removed`:` ${name} added`);
  }
  function removeAllStudies(){ change({studies:[]}); setIframeKey(Date.now()); toast("All studies removed"); }
  function resetIframe(label:string){ setIframeKey(Date.now()); toast(`${label}`); }

  function toggleFS(){
    if(!document.fullscreenElement) chartWrap.current?.requestFullscreen().catch(()=>toast("Fullscreen blocked"));
    else document.exitFullscreen();
  }

  function submitAlert(){
    if(!alertPrice){ toast("Enter a price level"); return; }
    setAlertSent(true);
    toast(`Alert created: ${alertSym} ${alertCond} ${alertPrice}`);
    setTimeout(()=>{ setAlertSent(false); setAlertOpen(false); setAlertPrice(""); },1800);
  }

  /* ── crosshair mouse tracking ── */
  const onChartMouseMove = useCallback((e:React.MouseEvent<HTMLDivElement>)=>{
    if(!crosshairOn) return;
    const r=e.currentTarget.getBoundingClientRect();
    setCursorPos({x:e.clientX-r.left, y:e.clientY-r.top, vis:true});
  },[crosshairOn]);
  const onChartMouseLeave = useCallback(()=>setCursorPos(p=>({...p,vis:false})),[]);

  /* ── derived ── */
  const symLabel=SYMS.find(s=>s.sym===sym)?.label??sym.replace(/^[A-Z]+:/,"");
  const filtered=searchQ?SYMS.filter(s=>s.label.toLowerCase().includes(searchQ.toLowerCase())||s.full.toLowerCase().includes(searchQ.toLowerCase())):SYMS;
  const fxFiltered=fxSearch?Object.keys(STUDY_IDS).filter(n=>n.toLowerCase().includes(fxSearch.toLowerCase())):Object.keys(STUDY_IDS);
  const canUndo=hIdx>0, canRedo=hIdx<history.length-1;

  /* ── src ── */
  const src=
    "https://www.tradingview.com/widgetembed/?"+
    `symbol=${encodeURIComponent(sym)}`+
    `&interval=${TF_MAP[tf]??"D"}`+
    `&style=${STYLE_MAP[chartType]??"1"}`+
    `&theme=${dark?"dark":"light"}`+
    "&locale=en&timezone=Asia%2FKarachi"+
    "&hide_top_toolbar=1&hide_legend=0&hidesidetoolbar=0"+
    "&save_image=1&allow_symbol_change=1"+
    `&details=0&hotlist=0&calendar=0&studies=${encodeURIComponent(JSON.stringify(studies))}&withdateranges=0`+
    "&utm_source=stockifyy-data-portal.vercel.app&utm_medium=widget";

  /* ── tokens ── */
  const bg    =dark?"#1a1f2e":"#ffffff";
  const bdr   =dark?"#2d3348":"#e0e0e0";
  const col   =dark?"#c8ccd8":"#444444";
  const colDim=dark?"#6b7280":"#888888";
  const surf  =dark?"#1e2535":"#ffffff";
  const surf2 =dark?"#252d3d":"#f9f9f9";

  /* ── style helpers ── */
  const ib=(on=false,disabled=false):React.CSSProperties=>({
    display:"flex",alignItems:"center",justifyContent:"center",
    width:28,height:28,borderRadius:3,border:"none",cursor:disabled?"default":"pointer",
    background:on?(dark?"#2d3348":"#eeeeee"):"transparent",
    color:on?(dark?"#e2e6f0":"#111"):col,
    transition:"background .12s",flexShrink:0,fontFamily:"inherit",
    opacity:disabled?.32:1,pointerEvents:disabled?"none":"auto",
  });
  const sep:React.CSSProperties={width:1,height:18,background:bdr,margin:"0 4px",flexShrink:0};
  const tfBtn=(on:boolean):React.CSSProperties=>({
    height:26,minWidth:24,padding:"0 7px",fontSize:12,
    fontWeight:on?600:400,color:on?(dark?"#e2e6f0":"#111"):col,
    border:"none",borderRadius:3,cursor:"pointer",
    background:on?(dark?"#2d3348":"#eeeeee"):"transparent",
    fontFamily:"inherit",transition:"background .12s",flexShrink:0,
  });
  const tb:React.CSSProperties={
    height:28,padding:"0 7px",fontSize:12,fontWeight:500,color:col,
    whiteSpace:"nowrap",border:"none",background:"transparent",
    borderRadius:3,cursor:"pointer",fontFamily:"inherit",
    transition:"background .12s,color .12s",flexShrink:0,
  };
  const caretBtn:React.CSSProperties={
    width:13,height:28,border:"none",background:"transparent",
    cursor:"pointer",color:colDim,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
  };
  /* animated panel base */
  const panelBase=(open:boolean,minW=160,right=false):React.CSSProperties=>({
    position:"absolute",top:"calc(100% + 4px)",
    [right?"right":"left"]:0,
    background:surf,border:`1px solid ${bdr}`,borderRadius:6,
    boxShadow:"0 8px 24px rgba(0,0,0,.14)",
    zIndex:300,minWidth:minW,
    opacity:open?1:0,
    transform:open?"translateY(0) scaleY(1)":"translateY(-6px) scaleY(0.96)",
    transformOrigin:"top center",
    visibility:open?"visible":"hidden",
    transition:"opacity .16s ease,transform .16s ease,visibility .16s",
    overflow:"hidden",
  });
  const mi=(active=false):React.CSSProperties=>({
    padding:"7px 14px",fontSize:12,
    color:active?(dark?"#93c5fd":"#1d4ed8"):(dark?"#c8ccd8":"#333"),
    cursor:"pointer",whiteSpace:"nowrap",
    background:active?(dark?"#1e3a5f":"#eff6ff"):"transparent",
    display:"flex",alignItems:"center",gap:8,
    transition:"background .1s",
  });
  const Caret=()=><svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor"><path d="M0 2l4 4 4-4z"/></svg>;

  /* ── panel-aware click stoppers ── */
  const p=(fn:()=>void)=>(e:React.MouseEvent)=>{ e.stopPropagation(); fn(); };

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0,
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      background:bg,
      ["--tv-hover" as string]:dark?"#2a3045":"#f0f0f0",
      ["--tv-col" as string]:dark?"#e2e6f0":"#111",
    }}>

      {/* ══════════ TOOLBAR ══════════ */}
      <div style={{display:"flex",alignItems:"center",height:38,
        padding:"0 6px",background:bg,borderBottom:`1px solid ${bdr}`,
        flexShrink:0,overflowX:"auto",gap:0,position:"relative",zIndex:100}}>

        {/* Symbol */}
        <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
          <button className="tv-btn" style={ib()} title="Search"
            onClick={()=>setSearchOpen(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/>
            </svg>
          </button>
          <span onClick={()=>setSearchOpen(true)}
            style={{fontSize:13,fontWeight:700,color:dark?"#e2e6f0":"#111",
              cursor:"pointer",letterSpacing:"-.01em",whiteSpace:"nowrap",
              transition:"color .12s"}}>
            {symLabel}
          </span>
          <button onClick={()=>toast("Added to watchlist")}
            style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${bdr}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              color:colDim,background:"transparent",cursor:"pointer",flexShrink:0,
              transition:"border-color .12s"}}>
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/>
            </svg>
          </button>
        </div>
        <div style={sep}/>

        {/* Timeframes */}
        <div data-panel="tf" style={{display:"flex",alignItems:"center",gap:1,flexShrink:0,position:"relative"}}>
          {["1h","D","W","M"].map(t=>(
            <button key={t} className="tv-btn" style={tfBtn(tf===t)}
              onClick={()=>{ change({tf:t}); toast(`Timeframe: ${t}`); }}>
              {t}
            </button>
          ))}
          <div style={{position:"relative"}}>
            <button style={caretBtn} onClick={p(()=>setTfOpen(o=>!o))}>
              <Caret/>
            </button>
            <div style={panelBase(tfOpen)}>
              {Object.keys(TF_MAP).map(t=>(
                <div key={t} className="tv-btn" style={mi(tf===t)}
                  onClick={()=>{ change({tf:t}); setTfOpen(false); toast(`Timeframe: ${t}`); }}>
                  {tf===t&&<svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><path d="M1 6l3.5 3.5L11 2"/></svg>}
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={sep}/>

        {/* Candlestick */}
        <button className="tv-btn" style={ib(chartType==="candlestick")} title="Candlestick"
          onClick={()=>{ change({chartType:"candlestick"}); toast("Candlestick"); }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round">
            <line x1="3.5" y1="1.5" x2="3.5" y2="3.5"/>
            <rect x="2" y="3.5" width="3" height="4" rx=".4" fill="currentColor" stroke="none"/>
            <line x1="3.5" y1="7.5" x2="3.5" y2="10"/>
            <line x1="8" y1="3" x2="8" y2="5"/>
            <rect x="6.5" y="5" width="3" height="5" rx=".4" fill="none" stroke="currentColor" strokeWidth="1.25"/>
            <line x1="8" y1="10" x2="8" y2="12.5"/>
            <line x1="12.5" y1="2" x2="12.5" y2="4"/>
            <rect x="11" y="4" width="3" height="4" rx=".4" fill="currentColor" stroke="none"/>
            <line x1="12.5" y1="8" x2="12.5" y2="11"/>
          </svg>
        </button>

        {/* Line */}
        <button className="tv-btn" style={ib(chartType==="line")} title="Line chart"
          onClick={()=>{ change({chartType:"line"}); toast("Line chart"); }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1,11 3.5,7.5 6.5,9.5 9.5,4.5 12,6.5 14,3.5"/>
          </svg>
        </button>

        {/* Bar */}
        <button className="tv-btn" style={ib(chartType==="bar")} title="Bar chart"
          onClick={()=>{ change({chartType:"bar"}); toast("Bar chart"); }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round">
            <line x1="4" y1="2.5" x2="4" y2="12.5"/>
            <line x1="4" y1="4.5" x2="2" y2="4.5"/>
            <line x1="4" y1="9.5" x2="6" y2="9.5"/>
            <line x1="10" y1="2" x2="10" y2="12"/>
            <line x1="10" y1="3.5" x2="8" y2="3.5"/>
            <line x1="10" y1="8.5" x2="12" y2="8.5"/>
          </svg>
        </button>

        {/* Crosshair */}
        <div data-panel="cur" style={{position:"relative",display:"flex",alignItems:"center",flexShrink:0}}>
          <button className="tv-btn" style={ib(crosshairOn)} title={crosshairOn?"Disable crosshair":"Enable crosshair overlay"}
            onClick={p(()=>{ setCrosshairOn(o=>!o); toast(crosshairOn?"Crosshair off":"Crosshair overlay on"); })}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <line x1="7.5" y1="1" x2="7.5" y2="5"/>
              <line x1="7.5" y1="10" x2="7.5" y2="14"/>
              <line x1="1" y1="7.5" x2="5" y2="7.5"/>
              <line x1="10" y1="7.5" x2="14" y2="7.5"/>
              <circle cx="7.5" cy="7.5" r="2.2"/>
            </svg>
          </button>
          <button style={caretBtn} onClick={p(()=>setCurOpen(o=>!o))}><Caret/></button>
          <div style={panelBase(curOpen)}>
            {["Crosshair","Dot","Arrow"].map(c=>(
              <div key={c} className="tv-btn" style={mi(c==="Crosshair"&&crosshairOn)}
                onClick={()=>{ setCurOpen(false); setCrosshairOn(c==="Crosshair"); toast(`${c} cursor`); }}>
                {c}
              </div>
            ))}
          </div>
        </div>
        <div style={sep}/>

        {/* fx / Indicators panel */}
        <div data-panel="fx" style={{position:"relative",flexShrink:0}}>
          <button style={{height:28,padding:"0 7px",border:"none",background:"transparent",
            borderRadius:3,cursor:"pointer",display:"flex",alignItems:"center",
            gap:1,color:col,flexShrink:0,transition:"background .12s"}}
            onClick={p(()=>{ setFxOpen(o=>!o); })}>
            <span style={{fontStyle:"italic",fontFamily:"Georgia,serif",fontSize:13,lineHeight:1}}>f</span>
            <span style={{fontSize:"9.5px",verticalAlign:"sub",fontStyle:"normal",lineHeight:1}}>x</span>
          </button>
          <div style={{...panelBase(fxOpen,220),padding:0}}>
            {/* panel header */}
            <div style={{padding:"10px 12px 8px",borderBottom:`1px solid ${bdr}`}}>
              <div style={{fontSize:11,fontWeight:600,color:colDim,
                textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>
                Indicators
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,
                background:surf2,borderRadius:4,padding:"5px 8px",border:`1px solid ${bdr}`}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colDim} strokeWidth="2.3" strokeLinecap="round">
                  <circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/>
                </svg>
                <input value={fxSearch} onChange={e=>setFxSearch(e.target.value)}
                  placeholder="Search indicators…"
                  style={{border:"none",outline:"none",background:"transparent",
                    fontSize:12,color:dark?"#e2e6f0":"#111",fontFamily:"inherit",flex:1,width:"100%"}}/>
                {fxSearch&&<button onClick={()=>setFxSearch("")}
                  style={{border:"none",background:"none",cursor:"pointer",color:colDim,fontSize:13,lineHeight:1,padding:0}}>✕</button>}
              </div>
            </div>
            {/* indicator list */}
            <div style={{maxHeight:220,overflowY:"auto"}}>
              {fxFiltered.length===0
                ?<div style={{padding:"12px 14px",fontSize:12,color:colDim,textAlign:"center"}}>No indicators found</div>
                :fxFiltered.map(name=>{
                  const id=STUDY_IDS[name];
                  const active=studies.includes(id);
                  return(
                    <div key={name} className="tv-btn" style={{
                      padding:"8px 14px",display:"flex",alignItems:"center",
                      justifyContent:"space-between",cursor:"pointer",
                      background:active?(dark?"#1e3a5f":"#eff6ff"):"transparent",
                      transition:"background .1s",
                    }} onClick={()=>toggleStudy(name)}>
                      <span style={{fontSize:12,color:active?(dark?"#93c5fd":"#1d4ed8"):(dark?"#c8ccd8":"#333"),fontWeight:active?500:400}}>
                        {name}
                      </span>
                      <div style={{width:16,height:16,borderRadius:3,border:`1.5px solid ${active?"#2962ff":bdr}`,
                        background:active?"#2962ff":"transparent",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        transition:"background .12s,border-color .12s",flexShrink:0}}>
                        {active&&<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>}
                      </div>
                    </div>
                  );
                })
              }
            </div>
            {studies.length>0&&(
              <div style={{padding:"8px 14px",borderTop:`1px solid ${bdr}`}}>
                <button onClick={()=>{removeAllStudies();setFxOpen(false);}}
                  style={{width:"100%",padding:"5px",border:`1px solid ${bdr}`,borderRadius:3,
                    background:surf2,color:dark?"#f87171":"#dc2626",cursor:"pointer",
                    fontSize:11,fontWeight:500,fontFamily:"inherit",transition:"background .1s"}}>
                  Remove All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Indicators text button */}
        <button className="tv-tb" style={tb}
          onClick={p(()=>{ setFxOpen(o=>!o); })}>
          Indicators
        </button>
        <div style={sep}/>

        {/* Text action buttons */}
        <button className="tv-tb" style={tb} onClick={()=>resetIframe("Marks cleared")}>Clear Marks</button>
        <button className="tv-tb" style={tb} onClick={doLoad}>Load Marks</button>
        <button className="tv-tb" style={tb} onClick={removeAllStudies}>Remove All Studies</button>
        <button className="tv-tb" style={tb} onClick={()=>resetIframe("Shapes removed")}>Remove All Shapes</button>

        <div style={{flex:1}}/>

        {/* Undo */}
        <button className="tv-btn" style={ib(false,!canUndo)} title="Undo" onClick={doUndo}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h10a6 6 0 0 1 0 12H9"/><polyline points="3 3 3 7 7 7"/>
          </svg>
        </button>
        {/* Redo */}
        <button className="tv-btn" style={ib(false,!canRedo)} title="Redo" onClick={doRedo}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7H11a6 6 0 0 0 0 12h4"/><polyline points="21 3 21 7 17 7"/>
          </svg>
        </button>
        <div style={sep}/>

        {/* Save */}
        <div data-panel="save" style={{position:"relative",display:"flex",alignItems:"center",flexShrink:0}}>
          <button onClick={doSave}
            style={{height:28,padding:"0 5px",border:"none",background:"transparent",
              borderRadius:"3px 0 0 3px",cursor:"pointer",display:"flex",
              flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0,
              transition:"background .12s"}}>
            <span style={{display:"flex",alignItems:"center",gap:3,
              fontSize:12,fontWeight:500,lineHeight:1,fontFamily:"inherit",
              color:saveStatus==="saved"?"#16a34a":(dark?"#e2e6f0":"#111"),transition:"color .2s"}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {saveStatus==="saved"
                  ?<path d="M20 6 9 17l-5-5"/>
                  :<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>
                }
              </svg>
              {saveStatus==="saved"?"Saved":"Save"}
            </span>
            <span style={{fontSize:"8.5px",color:saveStatus==="saved"?"#16a34a":"#2962ff",lineHeight:1,fontFamily:"inherit",transition:"color .2s"}}>Save</span>
          </button>
          <button style={caretBtn} onClick={p(()=>setSaveOpen(o=>!o))}><Caret/></button>
          <div style={{...panelBase(saveOpen,150,true)}}>
            <div className="tv-btn" style={mi()} onClick={()=>{ setSaveOpen(false); doSave(); }}>Save</div>
            <div className="tv-btn" style={mi()} onClick={()=>{ setSaveOpen(false); doSave(); toast("Saved as new layout"); }}>Save As New</div>
            <div className="tv-btn" style={mi()} onClick={()=>{ setSaveOpen(false); doLoad(); }}>Load Saved</div>
          </div>
        </div>
        <div style={sep}/>

        {/* Alert */}
        <div data-panel="alert" style={{position:"relative",flexShrink:0}}>
          <button className="tv-btn" style={ib(alertOpen)} title="Create alert"
            onClick={p(()=>setAlertOpen(o=>!o))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </button>
        </div>

        {/* Settings */}
        <div data-panel="settings" style={{position:"relative",flexShrink:0}}>
          <button className="tv-btn" style={ib(settingsOpen)} title="Chart settings"
            onClick={p(()=>setSettingsOpen(o=>!o))}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 19.5 6 19.5 18 12 22 4.5 18 4.5 6"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          {/* Settings panel */}
          <div style={{...panelBase(settingsOpen,260,true),padding:0}}>
            <div style={{padding:"10px 14px 8px",borderBottom:`1px solid ${bdr}`,
              fontSize:11,fontWeight:600,color:colDim,textTransform:"uppercase",letterSpacing:".06em"}}>
              Chart Settings
            </div>
            <div style={{padding:"8px 0"}}>
              {/* Dark mode */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"7px 14px"}}>
                <span style={{fontSize:12,color:dark?"#c8ccd8":"#333"}}>Dark Mode</span>
                <button onClick={()=>change({dark:!dark})}
                  style={{width:34,height:18,borderRadius:9,border:"none",cursor:"pointer",
                    background:dark?"#2962ff":"#ccd0dc",position:"relative",flexShrink:0}}>
                  <span style={{position:"absolute",top:2,left:dark?15:2,
                    width:14,height:14,borderRadius:"50%",background:"#fff",
                    transition:"left .18s",boxShadow:"0 1px 3px rgba(0,0,0,.25)",display:"block"}}/>
                </button>
              </div>
              {/* Chart type shortcuts */}
              <div style={{padding:"4px 14px 6px",borderTop:`1px solid ${bdr}`,marginTop:4}}>
                <div style={{fontSize:11,color:colDim,marginBottom:6,marginTop:6,fontWeight:500}}>Chart Type</div>
                <div style={{display:"flex",gap:4}}>
                  {["candlestick","line","bar","area"].map(ct=>(
                    <button key={ct} onClick={()=>{ change({chartType:ct}); setSettingsOpen(false); }}
                      style={{flex:1,padding:"4px 0",fontSize:11,border:`1px solid ${chartType===ct?"#2962ff":bdr}`,
                        borderRadius:3,cursor:"pointer",background:chartType===ct?"#2962ff":"transparent",
                        color:chartType===ct?"#fff":col,fontFamily:"inherit",transition:"background .12s",
                        textTransform:"capitalize"}}>
                      {ct==="candlestick"?"Candle":ct[0].toUpperCase()+ct.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {/* Timeframe shortcuts */}
              <div style={{padding:"4px 14px 10px",borderTop:`1px solid ${bdr}`,marginTop:4}}>
                <div style={{fontSize:11,color:colDim,marginBottom:6,marginTop:6,fontWeight:500}}>Timeframe</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {["1h","D","W","M"].map(t=>(
                    <button key={t} onClick={()=>{ change({tf:t}); setSettingsOpen(false); }}
                      style={{padding:"4px 10px",fontSize:11,border:`1px solid ${tf===t?"#2962ff":bdr}`,
                        borderRadius:3,cursor:"pointer",background:tf===t?"#2962ff":"transparent",
                        color:tf===t?"#fff":col,fontFamily:"inherit",transition:"background .12s"}}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen */}
        <button className="tv-btn" style={ib(isFS)} title={isFS?"Exit fullscreen":"Fullscreen"} onClick={toggleFS}>
          {isFS
            ?<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="8 3 3 3 3 8"/><polyline points="21 8 21 3 16 3"/>
              <polyline points="3 16 3 21 8 21"/><polyline points="16 21 21 21 21 16"/>
            </svg>
            :<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
              <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
            </svg>
          }
        </button>

        {/* Screenshot */}
        <button className="tv-btn" style={ib()} title="Screenshot"
          onClick={()=>toast("Use TradingView's camera icon inside the chart")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
        <div style={sep}/>

        {/* Dark Mode toggle */}
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"0 4px",flexShrink:0}}>
          <span style={{fontSize:11,color:colDim,whiteSpace:"nowrap"}}>Dark Mode</span>
          <button onClick={()=>change({dark:!dark})}
            style={{width:34,height:18,borderRadius:9,border:"none",
              cursor:"pointer",background:dark?"#2962ff":"#ccd0dc",position:"relative",flexShrink:0}}>
            <span style={{position:"absolute",top:2,left:dark?15:2,
              width:14,height:14,borderRadius:"50%",background:"#fff",
              transition:"left .18s",boxShadow:"0 1px 3px rgba(0,0,0,.25)",display:"block"}}/>
          </button>
        </div>
      </div>

      {/* ══════════ CHART AREA ══════════ */}
      <div ref={chartWrap}
        style={{flex:1,minHeight:0,overflow:"hidden",position:"relative",
          background:dark?"#131722":"#fff",
          cursor:crosshairOn?"crosshair":"default"}}
        onMouseMove={onChartMouseMove}
        onMouseLeave={onChartMouseLeave}>

        {/* iframe */}
        <iframe key={iframeKey} src={src}
          style={{position:"absolute",inset:0,
            width:"calc(100% + 330px)",height:"100%",border:"none",
            pointerEvents:crosshairOn?"none":"auto"}}
          allowFullScreen allow="fullscreen"/>

        {/* Crosshair overlay — pointer-events none so mouse passes to iframe when off */}
        {crosshairOn&&cursorPos.vis&&(
          <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:10}}>
            {/* vertical line */}
            <div style={{position:"absolute",top:0,bottom:0,left:cursorPos.x,
              width:1,background:dark?"rgba(200,204,216,.5)":"rgba(0,0,0,.25)"}}/>
            {/* horizontal line */}
            <div style={{position:"absolute",left:0,right:0,top:cursorPos.y,
              height:1,background:dark?"rgba(200,204,216,.5)":"rgba(0,0,0,.25)"}}/>
            {/* intersection dot */}
            <div style={{position:"absolute",
              left:cursorPos.x-3,top:cursorPos.y-3,
              width:6,height:6,borderRadius:"50%",
              background:dark?"#93c5fd":"#2962ff"}}/>
            {/* x label */}
            <div style={{position:"absolute",left:cursorPos.x+6,top:4,
              background:dark?"#2d3348":"#333",color:"#fff",
              fontSize:10,padding:"2px 5px",borderRadius:2,whiteSpace:"nowrap"}}>
              {Math.round(cursorPos.x)}px
            </div>
            {/* y label */}
            <div style={{position:"absolute",left:4,top:cursorPos.y+4,
              background:dark?"#2d3348":"#333",color:"#fff",
              fontSize:10,padding:"2px 5px",borderRadius:2,whiteSpace:"nowrap"}}>
              {Math.round(cursorPos.y)}px
            </div>
          </div>
        )}
      </div>

      {/* ══════════ ALERT MODAL ══════════ */}
      {/* backdrop */}
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:400,
        opacity:alertOpen?1:0,visibility:alertOpen?"visible":"hidden",
        transition:"opacity .2s,visibility .2s"}}
        onClick={()=>setAlertOpen(false)}/>
      {/* panel */}
      <div style={{position:"fixed",top:"50%",left:"50%",zIndex:401,
        transform:alertOpen?"translate(-50%,-50%)":"translate(-50%,-46%)",
        opacity:alertOpen?1:0,visibility:alertOpen?"visible":"hidden",
        transition:"opacity .2s,transform .2s,visibility .2s",
        width:360,background:surf,borderRadius:10,
        boxShadow:"0 20px 60px rgba(0,0,0,.25)",overflow:"hidden"}}>
        {/* header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"14px 16px 12px",borderBottom:`1px solid ${bdr}`}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span style={{fontSize:13,fontWeight:600,color:dark?"#e2e6f0":"#111"}}>Create Alert</span>
          </div>
          <button onClick={()=>setAlertOpen(false)}
            style={{border:"none",background:"none",cursor:"pointer",color:colDim,fontSize:16,lineHeight:1}}>✕</button>
        </div>
        {/* form */}
        <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
          {/* symbol */}
          <div>
            <label style={{fontSize:11,color:colDim,display:"block",marginBottom:4,fontWeight:500}}>Symbol</label>
            <input value={alertSym} onChange={e=>setAlertSym(e.target.value)}
              style={{width:"100%",padding:"7px 10px",border:`1px solid ${bdr}`,
                borderRadius:4,fontSize:13,color:dark?"#e2e6f0":"#111",
                background:surf2,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          {/* condition */}
          <div>
            <label style={{fontSize:11,color:colDim,display:"block",marginBottom:4,fontWeight:500}}>Condition</label>
            <select value={alertCond} onChange={e=>setAlertCond(e.target.value)}
              style={{width:"100%",padding:"7px 10px",border:`1px solid ${bdr}`,
                borderRadius:4,fontSize:13,color:dark?"#e2e6f0":"#111",
                background:surf2,outline:"none",fontFamily:"inherit",appearance:"auto"}}>
              {ALERT_CONDITIONS.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          {/* price */}
          <div>
            <label style={{fontSize:11,color:colDim,display:"block",marginBottom:4,fontWeight:500}}>Price Level</label>
            <input type="number" value={alertPrice} onChange={e=>setAlertPrice(e.target.value)}
              placeholder="e.g. 310.00"
              style={{width:"100%",padding:"7px 10px",border:`1px solid ${bdr}`,
                borderRadius:4,fontSize:13,color:dark?"#e2e6f0":"#111",
                background:surf2,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          {/* submit */}
          <button onClick={submitAlert}
            style={{width:"100%",padding:"9px",border:"none",borderRadius:4,
              background:alertSent?"#16a34a":"#2962ff",color:"#fff",fontSize:13,fontWeight:600,
              cursor:"pointer",fontFamily:"inherit",transition:"background .2s",
              display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {alertSent
              ?<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>Alert Created</>
              :"Create Alert"
            }
          </button>
        </div>
      </div>

      {/* ══════════ SYMBOL SEARCH ══════════ */}
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.28)",zIndex:300,
        opacity:searchOpen?1:0,visibility:searchOpen?"visible":"hidden",
        transition:"opacity .2s,visibility .2s"}}
        onClick={()=>setSearchOpen(false)}>
        <div style={{position:"absolute",top:60,left:"50%",
          transform:searchOpen?"translateX(-50%)":"translateX(-50%) translateY(-8px)",
          transition:"transform .2s",
          background:surf,borderRadius:8,width:420,
          boxShadow:"0 8px 30px rgba(0,0,0,.2)",overflow:"hidden"}}
          onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",alignItems:"center",gap:8,
            padding:"10px 12px",borderBottom:`1px solid ${bdr}`}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={colDim} strokeWidth="2.2" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/>
            </svg>
            <input ref={searchInput} type="text" value={searchQ}
              placeholder="Search symbol or company…"
              onChange={e=>setSearchQ(e.target.value)}
              onKeyDown={e=>e.key==="Escape"&&setSearchOpen(false)}
              style={{border:"none",outline:"none",fontSize:13,flex:1,
                fontFamily:"inherit",color:dark?"#e2e6f0":"#111",background:"transparent"}}/>
            {searchQ&&<button onClick={()=>setSearchQ("")}
              style={{border:"none",background:"none",cursor:"pointer",color:colDim,fontSize:14,lineHeight:1}}>✕</button>}
          </div>
          <div style={{maxHeight:300,overflowY:"auto"}}>
            {filtered.length===0
              ?<div style={{padding:16,fontSize:12,color:colDim,textAlign:"center"}}>No symbols found</div>
              :filtered.map(s=>(
                <div key={s.sym} className="tv-btn"
                  style={{padding:"10px 14px",borderBottom:`1px solid ${bdr}`,cursor:"pointer",
                    background:s.sym===sym?(dark?"#1e3a5f":"#eff6ff"):"transparent",
                    transition:"background .1s"}}
                  onClick={()=>{ change({sym:s.sym}); setSearchOpen(false); setSearchQ(""); toast(`Symbol: ${s.label}`); }}>
                  <div style={{fontSize:13,fontWeight:600,color:dark?"#e2e6f0":"#111"}}>{s.label}</div>
                  <div style={{fontSize:11,color:colDim,marginTop:1}}>{s.full}</div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* ══════════ TOAST ══════════ */}
      <div style={{
        position:"fixed",bottom:20,left:"50%",
        transform:`translateX(-50%) translateY(${toastOn?0:8}px)`,
        background:dark?"#1e2535":"#1a1a1a",color:"#fff",fontSize:12,
        padding:"7px 16px",borderRadius:4,
        opacity:toastOn?1:0,transition:"opacity .18s,transform .18s",
        pointerEvents:"none",zIndex:999,whiteSpace:"nowrap",fontFamily:"inherit",
        boxShadow:"0 4px 12px rgba(0,0,0,.2)",
      }}>{toastMsg}</div>

    </div>
  );
}
