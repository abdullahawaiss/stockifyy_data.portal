"use client";
import { useState, useEffect, useRef } from "react";
import { INDICES, fmtNum, fmtVol } from "../_data";

function useCountUp(target: number, dur = 1500, delay = 0, active = true) {
  const [v, setV] = useState(target); // start at target — no flash on hydration
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !active) return;
    ran.current = true;
    setV(0);
    let start: number | null = null;
    let raf: number;
    const t = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        setV(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(step);
        else setV(target);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(t); cancelAnimationFrame(raf); };
  }, [target, dur, delay, active]);

  return v;
}

function IdxCard({ idx, delay, active }: { idx: typeof INDICES[number]; delay: number; active: boolean }) {
  const v = useCountUp(idx.close, 1500, delay, active);
  const up = idx.pct >= 0;
  return (
    <div
      className="card p-4 sm:p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl cursor-default"
      style={{ borderTop: `3px solid ${up ? "#16A34A" : "#DC2626"}` }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: up ? "linear-gradient(135deg,rgba(22,163,74,0.04),transparent)" : "linear-gradient(135deg,rgba(220,38,38,0.04),transparent)" }}
      />
      <div className="text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-1.5" style={{ color: "var(--text-muted)" }}>{idx.code}</div>
      <div className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: "var(--navy)", letterSpacing: "-0.5px" }}>{fmtNum(v, 2)}</div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-xs sm:text-sm font-bold" style={{ color: up ? "#16A34A" : "#DC2626" }}>{up ? "▲" : "▼"} {Math.abs(idx.pct).toFixed(2)}%</span>
        <span className="text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>today</span>
      </div>
      <div className="mt-1 text-[10px] sm:text-xs" style={{ color: "var(--text-muted)" }}>Vol: {fmtVol(idx.vol)}</div>
    </div>
  );
}

export default function IndexCardsClient() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setActive(true); obs.disconnect(); }
    }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {INDICES.map((idx, i) => <IdxCard key={idx.code} idx={idx} delay={i * 110} active={active} />)}
    </div>
  );
}
