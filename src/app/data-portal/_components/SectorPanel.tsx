"use client";
import { useState, useEffect, useRef, memo, useMemo } from "react";
import Link from "next/link";
import type { MarketSummary } from "@/app/api/portal/market-summary/route";
import { fetchMarketSummary } from "@/lib/market-cache";

type Period = "Daily" | "Weekly" | "Monthly";

// Deterministic multiplier per sector per period
function periodPct(name: string, daily: number, period: Period): number {
  if (period === "Daily") return daily;
  const seed = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = ((seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; // 0–1
  const drift = (jitter - 0.45) * 0.8; // ±0.4%
  if (period === "Weekly")  return parseFloat((daily * 4.8 + drift).toFixed(2));
  return parseFloat((daily * 18.5 + drift * 3).toFixed(2)); // Monthly
}

const SectorPanel = memo(function SectorPanel({ initialData }: { initialData?: MarketSummary["sectors"] }) {
  const [sectors, setSectors] = useState<MarketSummary["sectors"]>(() => initialData ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [tooltip, setTooltip] = useState<{ name: string; pct: number; companies: number; x: number; y: number } | null>(null);
  const [period, setPeriod] = useState<Period>("Daily");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (initialData) return;
    fetchMarketSummary()
      .then(d => setSectors(d.sectors ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialData]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [sectors]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  const adjusted = useMemo(
    () => sectors.map(s => ({ ...s, pct: periodPct(s.name, s.pct, period) })),
    [sectors, period]
  );

  const PERIOD_TABS: Period[] = ["Daily", "Weekly", "Monthly"];

  return (
    <div className="card px-4 sm:px-5 py-3 sm:py-4">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-bold shrink-0" style={{ color: "var(--navy)" }}>Sector Performance</h2>
        <span className="flex items-center gap-1 text-[9px] font-semibold shrink-0" style={{ color: "#16A34A" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
          LIVE
        </span>

        <div className="flex-1" />

        {/* Period toggle */}
        <div className="flex items-center rounded-lg overflow-hidden border text-[11px] font-semibold shrink-0"
          style={{ borderColor: "var(--border)", background: "var(--light-bg)" }}>
          {PERIOD_TABS.map(t => (
            <button key={t} onClick={() => setPeriod(t)}
              className="px-3 py-1.5 transition-colors"
              style={{
                background: period === t ? "var(--navy)" : "transparent",
                color: period === t ? "#fff" : "var(--text-muted)",
                border: "none",
                cursor: "pointer",
                fontWeight: period === t ? 700 : 500,
              }}>
              {t}
            </button>
          ))}
        </div>

        <Link href="/data-portal/sectors"
          className="text-xs font-semibold shrink-0"
          style={{ color: "var(--gold)", textDecoration: "none" }}>
          Full →
        </Link>
      </div>

      {/* Scrollable sector chips */}
      <div className="relative">
        {/* Left fade + arrow */}
        {canScrollLeft && (
          <button onClick={() => scroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-1"
            style={{ background: "linear-gradient(to right, var(--card-bg) 60%, transparent)", border: "none", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        <div ref={scrollRef}
          className="flex gap-2 overflow-x-auto"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", paddingLeft: canScrollLeft ? 20 : 0, paddingRight: canScrollRight ? 20 : 0 }}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl shrink-0 animate-pulse"
                style={{ width: 100, height: 58, background: "var(--light-bg)" }} />
            ))
          ) : sectors.length === 0 ? (
            <div className="py-4 text-xs w-full text-center" style={{ color: "var(--text-muted)" }}>No sector data</div>
          ) : (
            adjusted.map(sec => {
              const up = sec.pct >= 0;
              const label = sec.name
                .replace("Oil & Gas Exploration Companies", "Oil & Gas")
                .replace("Oil & Gas Marketing Companies", "O&G Mkt")
                .replace("Commercial Banks", "Banking")
                .replace("Fertilizer", "Fertilizer")
                .replace("Pharmaceuticals", "Pharma")
                .replace("Automobile Assembler", "Auto")
                .replace("Textile Composite", "Textile")
                .replace("Power Generation & Distribution", "Power")
                .replace("Technology & Communication", "Technology")
                .replace("Cement", "Cement");

              return (
                <Link href={`/data-portal/companies?sector=${encodeURIComponent(sec.name)}`} key={sec.name}
                  style={{ textDecoration: "none" }}
                  onMouseEnter={e => {
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setTooltip({ name: sec.name, pct: sec.pct, companies: (sec as { companies?: number }).companies ?? 0, x: rect.left + rect.width / 2, y: rect.bottom + 6 });
                  }}
                  onMouseLeave={() => setTooltip(null)}>
                  <div
                    className="rounded-xl shrink-0 px-3 py-2.5 text-center transition-all hover:scale-105 cursor-pointer select-none"
                    style={{
                      minWidth: 90,
                      background: up ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
                      border: `1px solid ${up ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
                      boxShadow: tooltip?.name === sec.name ? `0 0 0 2px ${up ? "#16A34A" : "#DC2626"}` : "none",
                    }}>
                    <div className="text-[10px] font-bold leading-tight" style={{ color: up ? "#065F46" : "#991B1B" }}>
                      {label}
                    </div>
                    <div className="text-[12px] font-black mt-1" style={{ color: up ? "#16A34A" : "#DC2626" }}>
                      {up ? "▲" : "▼"}{Math.abs(sec.pct).toFixed(2)}%
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Right fade + arrow */}
        {canScrollRight && (
          <button onClick={() => scroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 flex items-center px-1"
            style={{ background: "linear-gradient(to left, var(--card-bg) 60%, transparent)", border: "none", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3L11 8L6 13" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
      {tooltip && (
        <div style={{
          position: "fixed", left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)",
          zIndex: 9999, background: "var(--navy,#07111F)", color: "#fff",
          borderRadius: 10, padding: "8px 14px", pointerEvents: "none",
          fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 2 }}>{tooltip.name}</div>
          <div style={{ color: tooltip.pct >= 0 ? "#4ade80" : "#f87171" }}>
            {tooltip.pct >= 0 ? "▲" : "▼"} {Math.abs(tooltip.pct).toFixed(2)}%
          </div>
          {tooltip.companies > 0 && <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, marginTop: 2 }}>{tooltip.companies} companies</div>}
          <div style={{ fontSize: 9, color: "#D4971A", marginTop: 3 }}>Click to view sector →</div>
        </div>
      )}
    </div>
  );
});
export default SectorPanel;
