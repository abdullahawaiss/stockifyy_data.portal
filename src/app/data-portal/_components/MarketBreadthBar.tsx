"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatVolume } from "@/lib/utils";

interface Totals {
  totalVolume: number; totalValue: number; totalTrades: number;
  totalStocks: number; advancers: number; decliners: number; unchanged: number;
}

function CountUp({ to, duration = 1.2 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * to));
      if (p < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [to, duration]);
  return <>{val.toLocaleString()}</>;
}

export default function MarketBreadthBar() {
  const [totals, setTotals] = useState<Totals | null>(null);

  useEffect(() => {
    fetch("/api/portal/stocks")
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json?.totals) setTotals(json.totals); })
      .catch(() => {});
  }, []);

  if (!totals) return null;

  const total   = Math.max(totals.totalStocks, 1);
  const advPct  = Math.round(totals.advancers / total * 100);
  const decPct  = Math.round(totals.decliners / total * 100);
  const unchPct = 100 - advPct - decPct;

  const stats = [
    { label: "Advances", val: totals.advancers,  color: "#16A34A" },
    { label: "Declines", val: totals.decliners,  color: "#DC2626" },
    { label: "Unchanged",val: totals.unchanged,  color: "#94a3b8" },
  ];

  return (
    <motion.div
      className="card px-4 py-1"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">

        {/* Advances / Declines / Unchanged with count-up */}
        {stats.map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: s.color }} />
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.label}</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: s.color }}>
              <CountUp to={s.val} />
            </span>
          </div>
        ))}

        <div className="h-3.5 w-px mx-1 hidden sm:block" style={{ background: "var(--border)" }} />

        {/* Volume / Value / Trades / Listed */}
        {[
          { label: "Total Vol",   val: formatVolume(totals.totalVolume) },
          { label: "Total Value", val: `PKR ${formatVolume(totals.totalValue)}` },
          { label: "Trades",      val: totals.totalTrades.toLocaleString() },
          { label: "Listed",      val: totals.totalStocks.toString() },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{s.label}</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: "var(--navy)" }}>{s.val}</span>
          </div>
        ))}

        {/* Animated breadth bar */}
        <div className="ml-auto hidden sm:flex flex-col gap-0.5 items-end">
          <div className="flex h-2 rounded overflow-hidden" style={{ width: 110 }}>
            <motion.div
              style={{ background: "#16A34A", height: "100%" }}
              initial={{ width: 0 }}
              animate={{ width: `${advPct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            />
            <motion.div
              style={{ background: "#E5E7EB", height: "100%" }}
              initial={{ width: 0 }}
              animate={{ width: `${unchPct}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
            />
            <motion.div
              style={{ background: "#DC2626", height: "100%", flex: 1 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            />
          </div>
          <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>
            {advPct}% up · {decPct}% down
          </span>
        </div>

      </div>
    </motion.div>
  );
}
