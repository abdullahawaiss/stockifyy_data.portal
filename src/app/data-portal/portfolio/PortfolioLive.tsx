"use client";
// Portfolio — personal holdings tracker (localStorage-based)
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

interface PriceInfo {
  price: number;
  chg: number;
}

// ── Demo prices (from heatmap DEMO_STOCKS subset) ──────────────────────────────
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
function loadHoldings(): Holding[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveHoldings(h: Holding[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(h)); } catch {}
}

// ── Add Stock Modal ────────────────────────────────────────────────────────────
function AddStockModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (h: Omit<Holding, "id">) => void;
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
      // Search companies API for all 900+ stocks
      // Show static fallback immediately
      const staticSuggestions = searchPsxStocks(upper, 12).map(s => s.symbol);
      setSymSuggestions(staticSuggestions.length > 0 ? staticSuggestions : POPULAR_SYMBOLS.filter(s => s.startsWith(upper)).slice(0, 6));
      // Then try live API
      fetch(`/api/portal/companies?search=${encodeURIComponent(upper)}&limit=50`)
        .then(r => r.json())
        .then(j => {
          const syms = (j.data ?? []).map((c: { symbol: string }) => c.symbol);
          if (syms.length > 0) setSymSuggestions(syms);
        })
        .catch(() => {});
    } else {
      setSymSuggestions([]);
    }
    // Auto-fill price if known
    if (DEMO_PRICES[upper]) {
      setAvgPrice(DEMO_PRICES[upper].price.toString());
    }
  };

  const selectSymbol = (sym: string) => {
    setSymbol(sym);
    setSymSuggestions([]);
    if (DEMO_PRICES[sym]) {
      setAvgPrice(DEMO_PRICES[sym].price.toString());
    }
  };

  const handleSubmit = () => {
    const q = parseFloat(qty);
    const p = parseFloat(avgPrice);
    if (!symbol.trim() || isNaN(q) || q <= 0 || isNaN(p) || p <= 0) return;
    onAdd({
      symbol: symbol.trim().toUpperCase(),
      name: name.trim() || symbol.trim().toUpperCase(),
      quantity: q,
      avgPrice: p,
      addedDate: new Date().toISOString().slice(0, 10),
    });
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", borderRadius: 6,
    border: `1px solid ${t.border}`, background: t.inputBg ?? t.bg,
    color: t.text, fontSize: 13, outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: t.textMuted, textTransform: "uppercase",
    letterSpacing: "0.07em", display: "block", marginBottom: 5,
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: t.bg, borderRadius: 12, width: 360, maxWidth: "calc(100vw - 32px)",
        padding: "22px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        border: `1px solid ${t.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: t.text }}>Add Stock to Portfolio</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: t.textMuted, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Symbol */}
        <div style={{ marginBottom: 14, position: "relative" }}>
          <label style={labelStyle}>Stock Symbol</label>
          <input
            value={symbol} onChange={e => handleSymbolChange(e.target.value)}
            placeholder="e.g. OGDC, HBL, LUCK" style={inputStyle}
            autoFocus
          />
          {symSuggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
              background: t.bg, border: `1px solid ${t.border}`, borderRadius: 6,
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)", overflow: "hidden",
            }}>
              {symSuggestions.map(s => (
                <button key={s} onClick={() => selectSymbol(s)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "8px 12px", background: "none", border: "none",
                  borderBottom: `1px solid ${t.border}`, cursor: "pointer",
                  fontSize: 12, fontWeight: 700, color: t.text,
                }}>
                  {s} <span style={{ fontWeight: 400, color: t.textMuted, fontSize: 11 }}>
                    — Rs {fmt(getPrice(s).price)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Company Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Company Name (optional)</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Oil & Gas Dev. Co." style={inputStyle} />
        </div>

        {/* Quantity */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Quantity (Shares)</label>
          <input value={qty} onChange={e => setQty(e.target.value)}
            placeholder="e.g. 500" type="number" min="1" style={inputStyle} />
        </div>

        {/* Avg Buy Price */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Average Buy Price (Rs)</label>
          <input value={avgPrice} onChange={e => setAvgPrice(e.target.value)}
            placeholder="e.g. 175.50" type="number" min="0" step="0.01" style={inputStyle} />
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "9px", borderRadius: 7, border: `1px solid ${t.border}`,
            background: "transparent", color: t.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={handleSubmit} style={{
            flex: 2, padding: "9px", borderRadius: 7, border: "none",
            background: "var(--gold)", color: "#07111F", fontSize: 13, fontWeight: 800, cursor: "pointer",
          }}>+ Add to Portfolio</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PortfolioLive() {
  const t = useDarkTokens();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHoldings(loadHoldings());
    setMounted(true);
  }, []);

  const addHolding = useCallback((h: Omit<Holding, "id">) => {
    setHoldings(prev => {
      // If same symbol already exists, merge (add quantity, recalculate avg)
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
  }, []);

  const removeHolding = useCallback((id: string) => {
    setHoldings(prev => {
      const next = prev.filter(h => h.id !== id);
      saveHoldings(next);
      return next;
    });
  }, []);

  const summary = useMemo(() => {
    let marketValue = 0, costBasis = 0, todayPL = 0;
    for (const h of holdings) {
      const { price, chg } = getPrice(h.symbol);
      const mv  = h.quantity * price;
      const cb  = h.quantity * h.avgPrice;
      const prevPrice = price / (1 + chg / 100);
      marketValue += mv;
      costBasis   += cb;
      todayPL     += h.quantity * (price - prevPrice);
    }
    const totalPL = marketValue - costBasis;
    const totalPct = costBasis > 0 ? (totalPL / costBasis) * 100 : 0;
    return { marketValue, costBasis, totalPL, totalPct, todayPL };
  }, [holdings]);

  const cardStyle: React.CSSProperties = {
    background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10,
    padding: "16px 20px", flex: 1, minWidth: 140,
  };


  if (!mounted) return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
      Loading portfolio…
    </div>
  );

  return (
    <div style={{ padding: "16px 20px", fontFamily: "inherit" }} suppressHydrationWarning>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}><span style={{ color: t.text }}>My</span> <span style={{ color: "#C8860A" }}>Portfolio</span></h1>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: t.textMuted }}>Track your PSX holdings & P&L</p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{
          padding: "9px 18px", borderRadius: 8, border: "none",
          background: "var(--gold)", color: "#07111F",
          fontSize: 13, fontWeight: 800, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          + Add Stock
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        {[
          { label: "MARKET VALUE",  value: `Rs ${fmt(summary.marketValue)}`, sub: null },
          { label: "COST BASIS",    value: `Rs ${fmt(summary.costBasis)}`,   sub: null },
          {
            label: "TOTAL P&L",
            value: `${summary.totalPL >= 0 ? "+" : ""}Rs ${fmt(Math.abs(summary.totalPL))}`,
            sub: `${summary.totalPct >= 0 ? "+" : ""}${fmt(summary.totalPct)}%`,
            color: pctColor(summary.totalPL),
          },
          {
            label: "TODAY P&L",
            value: `${summary.todayPL >= 0 ? "+" : ""}Rs ${fmt(Math.abs(summary.todayPL))}`,
            sub: null,
            color: pctColor(summary.todayPL),
          },
        ].map(c => (
          <div key={c.label} style={cardStyle}>
            <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, letterSpacing: "0.07em", marginBottom: 6 }}>
              {c.label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c.color ?? t.text, fontVariantNumeric: "tabular-nums" }}>
              {c.value}
            </div>
            {c.sub && (
              <div style={{ fontSize: 11, fontWeight: 600, color: c.color, marginTop: 2 }}>{c.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* ── Holdings Table or Empty State ── */}
      {holdings.length === 0 ? (
        <div style={{
          border: `1px solid ${t.border}`, borderRadius: 12,
          padding: "80px 20px", textAlign: "center",
          background: t.bg,
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💼</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: t.text, margin: "0 0 6px" }}>No holdings yet</p>
          <p style={{ fontSize: 12, color: t.textMuted, margin: "0 0 20px" }}>Add your first PSX stock to start tracking</p>
          <button onClick={() => setShowAdd(true)} style={{
            padding: "10px 24px", borderRadius: 8, border: "none",
            background: "var(--gold)", color: "#07111F",
            fontSize: 13, fontWeight: 800, cursor: "pointer",
          }}>
            Add your first stock
          </button>
        </div>
      ) : (
        <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bg, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720 }}>
              <thead>
                <tr style={{ background: t.tableTh ?? t.bg }}>
                  {["Symbol", "Company", "Qty", "Avg Price", "Cur Price", "Invested", "Market Val", "P&L", "P&L%", "Today", ""].map(h => (
                    <th key={h} style={{
                      padding: "10px 12px", textAlign: h === "Symbol" || h === "Company" || h === "" ? "left" : "right",
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                      color: t.textMuted, borderBottom: `2px solid ${t.border}`, whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => {
                  const { price, chg } = getPrice(h.symbol);
                  const invested   = h.quantity * h.avgPrice;
                  const marketVal  = h.quantity * price;
                  const pl         = marketVal - invested;
                  const plPct      = invested > 0 ? (pl / invested) * 100 : 0;
                  const prevPrice  = price / (1 + chg / 100);
                  const todayPL    = h.quantity * (price - prevPrice);
                  const plColor    = pctColor(pl);
                  const tdStyle: React.CSSProperties = {
                    padding: "11px 12px", fontSize: 12, color: t.text,
                    borderBottom: i < holdings.length - 1 ? `1px solid ${t.border}` : "none",
                    whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums",
                  };
                  return (
                    <tr key={h.id} style={{ transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = t.bgLight ?? "transparent")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ ...tdStyle, fontWeight: 800, color: "var(--gold)" }}>{h.symbol}</td>
                      <td style={{ ...tdStyle, color: t.textSec ?? t.textMuted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {h.name || h.symbol}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>{h.quantity.toLocaleString()}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>Rs {fmt(h.avgPrice)}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>Rs {fmt(price)}</td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>Rs {fmt(invested)}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>Rs {fmt(marketVal)}</td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: plColor }}>
                        {pl >= 0 ? "+" : ""}Rs {fmt(Math.abs(pl))}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: plColor }}>
                        {plPct >= 0 ? "+" : ""}{fmt(plPct)}%
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right", color: pctColor(todayPL) }}>
                        {todayPL >= 0 ? "+" : ""}Rs {fmt(Math.abs(todayPL))}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <button onClick={() => removeHolding(h.id)} style={{
                          background: "none", border: "none", color: "#DC2626",
                          cursor: "pointer", fontSize: 14, opacity: 0.6, padding: "2px 6px",
                          borderRadius: 4, transition: "opacity 0.1s",
                        }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={e => (e.currentTarget.style.opacity = "0.6")}
                        >✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer with totals */}
          <div style={{
            padding: "10px 12px", borderTop: `1px solid ${t.border}`,
            display: "flex", justifyContent: "flex-end", gap: 24, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 11, color: t.textMuted }}>
              {holdings.length} holding{holdings.length !== 1 ? "s" : ""}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>
              Invested: <span style={{ color: "var(--gold)" }}>Rs {fmt(summary.costBasis)}</span>
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.text }}>
              Value: <span style={{ fontVariantNumeric: "tabular-nums" }}>Rs {fmt(summary.marketValue)}</span>
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: pctColor(summary.totalPL) }}>
              Total P&L: {summary.totalPL >= 0 ? "+" : ""}Rs {fmt(Math.abs(summary.totalPL))} ({summary.totalPct >= 0 ? "+" : ""}{fmt(summary.totalPct)}%)
            </span>
          </div>
        </div>
      )}

      {/* ── Note ── */}
      <p style={{ fontSize: 10, color: t.textMuted, marginTop: 10, textAlign: "center" }}>
        Prices are indicative demo data · Portfolio saved locally in your browser
      </p>

      {showAdd && <AddStockModal onClose={() => setShowAdd(false)} onAdd={addHolding} />}
    </div>
  );
}
