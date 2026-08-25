import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyStockPrices, companies, sectors, dailyIndexValues, indices } from "@/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// ── Server-side in-memory cache (survives within the same process/request pool) ──
// Keyed by date string so stale days don't bleed through.
const _stockCache = new Map<string, { data: unknown; ts: number }>();
const STOCK_TTL = 5 * 60_000; // 5 minutes

function getCached(key: string) {
  const hit = _stockCache.get(key);
  if (hit && Date.now() - hit.ts < STOCK_TTL) return hit.data;
  return null;
}
function setCached(key: string, data: unknown) {
  _stockCache.set(key, { data, ts: Date.now() });
}

// ── Demo stocks for fallback (300+ PSX listed securities) ────────────
const DEMO_STOCKS = [
  // ── Oil & Gas Exploration ──────────────────────────────────────────
  { symbol:"OGDC",    name:"Oil & Gas Development Company",          sector:"Oil & Gas Exploration",           close:181.50, chg:-1.20, pct:-0.66, vol:4200000,  val:762000000  },
  { symbol:"PPL",     name:"Pakistan Petroleum Limited",             sector:"Oil & Gas Exploration",           close:89.30,  chg:-0.70, pct:-0.78, vol:3100000,  val:277000000  },
  { symbol:"MARI",    name:"Mari Petroleum Company",                 sector:"Oil & Gas Exploration",           close:2210.0, chg:15.0,  pct:0.68,  vol:280000,   val:619000000  },
  { symbol:"POL",     name:"Pakistan Oilfields Limited",             sector:"Oil & Gas Exploration",           close:510.0,  chg:2.50,  pct:0.49,  vol:310000,   val:158000000  },
  { symbol:"GHOL",    name:"Gulf Husain Oil Limited",                sector:"Oil & Gas Exploration",           close:12.40,  chg:-0.10, pct:-0.80, vol:1200000,  val:15000000   },
  { symbol:"PKTU",    name:"Pak-Arab Pipeline Company",              sector:"Oil & Gas Exploration",           close:8.90,   chg:0.05,  pct:0.56,  vol:900000,   val:8000000    },
  // ── Oil & Gas Marketing ───────────────────────────────────────────
  { symbol:"PSO",     name:"Pakistan State Oil Company",             sector:"Oil & Gas Marketing Companies",   close:478.0,  chg:4.50,  pct:0.95,  vol:1800000,  val:860000000  },
  { symbol:"APL",     name:"Attock Petroleum Limited",               sector:"Oil & Gas Marketing Companies",   close:718.0,  chg:5.20,  pct:0.73,  vol:220000,   val:158000000  },
  { symbol:"HASCOL",  name:"Hascol Petroleum Limited",               sector:"Oil & Gas Marketing Companies",   close:6.40,   chg:-0.10, pct:-1.54, vol:4100000,  val:26000000   },
  { symbol:"SSGC",    name:"Sui Southern Gas Company",               sector:"Oil & Gas Marketing Companies",   close:19.20,  chg:0.30,  pct:1.59,  vol:8300000,  val:159000000  },
  { symbol:"SNGP",    name:"Sui Northern Gas Pipelines",             sector:"Oil & Gas Marketing Companies",   close:28.10,  chg:0.40,  pct:1.44,  vol:5600000,  val:157000000  },
  // ── Refinery ─────────────────────────────────────────────────────
  { symbol:"ATRL",    name:"Attock Refinery Limited",                sector:"Refinery",                        close:348.0,  chg:2.50,  pct:0.72,  vol:290000,   val:101000000  },
  { symbol:"NRL",     name:"National Refinery Limited",              sector:"Refinery",                        close:612.0,  chg:4.0,   pct:0.66,  vol:120000,   val:73000000   },
  { symbol:"PARCO",   name:"Pak-Arab Refinery Limited",              sector:"Refinery",                        close:37.50,  chg:0.30,  pct:0.81,  vol:1400000,  val:53000000   },
  { symbol:"BYCO",    name:"Byco Petroleum Pakistan",                sector:"Refinery",                        close:5.80,   chg:-0.05, pct:-0.86, vol:6200000,  val:36000000   },
  { symbol:"OLPL",    name:"Oman Lubricants Pakistan",               sector:"Refinery",                        close:49.95,  chg:-0.03, pct:-0.06, vol:620000,   val:31000000   },
  // ── Commercial Banks ──────────────────────────────────────────────
  { symbol:"HBL",     name:"Habib Bank Limited",                     sector:"Commercial Banks",                close:178.50, chg:1.80,  pct:1.02,  vol:5800000,  val:1035000000 },
  { symbol:"UBL",     name:"United Bank Limited",                    sector:"Commercial Banks",                close:232.40, chg:2.10,  pct:0.91,  vol:2900000,  val:674000000  },
  { symbol:"MCB",     name:"MCB Bank Limited",                       sector:"Commercial Banks",                close:219.80, chg:-1.50, pct:-0.68, vol:2400000,  val:527000000  },
  { symbol:"NBP",     name:"National Bank of Pakistan",              sector:"Commercial Banks",                close:43.20,  chg:0.30,  pct:0.70,  vol:9200000,  val:397000000  },
  { symbol:"ABL",     name:"Allied Bank Limited",                    sector:"Commercial Banks",                close:136.70, chg:0.90,  pct:0.66,  vol:1800000,  val:246000000  },
  { symbol:"BAHL",    name:"Bank Al Habib Limited",                  sector:"Commercial Banks",                close:91.50,  chg:-0.40, pct:-0.44, vol:2100000,  val:192000000  },
  { symbol:"MEBL",    name:"Meezan Bank Limited",                    sector:"Commercial Banks",                close:218.50, chg:1.80,  pct:0.83,  vol:3200000,  val:699000000  },
  { symbol:"AKBL",    name:"Askari Bank Limited",                    sector:"Commercial Banks",                close:28.40,  chg:0.20,  pct:0.71,  vol:4900000,  val:139000000  },
  { symbol:"BAFL",    name:"Bank Alfalah Limited",                   sector:"Commercial Banks",                close:54.60,  chg:0.40,  pct:0.74,  vol:7100000,  val:388000000  },
  { symbol:"PABC",    name:"Pakistan Abu Dhabi Commercial Bank",     sector:"Commercial Banks",                close:108.89, chg:-2.27, pct:-2.04, vol:1900000,  val:207000000  },
  { symbol:"BSJS",    name:"JS Bank Limited",                        sector:"Commercial Banks",                close:15.80,  chg:0.10,  pct:0.64,  vol:6800000,  val:107000000  },
  { symbol:"BANKISLAMI",name:"BankIslami Pakistan Limited",          sector:"Commercial Banks",                close:17.60,  chg:0.15,  pct:0.86,  vol:5400000,  val:95000000   },
  { symbol:"SNBL",    name:"Soneri Bank Limited",                    sector:"Commercial Banks",                close:23.80,  chg:0.20,  pct:0.85,  vol:3100000,  val:74000000   },
  { symbol:"FAYSAL",  name:"Faysal Bank Limited",                    sector:"Commercial Banks",                close:39.50,  chg:0.35,  pct:0.89,  vol:4700000,  val:186000000  },
  { symbol:"SMBL",    name:"Summit Bank Limited",                    sector:"Commercial Banks",                close:4.20,   chg:-0.05, pct:-1.18, vol:8900000,  val:37000000   },
  { symbol:"JSBL",    name:"JS Bank Limited (Pref)",                 sector:"Commercial Banks",                close:16.10,  chg:0.10,  pct:0.63,  vol:3200000,  val:52000000   },
  { symbol:"SBT",     name:"Standard Chartered Bank Pakistan",       sector:"Commercial Banks",                close:6.90,   chg:-0.05, pct:-0.72, vol:2100000,  val:14000000   },
  { symbol:"SCBPL",   name:"Standard Chartered (Pref)",              sector:"Commercial Banks",                close:7.20,   chg:0.05,  pct:0.70,  vol:1800000,  val:13000000   },
  { symbol:"BOK",     name:"Bank of Khyber",                        sector:"Commercial Banks",                close:18.40,  chg:0.20,  pct:1.10,  vol:2800000,  val:52000000   },
  { symbol:"ALBL",    name:"Al Baraka Bank Pakistan",                sector:"Commercial Banks",                close:14.60,  chg:0.10,  pct:0.69,  vol:3500000,  val:51000000   },
  { symbol:"PIBTL",   name:"Punjab & Sind Bank Pakistan",            sector:"Commercial Banks",                close:8.20,   chg:-0.10, pct:-1.21, vol:2400000,  val:20000000   },
  // ── Cement ───────────────────────────────────────────────────────
  { symbol:"LUCK",    name:"Lucky Cement Limited",                   sector:"Cement",                          close:1125.0, chg:8.50,  pct:0.76,  vol:520000,   val:585000000  },
  { symbol:"DGKC",    name:"D.G. Khan Cement Company",               sector:"Cement",                          close:97.80,  chg:-0.80, pct:-0.81, vol:1900000,  val:185000000  },
  { symbol:"ACPL",    name:"Attock Cement Pakistan Limited",         sector:"Cement",                          close:248.0,  chg:2.0,   pct:0.81,  vol:480000,   val:119000000  },
  { symbol:"CHCC",    name:"Cherat Cement Company",                  sector:"Cement",                          close:131.50, chg:-1.0,  pct:-0.75, vol:890000,   val:117000000  },
  { symbol:"PIOC",    name:"Pioneer Cement Limited",                 sector:"Cement",                          close:111.20, chg:0.70,  pct:0.63,  vol:730000,   val:81000000   },
  { symbol:"MLCF",    name:"Maple Leaf Cement Factory",              sector:"Cement",                          close:40.80,  chg:-0.40, pct:-0.97, vol:4800000,  val:196000000  },
  { symbol:"FCCL",    name:"Fauji Cement Company Limited",           sector:"Cement",                          close:22.10,  chg:0.20,  pct:0.91,  vol:7300000,  val:161000000  },
  { symbol:"KOHC",    name:"Kohat Cement Company Limited",           sector:"Cement",                          close:176.0,  chg:1.50,  pct:0.86,  vol:610000,   val:107000000  },
  { symbol:"BWCL",    name:"Bestway Cement Limited",                 sector:"Cement",                          close:312.0,  chg:2.50,  pct:0.81,  vol:380000,   val:119000000  },
  { symbol:"JVDC",    name:"Javedan Corporation Limited",            sector:"Cement",                          close:19.80,  chg:-0.20, pct:-1.00, vol:2200000,  val:44000000   },
  { symbol:"DNCC",    name:"Dandot Cement Company",                  sector:"Cement",                          close:8.10,   chg:0.10,  pct:1.25,  vol:3100000,  val:25000000   },
  { symbol:"FLYNG",   name:"Flying Cement Company",                  sector:"Cement",                          close:7.20,   chg:-0.05, pct:-0.69, vol:4800000,  val:35000000   },
  { symbol:"THCCL",   name:"Thatta Cement Company",                  sector:"Cement",                          close:5.40,   chg:0.05,  pct:0.93,  vol:2900000,  val:16000000   },
  // ── Fertilizer ───────────────────────────────────────────────────
  { symbol:"ENGRO",   name:"Engro Corporation Limited",              sector:"Fertilizer",                      close:312.50, chg:3.50,  pct:1.13,  vol:2100000,  val:656000000  },
  { symbol:"EFERT",   name:"Engro Fertilizers Limited",              sector:"Fertilizer",                      close:87.60,  chg:0.60,  pct:0.69,  vol:3800000,  val:333000000  },
  { symbol:"FFC",     name:"Fauji Fertilizer Company",               sector:"Fertilizer",                      close:139.30, chg:-0.90, pct:-0.64, vol:2700000,  val:376000000  },
  { symbol:"FFBL",    name:"Fauji Fertilizer Bin Qasim",             sector:"Fertilizer",                      close:25.10,  chg:0.20,  pct:0.80,  vol:4100000,  val:103000000  },
  { symbol:"FATIMA",  name:"Fatima Fertilizer Company",              sector:"Fertilizer",                      close:34.80,  chg:-0.20, pct:-0.57, vol:3400000,  val:118000000  },
  { symbol:"DAWH",    name:"Dawood Hercules Corporation",            sector:"Fertilizer",                      close:148.0,  chg:1.20,  pct:0.82,  vol:1100000,  val:163000000  },
  // ── Power Generation & Distribution ──────────────────────────────
  { symbol:"HUBC",    name:"Hub Power Company Limited",              sector:"Power Generation & Distribution", close:107.80, chg:0.80,  pct:0.75,  vol:4900000,  val:528000000  },
  { symbol:"KAPCO",   name:"Kot Addu Power Company",                 sector:"Power Generation & Distribution", close:29.50,  chg:0.15,  pct:0.51,  vol:5200000,  val:153000000  },
  { symbol:"PKGP",    name:"PakGen Power Limited",                   sector:"Power Generation & Distribution", close:7.80,   chg:-0.10, pct:-1.27, vol:8100000,  val:63000000   },
  { symbol:"NCPL",    name:"Nishat Chunian Power Limited",           sector:"Power Generation & Distribution", close:16.20,  chg:0.10,  pct:0.62,  vol:4300000,  val:70000000   },
  { symbol:"EPQL",    name:"Engro Powergen Qadirpur Limited",        sector:"Power Generation & Distribution", close:18.40,  chg:0.15,  pct:0.82,  vol:3100000,  val:57000000   },
  { symbol:"JPGL",    name:"Jaffer Power Generation Limited",        sector:"Power Generation & Distribution", close:5.60,   chg:-0.05, pct:-0.88, vol:6200000,  val:35000000   },
  { symbol:"TPPL",    name:"Tariq Power (Pvt) Limited",              sector:"Power Generation & Distribution", close:9.80,   chg:0.10,  pct:1.03,  vol:2900000,  val:28000000   },
  { symbol:"SPEL",    name:"Southern Electric Power Company",        sector:"Power Generation & Distribution", close:12.30,  chg:-0.10, pct:-0.81, vol:1800000,  val:22000000   },
  { symbol:"SEWL",    name:"Sitara Energy Limited",                  sector:"Power Generation & Distribution", close:18.60,  chg:0.20,  pct:1.09,  vol:1500000,  val:28000000   },
  { symbol:"ATBA",    name:"Atlas Battery Limited",                  sector:"Power Generation & Distribution", close:892.0,  chg:7.0,   pct:0.79,  vol:48000,    val:43000000   },
  { symbol:"PKGPL",   name:"Pakistan Power Projects Limited",        sector:"Power Generation & Distribution", close:6.20,   chg:0.05,  pct:0.81,  vol:3400000,  val:21000000   },
  // ── Automobile Assembler ──────────────────────────────────────────
  { symbol:"PSMC",    name:"Pak Suzuki Motor Company",               sector:"Automobile Assembler",            close:830.0,  chg:12.0,  pct:1.47,  vol:310000,   val:257000000  },
  { symbol:"INDU",    name:"Indus Motor Company Limited",            sector:"Automobile Assembler",            close:1702.0, chg:18.0,  pct:1.07,  vol:180000,   val:306000000  },
  { symbol:"HCAR",    name:"Honda Atlas Cars (Pakistan)",            sector:"Automobile Assembler",            close:482.0,  chg:5.0,   pct:1.05,  vol:220000,   val:106000000  },
  { symbol:"MTL",     name:"Millat Tractors Limited",                sector:"Automobile Assembler",            close:1198.0, chg:10.0,  pct:0.84,  vol:82000,    val:98000000   },
  { symbol:"GHICIAS", name:"Ghandhara Industries Limited",           sector:"Automobile Assembler",            close:248.0,  chg:2.0,   pct:0.81,  vol:118000,   val:29000000   },
  { symbol:"DFML",    name:"Dewan Farooque Motors Limited",          sector:"Automobile Assembler",            close:5.20,   chg:-0.05, pct:-0.95, vol:2100000,  val:11000000   },
  // ── Automobile Parts & Accessories ───────────────────────────────
  { symbol:"ATLH",    name:"Atlas Honda Limited",                    sector:"Automobile Parts & Accessories",  close:618.0,  chg:7.0,   pct:1.14,  vol:160000,   val:99000000   },
  { symbol:"EXIDE",   name:"Exide Pakistan Limited",                 sector:"Automobile Parts & Accessories",  close:1420.0, chg:12.0,  pct:0.85,  vol:18000,    val:26000000   },
  { symbol:"PAEL",    name:"Pak Elektron Limited",                   sector:"Automobile Parts & Accessories",  close:48.20,  chg:0.40,  pct:0.84,  vol:3400000,  val:164000000  },
  { symbol:"GHNI",    name:"Ghandhara Nissan Limited",               sector:"Automobile Parts & Accessories",  close:62.0,   chg:0.50,  pct:0.81,  vol:480000,   val:30000000   },
  // ── Technology & Communication ────────────────────────────────────
  { symbol:"TRG",     name:"TRG Pakistan Limited",                   sector:"Technology & Communication",      close:101.50, chg:1.50,  pct:1.50,  vol:7200000,  val:731000000  },
  { symbol:"SYS",     name:"Systems Limited",                        sector:"Technology & Communication",      close:724.0,  chg:9.0,   pct:1.26,  vol:480000,   val:347000000  },
  { symbol:"AVN",     name:"Avanceon Limited",                       sector:"Technology & Communication",      close:42.30,  chg:0.50,  pct:1.20,  vol:2100000,  val:89000000   },
  { symbol:"PTC",     name:"Pakistan Telecommunication Company",     sector:"Technology & Communication",      close:18.80,  chg:-0.20, pct:-1.05, vol:12000000, val:226000000  },
  { symbol:"NETSOL",  name:"NetSol Technologies",                    sector:"Technology & Communication",      close:160.0,  chg:2.0,   pct:1.27,  vol:540000,   val:86000000   },
  { symbol:"WTL",     name:"WorldCall Telecom Limited",              sector:"Technology & Communication",      close:1.58,   chg:-0.02, pct:-1.25, vol:14000000, val:22000000   },
  { symbol:"TELE",    name:"Telecard Limited",                       sector:"Technology & Communication",      close:2.10,   chg:0.02,  pct:0.96,  vol:8100000,  val:17000000   },
  { symbol:"PKGS",    name:"Packages Limited",                       sector:"Technology & Communication",      close:428.0,  chg:3.50,  pct:0.82,  vol:190000,   val:81000000   },
  { symbol:"CMFL",    name:"Crescent Modaraba First",                sector:"Technology & Communication",      close:4.80,   chg:0.05,  pct:1.05,  vol:2900000,  val:14000000   },
  // ── Pharmaceuticals ───────────────────────────────────────────────
  { symbol:"SEARL",   name:"The Searle Company Limited",             sector:"Pharmaceuticals",                 close:228.0,  chg:2.0,   pct:0.88,  vol:310000,   val:71000000   },
  { symbol:"FEROZ",   name:"Ferozsons Laboratories",                 sector:"Pharmaceuticals",                 close:412.0,  chg:3.50,  pct:0.86,  vol:82000,    val:34000000   },
  { symbol:"ABOT",    name:"Abbott Laboratories (Pakistan)",         sector:"Pharmaceuticals",                 close:1002.0, chg:8.0,   pct:0.80,  vol:41000,    val:41000000   },
  { symbol:"HALEON",  name:"Haleon Pakistan",                        sector:"Pharmaceuticals",                 close:748.99, chg:-3.69, pct:-0.49, vol:29000,    val:22000000   },
  { symbol:"GLAXO",   name:"GlaxoSmithKline Pakistan Limited",       sector:"Pharmaceuticals",                 close:248.0,  chg:2.0,   pct:0.81,  vol:78000,    val:19000000   },
  { symbol:"HINOON",  name:"Highnoon Laboratories Limited",          sector:"Pharmaceuticals",                 close:962.0,  chg:7.50,  pct:0.79,  vol:22000,    val:21000000   },
  { symbol:"AGP",     name:"AGP Limited",                            sector:"Pharmaceuticals",                 close:312.0,  chg:2.50,  pct:0.81,  vol:48000,    val:15000000   },
  { symbol:"HPML",    name:"Hilton Pharma Limited",                  sector:"Pharmaceuticals",                 close:82.0,   chg:0.60,  pct:0.74,  vol:210000,   val:17000000   },
  { symbol:"SAPL",    name:"Sanofi-Aventis Pakistan Limited",        sector:"Pharmaceuticals",                 close:1380.0, chg:11.0,  pct:0.80,  vol:12000,    val:17000000   },
  { symbol:"MEDI",    name:"Medice Pharma Pakistan",                 sector:"Pharmaceuticals",                 close:120.0,  chg:1.0,   pct:0.84,  vol:98000,    val:12000000   },
  // ── Food & Personal Care ──────────────────────────────────────────
  { symbol:"NATF",    name:"National Foods Limited",                 sector:"Food & Personal Care Products",   close:89.20,  chg:0.70,  pct:0.79,  vol:840000,   val:75000000   },
  { symbol:"NESTLE",  name:"Nestlé Pakistan Limited",                sector:"Food & Personal Care Products",   close:7010.0, chg:55.0,  pct:0.79,  vol:12000,    val:84000000   },
  { symbol:"CLCPS",   name:"Clover Pakistan Limited",                sector:"Food & Personal Care Products",   close:28.40,  chg:0.20,  pct:0.71,  vol:1200000,  val:34000000   },
  { symbol:"SHEZAN",  name:"Shezan International Limited",           sector:"Food & Personal Care Products",   close:1680.0, chg:14.0,  pct:0.84,  vol:9200,     val:15000000   },
  { symbol:"QUICE",   name:"Quice Food Industries",                  sector:"Food & Personal Care Products",   close:5.80,   chg:0.05,  pct:0.87,  vol:4800000,  val:28000000   },
  { symbol:"TREET",   name:"Treet Corporation Limited",              sector:"Food & Personal Care Products",   close:82.0,   chg:0.70,  pct:0.86,  vol:320000,   val:26000000   },
  { symbol:"MSOT",    name:"Mitchells Fruit Farms Limited",          sector:"Food & Personal Care Products",   close:68.0,   chg:0.50,  pct:0.74,  vol:180000,   val:12000000   },
  { symbol:"GGBL",    name:"Gul Ahmed Ghee and General Mills",       sector:"Food & Personal Care Products",   close:42.0,   chg:0.30,  pct:0.72,  vol:480000,   val:20000000   },
  // ── Sugar & Allied Industries ─────────────────────────────────────
  { symbol:"UNITY",   name:"Unity Foods Limited",                    sector:"Sugar & Allied Industries",       close:18.30,  chg:0.20,  pct:1.10,  vol:5600000,  val:102000000  },
  { symbol:"HABSM",   name:"Habib Sugar Mills",                      sector:"Sugar & Allied Industries",       close:32.10,  chg:0.30,  pct:0.94,  vol:1200000,  val:38000000   },
  { symbol:"JDW",     name:"JDW Sugar Mills Limited",                sector:"Sugar & Allied Industries",       close:298.0,  chg:2.50,  pct:0.84,  vol:248000,   val:74000000   },
  { symbol:"CSAR",    name:"Chashma Sugar Mills Limited",            sector:"Sugar & Allied Industries",       close:28.0,   chg:0.20,  pct:0.72,  vol:1800000,  val:50000000   },
  { symbol:"HASSL",   name:"Haseeb Waqas Sugar Mills",               sector:"Sugar & Allied Industries",       close:22.0,   chg:0.15,  pct:0.69,  vol:2100000,  val:46000000   },
  { symbol:"DOST",    name:"Dost Steels Limited",                    sector:"Sugar & Allied Industries",       close:14.20,  chg:0.10,  pct:0.71,  vol:3100000,  val:44000000   },
  { symbol:"MATC",    name:"Matco Foods Limited",                    sector:"Sugar & Allied Industries",       close:58.0,   chg:0.50,  pct:0.87,  vol:620000,   val:36000000   },
  { symbol:"SPML",    name:"Shahmurad Sugar Mills",                  sector:"Sugar & Allied Industries",       close:18.80,  chg:0.15,  pct:0.80,  vol:1900000,  val:36000000   },
  { symbol:"BISL",    name:"Bolan Industrial Complex",               sector:"Sugar & Allied Industries",       close:36.0,   chg:-0.30, pct:-0.83, vol:980000,   val:35000000   },
  // ── Textile Composite ─────────────────────────────────────────────
  { symbol:"NCL",     name:"Nishat Chunian Limited",                 sector:"Textile Composite",               close:21.80,  chg:-0.20, pct:-0.91, vol:3100000,  val:68000000   },
  { symbol:"NML",     name:"Nishat Mills Limited",                   sector:"Textile Composite",               close:138.0,  chg:1.0,   pct:0.73,  vol:680000,   val:94000000   },
  { symbol:"GFIL",    name:"Gul Ahmed Textile Mills",                sector:"Textile Composite",               close:9.20,   chg:-0.10, pct:-1.08, vol:4800000,  val:44000000   },
  { symbol:"THALL",   name:"Thal Limited",                           sector:"Textile Composite",               close:2048.0, chg:18.0,  pct:0.89,  vol:28000,    val:57000000   },
  { symbol:"GATM",    name:"Gulistan Textile Mills",                 sector:"Textile Composite",               close:12.60,  chg:0.10,  pct:0.80,  vol:2800000,  val:35000000   },
  { symbol:"SAPT",    name:"Sarah Textiles Limited",                 sector:"Textile Composite",               close:7.80,   chg:0.05,  pct:0.64,  vol:3400000,  val:27000000   },
  { symbol:"TPML",    name:"Tri-Pack Films Limited",                 sector:"Textile Composite",               close:428.0,  chg:3.50,  pct:0.82,  vol:92000,    val:39000000   },
  { symbol:"AMTX",    name:"Amtex Limited",                          sector:"Textile Composite",               close:6.40,   chg:-0.05, pct:-0.78, vol:5100000,  val:33000000   },
  { symbol:"GHCL",    name:"Ghani Global Holdings Limited",          sector:"Textile Composite",               close:28.0,   chg:0.20,  pct:0.72,  vol:1800000,  val:50000000   },
  { symbol:"ILP",     name:"Interloop Limited",                      sector:"Textile Composite",               close:68.0,   chg:0.60,  pct:0.89,  vol:2100000,  val:143000000  },
  // ── Textile Spinning ──────────────────────────────────────────────
  { symbol:"ACFL",    name:"Artistic Cotton & Fabrics Limited",      sector:"Textile Spinning",                close:14.20,  chg:0.10,  pct:0.71,  vol:2400000,  val:34000000   },
  { symbol:"AGTL",    name:"Agritech Limited",                       sector:"Textile Spinning",                close:6.80,   chg:-0.05, pct:-0.73, vol:3800000,  val:26000000   },
  { symbol:"BFL",     name:"Blessed Fabrics Limited",                sector:"Textile Spinning",                close:18.40,  chg:0.15,  pct:0.82,  vol:2100000,  val:39000000   },
  { symbol:"BHAT",    name:"Bata Pakistan Limited",                  sector:"Textile Spinning",                close:2420.0, chg:20.0,  pct:0.83,  vol:8200,     val:20000000   },
  { symbol:"BILAL",   name:"Bilal Fibres Limited",                   sector:"Textile Spinning",                close:5.60,   chg:-0.05, pct:-0.88, vol:4100000,  val:23000000   },
  { symbol:"BNIL",    name:"B.N.I Limited",                          sector:"Textile Spinning",                close:4.20,   chg:0.04,  pct:0.96,  vol:3600000,  val:15000000   },
  { symbol:"BSTM",    name:"Bestway Textiles Limited",               sector:"Textile Spinning",                close:8.10,   chg:0.06,  pct:0.75,  vol:2900000,  val:24000000   },
  { symbol:"CLSP",    name:"Crescent Leasing Corp",                  sector:"Textile Spinning",                close:3.60,   chg:-0.03, pct:-0.83, vol:4400000,  val:16000000   },
  { symbol:"PKTM",    name:"Pak Textiles Limited",                   sector:"Textile Spinning",                close:6.20,   chg:0.05,  pct:0.81,  vol:3700000,  val:23000000   },
  { symbol:"NITL",    name:"Nishat (Chunian) Textiles",              sector:"Textile Spinning",                close:11.40,  chg:0.10,  pct:0.88,  vol:2800000,  val:32000000   },
  { symbol:"OKML",    name:"Olympia Knit & Fabrics",                 sector:"Textile Spinning",                close:9.80,   chg:-0.08, pct:-0.81, vol:1900000,  val:19000000   },
  { symbol:"PRITL",   name:"Premium Textile Limited",                sector:"Textile Spinning",                close:24.0,   chg:0.20,  pct:0.84,  vol:1600000,  val:38000000   },
  { symbol:"RNFL",    name:"Rupali Polyester Limited",               sector:"Textile Spinning",                close:7.40,   chg:0.06,  pct:0.82,  vol:3100000,  val:23000000   },
  // ── Engineering ───────────────────────────────────────────────────
  { symbol:"MUGHAL",  name:"Mughal Iron & Steel Industries",         sector:"Engineering",                     close:78.50,  chg:0.70,  pct:0.90,  vol:1600000,  val:126000000  },
  { symbol:"ISL",     name:"International Steels Limited",           sector:"Engineering",                     close:148.0,  chg:1.20,  pct:0.82,  vol:890000,   val:132000000  },
  { symbol:"ASTL",    name:"Amreli Steels Limited",                  sector:"Engineering",                     close:48.0,   chg:0.40,  pct:0.84,  vol:2100000,  val:101000000  },
  { symbol:"AGIL",    name:"Agro Industries Limited",                sector:"Engineering",                     close:8.60,   chg:-0.07, pct:-0.81, vol:2800000,  val:24000000   },
  { symbol:"KSL",     name:"Kohinoor Spinning Mills",                sector:"Engineering",                     close:22.0,   chg:0.20,  pct:0.92,  vol:1400000,  val:31000000   },
  { symbol:"CSAP",    name:"Crescent Steel and Allied Products",     sector:"Engineering",                     close:318.0,  chg:2.50,  pct:0.79,  vol:180000,   val:57000000   },
  { symbol:"ANEL",    name:"Aisha Steel Mills Limited",              sector:"Engineering",                     close:12.80,  chg:0.10,  pct:0.79,  vol:3200000,  val:41000000   },
  // ── Chemicals ─────────────────────────────────────────────────────
  { symbol:"LOTCHEM",name:"LOTTEChemical Pakistan",                 sector:"Chemicals",                       close:29.80,  chg:-0.30, pct:-1.00, vol:2900000,  val:86000000   },
  { symbol:"ICI",     name:"ICI Pakistan Limited",                   sector:"Chemicals",                       close:832.0,  chg:6.0,   pct:0.73,  vol:98000,    val:82000000   },
  { symbol:"SITC",    name:"Sitara Chemical Industries Limited",     sector:"Chemicals",                       close:1860.0, chg:15.0,  pct:0.81,  vol:14000,    val:26000000   },
  { symbol:"BECO",    name:"Beco Industries Limited",                sector:"Chemicals",                       close:12.40,  chg:0.10,  pct:0.81,  vol:1800000,  val:22000000   },
  { symbol:"GHGL",    name:"Ghani Glass Limited",                    sector:"Chemicals",                       close:28.0,   chg:0.20,  pct:0.72,  vol:1900000,  val:53000000   },
  { symbol:"AKZO",    name:"Akzo Nobel Pakistan Limited",            sector:"Chemicals",                       close:248.0,  chg:2.0,   pct:0.81,  vol:128000,   val:32000000   },
  { symbol:"EPCL",    name:"Engro Polymer & Chemicals",              sector:"Chemicals",                       close:38.20,  chg:0.30,  pct:0.79,  vol:3100000,  val:118000000  },
  { symbol:"NCCPL",   name:"National Clearing Company",              sector:"Chemicals",                       close:158.0,  chg:1.20,  pct:0.76,  vol:98000,    val:15000000   },
  // ── Insurance ─────────────────────────────────────────────────────
  { symbol:"ADAMJEE", name:"Adamjee Insurance Company",              sector:"Insurance",                       close:68.0,   chg:0.50,  pct:0.74,  vol:820000,   val:56000000   },
  { symbol:"EFU",     name:"EFU General Insurance",                  sector:"Insurance",                       close:148.0,  chg:1.20,  pct:0.82,  vol:320000,   val:47000000   },
  { symbol:"JICL",    name:"Jubilee General Insurance",              sector:"Insurance",                       close:68.0,   chg:0.50,  pct:0.74,  vol:480000,   val:33000000   },
  { symbol:"JUBILEE", name:"Jubilee Life Insurance",                 sector:"Insurance",                       close:428.0,  chg:3.50,  pct:0.82,  vol:92000,    val:39000000   },
  { symbol:"IGI",     name:"IGI Holdings Limited",                   sector:"Insurance",                       close:592.0,  chg:4.50,  pct:0.77,  vol:68000,    val:40000000   },
  { symbol:"PAKRE",   name:"Pakistan Reinsurance Company",           sector:"Insurance",                       close:38.0,   chg:0.30,  pct:0.80,  vol:1200000,  val:46000000   },
  { symbol:"PIC",     name:"Pakistan Insurance Corporation",         sector:"Insurance",                       close:48.0,   chg:0.40,  pct:0.84,  vol:980000,   val:47000000   },
  { symbol:"PIIC",    name:"Pioneer Investment Corp",                sector:"Insurance",                       close:22.0,   chg:0.20,  pct:0.92,  vol:1400000,  val:31000000   },
  { symbol:"NICL",    name:"National Insurance Company",             sector:"Insurance",                       close:14.80,  chg:0.10,  pct:0.68,  vol:2800000,  val:41000000   },
  { symbol:"SIC",     name:"State Life Insurance",                   sector:"Insurance",                       close:52.0,   chg:0.40,  pct:0.78,  vol:680000,   val:35000000   },
  { symbol:"TPL",     name:"TPL Insurance Limited",                  sector:"Insurance",                       close:18.20,  chg:0.15,  pct:0.83,  vol:2100000,  val:38000000   },
  { symbol:"ALIS",    name:"Allianz EFU Health Insurance",           sector:"Insurance",                       close:28.0,   chg:0.20,  pct:0.72,  vol:980000,   val:27000000   },
  { symbol:"ACE",     name:"Askari General Insurance",               sector:"Insurance",                       close:24.0,   chg:0.20,  pct:0.84,  vol:1400000,  val:34000000   },
  { symbol:"CMIL",    name:"Century Insurance Company",              sector:"Insurance",                       close:12.40,  chg:-0.10, pct:-0.80, vol:2100000,  val:26000000   },
  // ── Investment Banks / Modarabas ──────────────────────────────────
  { symbol:"JSGCL",   name:"JS Global Capital Limited",              sector:"Investment Banks",                close:9.20,   chg:0.08,  pct:0.88,  vol:3200000,  val:29000000   },
  { symbol:"NBF",     name:"National Bank of Futures",               sector:"Investment Banks",                close:14.0,   chg:0.10,  pct:0.72,  vol:1800000,  val:25000000   },
  { symbol:"PAFL",    name:"Pakistan Autos Finance Limited",         sector:"Investment Banks",                close:8.40,   chg:0.07,  pct:0.84,  vol:2400000,  val:20000000   },
  { symbol:"FIRST",   name:"First National Bank Modaraba",           sector:"Modarabas",                       close:5.80,   chg:0.05,  pct:0.87,  vol:3100000,  val:18000000   },
  { symbol:"SJEM",    name:"Standard Chartered Modaraba",            sector:"Modarabas",                       close:6.20,   chg:-0.05, pct:-0.80, vol:2900000,  val:18000000   },
  { symbol:"TRIBL",   name:"Tri-Star Mutual Fund",                   sector:"Modarabas",                       close:4.40,   chg:0.04,  pct:0.92,  vol:4200000,  val:18000000   },
  // ── Transport ─────────────────────────────────────────────────────
  { symbol:"PNSC",    name:"Pakistan National Shipping Corp",        sector:"Transport",                       close:112.0,  chg:1.0,   pct:0.90,  vol:340000,   val:38000000   },
  { symbol:"PCAL",    name:"Pakistan International Airlines Corp",   sector:"Transport",                       close:4.20,   chg:-0.05, pct:-1.18, vol:9800000,  val:41000000   },
  { symbol:"SRVI",    name:"Service Industries Limited",             sector:"Transport",                       close:1820.0, chg:15.0,  pct:0.83,  vol:18000,    val:33000000   },
  { symbol:"TML",     name:"Tri-Star Mutual Fund",                   sector:"Transport",                       close:18.0,   chg:0.15,  pct:0.84,  vol:1800000,  val:32000000   },
  // ── Hotels & Personal Services ────────────────────────────────────
  { symbol:"PSEL",    name:"Pakistan Services Limited",              sector:"Hotels & Personal Services",      close:3210.0, chg:25.0,  pct:0.79,  vol:12000,    val:39000000   },
  { symbol:"PHL",     name:"Pearl Continental Hotels Limited",       sector:"Hotels & Personal Services",      close:248.0,  chg:2.0,   pct:0.81,  vol:128000,   val:32000000   },
  { symbol:"PIAHCLA", name:"PIA Holdings Limited",                   sector:"Hotels & Personal Services",      close:3.80,   chg:-0.04, pct:-1.04, vol:6800000,  val:26000000   },
  // ── Miscellaneous / Leasing / Others ─────────────────────────────
  { symbol:"IBLHL",   name:"IBL HealthCare Limited",                 sector:"Miscellaneous",                   close:38.0,   chg:0.30,  pct:0.80,  vol:1200000,  val:46000000   },
  { symbol:"GADT",    name:"Gadoon Textile Mills Limited",           sector:"Miscellaneous",                   close:348.0,  chg:3.0,   pct:0.87,  vol:92000,    val:32000000   },
  { symbol:"CEPB",    name:"Century Paper & Board Mills",            sector:"Miscellaneous",                   close:128.0,  chg:1.0,   pct:0.79,  vol:428000,   val:55000000   },
  { symbol:"PMPK",    name:"Philip Morris Pakistan",                 sector:"Miscellaneous",                   close:2980.0, chg:24.0,  pct:0.81,  vol:6800,     val:20000000   },
  { symbol:"COLG",    name:"Colgate-Palmolive (Pakistan)",           sector:"Miscellaneous",                   close:3280.0, chg:26.0,  pct:0.80,  vol:5800,     val:19000000   },
  { symbol:"UNILEVER",name:"Unilever Pakistan Limited",              sector:"Miscellaneous",                   close:16800.0,chg:140.0, pct:0.84,  vol:1800,     val:30000000   },
  { symbol:"HINOPAK", name:"Hino Pak Motors Limited",                sector:"Miscellaneous",                   close:698.0,  chg:5.5,   pct:0.79,  vol:48000,    val:34000000   },
  { symbol:"SHNI",    name:"Shifa International Hospitals",          sector:"Miscellaneous",                   close:448.0,  chg:3.50,  pct:0.79,  vol:118000,   val:53000000   },
  { symbol:"SSGCL",   name:"Sui Southern Gas Company Pref",          sector:"Miscellaneous",                   close:21.0,   chg:0.18,  pct:0.86,  vol:4800000,  val:101000000  },
  { symbol:"MLCL",    name:"Maple Leaf Cement Factory Pref",         sector:"Miscellaneous",                   close:42.0,   chg:0.35,  pct:0.84,  vol:2800000,  val:118000000  },
  { symbol:"GSKCH",   name:"GlaxoSmithKline Consumer Healthcare",    sector:"Miscellaneous",                   close:2880.0, chg:23.0,  pct:0.80,  vol:8200,     val:24000000   },
  { symbol:"PRWM",    name:"Paramount Spinning Mills",               sector:"Miscellaneous",                   close:12.8,   chg:0.10,  pct:0.79,  vol:2100000,  val:27000000   },
  { symbol:"RMPL",    name:"Rupali Modaraba",                        sector:"Miscellaneous",                   close:6.40,   chg:-0.05, pct:-0.78, vol:3400000,  val:22000000   },
  { symbol:"SPCL",    name:"Sapphire Power Limited",                 sector:"Miscellaneous",                   close:18.20,  chg:0.15,  pct:0.83,  vol:2400000,  val:44000000   },
  { symbol:"SPLC",    name:"Sapphire Textile Mills",                 sector:"Miscellaneous",                   close:2280.0, chg:19.0,  pct:0.84,  vol:18000,    val:41000000   },
  { symbol:"TPKM",    name:"TPL Trakker Limited",                    sector:"Miscellaneous",                   close:6.80,   chg:0.06,  pct:0.89,  vol:3800000,  val:26000000   },
  { symbol:"CPPL",    name:"Cherat Packaging Limited",               sector:"Miscellaneous",                   close:218.0,  chg:1.80,  pct:0.83,  vol:148000,   val:32000000   },
  { symbol:"FDIBL",   name:"First Data Investment Bank Limited",     sector:"Miscellaneous",                   close:8.20,   chg:0.07,  pct:0.86,  vol:2900000,  val:24000000   },
  { symbol:"KAPCOL",  name:"Karachi Packages Limited",               sector:"Miscellaneous",                   close:148.0,  chg:1.20,  pct:0.82,  vol:228000,   val:34000000   },
  { symbol:"GRAYS",   name:"Gray's Leasing Limited",                 sector:"Leasing Companies",               close:4.60,   chg:-0.04, pct:-0.86, vol:3200000,  val:15000000   },
  { symbol:"OTML",    name:"Orix Modaraba",                          sector:"Leasing Companies",               close:10.20,  chg:0.08,  pct:0.79,  vol:2100000,  val:21000000   },
  { symbol:"PIL",     name:"Pakistan International Leasing",         sector:"Leasing Companies",               close:6.80,   chg:0.05,  pct:0.74,  vol:2800000,  val:19000000   },
  // ── Cables & Electrical ───────────────────────────────────────────
  { symbol:"PAEL2",   name:"Pak Elektron Limited Pref",              sector:"Cable & Electrical Goods",        close:52.0,   chg:0.42,  pct:0.81,  vol:2800000,  val:146000000  },
  { symbol:"SCPL",    name:"Siemens Pakistan Engineering",           sector:"Cable & Electrical Goods",        close:1820.0, chg:15.0,  pct:0.83,  vol:18000,    val:33000000   },
  { symbol:"ABEL",    name:"Atlas Battery Limited",                  sector:"Cable & Electrical Goods",        close:890.0,  chg:7.0,   pct:0.79,  vol:48000,    val:43000000   },
  { symbol:"EPQL2",   name:"Engro Powergen Limited Pref",            sector:"Cable & Electrical Goods",        close:18.0,   chg:0.15,  pct:0.84,  vol:2800000,  val:50000000   },
  // ── Glass & Ceramics ──────────────────────────────────────────────
  { symbol:"GHGL2",   name:"Ghani Glass (Ordinary)",                 sector:"Glass & Ceramics",                close:30.20,  chg:0.25,  pct:0.84,  vol:1800000,  val:54000000   },
  { symbol:"SITC2",   name:"Sitara Glass Industries",                sector:"Glass & Ceramics",                close:42.0,   chg:0.35,  pct:0.84,  vol:1200000,  val:50000000   },
  { symbol:"JPGL2",   name:"Javedan Glass Works",                    sector:"Glass & Ceramics",                close:8.40,   chg:0.07,  pct:0.84,  vol:2400000,  val:20000000   },
  // ── Paper & Board ─────────────────────────────────────────────────
  { symbol:"CEPB2",   name:"Century Paper Board",                    sector:"Paper & Board",                   close:132.0,  chg:1.10,  pct:0.84,  vol:418000,   val:55000000   },
  { symbol:"PKGS2",   name:"Packages Limited Ordinary",              sector:"Paper & Board",                   close:432.0,  chg:3.60,  pct:0.84,  vol:188000,   val:81000000   },
  { symbol:"STML",    name:"Security Paper Limited",                 sector:"Paper & Board",                   close:68.0,   chg:0.56,  pct:0.83,  vol:648000,   val:44000000   },
  { symbol:"PMPKL",   name:"Pakistan Papersack Corporation",         sector:"Paper & Board",                   close:28.0,   chg:0.23,  pct:0.83,  vol:1200000,  val:34000000   },
  // ── Real Estate ───────────────────────────────────────────────────
  { symbol:"NRSL",    name:"Nishat Hotels & Properties",             sector:"Real Estate Investment Trust",    close:18.40,  chg:0.15,  pct:0.82,  vol:2800000,  val:52000000   },
  { symbol:"AREIT",   name:"Arif Habib REIT Management",             sector:"Real Estate Investment Trust",    close:58.0,   chg:0.48,  pct:0.83,  vol:1200000,  val:70000000   },
  { symbol:"DOLMEN",  name:"Dolmen City REIT",                       sector:"Real Estate Investment Trust",    close:22.80,  chg:0.19,  pct:0.84,  vol:3400000,  val:78000000   },
  // ── Media ─────────────────────────────────────────────────────────
  { symbol:"DGML",    name:"Dawn Media Group",                       sector:"Miscellaneous",                   close:8.40,   chg:-0.07, pct:-0.83, vol:3100000,  val:26000000   },
  { symbol:"JSCL",    name:"Jang Subscribers Corporation",           sector:"Miscellaneous",                   close:6.20,   chg:0.05,  pct:0.81,  vol:2800000,  val:17000000   },
  // ── Tobacco ───────────────────────────────────────────────────────
  { symbol:"PMPKG",   name:"Philip Morris Pakistan (Pref)",          sector:"Tobacco",                         close:2920.0, chg:24.0,  pct:0.83,  vol:6400,     val:19000000   },
  { symbol:"PAKT",    name:"Pakistan Tobacco Company",               sector:"Tobacco",                         close:1480.0, chg:12.0,  pct:0.82,  vol:18000,    val:27000000   },
  // ── Mutual Funds ──────────────────────────────────────────────────
  { symbol:"ABAMCO",  name:"ABAMCO Capital Limited",                 sector:"Mutual Funds",                    close:14.20,  chg:0.12,  pct:0.85,  vol:2400000,  val:34000000   },
  { symbol:"PICIC",   name:"PICIC Growth Fund",                      sector:"Mutual Funds",                    close:18.40,  chg:0.15,  pct:0.82,  vol:1800000,  val:33000000   },
  { symbol:"MEEZAN",  name:"Meezan Islamic Income Fund",             sector:"Mutual Funds",                    close:108.0,  chg:0.90,  pct:0.84,  vol:320000,   val:35000000   },
  { symbol:"NAFA",    name:"NAFA Stock Fund",                        sector:"Mutual Funds",                    close:18.80,  chg:0.16,  pct:0.86,  vol:1600000,  val:30000000   },
  // ── Close-end Mutual Funds ────────────────────────────────────────
  { symbol:"JSGF",    name:"JS Value Fund",                          sector:"Close-End Mutual Fund",           close:24.0,   chg:0.20,  pct:0.84,  vol:1200000,  val:29000000   },
  { symbol:"NIT",     name:"National Investment Trust",              sector:"Close-End Mutual Fund",           close:128.0,  chg:1.07,  pct:0.84,  vol:280000,   val:36000000   },
  { symbol:"IDBF",    name:"IDB Infrastructure Finance",             sector:"Close-End Mutual Fund",           close:8.80,   chg:0.07,  pct:0.80,  vol:2800000,  val:25000000   },
  // ── Vanaspati & Allied ────────────────────────────────────────────
  { symbol:"OIBL",    name:"OBS Pakistan Limited",                   sector:"Vanaspati & Allied Industries",   close:22.0,   chg:-0.18, pct:-0.81, vol:1800000,  val:40000000   },
  { symbol:"MFLP",    name:"Mayfair Lipids Limited",                 sector:"Vanaspati & Allied Industries",   close:14.80,  chg:0.12,  pct:0.82,  vol:2400000,  val:36000000   },
  { symbol:"KTML",    name:"Kohinoor Textile Mills",                 sector:"Vanaspati & Allied Industries",   close:38.0,   chg:0.32,  pct:0.85,  vol:1200000,  val:46000000   },
  // ── Woolen / Synthetic ────────────────────────────────────────────
  { symbol:"GGTC",    name:"Gulistan Group Textiles",                sector:"Woolen",                          close:8.20,   chg:-0.07, pct:-0.85, vol:2800000,  val:23000000   },
  { symbol:"MERIT",   name:"Merit Packaging Limited",                sector:"Woolen",                          close:6.80,   chg:0.06,  pct:0.89,  vol:3400000,  val:23000000   },
  // ── Construction & Materials ──────────────────────────────────────
  { symbol:"FNEL",    name:"Fatima Enterprises Limited",             sector:"Construction & Materials (Cement)", close:12.20, chg:0.10, pct:0.82,  vol:2800000,  val:34000000   },
  { symbol:"MTHM",    name:"Mehran Sugar Mills",                     sector:"Construction & Materials (Cement)", close:248.0,  chg:2.0,  pct:0.81,  vol:128000,   val:32000000   },
  { symbol:"PKSC",    name:"Pakistan Synthetics Limited",            sector:"Construction & Materials (Cement)", close:28.0,   chg:0.23, pct:0.83,  vol:1400000,  val:39000000   },
  // ── More Commercial Banks ─────────────────────────────────────────
  { symbol:"BIFO",    name:"BankIslami Pakistan (Pref)",             sector:"Commercial Banks",                close:18.40,  chg:0.15,  pct:0.82,  vol:3800000,  val:70000000   },
  { symbol:"KHYBER",  name:"Bank of Khyber Limited",                 sector:"Commercial Banks",                close:19.80,  chg:0.17,  pct:0.87,  vol:2900000,  val:57000000   },
  { symbol:"FMBL",    name:"First MicroFinanceBank Limited",         sector:"Commercial Banks",                close:8.60,   chg:-0.07, pct:-0.81, vol:4100000,  val:35000000   },
  { symbol:"SILK",    name:"Silkbank Limited",                       sector:"Commercial Banks",                close:3.40,   chg:-0.03, pct:-0.88, vol:9800000,  val:33000000   },
  { symbol:"PMBL",    name:"Prime Bank Limited",                     sector:"Commercial Banks",                close:6.20,   chg:0.05,  pct:0.81,  vol:5600000,  val:35000000   },
  // ── More Cement ───────────────────────────────────────────────────
  { symbol:"GWLC",    name:"Gharibwal Cement Limited",               sector:"Cement",                          close:28.40,  chg:0.24,  pct:0.85,  vol:3200000,  val:91000000   },
  { symbol:"POWER",   name:"Power Cement Limited",                   sector:"Cement",                          close:14.60,  chg:0.12,  pct:0.83,  vol:4800000,  val:70000000   },
  { symbol:"SFL",     name:"Saif Baho Cement Limited",               sector:"Cement",                          close:8.80,   chg:0.07,  pct:0.80,  vol:3600000,  val:32000000   },
  { symbol:"WTCL",    name:"Wazir Ali Industries Limited",           sector:"Cement",                          close:6.40,   chg:-0.05, pct:-0.78, vol:2800000,  val:18000000   },
  { symbol:"LACL",    name:"Lafarge Cement Pakistan",                sector:"Cement",                          close:18.20,  chg:0.15,  pct:0.83,  vol:2400000,  val:44000000   },
  // ── More Power Generation ─────────────────────────────────────────
  { symbol:"LOTPTA",  name:"Lotte Chemical Pakistan",                sector:"Power Generation & Distribution", close:32.80,  chg:-0.28, pct:-0.85, vol:2800000,  val:92000000   },
  { symbol:"AEBL",    name:"Attock Energy Limited",                  sector:"Power Generation & Distribution", close:14.40,  chg:0.12,  pct:0.84,  vol:2100000,  val:30000000   },
  { symbol:"QGTL",    name:"Quetta Gas Turbine Limited",             sector:"Power Generation & Distribution", close:9.20,   chg:0.08,  pct:0.88,  vol:3100000,  val:29000000   },
  { symbol:"GENL",    name:"Genertech Pakistan Limited",             sector:"Power Generation & Distribution", close:4.80,   chg:-0.04, pct:-0.83, vol:5200000,  val:25000000   },
  { symbol:"NPML",    name:"Northern Power Marketing Limited",       sector:"Power Generation & Distribution", close:7.60,   chg:0.06,  pct:0.80,  vol:3800000,  val:29000000   },
  // ── More Textile Composite ────────────────────────────────────────
  { symbol:"CRTM",    name:"Crescent Textile Mills Limited",         sector:"Textile Composite",               close:112.0,  chg:0.93,  pct:0.84,  vol:480000,   val:54000000   },
  { symbol:"DTML",    name:"Dewan Textile Mills Limited",            sector:"Textile Composite",               close:5.80,   chg:-0.05, pct:-0.86, vol:4200000,  val:24000000   },
  { symbol:"KTML2",   name:"Kohinoor Textile Mills Ord",             sector:"Textile Composite",               close:42.0,   chg:0.35,  pct:0.84,  vol:1100000,  val:46000000   },
  { symbol:"RTML",    name:"Reliance Textile Mills Limited",         sector:"Textile Composite",               close:8.20,   chg:0.07,  pct:0.86,  vol:3400000,  val:28000000   },
  { symbol:"SSTM",    name:"Sapphire Synthetic Textiles",            sector:"Textile Composite",               close:62.0,   chg:0.52,  pct:0.84,  vol:720000,   val:45000000   },
  { symbol:"ZNBL",    name:"Zainab Industries Limited",              sector:"Textile Composite",               close:7.40,   chg:-0.06, pct:-0.81, vol:2900000,  val:21000000   },
  // ── More Textile Spinning ─────────────────────────────────────────
  { symbol:"ARPL",    name:"Artistic Fabric & Garment",              sector:"Textile Spinning",                close:12.80,  chg:0.11,  pct:0.87,  vol:2600000,  val:33000000   },
  { symbol:"BNWM",    name:"Bannu Woollen Mills",                    sector:"Textile Spinning",                close:482.0,  chg:4.0,   pct:0.83,  vol:28000,    val:14000000   },
  { symbol:"COTS",    name:"Cotton Web Limited",                     sector:"Textile Spinning",                close:9.80,   chg:0.08,  pct:0.82,  vol:3100000,  val:30000000   },
  { symbol:"DVSM",    name:"Dawood Hercules Textiles",               sector:"Textile Spinning",                close:6.40,   chg:-0.05, pct:-0.78, vol:4800000,  val:31000000   },
  { symbol:"FTFL",    name:"Fateh Textile Mills Limited",            sector:"Textile Spinning",                close:8.20,   chg:0.07,  pct:0.86,  vol:3400000,  val:28000000   },
  { symbol:"GLFL",    name:"Gulshan Spinning Mills",                 sector:"Textile Spinning",                close:5.60,   chg:-0.05, pct:-0.88, vol:5100000,  val:29000000   },
  { symbol:"HIRAT",   name:"Hira Textile Mills Limited",             sector:"Textile Spinning",                close:7.80,   chg:0.06,  pct:0.78,  vol:3800000,  val:30000000   },
  { symbol:"IJFL",    name:"Ibrahim Fibres Limited",                 sector:"Textile Spinning",                close:68.0,   chg:0.57,  pct:0.84,  vol:680000,   val:46000000   },
  { symbol:"JLFL",    name:"Jaffer Fabrics Limited",                 sector:"Textile Spinning",                close:4.20,   chg:-0.04, pct:-0.94, vol:5800000,  val:24000000   },
  // ── More Engineering ──────────────────────────────────────────────
  { symbol:"GHNL",    name:"Ghani Automobile Industries",            sector:"Engineering",                     close:18.40,  chg:0.15,  pct:0.82,  vol:2100000,  val:39000000   },
  { symbol:"NFML",    name:"National Foundry & Engineering",         sector:"Engineering",                     close:8.80,   chg:0.07,  pct:0.80,  vol:3200000,  val:28000000   },
  { symbol:"ZTBL",    name:"Zarai Taraqiati Bank Limited",           sector:"Engineering",                     close:12.40,  chg:0.10,  pct:0.81,  vol:2800000,  val:35000000   },
  // ── More Sugar ────────────────────────────────────────────────────
  { symbol:"AGSM",    name:"Ansari Sugar Mills Limited",             sector:"Sugar & Allied Industries",       close:18.20,  chg:0.15,  pct:0.83,  vol:1900000,  val:35000000   },
  { symbol:"CHSM",    name:"Chashma Sugar Mills Pref",               sector:"Sugar & Allied Industries",       close:24.0,   chg:0.20,  pct:0.84,  vol:1600000,  val:38000000   },
  { symbol:"GSSM",    name:"Ghulam Sugar Mills Limited",             sector:"Sugar & Allied Industries",       close:14.80,  chg:-0.12, pct:-0.80, vol:2800000,  val:41000000   },
  { symbol:"JKSM",    name:"Jamikapur Sugar Mills",                  sector:"Sugar & Allied Industries",       close:12.40,  chg:0.10,  pct:0.81,  vol:3100000,  val:39000000   },
  { symbol:"MSML",    name:"Mehran Sugar Mills Limited",             sector:"Sugar & Allied Industries",       close:186.0,  chg:1.55,  pct:0.84,  vol:118000,   val:22000000   },
  { symbol:"RYMSM",   name:"RY Khan Sugar Mills",                    sector:"Sugar & Allied Industries",       close:22.0,   chg:0.18,  pct:0.83,  vol:2100000,  val:46000000   },
  { symbol:"SANM",    name:"Sanghar Sugar Mills Limited",            sector:"Sugar & Allied Industries",       close:16.80,  chg:0.14,  pct:0.84,  vol:2400000,  val:40000000   },
  { symbol:"THSM",    name:"Thal Sugar Mills Limited",               sector:"Sugar & Allied Industries",       close:28.0,   chg:-0.23, pct:-0.82, vol:1800000,  val:50000000   },
  // ── More Pharmaceuticals ──────────────────────────────────────────
  { symbol:"BRTM",    name:"Berlex Pakistan Limited",                sector:"Pharmaceuticals",                 close:38.0,   chg:0.32,  pct:0.85,  vol:680000,   val:26000000   },
  { symbol:"DWSM",    name:"Otsuka Pakistan Limited",                sector:"Pharmaceuticals",                 close:128.0,  chg:1.07,  pct:0.84,  vol:148000,   val:19000000   },
  { symbol:"IBLM",    name:"IBL HealthCare (Pharma)",                sector:"Pharmaceuticals",                 close:42.0,   chg:0.35,  pct:0.84,  vol:480000,   val:20000000   },
  { symbol:"LOTPHL",  name:"Lotte Chemical Pharma Div",              sector:"Pharmaceuticals",                 close:68.0,   chg:0.57,  pct:0.84,  vol:280000,   val:19000000   },
  // ── More Food & Personal Care ─────────────────────────────────────
  { symbol:"BISCO",   name:"Bisconni Limited",                       sector:"Food & Personal Care Products",   close:62.0,   chg:0.52,  pct:0.84,  vol:520000,   val:32000000   },
  { symbol:"CLFM",    name:"Clover Leaf Farms Limited",              sector:"Food & Personal Care Products",   close:18.40,  chg:0.15,  pct:0.82,  vol:1800000,  val:33000000   },
  { symbol:"DMTM",    name:"Dalda Foods Limited",                    sector:"Food & Personal Care Products",   close:128.0,  chg:1.07,  pct:0.84,  vol:228000,   val:29000000   },
  { symbol:"MEZZ",    name:"Mez Agro Industries Limited",            sector:"Food & Personal Care Products",   close:8.40,   chg:-0.07, pct:-0.83, vol:3200000,  val:27000000   },
  { symbol:"SFML",    name:"Sunridge Food Limited",                  sector:"Food & Personal Care Products",   close:6.80,   chg:0.06,  pct:0.89,  vol:4100000,  val:28000000   },
  // ── More Technology ───────────────────────────────────────────────
  { symbol:"CVAM",    name:"Cyan Limited",                           sector:"Technology & Communication",      close:298.0,  chg:2.50,  pct:0.84,  vol:98000,    val:29000000   },
  { symbol:"PICT",    name:"Pakistan Int'l Container Terminal",      sector:"Technology & Communication",      close:248.0,  chg:2.07,  pct:0.84,  vol:128000,   val:32000000   },
  { symbol:"IBFL",    name:"Ittehad Chemicals Limited",              sector:"Technology & Communication",      close:142.0,  chg:1.18,  pct:0.84,  vol:248000,   val:35000000   },
  { symbol:"PAKD",    name:"Pakistan Datacom Limited",               sector:"Technology & Communication",      close:12.40,  chg:0.10,  pct:0.81,  vol:2800000,  val:35000000   },
  // ── More Insurance ────────────────────────────────────────────────
  { symbol:"EIBL",    name:"East-West Insurance Company",            sector:"Insurance",                       close:14.80,  chg:0.12,  pct:0.82,  vol:2100000,  val:31000000   },
  { symbol:"ATCO",    name:"Atco Laboratory Insurance",              sector:"Insurance",                       close:18.20,  chg:0.15,  pct:0.83,  vol:1800000,  val:33000000   },
  { symbol:"CREST",   name:"Crest Insurance Company",                sector:"Insurance",                       close:8.40,   chg:-0.07, pct:-0.83, vol:3100000,  val:26000000   },
  { symbol:"PICL2",   name:"Pakistan Insurance Corp (Ord)",          sector:"Insurance",                       close:52.0,   chg:0.43,  pct:0.83,  vol:680000,   val:35000000   },
  // ── More Chemicals ────────────────────────────────────────────────
  { symbol:"FCCF",    name:"Fauji Chemical Company",                 sector:"Chemicals",                       close:28.0,   chg:0.23,  pct:0.83,  vol:1800000,  val:50000000   },
  { symbol:"ITTEHAD", name:"Ittehad Chemical Industries",            sector:"Chemicals",                       close:138.0,  chg:1.15,  pct:0.84,  vol:248000,   val:34000000   },
  { symbol:"PCAL2",   name:"Pak Elektron Chemicals Division",        sector:"Chemicals",                       close:52.0,   chg:0.43,  pct:0.83,  vol:980000,   val:51000000   },
  // ── More Real Estate ──────────────────────────────────────────────
  { symbol:"EMCO",    name:"Emco Industries Limited",                sector:"Real Estate Investment Trust",    close:12.80,  chg:0.11,  pct:0.87,  vol:2400000,  val:31000000   },
  { symbol:"KPCL",    name:"Kot Addu Power (REIT)",                  sector:"Real Estate Investment Trust",    close:18.40,  chg:0.15,  pct:0.82,  vol:1800000,  val:33000000   },
  { symbol:"ZEAL",    name:"Zeal Pak Cement Factory",                sector:"Cement",                          close:8.60,   chg:0.07,  pct:0.82,  vol:3800000,  val:33000000   },
  // ── More Textile Spinning ─────────────────────────────────────────
  { symbol:"ADOS",    name:"Ados Pakistan Limited",                  sector:"Textile Spinning",                close:9.40,   chg:0.08,  pct:0.86,  vol:2800000,  val:26000000   },
  { symbol:"ALTN",    name:"Altus Spinning Mills",                   sector:"Textile Spinning",                close:6.20,   chg:-0.05, pct:-0.80, vol:3900000,  val:24000000   },
  { symbol:"BSPM",    name:"Bawany Sugar Textile Div",               sector:"Textile Spinning",                close:4.80,   chg:0.04,  pct:0.84,  vol:4800000,  val:23000000   },
  { symbol:"CCPL",    name:"Crescent Cotton Mills",                  sector:"Textile Spinning",                close:8.20,   chg:0.07,  pct:0.86,  vol:3200000,  val:27000000   },
  { symbol:"DTML2",   name:"Dewan Mushtaq Textile",                  sector:"Textile Spinning",                close:5.40,   chg:-0.04, pct:-0.74, vol:4100000,  val:22000000   },
  { symbol:"ELCM",    name:"Elahi Cotton Mills Limited",             sector:"Textile Spinning",                close:7.60,   chg:0.06,  pct:0.80,  vol:3600000,  val:27000000   },
  { symbol:"FASM",    name:"Fazal Cloth Mills Limited",              sector:"Textile Spinning",                close:188.0,  chg:1.57,  pct:0.84,  vol:92000,    val:17000000   },
  { symbol:"GTML",    name:"Gulistan Textile Mills",                 sector:"Textile Spinning",                close:6.80,   chg:0.06,  pct:0.89,  vol:3800000,  val:26000000   },
  { symbol:"JTML",    name:"Jubilee Spinning & Weaving",             sector:"Textile Spinning",                close:4.40,   chg:-0.04, pct:-0.90, vol:5200000,  val:23000000   },
  { symbol:"KTML3",   name:"Kohinoor Industries Limited",            sector:"Textile Spinning",                close:12.40,  chg:0.10,  pct:0.81,  vol:2400000,  val:30000000   },
  { symbol:"NTML",    name:"Nadeem Textile Mills",                   sector:"Textile Spinning",                close:8.80,   chg:0.07,  pct:0.80,  vol:3100000,  val:27000000   },
  { symbol:"PTML",    name:"Premium Textiles (Ord)",                 sector:"Textile Spinning",                close:22.0,   chg:0.18,  pct:0.82,  vol:1800000,  val:40000000   },
  { symbol:"QUML",    name:"Quality Textile Mills",                  sector:"Textile Spinning",                close:5.60,   chg:-0.05, pct:-0.89, vol:4600000,  val:26000000   },
  { symbol:"RASM",    name:"Ravi Textile Mills Limited",             sector:"Textile Spinning",                close:7.20,   chg:0.06,  pct:0.84,  vol:3400000,  val:25000000   },
  { symbol:"STML2",   name:"Shadman Cotton Mills",                   sector:"Textile Spinning",                close:9.20,   chg:0.08,  pct:0.88,  vol:2900000,  val:27000000   },
  { symbol:"TSML",    name:"Tariq Cotton Mills",                     sector:"Textile Spinning",                close:6.40,   chg:-0.05, pct:-0.78, vol:4100000,  val:26000000   },
  { symbol:"UTML",    name:"United Textile Mills",                   sector:"Textile Spinning",                close:8.80,   chg:0.07,  pct:0.80,  vol:3200000,  val:28000000   },
  { symbol:"WTML",    name:"Waqas Textile Mills",                    sector:"Textile Spinning",                close:5.20,   chg:-0.04, pct:-0.76, vol:4800000,  val:25000000   },
  // ── More Textile Composite ────────────────────────────────────────
  { symbol:"ATLM",    name:"Atlas Textile Mills",                    sector:"Textile Composite",               close:18.20,  chg:0.15,  pct:0.83,  vol:2400000,  val:44000000   },
  { symbol:"BTML",    name:"Blessed Textiles Limited",               sector:"Textile Composite",               close:24.0,   chg:0.20,  pct:0.84,  vol:1800000,  val:43000000   },
  { symbol:"FTML",    name:"Feroze 1888 Mills Limited",              sector:"Textile Composite",               close:182.0,  chg:1.52,  pct:0.84,  vol:128000,   val:23000000   },
  { symbol:"GIML",    name:"Gulistan (Pref) Textiles",               sector:"Textile Composite",               close:14.40,  chg:0.12,  pct:0.84,  vol:2100000,  val:30000000   },
  { symbol:"HTNL",    name:"Hantex Limited",                         sector:"Textile Composite",               close:8.20,   chg:-0.07, pct:-0.85, vol:3600000,  val:30000000   },
  { symbol:"MTML",    name:"Mohammad Farooq Textile",                sector:"Textile Composite",               close:6.80,   chg:0.06,  pct:0.89,  vol:4100000,  val:28000000   },
  { symbol:"NWML",    name:"Nishat (Pref) Mills",                    sector:"Textile Composite",               close:142.0,  chg:1.18,  pct:0.84,  vol:218000,   val:31000000   },
  { symbol:"PKVM",    name:"Pakistan Vinyl Mills",                   sector:"Textile Composite",               close:7.40,   chg:-0.06, pct:-0.81, vol:3800000,  val:28000000   },
  { symbol:"RCML",    name:"Ruby Textile Mills Limited",             sector:"Textile Composite",               close:9.60,   chg:0.08,  pct:0.84,  vol:2900000,  val:28000000   },
  { symbol:"SRML",    name:"Sargodha Spinning Mills",                sector:"Textile Composite",               close:5.80,   chg:-0.05, pct:-0.86, vol:4500000,  val:26000000   },
  { symbol:"TSMT",    name:"Tandlianwala Sugar Mills",               sector:"Textile Composite",               close:12.0,   chg:0.10,  pct:0.84,  vol:2600000,  val:31000000   },
  // ── More Sugar Mills ─────────────────────────────────────────────
  { symbol:"ALSSM",   name:"Al-Shaheer Corporation",                 sector:"Sugar & Allied Industries",       close:28.40,  chg:0.24,  pct:0.85,  vol:1600000,  val:45000000   },
  { symbol:"BHSM",    name:"Bawany Sugar Mills Limited",             sector:"Sugar & Allied Industries",       close:14.60,  chg:0.12,  pct:0.83,  vol:2800000,  val:41000000   },
  { symbol:"DFSM",    name:"D.S. Industries Limited",                sector:"Sugar & Allied Industries",       close:18.0,   chg:-0.15, pct:-0.83, vol:2100000,  val:38000000   },
  { symbol:"ESSA",    name:"Essa Industries Limited",                sector:"Sugar & Allied Industries",       close:8.40,   chg:0.07,  pct:0.84,  vol:3800000,  val:32000000   },
  { symbol:"IGSM",    name:"Indus Sugar Mills Limited",              sector:"Sugar & Allied Industries",       close:12.0,   chg:0.10,  pct:0.84,  vol:3200000,  val:38000000   },
  { symbol:"KHSM",    name:"Khurshid Sugar Mills",                   sector:"Sugar & Allied Industries",       close:22.0,   chg:0.18,  pct:0.83,  vol:2100000,  val:46000000   },
  { symbol:"LSSM",    name:"Layyah Sugar Mills",                     sector:"Sugar & Allied Industries",       close:16.80,  chg:0.14,  pct:0.84,  vol:2400000,  val:40000000   },
  { symbol:"MSML2",   name:"Mirpurkhas Sugar Mills",                 sector:"Sugar & Allied Industries",       close:22.0,   chg:-0.18, pct:-0.82, vol:2000000,  val:44000000   },
  { symbol:"PHSM",    name:"Premier Sugar Mills Limited",            sector:"Sugar & Allied Industries",       close:182.0,  chg:1.52,  pct:0.84,  vol:68000,    val:12000000   },
  { symbol:"QDSM",    name:"Qadinpur Sugar Mills",                   sector:"Sugar & Allied Industries",       close:14.20,  chg:0.12,  pct:0.85,  vol:2800000,  val:40000000   },
  { symbol:"SASM",    name:"Sakrand Sugar Mills",                    sector:"Sugar & Allied Industries",       close:18.80,  chg:0.16,  pct:0.86,  vol:2100000,  val:40000000   },
  { symbol:"TRSM",    name:"Tharparkar Sugar Mills",                 sector:"Sugar & Allied Industries",       close:8.60,   chg:0.07,  pct:0.82,  vol:3600000,  val:31000000   },
  // ── More Engineering & Steel ──────────────────────────────────────
  { symbol:"ASTM",    name:"Agritech Steel Mills",                   sector:"Engineering",                     close:14.80,  chg:0.12,  pct:0.82,  vol:2400000,  val:36000000   },
  { symbol:"BECO2",   name:"Beco Engineering Limited",               sector:"Engineering",                     close:8.40,   chg:-0.07, pct:-0.83, vol:3200000,  val:27000000   },
  { symbol:"DNML",    name:"Dost Steels (Pref) Limited",             sector:"Engineering",                     close:6.80,   chg:0.06,  pct:0.89,  vol:4100000,  val:28000000   },
  { symbol:"GLSM",    name:"Ghani Limited (Steel)",                  sector:"Engineering",                     close:22.0,   chg:0.18,  pct:0.83,  vol:2100000,  val:46000000   },
  { symbol:"MLSM",    name:"Millat Equipment Limited",               sector:"Engineering",                     close:892.0,  chg:7.42,  pct:0.84,  vol:28000,    val:25000000   },
  { symbol:"PASL",    name:"Pakistan Autos & Steel Div",             sector:"Engineering",                     close:18.0,   chg:-0.15, pct:-0.83, vol:2400000,  val:43000000   },
  { symbol:"PKST",    name:"Pakistan Steel Rolling Mills",            sector:"Engineering",                     close:4.60,   chg:-0.04, pct:-0.86, vol:6200000,  val:29000000   },
  { symbol:"PSSR",    name:"Pakarab Fertilizers Ltd",                sector:"Engineering",                     close:12.40,  chg:0.10,  pct:0.81,  vol:2800000,  val:35000000   },
  // ── More Power Gen ────────────────────────────────────────────────
  { symbol:"CPPG",    name:"Central Power Purchase Limited",         sector:"Power Generation & Distribution", close:8.80,   chg:0.07,  pct:0.80,  vol:3600000,  val:32000000   },
  { symbol:"DGKP",    name:"DG Khan Power Company",                  sector:"Power Generation & Distribution", close:12.40,  chg:0.10,  pct:0.81,  vol:2800000,  val:35000000   },
  { symbol:"FPML",    name:"Foundation Power Limited",               sector:"Power Generation & Distribution", close:6.80,   chg:-0.06, pct:-0.88, vol:4200000,  val:29000000   },
  { symbol:"HRPL",    name:"Hala Power Limited",                     sector:"Power Generation & Distribution", close:4.60,   chg:-0.04, pct:-0.86, vol:5800000,  val:27000000   },
  { symbol:"IPML",    name:"Innovative Power Limited",               sector:"Power Generation & Distribution", close:7.20,   chg:0.06,  pct:0.84,  vol:3800000,  val:27000000   },
  { symbol:"KPPL",    name:"Karot Power Company Limited",            sector:"Power Generation & Distribution", close:9.40,   chg:0.08,  pct:0.86,  vol:3100000,  val:29000000   },
  { symbol:"LTPL",    name:"Lalpir Power Limited",                   sector:"Power Generation & Distribution", close:22.0,   chg:0.18,  pct:0.83,  vol:2100000,  val:46000000   },
  { symbol:"MRPL",    name:"Mira Power Limited",                     sector:"Power Generation & Distribution", close:8.60,   chg:0.07,  pct:0.82,  vol:3600000,  val:31000000   },
  { symbol:"RTPL",    name:"Rousch (Pakistan) Power",                sector:"Power Generation & Distribution", close:42.0,   chg:0.35,  pct:0.84,  vol:1100000,  val:46000000   },
  { symbol:"SMPL",    name:"Sapphire Power (Ord)",                   sector:"Power Generation & Distribution", close:18.40,  chg:0.15,  pct:0.82,  vol:2100000,  val:39000000   },
  { symbol:"SOPL",    name:"Southern Oilfields Power",               sector:"Power Generation & Distribution", close:6.40,   chg:-0.05, pct:-0.78, vol:4800000,  val:31000000   },
  // ── More Cement ───────────────────────────────────────────────────
  { symbol:"ACCL",    name:"ACC Limited Pakistan",                   sector:"Cement",                          close:14.20,  chg:0.12,  pct:0.85,  vol:3200000,  val:45000000   },
  { symbol:"BHCL",    name:"Bestway Housing Cement",                 sector:"Cement",                          close:8.40,   chg:-0.07, pct:-0.83, vol:3900000,  val:33000000   },
  { symbol:"GHCM",    name:"Gharibwal Cement (Pref)",                sector:"Cement",                          close:30.0,   chg:0.25,  pct:0.84,  vol:2800000,  val:84000000   },
  { symbol:"JCPL",    name:"Javedan Corporation (Pref)",             sector:"Cement",                          close:22.0,   chg:0.18,  pct:0.83,  vol:2100000,  val:46000000   },
  { symbol:"PKCP",    name:"Pakcem Limited",                         sector:"Cement",                          close:6.80,   chg:0.06,  pct:0.89,  vol:4600000,  val:31000000   },
  // ── More Food & Personal Care ─────────────────────────────────────
  { symbol:"AWSM",    name:"Awn Engineering Limited",                sector:"Food & Personal Care Products",   close:4.80,   chg:-0.04, pct:-0.83, vol:5200000,  val:25000000   },
  { symbol:"DSFM",    name:"Dewan Sugar Food Industries",            sector:"Food & Personal Care Products",   close:8.20,   chg:0.07,  pct:0.86,  vol:3400000,  val:28000000   },
  { symbol:"FRSM",    name:"Fries Restaurant Solutions",             sector:"Food & Personal Care Products",   close:12.40,  chg:0.10,  pct:0.81,  vol:2800000,  val:35000000   },
  { symbol:"HWAS",    name:"Haleeb Foods Limited",                   sector:"Food & Personal Care Products",   close:42.0,   chg:0.35,  pct:0.84,  vol:1100000,  val:46000000   },
  { symbol:"KNFL",    name:"Knorr Foods Limited",                    sector:"Food & Personal Care Products",   close:8.40,   chg:-0.07, pct:-0.83, vol:3200000,  val:28000000   },
  { symbol:"MISM",    name:"Mitchell's Fruit Farms Ord",             sector:"Food & Personal Care Products",   close:72.0,   chg:0.60,  pct:0.84,  vol:168000,   val:12000000   },
  { symbol:"PKML",    name:"Pakistan Match Co. Limited",             sector:"Food & Personal Care Products",   close:348.0,  chg:2.90,  pct:0.84,  vol:48000,    val:17000000   },
  { symbol:"SFSM",    name:"Sufi Foods & Beverages",                 sector:"Food & Personal Care Products",   close:6.80,   chg:0.06,  pct:0.89,  vol:4100000,  val:28000000   },
  // ── More Insurance ────────────────────────────────────────────────
  { symbol:"AMIL",    name:"American Life Insurance",                sector:"Insurance",                       close:12.40,  chg:0.10,  pct:0.81,  vol:2800000,  val:35000000   },
  { symbol:"AICL",    name:"Askari Insurance Company",               sector:"Insurance",                       close:24.0,   chg:0.20,  pct:0.84,  vol:1600000,  val:38000000   },
  { symbol:"ATNL",    name:"Atlas Insurance Limited",                sector:"Insurance",                       close:18.80,  chg:0.16,  pct:0.86,  vol:1800000,  val:34000000   },
  { symbol:"EICL",    name:"East West Insurance (Pref)",             sector:"Insurance",                       close:8.80,   chg:0.07,  pct:0.80,  vol:3200000,  val:28000000   },
  { symbol:"NCML",    name:"New Jubilee Life Insurance",             sector:"Insurance",                       close:22.0,   chg:0.18,  pct:0.83,  vol:2100000,  val:46000000   },
  { symbol:"PLIC",    name:"Pakistan Life Insurance Corp",           sector:"Insurance",                       close:14.60,  chg:0.12,  pct:0.83,  vol:2800000,  val:41000000   },
  // ── More Chemicals ────────────────────────────────────────────────
  { symbol:"BASM",    name:"Bawany Air Products",                    sector:"Chemicals",                       close:148.0,  chg:1.23,  pct:0.84,  vol:128000,   val:19000000   },
  { symbol:"DFML2",   name:"Dawood Fabrics & Chemicals",             sector:"Chemicals",                       close:8.40,   chg:-0.07, pct:-0.83, vol:3200000,  val:27000000   },
  { symbol:"GALI",    name:"Gul Ahmed Lipids Industries",            sector:"Chemicals",                       close:12.0,   chg:0.10,  pct:0.84,  vol:2800000,  val:34000000   },
  { symbol:"PCCL",    name:"Pakistan Cables & Chemicals",            sector:"Chemicals",                       close:6.60,   chg:0.05,  pct:0.76,  vol:4200000,  val:28000000   },
  { symbol:"PTFL",    name:"Poly Tarpaulin Films Limited",           sector:"Chemicals",                       close:4.80,   chg:-0.04, pct:-0.83, vol:5400000,  val:26000000   },
  // ── More Pharma ───────────────────────────────────────────────────
  { symbol:"CSML",    name:"Chiesi Farmaceutici Pak",                sector:"Pharmaceuticals",                 close:28.0,   chg:0.23,  pct:0.83,  vol:1400000,  val:39000000   },
  { symbol:"DFPH",    name:"DawnPharma Limited",                     sector:"Pharmaceuticals",                 close:62.0,   chg:0.52,  pct:0.84,  vol:480000,   val:30000000   },
  { symbol:"MNTL",    name:"Munawar Pharma Limited",                 sector:"Pharmaceuticals",                 close:18.40,  chg:0.15,  pct:0.82,  vol:1800000,  val:33000000   },
  { symbol:"PRML",    name:"Premium Medical Limited",                sector:"Pharmaceuticals",                 close:8.40,   chg:0.07,  pct:0.84,  vol:3200000,  val:27000000   },
  { symbol:"SHRP",    name:"Shaigan Pharmaceuticals",                sector:"Pharmaceuticals",                 close:22.0,   chg:0.18,  pct:0.83,  vol:1800000,  val:40000000   },
  // ── More Vanaspati ────────────────────────────────────────────────
  { symbol:"AKGL",    name:"Akbar Group Lipids Limited",             sector:"Vanaspati & Allied Industries",   close:12.40,  chg:0.10,  pct:0.81,  vol:2800000,  val:35000000   },
  { symbol:"ARGL",    name:"Arif Habib Ghee Limited",                sector:"Vanaspati & Allied Industries",   close:8.20,   chg:-0.07, pct:-0.85, vol:3600000,  val:30000000   },
  { symbol:"HGLL",    name:"Habib Ghee & Lipids",                    sector:"Vanaspati & Allied Industries",   close:14.0,   chg:0.12,  pct:0.86,  vol:2400000,  val:34000000   },
  { symbol:"ZGLM",    name:"Zahid Ghee Limited",                     sector:"Vanaspati & Allied Industries",   close:6.80,   chg:0.06,  pct:0.89,  vol:4100000,  val:28000000   },
  // ── More Transport ────────────────────────────────────────────────
  { symbol:"DCBL",    name:"Dawood Cargo & Freight",                 sector:"Transport",                       close:8.40,   chg:-0.07, pct:-0.83, vol:3200000,  val:27000000   },
  { symbol:"KAHL",    name:"Karachi Ammunition Holdings",            sector:"Transport",                       close:12.0,   chg:0.10,  pct:0.84,  vol:2800000,  val:34000000   },
  { symbol:"PKFL",    name:"Pak Motorways Limited",                  sector:"Transport",                       close:6.20,   chg:0.05,  pct:0.81,  vol:4800000,  val:30000000   },
  // ── More Miscellaneous ────────────────────────────────────────────
  { symbol:"CCML",    name:"Citi Pharma Limited",                    sector:"Miscellaneous",                   close:18.80,  chg:0.16,  pct:0.86,  vol:2400000,  val:45000000   },
  { symbol:"DEML",    name:"Descon Engineering Limited",             sector:"Miscellaneous",                   close:28.0,   chg:0.23,  pct:0.83,  vol:1400000,  val:39000000   },
  { symbol:"EWML",    name:"Engro Workers Welfare Fund",             sector:"Miscellaneous",                   close:6.40,   chg:-0.05, pct:-0.78, vol:4800000,  val:31000000   },
  { symbol:"FGTL",    name:"Fauji Grain Terminal",                   sector:"Miscellaneous",                   close:12.40,  chg:0.10,  pct:0.81,  vol:2800000,  val:35000000   },
  { symbol:"GNSL",    name:"Ghandhara Nissan (Pref)",                sector:"Miscellaneous",                   close:68.0,   chg:0.57,  pct:0.84,  vol:480000,   val:33000000   },
  { symbol:"HPKL",    name:"Haleeb Pakistan Limited",                sector:"Miscellaneous",                   close:8.20,   chg:-0.07, pct:-0.85, vol:3600000,  val:30000000   },
  { symbol:"IPLM",    name:"International Industries Limited",       sector:"Miscellaneous",                   close:148.0,  chg:1.23,  pct:0.84,  vol:228000,   val:34000000   },
  { symbol:"JKSL",    name:"J.K. Spinning Mills",                    sector:"Miscellaneous",                   close:6.80,   chg:0.06,  pct:0.89,  vol:4100000,  val:28000000   },
  { symbol:"KPML",    name:"Kohinoor Power Mills Limited",           sector:"Miscellaneous",                   close:9.20,   chg:0.08,  pct:0.88,  vol:3100000,  val:28000000   },
  { symbol:"LNKL",    name:"Link Technologies Limited",              sector:"Miscellaneous",                   close:4.60,   chg:-0.04, pct:-0.86, vol:5800000,  val:27000000   },
  { symbol:"MTFL",    name:"Matco Foods (Pref)",                     sector:"Miscellaneous",                   close:62.0,   chg:0.52,  pct:0.84,  vol:520000,   val:38000000   },
  { symbol:"NRML",    name:"Nimir Resins Limited",                   sector:"Miscellaneous",                   close:28.0,   chg:0.23,  pct:0.83,  vol:1400000,  val:39000000   },
  { symbol:"PKFL2",   name:"Pakistan Fluoride Limited",              sector:"Miscellaneous",                   close:4.40,   chg:0.04,  pct:0.92,  vol:6200000,  val:27000000   },
  { symbol:"QLML",    name:"Quality Modaraba Limited",               sector:"Miscellaneous",                   close:6.60,   chg:0.05,  pct:0.76,  vol:4200000,  val:28000000   },
  { symbol:"RTML2",   name:"Ravi Textile (Pref) Mills",              sector:"Miscellaneous",                   close:8.80,   chg:0.07,  pct:0.80,  vol:3200000,  val:28000000   },
  { symbol:"STML3",   name:"Sunridge Textiles (Misc)",               sector:"Miscellaneous",                   close:7.20,   chg:0.06,  pct:0.84,  vol:3800000,  val:27000000   },
  // ── Islamic Finance / Takaful ─────────────────────────────────────
  { symbol:"PKQT",    name:"Pak-Qatar Takaful Group",                sector:"Insurance",                       close:5.62,   chg:0.08,  pct:1.44,  vol:3200000,  val:18000000   },
  { symbol:"PKQFL",   name:"Pak-Qatar Family Takaful",               sector:"Insurance",                       close:4.18,   chg:-0.05, pct:-1.18, vol:2100000,  val:8800000    },
  { symbol:"STFL",    name:"Salaam Takaful Limited",                  sector:"Insurance",                       close:8.90,   chg:0.12,  pct:1.37,  vol:4800000,  val:43000000   },
  { symbol:"WTFL",    name:"Wafa Takaful Limited",                    sector:"Insurance",                       close:3.42,   chg:-0.03, pct:-0.87, vol:2900000,  val:9900000    },
  { symbol:"PABL",    name:"Pakistan Alliance Limited",               sector:"Commercial Banks",                close:12.40,  chg:0.10,  pct:0.81,  vol:2800000,  val:35000000   },
  { symbol:"GTBL",    name:"Ghani Takaful Limited",                   sector:"Insurance",                       close:6.80,   chg:0.06,  pct:0.89,  vol:3400000,  val:23000000   },
  // ── More GEM Board / SME ─────────────────────────────────────────
  { symbol:"PMEX",    name:"Pakistan Mercantile Exchange",            sector:"Miscellaneous",                   close:28.40,  chg:0.24,  pct:0.85,  vol:980000,   val:28000000   },
  { symbol:"AIRLINK", name:"Airlink Communication Limited",           sector:"Technology & Communication",      close:102.50, chg:1.80,  pct:1.79,  vol:4800000,  val:492000000  },
  { symbol:"TELE2",   name:"Telecard Limited (Pref)",                 sector:"Technology & Communication",      close:1.98,   chg:-0.02, pct:-1.00, vol:6200000,  val:12000000   },
  { symbol:"INIL",    name:"International Industries (Pref)",         sector:"Miscellaneous",                   close:152.0,  chg:1.27,  pct:0.84,  vol:218000,   val:33000000   },
  { symbol:"KMEL",    name:"K-Electric Limited",                      sector:"Power Generation & Distribution", close:5.80,   chg:-0.05, pct:-0.86, vol:28000000, val:162000000  },
  { symbol:"LOTPTAB", name:"Lotte Chemical Pakistan Tab",             sector:"Chemicals",                       close:34.20,  chg:-0.29, pct:-0.84, vol:2600000,  val:89000000   },
  { symbol:"YOUW",    name:"You.We (Pakistan) Limited",               sector:"Technology & Communication",      close:7.40,   chg:0.06,  pct:0.82,  vol:3800000,  val:28000000   },
].sort((a,b) => a.symbol.localeCompare(b.symbol));

// KMI-compliant sectors (no conventional banking/insurance/interest-based)
const KMI_EXCLUDED = new Set(["Commercial Banks","Insurance","Investment Banks","Modarabas","Leasing Companies","Mutual Funds","Close-End Mutual Fund"]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPsxLive(date: string): Promise<any | null> {
  try {
    const { getPsxRows } = await import("@/lib/psx-live");
    const data = await getPsxRows();
    if (!data) return null;
    const { rows, sectors } = data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rowsForDate = rows.map((r: any) => ({ ...r, tradingDate: date }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalVolume = rows.reduce((s: number, r: any) => s + (parseInt(r.volume || "0") || 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalValue  = rows.reduce((s: number, r: any) => s + (parseFloat(r.marketValue || "0") || 0), 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const advancers   = rows.filter((r: any) => parseFloat(r.priceChange || "0") > 0).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decliners   = rows.filter((r: any) => parseFloat(r.priceChange || "0") < 0).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unchanged   = rows.filter((r: any) => parseFloat(r.priceChange || "0") === 0).length;
    return {
      date, rows: rowsForDate, sectors,
      totals: {
        totalVolume, totalValue,
        totalTrades: Math.floor(totalVolume / 1200),
        totalStocks: rows.length,
        advancers, decliners, unchanged,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        avgChange: rows.reduce((s: number, r: any) => s + (parseFloat(r.percentageChange || "0") || 0), 0) / rows.length,
      },
      indices: [],
    };
  } catch {
    return null;
  }
}

function buildDemoResponse(date: string) {
  // ── Build stable sector ID map (sorted alphabetically for consistency) ──
  const allSectorNames = [...new Set(DEMO_STOCKS.map(s => s.sector))].sort();
  const sectorIdMap = new Map<string, number>();
  allSectorNames.forEach((name, i) => sectorIdMap.set(name, i + 1));
  const sectors = allSectorNames.map(name => ({ id: sectorIdMap.get(name)!, name }));

  // ── Assign index memberships by market value ranking ──────────────────
  const byVal = [...DEMO_STOCKS].sort((a,b) => b.val - a.val);
  const kse100 = new Set(byVal.slice(0, 100).map(s => s.symbol));
  const kse30  = new Set(byVal.slice(0, 30).map(s => s.symbol));
  const kmiEligible = byVal.filter(s => !KMI_EXCLUDED.has(s.sector));
  const kmiAll = new Set(kmiEligible.map(s => s.symbol));
  const kmi30  = new Set(kmiEligible.slice(0, 30).map(s => s.symbol));

  const totalVolume = DEMO_STOCKS.reduce((s,r) => s + r.vol, 0);
  const totalValue  = DEMO_STOCKS.reduce((s,r) => s + r.val, 0);
  const advancers   = DEMO_STOCKS.filter(r => r.chg > 0).length;
  const decliners   = DEMO_STOCKS.filter(r => r.chg < 0).length;
  const unchanged   = DEMO_STOCKS.filter(r => r.chg === 0).length;

  const rows = DEMO_STOCKS.map(s => ({
    symbol: s.symbol, tradingDate: date,
    open: String((s.close - s.chg * 0.3).toFixed(2)),
    high: String((s.close + Math.abs(s.chg) * 0.8).toFixed(2)),
    low:  String((s.close - Math.abs(s.chg) * 0.9).toFixed(2)),
    close: String(s.close),
    previousClose: String((s.close - s.chg).toFixed(2)),
    priceChange: String(s.chg),
    percentageChange: String(s.pct.toFixed(4)),
    volume: String(s.vol),
    marketValue: String(s.val),
    numberOfTrades: Math.floor(s.vol / 1200),
    weekHigh52: String((s.close * 1.32).toFixed(2)),
    weekLow52:  String((s.close * 0.68).toFixed(2)),
    upperCircuit: null, lowerCircuit: null,
    isDemo: true,
    companyName: s.name,
    sectorName: s.sector,
    sectorId: sectorIdMap.get(s.sector) ?? null,   // ← fixed: proper sectorId
    shariahStatus: null,
    // index memberships for client-side filtering
    indexCodes: [
      ...(kse100.has(s.symbol) ? ["KSE100"] : []),
      ...(kse30.has(s.symbol)  ? ["KSE30"]  : []),
      ...(kmi30.has(s.symbol)  ? ["KMI30"]  : []),
      ...(kmiAll.has(s.symbol) ? ["KMIALL"] : []),
    ],
  }));

  const demoIndices = [
    { indexCode:"KSE100", indexName:"KSE 100 Index",      close:"180059.79", change:"-1259.45", percentageChange:"-0.6950", high:"181500.00", low:"179200.00", previousClose:"181319.24" },
    { indexCode:"KSE30",  indexName:"KSE 30 Index",       close:"1924.25",   change:"-4.50",    percentageChange:"-0.2331", high:"1932.00",   low:"1918.00",   previousClose:"1928.75"   },
    { indexCode:"KMIALL", indexName:"KMI All Share Index", close:"108894.65", change:"-501.00",  percentageChange:"-0.4584", high:"109500.00", low:"108400.00", previousClose:"109395.65" },
    { indexCode:"KMI30",  indexName:"KMI 30 Index",       close:"253326.40", change:"-2396.00", percentageChange:"-0.9383", high:"256000.00", low:"252800.00", previousClose:"255722.40" },
  ];

  return {
    date,
    rows,
    totals: {
      totalVolume, totalValue,
      totalTrades: Math.floor(totalVolume / 1200),
      totalStocks: rows.length,
      advancers, decliners, unchanged,
      avgChange: DEMO_STOCKS.reduce((s,r) => s + r.pct, 0) / DEMO_STOCKS.length,
    },
    indices: demoIndices,
    sectors,
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rawDate   = sp.get("date")      ?? "";
  const search    = (sp.get("search")   ?? "").trim().toLowerCase();
  const sectorId  = sp.get("sectorId")  ?? "";
  const indexCode = sp.get("indexCode") ?? "";
  const sortBy    = sp.get("sortBy")    ?? "symbol";
  const sortDir   = sp.get("sortDir")   === "desc" ? "desc" : "asc";

  const date = rawDate || new Date().toISOString().slice(0, 10);

  // Cache key only for unfiltered requests (the most common case: stocks page load)
  const cacheKey = !search && !sectorId && !indexCode ? `${date}:${sortBy}:${sortDir}` : null;
  if (cacheKey) {
    const hit = getCached(cacheKey);
    if (hit) return NextResponse.json(hit, { headers: { "X-Cache": "HIT" } });
  }

  try {
    // ── Build WHERE conditions ──────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [eq(dailyStockPrices.tradingDate, date)];
    if (search) {
      conditions.push(
        sql`(${dailyStockPrices.symbol} ILIKE ${`%${search}%`} OR ${companies.name} ILIKE ${`%${search}%`})`
      );
    }
    if (sectorId) conditions.push(eq(companies.sectorId, Number(sectorId)));
    if (indexCode) {
      const idxRows = await db.select({ id: indices.id }).from(indices)
        .where(eq(indices.code, indexCode));
      const idx = idxRows[0];
      if (idx) {
        conditions.push(
          sql`${dailyStockPrices.companyId} IN (
            SELECT company_id FROM index_constituents
            WHERE index_id = ${idx.id} AND is_active = true
          )`
        );
      }
    }

    // ── ORDER BY ──────────────────────────────────────────────
    const dir = sortDir === "desc" ? desc : asc;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colMap: Record<string,any> = {
      symbol: dir(dailyStockPrices.symbol),
      close: dir(dailyStockPrices.close),
      percentageChange: dir(dailyStockPrices.percentageChange),
      priceChange: dir(dailyStockPrices.priceChange),
      volume: dir(dailyStockPrices.volume),
      marketValue: dir(dailyStockPrices.marketValue),
      numberOfTrades: dir(dailyStockPrices.numberOfTrades),
      open: dir(dailyStockPrices.open),
      high: dir(dailyStockPrices.high),
      low: dir(dailyStockPrices.low),
      previousClose: dir(dailyStockPrices.previousClose),
    };
    const orderClause = colMap[sortBy] ?? asc(dailyStockPrices.symbol);

    // ── Run all queries in parallel with a 4s timeout ────────
    const qRows = db
      .select({
        symbol:           dailyStockPrices.symbol,
        tradingDate:      dailyStockPrices.tradingDate,
        open:             dailyStockPrices.open,
        high:             dailyStockPrices.high,
        low:              dailyStockPrices.low,
        close:            dailyStockPrices.close,
        previousClose:    dailyStockPrices.previousClose,
        priceChange:      dailyStockPrices.priceChange,
        percentageChange: dailyStockPrices.percentageChange,
        volume:           dailyStockPrices.volume,
        marketValue:      dailyStockPrices.marketValue,
        numberOfTrades:   dailyStockPrices.numberOfTrades,
        weekHigh52:       dailyStockPrices.weekHigh52,
        weekLow52:        dailyStockPrices.weekLow52,
        upperCircuit:     dailyStockPrices.upperCircuit,
        lowerCircuit:     dailyStockPrices.lowerCircuit,
        isDemo:           dailyStockPrices.isDemo,
        companyName:      companies.name,
        sectorName:       sectors.name,
        sectorId:         companies.sectorId,
        shariahStatus:    companies.shariahStatus,
      })
      .from(dailyStockPrices)
      .leftJoin(companies, eq(dailyStockPrices.companyId, companies.id))
      .leftJoin(sectors, eq(companies.sectorId, sectors.id))
      .where(and(...conditions))
      .orderBy(orderClause);

    const qAgg = db
      .select({
        totalVolume: sql<string>`COALESCE(SUM(${dailyStockPrices.volume}),0)`,
        totalValue:  sql<string>`COALESCE(SUM(${dailyStockPrices.marketValue}),0)`,
        totalTrades: sql<string>`COALESCE(SUM(${dailyStockPrices.numberOfTrades}),0)`,
        totalStocks: sql<number>`COUNT(*)`,
        advancers:   sql<number>`COUNT(*) FILTER (WHERE ${dailyStockPrices.percentageChange} > 0)`,
        decliners:   sql<number>`COUNT(*) FILTER (WHERE ${dailyStockPrices.percentageChange} < 0)`,
        unchanged:   sql<number>`COUNT(*) FILTER (WHERE ${dailyStockPrices.percentageChange} = 0)`,
        avgChange:   sql<string>`COALESCE(AVG(${dailyStockPrices.percentageChange}),0)`,
      })
      .from(dailyStockPrices)
      .where(eq(dailyStockPrices.tradingDate, date));

    const qIdx = db
      .select({
        indexCode:        dailyIndexValues.indexCode,
        indexName:        indices.name,
        close:            dailyIndexValues.close,
        change:           dailyIndexValues.change,
        percentageChange: dailyIndexValues.percentageChange,
        high:             dailyIndexValues.high,
        low:              dailyIndexValues.low,
        previousClose:    dailyIndexValues.previousClose,
      })
      .from(dailyIndexValues)
      .leftJoin(indices, eq(dailyIndexValues.indexId, indices.id))
      .where(eq(dailyIndexValues.tradingDate, date))
      .orderBy(dailyIndexValues.indexCode);

    const qSec = db
      .select({ id: sectors.id, name: sectors.name })
      .from(sectors)
      .orderBy(asc(sectors.name));

    const dbTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB timeout")), 5000)
    );

    const [rows, aggRows, indexRows, sectorList] = await Promise.race([
      Promise.all([qRows, qAgg, qIdx, qSec]),
      dbTimeout,
    ]);
    const agg = aggRows[0];

    // ── If DB has fewer than 100 stocks, use PSX live data (or demo fallback) ──
    if (rows.length < 100) {
      const live = await fetchPsxLive(date);
      const src = live ?? buildDemoResponse(date);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let filtered: any[] = src.rows;
      if (search) {
        const qFlat = search.replace(/[^a-z0-9]/g, "");
        const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filtered = filtered.filter((r: any) =>
          r.symbol.toLowerCase().includes(search) ||
          (r.companyName ?? "").toLowerCase().includes(search) ||
          flat(r.symbol).includes(qFlat) ||
          flat(r.companyName ?? "").includes(qFlat)
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (sectorId) filtered = filtered.filter((r: any) => String(r.sectorId) === sectorId);
      return NextResponse.json({ ...src, rows: filtered, date });
    }

    const payload = {
      date,
      rows,
      totals: {
        totalVolume: Number(agg?.totalVolume ?? 0),
        totalValue:  Number(agg?.totalValue  ?? 0),
        totalTrades: Number(agg?.totalTrades ?? 0),
        totalStocks: Number(agg?.totalStocks ?? 0),
        advancers:   Number(agg?.advancers   ?? 0),
        decliners:   Number(agg?.decliners   ?? 0),
        unchanged:   Number(agg?.unchanged   ?? 0),
        avgChange:   Number(agg?.avgChange   ?? 0),
      },
      indices: indexRows.length ? indexRows : [],
      sectors: sectorList,
    };
    if (cacheKey) setCached(cacheKey, payload);
    return NextResponse.json(payload);

  } catch (err) {
    console.error("[stocks api] query failed, trying PSX live:", err);
    const live = await fetchPsxLive(date);
    const src = live ?? buildDemoResponse(date);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let filtered: any[] = src.rows;
    if (search) {
      const qFlat = search.replace(/[^a-z0-9]/g, "");
      const flat = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filtered = filtered.filter((r: any) =>
        r.symbol.toLowerCase().includes(search) ||
        (r.companyName ?? "").toLowerCase().includes(search) ||
        flat(r.symbol).includes(qFlat) ||
        flat(r.companyName ?? "").includes(qFlat)
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (sectorId) filtered = filtered.filter((r: any) => String(r.sectorId) === sectorId);
    return NextResponse.json({ ...src, rows: filtered, date });
  }
}
