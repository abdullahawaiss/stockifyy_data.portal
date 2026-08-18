// Server component — no "use client". Desktop dropdowns use CSS :hover (zero JS).
// Only LiveClock, MobileMenu, and ThemeToggle are client islands.
import Image from "next/image";
import Link from "next/link";
import LiveClock from "./LiveClock";
import MobileMenu from "./MobileMenu";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  {
    label: "Market Overview",
    items: [
      { label: "Portfolio",        href: "/dashboard/portfolio"    },
      { label: "Daily Market",    href: "/dashboard/daily"        },
      { label: "Weekly Summary",  href: "/dashboard/weekly"       },
      { label: "Indices",         href: "/dashboard/indices"      },
      { label: "Sectors",         href: "/dashboard/sectors"      },
      { label: "Announcements",   href: "/dashboard/announcements"},
      { label: "News",            href: "/dashboard/news"         },
    ],
  },
  {
    label: "Technical",
    items: [
      { label: "Historical Data", href: "/dashboard/historical-data" },
      { label: "Downloads",       href: "/dashboard/downloads"       },
      { label: "Reports",         href: "/dashboard/research"        },
      { label: "Shariah",         href: "/dashboard/shariah"         },
    ],
  },
];

const TICKER_ITEMS = [
  { symbol: "KSE 100",  price: "180,059.79", pct: "-0.69%", up: false },
  { symbol: "KSE ALL",  price: "108,894.65", pct: "-0.46%", up: false },
  { symbol: "KMI ALL",  price: "69,823.76",  pct: "-0.56%", up: false },
  { symbol: "KMI 30",   price: "253,326.40", pct: "-0.94%", up: false },
  { symbol: "OLPL",     price: "49.95",      pct: "-0.03%", up: false },
  { symbol: "PABC",     price: "108.89",     pct: "-2.06%", up: false },
  { symbol: "HALEON",   price: "748.99",     pct: "-0.49%", up: false },
  { symbol: "FHAM",     price: "32.98",      pct: "-0.54%", up: false },
  { symbol: "SCBPL",    price: "66.00",      pct: "0.00%",  up: true  },
  { symbol: "HINO",     price: "380.99",     pct: "-0.06%", up: false },
  { symbol: "COLG",     price: "1,227.77",   pct: "-0.58%", up: false },
  { symbol: "PTL",      price: "53.75",      pct: "+0.45%", up: true  },
  { symbol: "ATBA",     price: "204.80",     pct: "+0.45%", up: true  },
  { symbol: "FEROZ",    price: "380.00",     pct: "+0.07%", up: true  },
  { symbol: "LIVEN",    price: "35.77",      pct: "-0.22%", up: false },
  { symbol: "UBDL",     price: "26.00",      pct: "-4.55%", up: false },
  { symbol: "REDCO",    price: "31.00",      pct: "-1.59%", up: false },
  { symbol: "ATIL",     price: "78.10",      pct: "-1.13%", up: false },
  { symbol: "JDMT",     price: "165.00",     pct: "-1.30%", up: false },
  { symbol: "SARC",     price: "98.00",      pct: "+0.22%", up: true  },
  { symbol: "PPP",      price: "135.00",     pct: "-1.82%", up: false },
  { symbol: "MCBIM",    price: "160.00",     pct: "-0.01%", up: false },
  { symbol: "FEM",      price: "11.13",      pct: "-1.16%", up: false },
  { symbol: "INDU",     price: "1,924.25",   pct: "-0.23%", up: false },
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
          href="/dashboard"
          className="flex items-center gap-3 shrink-0 px-4 h-14"
          style={{ minWidth: 200 }}
        >
          <Image src="/stockifyy-full-logo.png" alt="Stockifyy" width={130} height={37} className="object-contain shrink-0 logo-gold" priority />
          <span className="text-[9px] font-bold tracking-widest uppercase border-l pl-2.5 hidden sm:inline-block" style={{ color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.2)" }}>
            Data Portal
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 px-3">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className="px-3 py-2 text-sm rounded transition-colors nav-link relative z-10"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Dashboard
          </Link>

          {/* Dropdown groups */}
          {NAV.map(group => (
            <div key={group.label} className="nav-group relative">
              <button
                className="px-3 py-2 text-sm rounded transition-colors nav-trigger"
                style={{ color: "rgba(255,255,255,0.85)", background: "transparent" }}
              >
                {group.label} ▾
              </button>
              <div
                className="nav-dropdown absolute top-full left-0 w-44 py-0.5 rounded-lg border mt-1"
                style={{
                  background: "rgba(7,17,31,0.35)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderColor: "rgba(212,175,55,0.12)",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.28)",
                  zIndex: 100,
                }}
              >
                {group.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="nav-link block px-3 py-1.5 text-xs"
                    style={{ color: "rgba(255,255,255,0.82)" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* Advanced Screener */}
          <Link
            href="/dashboard/screener"
            className="px-3 py-2 text-sm rounded transition-colors nav-link"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            Advanced Screener
          </Link>

          {/* Search Companies */}
          <Link
            href="/dashboard/companies"
            className="flex items-center gap-1.5 px-3 py-2 text-sm rounded transition-colors nav-link ml-1"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.75" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M13.5 13.5L17.5 17.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Search Companies
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3 pr-4">
          <LiveClock />
          <ThemeToggle />
          <Link href="/" className="hidden sm:block text-xs px-3 py-1.5 rounded border transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.12)" }}>
            ← Main Site
          </Link>
          <MobileMenu isAdmin={isAdmin} />
        </div>
      </div>
    </nav>
  );
}
