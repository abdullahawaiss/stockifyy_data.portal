"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const NAV = [
  {
    label: "Market",
    items: [
      { label: "Market Overview", href: "/data-portal" },
      { label: "Daily Summary", href: "/data-portal/daily" },
      { label: "Weekly Summary", href: "/data-portal/weekly" },
      { label: "Market Indices", href: "/data-portal/indices" },
      { label: "Sector Summary", href: "/data-portal/sectors" },
      { label: "Market Performers", href: "/data-portal/daily?view=performers" },
    ],
  },
  {
    label: "Companies",
    items: [
      { label: "Company Directory", href: "/data-portal/companies" },
      { label: "Financial Statements", href: "/data-portal/companies?tab=financials" },
      { label: "Dividends", href: "/data-portal/companies?tab=dividends" },
      { label: "☪ Shariah Compliant", href: "/data-portal/shariah" },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Stock Screener", href: "/data-portal/screener" },
      { label: "Historical Data", href: "/data-portal/historical-data" },
      { label: "Data Downloads", href: "/data-portal/downloads" },
    ],
  },
  {
    label: "Information",
    items: [
      { label: "Announcements", href: "/data-portal/announcements" },
      { label: "Research Reports", href: "/data-portal/research" },
      { label: "Weekly Report", href: "/data-portal/research?type=weekly_market" },
    ],
  },
];

const TICKER_ITEMS = [
  { symbol: "KSE-100",  price: "78,432.10", change: "+968.54",  pct: "+1.25%",  up: true  },
  { symbol: "KSE-30",   price: "48,628.55", change: "+418.73",  pct: "+0.87%",  up: true  },
  { symbol: "KMI-30",   price: "45,490.70", change: "+473.10",  pct: "+1.05%",  up: true  },
  { symbol: "OGDC",     price: "142.30",    change: "+6.54",    pct: "+4.82%",  up: true  },
  { symbol: "PSO",      price: "318.75",    change: "+12.00",   pct: "+3.91%",  up: true  },
  { symbol: "LUCK",     price: "894.20",    change: "+27.30",   pct: "+3.15%",  up: true  },
  { symbol: "MCB",      price: "224.50",    change: "+3.80",    pct: "+1.72%",  up: true  },
  { symbol: "ENGRO",    price: "287.60",    change: "+4.20",    pct: "+1.48%",  up: true  },
  { symbol: "MLCF",     price: "41.80",     change: "-1.39",    pct: "-3.22%",  up: false },
  { symbol: "PIOC",     price: "68.25",     change: "-2.02",    pct: "-2.87%",  up: false },
  { symbol: "TRG",      price: "92.40",     change: "+1.15",    pct: "+1.26%",  up: true  },
  { symbol: "HBL",      price: "196.80",    change: "+2.60",    pct: "+1.34%",  up: true  },
  { symbol: "MARI",     price: "2,145.00",  change: "+50.50",   pct: "+2.41%",  up: true  },
  { symbol: "EFERT",    price: "109.60",    change: "+2.93",    pct: "+2.74%",  up: true  },
  { symbol: "FCCL",     price: "33.45",     change: "-0.68",    pct: "-1.98%",  up: false },
  { symbol: "DCL",      price: "22.10",     change: "-0.55",    pct: "-2.43%",  up: false },
  { symbol: "WTL",      price: "14.85",     change: "+0.35",    pct: "+2.41%",  up: true  },
  { symbol: "UBL",      price: "218.30",    change: "+3.10",    pct: "+1.44%",  up: true  },
];

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const dateStr = now.toLocaleDateString("en-PK", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-PK", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  });

  return (
    <div className="hidden xl:flex flex-col items-end leading-tight shrink-0">
      <span className="text-[11px] font-semibold" style={{ color: "var(--gold)" }}>{timeStr}</span>
      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{dateStr} · PKT</span>
    </div>
  );
}

function TickerTape() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div
      className="overflow-hidden"
      style={{
        background: "var(--deep-blue)",
        borderBottom: "1px solid rgba(212,175,55,0.15)",
        height: 28,
      }}
    >
      <div className="ticker-track h-full flex items-center">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center shrink-0 px-5 gap-2 text-[11px]">
            <span className="font-bold tracking-wide" style={{ color: "rgba(255,255,255,0.9)" }}>
              {item.symbol}
            </span>
            <span style={{ color: "rgba(255,255,255,0.65)" }}>{item.price}</span>
            <span
              className="font-semibold"
              style={{ color: item.up ? "#22c55e" : "#ef4444" }}
            >
              {item.up ? "▲" : "▼"} {item.pct}
            </span>
            <span style={{ color: "rgba(212,175,55,0.3)", marginLeft: 4 }}>|</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PortalNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.25)" }}>
      {/* Ticker */}
      <TickerTape />

      {/* Main bar */}
      <div
        className="flex items-center justify-between"
        style={{ background: "var(--navy)", borderBottom: "1px solid rgba(212,175,55,0.15)" }}
      >
        {/* Logo block — gold gradient */}
        <Link
          href="/data-portal"
          className="flex items-center gap-3 shrink-0 px-5 h-14"
          style={{
            background: "linear-gradient(135deg, #B8860B 0%, #E8C84A 45%, #C9A227 100%)",
            minWidth: 195,
          }}
        >
          <Image
            src="/stockifyy-logo.svg"
            alt="Stockifyy"
            width={95}
            height={27}
            className="object-contain shrink-0"
            priority
          />
          <span className="text-[9px] font-bold tracking-widest uppercase border-l pl-2.5 hidden sm:inline-block" style={{ color: "rgba(7,17,31,0.65)", borderColor: "rgba(7,17,31,0.25)" }}>
            Data Portal
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-1 flex-1 px-3">
          {NAV.map((group) => (
            <div
              key={group.label}
              className="relative"
              onMouseEnter={() => setOpen(group.label)}
              onMouseLeave={() => setOpen(null)}
            >
              <button
                className="px-3 py-2 text-sm rounded transition-colors"
                style={{
                  color: open === group.label ? "var(--gold)" : "rgba(255,255,255,0.85)",
                  background: open === group.label ? "rgba(212,175,55,0.08)" : "transparent",
                }}
              >
                {group.label} ▾
              </button>
              {open === group.label && (
                <div
                  className="absolute top-full left-0 w-52 py-1 rounded-lg shadow-2xl border mt-1"
                  style={{ background: "var(--deep-blue)", borderColor: "rgba(212,175,55,0.25)", zIndex: 100 }}
                >
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm transition-colors"
                      style={{
                        color: pathname === item.href ? "var(--gold)" : "rgba(255,255,255,0.85)",
                        background: pathname === item.href ? "rgba(212,175,55,0.08)" : "transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color =
                          pathname === item.href ? "var(--gold)" : "rgba(255,255,255,0.85)")
                      }
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link
            href="/data-portal/shariah"
            className="px-3 py-2 text-sm rounded transition-colors ml-1 flex items-center gap-1.5"
            style={{
              color: pathname === "/data-portal/shariah" ? "#065F46" : "rgba(255,255,255,0.85)",
              background: pathname === "/data-portal/shariah" ? "#D1FAE5" : "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.25)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#D1FAE5"; e.currentTarget.style.color = "#065F46"; }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = pathname === "/data-portal/shariah" ? "#D1FAE5" : "rgba(212,175,55,0.08)";
              e.currentTarget.style.color = pathname === "/data-portal/shariah" ? "#065F46" : "rgba(255,255,255,0.85)";
            }}
          >
            <span>☪</span> Shariah
          </Link>
          {isAdmin && (
            <Link
              href="/data-portal/admin"
              className="px-3 py-1.5 text-xs rounded ml-1"
              style={{ color: "var(--gold)", border: "1px solid rgba(212,175,55,0.4)" }}
            >
              ⚙ Admin
            </Link>
          )}
        </div>

        {/* Right side: clock + back link */}
        <div className="flex items-center gap-4 pr-4">
          <LiveClock />
          <Link
            href="/"
            className="hidden sm:block text-xs px-3 py-1.5 rounded border transition-opacity hover:opacity-70"
            style={{ color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.12)" }}
          >
            ← Main Site
          </Link>
          <button
            className="lg:hidden p-2 rounded"
            style={{ color: "rgba(255,255,255,0.85)" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="lg:hidden border-t py-2"
          style={{ background: "var(--deep-blue)", borderColor: "rgba(212,175,55,0.2)" }}
        >
          {NAV.map((group) => (
            <div key={group.label} className="px-4 py-2">
              <div className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                {group.label}
              </div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-1.5 text-sm"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
          {isAdmin && (
            <div className="px-4 py-2 border-t" style={{ borderColor: "rgba(212,175,55,0.2)" }}>
              <Link href="/data-portal/admin" className="text-sm" style={{ color: "var(--gold)" }} onClick={() => setMobileOpen(false)}>
                ⚙ Admin Panel
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
