/**
 * Claude AI processing layer for news articles.
 * Runs server-side only. Gracefully falls back if API key is missing.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { RawArticle } from "./news-fetcher";
import type { NewsArticle } from "./news-store";

const PSX_SYMBOLS = new Set([
  "HBL","UBL","MCB","MEBL","NBP","ABL","BAFL","BAHL","AKBL","FABL","SILK","SNBL","JSBL","SMBL","BOP","BIPL",
  "OGDC","PPL","MARI","POL","PSO","APL","ATRL","NRL","SNGP","IGAS","GAIL",
  "FFC","EFERT","FFBL","FATIMA","ENGRO","LUCK","DGKC","BWCL","FCCL","MLCF","ACPL","PIOC","KOHC","CHCC",
  "HUBC","KAPCO","KEL","SYS","TRG","AVN","NETSOL","AIRLINK","WNDT",
  "PSMC","INDU","HCAR","GHNI","AGTL","ABOT","SEARL","GLAXO","HINOON",
  "NML","GATM","BHANERO","ICI","EPCL","LOTCHEM","SITARA",
  "MUGHAL","ISL","ASTL","PTC","NESTLE","COLG","UNILEVER","PGC","UNITY",
  "JLICL","EFU","ADAMJEE","IGI","PNSC","BATA","SRVI","PCAL","PAEL","PAKT","AHCL","AKDHL",
]);

const GRADIENTS = [
  "linear-gradient(135deg,#1e3a5f 0%,#0f2440 100%)",
  "linear-gradient(135deg,#7c2d12 0%,#431407 100%)",
  "linear-gradient(135deg,#14532d 0%,#052e16 100%)",
  "linear-gradient(135deg,#3b0764 0%,#1e1b4b 100%)",
  "linear-gradient(135deg,#1e40af 0%,#1e3a8a 100%)",
  "linear-gradient(135deg,#065f46 0%,#022c22 100%)",
  "linear-gradient(135deg,#7f1d1d 0%,#450a0a 100%)",
  "linear-gradient(135deg,#0c4a6e 0%,#082f49 100%)",
];

function extractStocks(text: string): string[] {
  const found: string[] = [];
  const upper = text.toUpperCase();
  for (const sym of PSX_SYMBOLS) {
    if (upper.includes(sym)) found.push(sym);
  }
  return [...new Set(found)].slice(0, 5);
}

function fallbackProcess(raw: RawArticle, idx: number): NewsArticle {
  const impact = (() => {
    const t = (raw.title + raw.description).toLowerCase();
    if (/gain|rise|surge|rally|bull|positive|profit|growth|strong|jump|soar/.test(t)) return "Positive" as const;
    if (/fall|drop|decline|loss|bear|negative|weak|slide|plunge|crash/.test(t)) return "Negative" as const;
    return "Neutral" as const;
  })();
  const catMap: Record<string, string> = {
    "Business Recorder": "Market Update",
    "Dawn Business": "Economy",
    "The News Business": "Stocks",
  };
  return {
    id: `${Date.now()}-${idx}`,
    title: raw.title,
    headline: raw.title,
    summary: raw.description.slice(0, 220) || "Latest developments from the Pakistan Stock Exchange.",
    source: raw.source,
    sourceUrl: raw.link || raw.sourceUrl,
    sourceColor: raw.sourceColor,
    category: catMap[raw.source] || "PSX Market",
    impact,
    impactReason: impact === "Positive" ? "Bullish sentiment detected" : impact === "Negative" ? "Bearish signals present" : "Neutral market development",
    stocks: extractStocks(raw.title + raw.description),
    publishedAt: raw.pubDate ? new Date(raw.pubDate).toISOString() : new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    imgGradient: GRADIENTS[idx % GRADIENTS.length],
    imageUrl: raw.imageUrl ?? "",
  };
}

export async function processArticlesWithAI(rawArticles: RawArticle[]): Promise<NewsArticle[]> {
  if (rawArticles.length === 0) return [];
  // Instant keyword-based processing — no AI latency
  const results = rawArticles.map((a, i) => fallbackProcess(a, i));
  // Sort: Positive first, then by publishedAt desc
  return results.sort((a, b) => {
    const order = { Positive: 0, Negative: 1, Neutral: 2 };
    const io = order[a.impact] - order[b.impact];
    if (io !== 0) return io;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}
