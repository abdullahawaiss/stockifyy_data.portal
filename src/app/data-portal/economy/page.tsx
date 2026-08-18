import type { Metadata } from "next";
import { ECONOMY_INDICATORS } from "../_data";

export const metadata: Metadata = { title: "Economy — Stockifyy" };

const EXTRA = [
  { indicator: "Trade Balance",    period: "Jun-26",    current: "−$2.1B"     },
  { indicator: "Exports",         period: "Jun-26",    current: "$3.2B"      },
  { indicator: "Imports",         period: "Jun-26",    current: "$5.3B"      },
  { indicator: "Remittances",     period: "Jun-26",    current: "$3.1B"      },
  { indicator: "Forex Reserves",  period: "Aug-11-26", current: "$9.87B"     },
  { indicator: "Current Account", period: "May-26",    current: "−$198M"     },
  { indicator: "T-Bill 3M",       period: "Aug-26",    current: "11.85%"     },
  { indicator: "T-Bill 6M",       period: "Aug-26",    current: "11.92%"     },
  { indicator: "PKR/USD Buy",     period: "—",         current: "Rs.276.80"  },
  { indicator: "PKR/EUR",         period: "—",         current: "Rs.306.40"  },
  { indicator: "Gold (per tola)", period: "Aug-11-26", current: "Rs.341,200" },
  { indicator: "Crude (Brent)",   period: "Aug-11-26", current: "$77.45/bbl" },
];

const ALL = [...ECONOMY_INDICATORS, ...EXTRA];

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL.map((e) => (
          <div key={e.indicator} className="card p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>
                {e.indicator}
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{e.period}</div>
            </div>
            <div className="text-base font-black tabular-nums" style={{ color: "var(--gold)" }}>
              {e.current}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
