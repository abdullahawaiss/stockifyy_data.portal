"use client";
import { fetchMarketSummary } from "@/lib/market-cache";
import { useState, useEffect } from "react";
import Link from "next/link";
import { fmtNum, fmtVol, getMarketStatus } from "../_data";
import type { MarketSummary } from "@/app/api/portal/market-summary/route";

function usePKTTime() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function StatusDot({ open }: { open: boolean }) {
  return (
    <span className="relative flex shrink-0" style={{ width: 10, height: 10 }}>
      <span className="animate-ping absolute inline-flex rounded-full opacity-70"
        style={{ width: 10, height: 10, background: open ? "#16A34A" : "#dc2626" }} />
      <span className="relative inline-flex rounded-full"
        style={{ width: 10, height: 10, background: open ? "#16A34A" : "#dc2626" }} />
    </span>
  );
}

function MiniSpark({ up }: { up: boolean }) {
  const pts = up ? "0,18 9,14 18,15 27,10 36,11 45,7 54,3" : "0,3 9,7 18,5 27,10 36,8 45,13 54,17";
  const c = up ? "#16A34A" : "#DC2626";
  return (
    <svg viewBox="0 0 54 20" width={38} height={16} aria-hidden>
      <polyline points={pts} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BreadthBar({ breadth }: { breadth: MarketSummary["breadth"] | null }) {
  if (!breadth) return null;
  const { advances, declines, unchanged, total } = breadth;
  const advPct = total ? (advances / total) * 100 : 0;
  const decPct = total ? (declines / total) * 100 : 0;
  const unchPct = total ? (unchanged / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Market Breadth</span>
        <span className="text-[9.5px]" style={{ color: "var(--text-muted)" }}>{total} stocks</span>
      </div>
      <div className="flex gap-2.5 mb-2">
        {[
          { label: "Advances",  val: advances,  color: "#16A34A", bg: "rgba(22,163,74,0.1)" },
          { label: "Declines",  val: declines,  color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
          { label: "Unchanged", val: unchanged, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
        ].map(b => (
          <div key={b.label} className="flex-1 rounded-md px-2 py-1.5 text-center" style={{ background: b.bg }}>
            <div className="text-base font-black tabular-nums" style={{ color: b.color }}>{b.val}</div>
            <div className="text-[9px]" style={{ color: "var(--text-muted)" }}>{b.label}</div>
          </div>
        ))}
      </div>
      <div className="h-1.5 rounded-full overflow-hidden flex" style={{ background: "var(--border)" }}>
        <div style={{ width: `${advPct}%`, background: "#16A34A", borderRadius: "999px 0 0 999px" }} />
        <div style={{ width: `${unchPct}%`, background: "rgba(148,163,184,0.4)" }} />
        <div style={{ width: `${decPct}%`, background: "#DC2626", borderRadius: "0 999px 999px 0" }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-semibold" style={{ color: "#16A34A" }}>{advPct.toFixed(0)}%</span>
        <span className="text-[9px] font-semibold" style={{ color: "#DC2626" }}>{decPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

type MoverTab = "Gainers" | "Losers" | "Active";

function TopMovers({ summary }: { summary: MarketSummary | null }) {
  const [tab, setTab] = useState<MoverTab>("Gainers");

  const rows =
    tab === "Gainers" ? (summary?.gainers ?? []).slice(0, 5) :
    tab === "Losers"  ? (summary?.losers  ?? []).slice(0, 5) :
                        (summary?.volume  ?? []).slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Top Movers</span>
        <div className="flex rounded overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {(["Gainers", "Losers", "Active"] as MoverTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-2 py-0.5 text-[9.5px] font-semibold transition-colors"
              style={{ background: tab === t ? "var(--navy)" : "transparent", color: tab === t ? "#fff" : "var(--text-muted)" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {!summary ? (
        <div className="flex flex-col gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between animate-pulse">
              <div className="h-4 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-12 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {rows.map(r => {
            const up = r.pct >= 0;
            return (
              <Link key={r.symbol} href={`/data-portal/company/${r.symbol}`}
                className="flex items-center justify-between hover:opacity-80 transition-opacity"
                style={{ textDecoration: "none" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10.5px] font-mono font-bold shrink-0 px-1 rounded"
                    style={{ color: up ? "#16A34A" : "#DC2626", background: up ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)" }}>
                    {r.symbol}
                  </span>
                  <MiniSpark up={up} />
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10.5px] font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {fmtNum(r.close)}
                  </div>
                  <div className="text-[9px] font-bold" style={{ color: up ? "#16A34A" : "#DC2626" }}>
                    {up ? "â–²" : "â–¼"}{Math.abs(r.pct).toFixed(2)}%
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MarketCommandCenter() {
  const now = usePKTTime();
  const [mktOpen, setMktOpen] = useState(() => getMarketStatus().open);
  const [summary, setSummary] = useState<MarketSummary | null>(null);

  useEffect(() => {
    const id = setInterval(() => setMktOpen(getMarketStatus().open), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function load() {
      fetchMarketSummary()
        .then(setSummary)
        .catch(() => {});
    }
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const kse = summary?.indices?.find(i => i.code === "KSE-100" || i.code === "KSE100");
  const kseUp = (kse?.pct ?? 0) >= 0;

  const date = now?.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi" });
  const time = now?.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Karachi" });

  return (
    <div className="border-b" style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}>

      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 sm:px-6" style={{ height: 38, borderBottom: "1px solid var(--border)", background: "var(--light-bg)" }}>
        <div className="flex items-center gap-1.5">
          <StatusDot open={mktOpen} />
          <span className="text-[11px] font-semibold" style={{ color: mktOpen ? "#16A34A" : "#dc2626" }}>
            {mktOpen ? "Market Open" : "Market Closed"}
          </span>
        </div>
        <span style={{ color: "var(--border-dark)", fontSize: 10 }}>|</span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{date}</span>
        <span style={{ color: "var(--border-dark)", fontSize: 10 }}>|</span>
        <span className="text-[11px] font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>{time} PKT</span>
        {summary && (
          <span className="ml-auto text-[9.5px]" style={{ color: "var(--text-muted)" }}>
            Live Â· {new Date(summary.updatedAt).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" })}
          </span>
        )}
      </div>

      {/* KSE-100 hero + stats */}
      <div className="flex items-center gap-4 px-4 sm:px-6 py-3 flex-wrap">
        <div className="flex items-center gap-3 shrink-0">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>KSE-100</div>
            {kse ? (
              <>
                <div className="text-2xl font-black tabular-nums leading-none" style={{ color: "var(--navy)", letterSpacing: "-0.5px" }}>
                  {fmtNum(kse.close, 2)}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: kseUp ? "#16A34A" : "#DC2626" }}>
                    {kseUp ? "â–²" : "â–¼"} {fmtNum(Math.abs(kse.change), 2)}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ color: kseUp ? "#16A34A" : "#DC2626", background: kseUp ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)" }}>
                    {kseUp ? "+" : ""}{kse.pct.toFixed(2)}%
                  </span>
                </div>
              </>
            ) : (
              <div className="text-2xl font-black" style={{ color: "var(--text-muted)" }}>â€”</div>
            )}
          </div>
        </div>

        <div className="hidden sm:block w-px h-10 shrink-0" style={{ background: "var(--border)" }} />

        {/* Breadth quick stats */}
        {summary?.breadth && (
          <div className="flex gap-3">
            {[
              { label: "Advances", val: summary.breadth.advances, color: "#16A34A" },
              { label: "Declines", val: summary.breadth.declines, color: "#DC2626" },
              { label: "Total",    val: summary.breadth.total,    color: "var(--text-muted)" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-base font-black tabular-nums" style={{ color: s.color }}>{s.val}</div>
                <div className="text-[8.5px]" style={{ color: "var(--text-muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Breadth + Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="px-4 sm:px-5 py-3 border-b md:border-b-0 md:border-r" style={{ borderColor: "var(--border)" }}>
          <BreadthBar breadth={summary?.breadth ?? null} />
        </div>
        <div className="px-4 sm:px-5 py-3">
          <TopMovers summary={summary} />
        </div>
      </div>
    </div>
  );
}

