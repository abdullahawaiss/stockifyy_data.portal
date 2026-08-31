"use client";
import { useState, useLayoutEffect } from "react";
import { searchPsxStocks } from "@/lib/psx-stocks-static";

const QUICK_PICKS = ["HBL", "OGDC", "MCB", "ENGRO", "LUCK", "UBL", "PSO", "MARI", "SYS", "TRG"];

const TIMEFRAMES = [
  { label: "1m",  value: "1"   },
  { label: "5m",  value: "5"   },
  { label: "15m", value: "15"  },
  { label: "30m", value: "30"  },
  { label: "1H",  value: "60"  },
  { label: "4H",  value: "240" },
  { label: "1D",  value: "D"   },
  { label: "1W",  value: "W"   },
  { label: "1M",  value: "M"   },
];

// TradingView style codes
const CHART_TYPES = [
  { label: "Candles", value: "1" },
  { label: "Bars",    value: "0" },
  { label: "Line",    value: "2" },
  { label: "Area",    value: "3" },
  { label: "Heikin",  value: "8" },
];

function buildChartUrl(symbol: string, interval: string, style: string, dark: boolean): string {
  const params = new URLSearchParams({
    symbol: `PSX:${symbol}`,
    interval,
    theme: dark ? "dark" : "light",
    style,
    locale: "en",
    toolbar_bg: dark ? "1a2535" : "f1f3f6",
    enable_publishing: "false",
    allow_symbol_change: "1",
    save_image: "true",
    withdateranges: "1",
    hideideas: "1",
    hide_legend: "0",
    hide_side_toolbar: "0",
    details: "1",
    hotlist: "1",
    calendar: "0",
    timezone: "Asia/Karachi",
    show_popup_button: "true",
    popup_width: "1000",
    popup_height: "650",
  });
  return `https://s.tradingview.com/widgetembed/?frameElementId=tv_chart&${params.toString()}`;
}

const BTN: React.CSSProperties = {
  padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
  cursor: "pointer", border: "1px solid var(--border)", whiteSpace: "nowrap",
  transition: "all 100ms", background: "var(--background)", color: "var(--text-muted)",
};
const BTN_ACTIVE: React.CSSProperties = {
  ...BTN, background: "#C8860A", color: "#fff", border: "1px solid #C8860A",
};

export default function TechnicalChartClient() {
  const [rawSymbol, setRawSymbol] = useState("HBL");
  const [input, setInput] = useState("HBL");
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);
  const [interval, setInterval] = useState("D");
  const [chartStyle, setChartStyle] = useState("1");
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useLayoutEffect(() => {
    setMounted(true);
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.getAttribute("data-theme") === "dark");
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  function selectSymbol(sym: string) {
    const s = sym.trim().toUpperCase();
    if (!s) return;
    setRawSymbol(s);
    setInput(s);
    setSuggestions([]);
  }

  function handleInput(val: string) {
    const v = val.toUpperCase();
    setInput(v);
    if (v.length >= 1) {
      const staticRes = searchPsxStocks(v, 12);
      setSuggestions(staticRes.map(s => ({ symbol: s.symbol, name: s.name })));
      fetch(`/api/portal/companies?search=${encodeURIComponent(v)}&limit=12`)
        .then(r => r.json())
        .then(j => {
          const live = (j.data ?? []).map((c: { symbol: string; name: string }) => ({ symbol: c.symbol, name: c.name }));
          if (live.length > 0) setSuggestions(live);
        })
        .catch(() => {});
    } else {
      setSuggestions([]);
    }
  }

  const chartUrl = mounted
    ? buildChartUrl(rawSymbol, interval, chartStyle, dark)
    : buildChartUrl("HBL", "D", "1", false);

  return (
    <div suppressHydrationWarning style={{
      display: "flex", flexDirection: "column",
      height: "calc(100vh - 56px)", background: "var(--background)",
    }}>
      {/* ── Header bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, rowGap: 8, padding: "10px 14px",
        borderBottom: "1px solid var(--border)", background: "var(--card-bg)",
        flexShrink: 0, flexWrap: "wrap",
      }}>
        {/* Title */}
        <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0, flexShrink: 0 }}>
          <span style={{ color: "var(--navy)" }}>Technical</span>{" "}
          <span style={{ color: "#C8860A" }}>Chart</span>
        </h1>

        {mounted && (
          <>
            {/* Symbol search */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ display: "flex", border: "1.5px solid var(--border)", borderRadius: 7, overflow: "hidden", background: "var(--background)" }}>
                <input
                  value={input}
                  onChange={e => handleInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && selectSymbol(input)}
                  placeholder="e.g. OGDC"
                  style={{
                    padding: "6px 10px", fontSize: 13, fontWeight: 700, border: "none",
                    outline: "none", background: "transparent", color: "var(--text)",
                    width: 120, textTransform: "uppercase",
                  }}
                />
                <button onClick={() => selectSymbol(input)}
                  style={{ padding: "6px 12px", background: "#C8860A", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Load
                </button>
              </div>
              {suggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 260,
                  background: "var(--card-bg)", border: "1px solid var(--border)",
                  borderRadius: 8, zIndex: 50, boxShadow: "0 4px 20px rgba(0,0,0,0.18)", overflow: "hidden",
                }}>
                  {suggestions.map(s => (
                    <button key={s.symbol} onClick={() => selectSymbol(s.symbol)} style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      padding: "8px 12px", fontSize: 12, background: "transparent", border: "none",
                      color: "var(--text)", cursor: "pointer", borderBottom: "1px solid var(--border)",
                      textAlign: "left",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(200,134,10,0.09)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <span style={{ fontWeight: 700, color: "#C8860A", minWidth: 60 }}>{s.symbol}</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div style={{ width: 1, height: 22, background: "var(--border)", flexShrink: 0 }} />

            {/* Timeframe buttons */}
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {TIMEFRAMES.map(tf => (
                <button key={tf.value} onClick={() => setInterval(tf.value)}
                  style={interval === tf.value ? BTN_ACTIVE : BTN}>
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Camera / screenshot button */}
            <button
              title="Take screenshot"
              onClick={() => {
                const iframe = document.getElementById("tv_chart") as HTMLIFrameElement | null;
                iframe?.contentWindow?.postMessage({ name: "tv-widget-save-image" }, "*");
              }}
              style={{
                ...BTN, marginLeft: "auto", display: "flex", alignItems: "center",
                gap: 5, padding: "5px 10px", flexShrink: 0,
              }}
            >
              📷
            </button>

            <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
              PSX:{rawSymbol} · TradingView
            </span>
          </>
        )}
      </div>

      {/* TradingView iframe with padding on all sides */}
      <div style={{ flex: 1, padding: "20px 20px 16px", background: "var(--background)", boxSizing: "border-box", display: "flex" }}>
        <iframe
          key={rawSymbol}
          src={chartUrl}
          id="tv_chart"
          title={`Technical Chart — PSX:${rawSymbol}`}
          style={{ flex: 1, border: "none", display: "block", width: "100%", height: "100%", borderRadius: 10 }}
          allow="fullscreen"
          loading="eager"
        />
      </div>
    </div>
  );
}
