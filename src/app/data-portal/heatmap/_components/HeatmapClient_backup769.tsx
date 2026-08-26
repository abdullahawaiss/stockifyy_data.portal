"use client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { filterStocks, getColor, getTextColor } from "../_data/stocks";
import type { StockData, IndexFilter } from "../_data/stocks";

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
      background: "#07111F", border: "1px solid rgba(212,175,55,0.35)",
      borderRadius: 10, padding: "10px 14px", pointerEvents: "none",
      boxShadow: "0 8px 32px rgba(0,0,0,0.6)", minWidth: 160,
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

// ── Stock tile ───────────────────────────────────────────────────────────────
function StockTile({ stock, w, h, onHover, onLeave }: {
  stock: StockData; w: number; h: number;
  onHover: (s: StockData, e: React.MouseEvent) => void; onLeave: () => void;
}) {
  const bg = getColor(stock.chg);
  const tc = getTextColor(stock.chg);
  const sign = stock.chg >= 0 ? "+" : "";
  const showSym = w > 38 && h > 22;
  const showChg = h > 18;
  const fs = Math.min(12, Math.max(7, w / 5.5));

  return (
    <div
      onMouseEnter={e => onHover(stock, e)}
      onMouseLeave={onLeave}
      style={{
        width: w, height: h, background: bg,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        overflow: "hidden", cursor: "pointer",
        border: "1px solid rgba(0,0,0,0.15)",
        position: "relative", flexShrink: 0,
        transition: "filter 0.1s",
      }}
      onMouseOver={e => { (e.currentTarget as HTMLDivElement).style.filter = "brightness(1.12)"; }}
      onMouseOut={e => { (e.currentTarget as HTMLDivElement).style.filter = "none"; }}
    >
      {stock.shariah && (
        <img src="/mosque icon.png" alt="Shariah" style={{ position: "absolute", top: 2, right: 2, width: 16, height: 16, objectFit: "contain", opacity: 0.95, filter: "brightness(0) saturate(100%) invert(76%) sepia(55%) saturate(573%) hue-rotate(3deg) brightness(91%)" }} />
      )}
      {showSym && (
        <span style={{ fontSize: fs, fontWeight: 700, color: tc, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90%", textAlign: "center" }}>
          {stock.sym}
        </span>
      )}
      {showChg && (
        <span style={{ fontSize: Math.max(7, fs - 2), color: tc, opacity: 0.85, fontWeight: 600 }}>
          {sign}{stock.chg.toFixed(2)}%
        </span>
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

// ── Combined view — 5-per-row grid, every box readable ───────────────────────
const HDR_H = 26;
const SECTOR_ROW_H = 300; // fixed height per sector tile

function CombinedSector({ g, hoveredSector, setHoveredSector, onHover, onLeave }: {
  g: { sector: string; stocks: StockData[]; vol: number; count: number };
  hoveredSector: string | null;
  setHoveredSector: (s: string | null) => void;
  onHover: (s: StockData, e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [bodySize, setBodySize] = useState({ w: 0, h: 0 });
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const el = bodyRef.current; if (!el) return;
    const obs = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setBodySize({ w: Math.floor(width), h: Math.floor(height) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const scaledStocks = useMemo(() => {
    const n = g.stocks.length;
    const rawVols = g.stocks.map(s => Math.max(1, Math.sqrt(s.vol) * 100));
    const totalRaw = rawVols.reduce((a, b) => a + b, 0);
    // Each stock gets at least 50% of equal share — prevents tiny unreadable tiles
    const minVol = (totalRaw / n) * 0.7;
    return g.stocks.map((s, i) => ({ ...s, vol: Math.max(rawVols[i], minVol) }));
  }, [g.stocks]);

  const tiles = useMemo(() =>
    bodySize.w > 0 && bodySize.h > 0
      ? squarify(scaledStocks, bodySize.w, bodySize.h)
      : []
  , [scaledStocks, bodySize]);

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      border: "1.5px solid #d0d4da", overflow: "hidden",
      minWidth: 100, height: SECTOR_ROW_H + HDR_H,
    }}>
      {/* Sector header — click = open modal with all stocks */}
      {modalOpen && <SectorModal g={g} onClose={() => setModalOpen(false)} />}
      <div
        title={g.sector}
        onClick={() => setModalOpen(true)}
        style={{
          height: HDR_H, background: "#f0f2f5", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 7px", gap: 5,
          borderBottom: "1px solid #d0d4da",
          cursor: "pointer",
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: "#1a2332", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>
          {g.sector}
        </span>
        <span style={{ fontSize: 9, color: "#64748b", flexShrink: 0 }}>{g.count}</span>
      </div>

      {/* Stock squarify body */}
      <div ref={bodyRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {tiles.map((t, i) => {
          const orig = g.stocks.find(x => x.sym === t.stock.sym) ?? t.stock;
          const w = t.w, h = t.h;
          const symFs  = Math.max(9, Math.min(22, Math.min(h / 2.4, w / (orig.sym.length * 0.58))));
          const chgFs  = Math.max(8, symFs * 0.75);
          const prcFs  = Math.max(7, symFs * 0.65);
          const showChg = h > symFs * 2.0;
          const showPrc = h > symFs * 3.2 && w > 44;
          const sign = orig.chg >= 0 ? "+" : "";
          const sectorActive = hoveredSector === orig.sector;
          // Smart label: fit as many chars as possible, add … if cut
          const charsPerPx = 0.58 / symFs;
          const maxChars = Math.max(1, Math.floor(w * charsPerPx));
          const dispSym = orig.sym.length <= maxChars ? orig.sym : orig.sym.slice(0, maxChars);
          const truncated = dispSym !== orig.sym;
          return (
            <div key={orig.sym + i}
              onMouseEnter={e => { onHover(orig, e); setHoveredSector(orig.sector); }}
              onMouseLeave={() => { onLeave(); setHoveredSector(null); }}
              onClick={() => window.open(`/data-portal/company/${orig.sym}`, "_blank")}
              title={`${orig.sym} — ${orig.name}\n${sign}${orig.chg.toFixed(2)}% | Rs ${orig.price.toFixed(2)}`}
              style={{
                position: "absolute", left: t.x, top: t.y, width: w, height: h,
                background: getColor(orig.chg, orig.sector), boxSizing: "border-box",
                border: sectorActive ? "2px solid #D4971A" : orig.shariah ? "1.5px solid #fbbf24" : "0.5px solid rgba(0,0,0,0.22)",
                boxShadow: sectorActive ? "inset 0 0 0 1px rgba(212,175,55,0.5)" : "none",
                filter: sectorActive ? "brightness(1.15)" : "none",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                cursor: "pointer", overflow: "hidden", padding: 2, textAlign: "center",
                transition: "filter 0.1s, border 0.1s",
              }}
            >
              {orig.shariah && w > 22 && h > 18 && (
                <img src="/mosque icon.png" alt="" style={{ position: "absolute", top: 2, right: 2, width: 14, height: 14, objectFit: "contain", opacity: 0.9, filter: "brightness(0) saturate(100%) invert(76%) sepia(55%) saturate(573%) hue-rotate(3deg) brightness(91%)" }} />
              )}
              <div style={{ fontSize: symFs, fontWeight: 800, color: "#fff", lineHeight: 1.1, whiteSpace: "nowrap", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
                {dispSym}{truncated ? "…" : ""}
              </div>
              {showChg && (
                <div style={{ fontSize: chgFs, fontWeight: 700, color: "rgba(255,255,255,0.92)", lineHeight: 1.1, marginTop: 1 }}>
                  {sign}{orig.chg.toFixed(2)}%
                </div>
              )}
              {showPrc && (
                <div style={{ fontSize: prcFs, color: "rgba(255,255,255,0.72)", lineHeight: 1.1, marginTop: 1 }}>
                  Rs {orig.price.toFixed(2)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CombinedView({ stocks, onHover, onLeave }: {
  stocks: StockData[];
  onHover: (s: StockData, e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  const sectors = useMemo(() => {
    const map: Record<string, StockData[]> = {};
    for (const s of stocks) { if (!map[s.sector]) map[s.sector] = []; map[s.sector].push(s); }
    return Object.entries(map)
      .map(([sector, ss]) => ({
        sector,
        stocks: [...ss].sort((a, b) => b.vol - a.vol),
        vol: ss.reduce((sum, s) => sum + s.vol, 0),
        count: ss.length,
      }))
      .sort((a, b) => b.vol - a.vol);
  }, [stocks]);

  return (
    <div style={{ width: "100%", borderRadius: 8, border: "1px solid #d0d4da", background: "#fff", overflow: "hidden" }}>
      {/* Row 1: 4 sectors | Row 2+: 5 sectors each */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: 3, background: "#e8eaed" }}>
        {(() => {
          // Smart row grouping: max ~28 stocks per row, solo if sector > 18 stocks
          const rows: typeof sectors[] = [];
          let cur: typeof sectors = [];
          let curCount = 0;
          for (const g of sectors) {
            const solo = g.count > 18;
            if (solo) {
              if (cur.length) { rows.push(cur); cur = []; curCount = 0; }
              rows.push([g]);
            } else if (curCount + g.count > 28 || cur.length >= 3) {
              if (cur.length) rows.push(cur);
              cur = [g]; curCount = g.count;
            } else {
              cur.push(g); curCount += g.count;
            }
          }
          if (cur.length) rows.push(cur);
          return rows;
        })().map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 3 }}>
            {row.map(g => (
              <div key={g.sector} style={{ flex: `${g.count} 1 0`, minWidth: 0 }}>
                <CombinedSector
                  g={g}
                  hoveredSector={hoveredSector}
                  setHoveredSector={setHoveredSector}
                  onHover={onHover}
                  onLeave={onLeave}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sector card with squarify fill ───────────────────────────────────────────
function SectorCard({ sector, ss, onHover, onLeave }: {
  sector: string; ss: StockData[];
  onHover: (s: StockData, e: React.MouseEvent) => void; onLeave: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [bodySize, setBodySize] = useState({ w: 0, h: 0 });
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const el = bodyRef.current; if (!el) return;
    const obs = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setBodySize({ w: Math.floor(width), h: Math.floor(height) });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const avgChg   = ss.reduce((s, x) => s + x.chg, 0) / ss.length;
  const sign     = avgChg >= 0 ? "+" : "";
  const shariahN = ss.filter(x => x.shariah).length;
  const isGain   = avgChg >= 0;

  // sqrt-scale + minimum area so every tile shows its symbol
  const scaledStocks = useMemo(() => {
    const n = ss.length;
    const rawVols = ss.map(s => Math.max(1, Math.sqrt(s.vol) * 100));
    const totalRaw = rawVols.reduce((a, b) => a + b, 0);
    const minVol = (totalRaw / n) * 0.7;
    return [...ss].map((s, i) => ({ ...s, vol: Math.max(rawVols[i], minVol) }));
  }, [ss]);

  const tiles = useMemo(() =>
    bodySize.w > 0 && bodySize.h > 0
      ? squarify(scaledStocks, bodySize.w, bodySize.h)
      : []
  , [scaledStocks, bodySize.w, bodySize.h]);

  return (
    <div style={{
      border: "1.5px solid #c2c7d0", borderRadius: 10,
      overflow: "hidden", background: "var(--card-bg)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      {modalOpen && (
        <SectorModal
          g={{ sector, stocks: ss, vol: ss.reduce((s,x)=>s+x.vol,0), count: ss.length }}
          onClose={() => setModalOpen(false)}
        />
      )}
      <div
        onClick={() => setModalOpen(true)}
        title={sector}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "7px 10px", borderBottom: "1px solid rgba(200,206,216,0.5)",
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          flexShrink: 0, gap: 3, cursor: "pointer", textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1a2332", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {sector}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, flexShrink: 0,
            color: isGain ? "#15803d" : "#b91c1c",
            background: isGain ? "#dcfce7" : "#fee2e2",
            padding: "1px 6px", borderRadius: 20,
          }}>{sign}{avgChg.toFixed(2)}%</span>
        </div>
        <div style={{ fontSize: 9.5, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
          <span>{ss.length} stocks</span>
          {shariahN > 0 && <span style={{ color: "#d97706", display: "inline-flex", alignItems: "center", gap: 2 }}>· <img src="/mosque icon.png" alt="" style={{ width: 12, height: 12, objectFit: "contain", filter: "brightness(0) saturate(100%) invert(76%) sepia(55%) saturate(573%) hue-rotate(3deg) brightness(91%)" }} />{shariahN}</span>}
        </div>
      </div>

      {/* Squarify body */}
      <div ref={bodyRef} style={{ flex: 1, position: "relative", minHeight: 120, overflow: "hidden" }}>
        {tiles.map((t, i) => {
          const orig = ss.find(x => x.sym === t.stock.sym) ?? t.stock;
          const w = t.w || 0, h = t.h || 0;
          if (!w || !h) return null;
          const fs = Math.max(9, Math.min(20, Math.min(w / 3.8, h / 2.4)));
          const symFs = Math.max(8, Math.min(fs, w / (orig.sym.length * 0.62)));
          const showChg  = w > 32 && h > 26;
          const showPrice = w > 44 && h > 40;
          const sign2 = orig.chg >= 0 ? "+" : "";
          const charsPerPx2 = 0.62 / symFs;
          const maxChars2 = Math.max(1, Math.floor(w * charsPerPx2));
          const dispSym2 = orig.sym.length <= maxChars2 ? orig.sym : orig.sym.slice(0, maxChars2);
          const truncated2 = dispSym2 !== orig.sym;
          return (
            <div key={orig.sym + i}
              onMouseEnter={e => onHover(orig, e)} onMouseLeave={onLeave}
              onClick={() => window.open(`/data-portal/stocks/${orig.sym}`, "_blank")}
              title={`${orig.sym} — ${orig.name}\n${sign2}${orig.chg.toFixed(2)}% | Rs ${orig.price.toFixed(2)}`}
              style={{
                position: "absolute", left: t.x, top: t.y, width: w, height: h,
                background: getColor(orig.chg, orig.sector), boxSizing: "border-box",
                border: orig.shariah ? "2px solid #fbbf24" : "1px solid rgba(0,0,0,0.15)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                cursor: "pointer", overflow: "hidden", padding: 2, textAlign: "center",
              }}>
              <div style={{ fontSize: symFs, fontWeight: 800, color: "#fff", lineHeight: 1.1, whiteSpace: "nowrap", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
                {dispSym2}{truncated2 ? "…" : ""}{orig.shariah ? <img src="/mosque icon.png" alt="" style={{ width: 14, height: 14, objectFit: "contain", marginLeft: 2, verticalAlign: "middle", opacity: 0.9 }} /> : ""}
              </div>
              {showChg && (
                <div style={{ fontSize: Math.max(7, symFs * 0.75), fontWeight: 600, color: "rgba(255,255,255,0.95)", lineHeight: 1.1, marginTop: 1 }}>
                  {sign2}{orig.chg.toFixed(2)}%
                </div>
              )}
              {showPrice && (
                <div style={{ fontSize: Math.max(7, symFs * 0.65), color: "rgba(255,255,255,0.80)", lineHeight: 1.1, marginTop: 1 }}>
                  Rs {orig.price.toFixed(2)}
                </div>
              )}
            </div>
          );
        })}
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridAutoRows: "220px", gap: 7, padding: "4px 0 14px", zoom: 0.82 }}>
      {grouped.map(([sector, ss]) => (
        <SectorCard key={sector} sector={sector} ss={ss} onHover={onHover} onLeave={onLeave} />
      ))}
    </div>
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
  { key: "all",     label: "All Share"   },
  { key: "islamic", label: "🕌 All Islamic" },
  { key: "kse100",  label: "KSE-100"     },
  { key: "kse30",   label: "KSE-30"      },
  { key: "kmi30",   label: "KMI-30"      },
  { key: "kmiAll",  label: "KMI All"     },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function HeatmapClient() {
  const [idx,     setIdx]     = useState<IndexFilter>("all");
  const [view,    setView]    = useState<"sector" | "combined">("sector");
  const [tooltip, setTooltip] = useState<{ stock: StockData; x: number; y: number } | null>(null);
  const [lastRef, setLastRef] = useState<Date | null>(null);
  const [allStocks, setAllStocks] = useState<StockData[]>([]);
  const [dataSource, setDataSource] = useState<"live" | "demo">("demo");

  const filtered = useMemo(() => filterStocks(allStocks, idx), [allStocks, idx]);

  const onHover  = useCallback((s: StockData, e: React.MouseEvent) => setTooltip({ stock: s, x: e.clientX, y: e.clientY }), []);
  const onLeave  = useCallback(() => setTooltip(null), []);

  const fetchStocks = useCallback(async () => {
    try {
      const res = await fetch("/api/portal/heatmap");
      const json = await res.json();
      if (json.stocks?.length) {
        setAllStocks(json.stocks);
        setDataSource(json.source === "live" ? "live" : "demo");
      }
    } catch { /* keep existing data */ }
    setLastRef(new Date());
  }, []);

  useEffect(() => {
    fetchStocks();
    const id = setInterval(fetchStocks, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchStocks]);

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
          <h1 className="hm-title" style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
            Market Heatmap
          </h1>
          <p className="hm-subtitle" style={{ margin: 0, fontSize: 10.5 }}>PSX · Volume-weighted · Auto-refresh 5 min</p>
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", gap: 4 }}>
          {(["sector", "combined"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "5px 14px", fontSize: 11, fontWeight: 700, borderRadius: 6, cursor: "pointer",
              border: "1px solid var(--border-dark)", transition: "all 0.15s",
              background: view === v ? "#D4971A" : "var(--card-bg)",
              color: view === v ? "#07111F" : "var(--text-primary)",
            }}>
              {v === "sector" ? "Sector View" : "Combined View"}
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
          {dataSource === "live" && (
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
