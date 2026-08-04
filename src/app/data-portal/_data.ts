export const INDICES = [
  { code: "KSE-100",   close: 78432.10, pct: 1.24,  vol: 412000000 },
  { code: "KSE-30",    close: 48628.55, pct: 0.87,  vol: 185000000 },
  { code: "KMI-30",    close: 45490.70, pct: 1.05,  vol: 97000000  },
  { code: "All Share", close: 74510.50, pct: 0.93,  vol: 590000000 },
] as const;

export const GAINERS = [
  { symbol: "OGDC",  name: "Oil & Gas Dev. Co.",   close: 142.30,  pct: 4.82  },
  { symbol: "PSO",   name: "Pakistan State Oil",    close: 318.75,  pct: 3.91  },
  { symbol: "LUCK",  name: "Lucky Cement",          close: 894.20,  pct: 3.15  },
  { symbol: "EFERT", name: "Engro Fertilizers",     close: 109.60,  pct: 2.74  },
  { symbol: "MARI",  name: "Mari Petroleum",        close: 2145.00, pct: 2.41  },
];

export const LOSERS = [
  { symbol: "MLCF",  name: "Maple Leaf Cement",    close: 41.80,  pct: -3.22 },
  { symbol: "PIOC",  name: "Pioneer Cement",        close: 68.25,  pct: -2.87 },
  { symbol: "DCL",   name: "Dewan Cement",          close: 22.10,  pct: -2.43 },
  { symbol: "FCCL",  name: "Fauji Cement",          close: 33.45,  pct: -1.98 },
  { symbol: "CHCC",  name: "Cherat Cement",         close: 157.30, pct: -1.62 },
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
