"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue, animate } from "framer-motion";
import { INDICES, fmtNum, fmtVol, getMarketStatus } from "../_data";

function useLiveTick(base: number) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const tick = () => {
      const delta = (Math.random() - 0.5) * (base * 0.0004);
      setVal(+(base + delta).toFixed(2));
    };
    const id = setInterval(tick, 3000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, [base]);
  return val;
}

function useMarketOpen() {
  const [open, setOpen] = useState(() => getMarketStatus().open);
  useEffect(() => {
    const id = setInterval(() => setOpen(getMarketStatus().open), 60_000);
    return () => clearInterval(id);
  }, []);
  return open;
}

function Sparkline({ up }: { up: boolean }) {
  const pts = up
    ? "0,18 10,14 20,15 30,10 40,12 50,7 60,9 72,3"
    : "0,3  10,7  20,5  30,10 40,8  50,13 60,11 72,17";
  const color = up ? "#16A34A" : "#DC2626";
  return (
    <svg viewBox="0 0 72 20" className="w-full" style={{ height: 26 }} aria-hidden="true">
      <defs>
        <linearGradient id={`sg${up ? "u" : "d"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pts} 72,20 0,20`} fill={`url(#sg${up ? "u" : "d"})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Animated number that counts up/down smoothly
function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(value);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = v.toLocaleString("en-PK", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      },
    });
    return controls.stop;
  }, [value, decimals, motionVal]);

  return <span ref={ref}>{value.toLocaleString("en-PK", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</span>;
}

function IdxCard({ idx, isMarketOpen, delay }: { idx: typeof INDICES[number]; isMarketOpen: boolean; delay: number }) {
  const live  = useLiveTick(idx.close);
  const up    = idx.pct >= 0;
  const color = up ? "#16A34A" : "#DC2626";
  const bg    = up ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.07)";
  const liveChange = +(live - idx.close + idx.change).toFixed(2);
  const prevLive = useRef(live);
  const [flash, setFlash] = useState<"up"|"down"|null>(null);

  useEffect(() => {
    if (live !== prevLive.current) {
      setFlash(live > prevLive.current ? "up" : "down");
      const t = setTimeout(() => setFlash(null), 500);
      prevLive.current = live;
      return () => clearTimeout(t);
    }
  }, [live]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
      className="card relative overflow-hidden cursor-default"
      style={{ borderTop: `3px solid ${color}` }}
    >
      {/* Flash overlay on price tick */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash}
            initial={{ opacity: 0.25 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background: flash === "up" ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)",
            }}
          />
        )}
      </AnimatePresence>

      <div className="p-3 sm:p-4">
        {/* Name + status badge */}
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>
            {idx.code}
          </span>
          {isMarketOpen ? (
            <motion.span
              className="flex items-center gap-1 text-[9px] font-semibold"
              style={{ color: "#16A34A" }}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              LIVE
            </motion.span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "#94a3b8" }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#94a3b8" }} />
              CLOSED
            </span>
          )}
        </div>

        {/* Main value — animated count */}
        <div className="text-lg sm:text-xl font-semibold tabular-nums leading-none" style={{ color: "var(--navy)", letterSpacing: "-0.5px" }}>
          <AnimatedNumber value={isMarketOpen ? live : idx.close} />
        </div>

        {/* Change */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] font-bold tabular-nums" style={{ color }}>
            {up ? "▲" : "▼"} {fmtNum(Math.abs(isMarketOpen ? liveChange : idx.change), 2)}
          </span>
          <motion.span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: bg, color }}
            animate={flash ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {up ? "+" : ""}{idx.pct.toFixed(2)}%
          </motion.span>
        </div>

        {/* Sparkline */}
        <div className="mt-1.5 -mx-1">
          <Sparkline up={up} />
        </div>

        {/* Volume */}
        <div className="text-[9px] tabular-nums mt-0.5" style={{ color: "var(--text-muted)" }}>
          Vol: {fmtVol(idx.vol)}
        </div>
      </div>
    </motion.div>
  );
}

export default function IndexCardsClient() {
  const isMarketOpen = useMarketOpen();
  return (
    <div className="grid grid-cols-5 gap-3 sm:gap-4">
      {INDICES.map((idx, i) => (
        <IdxCard key={idx.code} idx={idx} isMarketOpen={isMarketOpen} delay={i * 0.07} />
      ))}
    </div>
  );
}
