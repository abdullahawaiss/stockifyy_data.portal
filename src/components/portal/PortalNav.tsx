// Server component — no "use client". Desktop dropdowns use CSS :hover (zero JS).
// Only LiveClock and MobileMenu are client islands.
import Image from "next/image";
import Link from "next/link";
import LiveClock from "./LiveClock";
import MobileMenu from "./MobileMenu";

const NAV = [
  {
    label: "Market",
    items: [
      { label: "Market Overview",   href: "/data-portal" },
      { label: "Daily Summary",     href: "/data-portal/daily" },
      { label: "Weekly Summary",    href: "/data-portal/weekly" },
      { label: "Market Indices",    href: "/data-portal/indices" },
      { label: "Sector Summary",    href: "/data-portal/sectors" },
      { label: "Market Performers", href: "/data-portal/daily?view=performers" },
    ],
  },
  {
    label: "Companies",
    items: [
      { label: "Company Directory",    href: "/data-portal/companies" },
      { label: "Financial Statements", href: "/data-portal/companies?tab=financials" },
      { label: "Dividends",            href: "/data-portal/companies?tab=dividends" },
      { label: "☪ Shariah Compliant", href: "/data-portal/shariah" },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Stock Screener",  href: "/data-portal/screener" },
      { label: "Historical Data", href: "/data-portal/historical-data" },
      { label: "Data Downloads",  href: "/data-portal/downloads" },
    ],
  },
  {
    label: "Information",
    items: [
      { label: "Announcements",   href: "/data-portal/announcements" },
      { label: "Research Reports",href: "/data-portal/research" },
      { label: "Weekly Report",   href: "/data-portal/research?type=weekly_market" },
    ],
  },
];

// Reduced to 10 unique symbols — doubled by TickerTape = 20 DOM nodes (was 36)
const TICKER_ITEMS = [
  { symbol: "KSE-100", price: "78,432.10", pct: "+1.25%", up: true  },
  { symbol: "KSE-30",  price: "48,628.55", pct: "+0.87%", up: true  },
  { symbol: "OGDC",    price: "142.30",    pct: "+4.82%", up: true  },
  { symbol: "PSO",     price: "318.75",    pct: "+3.91%", up: true  },
  { symbol: "LUCK",    price: "894.20",    pct: "+3.15%", up: true  },
  { symbol: "MCB",     price: "224.50",    pct: "+1.72%", up: true  },
  { symbol: "MLCF",    price: "41.80",     pct: "-3.22%", up: false },
  { symbol: "TRG",     price: "92.40",     pct: "+1.26%", up: true  },
  { symbol: "MARI",    price: "2,145.00",  pct: "+2.41%", up: true  },
  { symbol: "HBL",     price: "196.80",    pct: "+1.34%", up: true  },
];

export default function PortalNav({ isAdmin }: { isAdmin?: boolean }) {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <nav className="sticky top-0 z-50" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.25)" }}>

      {/* Ticker tape — pure CSS animation, no JS */}
      <div
        className="overflow-hidden"
        style={{ background: "var(--deep-blue)", borderBottom: "1px solid rgba(212,175,55,0.15)", height: 28 }}
      >
        <div className="ticker-track h-full flex items-center">
          {doubled.map((item, i) => (
            <span key={i} className="flex items-center shrink-0 px-5 gap-2 text-[11px]">
              <span className="font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.9)" }}>{item.symbol}</span>
              <span style={{ color: "rgba(255,255,255,0.65)" }}>{item.price}</span>
              <span className="font-semibold" style={{ color: item.up ? "#22c55e" : "#ef4444" }}>
                {item.up ? "▲" : "▼"} {item.pct}
              </span>
              <span style={{ color: "rgba(212,175,55,0.3)", marginLeft: 4 }}>|</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main bar */}
      <div
        className="relative flex items-center justify-between"
        style={{ background: "var(--navy)", borderBottom: "1px solid rgba(212,175,55,0.15)" }}
      >
        {/* Logo */}
        <Link
          href="/data-portal"
          className="flex items-center gap-3 shrink-0 px-5 h-14"
          style={{ background: "linear-gradient(135deg,#B8860B 0%,#E8C84A 45%,#C9A227 100%)", minWidth: 195 }}
        >
          <Image src="/stockifyy-logo.svg" alt="Stockifyy" width={95} height={27} className="object-contain shrink-0" priority />
          <span className="text-[9px] font-bold tracking-widest uppercase border-l pl-2.5 hidden sm:inline-block" style={{ color: "rgba(7,17,31,0.65)", borderColor: "rgba(7,17,31,0.25)" }}>
            Data Portal
          </span>
        </Link>

        {/* Desktop nav — CSS :hover dropdowns, zero JS */}
        <div className="hidden lg:flex items-center gap-1 flex-1 px-3">
          {NAV.map(group => (
            <div key={group.label} className="nav-group relative">
              <button
                className="px-3 py-2 text-sm rounded transition-colors nav-trigger"
                style={{ color: "rgba(255,255,255,0.85)", background: "transparent" }}
              >
                {group.label} ▾
              </button>
              <div
                className="nav-dropdown absolute top-full left-0 w-52 py-1 rounded-lg shadow-2xl border mt-1"
                style={{ background: "var(--deep-blue)", borderColor: "rgba(212,175,55,0.25)", zIndex: 100 }}
              >
                {group.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="nav-link block px-4 py-2 text-sm"
                    style={{ color: "rgba(255,255,255,0.85)" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <Link
            href="/data-portal/shariah"
            className="shariah-link px-3 py-2 text-sm rounded transition-colors ml-1 flex items-center gap-1.5"
            style={{ color: "rgba(255,255,255,0.85)", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)" }}
          >
            <span>☪</span> Shariah
          </Link>

          {isAdmin && (
            <Link href="/data-portal/admin" className="px-3 py-1.5 text-xs rounded ml-1" style={{ color: "var(--gold)", border: "1px solid rgba(212,175,55,0.4)" }}>
              ⚙ Admin
            </Link>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 pr-4">
          <LiveClock />
          <Link href="/" className="hidden sm:block text-xs px-3 py-1.5 rounded border transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.12)" }}>
            ← Main Site
          </Link>
          {/* Mobile menu — only client island needed for the toggle */}
          <MobileMenu isAdmin={isAdmin} />
        </div>
      </div>
    </nav>
  );
}
