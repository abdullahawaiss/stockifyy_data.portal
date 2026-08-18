export const INDICES: { code: string; close: number; pct: number; vol: number; change: number }[] = [
  { code: "KSE-100",  close: 180059.79, pct: -0.69, vol: 322003264, change: -1250.49 },
  { code: "KSE-30",   close:  53632.56, pct: -0.69, vol: 185412000, change:  -373.31 },
  { code: "KSE ALL",  close: 108894.65, pct: -0.46, vol: 412000000, change:  -507.67 },
  { code: "KMI-30",   close: 253326.40, pct: -0.94, vol:  97240000, change: -2398.79 },
  { code: "KMI ALL",  close:  69727.60, pct: -0.56, vol:  75180000, change:  -394.10 },
];

export const GAINERS = [
  { symbol: "RUBYNC", name: "Ruby Cloth Mills",     close:  30.87, pct: 10.01, change:  2.81, vol:   49149 },
  { symbol: "NRSL",   name: "Noon Resources",       close:  37.49, pct: 10.01, change:  3.41, vol:  877781 },
  { symbol: "GATI",   name: "Gatron Industries",    close: 102.47, pct: 10.01, change:  9.32, vol:  157496 },
  { symbol: "SUTM",   name: "Suraj Textile",        close: 134.71, pct: 10.00, change: 12.25, vol:   28177 },
  { symbol: "ARCTM",  name: "Arco Textile",         close:  51.91, pct: 10.00, change:  4.72, vol:   31031 },
  { symbol: "ASTM",   name: "Ayesha Textile",       close:  99.55, pct: 10.00, change:  9.05, vol:  380943 },
  { symbol: "PIM",    name: "Pakistan Int. Modaraba",close: 26.51, pct: 10.00, change:  2.41, vol:   11782 },
  { symbol: "RUPL",   name: "Rupali Polyester",     close:  36.30, pct: 10.00, change:  3.30, vol:  381751 },
  { symbol: "BUXL",   name: "Buxly Paints",         close: 369.64, pct: 10.00, change: 33.60, vol:    6870 },
  { symbol: "ASLCPS", name: "Askari Bank CPS",      close: 126.31, pct: 10.00, change: 11.48, vol:     101 },
];

export const LOSERS = [
  { symbol: "DSIL",    name: "D.S. Industries",     close:  12.20, pct: -10.03, change: -1.36, vol: 36472667 },
  { symbol: "FTSM",    name: "Fatima Sugar Mills",  close:  43.10, pct:  -9.15, change: -4.34, vol:    40143 },
  { symbol: "GEMMEL",  name: "Gems & Jewels",       close:  25.00, pct:  -8.09, change: -2.20, vol:        1 },
  { symbol: "ANLNV",   name: "Anl Inv.",            close:   8.14, pct:  -7.50, change: -0.66, vol:      431 },
  { symbol: "SUHJNC",  name: "Suahaj Nat. Gas",     close: 202.00, pct:  -6.60, change:-14.28, vol:     2960 },
  { symbol: "SPAC2",   name: "Sitara Peroxide",     close:  14.55, pct:  -5.70, change: -0.88, vol:    23137 },
  { symbol: "SNAI",    name: "Shadman Inks",        close:  39.05, pct:  -5.58, change: -2.31, vol:    22767 },
  { symbol: "KSTMNC",  name: "Kashmiri Textile",    close:  13.70, pct:  -5.58, change: -0.81, vol:     4351 },
  { symbol: "FRCL",    name: "Frontier Ceramics",   close:  95.01, pct:  -4.98, change: -4.98, vol:        1 },
  { symbol: "CLVL",    name: "Clover Leaf",         close:  22.67, pct:  -4.71, change: -1.12, vol:  1301047 },
];

export const VOLUME = [
  { symbol: "TRG",   name: "TRG Pakistan",        vol: 48200000, close: 92.40,  pct: 1.26  },
  { symbol: "WTL",   name: "World Telecom",        vol: 35700000, close: 14.85,  pct: 2.41  },
  { symbol: "UNITY", name: "Unity Foods",          vol: 29100000, close: 28.60,  pct: 2.41  },
  { symbol: "MLCF",  name: "Maple Leaf Cement",   vol: 22800000, close: 41.80,  pct: -3.22 },
  { symbol: "PACE",  name: "Pace Pakistan",        vol: 18500000, close: 7.35,   pct: -0.81 },
];

export const SECTORS = [
  { name: "Oil & Gas",  pct: 2.14  }, { name: "Cement",     pct: -1.02 },
  { name: "Fertilizer", pct: 1.88  }, { name: "Banking",    pct: 0.74  },
  { name: "Power",      pct: 0.56  }, { name: "Technology", pct: 1.43  },
  { name: "Textile",    pct: 0.22  }, { name: "Auto",       pct: -0.38 },
];

export const SECTORS_DATA: Record<"Daily" | "Weekly" | "Monthly", { name: string; pct: number }[]> = {
  Daily: [
    { name: "Oil & Gas",  pct:  2.14 }, { name: "Cement",     pct: -1.02 },
    { name: "Fertilizer", pct:  1.88 }, { name: "Banking",    pct:  0.74 },
    { name: "Power",      pct:  0.56 }, { name: "Technology", pct:  1.43 },
    { name: "Textile",    pct:  0.22 }, { name: "Auto",       pct: -0.38 },
  ],
  Weekly: [
    { name: "Oil & Gas",  pct:  4.82 }, { name: "Cement",     pct: -2.14 },
    { name: "Fertilizer", pct:  3.61 }, { name: "Banking",    pct:  1.95 },
    { name: "Power",      pct: -0.87 }, { name: "Technology", pct:  3.22 },
    { name: "Textile",    pct: -1.44 }, { name: "Auto",       pct:  0.74 },
  ],
  Monthly: [
    { name: "Oil & Gas",  pct:  9.15 }, { name: "Cement",     pct: -5.32 },
    { name: "Fertilizer", pct:  7.44 }, { name: "Banking",    pct:  4.88 },
    { name: "Power",      pct:  2.17 }, { name: "Technology", pct:  6.91 },
    { name: "Textile",    pct: -3.20 }, { name: "Auto",       pct:  1.55 },
  ],
};

export const ANNOUNCEMENTS = [
  { symbol: "OGDC",  title: "Board Meeting — Dividend Announcement Q4 FY2025",    date: "2025-08-01", type: "Dividend"   },
  { symbol: "LUCK",  title: "Financial Results for the Year Ended June 30, 2025", date: "2025-07-31", type: "Results"    },
  { symbol: "PSO",   title: "Quarterly Report — April to June 2025",              date: "2025-07-30", type: "Results"    },
  { symbol: "ENGRO", title: "Change in Shareholding — Director Disclosure",       date: "2025-07-29", type: "Disclosure" },
  { symbol: "MCB",   title: "Annual General Meeting — Notice to Shareholders",    date: "2025-07-28", type: "AGM"        },
];

export const RESEARCH = [
  { title: "KSE-100 Monthly Outlook — August 2025",                     author: "Stockifyy Research", date: "2025-08-01", tag: "Market"  },
  { title: "E&P Sector Review: Oil Price Impact on Pakistani Equities", author: "Stockifyy Research", date: "2025-07-28", tag: "Sector"  },
  { title: "Banking Sector: Q2 2025 Earnings Preview",                  author: "Stockifyy Research", date: "2025-07-25", tag: "Banking" },
];

export const BREADTH = { advances: 248, declines: 142, unchanged: 38, total: 428 };

export const FINANCIAL_RESULTS: { symbol: string; name: string; period: string; eps: string | null; payout: string | null; announced: string }[] = [
  { symbol: "OGDC",  name: "Oil & Gas Dev.",    period: "FY26 Q4", eps: "Rs.8.42",  payout: "Rs.6.00 (D)",      announced: "11-Aug-2026" },
  { symbol: "LUCK",  name: "Lucky Cement",      period: "FY26",    eps: "Rs.31.83", payout: "Rs.5.00 (D)",      announced: "10-Aug-2026" },
  { symbol: "MARI",  name: "Mari Petroleum",    period: "FY26",    eps: "Rs.72.52", payout: "Rs.18.70 (D)",     announced: "09-Aug-2026" },
  { symbol: "MCB",   name: "MCB Bank",          period: "H1 FY26", eps: "Rs.19.40", payout: "Rs.8.00 (D)",      announced: "08-Aug-2026" },
  { symbol: "ENGRO", name: "Engro Corporation", period: "H1 FY26", eps: "Rs.24.10", payout: "Rs.12.50 (D)",     announced: "07-Aug-2026" },
  { symbol: "ACPL",  name: "Attock Cement",     period: "FY26",    eps: "Rs.24.86", payout: null,               announced: "06-Aug-2026" },
];

export const BOARD_MEETINGS: { symbol: string; name: string; periodEnded: string; time: string; scheduledDate: string; purpose: string }[] = [
  { symbol: "DKTM",  name: "DKT Modaraba",      periodEnded: "31-12-2024", time: "03:30", scheduledDate: "11-08-2026", purpose: "Financial Results" },
  { symbol: "DMTM",  name: "DMT Modaraba",       periodEnded: "31-12-2024", time: "04:30", scheduledDate: "11-08-2026", purpose: "Financial Results" },
  { symbol: "CEPB",  name: "Cnergyico PK",       periodEnded: "30-06-2026", time: "03:00", scheduledDate: "12-08-2026", purpose: "Annual Results" },
  { symbol: "JSGCL", name: "JSG Capital",        periodEnded: "30-06-2026", time: "22:00", scheduledDate: "13-08-2026", purpose: "Annual Results" },
  { symbol: "PRL",   name: "Pak Refinery Ltd",   periodEnded: "30-06-2026", time: "22:00", scheduledDate: "13-08-2026", purpose: "Annual Results + Dividend" },
  { symbol: "EFERT", name: "Engro Fertilizers",  periodEnded: "30-06-2026", time: "14:00", scheduledDate: "14-08-2026", purpose: "Half-Year Results" },
];

export const DIVIDEND_PAYOUTS: { symbol: string; name: string; type: string; amount: string; exDate: string; payDate: string; yield: string }[] = [
  { symbol: "OGDC",  name: "Oil & Gas Dev.",    type: "Interim", amount: "Rs.6.00",  exDate: "12-Aug-2026", payDate: "25-Aug-2026", yield: "4.22%" },
  { symbol: "MARI",  name: "Mari Petroleum",    type: "Final",   amount: "Rs.18.70", exDate: "11-Aug-2026", payDate: "22-Aug-2026", yield: "0.87%" },
  { symbol: "LUCK",  name: "Lucky Cement",      type: "Final",   amount: "Rs.5.00",  exDate: "10-Aug-2026", payDate: "21-Aug-2026", yield: "0.56%" },
  { symbol: "MCB",   name: "MCB Bank",          type: "Interim", amount: "Rs.8.00",  exDate: "14-Aug-2026", payDate: "28-Aug-2026", yield: "3.56%" },
  { symbol: "ENGRO", name: "Engro Corporation", type: "Interim", amount: "Rs.12.50", exDate: "16-Aug-2026", payDate: "30-Aug-2026", yield: "3.12%" },
  { symbol: "PSO",   name: "Pakistan State Oil",type: "Final",   amount: "Rs.9.00",  exDate: "18-Aug-2026", payDate: "01-Sep-2026", yield: "2.82%" },
];

export const ECONOMY_INDICATORS: { indicator: string; period: string; current: string }[] = [
  { indicator: "GDP (Rs mn)",      period: "FY23",      current: "79,477,291" },
  { indicator: "NCPI",             period: "Jul-26",    current: "9.20%"      },
  { indicator: "Per Capita (US$)", period: "FY23",      current: "1,551.00"   },
  { indicator: "Policy Rate",      period: "Jun-26",    current: "11.50%"     },
  { indicator: "SPI",              period: "01-Jul-26", current: "12.00%"     },
  { indicator: "$/PKR - Sell",     period: "—",         current: "Rs.277.50"  },
];

export const MARKET_LEADERS: { symbol: string; pct: number; price: number; vol: number; neg: boolean }[] = [
  { symbol: "CNERGY", pct: -2.89, price: 12.75,  vol: 123779010, neg: true  },
  { symbol: "KEL",    pct:  0.80, price:  7.54,  vol:  56033173, neg: false },
  { symbol: "UNITY",  pct:  0.66, price: 12.12,  vol:  36907809, neg: false },
  { symbol: "HASCOL", pct:  5.29, price: 21.49,  vol:  36224873, neg: false },
  { symbol: "PRL",    pct:  0.77, price: 70.65,  vol:  28599110, neg: false },
];

// Portfolio investments (FIPI) — last 10 days net foreign in $M
export const PORTFOLIO_FIPI = [
  { date: "Jul 28", net:  1.2, cumulative: -1.2 },
  { date: "Jul 29", net:  0.3, cumulative: -0.9 },
  { date: "Jul 30", net: -0.8, cumulative: -1.7 },
  { date: "Jul 31", net: -0.7, cumulative: -2.4 },
  { date: "Aug 3",  net:  0.1, cumulative: -2.3 },
  { date: "Aug 4",  net:  1.8, cumulative: -0.5 },
  { date: "Aug 5",  net: -1.5, cumulative:  1.0 },
  { date: "Aug 6",  net: -2.2, cumulative: -1.2 },
  { date: "Aug 7",  net: -1.9, cumulative: -3.1 },
  { date: "Aug 10", net: -0.2, cumulative: -3.3 },
] as const;

// Intraday KSE-100 data points (every 15 min, 9:30 AM to 3:30 PM PKT)
export const KSE_INTRADAY = [
  181.0, 180.95, 181.1, 181.3, 181.2, 181.5, 181.4, 181.6,
  181.3, 181.1, 181.4, 181.2, 181.0, 180.9, 180.7, 180.6,
  180.5, 180.4, 180.3, 180.1, 180.0, 180.1, 180.0, 180.06,
] as const;

export const KSE_LABELS = [
  "09:30","09:45","10:00","10:15","10:30","10:45","11:00","11:15",
  "11:30","11:45","12:00","12:15","12:30","12:45","13:00","13:15",
  "13:30","13:45","14:00","14:15","14:30","14:45","15:00","15:15",
] as const;

export const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  Dividend:   { bg: "#D1FAE5", color: "#065F46" },
  Results:    { bg: "#DBEAFE", color: "#1E40AF" },
  Disclosure: { bg: "#FEF3C7", color: "#92400E" },
  AGM:        { bg: "#EDE9FE", color: "#5B21B6" },
};

export function fmtNum(n: number, d = 2) {
  return n.toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d });
}
export function fmtVol(v: number) {
  return v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v.toLocaleString();
}

export function getMarketStatus() {
  const pkt = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const d = pkt.getDay(), mins = pkt.getHours() * 60 + pkt.getMinutes();
  const open = d >= 1 && d <= 5 && mins >= 570 && mins < 930;
  return { open, label: open ? "Market Open" : "Market Closed" };
}
