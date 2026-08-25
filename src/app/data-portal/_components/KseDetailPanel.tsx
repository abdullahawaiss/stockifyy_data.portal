"use client";
import { useState, useEffect } from "react";
import { useDarkTokens } from "@/hooks/useDarkMode";

// Only real fields returned by /api/portal/market-summary
type RawIndex = { code: string; close: number; change: number; pct: number; vol: number };

type IndexDef = {
  code:      string;
  label:     string;
  close:     number;
  change:    number;
  pct:       number;
  vol:       number;
  prevClose: number;
};

const IDX_NORM: Record<string, string> = {
  KSE100: "KSE-100", "KSE-100": "KSE-100", KSE100PR: "KSE-100",
  KSE30:  "KSE-30",  "KSE-30":  "KSE-30",
  ALLSHR: "KSE ALL", "KSE ALL": "KSE ALL",
  KMI30:  "KMI-30",  "KMI-30":  "KMI-30",
  KMIALLSHR: "KMI ALL", KMIALL: "KMI ALL", "KMI ALL": "KMI ALL",
};

function mapIndices(raw: RawIndex[]): IndexDef[] {
  return raw.map(ix => {
    const code  = IDX_NORM[ix.code] ?? ix.code;
    const close = Number(ix.close)  || 0;
    const change = Number(ix.change) || 0;
    return {
      code,
      label:     code,
      close,
      change,
      pct:       Number(ix.pct) || 0,
      vol:       Number(ix.vol) || 0,
      prevClose: close - change,
    };
  });
}

function fmt(n: number) {
  return n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Chart unavailable placeholder ────────────────────────────────────
function ChartUnavailable({ dark }: { dark: boolean }) {
  const borderCol = dark ? "rgba(255,255,255,0.09)" : "#e5e7eb";
  const bg        = dark ? "#0E1F30" : "#fafafa";
  const textC     = dark ? "#5C8099" : "#aaa";
  return (
    <div style={{
      height: 200, border: `1px solid ${borderCol}`, borderRadius: 6,
      background: bg, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 8,
    }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect x="2" y="2" width="32" height="32" rx="5" stroke={textC} strokeWidth="1.5"/>
        <path d="M7 25 L12 17 L18 20 L24 12 L29 16" stroke={textC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="29" cy="16" r="2" fill={textC}/>
      </svg>
      <span style={{ fontSize: 12, color: textC, fontWeight: 500, textAlign: "center", padding: "0 16px" }}>
        Live chart data is temporarily unavailable.
      </span>
      <span style={{ fontSize: 10, color: textC, opacity: 0.7 }}>
        Historical OHLC data will appear here when available.
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function KseDetailPanel({
  initialIndices,
  activeIndexCode,
}: {
  initialIndices?: RawIndex[];
  activeIndexCode?: string | null;
}) {
  const [indices, setIndices] = useState<IndexDef[]>(() =>
    initialIndices ? mapIndices(initialIndices) : []
  );
  const [loading, setLoading] = useState(!initialIndices);

  useEffect(() => {
    if (initialIndices) return;
    const ctrl = new AbortController();
    fetch("/api/portal/market-summary", { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => setIndices(mapIndices(d.indices ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [initialIndices]);

  const t = useDarkTokens();

  if (loading) return <div className="card animate-pulse" style={{ height: 320 }} />;
  if (indices.length === 0) return (
    <div className="card p-6 text-center" style={{ color: "var(--text-muted)" }}>
      <div className="text-sm font-semibold mb-1" style={{ color: "var(--navy)" }}>Indices — No data available</div>
      <div className="text-xs">Market data will appear when the database is connected.</div>
    </div>
  );

  return <KseDetailPanelInner indices={indices} externalActiveCode={activeIndexCode ?? null} />;
}

// ── Inner panel ───────────────────────────────────────────────────────
function KseDetailPanelInner({
  indices,
  externalActiveCode,
}: {
  indices: IndexDef[];
  externalActiveCode: string | null;
}) {
  const t = useDarkTokens();
  const [activeCode, setActiveCode] = useState(externalActiveCode ?? indices[0].code);
  const [asOf, setAsOf] = useState("");

  useEffect(() => {
    if (externalActiveCode && indices.some(i => i.code === externalActiveCode)) {
      setActiveCode(externalActiveCode);
    }
  }, [externalActiveCode, indices]);

  useEffect(() => {
    const now = new Date();
    setAsOf(
      now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    );
  }, []);

  const idx = indices.find(i => i.code === activeCode) ?? indices[0];
  const isUp  = idx.change >= 0;
  const color = isUp ? "#16A34A" : "#DC2626";

  const scrollNav = (dir: "left" | "right", ref: HTMLDivElement | null) => {
    ref?.scrollBy({ left: dir === "right" ? 160 : -160, behavior: "smooth" });
  };
  const [navEl, setNavEl] = useState<HTMLDivElement | null>(null);

  return (
    <div style={{
      background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8,
      boxShadow: t.cardShadow, overflow: "hidden", fontFamily: "inherit",
    }}>
      {/* Heading */}
      <div style={{ padding: "10px 12px 0" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 8 }}>Indices</h2>

        {/* Index navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <button onClick={() => scrollNav("left", navEl)}
            style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: "50%", border: "none",
              background: "#16A34A", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", marginRight: 6,
            }}>‹</button>

          <div ref={setNavEl} style={{
            flex: 1, overflowX: "auto", scrollbarWidth: "none",
            display: "flex", gap: 0, borderBottom: `2px solid ${t.border}`,
          }}>
            {indices.map(ix => (
              <button key={ix.code} onClick={() => setActiveCode(ix.code)}
                style={{
                  flexShrink: 0, padding: "8px 14px", background: "none", border: "none",
                  borderBottom: activeCode === ix.code ? "2px solid #16A34A" : "2px solid transparent",
                  marginBottom: -2,
                  fontWeight: activeCode === ix.code ? 700 : 500,
                  fontSize: 12, color: activeCode === ix.code ? t.text : t.textMuted,
                  cursor: "pointer", whiteSpace: "nowrap", transition: "all 120ms ease",
                }}>
                {ix.label}
              </button>
            ))}
          </div>

          <button onClick={() => scrollNav("right", navEl)}
            style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: "50%", border: "none",
              background: "#16A34A", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 6,
            }}>›</button>
        </div>
      </div>

      {/* Stats bar — only real data; unavailable fields show -- */}
      <div style={{
        display: "flex", alignItems: "center", flexWrap: "wrap",
        padding: "8px 14px", borderBottom: `1px solid ${t.border}`, gap: 0,
      }}>
        {/* Close + change */}
        <div style={{ marginRight: 16 }}>
          <span style={{
            fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.5px",
            color: t.text, fontVariantNumeric: "tabular-nums",
          }}>
            {fmt(idx.close)}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color, marginLeft: 8, fontVariantNumeric: "tabular-nums" }}>
            {isUp ? "▲" : "▼"} {fmt(Math.abs(idx.change))} ({idx.pct > 0 ? "+" : ""}{idx.pct.toFixed(2)}%)
          </span>
        </div>

        {/* Real stats only */}
        {[
          { label: "VOL",  val: (idx.vol / 1e6).toFixed(1) + "M", col: undefined },
          { label: "PREV", val: fmt(idx.prevClose),                col: undefined },
          // HIGH / LOW / 1Y / YTD not available from market-summary — show honestly
          { label: "HIGH", val: "--", col: undefined },
          { label: "LOW",  val: "--", col: undefined },
          { label: "1Y",   val: "--", col: undefined },
          { label: "YTD",  val: "--", col: undefined },
        ].map((item, i) => (
          <div key={i} style={{ padding: "3px 12px", borderLeft: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted }}>
              {item.label}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: item.col ?? t.text, fontVariantNumeric: "tabular-nums" }}>
              {item.val}
            </div>
          </div>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 9, color: t.textMuted }}>{asOf}</span>
      </div>

      {/* Chart — unavailable until real OHLC range API is wired */}
      <div style={{ padding: "10px 10px 12px" }}>
        <ChartUnavailable dark={t.dark} />
      </div>
    </div>
  );
}
