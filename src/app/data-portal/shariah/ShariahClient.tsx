"use client";
import { useState, useEffect, useRef } from "react";

/* ── Config ─────────────────────────────────────────────── */
const SECTOR_CFG: Record<string, { color: string; bg: string; dark: string; icon: string }> = {
  "Oil & Gas":       { color: "#92400E", bg: "#FEF3C7", dark: "#B45309", icon: "⛽" },
  "Cement":          { color: "#1E40AF", bg: "#DBEAFE", dark: "#1D4ED8", icon: "🏗" },
  "Fertilizer":      { color: "#065F46", bg: "#D1FAE5", dark: "#047857", icon: "🌿" },
  "Power":           { color: "#6D28D9", bg: "#EDE9FE", dark: "#7C3AED", icon: "⚡" },
  "Technology":      { color: "#0E7490", bg: "#CFFAFE", dark: "#0891B2", icon: "💻" },
  "Islamic Banking": { color: "#166534", bg: "#DCFCE7", dark: "#15803D", icon: "🕌" },
  "Pharma":          { color: "#9D174D", bg: "#FCE7F3", dark: "#BE185D", icon: "💊" },
  "Food & FMCG":     { color: "#78350F", bg: "#FEF9C3", dark: "#92400E", icon: "🌾" },
  "Textile":         { color: "#1D4ED8", bg: "var(--row-hover)", dark: "#1E40AF", icon: "🧵" },
  "Chemicals":       { color: "#064E3B", bg: "#ECFDF5", dark: "#065F46", icon: "🔬" },
  "Auto":            { color: "#1E3A5F", bg: "#E0F2FE", dark: "#0369A1", icon: "🚗" },
  "Engineering":     { color: "#78350F", bg: "#FEF3C7", dark: "#92400E", icon: "⚙️" },
};

const COMPANIES = [
  { symbol: "OGDC",   name: "Oil & Gas Development Co. Ltd",      sector: "Oil & Gas",       mcap: "612B", price: "142.30", pct: 4.82,  kmi: true  },
  { symbol: "PPL",    name: "Pakistan Petroleum Limited",          sector: "Oil & Gas",       mcap: "218B", price: "98.45",  pct: 1.20,  kmi: true  },
  { symbol: "MARI",   name: "Mari Petroleum Company Limited",      sector: "Oil & Gas",       mcap: "251B", price: "2,145", pct: 2.41,  kmi: true  },
  { symbol: "PSO",    name: "Pakistan State Oil Company Ltd",      sector: "Oil & Gas",       mcap: "144B", price: "318.75",pct: 3.91,  kmi: true  },
  { symbol: "SNGP",   name: "Sui Northern Gas Pipelines Ltd",      sector: "Oil & Gas",       mcap: "48B",  price: "62.10",  pct:-0.45, kmi: false },
  { symbol: "SSGC",   name: "Sui Southern Gas Company Ltd",        sector: "Oil & Gas",       mcap: "22B",  price: "28.80",  pct: 0.70, kmi: false },
  { symbol: "LUCK",   name: "Lucky Cement Limited",                sector: "Cement",          mcap: "292B", price: "894.20", pct: 3.15,  kmi: true  },
  { symbol: "MLCF",   name: "Maple Leaf Cement Factory Ltd",       sector: "Cement",          mcap: "49B",  price: "41.80",  pct:-3.22, kmi: false },
  { symbol: "PIOC",   name: "Pioneer Cement Limited",              sector: "Cement",          mcap: "38B",  price: "68.25",  pct:-2.87, kmi: false },
  { symbol: "DGKC",   name: "D.G. Khan Cement Company Ltd",        sector: "Cement",          mcap: "55B",  price: "92.40",  pct: 0.55,  kmi: true  },
  { symbol: "CHCC",   name: "Cherat Cement Company Limited",       sector: "Cement",          mcap: "32B",  price: "157.30", pct:-1.62, kmi: false },
  { symbol: "ACPL",   name: "Attock Cement (Pakistan) Limited",    sector: "Cement",          mcap: "29B",  price: "178.50", pct: 1.10,  kmi: false },
  { symbol: "FCCL",   name: "Fauji Cement Company Limited",        sector: "Cement",          mcap: "44B",  price: "33.45",  pct:-1.98, kmi: false },
  { symbol: "FFC",    name: "Fauji Fertilizer Company Limited",    sector: "Fertilizer",      mcap: "154B", price: "120.40", pct: 1.35,  kmi: true  },
  { symbol: "EFERT",  name: "Engro Fertilizers Limited",           sector: "Fertilizer",      mcap: "89B",  price: "109.60", pct: 2.74,  kmi: true  },
  { symbol: "FATIMA", name: "Fatima Fertilizer Company Limited",   sector: "Fertilizer",      mcap: "78B",  price: "38.20",  pct: 0.90,  kmi: true  },
  { symbol: "NCPL",   name: "Nishat Chunian Power Ltd",            sector: "Fertilizer",      mcap: "18B",  price: "24.55",  pct:-0.20, kmi: false },
  { symbol: "HUBC",   name: "Hub Power Company Limited",           sector: "Power",           mcap: "142B", price: "148.60", pct: 0.68,  kmi: true  },
  { symbol: "KAPCO",  name: "Kot Addu Power Company Limited",      sector: "Power",           mcap: "42B",  price: "64.20",  pct: 1.42,  kmi: false },
  { symbol: "NPWL",   name: "Nishat Power Limited",                sector: "Power",           mcap: "19B",  price: "29.80",  pct:-0.33, kmi: false },
  { symbol: "TRG",    name: "TRG Pakistan Limited",                sector: "Technology",      mcap: "62B",  price: "92.40",  pct: 1.26,  kmi: true  },
  { symbol: "SYS",    name: "Systems Limited",                     sector: "Technology",      mcap: "78B",  price: "482.00", pct: 2.10,  kmi: true  },
  { symbol: "NETSOL", name: "NetSol Technologies Limited",         sector: "Technology",      mcap: "18B",  price: "148.20", pct: 0.80,  kmi: false },
  { symbol: "MEBL",   name: "Meezan Bank Limited",                 sector: "Islamic Banking", mcap: "384B", price: "248.50", pct: 1.88,  kmi: true  },
  { symbol: "BAHL",   name: "Bank AL Habib Limited",               sector: "Islamic Banking", mcap: "89B",  price: "82.40",  pct: 0.73,  kmi: false },
  { symbol: "SILK",   name: "Silkbank Limited",                    sector: "Islamic Banking", mcap: "12B",  price: "8.25",   pct:-1.20, kmi: false },
  { symbol: "SEARL",  name: "The Searle Company Limited",          sector: "Pharma",          mcap: "32B",  price: "144.80", pct: 1.95,  kmi: false },
  { symbol: "HISL",   name: "Highnoon Laboratories Limited",       sector: "Pharma",          mcap: "22B",  price: "1,248", pct: 0.60,  kmi: false },
  { symbol: "UNITY",  name: "Unity Foods Limited",                 sector: "Food & FMCG",     mcap: "44B",  price: "28.60",  pct: 2.41,  kmi: false },
  { symbol: "QUICE",  name: "Quice Food Industries Limited",       sector: "Food & FMCG",     mcap: "9B",   price: "18.45",  pct: 1.10,  kmi: false },
  { symbol: "NML",    name: "Nishat Mills Limited",                sector: "Textile",         mcap: "62B",  price: "112.80", pct: 0.35,  kmi: true  },
  { symbol: "GATM",   name: "Gul Ahmed Textile Mills Ltd",         sector: "Textile",         mcap: "28B",  price: "42.60",  pct:-0.70, kmi: false },
  { symbol: "NCL",    name: "Nishat (Chunian) Limited",            sector: "Textile",         mcap: "18B",  price: "48.20",  pct: 0.90,  kmi: false },
  { symbol: "ENGRO",  name: "Engro Corporation Limited",           sector: "Chemicals",       mcap: "218B", price: "287.60", pct: 1.48,  kmi: true  },
  { symbol: "ICI",    name: "ICI Pakistan Limited",                sector: "Chemicals",       mcap: "44B",  price: "924.00", pct: 0.80,  kmi: false },
  { symbol: "INDU",   name: "Indus Motor Company Limited",         sector: "Auto",            mcap: "112B", price: "1,424", pct: 1.20,  kmi: true  },
  { symbol: "HCAR",   name: "Honda Atlas Cars Pakistan Ltd",       sector: "Auto",            mcap: "48B",  price: "448.50", pct:-0.44, kmi: false },
  { symbol: "PSMC",   name: "Pak Suzuki Motor Co. Limited",        sector: "Auto",            mcap: "28B",  price: "248.00", pct: 0.68,  kmi: false },
  { symbol: "ASTL",   name: "Aisha Steel Mills Limited",           sector: "Engineering",     mcap: "22B",  price: "28.40",  pct:-1.10, kmi: false },
  { symbol: "ABOT",   name: "Abbott Laboratories Pakistan Ltd",    sector: "Engineering",     mcap: "62B",  price: "884.00", pct: 0.42,  kmi: false },
];

const SECTORS = Object.keys(SECTOR_CFG);

/* ── Animation Hook ────────────────────────────────────── */
function useFade(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, vis };
}

function Fade({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, vis } = useFade();
  return (
    <div ref={ref} className={className} style={{ transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`, opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(28px)" }}>
      {children}
    </div>
  );
}

/* ── Main ──────────────────────────────────────────────── */
export default function ShariahClient() {
  const [search, setSearch] = useState("");
  const [activeSector, setActiveSector] = useState("All");
  const [kmiOnly, setKmiOnly] = useState(false);
  const [view, setView] = useState<"cards" | "table">("cards");

  const kmiCount = COMPANIES.filter(c => c.kmi).length;

  const filtered = COMPANIES.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = q === "" || c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
    const matchSector = activeSector === "All" || c.sector === activeSector;
    return matchSearch && matchSector && (!kmiOnly || c.kmi);
  });

  return (
    <div>


      {/* ── HEADER ───────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pt-5 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🕌</span>
            <span style={{ color: "var(--text-primary)" }}>Shariah Compliant </span><span style={{ color: "#D4971A" }}>Equities</span>
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {COMPANIES.length} screened stocks · {kmiCount} KMI-30 · SECP certified
          </p>
        </div>
      </div>

      {/* ── FILTERS ──────────────────────────────────── */}
      <Fade>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 min-w-0 w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>🔍</span>
              <input type="text" placeholder="Search symbol or company…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}/>
            </div>
            <button onClick={() => setKmiOnly(!kmiOnly)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all shrink-0"
              style={{ background: kmiOnly ? "#D1FAE5" : "transparent", borderColor: kmiOnly ? "#065F46" : "var(--border)", color: kmiOnly ? "#065F46" : "var(--text-secondary)" }}>
              ☪ KMI-30 Only
            </button>
            <div className="flex rounded-lg border overflow-hidden shrink-0" style={{ borderColor: "var(--border)" }}>
              {(["cards","table"] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className="px-3 py-2 text-xs sm:text-sm transition-colors capitalize"
                  style={{ background: view === v ? "var(--navy)" : "transparent", color: view === v ? "white" : "var(--text-muted)" }}>
                  {v === "cards" ? "⊞ Cards" : "☰ Table"}
                </button>
              ))}
            </div>
            <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>{filtered.length} stocks</span>
          </div>

          {/* Sector pills */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
            <button onClick={() => setActiveSector("All")}
              className="text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium transition-all"
              style={{ background: activeSector === "All" ? "var(--navy)" : "var(--light-bg)", color: activeSector === "All" ? "white" : "var(--text-muted)", border: "1px solid var(--border)" }}>
              All
            </button>
            {SECTORS.map(sec => {
              const cfg = SECTOR_CFG[sec]; const active = activeSector === sec;
              return (
                <button key={sec} onClick={() => setActiveSector(active ? "All" : sec)}
                  className="text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium transition-all"
                  style={{ background: active ? cfg.dark : cfg.bg, color: active ? "white" : cfg.color, border: `1px solid ${cfg.color}33` }}>
                  {cfg.icon} <span className="hidden sm:inline">{sec}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Fade>

      {/* ── CONTENT ──────────────────────────────────── */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pb-10">
        {filtered.length === 0 ? (
          <div className="card p-10 text-center" style={{ color: "var(--text-muted)" }}>
            <div className="text-3xl mb-2">🔍</div>
            <p className="font-medium">No companies found</p>
            <p className="text-xs mt-1">Adjust your search or filters</p>
          </div>
        ) : view === "cards" ? (
          (activeSector === "All" ? SECTORS : [activeSector]).map(sector => {
            const cos = filtered.filter(c => c.sector === sector);
            if (!cos.length) return null;
            const cfg = SECTOR_CFG[sector];
            return (
              <Fade key={sector}>
                <div className="mb-6 sm:mb-8">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: cfg.bg }}>{cfg.icon}</div>
                    <h2 className="font-bold tracking-wide text-xs sm:text-sm uppercase" style={{ color: cfg.dark }}>{sector}</h2>
                    <div className="flex-1 h-px" style={{ background: `${cfg.dark}22` }}/>
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: cfg.bg, color: cfg.color }}>{cos.length}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {cos.map((co, i) => {
                      const up = co.pct >= 0;
                      return (
                        <div key={co.symbol}
                          className="card p-4 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                          style={{ borderTop: `3px solid ${cfg.dark}`, animation: `cardPop 0.45s ease both ${i * 60}ms` }}>
                          {co.kmi && (
                            <div className="absolute top-0 right-0">
                              <div className="text-[10px] font-bold px-2 py-0.5 rounded-bl-lg" style={{ background: "linear-gradient(135deg,#B8860B,#E8C84A)", color: "#07111F" }}>☪ KMI-30</div>
                            </div>
                          )}
                          <div className="mb-3 pr-14">
                            <div className="text-base sm:text-lg font-black" style={{ color: "var(--navy)" }}>{co.symbol}</div>
                            <div className="text-[10px] sm:text-xs leading-snug mt-0.5" style={{ color: "var(--text-muted)" }}>{co.name}</div>
                          </div>
                          <div className="flex items-end justify-between">
                            <div>
                              <div className="text-lg sm:text-xl font-bold tabular-nums" style={{ color: "var(--navy)" }}>{co.price}</div>
                              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>PKR / share</div>
                            </div>
                            <div className="text-sm font-bold px-2 py-0.5 rounded" style={{ background: up ? "#D1FAE5" : "#FEE2E2", color: up ? "#065F46" : "#991B1B" }}>
                              {up ? "▲" : "▼"} {Math.abs(co.pct).toFixed(2)}%
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-2.5 border-t" style={{ borderColor: "var(--border)" }}>
                            <span className="text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>Mkt Cap: PKR {co.mcap}</span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "#D1FAE5", color: "#065F46" }}>✓ Halal</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Fade>
            );
          })
        ) : (
          <Fade>
            <div className="card overflow-hidden">
              <div className="table-scroll">
                <table className="w-full text-sm" style={{ borderCollapse: "collapse", minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: "var(--navy)" }}>
                      {["Symbol","Company","Sector","Price (PKR)","Change","Mkt Cap","Status"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "rgba(255,255,255,0.7)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((co, i) => {
                      const up = co.pct >= 0; const cfg = SECTOR_CFG[co.sector];
                      return (
                        <tr key={co.symbol} style={{ animation: `cardPop 0.4s ease both ${i * 30}ms`, background: i % 2 === 0 ? "white" : "#F8F8F8" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#F0FDF4")}
                          onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "white" : "#F8F8F8")}>
                          <td className="px-4 py-2.5 border-b font-black whitespace-nowrap" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
                            {co.symbol}{co.kmi && <span className="ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: "#FEF3C7", color: "#92400E" }}>KMI</span>}
                          </td>
                          <td className="px-4 py-2.5 border-b text-xs" style={{ borderColor: "var(--border)", color: "var(--text-secondary)", maxWidth: 200 }}>{co.name}</td>
                          <td className="px-4 py-2.5 border-b whitespace-nowrap" style={{ borderColor: "var(--border)" }}>
                            <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon} {co.sector}</span>
                          </td>
                          <td className="px-4 py-2.5 border-b font-bold tabular-nums text-xs whitespace-nowrap" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>{co.price}</td>
                          <td className="px-4 py-2.5 border-b whitespace-nowrap" style={{ borderColor: "var(--border)" }}>
                            <span className="text-xs font-bold" style={{ color: up ? "#065F46" : "#991B1B" }}>{up ? "▲" : "▼"} {Math.abs(co.pct).toFixed(2)}%</span>
                          </td>
                          <td className="px-4 py-2.5 border-b text-xs whitespace-nowrap" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>PKR {co.mcap}</td>
                          <td className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap" style={{ background: "#D1FAE5", color: "#065F46" }}>✓ Halal</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Fade>
        )}

        <Fade>
          <div className="mt-8 p-4 rounded-xl text-xs flex gap-3" style={{ background: "rgba(7,17,31,0.04)", border: "1px solid rgba(7,17,31,0.08)" }}>
            <span className="text-base shrink-0 mt-0.5">ℹ️</span>
            <p style={{ color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--navy)" }}>Disclaimer:</strong> Shariah compliance based on PSX KMI composition &amp; SECP-approved screening criteria. For informational purposes only. Verify with your Shariah advisor before investing. Last updated: <strong>June 2025</strong>. Source: PSX, Meezan Bank Shariah Board.
            </p>
          </div>
        </Fade>
      </div>
    </div>
  );
}
