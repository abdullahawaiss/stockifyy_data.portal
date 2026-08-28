"use client";
import { useState, useMemo } from "react";

type CalcId = "roi"|"cagr"|"sip"|"compound"|"dcf"|"tax"|"depreciation"|"fx"|"zakat";

interface Calc {
  id: CalcId;
  title: string;
  subtitle: string;
  icon: string;
  category: "investment" | "tax";
}

const CALCS: Calc[] = [
  { id:"roi",          title:"ROI Calculator",           subtitle:"Return on investment — profit/loss vs cost", icon:"📈", category:"investment" },
  { id:"cagr",         title:"CAGR Calculator",          subtitle:"Compound Annual Growth Rate between two values", icon:"📊", category:"investment" },
  { id:"sip",          title:"SIP Calculator",           subtitle:"Project wealth from regular monthly investments", icon:"💰", category:"investment" },
  { id:"compound",     title:"Compounding Calculator",   subtitle:"See how interest compounds over time", icon:"🔄", category:"investment" },
  { id:"dcf",          title:"DCF Calculator",           subtitle:"Present value of future cash flows", icon:"🏦", category:"investment" },
  { id:"tax",          title:"Salary Tax Calculator",    subtitle:"Pakistan income tax on salary (FY 2024-25 slabs)", icon:"🧾", category:"tax" },
  { id:"depreciation", title:"Depreciation Calculator",  subtitle:"Straight-line, declining & double-declining schedules", icon:"⚙️", category:"tax" },
  { id:"fx",           title:"Exchange Rate Calculator", subtitle:"Convert PKR ↔ major currencies at any rate", icon:"💱", category:"tax" },
  { id:"zakat",        title:"Zakat Calculator",         subtitle:"Annual Zakat (2.5%) on savings, gold, silver & investments", icon:"☪️", category:"tax" },
];

function fmt(n: number, dec = 2) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-PK", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

const INPUT: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1.5px solid var(--border,#e2e8f0)",
  borderRadius: 8, fontSize: 13, boxSizing: "border-box", background: "var(--background,#f8fafc)",
  color: "var(--text,#1e293b)", outline: "none",
};
const LABEL: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted,#64748b)",
  marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em",
};
const BTN: React.CSSProperties = {
  width: "100%", padding: "10px", borderRadius: 8, border: "none",
  background: "#C8860A", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4,
};

function StatBox({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 8, background: "var(--background,#f8fafc)", border: "1px solid var(--border,#e2e8f0)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: color ?? "var(--navy)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ bars }: { bars: { label: string; value: number; color: string; max: number }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
      {bars.map(b => (
        <div key={b.label}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 3 }}>
            <span>{b.label}</span>
            <span style={{ color: b.color }}>Rs {fmt(b.value, 0)}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "var(--border,#e2e8f0)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.max(2, (b.value / b.max) * 100)}%`, background: b.color, borderRadius: 4, transition: "width 0.5s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ROI ──
function ROI() {
  const [cost, setCost] = useState(""); const [gain, setGain] = useState(""); const [yrs, setYrs] = useState("");
  const [res, setRes] = useState<{ roi: number; netPL: number; annualized: number | null; finalVal: number } | null>(null);

  function calc() {
    const c = parseFloat(cost), g = parseFloat(gain), y = parseFloat(yrs);
    if (c > 0) {
      const netPL = g - c, roi = (netPL / c) * 100;
      const annualized = y > 0 ? (Math.pow(g / c, 1 / y) - 1) * 100 : null;
      setRes({ roi, netPL, annualized, finalVal: g });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div><label style={LABEL}>Initial Investment (Rs)</label><input style={INPUT} type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="100,000" /></div>
      <div><label style={LABEL}>Final Value / Exit Value (Rs)</label><input style={INPUT} type="number" value={gain} onChange={e => setGain(e.target.value)} placeholder="130,000" /></div>
      <div><label style={LABEL}>Duration (Years, optional)</label><input style={INPUT} type="number" value={yrs} onChange={e => setYrs(e.target.value)} placeholder="3" /></div>
      <button style={BTN} onClick={calc}>Calculate ROI</button>
      {res !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <StatBox label="ROI" value={`${res.roi >= 0 ? "+" : ""}${fmt(res.roi)}%`} color={res.roi >= 0 ? "#16a34a" : "#dc2626"} />
            <StatBox label="Net P/L" value={`${res.netPL >= 0 ? "+" : ""}Rs ${fmt(Math.abs(res.netPL))}`} color={res.netPL >= 0 ? "#16a34a" : "#dc2626"} />
            <StatBox label="Final Value" value={`Rs ${fmt(res.finalVal)}`} />
            {res.annualized !== null && <StatBox label="Annualized Return" value={`${res.annualized >= 0 ? "+" : ""}${fmt(res.annualized)}%`} sub="per year" color={res.annualized >= 0 ? "#16a34a" : "#dc2626"} />}
          </div>
          <BarChart bars={[
            { label: "Initial Investment", value: parseFloat(cost), color: "#64748b", max: res.finalVal },
            { label: "Final Value", value: res.finalVal, color: res.roi >= 0 ? "#16a34a" : "#dc2626", max: res.finalVal },
          ]} />
        </div>
      )}
    </div>
  );
}

// ── CAGR ──
function CAGR() {
  const [start, setStart] = useState(""); const [end, setEnd] = useState(""); const [yrs, setYrs] = useState("");
  const [res, setRes] = useState<{ cagr: number; totalReturn: number; growth: number } | null>(null);

  function calc() {
    const s = parseFloat(start), e = parseFloat(end), y = parseFloat(yrs);
    if (s > 0 && y > 0) {
      const cagr = (Math.pow(e / s, 1 / y) - 1) * 100;
      setRes({ cagr, totalReturn: ((e - s) / s) * 100, growth: e - s });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div><label style={LABEL}>Beginning Value (Rs)</label><input style={INPUT} type="number" value={start} onChange={e => setStart(e.target.value)} placeholder="100,000" /></div>
      <div><label style={LABEL}>Ending Value (Rs)</label><input style={INPUT} type="number" value={end} onChange={e => setEnd(e.target.value)} placeholder="200,000" /></div>
      <div><label style={LABEL}>Number of Years</label><input style={INPUT} type="number" value={yrs} onChange={e => setYrs(e.target.value)} placeholder="5" /></div>
      <button style={BTN} onClick={calc}>Calculate CAGR</button>
      {res !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <StatBox label="CAGR" value={`${fmt(res.cagr)}% / yr`} color="#16a34a" />
            <StatBox label="Total Return" value={`+${fmt(res.totalReturn)}%`} color="#16a34a" />
            <StatBox label="Absolute Growth" value={`Rs ${fmt(res.growth)}`} />
            <StatBox label="Over Period" value={`${yrs} year${parseFloat(yrs) !== 1 ? "s" : ""}`} />
          </div>
          {/* Year-by-year projection */}
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Year-by-Year Projection</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {Array.from({ length: Math.min(parseInt(yrs) || 0, 10) }, (_, i) => {
                const yr = i + 1;
                const val = parseFloat(start) * Math.pow(1 + res.cagr / 100, yr);
                const maxVal = parseFloat(end);
                return (
                  <div key={yr} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                    <span style={{ color: "var(--text-muted)", minWidth: 32 }}>Yr {yr}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--border)" }}>
                      <div style={{ height: "100%", width: `${(val / maxVal) * 100}%`, background: "#C8860A", borderRadius: 3 }} />
                    </div>
                    <span style={{ color: "var(--navy)", fontWeight: 600, minWidth: 72, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>Rs {fmt(val, 0)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SIP ──
function SIP() {
  const [monthly, setMonthly] = useState(""); const [rate, setRate] = useState(""); const [yrs, setYrs] = useState("");
  const [res, setRes] = useState<{ fv: number; invested: number; returns: number } | null>(null);

  function calc() {
    const m = parseFloat(monthly), r = parseFloat(rate) / 12 / 100, n = parseFloat(yrs) * 12;
    if (m > 0 && r > 0 && n > 0) {
      const fv = m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      const invested = m * n;
      setRes({ fv, invested, returns: fv - invested });
    }
  }

  const wealthRatio = res ? (res.returns / res.invested) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div><label style={LABEL}>Monthly Investment (Rs)</label><input style={INPUT} type="number" value={monthly} onChange={e => setMonthly(e.target.value)} placeholder="10,000" /></div>
      <div><label style={LABEL}>Expected Annual Return (%)</label><input style={INPUT} type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="12" /></div>
      <div><label style={LABEL}>Investment Period (Years)</label><input style={INPUT} type="number" value={yrs} onChange={e => setYrs(e.target.value)} placeholder="10" /></div>
      <button style={BTN} onClick={calc}>Calculate SIP Returns</button>
      {res && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <StatBox label="Future Value" value={`Rs ${fmt(res.fv, 0)}`} color="var(--navy)" />
            <StatBox label="Amount Invested" value={`Rs ${fmt(res.invested, 0)}`} />
            <StatBox label="Wealth Gained" value={`Rs ${fmt(res.returns, 0)}`} color="#16a34a" sub={`+${fmt(wealthRatio, 1)}% returns`} />
          </div>
          <BarChart bars={[
            { label: "Amount Invested", value: res.invested, color: "#64748b", max: res.fv },
            { label: "Returns Generated", value: res.returns, color: "#16a34a", max: res.fv },
            { label: "Total Corpus", value: res.fv, color: "#C8860A", max: res.fv },
          ]} />
          {/* 5-year milestones */}
          <div style={{ marginTop: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Growth Milestones</div>
            {[5, 10, 15, 20].filter(y => y <= parseFloat(yrs)).map(y => {
              const r = parseFloat(rate) / 12 / 100, n = y * 12, m = parseFloat(monthly);
              const fv = m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
              return (
                <div key={y} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                  <span style={{ color: "var(--text-muted)" }}>{y} Years</span>
                  <span style={{ fontWeight: 700, color: "var(--navy)", fontVariantNumeric: "tabular-nums" }}>Rs {fmt(fv, 0)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Compound ──
function Compound() {
  const [p, setP] = useState(""); const [r, setR] = useState(""); const [t, setT] = useState(""); const [freq, setFreq] = useState("12");
  const [res, setRes] = useState<{ fv: number; interest: number; simpleInterest: number } | null>(null);

  function calc() {
    const pp = parseFloat(p), rr = parseFloat(r) / 100, nn = parseFloat(freq), tt = parseFloat(t);
    if (pp > 0 && rr > 0 && nn > 0 && tt > 0) {
      const fv = pp * Math.pow(1 + rr / nn, nn * tt);
      const si = pp * (1 + rr * tt);
      setRes({ fv, interest: fv - pp, simpleInterest: si - pp });
    }
  }

  const freqLabel: Record<string, string> = { "1": "Annually", "2": "Semi-annually", "4": "Quarterly", "12": "Monthly", "365": "Daily" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div><label style={LABEL}>Principal Amount (Rs)</label><input style={INPUT} type="number" value={p} onChange={e => setP(e.target.value)} placeholder="100,000" /></div>
      <div><label style={LABEL}>Annual Interest Rate (%)</label><input style={INPUT} type="number" value={r} onChange={e => setR(e.target.value)} placeholder="10" /></div>
      <div>
        <label style={LABEL}>Compounding Frequency</label>
        <select style={INPUT} value={freq} onChange={e => setFreq(e.target.value)}>
          <option value="1">Annually</option><option value="2">Semi-annually</option>
          <option value="4">Quarterly</option><option value="12">Monthly</option><option value="365">Daily</option>
        </select>
      </div>
      <div><label style={LABEL}>Time Period (Years)</label><input style={INPUT} type="number" value={t} onChange={e => setT(e.target.value)} placeholder="5" /></div>
      <button style={BTN} onClick={calc}>Calculate</button>
      {res !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <StatBox label="Future Value" value={`Rs ${fmt(res.fv)}`} color="var(--navy)" />
            <StatBox label="Compound Interest" value={`Rs ${fmt(res.interest)}`} color="#16a34a" />
            <StatBox label="Simple Interest (equiv.)" value={`Rs ${fmt(res.simpleInterest)}`} />
            <StatBox label="Extra via Compounding" value={`Rs ${fmt(res.interest - res.simpleInterest)}`} color="#C8860A" sub={`${freqLabel[freq]} compounding`} />
          </div>
          <BarChart bars={[
            { label: "Principal", value: parseFloat(p), color: "#64748b", max: res.fv },
            { label: "Simple Interest", value: res.simpleInterest, color: "#94a3b8", max: res.fv },
            { label: "Compound Interest", value: res.interest, color: "#16a34a", max: res.fv },
          ]} />
        </div>
      )}
    </div>
  );
}

// ── DCF ──
function DCF() {
  const [cf, setCf] = useState(""); const [g, setG] = useState(""); const [d, setD] = useState(""); const [yrs, setYrs] = useState("5");
  const [res, setRes] = useState<{ pv: number; terminalValue: number; pvOfCFs: number; pvByYear: number[] } | null>(null);

  function calc() {
    const c = parseFloat(cf), gr = parseFloat(g) / 100, dr = parseFloat(d) / 100, y = parseInt(yrs);
    if (c > 0 && dr > gr) {
      const pvByYear: number[] = [];
      let pvOfCFs = 0;
      for (let i = 1; i <= y; i++) {
        const pv = c * Math.pow(1 + gr, i) / Math.pow(1 + dr, i);
        pvByYear.push(pv);
        pvOfCFs += pv;
      }
      const terminalValue = c * Math.pow(1 + gr, y) * (1 + gr) / (dr - gr) / Math.pow(1 + dr, y);
      setRes({ pv: pvOfCFs + terminalValue, terminalValue, pvOfCFs, pvByYear });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div><label style={LABEL}>Annual Cash Flow (Rs)</label><input style={INPUT} type="number" value={cf} onChange={e => setCf(e.target.value)} placeholder="50,000" /></div>
      <div><label style={LABEL}>Growth Rate (% / year)</label><input style={INPUT} type="number" value={g} onChange={e => setG(e.target.value)} placeholder="5" /></div>
      <div><label style={LABEL}>Discount Rate (% / year)</label><input style={INPUT} type="number" value={d} onChange={e => setD(e.target.value)} placeholder="12" /></div>
      <div>
        <label style={LABEL}>Projection Years</label>
        <select style={INPUT} value={yrs} onChange={e => setYrs(e.target.value)}>{[3, 5, 7, 10].map(v => <option key={v} value={v}>{v} years</option>)}</select>
      </div>
      <button style={BTN} onClick={calc}>Calculate DCF Valuation</button>
      {res !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <StatBox label="Intrinsic Value (DCF)" value={`Rs ${fmt(res.pv, 0)}`} color="#C8860A" />
            <StatBox label="PV of Cash Flows" value={`Rs ${fmt(res.pvOfCFs, 0)}`} />
            <StatBox label="Terminal Value" value={`Rs ${fmt(res.terminalValue, 0)}`} sub="Gordon Growth Model" />
            <StatBox label="TV as % of Total" value={`${fmt((res.terminalValue / res.pv) * 100, 1)}%`} />
          </div>
          <div style={{ marginTop: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Year-by-Year PV of Cash Flows</div>
            {res.pvByYear.map((v, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 11 }}>
                <span style={{ color: "var(--text-muted)", minWidth: 32 }}>Yr {i + 1}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--border)" }}>
                  <div style={{ height: "100%", width: `${(v / res.pvByYear[0]) * 100}%`, background: "#C8860A", borderRadius: 3 }} />
                </div>
                <span style={{ color: "var(--navy)", fontWeight: 600, minWidth: 72, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>Rs {fmt(v, 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Salary Tax ──
const TAX_SLABS = [
  { from: 0,       to: 600_000,   rate: 0,    base: 0 },
  { from: 600_000, to: 1_200_000, rate: 0.05, base: 0 },
  { from: 1_200_000,to:2_200_000, rate: 0.15, base: 30_000 },
  { from: 2_200_000,to:3_200_000, rate: 0.25, base: 180_000 },
  { from: 3_200_000,to:4_100_000, rate: 0.30, base: 430_000 },
  { from: 4_100_000,to:Infinity,  rate: 0.35, base: 700_000 },
];

function SalaryTax() {
  const [salary, setSalary] = useState("");
  const [res, setRes] = useState<{ tax: number; monthly: number; eff: number; ann: number; netMonthly: number } | null>(null);

  function calc() {
    const monthly = parseFloat(salary), ann = monthly * 12;
    let tax = 0;
    for (const s of TAX_SLABS) {
      if (ann > s.from) {
        const taxable = Math.min(ann, s.to) - s.from;
        tax = s.base + taxable * s.rate;
      }
    }
    setRes({ tax, monthly: tax / 12, eff: ann > 0 ? (tax / ann) * 100 : 0, ann, netMonthly: monthly - tax / 12 });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div><label style={LABEL}>Monthly Gross Salary (Rs)</label><input style={INPUT} type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="150,000" /></div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "8px 10px", background: "rgba(200,134,10,0.06)", borderRadius: 6, lineHeight: 1.7 }}>
        <strong style={{ color: "#C8860A" }}>FY 2024-25 Tax Slabs</strong><br />
        ≤ 600K → 0% &nbsp;|&nbsp; 600K–1.2M → 5%<br />
        1.2M–2.2M → 15% &nbsp;|&nbsp; 2.2M–3.2M → 25%<br />
        3.2M–4.1M → 30% &nbsp;|&nbsp; Above 4.1M → 35%
      </div>
      <button style={BTN} onClick={calc}>Calculate Tax</button>
      {res && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <StatBox label="Annual Tax" value={`Rs ${fmt(res.tax, 0)}`} color="#dc2626" />
            <StatBox label="Monthly Tax" value={`Rs ${fmt(res.monthly, 0)}`} color="#dc2626" />
            <StatBox label="Net Take-Home / mo" value={`Rs ${fmt(res.netMonthly, 0)}`} color="#16a34a" />
            <StatBox label="Effective Rate" value={`${fmt(res.eff)}%`} sub="of gross annual income" />
          </div>
          <BarChart bars={[
            { label: "Annual Tax", value: res.tax, color: "#dc2626", max: res.ann },
            { label: "Net Annual Income", value: res.ann - res.tax, color: "#16a34a", max: res.ann },
          ]} />
          <div style={{ marginTop: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Applicable Slab</div>
            {TAX_SLABS.map((s, i) => {
              const ann = parseFloat(salary) * 12;
              const active = ann > s.from && ann <= (s.to === Infinity ? Infinity : s.to);
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", borderRadius: 5, marginBottom: 2, fontSize: 11, background: active ? "rgba(200,134,10,0.10)" : "transparent", border: active ? "1px solid rgba(200,134,10,0.3)" : "1px solid transparent" }}>
                  <span style={{ color: active ? "#C8860A" : "var(--text-muted)" }}>
                    Rs {(s.from / 1000).toFixed(0)}K – {s.to === Infinity ? "above" : "Rs " + (s.to / 1000).toFixed(0) + "K"}
                  </span>
                  <span style={{ fontWeight: active ? 800 : 400, color: active ? "#C8860A" : "var(--text-muted)" }}>{(s.rate * 100).toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Depreciation ──
function Depreciation() {
  const [asset, setAsset] = useState(""); const [salvage, setSalvage] = useState(""); const [life, setLife] = useState(""); const [method, setMethod] = useState("sl");
  const [rows, setRows] = useState<{ year: number; dep: number; book: number; acc: number }[]>([]);

  function calc() {
    const a = parseFloat(asset), s = parseFloat(salvage), n = parseInt(life);
    if (!a || !n) return;
    const out: typeof rows = [];
    let book = a, acc = 0;
    for (let i = 1; i <= n; i++) {
      let dep = 0;
      if (method === "sl") dep = (a - s) / n;
      else if (method === "db") dep = book * (2 / n);
      else dep = book * (1 / n) * 2;
      dep = Math.min(dep, Math.max(0, book - s));
      book -= dep; acc += dep;
      out.push({ year: i, dep, book: Math.max(s, book), acc });
    }
    setRows(out);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div><label style={LABEL}>Asset Cost (Rs)</label><input style={INPUT} type="number" value={asset} onChange={e => setAsset(e.target.value)} placeholder="500,000" /></div>
      <div><label style={LABEL}>Salvage Value (Rs)</label><input style={INPUT} type="number" value={salvage} onChange={e => setSalvage(e.target.value)} placeholder="50,000" /></div>
      <div><label style={LABEL}>Useful Life (Years)</label><input style={INPUT} type="number" value={life} onChange={e => setLife(e.target.value)} placeholder="5" /></div>
      <div>
        <label style={LABEL}>Method</label>
        <select style={INPUT} value={method} onChange={e => setMethod(e.target.value)}>
          <option value="sl">Straight-Line</option>
          <option value="db">Declining Balance</option>
          <option value="ddb">Double Declining Balance</option>
        </select>
      </div>
      <button style={BTN} onClick={calc}>Calculate Depreciation</button>
      {rows.length > 0 && (
        <div style={{ overflowX: "auto", marginTop: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                {["Yr", "Depreciation", "Accumulated", "Book Value"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "right", color: "var(--text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.year} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "var(--navy)" }}>{r.year}</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>Rs {fmt(r.dep, 0)}</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", color: "#64748b", fontVariantNumeric: "tabular-nums" }}>Rs {fmt(r.acc, 0)}</td>
                  <td style={{ padding: "6px 10px", textAlign: "right", color: "#16a34a", fontVariantNumeric: "tabular-nums" }}>Rs {fmt(r.book, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── FX ──
const RATES: Record<string, number> = { USD: 278.5, EUR: 302.1, GBP: 352.3, AED: 75.8, SAR: 74.2, CAD: 205.4, AUD: 181.6, CNY: 38.4, JPY: 1.87, INR: 3.35 };
const CURRENCY_NAMES: Record<string, string> = { PKR: "Pakistani Rupee", USD: "US Dollar", EUR: "Euro", GBP: "British Pound", AED: "UAE Dirham", SAR: "Saudi Riyal", CAD: "Canadian Dollar", AUD: "Australian Dollar", CNY: "Chinese Yuan", JPY: "Japanese Yen", INR: "Indian Rupee" };

function FX() {
  const [amount, setAmount] = useState(""); const [from, setFrom] = useState("PKR"); const [to, setTo] = useState("USD");
  const [res, setRes] = useState<{ converted: number; rate: number; inverse: number } | null>(null);
  const currencies = ["PKR", ...Object.keys(RATES)];

  function calc() {
    const a = parseFloat(amount); if (!a) return;
    const pkr = from === "PKR" ? a : a * RATES[from];
    const converted = to === "PKR" ? pkr : pkr / RATES[to];
    const rate = from === "PKR" ? (to === "PKR" ? 1 : 1 / RATES[to]) : (to === "PKR" ? RATES[from] : RATES[from] / RATES[to]);
    setRes({ converted, rate, inverse: 1 / rate });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div><label style={LABEL}>Amount</label><input style={INPUT} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1,000" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={LABEL}>From</label>
          <select style={INPUT} value={from} onChange={e => setFrom(e.target.value)}>
            {currencies.map(c => <option key={c} value={c}>{c} — {CURRENCY_NAMES[c]}</option>)}
          </select>
        </div>
        <div>
          <label style={LABEL}>To</label>
          <select style={INPUT} value={to} onChange={e => setTo(e.target.value)}>
            {currencies.map(c => <option key={c} value={c}>{c} — {CURRENCY_NAMES[c]}</option>)}
          </select>
        </div>
      </div>
      <button style={BTN} onClick={calc}>Convert</button>
      {res !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <StatBox label={`${amount} ${from} =`} value={`${fmt(res.converted, 4)} ${to}`} color="var(--navy)" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <StatBox label={`1 ${from} in ${to}`} value={`${fmt(res.rate, 4)}`} />
            <StatBox label={`1 ${to} in ${from}`} value={`${fmt(res.inverse, 4)}`} />
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "7px 10px", background: "rgba(200,134,10,0.06)", borderRadius: 6 }}>
            ⚠️ Indicative rate only — verify with your bank for real-time rates.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Zakat ──
function Zakat() {
  const [cash, setCash] = useState(""); const [gold, setGold] = useState(""); const [silver, setSilver] = useState(""); const [inv, setInv] = useState(""); const [debt, setDebt] = useState("");
  const [res, setRes] = useState<{ total: number; zakat: number; breakdown: { label: string; value: number }[] } | null>(null);
  const NISAB = 93_500;

  function calc() {
    const c = parseFloat(cash || "0"), g = parseFloat(gold || "0"), s = parseFloat(silver || "0"), i = parseFloat(inv || "0"), d = parseFloat(debt || "0");
    const total = c + g + s + i - d;
    const breakdown = [
      { label: "Cash & Savings", value: c },
      { label: "Gold", value: g },
      { label: "Silver", value: s },
      { label: "Investments / Stocks", value: i },
      { label: "Outstanding Debt", value: -d },
    ].filter(x => x.value !== 0);
    setRes({ total, zakat: total >= NISAB ? total * 0.025 : 0, breakdown });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[
        ["Cash & Bank Savings (Rs)", cash, setCash],
        ["Gold Value (Rs)", gold, setGold],
        ["Silver Value (Rs)", silver, setSilver],
        ["Investments / Stocks (Rs)", inv, setInv],
        ["Outstanding Debt (Rs — deductible)", debt, setDebt],
      ].map(([label, val, setter]) => (
        <div key={label as string}><label style={LABEL}>{label as string}</label><input style={INPUT} type="number" value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)} placeholder="0" /></div>
      ))}
      <div style={{ fontSize: 11, color: "var(--text-muted)", padding: "6px 10px", background: "rgba(200,134,10,0.06)", borderRadius: 6 }}>
        Nisab threshold ≈ Rs {NISAB.toLocaleString()} (value of 93g gold)
      </div>
      <button style={BTN} onClick={calc}>Calculate Zakat</button>
      {res && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {res.zakat > 0 ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <StatBox label="Zakat Due (2.5%)" value={`Rs ${fmt(res.zakat, 0)}`} color="#C8860A" />
                <StatBox label="Net Zakatable Assets" value={`Rs ${fmt(res.total, 0)}`} />
              </div>
              <div style={{ marginTop: 2 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Breakdown</div>
                {res.breakdown.map(b => (
                  <div key={b.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                    <span style={{ color: "var(--text-muted)" }}>{b.label}</span>
                    <span style={{ fontWeight: 700, color: b.value < 0 ? "#dc2626" : "var(--navy)", fontVariantNumeric: "tabular-nums" }}>{b.value < 0 ? "−" : ""}Rs {fmt(Math.abs(b.value), 0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: "14px", borderRadius: 8, background: "rgba(100,116,139,0.07)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
              Net assets <strong style={{ color: "var(--navy)" }}>Rs {fmt(res.total, 0)}</strong> are below the Nisab threshold — no Zakat due.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CALC_COMPONENTS: Record<CalcId, React.FC> = { roi: ROI, cagr: CAGR, sip: SIP, compound: Compound, dcf: DCF, tax: SalaryTax, depreciation: Depreciation, fx: FX, zakat: Zakat };

// ── Main page ───────────────────────────────────────────────────────────────────
export default function ToolsClient() {
  const [active, setActive] = useState<CalcId | null>(null);
  const ActiveCalc = active ? CALC_COMPONENTS[active] : null;
  const activeCalcInfo = active ? CALCS.find(c => c.id === active) : null;

  const investment = CALCS.filter(c => c.category === "investment");
  const tax = CALCS.filter(c => c.category === "tax");

  const cardStyle = (id: CalcId): React.CSSProperties => ({
    background: "var(--card-bg,#fff)", border: `1.5px solid ${active === id ? "#C8860A" : "var(--border,#e2e8f0)"}`,
    borderRadius: 12, padding: "18px 20px", cursor: "pointer", transition: "all 200ms",
    boxShadow: active === id ? "0 0 0 3px rgba(200,134,10,0.12)" : "none",
    textAlign: "left",
  });

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
          <span style={{ color: "var(--navy)" }}>Financial</span> <span style={{ color: "#C8860A" }}>Tools</span>
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>Advanced calculators for investment planning, taxes, and financial decisions</p>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Calculator list */}
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", background: "#C8860A", borderRadius: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>Investment Calculators</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
              {investment.map(c => (
                <button key={c.id} onClick={() => setActive(c.id)} style={cardStyle(c.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: active === c.id ? "rgba(200,134,10,0.18)" : "rgba(200,134,10,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{c.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: active === c.id ? "#C8860A" : "var(--navy)" }}>{c.title}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{c.subtitle}</div>
                  <div style={{ marginTop: 10, fontSize: 12, color: "#C8860A", fontWeight: 700 }}>{active === c.id ? "▼ Open" : "Open Calculator →"}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", background: "#C8860A", borderRadius: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>Tax &amp; Financial Calculators</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
              {tax.map(c => (
                <button key={c.id} onClick={() => setActive(c.id)} style={cardStyle(c.id)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: active === c.id ? "rgba(200,134,10,0.18)" : "rgba(200,134,10,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{c.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: active === c.id ? "#C8860A" : "var(--navy)" }}>{c.title}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{c.subtitle}</div>
                  <div style={{ marginTop: 10, fontSize: 12, color: "#C8860A", fontWeight: 700 }}>{active === c.id ? "▼ Open" : "Open Calculator →"}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active calculator panel */}
        {ActiveCalc && activeCalcInfo && (
          <div style={{ flex: "0 0 340px", position: "sticky", top: 20, maxHeight: "calc(100vh - 40px)", overflowY: "auto" }}>
            <div className="card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 22 }}>{activeCalcInfo.icon}</span>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)" }}>{activeCalcInfo.title}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{activeCalcInfo.subtitle}</div>
                </div>
                <button onClick={() => setActive(null)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "var(--text-muted)" }}>✕</button>
              </div>
              <ActiveCalc />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
