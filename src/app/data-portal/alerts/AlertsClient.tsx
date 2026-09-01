"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { PSX_STOCKS, searchPsxStocks } from "@/lib/psx-stocks-static";

const NAVY = "#07111F";
const GOLD = "#D4971A";

/* ── helpers ── */
function fmt(n: number | undefined | null, d = 2) { if (n == null || isNaN(+n)) return "—"; return (+n).toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d }); }

const LS_ALERTS = "stockifyy_alerts";
const LS_REMIND = "stockifyy_board_reminders";

/* ── types ── */
interface PriceAlert { id: string; symbol: string; company: string; condition: "above" | "below" | "pct_change"; target: number; notify: "app" | "sms" | "email"; triggered: boolean; currentPrice: number; createdAt: string; }
interface CorporateEvent { date: string; symbol: string; company: string; type: "Dividend" | "AGM" | "EGM" | "Results" | "Bonus" | "Rights" | "BookClosure"; details: string; exDate?: string; dps?: number; }
interface BoardMeeting { date: string; symbol: string; company: string; agenda: string; expectedDPS?: number; meetingType: "Annual" | "EGM" | "Quarterly"; status: "Upcoming" | "Completed"; }

/* ── demo price map ── */
const PRICES: Record<string, number> = {
  HBL: 177.3, OGDC: 181.5, LUCK: 932, ENGRO: 285.4, MCB: 225.6, FFC: 139.3,
  UBL: 232.4, NBP: 43.2, MARI: 2145, PPL: 89.3, TRG: 101.5, SYS: 724,
  MEBL: 218.5, PSO: 341.6, ILP: 228, SEARL: 228, ABOT: 620, INDU: 1702, NML: 138, ICI: 832,
};
function getPrice(sym: string) { return PRICES[sym] ?? 100 + Math.random() * 50; }

/* ── DEMO DATA ── */
const DEMO_ALERTS: PriceAlert[] = [
  { id: "a1", symbol: "HBL",  company: "Habib Bank Limited",         condition: "above",      target: 185,    notify: "app",   triggered: false, currentPrice: 177.3,  createdAt: "2026-08-20" },
  { id: "a2", symbol: "OGDC", company: "Oil & Gas Dev. Co.",          condition: "below",      target: 175,    notify: "email", triggered: false, currentPrice: 181.5,  createdAt: "2026-08-18" },
  { id: "a3", symbol: "LUCK", company: "Lucky Cement Ltd.",           condition: "above",      target: 950,    notify: "sms",   triggered: false, currentPrice: 932,    createdAt: "2026-08-15" },
  { id: "a4", symbol: "ENGRO",company: "Engro Corporation Ltd.",      condition: "pct_change", target: 3,      notify: "app",   triggered: false, currentPrice: 285.4,  createdAt: "2026-08-14" },
  { id: "a5", symbol: "MCB",  company: "MCB Bank Limited",            condition: "below",      target: 220,    notify: "app",   triggered: true,  currentPrice: 225.6,  createdAt: "2026-08-10" },
  { id: "a6", symbol: "FFC",  company: "Fauji Fertilizer Co.",        condition: "above",      target: 145,    notify: "email", triggered: true,  currentPrice: 139.3,  createdAt: "2026-08-08" },
];

const CORP_EVENTS: CorporateEvent[] = [
  { date: "2026-09-05", symbol: "HBL",   company: "Habib Bank Ltd.",         type: "Results",     details: "Annual financial results FY2026 announcement" },
  { date: "2026-09-08", symbol: "OGDC",  company: "Oil & Gas Dev. Co.",       type: "Dividend",    details: "Final cash dividend @ PKR 5.50/share", exDate: "2026-09-18", dps: 5.50 },
  { date: "2026-09-10", symbol: "MCB",   company: "MCB Bank Limited",         type: "AGM",         details: "Annual General Meeting, Lahore" },
  { date: "2026-09-12", symbol: "LUCK",  company: "Lucky Cement Ltd.",        type: "Dividend",    details: "Final cash dividend @ PKR 25.00/share", exDate: "2026-09-22", dps: 25.00 },
  { date: "2026-09-15", symbol: "FFC",   company: "Fauji Fertilizer Co.",     type: "BookClosure", details: "Share register book closure for dividend" },
  { date: "2026-09-18", symbol: "ENGRO", company: "Engro Corporation Ltd.",   type: "Results",     details: "Q1 FY2027 quarterly financial results" },
  { date: "2026-09-20", symbol: "NBP",   company: "National Bank of Pakistan",type: "Dividend",    details: "Interim dividend @ PKR 3.00/share", exDate: "2026-09-30", dps: 3.00 },
  { date: "2026-09-22", symbol: "TRG",   company: "TRG Pakistan Ltd.",        type: "AGM",         details: "Annual General Meeting, Karachi" },
  { date: "2026-09-25", symbol: "PSO",   company: "Pakistan State Oil Co.",   type: "Results",     details: "Q1 FY2027 quarterly financial results" },
  { date: "2026-09-28", symbol: "MARI",  company: "Mari Petroleum Co.",       type: "Dividend",    details: "Final cash dividend @ PKR 55.00/share", exDate: "2026-10-08", dps: 55.00 },
  { date: "2026-10-05", symbol: "UBL",   company: "United Bank Limited",      type: "Results",     details: "Q2 financial results announcement" },
  { date: "2026-10-08", symbol: "SYS",   company: "Systems Limited",          type: "Bonus",       details: "Bonus shares @ 10% (1 share per 10 held)" },
  { date: "2026-10-12", symbol: "ILP",   company: "Indus Lyallpur",           type: "Rights",      details: "Rights issue 1:5 @ PKR 10/share" },
  { date: "2026-10-15", symbol: "PPL",   company: "Pakistan Petroleum Ltd.",  type: "Dividend",    details: "Interim dividend @ PKR 4.00/share", exDate: "2026-10-25", dps: 4.00 },
  { date: "2026-10-18", symbol: "ABOT",  company: "Abbott Laboratories Pak.", type: "AGM",         details: "Annual General Meeting, Karachi" },
  { date: "2026-10-20", symbol: "MEBL",  company: "Meezan Bank Limited",      type: "Results",     details: "Q1 FY2027 quarterly financial results" },
  { date: "2026-10-22", symbol: "INDU",  company: "Indus Motor Co. Ltd.",     type: "Dividend",    details: "Final cash dividend @ PKR 150.00/share", exDate: "2026-11-01", dps: 150.00 },
  { date: "2026-10-25", symbol: "NML",   company: "Nishat Mills Limited",     type: "EGM",         details: "Extraordinary General Meeting — expansion approval" },
  { date: "2026-10-28", symbol: "SEARL", company: "Searle Company Ltd.",      type: "Results",     details: "Q1 FY2027 quarterly financial results" },
  { date: "2026-11-05", symbol: "ICI",   company: "ICI Pakistan Limited",     type: "Dividend",    details: "Interim dividend @ PKR 18.00/share", exDate: "2026-11-15", dps: 18.00 },
];

const BOARD_MEETINGS: BoardMeeting[] = [
  { date: "2026-09-05", symbol: "HBL",   company: "Habib Bank Ltd.",          agenda: "Approval of Annual Financial Statements FY2026; declaration of final dividend", expectedDPS: 12.00, meetingType: "Annual",    status: "Upcoming" },
  { date: "2026-09-08", symbol: "OGDC",  company: "Oil & Gas Dev. Co.",        agenda: "Final dividend declaration; presentation of exploration update", expectedDPS: 5.50, meetingType: "Annual",      status: "Upcoming" },
  { date: "2026-09-10", symbol: "MCB",   company: "MCB Bank Limited",          agenda: "Annual results review; dividend approval; Board composition", expectedDPS: 8.00, meetingType: "Annual",         status: "Upcoming" },
  { date: "2026-09-18", symbol: "ENGRO", company: "Engro Corporation Ltd.",    agenda: "Q1 FY2027 results; interim dividend consideration; LNG update", expectedDPS: 5.00, meetingType: "Quarterly",   status: "Upcoming" },
  { date: "2026-09-20", symbol: "NBP",   company: "National Bank of Pakistan", agenda: "Quarterly results; interim dividend declaration", expectedDPS: 3.00, meetingType: "Quarterly",                 status: "Upcoming" },
  { date: "2026-09-25", symbol: "PSO",   company: "Pakistan State Oil Co.",    agenda: "Q1 FY2027 quarterly results; business update", expectedDPS: undefined, meetingType: "Quarterly",              status: "Upcoming" },
  { date: "2026-09-28", symbol: "MARI",  company: "Mari Petroleum Co.",        agenda: "Final dividend declaration; exploration license renewals", expectedDPS: 55.00, meetingType: "Annual",          status: "Upcoming" },
  { date: "2026-10-05", symbol: "UBL",   company: "United Bank Limited",       agenda: "Q2 financial results; interim dividend; digital banking update", expectedDPS: 6.00, meetingType: "Quarterly",  status: "Upcoming" },
  { date: "2026-10-15", symbol: "PPL",   company: "Pakistan Petroleum Ltd.",   agenda: "Interim dividend approval; quarterly results", expectedDPS: 4.00, meetingType: "Quarterly",                    status: "Upcoming" },
  { date: "2026-10-20", symbol: "MEBL",  company: "Meezan Bank Limited",       agenda: "Q1 FY2027 results; Shariah compliance review; dividend consideration", expectedDPS: 3.50, meetingType: "Quarterly", status: "Upcoming" },
  { date: "2026-10-22", symbol: "INDU",  company: "Indus Motor Co. Ltd.",      agenda: "Final dividend declaration; FY2026 annual review", expectedDPS: 150.00, meetingType: "Annual",                status: "Upcoming" },
  { date: "2026-10-25", symbol: "NML",   company: "Nishat Mills Limited",      agenda: "EGM — approval of CAPEX plan; rights issue", expectedDPS: undefined, meetingType: "EGM",                       status: "Upcoming" },
  { date: "2026-08-15", symbol: "FFC",   company: "Fauji Fertilizer Co.",      agenda: "Interim dividend declared @ PKR 10/share; urea price review", expectedDPS: 10.00, meetingType: "Quarterly",   status: "Completed" },
  { date: "2026-08-10", symbol: "LUCK",  company: "Lucky Cement Ltd.",         agenda: "FY2026 annual results; final dividend PKR 25/share approved", expectedDPS: 25.00, meetingType: "Annual",       status: "Completed" },
  { date: "2026-08-05", symbol: "SYS",   company: "Systems Limited",           agenda: "Bonus share issue approved @ 10%; Q1 results reviewed", expectedDPS: undefined, meetingType: "Quarterly",      status: "Completed" },
];

/* ── type colors ── */
const TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  Dividend:    { bg: "rgba(217,119,6,0.1)",   color: "#D97706" },
  AGM:         { bg: "rgba(37,99,235,0.1)",   color: "#2563EB" },
  EGM:         { bg: "rgba(124,58,237,0.1)",  color: "#7C3AED" },
  Results:     { bg: "rgba(5,150,105,0.1)",   color: "#059669" },
  Bonus:       { bg: "rgba(14,165,233,0.1)",  color: "#0EA5E9" },
  Rights:      { bg: "rgba(239,68,68,0.1)",   color: "#EF4444" },
  BookClosure: { bg: "rgba(107,114,128,0.1)", color: "#6B7280" },
};

/* ── Badge ── */
function Badge({ type }: { type: string }) {
  const c = TYPE_COLOR[type] ?? { bg: "rgba(100,116,139,0.1)", color: "#64748b" };
  return <span style={{ padding: "2px 9px", borderRadius: 12, fontSize: 10, fontWeight: 800, background: c.bg, color: c.color, whiteSpace: "nowrap" }}>{type}</span>;
}

/* ── Symbol search dropdown ── */
function SymSearch({ value, onChange }: { value: string; onChange: (sym: string, name: string) => void }) {
  const [q, setQ] = useState(value);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const results = useMemo(() => q.length > 0 ? searchPsxStocks(q, 6) : [], [q]);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setShow(false); }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input value={q} onChange={e => { setQ(e.target.value); setShow(true); }} onFocus={() => setShow(true)}
        placeholder="Symbol…" style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 13 }} />
      {show && results.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 99, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "0 6px 24px rgba(0,0,0,0.16)", marginTop: 2, maxHeight: 200, overflowY: "auto" }}>
          {results.map(s => (
            <button key={s.symbol} onClick={() => { setQ(s.symbol); onChange(s.symbol, s.name); setShow(false); }}
              style={{ display: "flex", gap: 10, width: "100%", padding: "8px 12px", border: "none", borderBottom: "1px solid var(--border)", background: "none", cursor: "pointer", textAlign: "left" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--light-bg)")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <span style={{ fontWeight: 800, color: GOLD, fontSize: 12 }}>{s.symbol}</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Tab 1: Price Alerts ── */
function PriceAlertsTab() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: "", company: "", condition: "above" as PriceAlert["condition"], target: "", notify: "app" as PriceAlert["notify"] });
  const [filter, setFilter] = useState<"all" | "active" | "triggered">("all");

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem(LS_ALERTS) ?? "null"); setAlerts(s ?? DEMO_ALERTS); } catch { setAlerts(DEMO_ALERTS); }
  }, []);
  function save(a: PriceAlert[]) { setAlerts(a); try { localStorage.setItem(LS_ALERTS, JSON.stringify(a)); } catch {} }

  function addAlert() {
    if (!form.symbol || !form.target) return;
    const a: PriceAlert = { id: Date.now().toString(), symbol: form.symbol, company: form.company, condition: form.condition, target: parseFloat(form.target), notify: form.notify, triggered: false, currentPrice: getPrice(form.symbol), createdAt: new Date().toISOString().slice(0, 10) };
    save([a, ...alerts]);
    setForm({ symbol: "", company: "", condition: "above", target: "", notify: "app" });
    setShowForm(false);
  }
  function removeAlert(id: string) { save(alerts.filter(a => a.id !== id)); }

  const filtered = alerts.filter(a => filter === "all" ? true : filter === "active" ? !a.triggered : a.triggered);
  const active = alerts.filter(a => !a.triggered);
  const triggered = alerts.filter(a => a.triggered);

  function condLabel(a: PriceAlert) {
    if (a.condition === "above") return `Price > PKR ${fmt(a.target)}`;
    if (a.condition === "below") return `Price < PKR ${fmt(a.target)}`;
    return `± ${a.target}% change`;
  }
  function distLabel(a: PriceAlert) {
    const d = ((a.target - a.currentPrice) / a.currentPrice) * 100;
    return { text: (d > 0 ? "+" : "") + d.toFixed(2) + "% away", pos: d > 0 };
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { l: "Total Alerts", v: alerts.length, color: GOLD },
          { l: "Active", v: active.length, color: "#2563EB" },
          { l: "Triggered", v: triggered.length, color: "#DC2626" },
          { l: "Notify Methods", v: "3", color: "#059669" },
        ].map(s => (
          <div key={s.l} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderLeft: `3px solid ${s.color}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.l}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: "var(--light-bg)", borderRadius: 9, padding: 3, gap: 2 }}>
          {(["all","active","triggered"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: filter === f ? NAVY : "transparent", color: filter === f ? "#fff" : "var(--text-muted)" }}>
              {f === "all" ? `All (${alerts.length})` : f === "active" ? `Active (${active.length})` : `Triggered (${triggered.length})`}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 9, border: "none", background: GOLD, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
          + New Alert
        </button>
      </div>

      {/* Add alert form */}
      {showForm && (
        <div style={{ background: "var(--card-bg)", border: `1px solid ${GOLD}40`, borderRadius: 12, padding: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: 5 }}>Symbol</label>
            <SymSearch value={form.symbol} onChange={(sym, name) => setForm(f => ({ ...f, symbol: sym, company: name }))} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: 5 }}>Condition</label>
            <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value as PriceAlert["condition"] }))}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 13 }}>
              <option value="above">Price Above</option>
              <option value="below">Price Below</option>
              <option value="pct_change">% Change</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: 5 }}>Target (PKR / %)</label>
            <input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              placeholder="e.g. 200" style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, display: "block", marginBottom: 5 }}>Notify Via</label>
            <select value={form.notify} onChange={e => setForm(f => ({ ...f, notify: e.target.value as PriceAlert["notify"] }))}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 13 }}>
              <option value="app">In-App</option>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
          </div>
          <button onClick={addAlert} style={{ padding: "8px 18px", borderRadius: 8, background: NAVY, color: GOLD, border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>Set Alert</button>
        </div>
      )}

      {/* Alerts table */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: NAVY }}>
                {["Symbol","Company","Current","Condition","Target","Distance","Notify","Status","Created",""].map(h => (
                  <th key={h} style={{ padding: "10px 13px", textAlign: "left", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const dist = distLabel(a);
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
                    <td style={{ padding: "10px 13px", fontWeight: 800, color: GOLD, fontFamily: "monospace", fontSize: 12 }}>{a.symbol}</td>
                    <td style={{ padding: "10px 13px", color: "var(--text-secondary)", fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.company}</td>
                    <td style={{ padding: "10px 13px", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>PKR {fmt(a.currentPrice)}</td>
                    <td style={{ padding: "10px 13px", color: "var(--text-muted)", fontSize: 12 }}>{condLabel(a)}</td>
                    <td style={{ padding: "10px 13px", fontWeight: 700, color: "var(--navy)", fontVariantNumeric: "tabular-nums" }}>PKR {fmt(a.target)}</td>
                    <td style={{ padding: "10px 13px", fontWeight: 700, color: dist.pos ? "var(--positive)" : "var(--negative)", fontSize: 12 }}>{dist.text}</td>
                    <td style={{ padding: "10px 13px" }}><span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "var(--light-bg)", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>{a.notify}</span></td>
                    <td style={{ padding: "10px 13px" }}>
                      <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 12, fontWeight: 800, background: a.triggered ? "rgba(220,38,38,0.1)" : "rgba(37,99,235,0.1)", color: a.triggered ? "#DC2626" : "#2563EB" }}>
                        {a.triggered ? "Triggered" : "Active"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 13px", fontSize: 11, color: "var(--text-muted)" }}>{a.createdAt}</td>
                    <td style={{ padding: "10px 13px" }}>
                      <button onClick={() => removeAlert(a.id)} style={{ padding: "3px 9px", borderRadius: 6, border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", fontSize: 11, cursor: "pointer", fontWeight: 700 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#DC2626")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>✕</button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No alerts found. Click "+ New Alert" to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Tab 2: Corporate Events ── */
function CorporateEventsTab() {
  const [typeFilter, setTypeFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");

  const types = ["All", "Dividend", "AGM", "EGM", "Results", "Bonus", "Rights", "BookClosure"];
  const months = ["All", "Sep 2026", "Oct 2026", "Nov 2026"];

  const MONTH_MAP: Record<string, string> = { "2026-09": "Sep 2026", "2026-10": "Oct 2026", "2026-11": "Nov 2026" };

  const filtered = CORP_EVENTS.filter(e => {
    const tm = typeFilter === "All" || e.type === typeFilter;
    const mm = monthFilter === "All" || MONTH_MAP[e.date.slice(0, 7)] === monthFilter;
    return tm && mm;
  });

  // group by month
  const grouped = new Map<string, CorporateEvent[]>();
  filtered.forEach(e => {
    const m = MONTH_MAP[e.date.slice(0, 7)] ?? e.date.slice(0, 7);
    if (!grouped.has(m)) grouped.set(m, []);
    grouped.get(m)!.push(e);
  });

  const divSum = CORP_EVENTS.filter(e => e.type === "Dividend" && e.dps).reduce((s, e) => s + (e.dps ?? 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { l: "Total Events", v: CORP_EVENTS.length, color: GOLD },
          { l: "Dividends", v: CORP_EVENTS.filter(e => e.type === "Dividend").length, color: "#D97706" },
          { l: "Annual Meetings", v: CORP_EVENTS.filter(e => e.type === "AGM").length, color: "#2563EB" },
          { l: "Expected DPS Total", v: "PKR " + fmt(divSum), color: "#059669" },
        ].map(s => (
          <div key={s.l} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderLeft: `3px solid ${s.color}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.l}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: "5px 12px", borderRadius: 16, border: "1px solid var(--border)", background: typeFilter === t ? NAVY : "var(--card-bg)", color: typeFilter === t ? "#fff" : "var(--text-muted)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {t === "All" ? "All Types" : t}
            </button>
          ))}
        </div>
        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 12, cursor: "pointer", marginLeft: "auto" }}>
          {months.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>

      {/* Grouped tables */}
      {[...grouped.entries()].map(([month, events]) => (
        <div key={month} style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", background: NAVY, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 800, color: "#fff", fontSize: 13 }}>{month}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{events.length} events</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--light-bg)" }}>
                {["Date","Symbol","Company","Type","Details","Ex-Date","DPS"].map(h => (
                  <th key={h} style={{ padding: "9px 13px", textAlign: "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={e.date + e.symbol} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
                  <td style={{ padding: "9px 13px", color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>{e.date}</td>
                  <td style={{ padding: "9px 13px", fontWeight: 800, color: GOLD, fontFamily: "monospace", fontSize: 12 }}>{e.symbol}</td>
                  <td style={{ padding: "9px 13px", color: "var(--text-secondary)", fontSize: 12, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.company}</td>
                  <td style={{ padding: "9px 13px" }}><Badge type={e.type} /></td>
                  <td style={{ padding: "9px 13px", color: "var(--text-secondary)", fontSize: 12, maxWidth: 240, whiteSpace: "normal" }}>{e.details}</td>
                  <td style={{ padding: "9px 13px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{e.exDate ?? "—"}</td>
                  <td style={{ padding: "9px 13px", fontWeight: 700, color: e.dps ? GOLD : "var(--text-muted)", whiteSpace: "nowrap" }}>{e.dps ? "PKR " + fmt(e.dps) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No events match the selected filters.</div>}
    </div>
  );
}

/* ── Tab 3: Board Meetings ── */
function BoardMeetingsTab() {
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<"All" | "Upcoming" | "Completed">("All");

  useEffect(() => {
    try { const r = JSON.parse(localStorage.getItem(LS_REMIND) ?? "[]"); setReminders(new Set(r)); } catch {}
  }, []);
  function toggleReminder(id: string) {
    setReminders(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      try { localStorage.setItem(LS_REMIND, JSON.stringify([...n])); } catch {}
      return n;
    });
  }

  const upcoming = BOARD_MEETINGS.filter(m => m.status === "Upcoming");
  const withDPS = BOARD_MEETINGS.filter(m => m.expectedDPS != null);
  const totalDPS = withDPS.reduce((s, m) => s + (m.expectedDPS ?? 0), 0);

  const filtered = BOARD_MEETINGS.filter(m => statusFilter === "All" || m.status === statusFilter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { l: "Upcoming (Q3 2026)", v: upcoming.length, color: "#2563EB" },
          { l: "With Expected DPS", v: withDPS.length, color: GOLD },
          { l: "Total Expected DPS", v: "PKR " + fmt(totalDPS), color: "#059669" },
          { l: "EGMs Scheduled", v: BOARD_MEETINGS.filter(m => m.meetingType === "EGM").length, color: "#7C3AED" },
        ].map(s => (
          <div key={s.l} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderLeft: `3px solid ${s.color}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.l}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 4, background: "var(--light-bg)", borderRadius: 9, padding: 3, alignSelf: "flex-start" }}>
        {(["All", "Upcoming", "Completed"] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: statusFilter === f ? NAVY : "transparent", color: statusFilter === f ? "#fff" : "var(--text-muted)" }}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: NAVY }}>
                {["Date","Symbol","Company","Type","Agenda","Exp. DPS","Status","Remind"].map(h => (
                  <th key={h} style={{ padding: "10px 13px", textAlign: "left", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => {
                const id = m.date + m.symbol;
                const reminded = reminders.has(id);
                const mtColor: Record<string, string> = { Annual: "#2563EB", EGM: "#7C3AED", Quarterly: "#059669" };
                return (
                  <tr key={id} style={{ borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
                    <td style={{ padding: "10px 13px", color: "var(--text-muted)", fontSize: 12, whiteSpace: "nowrap" }}>{m.date}</td>
                    <td style={{ padding: "10px 13px", fontWeight: 800, color: GOLD, fontFamily: "monospace", fontSize: 12 }}>{m.symbol}</td>
                    <td style={{ padding: "10px 13px", color: "var(--text-secondary)", fontSize: 12, maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.company}</td>
                    <td style={{ padding: "10px 13px" }}>
                      <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 12, fontWeight: 800, background: `${mtColor[m.meetingType]}18`, color: mtColor[m.meetingType] }}>{m.meetingType}</span>
                    </td>
                    <td style={{ padding: "10px 13px", color: "var(--text-secondary)", fontSize: 12, maxWidth: 260, whiteSpace: "normal", lineHeight: 1.5 }}>{m.agenda}</td>
                    <td style={{ padding: "10px 13px", fontWeight: 700, color: m.expectedDPS ? GOLD : "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {m.expectedDPS ? "PKR " + fmt(m.expectedDPS) : "—"}
                    </td>
                    <td style={{ padding: "10px 13px" }}>
                      <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 12, fontWeight: 800, background: m.status === "Upcoming" ? "rgba(37,99,235,0.1)" : "rgba(5,150,105,0.1)", color: m.status === "Upcoming" ? "#2563EB" : "#059669" }}>{m.status}</span>
                    </td>
                    <td style={{ padding: "10px 13px" }}>
                      {m.status === "Upcoming" && (
                        <button onClick={() => toggleReminder(id)} style={{ padding: "4px 10px", borderRadius: 7, border: reminded ? "none" : "1px solid var(--border)", background: reminded ? "#059669" : "none", color: reminded ? "#fff" : "var(--text-muted)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          {reminded ? "✓ Set" : "Remind"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>Source: PSX company announcements and board meeting notices. Dividend amounts are estimated — subject to Board approval.</p>
    </div>
  );
}

/* ── Main ── */
const TABS = ["Price Alerts", "Corporate Events", "Board Meetings"] as const;
type TabName = typeof TABS[number];

export default function AlertsClient() {
  const [tab, setTab] = useState<TabName>("Price Alerts");
  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "24px 24px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              <span style={{ color: "var(--text-primary)" }}>Market </span><span style={{ color: "#D4971A" }}>Alerts</span>
            </h1>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>Price alerts, corporate events & board meetings for PSX stocks</p>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 14px" }}>
            {new Date().toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: 22, background: "var(--card-bg)" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "12px 16px", border: "none", borderRight: t !== "Board Meetings" ? "1px solid var(--border)" : "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: tab === t ? NAVY : "transparent", color: tab === t ? GOLD : "var(--text-muted)", transition: "all 0.15s" }}>
              {t}
            </button>
          ))}
        </div>

        {tab === "Price Alerts"    && <PriceAlertsTab />}
        {tab === "Corporate Events" && <CorporateEventsTab />}
        {tab === "Board Meetings"  && <BoardMeetingsTab />}
      </div>
    </div>
  );
}
