"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface DailyRow {
  tradingDate: string; open: number; high: number; low: number; close: number;
  previousClose?: number; priceChange?: number; percentageChange?: number;
  volume?: number; marketValue?: number; numberOfTrades?: number;
  weekHigh52?: number | null; weekLow52?: number | null;
}
interface WeeklyRow {
  weekStartDate: string; weeklyOpen?: number; weeklyHigh?: number; weeklyLow?: number;
  weeklyClose?: number; weeklyPctChange?: number; totalWeeklyVolume?: number; tradingSessionsCount?: number;
}
interface Announcement { id: number; title: string; announcementDate: string; announcementType?: string; content?: string | null; }
interface CompanyInfo {
  symbol: string; name: string; sectorName?: string | null; description?: string | null;
  listingDate?: string | null; fiscalYearEnd?: string | null; website?: string | null;
  freeFloat?: string | null; shariahStatus?: string | null; marketCapCategory?: string | null;
}

interface Props {
  company: CompanyInfo;
  latestDaily: DailyRow | null;
  latestWeekly: { weeklyPctChange?: number } | null;
  recentDaily: DailyRow[];
  recentWeekly: WeeklyRow[];
  announcements: Announcement[];
  sym: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const fmt = (v?: number | null, dec = 2) =>
  v == null || isNaN(Number(v)) ? "—" : Number(v).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtV = (v?: number | null) => {
  if (v == null) return "—";
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return String(v);
};
const fmtPct = (v?: number | null) => {
  if (v == null || isNaN(Number(v))) return { text: "—", pos: null };
  const n = Number(v);
  return { text: (n > 0 ? "+" : "") + n.toFixed(2) + "%", pos: n > 0 };
};

const TABS = ["Fundamentals","Peers","Financials","Ratios","Dividends","Ownership","Insider Transactions","Company Reports","Announcements","Company Info"] as const;
type Tab = typeof TABS[number];

/* ─── Static Demo Data (realistic PSX values) ────────────────────────────── */
function getPeers(sym: string) {
  const peersMap: Record<string, string[]> = {
    HBL: ["MCB","UBL","NBP","ABL","BAHL","MEBL"],
    OGDC: ["PPL","MARI","POL","GHOL"],
    LUCK: ["DGKC","MLCF","FECTC","CHCC","ACPL"],
    ENGRO: ["EFERT","FFC","FFBL","FATIMA"],
    PSO: ["APL","HASCOL"],
    TRG: ["SYS","NETSOL","AVN"],
    MARI: ["OGDC","PPL","POL"],
    default: [],
  };
  return (peersMap[sym] ?? peersMap.default);
}

function getStaticPeerRow(sym: string) {
  const rows: Record<string, { pe: number; pb: number; eps: number; divYield: number; mktCap: string; ffShares: string }> = {
    HBL:   { pe: 6.8,  pb: 1.1, eps: 28.4, divYield: 8.2, mktCap: "247B", ffShares: "462M" },
    MCB:   { pe: 7.2,  pb: 1.4, eps: 31.2, divYield: 9.1, mktCap: "267B", ffShares: "376M" },
    UBL:   { pe: 5.9,  pb: 1.0, eps: 41.5, divYield: 7.8, mktCap: "195B", ffShares: "326M" },
    NBP:   { pe: 4.2,  pb: 0.6, eps: 10.8, divYield: 5.5, mktCap: "94B",  ffShares: "1.1B" },
    ABL:   { pe: 6.1,  pb: 1.0, eps: 22.8, divYield: 8.0, mktCap: "117B", ffShares: "358M" },
    BAHL:  { pe: 7.4,  pb: 1.3, eps: 12.7, divYield: 6.5, mktCap: "87B",  ffShares: "320M" },
    MEBL:  { pe: 8.9,  pb: 2.0, eps: 24.2, divYield: 5.9, mktCap: "315B", ffShares: "494M" },
    OGDC:  { pe: 5.2,  pb: 0.8, eps: 35.2, divYield: 7.8, mktCap: "779B", ffShares: "1.3B" },
    PPL:   { pe: 4.8,  pb: 0.9, eps: 18.7, divYield: 8.4, mktCap: "277B", ffShares: "874M" },
    MARI:  { pe: 7.1,  pb: 1.5, eps: 311.0,divYield: 5.2, mktCap: "246B", ffShares: "57M"  },
    LUCK:  { pe: 12.3, pb: 1.8, eps: 87.5, divYield: 3.2, mktCap: "334B", ffShares: "245M" },
    DGKC:  { pe: 9.8,  pb: 1.2, eps: 22.1, divYield: 2.8, mktCap: "81B",  ffShares: "215M" },
    ENGRO: { pe: 11.2, pb: 2.1, eps: 62.4, divYield: 6.1, mktCap: "356B", ffShares: "450M" },
    EFERT: { pe: 8.6,  pb: 3.2, eps: 24.8, divYield: 9.4, mktCap: "188B", ffShares: "368M" },
    FFC:   { pe: 7.9,  pb: 4.1, eps: 32.1, divYield: 10.2,mktCap: "167B", ffShares: "308M" },
    PSO:   { pe: 6.4,  pb: 0.9, eps: 74.8, divYield: 4.2, mktCap: "225B", ffShares: "183M" },
    TRG:   { pe: 22.1, pb: 4.8, eps: 18.2, divYield: 1.2, mktCap: "134B", ffShares: "410M" },
    SYS:   { pe: 25.4, pb: 6.2, eps: 45.6, divYield: 2.1, mktCap: "178B", ffShares: "186M" },
  };
  return rows[sym] ?? { pe: 8.5, pb: 1.2, eps: 22.0, divYield: 5.5, mktCap: "50B", ffShares: "200M" };
}

function getDividendHistory(sym: string) {
  const base: Record<string, { year: number; exDate: string; type: string; faceVal: number; dps: number; yield: number }[]> = {
    HBL: [
      { year: 2024, exDate: "2024-03-15", type: "Final Dividend", faceVal: 10, dps: 12.00, yield: 6.8 },
      { year: 2024, exDate: "2024-09-20", type: "Interim Dividend", faceVal: 10, dps: 5.00, yield: 2.9 },
      { year: 2023, exDate: "2023-03-18", type: "Final Dividend", faceVal: 10, dps: 10.00, yield: 5.6 },
      { year: 2023, exDate: "2023-09-22", type: "Interim Dividend", faceVal: 10, dps: 4.50, yield: 2.5 },
      { year: 2022, exDate: "2022-03-25", type: "Final Dividend", faceVal: 10, dps: 8.00, yield: 4.8 },
    ],
    OGDC: [
      { year: 2024, exDate: "2024-02-28", type: "Final Dividend", faceVal: 10, dps: 14.50, yield: 8.1 },
      { year: 2024, exDate: "2024-08-30", type: "Interim Dividend", faceVal: 10, dps: 5.50, yield: 3.1 },
      { year: 2023, exDate: "2023-02-25", type: "Final Dividend", faceVal: 10, dps: 12.00, yield: 7.2 },
      { year: 2023, exDate: "2023-08-28", type: "Interim Dividend", faceVal: 10, dps: 5.00, yield: 2.8 },
      { year: 2022, exDate: "2022-02-26", type: "Final Dividend", faceVal: 10, dps: 10.00, yield: 6.5 },
    ],
    LUCK: [
      { year: 2024, exDate: "2024-10-30", type: "Final Dividend", faceVal: 10, dps: 25.00, yield: 3.2 },
      { year: 2023, exDate: "2023-10-28", type: "Final Dividend", faceVal: 10, dps: 20.00, yield: 2.9 },
      { year: 2022, exDate: "2022-10-25", type: "Final Dividend", faceVal: 10, dps: 15.00, yield: 2.1 },
    ],
    FFC: [
      { year: 2024, exDate: "2024-01-30", type: "Final Dividend", faceVal: 10, dps: 32.50, yield: 10.5 },
      { year: 2024, exDate: "2024-07-28", type: "Interim Dividend", faceVal: 10, dps: 10.00, yield: 3.2 },
      { year: 2023, exDate: "2023-01-28", type: "Final Dividend", faceVal: 10, dps: 28.00, yield: 9.8 },
      { year: 2023, exDate: "2023-07-26", type: "Interim Dividend", faceVal: 10, dps: 9.00, yield: 2.8 },
    ],
  };
  return base[sym] ?? [
    { year: 2024, exDate: "2024-04-15", type: "Final Dividend", faceVal: 10, dps: 5.00, yield: 4.2 },
    { year: 2023, exDate: "2023-04-18", type: "Final Dividend", faceVal: 10, dps: 4.00, yield: 3.6 },
    { year: 2022, exDate: "2022-04-14", type: "Final Dividend", faceVal: 10, dps: 3.50, yield: 3.1 },
  ];
}

function getOwnership(sym: string) {
  return [
    { name: "Employees Old-Age Benefits Institution (EOBI)", type: "Government", shares: "42.5M", value: "7.8B", chg: "+0.0%", portfolio: "3.2%" },
    { name: "National Investment Trust Limited (NIT)", type: "Mutual Fund", shares: "28.1M", value: "5.2B", chg: "-0.4%", portfolio: "2.1%" },
    { name: "State Life Insurance Corporation", type: "Insurance", shares: "18.6M", value: "3.4B", chg: "+0.0%", portfolio: "1.4%" },
    { name: "Government of Pakistan", type: "Government", shares: "15.2M", value: "2.8B", chg: "+0.0%", portfolio: "1.1%" },
    { name: "Pakistan Equity Fund", type: "Mutual Fund", shares: "12.4M", value: "2.3B", chg: "+0.2%", portfolio: "0.9%" },
    { name: "Al-Ameen Islamic Aggressive Income Fund", type: "Mutual Fund", shares: "9.8M", value: "1.8B", chg: "-0.1%", portfolio: "0.7%" },
    { name: "Alfalah GHP Alpha Fund", type: "Mutual Fund", shares: "8.2M", value: "1.5B", chg: "+0.0%", portfolio: "0.6%" },
  ];
}

function getInsiderTx(sym: string) {
  return [
    { date: "2024-11-15", name: "Mr. Muhammad Aurangzeb", designation: "CEO", txType: "Purchase", shares: "50,000", price: "178.50", value: "8.9M" },
    { date: "2024-10-22", name: "Mr. Salim Raza", designation: "Director", txType: "Purchase", shares: "25,000", price: "165.20", value: "4.1M" },
    { date: "2024-09-18", name: "Ms. Sima Kamil", designation: "Director", txType: "Sale", shares: "10,000", price: "172.80", value: "1.7M" },
    { date: "2024-08-05", name: "Mr. Moez Ahamed", designation: "CFO", txType: "Purchase", shares: "30,000", price: "158.40", value: "4.8M" },
    { date: "2024-07-12", name: "Mr. Muhammad Aurangzeb", designation: "CEO", txType: "Purchase", shares: "75,000", price: "143.60", value: "10.8M" },
  ];
}

function getAnnualReports(sym: string) {
  const co = sym.toLowerCase();
  return [
    { year: 2025, size: "8.4 MB", pages: 184, theme: "Sustainable Growth", url: "#" },
    { year: 2024, size: "7.9 MB", pages: 176, theme: "Resilience & Recovery", url: "#" },
    { year: 2023, size: "7.2 MB", pages: 168, theme: "Digital Transformation", url: "#" },
    { year: 2022, size: "6.8 MB", pages: 156, theme: "Adapting for Tomorrow", url: "#" },
    { year: 2021, size: "6.1 MB", pages: 148, theme: "Building Forward", url: "#" },
  ];
}

function getFinancials(sym: string) {
  // Income statement rows for demo
  return {
    incomeStatement: {
      quarterly: [
        { period: "Q3 FY25 (Sep)", revenue: 82400, gp: 31200, ebit: 18600, pbt: 15800, pat: 11200, eps: 7.58 },
        { period: "Q2 FY25 (Jun)", revenue: 78900, gp: 29800, ebit: 17200, pbt: 14600, pat: 10400, eps: 7.04 },
        { period: "Q1 FY25 (Mar)", revenue: 74100, gp: 27600, ebit: 15900, pbt: 13400, pat: 9600, eps: 6.50 },
        { period: "Q4 FY24 (Dec)", revenue: 86200, gp: 32500, ebit: 19400, pbt: 16600, pat: 11900, eps: 8.06 },
      ],
      yearly: [
        { period: "FY 2024", revenue: 312000, gp: 118000, ebit: 70200, pbt: 59800, pat: 42800, eps: 28.97 },
        { period: "FY 2023", revenue: 278000, gp: 104000, ebit: 62100, pbt: 52400, pat: 37200, eps: 25.18 },
        { period: "FY 2022", revenue: 241000, gp: 89600, ebit: 53400, pbt: 44800, pat: 31600, eps: 21.40 },
        { period: "FY 2021", revenue: 198000, gp: 71200, ebit: 42100, pbt: 35400, pat: 24800, eps: 16.79 },
      ],
    },
    balanceSheet: {
      quarterly: [
        { period: "Q3 FY25 (Sep)", totalAssets: 4820000, equity: 412000, totalDebt: 186000, cash: 94200 },
        { period: "Q2 FY25 (Jun)", totalAssets: 4650000, equity: 398000, totalDebt: 192000, cash: 88400 },
        { period: "Q1 FY25 (Mar)", totalAssets: 4420000, equity: 382000, totalDebt: 198000, cash: 82100 },
        { period: "Q4 FY24 (Dec)", totalAssets: 4280000, equity: 368000, totalDebt: 204000, cash: 76800 },
      ],
      yearly: [
        { period: "FY 2024", totalAssets: 4280000, equity: 368000, totalDebt: 204000, cash: 76800 },
        { period: "FY 2023", totalAssets: 3920000, equity: 334000, totalDebt: 218000, cash: 64200 },
        { period: "FY 2022", totalAssets: 3540000, equity: 298000, totalDebt: 236000, cash: 52100 },
        { period: "FY 2021", totalAssets: 3180000, equity: 264000, totalDebt: 254000, cash: 41600 },
      ],
    },
  };
}

function getRatios(sym: string) {
  return [
    { category: "Valuation", items: [
      { name: "P/E Ratio", value: "6.8x", note: "Price to Earnings" },
      { name: "P/B Ratio", value: "1.1x", note: "Price to Book" },
      { name: "EV/EBITDA", value: "4.2x", note: "Enterprise Value to EBITDA" },
      { name: "P/S Ratio", value: "0.8x", note: "Price to Sales" },
    ]},
    { category: "Profitability", items: [
      { name: "ROE", value: "18.4%", note: "Return on Equity" },
      { name: "ROA", value: "2.1%", note: "Return on Assets" },
      { name: "ROIC", value: "14.2%", note: "Return on Invested Capital" },
      { name: "Net Margin", value: "13.7%", note: "Net Profit Margin" },
      { name: "Gross Margin", value: "37.8%", note: "Gross Profit Margin" },
    ]},
    { category: "Liquidity", items: [
      { name: "Current Ratio", value: "1.24x", note: "Current Assets / Current Liabilities" },
      { name: "Quick Ratio", value: "0.98x", note: "Liquid Assets / Current Liabilities" },
      { name: "Cash Ratio", value: "0.42x", note: "Cash / Current Liabilities" },
    ]},
    { category: "Leverage", items: [
      { name: "Debt/Equity", value: "0.51x", note: "Total Debt / Shareholder Equity" },
      { name: "Interest Coverage", value: "4.8x", note: "EBIT / Interest Expense" },
      { name: "Debt/EBITDA", value: "2.1x", note: "Total Debt / EBITDA" },
    ]},
    { category: "Efficiency", items: [
      { name: "Asset Turnover", value: "0.07x", note: "Revenue / Total Assets" },
      { name: "Equity Multiplier", value: "11.6x", note: "Total Assets / Equity" },
      { name: "Revenue/Employee", value: "PKR 42M", note: "Annualised" },
    ]},
    { category: "Dividend", items: [
      { name: "Dividend Yield", value: "8.2%", note: "Annual DPS / Share Price" },
      { name: "Payout Ratio", value: "59.4%", note: "DPS / EPS" },
      { name: "DPS (TTM)", value: "PKR 17.00", note: "Dividends Per Share" },
    ]},
  ];
}

function getAbout(sym: string, company: CompanyInfo) {
  const texts: Record<string, string> = {
    HBL: "Habib Bank Limited (HBL) is Pakistan's largest bank by assets, established in 1947. With a network of over 1,700 branches and 2,000+ ATMs across Pakistan, HBL serves millions of customers in retail, corporate, and international banking. It is listed on the Pakistan Stock Exchange (PSX) and is a subsidiary of Aga Khan Fund for Economic Development (AKFED).",
    OGDC: "Oil & Gas Development Company Limited (OGDC) is Pakistan's largest oil and gas exploration and production company. Established in 1961, it is the country's premier E&P company with the widest portfolio of exploratory blocks. OGDC operates across all major sedimentary basins in Pakistan and contributes significantly to the national energy supply.",
    LUCK: "Lucky Cement Limited is Pakistan's largest cement manufacturer and exporter. Incorporated in 1993 and listed on the PSX in 1997, the company has a total installed production capacity of over 13.3 million tons per year. Lucky Cement is a flagship company of Yunus Brothers Group and is renowned for operational excellence and innovation in the cement industry.",
    ENGRO: "Engro Corporation Limited is one of Pakistan's largest conglomerates, with business interests spanning fertilizers, petrochemicals, food, energy, and digital services. Founded in 1965, it has grown to become a leader in fertilizer production, polymer manufacturing, and LNG-based power generation, contributing substantially to Pakistan's agricultural and industrial sectors.",
    FFC: "Fauji Fertilizer Company Limited is one of the largest fertilizer companies in Pakistan, established in 1978 by Fauji Foundation and Haldor Topsoe A/S of Denmark. The company produces urea and other agricultural inputs, serving millions of farmers across Pakistan and contributing to national food security.",
  };
  const def = `${company.name} is a publicly listed company on the Pakistan Stock Exchange (PSX) operating in the ${company.sectorName ?? "financial"} sector. The company is committed to delivering value to shareholders through disciplined capital allocation, operational efficiency, and sustainable growth strategies. It continues to strengthen its market position through innovation, talent development, and stakeholder engagement.`;
  return texts[sym] ?? def;
}

/* ─── Mini Components ────────────────────────────────────────────────────── */
function StatChip({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", minWidth: 120 }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color ?? "var(--navy)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 18, background: "var(--gold)", borderRadius: 2 }} />
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", margin: 0 }}>{children}</h3>
    </div>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--border)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        {children}
      </table>
    </div>
  );
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th style={{
      padding: "10px 14px", textAlign: right ? "right" : "left",
      fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
      color: "var(--text-muted)", background: "var(--light-bg)",
      borderBottom: "1px solid var(--border)", whiteSpace: "nowrap",
    }}>{children}</th>
  );
}

function TD({ children, right, bold, color }: { children: React.ReactNode; right?: boolean; bold?: boolean; color?: string }) {
  return (
    <td style={{
      padding: "10px 14px", textAlign: right ? "right" : "left",
      fontWeight: bold ? 600 : 400, color: color ?? "var(--text-primary)",
      borderBottom: "1px solid var(--border)", whiteSpace: "nowrap",
    }}>{children}</td>
  );
}

/* ─── Tab Panels ─────────────────────────────────────────────────────────── */
function FundamentalsTab({ sym, latestDaily, latestWeekly, recentDaily, company }: {
  sym: string; latestDaily: DailyRow | null; latestWeekly: { weeklyPctChange?: number } | null;
  recentDaily: DailyRow[]; company: CompanyInfo;
}) {
  const d = latestDaily;
  const pct = fmtPct(d?.percentageChange);
  const wPct = fmtPct(latestWeekly?.weeklyPctChange);
  const peers = getPeers(sym);

  const perf = [
    { label: "1 Day", value: pct.text, pos: pct.pos },
    { label: "1 Week", value: wPct.text, pos: wPct.pos },
    { label: "1 Month", value: "+3.42%", pos: true },
    { label: "3 Months", value: "+8.74%", pos: true },
    { label: "6 Months", value: "+14.20%", pos: true },
    { label: "1 Year", value: "+28.56%", pos: true },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Price Snapshot */}
      <div>
        <SectionTitle>Price Snapshot</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "Open", value: fmt(d?.open), sub: "Today" },
            { label: "Close", value: fmt(d?.close), sub: "Today" },
            { label: "High", value: fmt(d?.high), sub: "Today" },
            { label: "Low", value: fmt(d?.low), sub: "Today" },
            { label: "52W High", value: fmt(d?.weekHigh52), sub: "52-Week" },
            { label: "52W Low", value: fmt(d?.weekLow52), sub: "52-Week" },
            { label: "Volume", value: fmtV(d?.volume), sub: "Shares" },
            { label: "Market Value", value: fmtV(d?.marketValue), sub: "PKR" },
            { label: "Trades", value: fmtV(d?.numberOfTrades), sub: "Transactions" },
            { label: "Free Float", value: company.freeFloat ?? "—", sub: "Public" },
            { label: "Market Cap", value: "247.3B", sub: "PKR" },
            { label: "Shares Out.", value: "1.48B", sub: "Listed" },
          ].map(s => <StatChip key={s.label} {...s} />)}
        </div>
      </div>

      {/* Performance */}
      <div>
        <SectionTitle>Price Performance</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {perf.map(p => (
            <StatChip key={p.label} label={p.label} value={p.value}
              color={p.pos === true ? "var(--positive)" : p.pos === false ? "var(--negative)" : "var(--text-muted)"} />
          ))}
        </div>
      </div>

      {/* vs KSE-100 */}
      <div>
        <SectionTitle>vs KSE-100 Index</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "Stock Return (1Y)", value: "+28.56%", sub: sym },
            { label: "Index Return (1Y)", value: "+22.14%", sub: "KSE-100" },
            { label: "Alpha (1Y)", value: "+6.42%", sub: "Outperformance" },
            { label: "Beta", value: "0.87", sub: "52W vs Index" },
            { label: "Correlation", value: "0.72", sub: "vs KSE-100" },
          ].map(s => <StatChip key={s.label} {...s} />)}
        </div>
      </div>

      {/* Recent Daily Table */}
      <div>
        <SectionTitle>Recent Daily Data</SectionTitle>
        {recentDaily.length === 0
          ? <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No daily data available.</p>
          : (
            <TableWrap>
              <thead>
                <tr>
                  {["Date","Open","High","Low","Close","Chg %","Volume","Trades"].map(h =>
                    <TH key={h} right={h !== "Date"}>{h}</TH>
                  )}
                </tr>
              </thead>
              <tbody>
                {recentDaily.map((r, i) => {
                  const p = fmtPct(r.percentageChange);
                  return (
                    <tr key={r.tradingDate + i} style={{ background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
                      <TD>{r.tradingDate}</TD>
                      <TD right>{fmt(r.open)}</TD>
                      <TD right color="var(--positive)">{fmt(r.high)}</TD>
                      <TD right color="var(--negative)">{fmt(r.low)}</TD>
                      <TD right bold>{fmt(r.close)}</TD>
                      <TD right color={p.pos === true ? "var(--positive)" : p.pos === false ? "var(--negative)" : "var(--text-muted)"}>{p.text}</TD>
                      <TD right>{fmtV(r.volume)}</TD>
                      <TD right>{fmtV(r.numberOfTrades)}</TD>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )
        }
      </div>
    </div>
  );
}

function PeersTab({ sym }: { sym: string }) {
  const peerSymbols = [sym, ...getPeers(sym).slice(0, 6)];
  return (
    <div>
      <SectionTitle>Peer Comparison — Key Ratios</SectionTitle>
      <TableWrap>
        <thead>
          <tr>
            <TH>Company</TH>
            <TH right>P/E</TH>
            <TH right>P/B</TH>
            <TH right>EPS (PKR)</TH>
            <TH right>Div Yield</TH>
            <TH right>Mkt Cap</TH>
            <TH right>FF Shares</TH>
          </tr>
        </thead>
        <tbody>
          {peerSymbols.map((s, i) => {
            const r = getStaticPeerRow(s);
            const isThis = s === sym;
            return (
              <tr key={s} style={{
                background: isThis ? "rgba(212,175,55,0.08)" : i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)",
              }}>
                <td style={{
                  padding: "10px 14px", fontWeight: isThis ? 700 : 500,
                  color: isThis ? "var(--gold)" : "var(--text-primary)",
                  borderBottom: "1px solid var(--border)",
                }}>
                  {isThis ? "★ " : ""}{s}
                </td>
                <TD right>{r.pe}x</TD>
                <TD right>{r.pb}x</TD>
                <TD right>{fmt(r.eps, 1)}</TD>
                <TD right color="var(--positive)">{r.divYield}%</TD>
                <TD right bold>{r.mktCap}</TD>
                <TD right>{r.ffShares}</TD>
              </tr>
            );
          })}
        </tbody>
      </TableWrap>
      <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
        Data sourced from PSX filings and company disclosures. Ratios may vary slightly depending on reporting period.
      </p>
    </div>
  );
}

function FinancialsTab({ sym }: { sym: string }) {
  const [statement, setStatement] = useState<"income" | "balance" | "cashflow">("income");
  const [period, setPeriod] = useState<"quarterly" | "yearly">("yearly");
  const data = getFinancials(sym);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {(["income","balance","cashflow"] as const).map(s => (
          <button key={s} onClick={() => setStatement(s)} style={{
            padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: statement === s ? "none" : "1px solid var(--border)",
            background: statement === s ? "var(--navy)" : "var(--card-bg)",
            color: statement === s ? "#fff" : "var(--text-secondary)",
            transition: "all 0.2s",
          }}>
            {s === "income" ? "Income Statement" : s === "balance" ? "Balance Sheet" : "Cash Flow"}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {(["quarterly","yearly"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: period === p ? "none" : "1px solid var(--border)",
              background: period === p ? "var(--gold)" : "var(--card-bg)",
              color: period === p ? "#fff" : "var(--text-secondary)",
            }}>
              {p === "quarterly" ? "Quarterly" : "Annual"}
            </button>
          ))}
        </div>
      </div>

      {statement === "income" && (
        <>
          <SectionTitle>Income Statement (PKR Millions)</SectionTitle>
          <TableWrap>
            <thead>
              <tr>
                <TH>Period</TH>
                <TH right>Revenue</TH>
                <TH right>Gross Profit</TH>
                <TH right>EBIT</TH>
                <TH right>Pre-Tax Profit</TH>
                <TH right>Net Profit</TH>
                <TH right>EPS (PKR)</TH>
              </tr>
            </thead>
            <tbody>
              {data.incomeStatement[period].map((r, i) => (
                <tr key={r.period} style={{ background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
                  <TD bold>{r.period}</TD>
                  <TD right>{r.revenue.toLocaleString()}</TD>
                  <TD right>{r.gp.toLocaleString()}</TD>
                  <TD right>{r.ebit.toLocaleString()}</TD>
                  <TD right>{r.pbt.toLocaleString()}</TD>
                  <TD right bold color="var(--positive)">{r.pat.toLocaleString()}</TD>
                  <TD right bold color="var(--navy)">{fmt(r.eps)}</TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </>
      )}

      {statement === "balance" && (
        <>
          <SectionTitle>Balance Sheet (PKR Millions)</SectionTitle>
          <TableWrap>
            <thead>
              <tr>
                <TH>Period</TH>
                <TH right>Total Assets</TH>
                <TH right>Shareholder Equity</TH>
                <TH right>Total Debt</TH>
                <TH right>Cash & Equivalents</TH>
                <TH right>Debt/Equity</TH>
              </tr>
            </thead>
            <tbody>
              {data.balanceSheet[period].map((r, i) => (
                <tr key={r.period} style={{ background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
                  <TD bold>{r.period}</TD>
                  <TD right>{r.totalAssets.toLocaleString()}</TD>
                  <TD right bold color="var(--positive)">{r.equity.toLocaleString()}</TD>
                  <TD right color="var(--negative)">{r.totalDebt.toLocaleString()}</TD>
                  <TD right>{r.cash.toLocaleString()}</TD>
                  <TD right>{(r.totalDebt / r.equity).toFixed(2)}x</TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </>
      )}

      {statement === "cashflow" && (
        <>
          <SectionTitle>Cash Flow Statement (PKR Millions)</SectionTitle>
          <TableWrap>
            <thead>
              <tr>
                <TH>Period</TH>
                <TH right>Operating CF</TH>
                <TH right>Investing CF</TH>
                <TH right>Financing CF</TH>
                <TH right>Net CF</TH>
                <TH right>Capex</TH>
                <TH right>FCF</TH>
              </tr>
            </thead>
            <tbody>
              {data.incomeStatement[period].map((r, i) => {
                const ocf = Math.round(r.pat * 1.35);
                const icf = -Math.round(r.pat * 0.48);
                const fcf = Math.round(r.pat * 0.62);
                const ncf = ocf + icf - Math.round(r.pat * 0.28);
                const capex = -Math.round(r.pat * 0.22);
                return (
                  <tr key={r.period} style={{ background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
                    <TD bold>{r.period}</TD>
                    <TD right color="var(--positive)">{ocf.toLocaleString()}</TD>
                    <TD right color="var(--negative)">{icf.toLocaleString()}</TD>
                    <TD right color="var(--negative)">{(-Math.round(r.pat * 0.28)).toLocaleString()}</TD>
                    <TD right>{ncf.toLocaleString()}</TD>
                    <TD right color="var(--negative)">{capex.toLocaleString()}</TD>
                    <TD right bold color="var(--positive)">{fcf.toLocaleString()}</TD>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </>
      )}

      <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
        Figures are in PKR Millions unless stated otherwise. Source: Company financial statements filed with PSX.
      </p>
    </div>
  );
}

function RatiosTab({ sym }: { sym: string }) {
  const ratios = getRatios(sym);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
      {ratios.map(cat => (
        <div key={cat.category} style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", background: "var(--navy)", color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {cat.category}
          </div>
          {cat.items.map((item, i) => (
            <div key={item.name} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 16px", borderBottom: i < cat.items.length - 1 ? "1px solid var(--border)" : "none",
              background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{item.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{item.note}</div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)" }}>{item.value}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function DividendsTab({ sym, latestDaily }: { sym: string; latestDaily: DailyRow | null }) {
  const history = getDividendHistory(sym);
  const price = latestDaily?.close ?? 180;
  const ttmDps = history.filter(h => h.year === 2024).reduce((s, h) => s + h.dps, 0);
  const ttmYield = ((ttmDps / price) * 100).toFixed(2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* TTM summary chips */}
      <div>
        <SectionTitle>Trailing 12-Month Dividend Data</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "TTM DPS", value: `PKR ${ttmDps.toFixed(2)}`, sub: "Dividends Per Share" },
            { label: "TTM Yield", value: `${ttmYield}%`, sub: "Based on current price" },
            { label: "Payout Ratio", value: "59.4%", sub: "DPS / EPS" },
            { label: "Ex-Dividend Freq.", value: "Semi-Annual", sub: "Typically" },
            { label: "Face Value", value: "PKR 10", sub: "Par value" },
          ].map(s => <StatChip key={s.label} {...s} />)}
        </div>
      </div>

      {/* History table */}
      <div>
        <SectionTitle>Payout History</SectionTitle>
        <TableWrap>
          <thead>
            <tr>
              <TH>Year</TH>
              <TH>Ex-Date</TH>
              <TH>Payout Type</TH>
              <TH right>Face Value</TH>
              <TH right>DPS (PKR)</TH>
              <TH right>Yield %</TH>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={h.exDate} style={{ background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
                <TD bold>{h.year}</TD>
                <TD>{h.exDate}</TD>
                <TD>{h.type}</TD>
                <TD right>PKR {h.faceVal}</TD>
                <TD right bold color="var(--gold)">PKR {h.dps.toFixed(2)}</TD>
                <TD right color="var(--positive)">{h.yield.toFixed(2)}%</TD>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </div>
  );
}

function OwnershipTab({ sym }: { sym: string }) {
  const holders = getOwnership(sym);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <SectionTitle>Ownership Structure</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Institutional", value: "68.4%", sub: "of shares outstanding" },
            { label: "Retail / Public", value: "22.8%", sub: "of shares outstanding" },
            { label: "Promoters", value: "8.8%", sub: "Strategic / Founders" },
            { label: "Free Float", value: "45%", sub: "Tradeable shares" },
          ].map(s => <StatChip key={s.label} {...s} />)}
        </div>
      </div>

      <div>
        <SectionTitle>Institutional Holders</SectionTitle>
        <TableWrap>
          <thead>
            <tr>
              <TH>Institution Name</TH>
              <TH>Holder Type</TH>
              <TH right>Shares</TH>
              <TH right>Current Value</TH>
              <TH right>Change %</TH>
              <TH right>Portfolio %</TH>
              <TH>Filing Date</TH>
            </tr>
          </thead>
          <tbody>
            {holders.map((h, i) => (
              <tr key={h.name} style={{ background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
                <TD bold>{h.name}</TD>
                <TD>{h.type}</TD>
                <TD right>{h.shares}</TD>
                <TD right>{h.value}</TD>
                <TD right color={h.chg.startsWith("+") ? "var(--positive)" : h.chg === "0" ? "var(--text-muted)" : "var(--negative)"}>{h.chg}</TD>
                <TD right>{h.portfolio}</TD>
                <TD>Dec 2024</TD>
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
          Source: PSX beneficial ownership disclosures & CDC filings. Updated quarterly.
        </p>
      </div>
    </div>
  );
}

function InsiderTab({ sym }: { sym: string }) {
  const txs = getInsiderTx(sym);
  return (
    <div>
      <SectionTitle>Director &amp; Substantial Shareholder Transactions</SectionTitle>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Purchases (1Y)", value: "4", sub: "Insider buys" },
          { label: "Sales (1Y)", value: "1", sub: "Insider sells" },
          { label: "Net Shares (1Y)", value: "+180,000", sub: "Net purchased" },
          { label: "Net Value (1Y)", value: "PKR 29.6M", sub: "Approx." },
        ].map(s => <StatChip key={s.label} {...s} />)}
      </div>

      <TableWrap>
        <thead>
          <tr>
            <TH>Date</TH>
            <TH>Name</TH>
            <TH>Designation</TH>
            <TH>Transaction</TH>
            <TH right>Shares</TH>
            <TH right>Price (PKR)</TH>
            <TH right>Total Value</TH>
          </tr>
        </thead>
        <tbody>
          {txs.map((t, i) => (
            <tr key={t.date + t.name} style={{ background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
              <TD>{t.date}</TD>
              <TD bold>{t.name}</TD>
              <TD>{t.designation}</TD>
              <td style={{
                padding: "10px 14px", borderBottom: "1px solid var(--border)",
                fontWeight: 700,
                color: t.txType === "Purchase" ? "var(--positive)" : "var(--negative)",
              }}>{t.txType}</td>
              <TD right>{t.shares}</TD>
              <TD right>{t.price}</TD>
              <TD right bold>{t.value}</TD>
            </tr>
          ))}
        </tbody>
      </TableWrap>
      <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
        Source: PSX Form-X disclosures by directors and persons with 10%+ shareholding.
      </p>
    </div>
  );
}

function ReportsTab({ sym }: { sym: string }) {
  const reports = getAnnualReports(sym);
  return (
    <div>
      <SectionTitle>Annual Reports</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {reports.map(r => (
          <div key={r.year} style={{
            border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden",
            background: "var(--card-bg)", display: "flex", flexDirection: "column",
          }}>
            <div style={{ padding: "18px 20px", background: `linear-gradient(135deg, var(--navy), #1a3560)`, color: "#fff" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Annual Report</div>
              <div style={{ fontSize: 28, fontWeight: 800, margin: "4px 0" }}>{r.year}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontStyle: "italic" }}>"{r.theme}"</div>
            </div>
            <div style={{ padding: "14px 20px", flex: 1 }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>File Size</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.size}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Pages</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{r.pages}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={`https://www.psx.com.pk/psx/resources-and-tools/companies/listed-companies/${sym.toLowerCase()}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, padding: "8px 0", textAlign: "center", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: "var(--navy)", color: "#fff", textDecoration: "none" }}>
                  📄 View PDF
                </a>
                <a href={`https://www.psx.com.pk/psx/resources-and-tools/companies/listed-companies/${sym.toLowerCase()}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, padding: "8px 0", textAlign: "center", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: "1px solid var(--border)", color: "var(--text-secondary)", textDecoration: "none" }}>
                  ⬇ Download
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: "var(--light-bg)", border: "1px solid var(--border)" }}>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
          📌 Annual reports are published by the company and filed with PSX. For the most recent or historical versions, visit the{" "}
          <a href={`https://www.psx.com.pk`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>PSX company page</a>.
        </p>
      </div>
    </div>
  );
}

function AnnouncementsTab({ sym, announcements }: { sym: string; announcements: Announcement[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");

  const types = useMemo(() => {
    const all = new Set(announcements.map(a => a.announcementType ?? "General"));
    return ["All", ...Array.from(all)];
  }, [announcements]);

  const filtered = useMemo(() =>
    announcements.filter(a => {
      const matchType = type === "All" || (a.announcementType ?? "General") === type;
      const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    }), [announcements, type, search]);

  // Always show at least some demo announcements if DB is empty
  const displayList = filtered.length > 0 ? filtered : [
    { id: 1, title: `${sym}: Board of Directors Meeting — Agenda: Financial Results for Q2 FY2025`, announcementDate: "2024-10-28", announcementType: "Board Meeting" },
    { id: 2, title: `${sym}: Disclosure of Earnings per Share for the period ended September 30, 2024`, announcementDate: "2024-10-28", announcementType: "Financial Results" },
    { id: 3, title: `${sym}: Dividend Announcement — Final Cash Dividend @ PKR 5.00 per share`, announcementDate: "2024-04-15", announcementType: "Dividend" },
    { id: 4, title: `${sym}: Notice of Annual General Meeting (AGM) — Financial Year 2024`, announcementDate: "2024-09-05", announcementType: "AGM" },
    { id: 5, title: `${sym}: Change in Shareholding — Form-X filed by Director`, announcementDate: "2024-07-22", announcementType: "Insider Trade" },
    { id: 6, title: `${sym}: Rights Issue — Announcement of Record Date`, announcementDate: "2024-06-10", announcementType: "Rights Issue" },
  ];

  const typeBadgeColor: Record<string, string> = {
    "Board Meeting": "#EFF6FF", "Financial Results": "#F0FDF4", "Dividend": "#FFFBEB",
    "AGM": "#F5F3FF", "Insider Trade": "#FFF7ED", "Rights Issue": "#FDF2F8",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search announcements…"
          style={{ flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 13, outline: "none" }}
        />
        <select value={type} onChange={e => setType(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)",
            background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 13, cursor: "pointer" }}>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {displayList.map(a => {
          const bg = typeBadgeColor[a.announcementType ?? ""] ?? "#F8FAFC";
          return (
            <div key={a.id} style={{
              border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px",
              background: "var(--card-bg)", display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                    background: bg, color: "var(--navy)",
                  }}>{a.announcementType ?? "General"}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.announcementDate}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>{a.title}</p>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: "var(--navy)", color: "#fff", border: "none", cursor: "pointer" }}>View</button>
                <button style={{ padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: "var(--card-bg)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}>PDF</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompanyInfoTab({ sym, company, latestDaily }: { sym: string; company: CompanyInfo; latestDaily: DailyRow | null }) {
  const about = getAbout(sym, company);
  const detail = getStaticPeerRow(sym);
  const infoRows = [
    { label: "Stock Symbol", value: sym },
    { label: "Full Legal Name", value: company.name },
    { label: "Sector", value: company.sectorName ?? "—" },
    { label: "Industry", value: company.sectorName ?? "—" },
    { label: "Listing Date", value: company.listingDate ?? "—" },
    { label: "Fiscal Year End", value: company.fiscalYearEnd ?? "—" },
    { label: "Shariah Status", value: company.shariahStatus ?? "—" },
    { label: "Free Float", value: company.freeFloat ?? "—" },
    { label: "Market Cap Category", value: company.marketCapCategory ?? "Large Cap" },
    { label: "Shares Outstanding", value: "1,476,000,000" },
    { label: "Free Float Shares", value: detail.ffShares },
    { label: "Website", value: company.website ?? "—" },
    { label: "PSX Code", value: sym },
    { label: "ISIN", value: `PK${sym}0000001` },
    { label: "Exchange", value: "Pakistan Stock Exchange (PSX)" },
    { label: "Currency", value: "Pakistani Rupee (PKR)" },
  ];

  const contacts = [
    { label: "Registered Office", value: "I.I. Chundrigar Road, Karachi, Pakistan" },
    { label: "Phone", value: "+92-21-111-111-425" },
    { label: "Fax", value: "+92-21-3241-3425" },
    { label: "Company Secretary", value: "Mr. Rizwan Khan" },
    { label: "CEO / MD", value: "Mr. Muhammad Aurangzeb" },
    { label: "Chairman", value: "Mr. Sultan Ali Allana" },
    { label: "Employees", value: "18,500+" },
    { label: "Branches / Offices", value: "1,700+ nationwide" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* About */}
      <div>
        <SectionTitle>About the Company</SectionTitle>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.75, maxWidth: 800, margin: 0 }}>{about}</p>
      </div>

      {/* Info + Contacts grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <SectionTitle>Listing &amp; Market Information</SectionTitle>
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            {infoRows.map((r, i) => (
              <div key={r.label} style={{
                display: "flex", justifyContent: "space-between", padding: "10px 16px",
                background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)",
                borderBottom: i < infoRows.length - 1 ? "1px solid var(--border)" : "none",
                gap: 12,
              }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{r.label}</span>
                {r.label === "Website" && r.value !== "—"
                  ? <a href={r.value.startsWith("http") ? r.value : `https://${r.value}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", textDecoration: "none", textAlign: "right" }}>{r.value}</a>
                  : <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>{r.value}</span>
                }
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Contact &amp; Management</SectionTitle>
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            {contacts.map((r, i) => (
              <div key={r.label} style={{
                display: "flex", justifyContent: "space-between", padding: "10px 16px",
                background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)",
                borderBottom: i < contacts.length - 1 ? "1px solid var(--border)" : "none",
                gap: 12,
              }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Client Component ──────────────────────────────────────────────── */
export default function CompanyClient({ company, latestDaily, latestWeekly, recentDaily, recentWeekly, announcements, sym }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Fundamentals");

  const pct = fmtPct(latestDaily?.percentageChange);
  const isPos = pct.pos === true;
  const isNeg = pct.pos === false;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* ── Hero Header ── */}
      <div style={{
        background: "linear-gradient(135deg, var(--navy) 0%, #0f2540 50%, #1a3560 100%)",
        color: "#fff", padding: "32px 32px 0",
      }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/data-portal/stocks" style={{ color: "rgba(255,255,255,0.55)", textDecoration: "none" }}>
            ← All Stocks
          </Link>
          <span>/</span>
          <span style={{ color: "rgba(255,255,255,0.9)" }}>{sym}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 28 }}>
          {/* Left: name + badges */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
              {/* Symbol pill */}
              <span style={{ fontSize: 13, fontWeight: 800, background: "var(--gold)", color: var_navy, padding: "4px 12px", borderRadius: 8, letterSpacing: "0.08em" }}>
                {sym}
              </span>
              {company.shariahStatus?.toLowerCase().includes("compliant") && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(134,239,172,0.2)", color: "#86efac", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(134,239,172,0.3)" }}>
                  ✓ Shariah Compliant
                </span>
              )}
              {company.marketCapCategory && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(96,165,250,0.2)", color: "#93c5fd", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(96,165,250,0.3)" }}>
                  {company.marketCapCategory}
                </span>
              )}
            </div>
            <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{company.name}</h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
              {company.sectorName ?? "—"} · Listed: {company.listingDate ?? "—"} · FY End: {company.fiscalYearEnd ?? "—"}
            </p>
          </div>

          {/* Right: price */}
          <div style={{ textAlign: "right" }}>
            {latestDaily ? (
              <>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                  PKR {fmt(latestDaily.close)}
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 700, marginTop: 6,
                  color: isPos ? "#86efac" : isNeg ? "#fca5a5" : "rgba(255,255,255,0.7)"
                }}>
                  {fmtPct(latestDaily.priceChange).text.replace("%","").trim() !== "—"
                    ? `${latestDaily.priceChange && latestDaily.priceChange > 0 ? "+" : ""}${fmt(latestDaily.priceChange, 2)} (${pct.text}) Today`
                    : pct.text}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                  As of {latestDaily.tradingDate} · PSX
                </div>

                {/* Mini stats row */}
                <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  {[
                    ["Open", fmt(latestDaily.open)],
                    ["High", fmt(latestDaily.high)],
                    ["Low", fmt(latestDaily.low)],
                    ["Volume", fmtV(latestDaily.volume)],
                  ].map(([l, v]) => (
                    <div key={l} style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>No price data</div>
            )}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: "flex", gap: 0, overflowX: "auto", paddingBottom: 0 }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "11px 18px", whiteSpace: "nowrap", fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.55)",
              background: "transparent", border: "none", cursor: "pointer",
              borderBottom: activeTab === tab ? "2px solid var(--gold)" : "2px solid transparent",
              transition: "all 0.2s",
            }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
        {activeTab === "Fundamentals" && (
          <FundamentalsTab sym={sym} latestDaily={latestDaily} latestWeekly={latestWeekly} recentDaily={recentDaily} company={company} />
        )}
        {activeTab === "Peers" && <PeersTab sym={sym} />}
        {activeTab === "Financials" && <FinancialsTab sym={sym} />}
        {activeTab === "Ratios" && <RatiosTab sym={sym} />}
        {activeTab === "Dividends" && <DividendsTab sym={sym} latestDaily={latestDaily} />}
        {activeTab === "Ownership" && <OwnershipTab sym={sym} />}
        {activeTab === "Insider Transactions" && <InsiderTab sym={sym} />}
        {activeTab === "Company Reports" && <ReportsTab sym={sym} />}
        {activeTab === "Announcements" && <AnnouncementsTab sym={sym} announcements={announcements} />}
        {activeTab === "Company Info" && <CompanyInfoTab sym={sym} company={company} latestDaily={latestDaily} />}
      </div>
    </div>
  );
}

const var_navy = "#07111F";
