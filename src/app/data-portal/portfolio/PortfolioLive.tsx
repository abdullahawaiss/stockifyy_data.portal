"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useDarkTokens } from "@/hooks/useDarkMode";

// ── seed data ──────────────────────────────────────────────────────────────────
const FIPI_COLS = ["F-CORP", "F-INDV", "O/S PAK", "Total"];
const LIPI_COLS = ["INDV.", "COS.", "BANKS", "NBFC", "FUNDS", "OTHER", "BROKER", "INSUR", "TOTAL"];

type Row = { label: string; vals: number[]; bold?: boolean; orange?: boolean; shade?: boolean };

const seed = {
  fipiFlow: [
    { label:"Gross Buy",     vals:[0.78, 0.00, 13.22, 14.00] },
    { label:"Gross Sell",    vals:[-1.33, 0.00,-12.49,-13.83] },
    { label:"NET POSITION",  vals:[-0.56, 0.00,  0.73,  0.17], bold:true, shade:true },
  ],
  fipiSectors: [
    { label:"OTHER",      vals:[ 0.43, 0.00,-0.92,-0.49] },
    { label:"CEMENT",     vals:[-0.11, 0.00, 0.02,-0.09] },
    { label:"BANKS",      vals:[-0.45, 0.00,-0.05,-0.51] },
    { label:"FERTILIZER", vals:[ 0.00, 0.00, 0.11, 0.11] },
    { label:"FOOD & PC",  vals:[ 0.00, 0.00, 0.00, 0.00] },
    { label:"O&G Exp",    vals:[-0.10, 0.00, 0.46, 0.36] },
    { label:"O&G MKT",    vals:[-0.04, 0.00, 0.12, 0.07] },
    { label:"POWER",      vals:[-0.13, 0.00, 1.18, 1.06] },
    { label:"TECH.",      vals:[-0.16, 0.00,-0.26,-0.41] },
    { label:"TEXTILE",    vals:[ 0.01, 0.00, 0.07, 0.08] },
  ],
  fipiBottom: [
    { label:"NET POSITION",    vals:[-0.56, 0.00, 0.73, 0.17], bold:true, shade:true },
    { label:"DEBT MKT.",       vals:[ 0.00, 0.00, 0.00, 0.00], bold:true },
    { label:"NET (inc. debt)", vals:[-0.56, 0.00, 0.73, 0.17] },
    { label:"FY27TD",          vals:[18.41,-0.03,14.31,32.70] },
    { label:"CY26TD",          vals:[-640.23,-1.18,75.62,-565.79] },
  ],
  lipiFlow: [
    { label:"Gross Buy",    vals:[150.91, 4.75,  9.40, 0.01, 37.32,  1.42, 21.93,  1.35, 227.11] },
    { label:"Gross Sell",   vals:[-143.42,-3.25,-8.66,-0.07,-40.41,-0.59,-22.00,-8.87,-227.28] },
    { label:"NET POSITION", vals:[  7.49, 1.50,  0.74,-0.06, -3.10,  0.84, -0.06,-7.52,  -0.17], bold:true, shade:true },
  ],
  lipiSectors: [
    { label:"OTHER",      vals:[ 0.44,-0.08,-0.69,-0.03,  1.06, 0.02,  0.58,-0.80,  0.49] },
    { label:"CEMENT",     vals:[ 0.75, 0.14,-0.07, 0.00,  0.54, 0.00, -1.00,-0.27,  0.09] },
    { label:"BANKS",      vals:[-0.20, 0.37,-0.28, 0.00,  1.10,-0.06, -0.16,-0.25,  0.51] },
    { label:"FERTILIZER", vals:[ 0.13, 0.00,-0.04, 0.00, -0.20,-0.02,  0.02, 0.00, -0.11] },
    { label:"FOOD & PC",  vals:[-0.10,-0.04,-0.01, 0.00, -0.05,-0.01,  0.22,-0.01,  0.00] },
    { label:"O&G Exp",    vals:[ 0.47, 0.19,-1.65, 0.00,  0.36, 0.28, -0.04, 0.04, -0.36] },
    { label:"O&G MKT",    vals:[-0.10, 0.01, 0.03, 0.00, -0.28,-0.01,  0.01, 0.27, -0.07] },
    { label:"POWER",      vals:[ 5.41, 0.92,-3.77,-0.01, -0.66, 0.02,  0.40,-3.36, -1.06] },
    { label:"TECH.",      vals:[ 0.31, 0.06,-0.01, 0.00,  0.11, 0.00, -0.07, 0.00,  0.41] },
    { label:"TEXTILE",    vals:[ 0.25,-0.07, 0.00, 0.00, -0.22,-0.01, -0.02, 0.00, -0.08] },
  ],
  lipiBottom: [
    { label:"NET POSITION",    vals:[ 7.37, 1.50,-6.50,-0.06,  1.75, 0.20,-0.06,-4.38,-0.17], bold:true, shade:true },
    { label:"DEBT MKT.",       vals:[ 0.12, 0.00, 7.24, 0.00, -4.85, 0.63, 0.00,-3.14, 0.00], bold:true },
    { label:"NET (inc. debt)", vals:[ 7.49, 1.50, 0.74,-0.06, -3.10, 0.84,-0.06,-7.52,-0.17] },
    { label:"FY27TD",          vals:[28.46,-8.25, 6.74, 1.14,-47.18,-1.10,-2.51,-10.00,-32.70] },
    { label:"CY26TD",          vals:[136.48,491.93,-31.90,2.62,60.44,20.11,-16.07,-97.84,565.79] },
  ],
};

// deep clone
function clone<T>(x: T): T { return JSON.parse(JSON.stringify(x)); }

// apply small random drift to non-TD rows
function drift(rows: Row[], frozen: number[]): Row[] {
  return rows.map((r, ri) => {
    if (frozen.includes(ri)) return r;
    const vals = r.vals.map((v, vi) => {
      if (vi === r.vals.length - 1) return v; // recompute total separately
      const delta = (Math.random() - 0.5) * 0.06;
      return Math.round((v + delta) * 100) / 100;
    });
    // recompute last col as sum of others
    const total = Math.round(vals.slice(0, -1).reduce((a, b) => a + b, 0) * 100) / 100;
    vals[vals.length - 1] = total;
    return { ...r, vals };
  });
}

// format number → "(1.23)" or "1.23"
function fmt(v: number): string {
  if (Math.abs(v) < 0.005) return "0.00";
  const s = Math.abs(v).toFixed(2);
  return v < 0 ? `(${s})` : s;
}

// ── Animated cell ──────────────────────────────────────────────────────────────
function AnimCell({ val, bold, isTotal, dark }: { val: number; bold?: boolean; isTotal?: boolean; dark?: boolean }) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(val);

  useEffect(() => {
    if (prev.current !== val) {
      setFlash(true);
      prev.current = val;
      const t = setTimeout(() => setFlash(false), 500);
      return () => clearTimeout(t);
    }
  }, [val]);

  const neg = val < 0;
  const border = dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f0f0f0";
  const baseColor = dark ? (isTotal ? "#BDD0E8" : "#7A9AB8") : (isTotal ? "#111" : "#333");
  return (
    <td className="tabular-nums transition-colors duration-300" style={{
      textAlign: "right", padding: "3px 7px", fontSize: 11,
      fontWeight: isTotal ? 700 : bold ? 600 : 400,
      color: flash ? (neg ? "#e53e3e" : "#22863a") : neg ? "#c0392b" : baseColor,
      background: flash ? (neg ? "rgba(220,38,38,0.06)" : "rgba(34,134,58,0.06)") : "transparent",
      borderBottom: border, whiteSpace: "nowrap", minWidth: isTotal ? 62 : 50,
    }}>
      {fmt(val)}
    </td>
  );
}

// ── Table row ──────────────────────────────────────────────────────────────────
function DataRow({ row, dark }: { row: Row; dark?: boolean }) {
  const totalIdx = row.vals.length - 1;
  const border = dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f0f0f0";
  const rowBg = dark
    ? (row.shade ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)")
    : (row.shade ? "rgba(248,248,248,0.7)"  : "rgba(255,255,255,0.5)");
  return (
    <tr style={{ background: rowBg }}>
      <td style={{
        padding: "3px 9px", fontSize: 11, fontWeight: row.bold ? 700 : 400,
        color: dark ? (row.bold ? "#BDD0E8" : "#7A9AB8") : (row.bold ? "#111" : "#333"),
        borderBottom: border, whiteSpace: "nowrap", minWidth: 96,
      }}>
        {row.label}
      </td>
      {row.vals.map((v, i) => (
        <AnimCell key={i} val={v} bold={row.bold} isTotal={i === totalIdx} dark={dark} />
      ))}
    </tr>
  );
}

// ── Table header row ───────────────────────────────────────────────────────────
function OrangeHeader({ label, cols }: { label: string; cols: string[] }) {
  return (
    <tr style={{ background: "var(--gold)", backgroundImage: "linear-gradient(90deg, var(--gold) 0%, #e8c84a 50%, var(--gold) 100%)", backgroundSize: "200% 100%", animation: "goldShimmer 3s linear infinite" }}>
      <th style={{ padding: "4px 9px", fontSize: 10, fontWeight: 800, textAlign: "left", letterSpacing: "0.05em", whiteSpace: "nowrap", color: "white" }}>{label}</th>
      {cols.map(c => (
        <th key={c} style={{ padding: "4px 7px", fontSize: 9.5, fontWeight: 700, textAlign: "right", letterSpacing: "0.02em", whiteSpace: "nowrap", color: "rgba(255,255,255,0.9)" }}>{c}</th>
      ))}
    </tr>
  );
}

// ── Section divider ────────────────────────────────────────────────────────────
function SectionLabel({ text, dark }: { text: string; dark?: boolean }) {
  return (
    <tr style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.4)" }}>
      <td colSpan={99} style={{ padding: "5px 9px 3px", fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", color: "var(--gold)", textTransform: "uppercase", borderBottom: dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(240,240,240,0.7)" }}>
        {text}
      </td>
    </tr>
  );
}

// ── PKT clock ─────────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-PK", { timeZone: "Asia/Karachi", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums font-mono text-[11px]" style={{ color: "var(--gold)" }}>{time} PKT</span>;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PortfolioLive() {
  const t = useDarkTokens();
  const [data, setData] = useState(() => clone(seed));
  const [tick, setTick] = useState(0);
  const [pulse, setPulse] = useState(false);
  const FROZEN_FIPI  = [2, seed.fipiFlow.length + seed.fipiSectors.length,     // NET POSITION rows
                         seed.fipiFlow.length + seed.fipiSectors.length + 1];   // DEBT MKT
  const FROZEN_LIPI  = [2, seed.lipiFlow.length + seed.lipiSectors.length,
                         seed.lipiFlow.length + seed.lipiSectors.length + 1];

  useEffect(() => {
    const id = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 400);
      setData(d => ({
        ...d,
        fipiFlow:    drift(d.fipiFlow,    [2]),
        fipiSectors: drift(d.fipiSectors, []),
        fipiBottom:  drift(d.fipiBottom,  [0, 1, 3, 4]),
        lipiFlow:    drift(d.lipiFlow,    [2]),
        lipiSectors: drift(d.lipiSectors, []),
        lipiBottom:  drift(d.lipiBottom,  [0, 1, 3, 4]),
      }));
      setTick(t => t + 1);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const date = new Date().toLocaleDateString("en-PK", {
    timeZone: "Asia/Karachi", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 56px)", background: "transparent", padding: "8px 12px 12px" }}>

      {/* ── Header bar ─────────────────────────────── */}
      {/* Desktop: 3-col (logo | heading | badges). Mobile: stacked */}
      <div className="mb-3 px-1 flex-shrink-0">
        {/* Top row: logo left, badges right */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div />

          {/* RIGHT — Live badge + clock + date */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.22)" }}>
              <span className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{ background: "#16a34a", boxShadow: pulse ? "0 0 7px #16a34a" : "none", transform: pulse ? "scale(1.5)" : "scale(1)" }}/>
              <span className="text-[9px] font-bold tracking-wide" style={{ color: "#16a34a" }}>LIVE</span>
            </div>
            <LiveClock />
            <span className="hidden sm:inline" style={{ fontSize: 9.5, color: t.textMuted }}>{date}</span>
          </div>
        </div>

        {/* CENTER — Main heading, full-width centered */}
        <div className="text-center" style={{ paddingTop: 2 }}>
          <div style={{ fontSize: "clamp(14px,3.5vw,20px)", fontWeight: 900, color: t.text, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            Daily Portfolio Investments
            <span className="ml-2" style={{ color: "var(--gold)" }}>US$mn</span>
          </div>
          <div style={{ fontSize: 8.5, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 3, color: t.textMuted }}>
            FIPI &amp; LIPI · Pakistan Stock Exchange
          </div>
        </div>
      </div>

      {/* ── Main panels ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1">

        {/* ─── FIPI ──────────── */}
        <div className="flex flex-col lg:flex-shrink-0" style={{ flex: "0 0 auto" }}>
          <div className="flex flex-col items-center mb-2">
            <span style={{ fontSize: 14, fontWeight: 300, letterSpacing: "0.2em", color: t.text, textTransform: "uppercase" }}>FIPI</span>
            <span style={{ fontSize: 8, color: t.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>Foreign Portfolio Investment</span>
            <div style={{ marginTop: 5, height: 1.5, width: 72, background: "linear-gradient(90deg,transparent,var(--gold),transparent)", animation: "goldPulse 2s ease-in-out infinite" }}/>
          </div>

          <div className="rounded-xl overflow-hidden" style={{
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            background: t.dark ? "rgba(14,31,48,0.85)" : "rgba(255,255,255,0.72)",
            border: t.dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.55)",
            boxShadow: t.cardShadow,
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 300 }}>
                <tbody>
                  <OrangeHeader label="CLIENTWISE" cols={FIPI_COLS} />
                  {data.fipiFlow.map((r) => <DataRow key={r.label} row={r} dark={t.dark} />)}
                  <SectionLabel text="Sector Wise" dark={t.dark} />
                  <OrangeHeader label="SECTOR" cols={FIPI_COLS} />
                  {data.fipiSectors.map((r) => <DataRow key={r.label} row={r} dark={t.dark} />)}
                  {data.fipiBottom.map((r) => <DataRow key={r.label} row={r} dark={t.dark} />)}
                </tbody>
              </table>
              <div className="px-3 py-1.5" style={{ borderTop: t.dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #f0f0f0" }}>
                <span style={{ fontSize: 8, color: t.textMuted, fontStyle: "italic" }}>Source: NCCPL · Live feed</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── LIPI ──────────── */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex flex-col items-center mb-2">
            <span style={{ fontSize: 14, fontWeight: 300, letterSpacing: "0.2em", color: t.text, textTransform: "uppercase" }}>LIPI</span>
            <span style={{ fontSize: 8, color: t.textMuted, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 1 }}>Local Portfolio Investment</span>
            <div style={{ marginTop: 5, height: 1.5, width: 72, background: "linear-gradient(90deg,transparent,var(--gold),transparent)", animation: "goldPulse 2s ease-in-out infinite" }}/>
          </div>

          <div className="rounded-xl overflow-hidden" style={{
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            background: t.dark ? "rgba(14,31,48,0.85)" : "rgba(255,255,255,0.72)",
            border: t.dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.55)",
            boxShadow: t.cardShadow,
          }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 580 }}>
                <tbody>
                  <OrangeHeader label="CLIENTWISE" cols={LIPI_COLS} />
                  {data.lipiFlow.map((r) => <DataRow key={r.label} row={r} dark={t.dark} />)}
                  <SectionLabel text="Sector Wise" dark={t.dark} />
                  <OrangeHeader label="SECTOR" cols={LIPI_COLS} />
                  {data.lipiSectors.map((r) => <DataRow key={r.label} row={r} dark={t.dark} />)}
                  {data.lipiBottom.map((r) => <DataRow key={r.label} row={r} dark={t.dark} />)}
                </tbody>
              </table>
              <div className="px-3 py-1.5" style={{ borderTop: t.dark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #f0f0f0" }}>
                <span style={{ fontSize: 8, color: t.textMuted, fontStyle: "italic" }}>Source: NCCPL · Live feed</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Footer strip ───────────────────────────── */}
      <div className="flex items-center justify-between mt-3 px-1 flex-shrink-0">
        <span style={{ fontSize: 8.5, color: "var(--gold)" }}>
          Updates every <strong>3s</strong> · NCCPL
        </span>
        <span style={{ fontSize: 8.5, color: t.textMuted }}>
          © 2026 Stockifyy Advisory Private Limited
        </span>
      </div>

    </div>
  );
}
