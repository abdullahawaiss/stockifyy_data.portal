import type { Metadata } from "next";

export const metadata: Metadata = { title: "Economy — Stockifyy" };

export default function EconomyPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-xl font-black" style={{ color: "var(--navy)" }}>Economy</h1>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span className="text-[10px] font-semibold px-2 py-1 rounded" style={{ background: "var(--navy-tint)", color: "var(--text-muted)" }}>
          Source: SBP · PSX · Trading Economics
        </span>
      </div>

      <div className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
        <div className="text-3xl mb-3">📊</div>
        <div className="text-sm font-semibold mb-1" style={{ color: "var(--navy)" }}>Economy Data Coming Soon</div>
        <div className="text-xs">Live economic indicators will be displayed here once connected to SBP / Trading Economics feeds.</div>
      </div>
    </div>
  );
}
