"use client";
import { useState, useEffect, useCallback, useRef, useId, memo } from "react";
import { fmtNum, fmtVol, getMarketStatus } from "../_data";
import { fetchMarketSummary } from "@/lib/market-cache";
import SectorPanel from "./SectorPanel";
import MarketPerformers from "./MarketPerformers";
import type { MarketSummary } from "@/lib/market-data";

/* ── Index code normalisation ──────────────────────────────────────────── */
const CODE_MAP: Record<string, string> = {
  KSE100: "KSE-100", "KSE-100": "KSE-100", "KSE100PR": "KSE-100",
  KSE30: "KSE-30",   "KSE-30":  "KSE-30",
  ALLSHR: "KSE ALL", "KSE ALL": "KSE ALL",
  KMI30: "KMI-30",   "KMI-30":  "KMI-30",
  KMIALLSHR: "KMI ALL", "KMIALL": "KMI ALL", "KMI ALL": "KMI ALL",
};
const INDEX_ORDER = ["KSE-100", "KSE-30", "KSE ALL", "KMI-30", "KMI ALL"];

/* ── Extra indices (demo) ─────────────────────────────────────────────── */
const EXTRA_INDICES: IdxRow[] = [
  { code: "BKTI",      close: 31420.18, change: -88.40,  pct: -0.28, vol: 4_200_000  },
  { code: "NJBKTI",    close: 26847.55, change: 142.30,  pct:  0.53, vol: 1_800_000  },
  { code: "KSE-GOLD",  close:  8214.62, change:  31.10,  pct:  0.38, vol:   620_000  },
  { code: "OIL & GAS", close: 14382.90, change: -52.70,  pct: -0.37, vol: 9_100_000  },
  { code: "BANKING",   close: 19754.44, change: 210.80,  pct:  1.08, vol:14_200_000  },
  { code: "CEMENT",    close:  7824.15, change: -44.20,  pct: -0.56, vol: 5_600_000  },
  { code: "TECH",      close:  5612.38, change:  88.60,  pct:  1.60, vol: 3_400_000  },
  { code: "FERTILIZER",close:  6182.70, change: -18.90,  pct: -0.30, vol: 4_800_000  },
  { code: "POWER",     close:  3841.20, change:  24.50,  pct:  0.64, vol: 7_200_000  },
  { code: "AUTO",      close:  9274.85, change: 112.30,  pct:  1.22, vol: 2_100_000  },
  { code: "TEXTILE",   close:  4218.60, change: -31.50,  pct: -0.74, vol: 3_100_000  },
  { code: "PHARMA",    close:  3124.45, change:  44.80,  pct:  1.45, vol: 1_800_000  },
  { code: "CHEMICAL",  close:  2891.20, change:  18.90,  pct:  0.66, vol:   980_000  },
  { code: "FOOD",      close:  5472.30, change: -22.10,  pct: -0.40, vol: 2_400_000  },
  { code: "TELECOM",   close:  1842.75, change: -14.30,  pct: -0.77, vol: 6_300_000  },
];

/* ── Per-index stats ───────────────────────────────────────────────────── */
type Sector = { name: string; pct: number; color: string; companies: string[] };
type IndexStats = {
  fullName: string;
  high: number; low: number; prevClose: number; vol: string;
  wk52High: number; wk52Low: number; pe: number; divYield: number; mktCap: string;
  ret1D: number; ret1W: number; ret1M: number; ret3M: number; ret1Y: number; retYTD: number;
  sectors: Sector[];
  description: string;
};

const INDEX_STATS: Record<string, IndexStats> = {
  "KSE-100": {
    fullName: "Karachi Stock Exchange KSE-100 Index",
    high: 180960.09, low: 179159.49, prevClose: 179236.34, vol: "312.5M",
    wk52High: 191033, wk52Low: 144119, pe: 9.89, divYield: 5.71, mktCap: "5T",
    ret1D: -0.41, ret1W: 0.01, ret1M: 0.50, ret3M: 3.48, ret1Y: 19.08, retYTD: 0.35,
    description: "The Current KSE100 Index consists of 100 companies selected on the basis of sector representation and highest market capitalisation. In 52 Weeks KSE100 has touched a high of 191,033 and a low of 144,119. Market Cap is 5T with P/E Ratio of 9.89 and Dividend Yield of 5.7.",
    sectors: [
      { name: "Commercial Banks", pct: 28.4, color: "#15803d", companies: ["HBL","MCB","UBL","MEBL","BAHL"] },
      { name: "Oil & Gas",        pct: 17.2, color: "#1d4ed8", companies: ["PPL","OGDC","MARI"] },
      { name: "Fertilizer",       pct:  9.8, color: "#7c3aed", companies: ["FFC","ENGRO"] },
      { name: "Cement",           pct:  7.6, color: "#b45309", companies: ["LUCK","CHCC"] },
      { name: "Technology",       pct:  6.1, color: "#0e7490", companies: ["SYS","TRG"] },
      { name: "Power",            pct:  5.3, color: "#b91c1c", companies: ["HUBC"] },
      { name: "Others",           pct: 25.6, color: "#475569", companies: [] },
    ],
  },
  "KSE-30": {
    fullName: "Karachi Stock Exchange KSE-30 Index",
    high: 74950, low: 74200, prevClose: 75028, vol: "198.2M",
    wk52High: 82410, wk52Low: 60180, pe: 8.42, divYield: 6.14, mktCap: "3.2T",
    ret1D: -0.29, ret1W: -0.12, ret1M: 0.88, ret3M: 4.12, ret1Y: 22.40, retYTD: 1.20,
    description: "The KSE-30 Index consists of the top 30 companies by free-float market capitalisation on the PSX. It represents the most liquid and actively traded stocks with P/E of 8.42 and Market Cap of 3.2T.",
    sectors: [
      { name: "Commercial Banks", pct: 32.1, color: "#15803d", companies: ["HBL","MCB","UBL","MEBL","BAHL"] },
      { name: "Oil & Gas",        pct: 19.4, color: "#1d4ed8", companies: ["PPL","OGDC","MARI"] },
      { name: "Fertilizer",       pct: 11.2, color: "#7c3aed", companies: ["FFC","ENGRO"] },
      { name: "Cement",           pct:  8.1, color: "#b45309", companies: ["LUCK"] },
      { name: "Others",           pct: 29.2, color: "#475569", companies: [] },
    ],
  },
  "KSE ALL": {
    fullName: "Karachi Stock Exchange All-Share Index",
    high: 125800, low: 124500, prevClose: 124827, vol: "285.6M",
    wk52High: 131240, wk52Low: 98540, pe: 10.12, divYield: 4.88, mktCap: "8.1T",
    ret1D: 0.41, ret1W: 0.23, ret1M: 1.12, ret3M: 5.20, ret1Y: 24.15, retYTD: 2.10,
    description: "The KSE All-Share Index tracks all companies listed on the Pakistan Stock Exchange, providing a comprehensive measure of overall market performance with P/E of 10.12 and Market Cap of 8.1T.",
    sectors: [
      { name: "Commercial Banks", pct: 24.8, color: "#15803d", companies: ["HBL","MCB","UBL"] },
      { name: "Oil & Gas",        pct: 15.6, color: "#1d4ed8", companies: ["PPL","OGDC"] },
      { name: "Textile",          pct: 10.4, color: "#b45309", companies: ["NML","KTML"] },
      { name: "Cement",           pct:  7.2, color: "#7c3aed", companies: ["LUCK"] },
      { name: "Others",           pct: 42.0, color: "#475569", companies: [] },
    ],
  },
  "KMI-30": {
    fullName: "KSE-Meezan Index KMI-30",
    high: 86100, low: 85200, prevClose: 85282, vol: "142.3M",
    wk52High: 94200, wk52Low: 68400, pe: 11.24, divYield: 4.22, mktCap: "2.8T",
    ret1D: 0.40, ret1W: 0.18, ret1M: 0.95, ret3M: 3.80, ret1Y: 17.90, retYTD: 0.88,
    description: "The KMI-30 (Karachi Meezan Index) tracks the top 30 Shariah-compliant companies on the PSX. It represents Shariah-compliant equity market performance with P/E of 11.24 and Market Cap of 2.8T.",
    sectors: [
      { name: "Oil & Gas",  pct: 26.4, color: "#1d4ed8", companies: ["OGDC","MARI","PPL"] },
      { name: "Fertilizer", pct: 18.8, color: "#7c3aed", companies: ["FFC","ENGRO"] },
      { name: "Cement",     pct: 14.2, color: "#b45309", companies: ["LUCK","CHCC"] },
      { name: "Technology", pct:  9.6, color: "#0e7490", companies: ["SYS"] },
      { name: "Others",     pct: 31.0, color: "#475569", companies: [] },
    ],
  },
  "KMI ALL": {
    fullName: "KSE-Meezan All-Share Index",
    high: 65200, low: 64600, prevClose: 64520, vol: "105.7M",
    wk52High: 71800, wk52Low: 51200, pe: 10.88, divYield: 4.55, mktCap: "4.5T",
    ret1D: 0.62, ret1W: 0.35, ret1M: 1.44, ret3M: 4.90, ret1Y: 21.30, retYTD: 1.65,
    description: "The KMI All-Share Index covers all Shariah-compliant stocks listed on the PSX, representing the complete Shariah-compliant equity universe with P/E of 10.88 and Market Cap of 4.5T.",
    sectors: [
      { name: "Oil & Gas",  pct: 22.0, color: "#1d4ed8", companies: ["OGDC","PPL"] },
      { name: "Fertilizer", pct: 16.4, color: "#7c3aed", companies: ["FFC"] },
      { name: "Cement",     pct: 11.8, color: "#b45309", companies: ["LUCK"] },
      { name: "Technology", pct:  8.4, color: "#0e7490", companies: ["SYS"] },
      { name: "Others",     pct: 41.4, color: "#475569", companies: [] },
    ],
  },
  /* ── Sector / thematic indices — tiles = constituent companies by volume ── */
  "BANKING": {
    fullName: "PSX Banking Sector Index",
    high: 19980, low: 19540, prevClose: 19543, vol: "14.2M",
    wk52High: 21400, wk52Low: 14800, pe: 6.12, divYield: 8.42, mktCap: "1.8T",
    ret1D: 1.08, ret1W: 2.14, ret1M: 3.80, ret3M: 9.40, ret1Y: 28.50, retYTD: 4.20,
    description: "Tracks all commercial banks listed on the PSX. Dominated by the Big-5 (HBL, MCB, UBL, MEBL, BAHL) which together account for over 60% of sector market cap.",
    sectors: [
      { name: "HBL",   pct: 21.8, color: "#15803d", companies: ["Habib Bank Ltd"] },
      { name: "MCB",   pct: 18.2, color: "#166534", companies: ["MCB Bank Ltd"] },
      { name: "UBL",   pct: 15.6, color: "#1d4ed8", companies: ["United Bank Ltd"] },
      { name: "MEBL",  pct: 12.4, color: "#1e40af", companies: ["Meezan Bank Ltd"] },
      { name: "BAHL",  pct:  9.8, color: "#7c3aed", companies: ["Bank Al Habib Ltd"] },
      { name: "ABL",   pct:  8.1, color: "#6d28d9", companies: ["Allied Bank Ltd"] },
      { name: "BAFL",  pct:  6.9, color: "#b45309", companies: ["Bank Alfalah Ltd"] },
      { name: "NBP",   pct:  4.2, color: "#92400e", companies: ["National Bank"] },
      { name: "BOP",   pct:  3.0, color: "#475569", companies: ["Bank of Punjab"] },
    ],
  },
  "OIL & GAS": {
    fullName: "PSX Oil & Gas Sector Index",
    high: 14620, low: 14280, prevClose: 14435, vol: "9.1M",
    wk52High: 16200, wk52Low: 11400, pe: 7.24, divYield: 9.10, mktCap: "2.1T",
    ret1D: -0.37, ret1W: -1.20, ret1M: 2.40, ret3M: 6.80, ret1Y: 22.10, retYTD: 1.85,
    description: "Covers exploration, production and marketing companies in Pakistan's oil & gas sector. OGDC and PPL together represent nearly half of total sector market cap.",
    sectors: [
      { name: "OGDC",    pct: 27.8, color: "#1d4ed8", companies: ["Oil & Gas Dev. Co."] },
      { name: "PPL",     pct: 22.4, color: "#1e40af", companies: ["Pakistan Petroleum"] },
      { name: "MARI",    pct: 18.6, color: "#0e7490", companies: ["Mari Petroleum"] },
      { name: "PSO",     pct: 16.2, color: "#0c4a6e", companies: ["Pakistan State Oil"] },
      { name: "APL",     pct:  9.4, color: "#7c3aed", companies: ["Attock Petroleum"] },
      { name: "HASCOL",  pct:  5.6, color: "#475569", companies: ["Hascol Petroleum"] },
    ],
  },
  "CEMENT": {
    fullName: "PSX Cement Sector Index",
    high: 7940, low: 7710, prevClose: 7868, vol: "5.6M",
    wk52High: 9120, wk52Low: 6180, pe: 11.48, divYield: 3.20, mktCap: "620B",
    ret1D: -0.56, ret1W: -1.80, ret1M: 1.10, ret3M: 4.20, ret1Y: 15.40, retYTD: -0.80,
    description: "Tracks all cement manufacturers listed on the PSX. Lucky Cement is the largest by market cap, followed by Cherat Cement and Maple Leaf Cement Factory.",
    sectors: [
      { name: "LUCK",  pct: 30.4, color: "#b45309", companies: ["Lucky Cement"] },
      { name: "CHCC",  pct: 17.8, color: "#92400e", companies: ["Cherat Cement"] },
      { name: "MLCF",  pct: 14.2, color: "#7c3aed", companies: ["Maple Leaf Cement"] },
      { name: "DGKC",  pct: 12.6, color: "#6d28d9", companies: ["D.G. Khan Cement"] },
      { name: "PIOC",  pct:  9.8, color: "#15803d", companies: ["Pioneer Cement"] },
      { name: "ACPL",  pct:  8.6, color: "#047857", companies: ["Attock Cement"] },
      { name: "BWCL",  pct:  6.6, color: "#475569", companies: ["Bestway Cement"] },
    ],
  },
  "TECH": {
    fullName: "PSX Technology & Communication Sector Index",
    high: 5720, low: 5558, prevClose: 5523, vol: "3.4M",
    wk52High: 6480, wk52Low: 3840, pe: 18.24, divYield: 2.10, mktCap: "380B",
    ret1D: 1.60, ret1W: 3.40, ret1M: 6.80, ret3M: 14.20, ret1Y: 42.80, retYTD: 8.50,
    description: "Tracks technology and communication companies on the PSX. Systems Limited dominates with the largest market cap, followed by TRG Pakistan and NetSol Technologies.",
    sectors: [
      { name: "SYS",     pct: 42.4, color: "#0e7490", companies: ["Systems Ltd"] },
      { name: "TRG",     pct: 28.2, color: "#0369a1", companies: ["TRG Pakistan"] },
      { name: "NETSOL",  pct: 14.8, color: "#1d4ed8", companies: ["NetSol Technologies"] },
      { name: "PICT",    pct: 10.2, color: "#7c3aed", companies: ["Pak Intl Container"] },
      { name: "WTL",     pct:  4.4, color: "#475569", companies: ["WorldCall Telecom"] },
    ],
  },
  "FERTILIZER": {
    fullName: "PSX Fertilizer Sector Index",
    high: 6280, low: 6140, prevClose: 6201, vol: "4.8M",
    wk52High: 7200, wk52Low: 4980, pe: 8.60, divYield: 11.20, mktCap: "720B",
    ret1D: -0.30, ret1W: 0.80, ret1M: 2.20, ret3M: 7.60, ret1Y: 18.90, retYTD: 2.40,
    description: "Covers urea and phosphate fertilizer producers listed on the PSX. Fauji Fertilizer and Engro Fertilizers dominate with over 70% combined market share.",
    sectors: [
      { name: "FFC",    pct: 38.2, color: "#7c3aed", companies: ["Fauji Fertilizer Co."] },
      { name: "ENGRO",  pct: 31.8, color: "#6d28d9", companies: ["Engro Fertilizers"] },
      { name: "EFERT",  pct: 18.4, color: "#15803d", companies: ["Engro Fertilizers Plc"] },
      { name: "FATIMA", pct: 11.6, color: "#047857", companies: ["Fatima Fertilizer"] },
    ],
  },
  "POWER": {
    fullName: "PSX Power Generation & Distribution Sector Index",
    high: 3900, low: 3810, prevClose: 3816, vol: "7.2M",
    wk52High: 4280, wk52Low: 2940, pe: 7.82, divYield: 7.80, mktCap: "540B",
    ret1D: 0.64, ret1W: 1.42, ret1M: 3.20, ret3M: 8.10, ret1Y: 24.60, retYTD: 3.80,
    description: "Tracks power generation and distribution companies on the PSX. Hub Power Company is the largest IPP, complemented by KAPCO, NCPL and other independent power producers.",
    sectors: [
      { name: "HUBC",   pct: 27.6, color: "#b91c1c", companies: ["Hub Power Co."] },
      { name: "KAPCO",  pct: 17.8, color: "#dc2626", companies: ["Kot Addu Power Co."] },
      { name: "KEL",    pct: 16.4, color: "#b45309", companies: ["K-Electric Ltd"] },
      { name: "NCPL",   pct: 14.2, color: "#92400e", companies: ["Nishat Chunian Power"] },
      { name: "NPL",    pct: 12.6, color: "#7c3aed", companies: ["Nishat Power Ltd"] },
      { name: "LSPM",   pct: 11.4, color: "#475569", companies: ["Lalpir Power Ltd"] },
    ],
  },
  "AUTO": {
    fullName: "PSX Automobile Assembler Sector Index",
    high: 9420, low: 9180, prevClose: 9162, vol: "2.1M",
    wk52High: 10840, wk52Low: 6920, pe: 14.62, divYield: 2.80, mktCap: "410B",
    ret1D: 1.22, ret1W: 2.80, ret1M: 5.40, ret3M: 12.60, ret1Y: 34.20, retYTD: 6.10,
    description: "Tracks automobile assembler companies on the PSX including passenger cars, commercial vehicles and motorcycles. Pak Suzuki, Honda Atlas and Indus Motor are the major players.",
    sectors: [
      { name: "PSMC",  pct: 29.8, color: "#1d4ed8", companies: ["Pak Suzuki Motor"] },
      { name: "HCAR",  pct: 24.6, color: "#1e40af", companies: ["Honda Atlas Cars"] },
      { name: "INDU",  pct: 20.4, color: "#0e7490", companies: ["Indus Motor Co."] },
      { name: "MTL",   pct: 14.8, color: "#15803d", companies: ["Millat Tractors"] },
      { name: "ATLH",  pct: 10.4, color: "#475569", companies: ["Atlas Honda Ltd"] },
    ],
  },
  "TEXTILE": {
    fullName: "PSX Textile Composite Sector Index",
    high: 4280, low: 4180, prevClose: 4250, vol: "3.1M",
    wk52High: 4940, wk52Low: 3280, pe: 9.14, divYield: 4.40, mktCap: "280B",
    ret1D: -0.74, ret1W: -2.10, ret1M: 0.40, ret3M: 2.80, ret1Y: 12.40, retYTD: -1.20,
    description: "Covers integrated textile composite companies on the PSX engaged in yarn, fabric and garment production for domestic and export markets.",
    sectors: [
      { name: "NML",   pct: 24.8, color: "#b45309", companies: ["Nishat Mills"] },
      { name: "KTML",  pct: 17.6, color: "#92400e", companies: ["Kohinoor Textile"] },
      { name: "NCL",   pct: 14.4, color: "#7c3aed", companies: ["Nishat Chunian Ltd"] },
      { name: "GATM",  pct: 12.2, color: "#6d28d9", companies: ["Gul Ahmed Textile"] },
      { name: "ILP",   pct: 10.8, color: "#15803d", companies: ["Interloop Ltd"] },
      { name: "ADMM",  pct:  9.8, color: "#047857", companies: ["Adamjee Insurance"] },
      { name: "TGL",   pct: 10.4, color: "#475569", companies: ["Treet Corporation"] },
    ],
  },
  "PHARMA": {
    fullName: "PSX Pharmaceutical Sector Index",
    high: 3180, low: 3090, prevClose: 3079, vol: "1.8M",
    wk52High: 3640, wk52Low: 2480, pe: 16.84, divYield: 2.40, mktCap: "210B",
    ret1D: 1.45, ret1W: 2.90, ret1M: 5.80, ret3M: 13.40, ret1Y: 38.10, retYTD: 7.20,
    description: "Tracks pharmaceutical manufacturers listed on the PSX. Searle Pakistan and GlaxoSmithKline are the largest pharma companies by market cap.",
    sectors: [
      { name: "SEARL",  pct: 32.4, color: "#0e7490", companies: ["Searle Pakistan"] },
      { name: "GLAXO",  pct: 23.6, color: "#0369a1", companies: ["GlaxoSmithKline"] },
      { name: "ABOT",   pct: 19.8, color: "#1d4ed8", companies: ["Abbott Laboratories"] },
      { name: "HINOON", pct: 14.2, color: "#7c3aed", companies: ["Hi-Noon Laboratories"] },
      { name: "FEROZ",  pct: 10.0, color: "#475569", companies: ["Ferozsons Laboratories"] },
    ],
  },
  "CHEMICAL": {
    fullName: "PSX Chemical Sector Index",
    high: 2940, low: 2868, prevClose: 2872, vol: "980K",
    wk52High: 3380, wk52Low: 2180, pe: 12.40, divYield: 3.60, mktCap: "185B",
    ret1D: 0.66, ret1W: 1.40, ret1M: 3.00, ret3M: 7.20, ret1Y: 20.80, retYTD: 3.10,
    description: "Covers chemical manufacturers listed on the PSX including ICI Pakistan, Lotte Chemical and SITC — spanning industrial chemicals, soda ash, caustic soda and specialty products.",
    sectors: [
      { name: "ICI",      pct: 44.8, color: "#1d4ed8", companies: ["ICI Pakistan Ltd"] },
      { name: "LOTCHEM",  pct: 30.4, color: "#1e40af", companies: ["Lotte Chemical"] },
      { name: "SITC",     pct: 24.8, color: "#475569", companies: ["SITC Industries"] },
    ],
  },
  "FOOD": {
    fullName: "PSX Food & Personal Care Sector Index",
    high: 5560, low: 5420, prevClose: 5494, vol: "2.4M",
    wk52High: 6240, wk52Low: 4280, pe: 22.80, divYield: 1.80, mktCap: "320B",
    ret1D: -0.40, ret1W: 0.60, ret1M: 2.10, ret3M: 5.80, ret1Y: 16.20, retYTD: 1.40,
    description: "Tracks food, beverage and personal care companies on the PSX. Nestlé Pakistan and Colgate-Palmolive are the premium consumer staple plays with strong brand moats.",
    sectors: [
      { name: "NESTLE",  pct: 39.6, color: "#b45309", companies: ["Nestlé Pakistan"] },
      { name: "COLG",    pct: 24.8, color: "#92400e", companies: ["Colgate-Palmolive"] },
      { name: "UNITY",   pct: 19.8, color: "#7c3aed", companies: ["Unity Foods Ltd"] },
      { name: "SHFA",    pct: 15.8, color: "#475569", companies: ["Shezan International"] },
    ],
  },
  "TELECOM": {
    fullName: "PSX Telecom Sector Index",
    high: 1874, low: 1826, prevClose: 1857, vol: "6.3M",
    wk52High: 2140, wk52Low: 1420, pe: 15.60, divYield: 3.20, mktCap: "145B",
    ret1D: -0.77, ret1W: -1.60, ret1M: 0.80, ret3M: 3.40, ret1Y: 11.80, retYTD: -0.60,
    description: "Covers telecom operators and infrastructure companies listed on the PSX. PTCL is the dominant player with majority government ownership, followed by WorldCall Telecom.",
    sectors: [
      { name: "PTCL",  pct: 54.8, color: "#0e7490", companies: ["Pakistan Telecom Co."] },
      { name: "WTL",   pct: 25.6, color: "#0369a1", companies: ["WorldCall Telecom"] },
      { name: "TELE",  pct: 19.6, color: "#475569", companies: ["Telecard Ltd"] },
    ],
  },
  "BKTI": {
    fullName: "Islamic Banking Tracking Index",
    high: 31620, low: 31280, prevClose: 31508, vol: "4.2M",
    wk52High: 34800, wk52Low: 24200, pe: 7.80, divYield: 6.40, mktCap: "920B",
    ret1D: -0.28, ret1W: 0.42, ret1M: 1.80, ret3M: 5.40, ret1Y: 21.40, retYTD: 2.60,
    description: "Tracks Shariah-compliant Islamic banking institutions listed on the PSX. Meezan Bank is the flagship Islamic bank and holds the largest weight in this index.",
    sectors: [
      { name: "MEBL",   pct: 34.8, color: "#15803d", companies: ["Meezan Bank Ltd"] },
      { name: "BAHL",   pct: 29.6, color: "#166534", companies: ["Bank Al Habib Ltd"] },
      { name: "BIPL",   pct: 20.4, color: "#1d4ed8", companies: ["BankIslami Pakistan"] },
      { name: "SILKB",  pct: 15.2, color: "#475569", companies: ["Silk Bank Ltd"] },
    ],
  },
  "NJBKTI": {
    fullName: "Non-Islamic Banking Tracking Index",
    high: 27040, low: 26710, prevClose: 26705, vol: "1.8M",
    wk52High: 29800, wk52Low: 20600, pe: 5.62, divYield: 9.80, mktCap: "880B",
    ret1D: 0.53, ret1W: 1.20, ret1M: 2.80, ret3M: 7.20, ret1Y: 26.40, retYTD: 3.60,
    description: "Tracks conventional (non-Islamic) banking institutions listed on the PSX. HBL, MCB and UBL collectively account for the majority of this index's weight.",
    sectors: [
      { name: "HBL",  pct: 28.4, color: "#15803d", companies: ["Habib Bank Ltd"] },
      { name: "MCB",  pct: 22.8, color: "#166534", companies: ["MCB Bank Ltd"] },
      { name: "UBL",  pct: 18.4, color: "#1d4ed8", companies: ["United Bank Ltd"] },
      { name: "ABL",  pct: 14.2, color: "#1e40af", companies: ["Allied Bank Ltd"] },
      { name: "NBP",  pct: 10.0, color: "#7c3aed", companies: ["National Bank"] },
      { name: "BOP",  pct:  6.2, color: "#475569", companies: ["Bank of Punjab"] },
    ],
  },
  "KSE-GOLD": {
    fullName: "KSE Gold Index",
    high: 8280, low: 8180, prevClose: 8183, vol: "620K",
    wk52High: 9420, wk52Low: 6480, pe: 14.20, divYield: 1.40, mktCap: "82B",
    ret1D: 0.38, ret1W: 1.10, ret1M: 3.20, ret3M: 9.80, ret1Y: 31.20, retYTD: 5.40,
    description: "Tracks gold and precious metal related companies and instruments listed on the PSX. PMEX-linked gold instruments dominate this index.",
    sectors: [
      { name: "PMEX GOLD", pct: 60.4, color: "#D4971A", companies: ["PMEX Gold Contract"] },
      { name: "FCEPL",     pct: 24.8, color: "#b45309", companies: ["First Choice Energy"] },
      { name: "PSEL",      pct: 14.8, color: "#475569", companies: ["Pakistan Services Ltd"] },
    ],
  },
};

function getStats(code: string): IndexStats {
  return INDEX_STATS[code] ?? {
    fullName: code, high: 0, low: 0, prevClose: 0, vol: "—",
    wk52High: 0, wk52Low: 0, pe: 0, divYield: 0, mktCap: "—",
    ret1D: 0, ret1W: 0, ret1M: 0, ret3M: 0, ret1Y: 0, retYTD: 0,
    sectors: [], description: "",
  };
}

/* ── Top contributors per index ───────────────────────────────────────── */
const CONTRIBUTORS: Record<string, { sym: string; pts: number }[]> = {
  "KSE-100": [
    { sym: "ENGROH", pts: 117.96 }, { sym: "OGDC",    pts:  35.56 }, { sym: "SYS",     pts:  32.86 },
    { sym: "PIBTL",  pts:  16.53 }, { sym: "PSO",     pts:  16.46 }, { sym: "NESTLE",  pts:  13.38 },
    { sym: "LOTCHEM",pts:  12.78 }, { sym: "BAHL",    pts:  12.06 }, { sym: "GAL",     pts:  12.06 },
    { sym: "COLG",   pts:  11.27 },
    { sym: "BAFL",   pts: -43.70 }, { sym: "AKBL",    pts: -39.24 }, { sym: "FFC",     pts: -31.00 },
    { sym: "LUCK",   pts: -22.45 }, { sym: "CNERGY",  pts: -20.88 }, { sym: "HBL",     pts: -19.82 },
    { sym: "MCB",    pts: -18.45 }, { sym: "MEBL",    pts: -18.45 }, { sym: "BOP",     pts: -14.13 },
    { sym: "ATRL",   pts: -11.35 },
  ],
  "KSE-30": [
    { sym: "ENGROH", pts:  92.15 }, { sym: "SYS",     pts:  41.20 }, { sym: "OGDC",    pts:  28.55 },
    { sym: "PSO",    pts:  18.42 }, { sym: "NBP",     pts:  12.80 },
    { sym: "HBL",    pts: -55.10 }, { sym: "UBL",     pts: -32.67 }, { sym: "LUCK",    pts: -27.93 },
    { sym: "MCB",    pts: -22.15 }, { sym: "FFC",     pts: -18.90 },
  ],
  "KMI-30": [
    { sym: "ENGROH", pts: 101.45 }, { sym: "OGDC",    pts:  40.13 }, { sym: "SYS",     pts:  28.75 },
    { sym: "GAL",    pts:  14.22 }, { sym: "LUCK",    pts:   8.50 },
    { sym: "ITC",    pts: -60.12 }, { sym: "FFC",     pts: -28.33 }, { sym: "DGKC",    pts: -22.88 },
    { sym: "PSEL",   pts: -17.40 }, { sym: "MARI",    pts: -10.21 },
  ],
};
function getContributors(code: string) {
  return CONTRIBUTORS[code] ?? CONTRIBUTORS["KSE-100"];
}

/* ── Types ────────────────────────────────────────────────────────────── */
type IdxRow = { code: string; close: number; change: number; pct: number; vol: number };
type RawIdx = MarketSummary["indices"][number];

function normalize(raw: string) {
  const u = raw.trim().toUpperCase().replace(/\s+/g, "");
  return CODE_MAP[raw.trim()] ?? CODE_MAP[u] ?? raw.trim();
}
function toIdxRows(raw: RawIdx[]): IdxRow[] {
  const map = new Map<string, IdxRow>();
  for (const ix of raw) {
    const code  = normalize(String(ix.code ?? ""));
    const close = parseFloat(String(ix.close)) || 0;
    if (!code || close <= 0) continue;
    map.set(code, { code, close, change: parseFloat(String(ix.change)) || 0, pct: parseFloat(String(ix.pct)) || 0, vol: parseFloat(String(ix.vol)) || 0 });
  }
  const ordered = INDEX_ORDER.map(c => map.get(c)).filter(Boolean) as IdxRow[];
  return ordered.length > 0 ? ordered : [...map.values()].sort((a, b) => b.close - a.close).slice(0, 5);
}

/* ── Sparkline ─────────────────────────────────────────────────────────── */
function Sparkline({ up }: { up: boolean }) {
  const pts = up
    ? "0,18 10,14 20,15 30,10 40,12 50,7 60,9 72,3"
    : "0,3 10,7 20,5 30,10 40,8 50,13 60,11 72,17";
  const color = up ? "#16A34A" : "#DC2626";
  const uid = useId();
  const id = `sp${uid.replace(/:/g, "")}${up ? "u" : "d"}`;
  return (
    <svg viewBox="0 0 72 20" style={{ width: 72, height: 22 }} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0"   />
        </linearGradient>
      </defs>
      <polygon points={`${pts} 72,20 0,20`} fill={`url(#${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Market Overview Card (horizontal scrollable) ───────────────────── */
function OvCard({ idx, active, isOpen, onClick }: { idx: IdxRow; active: boolean; isOpen: boolean; onClick: () => void }) {
  const up    = idx.pct >= 0;
  const color = up ? "#16A34A" : "#DC2626";
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, width: 160, padding: "10px 12px", border: "none", cursor: "pointer",
      borderRight: "1px solid var(--border)", background: active ? (up ? "rgba(22,163,74,0.06)" : "rgba(220,38,38,0.06)") : "transparent",
      borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
      textAlign: "left", transition: "all 0.12s",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: active ? color : "var(--text-primary)", letterSpacing: "0.02em" }}>{idx.code}</span>
        {isOpen && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#16a34a" }} />}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>{fmtNum(idx.close, 2)}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>{up ? "▲" : "▼"} {Math.abs(idx.pct).toFixed(2)}%</span>
      </div>
      {idx.vol > 0 && <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 1 }}>Vol: {fmtVol(idx.vol)}</div>}
      <div style={{ marginTop: 4 }}><Sparkline up={up} /></div>
    </button>
  );
}

/* ── Sector Treemap SVG ─────────────────────────────────────────────────── */
function TreemapSVG({ sectors, activeCode }: { sectors: Sector[]; activeCode: string }) {
  const W = 340, H = 210;
  const total = sectors.reduce((a, s) => a + s.pct, 0) || 1;
  const sorted = [...sectors].sort((a, b) => b.pct - a.pct);

  // Split into 2 rows: top row gets first 3 (larger), bottom gets rest
  const row1 = sorted.slice(0, 3);
  const row2 = sorted.slice(3);
  const r1tot = row1.reduce((a, s) => a + s.pct, 0) || 1;
  const r2tot = row2.reduce((a, s) => a + s.pct, 0) || 1;
  const row1H = Math.round(H * (r1tot / total));
  const row2H = H - row1H;

  type Rect = { x: number; y: number; w: number; h: number; color: string; name: string; pct: number; companies: string[] };
  const rects: Rect[] = [];

  let x = 0;
  for (const s of row1) {
    const w = Math.round(W * (s.pct / r1tot));
    rects.push({ x, y: 0, w, h: row1H, color: s.color, name: s.name, pct: s.pct, companies: s.companies });
    x += w;
  }
  if (row2.length > 0) {
    x = 0;
    for (const s of row2) {
      const w = Math.round(W * (s.pct / r2tot));
      rects.push({ x, y: row1H, w, h: row2H, color: s.color, name: s.name, pct: s.pct, companies: s.companies });
      x += w;
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "8px 12px", background: "var(--light-bg)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Sector Breakdown</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#D4971A" }}>{activeCode}</span>
      </div>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: "block", flex: 1, minHeight: 180 }}>
        {rects.map((r, i) => (
          <g key={i}>
            <rect x={r.x + 0.5} y={r.y + 0.5} width={Math.max(0, r.w - 1)} height={Math.max(0, r.h - 1)} rx={2} fill={r.color} opacity={0.88} />
            {r.h > 18 && r.w > 30 && (
              <text x={r.x + r.w / 2} y={r.y + (r.companies.length ? 16 : r.h / 2 + 4)}
                textAnchor="middle" fontSize={Math.min(11, Math.max(7, r.w / 9))}
                fontWeight="800" fill="rgba(255,255,255,0.95)">
                {r.name.length > Math.floor(r.w / 7) ? r.name.slice(0, Math.floor(r.w / 7) - 1) + "…" : r.name}
              </text>
            )}
            {r.h > 28 && r.w > 30 && (
              <text x={r.x + r.w / 2} y={r.y + (r.companies.length ? 30 : r.h / 2 + 17)}
                textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.7)">
                {r.pct.toFixed(1)}%
              </text>
            )}
            {r.companies.length > 0 && r.h > 50 && r.w > 40 && (
              <text x={r.x + r.w / 2} y={r.y + r.h - 8}
                textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.6)">
                {r.companies.slice(0, Math.floor(r.w / 26)).join(" · ")}
              </text>
            )}
          </g>
        ))}
      </svg>
      {/* Legend */}
      <div style={{ padding: "8px 12px", display: "flex", flexWrap: "wrap", gap: "4px 10px", borderTop: "1px solid var(--border)", background: "var(--card-bg)", flexShrink: 0 }}>
        {sectors.slice(0, 6).map(s => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name} {s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Period data generator ─────────────────────────────────────────────── */
const PERIOD_CFG: Record<string, { bars: number; daysBack: number; volatility: number; labelEvery: number }> = {
  "1D":  { bars: 78,  daysBack: 1,    volatility: 0.0008, labelEvery: 13 },
  "1W":  { bars: 35,  daysBack: 7,    volatility: 0.002,  labelEvery: 5  },
  "1M":  { bars: 30,  daysBack: 30,   volatility: 0.004,  labelEvery: 4  },
  "6M":  { bars: 180, daysBack: 180,  volatility: 0.006,  labelEvery: 30 },
  "1Y":  { bars: 252, daysBack: 365,  volatility: 0.007,  labelEvery: 42 },
  "3Y":  { bars: 156, daysBack: 1095, volatility: 0.009,  labelEvery: 26 },
  "5Y":  { bars: 260, daysBack: 1825, volatility: 0.010,  labelEvery: 52 },
  "All": { bars: 300, daysBack: 3650, volatility: 0.011,  labelEvery: 50 },
};

function genPeriodData(code: string, baseVal: number, period: string): { pts: number[]; labels: string[] } {
  const cfg = PERIOD_CFG[period] ?? PERIOD_CFG["1M"];
  const seed = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + period.length * 31;
  let v = baseVal * 0.94;
  const pts: number[] = [];
  const labels: string[] = [];
  const now = new Date(2026, 8, 1);
  for (let i = 0; i < cfg.bars; i++) {
    const r = ((seed * (i + 7) * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    v += (r - 0.468) * baseVal * cfg.volatility;
    v = Math.max(baseVal * 0.80, Math.min(baseVal * 1.20, v));
    pts.push(v);
    if (i % cfg.labelEvery === 0) {
      const d = new Date(now.getTime() - (cfg.daysBack - (i / cfg.bars) * cfg.daysBack) * 86400000);
      labels[i] = period === "1D"
        ? `${String(9 + Math.floor((i / cfg.bars) * 6))}:${i % 2 === 0 ? "00" : "30"}`
        : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    } else {
      labels[i] = "";
    }
  }
  pts[pts.length - 1] = baseVal;
  return { pts, labels };
}

/* ── Points Chart (interactive canvas) ───────────────────────────────── */
function PointsChart({ code, baseVal, period }: { code: string; baseVal: number; period: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; val: number; label: string } | null>(null);

  const { pts: pointsArr, labels: dateLabelsArr } = genPeriodData(code, baseVal, period);
  const points = useRef<number[]>([]);
  const dateLabels = useRef<string[]>([]);
  points.current = pointsArr;
  dateLabels.current = dateLabelsArr;

  const draw = useCallback((hoverIdx: number | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const pts = points.current;
    const min = Math.min(...pts), max = Math.max(...pts);
    const range = max - min || 1;
    const px = 50, py = 14, pb = 24;
    const cw = W - px - 16, ch = H - py - pb;

    const xOf = (i: number) => px + (i / (pts.length - 1)) * cw;
    const yOf = (v: number) => py + (1 - (v - min) / range) * ch;

    const up = pts[pts.length - 1] >= pts[0];
    const lineColor = up ? "#16a34a" : "#dc2626";
    const isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
      (document.documentElement.getAttribute("data-theme") === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const gridColor  = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
    const labelColor = isDark ? "rgba(255,255,255,0.4)"  : "rgba(0,0,0,0.38)";
    const bgColor    = isDark ? "#111827" : "#ffffff";

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);

    // Y grid + labels
    for (let i = 0; i <= 4; i++) {
      const v = min + (i / 4) * range;
      const y = yOf(v);
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px + cw, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = labelColor;
      ctx.font = `600 9px sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText(Math.round(v / 1000) + "k", px - 4, y + 3.5);
    }

    // X-axis date labels
    ctx.fillStyle = labelColor;
    ctx.font = "600 9px sans-serif";
    ctx.textAlign = "center";
    for (let i = 0; i < pts.length; i++) {
      if (dateLabels.current[i]) ctx.fillText(dateLabels.current[i], xOf(i), H - 6);
    }

    // Area fill
    const grad = ctx.createLinearGradient(0, py, 0, py + ch);
    grad.addColorStop(0, up ? "rgba(22,163,74,0.18)" : "rgba(220,38,38,0.18)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(pts[0]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(xOf(i), yOf(pts[i]));
    ctx.lineTo(xOf(pts.length - 1), py + ch);
    ctx.lineTo(xOf(0), py + ch);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(pts[0]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(xOf(i), yOf(pts[i]));
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // Last dot
    ctx.beginPath();
    ctx.arc(xOf(pts.length - 1), yOf(pts[pts.length - 1]), 4, 0, Math.PI * 2);
    ctx.fillStyle = lineColor;
    ctx.fill();

    // Hover crosshair
    if (hoverIdx !== null) {
      const hx = xOf(hoverIdx), hy = yOf(pts[hoverIdx]);
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(hx, py); ctx.lineTo(hx, py + ch); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px, hy); ctx.lineTo(px + cw, hy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx, hy, 3, 0, Math.PI * 2);
      ctx.fillStyle = bgColor;
      ctx.fill();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, baseVal, period]);

  useEffect(() => {
    draw(null);
    // Redraw on window resize
    const onResize = () => draw(null);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const pts = points.current;
    const px = 50, cw = canvas.clientWidth - px - 16;
    const idx = Math.max(0, Math.min(pts.length - 1, Math.round(((mx - px) / cw) * (pts.length - 1))));
    draw(idx);
    setTooltip({ x: mx, y: e.clientY - rect.top, val: pts[idx], label: dateLabels.current[idx] });
  }, [draw]);

  const handleMouseLeave = useCallback(() => {
    draw(null);
    setTooltip(null);
  }, [draw]);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <canvas ref={canvasRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
        style={{ display: "block", width: "100%", height: 170, cursor: "crosshair", borderRadius: 8 }} />
      {tooltip && (
        <div style={{
          position: "absolute", pointerEvents: "none",
          left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth ?? 300) - 110),
          top: Math.max(tooltip.y - 40, 4),
          background: "#07111F", color: "#fff", borderRadius: 6, padding: "5px 10px",
          fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums",
          boxShadow: "0 2px 12px rgba(0,0,0,0.22)", zIndex: 10, whiteSpace: "nowrap",
        }}>
          <div style={{ fontSize: 9, color: "#D4971A", marginBottom: 2 }}>{tooltip.label}</div>
          <div>{fmtNum(tooltip.val, 2)}</div>
        </div>
      )}
    </div>
  );
}

/* ── Point Contributors Chart ──────────────────────────────────────────── */
const PERIOD_SCALE: Record<string, number> = {
  "1D": 1, "1W": 3.2, "1M": 12.8, "6M": 42, "1Y": 88, "3Y": 210, "5Y": 380, "All": 520,
};
function ContributorsChart({ code, period }: { code: string; period: string }) {
  const scale = PERIOD_SCALE[period] ?? 1;
  const base = getContributors(code);
  const contribs = base.map(c => ({ ...c, pts: parseFloat((c.pts * scale).toFixed(2)) }));
  const pos = contribs.filter(c => c.pts > 0).sort((a, b) => b.pts - a.pts).slice(0, 10);
  const neg = contribs.filter(c => c.pts < 0).sort((a, b) => a.pts - b.pts).slice(0, 10);
  const maxAbs = Math.max(...contribs.map(c => Math.abs(c.pts)), 1);

  const Bar = ({ c }: { c: { sym: string; pts: number } }) => {
    const up = c.pts >= 0;
    const color = up ? "#16a34a" : "#dc2626";
    const w = Math.round((Math.abs(c.pts) / maxAbs) * 100);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)", width: 52, flexShrink: 0 }}>{c.sym}</span>
        <div style={{ flex: 1, height: 7, borderRadius: 4, background: "var(--light-bg)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 4, background: color, width: `${w}%`, transition: "width 0.3s" }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color, width: 52, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
          {c.pts > 0 ? "+" : ""}{c.pts.toFixed(2)}
        </span>
      </div>
    );
  };

  return (
    <div style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "#16a34a", display: "inline-block" }} />Positive Contributors
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: "#dc2626", display: "inline-block" }} />Negative Contributors
          </span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Top Positive</div>
          {pos.map(c => <Bar key={c.sym} c={c} />)}
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Top Negative</div>
          {neg.map(c => <Bar key={c.sym} c={c} />)}
        </div>
      </div>
    </div>
  );
}

/* ── Return Badge ──────────────────────────────────────────────────────── */
function RetBadge({ val, label }: { val: number; label: string }) {
  const up = val >= 0;
  const color = up ? "#16a34a" : "#dc2626";
  const bg    = up ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.08)";
  return (
    <div style={{ textAlign: "center", padding: "7px 6px", borderRadius: 8, background: bg, border: `1px solid ${up ? "rgba(22,163,74,0.2)" : "rgba(220,38,38,0.2)"}` }}>
      <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 700, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 900, color }}>{up ? "+" : ""}{val.toFixed(2)}%</div>
    </div>
  );
}

/* ── Stat Row ──────────────────────────────────────────────────────────── */
function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

/* ── Main DashboardClient ─────────────────────────────────────────────── */
const NAVY = "#07111F";

export default function DashboardClient({ initialData }: { initialData: MarketSummary | null }) {
  const [data, setData]       = useState<MarketSummary | null>(initialData);
  const [activeCode, setActive] = useState<string | null>(null);
  const [isOpen, setIsOpen]   = useState(() => getMarketStatus().open);
  const [tab, setTab]         = useState<"watch" | "points" | "contrib">("watch");
  const [period, setPeriod]   = useState<string>("1M");
  const [nowStr, setNowStr]   = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) +
      " " + new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
    setNowStr(fmt());
    const id = setInterval(() => setNowStr(fmt()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setIsOpen(getMarketStatus().open), 60_000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(() => {
    fetchMarketSummary().then(d => setData(d)).catch(() => {});
  }, []);

  useEffect(() => {
    const isPlaceholder = !initialData || initialData.source === undefined;
    const delay = isPlaceholder ? 0 : 60_000;
    const firstId = setTimeout(() => {
      refresh();
      const id = setInterval(refresh, 60_000);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(firstId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liveIndices = data ? toIdxRows(data.indices) : [];
  const liveSet     = new Set(liveIndices.map(i => i.code));
  const allIndices  = [
    ...liveIndices,
    ...EXTRA_INDICES.filter(e => !liveSet.has(e.code)),
  ];
  const active   = activeCode ?? allIndices[0]?.code ?? "KSE-100";
  const activeIdx = allIndices.find(i => i.code === active) ?? allIndices[0];
  const stats    = getStats(active);
  const up       = (activeIdx?.pct ?? 0) >= 0;
  const color    = up ? "#16a34a" : "#dc2626";

  const TABS = [
    { key: "watch",  label: "Index Watch" },
    { key: "points", label: "Index Points" },
    { key: "contrib",label: "Point Contributors" },
  ] as const;

  return (
    <>
      {/* ── Market Overview scrollable row ─────────────────────────── */}
      <div className="card mb-4" style={{ overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>Market Overview</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => scrollRef.current?.scrollBy({ left: -330, behavior: "smooth" })}
              style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--border)", background: "var(--light-bg)", cursor: "pointer", fontSize: 10, color: "var(--text-muted)" }}>‹</button>
            <button onClick={() => scrollRef.current?.scrollBy({ left: 330, behavior: "smooth" })}
              style={{ width: 22, height: 22, borderRadius: 6, border: "1px solid var(--border)", background: "var(--light-bg)", cursor: "pointer", fontSize: 10, color: "var(--text-muted)" }}>›</button>
          </div>
        </div>
        <div ref={scrollRef} style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none" }}>
          {allIndices.map(idx => (
            <OvCard key={idx.code} idx={idx} active={active === idx.code} isOpen={isOpen} onClick={() => setActive(idx.code)} />
          ))}
        </div>
      </div>

      {/* ── Sarmaaya-style index detail panel ─────────────────────── */}
      <div className="card mb-4">
        {/* ── Tabs ── */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: "10px 20px", border: "none", cursor: "pointer", fontSize: 11, fontWeight: tab === t.key ? 800 : 600,
                color: tab === t.key ? "#D4971A" : "var(--text-muted)",
                borderBottom: tab === t.key ? "2px solid #D4971A" : "2px solid transparent",
                background: "transparent", letterSpacing: "0.02em", transition: "all 0.15s",
              }}>{t.label}</button>
          ))}
        </div>

        {/* ── Index Watch ── */}
        {tab === "watch" && (
          <div>
            <div style={{ padding: "20px 24px" }}>
            {/* Header: name + value */}
            <div style={{ display: "flex", gap: 24, alignItems: "stretch", flexWrap: "wrap" }}>
              {/* LEFT */}
              <div style={{ flex: 1, minWidth: 300 }}>
                {/* Index identifier */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 12, color: "#D4971A", fontWeight: 900 }}>📊</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#D4971A", letterSpacing: "0.04em" }}>{active}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{stats.fullName}</div>
                  </div>
                </div>

                {/* Big value */}
                <div style={{ fontSize: 32, fontWeight: 900, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", letterSpacing: "-1px", lineHeight: 1 }}>
                  {activeIdx ? fmtNum(activeIdx.close, 2) : "—"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color }}>
                    {up ? "▲" : "▼"} {activeIdx ? fmtNum(Math.abs(activeIdx.change), 2) : "0"} ({up ? "+" : ""}{activeIdx?.pct?.toFixed(2) ?? "0.00"}%)
                  </span>
                  {nowStr && <span style={{ fontSize: 10, color: "var(--text-muted)" }} suppressHydrationWarning>{nowStr}</span>}
                </div>

                {/* Description */}
                <p style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 16, borderLeft: `3px solid ${color}`, paddingLeft: 10, background: "var(--light-bg)", borderRadius: "0 6px 6px 0", padding: "8px 10px", borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                  {stats.description}
                </p>

                {/* Returns */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Returns</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                    <RetBadge val={stats.ret1D}  label="1D"  />
                    <RetBadge val={stats.ret1W}  label="1W"  />
                    <RetBadge val={stats.ret1M}  label="1M"  />
                    <RetBadge val={stats.ret3M}  label="3M"  />
                    <RetBadge val={stats.ret1Y}  label="1Y"  />
                    <RetBadge val={stats.retYTD} label="YTD" />
                  </div>
                </div>

                {/* Stats table */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                  <div>
                    <StatRow label="High"        value={fmtNum(stats.high, 2)} />
                    <StatRow label="Low"         value={fmtNum(stats.low, 2)} />
                    <StatRow label="Volume"      value={stats.vol} />
                    <StatRow label="52 Week High" value={fmtNum(stats.wk52High, 0)} />
                    <StatRow label="52 Week Low"  value={fmtNum(stats.wk52Low, 0)} />
                  </div>
                  <div>
                    <StatRow label="Prev Close"    value={fmtNum(stats.prevClose, 2)} />
                    <StatRow label="P/E Ratio"     value={stats.pe.toFixed(2)} />
                    <StatRow label="Dividend Yield" value={`${stats.divYield.toFixed(1)}%`} />
                    <StatRow label="Market Cap"    value={stats.mktCap} />
                  </div>
                </div>
              </div>

              {/* RIGHT: Treemap — stretches to match left column */}
              <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column" }}>
                <div style={{ flex: 1, borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <TreemapSVG sectors={stats.sectors} activeCode={active} />
                </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* ── Index Points ── */}
        {tab === "points" && (
          <div style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Points — {active}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                  {activeIdx ? fmtNum(activeIdx.close, 2) : "—"}
                  <span style={{ fontSize: 12, fontWeight: 700, color, marginLeft: 8 }}>{up ? "+" : ""}{activeIdx?.pct?.toFixed(2) ?? "0.00"}%</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {["1D","1W","1M","6M","1Y","3Y","5Y","All"].map(t => (
                  <button key={t} onClick={() => setPeriod(t)} style={{ padding: "3px 8px", borderRadius: 5, border: "1px solid var(--border)", background: t === period ? NAVY : "transparent", color: t === period ? "#D4971A" : "var(--text-muted)", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.12s" }}>{t}</button>
                ))}
              </div>
            </div>
            <PointsChart code={active} baseVal={activeIdx?.close ?? 180000} period={period} />
          </div>
        )}

        {/* ── Point Contributors ── */}
        {tab === "contrib" && (
          <>
            <div style={{ padding: "12px 20px 0", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>Top Point Contributors</div>
              <span style={{ fontSize: 10, color: "var(--text-muted)" }}>— {active}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                {["1D","1W","1M","6M","1Y"].map(t => (
                  <button key={t} onClick={() => setPeriod(t)} style={{ padding: "2px 7px", borderRadius: 4, border: "1px solid var(--border)", background: t === period ? NAVY : "transparent", color: t === period ? "#D4971A" : "var(--text-muted)", fontSize: 9.5, fontWeight: 700, cursor: "pointer" }}>{t}</button>
                ))}
              </div>
            </div>
            <ContributorsChart code={active} period={period} />
          </>
        )}
      </div>

      {/* ── Sector Performance ── */}
      <SectorPanel initialData={data?.sectors} />

      {/* ── Market Performers ── */}
      <MarketPerformers initialData={data} />
    </>
  );
}
