/**
 * News store — file-based cache so DB migration is not required.
 * Stores processed PSX news articles as JSON. The refresh route
 * writes here; the GET route reads from here instantly.
 */
import fs from "fs";
import path from "path";

export interface NewsArticle {
  id: string;
  title: string;
  headline: string;        // AI-generated professional headline
  summary: string;         // AI summary (2-3 sentences)
  source: string;
  sourceUrl: string;
  sourceColor: string;
  category: string;        // PSX Market / Stocks / Economy / Company
  impact: "Positive" | "Negative" | "Neutral";
  impactReason: string;    // one-line why
  stocks: string[];        // mentioned PSX stock symbols
  publishedAt: string;     // ISO string from source
  fetchedAt: string;       // when we fetched it
  imgGradient: string;     // CSS gradient for card banner (fallback)
  imageUrl:    string;     // actual image URL from RSS feed (may be empty)
}

export interface NewsCache {
  articles: NewsArticle[];
  lastRefreshed: string;   // ISO timestamp
  nextRefresh: string;     // ISO timestamp (lastRefreshed + 1hr)
}

const CACHE_PATH = path.join(process.cwd(), "data", "news-cache.json");
const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

function ensureDir() {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Seed articles shown instantly on first load before RSS fetch completes
const SEED_ARTICLES: NewsArticle[] = [
  { id:"seed-1", title:"KSE-100 edges up as banking stocks lead gains", headline:"KSE-100 Extends Rally — Banking Sector Drives Index Higher", summary:"The KSE-100 index extended its upward momentum as banking stocks posted solid gains amid improving macro sentiment. MEBL and MCB led the advance, with volumes picking up in the afternoon session.", source:"Business Recorder", sourceUrl:"https://www.brecorder.com", sourceColor:"#dc2626", category:"PSX Market", impact:"Positive", impactReason:"Banking sector strength, broad market buying", stocks:["MEBL","MCB","HBL"], publishedAt:new Date(Date.now()-2*3600000).toISOString(), fetchedAt:new Date().toISOString(), imgGradient:"linear-gradient(135deg,#1e3a5f 0%,#0f2440 100%)", imageUrl:"https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80&auto=format&fit=crop" },
  { id:"seed-2", title:"SBP holds policy rate at 11% — analysts see more cuts ahead", headline:"SBP Holds Rate at 11% — Market Expects Another Cut in October", summary:"The State Bank of Pakistan maintained its benchmark policy rate at 11% following its latest monetary policy meeting. Analysts anticipate a further 100bps reduction in October given CPI printing at 9.2%.", source:"Dawn Business", sourceUrl:"https://www.dawn.com", sourceColor:"#15803d", category:"Economy", impact:"Positive", impactReason:"Stable rates with easing bias positive for equities", stocks:["UBL","BAFL","BAHL"], publishedAt:new Date(Date.now()-4*3600000).toISOString(), fetchedAt:new Date().toISOString(), imgGradient:"linear-gradient(135deg,#14532d 0%,#052e16 100%)", imageUrl:"https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80&auto=format&fit=crop" },
  { id:"seed-3", title:"LUCK cement posts record dispatches in August", headline:"Lucky Cement Reports Record Monthly Dispatches in August 2026", summary:"Lucky Cement (LUCK) reported August 2026 dispatches of 842K tonnes, a 19% year-on-year increase and a new monthly record. Rising infrastructure activity is supporting robust demand across the sector.", source:"The News Business", sourceUrl:"https://www.thenews.com.pk", sourceColor:"#b45309", category:"Company News", impact:"Positive", impactReason:"Record dispatches signal strong demand recovery", stocks:["LUCK","MLCF","DGKC"], publishedAt:new Date(Date.now()-6*3600000).toISOString(), fetchedAt:new Date().toISOString(), imgGradient:"linear-gradient(135deg,#3b0764 0%,#1e1b4b 100%)", imageUrl:"https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format&fit=crop" },
  { id:"seed-4", title:"Pakistan IT exports cross $3.8Bn mark in FY26 — PSEB", headline:"Pakistan IT Exports Hit $3.8Bn Record in FY26 — SYS, TRG Outperform", summary:"Pakistan Software Export Board confirmed IT exports reached $3.8Bn in FY26, growing 28% YoY — the highest annual figure on record. Systems Limited and TRG Pakistan are the primary beneficiaries.", source:"Business Recorder", sourceUrl:"https://www.brecorder.com", sourceColor:"#dc2626", category:"Economy", impact:"Positive", impactReason:"Record IT exports boost tech sector sentiment", stocks:["SYS","TRG","AVN","NETSOL"], publishedAt:new Date(Date.now()-8*3600000).toISOString(), fetchedAt:new Date().toISOString(), imgGradient:"linear-gradient(135deg,#1e40af 0%,#1e3a8a 100%)", imageUrl:"https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80&auto=format&fit=crop" },
  { id:"seed-5", title:"PKR holds steady against dollar — SBP intervention supports", headline:"PKR Steady at 280 — SBP Reserves Rise for Fourth Consecutive Week", summary:"The Pakistani Rupee held steady in the 279–281 band against the US dollar as SBP's foreign reserves rose for a fourth consecutive week to $12.8Bn. Improved remittance flows are supporting the currency.", source:"Dawn Business", sourceUrl:"https://www.dawn.com", sourceColor:"#15803d", category:"Economy", impact:"Neutral", impactReason:"Currency stability reduces import cost pressure", stocks:["PSO","MARI","OGDC"], publishedAt:new Date(Date.now()-10*3600000).toISOString(), fetchedAt:new Date().toISOString(), imgGradient:"linear-gradient(135deg,#065f46 0%,#022c22 100%)", imageUrl:"https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80&auto=format&fit=crop" },
  { id:"seed-6", title:"OGDC announces dividend of Rs 2.50 per share for Q1 FY27", headline:"OGDC Declares Rs 2.50/Share Interim Dividend for Q1 FY27", summary:"Oil and Gas Development Company (OGDC) announced an interim cash dividend of Rs 2.50 per share for the first quarter of FY27, sustaining its high payout ratio despite ongoing receivable pressures.", source:"The News Business", sourceUrl:"https://www.thenews.com.pk", sourceColor:"#b45309", category:"Company News", impact:"Positive", impactReason:"Dividend announcement boosts investor confidence", stocks:["OGDC","PPL","MARI"], publishedAt:new Date(Date.now()-12*3600000).toISOString(), fetchedAt:new Date().toISOString(), imgGradient:"linear-gradient(135deg,#7c2d12 0%,#431407 100%)", imageUrl:"https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=800&q=80&auto=format&fit=crop" },
];

export function readCache(): NewsCache | null {
  try {
    ensureDir();
    if (!fs.existsSync(CACHE_PATH)) return null;
    const raw = fs.readFileSync(CACHE_PATH, "utf-8");
    return JSON.parse(raw) as NewsCache;
  } catch {
    return null;
  }
}

// Returns seed articles with a short TTL — replaced by real RSS on first refresh
export function getSeedCache(): NewsCache {
  const now = new Date();
  return {
    articles: SEED_ARTICLES,
    lastRefreshed: new Date(now.getTime() - 50 * 60 * 1000).toISOString(), // marked as 50 min old → triggers refresh
    nextRefresh: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),   // but gives 10 min before next poll
  };
}

export function writeCache(articles: NewsArticle[]) {
  ensureDir();
  const now = new Date();
  const cache: NewsCache = {
    articles,
    lastRefreshed: now.toISOString(),
    nextRefresh: new Date(now.getTime() + REFRESH_INTERVAL_MS).toISOString(),
  };
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  return cache;
}

export function isCacheStale(cache: NewsCache | null): boolean {
  if (!cache) return true;
  return new Date() >= new Date(cache.nextRefresh);
}
