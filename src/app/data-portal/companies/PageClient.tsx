"use client";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import Link from "next/link";
import { PSX_STOCKS, searchPsxStocks } from "@/lib/psx-stocks-static";
import { cachedFetch } from "@/lib/portal-cache";
import { useDarkTokens } from "@/hooks/useDarkMode";

const SECTOR_COLORS: Record<string, string> = {
  CEMENT: "#f97316", BANKS: "#3b82f6", "OIL & GAS": "#8b5cf6", FERTILIZER: "#22c55e",
  TEXTILE: "#ec4899", POWER: "#eab308", PHARMA: "#06b6d4", TECH: "#6366f1",
  STEEL: "#94a3b8", FOOD: "#f43f5e", CHEMICAL: "#14b8a6", AUTO: "#f59e0b",
  TELECOM: "#10b981", INSURANCE: "#a78bfa", MISC: "#64748b",
};

// ── Seeded RNG — fully deterministic, never causes re-computation ──
function seedRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function makeSparkline(symbol: string, positive: boolean): number[] {
  const r = seedRand(symbol.charCodeAt(0) * 31 + symbol.charCodeAt(Math.min(1, symbol.length - 1)) * 7);
  const pts: number[] = [100];
  for (let i = 1; i < 20; i++) pts.push(Math.max(10, pts[i - 1] + (r() - (positive ? 0.45 : 0.55)) * 6));
  return pts;
}

interface Company { id: number; symbol: string; name: string; sectorName: string; shariahStatus: string; listingDate: string; website: string; }

interface LiveQ { sym: string; price: number; chg: number; vol: number; open: number; high: number; low: number; prev: number; }

interface CardData { price: number; changePct: number; change: number; positive: boolean; vol: number; pe: number; sparkline: number[]; open: number; high: number; low: number; prev: number; live: boolean; }

function buildCardData(symbol: string, globalIdx: number, lq?: LiveQ): CardData {
  const r = seedRand(globalIdx * 13 + symbol.charCodeAt(0));
  if (lq && lq.price > 0) {
    const positive = lq.chg >= 0;
    const pe = parseFloat((5 + r() * 25).toFixed(1));
    return { price: lq.price, changePct: lq.chg, change: parseFloat((lq.price * lq.chg / 100).toFixed(2)), positive, vol: lq.vol * 1000, pe, sparkline: makeSparkline(symbol, positive), open: lq.open, high: lq.high, low: lq.low, prev: lq.prev, live: true };
  }
  const price = Math.round((50 + r() * 950) * 100) / 100;
  const changePct = parseFloat(((r() - 0.48) * 8).toFixed(2));
  const positive = changePct >= 0;
  const change = parseFloat((price * changePct / 100).toFixed(2));
  const vol = Math.round(r() * 5000000);
  const pe = parseFloat((5 + r() * 25).toFixed(1));
  return { price, changePct, change, positive, vol, pe, sparkline: makeSparkline(symbol, positive), open: price, high: price * 1.02, low: price * 0.98, prev: price - change, live: false };
}

// ── Tiny SVG components — memoised so they never re-render unless props change ──
const SparkSVG = memo(function SparkSVG({ pts, positive, width = 80, height = 28 }: { pts: number[]; positive: boolean; width?: number; height?: number }) {
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1;
  const xs = pts.map((_, i) => (i / (pts.length - 1)) * width);
  const ys = pts.map(v => height - ((v - min) / range) * (height - 4) - 2);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const fill = `${d} L${width},${height} L0,${height} Z`;
  const color = positive ? "#22c55e" : "#ef4444";
  const gid = `sg${positive ? "p" : "n"}`;
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});

function HeatCell({ change, size = 10 }: { change: number; size?: number }) {
  const abs = Math.min(Math.abs(change), 5), ratio = abs / 5;
  const bg = change >= 0 ? `rgba(34,197,94,${0.15 + ratio * 0.65})` : `rgba(239,68,68,${0.15 + ratio * 0.65})`;
  return <span style={{ display: "inline-block", width: size, height: size, borderRadius: 2, background: bg, flexShrink: 0 }} />;
}

type View = "grid" | "list";
const PAGE_SIZE = 24;
const GOLD = "#D4971A", NAVY = "#07111F";

export default function CompaniesPage() {
  useDarkTokens();
  const [data, setData] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveMap, setLiveMap] = useState<Map<string, LiveQ>>(new Map());
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [view, setView] = useState<View>("list");
  const [sortBy, setSortBy] = useState<"symbol" | "change" | "price">("symbol");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [json, qJson] = await Promise.all([
        cachedFetch<{ data: Company[] }>(`/api/portal/companies?limit=900`),
        fetch(`/api/live/quotes`).then(r => r.json()).catch(() => ({ quotes: [] })),
      ]);
      let rows: Company[] = json.data ?? [];
      if (rows.length === 0) {
        rows = PSX_STOCKS.map((s, i) => ({ id: i + 1, symbol: s.symbol, name: s.name, sectorName: s.sector, shariahStatus: "—", listingDate: "—", website: "—" }));
      }
      const qm = new Map<string, LiveQ>();
      (qJson.quotes ?? []).forEach((q: LiveQ) => qm.set(q.sym, q));
      setLiveMap(qm);
      setData(rows);
    } catch {
      setData(PSX_STOCKS.map((s, i) => ({ id: i + 1, symbol: s.symbol, name: s.name, sectorName: s.sector, shariahStatus: "—", listingDate: "—", website: "—" })));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Pre-compute ALL card data once — real prices when available ──
  const cardMap = useMemo<Map<string, CardData>>(() => {
    const m = new Map<string, CardData>();
    data.forEach((co, i) => m.set(co.symbol, buildCardData(co.symbol, i, liveMap.get(co.symbol))));
    return m;
  }, [data, liveMap]);

  const sectors = useMemo(() => ["All", ...Array.from(new Set(data.map(d => d.sectorName).filter(Boolean))).sort()], [data]);

  const filtered = useMemo(() => {
    let list = data;
    if (search) { const q = search.toLowerCase(); list = list.filter(d => d.symbol.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)); }
    if (sector !== "All") list = list.filter(d => d.sectorName === sector);
    return list;
  }, [data, search, sector]);

  const sorted = useMemo(() => {
    if (sortBy === "symbol") return [...filtered].sort((a, b) => a.symbol.localeCompare(b.symbol));
    const sign = sortBy === "change" ? -1 : -1;
    return [...filtered].sort((a, b) => {
      const da = cardMap.get(a.symbol)!;
      const db = cardMap.get(b.symbol)!;
      if (sortBy === "change") return sign * (da.changePct - db.changePct) * -1;
      return sign * (da.price - db.price) * -1;
    });
  }, [filtered, sortBy, cardMap]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);
  const resetPage = () => setPage(1);

  // Sector heatmap — computed from cardMap, no indexOf
  const sectorMap = useMemo(() => {
    const map: Record<string, { count: number; total: number; items: Company[] }> = {};
    data.forEach(co => {
      const s = co.sectorName || "MISC";
      if (!map[s]) map[s] = { count: 0, total: 0, items: [] };
      map[s].count++;
      map[s].total += cardMap.get(co.symbol)?.changePct ?? 0;
      map[s].items.push(co);
    });
    const out: Record<string, { count: number; avgChange: number; items: Company[] }> = {};
    Object.entries(map).forEach(([k, v]) => {
      out[k] = { count: v.count, avgChange: parseFloat((v.total / v.count).toFixed(2)), items: v.items };
    });
    return out;
  }, [data, cardMap]);

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }}>
      {/* ── Header ───────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>PSX Companies</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            <span style={{ color: "var(--text-primary)" }}>Company </span><span style={{ color: "#D4971A" }}>Directory</span>
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "3px 0 0" }}>{data.length} listed companies · Mini sparklines · Sector heatmap</p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--light-bg)", borderRadius: 10, padding: 4, border: "1px solid var(--border)" }}>
          {(["grid", "list"] as View[]).map(v => (
            <button key={v} onClick={() => { setView(v); resetPage(); }}
              style={{ padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 700, background: view === v ? GOLD : "transparent", color: view === v ? NAVY : "var(--text-muted)", transition: "all 150ms" }}>
              {v === "grid" ? "⊞ Grid" : "≡ List"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "0 0 240px" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: 13, pointerEvents: "none" }}>🔍</span>
          <input value={search} onChange={e => { setSearch(e.target.value); resetPage(); }}
            placeholder="Search symbol or name…"
            style={{ width: "100%", paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 12.5, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
          {sectors.slice(0, 14).map(s => (
            <button key={s} onClick={() => { setSector(s); resetPage(); }}
              style={{ padding: "4px 10px", borderRadius: 20, border: `1px solid ${sector === s ? GOLD : "var(--border)"}`, background: sector === s ? "rgba(212,175,55,0.15)" : "transparent", color: sector === s ? GOLD : "var(--text-muted)", fontSize: 10.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              {s}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => { setSortBy(e.target.value as typeof sortBy); resetPage(); }}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 12, cursor: "pointer" }}>
          <option value="symbol">A → Z</option>
          <option value="change">Top Gainers</option>
          <option value="price">Highest Price</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 28, marginBottom: 10, animation: "spin 1s linear infinite" }}>⟳</div>Loading companies...
        </div>
      ) : view === "list" ? (
        <><ListView paginated={paginated} cardMap={cardMap} /><Pagination page={page} totalPages={totalPages} total={sorted.length} onPage={setPage} /></>
      ) : (
        <><GridView paginated={paginated} cardMap={cardMap} /><Pagination page={page} totalPages={totalPages} total={sorted.length} onPage={setPage} /></>
      )}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────
function Pagination({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  let visible: (number | "…")[] = [];
  if (totalPages <= 7) {
    visible = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    visible = [1];
    if (page > 3) visible.push("…");
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) visible.push(p);
    if (page < totalPages - 2) visible.push("…");
    visible.push(totalPages);
  }
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20, flexWrap: "wrap" }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 8 }}>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</span>
      <button disabled={page === 1} onClick={() => onPage(page - 1)}
        style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 12, cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
      {visible.map((p, i) => p === "…" ? (
        <span key={`e${i}`} style={{ fontSize: 12, color: "var(--text-muted)", padding: "0 4px" }}>…</span>
      ) : (
        <button key={p} onClick={() => onPage(p as number)}
          style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${page === p ? GOLD : "var(--border)"}`, background: page === p ? GOLD : "var(--card-bg)", color: page === p ? NAVY : "var(--text-primary)", fontSize: 12, fontWeight: page === p ? 800 : 500, cursor: "pointer" }}>
          {p}
        </button>
      ))}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)}
        style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 12, cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next →</button>
    </div>
  );
}

// ── Grid View — receives pre-computed cardMap, no indexOf ─────
const GridCard = memo(function GridCard({ co, d }: { co: Company; d: CardData }) {
  const sColor = SECTOR_COLORS[co.sectorName?.toUpperCase()] ?? "#64748b";
  return (
    <Link href={`/data-portal/company/${co.symbol}`} style={{ textDecoration: "none" }}>
      <div
        style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px 10px", cursor: "pointer", transition: "border-color 150ms, box-shadow 150ms", overflow: "hidden", position: "relative" }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(212,175,55,0.45)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: sColor, opacity: 0.85 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6, marginTop: 4 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>{co.symbol}</span>
              {d.live && <span style={{ fontSize: 7, fontWeight: 800, background: "#16a34a", color: "#fff", padding: "1px 4px", borderRadius: 3 }}>LIVE</span>}
            </div>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 1, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{co.name}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>₨{d.price.toFixed(2)}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: d.positive ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>{d.positive ? "+" : ""}{d.changePct.toFixed(2)}%</div>
          </div>
        </div>
        <SparkSVG pts={d.sparkline} positive={d.positive} width={167} height={30} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 3, marginTop: 6, fontSize: 9 }}>
          <div style={{ textAlign: "center", padding: "3px 2px", background: "var(--light-bg,rgba(0,0,0,0.03))", borderRadius: 4 }}>
            <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Open</div>
            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>₨{d.open.toFixed(0)}</div>
          </div>
          <div style={{ textAlign: "center", padding: "3px 2px", background: "rgba(22,163,74,0.07)", borderRadius: 4 }}>
            <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>High</div>
            <div style={{ fontWeight: 700, color: "#16a34a" }}>₨{d.high.toFixed(0)}</div>
          </div>
          <div style={{ textAlign: "center", padding: "3px 2px", background: "rgba(220,38,38,0.07)", borderRadius: 4 }}>
            <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Low</div>
            <div style={{ fontWeight: 700, color: "#dc2626" }}>₨{d.low.toFixed(0)}</div>
          </div>
          <div style={{ textAlign: "center", padding: "3px 2px", background: "var(--light-bg,rgba(0,0,0,0.03))", borderRadius: 4 }}>
            <div style={{ color: "var(--text-muted)", fontWeight: 600 }}>Vol</div>
            <div style={{ fontWeight: 700, color: "var(--text-muted)" }}>{d.vol >= 1e6 ? `${(d.vol/1e6).toFixed(1)}M` : `${(d.vol/1e3).toFixed(0)}K`}</div>
          </div>
        </div>
      </div>
    </Link>
  );
});

function GridView({ paginated, cardMap }: { paginated: Company[]; cardMap: Map<string, CardData> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))", gap: 10 }}>
      {paginated.map(co => <GridCard key={co.symbol} co={co} d={cardMap.get(co.symbol)!} />)}
    </div>
  );
}

// ── Heatmap View ──────────────────────────────────────────────
function HeatmapView({ sectorMap, cardMap, onFilter }: { sectorMap: Record<string, { count: number; avgChange: number; items: Company[] }>; cardMap: Map<string, CardData>; onFilter: (s: string) => void }) {
  const entries = Object.entries(sectorMap).sort((a, b) => b[1].count - a[1].count);
  return (
    <div>
      <p style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 14 }}>Tile size = company count · Color = avg daily change · Click to filter</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {entries.map(([sec, info]) => {
          const abs = Math.min(Math.abs(info.avgChange), 3), ratio = abs / 3;
          const bg = info.avgChange >= 0 ? `rgba(34,197,94,${0.12 + ratio * 0.55})` : `rgba(239,68,68,${0.12 + ratio * 0.55})`;
          const borderC = info.avgChange >= 0 ? `rgba(34,197,94,${0.3 + ratio * 0.4})` : `rgba(239,68,68,${0.3 + ratio * 0.4})`;
          const tColor = info.avgChange >= 0 ? "#16a34a" : "#dc2626";
          const size = Math.max(80, Math.min(220, info.count * 3.5));
          return (
            <div key={sec} onClick={() => onFilter(sec)}
              style={{ width: size, height: size * 0.7, background: bg, border: `1.5px solid ${borderC}`, borderRadius: 12, cursor: "pointer", padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "transform 150ms, box-shadow 150ms", position: "relative", overflow: "hidden" }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.04)"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 20px ${borderC}`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
            >
              <div>
                <div style={{ fontSize: Math.max(10, Math.min(14, size / 14)), fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>{sec}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{info.count} co.</div>
              </div>
              <div style={{ fontSize: Math.max(13, Math.min(18, size / 11)), fontWeight: 800, color: tColor, fontVariantNumeric: "tabular-nums" }}>{info.avgChange >= 0 ? "+" : ""}{info.avgChange.toFixed(2)}%</div>
              <div style={{ position: "absolute", bottom: 6, right: 6, display: "flex", gap: 2, flexWrap: "wrap", maxWidth: 40 }}>
                {info.items.slice(0, 9).map(co => <HeatCell key={co.symbol} change={cardMap.get(co.symbol)?.changePct ?? 0} size={8} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── List View ─────────────────────────────────────────────────
function ListView({ paginated, cardMap }: { paginated: Company[]; cardMap: Map<string, CardData> }) {
  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "96px 1fr 120px 90px 85px 85px 75px 75px 80px", padding: "8px 16px", borderBottom: "1px solid var(--border)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase" }}>
        <span>Symbol</span><span>Company</span><span>Sector</span>
        <span style={{ textAlign: "right" }}>Price</span>
        <span style={{ textAlign: "right" }}>Change %</span>
        <span style={{ textAlign: "right" }}>Volume</span>
        <span style={{ textAlign: "right" }}>High</span>
        <span style={{ textAlign: "right" }}>Low</span>
        <span style={{ textAlign: "center" }}>Chart</span>
      </div>
      {paginated.map(co => {
        const d = cardMap.get(co.symbol)!;
        const sColor = SECTOR_COLORS[co.sectorName?.toUpperCase()] ?? "#64748b";
        const volStr = d.vol >= 1e6 ? `${(d.vol/1e6).toFixed(2)}M` : d.vol >= 1e3 ? `${(d.vol/1e3).toFixed(0)}K` : String(d.vol);
        return (
          <Link key={co.symbol} href={`/data-portal/company/${co.symbol}`} style={{ textDecoration: "none" }}>
            <div style={{ display: "grid", gridTemplateColumns: "96px 1fr 120px 90px 85px 85px 75px 75px 80px", padding: "9px 16px", borderBottom: "1px solid var(--border)", alignItems: "center", cursor: "pointer", transition: "background 120ms" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--light-bg)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>{co.symbol}</span>
                {d.live && <span style={{ fontSize: 7, fontWeight: 800, background: "#16a34a", color: "#fff", padding: "1px 4px", borderRadius: 3 }}>LIVE</span>}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{co.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: sColor, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{co.sectorName?.slice(0, 12)}</span>
              </span>
              <span style={{ textAlign: "right", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>₨{d.price.toFixed(2)}</span>
              <span style={{ textAlign: "right", fontSize: 12, fontWeight: 700, color: d.positive ? "#16a34a" : "#dc2626", fontVariantNumeric: "tabular-nums" }}>{d.positive ? "+" : ""}{d.changePct.toFixed(2)}%</span>
              <span style={{ textAlign: "right", fontSize: 11, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{volStr}</span>
              <span style={{ textAlign: "right", fontSize: 11.5, color: "#16a34a", fontVariantNumeric: "tabular-nums" }}>₨{d.high.toFixed(2)}</span>
              <span style={{ textAlign: "right", fontSize: 11.5, color: "#dc2626", fontVariantNumeric: "tabular-nums" }}>₨{d.low.toFixed(2)}</span>
              <span style={{ display: "flex", justifyContent: "center" }}><SparkSVG pts={d.sparkline} positive={d.positive} width={72} height={22} /></span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
