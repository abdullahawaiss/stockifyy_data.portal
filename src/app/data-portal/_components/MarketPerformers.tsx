"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { MarketSummary } from "@/app/api/portal/market-summary/route";

type Row = MarketSummary["volume"][number];

let _cache: MarketSummary | null = null;

function fmtVol(v: number) {
  if (!v) return "—";
  return v.toLocaleString("en-PK");
}

function fmtPrice(v: number) {
  return v ? v.toFixed(2) : "—";
}

function Col({ title, rows, loading, type }: {
  title: string;
  rows: Row[];
  loading: boolean;
  type: "active" | "advancers" | "decliners";
}) {
  const accent = type === "active" ? "#1e3a5f" : type === "advancers" ? "#16a34a" : "#dc2626";
  const headerBg = type === "active" ? "#1e3a5f" : type === "advancers" ? "#16a34a" : "#dc2626";

  // col layout: Symbol | Price | Change | Volume
  const COLS = "1.3fr 0.9fr 1.55fr 1.4fr";

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      {/* Section header */}
      <div style={{
        background: headerBg, color: "#fff",
        fontWeight: 700, fontSize: 11, letterSpacing: "0.07em",
        textTransform: "uppercase", padding: "6px 10px",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        {type === "advancers" ? "▲" : type === "decliners" ? "▼" : "●"}&nbsp;{title}
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: COLS,
        padding: "4px 8px", background: "var(--light-bg)",
        borderBottom: "1px solid var(--border)",
        fontSize: 9, fontWeight: 600, color: "var(--text-muted)",
        letterSpacing: "0.06em", textTransform: "uppercase",
      }}>
        <div>Symbol</div>
        <div style={{ paddingLeft: 4 }}>Price</div>
        <div style={{ textAlign: "right" }}>Change</div>
        <div style={{ textAlign: "right" }}>Volume</div>
      </div>

      {/* Rows */}
      <div style={{ flex: 1 }}>
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: COLS, padding: "5px 8px", borderBottom: "1px solid var(--border)", opacity: 0.45 }}>
                {[80, 50, 70, 85].map((w, j) => (
                  <div key={j} style={{ height: 9, background: "var(--border)", borderRadius: 3, width: `${w}%`, marginLeft: j > 0 ? "auto" : 0 }} />
                ))}
              </div>
            ))
          : rows.length === 0
          ? <div style={{ padding: "20px 10px", textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>No data</div>
          : rows.map((r, i) => {
              const up = r.pct >= 0;
              const chgColor = type === "active" ? (up ? "#16a34a" : "#dc2626") : up ? "#16a34a" : "#dc2626";
              const chgSign  = up ? "+" : "";
              const chgAmt   = ((r.close * Math.abs(r.pct)) / 100);
              return (
                <Link key={r.symbol} href={`/data-portal/company/${r.symbol}`}
                  style={{ textDecoration: "none", display: "block" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--light-bg)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}
                >
                  <div style={{
                    display: "grid", gridTemplateColumns: COLS,
                    padding: "3.5px 8px", borderBottom: "1px solid var(--border)",
                    alignItems: "center", cursor: "pointer",
                  }}>
                    <span style={{ fontWeight: 700, fontSize: 10.5, color: accent, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.symbol}
                    </span>
                    <span style={{ textAlign: "left", paddingLeft: 4, fontSize: 10.5, fontWeight: 600, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                      {fmtPrice(r.close)}
                    </span>
                    <span style={{ textAlign: "right", fontSize: 10, fontWeight: 600, color: chgColor, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {up ? "▲" : "▼"}{chgAmt.toFixed(2)} ({r.pct.toFixed(2)}%)
                    </span>
                    <span style={{ textAlign: "right", fontSize: 10, fontWeight: 400, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      {fmtVol(r.vol)}
                    </span>
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
}

export default function MarketPerformers({ initialData }: { initialData?: MarketSummary | null }) {
  const seed = initialData ?? _cache ?? null;
  const [summary, setSummary] = useState<MarketSummary | null>(seed);
  const [loading, setLoading]  = useState(!seed);

  useEffect(() => {
    if (seed) return;
    fetch("/api/portal/market-summary")
      .then(r => r.json())
      .then(d => { _cache = d; setSummary(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active    = (summary?.volume  ?? []).slice(0, 12);
  const advancers = (summary?.gainers ?? []).slice(0, 12);
  const decliners = (summary?.losers  ?? []).slice(0, 12);

  return (
    <div className="card overflow-hidden" style={{ display: "flex", flexDirection: "column" }}>
      {/* Title row */}
      <div style={{
        padding: "8px 12px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--card-bg)",
      }}>
        <h2 style={{ fontSize: 13, fontWeight: 800, color: "var(--navy)", margin: 0 }}>
          Market Performers
        </h2>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 9.5, fontWeight: 700, color: "#16a34a" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block", animation: "pulse 2s infinite" }} />
          LIVE
        </span>
      </div>

      {/* Three columns — Advancers | Decliners | Active */}
      <div style={{ display: "flex", overflow: "hidden" }}>
        <Col title="Top Advancers"     rows={advancers} loading={loading} type="advancers" />
        <div style={{ width: 1, background: "var(--border)", flexShrink: 0 }} />
        <Col title="Top Decliners"     rows={decliners} loading={loading} type="decliners" />
        <div style={{ width: 1, background: "var(--border)", flexShrink: 0 }} />
        <Col title="Top Active Stocks" rows={active}    loading={loading} type="active"    />
      </div>

      {/* Footer */}
      <div style={{
        padding: "5px 12px", borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "flex-end",
        background: "var(--light-bg)",
      }}>
        <Link href="/data-portal/stocks" style={{ fontSize: 10, color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>
          All Stocks →
        </Link>
      </div>
    </div>
  );
}
