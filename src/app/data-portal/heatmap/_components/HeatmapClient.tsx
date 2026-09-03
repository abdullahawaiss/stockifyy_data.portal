"use client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { filterStocks, getColor, getTextColor, STOCKS as DEMO_STOCKS } from "../_data/stocks";
import type { StockData, IndexFilter } from "../_data/stocks";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";

// ── Squarified Treemap ──────────────────────────────────────────────────────
interface TileRect { x: number; y: number; w: number; h: number; stock: StockData; }

function squarify(stocks: StockData[], W: number, H: number): TileRect[] {
  if (!stocks.length || W <= 0 || H <= 0) return [];
  const sorted = [...stocks].sort((a, b) => b.vol - a.vol);
  const totalVol = sorted.reduce((s, st) => s + st.vol, 0);
  const results: TileRect[] = [];

  function worst(row: StockData[], stripSize: number, total: number): number {
    const rowSum = row.reduce((s, st) => s + st.vol, 0);
    const rowLen = (rowSum / total) * stripSize;
    let w = 0;
    for (const st of row) {
      const h = (st.vol / rowSum) * rowLen;
      const r = h > 0 ? Math.max(rowLen / h, h / rowLen) : Infinity;
      w = Math.max(w, r);
    }
    return w;
  }

  function layoutStrip(row: StockData[], x: number, y: number, w: number, h: number, horiz: boolean, total: number) {
    const rowSum = row.reduce((s, st) => s + st.vol, 0);
    let cursor = horiz ? y : x;
    for (const st of row) {
      const frac = st.vol / rowSum;
      if (horiz) { const tH = h * frac; results.push({ x, y: cursor, w, h: tH, stock: st }); cursor += tH; }
      else       { const tW = w * frac; results.push({ x: cursor, y, w: tW, h, stock: st }); cursor += tW; }
    }
  }

  function layout(items: StockData[], x: number, y: number, w: number, h: number, total: number) {
    if (!items.length) return;
    if (items.length === 1) { results.push({ x, y, w, h, stock: items[0] }); return; }
    const horiz = w >= h;
    const stripSize = horiz ? w : h;
    let row: StockData[] = [], remaining = [...items], worstSoFar = Infinity;
    while (remaining.length) {
      const candidate = [...row, remaining[0]];
      const cw = worst(candidate, stripSize, total);
      if (!row.length || cw <= worstSoFar) { row = candidate; remaining = remaining.slice(1); worstSoFar = cw; }
      else break;
    }
    const rowSum = row.reduce((s, st) => s + st.vol, 0);
    if (horiz) {
      const rW = w * (rowSum / total);
      layoutStrip(row, x, y, rW, h, true, total);
      layout(remaining, x + rW, y, w - rW, h, total - rowSum);
    } else {
      const rH = h * (rowSum / total);
      layoutStrip(row, x, y, w, rH, false, total);
      layout(remaining, x, y + rH, w, h - rH, total - rowSum);
    }
  }

  layout(sorted, 0, 0, W, H, totalVol);
  return results;
}

// ── Tooltip ─────────────────────────────────────────────────────────────────
function Tooltip({ stock, x, y }: { stock: StockData; x: number; y: number }) {
  const sign = stock.chg >= 0 ? "+" : "";
  return (
    <div style={{
      position: "fixed", left: x + 16, top: y + 16, zIndex: 9999,
      background: "rgba(8,18,32,0.68)",
      backdropFilter: "blur(4px)",
      WebkitBackdropFilter: "blur(4px)",
      border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: 14, padding: "10px 14px", pointerEvents: "none",
      boxShadow: "0 8px 24px rgba(0,0,0,0.22)", minWidth: 160,
      transition: "left 0.18s cubic-bezier(0.25,0.46,0.45,0.94), top 0.18s cubic-bezier(0.25,0.46,0.45,0.94)",
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>{stock.sym}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{stock.name}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>Price: <strong style={{ color: "#fff" }}>Rs {stock.price.toFixed(2)}</strong></div>
      <div style={{ fontSize: 12, color: getColor(stock.chg), fontWeight: 700 }}>Change: {sign}{stock.chg.toFixed(2)}%</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Vol: {stock.vol.toLocaleString()}K</div>
      {stock.shariah && (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
          <img src="/mosque icon.png" alt="Shariah" style={{ width: 18, height: 18, objectFit: "contain", filter: "brightness(0) saturate(100%) invert(76%) sepia(55%) saturate(573%) hue-rotate(3deg) brightness(91%)" }} />
          <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 700 }}>SHARIAH COMPLIANT</span>
        </div>
      )}
    </div>
  );
}


function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Sector Modal ──────────────────────────────────────────────────────────────
function SectorModal({ g, onClose }: {
  g: { sector: string; stocks: StockData[]; vol: number; count: number };
  onClose: () => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 12, width: "min(92vw, 820px)",
          maxHeight: "82vh", overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#111111",
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>{g.sector}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{g.count} stocks</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Stock list */}
        <div style={{ overflowY: "auto", padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
            {g.stocks.map(s => {
              const sign = s.chg >= 0 ? "+" : "";
              const bg = getColor(s.chg, s.sector);
              return (
                <div key={s.sym}
                  onClick={() => window.open(`/data-portal/company/${s.sym}`, "_blank")}
                  style={{
                    background: bg, borderRadius: 8, padding: "12px 14px",
                    cursor: "pointer", border: s.shariah ? "2px solid #fbbf24" : "1px solid rgba(0,0,0,0.12)",
                    position: "relative",
                  }}
                >
                  {s.shariah && (
                    <img src="/mosque icon.png" alt="" style={{ position: "absolute", top: 6, right: 6, width: 16, height: 16, objectFit: "contain", filter: "brightness(0) saturate(100%) invert(76%) sepia(55%) saturate(573%) hue-rotate(3deg) brightness(91%)" }} />
                  )}
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{s.sym}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2, marginBottom: 6 }}>{s.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Rs {s.price.toFixed(2)}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.chg >= 0 ? "#86efac" : "#fca5a5", marginTop: 2 }}>{sign}{s.chg.toFixed(2)}%</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>Vol: {s.vol.toLocaleString()}K</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Combined View — flat squarified treemap ───────────────────────────────────

// Generic squarified treemap
function squarifyG<T>(
  items: T[], W: number, H: number, wt: (it: T) => number
): Array<{ x: number; y: number; w: number; h: number; item: T }> {
  if (!items.length || W <= 0 || H <= 0) return [];
  const valid = items.filter(it => wt(it) > 0 && isFinite(wt(it)));
  if (!valid.length) return [];
  const sorted = [...valid].sort((a, b) => wt(b) - wt(a));
  const total  = sorted.reduce((s, it) => s + wt(it), 0);
  const out: Array<{ x: number; y: number; w: number; h: number; item: T }> = [];

  function worst(row: T[], strip: number, tot: number) {
    const rs = row.reduce((s, it) => s + wt(it), 0);
    const rl = (rs / tot) * strip;
    let r = 0;
    for (const it of row) {
      const side = rl > 0 ? (wt(it) / rs) * rl : 0;
      r = Math.max(r, side > 0 ? Math.max(rl / side, side / rl) : Infinity);
    }
    return r;
  }

  function place(row: T[], x: number, y: number, w: number, h: number, hz: boolean, tot: number) {
    const rs = row.reduce((s, it) => s + wt(it), 0);
    let cur = hz ? y : x;
    for (const it of row) {
      const f = wt(it) / rs;
      if (hz) { const th = h * f; out.push({ x, y: cur, w, h: th, item: it }); cur += th; }
      else    { const tw = w * f; out.push({ x: cur, y, w: tw, h, item: it }); cur += tw; }
    }
  }

  function lay(its: T[], x: number, y: number, w: number, h: number, tot: number) {
    if (!its.length || w < 1 || h < 1) return;
    if (its.length === 1) { out.push({ x, y, w, h, item: its[0] }); return; }
    const hz = w >= h, strip = hz ? w : h;
    let row: T[] = [], rest = [...its], best = Infinity;
    while (rest.length) {
      const c = [...row, rest[0]];
      const r = worst(c, strip, tot);
      if (!row.length || r <= best) { row = c; rest = rest.slice(1); best = r; }
      else break;
    }
    if (!row.length) { row = [rest[0]]; rest = rest.slice(1); }
    const rs = row.reduce((s, it) => s + wt(it), 0);
    if (hz) { const rw = w * (rs / tot); place(row, x, y, rw, h, true, tot); lay(rest, x + rw, y, w - rw, h, tot - rs); }
    else    { const rh = h * (rs / tot); place(row, x, y, w, rh, false, tot); lay(rest, x, y + rh, w, h - rh, tot - rs); }
  }

  lay(sorted, 0, 0, W, H, total);
  return out;
}

// ── Combined View — nested sector treemap (SCS Trade style) ─────────────────
// Sectors are rectangular blocks with dark headers; stocks squarified inside.
// Sector size ∝ total sector volume. Fits viewport height. No scroll.
function CombinedView({ stocks, onHover, onLeave }: {
  stocks: StockData[];
  onHover: (s: StockData, e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(0);
  const [canvasH, setCanvasH] = useState(560);
  const [hoveredSym, setHoveredSym] = useState<string | null>(null);

  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const calc = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.floor(rect.width);
      setCanvasW(w);
      // Height = 52% of width → wide landscape like SCS Trade (~2:1 ratio)
      setCanvasH(Math.max(380, Math.min(620, Math.floor(w * 0.52))));
    };
    calc();
    const obs = new ResizeObserver(calc);
    obs.observe(el);
    window.addEventListener("resize", calc);
    return () => { obs.disconnect(); window.removeEventListener("resize", calc); };
  }, []);

  // Group stocks by sector, sorted by total volume desc
  interface SectorGroup { sector: string; stocks: StockData[]; totalVol: number; }
  const sectorGroups: SectorGroup[] = useMemo(() => {
    const map: Record<string, StockData[]> = {};
    for (const s of stocks) {
      if ((s.vol || 0) <= 0) continue;
      if (!map[s.sector]) map[s.sector] = [];
      map[s.sector].push(s);
    }
    return Object.entries(map)
      .map(([sector, ss]) => ({ sector, stocks: ss, totalVol: ss.reduce((a, b) => a + (b.vol || 0), 0) }))
      .filter(g => g.totalVol > 0)
      .sort((a, b) => b.totalVol - a.totalVol);
  }, [stocks]);

  // Squarify sectors then stocks within each sector — SCS Trade style
  const SECTOR_HEADER_H = 15; // thin strip like SCS Trade
  const GAP_OUTER = 2;        // gap between sector blocks
  const GAP_INNER = 1;        // gap between stock tiles inside a sector

  const sectorRects = useMemo(() => {
    if (!canvasW || !canvasH || !sectorGroups.length) return [];
    return squarifyG(sectorGroups, canvasW, canvasH, g => g.totalVol).map(r => ({
      group: r.item,
      x: r.x + GAP_OUTER * 0.5,
      y: r.y + GAP_OUTER * 0.5,
      w: Math.max(0, r.w - GAP_OUTER),
      h: Math.max(0, r.h - GAP_OUTER),
    }));
  }, [sectorGroups, canvasW, canvasH]);

  const allStockTiles = useMemo(() => {
    return sectorRects.flatMap(({ group, x, y, w, h }) => {
      const headerH = h >= 30 ? SECTOR_HEADER_H : 0; // skip header if block too small
      const innerH = Math.max(0, h - headerH);
      if (innerH < 4 || w < 4) return [];
      const sortedStocks = [...group.stocks].sort((a, b) => (b.vol || 0) - (a.vol || 0));
      return squarifyG(sortedStocks, w, innerH, s => Math.max(1, s.vol || 1)).map(r => ({
        stock: r.item,
        sector: group.sector,
        x: x + r.x + GAP_INNER * 0.5,
        y: y + headerH + r.y + GAP_INNER * 0.5,
        w: Math.max(0, r.w - GAP_INNER),
        h: Math.max(0, r.h - GAP_INNER),
      }));
    });
  }, [sectorRects]);

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100%", height: canvasH, minHeight: 380,
        position: "relative", background: "#111",
        boxSizing: "border-box", overflow: "hidden", flexShrink: 0,
      }}
    >
      {/* ── Sector thin header strips (like SCS Trade) ── */}
      {sectorRects.map(({ group, x, y, w, h }) => {
        if (w < 6 || h < 30) return null;
        const avgChg = group.stocks.reduce((a, b) => a + b.chg, 0) / group.stocks.length;
        const chgColor = avgChg > 0 ? "#4ade80" : avgChg < 0 ? "#f87171" : "#94a3b8";
        const sectorLabel = group.sector.toUpperCase();
        // Font size: fill available width but cap at 11px
        const labelFs = Math.min(11, Math.max(7, w / (sectorLabel.length * 0.65)));
        return (
          <div key={group.sector} style={{
            position: "absolute", left: x, top: y, width: w, height: SECTOR_HEADER_H,
            background: "#000",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0 5px", boxSizing: "border-box", overflow: "hidden",
            zIndex: 3,
          }}>
            <span style={{
              fontSize: labelFs, fontWeight: 700, color: "#fff",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              textTransform: "uppercase", letterSpacing: "0.05em",
              flexShrink: 1, minWidth: 0,
            }}>{sectorLabel}</span>
            {w > 70 && (
              <span style={{
                fontSize: Math.min(9.5, labelFs * 0.88), fontWeight: 700,
                color: chgColor, flexShrink: 0, marginLeft: 4, whiteSpace: "nowrap",
              }}>{avgChg >= 0 ? "+" : ""}{avgChg.toFixed(2)}%</span>
            )}
          </div>
        );
      })}

      {/* ── Stock tiles ── */}
      {allStockTiles.map(({ stock: s, x, y, w, h }) => {
        if (w < 2 || h < 2) return null;
        const isHov = hoveredSym === s.sym;
        const sign  = s.chg >= 0 ? "+" : "";

        // Padding scales with tile size like SCS Trade
        const padH = w < 15 ? 1 : w < 40 ? 2 : w < 80 ? 4 : 7;
        const padV = h < 15 ? 1 : h < 40 ? 2 : h < 80 ? 4 : 7;
        const avW  = Math.max(1, w - padH * 2);
        const avH  = Math.max(1, h - padV * 2);
        const MIN  = 5;

        // ── Symbol — no arbitrary cap; fills tile like SCS Trade ──
        let sym = s.sym;
        // Width-limited: each char ~0.60× font size wide
        // Height-limited: symbol takes ≤42% of available height
        let sFs = Math.min(avW / (sym.length * 0.60), avH * 0.42);
        if (sFs < MIN && sym.length > 3) {
          sym = sym.slice(0, 3);
          sFs = Math.min(avW / (sym.length * 0.60), avH * 0.42);
        }
        if (sFs < MIN) {
          sym = sym[0];
          sFs = Math.min(avW / 0.60, avH * 0.42);
        }
        const showSym = sFs >= MIN;
        const symFs   = showSym ? Math.max(MIN, sFs) : 0;

        // ── Price line ──
        const priceTxt = s.price.toFixed(2);
        const pFs = Math.min(symFs * 0.52, avW / (priceTxt.length * 0.58));
        const showP = showSym && sym === s.sym && pFs >= MIN
          && avH >= symFs + pFs * 1.35 + 2 && w >= 24;

        // ── Change line: "amt (pct%)" ──
        const chgAmt  = `${sign}${((s.price * s.chg) / 100).toFixed(2)}`;
        const chgPct  = `${sign}${s.chg.toFixed(2)}%`;
        const chgLine = `${chgAmt} (${chgPct})`;
        const cFs     = Math.min(pFs * 0.82, avW / (chgLine.length * 0.56));
        const showC   = showP && cFs >= MIN
          && avH >= symFs + pFs * 1.35 + cFs * 1.35 + 2;

        // ── Volume line ──
        const volStr = s.vol >= 1000 ? `${(s.vol / 1000).toFixed(1)} mn` : `${s.vol}K`;
        const vFs    = Math.min(cFs * 0.84, avW / (volStr.length * 0.56));
        const showV  = showC && vFs >= MIN
          && avH >= symFs + pFs * 1.35 + cFs * 1.35 + vFs * 1.4 + 3 && w >= 42;

        return (
          <div
            key={`${s.sym}-${x}-${y}`}
            onMouseEnter={e => { onHover(s, e); setHoveredSym(s.sym); }}
            onMouseMove={e => onHover(s, e)}
            onMouseLeave={() => { onLeave(); setHoveredSym(null); }}
            onClick={() => window.open(`/data-portal/company/${s.sym}`, "_blank")}
            title={`${s.sym} — ${s.name}\nRs ${priceTxt}  ${chgAmt} (${chgPct})\nVol: ${volStr}`}
            style={{
              position: "absolute", left: x, top: y, width: w, height: h,
              background: getColor(s.chg, s.sector),
              boxSizing: "border-box",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              cursor: "pointer", overflow: "hidden",
              contain: "paint" as React.CSSProperties["contain"],
              padding: `${padV}px ${padH}px`, textAlign: "center",
              outline: isHov ? "2px solid #FFD700" : "none",
              outlineOffset: -2,
              filter: isHov ? "brightness(1.15)" : "none",
              transition: "filter 0.07s",
              zIndex: isHov ? 10 : 1,
            }}
          >
            {showSym && (
              <div style={{
                fontSize: symFs, fontWeight: 800, color: "#fff", lineHeight: 1.0,
                whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%", flexShrink: 0,
                textShadow: symFs > 14 ? "0 1px 6px rgba(0,0,0,0.55)" : "none",
                letterSpacing: symFs > 22 ? "-0.02em" : "0",
              }}>{sym}</div>
            )}
            {showP && (
              <div style={{
                fontSize: pFs, fontWeight: 600, color: "#fff", lineHeight: 1.1,
                marginTop: symFs > 20 ? 4 : 2,
                whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%", flexShrink: 0,
              }}>{priceTxt}</div>
            )}
            {showC && (
              <div style={{
                fontSize: cFs, fontWeight: 600, color: "rgba(255,255,255,0.92)", lineHeight: 1.1,
                marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%", flexShrink: 0,
              }}>{chgLine}</div>
            )}
            {showV && (
              <div style={{
                fontSize: vFs, fontWeight: 500, color: "rgba(255,255,255,0.55)", lineHeight: 1.1,
                marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%", flexShrink: 0,
              }}>{volStr}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Sector card (new fixed-layout — Sector View only) ────────────────────────
function SectorCard({ sector, ss, onHover, onLeave }: {
  sector: string; ss: StockData[];
  onHover: (s: StockData, e: React.MouseEvent) => void; onLeave: () => void;
}) {
  const [modal, setModal] = useState(false);

  const totalVol = useMemo(() => ss.reduce((s, x) => s + x.vol, 0), [ss]);
  const avgChg   = useMemo(() => ss.reduce((s, x) => s + x.chg, 0) / ss.length, [ss]);
  const sign     = avgChg >= 0 ? "+" : "";
  const isGain   = avgChg > 0;
  const isNeutral = avgChg === 0;

  // Sort by chg to find worst (min) and best (max)
  const sorted = useMemo(() => [...ss].sort((a, b) => a.chg - b.chg), [ss]);
  const worst  = sorted[0];
  const best   = sorted[sorted.length - 1];
  const isSame = ss.length <= 1 || worst.sym === best.sym;

  // Remaining stocks: exclude worst + best, sort by abs(chg) desc
  const rest = useMemo(() => {
    const excluded = new Set(isSame ? [worst.sym] : [worst.sym, best.sym]);
    return [...ss]
      .filter(s => !excluded.has(s.sym))
      .sort((a, b) => Math.abs(b.chg) - Math.abs(a.chg));
  }, [ss, worst, best, isSame]);

  const g = { sector, stocks: ss, vol: totalVol, count: ss.length };

  return (
    <div style={{
      borderRadius: 11, overflow: "hidden",
      background: "var(--card-bg)",
      border: "1px solid rgba(0,0,0,0.09)",
      boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
      display: "flex", flexDirection: "column",
      height: "100%",
    }}>
      {modal && <SectorModal g={g} onClose={() => setModal(false)} />}

      {/* ── Header (fixed height) ── */}
      <div
        onClick={() => setModal(true)}
        title={sector}
        style={{
          padding: "7px 10px 6px",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
          flexShrink: 0, cursor: "pointer",
          background: "var(--card-bg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <span style={{
            fontSize: 10.5, fontWeight: 700, color: "var(--text-primary)",
            textTransform: "uppercase", letterSpacing: "0.04em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {sector}
          </span>
          <span style={{
            fontSize: 9.5, fontWeight: 700, flexShrink: 0,
            padding: "1px 7px", borderRadius: 20,
            color: isNeutral ? "#64748b" : isGain ? "#15803d" : "#b91c1c",
            background: isNeutral ? "#f1f5f9" : isGain ? "#dcfce7" : "#fee2e2",
          }}>
            {sign}{avgChg.toFixed(2)}%
          </span>
        </div>
        <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>
          {(totalVol / 1000).toFixed(1)}K vol · {ss.length} stocks
        </div>
      </div>

      {/* ── Scrollable body: highlight boxes + rest ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "0 4px 4px" }}>
        {/* Two large highlighted boxes */}
        <div style={{ display: "flex", gap: 3, padding: "4px 0 3px" }}>
          <SectorHighlightBox s={worst} label="Worst" onHover={onHover} onLeave={onLeave} />
          {!isSame && <SectorHighlightBox s={best} label="Best" onHover={onHover} onLeave={onLeave} />}
        </div>

        {/* Remaining stocks grid */}
        {rest.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 3 }}>
            {rest.map(s => (
              <SectorSmallBox key={s.sym} s={s} onHover={onHover} onLeave={onLeave} />
            ))}
          </div>
        )}

        {ss.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 60, fontSize: 11, color: "var(--text-muted)" }}>
            No stocks available
          </div>
        )}
      </div>
    </div>
  );
}

function SectorHighlightBox({ s, label, onHover, onLeave }: {
  s: StockData; label: string;
  onHover: (s: StockData, e: React.MouseEvent) => void; onLeave: () => void;
}) {
  const sign = s.chg >= 0 ? "+" : "";
  const bg   = getColor(s.chg, s.sector);
  return (
    <div
      onMouseEnter={e => onHover(s, e)} onMouseMove={e => onHover(s, e)}
      onMouseLeave={onLeave}
      onClick={() => window.open(`/data-portal/company/${s.sym}`, "_blank")}
      title={`${s.sym} — ${s.name}\n${sign}${s.chg.toFixed(2)}% | Rs ${s.price.toFixed(2)}`}
      style={{
        /* OLD HIGHLIGHT BOX HEIGHT — restore to 62 if requested */
        /* NEW HEIGHT proportional to card reduction */
        flex: 1, height: 55, background: bg, borderRadius: 7,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer", overflow: "hidden", padding: "4px 6px", textAlign: "center",
        position: "relative",
        transition: "filter 0.1s",
      }}
      onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.filter = "brightness(1.1)"; }}
      onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.filter = "none"; }}
    >
      {s.shariah && (
        <img src="/mosque icon.png" alt="" style={{ position: "absolute", top: 3, right: 3, width: 11, height: 11, objectFit: "contain", opacity: 0.9, filter: "brightness(0) saturate(100%) invert(76%) sepia(55%) saturate(573%) hue-rotate(3deg) brightness(91%)" }} />
      )}
      <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
        {s.sym}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.93)", lineHeight: 1.2, marginTop: 2 }}>
        {sign}{s.chg.toFixed(2)}%
      </div>
      <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.2, marginTop: 1 }}>
        Rs {s.price.toFixed(2)}
      </div>
    </div>
  );
}

function SectorSmallBox({ s, onHover, onLeave }: {
  s: StockData;
  onHover: (s: StockData, e: React.MouseEvent) => void; onLeave: () => void;
}) {
  const sign = s.chg >= 0 ? "+" : "";
  const bg   = getColor(s.chg, s.sector);
  return (
    <div
      onMouseEnter={e => onHover(s, e)} onMouseMove={e => onHover(s, e)}
      onMouseLeave={onLeave}
      onClick={() => window.open(`/data-portal/company/${s.sym}`, "_blank")}
      title={`${s.sym} — ${s.name}\n${sign}${s.chg.toFixed(2)}% | Rs ${s.price.toFixed(2)}`}
      style={{
        height: 38, background: bg, borderRadius: 5,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        cursor: "pointer", overflow: "hidden", padding: "2px 3px", textAlign: "center",
        position: "relative",
        transition: "filter 0.1s",
      }}
      onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.filter = "brightness(1.1)"; }}
      onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.filter = "none"; }}
    >
      <div style={{ fontSize: 9.5, fontWeight: 800, color: "#fff", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
        {s.sym}
      </div>
      <div style={{ fontSize: 8.5, fontWeight: 700, color: "rgba(255,255,255,0.9)", lineHeight: 1.1, marginTop: 1 }}>
        {sign}{s.chg.toFixed(2)}%
      </div>
    </div>
  );
}

// ── Sector view ───────────────────────────────────────────────────────────────
function SectorView({ stocks, onHover, onLeave }: {
  stocks: StockData[];
  onHover: (s: StockData, e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const grouped = useMemo(() => {
    const map: Record<string, StockData[]> = {};
    for (const s of stocks) { if (!map[s.sector]) map[s.sector] = []; map[s.sector].push(s); }
    return Object.entries(map).sort((a, b) =>
      b[1].reduce((s, x) => s + x.vol, 0) - a[1].reduce((s, x) => s + x.vol, 0)
    );
  }, [stocks]);

  return (
    <>
      <style>{`
        .sv-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          /* OLD SECTOR CARD SIZE — restore to 210px if requested */
          /* NEW RECTANGULAR SECTOR CARD SIZE — ~12% shorter */
          grid-auto-rows: 185px;
          gap: 10px;
          padding: 4px 0 14px;
        }
        @media (max-width: 900px) {
          .sv-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 500px) {
          .sv-grid { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        }
        .sv-grid > * { min-height: 0; }
      `}</style>
      <div className="sv-grid">
        {grouped.map(([sector, ss]) => (
          <SectorCard key={sector} sector={sector} ss={ss} onHover={onHover} onLeave={onLeave} />
        ))}
      </div>
    </>
  );
}

// ── Color legend ─────────────────────────────────────────────────────────────
const LEGEND = [
  { label: ">+5%", color: "#15803d" }, { label: "+2.5%", color: "#16a34a" },
  { label: "+1%",  color: "#22c55e" }, { label: "0%",    color: "#4ade80" },
  { label: "-1%",  color: "#f87171" }, { label: "-2.5%", color: "#ef4444" },
  { label: "-5%",  color: "#dc2626" }, { label: "<-5%",  color: "#991b1b" },
];

const INDEX_TABS: { key: IndexFilter; label: string }[] = [
  { key: "all",    label: "KSE All"  },
  { key: "kse100", label: "KSE 100" },
  { key: "kse30",  label: "KSE 30"  },
  { key: "kmiAll", label: "KMI All" },
  { key: "kmi30",  label: "KMI 30"  },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function HeatmapClient() {
  const [idx,     setIdx]     = useState<IndexFilter>("all");
  const [view,    setView]    = useState<"sector" | "combined">("sector");
  const [tooltip, setTooltip] = useState<{ stock: StockData; x: number; y: number } | null>(null);

  // Live data via SSE with polling fallback
  const { quotes, connected, lastTs } = useLiveQuotes();

  const allStocks = useMemo<StockData[]>(() => {
    if (!quotes.length) return DEMO_STOCKS;
    return quotes.map(q => ({
      sym: q.sym, name: q.name, sector: q.sector,
      price: q.price, chg: q.chg, vol: q.vol, cap: q.cap,
      shariah: q.shariah, kse100: q.kse100, kse30: q.kse30,
      kmi30: q.kmi30, kmiAll: q.kmi30,
    }));
  }, [quotes]);

  const lastRef = lastTs ? new Date(lastTs) : null;

  const filtered = useMemo(() => filterStocks(allStocks, idx), [allStocks, idx]);

  const onHover  = useCallback((s: StockData, e: React.MouseEvent) => setTooltip({ stock: s, x: e.clientX, y: e.clientY }), []);
  const onLeave  = useCallback(() => setTooltip(null), []);

  const gainers      = filtered.filter(s => s.chg > 0).length;
  const losers       = filtered.filter(s => s.chg < 0).length;
  const shariahCount = filtered.filter(s => s.shariah).length;

  const timeStr = lastRef
    ? lastRef.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "—";

  return (
    <div className="hm-page" style={{ display: "flex", flexDirection: "column", padding: "10px 16px 0" }}>

      {/* ── Top bar — compact single row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>

        {/* Title */}
        <div style={{ marginRight: 4 }}>
          <h1 className="hm-title" style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
            <span style={{ color: "var(--navy, #0f172a)" }}>Market</span> <span style={{ color: "#C8860A" }}>Heatmap</span>
          </h1>
          <p className="hm-subtitle" style={{ margin: 0, fontSize: 10.5 }}>PSX · Volume-weighted · Auto-refresh 5 min</p>
        </div>

        {/* View toggle — Combined first, then Sector */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["combined", "sector"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "5px 14px", fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: "pointer",
              border: "1px solid var(--border-dark)", transition: "all 0.15s",
              background: view === v ? "#D4971A" : "var(--card-bg)",
              color: view === v ? "#07111F" : "var(--text-primary)",
            }}>
              {v === "combined" ? "Combined View" : "Sector View"}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 22, background: "var(--border-dark)", opacity: 0.5 }} />

        {/* Index tabs */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {INDEX_TABS.map(tab => (
            <button key={tab.key} onClick={() => setIdx(tab.key)} style={{
              padding: "5px 12px", fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: "pointer",
              border: "1px solid var(--border-dark)", transition: "all 0.15s",
              background: idx === tab.key ? "#D4971A" : "var(--card-bg)",
              color: idx === tab.key ? "#07111F" : "var(--text-primary)",
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 22, background: "var(--border-dark)", opacity: 0.5 }} />

        {/* Legend inline */}
        {LEGEND.map(l => (
          <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span style={{ width: 11, height: 11, background: l.color, borderRadius: 2, display: "inline-block", flexShrink: 0 }} />
            <span className="hm-subtitle" style={{ fontSize: 9.5 }}>{l.label}</span>
          </span>
        ))}

        {/* Stats + time — right side */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#16a34a" }}>▲ {gainers}</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#dc2626" }}>▼ {losers}</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#d97706", display: "flex", alignItems: "center", gap: 3 }}><img src="/mosque icon.png" alt="Shariah" style={{ width: 18, height: 18, objectFit: "contain", filter: "brightness(0) saturate(100%) invert(76%) sepia(55%) saturate(573%) hue-rotate(3deg) brightness(91%)" }} />{shariahCount}</span>
          <span className="hm-subtitle" style={{ fontSize: 11, fontWeight: 600 }}>{filtered.length} stocks</span>
          {connected && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", background: "#14532d", color: "#4ade80", borderRadius: 5, whiteSpace: "nowrap" }}>● LIVE</span>
          )}
          <span style={{
            fontSize: 10.5, fontWeight: 600, padding: "3px 9px",
            background: "var(--card-bg)", border: "1px solid var(--border)",
            borderRadius: 6, color: "var(--text-muted)", whiteSpace: "nowrap",
          }}>🕐 {timeStr}</span>
        </div>
      </div>

      {/* ── Heatmap ── */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {view === "sector"
          ? <SectorView   stocks={filtered} onHover={onHover} onLeave={onLeave} />
          : <CombinedView stocks={filtered} onHover={onHover} onLeave={onLeave} />
        }
      </div>

      {tooltip && <Tooltip stock={tooltip.stock} x={tooltip.x} y={tooltip.y} />}
    </div>
  );
}
