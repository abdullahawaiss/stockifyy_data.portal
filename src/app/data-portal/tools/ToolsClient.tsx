"use client";
import { useState, useMemo } from "react";

type CalcId = "roi"|"cagr"|"sip"|"compound"|"dcf"|"tax"|"depreciation"|"fx"|"zakat";

interface CalcDef { id: CalcId; title: string; short: string; icon: string; accent: string }
const CALCS: CalcDef[] = [
  { id:"roi",          title:"ROI Calculator",           short:"Return on Investment",          icon:"📈", accent:"#16a34a" },
  { id:"cagr",         title:"CAGR Calculator",          short:"Compound Annual Growth Rate",   icon:"📊", accent:"#2563eb" },
  { id:"sip",          title:"SIP Calculator",           short:"Systematic Investment Plan",    icon:"💰", accent:"#D4971A" },
  { id:"compound",     title:"Compounding",              short:"Compound Interest Growth",      icon:"🔄", accent:"#7c3aed" },
  { id:"dcf",          title:"DCF Calculator",           short:"Discounted Cash Flow",          icon:"🏦", accent:"#0891b2" },
  { id:"tax",          title:"Salary Tax",               short:"Pakistan Income Tax FY 2024-25",icon:"🧾", accent:"#dc2626" },
  { id:"depreciation", title:"Depreciation",             short:"Asset Depreciation Schedule",   icon:"⚙️", accent:"#64748b" },
  { id:"fx",           title:"Currency Converter",       short:"PKR ↔ Major Currencies",        icon:"💱", accent:"#059669" },
  { id:"zakat",        title:"Zakat Calculator",         short:"Annual Zakat @ 2.5%",           icon:"☪️", accent:"#D4971A" },
];

function fmt(n: number, dec = 2) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-PK", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

// ── Shared UI primitives ─────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
      {children}
    </div>
  );
}

const INP: React.CSSProperties = {
  width: "100%", padding: "10px 13px", borderRadius: 8, boxSizing: "border-box",
  border: "1.5px solid var(--border)", background: "var(--card-bg)", fontSize: 14,
  color: "var(--text)", outline: "none", fontVariantNumeric: "tabular-nums",
  transition: "border-color 150ms",
};

function Num({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div style={{ padding: "14px 16px", borderRadius: 10, background: "var(--light-bg)", borderLeft: `3px solid ${color ?? "var(--border)"}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: color ?? "var(--text)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Hero({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ borderRadius: 14, padding: "22px 24px", background: `linear-gradient(135deg, ${color}18, ${color}08)`, border: `1.5px solid ${color}40`, marginBottom: 14 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 40, fontWeight: 900, color: color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr style={{ background: "var(--navy)" }}>
        {cols.map(c => <th key={c} style={{ padding: "8px 12px", textAlign: "right", color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{c}</th>)}
      </tr>
    </thead>
  );
}
function TRow({ cells, accent }: { cells: (string | React.ReactNode)[]; accent?: string }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      {cells.map((c, i) => (
        <td key={i} style={{ padding: "7px 12px", textAlign: "right", fontSize: 12, color: i === 0 ? (accent ?? "var(--navy)") : "var(--text)", fontWeight: i === 0 ? 700 : 400, fontVariantNumeric: "tabular-nums" }}>{c}</td>
      ))}
    </tr>
  );
}
function Table({ cols, rows, accent }: { cols: string[]; rows: (string | React.ReactNode)[][]; accent?: string }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)", marginTop: 16 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <THead cols={cols} />
        <tbody>
          {rows.map((r, i) => <TRow key={i} cells={r} accent={accent} />)}
        </tbody>
      </table>
    </div>
  );
}

// ── ROI ──────────────────────────────────────────────────────────────────────
function ROI() {
  const [cost, setCost] = useState("100000");
  const [gain, setGain] = useState("150000");
  const [yrs,  setYrs]  = useState("3");

  const res = useMemo(() => {
    const c = parseFloat(cost), g = parseFloat(gain), y = parseFloat(yrs);
    if (c > 0 && g > 0) {
      const netPL = g - c, roi = (netPL / c) * 100;
      const ann = y > 0 ? (Math.pow(g / c, 1 / y) - 1) * 100 : null;
      return { roi, netPL, ann, finalVal: g, cost: c };
    }
    return null;
  }, [cost, gain, yrs]);

  const acc = res?.roi ?? 0;
  const color = acc >= 0 ? "#16a34a" : "#dc2626";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Initial Investment (Rs)"><input style={INP} type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="100,000" /></Field>
        <Field label="Final / Exit Value (Rs)"><input style={INP} type="number" value={gain} onChange={e => setGain(e.target.value)} placeholder="150,000" /></Field>
        <Field label="Duration (Years)"><input style={INP} type="number" value={yrs} onChange={e => setYrs(e.target.value)} placeholder="3" /></Field>
      </div>
      {res && (
        <>
          <Hero label="Return on Investment" value={`${res.roi >= 0 ? "+" : ""}${fmt(res.roi)}%`} color={color} sub={`Net ${res.netPL >= 0 ? "Profit" : "Loss"}: Rs ${fmt(Math.abs(res.netPL), 0)}`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <Num label="Net Profit / Loss" value={`${res.netPL >= 0 ? "+" : "-"}Rs ${fmt(Math.abs(res.netPL), 0)}`} color={color} />
            <Num label="Final Value" value={`Rs ${fmt(res.finalVal, 0)}`} />
            {res.ann !== null && <Num label="Annualised Return" value={`${res.ann >= 0 ? "+" : ""}${fmt(res.ann)}%`} color={color} sub="per year" />}
          </div>
          <Table
            cols={["Metric", "Value"]}
            rows={[
              ["Initial Investment", `Rs ${fmt(res.cost, 0)}`],
              ["Final Value",        `Rs ${fmt(res.finalVal, 0)}`],
              ["Net Profit / Loss",  `${res.netPL >= 0 ? "+" : "−"}Rs ${fmt(Math.abs(res.netPL), 0)}`],
              ["ROI",                `${res.roi >= 0 ? "+" : ""}${fmt(res.roi)}%`],
              ...(res.ann !== null ? [["Annualised Return", `${fmt(res.ann)}%/yr`] as [string, string]] : []),
              ["Duration",           `${yrs} yr${parseFloat(yrs) !== 1 ? "s" : ""}`],
            ]}
          />
        </>
      )}
    </div>
  );
}

// ── CAGR ─────────────────────────────────────────────────────────────────────
function CAGR() {
  const [start, setStart] = useState("100000");
  const [end,   setEnd]   = useState("200000");
  const [yrs,   setYrs]   = useState("5");

  const res = useMemo(() => {
    const s = parseFloat(start), e = parseFloat(end), y = parseFloat(yrs);
    if (s > 0 && y > 0) {
      const cagr = (Math.pow(e / s, 1 / y) - 1) * 100;
      return { cagr, totalReturn: ((e - s) / s) * 100, growth: e - s, s, e, y };
    }
    return null;
  }, [start, end, yrs]);

  const tableRows = res
    ? Array.from({ length: Math.min(Math.floor(res.y), 20) }, (_, i) => {
        const yr = i + 1;
        const val = res.s * Math.pow(1 + res.cagr / 100, yr);
        const growth = ((val - res.s) / res.s) * 100;
        return [`Year ${yr}`, `Rs ${fmt(val, 0)}`, `+${fmt(growth, 2)}%`];
      })
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Beginning Value (Rs)"><input style={INP} type="number" value={start} onChange={e => setStart(e.target.value)} placeholder="100,000" /></Field>
        <Field label="Ending Value (Rs)"><input style={INP} type="number" value={end} onChange={e => setEnd(e.target.value)} placeholder="200,000" /></Field>
        <Field label="Number of Years"><input style={INP} type="number" value={yrs} onChange={e => setYrs(e.target.value)} placeholder="5" /></Field>
      </div>
      {res && (
        <>
          <Hero label="Compound Annual Growth Rate" value={`${fmt(res.cagr)}%`} color="#2563eb" sub={`Total return: +${fmt(res.totalReturn)}% over ${yrs} yrs`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <Num label="Beginning" value={`Rs ${fmt(res.s, 0)}`} />
            <Num label="Ending" value={`Rs ${fmt(res.e, 0)}`} color="#2563eb" />
            <Num label="Absolute Growth" value={`Rs ${fmt(res.growth, 0)}`} color="#16a34a" />
          </div>
          {tableRows.length > 0 && <Table cols={["Period", "Value", "Total Growth"]} rows={tableRows} accent="#2563eb" />}
        </>
      )}
    </div>
  );
}

// ── SIP ──────────────────────────────────────────────────────────────────────
function SIP() {
  const [monthly, setMonthly] = useState("10000");
  const [rate,    setRate]    = useState("12");
  const [yrs,     setYrs]     = useState("10");

  const res = useMemo(() => {
    const m = parseFloat(monthly), r = parseFloat(rate) / 12 / 100, n = parseFloat(yrs) * 12;
    if (m > 0 && r > 0 && n > 0) {
      const fv = m * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
      const invested = m * n;
      return { fv, invested, returns: fv - invested, wealthRatio: ((fv - invested) / invested) * 100, m, r, yrs: parseFloat(yrs) };
    }
    return null;
  }, [monthly, rate, yrs]);

  const milestones = res
    ? [5, 10, 15, 20].filter(y => y <= res.yrs).map(y => {
        const fv = res.m * ((Math.pow(1 + res.r, y * 12) - 1) / res.r) * (1 + res.r);
        return [`${y} Years`, `Rs ${fmt(res.m * y * 12, 0)}`, `Rs ${fmt(fv - res.m * y * 12, 0)}`, `Rs ${fmt(fv, 0)}`];
      })
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Field label="Monthly Investment (Rs)"><input style={INP} type="number" value={monthly} onChange={e => setMonthly(e.target.value)} placeholder="10,000" /></Field>
        <Field label="Expected Annual Return (%)"><input style={INP} type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="12" /></Field>
        <Field label="Investment Period (Years)"><input style={INP} type="number" value={yrs} onChange={e => setYrs(e.target.value)} placeholder="10" /></Field>
      </div>
      {res && (
        <>
          <Hero label="Maturity Amount" value={`Rs ${fmt(res.fv, 0)}`} color="#D4971A" sub={`Wealth gained: Rs ${fmt(res.returns, 0)} (+${fmt(res.wealthRatio, 1)}%)`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <Num label="Total Invested" value={`Rs ${fmt(res.invested, 0)}`} />
            <Num label="Est. Returns" value={`Rs ${fmt(res.returns, 0)}`} color="#16a34a" />
            <Num label="Maturity Amount" value={`Rs ${fmt(res.fv, 0)}`} color="#D4971A" />
          </div>
          {milestones.length > 0 && <Table cols={["Period", "Invested", "Returns", "Maturity"]} rows={milestones} accent="#D4971A" />}
        </>
      )}
    </div>
  );
}

// ── Compound ─────────────────────────────────────────────────────────────────
function Compound() {
  const [p,    setP]    = useState("100000");
  const [r,    setR]    = useState("10");
  const [t,    setT]    = useState("5");
  const [freq, setFreq] = useState("12");

  const res = useMemo(() => {
    const pp = parseFloat(p), rr = parseFloat(r) / 100, nn = parseFloat(freq), tt = parseFloat(t);
    if (pp > 0 && rr > 0 && nn > 0 && tt > 0) {
      const fv = pp * Math.pow(1 + rr / nn, nn * tt);
      const si = pp * rr * tt;
      const rows = Array.from({ length: Math.min(Math.floor(tt), 20) }, (_, i) => {
        const yr = i + 1;
        const open = pp * Math.pow(1 + rr / nn, nn * yr - nn);
        const close = pp * Math.pow(1 + rr / nn, nn * yr);
        const growth = close - open;
        return [`Year ${yr}`, `Rs ${fmt(open, 0)}`, `Rs ${fmt(growth, 0)}`, `Rs ${fmt(close, 0)}`];
      });
      return { fv, interest: fv - pp, si, pp, rows };
    }
    return null;
  }, [p, r, t, freq]);

  const freqLabel: Record<string, string> = { "1": "Annually", "2": "Semi-annually", "4": "Quarterly", "12": "Monthly", "365": "Daily" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <Field label="Principal (Rs)"><input style={INP} type="number" value={p} onChange={e => setP(e.target.value)} placeholder="100,000" /></Field>
        <Field label="Annual Rate (%)"><input style={INP} type="number" value={r} onChange={e => setR(e.target.value)} placeholder="10" /></Field>
        <Field label="Compounding">
          <select style={INP} value={freq} onChange={e => setFreq(e.target.value)}>
            <option value="1">Annually</option><option value="2">Semi-annually</option>
            <option value="4">Quarterly</option><option value="12">Monthly</option><option value="365">Daily</option>
          </select>
        </Field>
        <Field label="Duration (Years)"><input style={INP} type="number" value={t} onChange={e => setT(e.target.value)} placeholder="5" /></Field>
      </div>
      {res && (
        <>
          <Hero label="Final Amount" value={`Rs ${fmt(res.fv, 0)}`} color="#7c3aed" sub={`Compound interest: Rs ${fmt(res.interest, 0)} · ${freqLabel[freq]} compounding`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <Num label="Initial Principal" value={`Rs ${fmt(res.pp, 0)}`} />
            <Num label="Total Interest" value={`Rs ${fmt(res.interest, 0)}`} color="#7c3aed" />
            <Num label="Extra vs Simple Interest" value={`Rs ${fmt(res.interest - res.si, 0)}`} color="#16a34a" sub="compound advantage" />
          </div>
          {res.rows.length > 0 && <Table cols={["Year", "Opening Balance", "Annual Growth", "Closing Balance"]} rows={res.rows} accent="#7c3aed" />}
        </>
      )}
    </div>
  );
}

// ── DCF ──────────────────────────────────────────────────────────────────────
function DCF() {
  const [cf,  setCf]  = useState("500000");
  const [g,   setG]   = useState("5");
  const [d,   setD]   = useState("10");
  const [yrs, setYrs] = useState("5");

  const res = useMemo(() => {
    const c = parseFloat(cf), gr = parseFloat(g) / 100, dr = parseFloat(d) / 100, y = parseInt(yrs);
    if (c > 0 && dr > gr) {
      const pvByYear: number[] = [];
      let pvOfCFs = 0;
      for (let i = 1; i <= y; i++) {
        const pv = c * Math.pow(1 + gr, i) / Math.pow(1 + dr, i);
        pvByYear.push(pv);
        pvOfCFs += pv;
      }
      const tv = c * Math.pow(1 + gr, y) * (1 + gr) / (dr - gr) / Math.pow(1 + dr, y);
      return { pv: pvOfCFs + tv, tv, pvOfCFs, pvByYear, c };
    }
    return null;
  }, [cf, g, d, yrs]);

  const tableRows = res?.pvByYear.map((v, i) => {
    const fcf = res.c * Math.pow(1 + parseFloat(g) / 100, i + 1);
    return [`Year ${i + 1}`, `Rs ${fmt(fcf, 0)}`, `${d}%`, `Rs ${fmt(v, 0)}`];
  }) ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <Field label="Base Cash Flow (Rs)"><input style={INP} type="number" value={cf} onChange={e => setCf(e.target.value)} placeholder="500,000" /></Field>
        <Field label="Growth Rate (%)"><input style={INP} type="number" value={g} onChange={e => setG(e.target.value)} placeholder="5" /></Field>
        <Field label="Discount Rate (%)"><input style={INP} type="number" value={d} onChange={e => setD(e.target.value)} placeholder="10" /></Field>
        <Field label="Projection Years">
          <select style={INP} value={yrs} onChange={e => setYrs(e.target.value)}>
            {[3, 5, 7, 10].map(v => <option key={v} value={v}>{v} years</option>)}
          </select>
        </Field>
      </div>
      {res && (
        <>
          <Hero label="Total NPV (Intrinsic Value)" value={`Rs ${fmt(res.pv, 0)}`} color="#0891b2" sub={`PV of cash flows: Rs ${fmt(res.pvOfCFs, 0)} + Terminal value: Rs ${fmt(res.tv, 0)}`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <Num label="PV of Cash Flows" value={`Rs ${fmt(res.pvOfCFs, 0)}`} color="#0891b2" />
            <Num label="Terminal Value" value={`Rs ${fmt(res.tv, 0)}`} sub="Gordon Growth Model" />
            <Num label="TV as % of Total" value={`${fmt((res.tv / res.pv) * 100, 1)}%`} />
          </div>
          {tableRows.length > 0 && <Table cols={["Year", "Future Cash Flow", "Discount Rate", "Present Value"]} rows={tableRows} accent="#0891b2" />}
        </>
      )}
    </div>
  );
}

// ── Salary Tax ───────────────────────────────────────────────────────────────
const TAX_SLABS = [
  { from: 0,         to: 600_000,   rate: 0,    base: 0 },
  { from: 600_000,   to: 1_200_000, rate: 0.05, base: 0 },
  { from: 1_200_000, to: 2_200_000, rate: 0.15, base: 30_000 },
  { from: 2_200_000, to: 3_200_000, rate: 0.25, base: 180_000 },
  { from: 3_200_000, to: 4_100_000, rate: 0.30, base: 430_000 },
  { from: 4_100_000, to: Infinity,  rate: 0.35, base: 700_000 },
];

function SalaryTax() {
  const [monthly, setMonthly] = useState("150000");

  const res = useMemo(() => {
    const m = parseFloat(monthly); if (!m) return null;
    const ann = m * 12;
    let tax = 0;
    for (const s of TAX_SLABS) {
      if (ann > s.from) tax = s.base + (Math.min(ann, s.to) - s.from) * s.rate;
    }
    const activeSlabIdx = TAX_SLABS.findIndex(s => ann > s.from && ann <= s.to);
    return { tax, monthly: tax / 12, eff: ann > 0 ? (tax / ann) * 100 : 0, ann, netMonthly: m - tax / 12, activeSlabIdx };
  }, [monthly]);

  const slabRows = TAX_SLABS.map((s, i) => [
    `Slab ${i + 1}`,
    `Rs ${(s.from / 1000).toFixed(0)}K – ${s.to === Infinity ? "Above" : "Rs " + (s.to / 1000).toFixed(0) + "K"}`,
    `${(s.rate * 100).toFixed(0)}%`,
    s.base > 0 ? `Rs ${fmt(s.base, 0)} + ${(s.rate * 100).toFixed(0)}% on excess` : "Nil",
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
        <Field label="Monthly Gross Salary (Rs)"><input style={INP} type="number" value={monthly} onChange={e => setMonthly(e.target.value)} placeholder="150,000" /></Field>
        <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)", fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.8, alignSelf: "end" }}>
          <strong style={{ color: "#dc2626" }}>FY 2024-25 Pakistan Income Tax Slabs for salaried individuals</strong>
        </div>
      </div>
      {res && (
        <>
          <Hero label="Annual Tax Due" value={`Rs ${fmt(res.tax, 0)}`} color="#dc2626" sub={`Monthly tax: Rs ${fmt(res.monthly, 0)} · Effective rate: ${fmt(res.eff, 2)}%`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <Num label="Annual Salary" value={`Rs ${fmt(res.ann, 0)}`} />
            <Num label="Annual Tax" value={`Rs ${fmt(res.tax, 0)}`} color="#dc2626" />
            <Num label="Effective Rate" value={`${fmt(res.eff, 2)}%`} sub="of gross income" />
            <Num label="Monthly Take-Home" value={`Rs ${fmt(res.netMonthly, 0)}`} color="#16a34a" />
          </div>
          <Table cols={["Slab", "Income Range", "Tax Rate", "Formula"]} rows={slabRows} accent="#dc2626" />
        </>
      )}
    </div>
  );
}

// ── Depreciation ─────────────────────────────────────────────────────────────
function Depreciation() {
  const [asset,   setAsset]   = useState("500000");
  const [salvage, setSalvage] = useState("50000");
  const [life,    setLife]    = useState("5");
  const [method,  setMethod]  = useState("sl");

  const rows = useMemo(() => {
    const a = parseFloat(asset), s = parseFloat(salvage), n = parseInt(life);
    if (!a || !n) return [];
    const out: { year: number; dep: number; book: number; acc: number }[] = [];
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
    return out;
  }, [asset, salvage, life, method]);

  const totalDep = rows.reduce((s, r) => s + r.dep, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <Field label="Asset Cost (Rs)"><input style={INP} type="number" value={asset} onChange={e => setAsset(e.target.value)} placeholder="500,000" /></Field>
        <Field label="Salvage Value (Rs)"><input style={INP} type="number" value={salvage} onChange={e => setSalvage(e.target.value)} placeholder="50,000" /></Field>
        <Field label="Useful Life (Years)"><input style={INP} type="number" value={life} onChange={e => setLife(e.target.value)} placeholder="5" /></Field>
        <Field label="Method">
          <select style={INP} value={method} onChange={e => setMethod(e.target.value)}>
            <option value="sl">Straight Line</option>
            <option value="db">Declining Balance</option>
            <option value="ddb">Double Declining Balance</option>
          </select>
        </Field>
      </div>
      {rows.length > 0 && (
        <>
          <Hero label="Total Depreciation" value={`Rs ${fmt(totalDep, 0)}`} color="#64748b" sub={`Asset cost: Rs ${fmt(parseFloat(asset), 0)} → Salvage: Rs ${fmt(parseFloat(salvage), 0)}`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <Num label="Asset Cost" value={`Rs ${fmt(parseFloat(asset), 0)}`} />
            <Num label="Total Depreciation" value={`Rs ${fmt(totalDep, 0)}`} color="#64748b" />
            <Num label="Salvage Value" value={`Rs ${fmt(parseFloat(salvage), 0)}`} color="#16a34a" />
          </div>
          <Table
            cols={["Year", "Depreciation", "Book Value", "Accumulated Dep."]}
            rows={rows.map(r => [`Year ${r.year}`, `Rs ${fmt(r.dep, 0)}`, `Rs ${fmt(r.book, 0)}`, `Rs ${fmt(r.acc, 0)}`])}
            accent="#64748b"
          />
        </>
      )}
    </div>
  );
}

// ── Currency / FX ─────────────────────────────────────────────────────────────
const RATES: Record<string, number> = { USD: 278.5, EUR: 302.1, GBP: 352.3, AED: 75.8, SAR: 74.2, CAD: 205.4, AUD: 181.6, CNY: 38.4, JPY: 1.87, INR: 3.35 };
const CNAMES: Record<string, string> = { PKR: "Pakistani Rupee", USD: "US Dollar", EUR: "Euro", GBP: "British Pound", AED: "UAE Dirham", SAR: "Saudi Riyal", CAD: "Canadian Dollar", AUD: "Australian Dollar", CNY: "Chinese Yuan", JPY: "Japanese Yen", INR: "Indian Rupee" };
const CURRENCIES = ["PKR", ...Object.keys(RATES)];

function FX() {
  const [amount, setAmount] = useState("1000");
  const [from,   setFrom]   = useState("PKR");
  const [to,     setTo]     = useState("USD");
  const [custom, setCustom] = useState("");

  const res = useMemo(() => {
    const a = parseFloat(amount); if (!a) return null;
    const rate = custom ? parseFloat(custom) : (
      from === "PKR" ? (to === "PKR" ? 1 : 1 / RATES[to]) :
      to === "PKR" ? RATES[from] : RATES[from] / RATES[to]
    );
    if (!rate) return null;
    const converted = a * rate;
    return { converted, rate, inverse: 1 / rate, a };
  }, [amount, from, to, custom]);

  const tableRows = CURRENCIES.filter(c => c !== "PKR" && c !== from && c !== to).slice(0, 8).map(c => {
    const r2pkr = c === "PKR" ? 1 : RATES[c];
    const fromPkr = from === "PKR" ? 1 : RATES[from];
    const rate = fromPkr / r2pkr;
    return [c, CNAMES[c], `1 ${from} = ${fmt(rate, 4)} ${c}`];
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
        <Field label="Amount">
          <input style={INP} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1,000" />
        </Field>
        <Field label="From">
          <select style={INP} value={from} onChange={e => setFrom(e.target.value)}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c} — {CNAMES[c]}</option>)}
          </select>
        </Field>
        <Field label="To">
          <select style={INP} value={to} onChange={e => setTo(e.target.value)}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c} — {CNAMES[c]}</option>)}
          </select>
        </Field>
        <Field label={`Rate (1 ${from} = ? ${to})`}>
          <input style={INP} type="number" value={custom} onChange={e => setCustom(e.target.value)} placeholder="Auto" />
        </Field>
      </div>
      {res && (
        <>
          <Hero label={`Converted (${to})`} value={`${fmt(res.converted, 4)} ${to}`} color="#059669" sub={`1 ${from} = ${fmt(res.rate, 4)} ${to} · 1 ${to} = ${fmt(res.inverse, 4)} ${from}`} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <Num label={`${res.a.toLocaleString()} ${from}`} value={`${fmt(res.converted, 4)} ${to}`} color="#059669" />
            <Num label="Exchange Rate" value={`${fmt(res.rate, 4)}`} sub={`1 ${from} → ${to}`} />
            <Num label="Inverse Rate" value={`${fmt(res.inverse, 4)}`} sub={`1 ${to} → ${from}`} />
          </div>
          {tableRows.length > 0 && <Table cols={["Currency", "Name", `Rate from ${from}`]} rows={tableRows} accent="#059669" />}
        </>
      )}
    </div>
  );
}

// ── Zakat ─────────────────────────────────────────────────────────────────────
const NISAB = 95_000;

function Zakat() {
  const [cash,  setCash]  = useState("500000");
  const [gold,  setGold]  = useState("0");
  const [goldP, setGoldP] = useState("0");
  const [silv,  setSilv]  = useState("0");
  const [silvP, setSilvP] = useState("0");
  const [inv,   setInv]   = useState("0");
  const [biz,   setBiz]   = useState("0");
  const [rec,   setRec]   = useState("0");
  const [debt,  setDebt]  = useState("0");

  const res = useMemo(() => {
    const goldVal  = parseFloat(gold) * parseFloat(goldP) || 0;
    const silvVal  = parseFloat(silv) * parseFloat(silvP) || 0;
    const cashV    = parseFloat(cash) || 0;
    const invV     = parseFloat(inv)  || 0;
    const bizV     = parseFloat(biz)  || 0;
    const recV     = parseFloat(rec)  || 0;
    const debtV    = parseFloat(debt) || 0;
    const total    = cashV + goldVal + silvVal + invV + bizV + recV - debtV;
    const zakat    = total >= NISAB ? total * 0.025 : 0;
    return { total, zakat, nisab: NISAB,
      breakdown: [
        { label: "Cash & Bank", value: cashV },
        { label: "Gold",        value: goldVal },
        { label: "Silver",      value: silvVal },
        { label: "Stocks / Investments", value: invV },
        { label: "Business Inventory",  value: bizV },
        { label: "Receivables",         value: recV },
        { label: "Liabilities",         value: -debtV },
        { label: "Net Zakatable Assets",value: total },
        { label: "Zakat @ 2.5%",        value: zakat },
      ],
    };
  }, [cash, gold, goldP, silv, silvP, inv, biz, rec, debt]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <Field label="Cash & Bank Savings (Rs)"><input style={INP} type="number" value={cash} onChange={e => setCash(e.target.value)} placeholder="500,000" /></Field>
        <Field label="Gold (Tola)"><input style={INP} type="number" value={gold} onChange={e => setGold(e.target.value)} placeholder="0" /></Field>
        <Field label="Gold Price / Tola (Rs)"><input style={INP} type="number" value={goldP} onChange={e => setGoldP(e.target.value)} placeholder="0" /></Field>
        <Field label="Silver (Tola)"><input style={INP} type="number" value={silv} onChange={e => setSilv(e.target.value)} placeholder="0" /></Field>
        <Field label="Silver Price / Tola (Rs)"><input style={INP} type="number" value={silvP} onChange={e => setSilvP(e.target.value)} placeholder="0" /></Field>
        <Field label="Stocks / Investments (Rs)"><input style={INP} type="number" value={inv} onChange={e => setInv(e.target.value)} placeholder="0" /></Field>
        <Field label="Business Inventory (Rs)"><input style={INP} type="number" value={biz} onChange={e => setBiz(e.target.value)} placeholder="0" /></Field>
        <Field label="Receivables (Rs)"><input style={INP} type="number" value={rec} onChange={e => setRec(e.target.value)} placeholder="0" /></Field>
        <Field label="Liabilities / Debt (Rs)"><input style={INP} type="number" value={debt} onChange={e => setDebt(e.target.value)} placeholder="0" /></Field>
      </div>
      {res.total >= 0 && (
        <>
          {res.zakat > 0
            ? <Hero label="Zakat Due (2.5%)" value={`Rs ${fmt(res.zakat, 0)}`} color="#D4971A" sub={`Total zakatable assets: Rs ${fmt(res.total, 0)} · Nisab: Rs ${fmt(NISAB, 0)}`} />
            : <div style={{ padding: "18px 20px", borderRadius: 12, background: "rgba(100,116,139,0.06)", border: "1px solid var(--border)", fontSize: 14, color: "var(--text-muted)", textAlign: "center" }}>
                Net assets <strong style={{ color: "var(--navy)" }}>Rs {fmt(res.total, 0)}</strong> are below Nisab (Rs {fmt(NISAB, 0)}) — no Zakat due this year.
              </div>
          }
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <Num label="Total Assets" value={`Rs ${fmt(res.total + (parseFloat(debt)||0), 0)}`} />
            <Num label="Zakatable Assets" value={`Rs ${fmt(res.total, 0)}`} />
            <Num label="Nisab Threshold" value={`Rs ${fmt(NISAB, 0)}`} />
          </div>
          <Table cols={["Item", "Amount"]} rows={res.breakdown.map(b => [b.label, `${b.value < 0 ? "−" : ""}Rs ${fmt(Math.abs(b.value), 0)}`])} accent="#D4971A" />
        </>
      )}
    </div>
  );
}

// ── Calculator registry ───────────────────────────────────────────────────────
const CALC_MAP: Record<CalcId, React.FC> = { roi: ROI, cagr: CAGR, sip: SIP, compound: Compound, dcf: DCF, tax: SalaryTax, depreciation: Depreciation, fx: FX, zakat: Zakat };

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ToolsClient() {
  const [active, setActive] = useState<CalcId>("roi");
  const def = CALCS.find(c => c.id === active)!;
  const CalcComponent = CALC_MAP[active];

  return (
    <div style={{ display: "flex", height: "100%", minHeight: "calc(100vh - 60px)" }}>

      {/* ── Left sidebar ── */}
      <div style={{
        width: 220, flexShrink: 0, background: "var(--navy)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        <div style={{ padding: "18px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Financial Tools</div>
        </div>

        {/* Investment */}
        <div style={{ padding: "10px 10px 4px" }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 6px", marginBottom: 2 }}>Investment</div>
          {CALCS.filter(c => ["roi","cagr","sip","compound","dcf"].includes(c.id)).map(c => (
            <button key={c.id} onClick={() => setActive(c.id)} style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%",
              padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
              background: active === c.id ? `${c.accent}22` : "transparent",
              borderLeft: active === c.id ? `3px solid ${c.accent}` : "3px solid transparent",
              marginBottom: 2,
            }}>
              <span style={{ fontSize: 16 }}>{c.icon}</span>
              <span style={{ fontSize: 12, fontWeight: active === c.id ? 700 : 500, color: active === c.id ? "#fff" : "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>{c.title}</span>
            </button>
          ))}
        </div>

        {/* Tax & Finance */}
        <div style={{ padding: "4px 10px 10px" }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 6px", marginBottom: 2, marginTop: 8 }}>Tax & Finance</div>
          {CALCS.filter(c => ["tax","depreciation","fx","zakat"].includes(c.id)).map(c => (
            <button key={c.id} onClick={() => setActive(c.id)} style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%",
              padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer", textAlign: "left",
              background: active === c.id ? `${c.accent}22` : "transparent",
              borderLeft: active === c.id ? `3px solid ${c.accent}` : "3px solid transparent",
              marginBottom: 2,
            }}>
              <span style={{ fontSize: 16 }}>{c.icon}</span>
              <span style={{ fontSize: 12, fontWeight: active === c.id ? 700 : 500, color: active === c.id ? "#fff" : "rgba(255,255,255,0.55)", lineHeight: 1.3 }}>{c.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right workspace ── */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Calculator header */}
        <div style={{
          background: `linear-gradient(135deg, ${def.accent}18, ${def.accent}06)`,
          borderBottom: `2px solid ${def.accent}30`,
          padding: "18px 28px",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${def.accent}20`, border: `1.5px solid ${def.accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
            {def.icon}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "var(--navy)" }}>{def.title}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{def.short}</div>
          </div>
        </div>

        {/* Calculator body */}
        <div style={{ padding: "24px 28px", flex: 1, overflowY: "auto" }}>
          <CalcComponent />
        </div>
      </div>
    </div>
  );
}
