"use client";
import { useState } from "react";
import Link from "next/link";

const NAV = [
  {
    label: "Market",
    items: [
      { label: "Market Overview",    href: "/data-portal" },
      { label: "Daily Summary",      href: "/data-portal/daily" },
      { label: "Weekly Summary",     href: "/data-portal/weekly" },
      { label: "Market Indices",     href: "/data-portal/indices" },
      { label: "Sector Summary",     href: "/data-portal/sectors" },
      { label: "Market Performers",  href: "/data-portal/daily?view=performers" },
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
      { label: "Announcements",  href: "/data-portal/announcements" },
      { label: "Research Reports", href: "/data-portal/research" },
      { label: "Weekly Report",  href: "/data-portal/research?type=weekly_market" },
    ],
  },
];

export default function MobileMenu({ isAdmin }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="lg:hidden p-2 rounded"
        style={{ color: "rgba(255,255,255,0.85)" }}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <div
          className="lg:hidden absolute top-full left-0 right-0 border-t py-2 z-50"
          style={{ background: "var(--deep-blue)", borderColor: "rgba(212,175,55,0.2)" }}
        >
          {NAV.map(group => (
            <div key={group.label} className="px-4 py-2">
              <div className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                {group.label}
              </div>
              {group.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block py-1.5 text-sm"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
          {isAdmin && (
            <div className="px-4 py-2 border-t" style={{ borderColor: "rgba(212,175,55,0.2)" }}>
              <Link href="/data-portal/admin" className="text-sm" style={{ color: "var(--gold)" }} onClick={() => setOpen(false)}>
                ⚙ Admin Panel
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
