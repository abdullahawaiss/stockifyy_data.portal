"use client";
import { useState, useMemo } from "react";
import { useDarkTokens } from "@/hooks/useDarkMode";

// ── Shared helpers ─────────────────────────────────────────────────────────────
function fmt(n: number, d = 2): string {
  if (!isFinite(n) || isNaN(n)) return "—";
  return n.toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtShort(n: number): string {
  if (!isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return fmt(n);
}

// ── SVG Donut ─────────────────────────────────────────────────────────────────
function DonutChart({ slices, size = 160, thick = 24 }: {
  slices: { label: string; value: number; color: string }[];
  size?: number; thick?: number;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  if (total <= 0) return null;
  const r = (size - thick) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => {
        const frac = s.value / total;
        const dash = circ * frac;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={thick}
            strokeDasharray={`${Math.max(dash - 1, 0)} ${circ - Math.max(dash - 1, 0)}`}
            strokeDashoffset={circ * 0.25 - offset * circ}
            strokeLinecap="round"
          />
        );
        offset += frac;
        return el;
      })}
      <circle cx={cx} cy={cy} r={r - thick / 2 + 2} fill="var(--card-bg,#fff)" />
    </svg>
  );
}

// ── SVG Line Chart ─────────────────────────────────────────────────────────────
function LineChart({ data, color = "#D4971A", height = 120, label = "Wealth Growth" }: {
  data: number[]; color?: string; height?: number; label?: string;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const w = 500, h = height, pad = 30;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });
  const pathD = "M" + pts.join(" L");
  const areaD = pathD + ` L${pad + (w - pad * 2)},${h - pad} L${pad},${h - pad} Z`;
  return (
    <div style={{ overflowX: "auto", marginTop: 8 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{label}</div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
        <defs>
          <linearGradient id={`lg_${color.replace("#","")}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#lg_${color.replace("#","")})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {data.map((v, i) => {
          if (i % Math.max(1, Math.floor(data.length / 8)) !== 0 && i !== data.length - 1) return null;
          const x = pad + (i / (data.length - 1)) * (w - pad * 2);
          const y = h - pad - ((v - min) / range) * (h - pad * 2);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={3} fill={color} />
              <text x={x} y={h - 8} textAnchor="middle" fontSize={9} fill="#94a3b8">{i + 1}</text>
            </g>
          );
        })}
        <text x={pad + (w - pad * 2)} y={h - pad - ((data[data.length - 1] - min) / range) * (h - pad * 2) - 6} textAnchor="end" fontSize={9} fontWeight="700" fill={color}>
          {fmtShort(data[data.length - 1])}
        </text>
      </svg>
    </div>
  );
}

// ── Shared UI primitives ───────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-muted,#718096)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

function ResultCard({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--light-bg,#f5f7fa)", borderLeft: `3px solid ${color ?? "#e2e8f0"}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted,#718096)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: color ?? "var(--text,#07111f)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: "var(--text-muted,#718096)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function HeroResult({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ borderRadius: 14, padding: "20px 24px", background: `linear-gradient(135deg,${color}18,${color}06)`, border: `1.5px solid ${color}40`, marginBottom: 14 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 900, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted,#718096)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function CalcTable({ cols, rows }: { cols: string[]; rows: (string | number)[][] }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--border,#e2e8f0)", marginTop: 8 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ background: "#07111F" }}>
            {cols.map(c => <th key={c} style={{ padding: "8px 12px", textAlign: "right", color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border,#e2e8f0)", background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "7px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{typeof cell === "number" ? fmt(cell) : cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── CALCULATORS ───────────────────────────────────────────────────────────────

// 1. ROI Calculator
function RoiCalc({ INP }: { INP: React.CSSProperties }) {
  const [invested, setInvested] = useState("100000");
  const [finalVal, setFinalVal] = useState("150000");
  const [years, setYears] = useState("3");
  const res = useMemo(() => {
    const inv = parseFloat(invested), fv = parseFloat(finalVal), yr = parseFloat(years);
    if (!inv || !fv) return null;
    const gain = fv - inv;
    const roi = (gain / inv) * 100;
    const ann = yr > 0 ? (Math.pow(fv / inv, 1 / yr) - 1) * 100 : 0;
    return { gain, roi, ann };
  }, [invested, finalVal, years]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Invested Amount (PKR)"><input style={INP} type="number" value={invested} onChange={e => setInvested(e.target.value)} /></Field>
          <Field label="Final Value (PKR)"><input style={INP} type="number" value={finalVal} onChange={e => setFinalVal(e.target.value)} /></Field>
          <Field label="Holding Period (Years)"><input style={INP} type="number" value={years} onChange={e => setYears(e.target.value)} /></Field>
        </div>
      </div>
      {res && (
        <div>
          <HeroResult label="ROI" value={fmt(res.roi) + "%"} color={res.roi >= 0 ? "#16a34a" : "#dc2626"} sub={`Gain: PKR ${fmtShort(res.gain)}`} />
          <ResultCard label="Annualized Return" value={fmt(res.ann) + "%"} color="#D4971A" sub="CAGR" />
          <div style={{ marginTop: 16 }}>
            <DonutChart size={140} thick={20} slices={[
              { label: "Invested", value: parseFloat(invested) || 0, color: "#07111F" },
              { label: "Gain", value: Math.max(res.gain, 0), color: "#D4971A" },
            ]} />
          </div>
        </div>
      )}
    </div>
  );
}

// 2. CAGR Calculator
function CagrCalc({ INP }: { INP: React.CSSProperties }) {
  const [begin, setBegin] = useState("100000");
  const [end, setEnd] = useState("250000");
  const [years, setYears] = useState("5");
  const res = useMemo(() => {
    const b = parseFloat(begin), e = parseFloat(end), y = parseFloat(years);
    if (!b || !e || !y) return null;
    const cagr = (Math.pow(e / b, 1 / y) - 1) * 100;
    return { cagr, gain: e - b };
  }, [begin, end, years]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Beginning Value (PKR)"><input style={INP} type="number" value={begin} onChange={e => setBegin(e.target.value)} /></Field>
        <Field label="Ending Value (PKR)"><input style={INP} type="number" value={end} onChange={e => setEnd(e.target.value)} /></Field>
        <Field label="Number of Years"><input style={INP} type="number" value={years} onChange={e => setYears(e.target.value)} /></Field>
      </div>
      {res && (
        <div>
          <HeroResult label="CAGR" value={fmt(res.cagr) + "%"} color="#2563eb" sub={`Total Gain: PKR ${fmtShort(res.gain)}`} />
          <DonutChart size={130} thick={20} slices={[
            { label: "Start", value: parseFloat(begin) || 0, color: "#07111F" },
            { label: "Growth", value: Math.max(res.gain, 0), color: "#2563eb" },
          ]} />
        </div>
      )}
    </div>
  );
}

// 3. SIP Calculator with monthly table + line chart
function SipCalc({ INP }: { INP: React.CSSProperties }) {
  const [monthly, setMonthly] = useState("10000");
  const [rate, setRate] = useState("15");
  const [years, setYears] = useState("10");

  const res = useMemo(() => {
    const m = parseFloat(monthly), r = parseFloat(rate) / 100 / 12, yr = parseFloat(years);
    if (!m || !r || !yr) return null;
    const n = Math.round(yr * 12);
    const fv = m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = m * n;
    const wealth: number[] = [];
    for (let i = 1; i <= n; i++) {
      wealth.push(m * ((Math.pow(1 + r, i) - 1) / r) * (1 + r));
    }
    // Year-end rows
    const tableRows: (string | number)[][] = [];
    for (let yr = 1; yr <= Math.round(years as unknown as number); yr++) {
      const months = yr * 12;
      if (months > n) break;
      const v = m * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
      const inv = m * months;
      tableRows.push([`Year ${yr}`, months, fmt(inv, 0), fmt(v, 0), fmt(v - inv, 0), fmt(((v - inv) / inv) * 100, 1) + "%"]);
    }
    return { fv, invested, gain: fv - invested, wealth, tableRows };
  }, [monthly, rate, years]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Field label="Monthly SIP (PKR)"><input style={INP} type="number" value={monthly} onChange={e => setMonthly(e.target.value)} /></Field>
        <Field label="Expected Return (% p.a.)"><input style={INP} type="number" value={rate} onChange={e => setRate(e.target.value)} /></Field>
        <Field label="Investment Period (Years)"><input style={INP} type="number" value={years} onChange={e => setYears(e.target.value)} /></Field>
      </div>
      {res && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <HeroResult label="Future Value" value={"₨ " + fmtShort(res.fv)} color="#D4971A" sub={`Invested: ₨ ${fmtShort(res.invested)}`} />
            <div>
              <ResultCard label="Total Gain" value={"₨ " + fmtShort(res.gain)} color="#16a34a" />
              <div style={{ marginTop: 12 }}>
                <DonutChart size={120} thick={18} slices={[
                  { label: "Invested", value: res.invested, color: "#07111F" },
                  { label: "Returns", value: Math.max(res.gain, 0), color: "#D4971A" },
                ]} />
              </div>
            </div>
          </div>
          <LineChart data={res.wealth.filter((_, i) => i % 3 === 0)} color="#D4971A" label="Month-by-Month Wealth Growth (PKR)" />
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Year-by-Year Summary</div>
            <CalcTable cols={["Year","Months","Invested","Value","Gain","Return %"]} rows={res.tableRows} />
          </div>
        </div>
      )}
    </div>
  );
}

// 4. Compound Interest
function CompoundCalc({ INP }: { INP: React.CSSProperties }) {
  const [principal, setPrincipal] = useState("100000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("5");
  const [freq, setFreq] = useState("12");
  const res = useMemo(() => {
    const p = parseFloat(principal), r = parseFloat(rate) / 100, yr = parseFloat(years), n = parseFloat(freq);
    if (!p || !r || !yr || !n) return null;
    const fv = p * Math.pow(1 + r / n, n * yr);
    return { fv, interest: fv - p };
  }, [principal, rate, years, freq]);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Principal (PKR)"><input style={INP} type="number" value={principal} onChange={e => setPrincipal(e.target.value)} /></Field>
        <Field label="Annual Rate (%)"><input style={INP} type="number" value={rate} onChange={e => setRate(e.target.value)} /></Field>
        <Field label="Period (Years)"><input style={INP} type="number" value={years} onChange={e => setYears(e.target.value)} /></Field>
        <Field label="Compounding Frequency">
          <select style={INP} value={freq} onChange={e => setFreq(e.target.value)}>
            <option value="1">Annual</option>
            <option value="2">Semi-Annual</option>
            <option value="4">Quarterly</option>
            <option value="12">Monthly</option>
            <option value="365">Daily</option>
          </select>
        </Field>
      </div>
      {res && (
        <div>
          <HeroResult label="Future Value" value={"₨ " + fmtShort(res.fv)} color="#7c3aed" sub={`Interest Earned: ₨ ${fmtShort(res.interest)}`} />
          <DonutChart size={130} thick={20} slices={[
            { label: "Principal", value: parseFloat(principal) || 0, color: "#07111F" },
            { label: "Interest", value: Math.max(res.interest, 0), color: "#7c3aed" },
          ]} />
        </div>
      )}
    </div>
  );
}

// 5. Salary Tax (Pakistan FY 2025-26)
function TaxCalc({ INP }: { INP: React.CSSProperties }) {
  const [annual, setAnnual] = useState("1800000");
  const res = useMemo(() => {
    const income = parseFloat(annual);
    if (!income || income <= 0) return null;
    let tax = 0;
    const slabs = [
      [0, 600_000, 0, 0],
      [600_001, 1_200_000, 0, 0.05],
      [1_200_001, 2_200_000, 30_000, 0.15],
      [2_200_001, 3_200_000, 180_000, 0.25],
      [3_200_001, 4_100_000, 430_000, 0.30],
      [4_100_001, Infinity, 700_000, 0.35],
    ];
    for (const [low, high, base, rate] of slabs) {
      if (income > low) {
        tax = (base as number) + (Math.min(income, high as number) - (low as number)) * (rate as number);
      }
    }
    const monthly = tax / 12;
    const effRate = (tax / income) * 100;
    return { tax, monthly, effRate, takehome: income - tax };
  }, [annual]);

  const slabRows = [
    ["Up to 600K", "0%", "Nil"],
    ["600K - 1.2M", "5%", "PKR 30,000"],
    ["1.2M - 2.2M", "15%", "PKR 180,000"],
    ["2.2M - 3.2M", "25%", "PKR 430,000"],
    ["3.2M - 4.1M", "30%", "PKR 700,000"],
    ["Above 4.1M", "35%", "—"],
  ];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div>
          <Field label="Annual Gross Salary (PKR)">
            <input style={INP} type="number" value={annual} onChange={e => setAnnual(e.target.value)} />
          </Field>
          {res && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              <HeroResult label="Annual Tax" value={"₨ " + fmtShort(res.tax)} color="#dc2626" sub={`Monthly: ₨ ${fmtShort(res.monthly)}`} />
              <ResultCard label="Effective Tax Rate" value={fmt(res.effRate) + "%"} color="#dc2626" />
              <ResultCard label="Take-Home Pay" value={"₨ " + fmtShort(res.takehome)} color="#16a34a" sub="Annual net" />
            </div>
          )}
        </div>
        <div>
          {res && (
            <DonutChart size={150} thick={22} slices={[
              { label: "Take Home", value: res.takehome, color: "#16a34a" },
              { label: "Tax", value: res.tax, color: "#dc2626" },
            ]} />
          )}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: "var(--text-muted,#718096)", textTransform: "uppercase" }}>FY 2025-26 Tax Slabs</div>
            <CalcTable cols={["Income Slab","Tax Rate","Base Tax"]} rows={slabRows} />
          </div>
        </div>
      </div>
    </div>
  );
}

// 6. DCF Calculator
function DcfCalc({ INP }: { INP: React.CSSProperties }) {
  const [cashflows, setCashflows] = useState("50000,55000,60000,65000,70000");
  const [wacc, setWacc] = useState("12");
  const [terminal, setTerminal] = useState("3");
  const res = useMemo(() => {
    const cfs = cashflows.split(",").map(s => parseFloat(s.trim())).filter(isFinite);
    const r = parseFloat(wacc) / 100, g = parseFloat(terminal) / 100;
    if (!cfs.length || !r) return null;
    let pv = 0;
    const rows: (string | number)[][] = cfs.map((cf, i) => {
      const discounted = cf / Math.pow(1 + r, i + 1);
      pv += discounted;
      return [`Year ${i + 1}`, fmt(cf, 0), fmt(discounted, 0)];
    });
    const lastCF = cfs[cfs.length - 1];
    const terminalPV = (lastCF * (1 + g)) / (r - g) / Math.pow(1 + r, cfs.length);
    const intrinsic = pv + terminalPV;
    return { pv, terminalPV, intrinsic, rows };
  }, [cashflows, wacc, terminal]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Cash Flows (comma-separated PKR)"><input style={INP} value={cashflows} onChange={e => setCashflows(e.target.value)} /></Field>
        <Field label="WACC / Discount Rate (%)"><input style={INP} type="number" value={wacc} onChange={e => setWacc(e.target.value)} /></Field>
        <Field label="Terminal Growth Rate (%)"><input style={INP} type="number" value={terminal} onChange={e => setTerminal(e.target.value)} /></Field>
        {res && <CalcTable cols={["Period","Cash Flow","PV"]} rows={res.rows} />}
      </div>
      {res && (
        <div>
          <HeroResult label="Intrinsic Value" value={"₨ " + fmtShort(res.intrinsic)} color="#0891b2" />
          <ResultCard label="PV of Cash Flows" value={"₨ " + fmtShort(res.pv)} color="#2563eb" />
          <ResultCard label="Terminal Value PV" value={"₨ " + fmtShort(res.terminalPV)} color="#7c3aed" />
          <div style={{ marginTop: 16 }}>
            <DonutChart size={130} thick={20} slices={[
              { label: "PV CF", value: res.pv, color: "#2563eb" },
              { label: "Terminal", value: res.terminalPV, color: "#7c3aed" },
            ]} />
          </div>
        </div>
      )}
    </div>
  );
}

// 7. Depreciation
function DepCalc({ INP }: { INP: React.CSSProperties }) {
  const [cost, setCost] = useState("500000");
  const [life, setLife] = useState("5");
  const [salvage, setSalvage] = useState("50000");
  const [method, setMethod] = useState<"sl"|"dd">("sl");
  const res = useMemo(() => {
    const c = parseFloat(cost), n = parseInt(life), s = parseFloat(salvage);
    if (!c || !n) return null;
    const rows: (string | number)[][] = [];
    let bookVal = c;
    const rate = method === "dd" ? (2 / n) : 0;
    const slDep = (c - s) / n;
    for (let yr = 1; yr <= n; yr++) {
      const dep = method === "sl" ? slDep : bookVal * rate;
      bookVal -= dep;
      rows.push([`Year ${yr}`, fmt(dep, 0), fmt(Math.max(bookVal, s), 0)]);
    }
    return { rows, totalDep: c - Math.max(bookVal, s) };
  }, [cost, life, salvage, method]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Asset Cost (PKR)"><input style={INP} type="number" value={cost} onChange={e => setCost(e.target.value)} /></Field>
        <Field label="Useful Life (Years)"><input style={INP} type="number" value={life} onChange={e => setLife(e.target.value)} /></Field>
        <Field label="Salvage Value (PKR)"><input style={INP} type="number" value={salvage} onChange={e => setSalvage(e.target.value)} /></Field>
        <Field label="Method">
          <select style={INP} value={method} onChange={e => setMethod(e.target.value as "sl"|"dd")}>
            <option value="sl">Straight Line</option>
            <option value="dd">Double Declining</option>
          </select>
        </Field>
        {res && <CalcTable cols={["Year","Depreciation","Book Value"]} rows={res.rows} />}
      </div>
      {res && (
        <div>
          <HeroResult label="Total Depreciation" value={"₨ " + fmtShort(res.totalDep)} color="#64748b" />
          <DonutChart size={130} thick={20} slices={[
            { label: "Depreciated", value: res.totalDep, color: "#64748b" },
            { label: "Salvage", value: parseFloat(salvage) || 0, color: "#D4971A" },
          ]} />
        </div>
      )}
    </div>
  );
}

// 8. Currency Converter
function FxCalc({ INP }: { INP: React.CSSProperties }) {
  const RATES: Record<string, number> = { USD: 279.5, EUR: 305.0, GBP: 352.0, AED: 76.1, SAR: 74.5, CAD: 205.0, CNY: 38.5 };
  const [amount, setAmount] = useState("1000");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("PKR");
  const allCurrencies = ["PKR", ...Object.keys(RATES)];
  const result = useMemo(() => {
    const amt = parseFloat(amount);
    if (!amt) return null;
    const inPKR = from === "PKR" ? amt : amt * (RATES[from] ?? 1);
    const out = to === "PKR" ? inPKR : inPKR / (RATES[to] ?? 1);
    return out;
  }, [amount, from, to]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Amount"><input style={INP} type="number" value={amount} onChange={e => setAmount(e.target.value)} /></Field>
        <Field label="From Currency">
          <select style={INP} value={from} onChange={e => setFrom(e.target.value)}>
            {allCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="To Currency">
          <select style={INP} value={to} onChange={e => setTo(e.target.value)}>
            {allCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <div style={{ fontSize: 11, color: "var(--text-muted,#718096)", marginTop: 4 }}>Indicative rates as of Aug 2026</div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: "var(--text-muted,#718096)", textTransform: "uppercase" }}>Rate Table (vs PKR)</div>
          <CalcTable cols={["Currency","1 Unit = PKR"]} rows={Object.entries(RATES).map(([c, r]) => [c, fmt(r)])} />
        </div>
      </div>
      {result !== null && (
        <div>
          <HeroResult label={`${amount} ${from} =`} value={fmt(result, 2) + " " + to} color="#059669" />
        </div>
      )}
    </div>
  );
}

// 9. Zakat Calculator
function ZakatCalc({ INP }: { INP: React.CSSProperties }) {
  const [cash, setCash] = useState("500000");
  const [bankBalance, setBankBalance] = useState("300000");
  const [stocks, setStocks] = useState("200000");
  const [goldGrams, setGoldGrams] = useState("50");
  const [goldPrice, setGoldPrice] = useState("22000");
  const [silverGrams, setSilverGrams] = useState("0");
  const [silverPrice, setSilverPrice] = useState("280");
  const [debts, setDebts] = useState("0");

  const NISAB_GOLD_G = 87.48;
  const NISAB_SILVER_G = 612.36;

  const res = useMemo(() => {
    const totalAssets = parseFloat(cash || "0") + parseFloat(bankBalance || "0") + parseFloat(stocks || "0")
      + (parseFloat(goldGrams || "0") * parseFloat(goldPrice || "0"))
      + (parseFloat(silverGrams || "0") * parseFloat(silverPrice || "0"));
    const totalDebts = parseFloat(debts || "0");
    const zakatable = totalAssets - totalDebts;
    const goldNisabVal = NISAB_GOLD_G * parseFloat(goldPrice || "22000");
    const silverNisabVal = NISAB_SILVER_G * parseFloat(silverPrice || "280");
    const nisab = Math.min(goldNisabVal, silverNisabVal);
    const eligible = zakatable >= nisab;
    const zakat = eligible ? zakatable * 0.025 : 0;
    return { totalAssets, totalDebts, zakatable, nisab, eligible, zakat };
  }, [cash, bankBalance, stocks, goldGrams, goldPrice, silverGrams, silverPrice, debts]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Cash in Hand (PKR)"><input style={INP} type="number" value={cash} onChange={e => setCash(e.target.value)} /></Field>
        <Field label="Bank Balance (PKR)"><input style={INP} type="number" value={bankBalance} onChange={e => setBankBalance(e.target.value)} /></Field>
        <Field label="Stock Value (PKR)"><input style={INP} type="number" value={stocks} onChange={e => setStocks(e.target.value)} /></Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <Field label="Gold (grams)"><input style={INP} type="number" value={goldGrams} onChange={e => setGoldGrams(e.target.value)} /></Field>
          <Field label="Gold Price / gram (PKR)"><input style={INP} type="number" value={goldPrice} onChange={e => setGoldPrice(e.target.value)} /></Field>
          <Field label="Silver (grams)"><input style={INP} type="number" value={silverGrams} onChange={e => setSilverGrams(e.target.value)} /></Field>
          <Field label="Silver Price / gram (PKR)"><input style={INP} type="number" value={silverPrice} onChange={e => setSilverPrice(e.target.value)} /></Field>
        </div>
        <Field label="Debts / Liabilities (PKR)"><input style={INP} type="number" value={debts} onChange={e => setDebts(e.target.value)} /></Field>
      </div>
      <div>
        <HeroResult label="Zakat Payable (2.5%)" value={"₨ " + fmtShort(res.zakat)} color="#D4971A"
          sub={res.eligible ? "You are eligible to pay Zakat" : "Below Nisab threshold"} />
        <ResultCard label="Zakatable Assets" value={"₨ " + fmtShort(res.zakatable)} color="#07111F" />
        <ResultCard label="Nisab Threshold" value={"₨ " + fmtShort(res.nisab)} color="#D4971A" sub="Based on Silver Nisab" />
        <div style={{ marginTop: 16 }}>
          <DonutChart size={120} thick={18} slices={[
            { label: "Zakat", value: res.zakat, color: "#D4971A" },
            { label: "Kept", value: Math.max(res.zakatable - res.zakat, 0), color: "#07111F" },
          ]} />
        </div>
      </div>
    </div>
  );
}

// 10. Brokerage Calculator
function BrokerageCalc({ INP }: { INP: React.CSSProperties }) {
  const [tradeVal, setTradeVal] = useState("500000");
  const [tradeType, setTradeType] = useState<"buy"|"sell">("buy");
  const res = useMemo(() => {
    const val = parseFloat(tradeVal);
    if (!val) return null;
    const brokerage = val * 0.0015; // 0.15%
    const cdc = val * 0.00015;
    const secp = val * 0.0000025;
    const psx = val * 0.0000375;
    const whTax = brokerage * 0.15;
    const sst = brokerage * 0.13;
    const cvt = tradeType === "sell" ? val * 0.00001 : 0;
    const total = brokerage + cdc + secp + psx + whTax + sst + cvt;
    return [
      ["Brokerage (0.15%)", fmt(brokerage)],
      ["CDC Charges (0.015%)", fmt(cdc)],
      ["SECP Fee (0.00025%)", fmt(secp)],
      ["PSX Fee (0.00375%)", fmt(psx)],
      ["W.H. Tax on Brok (15%)", fmt(whTax)],
      ["SST on Brok (13%)", fmt(sst)],
      ...(tradeType === "sell" ? [["CVT on Sale (0.001%)", fmt(cvt)]] : []),
      ["TOTAL COST", fmt(total)],
    ].map(([label, val]) => [label, val]) as [string, string][];
  }, [tradeVal, tradeType]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Trade Value (PKR)"><input style={INP} type="number" value={tradeVal} onChange={e => setTradeVal(e.target.value)} /></Field>
        <Field label="Transaction Type">
          <select style={INP} value={tradeType} onChange={e => setTradeType(e.target.value as "buy"|"sell")}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </Field>
        {res && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6, color: "var(--text-muted,#718096)", textTransform: "uppercase" }}>PSX Fee Breakdown</div>
            <CalcTable cols={["Component","PKR"]} rows={res} />
          </div>
        )}
      </div>
      {res && (
        <div>
          <HeroResult label="Total Cost" value={"₨ " + fmtShort(parseFloat(res.find(r => r[0] === "TOTAL COST")?.[1] ?? "0").valueOf())} color="#dc2626" />
          <DonutChart size={130} thick={20} slices={[
            { label: "Trade", value: parseFloat(tradeVal) || 0, color: "#07111F" },
            { label: "Cost", value: parseFloat(res.find(r => r[0] === "TOTAL COST")?.[1] ?? "0"), color: "#dc2626" },
          ]} />
        </div>
      )}
    </div>
  );
}

// 11. Rights Issue Calculator
function RightsCalc({ INP }: { INP: React.CSSProperties }) {
  const [shares, setShares] = useState("1000");
  const [ratio, setRatio] = useState("1:4");
  const [subPrice, setSubPrice] = useState("50");
  const [mktPrice, setMktPrice] = useState("120");
  const res = useMemo(() => {
    const s = parseFloat(shares), sp = parseFloat(subPrice), mp = parseFloat(mktPrice);
    const parts = ratio.split(":").map(x => parseFloat(x.trim()));
    if (!s || !sp || !mp || parts.length !== 2 || !parts[1]) return null;
    const newShares = Math.floor(s * (parts[0] / parts[1]));
    const totalNew = s + newShares;
    const investment = newShares * sp;
    const terp = (s * mp + newShares * sp) / totalNew;
    const rightsValue = mp - terp;
    return { newShares, totalNew, investment, terp, rightsValue };
  }, [shares, ratio, subPrice, mktPrice]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Current Shares Held"><input style={INP} type="number" value={shares} onChange={e => setShares(e.target.value)} /></Field>
        <Field label="Rights Ratio (e.g. 1:4)"><input style={INP} value={ratio} onChange={e => setRatio(e.target.value)} placeholder="1:4" /></Field>
        <Field label="Subscription Price (PKR)"><input style={INP} type="number" value={subPrice} onChange={e => setSubPrice(e.target.value)} /></Field>
        <Field label="Current Market Price (PKR)"><input style={INP} type="number" value={mktPrice} onChange={e => setMktPrice(e.target.value)} /></Field>
      </div>
      {res && (
        <div>
          <HeroResult label="TERP" value={"PKR " + fmt(res.terp)} color="#7c3aed" sub="Theoretical Ex-Rights Price" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <ResultCard label="New Shares" value={res.newShares.toLocaleString()} color="#D4971A" />
            <ResultCard label="Total Shares" value={res.totalNew.toLocaleString()} color="#07111F" />
            <ResultCard label="Investment" value={"₨ " + fmtShort(res.investment)} color="#2563eb" />
            <ResultCard label="Rights Value" value={"₨ " + fmt(res.rightsValue)} color="#16a34a" />
          </div>
          <div style={{ marginTop: 16 }}>
            <DonutChart size={120} thick={18} slices={[
              { label: "Existing", value: parseFloat(shares) || 0, color: "#07111F" },
              { label: "New Rights", value: res.newShares, color: "#7c3aed" },
            ]} />
          </div>
        </div>
      )}
    </div>
  );
}

// 12. DRIP — Dividend Reinvestment Calculator
function DripCalc({ INP }: { INP: React.CSSProperties }) {
  const [shares, setShares] = useState("1000");
  const [dps, setDps] = useState("10");
  const [freq, setFreq] = useState("4");
  const [price, setPrice] = useState("100");
  const [years, setYears] = useState("5");

  const res = useMemo(() => {
    const s = parseFloat(shares), d = parseFloat(dps), f = parseFloat(freq);
    const p = parseFloat(price), yr = parseFloat(years);
    if (!s || !d || !p || !yr) return null;
    let currentShares = s;
    const yearRows: (string | number)[][] = [];
    const wealthArr: number[] = [s * p];
    for (let y = 1; y <= yr; y++) {
      const divPerYear = currentShares * d;
      const newShares = divPerYear / p;
      currentShares += newShares;
      const val = currentShares * p;
      wealthArr.push(val);
      yearRows.push([`Year ${y}`, fmt(currentShares, 2), fmt(newShares * p, 0), fmt(val, 0)]);
    }
    const finalVal = currentShares * p;
    const initialVal = parseFloat(shares) * p;
    return { finalVal, initialVal, totalShares: currentShares, yearRows, wealthArr };
  }, [shares, dps, freq, price, years]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 16 }}>
        <Field label="Initial Shares"><input style={INP} type="number" value={shares} onChange={e => setShares(e.target.value)} /></Field>
        <Field label="DPS (PKR)"><input style={INP} type="number" value={dps} onChange={e => setDps(e.target.value)} /></Field>
        <Field label="Dividend / Year"><input style={INP} type="number" value={freq} onChange={e => setFreq(e.target.value)} /></Field>
        <Field label="Reinvestment Price"><input style={INP} type="number" value={price} onChange={e => setPrice(e.target.value)} /></Field>
        <Field label="Years"><input style={INP} type="number" value={years} onChange={e => setYears(e.target.value)} /></Field>
      </div>
      {res && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <HeroResult label="Final Portfolio Value" value={"₨ " + fmtShort(res.finalVal)} color="#16a34a" sub={`Started: ₨ ${fmtShort(res.initialVal)}`} />
            <div>
              <ResultCard label="Total Shares" value={fmt(res.totalShares, 0)} color="#D4971A" />
              <div style={{ marginTop: 12 }}>
                <DonutChart size={110} thick={16} slices={[
                  { label: "Initial", value: parseFloat(shares) || 0, color: "#07111F" },
                  { label: "Reinvested", value: res.totalShares - parseFloat(shares), color: "#16a34a" },
                ]} />
              </div>
            </div>
          </div>
          <LineChart data={res.wealthArr} color="#16a34a" label="Portfolio Value over Time (PKR)" />
          <div style={{ marginTop: 16 }}>
            <CalcTable cols={["Year","Total Shares","Div Reinvested","Portfolio Value"]} rows={res.yearRows} />
          </div>
        </div>
      )}
    </div>
  );
}

// 13. IPO Allotment Calculator
function IpoCalc({ INP }: { INP: React.CSSProperties }) {
  const [applied, setApplied] = useState("1000");
  const [totalSub, setTotalSub] = useState("50000000");
  const [onOffer, setOnOffer] = useState("10000000");
  const [offerPrice, setOfferPrice] = useState("50");
  const res = useMemo(() => {
    const ap = parseFloat(applied), ts = parseFloat(totalSub), oo = parseFloat(onOffer), op = parseFloat(offerPrice);
    if (!ap || !ts || !oo || !op) return null;
    const subTimes = ts / oo;
    const allotted = Math.max(Math.floor((ap / ts) * oo), 1);
    const refund = (ap - allotted) * op;
    const allottedVal = allotted * op;
    return { subTimes, allotted, refund, allottedVal };
  }, [applied, totalSub, onOffer, offerPrice]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Shares Applied For"><input style={INP} type="number" value={applied} onChange={e => setApplied(e.target.value)} /></Field>
        <Field label="Total Subscription (shares)"><input style={INP} type="number" value={totalSub} onChange={e => setTotalSub(e.target.value)} /></Field>
        <Field label="Shares on Offer"><input style={INP} type="number" value={onOffer} onChange={e => setOnOffer(e.target.value)} /></Field>
        <Field label="Offer Price (PKR)"><input style={INP} type="number" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} /></Field>
      </div>
      {res && (
        <div>
          <HeroResult label="Est. Allotment" value={res.allotted.toLocaleString() + " shares"} color="#2563eb"
            sub={`Value: PKR ${fmtShort(res.allottedVal)}`} />
          <ResultCard label="Subscription Times" value={fmt(res.subTimes, 1) + "x"} color="#D4971A" sub="Oversubscription" />
          <ResultCard label="Refund Amount" value={"PKR " + fmtShort(res.refund)} color="#dc2626" />
          <div style={{ marginTop: 16 }}>
            <DonutChart size={120} thick={18} slices={[
              { label: "Allotted", value: res.allottedVal, color: "#2563eb" },
              { label: "Refund", value: res.refund, color: "#dc2626" },
            ]} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Calculator Definitions ─────────────────────────────────────────────────────
type CalcId = "roi"|"cagr"|"sip"|"compound"|"dcf"|"tax"|"depreciation"|"fx"|"zakat"|"brokerage"|"rights"|"drip"|"ipo";

interface CalcDef { id: CalcId; title: string; short: string; icon: string; accent: string; isNew?: boolean }
const CALCS: CalcDef[] = [
  { id:"roi",          title:"ROI Calculator",                short:"Return on Investment",           icon:"📈", accent:"#16a34a" },
  { id:"cagr",         title:"CAGR Calculator",               short:"Compound Annual Growth Rate",    icon:"📊", accent:"#2563eb" },
  { id:"sip",          title:"SIP Calculator",                short:"Systematic Investment Plan",     icon:"💰", accent:"#D4971A" },
  { id:"compound",     title:"Compounding",                   short:"Compound Interest Growth",       icon:"🔄", accent:"#7c3aed" },
  { id:"dcf",          title:"DCF Calculator",                short:"Discounted Cash Flow",           icon:"🏦", accent:"#0891b2" },
  { id:"tax",          title:"Salary Tax",                    short:"Pakistan Income Tax FY 2025-26", icon:"🧾", accent:"#dc2626" },
  { id:"depreciation", title:"Depreciation",                  short:"Asset Depreciation Schedule",    icon:"⚙️", accent:"#64748b" },
  { id:"fx",           title:"Currency Converter",            short:"PKR ↔ Major Currencies",         icon:"💱", accent:"#059669" },
  { id:"zakat",        title:"Zakat Calculator",              short:"Annual Zakat @ 2.5%",            icon:"☪️", accent:"#D4971A" },
  { id:"brokerage",    title:"Brokerage Calculator",          short:"PSX Transaction Cost",           icon:"📋", accent:"#dc2626" },
  { id:"rights",       title:"Rights Issue Calculator",       short:"TERP & Rights Valuation",        icon:"📜", accent:"#7c3aed", isNew:true },
  { id:"drip",         title:"DRIP Calculator",               short:"Dividend Reinvestment",          icon:"🔁", accent:"#16a34a", isNew:true },
  { id:"ipo",          title:"IPO Allotment Calculator",      short:"Estimated Share Allotment",      icon:"🚀", accent:"#2563eb", isNew:true },
];

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ToolsClient() {
  const tk = useDarkTokens();
  const [active, setActive] = useState<CalcId | null>(null);

  const card = tk.dark ? "#0A1825" : "#ffffff";
  const border = tk.dark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
  const text = tk.dark ? "#BDD0E8" : "#07111F";
  const muted = tk.dark ? "#5C8099" : "#718096";
  const bg = tk.dark ? "#0E1F30" : "#F8F6F1";
  const navy = "#07111F";
  const gold = "#D4971A";

  const INP: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "10px 13px",
    borderRadius: 8, border: `1.5px solid ${border}`,
    background: tk.dark ? "#07111F" : "#F8F6F1",
    color: text, fontSize: 14, outline: "none", fontVariantNumeric: "tabular-nums",
  };

  const activeCalc = CALCS.find(c => c.id === active);

  return (
    <div style={{ minHeight: "100vh", background: bg, padding: "24px 20px", color: text, fontFamily: "inherit" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            {active ? (
              <button onClick={() => setActive(null)} style={{ background: "none", border: "none", cursor: "pointer", color: gold, fontSize: 14, fontWeight: 700, padding: "0 0 6px", display: "flex", alignItems: "center", gap: 6 }}>
                ← All Calculators
              </button>
            ) : null}
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: text }}>
              {activeCalc ? activeCalc.title : "Financial Calculators"}
            </h1>
            <p style={{ fontSize: 13, color: muted, margin: "4px 0 0" }}>
              {activeCalc ? activeCalc.short : "13 professional tools for PSX investors"}
            </p>
          </div>
          {activeCalc && (
            <div style={{ width: 40, height: 40, borderRadius: 12, background: activeCalc.accent + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {activeCalc.icon}
            </div>
          )}
        </div>

        {/* Grid of calculator cards (landing) */}
        {!active && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
            {CALCS.map(calc => (
              <button key={calc.id} onClick={() => setActive(calc.id)} style={{
                background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "20px",
                textAlign: "left", cursor: "pointer", transition: "all 0.2s",
                borderTop: `3px solid ${calc.accent}`, display: "block",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 20px ${calc.accent}30`; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 28 }}>{calc.icon}</div>
                  {calc.isNew && (
                    <span style={{ background: calc.accent + "20", color: calc.accent, fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 8, textTransform: "uppercase" }}>New</span>
                  )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: text, marginBottom: 4 }}>{calc.title}</div>
                <div style={{ fontSize: 12, color: muted }}>{calc.short}</div>
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 4, color: calc.accent, fontSize: 12, fontWeight: 700 }}>
                  Open Calculator <span>→</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Active calculator */}
        {active && activeCalc && (
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 16, padding: "28px", borderTop: `3px solid ${activeCalc.accent}` }}>
            {active === "roi"          && <RoiCalc INP={INP} />}
            {active === "cagr"         && <CagrCalc INP={INP} />}
            {active === "sip"          && <SipCalc INP={INP} />}
            {active === "compound"     && <CompoundCalc INP={INP} />}
            {active === "dcf"          && <DcfCalc INP={INP} />}
            {active === "tax"          && <TaxCalc INP={INP} />}
            {active === "depreciation" && <DepCalc INP={INP} />}
            {active === "fx"           && <FxCalc INP={INP} />}
            {active === "zakat"        && <ZakatCalc INP={INP} />}
            {active === "brokerage"    && <BrokerageCalc INP={INP} />}
            {active === "rights"       && <RightsCalc INP={INP} />}
            {active === "drip"         && <DripCalc INP={INP} />}
            {active === "ipo"          && <IpoCalc INP={INP} />}
          </div>
        )}
      </div>
    </div>
  );
}
