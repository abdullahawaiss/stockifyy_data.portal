"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PSX_STOCKS } from "@/lib/psx-stocks-static";
import { useDarkTokens } from "@/hooks/useDarkMode";
import { LOGO_DATA_URI } from "@/lib/logo-base64";

interface ScreenerRow {
  symbol: string;
  companyName: string;
  sectorName: string;
  close: number;
  pct: number;
  volume: number;
  pe: number | null;
  dps: number | null;
  divYield: number | null;
  shariah: boolean;
  eps: number | null;
  marketCap: "Large" | "Mid" | "Small";
}

interface SavedScreen {
  id: string;
  name: string;
  filters: FilterState;
  savedAt: string;
}

type IndexFilter = "All" | "KSE-100" | "KSE-30" | "KSE-All" | "KMI-30" | "SME";

interface FilterState {
  sectors: string[];
  index: IndexFilter;
  shariah: boolean;
  peMin: number;
  peMax: number;
  dyMin: number;
  dyMax: number;
  minVolume: number;
  marketCap: string[];
  priceMin: number;
  priceMax: number;
}

const KSE100 = new Set(["OGDC","PPL","HBL","UBL","MCB","MEBL","ENGRO","LUCK","PSMC","SYS","TRG","PSO","MARI","FFC","EFERT","HUBC","DGKC","BWCL","NBP","ABL","BAFL","INDU","NML","ICI","SEARL","SNGP","FCCL","MLCF","PTC","MUGHAL","BAHL","AKBL","FABL","ATRL","POL","APL","FFBL","FATIMA","EPCL","NRL","KAPCO","KEL","ACPL","PIOC","KOHC","CHCC","AVN","NETSOL","HCAR","GHNI","ABOT","GLAXO","HINOON","ISL","ASTL","SILK","SNBL","JSBL","SMBL","BOP","BIPL"]);
const KSE30  = new Set(["OGDC","PPL","HBL","UBL","MCB","MEBL","ENGRO","LUCK","INDU","PSO","MARI","FFC","EFERT","HUBC","DGKC","NBP","ABL","BAFL","BWCL","SYS"]);
const KMI30  = new Set(["MEBL","FABL","ENGRO","LUCK","EFERT","BWCL","MLCF","FCCL","MUGHAL","SYS","MARI","OGDC","PPL","SNGP","FFC","FFBL","FATIMA","NML","SEARL","INDU","PSMC","EPCL","ACPL","HUBC","ICI","BAHL","SNBL","AIRLINK","MTMM","ATLH"]);
const KSEALL = new Set([...KSE100, "SILK","SNBL","JSBL","SMBL","BOP","BIPL","HCAR","GHNI","ABOT","GLAXO","HINOON","AVN","NETSOL","ISL","ASTL","COLG","NESTLE","UNILEVER","PGC","PNSC","UNITY","BATA","PAKT","LOTCHEM","SITARA","PCAL","PAEL","JLICL","JUBILEE","EFU","ADAMJEE","AIRLINK","AGTL","MUGHAL","KEL"]);
const SME    = new Set(["AMEN","ANPL","AMDL","AMSL","GFIL","HAJRA","HINO","ICIL","AMCL","ANL","APF"]);

const FUNDAMENTALS: Record<string, { eps: number; pe: number; dps: number | null; close: number; pct: number; volume: number }> = {
  /* ── Banking ─────────────────────────────────────────────────── */
  HBL:    { eps:38.20, pe:4.6,  dps:14.00,  close:177.30, pct:1.03,  volume:2_100_000 },
  UBL:    { eps:48.60, pe:4.8,  dps:28.00,  close:232.40, pct:0.91,  volume:980_000 },
  MCB:    { eps:45.30, pe:5.0,  dps:36.00,  close:225.60, pct:-0.92, volume:540_000 },
  MEBL:   { eps:30.10, pe:7.3,  dps:29.50,  close:218.50, pct:0.83,  volume:760_000 },
  NBP:    { eps:7.80,  pe:5.5,  dps:4.00,   close:43.20,  pct:0.70,  volume:5_200_000 },
  ABL:    { eps:29.07, pe:4.7,  dps:16.00,  close:136.70, pct:0.66,  volume:490_000 },
  BAFL:   { eps:8.92,  pe:6.1,  dps:8.50,   close:54.60,  pct:0.74,  volume:3_800_000 },
  BAHL:   { eps:30.10, pe:5.8,  dps:18.00,  close:174.0,  pct:0.69,  volume:320_000 },
  AKBL:   { eps:7.20,  pe:5.2,  dps:4.00,   close:37.50,  pct:0.54,  volume:2_100_000 },
  FABL:   { eps:10.80, pe:6.0,  dps:6.50,   close:65.00,  pct:0.77,  volume:1_400_000 },
  SILK:   { eps:2.10,  pe:8.5,  dps:1.50,   close:17.85,  pct:0.56,  volume:4_500_000 },
  SNBL:   { eps:5.40,  pe:7.2,  dps:3.00,   close:38.90,  pct:0.72,  volume:1_200_000 },
  JSBL:   { eps:3.80,  pe:6.9,  dps:2.00,   close:26.30,  pct:0.38,  volume:2_900_000 },
  SMBL:   { eps:4.20,  pe:7.1,  dps:2.50,   close:29.90,  pct:0.67,  volume:1_800_000 },
  BOP:    { eps:2.90,  pe:6.8,  dps:1.50,   close:19.70,  pct:0.51,  volume:6_100_000 },
  BIPL:   { eps:3.50,  pe:7.4,  dps:2.00,   close:25.90,  pct:0.62,  volume:2_300_000 },
  /* ── Oil & Gas E&P ───────────────────────────────────────────── */
  OGDC:   { eps:29.40, pe:6.2,  dps:6.00,   close:181.50, pct:-0.66, volume:3_450_000 },
  PPL:    { eps:16.50, pe:5.4,  dps:3.50,   close:89.30,  pct:-0.78, volume:1_890_000 },
  MARI:   { eps:310.0, pe:6.9,  dps:90.00,  close:2145.0, pct:1.06,  volume:98_000 },
  POL:    { eps:88.0,  pe:6.5,  dps:60.00,  close:573.0,  pct:0.35,  volume:110_000 },
  IGAS:   { eps:12.40, pe:7.8,  dps:5.00,   close:96.80,  pct:0.72,  volume:420_000 },
  /* ── Oil Marketing & Refineries ──────────────────────────────── */
  PSO:    { eps:68.20, pe:5.0,  dps:30.00,  close:341.60, pct:-0.99, volume:670_000 },
  APL:    { eps:72.0,  pe:6.2,  dps:40.00,  close:447.0,  pct:0.45,  volume:130_000 },
  ATRL:   { eps:44.50, pe:7.1,  dps:20.00,  close:315.0,  pct:0.63,  volume:85_000 },
  NRL:    { eps:38.20, pe:6.8,  dps:18.00,  close:260.0,  pct:0.46,  volume:72_000 },
  GAIL:   { eps:8.60,  pe:7.4,  dps:4.00,   close:63.70,  pct:0.55,  volume:680_000 },
  /* ── Fertilizer ──────────────────────────────────────────────── */
  FFC:    { eps:24.80, pe:5.6,  dps:18.00,  close:139.30, pct:-0.64, volume:870_000 },
  EFERT:  { eps:12.10, pe:7.2,  dps:9.00,   close:87.60,  pct:0.69,  volume:1_100_000 },
  FFBL:   { eps:4.20,  pe:8.2,  dps:3.00,   close:34.50,  pct:0.58,  volume:1_800_000 },
  FATIMA: { eps:4.50,  pe:7.7,  dps:3.00,   close:34.70,  pct:-0.57, volume:2_300_000 },
  ENGRO:  { eps:28.50, pe:10.0, dps:15.00,  close:285.40, pct:1.49,  volume:1_240_000 },
  /* ── Cement ──────────────────────────────────────────────────── */
  LUCK:   { eps:120.0, pe:7.8,  dps:40.00,  close:932.00, pct:-0.90, volume:318_000 },
  DGKC:   { eps:14.20, pe:6.9,  dps:5.00,   close:97.80,  pct:-0.81, volume:440_000 },
  BWCL:   { eps:62.40, pe:5.0,  dps:40.00,  close:312.00, pct:0.81,  volume:210_000 },
  FCCL:   { eps:2.80,  pe:7.9,  dps:2.50,   close:22.10,  pct:0.91,  volume:4_100_000 },
  MLCF:   { eps:5.20,  pe:7.8,  dps:2.50,   close:40.80,  pct:-0.97, volume:2_800_000 },
  ACPL:   { eps:38.20, pe:7.4,  dps:30.00,  close:282.0,  pct:0.42,  volume:180_000 },
  PIOC:   { eps:16.80, pe:7.2,  dps:8.00,   close:121.0,  pct:0.66,  volume:380_000 },
  KOHC:   { eps:28.40, pe:7.5,  dps:12.00,  close:213.0,  pct:0.74,  volume:240_000 },
  CHCC:   { eps:22.10, pe:7.1,  dps:10.00,  close:157.0,  pct:0.48,  volume:290_000 },
  ALCM:   { eps:6.80,  pe:7.6,  dps:3.00,   close:51.70,  pct:0.62,  volume:850_000 },
  /* ── Power ───────────────────────────────────────────────────── */
  HUBC:   { eps:12.30, pe:8.8,  dps:8.00,   close:107.80, pct:0.75,  volume:2_300_000 },
  KAPCO:  { eps:9.80,  pe:7.6,  dps:7.00,   close:74.50,  pct:0.68,  volume:1_600_000 },
  KEL:    { eps:0.58,  pe:9.4,  dps:null,   close:5.45,   pct:-0.91, volume:28_000_000 },
  /* ── Technology ──────────────────────────────────────────────── */
  SYS:    { eps:58.20, pe:12.4, dps:30.00,  close:724.00, pct:1.26,  volume:320_000 },
  TRG:    { eps:8.40,  pe:12.1, dps:null,   close:101.50, pct:1.50,  volume:1_900_000 },
  AVN:    { eps:14.20, pe:11.8, dps:5.00,   close:167.0,  pct:0.84,  volume:620_000 },
  NETSOL: { eps:22.50, pe:10.5, dps:8.00,   close:236.0,  pct:0.93,  volume:480_000 },
  AIRLINK:{ eps:10.40, pe:11.2, dps:4.00,   close:116.5,  pct:1.10,  volume:1_350_000 },
  WNDT:   { eps:0.85,  pe:14.2, dps:null,   close:12.10,  pct:0.83,  volume:3_200_000 },
  /* ── Automobile ──────────────────────────────────────────────── */
  PSMC:   { eps:110.0, pe:7.5,  dps:60.00,  close:830.00, pct:1.47,  volume:42_000 },
  INDU:   { eps:220.0, pe:7.7,  dps:175.00, close:1702.0, pct:1.07,  volume:65_000 },
  HCAR:   { eps:8.50,  pe:9.2,  dps:4.00,   close:78.20,  pct:0.77,  volume:740_000 },
  GHNI:   { eps:6.20,  pe:8.8,  dps:3.00,   close:54.60,  pct:0.55,  volume:520_000 },
  AGTL:   { eps:48.60, pe:8.1,  dps:30.00,  close:393.5,  pct:0.63,  volume:95_000 },
  /* ── Pharma ──────────────────────────────────────────────────── */
  ABOT:   { eps:84.85, pe:11.2, dps:48.00,  close:950.0,  pct:0.55,  volume:45_000 },
  SEARL:  { eps:30.50, pe:7.5,  dps:15.00,  close:228.00, pct:0.88,  volume:560_000 },
  GLAXO:  { eps:48.20, pe:9.8,  dps:30.00,  close:472.0,  pct:0.63,  volume:92_000 },
  HINOON: { eps:38.60, pe:10.2, dps:20.00,  close:394.0,  pct:0.71,  volume:78_000 },
  AMEN:   { eps:4.20,  pe:12.0, dps:2.00,   close:50.40,  pct:0.60,  volume:280_000 },
  ANPL:   { eps:3.80,  pe:11.5, dps:1.50,   close:43.70,  pct:0.46,  volume:190_000 },
  /* ── Textile ─────────────────────────────────────────────────── */
  NML:    { eps:22.40, pe:6.2,  dps:12.00,  close:138.00, pct:0.73,  volume:290_000 },
  GATM:   { eps:8.60,  pe:7.4,  dps:4.00,   close:63.60,  pct:0.55,  volume:410_000 },
  YOUW:   { eps:9.20,  pe:7.8,  dps:5.00,   close:71.80,  pct:0.62,  volume:380_000 },
  BHANERO:{ eps:42.50, pe:6.5,  dps:25.00,  close:276.3,  pct:0.48,  volume:88_000 },
  SALFI:  { eps:11.20, pe:7.1,  dps:6.00,   close:79.50,  pct:0.53,  volume:320_000 },
  TREET:  { eps:5.80,  pe:8.0,  dps:3.00,   close:46.40,  pct:0.43,  volume:560_000 },
  BWHL:   { eps:6.40,  pe:7.6,  dps:3.50,   close:48.70,  pct:0.41,  volume:490_000 },
  LOADS:  { eps:7.10,  pe:7.9,  dps:4.00,   close:56.10,  pct:0.57,  volume:370_000 },
  GHCL:   { eps:4.90,  pe:8.2,  dps:2.50,   close:40.20,  pct:0.50,  volume:620_000 },
  AMTEX:  { eps:3.60,  pe:8.5,  dps:2.00,   close:30.60,  pct:0.39,  volume:780_000 },
  ARPL:   { eps:4.20,  pe:8.1,  dps:2.00,   close:34.00,  pct:0.44,  volume:650_000 },
  AZAM:   { eps:5.50,  pe:7.7,  dps:3.00,   close:42.35,  pct:0.47,  volume:510_000 },
  CMSF:   { eps:3.80,  pe:8.3,  dps:2.00,   close:31.50,  pct:0.38,  volume:710_000 },
  DTML:   { eps:2.90,  pe:9.1,  dps:null,   close:26.40,  pct:0.34,  volume:920_000 },
  FAISAL: { eps:4.10,  pe:8.4,  dps:2.00,   close:34.40,  pct:0.45,  volume:590_000 },
  STJT:   { eps:5.20,  pe:7.9,  dps:2.50,   close:41.10,  pct:0.51,  volume:430_000 },
  QUICE:  { eps:2.40,  pe:9.2,  dps:1.00,   close:22.10,  pct:0.32,  volume:1_100_000 },
  /* ── Chemicals & Polymers ────────────────────────────────────── */
  ICI:    { eps:95.40, pe:8.7,  dps:50.00,  close:832.00, pct:0.73,  volume:84_000 },
  EPCL:   { eps:4.80,  pe:8.0,  dps:3.50,   close:38.50,  pct:0.78,  volume:1_100_000 },
  LOTCHEM:{ eps:3.20,  pe:8.6,  dps:2.00,   close:27.50,  pct:0.51,  volume:1_300_000 },
  SITARA: { eps:28.40, pe:7.9,  dps:15.00,  close:224.4,  pct:0.60,  volume:168_000 },
  /* ── Engineering / Steel ─────────────────────────────────────── */
  MUGHAL: { eps:9.80,  pe:8.0,  dps:5.00,   close:78.50,  pct:0.90,  volume:950_000 },
  ISL:    { eps:6.40,  pe:7.5,  dps:3.50,   close:48.00,  pct:0.63,  volume:1_400_000 },
  ASTL:   { eps:5.20,  pe:8.1,  dps:3.00,   close:42.10,  pct:0.48,  volume:1_100_000 },
  ASL:    { eps:4.60,  pe:8.3,  dps:2.50,   close:38.20,  pct:0.44,  volume:1_250_000 },
  AMPSL:  { eps:5.80,  pe:7.8,  dps:3.00,   close:45.20,  pct:0.52,  volume:890_000 },
  ITTEFAQ:{ eps:3.40,  pe:9.0,  dps:null,   close:30.60,  pct:0.37,  volume:1_600_000 },
  /* ── Telecom ─────────────────────────────────────────────────── */
  PTC:    { eps:2.40,  pe:7.8,  dps:1.50,   close:18.80,  pct:-1.05, volume:6_500_000 },
  SNGP:   { eps:3.90,  pe:7.2,  dps:2.00,   close:28.10,  pct:1.44,  volume:7_200_000 },
  /* ── FMCG / Food ────────────────────────────────────────────── */
  NESTLE: { eps:285.0, pe:14.2, dps:200.00, close:4050.0, pct:0.62,  volume:8_000 },
  COLG:   { eps:62.40, pe:12.5, dps:40.00,  close:780.0,  pct:0.55,  volume:22_000 },
  UNILEVER:{ eps:980.0,pe:15.0, dps:700.00, close:14700., pct:0.48,  volume:3_500 },
  PGC:    { eps:125.0, pe:13.2, dps:80.00,  close:1650.0, pct:0.51,  volume:12_000 },
  UNITY:  { eps:8.40,  pe:9.6,  dps:4.00,   close:80.60,  pct:0.67,  volume:1_800_000 },
  /* ── Insurance ──────────────────────────────────────────────── */
  JLICL:  { eps:18.40, pe:10.5, dps:8.00,   close:193.2,  pct:0.64,  volume:210_000 },
  EFU:    { eps:22.80, pe:9.8,  dps:12.00,  close:223.4,  pct:0.58,  volume:180_000 },
  ADAMJEE:{ eps:14.60, pe:9.2,  dps:7.00,   close:134.3,  pct:0.52,  volume:290_000 },
  IGI:    { eps:16.20, pe:10.1, dps:8.00,   close:163.6,  pct:0.61,  volume:240_000 },
  /* ── Transport / Footwear ───────────────────────────────────── */
  PNSC:   { eps:38.40, pe:8.2,  dps:20.00,  close:315.0,  pct:0.70,  volume:85_000 },
  BATA:   { eps:72.60, pe:11.8, dps:40.00,  close:856.7,  pct:0.59,  volume:28_000 },
  SRVI:   { eps:42.80, pe:9.4,  dps:22.00,  close:402.3,  pct:0.53,  volume:62_000 },
  /* ── Cable & Electrical ─────────────────────────────────────── */
  PCAL:   { eps:18.60, pe:8.7,  dps:10.00,  close:161.8,  pct:0.66,  volume:195_000 },
  PAEL:   { eps:8.40,  pe:9.2,  dps:4.00,   close:77.30,  pct:0.72,  volume:820_000 },
  /* ── Conglomerates / Misc ───────────────────────────────────── */
  PAKT:   { eps:120.0, pe:12.1, dps:90.00,  close:1452.0, pct:0.83,  volume:18_000 },
  AHCL:   { eps:14.80, pe:9.6,  dps:6.00,   close:142.1,  pct:0.74,  volume:380_000 },
  AKDHL:  { eps:8.60,  pe:10.2, dps:4.00,   close:87.70,  pct:0.62,  volume:540_000 },
};

const SHARIAH_SET = new Set(["MEBL","FABL","BAHL","AKBL","SNBL","MCB","HUBC","EFERT","ENGRO","LUCK","MLCF","FCCL","BWCL","DGKC","MUGHAL","SYS","TRG","MARI","OGDC","PPL","SNGP","FFC","FFBL","FATIMA","NML","SEARL","INDU","PSMC","ACPL","EPCL","AIRLINK","AGTL","KOHC","PIOC","NETSOL","AVN","HINOON","GATM","YOUW","BHANERO","SITARA","ISL","ASTL","ASL","AMPSL","IGAS","ICI","LOTCHEM","JLICL","PNSC","UNITY","KAPCO","POL","APL"]);

function getMarketCap(sym: string, close: number): "Large" | "Mid" | "Small" {
  if (KSE30.has(sym) || close > 500) return "Large";
  if (KSE100.has(sym) || close > 100) return "Mid";
  return "Small";
}

function buildRows(): ScreenerRow[] {
  return PSX_STOCKS.map(s => {
    const f = FUNDAMENTALS[s.symbol];
    const close = f?.close ?? (50 + Math.random() * 200);
    const dps = f?.dps ?? null;
    const divYield = dps && close > 0 ? (dps / close) * 100 : null;
    return {
      symbol: s.symbol,
      companyName: s.name,
      sectorName: s.sector,
      close,
      pct: f?.pct ?? (Math.random() * 4 - 2),
      volume: f?.volume ?? Math.floor(Math.random() * 1_000_000),
      pe: f?.pe ?? null,
      dps,
      divYield,
      shariah: SHARIAH_SET.has(s.symbol),
      eps: f?.eps ?? null,
      marketCap: getMarketCap(s.symbol, close),
    };
  });
}

const ALL_ROWS = buildRows();

function fmtVol(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
function fmtN(n: number | null, d = 2) {
  if (n === null || !isFinite(n)) return "—";
  return n.toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d });
}

const DEFAULT_FILTERS: FilterState = {
  sectors: [], index: "All", shariah: false,
  peMin: 0, peMax: 50, dyMin: 0, dyMax: 15,
  minVolume: 0, marketCap: [], priceMin: 0, priceMax: 9999,
};

const ALL_INDICES: { label: string; value: IndexFilter }[] = [
  { label: "All Stocks", value: "All" },
  { label: "KSE-100", value: "KSE-100" },
  { label: "KSE-30", value: "KSE-30" },
  { label: "KSE-All Share", value: "KSE-All" },
  { label: "KMI-30", value: "KMI-30" },
  { label: "SME Board", value: "SME" },
];

const LS_KEY = "stockifyy_screens";
function loadScreens(): SavedScreen[] { try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); } catch { return []; } }
function saveScreens(s: SavedScreen[]) { try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {} }

type SortKey = "symbol" | "companyName" | "sectorName" | "close" | "pct" | "volume" | "pe" | "dps" | "divYield";

export default function PageClient() {
  const tk = useDarkTokens();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortAsc, setSortAsc] = useState(false);
  const [savedScreens, setSavedScreens] = useState<SavedScreen[]>([]);
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [stockSearch, setStockSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showAllIndices, setShowAllIndices] = useState(false);
  const [showAllSectors, setShowAllSectors] = useState(false);
  const [sectorSearch, setSectorSearch] = useState("");
  const PAGE_SIZE = 25;

  useEffect(() => {
    setMounted(true);
    setSavedScreens(loadScreens());
    try {
      const wl = JSON.parse(localStorage.getItem("stockifyy_watchlist") ?? "[]") as { symbol: string }[];
      setWatchlist(wl.map(x => x.symbol));
    } catch {}
  }, []);

  const allSectors = useMemo(() => {
    const map: Record<string, number> = {};
    ALL_ROWS.forEach(r => { map[r.sectorName] = (map[r.sectorName] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);

  useEffect(() => { setPage(1); }, [filters, stockSearch]);

  const filtered = useMemo(() => {
    return ALL_ROWS.filter(r => {
      if (stockSearch) {
        const q = stockSearch.toLowerCase();
        if (!r.symbol.toLowerCase().includes(q) && !r.companyName.toLowerCase().includes(q)) return false;
      }
      if (filters.sectors.length && !filters.sectors.includes(r.sectorName)) return false;
      if (filters.index === "KSE-100" && !KSE100.has(r.symbol)) return false;
      if (filters.index === "KSE-30"  && !KSE30.has(r.symbol))  return false;
      if (filters.index === "KSE-All" && !KSEALL.has(r.symbol)) return false;
      if (filters.index === "KMI-30"  && !KMI30.has(r.symbol))  return false;
      if (filters.index === "SME"     && !SME.has(r.symbol))     return false;
      if (filters.shariah && !r.shariah) return false;
      if (r.pe !== null && (r.pe < filters.peMin || r.pe > filters.peMax)) return false;
      if (r.divYield !== null && (r.divYield < filters.dyMin || r.divYield > filters.dyMax)) return false;
      if (r.volume < filters.minVolume) return false;
      if (filters.marketCap.length && !filters.marketCap.includes(r.marketCap)) return false;
      if (r.close < filters.priceMin || r.close > filters.priceMax) return false;
      return true;
    });
  }, [filters, stockSearch]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey] ?? 0, bVal = b[sortKey] ?? 0;
      if (typeof aVal === "string" && typeof bVal === "string")
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [filtered, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(false); }
    setPage(1);
  }

  function toggleSector(sec: string) {
    setPage(1);
    setFilters(f => ({ ...f, sectors: f.sectors.includes(sec) ? f.sectors.filter(s => s !== sec) : [...f.sectors, sec] }));
  }
  function toggleMarketCap(cap: string) {
    setFilters(f => ({ ...f, marketCap: f.marketCap.includes(cap) ? f.marketCap.filter(c => c !== cap) : [...f.marketCap, cap] }));
  }

  function exportCSV() {
    const header = "Symbol,Company,Sector,Close,Chg%,Volume,P/E,DPS,DivYield%,Shariah";
    const rows = sorted.map(r => `${r.symbol},"${r.companyName}","${r.sectorName}",${fmtN(r.close)},${fmtN(r.pct)},${r.volume},${fmtN(r.pe)},${fmtN(r.dps)},${fmtN(r.divYield)},${r.shariah ? "Yes" : "No"}`);
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "psx-screener.csv"; a.click(); URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = sorted.slice(0, 200);
    const dateStr = new Date().toLocaleDateString("en-PK", { day:"2-digit", month:"short", year:"numeric" });
    const wmRows = Array.from({ length: 8 }, (_, i) =>
      `<div style="display:flex;gap:120px;margin-bottom:80px;white-space:nowrap;">${Array(4).fill(`<span>STOCKIFYY · CONFIDENTIAL</span>`).join("")}</div>`
    ).join("");
    const html = `<!DOCTYPE html><html><head><title>PSX Screener — Stockifyy</title><style>
      *{box-sizing:border-box}
      body{font-family:Arial,sans-serif;font-size:11px;margin:0;padding:20px;color:#1a1a1a}
      @page{margin:16mm 12mm}
      /* ── Watermark ── */
      .wm-wrap{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:hidden;display:flex;align-items:center;justify-content:center}
      .wm-inner{transform:rotate(-35deg);opacity:0.055;color:#07111F;font-size:28px;font-weight:900;letter-spacing:0.08em;font-family:Arial,sans-serif;line-height:2.8;text-align:center;width:200%;margin-left:-50%}
      /* ── Header ── */
      .page-header{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;padding:10px 0 10px;border-bottom:3px solid #07111F;margin-bottom:14px}
      .logo-block{display:flex;align-items:center;gap:10px}
      .logo-hex{width:32px;height:32px;background:#07111F;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);display:flex;align-items:center;justify-content:center}
      .logo-s{color:#D4971A;font-size:14px;font-weight:900;font-family:Arial,sans-serif}
      .brand-name{font-size:18px;font-weight:900;color:#07111F;letter-spacing:-0.02em}
      .brand-sub{font-size:8.5px;color:#888;letter-spacing:0.08em;text-transform:uppercase}
      .header-right{text-align:right;font-size:10px;color:#666}
      /* ── Table ── */
      table{width:100%;border-collapse:collapse;position:relative;z-index:1}
      th{background:#07111F;color:#D4971A;padding:7px 8px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:0.07em;font-weight:700}
      th.r{text-align:right}
      td{padding:5px 8px;border-bottom:1px solid #eee;font-size:10.5px;vertical-align:middle}
      td.r{text-align:right;font-variant-numeric:tabular-nums}
      tr:nth-child(even) td{background:#f7f8fa}
      .sym{background:#07111F;color:#D4971A;font-weight:800;font-size:10px;padding:2px 6px;border-radius:4px;display:inline-block}
      .pos{color:#16a34a;font-weight:700}.neg{color:#dc2626;font-weight:700}
      .sh{background:#16a34a20;color:#16a34a;padding:1px 5px;border-radius:6px;font-weight:700;font-size:9px}
      .sector-tag{background:#F1F5F9;color:#666;padding:1px 5px;border-radius:4px;font-size:9.5px}
      /* ── Footer ── */
      .page-footer{position:fixed;bottom:8mm;left:12mm;right:12mm;z-index:1;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #ddd;padding-top:5px;font-size:8.5px;color:#aaa}
    </style></head><body>
    <!-- Watermark -->
    <div class="wm-wrap"><div class="wm-inner">${wmRows}</div></div>
    <!-- Header -->
    <div class="page-header">
      <div class="logo-block">
        <img src="${LOGO_DATA_URI}" alt="Stockifyy" style="height:36px;width:auto;display:block;" />
      </div>
      <div class="header-right">
        <div style="font-size:13px;font-weight:700;color:#07111F">Stock Screener Report</div>
        <div style="margin-top:2px">${rows.length} stocks · ${dateStr}</div>
        <div style="margin-top:2px;color:#aaa">© Stockifyy · stockifyy.com</div>
      </div>
    </div>
    <!-- Table -->
    <table><thead><tr>
      <th>Symbol</th><th>Company</th><th>Sector</th>
      <th class="r">Close</th><th class="r">Chg%</th><th class="r">Volume</th>
      <th class="r">P/E</th><th class="r">DPS</th><th class="r">Div Yield</th><th>Shariah</th>
    </tr></thead><tbody>
    ${rows.map(r => `<tr>
      <td><span class="sym">${r.symbol}</span></td>
      <td>${r.companyName}</td>
      <td><span class="sector-tag">${r.sectorName.length>16?r.sectorName.slice(0,16)+"…":r.sectorName}</span></td>
      <td class="r">${fmtN(r.close)}</td>
      <td class="r ${r.pct>=0?"pos":"neg"}">${r.pct>=0?"+":""}${fmtN(r.pct)}%</td>
      <td class="r">${fmtVol(r.volume)}</td>
      <td class="r">${fmtN(r.pe,1)}</td>
      <td class="r">${fmtN(r.dps)}</td>
      <td class="r ${r.divYield?"pos":""}">${r.divYield?fmtN(r.divYield)+"%":"—"}</td>
      <td>${r.shariah?'<span class="sh">☪ Shariah</span>':""}</td>
    </tr>`).join("")}
    </tbody></table>
    <!-- Footer -->
    <div class="page-footer">
      <span>Stockifyy PSX Data Portal · stockifyy.com</span>
      <span>Data for informational purposes only · Not financial advice</span>
      <span>${dateStr}</span>
    </div>
    </body></html>`;
    printWindow.document.write(html); printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  }

  function exportPNG() {
    const rows = sorted.slice(0, 50);
    const COLS = ["Symbol","Company","Sector","Close","Chg%","Volume","P/E","DPS","Div Yield","Shariah"];
    const CW = [72,150,110,62,62,68,48,55,68,54]; const ROW_H = 22, HEADER_H = 32, PAD = 10, BRAND_H = 36, FOOT_H = 26;
    const totalW = CW.reduce((a,b)=>a+b,0)+PAD*2;
    const totalH = BRAND_H + HEADER_H + rows.length*ROW_H + PAD*2 + FOOT_H;
    const canvas = document.createElement("canvas"); canvas.width = totalW*2; canvas.height = totalH*2;
    const ctx = canvas.getContext("2d")!; ctx.scale(2,2);

    // Background
    ctx.fillStyle = "#F8F6F1"; ctx.fillRect(0,0,totalW,totalH);

    // Brand header bar
    ctx.fillStyle = "#07111F"; ctx.fillRect(0,0,totalW,BRAND_H);
    ctx.font = "bold 13px Arial"; ctx.fillStyle = "#D4971A";
    ctx.fillText("Stockifyy", PAD+4, 22);
    ctx.font = "9px Arial"; ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("PSX Stock Screener · "+new Date().toLocaleDateString("en-PK",{day:"2-digit",month:"short",year:"numeric"}), PAD+4, 32);
    ctx.font = "10px Arial"; ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText(`${rows.length} stocks`, totalW-80, 22);

    // Column headers
    const hy = BRAND_H;
    ctx.fillStyle = "#0c1d2e"; ctx.fillRect(0,hy,totalW,HEADER_H);
    ctx.font = "bold 8px Arial"; ctx.fillStyle = "#D4971A";
    let x = PAD;
    COLS.forEach((c,i) => { ctx.fillText(c.toUpperCase(), x+4, hy+20); x += CW[i]; });

    // Rows
    rows.forEach((r,ri) => {
      const y = BRAND_H + HEADER_H + PAD + ri*ROW_H;
      if (ri%2===1) { ctx.fillStyle = "rgba(0,0,0,0.03)"; ctx.fillRect(0,y,totalW,ROW_H); }
      // divider line
      ctx.strokeStyle = "rgba(0,0,0,0.07)"; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(0,y+ROW_H); ctx.lineTo(totalW,y+ROW_H); ctx.stroke();

      x = PAD;
      const pColor = r.pct>=0?"#16a34a":"#dc2626";
      const dyColor = r.divYield?"#16a34a":"#94a3b8";
      const vals: [string,string,boolean][] = [
        [r.symbol,"#07111F",true],
        [r.companyName.slice(0,18),"#1e293b",false],
        [r.sectorName.slice(0,13),"#64748b",false],
        [fmtN(r.close),"#1e293b",true],
        [(r.pct>=0?"+":"")+fmtN(r.pct)+"%",pColor,true],
        [fmtVol(r.volume),"#475569",true],
        [fmtN(r.pe,1),"#1e293b",true],
        [fmtN(r.dps),"#1e293b",true],
        [r.divYield?fmtN(r.divYield)+"%":"—",dyColor,true],
        [r.shariah?"☪ Yes":"","#16a34a",false],
      ];
      vals.forEach(([v,c,bold],i) => {
        ctx.font = (bold||i===0)?"bold 9px Arial":"9px Arial";
        ctx.fillStyle = c;
        ctx.fillText(v, x+4, y+14);
        x += CW[i];
      });
    });

    // Footer strip
    const fy = BRAND_H + HEADER_H + PAD + rows.length*ROW_H;
    ctx.fillStyle = "#07111F"; ctx.fillRect(0,fy,totalW,FOOT_H);
    ctx.font = "8px Arial"; ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("© Stockifyy · stockifyy.com · Data for informational purposes only · Not financial advice", PAD+4, fy+17);

    // ── WATERMARK ── diagonal repeating text
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = "#07111F";
    ctx.font = "bold 18px Arial";
    ctx.translate(totalW/2, totalH/2);
    ctx.rotate(-Math.PI/5);
    const wStep = 200, hStep = 80;
    for (let wy = -totalH; wy < totalH; wy += hStep) {
      for (let wx = -totalW; wx < totalW; wx += wStep) {
        ctx.fillText("STOCKIFYY", wx, wy);
      }
    }
    ctx.restore();

    const link = document.createElement("a");
    link.download = `stockifyy-screener-${new Date().toISOString().slice(0,10)}.png`;
    link.href = canvas.toDataURL("image/png"); link.click();
  }

  function saveScreen() {
    if (!saveName.trim()) return;
    const ns: SavedScreen = { id: Date.now().toString(), name: saveName.trim(), filters, savedAt: new Date().toISOString() };
    const updated = [...savedScreens.slice(-4), ns];
    setSavedScreens(updated); saveScreens(updated); setSaveName(""); setShowSaveInput(false);
  }
  function deleteScreen(id: string) {
    const updated = savedScreens.filter(s => s.id !== id);
    setSavedScreens(updated); saveScreens(updated);
  }

  function addToWatchlist(symbol: string, name: string) {
    try {
      const raw = JSON.parse(localStorage.getItem("stockifyy_watchlist") ?? "[]") as { id: string; symbol: string; name: string; sector: string; addedPrice: number; addedAt: string }[];
      if (raw.some(x => x.symbol === symbol)) return;
      const row = ALL_ROWS.find(r => r.symbol === symbol);
      raw.push({ id: Date.now().toString(), symbol, name, sector: row?.sectorName ?? "", addedPrice: row?.close ?? 100, addedAt: new Date().toISOString() });
      localStorage.setItem("stockifyy_watchlist", JSON.stringify(raw));
      setWatchlist(prev => [...prev, symbol]);
    } catch {}
  }

  const card = tk.dark ? "#0A1825" : "#ffffff";
  const border = tk.dark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
  const text = tk.dark ? "#BDD0E8" : "#07111F";
  const muted = tk.dark ? "#5C8099" : "#718096";
  const bg = tk.dark ? "#0E1F30" : "#F8F6F1";
  const navy = "#07111F";
  const gold = "#D4971A";

  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "inherit", display: "flex", flexDirection: "column", overflowX: "hidden" }}>
      {/* Top bar */}
      <div style={{ padding: "20px 20px 0", maxWidth: 1400, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
              <span style={{ color: text }}>Stock </span><span style={{ color: "#D4971A" }}>Screener</span>
            </h1>
            <p style={{ fontSize: 13, color: muted, margin: "4px 0 0" }}>Filter and discover PSX listed stocks by fundamental & technical criteria</p>
            {/* Stock search */}
            <div style={{ marginTop: 10, position: "relative", maxWidth: 340 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: muted, pointerEvents: "none" }}>🔍</span>
              <input
                value={stockSearch}
                onChange={e => setStockSearch(e.target.value)}
                placeholder="Search by symbol or company name…"
                style={{ width: "100%", boxSizing: "border-box", paddingLeft: 34, paddingRight: stockSearch ? 32 : 12, paddingTop: 8, paddingBottom: 8, borderRadius: 10, border: `1.5px solid ${stockSearch ? gold : border}`, background: card, color: text, fontSize: 12.5, outline: "none", fontFamily: "inherit", transition: "border-color 0.15s" }}
              />
              {stockSearch && (
                <button onClick={() => setStockSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: muted, fontSize: 14, padding: 0, lineHeight: 1 }}>✕</button>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ background: gold + "20", color: gold, fontWeight: 700, fontSize: 13, padding: "6px 14px", borderRadius: 20 }}>
              {sorted.length} Results
            </span>
            <button onClick={exportCSV} style={{ padding: "7px 14px", background: card, border: `1px solid ${border}`, borderRadius: 8, color: text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ↓ CSV
            </button>
            <button onClick={exportPDF} style={{ padding: "7px 14px", background: card, border: `1px solid ${border}`, borderRadius: 8, color: text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ↓ PDF
            </button>
            <button onClick={exportPNG} style={{ padding: "7px 14px", background: card, border: `1px solid ${border}`, borderRadius: 8, color: text, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ↓ PNG
            </button>
            <button onClick={() => setShowSaveInput(v => !v)} style={{ padding: "7px 14px", background: gold, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              💾 Save Screen
            </button>
          </div>
        </div>
        {showSaveInput && (
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Screen name..." style={{ flex: 1, padding: "8px 12px", border: `1.5px solid ${border}`, borderRadius: 8, background: card, color: text, fontSize: 13, outline: "none" }} />
            <button onClick={saveScreen} style={{ padding: "8px 16px", background: gold, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Save</button>
            <button onClick={() => setShowSaveInput(false)} style={{ padding: "8px 14px", background: card, border: `1px solid ${border}`, borderRadius: 8, color: muted, cursor: "pointer" }}>Cancel</button>
          </div>
        )}
        {/* Saved screens */}
        {savedScreens.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={{ fontSize: 11, color: muted, alignSelf: "center" }}>Saved:</span>
            {savedScreens.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4, background: card, border: `1px solid ${border}`, borderRadius: 20, padding: "4px 10px 4px 12px", fontSize: 12 }}>
                <button onClick={() => setFilters(s.filters)} style={{ background: "none", border: "none", cursor: "pointer", color: gold, fontWeight: 700, padding: 0 }}>{s.name}</button>
                <button onClick={() => deleteScreen(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: muted, fontSize: 12, padding: "0 2px" }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body: filter panel + table */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, maxWidth: 1400, margin: "0 auto", width: "100%", padding: "0 20px 24px", boxSizing: "border-box", height: "calc(100vh - 190px)", minHeight: 500 }}>

        {/* Filter Panel */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, padding: "16px", overflowY: "auto", height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: text }}>Filters</span>
            <button onClick={() => setFilters(DEFAULT_FILTERS)} style={{ fontSize: 11, color: gold, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Reset All</button>
          </div>

          {/* Index */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Index</div>
            {(showAllIndices ? ALL_INDICES : ALL_INDICES.slice(0, 3)).map(({ label, value }) => (
              <label key={value} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 13, color: filters.index === value ? gold : text }}>
                <input type="radio" checked={filters.index === value} onChange={() => setFilters(f => ({ ...f, index: value }))} />
                {label}
              </label>
            ))}
            <button onClick={() => setShowAllIndices(v => !v)} style={{ fontSize: 11, color: gold, background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "2px 0", marginTop: 2 }}>
              {showAllIndices ? "Show Less ▲" : "Show More ▼"}
            </button>
          </div>

          {/* Shariah */}
          <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: filters.shariah ? "#16a34a" : text }}>
              <input type="checkbox" checked={filters.shariah} onChange={() => setFilters(f => ({ ...f, shariah: !f.shariah }))} />
              ☪ Shariah Compliant Only
            </label>
          </div>

          {/* Market Cap */}
          <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Market Cap</div>
            {["Large","Mid","Small"].map(cap => (
              <label key={cap} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 13, color: text }}>
                <input type="checkbox" checked={filters.marketCap.includes(cap)} onChange={() => toggleMarketCap(cap)} />
                {cap} Cap
              </label>
            ))}
          </div>

          {/* P/E Range */}
          <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>P/E Ratio</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="number" value={filters.peMin} onChange={e => setFilters(f => ({ ...f, peMin: +e.target.value }))} placeholder="Min" style={{ flex: 1, padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
              <input type="number" value={filters.peMax} onChange={e => setFilters(f => ({ ...f, peMax: +e.target.value }))} placeholder="Max" style={{ flex: 1, padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
            </div>
          </div>

          {/* Div Yield Range */}
          <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Div Yield %</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="number" value={filters.dyMin} onChange={e => setFilters(f => ({ ...f, dyMin: +e.target.value }))} placeholder="Min" style={{ flex: 1, padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
              <input type="number" value={filters.dyMax} onChange={e => setFilters(f => ({ ...f, dyMax: +e.target.value }))} placeholder="Max" style={{ flex: 1, padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
            </div>
          </div>

          {/* Price Range */}
          <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Price Range (PKR)</div>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="number" value={filters.priceMin} onChange={e => setFilters(f => ({ ...f, priceMin: +e.target.value }))} placeholder="Min" style={{ flex: 1, padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
              <input type="number" value={filters.priceMax} onChange={e => setFilters(f => ({ ...f, priceMax: +e.target.value }))} placeholder="Max" style={{ flex: 1, padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
            </div>
          </div>

          {/* Min Volume */}
          <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Min Volume</div>
            <input type="number" value={filters.minVolume} onChange={e => setFilters(f => ({ ...f, minVolume: +e.target.value }))} placeholder="e.g. 100000" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: `1px solid ${border}`, borderRadius: 6, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 12, outline: "none" }} />
          </div>

          {/* Sectors */}
          <div style={{ paddingTop: 12, borderTop: `1px solid ${border}` }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Sectors</div>
            {/* Search */}
            <div style={{ position: "relative", marginBottom: 8 }}>
              <input
                value={sectorSearch}
                onChange={e => { setSectorSearch(e.target.value); setShowAllSectors(true); }}
                placeholder="Search sectors…"
                style={{ width: "100%", boxSizing: "border-box", padding: "5px 8px 5px 26px", border: `1px solid ${border}`, borderRadius: 7, background: tk.dark ? "#07111F" : "#F8F6F1", color: text, fontSize: 11.5, outline: "none" }}
              />
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: muted, pointerEvents: "none" }}>🔍</span>
            </div>
            {(() => {
              const matched = allSectors.filter(([sec]) => sec.toLowerCase().includes(sectorSearch.toLowerCase()));
              const visible = (showAllSectors || sectorSearch) ? matched : matched.slice(0, 5);
              return (
                <>
                  {visible.map(([sec, count]) => (
                    <label key={sec} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5, cursor: "pointer", gap: 6 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                        <input type="checkbox" checked={filters.sectors.includes(sec)} onChange={() => toggleSector(sec)} />
                        <span style={{ fontSize: 11.5, color: filters.sectors.includes(sec) ? gold : text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sec}</span>
                      </span>
                      <span style={{ fontSize: 10, color: muted, flexShrink: 0 }}>{count}</span>
                    </label>
                  ))}
                  {!sectorSearch && matched.length > 5 && (
                    <button onClick={() => setShowAllSectors(v => !v)} style={{ fontSize: 11, color: gold, background: "none", border: "none", cursor: "pointer", fontWeight: 600, padding: "4px 0", marginTop: 2 }}>
                      {showAllSectors ? `Show Less ▲` : `Show More (${matched.length - 5} more) ▼`}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Results Table */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 14, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ overflowX: "hidden", overflowY: "auto", flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: navy }}>
                  {([
                    ["symbol","Symbol",false],["companyName","Company",false],["sectorName","Sector",false],
                    ["close","Close",true],["pct","Chg %",true],["volume","Volume",true],["pe","P/E",true],
                    ["dps","DPS",true],["divYield","Div Yield",true],
                  ] as [SortKey, string, boolean][]).map(([key, label, right]) => (
                    <th key={key} onClick={() => toggleSort(key)} style={{
                      padding: "9px 8px", textAlign: right ? "right" : "left", color: "rgba(255,255,255,0.85)",
                      fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                      cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
                    }}>
                      {label} {sortKey === key ? (sortAsc ? "▲" : "▼") : ""}
                    </th>
                  ))}
                  <th style={{ padding: "10px 12px", color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, textAlign: "center" }}>Shariah</th>
                  <th style={{ padding: "10px 12px", color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 700, textAlign: "center" }}>Watch</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r, idx) => {
                  const inWl = watchlist.includes(r.symbol);
                  const pColor = r.pct >= 0 ? "#16a34a" : "#dc2626";
                  return (
                    <tr key={r.symbol} style={{ borderBottom: `1px solid ${border}`, background: idx % 2 === 0 ? "transparent" : (tk.dark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)") }}
                      onMouseEnter={e => (e.currentTarget.style.background = tk.dark ? "rgba(255,255,255,0.04)" : "#F8F6F1")}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : (tk.dark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)"))}>
                      <td style={{ padding: "7px 8px", textAlign: "left" }}>
                        <Link href={`/data-portal/company/${r.symbol}`} style={{ textDecoration: "none" }}>
                          <span style={{ background: navy, color: gold, fontWeight: 800, fontSize: 11, padding: "2px 7px", borderRadius: 5 }}>{r.symbol}</span>
                        </Link>
                      </td>
                      <td style={{ padding: "7px 8px", textAlign: "left", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: text, fontSize: 12 }}>{r.companyName}</td>
                      <td style={{ padding: "7px 8px", textAlign: "left" }}>
                        <span style={{ fontSize: 10, color: muted, background: tk.dark ? "rgba(255,255,255,0.06)" : "#F1F5F9", padding: "2px 6px", borderRadius: 6, whiteSpace: "nowrap" }}>
                          {r.sectorName.length > 14 ? r.sectorName.slice(0, 14) + "…" : r.sectorName}
                        </span>
                      </td>
                      <td style={{ padding: "7px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: 12 }}>{fmtN(r.close)}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", color: pColor, fontWeight: 700, fontVariantNumeric: "tabular-nums", fontSize: 12 }}>
                        {r.pct >= 0 ? "+" : ""}{fmtN(r.pct)}%
                      </td>
                      <td style={{ padding: "7px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 12 }}>{fmtVol(r.volume)}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 12 }}>{fmtN(r.pe, 1)}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontSize: 12 }}>{fmtN(r.dps)}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", color: r.divYield ? "#16a34a" : muted, fontWeight: r.divYield ? 600 : 400, fontSize: 12 }}>
                        {r.divYield ? fmtN(r.divYield) + "%" : "—"}
                      </td>
                      <td style={{ padding: "7px 8px", textAlign: "center" }}>
                        {r.shariah && <span style={{ fontSize: 10, background: "#16a34a20", color: "#16a34a", padding: "2px 5px", borderRadius: 8, fontWeight: 700 }}>☪</span>}
                      </td>
                      <td style={{ padding: "7px 8px", textAlign: "center" }}>
                        <button onClick={() => addToWatchlist(r.symbol, r.companyName)} title={inWl ? "In watchlist" : "Add to watchlist"} style={{
                          background: "none", border: "none", cursor: inWl ? "default" : "pointer", fontSize: 16,
                          color: inWl ? gold : muted, transition: "color 0.15s",
                        }}>{inWl ? "★" : "☆"}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sorted.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: muted }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>No stocks match your filters</div>
                <div style={{ fontSize: 13 }}>Try adjusting or resetting the filters</div>
              </div>
            )}
          </div>
          {/* Pagination */}
          {sorted.length > PAGE_SIZE && (() => {
            const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
            const pages: (number | "…")[] = [];
            for (let i = 1; i <= totalPages; i++) {
              if (i === 1 || i === totalPages || Math.abs(i - page) <= 2) pages.push(i);
              else if (pages[pages.length - 1] !== "…") pages.push("…");
            }
            return (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px 16px", borderTop: `1px solid ${border}` }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${border}`, background: card, color: page === 1 ? muted : text, cursor: page === 1 ? "default" : "pointer", fontSize: 13, fontWeight: 600, opacity: page === 1 ? 0.4 : 1 }}>‹ Prev</button>
                {pages.map((p, i) => p === "…"
                  ? <span key={`ellipsis-${i}`} style={{ color: muted, fontSize: 13, padding: "0 4px" }}>…</span>
                  : <button key={p} onClick={() => setPage(p as number)}
                      style={{ width: 34, height: 34, borderRadius: 7, border: `1px solid ${page === p ? gold : border}`, background: page === p ? gold : card, color: page === p ? "#fff" : text, cursor: "pointer", fontSize: 13, fontWeight: page === p ? 800 : 600 }}>{p}</button>
                )}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${border}`, background: card, color: page === totalPages ? muted : text, cursor: page === totalPages ? "default" : "pointer", fontSize: 13, fontWeight: 600, opacity: page === totalPages ? 0.4 : 1 }}>Next ›</button>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
