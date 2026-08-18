"use client";
import { useState } from "react";
import Link from "next/link";

const NAV = [
  {
    label: "Markets",
    items: [
      { label: "Overview", href: "/dashboard" },
      { label: "Daily",    href: "/dashboard/daily"   },
      { label: "Weekly",   href: "/dashboard/weekly"  },
      { label: "Indices",  href: "/dashboard/indices" },
      { label: "Sectors",  href: "/dashboard/sectors" },
    ],
  },
  {
    label: "Companies",
    items: [
      { label: "Directory", href: "/dashboard/companies" },
      { label: "Shariah",   href: "/dashboard/shariah"   },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Screener",        href: "/dashboard/screener"        },
      { label: "Historical Data", href: "/dashboard/historical-data"  },
      { label: "Downloads",       href: "/dashboard/downloads"        },
    ],
  },
  {
    label: "Research",
    items: [
      { label: "Announcements", href: "/dashboard/announcements" },
      { label: "Reports",       href: "/dashboard/research"      },
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
              <Link href="/dashboard/admin" className="text-sm" style={{ color: "var(--gold)" }} onClick={() => setOpen(false)}>
                Admin Panel
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}
