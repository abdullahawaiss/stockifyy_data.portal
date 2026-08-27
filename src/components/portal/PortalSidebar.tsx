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
  const color = s.open ? "#4ade80" : "#94a3b8";
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "3px 7px",
        borderRadius: 20,
        flexShrink: 0,
        background: s.open ? "rgba(22,163,74,0.12)" : "rgba(100,116,139,0.12)",
        border: `1px solid ${s.open ? "rgba(22,163,74,0.25)" : "rgba(100,116,139,0.2)"}`,
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
        background: color,
        boxShadow: s.open ? `0 0 6px ${color}` : "none",
        display: "inline-block",
      }} />
      {!collapsed && (
        <span style={{ fontSize: 9.5, fontWeight: 700, color, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: "Stocks",
    href: "/data-portal/stocks",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
  {
    label: "Watch-List",
    href: "/data-portal/watchlist",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    label: "Portfolio",
    href: "/data-portal/portfolio",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
  },
  {
    label: "Heatmap",
    href: "/data-portal/heatmap",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
        <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
      </svg>
    ),
  },
  {
    label: "Technical Chart",
    href: "/data-portal/technical-chart",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
        <polyline points="2 20 7 13 12 17 17 8 22 4"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
  },
  {
    label: "Screener",
    href: "/data-portal/screener",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
    ),
  },
  {
    label: "Alerts",
    href: "/data-portal/alerts",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
    ),
  },
  {
    label: "Tools",
    href: "/data-portal/tools",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    label: "Reports",
    href: "/data-portal/reports",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
];

// ── Sidebar widths ─────────────────────────────────────────────
const W_EXPANDED = 148;
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
  const isActive = pathname === item.href || (item.href === "/data-portal" && pathname === "/data-portal");
  const activeColor = "#D4971A";

  const row = (
    <Link
      href={item.href}
      onClick={onMobileClose}
      className="group flex items-center gap-2.5 px-2.5 rounded-lg relative"
      style={{
        transition: "background 160ms ease, color 160ms ease",
        height: 38,
        background: isActive ? "rgba(212,175,55,0.12)" : "transparent",
        color: isActive ? activeColor : "rgba(255,255,255,0.7)",
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 rounded-full"
          style={{ height: 22, background: activeColor, boxShadow: `0 0 6px ${activeColor}` }}
        />
      )}
      <span className="flex-shrink-0" style={{ color: isActive ? activeColor : "rgba(255,255,255,0.5)" }}>
        {item.icon}
      </span>
      {!collapsed && (
        <span className="text-[12.5px] font-medium tracking-tight truncate">
          {item.label}
        </span>
      )}
    </Link>
  );

  return collapsed ? <Tooltip label={item.label}>{row}</Tooltip> : row;
}

// ── Ticker tape (horizontal, inside sidebar top) ───────────────
// Removed from sidebar — ticker remains in top utility bar

// ── Logout button ──────────────────────────────────────────────
function LogoutButton({ collapsed }: { collapsed: boolean }) {
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    // Full navigation reset — clears in-memory state and prevents Back-button replay.
    window.location.replace("/auth/login");
  };
  const btn = (
    <button
      onClick={handleLogout}
      aria-label="Log out"
      className="group flex items-center gap-2.5 px-2.5 rounded-lg w-full"
      style={{
        height: 36, background: "transparent", border: "none", cursor: "pointer",
        color: "rgba(255,255,255,0.45)", transition: "background 160ms ease, color 160ms ease",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.10)"; (e.currentTarget as HTMLElement).style.color = "#FCA5A5"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
    >
      <span className="flex-shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </span>
      {!collapsed && <span className="text-[12.5px] font-medium tracking-tight truncate">Log Out</span>}
    </button>
  );
  return collapsed ? <Tooltip label="Log Out">{btn}</Tooltip> : btn;
}

// ── Main Sidebar ───────────────────────────────────────────────
export default function PortalSidebar({ isAdmin, userName, userRole }: { isAdmin?: boolean; userName?: string; userRole?: string }) {
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
            <Link href="/data-portal" style={{ textDecoration: "none", flexShrink: 0 }} onClick={() => setMobileOpen(false)}>
              <img src="/stockifyy-full-logo.png" alt="Stockifyy" style={{ height: 38, width: "auto", maxWidth: 160, objectFit: "contain", objectPosition: "left center", filter: "none", display: "block" }} />
            </Link>
            <button onClick={() => setMobileOpen(false)} className="ml-auto" style={{ color: "rgba(255,255,255,0.4)" }}>✕</button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2 px-1.5 flex flex-col gap-0" style={{ scrollbarWidth: "none" }}>
            <div className="px-2 pt-2 pb-1" style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>Main</div>
            {NAV.map(item => (
              <NavItem key={item.label} item={item} collapsed={false} onMobileClose={() => setMobileOpen(false)} />
            ))}
          </nav>
          <div className="shrink-0 px-2 py-2" style={{ borderTop: "1px solid rgba(212,175,55,0.08)" }}>
            {userName && (
              <div style={{ padding: "4px 8px 5px", marginBottom: 3 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.70)" }}>{userName}</div>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".10em", textTransform: "uppercase", color: "rgba(212,175,55,0.60)", marginTop: 1 }}>{userRole ?? "client"}</div>
              </div>
            )}
            <LogoutButton collapsed={false} />
            <div className="flex items-center gap-2.5 px-1 mt-1">
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
          className="flex items-center shrink-0"
          style={{
            height: 54,
            paddingLeft: 10,
            paddingRight: 6,
            borderBottom: "1px solid rgba(212,175,55,0.1)",
            position: "relative", zIndex: 1,
          }}
        >
          {/* Logo — hidden when collapsed, click → dashboard */}
          {!collapsed && (
            <Link href="/data-portal" className="portal-fade" style={{ animationDelay: "120ms", textDecoration: "none", display: "flex", alignItems: "center", flexShrink: 0 }}>
              <img
                src="/stockifyy-full-logo.png"
                alt="Stockifyy — Go to Dashboard"
                style={{ height: 32, width: "auto", maxWidth: 145, objectFit: "contain", objectPosition: "left center", filter: "none", display: "block" }}
              />
            </Link>
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

        {/* ── Bottom: User info + Logout + Theme ── */}
        <div
          className="shrink-0 px-1.5 py-2"
          style={{ borderTop: "1px solid rgba(212,175,55,0.08)", position: "relative", zIndex: 1 }}
        >
          {/* User identity strip */}
          {!collapsed && userName && (
            <div style={{ padding: "5px 10px 6px", marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.70)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userName}
              </div>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: ".10em", textTransform: "uppercase", color: "rgba(212,175,55,0.60)", marginTop: 1 }}>
                {userRole ?? "client"}
              </div>
            </div>
          )}

          {/* Logout */}
          <LogoutButton collapsed={collapsed} />

          {/* Theme + Main Site */}
          <div className={`flex items-center mt-1 ${collapsed ? "justify-center" : "gap-2.5 px-1"}`}>
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
