"use client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { filterStocks, getColor, getTextColor, STOCKS as DEMO_STOCKS } from "../_data/stocks";
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

// ── Combined View — Professional hierarchical treemap ────────────────────────

const CV_HEADER_H  = 17; // reserved sector header strip height (px)
const CV_MARGIN    = 0;  // outer canvas margin (px) — flush edges like a terminal
const CV_SEC_GAP   = 1;  // 1px white divider between sector frames
const CV_STOCK_GAP = 0;  // no gap; inset box-shadow creates sharp dividers

function buildWeightMap(allFilteredStocks: StockData[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of allFilteredStocks) {
    // Size by trading volume — higher volume stocks get bigger tiles
    const w = Math.max(1, s.vol || 1);
    map.set(s.sym, w);
  }
  return map;
}

// Generic squarified treemap — unchanged algorithm, used by CombinedView only
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

function CombinedView({ stocks, onHover, onLeave }: {
  stocks: StockData[];
  onHover: (s: StockData, e: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(0);
  const [topOffset, setTopOffset] = useState(180);
  const [hoveredSym, setHoveredSym] = useState<string | null>(null);
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);
  const [zoomedSector, setZoomedSector] = useState<string | null>(null);

  // Measure wrapper width and its distance from viewport top (to compute available height)
  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const calc = () => {
      const rect = el.getBoundingClientRect();
      setCanvasW(Math.floor(rect.width));
      setTopOffset(Math.floor(rect.top + window.scrollY > 0 ? rect.top : 180));
    };
    calc();
    const obs = new ResizeObserver(calc);
    obs.observe(el);
    window.addEventListener("resize", calc);
    return () => { obs.disconnect(); window.removeEventListener("resize", calc); };
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setZoomedSector(null); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // Weight map uses all filtered stocks for normalization
  const weightMap = useMemo(() => buildWeightMap(stocks), [stocks]);

  // Volume quantiles for visual emphasis
  const volQ = useMemo(() => {
    const vols = [...stocks].map(s => s.vol).sort((a, b) => a - b);
    const p15 = vols[Math.floor(vols.length * 0.15)] ?? 0;
    const p85 = vols[Math.floor(vols.length * 0.85)] ?? Infinity;
    return { p15, p85 };
  }, [stocks]);

  const sectorGroups = useMemo(() => {
    const map: Record<string, StockData[]> = {};
    for (const s of stocks) {
      if (!map[s.sector]) map[s.sector] = [];
      map[s.sector].push(s);
    }
    return Object.entries(map)
      .map(([sector, ss]) => {
        const sorted = [...ss].sort((a, b) => (weightMap.get(b.sym) ?? 1) - (weightMap.get(a.sym) ?? 1));
        const secWt  = sorted.reduce((t, s) => t + (weightMap.get(s.sym) ?? 1), 0);
        return { sector, stocks: sorted, secWt };
      })
      .filter(g => g.secWt > 0)
      .sort((a, b) => b.secWt - a.secWt);
  }, [stocks, weightMap]);

  const activeGroups = useMemo(() =>
    zoomedSector ? sectorGroups.filter(g => g.sector === zoomedSector) : sectorGroups
  , [sectorGroups, zoomedSector]);

  // Wide landscape ratio: 0.45× width → forces wide, short tiles (width > height)
  const canvasH = useMemo(() => {
    if (!canvasW) return 500;
    return Math.max(420, Math.round(canvasW * 0.45));
  }, [canvasW]);

  const layout = useMemo(() => {
    if (!canvasW || !canvasH || !activeGroups.length) return [];
    const W = canvasW - CV_MARGIN * 2;
    const H = canvasH - CV_MARGIN * 2;

    return squarifyG(activeGroups, W, H, g => g.secWt).map(sr => {
      const g  = sr.item;
      // Apply sector gap inset
      const sx = CV_MARGIN + sr.x + CV_SEC_GAP * 0.5;
      const sy = CV_MARGIN + sr.y + CV_SEC_GAP * 0.5;
      const sw = Math.max(1, sr.w - CV_SEC_GAP);
      const sh = Math.max(1, sr.h - CV_SEC_GAP);
      // Stocks fill area below the header strip
      const stockAreaH = Math.max(0, sh - CV_HEADER_H);
      const stockRects = squarifyG(g.stocks, sw, stockAreaH, s => weightMap.get(s.sym) ?? 1)
        .map(r => ({ stock: r.item, x: sx + r.x, y: sy + CV_HEADER_H + r.y, w: r.w, h: r.h }));
      return { sector: g.sector, sx, sy, sw, sh, stockRects };
    });
  }, [activeGroups, canvasW, canvasH, weightMap]);

  return (
    <div
      ref={wrapRef}
      style={{
        width: "100%",
        height: canvasH || 600,
        position: "relative",
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.10)",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {zoomedSector && (
        <button
          onClick={() => setZoomedSector(null)}
          style={{
            position: "absolute", top: 8, left: 8, zIndex: 300,
            padding: "4px 12px", borderRadius: 4,
            background: "rgba(212,175,55,0.95)", color: "#07111F",
            fontWeight: 700, fontSize: 11, border: "none", cursor: "pointer",
          }}
        >
          ← All Sectors
        </button>
      )}

      {layout.map(({ sector, sx, sy, sw, sh, stockRects }) => {
        // Fit sector name: bold uppercase, ~0.63× char-width ratio, 7–10px range
        const headerFs: number = Math.max(7, Math.min(10, (sw - 10) / (sector.length * 0.63)));
        // Allow two lines only if sector is wide enough and name is long
        const twoLine = sw >= 60 && sector.length * headerFs * 0.63 > sw - 10;

        return (
          <div key={sector} style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }}>

            {/* Sector boundary — sharp white frame */}
            <div style={{
              position: "absolute", left: sx, top: sy, width: sw, height: sh,
              border: "1px solid rgba(255,255,255,0.55)",
              boxSizing: "border-box", pointerEvents: "none", zIndex: 3,
            }} />

            {/* Sector header strip — white background, dark text (terminal style) */}
            <div
              onClick={() => setZoomedSector(prev => prev === sector ? null : sector)}
              onMouseEnter={() => setHoveredSector(sector)}
              onMouseLeave={() => setHoveredSector(null)}
              title={`${sector} — click to zoom`}
              style={{
                position: "absolute",
                left: sx, top: sy, width: sw, height: CV_HEADER_H,
                background: hoveredSector === sector ? "#FFF6DC" : "#FFFFFF",
                borderBottom: `1px solid rgba(0,0,0,0.18)`,
                boxSizing: "border-box",
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px",
                overflow: "hidden",
                cursor: "pointer",
                zIndex: 6,
                transition: "background 0.12s",
              }}
            >
              <span style={{
                fontSize: headerFs,
                fontWeight: 700,
                color: hoveredSector === sector ? "#B87B1A" : "#1a1a1a",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                lineHeight: 1.15,
                whiteSpace: twoLine ? "normal" : "nowrap",
                overflow: "hidden",
                textOverflow: "clip",
                textAlign: "center",
                transition: "color 0.15s",
                ...(twoLine ? {
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                } : {}),
              } as React.CSSProperties}>
                {sector}
              </span>
            </div>

            {/* Stock tiles — volume-sized; progressive text display */}
            {stockRects.map(({ stock: s, x, y, w, h }) => {
              const tx = x + CV_STOCK_GAP, ty = y + CV_STOCK_GAP;
              const tw = Math.max(0, w - CV_STOCK_GAP * 2);
              const th = Math.max(0, h - CV_STOCK_GAP * 2);
              if (tw < 2 || th < 2) return null;

              const isHov       = hoveredSym === s.sym;
              const inHovSector = hoveredSector === sector;
              const isHighVol   = s.vol >= volQ.p85;
              const isLowVol    = s.vol <= volQ.p15;
              const sign  = s.chg >= 0 ? "+" : "";
              const pct   = `${sign}${s.chg.toFixed(2)}%`;
              const arrow = s.chg >= 0 ? "▲" : "▼";

              // Dynamic padding — tiny tiles get almost no padding
              const padH = tw < 16 ? 1 : tw < 28 ? 2 : tw < 50 ? 3 : 5;
              const padV = th < 16 ? 1 : th < 28 ? 2 : th < 50 ? 3 : 5;
              const avW  = Math.max(1, tw - padH * 2);
              const avH  = Math.max(1, th - padV * 2);
              const MIN_FS = 5;

              // ── SYMBOL ──
              // Try full symbol first, then abbreviate down to 1 char
              let symStr = s.sym;
              let symFitW = avW / (symStr.length * 0.72);
              let symFs   = Math.min(symFitW, avH, 30);
              if (symFs < MIN_FS && symStr.length > 3) {
                symStr  = symStr.slice(0, 3);
                symFitW = avW / (symStr.length * 0.72);
                symFs   = Math.min(symFitW, avH, 30);
              }
              if (symFs < MIN_FS && symStr.length > 1) {
                symStr  = symStr.slice(0, 1);
                symFitW = avW / (symStr.length * 0.72);
                symFs   = Math.min(symFitW, avH, 30);
              }
              const showSym    = symFs >= MIN_FS;
              const finalSymFs = showSym ? Math.max(MIN_FS, symFs) : 0;

              // ── CHANGE % ── e.g. "▲ +1.42%"
              const chgText = `${arrow} ${pct}`;
              const chgFs   = Math.min(
                finalSymFs * 0.80,
                avW / (chgText.length * 0.60),
                16,
              );
              const showChg = showSym
                && symStr === s.sym   // only when full symbol fits
                && chgFs >= MIN_FS
                && avH >= finalSymFs * 1.1 + chgFs * 1.1 + 2;

              // ── PRICE ── e.g. "Rs 221.41"
              const priceText  = `Rs ${s.price.toFixed(2)}`;
              const priceFsMax = avW / (priceText.length * 0.58);
              const priceFs    = Math.min(9, priceFsMax);
              const showPrice  = showChg
                && priceFs >= MIN_FS
                && avH >= finalSymFs * 1.1 + chgFs * 1.1 + priceFs * 1.2 + 4
                && tw >= 42;

              // ── VOLUME ── e.g. "117.9 mn"
              const volStr    = s.vol >= 1000 ? `${(s.vol / 1000).toFixed(1)} mn` : `${s.vol}K`;
              const volFsMax  = avW / (volStr.length * 0.60);
              const volFs     = Math.min(8, volFsMax);
              const showVol   = showPrice
                && volFs >= MIN_FS
                && avH >= finalSymFs * 1.1 + chgFs * 1.1 + priceFs * 1.2 + volFs * 1.2 + 6
                && tw >= 55;

              return (
                <div
                  key={s.sym}
                  onMouseEnter={e => { onHover(s, e); setHoveredSym(s.sym); }}
                  onMouseMove={e => onHover(s, e)}
                  onMouseLeave={() => { onLeave(); setHoveredSym(null); }}
                  onClick={() => {
                    if (!zoomedSector) setZoomedSector(sector);
                    else window.open(`/data-portal/company/${s.sym}`, "_blank");
                  }}
                  title={`${s.sym} — ${s.name} | ${sector}\n${sign}${s.chg.toFixed(2)}% | Rs ${s.price.toFixed(2)} | Vol ${s.vol >= 1000 ? (s.vol / 1000).toFixed(2) + "mn" : s.vol + "K"}${s.shariah ? " | Shariah ✓" : ""}`}
                  style={{
                    position: "absolute",
                    left: tx, top: ty, width: tw, height: th,
                    background: getColor(s.chg, s.sector),
                    boxSizing: "border-box",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    overflow: "hidden",
                    contain: "paint" as React.CSSProperties["contain"],
                    padding: `${padV}px ${padH}px`,
                    textAlign: "center",
                    // inset box-shadow = sharp white divider without layout shift
                    boxShadow: isHov
                      ? "inset 0 0 0 2px #E79A00"
                      : "inset 0 0 0 1px rgba(255,255,255,0.28)",
                    filter: isHov ? "brightness(1.18)" : inHovSector ? "brightness(1.10)" : "none",
                    transition: "filter 0.10s, box-shadow 0.08s",
                    zIndex: isHov ? 8 : 1,
                  }}
                >
                  {/* Symbol — always show if it fits at >= 5px; abbreviates gracefully */}
                  {showSym && (
                    <div style={{
                      fontSize: finalSymFs,
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      maxWidth: "100%",
                      textShadow: finalSymFs > 10 ? "0 1px 2px rgba(0,0,0,0.50)" : "none",
                      flexShrink: 0,
                      letterSpacing: finalSymFs > 14 ? "-0.01em" : "0",
                    }}>{symStr}</div>
                  )}

                  {/* ▲/▼ % change */}
                  {showChg && (
                    <div style={{
                      fontSize: chgFs,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.93)",
                      lineHeight: 1.0,
                      marginTop: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      maxWidth: "100%",
                      flexShrink: 0,
                    }}>{arrow} {pct}</div>
                  )}

                  {/* Price — medium+ tiles only */}
                  {showPrice && (
                    <div style={{
                      fontSize: priceFs,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.75)",
                      lineHeight: 1.1,
                      marginTop: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      maxWidth: "100%",
                      flexShrink: 0,
                    }}>Rs {s.price.toFixed(2)}</div>
                  )}

                  {/* Volume — large tiles only */}
                  {showVol && (
                    <div style={{
                      fontSize: volFs,
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.55)",
                      lineHeight: 1.1,
                      marginTop: 2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      maxWidth: "100%",
                      flexShrink: 0,
                    }}>{volStr}</div>
                  )}
                </div>
              );
            })}
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

      {/* ── Two large highlighted boxes (fixed height) ── */}
      <div style={{ display: "flex", gap: 3, padding: "4px 4px 3px", flexShrink: 0 }}>
        {/* Worst performer */}
        <SectorHighlightBox s={worst} label="Worst" onHover={onHover} onLeave={onLeave} />
        {/* Best performer (skip if same stock) */}
        {!isSame && <SectorHighlightBox s={best} label="Best" onHover={onHover} onLeave={onLeave} />}
      </div>

      {/* ── Remaining stocks — scrollable ── */}
      {rest.length > 0 && (
        <div style={{
          flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden",
          padding: "0 4px 4px",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 3,
          }}>
            {rest.map(s => (
              <SectorSmallBox key={s.sym} s={s} onHover={onHover} onLeave={onLeave} />
            ))}
          </div>
        </div>
      )}

      {ss.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--text-muted)" }}>
          No stocks available
        </div>
      )}
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
        @media (max-width: 1279px) {
          .sv-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 767px) {
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
  const [lastRef, setLastRef] = useState<Date | null>(null);
  const [allStocks, setAllStocks] = useState<StockData[]>(DEMO_STOCKS);
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
