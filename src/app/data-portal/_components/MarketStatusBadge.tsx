"use client";
import { useState, useEffect } from "react";
import { getMarketStatus } from "../_data";

export default function MarketStatusBadge({ initialOpen, initialLabel }: { initialOpen: boolean; initialLabel: string }) {
  const [s, setS] = useState({ open: initialOpen, label: initialLabel });

  useEffect(() => {
    const id = setInterval(() => setS(getMarketStatus()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
      style={{
        background: s.open ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)",
        color: s.open ? "#4ADE80" : "#F87171",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          background: s.open ? "#4ADE80" : "#F87171",
          boxShadow: s.open ? "0 0 6px #4ADE80" : "none",
          display: "inline-block",
        }}
      />
      {s.label}
    </span>
  );
}
