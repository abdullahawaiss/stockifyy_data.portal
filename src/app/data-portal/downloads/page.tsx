import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Data Downloads" };

export default function DownloadsPage() {
  const downloads = [
    {
      category: "Daily Market Data",
      items: [
        { label: "Daily Prices (Today)", href: "/api/portal/daily/export?format=csv", desc: "All daily OHLCV for latest trading date (CSV)" },
        { label: "Daily Prices (Custom Date)", href: "/data-portal/historical-data", desc: "Use the Historical Data tool to select a specific date" },
      ],
    },
    {
      category: "Weekly Market Data",
      items: [
        { label: "Weekly Aggregated Data (Current Week)", href: "/api/portal/weekly/export?format=csv", desc: "Aggregated weekly OHLCV for current week (CSV)" },
        { label: "Weekly Data (Custom Week)", href: "/data-portal/weekly", desc: "Use the Weekly page to select a week and export" },
      ],
    },
    {
      category: "Company Information",
      items: [
        { label: "Company Directory", href: "/api/portal/companies/export?format=csv", desc: "All listed companies with sector and Shariah status (CSV)" },
      ],
    },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--navy)" }}>Data Downloads</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Download market data in CSV and Excel formats</p>
      </div>

      <div
        className="card p-4 mb-6 text-sm"
        style={{ background: "#FEF3C7", borderColor: "#FCD34D", color: "#92400E" }}
      >
        <strong>Demo Data Notice:</strong> All downloadable datasets currently contain demo data for demonstration purposes only.
        Real market data requires an authorised data provider licence and import.
      </div>

      <div className="space-y-5">
        {downloads.map((section) => (
          <div key={section.category} className="card">
            <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--light-bg)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--navy)" }}>{section.category}</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {section.items.map((item) => (
                <div key={item.label} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="shrink-0 px-4 py-1.5 rounded text-xs font-semibold"
                    style={{ background: "var(--navy)", color: "var(--gold)" }}
                  >
                    Download
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
