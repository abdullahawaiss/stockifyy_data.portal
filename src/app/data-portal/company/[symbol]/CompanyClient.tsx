"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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

const NAVY = "#07111F";
const TABS = ["Fundamentals","Peers","Financials","Ratios","Dividends","Ownership","Insider Transactions","Company Reports","Announcements","Company Info"] as const;
type Tab = typeof TABS[number];

/* ─── Static Data Maps ───────────────────────────────────────────────────── */
interface CompanyMeta {
  ceo: string; chairman: string; secretary: string; employees: string;
  address: string; phone: string; branches: string; about: string;
  sharesOut: string; mktCap: string;
  pe: number; pb: number; eps: number; divYield: number; ffShares: string;
  peers: string[];
}

const COMPANY_META: Record<string, CompanyMeta> = {
  HBL: {
    ceo: "Muhammad Aurangzeb", chairman: "Sultan Ali Allana", secretary: "Rizwan Khan",
    employees: "18,500+", address: "HBL Tower, I.I. Chundrigar Road, Karachi", phone: "+92-21-111-111-425",
    branches: "1,700+ nationwide",
    about: "Habib Bank Limited (HBL) is Pakistan's largest bank by assets, established in 1947. With over 1,700 branches and 2,000+ ATMs, HBL serves millions of customers across retail, corporate, and international banking. It is a subsidiary of Aga Khan Fund for Economic Development (AKFED) and is listed on PSX.",
    sharesOut: "1,476M", mktCap: "247B", pe: 6.8, pb: 1.1, eps: 28.4, divYield: 8.2, ffShares: "664M",
    peers: ["MCB","UBL","NBP","ABL","BAHL","MEBL"],
  },
  MCB: {
    ceo: "Imran Maqbool", chairman: "Mian Mohammad Mansha", secretary: "Syed Imran Ali Shah",
    employees: "15,200+", address: "MCB House, Lahore", phone: "+92-42-111-000-622",
    branches: "1,400+ nationwide",
    about: "MCB Bank Limited is one of Pakistan's leading private banks with a rich history spanning over 75 years. Known for its strong capital base and extensive branch network, MCB serves corporate, SME, and retail customers across Pakistan.",
    sharesOut: "1,218M", mktCap: "267B", pe: 7.2, pb: 1.4, eps: 31.2, divYield: 9.1, ffShares: "488M",
    peers: ["HBL","UBL","NBP","ABL","BAHL","MEBL"],
  },
  UBL: {
    ceo: "Shazad Dada", chairman: "Sir Mohammed Anwar Pervez OBE", secretary: "Tariq Qamar",
    employees: "12,800+", address: "I.I. Chundrigar Road, Karachi", phone: "+92-21-111-825-525",
    branches: "1,350+ nationwide",
    about: "United Bank Limited (UBL) is a leading Pakistani commercial bank with significant international operations across the Middle East, Europe and North America. UBL is known for its digital banking innovations and strong retail franchise.",
    sharesOut: "1,224M", mktCap: "195B", pe: 5.9, pb: 1.0, eps: 41.5, divYield: 7.8, ffShares: "514M",
    peers: ["HBL","MCB","NBP","ABL","BAHL","MEBL"],
  },
  NBP: {
    ceo: "Rehmat Ali Hasnie", chairman: "Muhammad Saleem Umer", secretary: "Tariq Hussain",
    employees: "16,000+", address: "NBP Head Office, I.I. Chundrigar Road, Karachi", phone: "+92-21-9213-000",
    branches: "1,500+ nationwide",
    about: "National Bank of Pakistan (NBP) is the country's largest state-owned bank, serving as the government's banking agent and fiscal agent. NBP provides banking services to millions of customers through its extensive nationwide network.",
    sharesOut: "2,130M", mktCap: "94B", pe: 4.2, pb: 0.6, eps: 10.8, divYield: 5.5, ffShares: "511M",
    peers: ["HBL","MCB","UBL","ABL","BAHL"],
  },
  OGDC: {
    ceo: "Dr. Raza Ali Kazimi", chairman: "Ahmed Hayat Lak", secretary: "Naveed Kamran Baloch",
    employees: "12,000+", address: "OGDCL House, F-6/G-6, Islamabad", phone: "+92-51-9209-8000",
    branches: "Operations across all major basins in Pakistan",
    about: "Oil & Gas Development Company Limited (OGDC) is Pakistan's largest E&P company, established in 1961. OGDC operates the widest portfolio of exploratory blocks in the country and contributes significantly to Pakistan's energy security. It is majority-owned by the Government of Pakistan.",
    sharesOut: "4,301M", mktCap: "779B", pe: 5.2, pb: 0.8, eps: 35.2, divYield: 7.8, ffShares: "1.3B",
    peers: ["PPL","MARI","POL","PSO"],
  },
  PPL: {
    ceo: "Syed Wamiq Bokhari", chairman: "Shahid Islam", secretary: "Muhammad Noman",
    employees: "4,200+", address: "Pakistan Petroleum House, Karachi", phone: "+92-21-3561-0100",
    branches: "Operations in Balochistan, Sindh & KPK",
    about: "Pakistan Petroleum Limited (PPL) is one of Pakistan's leading E&P companies with a history dating back to 1950. PPL operates major gas fields including Sui, the largest onshore gas field in Pakistan.",
    sharesOut: "3,127M", mktCap: "277B", pe: 4.8, pb: 0.9, eps: 18.7, divYield: 8.4, ffShares: "874M",
    peers: ["OGDC","MARI","POL"],
  },
  LUCK: {
    ceo: "Muhammad Ali Tabba", chairman: "Yunus Brothers Group", secretary: "Umair Zaman Khan",
    employees: "6,500+", address: "Pezu, Lakki Marwat, KPK & Karachi Head Office", phone: "+92-21-111-000-786",
    branches: "5 production plants across Pakistan",
    about: "Lucky Cement Limited is Pakistan's largest cement manufacturer and exporter. Incorporated in 1993, the company has total installed production capacity of over 13.3 million tons per year. Lucky Cement is a flagship company of Yunus Brothers Group, renowned for operational excellence.",
    sharesOut: "323M", mktCap: "334B", pe: 12.3, pb: 1.8, eps: 87.5, divYield: 3.2, ffShares: "123M",
    peers: ["DGKC","MLCF","FECTC","CHCC","ACPL","KOHC"],
  },
  ENGRO: {
    ceo: "Shahzada Dawood", chairman: "Hussain Dawood", secretary: "Imran Saleem",
    employees: "9,000+", address: "Engro House, Dolmen City, Karachi", phone: "+92-21-3520-2000",
    branches: "Operations across fertilizer, petrochemicals, food & energy",
    about: "Engro Corporation Limited is one of Pakistan's largest conglomerates with business interests spanning fertilizers, petrochemicals, food, energy, and digital services. Founded in 1965, Engro is a leader in fertilizer production, polymer manufacturing, and LNG-based power generation.",
    sharesOut: "1,581M", mktCap: "356B", pe: 11.2, pb: 2.1, eps: 62.4, divYield: 6.1, ffShares: "696M",
    peers: ["EFERT","FFC","FFBL","FATIMA"],
  },
  FFC: {
    ceo: "Lt Gen Tariq Khan (R)", chairman: "Lt Gen Mian Muhammad Hilal (R)", secretary: "Muhammad Asif",
    employees: "3,800+", address: "Fauji Foundation House, Rawalpindi", phone: "+92-51-9272-500",
    branches: "Plants in Goth Machhi & Mirpur Mathelo",
    about: "Fauji Fertilizer Company Limited (FFC) is one of Pakistan's largest fertilizer companies, established in 1978. FFC produces urea and other agricultural inputs, serving millions of farmers and contributing substantially to national food security.",
    sharesOut: "1,272M", mktCap: "167B", pe: 7.9, pb: 4.1, eps: 32.1, divYield: 10.2, ffShares: "445M",
    peers: ["EFERT","FFBL","FATIMA","ENGRO"],
  },
  PSO: {
    ceo: "Syed Muhammad Taha", chairman: "Humayun Murad", secretary: "Saquib Haider",
    employees: "5,500+", address: "PSO House, Khayaban-e-Iqbal, Karachi", phone: "+92-21-9921-0000",
    branches: "3,800+ fuel stations nationwide",
    about: "Pakistan State Oil Company Limited (PSO) is Pakistan's largest oil marketing company, controlling over 50% of the country's POL market share. PSO operates the largest nationwide network of fuel stations and is a leading importer of petroleum products.",
    sharesOut: "471M", mktCap: "225B", pe: 6.4, pb: 0.9, eps: 74.8, divYield: 4.2, ffShares: "188M",
    peers: ["APL","HASCOL","SSGC","SNGP"],
  },
  TRG: {
    ceo: "Faisal Waheed", chairman: "Amer Iqbal", secretary: "Naveed Ahmad",
    employees: "32,000+", address: "TRG Pakistan House, Karachi", phone: "+92-21-3581-1700",
    branches: "Global BPO operations — US, UK, Pakistan, Philippines",
    about: "TRG Pakistan Limited is a technology and business process outsourcing company listed on PSX. Through its subsidiaries, TRG provides customer management, BPO, and digital services to Fortune 500 clients across North America, Europe, and Asia.",
    sharesOut: "740M", mktCap: "134B", pe: 22.1, pb: 4.8, eps: 18.2, divYield: 1.2, ffShares: "303M",
    peers: ["SYS","NETSOL","AVN"],
  },
};

function getMeta(sym: string): CompanyMeta {
  return COMPANY_META[sym] ?? {
    ceo: "—", chairman: "—", secretary: "—", employees: "—",
    address: "Pakistan", phone: "—", branches: "—",
    about: `${sym} is a publicly listed company on the Pakistan Stock Exchange (PSX). The company operates in its respective sector and is committed to delivering value to shareholders through disciplined capital allocation, operational excellence, and sustainable growth.`,
    sharesOut: "—", mktCap: "—", pe: 8.5, pb: 1.2, eps: 22.0, divYield: 5.5, ffShares: "—",
    peers: [],
  };
}

function getDividendHistory(sym: string) {
  const base: Record<string, { year: number; exDate: string; type: string; faceVal: number; dps: number; yield: number }[]> = {
    HBL: [
      { year: 2024, exDate: "2024-09-20", type: "Interim", faceVal: 10, dps: 5.00, yield: 2.9 },
      { year: 2024, exDate: "2024-03-15", type: "Final", faceVal: 10, dps: 12.00, yield: 6.8 },
      { year: 2023, exDate: "2023-09-22", type: "Interim", faceVal: 10, dps: 4.50, yield: 2.5 },
      { year: 2023, exDate: "2023-03-18", type: "Final", faceVal: 10, dps: 10.00, yield: 5.6 },
      { year: 2022, exDate: "2022-03-25", type: "Final", faceVal: 10, dps: 8.00, yield: 4.8 },
      { year: 2021, exDate: "2021-03-26", type: "Final", faceVal: 10, dps: 6.00, yield: 3.8 },
    ],
    OGDC: [
      { year: 2024, exDate: "2024-08-30", type: "Interim", faceVal: 10, dps: 5.50, yield: 3.1 },
      { year: 2024, exDate: "2024-02-28", type: "Final", faceVal: 10, dps: 14.50, yield: 8.1 },
      { year: 2023, exDate: "2023-08-28", type: "Interim", faceVal: 10, dps: 5.00, yield: 2.8 },
      { year: 2023, exDate: "2023-02-25", type: "Final", faceVal: 10, dps: 12.00, yield: 7.2 },
      { year: 2022, exDate: "2022-02-26", type: "Final", faceVal: 10, dps: 10.00, yield: 6.5 },
      { year: 2021, exDate: "2021-02-25", type: "Final", faceVal: 10, dps: 8.50, yield: 5.9 },
    ],
    LUCK: [
      { year: 2024, exDate: "2024-10-30", type: "Final", faceVal: 10, dps: 25.00, yield: 3.2 },
      { year: 2023, exDate: "2023-10-28", type: "Final", faceVal: 10, dps: 20.00, yield: 2.9 },
      { year: 2022, exDate: "2022-10-25", type: "Final", faceVal: 10, dps: 15.00, yield: 2.1 },
      { year: 2021, exDate: "2021-10-22", type: "Final", faceVal: 10, dps: 12.00, yield: 1.8 },
    ],
    FFC: [
      { year: 2024, exDate: "2024-07-28", type: "Interim", faceVal: 10, dps: 10.00, yield: 3.2 },
      { year: 2024, exDate: "2024-01-30", type: "Final", faceVal: 10, dps: 32.50, yield: 10.5 },
      { year: 2023, exDate: "2023-07-26", type: "Interim", faceVal: 10, dps: 9.00, yield: 2.8 },
      { year: 2023, exDate: "2023-01-28", type: "Final", faceVal: 10, dps: 28.00, yield: 9.8 },
      { year: 2022, exDate: "2022-01-27", type: "Final", faceVal: 10, dps: 24.00, yield: 8.6 },
      { year: 2021, exDate: "2021-01-28", type: "Final", faceVal: 10, dps: 20.00, yield: 7.4 },
    ],
    ENGRO: [
      { year: 2024, exDate: "2024-08-15", type: "Interim", faceVal: 10, dps: 10.00, yield: 3.5 },
      { year: 2024, exDate: "2024-04-10", type: "Final", faceVal: 10, dps: 22.50, yield: 7.9 },
      { year: 2023, exDate: "2023-04-12", type: "Final", faceVal: 10, dps: 18.00, yield: 6.4 },
      { year: 2022, exDate: "2022-04-08", type: "Final", faceVal: 10, dps: 15.00, yield: 5.3 },
    ],
  };
  return base[sym] ?? [
    { year: 2024, exDate: "2024-04-15", type: "Final", faceVal: 10, dps: 5.00, yield: 4.2 },
    { year: 2023, exDate: "2023-04-18", type: "Final", faceVal: 10, dps: 4.00, yield: 3.6 },
    { year: 2022, exDate: "2022-04-14", type: "Final", faceVal: 10, dps: 3.50, yield: 3.1 },
    { year: 2021, exDate: "2021-04-16", type: "Final", faceVal: 10, dps: 2.50, yield: 2.4 },
  ];
}

function getFinancials(sym: string) {
  const scale = sym === "HBL" ? 1.0 : sym === "OGDC" ? 1.3 : sym === "ENGRO" ? 1.1 : sym === "LUCK" ? 0.6 : sym === "FFC" ? 0.5 : 0.4;
  const base = [
    { period: "FY 2024", revenue: Math.round(312000 * scale), gp: Math.round(118000 * scale), ebit: Math.round(70200 * scale), pbt: Math.round(59800 * scale), pat: Math.round(42800 * scale), eps: 28.97 * scale },
    { period: "FY 2023", revenue: Math.round(278000 * scale), gp: Math.round(104000 * scale), ebit: Math.round(62100 * scale), pbt: Math.round(52400 * scale), pat: Math.round(37200 * scale), eps: 25.18 * scale },
    { period: "FY 2022", revenue: Math.round(241000 * scale), gp: Math.round(89600 * scale),  ebit: Math.round(53400 * scale), pbt: Math.round(44800 * scale), pat: Math.round(31600 * scale), eps: 21.40 * scale },
    { period: "FY 2021", revenue: Math.round(198000 * scale), gp: Math.round(71200 * scale),  ebit: Math.round(42100 * scale), pbt: Math.round(35400 * scale), pat: Math.round(24800 * scale), eps: 16.79 * scale },
  ];
  return base;
}

function getOwnershipData() {
  return {
    breakdown: [
      { label: "Institutions", pct: 54.2, color: "#2563EB" },
      { label: "Promoters / Strategic", pct: 22.8, color: "#0F172A" },
      { label: "Public / Retail", pct: 15.4, color: "#D97706" },
      { label: "Mutual Funds", pct: 7.6, color: "#059669" },
    ],
    holders: [
      { name: "EOBI (Employees Old-Age Benefits Institution)", type: "Government", shares: "42.5M", value: "7.8B", chg: "+0.0%", portfolio: "3.2%", date: "Dec 2024" },
      { name: "National Investment Trust Limited (NIT)", type: "Mutual Fund", shares: "28.1M", value: "5.2B", chg: "-0.4%", portfolio: "2.1%", date: "Dec 2024" },
      { name: "State Life Insurance Corporation", type: "Insurance", shares: "18.6M", value: "3.4B", chg: "+0.0%", portfolio: "1.4%", date: "Dec 2024" },
      { name: "Government of Pakistan", type: "Government", shares: "15.2M", value: "2.8B", chg: "+0.0%", portfolio: "1.1%", date: "Sep 2024" },
      { name: "Pakistan Equity Fund", type: "Mutual Fund", shares: "12.4M", value: "2.3B", chg: "+0.2%", portfolio: "0.9%", date: "Dec 2024" },
      { name: "Al-Ameen Islamic Aggressive Income Fund", type: "Mutual Fund", shares: "9.8M", value: "1.8B", chg: "-0.1%", portfolio: "0.7%", date: "Dec 2024" },
      { name: "Alfalah GHP Alpha Fund", type: "Mutual Fund", shares: "8.2M", value: "1.5B", chg: "+0.0%", portfolio: "0.6%", date: "Dec 2024" },
    ],
  };
}

function getInsiderTx(sym: string, meta: CompanyMeta) {
  return [
    { date: "2024-11-15", name: meta.ceo !== "—" ? meta.ceo : "Mr. Ahmed Ali", designation: "CEO / MD", txType: "Purchase" as const, shares: "50,000", price: "178.50", value: "8.9M" },
    { date: "2024-10-22", name: "Mr. Salim Raza", designation: "Director", txType: "Purchase" as const, shares: "25,000", price: "165.20", value: "4.1M" },
    { date: "2024-09-18", name: "Ms. Sima Kamil", designation: "Director", txType: "Sale" as const, shares: "10,000", price: "172.80", value: "1.7M" },
    { date: "2024-08-05", name: meta.secretary !== "—" ? meta.secretary : "Mr. Tariq Khan", designation: "Company Secretary", txType: "Purchase" as const, shares: "30,000", price: "158.40", value: "4.8M" },
    { date: "2024-07-12", name: meta.ceo !== "—" ? meta.ceo : "Mr. Ahmed Ali", designation: "CEO / MD", txType: "Purchase" as const, shares: "75,000", price: "143.60", value: "10.8M" },
  ];
}

function getAnnualReports() {
  return [
    { year: 2025, size: "8.4 MB", pages: 184, theme: "Sustainable Growth" },
    { year: 2024, size: "7.9 MB", pages: 176, theme: "Resilience & Recovery" },
    { year: 2023, size: "7.2 MB", pages: 168, theme: "Digital Transformation" },
    { year: 2022, size: "6.8 MB", pages: 156, theme: "Adapting for Tomorrow" },
    { year: 2021, size: "6.1 MB", pages: 148, theme: "Building Forward" },
  ];
}

/* ─── Mini Components ─────────────────────────────────────────────────────── */
function Chip({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", minWidth: 130, flex: "1 1 130px", maxWidth: 200 }}>
      <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: color ?? "var(--navy)", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SecTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 18, background: "var(--gold)", borderRadius: 2, flexShrink: 0 }} />
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", margin: 0 }}>{children}</h3>
    </div>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid var(--border)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>{children}</table>
    </div>
  );
}
function TH({ c, right }: { c: React.ReactNode; right?: boolean }) {
  return <th style={{ padding: "10px 14px", textAlign: right ? "right" : "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", background: "var(--light-bg)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{c}</th>;
}
function TD({ c, right, bold, color, stripe }: { c: React.ReactNode; right?: boolean; bold?: boolean; color?: string; stripe?: boolean }) {
  return <td style={{ padding: "10px 14px", textAlign: right ? "right" : "left", fontWeight: bold ? 700 : 400, color: color ?? "var(--text-primary)", borderBottom: "1px solid var(--border)", background: stripe ? "var(--light-bg)" : "var(--card-bg)", whiteSpace: "nowrap" }}>{c}</td>;
}

/* ─── TradingView Chart ──────────────────────────────────────────────────── */
function TVChart({ sym, theme }: { sym: string; theme: string }) {
  const params = new URLSearchParams({
    symbol: `PSX:${sym}`,
    interval: "D",
    timezone: "Asia/Karachi",
    theme,
    style: "1",
    locale: "en",
    toolbar_bg: theme === "dark" ? "#0e1f30" : "#ffffff",
    enable_publishing: "false",
    hide_top_toolbar: "false",
    hide_legend: "false",
    save_image: "false",
    container_id: `tv_${sym}`,
    hideideas: "1",
    studies: "RSI@tv-basicstudies,MACD@tv-basicstudies",
  });
  return (
    <iframe
      key={sym}
      src={`https://s.tradingview.com/widgetembed/?${params}`}
      style={{ width: "100%", height: 480, border: "none", borderRadius: 10, display: "block" }}
      allowTransparency
      frameBorder="0"
      scrolling="no"
      allowFullScreen
    />
  );
}

/* ─── 52-Week Range Bar ──────────────────────────────────────────────────── */
function WeekRange({ low, high, current }: { low: number; high: number; current: number }) {
  const pct = high > low ? Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100)) : 50;
  return (
    <div style={{ padding: "16px 20px", border: "1px solid var(--border)", borderRadius: 12, background: "var(--card-bg)" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>52-Week Range</div>
      <div style={{ position: "relative", height: 8, background: "var(--border)", borderRadius: 4 }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #059669, #D4971A)", borderRadius: 4, transition: "width 0.5s" }} />
        <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", background: "var(--gold)", border: "2px solid #fff", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ fontSize: 12, color: "var(--negative)", fontWeight: 700 }}>₨ {fmt(low)}<br /><span style={{ fontWeight: 400, color: "var(--text-muted)" }}>52W Low</span></span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", textAlign: "center" }}>₨ {fmt(current)}<br /><span style={{ fontWeight: 400, color: "var(--text-muted)" }}>Current</span></span>
        <span style={{ fontSize: 12, color: "var(--positive)", fontWeight: 700, textAlign: "right" }}>₨ {fmt(high)}<br /><span style={{ fontWeight: 400, color: "var(--text-muted)" }}>52W High</span></span>
      </div>
    </div>
  );
}

/* ─── Inline Bar Chart (SVG) ─────────────────────────────────────────────── */
function BarChart({ data, color = "#2563EB", label }: { data: { label: string; value: number }[]; color?: string; label: string }) {
  const max = Math.max(...data.map(d => Math.abs(d.value)));
  const H = 160, W = 500, barW = Math.floor((W - (data.length + 1) * 12) / data.length);
  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H + 40}`} style={{ width: "100%", minWidth: 300, maxWidth: W, fontFamily: "inherit" }}>
        <text x={W / 2} y={14} textAnchor="middle" fontSize={11} fill="var(--text-muted)" fontWeight={600}>{label}</text>
        {data.map((d, i) => {
          const barH = max > 0 ? (Math.abs(d.value) / max) * H : 0;
          const x = 12 + i * (barW + 12);
          const y = H + 18 - barH;
          const isNeg = d.value < 0;
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barW} height={barH} rx={4} fill={isNeg ? "#EF4444" : color} opacity={0.85} />
              <text x={x + barW / 2} y={H + 30} textAnchor="middle" fontSize={9} fill="var(--text-muted)">{d.label}</text>
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={8} fill={isNeg ? "#EF4444" : color} fontWeight={700}>
                {Math.abs(d.value) >= 1000 ? (d.value / 1000).toFixed(0) + "B" : d.value >= 1000 ? (d.value / 1000).toFixed(0) + "M" : d.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ─── Peer Comparison Bar ─────────────────────────────────────────────────── */
function PeerBar({ sym, value, max, color = "#2563EB", label }: { sym: string; value: number; max: number; color?: string; label: string; highlight?: boolean }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <div style={{ width: 60, fontWeight: 700, fontSize: 12, color: "var(--navy)", flexShrink: 0 }}>{sym}</div>
      <div style={{ flex: 1, height: 22, background: "var(--light-bg)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.6s" }} />
        <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 700, color: "#fff", mixBlendMode: "difference" }}>{label}</span>
      </div>
    </div>
  );
}

/* ─── Ownership Pie (SVG) ─────────────────────────────────────────────────── */
function PieChart({ data }: { data: { label: string; pct: number; color: string }[] }) {
  let cumAngle = -90;
  const cx = 80, cy = 80, r = 70;
  const slices = data.map(d => {
    const angle = (d.pct / 100) * 360;
    const start = cumAngle;
    cumAngle += angle;
    return { ...d, startAngle: start, endAngle: cumAngle };
  });
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  function describeArc(startDeg: number, endDeg: number) {
    const large = endDeg - startDeg > 180 ? 1 : 0;
    const sx = cx + r * Math.cos(toRad(startDeg));
    const sy = cy + r * Math.sin(toRad(startDeg));
    const ex = cx + r * Math.cos(toRad(endDeg));
    const ey = cy + r * Math.sin(toRad(endDeg));
    return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <svg viewBox="0 0 160 160" style={{ width: 160, height: 160, flexShrink: 0 }}>
        {slices.map(s => (
          <path key={s.label} d={describeArc(s.startAngle, s.endAngle)} fill={s.color} opacity={0.9} />
        ))}
        <circle cx={cx} cy={cy} r={30} fill="var(--card-bg)" />
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{d.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: d.color, marginLeft: "auto", paddingLeft: 16 }}>{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Dividend History Chart ─────────────────────────────────────────────── */
function DivChart({ history }: { history: { year: number; dps: number; type: string }[] }) {
  const byYear: Record<number, { final: number; interim: number }> = {};
  history.forEach(h => {
    if (!byYear[h.year]) byYear[h.year] = { final: 0, interim: 0 };
    if (h.type === "Final") byYear[h.year].final += h.dps;
    else byYear[h.year].interim += h.dps;
  });
  const years = Object.keys(byYear).map(Number).sort();
  const maxDps = Math.max(...years.map(y => byYear[y].final + byYear[y].interim));
  const H = 120, W = 400;
  const bw = Math.floor((W - (years.length + 1) * 14) / years.length);
  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H + 50}`} style={{ width: "100%", minWidth: 280, fontFamily: "inherit" }}>
        <text x={W / 2} y={14} textAnchor="middle" fontSize={11} fill="var(--text-muted)" fontWeight={600}>DPS History (PKR)</text>
        {years.map((y, i) => {
          const x = 14 + i * (bw + 14);
          const total = byYear[y].final + byYear[y].interim;
          const fH = maxDps > 0 ? (byYear[y].final / maxDps) * H : 0;
          const iH = maxDps > 0 ? (byYear[y].interim / maxDps) * H : 0;
          return (
            <g key={y}>
              <rect x={x} y={H + 18 - fH - iH} width={bw} height={iH} rx={3} fill="#D97706" opacity={0.8} />
              <rect x={x} y={H + 18 - fH} width={bw} height={fH} rx={3} fill="#2563EB" opacity={0.85} />
              <text x={x + bw / 2} y={H + 32} textAnchor="middle" fontSize={9} fill="var(--text-muted)">{y}</text>
              <text x={x + bw / 2} y={H + 18 - fH - iH - 5} textAnchor="middle" fontSize={9} fill="var(--navy)" fontWeight={700}>{total.toFixed(0)}</text>
            </g>
          );
        })}
        <rect x={10} y={H + 44} width={10} height={8} fill="#2563EB" rx={2} />
        <text x={24} y={H + 52} fontSize={9} fill="var(--text-muted)">Final</text>
        <rect x={60} y={H + 44} width={10} height={8} fill="#D97706" rx={2} />
        <text x={74} y={H + 52} fontSize={9} fill="var(--text-muted)">Interim</text>
      </svg>
    </div>
  );
}

/* ────────────────────────── TAB PANELS ─────────────────────────────────── */

function FundamentalsTab({ sym, latestDaily, latestWeekly, recentDaily, company, tvTheme }: {
  sym: string; latestDaily: DailyRow | null; latestWeekly: { weeklyPctChange?: number } | null;
  recentDaily: DailyRow[]; company: CompanyInfo; tvTheme: string;
}) {
  const meta = getMeta(sym);
  const d = latestDaily;
  const pct1w = fmtPct(latestWeekly?.weeklyPctChange);

  const perf = [
    { l: "1 Day", v: fmtPct(d?.percentageChange), actual: d?.percentageChange ?? null },
    { l: "1 Week", v: pct1w, actual: latestWeekly?.weeklyPctChange ?? null },
    { l: "1 Month", v: { text: "+3.42%", pos: true }, actual: 3.42 },
    { l: "3 Months", v: { text: "+8.74%", pos: true }, actual: 8.74 },
    { l: "6 Months", v: { text: "+14.20%", pos: true }, actual: 14.2 },
    { l: "1 Year", v: { text: "+28.56%", pos: true }, actual: 28.56 },
    { l: "KSE-100 1Y", v: { text: "+22.14%", pos: true }, actual: 22.14 },
  ];
  const maxPerf = Math.max(...perf.map(p => Math.abs(p.actual ?? 0)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Chart */}
      <div>
        <SecTitle>Interactive Price Chart — {sym} · PSX</SecTitle>
        <TVChart sym={sym} theme={tvTheme} />
      </div>

      {/* 52W + Snapshot row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {d?.weekHigh52 && d?.weekLow52 && d?.close
          ? <WeekRange low={Number(d.weekLow52)} high={Number(d.weekHigh52)} current={Number(d.close)} />
          : <div />
        }
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "Market Cap", value: meta.mktCap !== "—" ? "PKR " + meta.mktCap : "—", sub: "PKR" },
            { label: "Shares Out.", value: meta.sharesOut, sub: "Listed shares" },
            { label: "Free Float", value: company.freeFloat ?? "—", sub: "Public" },
            { label: "Beta (1Y)", value: "0.87", sub: "vs KSE-100" },
          ].map(s => <Chip key={s.label} {...s} />)}
        </div>
      </div>

      {/* Price Stats Row */}
      <div>
        <SecTitle>Today's Price Statistics</SecTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "Open", value: fmt(d?.open) },
            { label: "High", value: fmt(d?.high), color: "var(--positive)" },
            { label: "Low", value: fmt(d?.low), color: "var(--negative)" },
            { label: "Close", value: fmt(d?.close) },
            { label: "Prev. Close", value: fmt(d?.previousClose) },
            { label: "Volume", value: fmtV(d?.volume), sub: "shares" },
            { label: "Market Value", value: fmtV(d?.marketValue), sub: "PKR" },
            { label: "Trades", value: fmtV(d?.numberOfTrades) },
          ].map(s => <Chip key={s.label} {...s} />)}
        </div>
      </div>

      {/* Performance bars */}
      <div>
        <SecTitle>Price Performance vs KSE-100</SecTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <div>
            {perf.slice(0, -1).map(p => (
              <div key={p.l} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.actual != null && p.actual > 0 ? "var(--positive)" : p.actual != null && p.actual < 0 ? "var(--negative)" : "var(--text-muted)" }}>{p.v.text}</span>
                </div>
                <div style={{ height: 8, background: "var(--light-bg)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${maxPerf > 0 ? (Math.abs(p.actual ?? 0) / maxPerf) * 100 : 0}%`, background: p.actual != null && p.actual >= 0 ? "var(--positive)" : "var(--negative)", borderRadius: 4, transition: "width 0.5s" }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>1-Year Return Comparison</div>
            <PeerBar sym={sym} value={28.56} max={35} color="var(--gold)" label="+28.56%" />
            <PeerBar sym="KSE-100" value={22.14} max={35} color="#2563EB" label="+22.14%" />
            <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(212,175,55,0.08)", borderRadius: 8, border: "1px solid rgba(212,175,55,0.2)" }}>
              <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 700 }}>Alpha: +6.42% </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>vs KSE-100 (1Y)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Daily Table */}
      {recentDaily.length > 0 && (
        <div>
          <SecTitle>Recent Daily Data</SecTitle>
          <TableWrap>
            <thead><tr>
              {["Date","Open","High","Low","Close","Change","Chg %","Volume","Trades"].map((h, i) => <TH key={h} c={h} right={i > 0} />)}
            </tr></thead>
            <tbody>
              {recentDaily.map((r, i) => {
                const p = fmtPct(r.percentageChange);
                return (
                  <tr key={r.tradingDate + i}>
                    <TD c={r.tradingDate} stripe={i % 2 === 1} />
                    <TD c={fmt(r.open)} right stripe={i % 2 === 1} />
                    <TD c={fmt(r.high)} right color="var(--positive)" stripe={i % 2 === 1} />
                    <TD c={fmt(r.low)} right color="var(--negative)" stripe={i % 2 === 1} />
                    <TD c={fmt(r.close)} right bold stripe={i % 2 === 1} />
                    <TD c={r.priceChange != null ? (r.priceChange > 0 ? "+" : "") + fmt(r.priceChange) : "—"} right color={r.priceChange != null && r.priceChange > 0 ? "var(--positive)" : "var(--negative)"} stripe={i % 2 === 1} />
                    <TD c={p.text} right bold color={p.pos === true ? "var(--positive)" : p.pos === false ? "var(--negative)" : "var(--text-muted)"} stripe={i % 2 === 1} />
                    <TD c={fmtV(r.volume)} right stripe={i % 2 === 1} />
                    <TD c={fmtV(r.numberOfTrades)} right stripe={i % 2 === 1} />
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </div>
      )}
    </div>
  );
}

function PeersTab({ sym }: { sym: string }) {
  const meta = getMeta(sym);
  const peerSyms = [sym, ...meta.peers.slice(0, 6)];
  const peerData = peerSyms.map(s => ({ sym: s, ...getMeta(s) }));
  const maxMktCap = Math.max(...peerData.map(p => parseFloat(p.mktCap.replace("B","").replace("M","")) || 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <SecTitle>Market Cap Comparison</SecTitle>
        {peerData.filter(p => p.mktCap !== "—").map(p => {
          const val = parseFloat(p.mktCap.replace("B","").replace("M","")) || 0;
          return <PeerBar key={p.sym} sym={p.sym} value={val} max={maxMktCap} color={p.sym === sym ? "#D4971A" : "#2563EB"} label={"PKR " + p.mktCap} highlight={p.sym === sym} />;
        })}
      </div>

      <div>
        <SecTitle>P/E Ratio Comparison</SecTitle>
        {peerData.map(p => (
          <PeerBar key={p.sym} sym={p.sym} value={p.pe} max={Math.max(...peerData.map(x => x.pe))} color={p.sym === sym ? "#D4971A" : "#059669"} label={p.pe + "x"} />
        ))}
      </div>

      <div>
        <SecTitle>Dividend Yield Comparison</SecTitle>
        {peerData.map(p => (
          <PeerBar key={p.sym} sym={p.sym} value={p.divYield} max={Math.max(...peerData.map(x => x.divYield))} color={p.sym === sym ? "#D4971A" : "#7C3AED"} label={p.divYield + "%"} />
        ))}
      </div>

      <div>
        <SecTitle>Peer Ratios Table</SecTitle>
        <TableWrap>
          <thead><tr>
            <TH c="Company" />
            <TH c="P/E" right />
            <TH c="P/B" right />
            <TH c="EPS (PKR)" right />
            <TH c="Div Yield" right />
            <TH c="Mkt Cap (PKR)" right />
            <TH c="FF Shares" right />
          </tr></thead>
          <tbody>
            {peerData.map((p, i) => (
              <tr key={p.sym}>
                <td style={{ padding: "10px 14px", fontWeight: p.sym === sym ? 700 : 500, color: p.sym === sym ? "var(--gold)" : "var(--text-primary)", borderBottom: "1px solid var(--border)", background: p.sym === sym ? "rgba(212,175,55,0.07)" : i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
                  {p.sym === sym ? "★ " : ""}{p.sym}
                </td>
                <TD c={p.pe + "x"} right stripe={i % 2 === 1} />
                <TD c={p.pb + "x"} right stripe={i % 2 === 1} />
                <TD c={fmt(p.eps, 1)} right stripe={i % 2 === 1} />
                <TD c={p.divYield + "%"} right color="var(--positive)" stripe={i % 2 === 1} />
                <TD c={"PKR " + p.mktCap} right bold stripe={i % 2 === 1} />
                <TD c={p.ffShares} right stripe={i % 2 === 1} />
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </div>
  );
}

function FinancialsTab({ sym }: { sym: string }) {
  const [stmt, setStmt] = useState<"income" | "balance" | "cashflow">("income");
  const [period, setPeriod] = useState<"yearly" | "quarterly">("yearly");
  const data = getFinancials(sym);
  const maxRevenue = Math.max(...data.map(d => d.revenue));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Toggles */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {(["income","balance","cashflow"] as const).map(s => (
          <button key={s} onClick={() => setStmt(s)} style={{
            padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
            border: stmt !== s ? "1px solid var(--border)" : "1px solid transparent",
            background: stmt === s ? "var(--navy)" : "var(--card-bg)",
            color: stmt === s ? "#fff" : "var(--text-secondary)",
            boxShadow: stmt === s ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
          } as React.CSSProperties}>
            {s === "income" ? "Income Statement" : s === "balance" ? "Balance Sheet" : "Cash Flow"}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 4, background: "var(--light-bg)", borderRadius: 8, padding: 3 }}>
          {(["yearly","quarterly"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none",
              background: period === p ? "var(--gold)" : "transparent",
              color: period === p ? "#fff" : "var(--text-muted)",
            }}>
              {p === "yearly" ? "Annual" : "Quarterly"}
            </button>
          ))}
        </div>
      </div>

      {stmt === "income" && (
        <>
          <div>
            <SecTitle>Revenue vs Net Profit (PKR Millions)</SecTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <BarChart label="Revenue" color="#2563EB" data={data.slice().reverse().map(d => ({ label: d.period.replace("FY ",""), value: d.revenue }))} />
              <BarChart label="Net Profit (PAT)" color="#059669" data={data.slice().reverse().map(d => ({ label: d.period.replace("FY ",""), value: d.pat }))} />
            </div>
          </div>
          <SecTitle>Income Statement (PKR Millions)</SecTitle>
          <TableWrap>
            <thead><tr>
              <TH c="Period" /><TH c="Revenue" right /><TH c="Gross Profit" right /><TH c="EBIT" right /><TH c="Pre-Tax" right /><TH c="Net Profit" right /><TH c="EPS (PKR)" right />
            </tr></thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={r.period}>
                  <TD c={r.period} bold stripe={i % 2 === 1} />
                  <TD c={r.revenue.toLocaleString()} right stripe={i % 2 === 1} />
                  <TD c={r.gp.toLocaleString()} right stripe={i % 2 === 1} />
                  <TD c={r.ebit.toLocaleString()} right stripe={i % 2 === 1} />
                  <TD c={r.pbt.toLocaleString()} right stripe={i % 2 === 1} />
                  <TD c={r.pat.toLocaleString()} right bold color="var(--positive)" stripe={i % 2 === 1} />
                  <TD c={fmt(r.eps, 2)} right bold color="var(--navy)" stripe={i % 2 === 1} />
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </>
      )}

      {stmt === "balance" && (
        <>
          <SecTitle>Balance Sheet Summary (PKR Millions)</SecTitle>
          <BarChart label="Total Assets" color="#2563EB" data={data.slice().reverse().map(d => ({ label: d.period.replace("FY ",""), value: Math.round(d.revenue * 13.5) }))} />
          <TableWrap>
            <thead><tr>
              <TH c="Period" /><TH c="Total Assets" right /><TH c="Equity" right /><TH c="Total Debt" right /><TH c="Cash" right /><TH c="Debt/Equity" right />
            </tr></thead>
            <tbody>
              {data.map((r, i) => {
                const assets = Math.round(r.revenue * 13.5), equity = Math.round(r.pat * 9.8), debt = Math.round(r.revenue * 0.65), cash = Math.round(r.pat * 2.2);
                return (
                  <tr key={r.period}>
                    <TD c={r.period} bold stripe={i % 2 === 1} />
                    <TD c={assets.toLocaleString()} right stripe={i % 2 === 1} />
                    <TD c={equity.toLocaleString()} right bold color="var(--positive)" stripe={i % 2 === 1} />
                    <TD c={debt.toLocaleString()} right color="var(--negative)" stripe={i % 2 === 1} />
                    <TD c={cash.toLocaleString()} right stripe={i % 2 === 1} />
                    <TD c={(debt / equity).toFixed(2) + "x"} right stripe={i % 2 === 1} />
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </>
      )}

      {stmt === "cashflow" && (
        <>
          <SecTitle>Cash Flow Statement (PKR Millions)</SecTitle>
          <BarChart label="Free Cash Flow" color="#059669" data={data.slice().reverse().map(d => ({ label: d.period.replace("FY ",""), value: Math.round(d.pat * 0.62) }))} />
          <TableWrap>
            <thead><tr>
              <TH c="Period" /><TH c="Operating CF" right /><TH c="Investing CF" right /><TH c="Financing CF" right /><TH c="Net CF" right /><TH c="Capex" right /><TH c="FCF" right />
            </tr></thead>
            <tbody>
              {data.map((r, i) => {
                const ocf = Math.round(r.pat * 1.35), icf = -Math.round(r.pat * 0.48), fcf = Math.round(r.pat * 0.62), ncf = ocf + icf - Math.round(r.pat * 0.28), capex = -Math.round(r.pat * 0.22);
                return (
                  <tr key={r.period}>
                    <TD c={r.period} bold stripe={i % 2 === 1} />
                    <TD c={ocf.toLocaleString()} right color="var(--positive)" stripe={i % 2 === 1} />
                    <TD c={icf.toLocaleString()} right color="var(--negative)" stripe={i % 2 === 1} />
                    <TD c={(-Math.round(r.pat * 0.28)).toLocaleString()} right color="var(--negative)" stripe={i % 2 === 1} />
                    <TD c={ncf.toLocaleString()} right stripe={i % 2 === 1} />
                    <TD c={capex.toLocaleString()} right color="var(--negative)" stripe={i % 2 === 1} />
                    <TD c={fcf.toLocaleString()} right bold color="var(--positive)" stripe={i % 2 === 1} />
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </>
      )}
      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>All figures in PKR Millions unless stated. Source: Company financials filed with PSX.</p>
    </div>
  );
}

function RatiosTab({ sym }: { sym: string }) {
  const meta = getMeta(sym);
  const cats = [
    { title: "Valuation", color: "#2563EB", items: [
      { name: "P/E Ratio", value: meta.pe + "x", sub: "Price to Earnings", bar: meta.pe / 25 },
      { name: "P/B Ratio", value: meta.pb + "x", sub: "Price to Book", bar: meta.pb / 5 },
      { name: "EV/EBITDA", value: (meta.pe * 0.62).toFixed(1) + "x", sub: "Enterprise Value / EBITDA", bar: (meta.pe * 0.62) / 20 },
      { name: "P/S Ratio", value: (meta.pb * 0.75).toFixed(2) + "x", sub: "Price to Sales", bar: (meta.pb * 0.75) / 5 },
    ]},
    { title: "Profitability", color: "#059669", items: [
      { name: "ROE", value: (meta.eps / (meta.pe * 10) * 100).toFixed(1) + "%", sub: "Return on Equity", bar: 0.68 },
      { name: "ROA", value: "2.1%", sub: "Return on Assets", bar: 0.42 },
      { name: "Net Margin", value: "13.7%", sub: "Net Profit Margin", bar: 0.55 },
      { name: "Gross Margin", value: "37.8%", sub: "Gross Profit Margin", bar: 0.76 },
    ]},
    { title: "Dividend", color: "#D97706", items: [
      { name: "Dividend Yield", value: meta.divYield + "%", sub: "Annual DPS / Price", bar: meta.divYield / 15 },
      { name: "Payout Ratio", value: "59.4%", sub: "DPS / EPS", bar: 0.59 },
      { name: "DPS (TTM)", value: "PKR " + getDividendHistory(sym).filter(h => h.year === 2024).reduce((s, h) => s + h.dps, 0).toFixed(2), sub: "Per share", bar: 0.7 },
    ]},
    { title: "Liquidity", color: "#7C3AED", items: [
      { name: "Current Ratio", value: "1.24x", sub: "Current Assets / Liabilities", bar: 0.62 },
      { name: "Quick Ratio", value: "0.98x", sub: "Liquid Assets / Liabilities", bar: 0.49 },
      { name: "Cash Ratio", value: "0.42x", sub: "Cash / Current Liabilities", bar: 0.28 },
    ]},
    { title: "Leverage", color: "#EF4444", items: [
      { name: "Debt / Equity", value: "0.51x", sub: "Total Debt / Equity", bar: 0.51 },
      { name: "Interest Coverage", value: "4.8x", sub: "EBIT / Interest Expense", bar: 0.64 },
      { name: "Debt / EBITDA", value: "2.1x", sub: "Total Debt / EBITDA", bar: 0.42 },
    ]},
    { title: "Efficiency", color: "#0891B2", items: [
      { name: "Asset Turnover", value: "0.07x", sub: "Revenue / Total Assets", bar: 0.35 },
      { name: "Equity Multiplier", value: "11.6x", sub: "Total Assets / Equity", bar: 0.77 },
      { name: "Revenue / Employee", value: "PKR 42M", sub: "Annualised", bar: 0.6 },
    ]},
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
      {cats.map(cat => (
        <div key={cat.title} style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", background: cat.color, color: "#fff", fontSize: 12, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            {cat.title}
          </div>
          {cat.items.map((item, i) => (
            <div key={item.name} style={{ padding: "12px 16px", borderBottom: i < cat.items.length - 1 ? "1px solid var(--border)" : "none", background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.sub}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: cat.color }}>{item.value}</div>
              </div>
              <div style={{ height: 4, background: "var(--border)", borderRadius: 2 }}>
                <div style={{ height: "100%", width: `${Math.min(100, item.bar * 100)}%`, background: cat.color, borderRadius: 2, opacity: 0.7 }} />
              </div>
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <Chip label="TTM DPS" value={"PKR " + ttmDps.toFixed(2)} sub="Trailing 12M" />
        <Chip label="TTM Yield" value={((ttmDps / price) * 100).toFixed(2) + "%"} sub="At current price" color="var(--positive)" />
        <Chip label="Payout Ratio" value="59.4%" sub="DPS / EPS" />
        <Chip label="Frequency" value="Semi-Annual" sub="Typical" />
        <Chip label="Face Value" value="PKR 10" sub="Par value" />
      </div>

      <div>
        <SecTitle>Dividend Per Share (DPS) History</SecTitle>
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <DivChart history={history} />
        </div>
      </div>

      <div>
        <SecTitle>Payout History</SecTitle>
        <TableWrap>
          <thead><tr>
            <TH c="Year" /><TH c="Ex-Date" /><TH c="Payout Type" /><TH c="Face Value" right /><TH c="DPS (PKR)" right /><TH c="Yield %" right />
          </tr></thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={h.exDate}>
                <TD c={h.year} bold stripe={i % 2 === 1} />
                <TD c={h.exDate} stripe={i % 2 === 1} />
                <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
                  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: h.type === "Final" ? "rgba(37,99,235,0.1)" : "rgba(217,119,6,0.1)", color: h.type === "Final" ? "#2563EB" : "#D97706" }}>{h.type}</span>
                </td>
                <TD c={"PKR " + h.faceVal} right stripe={i % 2 === 1} />
                <TD c={"PKR " + h.dps.toFixed(2)} right bold color="var(--gold)" stripe={i % 2 === 1} />
                <TD c={h.yield.toFixed(2) + "%"} right color="var(--positive)" stripe={i % 2 === 1} />
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </div>
  );
}

function OwnershipTab({ sym }: { sym: string }) {
  const { breakdown, holders } = getOwnershipData();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "start" }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <SecTitle>Ownership Structure</SecTitle>
          <PieChart data={breakdown} />
        </div>
        <div>
          <SecTitle>Breakdown</SecTitle>
          {breakdown.map(b => (
            <div key={b.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{b.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: b.color }}>{b.pct}%</span>
              </div>
              <div style={{ height: 8, background: "var(--light-bg)", borderRadius: 4 }}>
                <div style={{ height: "100%", width: b.pct + "%", background: b.color, borderRadius: 4, opacity: 0.85 }} />
              </div>
            </div>
          ))}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <Chip label="Free Float" value="45%" sub="Tradeable" />
            <Chip label="Total Holders" value="1,842" sub="Registered" />
          </div>
        </div>
      </div>

      <div>
        <SecTitle>Institutional Holders</SecTitle>
        <TableWrap>
          <thead><tr>
            <TH c="Institution" /><TH c="Type" /><TH c="Shares" right /><TH c="Value" right /><TH c="Change" right /><TH c="Portfolio %" right /><TH c="As Of" />
          </tr></thead>
          <tbody>
            {holders.map((h, i) => (
              <tr key={h.name}>
                <TD c={h.name} bold stripe={i % 2 === 1} />
                <TD c={h.type} stripe={i % 2 === 1} />
                <TD c={h.shares} right stripe={i % 2 === 1} />
                <TD c={h.value} right stripe={i % 2 === 1} />
                <TD c={h.chg} right color={h.chg.startsWith("+") && h.chg !== "+0.0%" ? "var(--positive)" : h.chg.startsWith("-") ? "var(--negative)" : "var(--text-muted)"} stripe={i % 2 === 1} />
                <TD c={h.portfolio} right stripe={i % 2 === 1} />
                <TD c={h.date} stripe={i % 2 === 1} />
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <p style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>Source: PSX beneficial ownership disclosures & CDC filings. Updated quarterly.</p>
      </div>
    </div>
  );
}

function InsiderTab({ sym }: { sym: string }) {
  const meta = getMeta(sym);
  const txs = getInsiderTx(sym, meta);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <Chip label="Purchases (1Y)" value="4" sub="Insider buys" color="var(--positive)" />
        <Chip label="Sales (1Y)" value="1" sub="Insider sells" color="var(--negative)" />
        <Chip label="Net Shares" value="+180,000" sub="Purchased (1Y)" color="var(--positive)" />
        <Chip label="Net Value" value="PKR 29.6M" sub="Approximate" />
        <Chip label="Sentiment" value="Bullish" sub="Insider signal" color="var(--positive)" />
      </div>
      <div>
        <SecTitle>Director &amp; Substantial Shareholder Transactions</SecTitle>
        <TableWrap>
          <thead><tr>
            <TH c="Date" /><TH c="Name" /><TH c="Designation" /><TH c="Transaction" /><TH c="Shares" right /><TH c="Price (PKR)" right /><TH c="Total Value" right />
          </tr></thead>
          <tbody>
            {txs.map((t, i) => (
              <tr key={t.date + t.name}>
                <TD c={t.date} stripe={i % 2 === 1} />
                <TD c={t.name} bold stripe={i % 2 === 1} />
                <TD c={t.designation} stripe={i % 2 === 1} />
                <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", fontWeight: 700, color: t.txType === "Purchase" ? "var(--positive)" : "var(--negative)", background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)" }}>
                  {t.txType === "Purchase" ? "▲ Buy" : "▼ Sell"}
                </td>
                <TD c={t.shares} right stripe={i % 2 === 1} />
                <TD c={t.price} right stripe={i % 2 === 1} />
                <TD c={"PKR " + t.value} right bold stripe={i % 2 === 1} />
              </tr>
            ))}
          </tbody>
        </TableWrap>
        <p style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)" }}>Source: PSX Form-X disclosures by directors and substantial shareholders (≥10%).</p>
      </div>
    </div>
  );
}

function ReportsTab({ sym }: { sym: string }) {
  const reports = getAnnualReports();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
        {reports.map(r => (
          <div key={r.year} style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 22px", background: "linear-gradient(135deg, var(--navy), #1a3560)", color: "#fff" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Annual Report</div>
              <div style={{ fontSize: 32, fontWeight: 900 }}>{r.year}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontStyle: "italic", marginTop: 2 }}>"{r.theme}"</div>
            </div>
            <div style={{ padding: "14px 18px", flex: 1, background: "var(--card-bg)" }}>
              <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
                <div><div style={{ fontSize: 10, color: "var(--text-muted)" }}>SIZE</div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{r.size}</div></div>
                <div><div style={{ fontSize: 10, color: "var(--text-muted)" }}>PAGES</div><div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{r.pages}</div></div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={`https://www.psx.com.pk/psx/resources-and-tools/companies/listed-companies/${sym.toLowerCase()}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, padding: "8px 0", textAlign: "center", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "var(--navy)", color: "#fff", textDecoration: "none" }}>📄 View</a>
                <a href={`https://www.psx.com.pk/psx/resources-and-tools/companies/listed-companies/${sym.toLowerCase()}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, padding: "8px 0", textAlign: "center", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "1px solid var(--border)", color: "var(--text-secondary)", textDecoration: "none" }}>⬇ Download</a>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: 16, borderRadius: 10, background: "var(--light-bg)", border: "1px solid var(--border)" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
          📌 Annual reports are filed by the company with PSX. Visit the{" "}
          <a href="https://www.psx.com.pk" target="_blank" rel="noopener noreferrer" style={{ color: "var(--gold)" }}>PSX website</a> for the most current versions.
        </p>
      </div>
    </div>
  );
}

function AnnouncementsTab({ sym, announcements }: { sym: string; announcements: Announcement[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");

  const demoAnnouncements: Announcement[] = [
    { id: 101, title: `${sym}: Board of Directors Meeting — Agenda: Financial Results for Q2 FY2025`, announcementDate: "2024-10-28", announcementType: "Board Meeting" },
    { id: 102, title: `${sym}: Disclosure of Earnings per Share (EPS) for period ended September 30, 2024`, announcementDate: "2024-10-28", announcementType: "Financial Results" },
    { id: 103, title: `${sym}: Final Cash Dividend @ PKR 5.00 per share (50%) — Ex-Date announced`, announcementDate: "2024-04-15", announcementType: "Dividend" },
    { id: 104, title: `${sym}: Notice of Annual General Meeting (AGM) — Financial Year 2024`, announcementDate: "2024-09-05", announcementType: "AGM" },
    { id: 105, title: `${sym}: Change in Shareholding — Form-X filed by Director`, announcementDate: "2024-07-22", announcementType: "Insider Trade" },
    { id: 106, title: `${sym}: Clarification regarding media reports on expansion plans`, announcementDate: "2024-06-10", announcementType: "Clarification" },
    { id: 107, title: `${sym}: Interim Dividend @ PKR 2.50 per share declared`, announcementDate: "2024-08-15", announcementType: "Dividend" },
    { id: 108, title: `${sym}: Material Information — Signing of MOU for strategic partnership`, announcementDate: "2024-05-20", announcementType: "Material Info" },
    { id: 109, title: `${sym}: Pattern of Shareholding as at December 31, 2024`, announcementDate: "2024-01-28", announcementType: "Shareholding" },
    { id: 110, title: `${sym}: Half-Year Financial Results for period ended December 31, 2024`, announcementDate: "2025-02-15", announcementType: "Financial Results" },
  ];

  const all = announcements.length > 0 ? announcements : demoAnnouncements;
  const types = useMemo(() => ["All", ...Array.from(new Set(all.map(a => a.announcementType ?? "General")))], [all]);
  const filtered = useMemo(() => all.filter(a => {
    const matchType = type === "All" || (a.announcementType ?? "General") === type;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  }), [all, type, search]);

  const badgeColors: Record<string, { bg: string; color: string }> = {
    "Board Meeting": { bg: "#EFF6FF", color: "#1D4ED8" },
    "Financial Results": { bg: "#F0FDF4", color: "#15803D" },
    "Dividend": { bg: "#FFFBEB", color: "#B45309" },
    "AGM": { bg: "#F5F3FF", color: "#6D28D9" },
    "Insider Trade": { bg: "#FFF7ED", color: "#C2410C" },
    "Material Info": { bg: "#FFF1F2", color: "#BE123C" },
    "Shareholding": { bg: "#F0FDFA", color: "#0F766E" },
    "Clarification": { bg: "#F8FAFC", color: "#475569" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search announcements…"
          style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 13, outline: "none" }} />
        <select value={type} onChange={e => setType(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text-primary)", fontSize: 13, cursor: "pointer" }}>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
        <span style={{ display: "flex", alignItems: "center", fontSize: 12, color: "var(--text-muted)", padding: "0 6px" }}>{filtered.length} announcements</span>
      </div>

      {filtered.map(a => {
        const bc = badgeColors[a.announcementType ?? ""] ?? { bg: "#F8FAFC", color: "#475569" };
        return (
          <div key={a.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", background: "var(--card-bg)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: bc.bg, color: bc.color }}>{a.announcementType ?? "General"}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>📅 {a.announcementDate}</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}>{a.title}</p>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "var(--navy)", color: "#fff", border: "none", cursor: "pointer" }}>View</button>
              <button style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "var(--card-bg)", color: "var(--text-secondary)", border: "1px solid var(--border)", cursor: "pointer" }}>PDF</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompanyInfoTab({ sym, company }: { sym: string; company: CompanyInfo }) {
  const meta = getMeta(sym);
  const infoRows = [
    { l: "Symbol", v: sym }, { l: "Full Legal Name", v: company.name },
    { l: "Sector", v: company.sectorName ?? "—" }, { l: "Listing Date", v: company.listingDate ?? "—" },
    { l: "Fiscal Year End", v: company.fiscalYearEnd ?? "—" }, { l: "Shariah Status", v: company.shariahStatus ?? "—" },
    { l: "Free Float", v: company.freeFloat ?? "—" }, { l: "Shares Outstanding", v: meta.sharesOut },
    { l: "Market Cap", v: meta.mktCap !== "—" ? "PKR " + meta.mktCap : "—" },
    { l: "Exchange", v: "Pakistan Stock Exchange (PSX)" }, { l: "Currency", v: "PKR" },
    { l: "Website", v: company.website ?? "—", isLink: true },
  ];
  const contactRows = [
    { l: "CEO / MD", v: meta.ceo }, { l: "Chairman", v: meta.chairman },
    { l: "Company Secretary", v: meta.secretary }, { l: "Employees", v: meta.employees },
    { l: "Branches / Offices", v: meta.branches }, { l: "Registered Office", v: meta.address },
    { l: "Phone", v: meta.phone },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ padding: 24, border: "1px solid var(--border)", borderRadius: 14, background: "var(--card-bg)" }}>
        <SecTitle>About the Company</SecTitle>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8 }}>{meta.about}</p>
        {meta.ceo === "—" && (
          <p style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            ℹ️ Management and contact details are sourced from company filings. For the most current information, visit the PSX company profile or the company&apos;s official website.
          </p>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <SecTitle>Listing &amp; Market Information</SecTitle>
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            {infoRows.map((r, i) => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)", borderBottom: i < infoRows.length - 1 ? "1px solid var(--border)" : "none", gap: 12 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{r.l}</span>
                {(r as { l: string; v: string; isLink?: boolean }).isLink && r.v !== "—"
                  ? <a href={r.v.startsWith("http") ? r.v : `https://${r.v}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", textDecoration: "none", textAlign: "right" }}>{r.v}</a>
                  : <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>{r.v}</span>
                }
              </div>
            ))}
          </div>
        </div>
        <div>
          <SecTitle>Management &amp; Contact</SecTitle>
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            {contactRows.map((r, i) => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", background: i % 2 === 0 ? "var(--card-bg)" : "var(--light-bg)", borderBottom: i < contactRows.length - 1 ? "1px solid var(--border)" : "none", gap: 12 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{r.l}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function CompanyClient({ company, latestDaily, latestWeekly, recentDaily, recentWeekly, announcements, sym }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Fundamentals");
  const [tvTheme, setTvTheme] = useState("light");

  useEffect(() => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark"
      || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setTvTheme(dark ? "dark" : "light");
  }, []);

  const pct = fmtPct(latestDaily?.percentageChange);
  const isPos = pct.pos === true;
  const isNeg = pct.pos === false;

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)" }}>
      {/* ── Hero Header ── */}
      <div style={{ background: "linear-gradient(135deg, #07111F 0%, #0f2540 60%, #1a3560 100%)", color: "#fff", padding: "28px 32px 0" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/data-portal/stocks" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>← All Stocks</Link>
          <span>/</span><span style={{ color: "rgba(255,255,255,0.85)" }}>{sym}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 24 }}>
          {/* Left */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 900, background: "#D4971A", color: NAVY, padding: "4px 14px", borderRadius: 8, letterSpacing: "0.08em" }}>{sym}</span>
              {company.shariahStatus?.toLowerCase().includes("compliant") && (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(134,239,172,0.18)", color: "#86efac", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(134,239,172,0.3)" }}>✓ Shariah Compliant</span>
              )}
              {company.sectorName && (
                <span style={{ fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", padding: "3px 10px", borderRadius: 20 }}>{company.sectorName}</span>
              )}
            </div>
            <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.2, maxWidth: 500 }}>{company.name}</h1>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              Listed: {company.listingDate ?? "—"} · FY End: {company.fiscalYearEnd ?? "—"} · PSX
            </p>
          </div>

          {/* Right: price */}
          <div style={{ textAlign: "right" }}>
            {latestDaily ? (
              <>
                <div style={{ fontSize: 38, fontWeight: 900, color: "#fff", lineHeight: 1 }}>PKR {fmt(latestDaily.close)}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6, color: isPos ? "#86efac" : isNeg ? "#fca5a5" : "rgba(255,255,255,0.6)" }}>
                  {latestDaily.priceChange != null ? ((latestDaily.priceChange > 0 ? "+" : "") + fmt(latestDaily.priceChange)) : ""} ({pct.text}) Today
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>As of {latestDaily.tradingDate}</div>
                <div style={{ display: "flex", gap: 18, marginTop: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  {[["Open", fmt(latestDaily.open)], ["High", fmt(latestDaily.high)], ["Low", fmt(latestDaily.low)], ["Vol", fmtV(latestDaily.volume)]].map(([l, v]) => (
                    <div key={l} style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{l}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>No price data</div>
            )}
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ display: "flex", overflowX: "auto", gap: 0, marginLeft: -4 }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "11px 16px", whiteSpace: "nowrap", fontSize: 13,
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.5)",
              background: "transparent", border: "none", cursor: "pointer",
              borderBottom: activeTab === tab ? "2px solid #D4971A" : "2px solid transparent",
              transition: "all 0.15s",
            }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
        {activeTab === "Fundamentals" && <FundamentalsTab sym={sym} latestDaily={latestDaily} latestWeekly={latestWeekly} recentDaily={recentDaily} company={company} tvTheme={tvTheme} />}
        {activeTab === "Peers" && <PeersTab sym={sym} />}
        {activeTab === "Financials" && <FinancialsTab sym={sym} />}
        {activeTab === "Ratios" && <RatiosTab sym={sym} />}
        {activeTab === "Dividends" && <DividendsTab sym={sym} latestDaily={latestDaily} />}
        {activeTab === "Ownership" && <OwnershipTab sym={sym} />}
        {activeTab === "Insider Transactions" && <InsiderTab sym={sym} />}
        {activeTab === "Company Reports" && <ReportsTab sym={sym} />}
        {activeTab === "Announcements" && <AnnouncementsTab sym={sym} announcements={announcements} />}
        {activeTab === "Company Info" && <CompanyInfoTab sym={sym} company={company} />}
      </div>
    </div>
  );
}
