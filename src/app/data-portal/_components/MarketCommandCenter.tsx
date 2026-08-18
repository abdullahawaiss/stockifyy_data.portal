"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { INDICES, BREADTH, GAINERS, LOSERS, VOLUME, fmtNum, fmtVol, getMarketStatus } from "../_data";

// ── Live tick hook ─────────────────────────────────────────────
function useTick(base: number, intervalMs = 4000) {
  const [v, setV] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setV(+(base + (Math.random() - 0.5) * base * 0.0006).toFixed(2));
    }, intervalMs + Math.random() * 1500);
    return () => clearInterval(id);
  }, [base, intervalMs]);
  return v;
}

// ── PKT time ──────────────────────────────────────────────────
function usePKTTime() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ── Inline sparkline ──────────────────────────────────────────
function MiniSpark({ up, width = 54, height = 22 }: { up: boolean; width?: number; height?: number }) {
  const pts = up
    ? "0,18 9,14 18,15 27,10 36,11 45,7 54,3"
    : "0,3  9,7  18,5  27,10 36,8  45,13 54,17";
  const c = up ? "#16A34A" : "#DC2626";
  return (
    <svg viewBox={`0 0 54 20`} width={width} height={height} aria-hidden>
      <defs>
        <linearGradient id={`mcc-sg-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.25" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pts} 54,20 0,20`} fill={`url(#mcc-sg-${up})`} />
      <polyline points={pts} fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── KSE intraday mini chart ───────────────────────────────────
function KSEMiniChart({ up }: { up: boolean }) {
  const c = up ? "#16A34A" : "#DC2626";
  const fill = up ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)";
  // Simulated intraday path — S-curve reflecting realistic PSX pattern
  const path = up
    ? "M0,68 C20,65 40,70 60,58 C80,46 100,52 120,40 C140,30 160,34 180,22 C200,14 220,18 240,10"
    : "M0,12 C20,16 40,10 60,22 C80,34 100,28 120,42 C140,52 160,48 180,58 C200,66 220,62 240,68";
  const area = up
    ? `M0,68 C20,65 40,70 60,58 C80,46 100,52 120,40 C140,30 160,34 180,22 C200,14 220,18 240,10 L240,80 L0,80 Z`
    : `M0,12 C20,16 40,10 60,22 C80,34 100,28 120,42 C140,52 160,48 180,58 C200,66 220,62 240,68 L240,80 L0,80 Z`;

  return (
    <svg viewBox="0 0 240 80" className="w-full" style={{ height: 68 }} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="kse-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.22" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1="0" y1={f * 80} x2="240" y2={f * 80}
            stroke="rgba(128,128,128,0.08)" strokeWidth="0.5" strokeDasharray="3,4" />
        ))}
      </defs>
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1="0" y1={f * 80} x2="240" y2={f * 80}
          stroke="rgba(128,128,128,0.08)" strokeWidth="0.5" strokeDasharray="3,4" />
      ))}
      <path d={area} fill="url(#kse-fill)" />
      <path d={path} fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      <circle cx={up ? 240 : 240} cy={up ? 10 : 68} r="3" fill={c} />
      <circle cx={up ? 240 : 240} cy={up ? 10 : 68} r="5.5" fill={c} fillOpacity="0.2" />
    </svg>
  );
}

// ── Market status dot ─────────────────────────────────────────
function StatusDot({ open }: { open: boolean }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {open && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "#16A34A" }} />}
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: open ? "#16A34A" : "#94a3b8" }} />
    </span>
  );
}

// ── Breadth mini bar ──────────────────────────────────────────
function BreadthBar() {
  const tot = BREADTH.total;
  const advPct = (BREADTH.advances / tot) * 100;
  const decPct = (BREADTH.declines / tot) * 100;
  const unchPct = (BREADTH.unchanged / tot) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Market Breadth</span>
        <span className="text-[9.5px]" style={{ color: "var(--text-muted)" }}>{tot} listed</span>
      </div>
      <div className="flex gap-2.5 mb-2">
        {[
          { label: "Advances",  val: BREADTH.advances,  color: "#16A34A", bg: "rgba(22,163,74,0.1)" },
          { label: "Declines",  val: BREADTH.declines,  color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
          { label: "Unchanged", val: BREADTH.unchanged, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
        ].map(b => (
          <div key={b.label} className="flex-1 rounded-md px-2 py-1.5 text-center" style={{ background: b.bg }}>
            <div className="text-base font-black tabular-nums" style={{ color: b.color }}>{b.val}</div>
            <div className="text-[9px]" style={{ color: "var(--text-muted)" }}>{b.label}</div>
          </div>
        ))}
      </div>
      {/* Segmented bar */}
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

// ── Top Movers ────────────────────────────────────────────────
type MoverTab = "Gainers" | "Losers" | "Active";
function TopMovers() {
  const [tab, setTab] = useState<MoverTab>("Gainers");
  const rows =
    tab === "Gainers" ? GAINERS.slice(0, 5) :
    tab === "Losers"  ? LOSERS.slice(0, 5)  :
    VOLUME.slice(0, 5).map(v => ({ symbol: v.symbol, name: v.name, close: v.close, pct: v.pct }));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Top Movers</span>
        <div className="flex rounded overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {(["Gainers","Losers","Active"] as MoverTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="px-2 py-0.5 text-[9.5px] font-semibold transition-colors"
              style={{
                background: tab === t ? "var(--navy)" : "transparent",
                color: tab === t ? "#fff" : "var(--text-muted)",
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {rows.map(r => {
          const up = r.pct >= 0;
          return (
            <div key={r.symbol} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10.5px] font-mono font-bold shrink-0 px-1 rounded"
                  style={{ color: up ? "#16A34A" : "#DC2626", background: up ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)" }}>
                  {r.symbol}
                </span>
                <MiniSpark up={up} width={38} height={16} />
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10.5px] font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {fmtNum(r.close)}
                </div>
                <div className="text-[9px] font-bold" style={{ color: up ? "#16A34A" : "#DC2626" }}>
                  {up ? "▲" : "▼"}{Math.abs(r.pct).toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function MarketCommandCenter() {
  const now = usePKTTime();
  const [mktOpen, setMktOpen] = useState(getMarketStatus().open);
  const kse = INDICES[0]; // KSE-100
  const liveKse = useTick(kse.close);
  const kseUp = kse.pct >= 0;

  useEffect(() => {
    const id = setInterval(() => setMktOpen(getMarketStatus().open), 60_000);
    return () => clearInterval(id);
  }, []);

  const date = now?.toLocaleDateString("en-PK", {
    weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Karachi",
  });
  const time = now?.toLocaleTimeString("en-PK", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "Asia/Karachi",
  });

  // Stat chips row
  const stats = [
    { label: "Turnover",   value: "PKR 18.4B", icon: "💹" },
    { label: "Volume",     value: fmtVol(INDICES[2].vol), icon: "📊" },
    { label: "Market Cap", value: "PKR 12.8T", icon: "🏦" },
    { label: "Listed",     value: "428", icon: "🏢" },
    { label: "52W High",   value: "79,104", icon: "📈" },
  ];

  return (
    <div
      className="border-b"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--border)",
      }}
    >
      {/* ── Row 1: Status bar ─────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 sm:px-6"
        style={{
          height: 38,
          borderBottom: "1px solid var(--border)",
          background: "var(--light-bg)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <StatusDot open={mktOpen} />
          <span className="text-[11px] font-semibold" style={{ color: mktOpen ? "#16A34A" : "#94a3b8" }}>
            {mktOpen ? "Market Open" : "Market Closed"}
          </span>
        </div>
        <span style={{ color: "var(--border-dark)", fontSize: 10 }}>|</span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{date}</span>
        <span style={{ color: "var(--border-dark)", fontSize: 10 }}>|</span>
        <span className="text-[11px] font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>
          {time} PKT
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Last update:</span>
          <span className="text-[10px] font-mono" style={{ color: "var(--gold)" }}>{time}</span>
        </div>
      </div>

      {/* ── Row 2: KSE-100 + Stat chips ──────────── */}
      <div className="flex items-center gap-4 px-4 sm:px-6 py-3 flex-wrap">
        {/* KSE-100 primary */}
        <div className="flex items-center gap-3 shrink-0">
          <div>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>KSE-100</div>
            <div className="text-2xl font-black tabular-nums leading-none" style={{ color: "var(--navy)", letterSpacing: "-0.5px" }}>
              {fmtNum(mktOpen ? liveKse : kse.close, 2)}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-bold tabular-nums" style={{ color: kseUp ? "#16A34A" : "#DC2626" }}>
                {kseUp ? "▲" : "▼"} {fmtNum(Math.abs(kse.change), 2)}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  color: kseUp ? "#16A34A" : "#DC2626",
                  background: kseUp ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)",
                }}
              >
                {kseUp ? "+" : ""}{kse.pct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-10 shrink-0" style={{ background: "var(--border)" }} />

        {/* Stat chips */}
        <div className="flex flex-wrap gap-2">
          {stats.map(s => (
            <div
              key={s.label}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: "var(--light-bg)", border: "1px solid var(--border)" }}
            >
              <span className="text-sm" aria-hidden>{s.icon}</span>
              <div>
                <div className="text-[8.5px] leading-none" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                <div className="text-[11px] font-bold leading-tight" style={{ color: "var(--navy)" }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 3: Chart + Breadth + Top Movers ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t" style={{ borderColor: "var(--border)" }}>

        {/* KSE Chart */}
        <div
          className="px-4 sm:px-5 py-3 col-span-1 md:col-span-1 border-b md:border-b-0 md:border-r"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>KSE-100 Intraday</span>
              <div className="text-[11px] font-semibold tabular-nums" style={{ color: kseUp ? "#16A34A" : "#DC2626" }}>
                {kseUp ? "▲" : "▼"} {Math.abs(kse.pct).toFixed(2)}% today
              </div>
            </div>
            <Link href="/dashboard/indices" className="text-[10px] px-2 py-0.5 rounded" style={{ color: "var(--gold)", background: "rgba(212,175,55,0.07)" }}>
              Full →
            </Link>
          </div>
          <KSEMiniChart up={kseUp} />
          <div className="flex justify-between mt-1">
            <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>09:30</span>
            <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>15:30</span>
          </div>
        </div>

        {/* Breadth */}
        <div
          className="px-4 sm:px-5 py-3 border-b md:border-b-0 md:border-r"
          style={{ borderColor: "var(--border)" }}
        >
          <BreadthBar />
        </div>

        {/* Top Movers */}
        <div className="px-4 sm:px-5 py-3">
          <TopMovers />
        </div>

      </div>
    </div>
  );
}
