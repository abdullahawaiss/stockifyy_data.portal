"use client";
import { useState, useMemo } from "react";

const NAVY = "#07111F";
const GOLD = "#D4971A";

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function fmt(n: number, d = 2) { return n.toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtM(n: number) { if (Math.abs(n) >= 1e9) return (n/1e9).toFixed(2)+"B"; if (Math.abs(n) >= 1e6) return (n/1e6).toFixed(2)+"M"; if (Math.abs(n) >= 1e3) return (n/1e3).toFixed(1)+"K"; return fmt(n); }
function nv(s: string) { return parseFloat(s) || 0; }

/* ─── shared input components ─────────────────────────────────────────────── */
function Input({ label, value, onChange, prefix, step, placeholder }: { label: string; value: string; onChange: (v: string) => void; prefix?: string; step?: string; placeholder?: string }) {
  return (
    <div>
      <label style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 3 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--border)", borderRadius: 7, overflow: "hidden" }}>
        {prefix && <span style={{ padding: "0 8px", fontSize: 11, color: "var(--text-muted)", background: "var(--light-bg)", borderRight: "1px solid var(--border)", alignSelf: "stretch", display: "flex", alignItems: "center", flexShrink: 0 }}>{prefix}</span>}
        <input type="number" value={value} onChange={e => onChange(e.target.value)} step={step ?? "any"} min="0" placeholder={placeholder}
          style={{ flex: 1, minWidth: 0, padding: "7px 10px", border: "none", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 12, outline: "none" }} />
      </div>
    </div>
  );
}
function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: {value: string; label: string}[] }) {
  return (
    <div>
      <label style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 3 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "7px 10px", border: "1.5px solid var(--border)", borderRadius: 7, background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 12, cursor: "pointer" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function CalcBtn({ onClick, label = "Calculate →" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "10px", borderRadius: 8, background: NAVY, color: GOLD, border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", marginTop: 4, letterSpacing: "0.02em" }}
      onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
      {label}
    </button>
  );
}

/* ─── result display components ───────────────────────────────────────────── */
function BigResult({ label, value, sub, color = GOLD }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ borderRadius: 10, padding: "12px 14px", background: color + "12", border: `1.5px solid ${color}35`, marginBottom: 4 }}>
      <div style={{ fontSize: 9, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color, fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
function Row({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: highlight ? 13 : 12, fontWeight: highlight ? 800 : 600, color: color ?? "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}
function Sec({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", padding: "10px 0 4px", borderTop: "1px solid var(--border)", marginTop: 6 }}>{children}</div>;
}
function NoResult({ icon = "🧮", text = "Fill in the values and press Calculate" }: { icon?: string; text?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", gap: 12, textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 52, opacity: 0.35 }}>{icon}</div>
      <div style={{ fontSize: 12, fontWeight: 600, maxWidth: 200, lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}

/* ─── chart components ────────────────────────────────────────────────────── */
function BarSVG({ data, label = "" }: { data: number[]; label?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(Math.abs), 1);
  const bw = 22, gap = 8, h = 100, pad = 10;
  const w = data.length * (bw + gap) + pad * 2;
  return (
    <div style={{ overflowX: "auto", marginTop: 10 }}>
      {label && <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>}
      <svg width={Math.max(w, 260)} height={h + 28} viewBox={`0 0 ${Math.max(w, 260)} ${h + 28}`}>
        {data.map((d, i) => {
          const bh = Math.max(3, (Math.abs(d) / max) * (h - 12));
          const x = pad + i * (bw + gap);
          const c = d >= 0 ? "#16a34a" : "#dc2626";
          return (
            <g key={i}>
              <rect x={x} y={h - bh} width={bw} height={bh} rx={3} fill={c} opacity={0.8} />
              <text x={x + bw/2} y={h + 14} textAnchor="middle" fontSize={8} fill="var(--text-muted)">{i + 1}</text>
            </g>
          );
        })}
        <line x1={pad} y1={h} x2={Math.max(w, 260) - pad} y2={h} stroke="var(--border)" strokeWidth={1} />
      </svg>
    </div>
  );
}
function TwoBarSVG({ a, b, labels }: { a: number[]; b: number[]; labels: string[] }) {
  const max = Math.max(...a, ...b, 1);
  const bw = 14, gap = 4, grp = 8, h = 100, pad = 10;
  const w = a.length * (bw * 2 + gap + grp) + pad * 2;
  return (
    <div style={{ overflowX: "auto", marginTop: 10 }}>
      <svg width={Math.max(w, 260)} height={h + 30} viewBox={`0 0 ${Math.max(w, 260)} ${h + 30}`}>
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
        <line x1={pad} y1={h} x2={Math.max(w, 260) - pad} y2={h} stroke="var(--border)" strokeWidth={1} />
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
  const w = 260, h = 80, px = 10, py = 8;
  const pts = data.map((v, i) => {
    const x = px + (i / (data.length - 1)) * (w - 2 * px);
    const y = py + (1 - (v - min) / (max - min)) * (h - 2 * py);
    return `${x},${y}`;
  }).join(" ");
  const areaClose = `${w - px},${h - py} ${px},${h - py}`;
  return (
    <div style={{ marginTop: 10 }}>
      {label && <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>}
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 80 }}>
        <defs>
          <linearGradient id="lag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${pts} ${areaClose}`} fill="url(#lag)" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* first and last dots */}
        {[0, data.length - 1].map(i => {
          const x = px + (i / (data.length - 1)) * (w - 2 * px);
          const y = py + (1 - (data[i] - min) / (max - min)) * (h - 2 * py);
          return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
        })}
      </svg>
    </div>
  );
}

/* ─── split layout: inputs left, results right ────────────────────────────── */
function SplitCalc({ inputs, result }: { inputs: React.ReactNode; result: React.ReactNode | null }) {
  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0, overflow: "hidden" }}>
      {/* LEFT — inputs panel */}
      <div style={{ width: "44%", minWidth: 280, maxWidth: 440, display: "flex", flexDirection: "column", borderRight: "1px solid var(--border)", background: "var(--card-bg)" }}>
        <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>Enter Values</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {inputs}
        </div>
      </div>
      {/* RIGHT — results panel */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--light-bg,rgba(0,0,0,0.015))" }}>
        <div style={{ padding: "14px 24px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Results</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {result ?? <NoResult />}
        </div>
      </div>
    </div>
  );
}
function InputGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{children}</div>;
}
function FullCol({ children }: { children: React.ReactNode }) {
  return <div style={{ gridColumn: "1 / -1" }}>{children}</div>;
}

/* ════════════════════════════════════════════════════════════════════════════ */
/* CALCULATORS                                                                 */
/* ════════════════════════════════════════════════════════════════════════════ */

/* 1. Salary Tax ──────────────────────────────────────────────────────────── */
function SalaryTax() {
  const [monthly, setMonthly] = useState("100000");
  const [fy, setFy] = useState("2026-27");
  const [pension, setPension] = useState("0");
  const [zakat, setZakat] = useState("0");
  type R = { gross: number; tax: number; slab: number; pensionRebate: number; zakatRebate: number; netTax: number; netAnnual: number; effectiveRate: number };
  const [res, setRes] = useState<R | null>(null);

  function calc() {
    const gross = nv(monthly) * 12;
    let tax = 0, slab = 0;
    if (gross <= 600_000)        { tax = 0;                                       slab = 0; }
    else if (gross <= 1_200_000) { tax = (gross - 600_000) * 0.05;               slab = 1; }
    else if (gross <= 2_400_000) { tax = 30_000 + (gross - 1_200_000) * 0.15;    slab = 2; }
    else if (gross <= 3_600_000) { tax = 210_000 + (gross - 2_400_000) * 0.25;   slab = 3; }
    else if (gross <= 6_000_000) { tax = 510_000 + (gross - 3_600_000) * 0.30;   slab = 4; }
    else                         { tax = 1_230_000 + (gross - 6_000_000) * 0.35; slab = 5; }
    const pensionRebate = Math.min(nv(pension), gross * 0.20) * 0.20;
    const zakatRebate = nv(zakat);
    const netTax = Math.max(0, tax - pensionRebate - zakatRebate);
    setRes({ gross, tax, slab, pensionRebate, zakatRebate, netTax, netAnnual: gross - netTax, effectiveRate: gross > 0 ? (netTax / gross) * 100 : 0 });
  }

  const SLABS = ["0% — up to 600K","5% on excess of 600K","15% on excess of 1.2M","25% on excess of 2.4M","30% on excess of 3.6M","35% on excess of 6M"];
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <FullCol><Sel label="Tax Year" value={fy} onChange={setFy} options={[{value:"2026-27",label:"FY 2026-27"},{value:"2025-26",label:"FY 2025-26"}]} /></FullCol>
          <FullCol><Input label="Monthly Salary (PKR)" value={monthly} onChange={setMonthly} prefix="₨" /></FullCol>
          <Input label="Annual Pension Investment (PKR)" value={pension} onChange={setPension} prefix="₨" />
          <Input label="Annual Zakat Paid (PKR)" value={zakat} onChange={setZakat} prefix="₨" />
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label={`Tax Slab ${res.slab+1} — ${SLABS[res.slab]}`} value={`₨${fmtM(res.netTax)}/yr`} sub={`Effective rate: ${fmt(res.effectiveRate)}%`} color="#dc2626" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "10px 0" }}>
            <div style={{ borderRadius: 10, padding: "12px", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)", textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.07em" }}>Net Monthly</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#16a34a", marginTop: 2 }}>₨{fmtM(res.netAnnual/12)}</div>
            </div>
            <div style={{ borderRadius: 10, padding: "12px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.07em" }}>Monthly Tax</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#dc2626", marginTop: 2 }}>₨{fmtM(res.netTax/12)}</div>
            </div>
          </div>
          <Row label="Gross Annual Salary" value={`₨${fmtM(res.gross)}`} />
          <Row label="Base Tax (FBR)" value={`₨${fmtM(res.tax)}`} color="#dc2626" />
          {res.pensionRebate > 0 && <Row label="Pension Rebate" value={`-₨${fmtM(res.pensionRebate)}`} color="#16a34a" />}
          {res.zakatRebate > 0 && <Row label="Zakat Rebate" value={`-₨${fmtM(res.zakatRebate)}`} color="#16a34a" />}
          <Row label="Net Annual Tax" value={`₨${fmtM(res.netTax)}`} highlight color="#dc2626" />
          <Sec>FBR Slab Table {fy}</Sec>
          {[["1","Up to 600K","0%"],["2","600K – 1.2M","5%"],["3","1.2M – 2.4M","15%"],["4","2.4M – 3.6M","25%"],["5","3.6M – 6M","30%"],["6","Above 6M","35%"]].map(([s,r,p],i) => (
            <div key={s} style={{ display:"flex", justifyContent:"space-between", padding:"5px 8px", borderRadius:6, background: res.slab===i ? "rgba(212,151,26,0.08)" : "transparent", marginBottom:2 }}>
              <span style={{ fontSize:11, color: res.slab===i ? GOLD : "var(--text-muted)", fontWeight: res.slab===i ? 700 : 400 }}>Slab {s}: {r}</span>
              <span style={{ fontSize:11, fontWeight:700, color: res.slab===i ? GOLD : "var(--text-primary)" }}>{p}</span>
            </div>
          ))}
        </div>
      )}
    />
  );
}

/* 2. Zakat ───────────────────────────────────────────────────────────────── */
function ZakatCalc() {
  const [cash, setCash] = useState("500000");
  const [gold, setGold] = useState("0");
  const [stocks, setStocks] = useState("0");
  const [loans, setLoans] = useState("0");
  const NISAB = 1_248_000;
  type R = { total: number; zakat: number; eligible: boolean };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const total = nv(cash) + nv(gold) + nv(stocks) - nv(loans);
    const eligible = total >= NISAB;
    setRes({ total, zakat: eligible ? total * 0.025 : 0, eligible });
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <Input label="Cash & Bank Balance" value={cash} onChange={setCash} prefix="₨" />
          <Input label="Gold & Jewellery" value={gold} onChange={setGold} prefix="₨" />
          <Input label="Stock Portfolio" value={stocks} onChange={setStocks} prefix="₨" />
          <Input label="Outstanding Loans" value={loans} onChange={setLoans} prefix="₨" />
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label={res.eligible ? "Zakat Due (2.5%)" : "Below Nisab — No Zakat"} value={res.eligible ? `₨${fmtM(res.zakat)}` : "Nil"} sub={res.eligible ? "Payable on zakatable assets" : `Nisab threshold: ₨${fmtM(NISAB)}`} color={res.eligible ? "#16a34a" : "#dc2626"} />
          {/* Progress bar */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Assets vs Nisab</div>
            <div style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (res.total / NISAB) * 100).toFixed(0)}%`, background: res.eligible ? "#16a34a" : "#f59e0b", borderRadius: 4, transition: "width 0.4s" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:"var(--text-muted)", marginTop:3 }}>
              <span>₨0</span><span>Nisab ₨{fmtM(NISAB)}</span>
            </div>
          </div>
          <Row label="Total Zakatable Assets" value={`₨${fmtM(res.total)}`} />
          <Row label="Nisab Threshold" value={`₨${fmtM(NISAB)}`} />
          <Row label="Zakat Rate" value="2.5%" />
          <Row label="Zakat Due" value={res.eligible ? `₨${fmtM(res.zakat)}` : "N/A"} highlight color={res.eligible ? "#16a34a" : "#dc2626"} />
        </div>
      )}
    />
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
  function emi(p: number, r: number, t: number) { const mr = r/100/12, m = t*12; if (r===0) return p/m; return p * mr * Math.pow(1+mr,m)/(Math.pow(1+mr,m)-1); }
  function calc() {
    const loan = nv(price)*(1-nv(down)/100), t=nv(tenure), t1=Math.min(10,t), t2=Math.max(0,t-10);
    const e1=emi(loan,nv(rate1),t), remBal=loan-(e1*t1*12-loan*(Math.pow(1+nv(rate1)/100/12,t1*12)-1)/(Math.pow(1+nv(rate1)/100/12,t)-1)*loan);
    const e2=t2>0?emi(Math.max(0,remBal),nv(rate11),t2):0;
    const tot1=e1*t1*12,tot2=e2*t2*12;
    setRes({loan,emi1:e1,emi11:e2,total1:tot1,total11:tot2,totalInterest:tot1+tot2-loan});
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <FullCol><Input label="Property Price (PKR)" value={price} onChange={setPrice} prefix="₨" /></FullCol>
          <Input label="Down Payment (%)" value={down} onChange={setDown} prefix="%" />
          <Input label="Loan Tenure (Years)" value={tenure} onChange={setTenure} />
          <Input label="Rate Years 1–10 (%)" value={rate1} onChange={setRate1} prefix="%" />
          <Input label="Rate Year 11+ (%)" value={rate11} onChange={setRate11} prefix="%" />
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label="Monthly EMI (Yrs 1–10)" value={`₨${fmtM(res.emi1)}`} sub={`Loan amount: ₨${fmtM(res.loan)}`} color={GOLD} />
          {res.emi11 > 0 && (
            <div style={{ borderRadius: 10, padding: "12px 14px", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", textTransform: "uppercase" }}>EMI Year 11+ (Rate Reset)</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#dc2626" }}>₨{fmtM(res.emi11)}</div>
            </div>
          )}
          <Row label="Loan Amount" value={`₨${fmtM(res.loan)}`} />
          <Row label="Total Payment Yrs 1–10" value={`₨${fmtM(res.total1)}`} />
          {res.total11 > 0 && <Row label="Total Payment Yr 11+" value={`₨${fmtM(res.total11)}`} />}
          <Row label="Total Interest" value={`₨${fmtM(res.totalInterest)}`} color="#dc2626" highlight />
          <Row label="Total Cost (Loan + Interest)" value={`₨${fmtM(res.loan + res.totalInterest)}`} />
        </div>
      )}
    />
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
  function emi(p: number, r: number, m: number) { const mr=r/100/12; if (mr===0) return p/m; return p*mr*Math.pow(1+mr,m)/(Math.pow(1+mr,m)-1); }
  function calc() {
    const p=nv(principal),r=nv(rate),m=nv(months),br=nv(bankRate);
    const e=emi(p,r,m),tot=e*m,int=tot-p,apr=((tot/p)-1)*(12/m)*100;
    const be=emi(p,br,m),bt=be*m;
    setRes({emi:e,total:tot,interest:int,apr,bankEmi:be,bankTotal:bt,extraCost:tot-bt});
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <FullCol><Input label="Loan Amount (PKR)" value={principal} onChange={setPrincipal} prefix="₨" /></FullCol>
          <Input label="Microfinance Rate (%/yr)" value={rate} onChange={setRate} prefix="%" />
          <Input label="Tenure (Months)" value={months} onChange={setMonths} />
          <FullCol><Input label="Bank Rate for Comparison (%)" value={bankRate} onChange={setBankRate} prefix="%" /></FullCol>
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label="Monthly EMI" value={`₨${fmtM(res.emi)}`} sub={`Effective APR: ${fmt(res.apr)}%`} color="#dc2626" />
          <Row label="Total Payment" value={`₨${fmtM(res.total)}`} />
          <Row label="Total Interest" value={`₨${fmtM(res.interest)}`} color="#dc2626" />
          <Row label="Effective APR" value={`${fmt(res.apr)}%`} highlight color="#dc2626" />
          <Sec>vs. Bank Facility at {bankRate}%</Sec>
          <Row label="Bank EMI" value={`₨${fmtM(res.bankEmi)}`} />
          <Row label="Bank Total" value={`₨${fmtM(res.bankTotal)}`} />
          <Row label="Extra Cost (MF vs Bank)" value={`₨${fmtM(res.extraCost)}`} highlight color="#dc2626" />
        </div>
      )}
    />
  );
}

/* 5. CAGR ────────────────────────────────────────────────────────────────── */
function CAGRCalc() {
  const [start, setStart] = useState("100000");
  const [end, setEnd] = useState("250000");
  const [years, setYears] = useState("5");
  type R = { cagr: number; total: number; data: number[] };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const s=nv(start),e=nv(end),y=nv(years);
    if (s<=0||e<=0||y<=0) return;
    const cagr=(Math.pow(e/s,1/y)-1)*100;
    const data=Array.from({length:Math.ceil(y)+1},(_,i)=>s*Math.pow(1+cagr/100,i));
    setRes({cagr,total:((e-s)/s)*100,data});
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <Input label="Starting Value (PKR)" value={start} onChange={setStart} prefix="₨" />
          <Input label="Ending Value (PKR)" value={end} onChange={setEnd} prefix="₨" />
          <FullCol><Input label="Number of Years" value={years} onChange={setYears} /></FullCol>
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label="CAGR" value={`${fmt(res.cagr)}%`} sub={`Total return: ${fmt(res.total)}%`} color={res.cagr>=0?"#16a34a":"#dc2626"} />
          <Row label="Start Value" value={`₨${fmtM(nv(start))}`} />
          <Row label="End Value" value={`₨${fmtM(nv(end))}`} />
          <Row label="Total Return" value={`${fmt(res.total)}%`} />
          <LineAreaSVG data={res.data} color={GOLD} label="Growth Curve" />
        </div>
      )}
    />
  );
}

/* 6. SIP ─────────────────────────────────────────────────────────────────── */
function SIPCalc() {
  const [monthly, setMonthly] = useState("10000");
  const [rate, setRate] = useState("15");
  const [yrs, setYrs] = useState("10");
  type Row2 = { yr: number; invested: number; value: number; gain: number };
  const [rows, setRows] = useState<Row2[]>([]);
  function calc() {
    const p=nv(monthly),r=nv(rate)/100/12,y=nv(yrs);
    const data: Row2[]=[];
    for (let yr=1;yr<=y;yr++) { const m=yr*12; const val=p*(Math.pow(1+r,m)-1)/r*(1+r); data.push({yr,invested:p*m,value:Math.round(val),gain:Math.round(val-p*m)}); }
    setRows(data);
  }
  const last = rows[rows.length-1];
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <FullCol><Input label="Monthly SIP Amount (PKR)" value={monthly} onChange={setMonthly} prefix="₨" /></FullCol>
          <Input label="Expected Annual Return (%)" value={rate} onChange={setRate} prefix="%" />
          <Input label="Investment Period (Years)" value={yrs} onChange={setYrs} />
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={rows.length>0 && last && (
        <div>
          <BigResult label={`Value after ${yrs} years`} value={`₨${fmtM(last.value)}`} sub={`Invested: ₨${fmtM(last.invested)} · Gain: ₨${fmtM(last.gain)}`} color="#16a34a" />
          <TwoBarSVG a={rows.map(r=>r.invested)} b={rows.map(r=>r.value)} labels={rows.map(r=>`Y${r.yr}`)} />
          <div style={{ overflowX:"auto", marginTop:8 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
              <thead><tr>{["Year","Invested","Value","Gain"].map(h=><th key={h} style={{ padding:"5px 8px",textAlign:"right",color:"var(--text-muted)",fontWeight:700,fontSize:10,borderBottom:"1px solid var(--border)" }}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map(r=>(
                  <tr key={r.yr} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"4px 8px",textAlign:"right",fontWeight:600 }}>Yr {r.yr}</td>
                    <td style={{ padding:"4px 8px",textAlign:"right",color:"var(--text-muted)" }}>₨{fmtM(r.invested)}</td>
                    <td style={{ padding:"4px 8px",textAlign:"right",fontWeight:700 }}>₨{fmtM(r.value)}</td>
                    <td style={{ padding:"4px 8px",textAlign:"right",color:"#16a34a",fontWeight:700 }}>+₨{fmtM(r.gain)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    />
  );
}

/* 7. Compounding ─────────────────────────────────────────────────────────── */
function CompoundingCalc() {
  const [principal, setPrincipal] = useState("500000");
  const [rate, setRate] = useState("18");
  const [years, setYears] = useState("10");
  const [freq, setFreq] = useState("12");
  type Row2 = { yr: number; value: number; interest: number };
  const [rows, setRows] = useState<Row2[]>([]);
  function calc() {
    const p=nv(principal),r=nv(rate)/100,y=nv(years),f=nv(freq);
    const data: Row2[]=[];
    for (let yr=1;yr<=y;yr++) { const val=p*Math.pow(1+r/f,f*yr); data.push({yr,value:Math.round(val),interest:Math.round(val-p)}); }
    setRows(data);
  }
  const last=rows[rows.length-1];
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <FullCol><Input label="Principal (PKR)" value={principal} onChange={setPrincipal} prefix="₨" /></FullCol>
          <Input label="Annual Rate (%)" value={rate} onChange={setRate} prefix="%" />
          <Input label="Years" value={years} onChange={setYears} />
          <FullCol><Sel label="Compounding Frequency" value={freq} onChange={setFreq} options={[{value:"1",label:"Annual"},{value:"4",label:"Quarterly"},{value:"12",label:"Monthly"},{value:"365",label:"Daily"}]} /></FullCol>
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={last && (
        <div>
          <BigResult label={`Final Value after ${years} years`} value={`₨${fmtM(last.value)}`} sub={`Interest earned: ₨${fmtM(last.interest)}`} color="#16a34a" />
          <LineAreaSVG data={rows.map(r=>r.value)} color="#16a34a" label="Portfolio Growth" />
          <Row label="Principal" value={`₨${fmtM(nv(principal))}`} />
          <Row label="Total Interest Earned" value={`₨${fmtM(last.interest)}`} color="#16a34a" highlight />
          <Row label="Total Return %" value={`${fmt(((last.value/nv(principal))-1)*100)}%`} />
        </div>
      )}
    />
  );
}

/* 8. Depreciation ───────────────────────────────────────────────────────── */
function DepreciationCalc() {
  const [assetVal, setAssetVal] = useState("1000000");
  const [salvage, setSalvage] = useState("100000");
  const [life, setLife] = useState("5");
  const [method, setMethod] = useState("sl");
  const [inflation, setInflation] = useState("12");
  type Row2 = { yr: number; dep: number; bookVal: number; realVal: number };
  const [rows, setRows] = useState<Row2[]>([]);
  function calc() {
    const av=nv(assetVal),sv=nv(salvage),ly=nv(life),inf=nv(inflation)/100;
    const data: Row2[]=[];let bv=av;
    for (let yr=1;yr<=ly;yr++) {
      let dep=method==="sl"?(av-sv)/ly:bv*(2/ly);
      dep=Math.min(dep,Math.max(0,bv-sv));bv-=dep;
      data.push({yr,dep:Math.round(dep),bookVal:Math.round(bv),realVal:Math.round(av/Math.pow(1+inf,yr))});
    }
    setRows(data);
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <Input label="Asset Cost (PKR)" value={assetVal} onChange={setAssetVal} prefix="₨" />
          <Input label="Salvage Value (PKR)" value={salvage} onChange={setSalvage} prefix="₨" />
          <Input label="Useful Life (Years)" value={life} onChange={setLife} />
          <Sel label="Method" value={method} onChange={setMethod} options={[{value:"sl",label:"Straight Line"},{value:"db",label:"Double Declining"}]} />
          <FullCol><Input label="Inflation Rate (%/yr)" value={inflation} onChange={setInflation} prefix="%" /></FullCol>
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={rows.length>0 && (
        <div>
          <LineAreaSVG data={rows.map(r=>r.bookVal)} color={GOLD} label="Book Value over Life" />
          <div style={{ overflowX:"auto", marginTop:8 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
              <thead><tr>{["Year","Depreciation","Book Value","Real Value*"].map(h=><th key={h} style={{ padding:"5px 8px",textAlign:"right",color:"var(--text-muted)",fontWeight:700,fontSize:10,borderBottom:"1px solid var(--border)" }}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map(r=>(
                  <tr key={r.yr} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"4px 8px",textAlign:"right",fontWeight:600 }}>Yr {r.yr}</td>
                    <td style={{ padding:"4px 8px",textAlign:"right",color:"#dc2626" }}>₨{fmtM(r.dep)}</td>
                    <td style={{ padding:"4px 8px",textAlign:"right" }}>₨{fmtM(r.bookVal)}</td>
                    <td style={{ padding:"4px 8px",textAlign:"right",color:"var(--text-muted)" }}>₨{fmtM(r.realVal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize:9,color:"var(--text-muted)",marginTop:4 }}>* Real Value adjusted for {inflation}% inflation</div>
        </div>
      )}
    />
  );
}

/* 9. Exchange Rate ───────────────────────────────────────────────────────── */
function ExchangeRate() {
  const [amount, setAmount] = useState("100000");
  const [base, setBase] = useState("PKR");
  const RATES: Record<string,number> = {PKR:1,USD:278.50,EUR:308.20,GBP:359.80,SAR:74.25,AED:75.80,JPY:1.88,CNY:38.40,CAD:205.30,AUD:182.60};
  const NAMES: Record<string,string> = {PKR:"Pakistan Rupee",USD:"US Dollar",EUR:"Euro",GBP:"British Pound",SAR:"Saudi Riyal",AED:"UAE Dirham",JPY:"Japanese Yen",CNY:"Chinese Yuan",CAD:"Canadian Dollar",AUD:"Australian Dollar"};
  const basePKR=(nv(amount)/RATES[base])*RATES.PKR;
  const currencies=Object.keys(RATES).filter(c=>c!==base);
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <FullCol><Input label="Amount" value={amount} onChange={setAmount} /></FullCol>
          <FullCol><Sel label="From Currency" value={base} onChange={setBase} options={Object.keys(RATES).map(c=>({value:c,label:`${c} — ${NAMES[c]}`}))} /></FullCol>
          <FullCol><div style={{ fontSize:10,color:"var(--text-muted)",fontWeight:600 }}>Indicative rates — Aug 2026</div></FullCol>
        </InputGrid>
      }
      result={
        <div>
          <div style={{ fontSize:10,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8 }}>Converted to all currencies</div>
          <div style={{ borderRadius:10,overflow:"hidden",border:"1px solid var(--border)" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
              <thead><tr style={{ background:NAVY }}>{["Currency","Converted"].map(h=><th key={h} style={{ padding:"7px 10px",textAlign:"right",fontWeight:700,fontSize:10,color:"rgba(255,255,255,0.7)" }}>{h}</th>)}</tr></thead>
              <tbody>
                {currencies.map(c=>(
                  <tr key={c} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"7px 10px",fontWeight:700 }}>{c} <span style={{ fontSize:10,color:"var(--text-muted)",fontWeight:400 }}>{NAMES[c]}</span></td>
                    <td style={{ padding:"7px 10px",textAlign:"right",fontWeight:700,color:GOLD,fontVariantNumeric:"tabular-nums" }}>{fmt(basePKR/RATES[c],4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
    />
  );
}

/* 10. ROI ────────────────────────────────────────────────────────────────── */
function ROICalc() {
  const [buyP, setBuyP] = useState("150");
  const [sellP, setSellP] = useState("210");
  const [qty, setQty] = useState("1000");
  const [divs, setDivs] = useState("5000");
  const [days, setDays] = useState("365");
  type R = { invested: number; proceeds: number; pct: number; annualized: number; pnl: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const inv=nv(buyP)*nv(qty),proc=nv(sellP)*nv(qty)+nv(divs);
    const pnl=proc-inv,pct=inv>0?(pnl/inv)*100:0;
    const ann=inv>0&&nv(days)>0?(Math.pow(proc/inv,365/nv(days))-1)*100:0;
    setRes({invested:inv,proceeds:proc,pct,annualized:ann,pnl});
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <Input label="Buy Price (PKR)" value={buyP} onChange={setBuyP} prefix="₨" />
          <Input label="Sell Price (PKR)" value={sellP} onChange={setSellP} prefix="₨" />
          <Input label="Quantity (Shares)" value={qty} onChange={setQty} />
          <Input label="Dividends Received (PKR)" value={divs} onChange={setDivs} prefix="₨" />
          <FullCol><Input label="Holding Period (Days)" value={days} onChange={setDays} /></FullCol>
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label="Net P&L" value={`${res.pnl>=0?"+":""}₨${fmtM(res.pnl)}`} sub={`ROI: ${fmt(res.pct)}% · Annualized: ${fmt(res.annualized)}%`} color={res.pnl>=0?"#16a34a":"#dc2626"} />
          <Row label="Capital Invested" value={`₨${fmtM(res.invested)}`} />
          <Row label="Total Proceeds (incl. div)" value={`₨${fmtM(res.proceeds)}`} />
          <Row label="Total ROI" value={`${fmt(res.pct)}%`} highlight color={res.pct>=0?"#16a34a":"#dc2626"} />
          <Row label="Annualized Return" value={`${fmt(res.annualized)}%`} color={res.annualized>=0?"#16a34a":"#dc2626"} />
        </div>
      )}
    />
  );
}

/* 11. DCF Valuation ─────────────────────────────────────────────────────── */
function DCFCalc() {
  const [fcf, setFcf] = useState("50000000");
  const [growth, setGrowth] = useState("15");
  const [tGrowth, setTGrowth] = useState("5");
  const [wacc, setWacc] = useState("12");
  const [years, setYears] = useState("5");
  const [shares, setShares] = useState("500000000");
  const [curPrice, setCurPrice] = useState("150");
  type R = { intrinsic: number; perShare: number; upside: number; pvs: number[]; tv: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const r=nv(wacc)/100,g=nv(growth)/100,tg=nv(tGrowth)/100,y=nv(years);
    let cashflow=nv(fcf),totalPV=0;
    const pvs: number[]=[];
    for (let i=1;i<=y;i++) { cashflow*=(1+g); const pv=cashflow/Math.pow(1+r,i); pvs.push(pv); totalPV+=pv; }
    const lastFCF=nv(fcf)*Math.pow(1+g,y);
    const tv=(lastFCF*(1+tg))/(r-tg);
    const pvTV=tv/Math.pow(1+r,y);
    const intrinsic=totalPV+pvTV;
    const perShare=nv(shares)>0?intrinsic/nv(shares):0;
    const upside=nv(curPrice)>0?((perShare/nv(curPrice))-1)*100:0;
    setRes({intrinsic,perShare,upside,pvs,tv});
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <FullCol><Input label="Current Free Cash Flow (PKR)" value={fcf} onChange={setFcf} prefix="₨" /></FullCol>
          <Input label="FCF Growth Rate (%/yr)" value={growth} onChange={setGrowth} prefix="%" />
          <Input label="Terminal Growth Rate (%)" value={tGrowth} onChange={setTGrowth} prefix="%" />
          <Input label="Discount Rate / WACC (%)" value={wacc} onChange={setWacc} prefix="%" />
          <Input label="Projection Years" value={years} onChange={setYears} />
          <FullCol><Input label="Total Shares Outstanding" value={shares} onChange={setShares} /></FullCol>
          <FullCol><Input label="Current Market Price (PKR)" value={curPrice} onChange={setCurPrice} prefix="₨" /></FullCol>
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label="Intrinsic Value per Share" value={`₨${fmt(res.perShare)}`} sub={`${res.upside>=0?"▲":"▼"} ${fmt(Math.abs(res.upside))}% ${res.upside>=0?"Upside":"Downside"} vs ₨${curPrice}`} color={res.upside>=0?"#16a34a":"#dc2626"} />
          <div style={{ padding:"10px 14px",borderRadius:10,background:"rgba(0,0,0,0.04)",border:"1px solid var(--border)",marginBottom:8,textAlign:"center",fontWeight:800,fontSize:14 }}>
            {res.upside>=10?"✅ Undervalued":res.upside<=-10?"🔴 Overvalued":"⚠️ Fairly Valued"}
          </div>
          <Row label="Enterprise Value (DCF)" value={`₨${fmtM(res.intrinsic)}`} highlight />
          <Row label="Terminal Value" value={`₨${fmtM(res.tv)}`} />
          <Row label="Current Market Price" value={`₨${nv(curPrice)}`} />
          <BarSVG data={res.pvs} label={`PV of FCFs — Year 1 to ${years}`} />
        </div>
      )}
    />
  );
}

/* 12. Peter Lynch PEG ───────────────────────────────────────────────────── */
function PeterLynch() {
  const [eps, setEps] = useState("15");
  const [epsGrowth, setEpsGrowth] = useState("20");
  const [divYield, setDivYield] = useState("3");
  const [curPE, setCurPE] = useState("12");
  const [curPrice, setCurPrice] = useState("180");
  type R = { fairPE: number; fairValue: number; peg: number; upside: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const eg=nv(epsGrowth),dy=nv(divYield),pe=nv(curPE),e=nv(eps),cp=nv(curPrice);
    const fairPE=eg+dy,fairValue=fairPE*e,peg=pe/eg,upside=cp>0?((fairValue/cp)-1)*100:0;
    setRes({fairPE,fairValue,peg,upside});
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <Input label="EPS (PKR)" value={eps} onChange={setEps} prefix="₨" />
          <Input label="EPS Growth Rate (%/yr)" value={epsGrowth} onChange={setEpsGrowth} prefix="%" />
          <Input label="Dividend Yield (%)" value={divYield} onChange={setDivYield} prefix="%" />
          <Input label="Current P/E Ratio" value={curPE} onChange={setCurPE} />
          <FullCol><Input label="Current Market Price (PKR)" value={curPrice} onChange={setCurPrice} prefix="₨" /></FullCol>
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label="Fair Value (Peter Lynch)" value={`₨${fmt(res.fairValue)}`} sub={`Fair P/E: ${fmt(res.fairPE)} · PEG: ${fmt(res.peg)}`} color={GOLD} />
          <div style={{ padding:"10px 14px",borderRadius:10,background:"rgba(0,0,0,0.04)",border:"1px solid var(--border)",marginBottom:8,textAlign:"center",fontWeight:800,fontSize:14 }}>
            {res.peg<1?"✅ Undervalued (PEG < 1)":res.peg>2?"🔴 Overvalued (PEG > 2)":"⚠️ Fair Range (PEG 1–2)"}
          </div>
          <Row label="Fair P/E (Growth + Div Yield)" value={fmt(res.fairPE)} />
          <Row label="PEG Ratio" value={fmt(res.peg)} highlight color={res.peg<1?"#16a34a":res.peg>2?"#dc2626":GOLD} />
          <Row label="Upside / Downside" value={`${res.upside>=0?"+":""}${fmt(res.upside)}%`} color={res.upside>=0?"#16a34a":"#dc2626"} />
          <Sec>PEG Interpretation</Sec>
          {[["PEG < 1","Undervalued — potential buy","#16a34a"],["PEG = 1","Fairly valued","#D4971A"],["PEG > 2","Overvalued — caution","#dc2626"]].map(([l,d,c])=>(
            <div key={l} style={{ display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid var(--border)" }}>
              <span style={{ fontSize:11,fontWeight:800,color:c as string,flexShrink:0 }}>{l}</span>
              <span style={{ fontSize:11,color:"var(--text-muted)" }}>{d}</span>
            </div>
          ))}
        </div>
      )}
    />
  );
}

/* 13. Drawdown ────────────────────────────────────────────────────────────── */
function DrawdownCalc() {
  const [peak, setPeak] = useState("1000000");
  const [trough, setTrough] = useState("650000");
  const [recovery, setRecovery] = useState("12");
  type R = { dd: number; lossAmt: number; recNeeded: number; recYears: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const p=nv(peak),t=nv(trough),rm=nv(recovery)/100/12;
    const dd=p>0?((p-t)/p)*100:0,lossAmt=p-t,recNeeded=p>0?((p/t)-1)*100:0;
    const recMonths=rm>0&&t>0?Math.log(p/t)/Math.log(1+rm):0;
    setRes({dd,lossAmt,recNeeded,recYears:recMonths/12});
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <Input label="Portfolio Peak Value (PKR)" value={peak} onChange={setPeak} prefix="₨" />
          <Input label="Portfolio Trough Value (PKR)" value={trough} onChange={setTrough} prefix="₨" />
          <FullCol><Input label="Expected Recovery Rate (%/yr)" value={recovery} onChange={setRecovery} prefix="%" /></FullCol>
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label="Maximum Drawdown" value={`-${fmt(res.dd)}%`} sub={`Loss: ₨${fmtM(res.lossAmt)} · Recovery: ${fmt(res.recYears)} yrs`} color="#dc2626" />
          <Row label="Loss Amount" value={`-₨${fmtM(res.lossAmt)}`} color="#dc2626" />
          <Row label="Return Needed to Recover" value={`${fmt(res.recNeeded)}%`} highlight />
          <Row label="Time to Recover" value={`${fmt(res.recYears)} years (at ${recovery}%/yr)`} />
          <Sec>Drawdown Risk Guide</Sec>
          {[["< 10%","Minor — normal market noise","#16a34a"],["10–20%","Moderate — correction phase","#D4971A"],["20–40%","Severe — bear market","#dc2626"],["> 40%","Catastrophic — capital at risk","#7f1d1d"]].map(([l,d,c])=>(
            <div key={l} style={{ display:"flex",gap:8,padding:"5px 0",borderBottom:"1px solid var(--border)" }}>
              <span style={{ fontSize:11,fontWeight:800,color:c as string,flexShrink:0,minWidth:60 }}>{l}</span>
              <span style={{ fontSize:11,color:"var(--text-muted)" }}>{d}</span>
            </div>
          ))}
        </div>
      )}
    />
  );
}

/* 14. Brokerage / Deduction ─────────────────────────────────────────────── */
function BrokerageCalc() {
  const [price, setPrice] = useState("200");
  const [qty, setQty] = useState("1000");
  const [side, setSide] = useState("buy");
  type R = { gross: number; commission: number; nccpl: number; cdc: number; psxFee: number; salesTax: number; wht: number; stamp: number; total: number; net: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const gross=nv(price)*nv(qty),commission=gross*0.0015,nccpl=gross*0.0010,cdc=gross*0.0002,psxFee=gross*0.0002;
    const salesTax=commission*0.17,wht=side==="sell"?gross*0.00015:0,stamp=gross*0.000015;
    const total=commission+nccpl+cdc+psxFee+salesTax+wht+stamp;
    setRes({gross,commission,nccpl,cdc,psxFee,salesTax,wht,stamp,total,net:side==="buy"?gross+total:gross-total});
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <Input label="Share Price (PKR)" value={price} onChange={setPrice} prefix="₨" />
          <Input label="Quantity" value={qty} onChange={setQty} />
          <FullCol><Sel label="Transaction Side" value={side} onChange={setSide} options={[{value:"buy",label:"Buy"},{value:"sell",label:"Sell"}]} /></FullCol>
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label={side==="buy"?"Net Cost (incl. charges)":"Net Proceeds (after charges)"} value={`₨${fmtM(res.net)}`} sub={`Total charges: ₨${fmtM(res.total)}`} color={side==="buy"?"#dc2626":"#16a34a"} />
          <Row label="Gross Value" value={`₨${fmtM(res.gross)}`} />
          <Sec>PSX Charges Breakdown</Sec>
          <Row label="Commission (0.15%)" value={`₨${fmtM(res.commission)}`} />
          <Row label="NCCPL (0.10%)" value={`₨${fmtM(res.nccpl)}`} />
          <Row label="CDC (0.02%)" value={`₨${fmtM(res.cdc)}`} />
          <Row label="PSX Fee (0.02%)" value={`₨${fmtM(res.psxFee)}`} />
          <Row label="Sales Tax on Commission (17%)" value={`₨${fmtM(res.salesTax)}`} />
          {res.wht>0&&<Row label="WHT on Sell (0.015%)" value={`₨${fmtM(res.wht)}`} />}
          <Row label="Stamp Duty (0.0015%)" value={`₨${fmtM(res.stamp)}`} />
          <Row label="Total Charges" value={`₨${fmtM(res.total)}`} highlight color="#dc2626" />
        </div>
      )}
    />
  );
}

/* 15. Margin Calculator ─────────────────────────────────────────────────── */
function MarginCalc() {
  const [investment, setInvestment] = useState("500000");
  const [leverage, setLeverage] = useState("3");
  const [rate, setRate] = useState("22");
  const [days, setDays] = useState("30");
  type R = { totalExp: number; borrowed: number; dailyInt: number; periodInt: number; marginCall: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const inv=nv(investment),lev=nv(leverage),r=nv(rate)/100/365,d=nv(days);
    const totalExp=inv*lev,borrowed=totalExp-inv,dailyInt=borrowed*r;
    setRes({totalExp,borrowed,dailyInt,periodInt:dailyInt*d,marginCall:totalExp*0.70});
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <Input label="Your Capital (PKR)" value={investment} onChange={setInvestment} prefix="₨" />
          <Input label="Leverage Ratio" value={leverage} onChange={setLeverage} />
          <Input label="Financing Rate (%/yr)" value={rate} onChange={setRate} prefix="%" />
          <FullCol><Input label="Holding Period (Days)" value={days} onChange={setDays} /></FullCol>
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label="Total Exposure" value={`₨${fmtM(res.totalExp)}`} sub={`Borrowed: ₨${fmtM(res.borrowed)}`} color={GOLD} />
          <Row label="Borrowed Capital" value={`₨${fmtM(res.borrowed)}`} />
          <Row label="Daily Interest" value={`₨${fmtM(res.dailyInt)}`} color="#dc2626" />
          <Row label={`Interest for ${days} days`} value={`₨${fmtM(res.periodInt)}`} color="#dc2626" highlight />
          <Row label="Margin Call Level (30% drop)" value={`₨${fmtM(res.marginCall)}`} color="#dc2626" />
        </div>
      )}
    />
  );
}

/* 16. Position Sizing ─────────────────────────────────────────────────────── */
function PositionSizing() {
  const [capital, setCapital] = useState("1000000");
  const [risk, setRisk] = useState("2");
  const [entry, setEntry] = useState("200");
  const [stop, setStop] = useState("185");
  type R = { riskAmt: number; shares: number; posVal: number; posPct: number; rr: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const cap=nv(capital),rp=nv(risk)/100,ep=nv(entry),sl=nv(stop);
    const riskAmt=cap*rp,riskPerShare=Math.abs(ep-sl),shares=riskPerShare>0?Math.floor(riskAmt/riskPerShare):0;
    const posVal=shares*ep,posPct=cap>0?(posVal/cap)*100:0,target=ep+(ep-sl)*2,rr=ep>0?(target-ep)/(ep-sl):0;
    setRes({riskAmt,shares,posVal,posPct,rr});
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <FullCol><Input label="Portfolio Capital (PKR)" value={capital} onChange={setCapital} prefix="₨" /></FullCol>
          <Input label="Risk per Trade (%)" value={risk} onChange={setRisk} prefix="%" />
          <Input label="Entry Price (PKR)" value={entry} onChange={setEntry} prefix="₨" />
          <FullCol><Input label="Stop Loss Price (PKR)" value={stop} onChange={setStop} prefix="₨" /></FullCol>
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label="Shares to Buy" value={res.shares.toLocaleString()} sub={`Position value: ₨${fmtM(res.posVal)} (${fmt(res.posPct)}% of capital)`} color={GOLD} />
          <Row label="Max Risk Amount" value={`₨${fmtM(res.riskAmt)}`} />
          <Row label="Position Value" value={`₨${fmtM(res.posVal)}`} />
          <Row label="Portfolio Exposure" value={`${fmt(res.posPct)}%`} />
          <Row label="R:R Ratio (2× target)" value={`1 : ${fmt(res.rr)}`} color={res.rr>=2?"#16a34a":"#dc2626"} highlight />
        </div>
      )}
    />
  );
}

/* 17. Dividend Yield ────────────────────────────────────────────────────── */
function DividendYield() {
  const [price, setPrice] = useState("500");
  const [annual, setAnnual] = useState("30");
  const [qty, setQty] = useState("500");
  const [taxRate, setTaxRate] = useState("15");
  type R = { grossYield: number; netYield: number; annualIncome: number; netIncome: number; costBasis: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const p=nv(price),d=nv(annual),q=nv(qty),tr=nv(taxRate)/100;
    const grossYield=p>0?(d/p)*100:0,netDiv=d*(1-tr),netYield=p>0?(netDiv/p)*100:0;
    setRes({grossYield,netYield,annualIncome:d*q,netIncome:netDiv*q,costBasis:p*q});
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <Input label="Current Share Price (PKR)" value={price} onChange={setPrice} prefix="₨" />
          <Input label="Annual Dividend per Share" value={annual} onChange={setAnnual} prefix="₨" />
          <Input label="Shares Held" value={qty} onChange={setQty} />
          <Input label="WHT on Dividends (%)" value={taxRate} onChange={setTaxRate} prefix="%" />
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
            <div style={{ borderRadius:10,padding:"12px",background:"rgba(22,163,74,0.08)",border:"1px solid rgba(22,163,74,0.2)",textAlign:"center" }}>
              <div style={{ fontSize:9,fontWeight:700,color:"#16a34a",textTransform:"uppercase" }}>Gross Yield</div>
              <div style={{ fontSize:20,fontWeight:900,color:"#16a34a" }}>{fmt(res.grossYield)}%</div>
            </div>
            <div style={{ borderRadius:10,padding:"12px",background:"rgba(212,151,26,0.08)",border:"1px solid rgba(212,151,26,0.2)",textAlign:"center" }}>
              <div style={{ fontSize:9,fontWeight:700,color:GOLD,textTransform:"uppercase" }}>Net Yield</div>
              <div style={{ fontSize:20,fontWeight:900,color:GOLD }}>{fmt(res.netYield)}%</div>
            </div>
          </div>
          <Row label="Annual Gross Income" value={`₨${fmtM(res.annualIncome)}`} />
          <Row label="Annual Net Income (after WHT)" value={`₨${fmtM(res.netIncome)}`} color="#16a34a" highlight />
          <Row label="Cost Basis" value={`₨${fmtM(res.costBasis)}`} />
        </div>
      )}
    />
  );
}

/* 18. P/E Valuation ─────────────────────────────────────────────────────── */
function PEValuation() {
  const [eps, setEps] = useState("20");
  const [curPE, setCurPE] = useState("10");
  const [curPrice, setCurPrice] = useState("200");
  type R = { rows: {pe:number;value:number;upside:number;signal:string}[] };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const e=nv(eps),cp=nv(curPrice);
    const multiples=[5,8,10,12,15,18,20,25,30,35];
    const rows=multiples.map(pe=>{ const value=pe*e,upside=cp>0?((value/cp)-1)*100:0; const signal=upside>20?"Strong Buy":upside>0?"Buy":upside>-20?"Hold":"Sell"; return {pe,value,upside,signal}; });
    setRes({rows});
  }
  const sigColor=(s:string)=>s==="Strong Buy"?"#16a34a":s==="Buy"?"#22c55e":s==="Hold"?GOLD:"#dc2626";
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <FullCol><Input label="Earnings Per Share (EPS)" value={eps} onChange={setEps} prefix="₨" /></FullCol>
          <Input label="Current P/E" value={curPE} onChange={setCurPE} />
          <Input label="Current Market Price" value={curPrice} onChange={setCurPrice} prefix="₨" />
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div style={{ borderRadius:10,overflow:"hidden",border:"1px solid var(--border)" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
            <thead><tr style={{ background:NAVY }}>{["P/E","Fair Value","Upside","Signal"].map(h=><th key={h} style={{ padding:"8px 10px",textAlign:"right",color:"rgba(255,255,255,0.7)",fontWeight:700,fontSize:10 }}>{h}</th>)}</tr></thead>
            <tbody>
              {res.rows.map(r=>(
                <tr key={r.pe} style={{ borderBottom:"1px solid var(--border)",background:r.pe===nv(curPE)?"rgba(212,151,26,0.07)":"transparent" }}>
                  <td style={{ padding:"6px 10px",textAlign:"right",fontWeight:r.pe===nv(curPE)?800:400,color:r.pe===nv(curPE)?GOLD:"var(--text-primary)" }}>{r.pe}x</td>
                  <td style={{ padding:"6px 10px",textAlign:"right",fontVariantNumeric:"tabular-nums" }}>₨{fmt(r.value)}</td>
                  <td style={{ padding:"6px 10px",textAlign:"right",color:r.upside>=0?"#16a34a":"#dc2626",fontWeight:700 }}>{r.upside>=0?"+":""}{fmt(r.upside)}%</td>
                  <td style={{ padding:"6px 10px",textAlign:"right",fontWeight:700,color:sigColor(r.signal) }}>{r.signal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    />
  );
}

/* 19. DRIP ───────────────────────────────────────────────────────────────── */
function DRIPCalc() {
  const [shares, setShares] = useState("1000");
  const [price, setPrice] = useState("500");
  const [div, setDiv] = useState("25");
  const [growth, setGrowth] = useState("10");
  const [years, setYears] = useState("10");
  type Row2 = { yr: number; shares: number; price: number; income: number; value: number };
  const [rows, setRows] = useState<Row2[]>([]);
  function calc() {
    const s0=nv(shares),p0=nv(price),d0=nv(div),g=nv(growth)/100,y=nv(years);
    const data: Row2[]=[];let sh=s0,p=p0,d=d0;
    for (let yr=1;yr<=y;yr++) { p*=(1+g);d*=(1+g);const income=sh*d;sh+=income/p;data.push({yr,shares:Math.round(sh*100)/100,price:Math.round(p*100)/100,income:Math.round(income),value:Math.round(sh*p)}); }
    setRows(data);
  }
  const last=rows[rows.length-1];
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <Input label="Shares Held" value={shares} onChange={setShares} />
          <Input label="Current Price (PKR)" value={price} onChange={setPrice} prefix="₨" />
          <Input label="Annual Dividend per Share" value={div} onChange={setDiv} prefix="₨" />
          <Input label="Annual Growth Rate (%)" value={growth} onChange={setGrowth} prefix="%" />
          <FullCol><Input label="Years" value={years} onChange={setYears} /></FullCol>
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={rows.length>0 && last && (
        <div>
          <BigResult label={`Final Portfolio Value (Yr ${years})`} value={`₨${fmtM(last.value)}`} sub={`Shares: ${fmt(last.shares,1)} · Price: ₨${fmt(last.price)}`} color="#16a34a" />
          <LineAreaSVG data={rows.map(r=>r.value)} color="#16a34a" label="Portfolio Value Growth" />
          <div style={{ overflowX:"auto",marginTop:8 }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11 }}>
              <thead><tr>{["Year","Shares","Dividend","Value"].map(h=><th key={h} style={{ padding:"4px 8px",textAlign:"right",color:"var(--text-muted)",fontWeight:700,fontSize:10,borderBottom:"1px solid var(--border)" }}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map(r=>(
                  <tr key={r.yr} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"4px 8px",textAlign:"right" }}>Yr {r.yr}</td>
                    <td style={{ padding:"4px 8px",textAlign:"right" }}>{fmt(r.shares,1)}</td>
                    <td style={{ padding:"4px 8px",textAlign:"right",color:"#16a34a" }}>₨{fmtM(r.income)}</td>
                    <td style={{ padding:"4px 8px",textAlign:"right",fontWeight:700 }}>₨{fmtM(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    />
  );
}

/* 20. Rights Issue ──────────────────────────────────────────────────────── */
function RightsIssue() {
  const [curPrice, setCurPrice] = useState("200");
  const [issuePrice, setIssuePrice] = useState("100");
  const [ratio, setRatio] = useState("1");
  const [held, setHeld] = useState("1000");
  type R = { terp: number; newShares: number; totalShares: number; newValue: number; gain: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const mp=nv(curPrice),ip=nv(issuePrice),r=nv(ratio),h=nv(held);
    const newSh=Math.floor(h/r),totSh=h+newSh,terp=(h*mp+newSh*ip)/totSh;
    const newVal=totSh*terp,origVal=h*mp,cashPaid=newSh*ip;
    setRes({terp,newShares:newSh,totalShares:totSh,newValue:newVal,gain:newVal-origVal-cashPaid});
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <Input label="Current Market Price (PKR)" value={curPrice} onChange={setCurPrice} prefix="₨" />
          <Input label="Rights Issue Price (PKR)" value={issuePrice} onChange={setIssuePrice} prefix="₨" />
          <Input label="Rights Ratio (1 new per X held)" value={ratio} onChange={setRatio} />
          <Input label="Shares Currently Held" value={held} onChange={setHeld} />
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label="TERP (Theoretical Ex-Rights Price)" value={`₨${fmt(res.terp)}`} sub={`Net gain/loss: ${res.gain>=0?"+":""}₨${fmtM(res.gain)}`} color={GOLD} />
          <Row label="New Shares Received" value={res.newShares.toLocaleString()} />
          <Row label="Total Shares After Rights" value={res.totalShares.toLocaleString()} />
          <Row label="Portfolio Value After Rights" value={`₨${fmtM(res.newValue)}`} />
          <Row label="Net Gain / Loss" value={`${res.gain>=0?"+":""}₨${fmtM(res.gain)}`} color={res.gain>=0?"#16a34a":"#dc2626"} highlight />
        </div>
      )}
    />
  );
}

/* 21. IPO Allotment ─────────────────────────────────────────────────────── */
function IPOAllotment() {
  const [applied, setApplied] = useState("5000");
  const [lotSize, setLotSize] = useState("500");
  const [issuePrice, setIssuePrice] = useState("50");
  const [listingPrice, setListingPrice] = useState("75");
  const [totalApps, setTotalApps] = useState("500000");
  const [totalShares, setTotalShares] = useState("100000000");
  type R = { allotment: number; lotCost: number; listingGain: number; gainPct: number; oversubscribed: number };
  const [res, setRes] = useState<R | null>(null);
  function calc() {
    const apps=nv(applied),ls=nv(lotSize),ip=nv(issuePrice),lp=nv(listingPrice),ta=nv(totalApps),ts=nv(totalShares);
    const overSub=ta>0?(ta*ls)/ts:1,allotment=overSub>1?Math.floor(ls/overSub):ls;
    const lotCost=allotment*ip,listingGain=allotment*(lp-ip),gainPct=ip>0?((lp-ip)/ip)*100:0;
    setRes({allotment,lotCost,listingGain,gainPct,oversubscribed:overSub});
  }
  return (
    <SplitCalc
      inputs={
        <InputGrid>
          <Input label="Applications Submitted" value={applied} onChange={setApplied} />
          <Input label="Lot Size (Shares per App)" value={lotSize} onChange={setLotSize} />
          <Input label="IPO Issue Price (PKR)" value={issuePrice} onChange={setIssuePrice} prefix="₨" />
          <Input label="Expected Listing Price (PKR)" value={listingPrice} onChange={setListingPrice} prefix="₨" />
          <Input label="Total Applications (Market)" value={totalApps} onChange={setTotalApps} />
          <Input label="Total Shares Offered" value={totalShares} onChange={setTotalShares} />
          <FullCol><CalcBtn onClick={calc} /></FullCol>
        </InputGrid>
      }
      result={res && (
        <div>
          <BigResult label="Expected Listing Gain" value={`+₨${fmtM(res.listingGain)}`} sub={`Listing gain %: +${fmt(res.gainPct)}%`} color="#16a34a" />
          <Row label="Oversubscription" value={`${fmt(res.oversubscribed)}x`} color={res.oversubscribed>5?"#dc2626":GOLD} />
          <Row label="Allotted Shares (per app)" value={res.allotment.toLocaleString()} highlight />
          <Row label="Investment Required" value={`₨${fmtM(res.lotCost)}`} />
          <Row label="Listing Gain %" value={`${fmt(res.gainPct)}%`} color="#16a34a" />
        </div>
      )}
    />
  );
}

/* 22. Portfolio Stress Test ─────────────────────────────────────────────── */
function StressTest() {
  const [stocks, setStocks] = useState([
    {sym:"OGDC",weight:"25"},{sym:"HBL",weight:"20"},{sym:"LUCK",weight:"20"},{sym:"TRG",weight:"15"},{sym:"FFC",weight:"20"},
  ]);
  const [portfolio, setPortfolio] = useState("1000000");
  type SR = { scenario: string; change: number; pnl: number; finalVal: number; color: string };
  const [res, setRes] = useState<SR[] | null>(null);
  const BETAS: Record<string,number> = {OGDC:0.85,PPL:0.90,HBL:1.10,UBL:1.05,MCB:1.00,LUCK:1.20,DGKC:1.25,ENGRO:0.95,FFC:0.80,TRG:1.50,SYS:1.40,MEBL:1.15,HUBC:0.75,NML:1.05};
  const SCENARIOS=[{scenario:"Bull Run (+30%)",mkt:30,color:"#16a34a"},{scenario:"Moderate Rally (+15%)",mkt:15,color:"#22c55e"},{scenario:"Sideways (0%)",mkt:0,color:"#64748b"},{scenario:"Correction (-15%)",mkt:-15,color:"#f59e0b"},{scenario:"Bear Market (-30%)",mkt:-30,color:"#dc2626"},{scenario:"Crash (-50%)",mkt:-50,color:"#7f1d1d"}];
  function calc() {
    const pv=nv(portfolio),totalW=stocks.reduce((a,s)=>a+nv(s.weight),0);
    const results=SCENARIOS.map(sc=>{
      const weightedChg=stocks.reduce((a,s)=>{const w=nv(s.weight)/totalW;const beta=BETAS[s.sym]??1.0;return a+w*beta*sc.mkt;},0);
      const pnl=pv*(weightedChg/100);
      return {scenario:sc.scenario,change:weightedChg,pnl,finalVal:pv+pnl,color:sc.color};
    });
    setRes(results);
  }
  return (
    <SplitCalc
      inputs={
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          <Input label="Portfolio Value (PKR)" value={portfolio} onChange={setPortfolio} prefix="₨" />
          <div style={{ fontSize:10,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"0.06em" }}>Stocks & Weights (%)</div>
          {stocks.map((s,i)=>(
            <div key={i} style={{ display:"flex",gap:8 }}>
              <input value={s.sym} onChange={e=>setStocks(stocks.map((x,j)=>j===i?{...x,sym:e.target.value.toUpperCase()}:x))}
                placeholder="Symbol" style={{ width:80,padding:"8px 10px",border:"1.5px solid var(--border)",borderRadius:8,background:"var(--card-bg)",color:"var(--text-primary)",fontSize:12,fontWeight:700 }} />
              <input type="number" value={s.weight} onChange={e=>setStocks(stocks.map((x,j)=>j===i?{...x,weight:e.target.value}:x))}
                placeholder="Weight %" style={{ flex:1,padding:"8px 10px",border:"1.5px solid var(--border)",borderRadius:8,background:"var(--card-bg)",color:"var(--text-primary)",fontSize:12 }} />
            </div>
          ))}
          <CalcBtn onClick={calc} label="Run Stress Test →" />
        </div>
      }
      result={res && (
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {res.map(r=>(
            <div key={r.scenario} style={{ borderRadius:10,padding:"12px 14px",border:`1px solid ${r.color}40`,background:r.color+"0a",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:11,fontWeight:700,color:r.color }}>{r.scenario}</div>
                <div style={{ fontSize:10,color:"var(--text-muted)",marginTop:2 }}>Portfolio: ₨{fmtM(r.finalVal)}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:16,fontWeight:900,color:r.color }}>{r.change>=0?"+":""}{fmt(r.change)}%</div>
                <div style={{ fontSize:11,fontWeight:700,color:r.color }}>{r.pnl>=0?"+":""}₨{fmtM(r.pnl)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    />
  );
}

/* ─── Calculator Registry ─────────────────────────────────────────────────── */
type CalcDef = { id: string; label: string; desc: string; category: string; icon: string; component: React.ReactNode };
const CALCS: CalcDef[] = [
  { id:"salary",       label:"Salary Tax",          desc:"FBR income tax with rebates for FY 2025-26 / 2026-27",              category:"general",    icon:"💼", component:<SalaryTax /> },
  { id:"zakat",        label:"Zakat",               desc:"Annual zakat obligation based on Nisab threshold",                   category:"general",    icon:"🌙", component:<ZakatCalc /> },
  { id:"apnaghar",     label:"Apna Ghar",           desc:"Home loan EMI with Year 11 rate reset impact",                      category:"general",    icon:"🏠", component:<ApnaGhar /> },
  { id:"microfinance", label:"Microfinance Loan",   desc:"True annualized cost vs. bank facility",                            category:"general",    icon:"🏦", component:<MicroFinance /> },
  { id:"exchange",     label:"Exchange Rate",        desc:"PKR cross-rates for USD, EUR, GBP, SAR, AED and more",              category:"general",    icon:"💱", component:<ExchangeRate /> },
  { id:"cagr",         label:"CAGR",                desc:"Compound annual growth rate for any investment",                    category:"investment", icon:"📈", component:<CAGRCalc /> },
  { id:"sip",          label:"SIP",                 desc:"Systematic investment plan returns with year-by-year table",        category:"investment", icon:"📅", component:<SIPCalc /> },
  { id:"compounding",  label:"Compounding",          desc:"Portfolio growth with reinvested profits",                          category:"investment", icon:"♻️", component:<CompoundingCalc /> },
  { id:"depreciation", label:"Depreciation",        desc:"Asset depreciation with inflation-adjusted real value",             category:"investment", icon:"📉", component:<DepreciationCalc /> },
  { id:"roi",          label:"ROI",                 desc:"Return on investment in PKR over any holding period",               category:"investment", icon:"💰", component:<ROICalc /> },
  { id:"drip",         label:"DRIP",                desc:"Dividend reinvestment — compounding shares & value over years",     category:"investment", icon:"🔁", component:<DRIPCalc /> },
  { id:"stress",       label:"Stress Test 🆕",       desc:"Portfolio performance across bull, bear & crash scenarios",         category:"investment", icon:"🧪", component:<StressTest /> },
  { id:"brokerage",    label:"Brokerage / Charges", desc:"PSX commission, NCCPL, CDC, sales tax & WHT breakdown",             category:"trading",    icon:"📋", component:<BrokerageCalc /> },
  { id:"margin",       label:"Margin",              desc:"Leveraged exposure, financing cost & margin call level",            category:"trading",    icon:"⚖️", component:<MarginCalc /> },
  { id:"position",     label:"Position Sizing",     desc:"Optimal share quantity based on risk % and stop loss",              category:"trading",    icon:"🎯", component:<PositionSizing /> },
  { id:"drawdown",     label:"Drawdown",            desc:"Max portfolio loss from peak & time to full recovery",              category:"trading",    icon:"📊", component:<DrawdownCalc /> },
  { id:"dcf",          label:"DCF Valuation",       desc:"Intrinsic value via discounted cash flow analysis",                 category:"valuation",  icon:"🔬", component:<DCFCalc /> },
  { id:"peg",          label:"Peter Lynch PEG",     desc:"Fair value using EPS growth + dividend yield method",               category:"valuation",  icon:"🦅", component:<PeterLynch /> },
  { id:"pe",           label:"P/E Valuation",       desc:"Fair value at 10 different P/E multiples with buy/sell signals",    category:"valuation",  icon:"🔢", component:<PEValuation /> },
  { id:"dividend",     label:"Dividend Yield",      desc:"Gross & net yield after 15% WHT with income projection",           category:"valuation",  icon:"💵", component:<DividendYield /> },
  { id:"rights",       label:"Rights Issue",        desc:"TERP, new shares and net gain from a rights offering",             category:"corporate",  icon:"📜", component:<RightsIssue /> },
  { id:"ipo",          label:"IPO Allotment",       desc:"Expected allotment and listing gain based on oversubscription",     category:"corporate",  icon:"🚀", component:<IPOAllotment /> },
];

const CAT_META: Record<string,{label:string;color:string;icon:string}> = {
  all:        {label:"All",        color:GOLD,      icon:"✦"},
  general:    {label:"General",    color:"#60a5fa", icon:"⚙"},
  investment: {label:"Investment", color:"#34d399", icon:"📈"},
  trading:    {label:"Trading",    color:"#f472b6", icon:"⚡"},
  valuation:  {label:"Valuation",  color:"#a78bfa", icon:"🔬"},
  corporate:  {label:"Corporate",  color:"#fb923c", icon:"🏢"},
};
const CATS = ["all","general","investment","trading","valuation","corporate"];

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function ToolsClient() {
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [calcSearch, setCalcSearch] = useState("");

  // Grid search (main page)
  const gridFiltered = useMemo(() => {
    let list = cat === "all" ? CALCS : CALCS.filter(c => c.category === cat);
    if (search) { const q = search.toLowerCase(); list = list.filter(c => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)); }
    return list;
  }, [cat, search]);

  // Sidebar search (calculator view)
  const sideFiltered = useMemo(() => {
    if (!calcSearch) return CALCS;
    const q = calcSearch.toLowerCase();
    return CALCS.filter(c => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q));
  }, [calcSearch]);

  const current = useMemo(() => CALCS.find(c => c.id === selected) ?? null, [selected]);

  function openCalc(id: string) { setSelected(id); setCalcSearch(""); }
  function backToGrid() { setSelected(null); setCalcSearch(""); }

  /* ── CALCULATOR VIEW ─────────────────────────────────────────────────────── */
  if (selected && current) {
    const accent = CAT_META[current.category]?.color ?? GOLD;
    const showDrop = calcSearch.trim().length > 0;
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "var(--bg)", boxSizing: "border-box" }}>

        {/* ── Top navigation bar ── */}
        <div style={{ background: NAVY, padding: "0 24px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0, height: 60, borderBottom: `3px solid ${accent}` }}>
          {/* Back */}
          <button onClick={backToGrid}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "6px 14px", color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}>
            ← All Calculators
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.12)", flexShrink: 0 }} />

          {/* Icon + name */}
          <div style={{ width: 34, height: 34, borderRadius: 9, background: accent + "22", border: `1px solid ${accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{current.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#fff", whiteSpace: "nowrap" }}>{current.label}</span>
              <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: accent + "25", color: accent, textTransform: "uppercase", letterSpacing: "0.07em", flexShrink: 0 }}>{CAT_META[current.category]?.label}</span>
            </div>
          </div>

          {/* Search bar to switch calculator */}
          <div style={{ position: "relative", flexShrink: 0, width: 270 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "rgba(255,255,255,0.35)", pointerEvents: "none" }}>🔍</span>
            <input
              value={calcSearch}
              onChange={e => setCalcSearch(e.target.value)}
              onBlur={() => setTimeout(() => setCalcSearch(""), 200)}
              placeholder="Switch calculator…"
              style={{ width: "100%", boxSizing: "border-box", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 12, outline: "none" }} />
            {showDrop && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 999, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", overflow: "hidden", maxHeight: 320, overflowY: "auto" }}>
                {sideFiltered.length === 0
                  ? <div style={{ padding: "16px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>No results</div>
                  : sideFiltered.map(c => {
                    const a = CAT_META[c.category]?.color ?? GOLD;
                    return (
                      <button key={c.id} onMouseDown={() => openCalc(c.id)}
                        style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: c.id === selected ? a + "14" : "transparent", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                        onMouseEnter={e => { if (c.id !== selected) e.currentTarget.style.background = "var(--light-bg)"; }}
                        onMouseLeave={e => { if (c.id !== selected) e.currentTarget.style.background = "transparent"; }}>
                        <span style={{ fontSize: 15, width: 24, textAlign: "center", flexShrink: 0 }}>{c.icon}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: c.id === selected ? a : "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.label}</div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.desc}</div>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10, background: a + "18", color: a, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>{CAT_META[c.category]?.label}</span>
                      </button>
                    );
                  })
                }
              </div>
            )}
          </div>
        </div>

        {/* ── Calculator content — full width, no sidebar ── */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {current.component}
        </div>
      </div>
    );
  }

  /* ── GRID VIEW ───────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "28px 28px 40px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Stockifyy · Financial Tools</div>
            <h1 style={{ fontSize: 30, fontWeight: 900, margin: 0, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              {CALCS.length} <span style={{ color: GOLD }}>Calculators</span>
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "6px 0 0" }}>Click any calculator to open it — inputs, results, and guide all in one place.</p>
          </div>
          {/* Search */}
          <div style={{ position: "relative", width: 280, flexShrink: 0 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, pointerEvents: "none", color: "var(--text-muted)" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search calculators…"
              style={{ width: "100%", boxSizing: "border-box", paddingLeft: 36, paddingRight: 14, paddingTop: 11, paddingBottom: 11, borderRadius: 12, border: "1.5px solid var(--border)", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
          </div>
        </div>

        {/* Category filter pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {CATS.map(key => {
            const m = CAT_META[key];
            const count = key === "all" ? CALCS.length : CALCS.filter(c => c.category === key).length;
            const active = cat === key;
            return (
              <button key={key} onClick={() => { setCat(key); setSearch(""); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 24, border: active ? `2px solid ${m.color}` : "1.5px solid var(--border)", background: active ? m.color + "18" : "var(--card-bg)", color: active ? m.color : "var(--text-muted)", fontWeight: active ? 800 : 600, fontSize: 12, cursor: "pointer", transition: "all 0.15s" }}>
                <span style={{ fontSize: 14 }}>{m.icon}</span>
                <span>{m.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 10, background: active ? m.color + "30" : "var(--light-bg)" }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Calculator cards grid */}
        {search && gridFiltered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>No calculators found for &ldquo;{search}&rdquo;</div>
            <button onClick={() => setSearch("")} style={{ marginTop: 14, padding: "8px 20px", borderRadius: 8, border: "none", background: NAVY, color: GOLD, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Clear Search</button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 14 }}>
            {gridFiltered.map(c => {
              const accent = CAT_META[c.category]?.color ?? GOLD;
              return (
                <button key={c.id} onClick={() => openCalc(c.id)}
                  style={{ textAlign: "left", background: "var(--card-bg)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "20px", cursor: "pointer", transition: "all 0.18s", display: "flex", flexDirection: "column", gap: 10 }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = accent; el.style.boxShadow = `0 8px 28px ${accent}22`; el.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "var(--border)"; el.style.boxShadow = "none"; el.style.transform = "none"; }}>
                  {/* Top: icon + category */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: accent + "18", border: `1.5px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{c.icon}</div>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 20, background: accent + "18", color: accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>{CAT_META[c.category]?.label}</span>
                  </div>
                  {/* Name + description */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4, lineHeight: 1.3 }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{c.desc}</div>
                  </div>
                  {/* Open button */}
                  <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Open calculator</span>
                    <span style={{ width: 28, height: 28, borderRadius: 8, background: accent + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: accent, fontWeight: 900 }}>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
