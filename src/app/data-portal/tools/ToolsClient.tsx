"use client";
import { useState, useMemo } from "react";

const NAVY = "#07111F";
const GOLD = "#D4971A";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function fmt(n: number, d = 2) { return n.toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtM(n: number) { if (Math.abs(n) >= 1e9) return (n/1e9).toFixed(2)+"B"; if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(2)+"M"; if (Math.abs(n) >= 1e3) return (n/1e3).toFixed(1)+"K"; return fmt(n); }
function n(s: string) { return parseFloat(s) || 0; }

/* ─── shared sub-components ───────────────────────────────────────────────── */
function Input({ label, value, onChange, prefix, step, placeholder }: { label: string; value: string; onChange: (v: string) => void; prefix?: string; step?: string; placeholder?: string }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        {prefix && <span style={{ padding: "0 10px", fontSize: 12, color: "var(--text-muted)", background: "var(--light-bg)", borderRight: "1px solid var(--border)", alignSelf: "stretch", display: "flex", alignItems: "center" }}>{prefix}</span>}
        <input type="number" value={value} onChange={e => onChange(e.target.value)} step={step ?? "any"} min="0" placeholder={placeholder}
          style={{ flex: 1, padding: "9px 12px", border: "none", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
      </div>
    </div>
  );
}
function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: {value: string; label: string}[] }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 13, cursor: "pointer" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function Row({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border)", gridColumn: "1 / -1" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: highlight ? 15 : 13, fontWeight: highlight ? 800 : 600, color: color ?? (highlight ? "var(--text-primary)" : "var(--text-primary)"), fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}
function Sec({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", padding: "10px 0 6px", borderTop: "1px solid var(--border)", marginTop: 8, gridColumn: "1 / -1" }}>{children}</div>;
}
function Btn({ onClick, label = "Calculate →" }: { onClick: () => void; label?: string }) {
  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <button onClick={onClick} style={{ width: "100%", padding: "11px", borderRadius: 9, background: NAVY, color: GOLD, border: "none", fontSize: 14, fontWeight: 800, cursor: "pointer", marginTop: 4 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
        {label}
      </button>
    </div>
  );
}
function BarSVG({ data, color = GOLD, label = "" }: { data: number[]; color?: string; label?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(Math.abs), 1);
  const bw = 20, gap = 6, h = 90, pad = 12;
  const w = data.length * (bw + gap) + pad * 2;
  return (
    <div style={{ overflowX: "auto", marginTop: 8, gridColumn: "1 / -1" }}>
      {label && <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>}
      <svg width={Math.max(w, 280)} height={h + 30} viewBox={`0 0 ${Math.max(w, 280)} ${h + 30}`}>
        {data.map((d, i) => {
          const bh = Math.max(3, (Math.abs(d) / max) * (h - 10));
          const x = pad + i * (bw + gap);
          const c = d >= 0 ? "#16a34a" : "#dc2626";
          return (
            <g key={i}>
              <rect x={x} y={h - bh} width={bw} height={bh} rx={3} fill={c} opacity={0.8} />
              <text x={x + bw/2} y={h + 14} textAnchor="middle" fontSize={8} fill="var(--text-muted)">{i + 1}</text>
            </g>
          );
        })}
        <line x1={pad} y1={h} x2={Math.max(w, 280) - pad} y2={h} stroke="var(--border)" strokeWidth={1} />
      </svg>
    </div>
  );
}
function TwoBarSVG({ a, b, labels }: { a: number[]; b: number[]; labels: string[] }) {
  const max = Math.max(...a, ...b, 1);
  const bw = 14, gap = 4, grp = 8, h = 90, pad = 10;
  const w = a.length * (bw * 2 + gap + grp) + pad * 2;
  return (
    <div style={{ overflowX: "auto", gridColumn: "1 / -1" }}>
      <svg width={Math.max(w, 280)} height={h + 30} viewBox={`0 0 ${Math.max(w, 280)} ${h + 30}`}>
        {a.map((_, i) => {
          const gx = pad + i * (bw * 2 + gap + grp);
          const ah = Math.max(3, (a[i] / max) * (h - 10));
          const bh = Math.max(3, (b[i] / max) * (h - 10));
          return (
            <g key={i}>
              <rect x={gx} y={h - ah} width={bw} height={ah} rx={2} fill={NAVY} opacity={0.75} />
              <rect x={gx + bw + gap} y={h - bh} width={bw} height={bh} rx={2} fill={GOLD} opacity={0.85} />
              <text x={gx + bw} y={h + 14} textAnchor="middle" fontSize={8} fill="var(--text-muted)">{labels[i]}</text>
            </g>
          );
        })}
        <line x1={pad} y1={h} x2={Math.max(w, 280) - pad} y2={h} stroke="var(--border)" strokeWidth={1} />
      </svg>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: NAVY, borderRadius: 2, marginRight: 3 }} />Invested</span>
        <span><span style={{ display: "inline-block", width: 8, height: 8, background: GOLD, borderRadius: 2, marginRight: 3 }} />Value</span>
      </div>
    </div>
  );
}
function LineAreaSVG({ data, color = GOLD, label = "" }: { data: number[]; color?: string; label?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data, min + 1);
  const w = 280, h = 80, px = 10, py = 8;
  const pts = data.map((v, i) => {
    const x = px + (i / (data.length - 1)) * (w - 2 * px);
    const y = py + (1 - (v - min) / (max - min)) * (h - 2 * py);
    return `${x},${y}`;
  }).join(" ");
  const areaClose = `${w - px},${h - py} ${px},${h - py}`;
  return (
    <div style={{ marginTop: 8, gridColumn: "1 / -1" }}>
      {label && <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>}
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="lag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${pts} ${areaClose}`} fill="url(#lag)" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* ─── CALCULATORS ─────────────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────────────────── */

/* 1. Salary Tax ──────────────────────────────────────────────────────────── */
function SalaryTax() {
  const [monthly, setMonthly] = useState("100000");
  const [fy, setFy] = useState("2026-27");
  const [pension, setPension] = useState("0");
  const [zakat, setZakat] = useState("0");
  type R = { gross: number; tax: number; slab: number; pensionRebate: number; zakatRebate: number; netTax: number; netAnnual: number; effectiveRate: number };
  const [res, setRes] = useState<R | null>(null);

  function calc() {
    const gross = n(monthly) * 12;
    // FBR slabs — FY 2025-26 / 2026-27 (same for salaried)
    let tax = 0, slab = 0;
    if (gross <= 600_000)       { tax = 0;                                        slab = 0; }
    else if (gross <= 1_200_000){ tax = (gross - 600_000) * 0.05;                slab = 1; }
    else if (gross <= 2_400_000){ tax = 30_000 + (gross - 1_200_000) * 0.15;     slab = 2; }
    else if (gross <= 3_600_000){ tax = 210_000 + (gross - 2_400_000) * 0.25;    slab = 3; }
    else if (gross <= 6_000_000){ tax = 510_000 + (gross - 3_600_000) * 0.30;    slab = 4; }
    else                        { tax = 1_230_000 + (gross - 6_000_000) * 0.35;  slab = 5; }
    const pensionRebate = Math.min(n(pension), gross * 0.20) * 0.20;
    const zakatRebate   = n(zakat) * 1.0;
    const netTax = Math.max(0, tax - pensionRebate - zakatRebate);
    setRes({ gross, tax, slab, pensionRebate, zakatRebate, netTax, netAnnual: gross - netTax, effectiveRate: gross > 0 ? (netTax / gross) * 100 : 0 });
  }

  const SLABS = ["0% — up to 600K","5% on excess of 600K","15% on excess of 1.2M","25% on excess of 2.4M","30% on excess of 3.6M","35% on excess of 6M"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Sel label="Tax Year" value={fy} onChange={setFy} options={[{ value: "2026-27", label: "FY 2026-27" },{ value: "2025-26", label: "FY 2025-26" }]} />
      <Input label="Monthly Salary (PKR)" value={monthly} onChange={setMonthly} prefix="₨" />
      <Input label="Annual Pension Investment (PKR)" value={pension} onChange={setPension} prefix="₨" />
      <Input label="Annual Zakat Paid (PKR)" value={zakat} onChange={setZakat} prefix="₨" />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <div style={{ background: "rgba(212,151,26,0.07)", borderRadius: 10, padding: "12px 14px", border: `1px solid rgba(212,151,26,0.2)` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tax Slab {res.slab + 1} — {SLABS[res.slab]}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", marginTop: 4 }}>₨{fmtM(res.netTax)} <span style={{ fontSize: 13, color: "var(--text-muted)" }}>/ year</span></div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Effective rate: {fmt(res.effectiveRate)}%</div>
        </div>
        <Row label="Gross Annual Salary" value={`₨${fmtM(res.gross)}`} />
        <Row label="Base Tax (FBR)" value={`₨${fmtM(res.tax)}`} color="#dc2626" />
        <Row label="Pension Rebate" value={res.pensionRebate > 0 ? `-₨${fmtM(res.pensionRebate)}` : "—"} color="#16a34a" />
        <Row label="Zakat Rebate" value={res.zakatRebate > 0 ? `-₨${fmtM(res.zakatRebate)}` : "—"} color="#16a34a" />
        <Row label="Net Annual Tax" value={`₨${fmtM(res.netTax)}`} highlight color="#dc2626" />
        <Row label="Monthly Tax" value={`₨${fmtM(res.netTax / 12)}`} />
        <Row label="Net Monthly Take-Home" value={`₨${fmtM(res.netAnnual / 12)}`} highlight color="#16a34a" />
        <Sec>FBR Tax Slabs {fy}</Sec>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead><tr>{["Slab","Annual Income","Rate"].map(h => <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: "var(--text-muted)", fontWeight: 700, fontSize: 10, borderBottom: "1px solid var(--border)" }}>{h}</th>)}</tr></thead>
          <tbody>
            {[["1","Up to 600K","0%"],["2","600K – 1.2M","5%"],["3","1.2M – 2.4M","15%"],["4","2.4M – 3.6M","25%"],["5","3.6M – 6M","30%"],["6","Above 6M","35%"]].map(([s,r,p],i) => (
              <tr key={i} style={{ background: res.slab === i ? "rgba(212,151,26,0.06)" : "transparent" }}>
                <td style={{ padding: "5px 8px", fontWeight: 600, color: res.slab === i ? GOLD : "var(--text-primary)" }}>{s}</td>
                <td style={{ padding: "5px 8px", color: "var(--text-muted)" }}>{r}</td>
                <td style={{ padding: "5px 8px", fontWeight: 700, color: res.slab === i ? GOLD : "var(--text-primary)" }}>{p}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>)}
    </div>
  );
}

/* 2. Zakat ───────────────────────────────────────────────────────────────── */
function ZakatCalc() {
  const [cash, setCash] = useState("500000");
  const [gold, setGold] = useState("0");
  const [stocks, setStocks] = useState("0");
  const [loans, setLoans] = useState("0");
  const NISAB_PKR = 1_248_000; // ~87.48g gold at current price
  type R = { total: number; zakat: number; eligible: boolean };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const total = n(cash) + n(gold) + n(stocks) - n(loans);
    const eligible = total >= NISAB_PKR;
    setRes({ total, zakat: eligible ? total * 0.025 : 0, eligible });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Cash & Bank Balance (PKR)" value={cash} onChange={setCash} prefix="₨" />
      <Input label="Gold & Jewellery Value (PKR)" value={gold} onChange={setGold} prefix="₨" />
      <Input label="Stock Portfolio Value (PKR)" value={stocks} onChange={setStocks} prefix="₨" />
      <Input label="Outstanding Loans / Debts (PKR)" value={loans} onChange={setLoans} prefix="₨" />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <div style={{ borderRadius: 10, padding: "12px 14px", background: res.eligible ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.07)", border: `1px solid ${res.eligible ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: res.eligible ? "#16a34a" : "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em" }}>{res.eligible ? "Zakat Applicable" : "Below Nisab — No Zakat"}</div>
          {res.eligible && <div style={{ fontSize: 22, fontWeight: 900, color: "#16a34a", marginTop: 4 }}>₨{fmtM(res.zakat)}</div>}
        </div>
        <Row label="Total Zakatable Assets" value={`₨${fmtM(res.total)}`} />
        <Row label="Nisab Threshold (Gold)" value={`₨${fmtM(NISAB_PKR)}`} />
        <Row label="Zakat Rate" value="2.5%" />
        <Row label="Zakat Due" value={res.eligible ? `₨${fmtM(res.zakat)}` : "N/A"} highlight color={res.eligible ? "#16a34a" : "#dc2626"} />
      </div>)}
    </div>
  );
}

/* 3. Apna Ghar ───────────────────────────────────────────────────────────── */
function ApnaGhar() {
  const [price, setPrice] = useState("5000000");
  const [down, setDown] = useState("20");
  const [tenure, setTenure] = useState("20");
  const [rate1, setRate1] = useState("7");
  const [rate11, setRate11] = useState("12");
  type R = { loan: number; emi1: number; emi11: number; total1: number; total11: number; totalInterest: number };
  const [res, setRes] = useState<R | null>(null);
  function emi(p: number, r: number, t: number) {
    const mr = r / 100 / 12, m = t * 12;
    if (r === 0) return p / m;
    return p * mr * Math.pow(1 + mr, m) / (Math.pow(1 + mr, m) - 1);
  }
  function calc() {
    const loan = n(price) * (1 - n(down) / 100);
    const t = n(tenure), t1 = Math.min(10, t), t2 = Math.max(0, t - 10);
    const e1 = emi(loan, n(rate1), t);
    const remBal = loan - (e1 * t1 * 12 - loan * (Math.pow(1 + n(rate1)/100/12, t1*12) - 1) / (Math.pow(1 + n(rate1)/100/12, t) - 1) * loan);
    const e2 = t2 > 0 ? emi(Math.max(0, remBal), n(rate11), t2) : 0;
    const tot1 = e1 * t1 * 12, tot2 = e2 * t2 * 12;
    setRes({ loan, emi1: e1, emi11: e2, total1: tot1, total11: tot2, totalInterest: tot1 + tot2 - loan });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Property Price (PKR)" value={price} onChange={setPrice} prefix="₨" />
      <Input label="Down Payment (%)" value={down} onChange={setDown} prefix="%" />
      <Input label="Loan Tenure (Years)" value={tenure} onChange={setTenure} />
      <Input label="Rate Years 1–10 (%)" value={rate1} onChange={setRate1} prefix="%" />
      <Input label="Rate Year 11+ (%)" value={rate11} onChange={setRate11} prefix="%" />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <div style={{ borderRadius: 10, padding: "12px 14px", background: "rgba(212,151,26,0.07)", border: "1px solid rgba(212,151,26,0.2)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.06em" }}>Monthly EMI (Yrs 1–10)</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)" }}>₨{fmtM(res.emi1)}</div>
        </div>
        <Row label="Loan Amount" value={`₨${fmtM(res.loan)}`} />
        <Row label="EMI Years 1–10" value={`₨${fmtM(res.emi1)}`} />
        {res.emi11 > 0 && <Row label="EMI Year 11+ (reset)" value={`₨${fmtM(res.emi11)}`} color="#dc2626" />}
        <Row label="Total Payment Yrs 1–10" value={`₨${fmtM(res.total1)}`} />
        {res.total11 > 0 && <Row label="Total Payment Yr 11+" value={`₨${fmtM(res.total11)}`} />}
        <Row label="Total Interest" value={`₨${fmtM(res.totalInterest)}`} color="#dc2626" highlight />
      </div>)}
    </div>
  );
}

/* 4. Microfinance Loan ───────────────────────────────────────────────────── */
function MicroFinance() {
  const [principal, setPrincipal] = useState("100000");
  const [rate, setRate] = useState("30");
  const [months, setMonths] = useState("12");
  const [bankRate, setBankRate] = useState("22");
  type R = { emi: number; total: number; interest: number; apr: number; bankEmi: number; bankTotal: number; extraCost: number };
  const [res, setRes] = useState<R | null>(null);
  function emi(p: number, r: number, m: number) { const mr = r/100/12; if (mr===0) return p/m; return p * mr * Math.pow(1+mr,m)/(Math.pow(1+mr,m)-1); }
  function calc() {
    const p = n(principal), r = n(rate), m = n(months), br = n(bankRate);
    const e = emi(p, r, m), tot = e * m, int = tot - p;
    const apr = ((tot / p) - 1) * (12 / m) * 100;
    const be = emi(p, br, m), bt = be * m;
    setRes({ emi: e, total: tot, interest: int, apr, bankEmi: be, bankTotal: bt, extraCost: tot - bt });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Loan Amount (PKR)" value={principal} onChange={setPrincipal} prefix="₨" />
      <Input label="Microfinance Rate (%/yr)" value={rate} onChange={setRate} prefix="%" />
      <Input label="Tenure (Months)" value={months} onChange={setMonths} />
      <Input label="Bank Rate for Comparison (%)" value={bankRate} onChange={setBankRate} prefix="%" />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <Row label="Monthly EMI" value={`₨${fmtM(res.emi)}`} highlight />
        <Row label="Total Payment" value={`₨${fmtM(res.total)}`} />
        <Row label="Total Interest" value={`₨${fmtM(res.interest)}`} color="#dc2626" />
        <Row label="Effective APR" value={`${fmt(res.apr)}%`} color="#dc2626" highlight />
        <Sec>vs. Bank Facility at {bankRate}%</Sec>
        <Row label="Bank EMI" value={`₨${fmtM(res.bankEmi)}`} />
        <Row label="Bank Total Payment" value={`₨${fmtM(res.bankTotal)}`} />
        <Row label="Extra Cost (MF vs Bank)" value={`₨${fmtM(res.extraCost)}`} color="#dc2626" />
      </div>)}
    </div>
  );
}

/* 5. CAGR ────────────────────────────────────────────────────────────────── */
function CAGRCalc() {
  const [start, setStart] = useState("100000");
  const [end, setEnd]     = useState("250000");
  const [years, setYears] = useState("5");
  type R = { cagr: number; total: number; data: number[] };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const s = n(start), e = n(end), y = n(years);
    if (s <= 0 || e <= 0 || y <= 0) return;
    const cagr = (Math.pow(e / s, 1 / y) - 1) * 100;
    const data = Array.from({ length: Math.ceil(y) + 1 }, (_, i) => s * Math.pow(1 + cagr/100, i));
    setRes({ cagr, total: ((e - s) / s) * 100, data });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Starting Value (PKR)" value={start} onChange={setStart} prefix="₨" />
      <Input label="Ending Value (PKR)" value={end} onChange={setEnd} prefix="₨" />
      <Input label="Number of Years" value={years} onChange={setYears} />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <div style={{ borderRadius: 10, padding: "12px 14px", background: "rgba(212,151,26,0.07)", border: "1px solid rgba(212,151,26,0.2)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: "uppercase" }}>CAGR</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: res.cagr >= 0 ? "#16a34a" : "#dc2626" }}>{fmt(res.cagr)}%</div>
        </div>
        <Row label="Total Return" value={`${fmt(res.total)}%`} />
        <Row label="Start Value" value={`₨${fmtM(n(start))}`} />
        <Row label="End Value"   value={`₨${fmtM(n(end))}`} />
        <LineAreaSVG data={res.data} color={GOLD} label="Growth Curve" />
      </div>)}
    </div>
  );
}

/* 6. SIP ─────────────────────────────────────────────────────────────────── */
function SIPCalc() {
  const [monthly, setMonthly] = useState("10000");
  const [rate, setRate]       = useState("15");
  const [yrs, setYrs]         = useState("10");
  type Row2 = { yr: number; invested: number; value: number; gain: number };
  const [rows, setRows] = useState<Row2[]>([]);
  function calc() {
    const p = n(monthly), r = n(rate)/100/12, y = n(yrs);
    const data: Row2[] = [];
    for (let yr = 1; yr <= y; yr++) {
      const m = yr * 12;
      const val = p * (Math.pow(1 + r, m) - 1) / r * (1 + r);
      data.push({ yr, invested: p * m, value: Math.round(val), gain: Math.round(val - p * m) });
    }
    setRows(data);
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Monthly SIP Amount (PKR)" value={monthly} onChange={setMonthly} prefix="₨" />
      <Input label="Expected Annual Return (%)" value={rate} onChange={setRate} prefix="%" />
      <Input label="Investment Period (Years)" value={yrs} onChange={setYrs} />
      <Btn onClick={calc} />
      {rows.length > 0 && (<div style={{ gridColumn: "1 / -1" }}>
        <TwoBarSVG a={rows.map(r => r.invested)} b={rows.map(r => r.value)} labels={rows.map(r => `Y${r.yr}`)} />
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginTop: 4 }}>
          <thead><tr>{["Year","Invested","Value","Gain"].map(h => <th key={h} style={{ padding: "6px 8px", textAlign: "right", color: "var(--text-muted)", fontWeight: 700, fontSize: 10, borderBottom: "1px solid var(--border)" }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.yr} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 600 }}>Yr {r.yr}</td>
                <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--text-muted)" }}>₨{fmtM(r.invested)}</td>
                <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 700 }}>₨{fmtM(r.value)}</td>
                <td style={{ padding: "5px 8px", textAlign: "right", color: "#16a34a", fontWeight: 700 }}>+₨{fmtM(r.gain)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>)}
    </div>
  );
}

/* 7. Compounding ─────────────────────────────────────────────────────────── */
function CompoundingCalc() {
  const [principal, setPrincipal] = useState("500000");
  const [rate, setRate]           = useState("18");
  const [years, setYears]         = useState("10");
  const [freq, setFreq]           = useState("12");
  type Row2 = { yr: number; value: number; interest: number };
  const [rows, setRows] = useState<Row2[]>([]);
  function calc() {
    const p = n(principal), r = n(rate)/100, y = n(years), f = n(freq);
    const data: Row2[] = [];
    for (let yr = 1; yr <= y; yr++) {
      const val = p * Math.pow(1 + r/f, f * yr);
      data.push({ yr, value: Math.round(val), interest: Math.round(val - p) });
    }
    setRows(data);
  }
  const last = rows[rows.length - 1];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Principal (PKR)" value={principal} onChange={setPrincipal} prefix="₨" />
      <Input label="Annual Rate (%)" value={rate} onChange={setRate} prefix="%" />
      <Input label="Years" value={years} onChange={setYears} />
      <Sel label="Compounding Frequency" value={freq} onChange={setFreq} options={[{value:"1",label:"Annual"},{value:"4",label:"Quarterly"},{value:"12",label:"Monthly"},{value:"365",label:"Daily"}]} />
      <Btn onClick={calc} />
      {last && (<div style={{ gridColumn: "1 / -1" }}>
        <div style={{ borderRadius: 10, padding: "12px 14px", background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>Final Value after {years} years</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#16a34a" }}>₨{fmtM(last.value)}</div>
        </div>
        <LineAreaSVG data={rows.map(r => r.value)} color="#16a34a" label="Portfolio Growth" />
        <Row label="Principal" value={`₨${fmtM(n(principal))}`} />
        <Row label="Total Interest Earned" value={`₨${fmtM(last.interest)}`} color="#16a34a" highlight />
        <Row label="Total Return" value={`${fmt(((last.value / n(principal)) - 1) * 100)}%`} />
      </div>)}
    </div>
  );
}

/* 8. Depreciation ───────────────────────────────────────────────────────── */
function DepreciationCalc() {
  const [assetVal, setAssetVal] = useState("1000000");
  const [salvage, setSalvage]   = useState("100000");
  const [life, setLife]         = useState("5");
  const [method, setMethod]     = useState("sl");
  const [inflation, setInflation] = useState("12");
  type Row2 = { yr: number; dep: number; bookVal: number; realVal: number };
  const [rows, setRows] = useState<Row2[]>([]);
  function calc() {
    const av = n(assetVal), sv = n(salvage), ly = n(life), inf = n(inflation)/100;
    const data: Row2[] = [];
    let bv = av;
    for (let yr = 1; yr <= ly; yr++) {
      let dep = 0;
      if (method === "sl") dep = (av - sv) / ly;
      else dep = bv * (2 / ly); // double declining
      dep = Math.min(dep, Math.max(0, bv - sv));
      bv -= dep;
      data.push({ yr, dep: Math.round(dep), bookVal: Math.round(bv), realVal: Math.round(av / Math.pow(1 + inf, yr)) });
    }
    setRows(data);
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Asset Cost (PKR)" value={assetVal} onChange={setAssetVal} prefix="₨" />
      <Input label="Salvage Value (PKR)" value={salvage} onChange={setSalvage} prefix="₨" />
      <Input label="Useful Life (Years)" value={life} onChange={setLife} />
      <Sel label="Method" value={method} onChange={setMethod} options={[{value:"sl",label:"Straight Line"},{value:"db",label:"Double Declining Balance"}]} />
      <Input label="Inflation Rate (%/yr)" value={inflation} onChange={setInflation} prefix="%" />
      <Btn onClick={calc} />
      {rows.length > 0 && (<div style={{ gridColumn: "1 / -1" }}>
        <LineAreaSVG data={rows.map(r => r.bookVal)} color={GOLD} label="Book Value over Life" />
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginTop: 4 }}>
          <thead><tr>{["Year","Depreciation","Book Value","Real Value*"].map(h => <th key={h} style={{ padding: "6px 8px", textAlign: "right", color: "var(--text-muted)", fontWeight: 700, fontSize: 10, borderBottom: "1px solid var(--border)" }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.yr} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "5px 8px", textAlign: "right", fontWeight: 600 }}>Yr {r.yr}</td>
                <td style={{ padding: "5px 8px", textAlign: "right", color: "#dc2626" }}>₨{fmtM(r.dep)}</td>
                <td style={{ padding: "5px 8px", textAlign: "right" }}>₨{fmtM(r.bookVal)}</td>
                <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--text-muted)" }}>₨{fmtM(r.realVal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 4 }}>* Real Value adjusted for {inflation}% inflation</div>
      </div>)}
    </div>
  );
}

/* 9. Exchange Rate ───────────────────────────────────────────────────────── */
function ExchangeRate() {
  const [amount, setAmount] = useState("100000");
  const [base, setBase]     = useState("PKR");
  // PKR rates (approx Aug 2026)
  const RATES: Record<string, number> = { PKR: 1, USD: 278.50, EUR: 308.20, GBP: 359.80, SAR: 74.25, AED: 75.80, JPY: 1.88, CNY: 38.40, CAD: 205.30, AUD: 182.60 };
  const NAMES: Record<string, string> = { PKR: "Pakistan Rupee", USD: "US Dollar", EUR: "Euro", GBP: "British Pound", SAR: "Saudi Riyal", AED: "UAE Dirham", JPY: "Japanese Yen", CNY: "Chinese Yuan", CAD: "Canadian Dollar", AUD: "Australian Dollar" };
  const basePKR = (n(amount) / RATES[base]) * RATES.PKR;
  const currencies = Object.keys(RATES).filter(c => c !== base);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Amount" value={amount} onChange={setAmount} />
      <Sel label="From Currency" value={base} onChange={setBase} options={Object.keys(RATES).map(c => ({ value: c, label: `${c} — ${NAMES[c]}` }))} />
      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, gridColumn: "1 / -1" }}>Indicative rates — Aug 2026</div>
      <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", gridColumn: "1 / -1" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr>{["Currency","Rate (per PKR)","Converted"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, fontSize: 10, background: NAVY, color: "rgba(255,255,255,0.7)" }}>{h}</th>)}</tr></thead>
          <tbody>
            {currencies.map(c => {
              const inPKR = basePKR;
              const converted = inPKR / RATES[c];
              return (
                <tr key={c} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "7px 10px", fontWeight: 700 }}>{c} <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 400 }}>{NAMES[c]}</span></td>
                  <td style={{ padding: "7px 10px", textAlign: "right", color: "var(--text-muted)" }}>1 PKR = {(1/RATES[c]).toFixed(5)} {c}</td>
                  <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700, color: GOLD, fontVariantNumeric: "tabular-nums" }}>{fmt(converted, 4)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* 10. ROI ────────────────────────────────────────────────────────────────── */
function ROICalc() {
  const [buyP, setBuyP]   = useState("150");
  const [sellP, setSellP] = useState("210");
  const [qty, setQty]     = useState("1000");
  const [divs, setDivs]   = useState("5000");
  const [days, setDays]   = useState("365");
  type R = { invested: number; proceeds: number; totalReturn: number; pct: number; annualized: number; pnl: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const inv = n(buyP) * n(qty), proc = n(sellP) * n(qty) + n(divs);
    const pnl = proc - inv, pct = inv > 0 ? (pnl / inv) * 100 : 0;
    const ann = inv > 0 && n(days) > 0 ? (Math.pow(proc / inv, 365 / n(days)) - 1) * 100 : 0;
    setRes({ invested: inv, proceeds: proc, totalReturn: pct, pct, annualized: ann, pnl });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Buy Price (PKR)" value={buyP} onChange={setBuyP} prefix="₨" />
      <Input label="Sell Price (PKR)" value={sellP} onChange={setSellP} prefix="₨" />
      <Input label="Quantity (Shares)" value={qty} onChange={setQty} />
      <Input label="Dividends Received (PKR)" value={divs} onChange={setDivs} prefix="₨" />
      <Input label="Holding Period (Days)" value={days} onChange={setDays} />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <div style={{ borderRadius: 10, padding: "12px 14px", background: res.pnl >= 0 ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.07)", border: `1px solid ${res.pnl >= 0 ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: res.pnl >= 0 ? "#16a34a" : "#dc2626", textTransform: "uppercase" }}>Net P&L</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: res.pnl >= 0 ? "#16a34a" : "#dc2626" }}>{res.pnl >= 0 ? "+" : ""}₨{fmtM(res.pnl)}</div>
        </div>
        <Row label="Capital Invested" value={`₨${fmtM(res.invested)}`} />
        <Row label="Total Proceeds (incl. div)" value={`₨${fmtM(res.proceeds)}`} />
        <Row label="Total ROI" value={`${fmt(res.pct)}%`} highlight color={res.pct >= 0 ? "#16a34a" : "#dc2626"} />
        <Row label="Annualized Return" value={`${fmt(res.annualized)}%`} color={res.annualized >= 0 ? "#16a34a" : "#dc2626"} />
      </div>)}
    </div>
  );
}

/* 11. DCF Valuation ─────────────────────────────────────────────────────── */
function DCFCalc() {
  const [fcf, setFcf]         = useState("50000000");
  const [growth, setGrowth]   = useState("15");
  const [tGrowth, setTGrowth] = useState("5");
  const [wacc, setWacc]       = useState("12");
  const [years, setYears]     = useState("5");
  const [shares, setShares]   = useState("500000000");
  const [curPrice, setCurPrice] = useState("150");
  type R = { intrinsic: number; perShare: number; upside: number; fcfs: number[]; pvs: number[]; tv: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const r = n(wacc)/100, g = n(growth)/100, tg = n(tGrowth)/100, y = n(years);
    let cashflow = n(fcf);
    let totalPV = 0;
    const fcfs: number[] = [], pvs: number[] = [];
    for (let i = 1; i <= y; i++) {
      cashflow *= (1 + g);
      const pv = cashflow / Math.pow(1 + r, i);
      fcfs.push(cashflow); pvs.push(pv); totalPV += pv;
    }
    const tv = (fcfs[fcfs.length - 1] * (1 + tg)) / (r - tg);
    const pvTV = tv / Math.pow(1 + r, y);
    const intrinsic = totalPV + pvTV;
    const perShare = n(shares) > 0 ? intrinsic / n(shares) : 0;
    const upside = n(curPrice) > 0 ? ((perShare / n(curPrice)) - 1) * 100 : 0;
    setRes({ intrinsic, perShare, upside, fcfs, pvs, tv });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Current Free Cash Flow (PKR)" value={fcf} onChange={setFcf} prefix="₨" />
      <Input label="FCF Growth Rate (%/yr)" value={growth} onChange={setGrowth} prefix="%" />
      <Input label="Terminal Growth Rate (%)" value={tGrowth} onChange={setTGrowth} prefix="%" />
      <Input label="Discount Rate / WACC (%)" value={wacc} onChange={setWacc} prefix="%" />
      <Input label="Projection Years" value={years} onChange={setYears} />
      <Input label="Total Shares Outstanding" value={shares} onChange={setShares} />
      <Input label="Current Market Price (PKR)" value={curPrice} onChange={setCurPrice} prefix="₨" />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <div style={{ borderRadius: 10, padding: "12px 14px", background: res.upside >= 0 ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.07)", border: `1px solid ${res.upside >= 0 ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: res.upside >= 0 ? "#16a34a" : "#dc2626", textTransform: "uppercase" }}>Intrinsic Value per Share</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)" }}>₨{fmt(res.perShare)}</div>
          <div style={{ fontSize: 12, color: res.upside >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{res.upside >= 0 ? "▲" : "▼"} {fmt(Math.abs(res.upside))}% {res.upside >= 0 ? "Upside" : "Downside"} vs ₨{curPrice}</div>
        </div>
        <Row label="Enterprise Value (DCF)" value={`₨${fmtM(res.intrinsic)}`} highlight />
        <Row label="Terminal Value" value={`₨${fmtM(res.tv)}`} />
        <Row label="Current Market Price" value={`₨${n(curPrice)}`} />
        <Row label="Verdict" value={res.upside >= 10 ? "✅ Undervalued" : res.upside <= -10 ? "🔴 Overvalued" : "⚠ Fairly Valued"} />
        <BarSVG data={res.pvs} color={GOLD} label={`Present Value of FCFs — Year 1 to ${years}`} />
      </div>)}
    </div>
  );
}

/* 12. Peter Lynch PEG ───────────────────────────────────────────────────── */
function PeterLynch() {
  const [eps, setEps]       = useState("15");
  const [epsGrowth, setEpsGrowth] = useState("20");
  const [divYield, setDivYield]   = useState("3");
  const [curPE, setCurPE]   = useState("12");
  const [curPrice, setCurPrice]   = useState("180");
  type R = { fairPE: number; fairValue: number; peg: number; upside: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const eg = n(epsGrowth), dy = n(divYield), pe = n(curPE), e = n(eps), cp = n(curPrice);
    const fairPE = eg + dy; // Lynch formula: Fair P/E = EPS growth + Dividend yield
    const fairValue = fairPE * e;
    const peg = pe / eg;
    const upside = cp > 0 ? ((fairValue / cp) - 1) * 100 : 0;
    setRes({ fairPE, fairValue, peg, upside });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="EPS (PKR)" value={eps} onChange={setEps} prefix="₨" />
      <Input label="EPS Growth Rate (%/yr)" value={epsGrowth} onChange={setEpsGrowth} prefix="%" />
      <Input label="Dividend Yield (%)" value={divYield} onChange={setDivYield} prefix="%" />
      <Input label="Current P/E Ratio" value={curPE} onChange={setCurPE} />
      <Input label="Current Market Price (PKR)" value={curPrice} onChange={setCurPrice} prefix="₨" />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <div style={{ borderRadius: 10, padding: "12px 14px", background: "rgba(212,151,26,0.07)", border: "1px solid rgba(212,151,26,0.2)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: "uppercase" }}>Fair Value (Peter Lynch)</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)" }}>₨{fmt(res.fairValue)}</div>
        </div>
        <Row label="Fair P/E (Growth + Div Yield)" value={fmt(res.fairPE)} />
        <Row label="PEG Ratio" value={fmt(res.peg)} highlight color={res.peg < 1 ? "#16a34a" : res.peg > 2 ? "#dc2626" : GOLD} />
        <Row label="PEG Signal" value={res.peg < 1 ? "✅ Undervalued" : res.peg > 2 ? "🔴 Overvalued" : "⚠ Fair Range"} />
        <Row label="Upside / Downside" value={`${res.upside >= 0 ? "+" : ""}${fmt(res.upside)}%`} color={res.upside >= 0 ? "#16a34a" : "#dc2626"} />
        <Sec>PEG Interpretation</Sec>
        {[["PEG < 1","Undervalued — potential buy","#16a34a"],["PEG = 1","Fairly valued","#D4971A"],["PEG > 2","Overvalued — caution","#dc2626"]].map(([l,d,c]) => (
          <div key={l} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border)", alignItems: "flex-start" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: c as string, flexShrink: 0 }}>{l}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{d}</span>
          </div>
        ))}
      </div>)}
    </div>
  );
}

/* 13. Drawdown ────────────────────────────────────────────────────────────── */
function DrawdownCalc() {
  const [peak, setPeak]   = useState("1000000");
  const [trough, setTrough] = useState("650000");
  const [recovery, setRecovery] = useState("12");
  type R = { dd: number; lossAmt: number; recNeeded: number; recMonths: number; recYears: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const p = n(peak), t = n(trough), rm = n(recovery) / 100 / 12;
    const dd = p > 0 ? ((p - t) / p) * 100 : 0;
    const lossAmt = p - t;
    const recNeeded = p > 0 ? ((p / t) - 1) * 100 : 0;
    const recMonths = rm > 0 && t > 0 ? Math.log(p / t) / Math.log(1 + rm) : 0;
    setRes({ dd, lossAmt, recNeeded, recMonths, recYears: recMonths / 12 });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Portfolio Peak Value (PKR)" value={peak} onChange={setPeak} prefix="₨" />
      <Input label="Portfolio Trough Value (PKR)" value={trough} onChange={setTrough} prefix="₨" />
      <Input label="Expected Recovery Rate (%/yr)" value={recovery} onChange={setRecovery} prefix="%" />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <div style={{ borderRadius: 10, padding: "12px 14px", background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", textTransform: "uppercase" }}>Maximum Drawdown</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#dc2626" }}>-{fmt(res.dd)}%</div>
        </div>
        <Row label="Loss Amount" value={`-₨${fmtM(res.lossAmt)}`} color="#dc2626" />
        <Row label="Return Needed to Recover" value={`${fmt(res.recNeeded)}%`} highlight />
        <Row label="Time to Recover" value={`${fmt(res.recYears)} years (at ${recovery}%/yr)`} />
        <Sec>Drawdown Risk Guide</Sec>
        {[["< 10%","Minor — normal market noise","#16a34a"],["10–20%","Moderate — correction phase","#D4971A"],["20–40%","Severe — bear market","#dc2626"],["> 40%","Catastrophic — capital at risk","#7f1d1d"]].map(([l,d,c]) => (
          <div key={l} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: c as string, flexShrink: 0, minWidth: 60 }}>{l}</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{d}</span>
          </div>
        ))}
      </div>)}
    </div>
  );
}

/* 14. Brokerage / Deduction ─────────────────────────────────────────────── */
function BrokerageCalc() {
  const [price, setPrice]   = useState("200");
  const [qty, setQty]       = useState("1000");
  const [side, setSide]     = useState("buy");
  type R = { gross: number; commission: number; nccpl: number; cdc: number; psxFee: number; salesTax: number; wht: number; stamp: number; total: number; net: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const gross = n(price) * n(qty);
    const commission = gross * 0.0015;
    const nccpl      = gross * 0.0010;
    const cdc        = gross * 0.0002;
    const psxFee     = gross * 0.0002;
    const salesTax   = commission * 0.17;
    const wht        = side === "sell" ? gross * 0.00015 : 0;
    const stamp      = gross * 0.000015;
    const total = commission + nccpl + cdc + psxFee + salesTax + wht + stamp;
    setRes({ gross, commission, nccpl, cdc, psxFee, salesTax, wht, stamp, total, net: side === "buy" ? gross + total : gross - total });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Share Price (PKR)" value={price} onChange={setPrice} prefix="₨" />
      <Input label="Quantity" value={qty} onChange={setQty} />
      <Sel label="Transaction Side" value={side} onChange={setSide} options={[{value:"buy",label:"Buy"},{value:"sell",label:"Sell"}]} />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <Row label="Gross Value" value={`₨${fmtM(res.gross)}`} />
        <Sec>PSX Charges Breakdown</Sec>
        <Row label="Commission (0.15%)" value={`₨${fmtM(res.commission)}`} />
        <Row label="NCCPL (0.10%)"      value={`₨${fmtM(res.nccpl)}`} />
        <Row label="CDC (0.02%)"         value={`₨${fmtM(res.cdc)}`} />
        <Row label="PSX Fee (0.02%)"     value={`₨${fmtM(res.psxFee)}`} />
        <Row label="Sales Tax (17%)"     value={`₨${fmtM(res.salesTax)}`} />
        {res.wht > 0 && <Row label="WHT on Sell (0.015%)" value={`₨${fmtM(res.wht)}`} />}
        <Row label="Stamp Duty (0.0015%)" value={`₨${fmtM(res.stamp)}`} />
        <Row label="Total Charges" value={`₨${fmtM(res.total)}`} highlight color="#dc2626" />
        <Row label={side === "buy" ? "Net Cost (incl. charges)" : "Net Proceeds (after charges)"} value={`₨${fmtM(res.net)}`} highlight color="#16a34a" />
      </div>)}
    </div>
  );
}

/* 15. Margin Calculator ─────────────────────────────────────────────────── */
function MarginCalc() {
  const [investment, setInvestment] = useState("500000");
  const [leverage, setLeverage]     = useState("3");
  const [rate, setRate]             = useState("22");
  const [days, setDays]             = useState("30");
  type R = { totalExp: number; borrowed: number; dailyInt: number; periodInt: number; marginCall: number; liqPrice: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const inv = n(investment), lev = n(leverage), r = n(rate)/100/365, d = n(days);
    const totalExp = inv * lev;
    const borrowed = totalExp - inv;
    const dailyInt = borrowed * r;
    const periodInt = dailyInt * d;
    const marginCall = totalExp * 0.70; // 30% drop triggers margin call
    setRes({ totalExp, borrowed, dailyInt, periodInt, marginCall, liqPrice: 0 });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Your Capital (PKR)" value={investment} onChange={setInvestment} prefix="₨" />
      <Input label="Leverage Ratio" value={leverage} onChange={setLeverage} />
      <Input label="Financing Rate (%/yr)" value={rate} onChange={setRate} prefix="%" />
      <Input label="Holding Period (Days)" value={days} onChange={setDays} />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <Row label="Total Exposure" value={`₨${fmtM(res.totalExp)}`} highlight />
        <Row label="Borrowed Capital" value={`₨${fmtM(res.borrowed)}`} />
        <Row label="Daily Interest" value={`₨${fmtM(res.dailyInt)}`} color="#dc2626" />
        <Row label={`Interest for ${days} days`} value={`₨${fmtM(res.periodInt)}`} color="#dc2626" highlight />
        <Row label="Margin Call Level (30% drop)" value={`₨${fmtM(res.marginCall)}`} color="#dc2626" />
      </div>)}
    </div>
  );
}

/* 16. Position Sizing (PSX) ─────────────────────────────────────────────── */
function PositionSizing() {
  const [capital, setCapital]   = useState("1000000");
  const [risk, setRisk]         = useState("2");
  const [entry, setEntry]       = useState("200");
  const [stop, setStop]         = useState("185");
  type R = { riskAmt: number; shares: number; posVal: number; posPct: number; rr: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const cap = n(capital), rp = n(risk)/100, ep = n(entry), sl = n(stop);
    const riskAmt = cap * rp;
    const riskPerShare = Math.abs(ep - sl);
    const shares = riskPerShare > 0 ? Math.floor(riskAmt / riskPerShare) : 0;
    const posVal = shares * ep;
    const posPct = cap > 0 ? (posVal / cap) * 100 : 0;
    const target = ep + (ep - sl) * 2;
    const rr = ep > 0 ? (target - ep) / (ep - sl) : 0;
    setRes({ riskAmt, shares, posVal, posPct, rr });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Portfolio Capital (PKR)" value={capital} onChange={setCapital} prefix="₨" />
      <Input label="Risk per Trade (%)" value={risk} onChange={setRisk} prefix="%" />
      <Input label="Entry Price (PKR)" value={entry} onChange={setEntry} prefix="₨" />
      <Input label="Stop Loss Price (PKR)" value={stop} onChange={setStop} prefix="₨" />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <Row label="Max Risk Amount" value={`₨${fmtM(res.riskAmt)}`} />
        <Row label="Shares to Buy" value={res.shares.toLocaleString()} highlight />
        <Row label="Position Value" value={`₨${fmtM(res.posVal)}`} />
        <Row label="Portfolio Exposure" value={`${fmt(res.posPct)}%`} />
        <Row label="R:R Ratio (2× target)" value={`1 : ${fmt(res.rr)}`} color={res.rr >= 2 ? "#16a34a" : "#dc2626"} />
      </div>)}
    </div>
  );
}

/* 17. Dividend Yield ────────────────────────────────────────────────────── */
function DividendYield() {
  const [price, setPrice]       = useState("500");
  const [annual, setAnnual]     = useState("30");
  const [qty, setQty]           = useState("500");
  const [taxRate, setTaxRate]   = useState("15");
  type R = { grossYield: number; netYield: number; annualIncome: number; netIncome: number; costBasis: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const p = n(price), d = n(annual), q = n(qty), tr = n(taxRate)/100;
    const grossYield = p > 0 ? (d / p) * 100 : 0;
    const netDiv = d * (1 - tr);
    const netYield = p > 0 ? (netDiv / p) * 100 : 0;
    setRes({ grossYield, netYield, annualIncome: d * q, netIncome: netDiv * q, costBasis: p * q });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Current Share Price (PKR)" value={price} onChange={setPrice} prefix="₨" />
      <Input label="Annual Dividend per Share (PKR)" value={annual} onChange={setAnnual} prefix="₨" />
      <Input label="Shares Held" value={qty} onChange={setQty} />
      <Input label="WHT on Dividends (%)" value={taxRate} onChange={setTaxRate} prefix="%" />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <Row label="Gross Dividend Yield" value={`${fmt(res.grossYield)}%`} highlight />
        <Row label="Net Yield (after WHT)" value={`${fmt(res.netYield)}%`} color="#16a34a" highlight />
        <Row label="Annual Gross Income" value={`₨${fmtM(res.annualIncome)}`} />
        <Row label="Annual Net Income (after WHT)" value={`₨${fmtM(res.netIncome)}`} color="#16a34a" />
        <Row label="Cost Basis" value={`₨${fmtM(res.costBasis)}`} />
      </div>)}
    </div>
  );
}

/* 18. P/E Valuation ─────────────────────────────────────────────────────── */
function PEValuation() {
  const [eps, setEps]       = useState("20");
  const [curPE, setCurPE]   = useState("10");
  const [curPrice, setCurPrice] = useState("200");
  type R = { rows: { pe: number; value: number; upside: number; signal: string }[] };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const e = n(eps), cp = n(curPrice);
    const multiples = [5, 8, 10, 12, 15, 18, 20, 25, 30, 35];
    const rows = multiples.map(pe => {
      const value = pe * e;
      const upside = cp > 0 ? ((value / cp) - 1) * 100 : 0;
      const signal = upside > 20 ? "Strong Buy" : upside > 0 ? "Buy" : upside > -20 ? "Hold" : "Sell";
      return { pe, value, upside, signal };
    });
    setRes({ rows });
  }
  const sigColor = (s: string) => s === "Strong Buy" ? "#16a34a" : s === "Buy" ? "#22c55e" : s === "Hold" ? GOLD : "#dc2626";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Earnings Per Share (EPS)" value={eps} onChange={setEps} prefix="₨" />
      <Input label="Current P/E" value={curPE} onChange={setCurPE} />
      <Input label="Current Market Price" value={curPrice} onChange={setCurPrice} prefix="₨" />
      <Btn onClick={calc} />
      {res && (
        <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", gridColumn: "1 / -1" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead><tr style={{ background: NAVY }}>{["P/E","Fair Value","Upside","Signal"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "right", color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 10 }}>{h}</th>)}</tr></thead>
            <tbody>
              {res.rows.map(r => (
                <tr key={r.pe} style={{ borderBottom: "1px solid var(--border)", background: r.pe === n(curPE) ? "rgba(212,151,26,0.06)" : "transparent" }}>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: r.pe === n(curPE) ? 800 : 400, color: r.pe === n(curPE) ? GOLD : "var(--text-primary)" }}>{r.pe}x</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₨{fmt(r.value)}</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", color: r.upside >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700 }}>{r.upside >= 0 ? "+" : ""}{fmt(r.upside)}%</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: sigColor(r.signal) }}>{r.signal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* 19. DRIP ───────────────────────────────────────────────────────────────── */
function DRIPCalc() {
  const [shares, setShares]   = useState("1000");
  const [price, setPrice]     = useState("500");
  const [div, setDiv]         = useState("25");
  const [growth, setGrowth]   = useState("10");
  const [years, setYears]     = useState("10");
  type Row2 = { yr: number; shares: number; price: number; income: number; value: number };
  const [rows, setRows] = useState<Row2[]>([]);
  function calc() {
    const s0 = n(shares), p0 = n(price), d0 = n(div), g = n(growth)/100, y = n(years);
    const data: Row2[] = [];
    let sh = s0, p = p0, d = d0;
    for (let yr = 1; yr <= y; yr++) {
      p *= (1 + g); d *= (1 + g);
      const income = sh * d;
      sh += income / p;
      data.push({ yr, shares: Math.round(sh * 100) / 100, price: Math.round(p * 100) / 100, income: Math.round(income), value: Math.round(sh * p) });
    }
    setRows(data);
  }
  const last = rows[rows.length - 1];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Shares Held" value={shares} onChange={setShares} />
      <Input label="Current Price (PKR)" value={price} onChange={setPrice} prefix="₨" />
      <Input label="Annual Dividend per Share (PKR)" value={div} onChange={setDiv} prefix="₨" />
      <Input label="Annual Growth Rate (%)" value={growth} onChange={setGrowth} prefix="%" />
      <Input label="Years" value={years} onChange={setYears} />
      <Btn onClick={calc} />
      {last && (<div style={{ gridColumn: "1 / -1" }}>
        <Row label="Final Shares Held" value={fmt(last.shares, 2)} highlight />
        <Row label="Final Share Price" value={`₨${fmt(last.price)}`} />
        <Row label="Final Portfolio Value" value={`₨${fmtM(last.value)}`} highlight color="#16a34a" />
        <LineAreaSVG data={rows.map(r => r.value)} color="#16a34a" label="Portfolio Value Growth" />
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginTop: 4 }}>
          <thead><tr>{["Year","Shares","Dividend","Value"].map(h => <th key={h} style={{ padding: "5px 8px", textAlign: "right", color: "var(--text-muted)", fontWeight: 700, fontSize: 10, borderBottom: "1px solid var(--border)" }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.yr} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "4px 8px", textAlign: "right" }}>Yr {r.yr}</td>
                <td style={{ padding: "4px 8px", textAlign: "right" }}>{fmt(r.shares, 1)}</td>
                <td style={{ padding: "4px 8px", textAlign: "right", color: "#16a34a" }}>₨{fmtM(r.income)}</td>
                <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 700 }}>₨{fmtM(r.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>)}
    </div>
  );
}

/* 20. Rights Issue ──────────────────────────────────────────────────────── */
function RightsIssue() {
  const [curPrice, setCurPrice] = useState("200");
  const [issuePrice, setIssuePrice] = useState("100");
  const [ratio, setRatio]     = useState("1");
  const [held, setHeld]       = useState("1000");
  type R = { terp: number; newShares: number; totalShares: number; newValue: number; gain: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const mp = n(curPrice), ip = n(issuePrice), r = n(ratio), h = n(held);
    const newSh = Math.floor(h / r);
    const totSh = h + newSh;
    const terp = (h * mp + newSh * ip) / totSh;
    const newVal = totSh * terp;
    const origVal = h * mp;
    const cashPaid = newSh * ip;
    setRes({ terp, newShares: newSh, totalShares: totSh, newValue: newVal, gain: newVal - origVal - cashPaid });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Current Market Price (PKR)" value={curPrice} onChange={setCurPrice} prefix="₨" />
      <Input label="Rights Issue Price (PKR)" value={issuePrice} onChange={setIssuePrice} prefix="₨" />
      <Input label="Rights Ratio (1 new per X held)" value={ratio} onChange={setRatio} />
      <Input label="Shares Currently Held" value={held} onChange={setHeld} />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <Row label="TERP (Theoretical Ex-Rights Price)" value={`₨${fmt(res.terp)}`} highlight />
        <Row label="New Shares Received" value={res.newShares.toLocaleString()} />
        <Row label="Total Shares After Rights" value={res.totalShares.toLocaleString()} />
        <Row label="Portfolio Value After Rights" value={`₨${fmtM(res.newValue)}`} />
        <Row label="Net Gain / Loss" value={`${res.gain >= 0 ? "+" : ""}₨${fmtM(res.gain)}`} color={res.gain >= 0 ? "#16a34a" : "#dc2626"} />
      </div>)}
    </div>
  );
}

/* 21. IPO Allotment ─────────────────────────────────────────────────────── */
function IPOAllotment() {
  const [applied, setApplied]   = useState("5000");
  const [lotSize, setLotSize]   = useState("500");
  const [issuePrice, setIssuePrice] = useState("50");
  const [listingPrice, setListingPrice] = useState("75");
  const [totalApps, setTotalApps]   = useState("500000");
  const [totalShares, setTotalShares] = useState("100000000");
  type R = { allotment: number; lotCost: number; listingGain: number; gainPct: number; oversubscribed: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const apps = n(applied), ls = n(lotSize), ip = n(issuePrice), lp = n(listingPrice), ta = n(totalApps), ts = n(totalShares);
    const overSub = ta > 0 ? (ta * ls) / ts : 1;
    const allotment = overSub > 1 ? Math.floor(ls / overSub) : ls;
    const lotCost = allotment * ip;
    const listingGain = allotment * (lp - ip);
    const gainPct = ip > 0 ? ((lp - ip) / ip) * 100 : 0;
    setRes({ allotment, lotCost, listingGain, gainPct, oversubscribed: overSub });
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Applications Submitted" value={applied} onChange={setApplied} />
      <Input label="Lot Size (Shares per App)" value={lotSize} onChange={setLotSize} />
      <Input label="IPO Issue Price (PKR)" value={issuePrice} onChange={setIssuePrice} prefix="₨" />
      <Input label="Expected Listing Price (PKR)" value={listingPrice} onChange={setListingPrice} prefix="₨" />
      <Input label="Total Applications (Market-wide)" value={totalApps} onChange={setTotalApps} />
      <Input label="Total Shares Offered" value={totalShares} onChange={setTotalShares} />
      <Btn onClick={calc} />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <Row label="Oversubscription" value={`${fmt(res.oversubscribed)}x`} color={res.oversubscribed > 5 ? "#dc2626" : GOLD} />
        <Row label="Allotted Shares (per app)" value={res.allotment.toLocaleString()} highlight />
        <Row label="Investment Required" value={`₨${fmtM(res.lotCost)}`} />
        <Row label="Expected Listing Gain" value={`+₨${fmtM(res.listingGain)}`} color="#16a34a" highlight />
        <Row label="Listing Gain %" value={`${fmt(res.gainPct)}%`} color="#16a34a" />
      </div>)}
    </div>
  );
}

/* 22. 🆕 Portfolio Stress Test ──────────────────────────────────────────── */
function StressTest() {
  const [stocks, setStocks] = useState([
    { sym: "OGDC", weight: "25" }, { sym: "HBL", weight: "20" },
    { sym: "LUCK", weight: "20" }, { sym: "TRG", weight: "15" }, { sym: "FFC", weight: "20" },
  ]);
  const [portfolio, setPortfolio] = useState("1000000");
  type ScenarioResult = { scenario: string; change: number; pnl: number; finalVal: number; color: string };
  const [res, setRes] = useState<ScenarioResult[] | null>(null);

  // PSX average sector betas (approximate)
  const BETAS: Record<string, number> = {
    OGDC: 0.85, PPL: 0.90, HBL: 1.10, UBL: 1.05, MCB: 1.00, LUCK: 1.20, DGKC: 1.25,
    ENGRO: 0.95, FFC: 0.80, TRG: 1.50, SYS: 1.40, MEBL: 1.15, HUBC: 0.75, NML: 1.05,
  };

  const SCENARIOS = [
    { scenario: "Bull Run (+30%)", mkt: 30, color: "#16a34a" },
    { scenario: "Moderate Rally (+15%)", mkt: 15, color: "#22c55e" },
    { scenario: "Sideways (0%)", mkt: 0, color: "#64748b" },
    { scenario: "Correction (-15%)", mkt: -15, color: "#f59e0b" },
    { scenario: "Bear Market (-30%)", mkt: -30, color: "#dc2626" },
    { scenario: "Market Crash (-50%)", mkt: -50, color: "#7f1d1d" },
  ];

  function calc() {
    const pv = n(portfolio);
    const totalW = stocks.reduce((a, s) => a + n(s.weight), 0);
    const results = SCENARIOS.map(sc => {
      const weightedChg = stocks.reduce((a, s) => {
        const w = n(s.weight) / totalW;
        const beta = BETAS[s.sym] ?? 1.0;
        return a + w * beta * sc.mkt;
      }, 0);
      const pnl = pv * (weightedChg / 100);
      return { scenario: sc.scenario, change: weightedChg, pnl, finalVal: pv + pnl, color: sc.color };
    });
    setRes(results);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
      <Input label="Portfolio Value (PKR)" value={portfolio} onChange={setPortfolio} prefix="₨" />
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", gridColumn: "1 / -1" }}>Stocks & Weights (%)</div>
      {stocks.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 8, gridColumn: "1 / -1" }}>
          <input value={s.sym} onChange={e => setStocks(stocks.map((x, j) => j===i ? {...x, sym: e.target.value.toUpperCase()} : x))}
            placeholder="Symbol" style={{ width: 80, padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 12 }} />
          <input type="number" value={s.weight} onChange={e => setStocks(stocks.map((x, j) => j===i ? {...x, weight: e.target.value} : x))}
            placeholder="Weight %" style={{ flex: 1, padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 12 }} />
        </div>
      ))}
      <Btn onClick={calc} label="Run Stress Test →" />
      {res && (<div style={{ gridColumn: "1 / -1" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>Scenario Results</div>
        {res.map(r => (
          <div key={r.scenario} style={{ borderRadius: 10, padding: "12px 14px", border: `1px solid ${r.color}40`, background: r.color + "0a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.scenario}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>Portfolio: ₨{fmtM(r.finalVal)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: r.color }}>{r.change >= 0 ? "+" : ""}{fmt(r.change)}%</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.pnl >= 0 ? "+" : ""}₨{fmtM(r.pnl)}</div>
            </div>
          </div>
        ))}
        <BarSVG data={res.map(r => r.pnl)} label="P&L Across Scenarios" />
      </div>)}
    </div>
  );
}

/* ─── Calculator Registry ─────────────────────────────────────────────────── */
type CalcDef = { id: string; label: string; desc: string; category: string; icon: string; component: React.ReactNode };
const CALCS: CalcDef[] = [
  { id: "salary",      label: "Salary Tax",          desc: "FBR income tax with rebates for FY 2025-26 / 2026-27",               category: "general",    icon: "💼", component: <SalaryTax /> },
  { id: "zakat",       label: "Zakat",               desc: "Annual zakat obligation based on Nisab threshold",                    category: "general",    icon: "🌙", component: <ZakatCalc /> },
  { id: "apnaghar",    label: "Apna Ghar",           desc: "Home loan EMI with Year 11 rate reset impact",                       category: "general",    icon: "🏠", component: <ApnaGhar /> },
  { id: "microfinance",label: "Microfinance Loan",   desc: "True annualized cost vs. bank facility",                             category: "general",    icon: "🏦", component: <MicroFinance /> },
  { id: "exchange",    label: "Exchange Rate",        desc: "PKR cross-rates for USD, EUR, GBP, SAR, AED and more",               category: "general",    icon: "💱", component: <ExchangeRate /> },
  { id: "cagr",        label: "CAGR",                desc: "Compound annual growth rate for any investment",                     category: "investment", icon: "📈", component: <CAGRCalc /> },
  { id: "sip",         label: "SIP",                 desc: "Systematic investment plan returns with year-by-year table",         category: "investment", icon: "📅", component: <SIPCalc /> },
  { id: "compounding", label: "Compounding",          desc: "Portfolio growth with reinvested profits",                           category: "investment", icon: "♻️", component: <CompoundingCalc /> },
  { id: "depreciation",label: "Depreciation",        desc: "Asset depreciation with inflation-adjusted real value",              category: "investment", icon: "📉", component: <DepreciationCalc /> },
  { id: "roi",         label: "ROI",                 desc: "Return on investment in PKR over any holding period",                category: "investment", icon: "💰", component: <ROICalc /> },
  { id: "drip",        label: "DRIP",                desc: "Dividend reinvestment — compounding shares & value over years",      category: "investment", icon: "🔁", component: <DRIPCalc /> },
  { id: "stress",      label: "Stress Test 🆕",       desc: "Portfolio performance across bull, bear & crash scenarios",          category: "investment", icon: "🧪", component: <StressTest /> },
  { id: "brokerage",   label: "Brokerage / Charges", desc: "PSX commission, NCCPL, CDC, sales tax & WHT breakdown",              category: "trading",    icon: "📋", component: <BrokerageCalc /> },
  { id: "margin",      label: "Margin",              desc: "Leveraged exposure, financing cost & margin call level",             category: "trading",    icon: "⚖️", component: <MarginCalc /> },
  { id: "position",    label: "Position Sizing",     desc: "Optimal share quantity based on risk % and stop loss",               category: "trading",    icon: "🎯", component: <PositionSizing /> },
  { id: "drawdown",    label: "Drawdown",            desc: "Max portfolio loss from peak & time to full recovery",               category: "trading",    icon: "📊", component: <DrawdownCalc /> },
  { id: "dcf",         label: "DCF Valuation",       desc: "Intrinsic value via discounted cash flow analysis",                  category: "valuation",  icon: "🔬", component: <DCFCalc /> },
  { id: "peg",         label: "Peter Lynch PEG",     desc: "Fair value using EPS growth + dividend yield method",                category: "valuation",  icon: "🦅", component: <PeterLynch /> },
  { id: "pe",          label: "P/E Valuation",       desc: "Fair value at 10 different P/E multiples with buy/sell signals",     category: "valuation",  icon: "🔢", component: <PEValuation /> },
  { id: "dividend",    label: "Dividend Yield",      desc: "Gross & net yield after 15% WHT with income projection",            category: "valuation",  icon: "💵", component: <DividendYield /> },
  { id: "rights",      label: "Rights Issue",        desc: "TERP, new shares and net gain from a rights offering",              category: "corporate",  icon: "📜", component: <RightsIssue /> },
  { id: "ipo",         label: "IPO Allotment",       desc: "Expected allotment and listing gain based on oversubscription",      category: "corporate",  icon: "🚀", component: <IPOAllotment /> },
];

const CAT_META: Record<string, { label: string; color: string; icon: string }> = {
  all:        { label: "All",        color: GOLD,      icon: "✦" },
  general:    { label: "General",    color: "#60a5fa", icon: "⚙" },
  investment: { label: "Investment", color: "#34d399", icon: "📈" },
  trading:    { label: "Trading",    color: "#f472b6", icon: "⚡" },
  valuation:  { label: "Valuation",  color: "#a78bfa", icon: "🔬" },
  corporate:  { label: "Corporate",  color: "#fb923c", icon: "🏢" },
};
const CATS = ["all","general","investment","trading","valuation","corporate"];

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function ToolsClient() {
  const [cat, setCat]     = useState("all");
  const [active, setActive] = useState<string>("salary");

  const filtered = useMemo(() => cat === "all" ? CALCS : CALCS.filter(c => c.category === cat), [cat]);
  const current  = useMemo(() => CALCS.find(c => c.id === active) ?? CALCS[0], [active]);

  function pickCat(key: string) {
    setCat(key);
    const first = key === "all" ? CALCS[0] : CALCS.find(c => c.category === key);
    if (first) setActive(first.id);
  }

  const accent = CAT_META[current.category]?.color ?? GOLD;

  // Height available for the two-column section (viewport minus header + tabs + padding)
  const HEADER_H = 130; // top bar + tabs + gaps
  const colH = `calc(100vh - var(--sidebar-w, 0px) - ${HEADER_H}px)`;

  return (
    <div style={{ padding: "16px 24px 0", maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", boxSizing: "border-box" }}>

      {/* ── Top bar (compact) ────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8, flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 1 }}>Financial Calculators</div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            <span style={{ color: "var(--text-primary)" }}>Tools for investors &amp; </span><span style={{ color: "#D4971A" }}>traders</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {[`${CALCS.length} Calculators`, "PSX Brokerage", "FBR 2026-27"].map(t => (
            <span key={t} style={{ fontSize: 10.5, fontWeight: 700, padding: "4px 12px", borderRadius: 20, border: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--light-bg)" }}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── Category tabs ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 0, marginBottom: 10, borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", background: "var(--light-bg)", flexShrink: 0 }}>
        {CATS.map(key => {
          const m = CAT_META[key];
          const isCat = cat === key;
          const count = key === "all" ? CALCS.length : CALCS.filter(c => c.category === key).length;
          return (
            <button key={key} onClick={() => pickCat(key)}
              style={{ flex: 1, padding: "7px 4px", border: "none", borderRight: "1px solid var(--border)", cursor: "pointer",
                background: isCat ? NAVY : "transparent",
                color: isCat ? m.color : "var(--text-muted)",
                fontWeight: isCat ? 800 : 600, fontSize: 11, transition: "all 0.15s",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              }}>
              <span style={{ fontSize: 13 }}>{m.icon}</span>
              <span style={{ fontSize: 10, lineHeight: 1 }}>{m.label}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: isCat ? m.color : "var(--text-muted)", opacity: 0.8 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Two-column split — fills remaining viewport height, no page scroll ── */}
      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0, overflow: "hidden", paddingBottom: 16 }}>

        {/* LEFT — calculator list ──────────────────────────────────── */}
        <div style={{ width: 250, flexShrink: 0, borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", background: "var(--card-bg)", display: "flex", flexDirection: "column" }}>
          {/* list header */}
          <div style={{ padding: "9px 14px", background: NAVY, borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {cat === "all" ? "All Calculators" : CAT_META[cat].label} · {filtered.length}
            </div>
          </div>
          {/* calculator rows — scrollable inside the column */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filtered.map(c => {
              const isActive = c.id === active;
              const a = CAT_META[c.category]?.color ?? GOLD;
              return (
                <button key={c.id} onClick={() => setActive(c.id)}
                  style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 0, padding: 0,
                    border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
                    background: isActive ? a + "10" : "transparent", transition: "background 0.12s",
                  }}>
                  <div style={{ width: 3, alignSelf: "stretch", background: isActive ? a : "transparent", flexShrink: 0 }} />
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: a + (isActive ? "22" : "12"),
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                    margin: "8px 9px", flexShrink: 0 }}>
                    {c.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <div style={{ fontSize: 11.5, fontWeight: isActive ? 800 : 600, color: isActive ? a : "var(--text-primary)", lineHeight: 1.2 }}>{c.label}</div>
                    <div style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.desc}</div>
                  </div>
                  {isActive && <span style={{ fontSize: 10, color: a, marginRight: 8, flexShrink: 0 }}>›</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — active calculator, always visible at top ───────── */}
        <div style={{ flex: 1, minWidth: 0, borderRadius: 12, border: `1.5px solid ${accent}44`, background: "var(--card-bg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {/* header */}
          <div style={{ background: NAVY, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: accent + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>
              {current.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{current.label}</span>
                <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 8, background: accent + "22", color: accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {CAT_META[current.category]?.label}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>{current.desc}</div>
            </div>
            <div style={{ width: 4, height: 38, borderRadius: 2, background: accent, flexShrink: 0 }} />
          </div>
          <div style={{ height: 3, background: `linear-gradient(90deg, ${accent}, transparent)`, flexShrink: 0 }} />
          {/* calculator form — scrollable inside the panel */}
          <div style={{ padding: "18px 22px", overflowY: "auto", flex: 1 }}>
            {current.component}
          </div>
        </div>

      </div>
    </div>
  );
}
