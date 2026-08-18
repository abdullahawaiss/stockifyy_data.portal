"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { getMarketStatus } from "@/app/data-portal/_data";

function MarketStatusPill({ collapsed }: { collapsed: boolean }) {
  const [s, setS] = useState(() => getMarketStatus());
  useEffect(() => {
    const id = setInterval(() => setS(getMarketStatus()), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
        gap: 6, padding: collapsed ? "6px 0" : "6px 10px",
        margin: "4px 6px",
        borderRadius: 8,
        background: s.open ? "rgba(22,163,74,0.10)" : "rgba(100,116,139,0.10)",
        border: `1px solid ${s.open ? "rgba(22,163,74,0.20)" : "rgba(100,116,139,0.15)"}`,
      }}
    >
      <span style={{
        width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
        background: s.open ? "#4ade80" : "#94a3b8",
        boxShadow: s.open ? "0 0 6px #4ade80" : "none",
        animation: s.open ? "pulse 2s infinite" : "none",
        display: "inline-block",
      }} />
      {!collapsed && (
        <span style={{ fontSize: 10.5, fontWeight: 700, color: s.open ? "#4ade80" : "#94a3b8", letterSpacing: "0.04em" }}>
          {s.label}
        </span>
      )}
    </div>
  );
}

// ── Nav tree ──────────────────────────────────────────────────
const NAV = [
  {
    label: "Dashboard",
    href: "/data-portal",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path d="M2 4a2 2 0 012-2h3a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm0 10a2 2 0 012-2h3a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm9-10a2 2 0 012-2h3a2 2 0 012 2v2a2 2 0 01-2 2h-3a2 2 0 01-2-2V4zm0 8a2 2 0 012-2h3a2 2 0 012 2v4a2 2 0 01-2 2h-3a2 2 0 01-2-2v-4z" />
      </svg>
    ),
  },
  {
    label: "My Portfolio",
    href: "/data-portal/portfolio",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    label: "Stocks",
    href: "/data-portal/stocks",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    label: "Market",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    ),
    items: [
      { label: "Today's Summary",          href: "/data-portal/market/summary"         },
      { label: "Market Indices",            href: "/data-portal/market/indices"         },
      { label: "Fixed Income Securities",   href: "/data-portal/market/fixed-income"    },
      { label: "Sector Summary",            href: "/data-portal/market/sectors"         },
      { label: "Stock Screener",            href: "/data-portal/market/screener"        },
      { label: "Historical Data",           href: "/data-portal/market/historical"      },
      { label: "Eligible Scrips",           href: "/data-portal/market/eligible-scrips" },
      { label: "Graphical View",            href: "/data-portal/market/graphical"       },
    ],
  },
  {
    label: "Announcements",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"/>
      </svg>
    ),
    items: [
      { label: "PSX Notices",                  href: "/data-portal/announcements/psx-notices"       },
      { label: "Company Announcements",         href: "/data-portal/announcements/company"           },
      { label: "Corporate Briefing (CBS)",      href: "/data-portal/announcements/cbs"               },
      { label: "CDC Notices",                   href: "/data-portal/announcements/cdc"               },
      { label: "SECP Notices",                  href: "/data-portal/announcements/secp"              },
      { label: "NCCPL Notices",                 href: "/data-portal/announcements/nccpl"             },
      { label: "AGM/EOGM Calendar",             href: "/data-portal/announcements/agm"               },
      { label: "Payouts",                       href: "/data-portal/announcements/payouts"           },
      { label: "GIS Auction Results",           href: "/data-portal/announcements/gis-auction"       },
    ],
  },
  {
    label: "Companies",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
      </svg>
    ),
    items: [
      { label: "Listing Status",               href: "/data-portal/companies/listing-status"  },
      { label: "Circuit Breakers",              href: "/data-portal/companies/circuit-breakers"},
    ],
  },
  {
    label: "Reports",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
      </svg>
    ),
    items: [
      { label: "Downloads",                    href: "/data-portal/reports/downloads"          },
      { label: "Financial Reports",             href: "/data-portal/reports/financial"          },
      { label: "Analysis Reports",              href: "/data-portal/reports/analysis"           },
      { label: "ND Verification",               href: "/data-portal/reports/nd-verification"   },
      { label: "PSX Indices Div. Discount",     href: "/data-portal/reports/indices-discount"  },
      { label: "Monthly Reports",               href: "/data-portal/reports/monthly"            },
      { label: "5 Years Progress Report",       href: "/data-portal/reports/5yr-progress"      },
    ],
  },
];

// ── Sidebar widths ─────────────────────────────────────────────
const W_EXPANDED = 168;
const W_COLLAPSED = 56;

// ── Tooltip (collapsed mode hover) ────────────────────────────
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div
          className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap pointer-events-none z-[200]"
          style={{
            background: "rgba(7,17,31,0.92)",
            color: "#fff",
            border: "1px solid rgba(212,175,55,0.2)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          {label}
          <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent" style={{ borderRightColor: "rgba(7,17,31,0.92)" }} />
        </div>
      )}
    </div>
  );
}

// ── Single nav item ────────────────────────────────────────────
function NavItem({
  item,
  collapsed,
  onMobileClose,
}: {
  item: typeof NAV[number];
  collapsed: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const hasChildren = "items" in item && !!item.items?.length;

  const isActive = hasChildren
    ? item.items!.some(i => pathname === i.href)
    : pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard");

  const isChildActive = hasChildren && item.items!.some(i => pathname === i.href);

  // Auto-open group if a child is active
  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  const activeColor = "#D4AF37";

  if (!hasChildren) {
    const row = (
      <Link
        href={item.href!}
        onClick={onMobileClose}
        className="group flex items-center gap-2.5 px-2.5 rounded-lg relative"
        style={{ transition: "background 160ms ease, color 160ms ease" }}
        style={{
          height: 36,
          background: isActive ? "rgba(212,175,55,0.12)" : "transparent",
          color: isActive ? activeColor : "rgba(255,255,255,0.72)",
        }}
      >
        {/* Active indicator bar */}
        {isActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full"
            style={{ height: 22, background: activeColor, boxShadow: `0 0 6px ${activeColor}` }}
          />
        )}
        <span
          className="flex-shrink-0 transition-all duration-200"
          style={{
            color: isActive ? activeColor : "rgba(255,255,255,0.55)",
            transform: "translateX(0)",
          }}
          onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.transform = "translateX(2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateX(0)"; }}
        >
          {item.icon}
        </span>
        {!collapsed && (
          <span className="text-[12px] font-medium tracking-tight truncate">
            {item.label}
          </span>
        )}
      </Link>
    );

    return collapsed ? <Tooltip label={item.label}>{row}</Tooltip> : row;
  }

  // Group with children
  const trigger = (
    <button
      onClick={() => !collapsed && setOpen(o => !o)}
      className="group w-full flex items-center gap-2.5 px-2.5 rounded-lg relative"
      style={{ transition: "background 160ms ease, color 160ms ease" }}
      style={{
        height: 36,
        background: isChildActive ? "rgba(212,175,55,0.08)" : "transparent",
        color: isChildActive ? activeColor : "rgba(255,255,255,0.72)",
        cursor: "pointer",
      }}
    >
      {isChildActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full"
          style={{ height: 22, background: activeColor, boxShadow: `0 0 6px ${activeColor}` }}
        />
      )}
      <span
        className="flex-shrink-0"
        style={{ color: isChildActive ? activeColor : "rgba(255,255,255,0.55)" }}
      >
        {item.icon}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left text-[12.5px] font-medium tracking-tight truncate">
            {item.label}
          </span>
          <span
            className="flex-shrink-0 transition-transform duration-200"
            style={{
              transform: open ? "rotate(90deg)" : "rotate(0deg)",
              color: "rgba(255,255,255,0.35)",
              fontSize: 10,
            }}
          >
            ▶
          </span>
        </>
      )}
    </button>
  );

  return (
    <div>
      {collapsed ? <Tooltip label={item.label}>{trigger}</Tooltip> : trigger}

      {/* Submenu */}
      {!collapsed && (
        <div
          style={{
            maxHeight: open ? `${item.items!.length * 32}px` : "0px",
            overflow: "hidden",
            transition: "max-height 200ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div className="ml-6 mt-0.5 mb-0.5 flex flex-col">
            {item.items!.map(sub => {
              const subActive = pathname === sub.href;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  onClick={onMobileClose}
                  className="block px-2.5 rounded-md text-[11px] leading-tight"
                  style={{
                    padding: "5px 10px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: subActive ? activeColor : "rgba(255,255,255,0.52)",
                    background: subActive ? "rgba(212,175,55,0.1)" : "transparent",
                    fontWeight: subActive ? 600 : 400,
                    transition: "background 130ms ease, color 130ms ease",
                  }}
                  onMouseEnter={e => { if (!subActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (!subActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {sub.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ticker tape (horizontal, inside sidebar top) ───────────────
// Removed from sidebar — ticker remains in top utility bar

// ── Main Sidebar ───────────────────────────────────────────────
export default function PortalSidebar({ isAdmin }: { isAdmin?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Sync collapsed state to CSS variable on :root so layout can react
  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? `${W_COLLAPSED}px` : `${W_EXPANDED}px`);
  }, [collapsed]);

  // Close mobile drawer on route change
  const pathname = usePathname();
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Close mobile drawer on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handle = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [mobileOpen]);

  const sidebarBg = "rgba(7,17,31,0.96)";
  const w = collapsed ? W_COLLAPSED : W_EXPANDED;

  return (
    <>
      {/* ── Mobile overlay ─────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[45] lg:hidden"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ──────────────────── */}
      {mobileOpen && (
        <aside
          ref={sidebarRef}
          className="fixed left-0 top-0 bottom-0 z-[46] flex flex-col lg:hidden portal-slide-in"
          style={{
            width: W_EXPANDED,
            background: sidebarBg,
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
            borderRight: "1px solid rgba(212,175,55,0.1)",
            boxShadow: "4px 0 32px rgba(0,0,0,0.35)",
          }}
        >
          <div className="flex items-center gap-2.5 shrink-0" style={{ height: 54, padding: "0 14px", borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
            <img src="/stockifyy-full-logo.png" alt="Stockifyy" className="logo-gold" style={{ height: 38, width: "auto", maxWidth: 140, objectFit: "contain" }} />
            <button onClick={() => setMobileOpen(false)} className="ml-auto" style={{ color: "rgba(255,255,255,0.4)" }}>✕</button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2 px-1.5 flex flex-col gap-0" style={{ scrollbarWidth: "none" }}>
            <div className="px-2 pt-2 pb-1" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>Main</div>
            {NAV.map(item => (
              <NavItem key={item.label} item={item} collapsed={false} onMobileClose={() => setMobileOpen(false)} />
            ))}
          </nav>
          <div className="shrink-0 px-2 py-2.5" style={{ borderTop: "1px solid rgba(212,175,55,0.08)" }}>
            <MarketStatusPill collapsed={false} />
            <div className="flex items-center gap-2.5 px-1">
              <ThemeToggle />
              <Link href="/" className="text-[10.5px] px-2 py-1 rounded border" style={{ color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.1)" }}>← Main Site</Link>
            </div>
          </div>
        </aside>
      )}

      {/* ── Mobile hamburger ───────────────── */}
      <button
        className="fixed top-3 left-3 z-50 lg:hidden flex items-center justify-center rounded-lg"
        style={{
          width: 38, height: 38,
          background: "rgba(7,17,31,0.92)",
          border: "1px solid rgba(212,175,55,0.2)",
          color: "rgba(255,255,255,0.85)",
        }}
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          {mobileOpen
            ? <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            : <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          }
        </svg>
      </button>

      {/* ── Sidebar shell ──────────────────── */}
      <aside
        ref={sidebarRef}
        className="fixed left-0 top-0 bottom-0 z-50 flex-col hidden lg:flex portal-slide-in"
        style={{
          width: w,
          background: sidebarBg,
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          borderRight: "1px solid rgba(212,175,55,0.1)",
          boxShadow: "4px 0 32px rgba(0,0,0,0.35)",
          transition: "width 240ms cubic-bezier(0.4,0,0.2,1)",
          overflow: "hidden",
        }}
      >
        {/* ── Decorative background ─────────── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
          {/* Animated gold ray — primary */}
          <div className="sidebar-ray sidebar-ray-1" />
          {/* Animated gold ray — secondary, offset */}
          <div className="sidebar-ray sidebar-ray-2" />
          {/* Blue/teal radial glow — lower area */}
          <div style={{
            position: "absolute", bottom: "18%", right: "-30%",
            width: 260, height: 260, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(30,120,200,0.09) 0%, transparent 70%)",
          }} />
          {/* Gold corner glow — top left */}
          <div style={{
            position: "absolute", top: "2%", left: "-20%",
            width: 180, height: 180, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)",
          }} />
        </div>

        {/* ── Logo area ────────────────────── */}
        <div
          className="flex items-center gap-2 shrink-0"
          style={{
            height: 54,
            padding: collapsed ? "0 0 0 14px" : "0 10px 0 14px",
            borderBottom: "1px solid rgba(212,175,55,0.1)",
            position: "relative", zIndex: 1,
          }}
        >
          {/* Logo — hidden when collapsed */}
          {!collapsed && (
            <img
              src="/stockifyy-full-logo.png"
              alt="Stockifyy"
              className="logo-gold portal-fade"
              style={{ height: 38, width: "auto", maxWidth: 148, objectFit: "contain", flexShrink: 0, animationDelay: "120ms" }}
            />
          )}

          {/* Collapse toggle — visible only when expanded */}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex items-center justify-center rounded ml-auto"
              style={{ width: 20, height: 20, flexShrink: 0, color: "rgba(255,255,255,0.28)" }}
              title="Collapse"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Expand button (collapsed mode only) ─ */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="hidden lg:flex items-center justify-center mx-auto mt-1.5 rounded"
            style={{ width: 28, height: 22, color: "rgba(255,255,255,0.28)" }}
            title="Expand"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}

        {/* ── Nav items ────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1.5 flex flex-col gap-0" style={{ scrollbarWidth: "none", position: "relative", zIndex: 1 }}>
          {/* Section label */}
          {!collapsed && (
            <div className="px-2 pt-2 pb-1" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>
              Main
            </div>
          )}
          {NAV.map((item, idx) => (
            <div
              key={item.label}
              className="portal-fade-up"
              style={{ animationDelay: `${100 + idx * 48}ms` }}
            >
              <NavItem item={item} collapsed={collapsed} onMobileClose={() => setMobileOpen(false)} />
            </div>
          ))}

        </nav>

        {/* ── Market Status ─────────────────── */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <MarketStatusPill collapsed={collapsed} />
        </div>

        {/* ── Bottom: Theme + Main Site ─────── */}
        <div
          className="shrink-0 px-1.5 py-2.5"
          style={{ borderTop: "1px solid rgba(212,175,55,0.08)", position: "relative", zIndex: 1 }}
        >
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5 px-1"}`}>
            <ThemeToggle />
            {!collapsed && (
              <Link
                href="/"
                className="text-[10.5px] px-2 py-1 rounded border transition-opacity hover:opacity-70"
                style={{ color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.1)" }}
              >
                ← Main Site
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
