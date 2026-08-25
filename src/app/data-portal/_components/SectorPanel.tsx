"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { MarketSummary } from "@/app/api/portal/market-summary/route";

type Period = "Daily" | "Weekly" | "Monthly";

export default function SectorPanel({ initialData }: { initialData?: MarketSummary["sectors"] }) {
  const [sectors, setSectors] = useState<MarketSummary["sectors"]>(() => initialData ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [period, setPeriod] = useState<Period>("Daily");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (initialData) { setSectors(initialData); setLoading(false); return; }
    fetch("/api/portal/market-summary")
      .then(r => r.json())
      .then((d: MarketSummary) => setSectors(d.sectors ?? []))
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
            sectors.map(sec => {
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
                <div key={sec.name}
                  className="rounded-xl shrink-0 px-3 py-2.5 text-center transition-all hover:scale-105 cursor-default select-none"
                  style={{
                    minWidth: 90,
                    background: up ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
                    border: `1px solid ${up ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
                  }}>
                  <div className="text-[10px] font-bold leading-tight" style={{ color: up ? "#065F46" : "#991B1B" }}>
                    {label}
                  </div>
                  <div className="text-[12px] font-black mt-1" style={{ color: up ? "#16A34A" : "#DC2626" }}>
                    {up ? "▲" : "▼"}{Math.abs(sec.pct).toFixed(2)}%
                  </div>
                </div>
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
    </div>
  );
}
