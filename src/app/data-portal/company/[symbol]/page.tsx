import type { Metadata } from "next";
import { PSX_STOCKS } from "@/lib/psx-stocks-static";
import { getCompanyDetail } from "@/lib/psx-company-details";
import { db } from "@/db";
import { companies, dailyStockPrices, weeklyStockPrices, sectors, companyAnnouncements } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getPsxRow } from "@/lib/psx-live";
import CompanyClient from "./CompanyClient";

interface Props { params: Promise<{ symbol: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { symbol } = await params;
  return { title: symbol.toUpperCase() };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCompanyData(sym: string): Promise<{ company: any; latestDaily: any; latestWeekly: any; recentDaily: any[]; recentWeekly: any[]; announcements: any[]; fromLive: boolean }> {
  // Try DB first
  try {
    const [company] = await Promise.race([
      db.select({
        id: companies.id, symbol: companies.symbol, name: companies.name,
        sectorId: companies.sectorId, description: companies.description,
        listingDate: companies.listingDate, fiscalYearEnd: companies.fiscalYearEnd,
        website: companies.website, freeFloat: companies.freeFloat,
        shariahStatus: companies.shariahStatus, marketCapCategory: companies.marketCapCategory,
        sectorName: sectors.name,
      }).from(companies).leftJoin(sectors, eq(companies.sectorId, sectors.id))
        .where(eq(companies.symbol, sym)),
      new Promise<never>((_, r) => setTimeout(() => r(new Error("db timeout")), 400)),
    ]);

    if (company) {
      const [latestDaily, latestWeekly, recentDaily, recentWeekly, announcements] = await Promise.all([
        db.select().from(dailyStockPrices).where(eq(dailyStockPrices.symbol, sym)).orderBy(desc(dailyStockPrices.tradingDate)).limit(1).then(r => r[0]),
        db.select().from(weeklyStockPrices).where(eq(weeklyStockPrices.symbol, sym)).orderBy(desc(weeklyStockPrices.weekStartDate)).limit(1).then(r => r[0]),
        db.select().from(dailyStockPrices).where(eq(dailyStockPrices.symbol, sym)).orderBy(desc(dailyStockPrices.tradingDate)).limit(10),
        db.select().from(weeklyStockPrices).where(eq(weeklyStockPrices.symbol, sym)).orderBy(desc(weeklyStockPrices.weekStartDate)).limit(8),
        db.select().from(companyAnnouncements).where(eq(companyAnnouncements.symbol, sym)).orderBy(desc(companyAnnouncements.announcementDate)).limit(5),
      ]);
      return { company, latestDaily, latestWeekly, recentDaily, recentWeekly, announcements, fromLive: false };
    }
  } catch {
    // DB unavailable — fall through to live data
  }

  // Fall back to PSX live data (shared in-memory cache — instant on warm server)
  try {
    const row = await getPsxRow(sym);
    if (row) {
      const detail = getCompanyDetail(sym);
      const company = {
        id: null, symbol: row.symbol, name: row.companyName ?? row.symbol,
        sectorId: row.sectorId, description: null,
        listingDate: detail?.listingDate ?? null,
        fiscalYearEnd: detail?.fiscalYearEnd ?? null,
        website: detail?.website ?? null,
        freeFloat: detail?.freeFloat ?? null,
        shariahStatus: row.shariahStatus ?? detail?.shariahStatus ?? null,
        marketCapCategory: null, sectorName: row.sectorName ?? null,
      };
      const latestDaily = {
        symbol: row.symbol, tradingDate: row.tradingDate,
        open: row.open, high: row.high, low: row.low, close: row.close,
        previousClose: row.previousClose, priceChange: row.priceChange,
        percentageChange: row.percentageChange, volume: row.volume,
        marketValue: row.marketValue, numberOfTrades: row.numberOfTrades,
        weekHigh52: null, weekLow52: null,
      };
      return { company, latestDaily, latestWeekly: null, recentDaily: [latestDaily], recentWeekly: [], announcements: [], fromLive: true };
    }
  } catch {
    // live also failed
  }

  // Final fallback: use static PSX list + company detail lookup
  const staticEntry = PSX_STOCKS.find(s => s.symbol === sym);
  const detail = getCompanyDetail(sym);
  if (staticEntry) {
    const company = {
      id: null, symbol: staticEntry.symbol, name: staticEntry.name,
      sectorId: null, description: null,
      listingDate: detail?.listingDate ?? null,
      fiscalYearEnd: detail?.fiscalYearEnd ?? null,
      website: detail?.website ?? null,
      freeFloat: detail?.freeFloat ?? null,
      shariahStatus: detail?.shariahStatus ?? (staticEntry.shariah ? "Shariah Compliant" : null),
      marketCapCategory: null,
      sectorName: staticEntry.sector,
    };
    return { company, latestDaily: null, latestWeekly: null, recentDaily: [], recentWeekly: [], announcements: [], fromLive: false };
  }

  // Last resort: create a minimal stub so we show something instead of "not found"
  const stubCompany = {
    id: null, symbol: sym, name: sym,
    sectorId: null, description: null,
    listingDate: null, fiscalYearEnd: null,
    website: null, freeFloat: null,
    shariahStatus: null, marketCapCategory: null, sectorName: null,
  };
  return { company: stubCompany, latestDaily: null, latestWeekly: null, recentDaily: [], recentWeekly: [], announcements: [], fromLive: false };
}

export default async function CompanyPage({ params }: Props) {
  const { symbol } = await params;
  const sym = symbol.toUpperCase();

  const { company, latestDaily, latestWeekly, recentDaily, recentWeekly, announcements } = await getCompanyData(sym);

  if (!company) {
    return (
      <div style={{ maxWidth: 600, margin: "80px auto", textAlign: "center", padding: "0 24px" }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: "var(--navy)", marginBottom: 12 }}>Symbol not found: {sym}</p>
        <a href="/data-portal/stocks" style={{ fontSize: 14, color: "var(--gold)" }}>← Back to Stocks</a>
      </div>
    );
  }

  return (
    <CompanyClient
      company={company}
      latestDaily={latestDaily}
      latestWeekly={latestWeekly}
      recentDaily={recentDaily}
      recentWeekly={recentWeekly}
      announcements={announcements}
      sym={sym}
    />
  );
}
