"use client";
import { useState, useLayoutEffect, useEffect, useRef } from "react";
import { searchPsxStocks } from "@/lib/psx-stocks-static";

declare global {
  interface Window {
    TradingView: { widget: new (config: Record<string, unknown>) => void };
  }
}

const QUICK_PICKS = ["HBL", "OGDC", "MCB", "ENGRO", "LUCK", "UBL", "PSO", "MARI", "SYS", "TRG"];

// Load tv.js once, call back when ready
function loadTvScript(cb: () => void) {
  const SCRIPT_ID = "tv-advanced-script";
  if (window.TradingView) { cb(); return; }
  let s = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (!s) {
    s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = "https://s3.tradingview.com/tv.js";
    s.async = true;
    document.head.appendChild(s);
  }
  s.addEventListener("load", cb, { once: true });
}

// ── TvWidget — re-mounts on key change (symbol or theme) ──────────────────
function TvWidget({ symbol, dark }: { symbol: string; dark: boolean }) {
  const containerId = "tv_adv_chart";
  const didInit = useRef(false);

  useEffect(() => {
    didInit.current = false;
    function init() {
      if (didInit.current) return;
      const el = document.getElementById(containerId);
      if (!el || !window.TradingView) return;
      didInit.current = true;
      new window.TradingView.widget({
        autosize: true,
        symbol: `PSX:${symbol}`,
        interval: "D",
        timezone: "Asia/Karachi",
        theme: dark ? "dark" : "light",
        style: "1",
        locale: "en",
        toolbar_bg: dark ? "#0E1F30" : "#f1f3f6",
        enable_publishing: false,
        allow_symbol_change: true,
        hide_side_toolbar: false,
        container_id: containerId,
        withdateranges: true,
        save_image: false,
        details: true,
        hotlist: true,
        calendar: false,
      });
    }
    loadTvScript(init);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div id={containerId} style={{ flex: 1, width: "100%", minHeight: 0 }} />
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function TechnicalChartClient() {
  const [rawSymbol, setRawSymbol] = useState("HBL");
  const [input, setInput] = useState("HBL");
  const [suggestions, setSuggestions] = useState<{ symbol: string; name: string }[]>([]);
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
      const staticRes = searchPsxStocks(v, 10);
      setSuggestions(staticRes.map(s => ({ symbol: s.symbol, name: s.name })));
      fetch(`/api/portal/companies?search=${encodeURIComponent(v)}&limit=10`)
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

  // key forces TvWidget to remount when symbol or theme changes
  const widgetKey = `${rawSymbol}__${dark ? "dark" : "light"}`;

  return (
    <div suppressHydrationWarning style={{
      display: "flex", flexDirection: "column",
      height: "calc(100vh - 56px)", background: "var(--background)",
    }}>
      {/* ── Header bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 18px",
        borderBottom: "1px solid var(--border)", background: "var(--card-bg)",
        flexShrink: 0, flexWrap: "wrap",
      }}>
        <h1 style={{ fontSize: 17, fontWeight: 800, margin: 0, flexShrink: 0 }}>
          <span style={{ color: "var(--navy)" }}>Technical</span>{" "}
          <span style={{ color: "#C8860A" }}>Chart</span>
        </h1>

        {mounted && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
            {/* Symbol search */}
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", border: "1.5px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--background)" }}>
                <input
                  value={input}
                  onChange={e => handleInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && selectSymbol(input)}
                  placeholder="Symbol e.g. OGDC"
                  style={{
                    padding: "7px 12px", fontSize: 13, fontWeight: 700, border: "none",
                    outline: "none", background: "transparent", color: "var(--text)",
                    width: 150, textTransform: "uppercase",
                  }}
                />
                <button onClick={() => selectSymbol(input)}
                  style={{ padding: "7px 14px", background: "#C8860A", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Load
                </button>
              </div>
              {suggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 280,
                  background: "var(--card-bg)", border: "1px solid var(--border)",
                  borderRadius: 8, zIndex: 50, boxShadow: "0 4px 20px rgba(0,0,0,0.18)", overflow: "hidden",
                }}>
                  {suggestions.map(s => (
                    <button key={s.symbol} onClick={() => selectSymbol(s.symbol)} style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      padding: "9px 14px", fontSize: 13, background: "transparent", border: "none",
                      color: "var(--text)", cursor: "pointer", borderBottom: "1px solid var(--border)",
                      textAlign: "left",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(200,134,10,0.09)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <span style={{ fontWeight: 700, color: "#C8860A", minWidth: 64 }}>{s.symbol}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick picks */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {QUICK_PICKS.map(s => (
                <button key={s} onClick={() => selectSymbol(s)} style={{
                  padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                  background: rawSymbol === s ? "#C8860A" : "var(--background)",
                  color: rawSymbol === s ? "#fff" : "var(--text-muted)",
                  border: "1px solid var(--border)", transition: "all 100ms",
                }}>{s}</button>
              ))}
            </div>

            <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
              PSX:{rawSymbol} · via TradingView
            </span>
          </div>
        )}
      </div>

      {/* ── Chart area ── */}
      {mounted ? (
        <TvWidget key={widgetKey} symbol={rawSymbol} dark={dark} />
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background)" }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading chart…</span>
        </div>
      )}
    </div>
  );
}
