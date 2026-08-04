"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

/* ── Demo Data ─────────────────────────────────── */
const INDICES = [
  { code: "KSE-100",   close: 78432.10, pct: 1.24,  vol: 412000000 },
  { code: "KSE-30",    close: 48628.55, pct: 0.87,  vol: 185000000 },
  { code: "KMI-30",    close: 45490.70, pct: 1.05,  vol: 97000000  },
  { code: "All Share", close: 74510.50, pct: 0.93,  vol: 590000000 },
];
const GAINERS = [
  { symbol: "OGDC",  name: "Oil & Gas Dev. Co.",   close: 142.30,  pct: 4.82  },
  { symbol: "PSO",   name: "Pakistan State Oil",    close: 318.75,  pct: 3.91  },
  { symbol: "LUCK",  name: "Lucky Cement",          close: 894.20,  pct: 3.15  },
  { symbol: "EFERT", name: "Engro Fertilizers",     close: 109.60,  pct: 2.74  },
  { symbol: "MARI",  name: "Mari Petroleum",        close: 2145.00, pct: 2.41  },
];
const LOSERS = [
  { symbol: "MLCF",  name: "Maple Leaf Cement",    close: 41.80,  pct: -3.22 },
  { symbol: "PIOC",  name: "Pioneer Cement",        close: 68.25,  pct: -2.87 },
  { symbol: "DCL",   name: "Dewan Cement",          close: 22.10,  pct: -2.43 },
  { symbol: "FCCL",  name: "Fauji Cement",          close: 33.45,  pct: -1.98 },
  { symbol: "CHCC",  name: "Cherat Cement",         close: 157.30, pct: -1.62 },
];
const VOLUME = [
  { symbol: "TRG",   name: "TRG Pakistan",        vol: 48200000, close: 92.40,  pct: 1.26  },
  { symbol: "WTL",   name: "World Telecom",        vol: 35700000, close: 14.85,  pct: 2.41  },
  { symbol: "UNITY", name: "Unity Foods",          vol: 29100000, close: 28.60,  pct: 2.41  },
  { symbol: "MLCF",  name: "Maple Leaf Cement",   vol: 22800000, close: 41.80,  pct: -3.22 },
  { symbol: "PACE",  name: "Pace Pakistan",        vol: 18500000, close: 7.35,   pct: -0.81 },
];
const SECTORS = [
  { name: "Oil & Gas",  pct: 2.14  }, { name: "Cement",     pct: -1.02 },
  { name: "Fertilizer", pct: 1.88  }, { name: "Banking",    pct: 0.74  },
  { name: "Power",      pct: 0.56  }, { name: "Technology", pct: 1.43  },
  { name: "Textile",    pct: 0.22  }, { name: "Auto",       pct: -0.38 },
];
const ANNOUNCEMENTS = [
  { symbol: "OGDC",  title: "Board Meeting — Dividend Announcement Q4 FY2025",    date: "2025-08-01", type: "Dividend"   },
  { symbol: "LUCK",  title: "Financial Results for the Year Ended June 30, 2025", date: "2025-07-31", type: "Results"    },
  { symbol: "PSO",   title: "Quarterly Report — April to June 2025",              date: "2025-07-30", type: "Results"    },
  { symbol: "ENGRO", title: "Change in Shareholding — Director Disclosure",       date: "2025-07-29", type: "Disclosure" },
  { symbol: "MCB",   title: "Annual General Meeting — Notice to Shareholders",    date: "2025-07-28", type: "AGM"        },
];
const RESEARCH = [
  { title: "KSE-100 Monthly Outlook — August 2025",                     author: "Stockifyy Research", date: "2025-08-01", tag: "Market"  },
  { title: "E&P Sector Review: Oil Price Impact on Pakistani Equities", author: "Stockifyy Research", date: "2025-07-28", tag: "Sector"  },
  { title: "Banking Sector: Q2 2025 Earnings Preview",                  author: "Stockifyy Research", date: "2025-07-25", tag: "Banking" },
];
const BREADTH = { advances: 248, declines: 142, unchanged: 38, total: 428 };
const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  Dividend:   { bg: "#D1FAE5", color: "#065F46" },
  Results:    { bg: "#DBEAFE", color: "#1E40AF" },
  Disclosure: { bg: "#FEF3C7", color: "#92400E" },
  AGM:        { bg: "#EDE9FE", color: "#5B21B6" },
};

/* ── Helpers ────────────────────────────────────── */
function fmtNum(n: number, d = 2) { return n.toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtVol(v: number) { return v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v.toLocaleString(); }

/* ── Market status ──────────────────────────────── */
// Checks status every 30s — open/close only changes at 9:30 and 15:30 PKT.
// No need to re-render the whole page every second for a clock (PortalNav has LiveClock).
function useMarketStatus() {
  const [s, setS] = useState({ open: false, label: "—" });
  useEffect(() => {
    function check() {
      const pkt = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
      const d = pkt.getDay(), mins = pkt.getHours() * 60 + pkt.getMinutes();
      const open = d >= 1 && d <= 5 && mins >= 570 && mins < 930;
      setS(prev => (prev.open === open ? prev : { open, label: open ? "Market Open" : "Market Closed" }));
    }
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, []);
  return s;
}

/* ── CountUp ────────────────────────────────────── */
function useCountUp(target: number, dur = 1500, delay = 0, active = true) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null, raf: number;
    const t = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        setV(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(step); else setV(target);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [target, dur, delay, active]);
  return v;
}

/* ── Scroll fade ────────────────────────────────── */
function useFade() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.06 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return { ref, vis };
}
function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, vis } = useFade();
  return (
    <div ref={ref} style={{ transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`, opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(24px)" }}>
      {children}
    </div>
  );
}

/* ── Index Card ─────────────────────────────────── */
function IdxCard({ idx, delay, active }: { idx: typeof INDICES[0]; delay: number; active: boolean }) {
  const v = useCountUp(idx.close, 1500, delay, active);
  const up = idx.pct >= 0;
  return (
    <div className="card p-4 sm:p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl cursor-default" style={{ borderTop: `3px solid ${up ? "#16A34A" : "#DC2626"}` }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: up ? "linear-gradient(135deg,rgba(22,163,74,0.04),transparent)" : "linear-gradient(135deg,rgba(220,38,38,0.04),transparent)" }}/>
      <div className="text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: "var(--text-muted)" }}>{idx.code}</div>
      <div className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: "var(--navy)", letterSpacing: "-0.5px" }}>{fmtNum(v, 2)}</div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-xs sm:text-sm font-bold" style={{ color: up ? "#16A34A" : "#DC2626" }}>{up ? "▲" : "▼"} {Math.abs(idx.pct).toFixed(2)}%</span>
        <span className="text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>today</span>
      </div>
      <div className="mt-1 text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>Vol: {fmtVol(idx.vol)}</div>
    </div>
  );
}

/* ── Main ───────────────────────────────────────── */
export default function OverviewClient() {
  const mkt = useMarketStatus();
  const [tab, setTab] = useState<"gainers" | "losers">("gainers");
  const cardsRef = useRef<HTMLDivElement>(null);
  const [cardsVis, setCardsVis] = useState(false);

  useEffect(() => {
    const el = cardsRef.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setCardsVis(true); obs.disconnect(); } }, { threshold: 0.05 });
    obs.observe(el); return () => obs.disconnect();
  }, []);

  return (
    <div>
      {/* ── HERO ─────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#07111F 0%,#0D2137 60%,#07111F 100%)" }}>
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="g" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0L0 0 0 40" fill="none" stroke="#D4AF37" strokeWidth="0.5"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>
        <div className="absolute right-0 top-0 w-80 h-80 pointer-events-none" style={{ background: "radial-gradient(circle at 80% 20%,rgba(212,175,55,0.08) 0%,transparent 60%)" }}/>

        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
            <div className="flex-1">
              {/* Status */}
              <div className="h1 flex flex-wrap items-center gap-2 mb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: mkt.open ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)", color: mkt.open ? "#4ADE80" : "#F87171" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: mkt.open ? "#4ADE80" : "#F87171", boxShadow: mkt.open ? "0 0 6px #4ADE80" : "none", display: "inline-block" }}/>
                  {mkt.label}
                </span>
                <span className="text-[10px] sm:text-xs hidden sm:inline" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" })}
                </span>
              </div>

              <h1 className="h2 text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Pakistan <span style={{ color: "#D4AF37" }}>Market</span> Overview
              </h1>
              <p className="h3 text-xs sm:text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                KSE Equities Intelligence · Powered by Stockifyy
              </p>

              {/* Mini stat chips — fills hero gap + adds info */}
              <div className="h4 flex flex-wrap gap-2 mt-4">
                {[
                  { label: "Total Turnover", value: "PKR 18.4B",  icon: "💹" },
                  { label: "Listed Cos",     value: "428",        icon: "🏢" },
                  { label: "Market Cap",     value: "PKR 12.8T",  icon: "📊" },
                  { label: "52W High",       value: "79,104",     icon: "📈" },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-sm">{s.icon}</span>
                    <div>
                      <div className="text-[9px] leading-none" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                      <div className="text-xs font-bold text-white leading-tight mt-0.5">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* KSE-100 hero number */}
            <div className="h4 shrink-0 rounded-2xl p-4 sm:p-5 text-center sm:text-right" style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.2)" }}>
              <div className="text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "rgba(212,175,55,0.7)" }}>KSE-100 Index</div>
              <div className="text-3xl sm:text-4xl font-black tabular-nums text-white">78,432</div>
              <div className="text-sm sm:text-base font-semibold mt-1" style={{ color: "#4ADE80" }}>▲ 968.54 &nbsp;+1.24%</div>
              <div className="text-[10px] sm:text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>412M shares traded</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DAILY + WEEKLY FEATURED ──────────────── */}
      <div style={{ background: "var(--navy)" }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

            {/* Daily */}
            <Link href="/data-portal/daily"
              className="group relative overflow-hidden rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
              style={{ background: "linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 60%,#2563EB 100%)", border: "1px solid rgba(96,165,250,0.3)" }}>
              {/* glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: "radial-gradient(circle at 20% 50%,rgba(147,197,253,0.15),transparent 60%)" }}/>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 relative z-10"
                style={{ background: "rgba(255,255,255,0.15)", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
                📅
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className="text-base sm:text-lg font-black text-white leading-tight">Daily Market Data</div>
                <div className="text-[10px] sm:text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Open · High · Low · Close · Volume
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["All Stocks","OHLCV","Live Prices"].map(t => (
                    <span key={t} className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 relative z-10 w-8 h-8 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <span className="text-white font-bold">→</span>
              </div>
            </Link>

            {/* Weekly */}
            <Link href="/data-portal/weekly"
              className="group relative overflow-hidden rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
              style={{ background: "linear-gradient(135deg,#4C1D95 0%,#6D28D9 60%,#7C3AED 100%)", border: "1px solid rgba(167,139,250,0.3)" }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: "radial-gradient(circle at 20% 50%,rgba(196,181,253,0.15),transparent 60%)" }}/>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 relative z-10"
                style={{ background: "rgba(255,255,255,0.15)", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
                📆
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <div className="text-base sm:text-lg font-black text-white leading-tight">Weekly Market Data</div>
                <div className="text-[10px] sm:text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                  Weekly OHLCV · Volatility · % vs prior week
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["Aggregated","Volatility","Week-on-Week"].map(t => (
                    <span key={t} className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 relative z-10 w-8 h-8 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <span className="text-white font-bold">→</span>
              </div>
            </Link>

          </div>
        </div>
      </div>

      {/* ── BREADTH ──────────────────────────────── */}
      <div style={{ background: "#0D1E30", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-3 sm:gap-6">
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>Breadth</span>
          {[
            { label: "Advances",  val: BREADTH.advances,  color: "#4ADE80" },
            { label: "Declines",  val: BREADTH.declines,  color: "#F87171" },
            { label: "Unchanged", val: BREADTH.unchanged, color: "rgba(255,255,255,0.4)" },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.color }}/>
              <span className="text-xs sm:text-sm font-bold" style={{ color: b.color }}>{b.val}</span>
              <span className="text-[10px] sm:text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{b.label}</span>
            </div>
          ))}
          <div className="flex-1 h-1.5 rounded-full overflow-hidden min-w-16 hidden sm:block" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div className="h-full flex">
              <div className="h-full" style={{ width: `${(BREADTH.advances / BREADTH.total) * 100}%`, background: "#4ADE80" }}/>
              <div className="h-full" style={{ width: `${(BREADTH.unchanged / BREADTH.total) * 100}%`, background: "rgba(255,255,255,0.2)" }}/>
              <div className="h-full" style={{ width: `${(BREADTH.declines / BREADTH.total) * 100}%`, background: "#F87171" }}/>
            </div>
          </div>
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{BREADTH.total} listed</span>
        </div>
      </div>

      {/* ── MAIN ─────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6">

        {/* Index Cards */}
        <div ref={cardsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {INDICES.map((idx, i) => <IdxCard key={idx.code} idx={idx} delay={i * 110} active={cardsVis} />)}
        </div>

        {/* Movers + Volume */}
        <Fade>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Gainers / Losers tabs */}
            <div className="lg:col-span-2 card overflow-hidden">
              <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
                {(["gainers","losers"] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className="flex-1 py-3 text-xs sm:text-sm font-semibold transition-all"
                    style={{ color: tab === t ? (t === "gainers" ? "#16A34A" : "#DC2626") : "var(--text-muted)", borderBottom: tab === t ? `2px solid ${t === "gainers" ? "#16A34A" : "#DC2626"}` : "2px solid transparent", background: "none" }}>
                    {t === "gainers" ? "🟢 Top Gainers" : "🔴 Top Losers"}
                  </button>
                ))}
                <Link href="/data-portal/daily" className="px-3 sm:px-4 py-3 text-xs self-center whitespace-nowrap" style={{ color: "var(--gold)" }}>All →</Link>
              </div>
              {(tab === "gainers" ? GAINERS : LOSERS).map((s, i) => {
                const up = s.pct >= 0;
                return (
                  <div key={s.symbol} className="flex items-center justify-between px-4 sm:px-5 py-3 border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className="w-5 text-center text-xs font-bold shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                      <div className="min-w-0">
                        <Link href={`/data-portal/company/${s.symbol}`} className="font-black text-sm hover:underline block" style={{ color: "var(--navy)" }}>{s.symbol}</Link>
                        <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{s.name}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="font-bold text-sm tabular-nums" style={{ color: "var(--navy)" }}>{fmtNum(s.close)}</div>
                      <div className="text-xs font-bold" style={{ color: up ? "#16A34A" : "#DC2626" }}>{up ? "▲" : "▼"} {Math.abs(s.pct).toFixed(2)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Volume Leaders */}
            <div className="card overflow-hidden">
              <div className="px-4 sm:px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-sm font-bold" style={{ color: "var(--navy)" }}>📊 Volume Leaders</h2>
                <Link href="/data-portal/daily?sortBy=volume" className="text-xs" style={{ color: "var(--gold)" }}>All →</Link>
              </div>
              {VOLUME.map((s, i) => {
                const up = s.pct >= 0;
                return (
                  <div key={s.symbol} className="px-4 sm:px-5 py-3 border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold shrink-0" style={{ color: "var(--text-muted)" }}>{i+1}</span>
                        <Link href={`/data-portal/company/${s.symbol}`} className="font-black text-sm hover:underline truncate" style={{ color: "var(--navy)" }}>{s.symbol}</Link>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs font-bold tabular-nums" style={{ color: "var(--navy)" }}>{fmtVol(s.vol)}</div>
                        <div className="text-[10px] font-semibold" style={{ color: up ? "#16A34A" : "#DC2626" }}>{up ? "▲" : "▼"} {Math.abs(s.pct).toFixed(2)}%</div>
                      </div>
                    </div>
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(s.vol / VOLUME[0].vol) * 100}%`, background: up ? "#16A34A" : "#DC2626", transition: "width 1s ease" }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Fade>

        {/* Sector Heatmap */}
        <Fade delay={60}>
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-sm font-bold" style={{ color: "var(--navy)" }}>Sector Performance</h2>
              <Link href="/data-portal/sectors" className="text-xs" style={{ color: "var(--gold)" }}>Full View →</Link>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {SECTORS.map(sec => {
                const up = sec.pct >= 0;
                const intensity = Math.min(Math.abs(sec.pct) / 3, 1);
                return (
                  <div key={sec.name} className="rounded-lg p-2 sm:p-3 text-center cursor-default transition-transform hover:scale-105"
                    style={{ background: up ? `rgba(22,163,74,${0.08 + intensity * 0.18})` : `rgba(220,38,38,${0.08 + intensity * 0.18})`, border: `1px solid ${up ? `rgba(22,163,74,0.25)` : `rgba(220,38,38,0.25)`}` }}>
                    <div className="text-[9px] sm:text-xs font-bold leading-tight" style={{ color: up ? "#065F46" : "#991B1B" }}>{sec.name}</div>
                    <div className="text-xs sm:text-sm font-black mt-1" style={{ color: up ? "#16A34A" : "#DC2626" }}>{up ? "▲" : "▼"}{Math.abs(sec.pct).toFixed(2)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </Fade>

        {/* Announcements + Research */}
        <Fade delay={80}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="card overflow-hidden">
              <div className="px-4 sm:px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-sm font-bold" style={{ color: "var(--navy)" }}>📢 Announcements</h2>
                <Link href="/data-portal/announcements" className="text-xs" style={{ color: "var(--gold)" }}>All →</Link>
              </div>
              {ANNOUNCEMENTS.map((a, i) => {
                const tc = TYPE_COLORS[a.type] ?? { bg: "#F1F5F9", color: "#475569" };
                return (
                  <div key={i} className="px-4 sm:px-5 py-3 flex items-start gap-2 sm:gap-3 border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "var(--border)" }}>
                    <span className="mt-0.5 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded font-bold shrink-0" style={{ background: "rgba(7,17,31,0.07)", color: "var(--navy)" }}>{a.symbol}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug line-clamp-2" style={{ color: "var(--text-primary)" }}>{a.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: tc.bg, color: tc.color }}>{a.type}</span>
                        <span className="text-[9px] sm:text-[10px]" style={{ color: "var(--text-muted)" }}>{a.date}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card overflow-hidden">
              <div className="px-4 sm:px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-sm font-bold" style={{ color: "var(--navy)" }}>📄 Research Reports</h2>
                <Link href="/data-portal/research" className="text-xs" style={{ color: "var(--gold)" }}>All →</Link>
              </div>
              {RESEARCH.map((r, i) => (
                <div key={i} className="px-4 sm:px-5 py-4 border-b hover:bg-gray-50 transition-colors" style={{ borderColor: "var(--border)" }}>
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded mb-1.5 inline-block" style={{ background: "#DBEAFE", color: "#1E40AF" }}>{r.tag}</span>
                  <p className="text-xs sm:text-sm font-semibold leading-snug" style={{ color: "var(--navy)" }}>{r.title}</p>
                  <p className="text-[10px] sm:text-xs mt-1" style={{ color: "var(--text-muted)" }}>{r.date} · {r.author}</p>
                </div>
              ))}
              <div className="px-4 sm:px-5 py-3 sm:py-4" style={{ background: "var(--light-bg)" }}>
                <Link href="/data-portal/research" className="text-xs sm:text-sm font-semibold flex items-center gap-1" style={{ color: "var(--navy)" }}>
                  Browse All Reports <span style={{ color: "var(--gold)" }}>→</span>
                </Link>
              </div>
            </div>
          </div>
        </Fade>

        {/* Quick Nav */}
        <Fade delay={100}>
          <div className="card p-4 sm:p-5">
            <h2 className="text-sm font-bold mb-3 sm:mb-4" style={{ color: "var(--navy)" }}>Explore Portal</h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
              {[
                { label: "Indices",    icon: "📈", href: "/data-portal/indices",        desc: "KSE benchmarks"    },
                { label: "Companies",  icon: "🏢", href: "/data-portal/companies",      desc: "Company profiles"  },
                { label: "Screener",   icon: "🔎", href: "/data-portal/screener",       desc: "Filter stocks"     },
                { label: "Shariah",    icon: "☪",  href: "/data-portal/shariah",        desc: "Halal equities"    },
                { label: "Historical", icon: "🗂",  href: "/data-portal/historical-data",desc: "Past data"         },
                { label: "Downloads",  icon: "⬇",  href: "/data-portal/downloads",      desc: "Export CSV/Excel"  },
              ].map((c, i) => (
                <Link key={c.href} href={c.href}
                  className="rounded-xl p-3 sm:p-4 text-center group transition-all hover:-translate-y-1 hover:shadow-md"
                  style={{ background: "var(--light-bg)", border: "1px solid var(--border)", animationDelay: `${i * 60}ms` }}>
                  <div className="text-xl sm:text-2xl mb-1 sm:mb-2">{c.icon}</div>
                  <div className="text-[10px] sm:text-xs font-bold" style={{ color: "var(--navy)" }}>{c.label}</div>
                  <div className="text-[9px] sm:text-[10px] mt-0.5 hidden sm:block" style={{ color: "var(--text-muted)" }}>{c.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </Fade>
      </div>
    </div>
  );
}
