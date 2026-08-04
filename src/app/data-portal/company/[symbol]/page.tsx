import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { companies, dailyStockPrices, weeklyStockPrices, sectors, companyAnnouncements, financialResults, dividends } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatNumber, formatVolume, formatPct, formatChange, getWeekLabel } from "@/lib/utils";

interface Props { params: Promise<{ symbol: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  return { title: symbol.toUpperCase() };
}

export default async function CompanyPage({ params }: Props) {
  const { symbol } = await params;
  const sym = symbol.toUpperCase();

  const [company] = await db
    .select({
      id: companies.id,
      symbol: companies.symbol,
      name: companies.name,
      sectorId: companies.sectorId,
      description: companies.description,
      listingDate: companies.listingDate,
      fiscalYearEnd: companies.fiscalYearEnd,
      website: companies.website,
      freeFloat: companies.freeFloat,
      shariahStatus: companies.shariahStatus,
      marketCapCategory: companies.marketCapCategory,
      sectorName: sectors.name,
    })
    .from(companies)
    .leftJoin(sectors, eq(companies.sectorId, sectors.id))
    .where(eq(companies.symbol, sym));

  if (!company) notFound();

  const [latestDaily] = await db
    .select().from(dailyStockPrices)
    .where(eq(dailyStockPrices.symbol, sym))
    .orderBy(desc(dailyStockPrices.tradingDate)).limit(1);

  const [latestWeekly] = await db
    .select().from(weeklyStockPrices)
    .where(eq(weeklyStockPrices.symbol, sym))
    .orderBy(desc(weeklyStockPrices.weekStartDate)).limit(1);

  const recentDaily = await db
    .select().from(dailyStockPrices)
    .where(eq(dailyStockPrices.symbol, sym))
    .orderBy(desc(dailyStockPrices.tradingDate)).limit(10);

  const recentWeekly = await db
    .select().from(weeklyStockPrices)
    .where(eq(weeklyStockPrices.symbol, sym))
    .orderBy(desc(weeklyStockPrices.weekStartDate)).limit(8);

  const announcements = await db
    .select().from(companyAnnouncements)
    .where(eq(companyAnnouncements.symbol, sym))
    .orderBy(desc(companyAnnouncements.announcementDate)).limit(5);

  const dailyPct = formatPct(latestDaily?.percentageChange);
  const weeklyPct = formatPct(latestWeekly?.weeklyPctChange);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <nav className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        <Link href="/data-portal/companies" className="hover:underline">Companies</Link>
        {" / "}
        <span style={{ color: "var(--navy)", fontWeight: 600 }}>{sym}</span>
      </nav>

      {/* Company header */}
      <div className="card p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold" style={{ color: "var(--navy)" }}>{sym}</h1>
              {company.shariahStatus === "compliant" && (
                <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: "#D1FAE5", color: "#065F46" }}>Shariah Compliant</span>
              )}
              {latestDaily?.isDemo && <span className="badge-demo">Demo Data</span>}
            </div>
            <p className="text-base font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{company.name}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{company.sectorName} · Listed: {company.listingDate ?? "—"}</p>
          </div>
          <div className="text-right">
            {latestDaily ? (
              <>
                <p className="text-3xl font-bold" style={{ color: "var(--navy)" }}>PKR {formatNumber(latestDaily.close)}</p>
                <p className="text-base font-semibold mt-1" style={{ color: dailyPct.positive === true ? "var(--positive)" : dailyPct.positive === false ? "var(--negative)" : "var(--neutral)" }}>
                  {formatChange(latestDaily.priceChange).text} ({dailyPct.text}) Daily
                </p>
                {latestWeekly && (
                  <p className="text-sm font-medium" style={{ color: weeklyPct.positive === true ? "var(--positive)" : weeklyPct.positive === false ? "var(--negative)" : "var(--neutral)" }}>
                    {weeklyPct.text} Weekly
                  </p>
                )}
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>As of {latestDaily.tradingDate}</p>
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No price data available</p>
            )}
          </div>
        </div>

        {latestDaily && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            {[
              { l: "Open", v: formatNumber(latestDaily.open) },
              { l: "High", v: formatNumber(latestDaily.high) },
              { l: "Low", v: formatNumber(latestDaily.low) },
              { l: "Volume", v: formatVolume(latestDaily.volume) },
              { l: "52W High", v: formatNumber(latestDaily.weekHigh52) },
              { l: "52W Low", v: formatNumber(latestDaily.weekLow52) },
            ].map((s) => (
              <div key={s.l} className="text-center">
                <p className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>{s.l}</p>
                <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{s.v}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily data */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <div className="px-4 py-3 border-b font-semibold text-sm" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
              Recent Daily Data
            </div>
            {recentDaily.length === 0 ? (
              <p className="px-4 py-6 text-sm" style={{ color: "var(--text-muted)" }}>No daily data.</p>
            ) : (
              <div className="table-scroll">
                <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ background: "var(--light-bg)" }}>
                      {["Date", "Close", "Open", "High", "Low", "Chg %", "Volume"].map((h) => (
                        <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b text-right first:text-left" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentDaily.map((r, i) => {
                      const pct = formatPct(r.percentageChange);
                      return (
                        <tr key={r.tradingDate} style={{ background: i % 2 === 0 ? "var(--white)" : "var(--light-bg)" }}>
                          <td className="px-3 py-2 border-b text-left" style={{ borderColor: "var(--border)" }}>{r.tradingDate}</td>
                          <td className="px-3 py-2 border-b text-right font-medium" style={{ borderColor: "var(--border)" }}>{formatNumber(r.close)}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatNumber(r.open)}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--positive)" }}>{formatNumber(r.high)}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--negative)" }}>{formatNumber(r.low)}</td>
                          <td className="px-3 py-2 border-b text-right font-semibold" style={{ borderColor: "var(--border)", color: pct.positive === true ? "var(--positive)" : pct.positive === false ? "var(--negative)" : "var(--neutral)" }}>{pct.text}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatVolume(r.volume)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Weekly data */}
          <div className="card">
            <div className="px-4 py-3 border-b font-semibold text-sm" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
              Recent Weekly Data
            </div>
            {recentWeekly.length === 0 ? (
              <p className="px-4 py-6 text-sm" style={{ color: "var(--text-muted)" }}>
                No weekly data. Run <code>pnpm aggregate:weekly</code> to generate.
              </p>
            ) : (
              <div className="table-scroll">
                <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                  <thead>
                    <tr style={{ background: "var(--light-bg)" }}>
                      {["Week", "W. Close", "W. Open", "W. High", "W. Low", "W. Chg %", "W. Volume", "Sessions"].map((h) => (
                        <th key={h} className="px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b text-right first:text-left" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentWeekly.map((r, i) => {
                      const pct = formatPct(r.weeklyPctChange);
                      return (
                        <tr key={r.weekStartDate} style={{ background: i % 2 === 0 ? "var(--white)" : "var(--light-bg)" }}>
                          <td className="px-3 py-2 border-b text-left text-xs" style={{ borderColor: "var(--border)" }}>{getWeekLabel(r.weekStartDate)}</td>
                          <td className="px-3 py-2 border-b text-right font-medium" style={{ borderColor: "var(--border)" }}>{formatNumber(r.weeklyClose)}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatNumber(r.weeklyOpen)}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--positive)" }}>{formatNumber(r.weeklyHigh)}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--negative)" }}>{formatNumber(r.weeklyLow)}</td>
                          <td className="px-3 py-2 border-b text-right font-semibold" style={{ borderColor: "var(--border)", color: pct.positive === true ? "var(--positive)" : pct.positive === false ? "var(--negative)" : "var(--neutral)" }}>{pct.text}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>{formatVolume(r.totalWeeklyVolume)}</td>
                          <td className="px-3 py-2 border-b text-right" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>{r.tradingSessionsCount}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Company info */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>Company Information</h2>
            <div className="space-y-2">
              {[
                { l: "Symbol", v: sym },
                { l: "Full Name", v: company.name },
                { l: "Sector", v: company.sectorName ?? "—" },
                { l: "Listing Date", v: company.listingDate ?? "—" },
                { l: "Fiscal Year End", v: company.fiscalYearEnd ?? "—" },
                { l: "Shariah Status", v: company.shariahStatus },
                { l: "Free Float", v: company.freeFloat ? company.freeFloat + "%" : "—" },
                { l: "Website", v: company.website ?? "—" },
              ].map((item) => (
                <div key={item.l} className="flex justify-between py-1.5 border-b" style={{ borderColor: "var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{item.l}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{item.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="card">
            <div className="px-4 py-3 border-b font-semibold text-sm" style={{ borderColor: "var(--border)", color: "var(--navy)" }}>
              Recent Announcements
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {announcements.map((a) => (
                <div key={a.id} className="px-4 py-3">
                  <p className="text-xs font-medium leading-snug" style={{ color: "var(--text-primary)" }}>{a.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{a.announcementDate} · {a.announcementType}</p>
                </div>
              ))}
              {announcements.length === 0 && <p className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>No announcements.</p>}
            </div>
          </div>

          {/* Navigation to screener/historical */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--navy)" }}>More Tools</h3>
            {[
              { label: "Historical Data for " + sym, href: `/data-portal/historical-data?symbol=${sym}` },
              { label: "Compare with other stocks", href: `/data-portal/screener` },
              { label: "All Announcements", href: `/data-portal/announcements?symbol=${sym}` },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="block py-2 text-sm border-b hover:opacity-70" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                {link.label} <span style={{ color: "var(--gold)" }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
