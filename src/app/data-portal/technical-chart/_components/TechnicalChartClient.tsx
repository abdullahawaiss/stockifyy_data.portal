"use client";
import { useState } from "react";

const INTERVALS = [
  { label: "1m",  value: "1"   },
  { label: "5m",  value: "5"   },
  { label: "15m", value: "15"  },
  { label: "30m", value: "30"  },
  { label: "1h",  value: "60"  },
  { label: "4h",  value: "240" },
  { label: "1D",  value: "D"   },
  { label: "1W",  value: "W"   },
  { label: "1M",  value: "M"   },
];

const PSX_SYMBOLS = [
  "PSX:KSE100","PSX:OGDC","PSX:PPL","PSX:LUCK","PSX:ENGRO","PSX:HBL",
  "PSX:MCB","PSX:UBL","PSX:EFERT","PSX:HUBC","PSX:PSO","PSX:MARI",
  "PSX:BAFL","PSX:BAHL","PSX:NBP","PSX:FFC","PSX:FCCL","PSX:SEARL",
];

export default function TechnicalChartClient() {
  const [symbol, setSymbol] = useState("PSX:KSE100");
  const [interval, setInterval] = useState("D");
  const [input, setInput] = useState("");
  const [theme] = useState<"dark" | "light">("dark");

  const src = `https://www.tradingview.com/widgetembed/?`
    + `symbol=${encodeURIComponent(symbol)}`
    + `&interval=${interval}`
    + `&theme=${theme}`
    + `&style=1`
    + `&locale=en`
    + `&timezone=Asia%2FKarachi`
    + `&hide_top_toolbar=0`
    + `&hide_legend=0`
    + `&save_image=1`
    + `&allow_symbol_change=1`
    + `&details=0`
    + `&hotlist=0`
    + `&calendar=0`
    + `&studies=[]`
    + `&utm_source=stockifyy-data-portal.vercel.app`
    + `&utm_medium=widget`
    + `&utm_campaign=chart`;

  const applySymbol = () => {
    const val = input.trim().toUpperCase();
    if (!val) return;
    setSymbol(val.includes(":") ? val : `PSX:${val}`);
    setInput("");
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", minHeight:"calc(100vh - 40px)", background:"#131722" }}>
      {/* top bar */}
      <div style={{
        display:"flex", alignItems:"center", gap:8, padding:"6px 12px",
        background:"#1e222d", borderBottom:"1px solid #2a2e39", flexShrink:0, flexWrap:"wrap"
      }}>
        {/* symbol search */}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && applySymbol()}
          placeholder="Symbol (e.g. OGDC)"
          style={{
            background:"#2a2e39", border:"1px solid #363a45", borderRadius:4,
            color:"#d1d4dc", padding:"4px 10px", fontSize:13, width:160, outline:"none"
          }}
        />
        <button onClick={applySymbol} style={{
          background:"#2962ff", color:"#fff", border:"none", borderRadius:4,
          padding:"4px 12px", fontSize:13, cursor:"pointer"
        }}>Go</button>

        {/* quick symbols */}
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {["KSE100","OGDC","PPL","LUCK","ENGRO","HBL","MCB"].map(s => (
            <button key={s} onClick={() => setSymbol(`PSX:${s}`)} style={{
              background: symbol === `PSX:${s}` ? "#2962ff" : "#2a2e39",
              color:"#d1d4dc", border:"none", borderRadius:4,
              padding:"3px 8px", fontSize:12, cursor:"pointer"
            }}>{s}</button>
          ))}
        </div>

        {/* intervals */}
        <div style={{ display:"flex", gap:4, marginLeft:"auto" }}>
          {INTERVALS.map(iv => (
            <button key={iv.value} onClick={() => setInterval(iv.value)} style={{
              background: interval === iv.value ? "#2962ff" : "#2a2e39",
              color:"#d1d4dc", border:"none", borderRadius:4,
              padding:"3px 8px", fontSize:12, cursor:"pointer"
            }}>{iv.label}</button>
          ))}
        </div>
      </div>

      {/* TradingView chart */}
      <iframe
        key={`${symbol}_${interval}`}
        src={src}
        style={{ flex:1, width:"100%", border:"none", minHeight:0 }}
        allowFullScreen
        allow="fullscreen"
      />
    </div>
  );
}
