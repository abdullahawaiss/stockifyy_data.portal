"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useDarkTokens } from "@/hooks/useDarkMode";
import { searchPsxStocks } from "@/lib/psx-stocks-static";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  addedDate: string;
}

interface Transaction {
  id: string;
  symbol: string;
  name: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  date: string;
  note?: string;
}

interface PriceInfo {
  price: number;
  chg: number;
}

// ── Demo prices ────────────────────────────────────────────────────────────────
const DEMO_PRICES: Record<string, PriceInfo> = {
  OGDC: { price: 181.50, chg: -0.66 }, PPL: { price: 89.30, chg: -0.78 },
  MARI: { price: 2210.0, chg: 0.68 },  HBL: { price: 178.50, chg: 1.02 },
  UBL: { price: 232.40, chg: 0.91 },   MCB: { price: 219.80, chg: -0.68 },
  NBP: { price: 43.20, chg: 0.70 },    MEBL: { price: 218.50, chg: 0.83 },
  LUCK: { price: 1125.0, chg: 0.76 },  DGKC: { price: 97.80, chg: -0.81 },
  ENGRO: { price: 312.50, chg: 1.13 }, EFERT: { price: 87.60, chg: 0.69 },
  FFC: { price: 139.30, chg: -0.64 },  HUBC: { price: 107.80, chg: 0.75 },
  TRG: { price: 101.50, chg: 1.50 },   SYS: { price: 724.0, chg: 1.26 },
  PTC: { price: 18.80, chg: -1.05 },   FCCL: { price: 22.10, chg: 0.91 },
  BWCL: { price: 312.0, chg: 0.81 },   PSO: { price: 478.0, chg: 0.95 },
  SNGP: { price: 28.10, chg: 1.44 },   SEARL: { price: 228.0, chg: 0.88 },
  MLCF: { price: 40.80, chg: -0.97 },  PSMC: { price: 830.0, chg: 1.47 },
  INDU: { price: 1702.0, chg: 1.07 },  FFBL: { price: 25.10, chg: 0.80 },
  FATIMA: { price: 34.80, chg: -0.57 },ILP: { price: 68.0, chg: 0.89 },
  NML: { price: 138.0, chg: 0.73 },    MUGHAL: { price: 78.50, chg: 0.90 },
  EPCL: { price: 38.20, chg: 0.79 },   ICI: { price: 832.0, chg: 0.73 },
  BAFL: { price: 54.60, chg: 0.74 },   ABL: { price: 136.70, chg: 0.66 },
};

const POPULAR_SYMBOLS = Object.keys(DEMO_PRICES);

function getPrice(sym: string): PriceInfo {
  return DEMO_PRICES[sym] ?? { price: 100, chg: 0 };
}

function fmt(n: number, dec = 2): string {
  return n.toLocaleString("en-PK", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function pctColor(v: number): string {
  return v > 0 ? "#16A34A" : v < 0 ? "#DC2626" : "#6b7280";
}

const LS_KEY = "stockifyy_portfolio_v1";
const LS_HIST = "stockifyy_portfolio_history_v1";

function loadHoldings(): Holding[] {
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveHoldings(h: Holding[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(h)); } catch {}
}
function loadHistory(): Transaction[] {
  try { const raw = localStorage.getItem(LS_HIST); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function saveHistory(h: Transaction[]) {
  try { localStorage.setItem(LS_HIST, JSON.stringify(h)); } catch {}
}

// ── Add Stock Modal ────────────────────────────────────────────────────────────
function AddStockModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (h: Omit<Holding, "id">, txType: "BUY") => void;
}) {
  const t = useDarkTokens();
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [avgPrice, setAvgPrice] = useState("");
  const [symSuggestions, setSymSuggestions] = useState<string[]>([]);

  const handleSymbolChange = (val: string) => {
    const upper = val.toUpperCase();
    setSymbol(upper);
    if (upper.length >= 1) {
      const staticSuggestions = searchPsxStocks(upper, 12).map(s => s.symbol);
      setSymSuggestions(staticSuggestions.length > 0 ? staticSuggestions : POPULAR_SYMBOLS.filter(s => s.startsWith(upper)).slice(0, 6));
      fetch(`/api/portal/companies?search=${encodeURIComponent(upper)}&limit=50`)
        .then(r => r.json())
        .then(j => { const syms = (j.data ?? []).map((c: { symbol: string }) => c.symbol); if (syms.length > 0) setSymSuggestions(syms); })
        .catch(() => {});
    } else {
      setSymSuggestions([]);
    }
    if (DEMO_PRICES[upper]) setAvgPrice(DEMO_PRICES[upper].price.toString());
  };

  const selectSymbol = (sym: string) => {
    setSymbol(sym); setSymSuggestions([]);
    if (DEMO_PRICES[sym]) setAvgPrice(DEMO_PRICES[sym].price.toString());
  };

  const handleSubmit = () => {
    const q = parseFloat(qty), p = parseFloat(avgPrice);
    if (!symbol.trim() || isNaN(q) || q <= 0 || isNaN(p) || p <= 0) return;
    onAdd({ symbol: symbol.trim().toUpperCase(), name: name.trim() || symbol.trim().toUpperCase(), quantity: q, avgPrice: p, addedDate: new Date().toISOString().slice(0, 10) }, "BUY");
    onClose();
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${t.border}`, background: t.inputBg ?? t.bg, color: t.text, fontSize: 13, outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 5 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: 12, width: 360, maxWidth: "calc(100vw - 32px)", padding: "22px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", border: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.text }}>Add Stock to Portfolio</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: t.textMuted, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ marginBottom: 14, position: "relative" }}>
          <label style={labelStyle}>Stock Symbol</label>
          <input value={symbol} onChange={e => handleSymbolChange(e.target.value)} placeholder="e.g. OGDC, HBL, LUCK" style={inputStyle} autoFocus />
          {symSuggestions.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", overflow: "hidden" }}>
              {symSuggestions.map(s => (
                <button key={s} onClick={() => selectSymbol(s)} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", background: "none", border: "none", borderBottom: `1px solid ${t.border}`, cursor: "pointer", fontSize: 12, fontWeight: 700, color: t.text }}>
                  {s} <span style={{ fontWeight: 400, color: t.textMuted, fontSize: 11 }}>— Rs {fmt(getPrice(s).price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Company Name (optional)</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Oil & Gas Dev. Co." style={inputStyle} /></div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Quantity (Shares)</label><input value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g. 500" type="number" min="1" style={inputStyle} /></div>
        <div style={{ marginBottom: 20 }}><label style={labelStyle}>Average Buy Price (Rs)</label><input value={avgPrice} onChange={e => setAvgPrice(e.target.value)} placeholder="e.g. 175.50" type="number" min="0" step="0.01" style={inputStyle} /></div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px", borderRadius: 7, border: `1px solid ${t.border}`, background: "transparent", color: t.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSubmit} style={{ flex: 2, padding: "9px", borderRadius: 7, border: "none", background: "var(--gold)", color: "#07111F", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>+ Add to Portfolio</button>
        </div>
      </div>
    </div>
  );
}

// ── Sell Modal ────────────────────────────────────────────────────────────────
function SellModal({ holding, onClose, onSell }: {
  holding: Holding;
  onClose: () => void;
  onSell: (id: string, qty: number, price: number) => void;
}) {
  const t = useDarkTokens();
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState(getPrice(holding.symbol).price.toString());

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${t.border}`, background: t.inputBg ?? t.bg, color: t.text, fontSize: 13, outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 5 };

  const q = parseFloat(qty), p = parseFloat(price);
  const profit = (q && p) ? (p - holding.avgPrice) * q : null;

  const handleSell = () => {
    if (!q || q <= 0 || q > holding.quantity || !p || p <= 0) return;
    onSell(holding.id, q, p);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: t.bg, borderRadius: 12, width: 360, maxWidth: "calc(100vw - 32px)", padding: "22px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", border: `1px solid ${t.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.text }}>Sell <span style={{ color: "#DC2626" }}>{holding.symbol}</span></h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: t.textMuted, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ marginBottom: 6, padding: "10px 12px", background: "rgba(220,38,38,0.06)", borderRadius: 8, border: "1px solid rgba(220,38,38,0.15)", fontSize: 12, color: t.textMuted }}>
          You hold <strong style={{ color: t.text }}>{holding.quantity.toLocaleString()} shares</strong> at avg <strong style={{ color: t.text }}>Rs {fmt(holding.avgPrice)}</strong>
        </div>
        <div style={{ marginBottom: 14, marginTop: 14 }}><label style={labelStyle}>Shares to Sell (max {holding.quantity})</label><input value={qty} onChange={e => setQty(e.target.value)} placeholder={`1 – ${holding.quantity}`} type="number" min="1" max={holding.quantity} style={inputStyle} autoFocus /></div>
        <div style={{ marginBottom: 14 }}><label style={labelStyle}>Sell Price (Rs)</label><input value={price} onChange={e => setPrice(e.target.value)} placeholder="Current market price" type="number" min="0" step="0.01" style={inputStyle} /></div>
        {profit !== null && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: profit >= 0 ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)", border: `1px solid ${profit >= 0 ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}` }}>
            <span style={{ fontSize: 11, color: t.textMuted }}>Estimated P/L: </span>
            <strong style={{ fontSize: 14, color: profit >= 0 ? "#16A34A" : "#DC2626" }}>{profit >= 0 ? "+" : ""}Rs {fmt(profit)} ({profit >= 0 ? "+" : ""}{fmt(((p - holding.avgPrice) / holding.avgPrice) * 100)}%)</strong>
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "9px", borderRadius: 7, border: `1px solid ${t.border}`, background: "transparent", color: t.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSell} disabled={!q || q <= 0 || q > holding.quantity || !p || p <= 0} style={{ flex: 2, padding: "9px", borderRadius: 7, border: "none", background: "#DC2626", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Sell Shares</button>
        </div>
      </div>
    </div>
  );
}

// ── History Tab ────────────────────────────────────────────────────────────────
function HistoryTab({ history }: { history: Transaction[] }) {
  const t = useDarkTokens();
  const sorted = useMemo(() => [...history].sort((a, b) => b.date.localeCompare(a.date)), [history]);

  if (sorted.length === 0) return (
    <div style={{ padding: "80px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
      <p style={{ fontSize: 15, fontWeight: 700, color: t.text, margin: "0 0 6px" }}>No transactions yet</p>
      <p style={{ fontSize: 12, color: t.textMuted, margin: 0 }}>Your buy/sell history will appear here</p>
    </div>
  );

  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bg, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 620 }}>
          <thead>
            <tr style={{ background: t.tableTh ?? t.bg }}>
              {["Date", "Type", "Symbol", "Company", "Quantity", "Price", "Total Value", "P/L"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: h === "Date" || h === "Type" || h === "Symbol" || h === "Company" ? "left" : "right", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: t.textMuted, borderBottom: `2px solid ${t.border}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx, i) => {
              const total = tx.quantity * tx.price;
              const curPrice = getPrice(tx.symbol).price;
              const pl = tx.type === "BUY" ? (curPrice - tx.price) * tx.quantity : null;
              const tdStyle: React.CSSProperties = { padding: "11px 14px", fontSize: 12, color: t.text, borderBottom: i < sorted.length - 1 ? `1px solid ${t.border}` : "none", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" };
              return (
                <tr key={tx.id} onMouseEnter={e => (e.currentTarget.style.background = t.bgLight ?? "rgba(0,0,0,0.02)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={tdStyle}>{tx.date}</td>
                  <td style={tdStyle}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, fontWeight: 700, fontSize: 11, background: tx.type === "BUY" ? "rgba(22,163,74,0.10)" : "rgba(220,38,38,0.10)", color: tx.type === "BUY" ? "#16A34A" : "#DC2626" }}>
                      {tx.type === "BUY" ? "▲ BUY" : "▼ SELL"}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 800, color: "var(--gold)" }}>{tx.symbol}</td>
                  <td style={{ ...tdStyle, color: t.textMuted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>{tx.name}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{tx.quantity.toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>Rs {fmt(tx.price)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>Rs {fmt(total)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: pl === null ? t.textMuted : pctColor(pl) }}>
                    {pl === null ? "—" : `${pl >= 0 ? "+" : ""}Rs ${fmt(Math.abs(pl))}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PortfolioLive() {
  const t = useDarkTokens();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [sellHolding, setSellHolding] = useState<Holding | null>(null);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"holdings" | "history">("holdings");

  useEffect(() => {
    setHoldings(loadHoldings());
    setHistory(loadHistory());
    setMounted(true);
  }, []);

  const addHolding = useCallback((h: Omit<Holding, "id">, txType: "BUY") => {
    setHoldings(prev => {
      const existing = prev.find(x => x.symbol === h.symbol);
      let next: Holding[];
      if (existing) {
        next = prev.map(x => {
          if (x.symbol !== h.symbol) return x;
          const totalShares = x.quantity + h.quantity;
          const avgP = (x.quantity * x.avgPrice + h.quantity * h.avgPrice) / totalShares;
          return { ...x, quantity: totalShares, avgPrice: Math.round(avgP * 100) / 100 };
        });
      } else {
        next = [...prev, { ...h, id: Date.now().toString() }];
      }
      saveHoldings(next);
      return next;
    });
    const tx: Transaction = { id: Date.now().toString() + Math.random(), symbol: h.symbol, name: h.name, type: txType, quantity: h.quantity, price: h.avgPrice, date: new Date().toISOString().slice(0, 10) };
    setHistory(prev => { const next = [tx, ...prev]; saveHistory(next); return next; });
  }, []);

  const sellHoldingFn = useCallback((id: string, qty: number, price: number) => {
    setHoldings(prev => {
      const h = prev.find(x => x.id === id);
      if (!h) return prev;
      const tx: Transaction = { id: Date.now().toString() + Math.random(), symbol: h.symbol, name: h.name, type: "SELL", quantity: qty, price, date: new Date().toISOString().slice(0, 10) };
      setHistory(p => { const next = [tx, ...p]; saveHistory(next); return next; });
      let next: Holding[];
      if (qty >= h.quantity) {
        next = prev.filter(x => x.id !== id);
      } else {
        next = prev.map(x => x.id !== id ? x : { ...x, quantity: x.quantity - qty });
      }
      saveHoldings(next);
      return next;
    });
  }, []);

  const removeHolding = useCallback((id: string) => {
    setHoldings(prev => { const next = prev.filter(h => h.id !== id); saveHoldings(next); return next; });
  }, []);

  const summary = useMemo(() => {
    let marketValue = 0, costBasis = 0, todayPL = 0;
    for (const h of holdings) {
      const { price, chg } = getPrice(h.symbol);
      const mv = h.quantity * price, cb = h.quantity * h.avgPrice;
      const prevPrice = price / (1 + chg / 100);
      marketValue += mv; costBasis += cb; todayPL += h.quantity * (price - prevPrice);
    }
    const totalPL = marketValue - costBasis;
    const totalPct = costBasis > 0 ? (totalPL / costBasis) * 100 : 0;
    return { marketValue, costBasis, totalPL, totalPct, todayPL };
  }, [holdings]);

  const cardStyle: React.CSSProperties = { background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, padding: "16px 20px", flex: 1, minWidth: 140 };

  if (!mounted) return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading portfolio…</div>
  );

  return (
    <div style={{ padding: "16px 20px", fontFamily: "inherit" }} suppressHydrationWarning>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}><span style={{ color: t.text }}>My</span> <span style={{ color: "#C8860A" }}>Portfolio</span></h1>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: t.textMuted }}>Track your PSX holdings &amp; P&amp;L</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#07111F", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          + Add Stock
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        {[
          { label: "MARKET VALUE",  value: `Rs ${fmt(summary.marketValue)}`, sub: null },
          { label: "COST BASIS",    value: `Rs ${fmt(summary.costBasis)}`,   sub: null },
          { label: "TOTAL P&L",    value: `${summary.totalPL >= 0 ? "+" : ""}Rs ${fmt(Math.abs(summary.totalPL))}`, sub: `${summary.totalPct >= 0 ? "+" : ""}${fmt(summary.totalPct)}%`, color: pctColor(summary.totalPL) },
          { label: "TODAY P&L",    value: `${summary.todayPL >= 0 ? "+" : ""}Rs ${fmt(Math.abs(summary.todayPL))}`, sub: null, color: pctColor(summary.todayPL) },
        ].map(c => (
          <div key={c.label} style={cardStyle}>
            <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: "0.07em", marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: (c as any).color ?? t.text, fontVariantNumeric: "tabular-nums" }}>{c.value}</div>
            {c.sub && <div style={{ fontSize: 11, fontWeight: 600, color: (c as any).color, marginTop: 2 }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 2, marginBottom: 16, borderBottom: `2px solid ${t.border}` }}>
        {[
          { id: "holdings" as const, label: `Holdings`, count: holdings.length },
          { id: "history" as const, label: "History", count: history.length },
        ].map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            padding: "9px 20px", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
            background: "transparent", borderBottom: `2px solid ${tab === tb.id ? "#C8860A" : "transparent"}`,
            marginBottom: -2, color: tab === tb.id ? "#C8860A" : t.textMuted, transition: "all 150ms",
          }}>
            {tb.label}
            <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 12, background: tab === tb.id ? "rgba(200,134,10,0.12)" : (t.bgLight ?? "rgba(0,0,0,0.05)"), color: tab === tb.id ? "#C8860A" : t.textMuted }}>
              {tb.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Holdings Tab ── */}
      {tab === "holdings" && (
        holdings.length === 0 ? (
          <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, padding: "80px 20px", textAlign: "center", background: t.bg }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💼</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: t.text, margin: "0 0 6px" }}>No holdings yet</p>
            <p style={{ fontSize: 12, color: t.textMuted, margin: "0 0 20px" }}>Add your first PSX stock to start tracking</p>
            <button onClick={() => setShowAdd(true)} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "var(--gold)", color: "#07111F", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
              Add your first stock
            </button>
          </div>
        ) : (
          <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bg, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 780 }}>
                <thead>
                  <tr style={{ background: t.tableTh ?? t.bg }}>
                    {["Symbol", "Company", "Qty", "Avg Price", "Cur Price", "Invested", "Market Val", "P&L", "P&L%", "Today", ""].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: h === "Symbol" || h === "Company" || h === "" ? "left" : "right", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: t.textMuted, borderBottom: `2px solid ${t.border}`, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, i) => {
                    const { price, chg } = getPrice(h.symbol);
                    const invested = h.quantity * h.avgPrice, marketVal = h.quantity * price;
                    const pl = marketVal - invested, plPct = invested > 0 ? (pl / invested) * 100 : 0;
                    const prevPrice = price / (1 + chg / 100), todayPL = h.quantity * (price - prevPrice);
                    const plColor = pctColor(pl);
                    const tdStyle: React.CSSProperties = { padding: "11px 12px", fontSize: 12, color: t.text, borderBottom: i < holdings.length - 1 ? `1px solid ${t.border}` : "none", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" };
                    return (
                      <tr key={h.id} onMouseEnter={e => (e.currentTarget.style.background = t.bgLight ?? "transparent")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <td style={{ ...tdStyle, fontWeight: 800, color: "var(--gold)" }}>{h.symbol}</td>
                        <td style={{ ...tdStyle, color: t.textSec ?? t.textMuted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{h.name || h.symbol}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>{h.quantity.toLocaleString()}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>Rs {fmt(h.avgPrice)}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>Rs {fmt(price)}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>Rs {fmt(invested)}</td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>Rs {fmt(marketVal)}</td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: plColor }}>{pl >= 0 ? "+" : ""}Rs {fmt(Math.abs(pl))}</td>
                        <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: plColor }}>{plPct >= 0 ? "+" : ""}{fmt(plPct)}%</td>
                        <td style={{ ...tdStyle, textAlign: "right", color: pctColor(todayPL) }}>{todayPL >= 0 ? "+" : ""}Rs {fmt(Math.abs(todayPL))}</td>
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                            <button onClick={() => setSellHolding(h)} title="Sell shares" style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#DC2626", cursor: "pointer", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5 }}>Sell</button>
                            <button onClick={() => removeHolding(h.id)} title="Remove" style={{ background: "none", border: "none", color: t.textMuted, cursor: "pointer", fontSize: 14, opacity: 0.5, padding: "2px 6px", borderRadius: 4, lineHeight: 1 }}
                              onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}>✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "10px 12px", borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "flex-end", gap: 24, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: t.textMuted }}>{holdings.length} holding{holdings.length !== 1 ? "s" : ""}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>Invested: <span style={{ color: "var(--gold)" }}>Rs {fmt(summary.costBasis)}</span></span>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>Value: <span style={{ fontVariantNumeric: "tabular-nums" }}>Rs {fmt(summary.marketValue)}</span></span>
              <span style={{ fontSize: 12, fontWeight: 800, color: pctColor(summary.totalPL) }}>Total P&amp;L: {summary.totalPL >= 0 ? "+" : ""}Rs {fmt(Math.abs(summary.totalPL))} ({summary.totalPct >= 0 ? "+" : ""}{fmt(summary.totalPct)}%)</span>
            </div>
          </div>
        )
      )}

      {/* ── History Tab ── */}
      {tab === "history" && <HistoryTab history={history} />}

      <p style={{ fontSize: 10, color: t.textMuted, marginTop: 10, textAlign: "center" }}>
        Prices are indicative demo data · Portfolio saved locally in your browser
      </p>

      {showAdd && <AddStockModal onClose={() => setShowAdd(false)} onAdd={addHolding} />}
      {sellHolding && <SellModal holding={sellHolding} onClose={() => setSellHolding(null)} onSell={sellHoldingFn} />}
    </div>
  );
}
