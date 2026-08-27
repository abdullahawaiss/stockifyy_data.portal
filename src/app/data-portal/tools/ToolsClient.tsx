"use client";
import { useState } from "react";

// ── Calculator state types ──────────────────────────────────────────────────
type CalcId = "roi"|"cagr"|"sip"|"compound"|"dcf"|"tax"|"depreciation"|"fx"|"zakat";

interface Calc {
  id: CalcId;
  title: string;
  subtitle: string;
  icon: string;
  category: "investment" | "tax";
}

const CALCS: Calc[] = [
  { id:"roi",          title:"ROI Calculator",           subtitle:"Return on Investment — measure profit or loss relative to cost",         icon:"📈", category:"investment" },
  { id:"cagr",         title:"CAGR Calculator",          subtitle:"Compound Annual Growth Rate — smooth annualized growth between two values", icon:"📊", category:"investment" },
  { id:"sip",          title:"SIP Calculator",           subtitle:"Systematic Investment Plan — project wealth from regular monthly investments", icon:"💰", category:"investment" },
  { id:"compound",     title:"Compounding Calculator",   subtitle:"See how interest compounds over time at different frequencies",           icon:"🔄", category:"investment" },
  { id:"dcf",          title:"DCF Calculator",           subtitle:"Discounted Cash Flow — estimate the present value of future cash flows",  icon:"🏦", category:"investment" },
  { id:"tax",          title:"Salary Tax Calculator",    subtitle:"Pakistan income tax on salary (FY 2024-25 slabs)",                       icon:"🧾", category:"tax" },
  { id:"depreciation", title:"Depreciation Calculator",  subtitle:"Straight-line, declining balance & double-declining depreciation schedules", icon:"⚙️", category:"tax" },
  { id:"fx",           title:"Exchange Rate Calculator", subtitle:"Convert between PKR and major currencies at any rate",                   icon:"💱", category:"tax" },
  { id:"zakat",        title:"Zakat Calculator",         subtitle:"Calculate annual Zakat (2.5%) on savings, gold, silver & investments",   icon:"☪️", category:"tax" },
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
const RESULT: React.CSSProperties = {
  marginTop: 14, padding: "14px 16px", borderRadius: 8,
  background: "rgba(200,134,10,0.08)", border: "1px solid rgba(200,134,10,0.2)",
};

// ── Individual calculators ──────────────────────────────────────────────────

function ROI() {
  const [cost, setCost] = useState(""); const [gain, setGain] = useState(""); const [res, setRes] = useState<number|null>(null);
  function calc() { const c=parseFloat(cost),g=parseFloat(gain); if(c>0) setRes(((g-c)/c)*100); }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div><label style={LABEL}>Cost of Investment (Rs)</label><input style={INPUT} type="number" value={cost} onChange={e=>setCost(e.target.value)} placeholder="100,000" /></div>
      <div><label style={LABEL}>Current / Exit Value (Rs)</label><input style={INPUT} type="number" value={gain} onChange={e=>setGain(e.target.value)} placeholder="130,000" /></div>
      <button style={BTN} onClick={calc}>Calculate ROI</button>
      {res!==null && <div style={RESULT}><div style={{fontSize:11,color:"#C8860A",fontWeight:700,marginBottom:4}}>ROI</div><div style={{fontSize:22,fontWeight:800,color:res>=0?"#16a34a":"#dc2626"}}>{res>=0?"+":""}{fmt(res)}%</div><div style={{fontSize:12,color:"var(--text-muted)",marginTop:4}}>Net Profit/Loss: Rs {fmt(parseFloat(gain)-parseFloat(cost))}</div></div>}
    </div>
  );
}

function CAGR() {
  const [start,setStart]=useState(""); const [end,setEnd]=useState(""); const [yrs,setYrs]=useState("");
  const [res,setRes]=useState<number|null>(null);
  function calc() { const s=parseFloat(start),e=parseFloat(end),y=parseFloat(yrs); if(s>0&&y>0) setRes((Math.pow(e/s,1/y)-1)*100); }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div><label style={LABEL}>Beginning Value (Rs)</label><input style={INPUT} type="number" value={start} onChange={e=>setStart(e.target.value)} placeholder="100,000" /></div>
      <div><label style={LABEL}>Ending Value (Rs)</label><input style={INPUT} type="number" value={end} onChange={e=>setEnd(e.target.value)} placeholder="200,000" /></div>
      <div><label style={LABEL}>Number of Years</label><input style={INPUT} type="number" value={yrs} onChange={e=>setYrs(e.target.value)} placeholder="5" /></div>
      <button style={BTN} onClick={calc}>Calculate CAGR</button>
      {res!==null && <div style={RESULT}><div style={{fontSize:11,color:"#C8860A",fontWeight:700,marginBottom:4}}>CAGR</div><div style={{fontSize:22,fontWeight:800,color:"#16a34a"}}>{fmt(res)}% per year</div></div>}
    </div>
  );
}

function SIP() {
  const [monthly,setMonthly]=useState(""); const [rate,setRate]=useState(""); const [yrs,setYrs]=useState("");
  const [res,setRes]=useState<{fv:number,invested:number}|null>(null);
  function calc() {
    const m=parseFloat(monthly),r=parseFloat(rate)/12/100,n=parseFloat(yrs)*12;
    if(m>0&&r>0&&n>0) { const fv=m*((Math.pow(1+r,n)-1)/r)*(1+r); setRes({fv,invested:m*n}); }
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div><label style={LABEL}>Monthly Investment (Rs)</label><input style={INPUT} type="number" value={monthly} onChange={e=>setMonthly(e.target.value)} placeholder="10,000" /></div>
      <div><label style={LABEL}>Expected Annual Return (%)</label><input style={INPUT} type="number" value={rate} onChange={e=>setRate(e.target.value)} placeholder="12" /></div>
      <div><label style={LABEL}>Investment Period (Years)</label><input style={INPUT} type="number" value={yrs} onChange={e=>setYrs(e.target.value)} placeholder="10" /></div>
      <button style={BTN} onClick={calc}>Calculate SIP</button>
      {res && <div style={RESULT}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <div><div style={{fontSize:10,color:"#C8860A",fontWeight:700}}>FUTURE VALUE</div><div style={{fontSize:16,fontWeight:800,color:"var(--navy)"}}>Rs {fmt(res.fv,0)}</div></div>
          <div><div style={{fontSize:10,color:"var(--text-muted)",fontWeight:700}}>INVESTED</div><div style={{fontSize:16,fontWeight:800,color:"var(--navy)"}}>Rs {fmt(res.invested,0)}</div></div>
          <div><div style={{fontSize:10,color:"#16a34a",fontWeight:700}}>RETURNS</div><div style={{fontSize:16,fontWeight:800,color:"#16a34a"}}>Rs {fmt(res.fv-res.invested,0)}</div></div>
        </div>
      </div>}
    </div>
  );
}

function Compound() {
  const [p,setP]=useState(""); const [r,setR]=useState(""); const [n,setN]=useState(""); const [t,setT]=useState(""); const [freq,setFreq]=useState("12");
  const [res,setRes]=useState<number|null>(null);
  function calc() { const pp=parseFloat(p),rr=parseFloat(r)/100,nn=parseFloat(freq),tt=parseFloat(t); if(pp>0&&rr>0&&nn>0&&tt>0) setRes(pp*Math.pow(1+rr/nn,nn*tt)); }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div><label style={LABEL}>Principal Amount (Rs)</label><input style={INPUT} type="number" value={p} onChange={e=>setP(e.target.value)} placeholder="100,000" /></div>
      <div><label style={LABEL}>Annual Interest Rate (%)</label><input style={INPUT} type="number" value={r} onChange={e=>setR(e.target.value)} placeholder="10" /></div>
      <div><label style={LABEL}>Compounding Frequency</label>
        <select style={INPUT} value={freq} onChange={e=>setFreq(e.target.value)}>
          <option value="1">Annually</option><option value="2">Semi-annually</option>
          <option value="4">Quarterly</option><option value="12">Monthly</option><option value="365">Daily</option>
        </select>
      </div>
      <div><label style={LABEL}>Time Period (Years)</label><input style={INPUT} type="number" value={t} onChange={e=>setT(e.target.value)} placeholder="5" /></div>
      <button style={BTN} onClick={calc}>Calculate</button>
      {res!==null && <div style={RESULT}><div style={{fontSize:11,color:"#C8860A",fontWeight:700,marginBottom:4}}>FUTURE VALUE</div><div style={{fontSize:22,fontWeight:800,color:"var(--navy)"}}>Rs {fmt(res,2)}</div><div style={{fontSize:12,color:"var(--text-muted)",marginTop:4}}>Interest Earned: Rs {fmt(res-parseFloat(p))}</div></div>}
    </div>
  );
}

function DCF() {
  const [cf,setCf]=useState(""); const [g,setG]=useState(""); const [d,setD]=useState(""); const [yrs,setYrs]=useState("5");
  const [res,setRes]=useState<number|null>(null);
  function calc() {
    const c=parseFloat(cf),gr=parseFloat(g)/100,dr=parseFloat(d)/100,y=parseInt(yrs);
    if(c>0&&dr>gr) {
      let pv=0; for(let i=1;i<=y;i++) pv+=c*Math.pow(1+gr,i)/Math.pow(1+dr,i);
      const tv=c*Math.pow(1+gr,y)*(1+gr)/(dr-gr)/Math.pow(1+dr,y);
      setRes(pv+tv);
    }
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div><label style={LABEL}>Annual Cash Flow (Rs)</label><input style={INPUT} type="number" value={cf} onChange={e=>setCf(e.target.value)} placeholder="50,000" /></div>
      <div><label style={LABEL}>Growth Rate (% per year)</label><input style={INPUT} type="number" value={g} onChange={e=>setG(e.target.value)} placeholder="5" /></div>
      <div><label style={LABEL}>Discount Rate (% per year)</label><input style={INPUT} type="number" value={d} onChange={e=>setD(e.target.value)} placeholder="12" /></div>
      <div><label style={LABEL}>Projection Years</label>
        <select style={INPUT} value={yrs} onChange={e=>setYrs(e.target.value)}>
          {[3,5,7,10].map(v=><option key={v} value={v}>{v} years</option>)}
        </select>
      </div>
      <button style={BTN} onClick={calc}>Calculate DCF</button>
      {res!==null && <div style={RESULT}><div style={{fontSize:11,color:"#C8860A",fontWeight:700,marginBottom:4}}>PRESENT VALUE (DCF)</div><div style={{fontSize:22,fontWeight:800,color:"var(--navy)"}}>Rs {fmt(res,0)}</div><div style={{fontSize:11,color:"var(--text-muted)",marginTop:4}}>Discount rate must be greater than growth rate</div></div>}
    </div>
  );
}

// Pakistan FY25 salary tax slabs
function SalaryTax() {
  const [salary,setSalary]=useState("");
  const [res,setRes]=useState<{tax:number;monthly:number;eff:number}|null>(null);
  function calc() {
    const ann=parseFloat(salary)*12;
    let tax=0;
    if(ann<=600000) tax=0;
    else if(ann<=1200000) tax=(ann-600000)*0.05;
    else if(ann<=2200000) tax=30000+(ann-1200000)*0.15;
    else if(ann<=3200000) tax=180000+(ann-2200000)*0.25;
    else if(ann<=4100000) tax=430000+(ann-3200000)*0.30;
    else tax=700000+(ann-4100000)*0.35;
    setRes({tax,monthly:tax/12,eff:ann>0?(tax/ann)*100:0});
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div><label style={LABEL}>Monthly Gross Salary (Rs)</label><input style={INPUT} type="number" value={salary} onChange={e=>setSalary(e.target.value)} placeholder="150,000" /></div>
      <div style={{fontSize:11,color:"var(--text-muted)",padding:"8px 10px",background:"rgba(200,134,10,0.06)",borderRadius:6,lineHeight:1.6}}>
        <strong style={{color:"#C8860A"}}>FY 2024-25 Slabs:</strong><br/>
        Up to 600K → 0% · 600K–1.2M → 5% · 1.2M–2.2M → 15% · 2.2M–3.2M → 25% · 3.2M–4.1M → 30% · Above 4.1M → 35%
      </div>
      <button style={BTN} onClick={calc}>Calculate Tax</button>
      {res && <div style={RESULT}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <div><div style={{fontSize:10,color:"#C8860A",fontWeight:700}}>ANNUAL TAX</div><div style={{fontSize:15,fontWeight:800,color:"var(--navy)"}}>Rs {fmt(res.tax,0)}</div></div>
          <div><div style={{fontSize:10,color:"var(--text-muted)",fontWeight:700}}>MONTHLY TAX</div><div style={{fontSize:15,fontWeight:800,color:"var(--navy)"}}>Rs {fmt(res.monthly,0)}</div></div>
          <div><div style={{fontSize:10,color:"var(--text-muted)",fontWeight:700}}>EFFECTIVE RATE</div><div style={{fontSize:15,fontWeight:800,color:"#dc2626"}}>{fmt(res.eff)}%</div></div>
        </div>
      </div>}
    </div>
  );
}

function Depreciation() {
  const [asset,setAsset]=useState(""); const [salvage,setSalvage]=useState(""); const [life,setLife]=useState(""); const [method,setMethod]=useState("sl");
  const [rows,setRows]=useState<{year:number;dep:number;book:number}[]>([]);
  function calc() {
    const a=parseFloat(asset),s=parseFloat(salvage),n=parseInt(life);
    if(!a||!n) return;
    const out=[];
    let book=a;
    for(let i=1;i<=n;i++) {
      let dep=0;
      if(method==="sl") dep=(a-s)/n;
      else if(method==="db") dep=book*(2/n);
      else dep=book*(1/n)*2;
      dep=Math.min(dep,book-s);
      book-=dep;
      out.push({year:i,dep,book:Math.max(s,book)});
    }
    setRows(out);
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div><label style={LABEL}>Asset Cost (Rs)</label><input style={INPUT} type="number" value={asset} onChange={e=>setAsset(e.target.value)} placeholder="500,000" /></div>
      <div><label style={LABEL}>Salvage Value (Rs)</label><input style={INPUT} type="number" value={salvage} onChange={e=>setSalvage(e.target.value)} placeholder="50,000" /></div>
      <div><label style={LABEL}>Useful Life (Years)</label><input style={INPUT} type="number" value={life} onChange={e=>setLife(e.target.value)} placeholder="5" /></div>
      <div><label style={LABEL}>Method</label>
        <select style={INPUT} value={method} onChange={e=>setMethod(e.target.value)}>
          <option value="sl">Straight-Line</option>
          <option value="db">Declining Balance</option>
          <option value="ddb">Double Declining Balance</option>
        </select>
      </div>
      <button style={BTN} onClick={calc}>Calculate</button>
      {rows.length>0 && <div style={{overflowX:"auto",marginTop:8}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:"2px solid var(--border)"}}>
            {["Year","Depreciation","Book Value"].map(h=><th key={h} style={{padding:"6px 10px",textAlign:"right",color:"var(--text-muted)",fontSize:10,fontWeight:700,textTransform:"uppercase"}}>{h}</th>)}
          </tr></thead>
          <tbody>{rows.map(r=><tr key={r.year} style={{borderBottom:"1px solid var(--border)"}}>
            <td style={{padding:"6px 10px",textAlign:"right",fontWeight:700,color:"var(--navy)"}}>{r.year}</td>
            <td style={{padding:"6px 10px",textAlign:"right",color:"#dc2626",fontVariantNumeric:"tabular-nums"}}>Rs {fmt(r.dep,0)}</td>
            <td style={{padding:"6px 10px",textAlign:"right",color:"#16a34a",fontVariantNumeric:"tabular-nums"}}>Rs {fmt(r.book,0)}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </div>
  );
}

const RATES: Record<string,number> = { USD:278.5, EUR:302.1, GBP:352.3, AED:75.8, SAR:74.2, CAD:205.4, AUD:181.6, CNY:38.4, JPY:1.87, INR:3.35 };
function FX() {
  const [amount,setAmount]=useState(""); const [from,setFrom]=useState("PKR"); const [to,setTo]=useState("USD"); const [res,setRes]=useState<number|null>(null);
  function calc() {
    const a=parseFloat(amount); if(!a) return;
    const pkr=from==="PKR"?a:a*RATES[from];
    setRes(to==="PKR"?pkr:pkr/RATES[to]);
  }
  const currencies=["PKR",...Object.keys(RATES)];
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <div><label style={LABEL}>Amount</label><input style={INPUT} type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="1000" /></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div><label style={LABEL}>From</label><select style={INPUT} value={from} onChange={e=>setFrom(e.target.value)}>{currencies.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
        <div><label style={LABEL}>To</label><select style={INPUT} value={to} onChange={e=>setTo(e.target.value)}>{currencies.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
      </div>
      <button style={BTN} onClick={calc}>Convert</button>
      {res!==null && <div style={RESULT}><div style={{fontSize:11,color:"#C8860A",fontWeight:700,marginBottom:4}}>CONVERTED AMOUNT</div><div style={{fontSize:22,fontWeight:800,color:"var(--navy)"}}>{fmt(res,2)} {to}</div><div style={{fontSize:11,color:"var(--text-muted)",marginTop:4}}>Rate source: indicative — verify with your bank</div></div>}
    </div>
  );
}

function Zakat() {
  const [cash,setCash]=useState(""); const [gold,setGold]=useState(""); const [silver,setSilver]=useState(""); const [inv,setInv]=useState(""); const [debt,setDebt]=useState("");
  const [res,setRes]=useState<{total:number;zakat:number}|null>(null);
  const NISAB=93500; // approximate gold nisab in PKR
  function calc() {
    const total=parseFloat(cash||"0")+parseFloat(gold||"0")+parseFloat(silver||"0")+parseFloat(inv||"0")-parseFloat(debt||"0");
    if(total>=NISAB) setRes({total,zakat:total*0.025});
    else setRes({total,zakat:0});
  }
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {[["Cash & Bank Savings (Rs)",cash,setCash],["Gold Value (Rs)",gold,setGold],["Silver Value (Rs)",silver,setSilver],["Investments / Stocks (Rs)",inv,setInv],["Outstanding Debt (Rs)",debt,setDebt]].map(([label,val,setter])=>(
        <div key={label as string}><label style={LABEL}>{label as string}</label><input style={INPUT} type="number" value={val as string} onChange={e=>(setter as (v:string)=>void)(e.target.value)} placeholder="0" /></div>
      ))}
      <div style={{fontSize:11,color:"var(--text-muted)",padding:"6px 10px",background:"rgba(200,134,10,0.06)",borderRadius:6}}>Nisab threshold ≈ Rs {NISAB.toLocaleString()} (93g gold equivalent)</div>
      <button style={BTN} onClick={calc}>Calculate Zakat</button>
      {res && <div style={RESULT}>
        {res.zakat>0 ? <>
          <div style={{fontSize:11,color:"#C8860A",fontWeight:700,marginBottom:4}}>ZAKAT DUE (2.5%)</div>
          <div style={{fontSize:22,fontWeight:800,color:"var(--navy)"}}>Rs {fmt(res.zakat,0)}</div>
          <div style={{fontSize:12,color:"var(--text-muted)",marginTop:4}}>Net Zakatable Assets: Rs {fmt(res.total,0)}</div>
        </> : <div style={{fontSize:14,color:"var(--text-muted)"}}>Net assets (Rs {fmt(res.total,0)}) are below Nisab threshold — no Zakat due.</div>}
      </div>}
    </div>
  );
}

const CALC_COMPONENTS: Record<CalcId, React.FC> = { roi:ROI, cagr:CAGR, sip:SIP, compound:Compound, dcf:DCF, tax:SalaryTax, depreciation:Depreciation, fx:FX, zakat:Zakat };

// ── Main page ───────────────────────────────────────────────────────────────
export default function ToolsClient() {
  const [active, setActive] = useState<CalcId | null>(null);
  const ActiveCalc = active ? CALC_COMPONENTS[active] : null;
  const activeCalcInfo = active ? CALCS.find(c => c.id === active) : null;

  const investment = CALCS.filter(c => c.category === "investment");
  const tax = CALCS.filter(c => c.category === "tax");

  const cardStyle = (id: CalcId): React.CSSProperties => ({
    background: "var(--card-bg,#fff)", border: `1.5px solid ${active===id?"#C8860A":"var(--border,#e2e8f0)"}`,
    borderRadius: 12, padding: "18px 20px", cursor: "pointer", transition: "all 200ms",
    boxShadow: active===id?"0 0 0 3px rgba(200,134,10,0.12)":"none",
  });

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
          <span style={{ color: "var(--navy)" }}>Financial</span> <span style={{ color: "#C8860A" }}>Tools</span>
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>Calculators to plan investments, taxes, and financial decisions</p>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Calculator list */}
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          {/* Investment Calculators */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", background: "#C8860A", borderRadius: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>Investment Calculators</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
              {investment.map(c => (
                <button key={c.id} onClick={() => setActive(c.id)} style={{ ...cardStyle(c.id), textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(200,134,10,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{c.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--navy)" }}>{c.title}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{c.subtitle}</div>
                  <div style={{ marginTop: 10, fontSize: 12, color: "#C8860A", fontWeight: 700 }}>Open Calculator →</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tax & Financial Calculators */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", background: "#C8860A", borderRadius: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>Tax &amp; Financial Calculators</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
              {tax.map(c => (
                <button key={c.id} onClick={() => setActive(c.id)} style={{ ...cardStyle(c.id), textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(200,134,10,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{c.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--navy)" }}>{c.title}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{c.subtitle}</div>
                  <div style={{ marginTop: 10, fontSize: 12, color: "#C8860A", fontWeight: 700 }}>Open Calculator →</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active calculator panel */}
        {ActiveCalc && activeCalcInfo && (
          <div style={{ flex: "0 0 320px", position: "sticky", top: 20 }}>
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
