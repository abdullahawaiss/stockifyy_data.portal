import { NextResponse } from "next/server";
import { db } from "@/db";
import { dailyStockPrices, companies, sectors } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// 5-minute server-side cache
const _cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 5 * 60_000;

function getCached(key: string) {
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;
  return null;
}
function setCached(key: string, data: unknown) {
  _cache.set(key, { data, ts: Date.now() });
}

// Fallback demo data (mirrors stocks.ts compact format)
const DEMO: Array<{
  sym: string; name: string; sector: string;
  price: number; chg: number; vol: number; cap: number;
  shariah: boolean; kse100: boolean; kse30: boolean; kmi30: boolean; kmiAll: boolean;
}> = [
  // helper: [sym, name, sector, price, chg, vol, cap, shariah, kse100, kse30, kmi30, kmiAll]
  // ── Oil Exploration ────────────────────────────────────────────────────────
  { sym:"OGDC",  name:"Oil & Gas Dev. Co.",         sector:"Oil Exploration",    price:181.50, chg:-0.66, vol:4200,  cap:762000, shariah:true,  kse100:true,  kse30:false, kmi30:false, kmiAll:true  },
  { sym:"PPL",   name:"Pakistan Petroleum Ltd",     sector:"Oil & Gas Expl.",    price:89.30,  chg:-0.78, vol:3100,  cap:277000, shariah:true,  kse100:true,  kse30:true,  kmi30:true,  kmiAll:true  },
  { sym:"MARI",  name:"Mari Petroleum Co.",         sector:"Oil & Gas Expl.",    price:2210.0, chg:0.68,  vol:280,   cap:619000, shariah:true,  kse100:true,  kse30:true,  kmi30:true,  kmiAll:true  },
  { sym:"POL",   name:"Pakistan Oilfields Ltd",     sector:"Oil & Gas Expl.",    price:510.0,  chg:0.49,  vol:310,   cap:158000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"PSO",   name:"Pakistan State Oil",         sector:"Oil & Gas Mktg.",    price:478.0,  chg:0.95,  vol:1800,  cap:860000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"SNGP",  name:"Sui Northern Gas",           sector:"Oil & Gas Mktg.",    price:28.10,  chg:1.44,  vol:5600,  cap:157000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"SSGC",  name:"Sui Southern Gas",           sector:"Oil & Gas Mktg.",    price:19.20,  chg:1.59,  vol:8300,  cap:159000, shariah:false, kse100:false, kse30:false, kmi30:false, kmiAll:false },
  { sym:"APL",   name:"Attock Petroleum Ltd",       sector:"Oil & Gas Mktg.",    price:718.0,  chg:0.73,  vol:220,   cap:158000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"ATRL",  name:"Attock Refinery Ltd",        sector:"Refinery",           price:348.0,  chg:0.72,  vol:290,   cap:101000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"NRL",   name:"National Refinery Ltd",      sector:"Refinery",           price:612.0,  chg:0.66,  vol:120,   cap:73000,  shariah:false, kse100:false, kse30:false, kmi30:false, kmiAll:false },
  { sym:"HBL",   name:"Habib Bank Ltd",             sector:"Commercial Banks",   price:178.50, chg:1.02,  vol:5800,  cap:1035000,shariah:false, kse100:true,  kse30:true,  kmi30:false, kmiAll:false },
  { sym:"UBL",   name:"United Bank Ltd",            sector:"Commercial Banks",   price:232.40, chg:0.91,  vol:2900,  cap:674000, shariah:false, kse100:true,  kse30:true,  kmi30:false, kmiAll:false },
  { sym:"MCB",   name:"MCB Bank Ltd",               sector:"Commercial Banks",   price:219.80, chg:-0.68, vol:2400,  cap:527000, shariah:false, kse100:true,  kse30:true,  kmi30:false, kmiAll:false },
  { sym:"NBP",   name:"National Bank of Pakistan",  sector:"Commercial Banks",   price:43.20,  chg:0.70,  vol:9200,  cap:397000, shariah:false, kse100:true,  kse30:true,  kmi30:false, kmiAll:false },
  { sym:"MEBL",  name:"Meezan Bank Ltd",            sector:"Commercial Banks",   price:218.50, chg:0.83,  vol:3200,  cap:699000, shariah:true,  kse100:true,  kse30:true,  kmi30:true,  kmiAll:true  },
  { sym:"BAFL",  name:"Bank Alfalah Ltd",           sector:"Commercial Banks",   price:54.60,  chg:0.74,  vol:7100,  cap:388000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"ABL",   name:"Allied Bank Ltd",            sector:"Commercial Banks",   price:136.70, chg:0.66,  vol:1800,  cap:246000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"BAHL",  name:"Bank Al Habib Ltd",          sector:"Commercial Banks",   price:91.50,  chg:-0.44, vol:2100,  cap:192000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"AKBL",  name:"Askari Bank Ltd",            sector:"Commercial Banks",   price:28.40,  chg:0.71,  vol:4900,  cap:139000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"FAYSAL",name:"Faysal Bank Ltd",            sector:"Commercial Banks",   price:39.50,  chg:0.89,  vol:4700,  cap:186000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"LUCK",  name:"Lucky Cement Ltd",           sector:"Cement",             price:1125.0, chg:0.76,  vol:520,   cap:585000, shariah:true,  kse100:true,  kse30:true,  kmi30:true,  kmiAll:true  },
  { sym:"DGKC",  name:"D.G. Khan Cement Co.",       sector:"Cement",             price:97.80,  chg:-0.81, vol:1900,  cap:185000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"MLCF",  name:"Maple Leaf Cement",          sector:"Cement",             price:40.80,  chg:-0.97, vol:4800,  cap:196000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"FCCL",  name:"Fauji Cement Co. Ltd",       sector:"Cement",             price:22.10,  chg:0.91,  vol:7300,  cap:161000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"BWCL",  name:"Bestway Cement Ltd",         sector:"Cement",             price:312.0,  chg:0.81,  vol:380,   cap:119000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"KOHC",  name:"Kohat Cement Co. Ltd",       sector:"Cement",             price:176.0,  chg:0.86,  vol:610,   cap:107000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"ACPL",  name:"Attock Cement Pakistan",     sector:"Cement",             price:248.0,  chg:0.81,  vol:480,   cap:119000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"CHCC",  name:"Cherat Cement Co.",          sector:"Cement",             price:131.50, chg:-0.75, vol:890,   cap:117000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"PIOC",  name:"Pioneer Cement Ltd",         sector:"Cement",             price:111.20, chg:0.63,  vol:730,   cap:81000,  shariah:true,  kse100:false, kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"ENGRO", name:"Engro Corporation Ltd",      sector:"Fertilizer",         price:312.50, chg:1.13,  vol:2100,  cap:656000, shariah:false, kse100:true,  kse30:true,  kmi30:false, kmiAll:false },
  { sym:"EFERT", name:"Engro Fertilizers Ltd",      sector:"Fertilizer",         price:87.60,  chg:0.69,  vol:3800,  cap:333000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"FFC",   name:"Fauji Fertilizer Co.",       sector:"Fertilizer",         price:139.30, chg:-0.64, vol:2700,  cap:376000, shariah:true,  kse100:true,  kse30:true,  kmi30:true,  kmiAll:true  },
  { sym:"FFBL",  name:"Fauji Fertilizer Bin Qasim", sector:"Fertilizer",         price:25.10,  chg:0.80,  vol:4100,  cap:103000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"FATIMA",name:"Fatima Fertilizer Co.",      sector:"Fertilizer",         price:34.80,  chg:-0.57, vol:3400,  cap:118000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"HUBC",  name:"Hub Power Co. Ltd",          sector:"Power Gen. & Dist.",  price:107.80, chg:0.75,  vol:4900,  cap:528000, shariah:false, kse100:true,  kse30:true,  kmi30:false, kmiAll:false },
  { sym:"KAPCO", name:"Kot Addu Power Co.",         sector:"Power Gen. & Dist.",  price:29.50,  chg:0.51,  vol:5200,  cap:153000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"NCPL",  name:"Nishat Chunian Power",       sector:"Power Gen. & Dist.",  price:16.20,  chg:0.62,  vol:4300,  cap:70000,  shariah:false, kse100:false, kse30:false, kmi30:false, kmiAll:false },
  { sym:"PSMC",  name:"Pak Suzuki Motor Co.",       sector:"Automobile Assembler",price:830.0,  chg:1.47,  vol:310,   cap:257000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"INDU",  name:"Indus Motor Co. Ltd",        sector:"Automobile Assembler",price:1702.0, chg:1.07,  vol:180,   cap:306000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"HCAR",  name:"Honda Atlas Cars",           sector:"Automobile Assembler",price:482.0,  chg:1.05,  vol:220,   cap:106000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"MTL",   name:"Millat Tractors Ltd",        sector:"Automobile Assembler",price:1198.0, chg:0.84,  vol:82,    cap:98000,  shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"TRG",   name:"TRG Pakistan Ltd",           sector:"Technology & Comm.",  price:101.50, chg:1.50,  vol:7200,  cap:731000, shariah:false, kse100:true,  kse30:true,  kmi30:false, kmiAll:false },
  { sym:"SYS",   name:"Systems Limited",            sector:"Technology & Comm.",  price:724.0,  chg:1.26,  vol:480,   cap:347000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"PTC",   name:"Pakistan Telecom Co.",       sector:"Technology & Comm.",  price:18.80,  chg:-1.05, vol:12000, cap:226000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"AVN",   name:"Avanceon Ltd",               sector:"Technology & Comm.",  price:42.30,  chg:1.20,  vol:2100,  cap:89000,  shariah:true,  kse100:false, kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"NETSOL",name:"NetSol Technologies",        sector:"Technology & Comm.",  price:160.0,  chg:1.27,  vol:540,   cap:86000,  shariah:true,  kse100:false, kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"SEARL", name:"The Searle Co. Ltd",         sector:"Pharmaceuticals",     price:228.0,  chg:0.88,  vol:310,   cap:71000,  shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"ABOT",  name:"Abbott Laboratories",        sector:"Pharmaceuticals",     price:1002.0, chg:0.80,  vol:41,    cap:41000,  shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"GLAXO", name:"GlaxoSmithKline Pakistan",   sector:"Pharmaceuticals",     price:248.0,  chg:0.81,  vol:78,    cap:19000,  shariah:false, kse100:false, kse30:false, kmi30:false, kmiAll:false },
  { sym:"FEROZ", name:"Ferozsons Laboratories",     sector:"Pharmaceuticals",     price:412.0,  chg:0.86,  vol:82,    cap:34000,  shariah:false, kse100:false, kse30:false, kmi30:false, kmiAll:false },
  { sym:"AGP",   name:"AGP Limited",                sector:"Pharmaceuticals",     price:312.0,  chg:0.81,  vol:48,    cap:15000,  shariah:true,  kse100:false, kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"NATF",  name:"National Foods Ltd",         sector:"Food & Personal Care",price:89.20,  chg:0.79,  vol:840,   cap:75000,  shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"NESTLE",name:"Nestlé Pakistan Ltd",        sector:"Food & Personal Care",price:7010.0, chg:0.79,  vol:12,    cap:84000,  shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"UNITY", name:"Unity Foods Ltd",            sector:"Sugar & Allied",      price:18.30,  chg:1.10,  vol:5600,  cap:102000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"JDW",   name:"JDW Sugar Mills Ltd",        sector:"Sugar & Allied",      price:298.0,  chg:0.84,  vol:248,   cap:74000,  shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"NCL",   name:"Nishat Chunian Ltd",         sector:"Textile Composite",   price:21.80,  chg:-0.91, vol:3100,  cap:68000,  shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"NML",   name:"Nishat Mills Ltd",           sector:"Textile Composite",   price:138.0,  chg:0.73,  vol:680,   cap:94000,  shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"ILP",   name:"Interloop Ltd",              sector:"Textile Composite",   price:68.0,   chg:0.89,  vol:2100,  cap:143000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"THALL", name:"Thal Ltd",                   sector:"Textile Composite",   price:2048.0, chg:0.89,  vol:28,    cap:57000,  shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"MUGHAL",name:"Mughal Iron & Steel",        sector:"Engineering",         price:78.50,  chg:0.90,  vol:1600,  cap:126000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"ISL",   name:"International Steels Ltd",   sector:"Engineering",         price:148.0,  chg:0.82,  vol:890,   cap:132000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"ASTL",  name:"Amreli Steels Ltd",          sector:"Engineering",         price:48.0,   chg:0.84,  vol:2100,  cap:101000, shariah:false, kse100:false, kse30:false, kmi30:false, kmiAll:false },
  { sym:"ICI",   name:"ICI Pakistan Ltd",           sector:"Chemicals",           price:832.0,  chg:0.73,  vol:98,    cap:82000,  shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"EPCL",  name:"Engro Polymer & Chemicals",  sector:"Chemicals",           price:38.20,  chg:0.79,  vol:3100,  cap:118000, shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"LOTCHEM",name:"LOTTEChemical Pakistan",    sector:"Chemicals",           price:29.80,  chg:-1.00, vol:2900,  cap:86000,  shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"ADAMJEE",name:"Adamjee Insurance Co.",     sector:"Insurance",           price:68.0,   chg:0.74,  vol:820,   cap:56000,  shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"EFU",   name:"EFU General Insurance",      sector:"Insurance",           price:148.0,  chg:0.82,  vol:320,   cap:47000,  shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"JUBILEE",name:"Jubilee Life Insurance",    sector:"Insurance",           price:428.0,  chg:0.82,  vol:92,    cap:39000,  shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"IGI",   name:"IGI Holdings Ltd",           sector:"Insurance",           price:592.0,  chg:0.77,  vol:68,    cap:40000,  shariah:false, kse100:false, kse30:false, kmi30:false, kmiAll:false },
  { sym:"PNSC",  name:"Pakistan National Shipping", sector:"Transport",           price:112.0,  chg:0.90,  vol:340,   cap:38000,  shariah:true,  kse100:true,  kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"PSEL",  name:"Pakistan Services Ltd",      sector:"Hotels & Personal",   price:3210.0, chg:0.79,  vol:12,    cap:39000,  shariah:false, kse100:false, kse30:false, kmi30:false, kmiAll:false },
  { sym:"DAWH",  name:"Dawood Hercules Corp.",      sector:"Fertilizer",          price:148.0,  chg:0.82,  vol:1100,  cap:163000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"PKGS",  name:"Packages Ltd",               sector:"Paper & Board",       price:428.0,  chg:0.82,  vol:190,   cap:81000,  shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"ATLH",  name:"Atlas Honda Ltd",            sector:"Automobile Parts",    price:618.0,  chg:1.14,  vol:160,   cap:99000,  shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"PAEL",  name:"Pak Elektron Ltd",           sector:"Cable & Elec. Goods", price:48.20,  chg:0.84,  vol:3400,  cap:164000, shariah:false, kse100:true,  kse30:false, kmi30:false, kmiAll:false },
  { sym:"AREIT", name:"Arif Habib REIT",            sector:"REIT",                price:58.0,   chg:0.83,  vol:1200,  cap:70000,  shariah:true,  kse100:false, kse30:false, kmi30:true,  kmiAll:true  },
  { sym:"DOLMEN",name:"Dolmen City REIT",           sector:"REIT",                price:22.80,  chg:0.84,  vol:3400,  cap:78000,  shariah:true,  kse100:false, kse30:false, kmi30:true,  kmiAll:true  },
];

export async function GET() {
  const cacheKey = "heatmap";
  const hit = getCached(cacheKey);
  if (hit) return NextResponse.json(hit, { headers: { "X-Cache": "HIT" } });

  try {
    // Get latest trading date
    const latestDateRow = await db
      .select({ date: dailyStockPrices.tradingDate })
      .from(dailyStockPrices)
      .orderBy(desc(dailyStockPrices.tradingDate))
      .limit(1);

    if (!latestDateRow.length) throw new Error("No data");
    const date = latestDateRow[0].date;

    // Query stocks with sector and shariah status
    const rows = await db
      .select({
        symbol:           dailyStockPrices.symbol,
        close:            dailyStockPrices.close,
        percentageChange: dailyStockPrices.percentageChange,
        volume:           dailyStockPrices.volume,
        marketValue:      dailyStockPrices.marketValue,
        companyName:      companies.name,
        sectorName:       sectors.name,
        shariahStatus:    companies.shariahStatus,
      })
      .from(dailyStockPrices)
      .leftJoin(companies, eq(dailyStockPrices.companyId, companies.id))
      .leftJoin(sectors, eq(companies.sectorId, sectors.id))
      .where(eq(dailyStockPrices.tradingDate, date));

    if (rows.length < 20) throw new Error("Insufficient data");

    // Get index membership (KSE-100, KSE-30, KMI-30, KMI-All)
    type IndexRow = { symbol: string; indexCode: string };
    const indexMembership = await db.execute<IndexRow>(
      sql`SELECT dp.symbol, i.code as "indexCode"
          FROM daily_stock_prices dp
          JOIN index_constituents ic ON ic.company_id = dp.company_id
          JOIN indices i ON i.id = ic.index_id
          WHERE dp.trading_date = ${date}
            AND ic.is_active = true
            AND i.code IN ('KSE100','KSE30','KMI30','KMIALL')`
    );

    // Build membership sets
    const kse100 = new Set<string>();
    const kse30  = new Set<string>();
    const kmi30  = new Set<string>();
    const kmiAll = new Set<string>();
    for (const r of (indexMembership as unknown as IndexRow[])) {
      if (r.indexCode === "KSE100") kse100.add(r.symbol);
      if (r.indexCode === "KSE30")  kse30.add(r.symbol);
      if (r.indexCode === "KMI30")  kmi30.add(r.symbol);
      if (r.indexCode === "KMIALL") kmiAll.add(r.symbol);
    }

    const stocks = rows.map(r => ({
      sym:     r.symbol,
      name:    r.companyName ?? r.symbol,
      sector:  r.sectorName  ?? "Other",
      price:   Number(r.close ?? 0),
      chg:     Number(r.percentageChange ?? 0),
      vol:     Math.round(Number(r.volume ?? 0) / 1000), // convert to thousands
      cap:     Math.round(Number(r.marketValue ?? 0) / 1000), // convert to thousands
      shariah: r.shariahStatus === "compliant",
      kse100:  kse100.has(r.symbol),
      kse30:   kse30.has(r.symbol),
      kmi30:   kmi30.has(r.symbol),
      kmiAll:  kmiAll.has(r.symbol),
    }));

    const payload = { stocks, date, source: "live" };
    setCached(cacheKey, payload);
    return NextResponse.json(payload);

  } catch {
    // Try PSX live scraper before falling back to demo
    try {
      const { getPsxRows } = await import("@/lib/psx-live");
      const live = await getPsxRows();
      if (live && live.rows.length >= 20) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stocks = live.rows.map((r: any) => {
          const codes: string[] = r.indexCodes ?? [];
          const isKmiAll = codes.includes("KMIALL");
          return {
            sym:     r.symbol ?? "",
            name:    r.companyName ?? r.symbol ?? "",
            sector:  r.sectorName ?? "Other",
            price:   parseFloat(r.close ?? "0") || 0,
            chg:     parseFloat(r.percentageChange ?? r.priceChange ?? "0") || 0,
            vol:     Math.round((parseInt(r.volume ?? "0") || 0) / 1000),
            cap:     Math.round((parseFloat(r.marketValue ?? "0") || 0) / 1000),
            shariah: isKmiAll,
            kse100:  codes.includes("KSE100"),
            kse30:   codes.includes("KSE30"),
            kmi30:   codes.includes("KMI30"),
            kmiAll:  isKmiAll,
          };
        });
        const payload = { stocks, date: new Date().toISOString().slice(0, 10), source: "live" };
        setCached(cacheKey, payload);
        return NextResponse.json(payload);
      }
    } catch { /* fall through to demo */ }

    const payload = {
      stocks: DEMO,
      date: new Date().toISOString().slice(0, 10),
      source: "demo",
    };
    setCached(cacheKey, payload);
    return NextResponse.json(payload);
  }
}
