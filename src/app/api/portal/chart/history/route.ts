import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyStockPrices, dailyIndexValues } from "@/db/schema";
import { eq, and, gte, lte, asc, desc } from "drizzle-orm";

/* Generate synthetic daily candles going back `days` from today using a
   seeded random walk anchored to `latestClose`. Used when no real history
   exists so the chart always renders something meaningful. */
function generateSyntheticHistory(latestClose: number, days = 500): Candle[] {
  const candles: Candle[] = [];
  const msPerDay = 86400 * 1000;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Walk backwards from today to get prices, then reverse
  const prices: number[] = [latestClose];
  let price = latestClose;
  // Typical PSX daily volatility ~1–2 %
  const vol = 0.015;
  for (let i = 1; i < days; i++) {
    const drift = (Math.random() - 0.499) * 2 * vol;
    price = Math.max(price * (1 + drift), 0.01);
    prices.push(price);
  }
  prices.reverse(); // oldest first

  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - (days - 1 - i) * msPerDay);
    const day = date.getDay();
    if (day === 0 || day === 6) continue; // skip weekends
    const close = prices[i];
    const swing = close * 0.012;
    const open  = close + (Math.random() - 0.5) * swing;
    const high  = Math.max(open, close) + Math.random() * swing;
    const low   = Math.min(open, close) - Math.random() * swing;
    candles.push({
      time:   Math.floor(date.getTime() / 1000),
      open:   parseFloat(open.toFixed(2)),
      high:   parseFloat(high.toFixed(2)),
      low:    Math.max(parseFloat(low.toFixed(2)), 0.01),
      close:  parseFloat(close.toFixed(2)),
      volume: Math.floor(500_000 + Math.random() * 4_500_000),
    });
  }
  return candles;
}

/* Hardcoded fallback prices for PSX indices & top stocks when DB is empty */
const DEFAULT_PRICES: Record<string, number> = {
  KSE100: 115000, KSE30: 38000, KMI30: 42000, KSEALL: 82000, KMIALL: 52000,
  OGDC: 185,  PPL: 92,   MARI: 2250, POL: 515,  PSO: 310,
  SNGP: 52,   SSGC: 28,  APL: 490,  HBL: 215,  UBL: 310,
  MCB: 210,   MEBL: 185, BAHL: 88,  BAFL: 54,  NBP: 55,
  FABL: 42,   BOP: 14,   AKBL: 22,  ABL: 125,  FFC: 130,
  FFBL: 18,   ENGRO: 285,EFERT: 92, LUCK: 890, ACPL: 195,
  DGKC: 95,   CHCC: 145, MLCF: 58,  KOHC: 145, FCCL: 28,
  HUBC: 155,  KAPCO: 48, KEL: 5,    PAEL: 30,  TRG: 145,
  SYS: 680,   NETSOL: 82,ISL: 155,  MUGHAL: 82,SEARL: 125,
  GLAXO: 155, ABOT: 850, NML: 185,  NCL: 62,
};

/* Try to get the latest single-day close from DB for a PSX stock/index */
async function fetchLatestPrice(symbol: string): Promise<number | null> {
  try {
    const isIndex = ["KSE100","KSE30","KMI30","KMIALL","KSEALL"].includes(symbol);
    if (isIndex) {
      const r = await db.select({ close: dailyIndexValues.close })
        .from(dailyIndexValues).where(eq(dailyIndexValues.indexCode, symbol))
        .orderBy(desc(dailyIndexValues.tradingDate)).limit(1);
      if (r[0]?.close) return parseFloat(String(r[0].close));
    } else {
      const r = await db.select({ close: dailyStockPrices.close })
        .from(dailyStockPrices).where(eq(dailyStockPrices.symbol, symbol))
        .orderBy(desc(dailyStockPrices.tradingDate)).limit(1);
      if (r[0]?.close) return parseFloat(String(r[0].close));
    }
  } catch { /* ignore */ }
  // Fall back to hardcoded defaults
  return DEFAULT_PRICES[symbol] ?? null;
}

export const dynamic = "force-dynamic";

// PSX index symbol mapping
const PSX_INDICES: Record<string, string> = {
  "KSE100": "KSE 100",
  "KSE30": "KSE 30",
  "KMI30": "KMI 30",
  "KMIALL": "KMI All Share",
  "KSEALL": "KSE All Share",
};

async function fetchFromTwelveData(
  symbol: string, interval: string, outputsize: number
): Promise<{ candles: Candle[]; status: string; provider: string } | null> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return null;

  // Map our intervals to Twelve Data intervals
  const intervalMap: Record<string, string> = {
    "1m": "1min", "5m": "5min", "15m": "15min", "30m": "30min",
    "1h": "1h", "D": "1day", "W": "1week", "M": "1month",
  };
  const tdInterval = intervalMap[interval] ?? "1day";

  try {
    const url = new URL("https://api.twelvedata.com/time_series");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", tdInterval);
    url.searchParams.set("outputsize", String(Math.min(outputsize, 5000)));
    url.searchParams.set("timezone", "UTC");
    url.searchParams.set("apikey", apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status === "error" || !json.values) return null;

    const candles: Candle[] = json.values
      .map((v: Record<string, string>) => ({
        time: Math.floor(new Date(v.datetime).getTime() / 1000),
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseFloat(v.volume ?? "0"),
      }))
      .filter((c: Candle) => !isNaN(c.open) && c.open > 0)
      .reverse();

    // Twelve Data free tier is 15-min delayed for intraday, 1-day delay for EOD
    const isIntraday = ["1m", "5m", "15m", "30m", "1h"].includes(interval);
    const status = isIntraday ? "DELAYED_15MIN" : "DELAYED_1DAY";

    return { candles, status, provider: "twelve_data" };
  } catch {
    return null;
  }
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

async function fetchPsxHistory(symbol: string, fromDate?: string, toDate?: string): Promise<{
  candles: Candle[]; status: string; provider: string;
} | null> {
  try {
    // Check if it's an index
    const isIndex = Object.keys(PSX_INDICES).includes(symbol.toUpperCase());

    if (isIndex) {
      const indexCode = symbol.toUpperCase();
      const rows = await db
        .select()
        .from(dailyIndexValues)
        .where(
          and(
            eq(dailyIndexValues.indexCode, indexCode),
            fromDate ? gte(dailyIndexValues.tradingDate, fromDate) : undefined,
            toDate ? lte(dailyIndexValues.tradingDate, toDate) : undefined,
          )
        )
        .orderBy(asc(dailyIndexValues.tradingDate))
        .limit(2000);

      if (!rows.length) return null;

      const candles: Candle[] = rows.map(r => ({
        time: Math.floor(new Date(r.tradingDate).getTime() / 1000),
        open: parseFloat(String(r.open ?? r.close ?? 0)),
        high: parseFloat(String(r.high ?? r.close ?? 0)),
        low: parseFloat(String(r.low ?? r.close ?? 0)),
        close: parseFloat(String(r.close ?? 0)),
        volume: parseFloat(String(r.volume ?? 0)),
      })).filter(c => c.close > 0);

      return { candles, status: "PSX_EOD", provider: "psx_db" };
    }

    // Stock symbol
    const rows = await db
      .select()
      .from(dailyStockPrices)
      .where(
        and(
          eq(dailyStockPrices.symbol, symbol.toUpperCase()),
          fromDate ? gte(dailyStockPrices.tradingDate, fromDate) : undefined,
          toDate ? lte(dailyStockPrices.tradingDate, toDate) : undefined,
        )
      )
      .orderBy(asc(dailyStockPrices.tradingDate))
      .limit(2000);

    if (!rows.length) return null;

    const candles: Candle[] = rows.map(r => ({
      time: Math.floor(new Date(r.tradingDate).getTime() / 1000),
      open: parseFloat(String(r.open ?? r.close ?? 0)),
      high: parseFloat(String(r.high ?? r.close ?? 0)),
      low: parseFloat(String(r.low ?? r.close ?? 0)),
      close: parseFloat(String(r.close ?? 0)),
      volume: parseFloat(String(r.volume ?? 0)),
    })).filter(c => c.close > 0);

    return { candles, status: "PSX_EOD", provider: "psx_db" };
  } catch {
    return null;
  }
}

// Known PSX symbols from heatmap data — used to decide routing
const PSX_SYMBOLS = new Set([
  "PPL","OGDC","MARI","POL","GHPL","PARCO","PSO","SNGP","SSGC","APL","HASCOL","SHEL","HCAR","INDU","PSMC","GHANDHARA","MTL","HINOON","PIAA","AICL","KAPCO","HUBC","NPBL","NCPL","LALPIR","PKGP","FNEL","KEL","CEPB","LTIA","PAEL","TPL","ATRL","CNERGY","NPL","FFL","BYCO","NRL","PRL","AHCL","FFC","FFBL","FATIMA","ENGRO","EFERT","EFOODS","DAWH","PIBTL","ICL","LUCK","ACPL","DGKC","CHCC","MLCF","KOHC","FECTC","GWLC","THCCL","FCCL","HBL","UBL","MCB","MEBL","BAHL","BAFL","NBP","FABL","BOP","AKBL","ABL","BIPL","JSBL","SNBL","SCB","SILKB","SMBL","TPBL","MYBL","KASB","NEXT","PMCL","AVN","TEFLON","TRG","SYS","NETSOL","PCRW","TELE","ASL","ISL","DSIL","INIL","AGL","MUGHAL","AJL","ASTL","AGAML","AMTEX","NCL","NML","ILP","GATI","DTML","CLCPS","ARPL","CCEL","FASM","SAIF","KOTML","SML","SLGL","JSCL","CITI","NRSL","BECO","COLG","SEARL","GLAXO","ABOT","FEROZ","HIGHN","IBFL","SPEL","LPL","SFL","DOTM","HINOPAK","SFML","NCML","UNITY","FDIMC","MTIL","TRIPF","TGL","GHNI","MTAL","BERG","PACE","SGIT","PIOC","TPLP","GCIL","OTSU","PRWM","SELECT","BOP","FPJM","WASL","MACFL","SNBL","KTML","GRR","DCL","CLOV","ISL","STPL","PAEL","BFBIO","CPHL","TPLRF1","ADOS"
]);

function isPsxSymbol(symbol: string): boolean {
  const up = symbol.toUpperCase();
  // Explicitly include known PSX index codes (contain digits so regex won't catch them)
  if (Object.keys(PSX_INDICES).includes(up)) return true;
  return PSX_SYMBOLS.has(up) || (/^[A-Z]{2,8}$/.test(up) && !up.includes("."));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol")?.toUpperCase() ?? "";
  const interval = searchParams.get("interval") ?? "D";
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const outputsize = parseInt(searchParams.get("outputsize") ?? "500");

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  // Route PSX symbols to DB, others to Twelve Data
  if (isPsxSymbol(symbol)) {
    if (interval !== "D" && interval !== "W" && interval !== "M") {
      // Intraday not available for PSX in our DB
      return NextResponse.json({
        candles: [], status: "PSX_INTRADAY_NOT_AVAILABLE",
        provider: "psx_db", message: "PSX intraday data requires a commercial feed licence.",
      });
    }
    const result = await fetchPsxHistory(symbol, from, to);
    if (result && result.candles.length > 0) {
      return NextResponse.json(result);
    }
    // Try Twelve Data as fallback for PSX symbols
    const intlResult = await fetchFromTwelveData(symbol, interval, outputsize);
    if (intlResult) return NextResponse.json(intlResult);

    // Last resort: generate synthetic history from latest known price
    const latestPrice = await fetchLatestPrice(symbol);
    if (latestPrice && latestPrice > 0) {
      return NextResponse.json({
        candles: generateSyntheticHistory(latestPrice, 500),
        status: "SYNTHETIC", provider: "psx_db",
      });
    }

    // Symbol not found anywhere — return empty silently
    return NextResponse.json({ candles: [], status: "NO_DATA", provider: "psx_db" });
  }

  // International symbol — try Twelve Data
  const result = await fetchFromTwelveData(symbol, interval, outputsize);
  if (result) return NextResponse.json(result);

  // Synthetic fallback for international too (based on any stored price)
  const latestPrice = await fetchLatestPrice(symbol);
  if (latestPrice && latestPrice > 0) {
    return NextResponse.json({
      candles: generateSyntheticHistory(latestPrice, 500),
      status: "SYNTHETIC", provider: "twelve_data",
    });
  }

  return NextResponse.json({ candles: [], status: "NO_DATA", provider: "twelve_data" });
}
