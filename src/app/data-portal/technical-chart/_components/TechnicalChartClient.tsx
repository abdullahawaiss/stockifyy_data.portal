"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const SYMS = [
  { sym: "NASDAQ:AAPL",     label: "AAPL",    full: "Apple Inc — NASDAQ"             },
  { sym: "NASDAQ:MSFT",     label: "MSFT",    full: "Microsoft Corporation — NASDAQ"  },
  { sym: "NASDAQ:GOOGL",    label: "GOOGL",   full: "Alphabet Inc — NASDAQ"           },
  { sym: "NASDAQ:TSLA",     label: "TSLA",    full: "Tesla Inc — NASDAQ"              },
  { sym: "NASDAQ:NVDA",     label: "NVDA",    full: "NVIDIA Corporation — NASDAQ"     },
  { sym: "NYSE:JPM",        label: "JPM",     full: "JPMorgan Chase — NYSE"           },
  { sym: "TVC:GOLD",        label: "GOLD",    full: "Gold — Spot"                    },
  { sym: "TVC:USOIL",       label: "OIL",     full: "Crude Oil — WTI"                },
  { sym: "BINANCE:BTCUSDT", label: "BTC",     full: "Bitcoin / USD"                  },
  { sym: "BINANCE:ETHUSDT", label: "ETH",     full: "Ethereum / USD"                 },
];

const TF_MAP: Record<string, string> = {
  "1h": "60", "D": "D", "W": "W", "M": "M",
};

const STYLE_MAP: Record<string, string> = {
  candlestick: "1", line: "2", bar: "0", area: "3",
};

export default function TechnicalChartClient() {
  const [sym,        setSym]       = useState("NASDAQ:AAPL");
  const [tf,         setTf]        = useState("D");
  const [chartType,  setChartType] = useState("candlestick");
  const [sessionKey, setSessionKey] = useState(() => Date.now());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ,    setSearchQ]   = useState("");
  const [fxOpen,     setFxOpen]    = useState(false);
  const [curOpen,    setCurOpen]   = useState(false);
  const [toastMsg,   setToastMsg]  = useState("");
  const [toastOn,    setToastOn]   = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  // rebuild iframe whenever key inputs change
  useEffect(() => { setSessionKey(Date.now()); }, [sym, tf, chartType]);

  // close dropdowns on outside click
  useEffect(() => {
    const h = () => { setFxOpen(false); setCurOpen(false); };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchInput.current?.focus(), 40);
  }, [searchOpen]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2200);
  }, []);

  const symLabel = SYMS.find(s => s.sym === sym)?.label ?? sym.replace(/^[A-Z]+:/, "");
  const filtered = searchQ
    ? SYMS.filter(s => s.label.toLowerCase().includes(searchQ.toLowerCase()) || s.full.toLowerCase().includes(searchQ.toLowerCase()))
    : SYMS;

  const src =
    "https://www.tradingview.com/widgetembed/?" +
    `symbol=${encodeURIComponent(sym)}` +
    `&interval=${TF_MAP[tf] ?? "D"}` +
    `&style=${STYLE_MAP[chartType] ?? "1"}` +
    "&theme=light&locale=en&timezone=Asia%2FKarachi" +
    "&hide_top_toolbar=1&hide_legend=0&hidesidetoolbar=0" +
    "&save_image=1&allow_symbol_change=1" +
    "&details=0&hotlist=0&calendar=0&studies=[]&withdateranges=0" +
    "&utm_source=stockifyy-data-portal.vercel.app&utm_medium=widget";

  /* ── shared micro-styles ── */
  const ib = (on = false): React.CSSProperties => ({
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, borderRadius: 3, border: "none", cursor: "pointer",
    background: on ? "#eee" : "transparent", color: on ? "#111" : "#555",
    transition: "background .1s", flexShrink: 0,
  });
  const sep: React.CSSProperties = { width: 1, height: 18, background: "#e0e0e0", margin: "0 5px", flexShrink: 0 };
  const tf_btn = (on: boolean): React.CSSProperties => ({
    height: 26, minWidth: 24, padding: "0 7px", fontSize: 12,
    fontWeight: on ? 600 : 500, color: on ? "#111" : "#555",
    border: "none", borderRadius: 3, cursor: "pointer",
    background: on ? "#eee" : "transparent",
    fontFamily: "inherit", transition: "background .1s", flexShrink: 0,
  });
  const tb: React.CSSProperties = {
    height: 28, padding: "0 6px", fontSize: 11.5, fontWeight: 400, color: "#555",
    whiteSpace: "nowrap", border: "none", background: "transparent",
    borderRadius: 3, cursor: "pointer", fontFamily: "inherit",
    transition: "background .1s, color .1s", flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0,
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* ══ TOOLBAR ══ */}
      <div style={{
        display: "flex", alignItems: "center", height: 38,
        padding: "0 6px", background: "#fff",
        borderBottom: "1px solid #e0e0e0", flexShrink: 0,
        overflowX: "auto", gap: 0,
      }}>

        {/* Symbol */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <button style={{ ...ib(), width: "auto", padding: "0 2px" }}
            onClick={() => setSearchOpen(true)} title="Search symbol">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
              <circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/>
            </svg>
          </button>
          <span onClick={() => setSearchOpen(true)}
            style={{ fontSize: 13, fontWeight: 700, color: "#111", cursor: "pointer",
              letterSpacing: "-.01em", whiteSpace: "nowrap" }}>
            {symLabel}
          </span>
          <button onClick={() => toast("Added to watchlist")}
            style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid #ccc",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#777", background: "transparent", cursor: "pointer", flexShrink: 0 }}
            title="Add to watchlist">
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="5" y1="1" x2="5" y2="9"/><line x1="1" y1="5" x2="9" y2="5"/>
            </svg>
          </button>
        </div>

        <div style={sep}/>

        {/* Timeframes */}
        <div style={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          {["1h","D","W","M"].map(t => (
            <button key={t} style={tf_btn(tf === t)}
              onClick={() => { setTf(t); toast(`Timeframe: ${t}`); }}>
              {t}
            </button>
          ))}
        </div>

        <div style={sep}/>

        {/* Chart type icons */}
        {/* Candlestick */}
        <button style={ib(chartType === "candlestick")} title="Candlestick"
          onClick={() => { setChartType("candlestick"); toast("Candlestick"); }}>
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
        <button style={ib(chartType === "line")} title="Line"
          onClick={() => { setChartType("line"); toast("Line chart"); }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1,11 3.5,7.5 6.5,9.5 9.5,4.5 12,6.5 14,3.5"/>
          </svg>
        </button>

        {/* Bar */}
        <button style={ib(chartType === "bar")} title="Bar (OHLC)"
          onClick={() => { setChartType("bar"); toast("Bar chart"); }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round">
            <line x1="4" y1="2.5" x2="4" y2="12.5"/>
            <line x1="4" y1="4.5" x2="2" y2="4.5"/>
            <line x1="4" y1="9.5" x2="6" y2="9.5"/>
            <line x1="10" y1="2" x2="10" y2="12"/>
            <line x1="10" y1="3.5" x2="8" y2="3.5"/>
            <line x1="10" y1="8.5" x2="12" y2="8.5"/>
          </svg>
        </button>

        {/* Area */}
        <button style={ib(chartType === "area")} title="Area"
          onClick={() => { setChartType("area"); toast("Area chart"); }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1,10 3.5,6.5 6.5,8.5 9.5,3.5 12,5.5 14,2.5"/>
            <path d="M14 2.5 L14 13 L1 13 L1 10" fill="currentColor" opacity=".18" stroke="none"/>
          </svg>
        </button>

        {/* Chart type caret */}
        <button onClick={() => toast("More chart types")}
          style={{ width: 12, height: 28, border: "none", background: "transparent",
            cursor: "pointer", color: "#888", display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0 }}>
          <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor"><path d="M0 2l4 4 4-4z"/></svg>
        </button>

        <div style={sep}/>

        {/* Crosshair */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", flexShrink: 0 }}>
          <button style={ib()} title="Crosshair"
            onClick={e => { e.stopPropagation(); setCurOpen(o => !o); setFxOpen(false); }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
              <line x1="7.5" y1="1" x2="7.5" y2="5"/>
              <line x1="7.5" y1="10" x2="7.5" y2="14"/>
              <line x1="1" y1="7.5" x2="5" y2="7.5"/>
              <line x1="10" y1="7.5" x2="14" y2="7.5"/>
              <circle cx="7.5" cy="7.5" r="2.2"/>
            </svg>
          </button>
          <button onClick={e => { e.stopPropagation(); setCurOpen(o => !o); }}
            style={{ width: 12, height: 28, border: "none", background: "transparent",
              cursor: "pointer", color: "#888", display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0 }}>
            <svg width="7" height="7" viewBox="0 0 8 8" fill="currentColor"><path d="M0 2l4 4 4-4z"/></svg>
          </button>
          {curOpen && (
            <div onClick={e => e.stopPropagation()}
              style={{ position: "absolute", top: "calc(100% + 2px)", left: 0,
                background: "#fff", border: "1px solid #ddd", borderRadius: 4,
                boxShadow: "0 4px 14px rgba(0,0,0,.12)", minWidth: 140, zIndex: 100, padding: "3px 0" }}>
              {["Crosshair","Dot","Arrow"].map(c => (
                <div key={c}
                  style={{ padding: "6px 13px", fontSize: 12, color: "#333",
                    cursor: "pointer", background: c==="Crosshair" ? "#eef4ff" : "transparent" }}
                  onClick={() => { setCurOpen(false); toast(`${c} cursor`); }}>
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={sep}/>

        {/* fx */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); setFxOpen(o => !o); setCurOpen(false); }}
            style={{ height: 28, padding: "0 6px", border: "none", background: "transparent",
              borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center",
              gap: 1, color: "#555", flexShrink: 0 }}
            title="Indicators">
            <span style={{ fontStyle: "italic", fontFamily: "Georgia,serif", fontSize: 13, lineHeight: 1 }}>f</span>
            <span style={{ fontSize: "9.5px", verticalAlign: "sub", fontStyle: "normal", lineHeight: 1 }}>x</span>
          </button>
          {fxOpen && (
            <div onClick={e => e.stopPropagation()}
              style={{ position: "absolute", top: "calc(100% + 2px)", left: 0,
                background: "#fff", border: "1px solid #ddd", borderRadius: 4,
                boxShadow: "0 4px 14px rgba(0,0,0,.12)", minWidth: 170, zIndex: 100, padding: "3px 0" }}>
              {["Moving Average","RSI","MACD","Bollinger Bands","Stochastic","ATR","Volume"].map(ind => (
                <div key={ind}
                  style={{ padding: "6px 13px", fontSize: 12, color: "#333", cursor: "pointer" }}
                  onClick={() => { setFxOpen(false); toast(`${ind} added`); }}>
                  {ind}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={sep}/>

        {/* Text action buttons */}
        {["Clear Marks","Load Marks","Remove All Studies","Remove All Shapes"].map(label => (
          <button key={label} style={tb} onClick={() => toast(label)}>{label}</button>
        ))}

        {/* spacer */}
        <div style={{ flex: 1 }}/>

        {/* RIGHT: Undo */}
        <button style={ib()} title="Undo" onClick={() => toast("Undone")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h10a6 6 0 0 1 0 12H9"/><polyline points="3 3 3 7 7 7"/>
          </svg>
        </button>

        {/* Redo (disabled) */}
        <button style={{ ...ib(), opacity: .32, cursor: "default" }} title="Redo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7H11a6 6 0 0 0 0 12h4"/><polyline points="21 3 21 7 17 7"/>
          </svg>
        </button>

        <div style={sep}/>

        {/* Save */}
        <button onClick={() => toast("Chart saved")}
          style={{ height: 28, padding: "0 7px", border: "none", background: "transparent",
            borderRadius: 3, cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3,
            fontSize: 12, fontWeight: 500, color: "#111", lineHeight: 1, fontFamily: "inherit" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Save
          </span>
          <span style={{ fontSize: "8.5px", color: "#2962ff", lineHeight: 1, fontFamily: "inherit" }}>Save</span>
        </button>

        <div style={sep}/>

        {/* Lightning */}
        <button style={ib()} title="Create alert" onClick={() => toast("Create alert")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </button>

        {/* Hexagon / Settings */}
        <button style={ib()} title="Chart settings" onClick={() => toast("Chart settings")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 19.5 6 19.5 18 12 22 4.5 18 4.5 6"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>

        {/* Fullscreen */}
        <button style={ib()} title="Fullscreen" onClick={() => toast("Fullscreen")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 3 21 3 21 9"/>
            <polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/>
            <line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
        </button>

      </div>

      {/* ══ CHART ══ */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", position: "relative" }}>
        <iframe
          key={sessionKey}
          src={src}
          style={{ position: "absolute", inset: 0, width: "calc(100% + 330px)", height: "100%", border: "none" }}
          allowFullScreen
          allow="fullscreen"
        />
      </div>

      {/* ══ SYMBOL SEARCH MODAL ══ */}
      {searchOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.28)",
          zIndex: 200, display: "flex", alignItems: "flex-start",
          justifyContent: "center", paddingTop: 60 }}
          onClick={() => setSearchOpen(false)}>
          <div style={{ background: "#fff", borderRadius: 6, width: 380,
            boxShadow: "0 8px 30px rgba(0,0,0,.18)", overflow: "hidden" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "9px 11px", borderBottom: "1px solid #eee" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/>
              </svg>
              <input ref={searchInput} type="text" value={searchQ}
                placeholder="Search symbol or company…"
                onChange={e => setSearchQ(e.target.value)}
                onKeyDown={e => e.key === "Escape" && setSearchOpen(false)}
                style={{ border: "none", outline: "none", fontSize: 13, flex: 1,
                  fontFamily: "inherit", color: "#111", background: "transparent" }}/>
              <button onClick={() => setSearchOpen(false)}
                style={{ border: "none", background: "none", cursor: "pointer",
                  color: "#999", fontSize: 15, lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {filtered.length === 0
                ? <div style={{ padding: 14, fontSize: 12, color: "#999", textAlign: "center" }}>No symbols found</div>
                : filtered.map(s => (
                  <div key={s.sym}
                    style={{ padding: "8px 13px", borderBottom: "1px solid #f5f5f5", cursor: "pointer" }}
                    onClick={() => { setSym(s.sym); setSearchOpen(false); setSearchQ(""); toast(`Symbol: ${s.label}`); }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{s.full}</div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ══ TOAST ══ */}
      <div style={{
        position: "fixed", bottom: 18, left: "50%",
        transform: `translateX(-50%) translateY(${toastOn ? 0 : 6}px)`,
        background: "#1a1a1a", color: "#fff", fontSize: 12,
        padding: "6px 15px", borderRadius: 4,
        opacity: toastOn ? 1 : 0, transition: "opacity .18s, transform .18s",
        pointerEvents: "none", zIndex: 999, whiteSpace: "nowrap", fontFamily: "inherit",
      }}>
        {toastMsg}
      </div>

    </div>
  );
}
