"use client";
import { useState, useEffect, useMemo } from "react";

interface CorporateEvent {
  symbol: string;
  companyName: string;
  sectorName: string;
  type: string;
  dps?: number | null;
  date?: string;
}

interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  condition: "above" | "below";
  targetPrice: number;
  currentPrice: number;
  createdAt: string;
  triggered: boolean;
}

const DEMO_EVENTS: CorporateEvent[] = [
  { symbol: "ACIETF", companyName: "Alfalah Consumer Index (ETF)", sectorName: "ETFs", type: "Dividend", dps: 1.00 },
  { symbol: "BAFL",   companyName: "Bank Alfalah Limited",          sectorName: "Commercial Banks", type: "Dividend", dps: 8.50 },
  { symbol: "BWCL",   companyName: "Bestway Cement Limited",        sectorName: "Cement",           type: "Dividend", dps: 40.00 },
  { symbol: "FABL",   companyName: "Faysal Bank Limited",           sectorName: "Commercial Banks", type: "Dividend", dps: 6.50 },
  { symbol: "HMB",    companyName: "Habib Metropolitan Bank Limited",sectorName: "Commercial Banks", type: "Dividend", dps: 12.00 },
  { symbol: "IPAK",   companyName: "International Packaging Films Ltd",sectorName:"Paper & Board",   type: "Bonus",    dps: null },
  { symbol: "JLICL",  companyName: "Jubilee Life Insurance Co. Ltd",sectorName: "Insurance",        type: "Dividend", dps: 13.00 },
  { symbol: "JLICL",  companyName: "Jubilee Life Insurance Co. Ltd",sectorName: "Insurance",        type: "Bonus",    dps: null },
  { symbol: "MCB",    companyName: "MCB Bank Limited",              sectorName: "Commercial Banks", type: "Dividend", dps: 36.00 },
  { symbol: "MEBL",   companyName: "Meezan Bank Limited",           sectorName: "Commercial Banks", type: "Dividend", dps: 29.50 },
  { symbol: "MIIETF", companyName: "Mahaana Islamic Index ETF",     sectorName: "ETFs",             type: "Dividend", dps: null },
  { symbol: "NBPGETF",companyName: "NBP Pakistan Growth ETF",       sectorName: "ETFs",             type: "Dividend", dps: null },
  { symbol: "OGDC",   companyName: "Oil & Gas Dev. Co. Limited",    sectorName: "Oil & Gas",        type: "Dividend", dps: 6.00 },
  { symbol: "PPL",    companyName: "Pakistan Petroleum Limited",    sectorName: "Oil & Gas",        type: "Dividend", dps: 3.50 },
  { symbol: "SYS",    companyName: "Systems Limited",               sectorName: "Technology",       type: "Board Meeting", dps: null },
  { symbol: "TRG",    companyName: "TRG Pakistan Limited",          sectorName: "Technology",       type: "Board Meeting", dps: null },
  { symbol: "ENGRO",  companyName: "Engro Corporation Limited",     sectorName: "Fertilizer",       type: "Dividend", dps: 15.00 },
  { symbol: "LUCK",   companyName: "Lucky Cement Limited",          sectorName: "Cement",           type: "Board Meeting", dps: null },
  { symbol: "HBL",    companyName: "Habib Bank Limited",            sectorName: "Commercial Banks", type: "Insider Transaction", dps: null },
  { symbol: "UBL",    companyName: "United Bank Limited",           sectorName: "Commercial Banks", type: "Announcement", dps: null },
];

const POPULAR = ["OGDC","PPL","HBL","UBL","MCB","MEBL","ENGRO","LUCK","PSMC","SYS","TRG","PSO","MARI","FFC","EFERT","HUBC","DGKC","BWCL","NBP","ABL"];
const DEMO_PRICES: Record<string, number> = {
  OGDC:181.50,PPL:89.30,HBL:177.30,UBL:232.40,MCB:225.60,MEBL:218.50,ENGRO:285.40,LUCK:932.00,
  PSMC:830.00,SYS:724.00,TRG:101.50,PSO:341.60,MARI:2145.0,FFC:139.30,EFERT:87.60,HUBC:107.80,
  DGKC:97.80,BWCL:312.00,NBP:43.20,ABL:136.70,
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  Dividend:            { bg: "rgba(200,134,10,0.12)", color: "#C8860A" },
  Bonus:               { bg: "rgba(59,130,246,0.12)", color: "#2563eb" },
  "Board Meeting":     { bg: "rgba(139,92,246,0.12)", color: "#7c3aed" },
  "Insider Transaction":{ bg:"rgba(236,72,153,0.12)", color: "#db2777" },
  Announcement:        { bg: "rgba(20,184,166,0.12)", color: "#0d9488" },
};

const LS_KEY = "stockifyy_alerts_v1";
function loadAlerts(): PriceAlert[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; }
}
function saveAlerts(a: PriceAlert[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(a)); } catch {}
}
function fmt(n: number) {
  return n.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type StockRow = { symbol: string; name: string; close: string };

function AddAlertModal({ onClose, onAdd }: { onClose: () => void; onAdd: (a: Omit<PriceAlert, "id" | "createdAt" | "triggered">) => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StockRow | null>(null);
  const [showDrop, setShowDrop] = useState(false);
  const [allStocks, setAllStocks] = useState<StockRow[]>([]);
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("");

  useEffect(() => {
    fetch("/api/portal/stocks?limit=2000")
      .then(r => r.json())
      .then(j => {
        const rows: StockRow[] = (j.stocks ?? j.data ?? []).map((s: { symbol: string; companyName?: string; name?: string; close?: string }) => ({
          symbol: s.symbol,
          name: s.companyName ?? s.name ?? s.symbol,
          close: s.close ?? "0",
        }));
        setAllStocks(rows);
      })
      .catch(() => {});
  }, []);

  const hits = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return allStocks.filter(s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)).slice(0, 10);
  }, [query, allStocks]);

  const currentPrice = selected ? parseFloat(selected.close) : 0;

  function pick(s: StockRow) {
    setSelected(s);
    setQuery(s.symbol);
    setShowDrop(false);
  }

  function submit() {
    const t = parseFloat(target);
    if (!selected || !t) return;
    onAdd({ symbol: selected.symbol, name: selected.name, condition, targetPrice: t, currentPrice });
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--card-bg,#fff)", borderRadius: 12, padding: "28px 28px 24px", width: 420, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--navy,#0f172a)" }}>Create Price Alert</div>
            <div style={{ fontSize: 12, color: "var(--text-muted,#64748b)", marginTop: 2 }}>Get notified when price threshold is hit</div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "var(--text-muted)" }}>✕</button>
        </div>

        {/* Symbol search with dropdown */}
        <div style={{ marginBottom: 14, position: "relative" }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Symbol</label>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value.toUpperCase()); setSelected(null); setShowDrop(true); }}
            onFocus={() => setShowDrop(true)}
            onBlur={() => setTimeout(() => setShowDrop(false), 150)}
            placeholder="Search symbol or company…"
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${selected ? "#D4971A" : "var(--border,#e2e8f0)"}`, borderRadius: 8, fontSize: 13, boxSizing: "border-box", background: "var(--background,#f8fafc)", outline: "none", textTransform: "uppercase", fontWeight: selected ? 700 : 400 }}
          />
          {currentPrice > 0 && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              Current price: <strong style={{ color: "var(--navy)" }}>Rs {fmt(currentPrice)}</strong>
            </div>
          )}
          {showDrop && hits.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100, background: "var(--card-bg,#fff)", border: "1px solid var(--border,#e2e8f0)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
              {hits.map(s => (
                <button key={s.symbol} onMouseDown={() => pick(s)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid var(--border,#e2e8f0)", textAlign: "left", gap: 10 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,151,26,0.07)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#D4971A" }}>{s.symbol}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{s.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>Rs {parseFloat(s.close).toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
          {showDrop && query.length > 0 && hits.length === 0 && allStocks.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100, background: "var(--card-bg,#fff)", border: "1px solid var(--border,#e2e8f0)", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: "var(--text-muted)" }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Condition</label>
          <select value={condition} onChange={e => setCondition(e.target.value as "above" | "below")}
            style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border,#e2e8f0)", borderRadius: 8, fontSize: 13, background: "var(--background,#f8fafc)" }}>
            <option value="above">Price goes ABOVE</option>
            <option value="below">Price goes BELOW</option>
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>Target Price (Rs)</label>
          <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="Enter target price"
            style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border,#e2e8f0)", borderRadius: 8, fontSize: 13, boxSizing: "border-box", background: "var(--background,#f8fafc)" }} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid var(--border,#e2e8f0)", background: "none", fontSize: 13, cursor: "pointer", color: "var(--navy)" }}>Cancel</button>
          <button onClick={submit} disabled={!selected} style={{ padding: "9px 22px", borderRadius: 8, border: "none", background: selected ? "#D4971A" : "var(--border)", color: selected ? "#07111F" : "var(--text-muted)", fontSize: 13, fontWeight: 700, cursor: selected ? "pointer" : "default" }}>Create Alert</button>
        </div>
      </div>
    </div>
  );
}

export default function AlertsClient() {
  const [tab, setTab] = useState<"corporate" | "price">("corporate");
  const [eventFilter, setEventFilter] = useState("All Events");
  const [events, setEvents] = useState<CorporateEvent[]>(DEMO_EVENTS);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    setAlerts(loadAlerts());
    setMounted(true);
    // silently try live announcements — DEMO_EVENTS already show while fetching
    fetch("/api/portal/announcements?limit=50")
      .then(r => r.json())
      .then(json => {
        if (json.data?.length) {
          const mapped: CorporateEvent[] = json.data.map((a: { symbol: string; companyName?: string; sectorName?: string; announcementType?: string; dps?: number }) => ({
            symbol: a.symbol,
            companyName: a.companyName ?? a.symbol,
            sectorName: a.sectorName ?? "—",
            type: a.announcementType ?? "Announcement",
            dps: a.dps ?? null,
          }));
          setEvents(mapped);
        }
      }).catch(() => {});
  }, []);

  const EVENT_TYPES = ["All Events", "Dividend", "Board Meeting", "Bonus", "Insider Transaction", "Announcement"];

  const filteredEvents = useMemo(() =>
    eventFilter === "All Events" ? events : events.filter(e => e.type === eventFilter),
    [events, eventFilter]
  );

  function addAlert(data: Omit<PriceAlert, "id" | "createdAt" | "triggered">) {
    const next = [...alerts, { ...data, id: Date.now().toString(), createdAt: new Date().toISOString(), triggered: false }];
    setAlerts(next);
    saveAlerts(next);
  }

  function removeAlert(id: string) {
    const next = alerts.filter(a => a.id !== id);
    setAlerts(next);
    saveAlerts(next);
  }

  const tabStyle = (active: boolean) => ({
    padding: "9px 20px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
    background: active ? "#C8860A" : "transparent",
    color: active ? "#fff" : "var(--text-muted,#64748b)",
    transition: "all 150ms",
  });

  const pillStyle = (active: boolean) => ({
    padding: "6px 14px", borderRadius: 20, border: `1px solid ${active ? "#C8860A" : "var(--border,#e2e8f0)"}`,
    background: active ? "rgba(200,134,10,0.10)" : "transparent",
    color: active ? "#C8860A" : "var(--text-muted,#64748b)",
    fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const, transition: "all 150ms",
  });

  return (
    <div suppressHydrationWarning className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      {showAdd && <AddAlertModal onClose={() => setShowAdd(false)} onAdd={addAlert} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}><span style={{ color: "var(--navy)" }}>Alerts &amp;</span> <span style={{ color: "#C8860A" }}>Announcements</span></h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0 0" }}>Corporate events and your personal price alerts</p>
        </div>
        {tab === "price" && (
          <button onClick={() => setShowAdd(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "#C8860A", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Create Alert
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--card-bg,#fff)", border: "1px solid var(--border)", borderRadius: 10, padding: 4, width: "fit-content" }}>
        <button style={tabStyle(tab === "corporate")} onClick={() => setTab("corporate")}>Corporate Events</button>
        <button style={tabStyle(tab === "price")} onClick={() => setTab("price")}>Price Alerts</button>
      </div>

      {tab === "corporate" && (
        <>
          {/* Filter pills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {EVENT_TYPES.map(t => (
              <button key={t} style={pillStyle(eventFilter === t)} onClick={() => setEventFilter(t)}>{t}</button>
            ))}
          </div>

          <div className="card" style={{ overflow: "hidden" }}>
            {filteredEvents.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No events found for this filter</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["SYMBOL","COMPANY","SECTOR","TYPE","DPS"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((e, i) => {
                      const tc = TYPE_COLORS[e.type] ?? { bg: "rgba(100,116,139,0.10)", color: "#64748b" };
                      return (
                        <tr key={`${e.symbol}-${i}`} style={{ borderBottom: i < filteredEvents.length - 1 ? "1px solid var(--border)" : "none" }}
                          onMouseEnter={ev => (ev.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)"}
                          onMouseLeave={ev => (ev.currentTarget as HTMLElement).style.background = "transparent"}>
                          <td style={{ padding: "13px 16px", fontWeight: 700, fontSize: 13, color: "#C8860A", whiteSpace: "nowrap" }}>{e.symbol}</td>
                          <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--text)", maxWidth: 280 }}>{e.companyName}</td>
                          <td style={{ padding: "13px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{e.sectorName}</td>
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 700 }}>
                              {e.type === "Dividend" ? "🏦" : e.type === "Bonus" ? "🎁" : e.type === "Board Meeting" ? "📋" : e.type === "Insider Transaction" ? "👤" : "📢"} {e.type}
                            </span>
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: 13, color: e.dps ? "#C8860A" : "var(--text-muted)", fontWeight: e.dps ? 700 : 400, fontVariantNumeric: "tabular-nums" }}>
                            {e.dps ? `Rs ${fmt(e.dps)}` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>Corporate events sourced from PSX announcements. DPS = Dividend Per Share.</p>
        </>
      )}

      {tab === "price" && mounted && (
        <>
          {alerts.length === 0 ? (
            <div className="card" style={{ padding: "60px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)", marginBottom: 6 }}>No price alerts yet</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Create alerts to be notified when stocks hit your target price</div>
              <button onClick={() => setShowAdd(true)} style={{ padding: "10px 24px", background: "#C8860A", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Create your first alert
              </button>
            </div>
          ) : (
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["SYMBOL","CONDITION","TARGET PRICE","CURRENT PRICE","STATUS",""].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: h === "" ? "right" : "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((a, i) => {
                      const curr = DEMO_PRICES[a.symbol] ?? a.currentPrice;
                      const hit = a.condition === "above" ? curr >= a.targetPrice : curr <= a.targetPrice;
                      return (
                        <tr key={a.id} style={{ borderBottom: i < alerts.length - 1 ? "1px solid var(--border)" : "none" }}
                          onMouseEnter={ev => (ev.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.02)"}
                          onMouseLeave={ev => (ev.currentTarget as HTMLElement).style.background = "transparent"}>
                          <td style={{ padding: "13px 16px", fontWeight: 700, fontSize: 13, color: "#C8860A" }}>{a.symbol}</td>
                          <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--text)" }}>
                            Price goes <strong>{a.condition}</strong>
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: "var(--navy)", fontVariantNumeric: "tabular-nums" }}>Rs {fmt(a.targetPrice)}</td>
                          <td style={{ padding: "13px 16px", fontSize: 13, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>Rs {fmt(curr)}</td>
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                              background: hit ? "rgba(22,163,74,0.12)" : "rgba(100,116,139,0.10)",
                              color: hit ? "#16a34a" : "#64748b" }}>
                              {hit ? "✓ Triggered" : "⏳ Waiting"}
                            </span>
                          </td>
                          <td style={{ padding: "13px 16px", textAlign: "right" }}>
                            <button onClick={() => removeAlert(a.id)} title="Delete alert"
                              style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 15 }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#dc2626"}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"}>
                              🗑
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
