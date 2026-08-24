import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Full PSX symbol list with names and sectors
const PSX_SYMBOLS = [
  // Oil & Gas
  { symbol: "PPL",   name: "Pakistan Petroleum Ltd",          sector: "Oil & Gas Expl.",   type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "OGDC",  name: "Oil & Gas Dev. Co.",              sector: "Oil & Gas Expl.",   type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "MARI",  name: "Mari Petroleum Co.",              sector: "Oil & Gas Expl.",   type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "POL",   name: "Pakistan Oilfields Ltd",          sector: "Oil & Gas Expl.",   type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "PSO",   name: "Pakistan State Oil",              sector: "Oil & Gas Mktg.",   type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "SNGP",  name: "Sui Northern Gas",                sector: "Oil & Gas Mktg.",   type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "SSGC",  name: "Sui Southern Gas",                sector: "Oil & Gas Mktg.",   type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "APL",   name: "Attock Petroleum Ltd",            sector: "Oil & Gas Mktg.",   type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "HASCOL","name": "Hascol Petroleum Ltd",          sector: "Oil & Gas Mktg.",   type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "ATRL",  name: "Attock Refinery Ltd",             sector: "Refinery",          type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "NRL",   name: "National Refinery Ltd",           sector: "Refinery",          type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "PRL",   name: "Pakistan Refinery Ltd",           sector: "Refinery",          type: "Stock", exchange: "PSX", country: "PK" },
  // Banks
  { symbol: "HBL",   name: "Habib Bank Ltd",                  sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "UBL",   name: "United Bank Ltd",                 sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "MCB",   name: "MCB Bank Ltd",                    sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "MEBL",  name: "Meezan Bank Ltd",                 sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "BAHL",  name: "Bank Al-Habib Ltd",               sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "BAFL",  name: "Bank Alfalah Ltd",                sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "NBP",   name: "National Bank of Pakistan",       sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "FABL",  name: "Faysal Bank Ltd",                 sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "BOP",   name: "Bank of Punjab",                  sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "AKBL",  name: "Askari Bank Ltd",                 sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "ABL",   name: "Allied Bank Ltd",                 sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "BIPL",  name: "BankIslami Pakistan Ltd",         sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "JSBL",  name: "JS Bank Ltd",                     sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "SNBL",  name: "Summit Bank Ltd",                 sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "SCB",   name: "Standard Chartered Bank",         sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "SILKB", name: "Silkbank Ltd",                    sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "SMBL",  name: "SME Bank Ltd",                    sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "MYBL",  name: "MY Bank Ltd",                     sector: "Commercial Banks",  type: "Stock", exchange: "PSX", country: "PK" },
  // Fertilizers
  { symbol: "FFC",   name: "Fauji Fertilizer Co.",            sector: "Fertilizer",        type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "FFBL",  name: "Fauji Fertilizer Bin Qasim",     sector: "Fertilizer",        type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "FATIMA",name: "Fatima Fertilizer Co.",           sector: "Fertilizer",        type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "ENGRO", name: "Engro Corporation Ltd",           sector: "Fertilizer",        type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "EFERT", name: "Engro Fertilizers Ltd",          sector: "Fertilizer",        type: "Stock", exchange: "PSX", country: "PK" },
  // Cement
  { symbol: "LUCK",  name: "Lucky Cement Ltd",               sector: "Cement",            type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "ACPL",  name: "Attock Cement Ltd",              sector: "Cement",            type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "DGKC",  name: "DG Khan Cement Co.",             sector: "Cement",            type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "CHCC",  name: "Cherat Cement Co.",              sector: "Cement",            type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "MLCF",  name: "Maple Leaf Cement Factory",      sector: "Cement",            type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "KOHC",  name: "Kohat Cement Co.",               sector: "Cement",            type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "FCCL",  name: "Fauji Cement Co.",               sector: "Cement",            type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "GWLC",  name: "Gharibwal Cement Ltd",           sector: "Cement",            type: "Stock", exchange: "PSX", country: "PK" },
  // Power
  { symbol: "HUBC",  name: "Hub Power Co.",                  sector: "Power",             type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "KAPCO", name: "Kot Addu Power Co.",             sector: "Power",             type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "KEL",   name: "K-Electric Ltd",                 sector: "Power",             type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "FNEL",  name: "Fatima Energy Ltd",              sector: "Power",             type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "CNERGY",name: "Cnergyico PK Ltd",               sector: "Power",             type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "PAEL",  name: "Pak Elektron Ltd",               sector: "Engineering",       type: "Stock", exchange: "PSX", country: "PK" },
  // Tech
  { symbol: "TRG",   name: "TRG Pakistan Ltd",               sector: "Technology",        type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "SYS",   name: "Systems Ltd",                    sector: "Technology",        type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "NETSOL",name: "NetSol Technologies",             sector: "Technology",        type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "TELE",  name: "Telecard Ltd",                   sector: "Technology",        type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "PMCL",  name: "Pakistan Mobile Communications", sector: "Technology",        type: "Stock", exchange: "PSX", country: "PK" },
  // Steel
  { symbol: "ASL",   name: "Amreli Steels Ltd",              sector: "Steel",             type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "ISL",   name: "International Steels Ltd",       sector: "Steel",             type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "DSIL",  name: "Dost Steels Ltd",                sector: "Steel",             type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "MUGHAL",name: "Mughal Iron & Steel",            sector: "Steel",             type: "Stock", exchange: "PSX", country: "PK" },
  // Pharma
  { symbol: "SEARL", name: "The Searle Co.",                 sector: "Pharmaceuticals",   type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "GLAXO", name: "GlaxoSmithKline Pakistan",       sector: "Pharmaceuticals",   type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "ABOT",  name: "Abbott Laboratories Pakistan",   sector: "Pharmaceuticals",   type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "HINOON",name: "Hinopak Motors Ltd",             sector: "Automobiles",       type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "HCAR",  name: "Honda Atlas Cars",               sector: "Automobiles",       type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "INDU",  name: "Indus Motor Co.",                sector: "Automobiles",       type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "PSMC",  name: "Pak Suzuki Motor Co.",           sector: "Automobiles",       type: "Stock", exchange: "PSX", country: "PK" },
  // Textile
  { symbol: "NML",   name: "Nishat Mills Ltd",               sector: "Textile",           type: "Stock", exchange: "PSX", country: "PK" },
  { symbol: "NCL",   name: "Nishat Chunian Ltd",             sector: "Textile",           type: "Stock", exchange: "PSX", country: "PK" },
  // Indices
  { symbol: "KSE100",name: "KSE-100 Index",                  sector: "Index",             type: "Index", exchange: "PSX", country: "PK" },
  { symbol: "KSE30", name: "KSE-30 Index",                   sector: "Index",             type: "Index", exchange: "PSX", country: "PK" },
  { symbol: "KMI30", name: "KMI-30 Index",                   sector: "Index",             type: "Index", exchange: "PSX", country: "PK" },
  { symbol: "KMIALL",name: "KMI All Share Index",            sector: "Index",             type: "Index", exchange: "PSX", country: "PK" },
  { symbol: "KSEALL",name: "KSE All Share Index",            sector: "Index",             type: "Index", exchange: "PSX", country: "PK" },
];

// Popular international symbols for instant search results
const INTL_POPULAR = [
  { symbol: "AAPL",  name: "Apple Inc.",              type: "Stock", exchange: "NASDAQ", country: "US" },
  { symbol: "MSFT",  name: "Microsoft Corporation",   type: "Stock", exchange: "NASDAQ", country: "US" },
  { symbol: "GOOGL", name: "Alphabet Inc.",            type: "Stock", exchange: "NASDAQ", country: "US" },
  { symbol: "AMZN",  name: "Amazon.com Inc.",          type: "Stock", exchange: "NASDAQ", country: "US" },
  { symbol: "META",  name: "Meta Platforms Inc.",      type: "Stock", exchange: "NASDAQ", country: "US" },
  { symbol: "NVDA",  name: "NVIDIA Corporation",       type: "Stock", exchange: "NASDAQ", country: "US" },
  { symbol: "TSLA",  name: "Tesla Inc.",               type: "Stock", exchange: "NASDAQ", country: "US" },
  { symbol: "NFLX",  name: "Netflix Inc.",             type: "Stock", exchange: "NASDAQ", country: "US" },
  { symbol: "JPM",   name: "JPMorgan Chase & Co.",     type: "Stock", exchange: "NYSE",   country: "US" },
  { symbol: "BRK.B", name: "Berkshire Hathaway Inc.",  type: "Stock", exchange: "NYSE",   country: "US" },
  { symbol: "SPY",   name: "S&P 500 ETF",              type: "ETF",   exchange: "NYSE",   country: "US" },
  { symbol: "QQQ",   name: "Nasdaq 100 ETF",           type: "ETF",   exchange: "NASDAQ", country: "US" },
  { symbol: "EUR/USD","name":"Euro / US Dollar",        type: "Forex", exchange: "FX",     country: "" },
  { symbol: "GBP/USD","name":"British Pound / US Dollar",type:"Forex", exchange: "FX",    country: "" },
  { symbol: "USD/JPY","name":"US Dollar / Japanese Yen",type:"Forex",  exchange: "FX",    country: "" },
  { symbol: "XAU/USD","name":"Gold / US Dollar",        type: "Commodity",exchange:"FOREX",country:"" },
  { symbol: "XAG/USD","name":"Silver / US Dollar",      type: "Commodity",exchange:"FOREX",country:"" },
  { symbol: "BTC/USD","name":"Bitcoin / US Dollar",     type: "Crypto",exchange:"CRYPTO", country:"" },
  { symbol: "ETH/USD","name":"Ethereum / US Dollar",    type: "Crypto",exchange:"CRYPTO", country:"" },
];

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const category = req.nextUrl.searchParams.get("category") ?? "All";

  if (!q) {
    // Return popular symbols
    const popular = [
      ...PSX_SYMBOLS.slice(0, 8).map(s => ({ ...s, dataStatus: "PSX_EOD" })),
      ...INTL_POPULAR.slice(0, 6).map(s => ({ ...s, dataStatus: "DELAYED", sector: "" })),
    ];
    return NextResponse.json({ results: popular });
  }

  const results: Array<Record<string, string>> = [];

  // Search PSX
  const psxMatches = PSX_SYMBOLS.filter(s =>
    s.symbol.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    s.sector.toLowerCase().includes(q)
  ).map(s => ({ ...s, dataStatus: "PSX_EOD" }));

  // Search local international
  const intlMatches = INTL_POPULAR.filter(s =>
    s.symbol.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    s.type.toLowerCase().includes(q)
  ).map(s => ({ ...s, dataStatus: "DELAYED", sector: "" }));

  // Try Twelve Data search for international
  let tdResults: Array<Record<string, string>> = [];
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (apiKey && q.length >= 2) {
    try {
      const res = await fetch(
        `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(q)}&outputsize=10&apikey=${apiKey}`,
        { next: { revalidate: 300 } }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          tdResults = json.data
            .filter((d: Record<string, string>) => d.country !== "Pakistan")
            .slice(0, 8)
            .map((d: Record<string, string>) => ({
              symbol: d.symbol,
              name: d.instrument_name,
              type: d.instrument_type,
              exchange: d.exchange,
              country: d.country,
              sector: d.exchange_timezone ?? "",
              dataStatus: "DELAYED",
            }));
        }
      }
    } catch { /* no-op */ }
  }

  // Merge — PSX first, then intl local matches, then TD results (dedup)
  const seen = new Set<string>();
  for (const r of [...psxMatches, ...intlMatches, ...tdResults]) {
    const key = r.symbol;
    if (!seen.has(key)) { seen.add(key); results.push(r as Record<string, string>); }
  }

  // Category filter
  const filtered = category === "All" ? results : results.filter(r => {
    if (category === "Pakistan") return r.country === "PK";
    if (category === "International") return r.country !== "PK";
    if (category === "Stocks") return r.type === "Stock";
    if (category === "Indices") return r.type === "Index";
    if (category === "Pakistani Banks") return r.country === "PK" && r.sector === "Commercial Banks";
    if (category === "Forex") return r.type === "Forex";
    if (category === "Commodities") return r.type === "Commodity";
    if (category === "Crypto") return r.type === "Crypto";
    return true;
  });

  return NextResponse.json({ results: filtered.slice(0, 30) });
}
