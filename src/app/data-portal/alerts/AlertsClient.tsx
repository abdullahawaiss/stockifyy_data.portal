"use client";
import { useState, useEffect, useMemo } from "react";
import { searchPsxStocks } from "@/lib/psx-stocks-static";
import { useDarkTokens } from "@/hooks/useDarkMode";

// ── Types ──────────────────────────────────────────────────────────────────────
interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  alertType: "above" | "below" | "pct_up" | "pct_down";
  targetValue: number;
  currentPrice: number;
  notifyMethod: "in-app" | "email";
  notes: string;
  createdAt: string;
  status: "active" | "triggered" | "expired";
}

interface CorporateEvent {
  symbol: string;
  companyName: string;
  sector: string;
  eventType: "Dividend" | "AGM" | "Rights Issue" | "Bonus Shares" | "IPO" | "Board Meeting";
  date: string;
  details: string;
  dps?: number | null;
}

interface BoardMeeting {
  id: string;
  symbol: string;
  companyName: string;
  sector: string;
  date: string;
  agenda: string[];
  dpsExpected?: number | null;
  reminded: boolean;
}

// ── Demo data ──────────────────────────────────────────────────────────────────
const DEMO_PRICES: Record<string, number> = {
  OGDC:181.50,PPL:89.30,HBL:177.30,UBL:232.40,MCB:225.60,MEBL:218.50,ENGRO:285.40,LUCK:932.00,
  PSMC:830.00,SYS:724.00,TRG:101.50,PSO:341.60,MARI:2145.0,FFC:139.30,EFERT:87.60,HUBC:107.80,
  DGKC:97.80,BWCL:312.00,NBP:43.20,ABL:136.70,BAFL:54.60,INDU:1702.0,NML:138.0,ICI:832.0,
  SEARL:228.0,SNGP:28.10,FCCL:22.10,MLCF:40.80,PTC:18.80,MUGHAL:78.50,
};

const UPCOMING_EVENTS: CorporateEvent[] = [
  { symbol:"MEBL",  companyName:"Meezan Bank Limited",         sector:"Commercial Banks",  eventType:"Dividend",    date:"2026-09-05", details:"Final dividend expected", dps:29.50 },
  { symbol:"MCB",   companyName:"MCB Bank Limited",            sector:"Commercial Banks",  eventType:"Dividend",    date:"2026-09-08", details:"Half year dividend announcement", dps:36.00 },
  { symbol:"BWCL",  companyName:"Bestway Cement Limited",      sector:"Cement",            eventType:"Dividend",    date:"2026-09-10", details:"Annual dividend", dps:40.00 },
  { symbol:"ENGRO", companyName:"Engro Corporation Limited",   sector:"Fertilizer",        eventType:"AGM",         date:"2026-09-12", details:"Annual General Meeting — Karachi", dps:null },
  { symbol:"LUCK",  companyName:"Lucky Cement Limited",        sector:"Cement",            eventType:"Rights Issue",date:"2026-09-15", details:"Rights at PKR 500 — 1 for 4", dps:null },
  { symbol:"HBL",   companyName:"Habib Bank Limited",          sector:"Commercial Banks",  eventType:"Dividend",    date:"2026-09-18", details:"Quarterly dividend", dps:14.00 },
  { symbol:"SYS",   companyName:"Systems Limited",             sector:"Technology",        eventType:"Bonus Shares",date:"2026-09-20", details:"10% bonus shares announced", dps:null },
  { symbol:"PPL",   companyName:"Pakistan Petroleum Limited",  sector:"Oil & Gas",         eventType:"Dividend",    date:"2026-09-22", details:"Final dividend", dps:3.50 },
  { symbol:"TRG",   companyName:"TRG Pakistan Limited",        sector:"Technology",        eventType:"AGM",         date:"2026-09-25", details:"Annual General Meeting", dps:null },
  { symbol:"UBL",   companyName:"United Bank Limited",         sector:"Commercial Banks",  eventType:"Dividend",    date:"2026-09-28", details:"Interim dividend", dps:28.00 },
  { symbol:"FFC",   companyName:"Fauji Fertilizer Co. Ltd",    sector:"Fertilizer",        eventType:"Dividend",    date:"2026-10-03", details:"Quarterly dividend payout", dps:18.00 },
  { symbol:"BAFL",  companyName:"Bank Alfalah Limited",        sector:"Commercial Banks",  eventType:"Dividend",    date:"2026-10-06", details:"Interim cash dividend", dps:8.50 },
  { symbol:"OGDC",  companyName:"Oil & Gas Dev. Co. Ltd",      sector:"Oil & Gas",         eventType:"Dividend",    date:"2026-10-10", details:"1st interim dividend", dps:6.00 },
  { symbol:"PSO",   companyName:"Pakistan State Oil Co. Ltd",  sector:"Oil & Gas",         eventType:"AGM",         date:"2026-10-14", details:"Annual General Meeting", dps:null },
  { symbol:"ICI",   companyName:"ICI Pakistan Limited",        sector:"Chemicals",         eventType:"Dividend",    date:"2026-10-18", details:"Annual dividend", dps:50.00 },
];

const BOARD_MEETINGS: BoardMeeting[] = [
  { id:"bm1",  symbol:"SYS",   companyName:"Systems Limited",              sector:"Technology",       date:"2026-09-04", agenda:["Q2 Financial Results","Dividend Declaration","Business Update"], dpsExpected:7.50, reminded:false },
  { id:"bm2",  symbol:"TRG",   companyName:"TRG Pakistan Limited",         sector:"Technology",       date:"2026-09-07", agenda:["Annual Results","Future Strategy","Capital Structure"], dpsExpected:null, reminded:false },
  { id:"bm3",  symbol:"ENGRO", companyName:"Engro Corporation Limited",    sector:"Fertilizer",       date:"2026-09-10", agenda:["Q3 Results","Expansion Update","Dividend"], dpsExpected:15.00, reminded:false },
  { id:"bm4",  symbol:"LUCK",  companyName:"Lucky Cement Limited",         sector:"Cement",           date:"2026-09-13", agenda:["Annual Accounts","Rights Issue Discussion","CEO Report"], dpsExpected:25.00, reminded:false },
  { id:"bm5",  symbol:"HBL",   companyName:"Habib Bank Limited",           sector:"Commercial Banks", date:"2026-09-17", agenda:["Half Year Results","Dividend","Digital Strategy"], dpsExpected:14.00, reminded:false },
  { id:"bm6",  symbol:"FFC",   companyName:"Fauji Fertilizer Co. Ltd",     sector:"Fertilizer",       date:"2026-09-21", agenda:["Quarterly Results","Urea Offtake Update","Dividend"], dpsExpected:12.50, reminded:false },
  { id:"bm7",  symbol:"IPAK",  companyName:"International Packaging Films",sector:"Paper & Board",    date:"2026-09-24", agenda:["Annual Accounts","Expansion Capex","Bonus Issue"], dpsExpected:5.00, reminded:false },
  { id:"bm8",  symbol:"MCB",   companyName:"MCB Bank Limited",             sector:"Commercial Banks", date:"2026-09-28", agenda:["H1 Results","Capital Adequacy","Dividend"], dpsExpected:36.00, reminded:false },
  { id:"bm9",  symbol:"UBL",   companyName:"United Bank Limited",          sector:"Commercial Banks", date:"2026-10-02", agenda:["Q3 Earnings","Digital Banking KPIs","Interim Dividend"], dpsExpected:28.00, reminded:false },
  { id:"bm10", symbol:"MARI",  companyName:"Mari Petroleum Company Limited",sector:"Oil & Gas",       date:"2026-10-06", agenda:["Production Update","CAPEX","Dividend Announcement"], dpsExpected:90.00, reminded:false },
  { id:"bm11", symbol:"OGDC",  companyName:"Oil & Gas Dev. Co. Ltd",       sector:"Oil & Gas",        date:"2026-10-09", agenda:["Annual Accounts","Interim Dividend","Exploration Update"], dpsExpected:6.00, reminded:false },
  { id:"bm12", symbol:"MEBL",  companyName:"Meezan Bank Limited",          sector:"Commercial Banks", date:"2026-10-13", agenda:["Half Year Results","Zakat Policy","Dividend"], dpsExpected:29.50, reminded:false },
];

const EVENT_COLORS: Record<string, { bg: string; color: string }> = {
  Dividend:    { bg: "#D4971A18", color: "#D4971A" },
  AGM:         { bg: "#2563eb14", color: "#2563eb" },
  "Rights Issue":{ bg: "#7c3aed14", color: "#7c3aed" },
  "Bonus Shares":{ bg: "#0891b214", color: "#0891b2" },
  IPO:         { bg: "#16a34a14", color: "#16a34a" },
  "Board Meeting":{ bg: "#ec489914", color: "#ec4899" },
};

const LS_KEY = "stockifyy_alerts";
function loadAlerts(): PriceAlert[] { try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; } }
function saveAlerts(a: PriceAlert[]) { try { localStorage.setItem(LS_KEY, JSON.stringify(a)); } catch {} }

const LS_BM = "stockifyy_board_reminders";
function loadReminders(): string[] { try { return JSON.parse(localStorage.getItem(LS_BM) ?? "[]"); } catch { return []; } }
function saveReminders(r: string[]) { try { localStorage.setItem(LS_BM, JSON.stringify(r)); } catch {} }

function fmt(n: number, d = 2) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr), now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Add Alert Modal ────────────────────────────────────────────────────────────
function AddAlertModal({ onClose, onAdd, card, border, text, muted, tk }: {
  onClose: () => void;
  onAdd: (a: Omit<PriceAlert, "id" | "createdAt" | "status">) => void;
  card: string; border: string; text: string; muted: string;
  tk: ReturnType<typeof useDarkTokens>;
}) {
  const [query, setQuery] = useState("");
  const [suggs, setSuggs] = useState<{ symbol: string; name: string }[]>([]);
  const [sym, setSym] = useState("");
  const [name, setName] = useState("");
  const [alertType, setAlertType] = useState<PriceAlert["alertType"]>("above");
  const [targetValue, setTargetValue] = useState("");
  const [notifyMethod, setNotifyMethod] = useState<"in-app"|"email">("in-app");
  const [notes, setNotes] = useState("");
  const gold = "#D4971A";

  const INP: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", padding: "9px 12px",
    border: `1.5px solid ${border}`, borderRadius: 8, fontSize: 13,
    background: tk.dark ? "#07111F" : "#F8F6F1", color: text, outline: "none",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: card, borderRadius: 16, padding: "28px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: text }}>Add Price Alert</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: muted, fontSize: 20 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Symbol search */}
          <div style={{ position: "relative" }}>
            <input value={query} onChange={e => { setQuery(e.target.value); setSuggs(searchPsxStocks(e.target.value, 6)); }}
              placeholder="Search symbol..." style={INP} />
            {suggs.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: card, border: `1px solid ${border}`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", maxHeight: 200, overflowY: "auto" }}>
                {suggs.map(s => (
                  <button key={s.symbol} onClick={() => { setSym(s.symbol); setName(s.name); setQuery(s.symbol); setSuggs([]); const p = DEMO_PRICES[s.symbol]; if (p) setTargetValue(p.toString()); }}
                    style={{ display: "block", width: "100%", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 12, color: text, borderBottom: `1px solid ${border}` }}>
                    <strong style={{ color: gold }}>{s.symbol}</strong> — {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {sym && <div style={{ fontSize: 12, color: muted }}>Current price: <strong style={{ color: text }}>PKR {fmt(DEMO_PRICES[sym] ?? 0)}</strong></div>}
          {/* Alert type */}
          <select value={alertType} onChange={e => setAlertType(e.target.value as PriceAlert["alertType"])} style={INP}>
            <option value="above">Price Above</option>
            <option value="below">Price Below</option>
            <option value="pct_up">% Change Up</option>
            <option value="pct_down">% Change Down</option>
          </select>
          <input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)}
            placeholder={alertType === "above" || alertType === "below" ? "Target Price (PKR)" : "% Change Threshold"} style={INP} />
          <select value={notifyMethod} onChange={e => setNotifyMethod(e.target.value as "in-app"|"email")} style={INP}>
            <option value="in-app">In-App Notification</option>
            <option value="email">Email Alert</option>
          </select>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" style={INP} />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", background: "none", border: `1px solid ${border}`, borderRadius: 8, color: muted, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => {
            if (!sym || !targetValue) return;
            const curP = DEMO_PRICES[sym] ?? 0;
            onAdd({ symbol: sym, name, alertType, targetValue: parseFloat(targetValue), currentPrice: curP, notifyMethod, notes });
            onClose();
          }} style={{ flex: 2, padding: "10px", background: `linear-gradient(135deg, ${gold}, #B8810E)`, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
            Set Alert
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AlertsClient() {
  const tk = useDarkTokens();
  const [tab, setTab] = useState<"price" | "events" | "board">("price");
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>("All");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAlerts(loadAlerts());
    setReminders(loadReminders());
  }, []);

  useEffect(() => { if (mounted) saveAlerts(alerts); }, [alerts, mounted]);
  useEffect(() => { if (mounted) saveReminders(reminders); }, [reminders, mounted]);

  function addAlert(a: Omit<PriceAlert, "id" | "createdAt" | "status">) {
    setAlerts(prev => [...prev, { ...a, id: Date.now().toString(), createdAt: new Date().toISOString(), status: "active" }]);
  }
  function removeAlert(id: string) { setAlerts(prev => prev.filter(a => a.id !== id)); }
  function triggerAlert(id: string) { setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: "triggered" } : a)); }
  function toggleReminder(bmId: string) {
    setReminders(prev => prev.includes(bmId) ? prev.filter(r => r !== bmId) : [...prev, bmId]);
  }

  const filteredEvents = useMemo(() => {
    if (eventFilter === "All") return UPCOMING_EVENTS;
    return UPCOMING_EVENTS.filter(e => e.eventType === eventFilter);
  }, [eventFilter]);

  const groupedEvents = useMemo(() => {
    const map: Record<string, CorporateEvent[]> = {};
    filteredEvents.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredEvents]);

  const triggered = alerts.filter(a => a.status === "triggered");
  const active = alerts.filter(a => a.status === "active");

  const card = tk.dark ? "#0A1825" : "#ffffff";
  const border = tk.dark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
  const text = tk.dark ? "#BDD0E8" : "#07111F";
  const muted = tk.dark ? "#5C8099" : "#718096";
  const bg = tk.dark ? "#0E1F30" : "#F8F6F1";
  const navy = "#07111F";
  const gold = "#D4971A";

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: bg, padding: "24px 20px", color: text, fontFamily: "inherit" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: text }}>Alerts & Events</h1>
            <p style={{ fontSize: 13, color: muted, margin: "4px 0 0" }}>Price alerts, corporate events, and board meeting tracker</p>
          </div>
          {tab === "price" && (
            <button onClick={() => setShowAddModal(true)} style={{
              padding: "10px 20px", background: `linear-gradient(135deg, ${gold}, #B8810E)`,
              color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>+ Add Alert</button>
          )}
        </div>

        {/* Tab Bar */}
        <div style={{ display: "flex", background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 4, marginBottom: 24, width: "fit-content", gap: 2 }}>
          {([
            { id: "price", label: "🔔 Price Alerts", count: active.length },
            { id: "events", label: "📅 Corporate Events", count: UPCOMING_EVENTS.length },
            { id: "board", label: "🏛 Board Meetings", count: BOARD_MEETINGS.length },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer",
              background: tab === t.id ? gold : "none",
              color: tab === t.id ? "#fff" : muted, fontWeight: 700, fontSize: 13,
              transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6,
            }}>
              {t.label}
              {t.count > 0 && (
                <span style={{ background: tab === t.id ? "rgba(255,255,255,0.25)" : border, borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── PRICE ALERTS TAB ── */}
        {tab === "price" && (
          <div>
            {/* Triggered alerts */}
            {triggered.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>✓ Triggered Alerts</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {triggered.map(a => (
                    <div key={a.id} style={{ background: "#16a34a10", border: "1px solid #16a34a30", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ background: navy, color: gold, fontWeight: 800, fontSize: 12, padding: "2px 8px", borderRadius: 5 }}>{a.symbol}</span>
                        <span style={{ fontSize: 12, color: text }}>{a.alertType.replace("_", " ").toUpperCase()} {fmt(a.targetValue)}</span>
                        <span style={{ fontSize: 11, background: "#16a34a20", color: "#16a34a", padding: "2px 8px", borderRadius: 8, fontWeight: 700 }}>TRIGGERED</span>
                      </div>
                      <button onClick={() => removeAlert(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 13 }}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active alerts table */}
            <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: text }}>Active Alerts ({active.length})</span>
              </div>
              {active.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: muted }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No active alerts</div>
                  <div style={{ fontSize: 13 }}>Click "+ Add Alert" to set a price alert for any PSX stock</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: navy }}>
                        {["Symbol","Alert Type","Condition","Current Price","Method","Notes","Created","Actions"].map(c => (
                          <th key={c} style={{ padding: "9px 12px", textAlign: "right", color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {active.map(a => {
                        const cp = DEMO_PRICES[a.symbol] ?? a.currentPrice;
                        const typeLabel = { above: "Price Above", below: "Price Below", pct_up: "% Up", pct_down: "% Down" }[a.alertType];
                        const condColor = (a.alertType === "above" && cp >= a.targetValue) || (a.alertType === "below" && cp <= a.targetValue) ? "#16a34a" : gold;
                        return (
                          <tr key={a.id} style={{ borderBottom: `1px solid ${border}` }}
                            onMouseEnter={e => (e.currentTarget.style.background = tk.dark ? "rgba(255,255,255,0.03)" : "#f8fafc")}
                            onMouseLeave={e => (e.currentTarget.style.background = "")}>
                            <td style={{ padding: "10px 12px", textAlign: "right" }}>
                              <span style={{ background: navy, color: gold, fontWeight: 800, fontSize: 12, padding: "2px 8px", borderRadius: 5 }}>{a.symbol}</span>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "right", fontSize: 12 }}>{typeLabel}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: condColor }}>{fmt(a.targetValue)}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmt(cp)}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right" }}>
                              <span style={{ fontSize: 11, background: a.notifyMethod === "email" ? "#2563eb18" : gold + "18", color: a.notifyMethod === "email" ? "#2563eb" : gold, padding: "2px 8px", borderRadius: 8, fontWeight: 600 }}>
                                {a.notifyMethod === "email" ? "📧 Email" : "🔔 In-App"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 12px", textAlign: "right", color: muted, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.notes || "—"}</td>
                            <td style={{ padding: "10px 12px", textAlign: "right", color: muted, fontSize: 11 }}>{new Date(a.createdAt).toLocaleDateString("en-PK")}</td>
                            <td style={{ padding: "10px 12px", textAlign: "center" }}>
                              <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                                <button onClick={() => triggerAlert(a.id)} title="Mark triggered" style={{ background: "#16a34a18", color: "#16a34a", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>✓</button>
                                <button onClick={() => removeAlert(a.id)} style={{ background: "#dc262618", color: "#dc2626", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>✕</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CORPORATE EVENTS TAB ── */}
        {tab === "events" && (
          <div>
            {/* Event type filter */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {["All","Dividend","AGM","Rights Issue","Bonus Shares","Board Meeting"].map(f => (
                <button key={f} onClick={() => setEventFilter(f)} style={{
                  padding: "6px 14px", borderRadius: 20, border: `1px solid ${border}`, cursor: "pointer",
                  background: eventFilter === f ? gold : card, color: eventFilter === f ? "#fff" : muted,
                  fontWeight: eventFilter === f ? 700 : 500, fontSize: 12, transition: "all 0.15s",
                }}>{f}</button>
              ))}
            </div>

            {groupedEvents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: muted }}>No events match this filter</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {groupedEvents.map(([date, events]) => {
                  const days = daysUntil(date);
                  return (
                    <div key={date}>
                      {/* Date header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <div style={{ background: navy, color: gold, fontWeight: 800, fontSize: 12, padding: "5px 14px", borderRadius: 8 }}>
                          {new Date(date).toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" })}
                        </div>
                        <span style={{ fontSize: 12, color: days <= 3 ? "#dc2626" : days <= 7 ? gold : muted, fontWeight: 600 }}>
                          {days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
                        </span>
                        <div style={{ flex: 1, height: 1, background: border }} />
                      </div>
                      {/* Events */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
                        {events.map((ev, i) => {
                          const ec = EVENT_COLORS[ev.eventType] ?? { bg: "#94a3b814", color: "#94a3b8" };
                          return (
                            <div key={i} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: "14px 16px", borderLeft: `3px solid ${ec.color}` }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                <span style={{ background: navy, color: gold, fontWeight: 800, fontSize: 12, padding: "2px 8px", borderRadius: 5 }}>{ev.symbol}</span>
                                <span style={{ background: ec.bg, color: ec.color, fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 8 }}>{ev.eventType}</span>
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 4 }}>{ev.companyName}</div>
                              <div style={{ fontSize: 12, color: muted, marginBottom: ev.dps ? 6 : 0 }}>{ev.details}</div>
                              {ev.dps && (
                                <div style={{ fontSize: 13, fontWeight: 800, color: gold }}>DPS: PKR {fmt(ev.dps)}</div>
                              )}
                              <div style={{ fontSize: 11, color: muted, marginTop: 6 }}>Sector: {ev.sector}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BOARD MEETINGS TAB ── */}
        {tab === "board" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
            {BOARD_MEETINGS.map(bm => {
              const days = daysUntil(bm.date);
              const isReminded = reminders.includes(bm.id);
              const urgency = days <= 3 ? "#dc2626" : days <= 7 ? gold : "#16a34a";
              return (
                <div key={bm.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "18px", borderTop: `3px solid ${urgency}` }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ background: navy, color: gold, fontWeight: 800, fontSize: 13, padding: "3px 10px", borderRadius: 6 }}>{bm.symbol}</span>
                        <span style={{ fontSize: 12, color: urgency, fontWeight: 700 }}>
                          {days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d away`}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{bm.companyName}</div>
                      <div style={{ fontSize: 11, color: muted }}>{new Date(bm.date).toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
                    </div>
                    {bm.dpsExpected && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 10, color: muted }}>DPS Expected</div>
                        <div style={{ fontSize: 18, fontWeight: 900, color: gold }}>₨{fmt(bm.dpsExpected, 0)}</div>
                      </div>
                    )}
                  </div>

                  {/* Agenda */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Agenda</div>
                    <ul style={{ margin: 0, paddingLeft: 16, listStyleType: "disc" }}>
                      {bm.agenda.map((item, i) => (
                        <li key={i} style={{ fontSize: 12, color: text, marginBottom: 3 }}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${border}` }}>
                    <span style={{ fontSize: 11, color: muted }}>{bm.sector}</span>
                    <button onClick={() => toggleReminder(bm.id)} style={{
                      padding: "5px 12px", borderRadius: 8, border: `1px solid ${isReminded ? gold : border}`,
                      background: isReminded ? gold + "20" : "none",
                      color: isReminded ? gold : muted, fontSize: 12, fontWeight: 700, cursor: "pointer",
                      transition: "all 0.15s",
                    }}>
                      {isReminded ? "🔔 Reminded" : "⏰ Remind Me"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddAlertModal onClose={() => setShowAddModal(false)} onAdd={addAlert} card={card} border={border} text={text} muted={muted} tk={tk} />
      )}
    </div>
  );
}
