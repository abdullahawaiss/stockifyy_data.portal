"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatNumber, formatVolume } from "@/lib/utils";
import { useDarkTokens } from "@/hooks/useDarkMode";

// ── Types ─────────────────────────────────────────────────────────────
interface StockRow {
  symbol: string; tradingDate: string;
  open: string|null; high: string|null; low: string|null;
  close: string|null; previousClose: string|null;
  priceChange: string|null; percentageChange: string|null;
  volume: string|null; marketValue: string|null;
  numberOfTrades: number|null;
  weekHigh52: string|null; weekLow52: string|null;
  isDemo: boolean;
  companyName: string|null; sectorName: string|null;
  sectorId: number|null; shariahStatus: string|null;
  indexCodes?: string[];
}
interface Totals {
  totalVolume: number; totalValue: number; totalTrades: number;
  totalStocks: number; advancers: number; decliners: number;
  unchanged: number; avgChange: number;
}
interface SectorOption { id: number; name: string; }
type SortDir = "asc"|"desc";
type Board = "MAIN BOARD"|"GEM BOARD"|"DEBT";
type MarketType = "REGULAR MARKET"|"DELIVERABLE FUTURES CONTRACT"|"CASH SETTLED FUTURES CONTRACT";

// ── GEM BOARD demo data ───────────────────────────────────────────────
const GEM_BOARD_ROWS: StockRow[] = [
  { symbol:"OCTOPUS", companyName:"Octopus Digital Ltd.",     sectorName:"Technology",         sectorId:10, close:"38.20",  previousClose:"36.80",  open:"37.00",  high:"38.50",  low:"36.70",  priceChange:"1.40",  percentageChange:"3.80",  volume:"2100000", marketValue:"80220000",  numberOfTrades:820,  weekHigh52:"52.00",  weekLow52:"22.00",  isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:[] },
  { symbol:"COLG",    companyName:"Colgate-Palmolive (Pak)",  sectorName:"Personal Care",      sectorId:11, close:"2840.00",previousClose:"2790.00", open:"2800.00",high:"2855.00",low:"2795.00",priceChange:"50.00", percentageChange:"1.79",  volume:"48000",   marketValue:"136320000", numberOfTrades:310,  weekHigh52:"3200.00",weekLow52:"2100.00",isDemo:true, tradingDate:"", shariahStatus:null,        indexCodes:[] },
  { symbol:"PMCL",    companyName:"Pakistan Mobile Comm.",    sectorName:"Telecom",            sectorId:12, close:"14.90",  previousClose:"14.60",  open:"14.65",  high:"15.05",  low:"14.55",  priceChange:"0.30",  percentageChange:"2.05",  volume:"5800000", marketValue:"86420000",  numberOfTrades:1240, weekHigh52:"22.00",  weekLow52:"10.50",  isDemo:true, tradingDate:"", shariahStatus:null,        indexCodes:[] },
  { symbol:"GLOT",    companyName:"Globe Textile Mills",      sectorName:"Textile Composite",  sectorId:13, close:"12.40",  previousClose:"12.80",  open:"12.75",  high:"12.80",  low:"12.30",  priceChange:"-0.40", percentageChange:"-3.13", volume:"980000",  marketValue:"12152000",  numberOfTrades:420,  weekHigh52:"19.50",  weekLow52:"9.80",   isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:[] },
  { symbol:"AICL",    companyName:"Adamjee Insurance Co.",    sectorName:"Insurance",          sectorId:14, close:"55.30",  previousClose:"54.20",  open:"54.40",  high:"55.80",  low:"54.10",  priceChange:"1.10",  percentageChange:"2.03",  volume:"620000",  marketValue:"34286000",  numberOfTrades:280,  weekHigh52:"72.00",  weekLow52:"38.00",  isDemo:true, tradingDate:"", shariahStatus:null,        indexCodes:[] },
  { symbol:"SRVI",    companyName:"Service Industries Ltd.",  sectorName:"Leather & Tanneries",sectorId:15, close:"720.00", previousClose:"705.00",  open:"708.00", high:"725.00", low:"704.00", priceChange:"15.00", percentageChange:"2.13",  volume:"32000",   marketValue:"23040000",  numberOfTrades:180,  weekHigh52:"920.00", weekLow52:"580.00", isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:[] },
  { symbol:"TPLI",    companyName:"Third Pole Ltd.",          sectorName:"Technology",         sectorId:10, close:"9.85",   previousClose:"10.20",  open:"10.10",  high:"10.25",  low:"9.78",   priceChange:"-0.35", percentageChange:"-3.43", volume:"3200000", marketValue:"31520000",  numberOfTrades:640,  weekHigh52:"18.00",  weekLow52:"6.50",   isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:[] },
  { symbol:"MFFL",    companyName:"Maple Leaf Foods Ltd.",    sectorName:"Food & Personal Care",sectorId:16,close:"24.60",  previousClose:"24.10",  open:"24.20",  high:"24.75",  low:"24.00",  priceChange:"0.50",  percentageChange:"2.07",  volume:"1400000", marketValue:"34440000",  numberOfTrades:510,  weekHigh52:"35.00",  weekLow52:"16.00",  isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:[] },
];

// ── DEBT BOARD demo data ──────────────────────────────────────────────
const DEBT_BOARD_ROWS: StockRow[] = [
  { symbol:"PKGSUKUK", companyName:"Packages Ltd. Sukuk",        sectorName:"Corporate Sukuk",   sectorId:50, close:"100.25",previousClose:"100.10",open:"100.10",high:"100.35",low:"100.05",priceChange:"0.15", percentageChange:"0.15",  volume:"50000",  marketValue:"5012500",  numberOfTrades:28,  weekHigh52:"101.50",weekLow52:"98.50",  isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:[] },
  { symbol:"HBLTFC1",  companyName:"HBL TFC — I",                sectorName:"Bank TFC",          sectorId:51, close:"99.80", previousClose:"100.00",open:"100.00",high:"100.00",low:"99.75", priceChange:"-0.20",percentageChange:"-0.20", volume:"120000", marketValue:"11976000", numberOfTrades:42,  weekHigh52:"100.80",weekLow52:"97.00",  isDemo:true, tradingDate:"", shariahStatus:null,        indexCodes:[] },
  { symbol:"MEEZAN3",  companyName:"Meezan Bank Sukuk — III",    sectorName:"Bank Sukuk",        sectorId:52, close:"100.60",previousClose:"100.40",open:"100.42",high:"100.65",low:"100.38",priceChange:"0.20", percentageChange:"0.20",  volume:"80000",  marketValue:"8048000",  numberOfTrades:31,  weekHigh52:"101.20",weekLow52:"99.00",  isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:[] },
  { symbol:"LUCKYTFC", companyName:"Lucky Cement TFC",           sectorName:"Corporate TFC",     sectorId:53, close:"100.10",previousClose:"100.05",open:"100.05",high:"100.20",low:"100.00",priceChange:"0.05", percentageChange:"0.05",  volume:"40000",  marketValue:"4004000",  numberOfTrades:18,  weekHigh52:"100.90",weekLow52:"98.20",  isDemo:true, tradingDate:"", shariahStatus:null,        indexCodes:[] },
  { symbol:"ENGROSKK", companyName:"Engro Corp. Sukuk",          sectorName:"Corporate Sukuk",   sectorId:50, close:"100.45",previousClose:"100.30",open:"100.32",high:"100.55",low:"100.28",priceChange:"0.15", percentageChange:"0.15",  volume:"60000",  marketValue:"6027000",  numberOfTrades:24,  weekHigh52:"101.00",weekLow52:"99.50",  isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:[] },
  { symbol:"WAPDA1",   companyName:"WAPDA SUKUK — I",            sectorName:"Govt. Sukuk",       sectorId:54, close:"101.20",previousClose:"101.00",open:"101.00",high:"101.35",low:"100.95",priceChange:"0.20", percentageChange:"0.20",  volume:"200000", marketValue:"20240000", numberOfTrades:65,  weekHigh52:"102.50",weekLow52:"99.80",  isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:[] },
  { symbol:"KAZTFC2",  companyName:"K-Electric TFC — II",        sectorName:"Corporate TFC",     sectorId:53, close:"99.50", previousClose:"99.70",  open:"99.70",  high:"99.75",  low:"99.40",  priceChange:"-0.20",percentageChange:"-0.20",volume:"75000",  marketValue:"7462500",  numberOfTrades:33,  weekHigh52:"100.50",weekLow52:"96.00",  isDemo:true, tradingDate:"", shariahStatus:null,        indexCodes:[] },
];

// Demo data for futures markets
const DELIVERABLE_FUTURES: StockRow[] = [
  { symbol:"OGDC",   companyName:"Oil & Gas Dev. Co.",    sectorName:"Oil & Gas Exploration", sectorId:1, close:"142.50", previousClose:"138.00", open:"139.00", high:"143.80", low:"138.50", priceChange:"4.50",  percentageChange:"3.26",  volume:"8500000",  marketValue:"1211250000", numberOfTrades:3200, weekHigh52:"165.00", weekLow52:"108.00", isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:["KSE100"] },
  { symbol:"PSO",    companyName:"Pakistan State Oil",    sectorName:"Oil & Gas Marketing",   sectorId:2, close:"320.00", previousClose:"312.00", open:"313.00", high:"322.50", low:"311.00", priceChange:"8.00",  percentageChange:"2.56",  volume:"6200000",  marketValue:"1984000000", numberOfTrades:2800, weekHigh52:"380.00", weekLow52:"240.00", isDemo:true, tradingDate:"", shariahStatus:null,        indexCodes:["KSE100"] },
  { symbol:"LUCK",   companyName:"Lucky Cement Ltd.",     sectorName:"Cement",                sectorId:3, close:"896.00", previousClose:"880.00", open:"882.00", high:"900.00", low:"879.00", priceChange:"16.00", percentageChange:"1.82",  volume:"1800000",  marketValue:"1612800000", numberOfTrades:1950, weekHigh52:"1050.00",weekLow52:"720.00", isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:["KSE100","KSE30"] },
  { symbol:"ENGRO",  companyName:"Engro Corporation",     sectorName:"Fertilizer",            sectorId:4, close:"285.00", previousClose:"280.00", open:"281.00", high:"287.00", low:"279.50", priceChange:"5.00",  percentageChange:"1.79",  volume:"4100000",  marketValue:"1168500000", numberOfTrades:2100, weekHigh52:"340.00", weekLow52:"210.00", isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:["KSE100","KSE30"] },
  { symbol:"HBL",    companyName:"Habib Bank Ltd.",       sectorName:"Commercial Banks",      sectorId:5, close:"175.00", previousClose:"172.00", open:"172.50", high:"176.50", low:"171.00", priceChange:"3.00",  percentageChange:"1.74",  volume:"9800000",  marketValue:"1715000000", numberOfTrades:4200, weekHigh52:"220.00", weekLow52:"140.00", isDemo:true, tradingDate:"", shariahStatus:null,        indexCodes:["KSE100","KSE30"] },
  { symbol:"MCB",    companyName:"MCB Bank Ltd.",         sectorName:"Commercial Banks",      sectorId:5, close:"225.00", previousClose:"221.00", open:"221.50", high:"226.00", low:"220.00", priceChange:"4.00",  percentageChange:"1.81",  volume:"5600000",  marketValue:"1260000000", numberOfTrades:2600, weekHigh52:"270.00", weekLow52:"175.00", isDemo:true, tradingDate:"", shariahStatus:null,        indexCodes:["KSE100","KSE30"] },
  { symbol:"UBL",    companyName:"United Bank Ltd.",      sectorName:"Commercial Banks",      sectorId:5, close:"195.00", previousClose:"192.00", open:"192.50", high:"196.50", low:"191.00", priceChange:"3.00",  percentageChange:"1.56",  volume:"7200000",  marketValue:"1404000000", numberOfTrades:3100, weekHigh52:"240.00", weekLow52:"155.00", isDemo:true, tradingDate:"", shariahStatus:null,        indexCodes:["KSE100"] },
  { symbol:"MARI",   companyName:"Mari Petroleum Co.",    sectorName:"Oil & Gas Exploration", sectorId:1, close:"2150.00",previousClose:"2100.00",open:"2105.00",high:"2165.00",low:"2098.00",priceChange:"50.00", percentageChange:"2.38",  volume:"420000",   marketValue:"903000000",  numberOfTrades:980,  weekHigh52:"2600.00",weekLow52:"1700.00",isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:["KSE100"] },
  { symbol:"EFERT",  companyName:"Engro Fertilizers",     sectorName:"Fertilizer",            sectorId:4, close:"110.00", previousClose:"107.50", open:"108.00", high:"111.00", low:"107.00", priceChange:"2.50",  percentageChange:"2.33",  volume:"11200000", marketValue:"1232000000", numberOfTrades:3800, weekHigh52:"135.00", weekLow52:"85.00",  isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:["KSE100"] },
  { symbol:"FCCL",   companyName:"Fauji Cement Co.",      sectorName:"Cement",                sectorId:3, close:"28.50",  previousClose:"27.80",  open:"27.90",  high:"28.80",  low:"27.70",  priceChange:"0.70",  percentageChange:"2.52",  volume:"18500000", marketValue:"527250000",  numberOfTrades:4200, weekHigh52:"38.00",  weekLow52:"20.00",  isDemo:true, tradingDate:"", shariahStatus:"compliant", indexCodes:["KSE100"] },
];

const CASH_SETTLED_FUTURES: StockRow[] = [
  { symbol:"KSE100-FUT", companyName:"KSE-100 Index Future",   sectorName:"Index Futures", sectorId:99, close:"180200.00",previousClose:"179500.00",open:"179600.00",high:"180500.00",low:"179400.00",priceChange:"700.00",  percentageChange:"0.39",  volume:"1250",     marketValue:"225250000",  numberOfTrades:420,  weekHigh52:"195000.00",weekLow52:"145000.00",isDemo:true, tradingDate:"", shariahStatus:null, indexCodes:[] },
  { symbol:"KMI30-FUT",  companyName:"KMI-30 Index Future",    sectorName:"Index Futures", sectorId:99, close:"253500.00",previousClose:"252800.00",open:"252900.00",high:"253900.00",low:"252700.00",priceChange:"700.00",  percentageChange:"0.28",  volume:"680",      marketValue:"172380000",  numberOfTrades:210,  weekHigh52:"275000.00",weekLow52:"200000.00",isDemo:true, tradingDate:"", shariahStatus:null, indexCodes:[] },
  { symbol:"OGDC-FUT",   companyName:"OGDC Cash Settled Future",sectorName:"Oil Futures",  sectorId:98, close:"144.00",  previousClose:"140.50",  open:"141.00",  high:"144.50",  low:"140.00",  priceChange:"3.50",   percentageChange:"2.49",  volume:"3200000",  marketValue:"460800000",  numberOfTrades:1200, weekHigh52:"168.00", weekLow52:"110.00", isDemo:true, tradingDate:"", shariahStatus:null, indexCodes:[] },
  { symbol:"HBL-FUT",    companyName:"HBL Cash Settled Future", sectorName:"Bank Futures",  sectorId:97, close:"177.00",  previousClose:"173.00",  open:"173.50",  high:"177.50",  low:"172.50",  priceChange:"4.00",   percentageChange:"2.31",  volume:"4800000",  marketValue:"849600000",  numberOfTrades:1800, weekHigh52:"225.00", weekLow52:"142.00", isDemo:true, tradingDate:"", shariahStatus:null, indexCodes:[] },
  { symbol:"ENGRO-FUT",  companyName:"Engro Cash Settled Future",sectorName:"Chem Futures", sectorId:96, close:"288.00",  previousClose:"282.00",  open:"282.50",  high:"289.00",  low:"281.00",  priceChange:"6.00",   percentageChange:"2.13",  volume:"2100000",  marketValue:"604800000",  numberOfTrades:980,  weekHigh52:"348.00", weekLow52:"215.00", isDemo:true, tradingDate:"", shariahStatus:null, indexCodes:[] },
];

const INDEX_OPTIONS = [
  { code: "",         label: "All Indices" },
  { code: "KSE100",  label: "KSE 100"     },
  { code: "KSE30",   label: "KSE 30"      },
  { code: "KMI30",   label: "KMI 30"      },
  { code: "KMIALL",  label: "KMI All Share"},
];

const SECTOR_ICONS: Record<string,string> = {
  "commercial bank":"🏦","bank":"🏦","oil & gas exploration":"⛽","oil & gas":"🛢️",
  "cement":"🏗️","fertilizer":"🌱","technology":"💻","telecom":"📡","communication":"📡",
  "power generation":"⚡","power":"⚡","electricity":"⚡","automobile":"🚗","auto":"🚗",
  "textile composite":"🧵","textile spinning":"🧶","textile":"🧵","pharmaceutical":"💊","pharma":"💊",
  "food":"🍽️","sugar":"🍬","chemical":"🧪","engineering":"⚙️","insurance":"🛡️",
  "refinery":"🏭","modaraba":"📊","paper":"📄","tobacco":"🚬","glass":"🪟",
  "ceramics":"🏺","cable":"🔌","electrical":"🔌","transport":"🚛","real estate":"🏘️",
  "investment":"💰","leasing":"📋","steel":"🔩","iron":"🔩","mining":"⛏️",
  "media":"📺","mutual fund":"📈","miscellaneous":"📦",
};
function getSectorIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(SECTOR_ICONS)) {
    if (lower.includes(key)) return emoji;
  }
  return "🏢";
}

const MKT_ITEMS: { label: string; mt: MarketType }[] = [
  { label:"Regular Market",               mt:"REGULAR MARKET" },
  { label:"Deliverable Futures Contract",  mt:"DELIVERABLE FUTURES CONTRACT" },
  { label:"Cash Settled Futures Contract", mt:"CASH SETTLED FUTURES CONTRACT" },
];

function MarketTypeTicker({ active, onChange }: { active: MarketType; onChange: (mt: MarketType) => void }) {
  const t = useDarkTokens();
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const scroll = (dir: "left"|"right") => scrollRef.current?.scrollBy({ left: dir==="right" ? 180 : -180, behavior:"smooth" });
  return (
    <div style={{ display:"flex", alignItems:"center", border:`1px solid ${t.border}`, borderRadius:8, overflow:"hidden", background:t.bgLight, marginBottom:14 }}>
      <style>{`
        @keyframes mktScroll { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .mkt-track { display:flex; animation:mktScroll 20s linear infinite; }
        .mkt-track.paused { animation-play-state:paused; }
      `}</style>
      <button onClick={() => scroll("left")} style={{ flexShrink:0, width:32, height:38, border:"none", background:"var(--navy)", color:"var(--gold)", fontSize:18, fontWeight:700, cursor:"pointer" }}>‹</button>
      <div ref={scrollRef} style={{ flex:1, overflow:"hidden" }}>
        <div ref={trackRef} className={`mkt-track${paused ? " paused" : ""}`}
          onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {[...MKT_ITEMS, ...MKT_ITEMS].map((item, i) => (
            <button key={i} onClick={() => onChange(item.mt)}
              style={{
                flexShrink:0, padding:"10px 24px", border:"none", borderRight:"1px solid #e5e7eb",
                background: active===item.mt ? "var(--navy)" : "transparent",
                color: active===item.mt ? "var(--gold)" : t.textSec,
                fontSize:11, fontWeight: active===item.mt ? 800 : 500,
                cursor:"pointer", whiteSpace:"nowrap", transition:"background 120ms,color 120ms",
              }}>{item.label}</button>
          ))}
        </div>
      </div>
      <button onClick={() => scroll("right")} style={{ flexShrink:0, width:32, height:38, border:"none", background:"var(--navy)", color:"var(--gold)", fontSize:18, fontWeight:700, cursor:"pointer" }}>›</button>
    </div>
  );
}

function pctColor(v: string|null): string {
  const n = parseFloat(v ?? "0");
  return isNaN(n) || n === 0 ? "#6b7280" : n > 0 ? "#16A34A" : "#DC2626";
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span style={{ display:"inline-flex", flexDirection:"column", marginLeft:3, verticalAlign:"middle", opacity: active ? 1 : 0.35 }}>
      <span style={{ fontSize:7, lineHeight:1, color: active && dir==="asc" ? "#16A34A" : "#9ca3af" }}>▲</span>
      <span style={{ fontSize:7, lineHeight:1, color: active && dir==="desc" ? "#16A34A" : "#9ca3af" }}>▼</span>
    </span>
  );
}

// ── In-memory cache so revisiting the page is instant ────────────────
let _cachedRows:    StockRow[]      = [];
let _cachedSectors: SectorOption[]  = [];
let _cachedDate:    string          = "";

// ── Main component ────────────────────────────────────────────────────
export default function StocksClient() {
  const t = useDarkTokens();
  const [allRows,  setAllRows]  = useState<StockRow[]>(_cachedRows);
  const [sectors,  setSectors]  = useState<SectorOption[]>(_cachedSectors);
  const [date,     setDate]     = useState(_cachedDate);
  const [loading,  setLoading]  = useState(_cachedRows.length === 0);
  const [error,    setError]    = useState("");

  // UI state
  const [board,       setBoard]       = useState<Board>("MAIN BOARD");
  const [marketType,  setMarketType]  = useState<MarketType>("REGULAR MARKET");
  const [indexCode,   setIndexCode]   = useState("");
  const [sectorId,    setSectorId]    = useState("");
  const [search,      setSearch]      = useState("");
  const [sortBy,      setSortBy]      = useState("symbol");
  const [sortDir,     setSortDir]     = useState<SortDir>("asc");
  const [pageSize,    setPageSize]    = useState(25);
  const [page,        setPage]        = useState(1);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (date) params.set("date", date);
      const res = await fetch(`/api/portal/stocks?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = json.rows ?? [];
      const secs = json.sectors ?? [];
      const d    = json.date ?? date;
      // update cache
      _cachedRows    = rows;
      _cachedSectors = secs;
      _cachedDate    = d;
      setAllRows(rows);
      setSectors(secs);
      if (!date && d) setDate(d);
    } catch {
      if (!silent) setError("Unable to load market data.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    // if we already have cached data, do a silent background refresh
    fetchData(_cachedRows.length > 0);
  }, [fetchData]);

  function handleSort(col: string) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
    setPage(1);
  }

  // debounced search for smooth instant feel
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 120);
    return () => clearTimeout(t);
  }, [search]);

  // Switch data source based on board + market type
  const activeRows = useMemo(() => {
    if (marketType === "DELIVERABLE FUTURES CONTRACT") return DELIVERABLE_FUTURES;
    if (marketType === "CASH SETTLED FUTURES CONTRACT") return CASH_SETTLED_FUTURES;
    if (board === "GEM BOARD") return GEM_BOARD_ROWS;
    if (board === "DEBT")      return DEBT_BOARD_ROWS;
    return allRows; // MAIN BOARD
  }, [marketType, board, allRows]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let out = activeRows;
    if (q) {
      // strip non-alphanumeric for fuzzy matching (handles hyphens, spaces, dots)
      const flatten = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const qFlat   = flatten(q);
      // also support multi-word: all words must appear somewhere in the row
      const words   = q.split(/\s+/).filter(Boolean);
      out = out.filter(r => {
        const sym  = r.symbol.toLowerCase();
        const name = (r.companyName ?? "").toLowerCase();
        const sec  = (r.sectorName  ?? "").toLowerCase();
        const symF  = flatten(r.symbol);
        const nameF = flatten(r.companyName ?? "");
        // exact substring match
        if (sym.includes(q) || name.includes(q) || sec.includes(q)) return true;
        // flattened match (removes hyphens/spaces — "pakqatar" → "pak-qatar")
        if (symF.includes(qFlat) || nameF.includes(qFlat)) return true;
        // all-words match: every word appears in name or symbol
        if (words.length > 1 && words.every(w => name.includes(w) || sym.includes(w) || sec.includes(w))) return true;
        return false;
      });
    }
    if (sectorId && marketType === "REGULAR MARKET") out = out.filter(r =>
      String(r.sectorId) === sectorId ||
      (r.sectorName && sectors.find(s => s.id === Number(sectorId))?.name === r.sectorName)
    );
    if (indexCode) out = out.filter(r => r.indexCodes?.includes(indexCode) ?? true);
    return [...out].sort((a, b) => {
      const av = a[sortBy as keyof StockRow] ?? "";
      const bv = b[sortBy as keyof StockRow] ?? "";
      const an = parseFloat(String(av)), bn = parseFloat(String(bv));
      const cmp = !isNaN(an) && !isNaN(bn) ? an - bn : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [activeRows, debouncedSearch, marketType, board, sectorId, indexCode, sortBy, sortDir, sectors]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = useMemo(() => filtered.slice((page-1)*pageSize, page*pageSize), [filtered, page, pageSize]);

  const vis = useMemo(() => ({
    adv: filtered.filter(r => parseFloat(r.percentageChange ?? "0") > 0).length,
    dec: filtered.filter(r => parseFloat(r.percentageChange ?? "0") < 0).length,
    unc: filtered.filter(r => parseFloat(r.percentageChange ?? "0") === 0).length,
    vol: filtered.reduce((s,r) => s + parseFloat(r.volume ?? "0"), 0),
  }), [filtered]);

  const TH = ({ col, label }: { col: string; label: string }) => (
    <th onClick={() => handleSort(col)}
      style={{
        padding:"10px 12px", textAlign:"right", whiteSpace:"nowrap",
        fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em",
        color:t.textSec, background:t.tableTh, borderBottom:`2px solid ${t.border}`,
        cursor:"pointer", userSelect:"none",
      }}>
      {label}<SortIcon active={sortBy===col} dir={sortDir}/>
    </th>
  );

  return (
    <div style={{ padding:"16px 20px", fontFamily:"inherit" }}>

      {/* ── Header row ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:t.text, margin:0 }}>Market Watch</h1>
        <div style={{ display:"flex", gap:0, borderRadius:4, overflow:"hidden", border:`1px solid ${t.border}` }}>
          {(["MAIN BOARD","GEM BOARD","DEBT"] as Board[]).map(b => (
            <button key={b} onClick={() => setBoard(b)}
              style={{
                padding:"7px 14px", border:"none", cursor:"pointer", fontSize:11, fontWeight:700,
                background: board===b ? t.text : t.bg,
                color:      board===b ? (t.dark ? "#0B1622" : "#fff") : t.textSec,
                borderRight: b !== "DEBT" ? `1px solid ${t.border}` : "none",
                transition:"all 120ms",
              }}>{b}</button>
          ))}
        </div>
      </div>

      {/* ── Indices strip ── */}
      <div className="indices-strip" style={{ marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"stretch", gap:0, background:t.bg, borderRadius:7, overflow:"hidden" }}>
          {[
            { label:"KSE-100", val:180034.85, chg:-1275.43, pct:-0.69, vol:"322.0M" },
            { label:"KSE-30",  val:53634.04,  chg:-371.83,  pct:-0.69, vol:"185.4M" },
            { label:"KSE ALL", val:108875.40, chg:-526.92,  pct:-0.46, vol:"412.0M" },
            { label:"KMI-30",  val:253345.18, chg:-2380.01, pct:-0.94, vol:"97.2M"  },
            { label:"KMI ALL", val:69720.49,  chg:-401.21,  pct:-0.56, vol:"75.2M"  },
          ].map((ix, i) => {
            const up  = ix.chg >= 0;
            const col = up ? "#16A34A" : "#DC2626";
            return (
              <div key={i} style={{ flex:1, padding:"10px 14px", borderRight: i<4 ? `1px solid ${t.border}` : "none", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, textAlign:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:"var(--navy)" }}>{ix.label}</span>
                  <span style={{ fontSize:8, fontWeight:700, color:"#16A34A", background:"#dcfce7", borderRadius:3, padding:"1px 4px" }}>LIVE</span>
                </div>
                <div style={{ fontSize:12, fontWeight:800, color:t.text, fontVariantNumeric:"tabular-nums" }}>
                  {ix.val.toLocaleString("en-PK", { minimumFractionDigits:2 })}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ fontSize:9, fontWeight:700, color:col }}>
                    {up?"▲":"▼"} {Math.abs(ix.chg).toLocaleString("en-PK",{minimumFractionDigits:2})}
                  </span>
                  <span style={{ fontSize:9, fontWeight:600, color:col }}>({ix.pct.toFixed(2)}%)</span>
                </div>
                <div style={{ fontSize:8, color:t.textMuted }}>Vol: {ix.vol}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Filter by ── */}
      <style>{`
        .indices-strip {
          position: relative;
          border-radius: 8px;
          padding: 1.5px;
          background: linear-gradient(90deg, transparent 0%, #D4971A 25%, #F5D87A 50%, #D4971A 75%, transparent 100%);
          background-size: 300% 100%;
          animation: indicesGoldLine 2s linear infinite;
        }
        @keyframes indicesGoldLine {
          0%   { background-position: 100% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes borderSlide {
          0%   { top: -100%; }
          100% { top: 200%; }
        }
        .filter-box {
          position: relative;
          overflow: hidden;
        }
        .filter-box::before,
        .filter-box::after {
          content: "";
          position: absolute;
          width: 2px;
          height: 50%;
          pointer-events: none;
        }
        .filter-box::before {
          left: 0;
          top: -100%;
          background: linear-gradient(to bottom, transparent, var(--gold), transparent);
          animation: borderSlide 2.2s linear infinite;
        }
        .filter-box::after {
          right: 0;
          top: -100%;
          background: linear-gradient(to bottom, transparent, var(--navy), transparent);
          animation: borderSlide 2.2s linear infinite 1.1s;
        }
      `}</style>
      <motion.div
        className="filter-box"
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: t.bg,
          border: `1px solid ${t.border}`,
          borderRadius: 10,
          padding: "10px 16px",
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 8, letterSpacing: "0.01em" }}>
          Filter by
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between" }}>
          {/* Left: filters */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Sector</label>
              <select value={sectorId} onChange={e => { setSectorId(e.target.value); setPage(1); }}
                style={{ padding: "7px 28px 7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, color: "var(--text-primary)", background: t.inputBg, minWidth: 180, cursor: "pointer", outline: "none", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "var(--gold)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              >
                <option value="">Select...</option>
                {sectors.map(s => (
                  <option key={s.id} value={String(s.id)}>{getSectorIcon(s.name)} {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Index</label>
              <select value={indexCode} onChange={e => { setIndexCode(e.target.value); setPage(1); }}
                style={{ padding: "7px 28px 7px 10px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 12, color: "var(--text-primary)", background: t.inputBg, minWidth: 180, cursor: "pointer", outline: "none", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "var(--gold)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              >
                {INDEX_OPTIONS.map(o => (
                  <option key={o.code} value={o.code}>{o.label}</option>
                ))}
              </select>
            </div>
            <AnimatePresence>
              {(sectorId || indexCode) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.2 }}
                >
                  <button onClick={() => { setSectorId(""); setIndexCode(""); setPage(1); }}
                    style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fef2f2", color: "#DC2626", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fee2e2")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#fef2f2")}
                  >
                    ✕ Clear Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: market breadth summary */}
          {(() => {
            const advances  = filtered.filter(r => parseFloat(r.priceChange ?? "0") > 0).length;
            const declines  = filtered.filter(r => parseFloat(r.priceChange ?? "0") < 0).length;
            const unchanged = filtered.filter(r => parseFloat(r.priceChange ?? "0") === 0).length;
            const total     = filtered.length;
            const advPct    = total ? Math.round((advances / total) * 100) : 0;
            return (
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, marginBottom: 2 }}>Market Breadth</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {[
                    { label: "Advances",  val: advances,  color: "#16a34a", bg: t.dark ? "rgba(22,163,74,0.12)" : "#f0fdf4" },
                    { label: "Declines",  val: declines,  color: "#dc2626", bg: t.dark ? "rgba(220,38,38,0.12)" : "#fef2f2" },
                    { label: "Unchanged", val: unchanged, color: t.textMuted, bg: t.dark ? "rgba(255,255,255,0.05)" : "#f8f8f8" },
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", background: item.bg, borderRadius: 6, padding: "5px 12px", minWidth: 60 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: item.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{item.val}</span>
                      <span style={{ fontSize: 9, color: t.textMuted, marginTop: 2, fontWeight: 600 }}>{item.label}</span>
                    </div>
                  ))}
                  {/* advance/decline bar */}
                  <div style={{ width: 90, display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ height: 6, borderRadius: 3, overflow: "hidden", background: t.dark ? "rgba(220,38,38,0.25)" : "#fecaca", display: "flex" }}>
                      <div style={{ width: `${advPct}%`, background: "#16a34a", borderRadius: 3, transition: "width 0.5s ease" }} />
                    </div>
                    <span style={{ fontSize: 9, color: t.textMuted, textAlign: "center" }}>{advPct}% up</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </motion.div>

      {/* ── Show entries + Search ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:t.textSec }}>
          Show
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            style={{ padding:"4px 8px", borderRadius:4, border:`1px solid ${t.border}`, fontSize:12, background:t.inputBg, color:t.text }}>
            {[10,25,50,100,99999].map(n => <option key={n} value={n}>{n === 99999 ? "All" : n}</option>)}
          </select>
          entries
          {!loading && (
            <span style={{ marginLeft:8, color:t.textMuted }}>
              — showing <strong>{(page-1)*pageSize+1}–{Math.min(page*pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong>
            </span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:12, color:t.textSec }}>Search:</span>
          <div style={{ position:"relative" }}>
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Symbol, company…"
              style={{
                padding:"6px 30px 6px 10px", borderRadius:4,
                border:`1.5px solid ${search ? "#16A34A" : "#d1d5db"}`,
                fontSize:12, width:200, outline:"none",
                boxShadow: search ? "0 0 0 2px rgba(22,163,74,0.15)" : "none",
                transition:"all 150ms",
              }} />
            {search && (
              <button onClick={() => setSearch("")}
                style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#9ca3af", fontSize:12 }}>✕</button>
            )}
          </div>
          <a href={`/api/portal/daily/export?date=${date}&format=csv`}
            style={{ padding:"6px 12px", borderRadius:4, border:"1px solid #d1d5db", fontSize:11, color:"#374151", textDecoration:"none", fontWeight:600 }}>
            ⬇ CSV
          </a>
        </div>
      </div>

      {/* ── Breadth bar ── */}
      {!loading && filtered.length > 0 && (
        <div style={{ display:"flex", gap:16, marginBottom:10, fontSize:11 }}>
          <span style={{ color:"#16A34A", fontWeight:700 }}>▲ {vis.adv} Advances</span>
          <span style={{ color:"#DC2626", fontWeight:700 }}>▼ {vis.dec} Declines</span>
          <span style={{ color:"#6b7280" }}>— {vis.unc} Unchanged</span>
          <span style={{ color:t.textSec }}>Vol: <strong>{formatVolume(vis.vol)}</strong></span>
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ background:t.bg, border:`1px solid ${t.border}`, borderRadius:6, overflow:"hidden", boxShadow:t.cardShadow }}>
        {error && (
          <div style={{ padding:24, textAlign:"center", color:"#DC2626" }}>
            ⚠ {error} <button onClick={() => fetchData()} style={{ marginLeft:8, padding:"3px 10px", border:"1px solid #d1d5db", borderRadius:4, cursor:"pointer", fontSize:12 }}>Retry</button>
          </div>
        )}

        {!error && loading && (
          <div style={{ padding:20 }}>
            {Array.from({length:12}).map((_,i) => (
              <div key={i} style={{ display:"flex", gap:12, marginBottom:10, opacity: 1-(i*0.06) }}>
                {[60,120,180,70,70,70,70,80,80].map((w,j) => (
                  <div key={j} style={{ height:12, width:w, borderRadius:4, background:t.border, animation:"pulse 1.5s ease-in-out infinite", animationDelay:`${j*80}ms` }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {!error && !loading && filtered.length === 0 && (
          <div style={{ padding:60, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📊</div>
            <p style={{ fontWeight:600, color:t.text }}>No stocks found</p>
            <p style={{ fontSize:12, color:t.textMuted, marginTop:4 }}>{search ? "Try a different search term" : "No data for selected filters"}</p>
          </div>
        )}

        {!error && !loading && rows.length > 0 && (
          <div style={{ overflowX:"auto" }}>
            <table style={{ borderCollapse:"collapse", fontSize:12, minWidth:980, width:"100%" }}>
              <thead>
                <tr>
                  <th style={{ padding:"10px 12px", textAlign:"center", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color:t.textSec, background:t.tableTh, borderBottom:`2px solid ${t.border}`, width:36 }}>#</th>
                  <th onClick={() => handleSort("symbol")} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color:t.textSec, background:t.tableTh, borderBottom:`2px solid ${t.border}`, cursor:"pointer", whiteSpace:"nowrap" }}>
                    SYMBOL<SortIcon active={sortBy==="symbol"} dir={sortDir}/>
                  </th>
                  <th style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color:t.textSec, background:t.tableTh, borderBottom:`2px solid ${t.border}`, minWidth:140 }}>COMPANY</th>
                  <th style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", color:t.textSec, background:t.tableTh, borderBottom:`2px solid ${t.border}`, minWidth:120 }}>SECTOR</th>
                  <TH col="previousClose"    label="LDCP"      />
                  <TH col="open"             label="OPEN"      />
                  <TH col="high"             label="HIGH"      />
                  <TH col="low"              label="LOW"       />
                  <TH col="close"            label="CURRENT"   />
                  <TH col="priceChange"      label="CHANGE"    />
                  <TH col="percentageChange" label="CHANGE %"  />
                  <TH col="volume"           label="VOLUME"    />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {rows.map((row, i) => {
                    const pct = parseFloat(row.percentageChange ?? "");
                    const pos = !isNaN(pct) && pct > 0;
                    const neg = !isNaN(pct) && pct < 0;
                    const chgColor = pctColor(row.percentageChange);
                    return (
                      <motion.tr key={row.symbol}
                        initial={{ opacity:0, y:4 }}
                        animate={{ opacity:1, y:0 }}
                        transition={{ delay: Math.min(i*0.015, 0.3), duration:0.2 }}
                        style={{ borderBottom:`1px solid ${t.border}`, cursor:"default" }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background=t.bgHover}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=""}
                      >
                        <td style={{ padding:"9px 12px", textAlign:"center", color:t.textMuted, fontSize:10, fontVariantNumeric:"tabular-nums" }}>{(page-1)*pageSize+i+1}</td>
                        <td style={{ padding:"9px 12px" }}>
                          <Link href={`/dashboard/company/${row.symbol}`}
                            style={{ fontWeight:800, color:t.text, fontFamily:"monospace", fontSize:12, letterSpacing:"0.04em", textDecoration:"none" }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color="#16A34A"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color=t.text}>
                            {row.symbol}
                          </Link>
                          {row.shariahStatus === "compliant" && (
                            <span style={{ marginLeft:4, fontSize:8, fontWeight:700, padding:"1px 4px", borderRadius:3, background:"#D1FAE5", color:"#065F46", verticalAlign:"middle" }}>SC</span>
                          )}
                        </td>
                        <td style={{ padding:"9px 12px", color:t.textSec, maxWidth:140 }}>
                          <span style={{ display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:11 }} title={row.companyName ?? ""}>{row.companyName ?? "—"}</span>
                        </td>
                        <td style={{ padding:"9px 12px" }}>
                          {row.sectorName ? (
                            <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                              <span style={{ fontSize:12 }}>{getSectorIcon(row.sectorName)}</span>
                              <span style={{ color:t.textMuted, fontSize:10 }}>{row.sectorName}</span>
                            </span>
                          ) : <span style={{ color:t.border }}>—</span>}
                        </td>
                        <td style={{ padding:"9px 12px", textAlign:"right", color:t.textSec, fontVariantNumeric:"tabular-nums" }}>{formatNumber(row.previousClose)}</td>
                        <td style={{ padding:"9px 12px", textAlign:"right", color:t.textSec, fontVariantNumeric:"tabular-nums" }}>{formatNumber(row.open)}</td>
                        <td style={{ padding:"9px 12px", textAlign:"right", color:"#16A34A", fontWeight:600, fontVariantNumeric:"tabular-nums" }}>{formatNumber(row.high)}</td>
                        <td style={{ padding:"9px 12px", textAlign:"right", color:"#DC2626", fontWeight:600, fontVariantNumeric:"tabular-nums" }}>{formatNumber(row.low)}</td>
                        <td style={{ padding:"9px 12px", textAlign:"right", fontWeight:700, color:t.text, fontVariantNumeric:"tabular-nums" }}>{formatNumber(row.close)}</td>
                        <td style={{ padding:"9px 12px", textAlign:"right", fontWeight:700, color:chgColor, fontVariantNumeric:"tabular-nums" }}>
                          {pos ? "▲" : neg ? "▼" : ""} {row.priceChange ? Math.abs(parseFloat(row.priceChange)).toFixed(2) : "—"}
                        </td>
                        <td style={{ padding:"9px 12px", textAlign:"right", fontWeight:700, color:chgColor, fontVariantNumeric:"tabular-nums" }}>
                          {pos ? "▲" : neg ? "▼" : ""} {row.percentageChange ? Math.abs(parseFloat(row.percentageChange)).toFixed(2) + "%" : "—"}
                        </td>
                        <td style={{ padding:"9px 12px", textAlign:"right", color:t.textSec, fontVariantNumeric:"tabular-nums" }}>{formatVolume(row.volume)}</td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && filtered.length > pageSize && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", borderTop:`1px solid ${t.border}`, background:t.tableTh }}>
            <span style={{ fontSize:11, color:t.textMuted }}>
              Showing {(page-1)*pageSize+1}–{Math.min(page*pageSize, filtered.length)} of {filtered.length} entries
            </span>
            <div style={{ display:"flex", gap:4 }}>
              <button onClick={() => setPage(1)} disabled={page===1}
                style={{ padding:"4px 8px", borderRadius:4, border:`1px solid ${t.border}`, fontSize:11, cursor:page===1?"not-allowed":"pointer", background:page===1?t.tableTh:t.bg, color:page===1?t.border:t.textSec }}>«</button>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                style={{ padding:"4px 10px", borderRadius:4, border:`1px solid ${t.border}`, fontSize:11, cursor:page===1?"not-allowed":"pointer", background:page===1?t.tableTh:t.bg, color:page===1?t.border:t.textSec }}>Previous</button>
              {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
                const pg = Math.max(1,Math.min(totalPages-4,page-2))+i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    style={{ padding:"4px 10px", borderRadius:4, border:"1px solid", fontSize:11, cursor:"pointer",
                      borderColor: pg===page ? "#16A34A" : t.border,
                      background:  pg===page ? "#16A34A" : t.bg,
                      color:       pg===page ? "#fff"    : t.textSec,
                      fontWeight:  pg===page ? 700 : 400,
                    }}>{pg}</button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                style={{ padding:"4px 10px", borderRadius:4, border:"1px solid #d1d5db", fontSize:11, cursor:page===totalPages?"not-allowed":"pointer", background:page===totalPages?t.tableTh:t.bg, color:page===totalPages?t.border:t.textSec }}>Next</button>
              <button onClick={() => setPage(totalPages)} disabled={page===totalPages}
                style={{ padding:"4px 8px", borderRadius:4, border:`1px solid ${t.border}`, fontSize:11, cursor:page===totalPages?"not-allowed":"pointer", background:page===totalPages?t.tableTh:t.bg, color:page===totalPages?t.border:t.textSec }}>»</button>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        {!loading && !error && rows.length > 0 && (
          <div style={{ padding:"10px 16px", borderTop:`1px solid ${t.border}`, background:t.tableTh }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:4, background:"var(--navy,#071C41)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#D4971A" strokeWidth="2" width="20" height="20">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div style={{ fontSize:11, color:t.textMuted, lineHeight:1.6 }}>
                <div>Data delayed 5 minutes unless otherwise indicated.</div>
                <div>Data powered by <strong style={{ color:"var(--navy,#071C41)" }}>Stockifyy</strong>. Trading Date: <strong>{date}</strong></div>
              </div>
              <Link href="/dashboard/daily" style={{ marginLeft:"auto", fontSize:11, color:"#16A34A", textDecoration:"none", fontWeight:600 }}>Daily Market Data →</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
