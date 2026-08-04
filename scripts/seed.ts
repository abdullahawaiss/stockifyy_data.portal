import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isWeekend } from "date-fns";
dotenv.config({ path: ".env.local" });

import * as schema from "../src/db/schema";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema });

const SECTORS = [
  { name: "Oil & Gas", code: "OIL_GAS" },
  { name: "Banking", code: "BANKING" },
  { name: "Fertilizer", code: "FERTILIZER" },
  { name: "Power Generation", code: "POWER" },
  { name: "Cement", code: "CEMENT" },
  { name: "Textile", code: "TEXTILE" },
  { name: "Pharmaceutical", code: "PHARMA" },
  { name: "Technology", code: "TECH" },
];

const COMPANIES = [
  { symbol: "OGDC", name: "Oil & Gas Development Company", sector: "OIL_GAS", shariah: "non_compliant" as const },
  { symbol: "PPL", name: "Pakistan Petroleum Limited", sector: "OIL_GAS", shariah: "non_compliant" as const },
  { symbol: "HBL", name: "Habib Bank Limited", sector: "BANKING", shariah: "non_compliant" as const },
  { symbol: "UBL", name: "United Bank Limited", sector: "BANKING", shariah: "non_compliant" as const },
  { symbol: "MCB", name: "MCB Bank Limited", sector: "BANKING", shariah: "non_compliant" as const },
  { symbol: "EFERT", name: "Engro Fertilizers Limited", sector: "FERTILIZER", shariah: "compliant" as const },
  { symbol: "ENGRO", name: "Engro Corporation Limited", sector: "FERTILIZER", shariah: "compliant" as const },
  { symbol: "HUBC", name: "Hub Power Company", sector: "POWER", shariah: "compliant" as const },
  { symbol: "LUCK", name: "Lucky Cement Limited", sector: "CEMENT", shariah: "compliant" as const },
  { symbol: "DGKC", name: "DG Khan Cement Company", sector: "CEMENT", shariah: "compliant" as const },
  { symbol: "NML", name: "Nishat Mills Limited", sector: "TEXTILE", shariah: "compliant" as const },
  { symbol: "SEARL", name: "Searle Pakistan Limited", sector: "PHARMA", shariah: "compliant" as const },
  { symbol: "SYS", name: "Systems Limited", sector: "TECH", shariah: "compliant" as const },
  { symbol: "PNSC", name: "Pakistan National Shipping Corp", sector: "OIL_GAS", shariah: "compliant" as const },
  { symbol: "PSO", name: "Pakistan State Oil", sector: "OIL_GAS", shariah: "non_compliant" as const },
];

const INDICES = [
  { code: "KSE-100", name: "KSE 100 Index" },
  { code: "KSE-30", name: "KSE 30 Index" },
  { code: "KMI-30", name: "KMI 30 Index" },
  { code: "ALLSHR", name: "KSE All Share Index" },
];

function randBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function genDailyOHLC(base: number) {
  const change = randBetween(-0.03, 0.04);
  const close = +(base * (1 + change)).toFixed(2);
  const spread = Math.abs(base * 0.02);
  const high = +(Math.max(base, close) + randBetween(0, spread)).toFixed(2);
  const low = +(Math.min(base, close) - randBetween(0, spread)).toFixed(2);
  const open = +(base * (1 + randBetween(-0.01, 0.01))).toFixed(2);
  const volume = Math.round(randBetween(100000, 5000000));
  const avgPrice = +((open + high + low + close) / 4).toFixed(2);
  const marketValue = +(volume * avgPrice).toFixed(2);
  const trades = Math.round(randBetween(500, 20000));
  const priceChange = +(close - base).toFixed(2);
  const pctChange = +((priceChange / base) * 100).toFixed(2);
  return { open, high, low, close, volume, marketValue, trades, avgPrice, priceChange, pctChange };
}

async function main() {
  console.log("🌱 Seeding database with demo data...");

  // Seed admin user
  const hash = await bcrypt.hash("admin123", 10);
  await db.insert(schema.users).values({
    email: "admin@stockifyy.com",
    passwordHash: hash,
    fullName: "Stockifyy Admin",
    role: "super_admin",
  }).onConflictDoNothing();
  await db.insert(schema.users).values({
    email: "demo@stockifyy.com",
    passwordHash: await bcrypt.hash("demo123", 10),
    fullName: "Demo User",
    role: "analyst",
  }).onConflictDoNothing();
  console.log("✅ Users seeded");

  // Sectors
  const sectorRows = await db.insert(schema.sectors).values(
    SECTORS.map(s => ({ name: s.name, code: s.code }))
  ).onConflictDoNothing().returning();
  const sectorMap = new Map(sectorRows.map(s => [s.code, s.id]));
  console.log("✅ Sectors seeded");

  // Indices
  const indexRows = await db.insert(schema.indices).values(INDICES).onConflictDoNothing().returning();
  const indexMap = new Map(indexRows.map(i => [i.code, i.id]));
  console.log("✅ Indices seeded");

  // Companies
  const companyInserts = COMPANIES.map(c => ({
    symbol: c.symbol,
    name: c.name,
    sectorId: sectorMap.get(c.sector) ?? null,
    shariahStatus: c.shariah,
    listingDate: "2010-01-01",
    isActive: true,
  }));
  const companyRows = await db.insert(schema.companies).values(companyInserts).onConflictDoNothing().returning();
  const companyMap = new Map(companyRows.map(c => [c.symbol, c]));
  console.log("✅ Companies seeded");

  // Trading calendar — last 6 weeks of trading days
  const today = new Date();
  const startDate = addDays(today, -42);
  const allDays = eachDayOfInterval({ start: startDate, end: today });
  const tradingDays = allDays.filter(d => !isWeekend(d));
  await db.insert(schema.tradingCalendar).values(
    tradingDays.map(d => ({ tradingDate: format(d, "yyyy-MM-dd"), isTrading: true }))
  ).onConflictDoNothing();
  console.log(`✅ Trading calendar seeded (${tradingDays.length} days)`);

  // Batch
  const [batch] = await db.insert(schema.importBatches).values({
    importType: "daily_stock_prices",
    fileName: "demo_seed.csv",
    status: "completed",
    totalRows: tradingDays.length * COMPANIES.length,
    processedRows: tradingDays.length * COMPANIES.length,
  }).returning();

  // Daily prices
  const basePrices: Record<string, number> = {
    OGDC: 165, PPL: 98, HBL: 155, UBL: 220, MCB: 190,
    EFERT: 95, ENGRO: 340, HUBC: 82, LUCK: 780, DGKC: 105,
    NML: 128, SEARL: 210, SYS: 650, PNSC: 72, PSO: 310,
  };

  const dailyPriceInserts = [];
  for (const symbol of Object.keys(basePrices)) {
    let price = basePrices[symbol];
    const company = companyMap.get(symbol);
    if (!company) continue;
    for (const day of tradingDays) {
      const d = genDailyOHLC(price);
      price = d.close;
      dailyPriceInserts.push({
        companyId: company.id,
        symbol,
        tradingDate: format(day, "yyyy-MM-dd"),
        open: String(d.open),
        high: String(d.high),
        low: String(d.low),
        close: String(d.close),
        previousClose: String(price),
        priceChange: String(d.priceChange),
        percentageChange: String(d.pctChange),
        volume: String(d.volume),
        marketValue: String(d.marketValue),
        numberOfTrades: d.trades,
        averagePrice: String(d.avgPrice),
        weekHigh52: String(+(d.high * 1.2).toFixed(2)),
        weekLow52: String(+(d.low * 0.8).toFixed(2)),
        dataSource: "demo_data" as const,
        importBatchId: batch.id,
        isDemo: true,
      });
    }
  }

  // Insert in chunks
  for (let i = 0; i < dailyPriceInserts.length; i += 200) {
    await db.insert(schema.dailyStockPrices).values(dailyPriceInserts.slice(i, i + 200)).onConflictDoNothing();
  }
  console.log(`✅ Daily prices seeded (${dailyPriceInserts.length} records)`);

  // Daily index values
  let kse100 = 78000;
  for (const day of tradingDays) {
    const change = randBetween(-0.02, 0.025);
    kse100 = +(kse100 * (1 + change)).toFixed(2);
    const spread = Math.abs(kse100 * 0.01);
    for (const [code, indexId] of indexMap) {
      const multiplier = code === "KSE-100" ? 1 : code === "KSE-30" ? 0.62 : code === "KMI-30" ? 0.58 : 0.95;
      const val = +(kse100 * multiplier).toFixed(2);
      await db.insert(schema.dailyIndexValues).values({
        indexId,
        indexCode: code,
        tradingDate: format(day, "yyyy-MM-dd"),
        open: String(+(val * 0.998).toFixed(2)),
        high: String(+(val + spread).toFixed(2)),
        low: String(+(val - spread).toFixed(2)),
        close: String(val),
        previousClose: String(+(val * (1 - change)).toFixed(2)),
        change: String(+(val * change).toFixed(2)),
        percentageChange: String(+(change * 100).toFixed(2)),
        dataSource: "demo_data" as const,
        isDemo: true,
      }).onConflictDoNothing();
    }
  }
  console.log("✅ Index values seeded");

  // Announcements
  const announcementData = [
    { symbol: "OGDC", type: "financial_result", title: "OGDC - Financial Results for Q3 2025-26", date: format(addDays(today, -5), "yyyy-MM-dd") },
    { symbol: "HBL", type: "dividend", title: "HBL - Interim Dividend Declaration", date: format(addDays(today, -3), "yyyy-MM-dd") },
    { symbol: "LUCK", type: "board_meeting", title: "LUCK - Board Meeting Notice", date: format(addDays(today, -7), "yyyy-MM-dd") },
    { symbol: "ENGRO", type: "material_info", title: "ENGRO - Expansion Project Update", date: format(addDays(today, -2), "yyyy-MM-dd") },
    { symbol: "SYS", type: "financial_result", title: "SYS - Annual Financial Results", date: format(addDays(today, -10), "yyyy-MM-dd") },
  ];
  for (const a of announcementData) {
    const co = companyMap.get(a.symbol);
    await db.insert(schema.companyAnnouncements).values({
      companyId: co?.id ?? null,
      symbol: a.symbol,
      announcementType: a.type,
      title: a.title,
      content: `This is a demo announcement for ${a.symbol}. All data is for demonstration purposes only and does not represent actual market information.`,
      announcementDate: a.date,
      isPublic: true,
      isDemo: true,
    }).onConflictDoNothing();
  }

  // Research reports
  await db.insert(schema.researchReports).values([
    {
      title: "Weekly Market Report - Stockifyy Research",
      reportType: "weekly_market",
      author: "Stockifyy Research Team",
      publicationDate: format(today, "yyyy-MM-dd"),
      summary: "Demo weekly market report. All data is for demonstration purposes.",
      isPublic: true,
      isDemo: true,
      tags: "weekly,market,demo",
    },
    {
      title: "OGDC - Company Analysis Report",
      reportType: "company_analysis",
      author: "Stockifyy Research Team",
      publicationDate: format(addDays(today, -7), "yyyy-MM-dd"),
      summary: "Demo company analysis for OGDC. Not actual research.",
      relatedSymbol: "OGDC",
      isPublic: true,
      isDemo: true,
      tags: "company,oil,demo",
    },
  ]).onConflictDoNothing();

  console.log("✅ Announcements and reports seeded");
  console.log("\n🎉 Demo data seeded successfully!");
  console.log("   Admin: admin@stockifyy.com / admin123");
  console.log("   Demo:  demo@stockifyy.com / demo123");
  await client.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
