"use client";
import { useEffect, useRef, useState } from "react";

interface IndexItem {
  indexCode: string;
  close: number;
  percentageChange: number;
}

function useCountUp(target: number, duration = 1800, delay = 0) {
  const [value, setValue] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    let start: number | null = null;
    const from = 0;

    const timeout = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(from + (target - from) * eased);
        if (progress < 1) raf.current = requestAnimationFrame(step);
        else setValue(target);
      };
      raf.current = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf.current);
    };
  }, [target, duration, delay]);

  return value;
}

function IndexCard({ item, delay }: { item: IndexItem; delay: number }) {
  const animated = useCountUp(item.close, 1800, delay);
  const isUp = item.percentageChange >= 0;

  const formatted = animated.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div
      className="card p-4 flex flex-col gap-1 relative overflow-hidden"
      style={{ borderTop: `3px solid ${isUp ? "#16A34A" : "#DC2626"}` }}
    >
      {/* Subtle glow */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ background: isUp ? "#16A34A" : "#DC2626" }}
      />
      <div className="text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--text-muted)" }}>
        {item.indexCode}
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: "var(--navy)", letterSpacing: "-0.5px" }}>
        {formatted}
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="text-sm font-bold"
          style={{ color: isUp ? "#16A34A" : "#DC2626" }}
        >
          {isUp ? "▲" : "▼"} {Math.abs(item.percentageChange).toFixed(2)}%
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>today</span>
      </div>
    </div>
  );
}

export default function AnimatedIndexCards({ items }: { items: IndexItem[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {items.map((item, i) => (
        <IndexCard key={item.indexCode} item={item} delay={i * 150} />
      ))}
    </div>
  );
}
