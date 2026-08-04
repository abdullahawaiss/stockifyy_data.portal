"use client";
import { useState, useEffect } from "react";

export default function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    // Minute-level precision is enough for a display clock
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  return (
    <div className="hidden xl:flex flex-col items-end leading-tight shrink-0">
      <span className="text-[11px] font-semibold" style={{ color: "var(--gold)" }}>
        {now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true })}
      </span>
      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
        {now.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · PKT
      </span>
    </div>
  );
}
