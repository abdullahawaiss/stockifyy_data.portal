"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { PSX_STOCKS } from "@/lib/psx-stocks-static";
import { useDarkTokens } from "@/hooks/useDarkMode";

interface ScreenerRow {
  symbol: string;
  companyName: string;
  sectorName: string;
  close: number;
  pct: number;
  volume: number;
  pe: number | null;
  dps: number | null;
  divYield: number | null;
  shariah: boolean;
  eps: number | null;
  marketCap: "Large" | "Mid" | "Small";
}

interface SavedScreen {
  id: string;
  name: string;
  filters: FilterState;
  savedAt: string;
}

interface FilterState {
  sectors: string[];
  index: "All" | "KSE-100" | "KSE-30";
  shariah: boolean;
  peMin: number;
  peMax: number;
  dyMin: number;
  dyMax: number;
  minVolume: number;
  marketCap: string[];
  priceMin: number;
  priceMax: number;
}

const KSE100 = new Set(["OGDC","PPL","HBL","UBL","MCB","MEBL","ENGRO","LUCK","PSMC","SYS","TRG","PSO","MARI","FFC","EFERT","HUBC","DGKC","BWCL","NBP","ABL","BAFL","INDU","NML","ICI","SEARL","SNGP","FCCL","MLCF","PTC","MUGHAL","BAHL","AKBL","FABL","ATRL","POL","APL","FFBL","FATIMA","EPCL","NRL"]);
const KSE30  = new Set(["OGDC","PPL","HBL","UBL","MCB","MEBL","ENGRO","LUCK","INDU","PSO","MARI","FFC","EFERT","HUBC","DGKC","NBP","ABL","BAFL","BWCL","SYS"]);

const FUNDAMENTALS: Record<string, { eps: number; pe: number; dps: number | null; close: number; pct: number; volume: number }> = {
  OGDC: { eps:29.40, pe:6.2,  dps:6.00,   close:181.50, pct:-0.66, volume:3_450_000 },
  PPL:  { eps:16.50, pe:5.4,  dps:3.50,   close:89.30,  pct:-0.78, volume:1_890_000 },
  HBL:  { eps:38.20, pe:4.6,  dps:14.00,  close:177.30, pct:1.03,  volume:2_100_000 },
  UBL:  { eps:48.60, pe:4.8,  dps:28.00,  close:232.40, pct:0.91,  volume:980_000 },
  MCB:  { eps:45.30, pe:5.0,  dps:36.00,  close:225.60, pct:-0.92, volume:540_000 },
  MEBL: { eps:30.10, pe:7.3,  dps:29.50,  close:218.50, pct:0.83,  volume:760_000 },
  ENGRO:{ eps:28.50, pe:10.0, dps:15.00,  close:285.40, pct:1.49,  volume:1_240_000 },
  LUCK: { eps:120.0, pe:7.8,  dps:40.00,  close:932.00, pct:-0.90, volume:318_000 },
  PSMC: { eps:110.0, pe:7.5,  dps:60.00,  close:830.00, pct:1.47,  volume:42_000 },
  SYS:  { eps:58.20, pe:12.4, dps:30.00,  close:724.00, pct:1.26,  volume:320_000 },
  TRG:  { eps:8.40,  pe:12.1, dps:null,   close:101.50, pct:1.50,  volume:1_900_000 },
  PSO:  { eps:68.20, pe:5.0,  dps:30.00,  close:341.60, pct:-0.99, volume:670_000 },
  MARI: { eps:310.0, pe:6.9,  dps:90.00,  close:2145.0, pct:1.06,  volume:98_000 },
  FFC:  { eps:24.80, pe:5.6,  dps:18.00,  close:139.30, pct:-0.64, volume:870_000 },
  EFERT:{ eps:12.10, pe:7.2,  dps:9.00,   close:87.60,  pct:0.69,  volume:1_100_000 },
  HUBC: { eps:12.30, pe:8.8,  dps:8.00,   close:107.80, pct:0.75,  volume:2_300_000 },
  DGKC: { eps:14.20, pe:6.9,  dps:5.00,   close:97.80,  pct:-0.81, volume:440_000 },
  BWCL: { eps:62.40, pe:5.0,  dps:40.00,  close:312.00, pct:0.81,  volume:210_000 },
  NBP:  { eps:7.80,  pe:5.5,  dps:4.00,   close:43.20,  pct:0.70,  volume:5_200_000 },
  ABL:  { eps:29.07, pe:4.7,  dps:16.00,  close:136.70, pct:0.66,  volume:490_000 },
  BAFL: { eps:8.92,  pe:6.1,  dps:8.50,   close:54.60,  pct:0.74,  volume:3_800_000 },
  INDU: { eps:220.0, pe:7.7,  dps:175.00, close:1702.0, pct:1.07,  volume:65_000 },
  NML:  { eps:22.40, pe:6.2,  dps:12.00,  close:138.00, pct:0.73,  volume:290_000 },
  ICI:  { eps:95.40, pe:8.7,  dps:50.00,  close:832.00, pct:0.73,  volume:84_000 },
  SEARL:{ eps:30.50, pe:7.5,  dps:15.00,  close:228.00, pct:0.88,  volume:560_000 },
  SNGP: { eps:3.90,  pe:7.2,  dps:2.00,   close:28.10,  pct:1.44,  volume:7_200_000 },
  FCCL: { eps:2.80,  pe:7.9,  dps:2.50,   close:22.10,  pct:0.91,  volume:4_100_000 },
  MLCF: { eps:5.20,  pe:7.8,  dps:2.50,   close:40.80,  pct:-0.97, volume:2_800_000 },
  PTC:  { eps:2.40,  pe:7.8,  dps:1.50,   close:18.80,  pct:-1.05, volume:6_500_000 },
  MUGHAL:{ eps:9.80, pe:8.0,  dps:5.00,   close:78.50,  pct:0.90,  volume:950_000 },
  ABOT: { eps:84.85, pe:11.2, dps:48.00,  close:950.0,  pct:0.55,  volume:45_000 },
  ACPL: { eps:38.20, pe:7.4,  dps:30.00,  close:282.0,  pct:0.42,  volume:180_000 },
  BAHL: { eps:30.10, pe:5.8,  dps:18.00,  close:174.0,  pct:0.69,  volume:320_000 },
  AKBL: { eps:7.20,  pe:5.2,  dps:4.00,   close:37.50,  pct:0.54,  volume:2_100_000 },
  FABL: { eps:10.80, pe:6.0,  dps:6.50,   close:65.00,  pct:0.77,  volume:1_400_000 },
  POL:  { eps:88.0,  pe:6.5,  dps:60.00,  close:573.0,  pct:0.35,  volume:110_000 },
  APL:  { eps:72.0,  pe:6.2,  dps:40.00,  close:447.0,  pct:0.45,  volume:130_000 },
  FFBL: { eps:4.20,  pe:8.2,  dps:3.00,   close:34.50,  pct:0.58,  volume:1_800_000 },
  FATIMA:{ eps:4.50, pe:7.7,  dps:3.00,   close:34.70,  pct:-0.57, volume:2_300_000 },
  EPCL: { eps:4.80,  pe:8.0,  dps:3.50,   close:38.50,  pct:0.78,  volume:1_100_000 },
};

const SHARIAH_SET = new Set(["MEBL","FABL","BAHL","AKBL","SNBL","MCB","HUBC","EFERT","ENGRO","LUCK","MLCF","FCCL","BWCL","DGKC","MUGHAL","SYS","TRG","MARI","OGDC","PPL","SNGP","FFC","FFBL","FATIMA","NML","SEARL","INDU","PSMC","FCCL","ACPL","EPCL"]);

function getMarketCap(sym: string, close: number): "Large" | "Mid" | "Small" {
  if (KSE30.has(sym) || close > 500) return "Large";
  if (KSE100.has(sym) || close > 100) return "Mid";
  return "Small";
}

function buildRows(): ScreenerRow[] {
  return PSX_STOCKS.map(s => {
    const f = FUNDAMENTALS[s.symbol];
    const close = f?.close ?? (50 + Math.random() * 200);
    const dps = f?.dps ?? null;
    const divYield = dps && close > 0 ? (dps / close) * 100 : null;
    return {
      symbol: s.symbol,
      companyName: s.name,
      sectorName: s.sector,
      close,
      pct: f?.pct ?? (Math.random() * 4 - 2),
      volume: f?.volume ?? Math.floor(Math.random() * 1_000_000),
      pe: f?.pe ?? null,
      dps,
      divYield,
      shariah: SHARIAH_SET.has(s.symbol),
      eps: f?.eps ?? null,
      marketCap: getMarketCap(s.symbol, close),
    };
  });
}

const ALL_ROWS = buildRows();

function fmtVol(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
function fmtN(n: number | null, d = 2) {
  if (n === null || !isFinite(n)) return "—";
  return n.toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d });
}

const DEFAULT_FILTERS: FilterState = {
  sectors: [], index: "All", shariah: false,
  peMin: 0, peMax: 50, dyMin: 0, dyMax: 15,
  minVolume: 0, marketCap: [], priceMin: 0, priceMax: 9999,
};

const LS_KEY = "stockifyy_screens";
function loadScreens(): SavedScreen[] { try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; } }
function saveScreens(s: SavedScreen[]) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {} }

type SortKey = "symbol" | "companyName" | "sectorName" | "close" | "pct" | "volume" | "pe" | "dps" | "divYield";

export default function PageClient() {
  const tk = useDarkTokens();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortAsc, setSortAsc] = useState(false);
  const [savedScreens, setSavedScreens] = useState<SavedScreen[]>([]);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    setSavedScreens(loadScreens());
    try {
      const wl = JSON.parse(localStorage.getItem("stockifyy_watchlist") ?? "[]") as { symbol: string }[];
      setWatchlist(wl.map(x => x.symbol));
    } catch {}
  }, []);

  const allSectors = useMemo(() => {
    const map: Record<string, number> = {};
    ALL_ROWS.forEach(r => { map[r.sectorName] = (map[r.sectorName] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);

  const filtered = useMemo(() => {
    return ALL_ROWS.filter(r => {
      if (filters.sectors.length && !filters.sectors.includes(r.sectorName)) return false;
      if (filters.index === "KSE-100" && !KSE100.has(r.symbol)) return false;
      if (filters.index === "KSE-30" && !KSE30.has(r.symbol)) return false;
      if (filters.shariah && !r.shariah) return false;
      if (r.pe !== null && (r.pe < filters.peMin || r.pe > filters.peMax)) return false;
      if (r.divYield !== null && (r.divYield < filters.dyMin || r.divYield > filters.dyMax)) return false;
      if (r.volume < filters.minVolume) return false;
      if (filters.marketCap.length && !filters.marketCap.includes(r.marketCap)) return false;
      if (r.close < filters.priceMin || r.close > filters.priceMax) return false;
      return true;
    });
  }, [filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? 0, bVal = b[sortKey] ?? 0;
      if (typeof aVal === "string" && typeof bVal === "string")
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [filtered, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  function toggleSector(sec: string) {
    setFilters(f => ({ ...f, sectors: f.sectors.includes(sec) ? f.sectors.filter(s => s !== sec) : [...f.sectors, sec] }));
  }
  function toggleMarketCap(cap: string) {
    setFilters(f => ({ ...f, marketCap: f.marketCap.includes(cap) ? f.marketCap.filter(c => c !== cap) : [...f.marketCap, cap] }));
  }

  function exportCSV() {
    const header = "Symbol,Company,Sector,Close,Chg%,Volume,P/E,DPS,DivYield%,Shariah";
    const rows = sorted.map(r => `${r.symbol},"${r.companyName}","${r.sectorName}",${fmtN(r.close)},${fmtN(r.pct)},${r.volume},${fmtN(r.pe)},${fmtN(r.dps)},${fmtN(r.divYield)},${r.shariah ? "Yes" : "No"}`);
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "psx-screener.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function saveScreen() {
    if (!saveName.trim()) return;
    const ns: SavedScreen = { id: Date.now().toString(), name: saveName.trim(), filters, savedAt: new Date().toISOString() };
    const updated = [...savedScreens.slice(-4), ns];
    setSavedScreens(updated); saveScreens(updated); setSaveName(""); setShowSaveInput(false);
  }
  function deleteScreen(id: string) {
    const updated = savedScreens.filter(s => s.id !== id);
    setSavedScreens(updated); saveScreens(updated);
  }

  function addToWatchlist(symbol: string, name: string) {
    try {
      const raw = JSON.parse(localStorage.getItem("stockifyy_watchlist") ?? "[]") as { id: string; symbol: string; name: string; sector: string; addedPrice: number; addedAt: string }[];
      if (raw.some(x => x.symbol === symbol)) return;
      const row = ALL_ROWS.find(r => r.symbol === symbol);
      raw.push({ id: Date.now().toString(), symbol, name, sector: row?.sectorName ?? "", addedPrice: row?.close ?? 100, addedAt: new Date().toISOString() });
      localStorage.setItem("stockifyy_watchlist", JSON.stringify(raw));
      setWatchlist(prev => [...prev, symbol]);
    } catch {}
  }

  const card = tk.dark ? "#0A1825" : "#ffffff";
  const border = tk.dark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
  const text = tk.dark ? "#BDD0E8" : "#07111F";
  const muted = tk.dark ? "#5C8099" : "#718096";
  const bg = tk.dark ? "#0E1F30" : "#F8F6F1";
  const navy = "#07111F";
  const gold = "#D4971A";

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "inherit", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ padding: "20px 20px 0", maxWidth: 1400, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
              <span style={{ color: text }}>Stock </span><span style={{ color: "#D4971A" }}>Screener</span>
            </h1>
            <p style={{ fontSize: 13, color: muted, margin: "4px 0 0" }}>Filter and discover PSX listed stocks by fundamental & technical criteria</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ background: gold + "20", color: gold, fontWeight: 700, fontSize: 13, padding: "6px 14px", borderRadius: 20 }}>
              {sorted.length} Results
            </span>
            <button onClick={exportCSV} style={{ padding: "7px 14px", background: card, border: `1px solid ${border}`, borderRadius: 8, color: text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ↓ Export CSV
            </button>
            <button onClick={() => setShowSaveInput(v => !v)} style={{ padding: "7px 14px", background: gold, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              💾 Save Screen
            </button>
          </div>
        </div>
        {showSaveInput && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Screen name..." style={{ flex: 1, padding: "8px 12px", border: `1.5px solid ${border}`, borderRadius: 8, background: card, color: text, fontSize: 13, outline: "none" }} />
            <button onClick={saveScreen} style={{ padding: "8px 16px", background: gold, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Save</button>
            <button onClick={() => setShowSaveInput(false)} style={{ padding: "8px 14px", background: card, border: `1px solid ${border}`, borderRadius: 8, color: muted, cursor: "pointer" }}>Cancel</button>
          </div>
        )}
        {/* Saved screens */}
        {savedScreens.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: muted, alignSelf: "center" }}>Saved:</span>
            {savedScreens.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4, background: card, border: `1px solid ${border}`, borderRadius: 20, padding: "4px 10px 4px 12px", fontSize: 12 }}>
                <button onClick={() => setFilters(s.filters)} style={{ background: "none", border: "none", cursor: "pointer", color: gold, fontWeight: 700, padding: 0 }}>{s.name}</button>
                <button onClick={() => deleteScreen(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: muted, fontSize: 12, padding: "0 2px" }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body: filter panel + table */}
      <div style={{ display: "flex", gap: 0, flex: 1, maxWidth: 1400, margin: "0 auto", width: "100%", padding: "0 20px 24px", boxSizing: "border-box", alignItems: "flex-start" }}>

        {/* Filter Panel */}
        <div style={{ width: 260, flexShrink: 0, marginRight: 16, position: "sticky", top: 80, background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px", maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: text }}>Filters</span>
            <button onClick={() => setFilters(DEFAULT_FILTERS)} style={{ fontSize: 11, color: gold, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Reset All</button>
          </div>

          {/* Index */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Index</div>
            {(["All","KSE-100","KSE-30"] as const).map(idx => (
              <label key={idx} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 13, color: filters.index === idx ? gold : text }}>
                <input type="radio" checked={filters.index === idx} onChange={() => setFilters(f => ({ ...f, index: idx }))} />
                {idx}
              </label>
            ))}
          </div>

          {/* Shariah */}
          <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: filters.shariah ? "#16a34a" : text }}>
              <input type="checkbox" checked={filters.shariah} onChange={() => setFilters(f => ({ ...f, shariah: !f.shariah }))} />
              ☪ Shariah Compliant Only
            </label>
          </div>

          {/* Market Cap */}
          <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Market Cap</div>
            {["Large","Mid","Small"].map(cap => (
              <label key={cap} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 13, color: text }}>
                <input type="checkbox" checked={filters.marketCap.includes(cap)} onChange={() => toggleMarketCap(cap)} />
                {cap} Cap
              </label>
            ))}
          </div>

          {/* P/E Range */}
          <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>P/E Ratio</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="number" value={filters.peMin} onChange={e => setFilters(f => ({ ...f, peMin: +e.target.value }))} placeholder="Min" style={{ flex: 1, padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
              <input type="number" value={filters.peMax} onChange={e => setFilters(f => ({ ...f, peMax: +e.target.value }))} placeholder="Max" style={{ flex: 1, padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
            </div>
          </div>

          {/* Div Yield Range */}
          <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Div Yield %</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="number" value={filters.dyMin} onChange={e => setFilters(f => ({ ...f, dyMin: +e.target.value }))} placeholder="Min" style={{ flex: 1, padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
              <input type="number" value={filters.dyMax} onChange={e => setFilters(f => ({ ...f, dyMax: +e.target.value }))} placeholder="Max" style={{ flex: 1, padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
            </div>
          </div>

          {/* Price Range */}
          <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Price Range (PKR)</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="number" value={filters.priceMin} onChange={e => setFilters(f => ({ ...f, priceMin: +e.target.value }))} placeholder="Min" style={{ flex: 1, padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
              <input type="number" value={filters.priceMax} onChange={e => setFilters(f => ({ ...f, priceMax: +e.target.value }))} placeholder="Max" style={{ flex: 1, padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
            </div>
          </div>

          {/* Min Volume */}
          <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Min Volume</div>
            <input type="number" value={filters.minVolume} onChange={e => setFilters(f => ({ ...f, minVolume: +e.target.value }))} placeholder="e.g. 100000" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
          </div>

          {/* Sectors */}
          <div style={{ paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Sectors</div>
            {allSectors.map(([sec, count]) => (
              <label key={sec} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5, cursor: "pointer", gap: 6 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                  <input type="checkbox" checked={filters.sectors.includes(sec)} onChange={() => toggleSector(sec)} />
                  <span style={{ fontSize: 11.5, color: filters.sectors.includes(sec) ? gold : text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sec}</span>
                </span>
                <span style={{ fontSize: 10, color: muted, flexShrink: 0 }}>{count}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Results Table */}
        <div style={{ flex: 1, background: card, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: navy }}>
                  {([
                    ["symbol","Symbol"],["companyName","Company"],["sectorName","Sector"],
                    ["close","Close"],["pct","Chg %"],["volume","Volume"],["pe","P/E"],
                    ["dps","DPS"],["divYield","Div Yield"],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <th key={key} onClick={() => toggleSort(key)} style={{
                      padding: "10px 12px", textAlign: "right", color: "rgba(255,255,255,0.85)",
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                      cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
                    }}>
                      {label} {sortKey === key ? (sortAsc ? "▲" : "▼") : ""}
                    </th>
                  ))}
                  <th style={{ padding: "10px 12px", color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, textAlign: "center" }}>Shariah</th>
                  <th style={{ padding: "10px 12px", color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, textAlign: "center" }}>Watch</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, idx) => {
                  const inWl = watchlist.includes(r.symbol);
                  const pColor = r.pct >= 0 ? "#16a34a" : "#dc2626";
                  return (
                    <tr key={r.symbol} style={{ borderBottom: `1px solid ${border}`, background: idx % 2 === 0 ? "transparent" : (tk.dark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)") }}
                      onMouseEnter={e => (e.currentTarget.style.background = tk.dark ? "rgba(255,255,255,0.04)" : "#F8F6F1")}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : (tk.dark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)"))}>
                      <td style={{ padding: "9px 12px", textAlign: "right" }}>
                        <Link href={`/data-portal/company/${r.symbol}`} style={{ textDecoration: "none" }}>
                          <span style={{ background: navy, color: gold, fontWeight: 800, fontSize: 12, padding: "2px 8px", borderRadius: 5 }}>{r.symbol}</span>
                        </Link>
                      </td>
                      <td style={{ padding: "9px 12px", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: text }}>{r.companyName}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right" }}>
                        <span style={{ fontSize: 11, color: muted, background: tk.dark ? "rgba(255,255,255,0.06)" : "#F1F5F9", padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
                          {r.sectorName.length > 16 ? r.sectorName.slice(0, 16) + "…" : r.sectorName}
                        </span>
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{fmtN(r.close)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: pColor, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {r.pct >= 0 ? "+" : ""}{fmtN(r.pct)}%
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtVol(r.volume)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtN(r.pe, 1)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{fmtN(r.dps)}</td>
                      <td style={{ padding: "9px 12px", textAlign: "right", color: r.divYield ? "#16a34a" : muted, fontWeight: r.divYield ? 600 : 400 }}>
                        {r.divYield ? fmtN(r.divYield) + "%" : "—"}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "center" }}>
                        {r.shariah && <span style={{ fontSize: 11, background: "#16a34a20", color: "#16a34a", padding: "2px 6px", borderRadius: 8, fontWeight: 700 }}>☪</span>}
                      </td>
                      <td style={{ padding: "9px 12px", textAlign: "center" }}>
                        <button onClick={() => addToWatchlist(r.symbol, r.companyName)} title={inWl ? "In watchlist" : "Add to watchlist"} style={{
                          background: "none", border: "none", cursor: inWl ? "default" : "pointer", fontSize: 16,
                          color: inWl ? gold : muted, transition: "color 0.15s",
                        }}>{inWl ? "★" : "☆"}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sorted.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: muted }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>No stocks match your filters</div>
                <div style={{ fontSize: 13 }}>Try adjusting or resetting the filters</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
