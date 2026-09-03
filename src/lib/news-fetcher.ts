/**
 * Fetches RSS feeds from PSX financial news sources and parses them.
 * All server-side — no CORS issues.
 */

export interface RawArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceUrl: string;
  sourceColor: string;
  imageUrl: string;   // extracted from enclosure / media:content / description img
}

const SOURCES = [
  {
    name: "Business Recorder",
    url: "https://www.brecorder.com/feed/rss/",
    color: "#dc2626",
    baseUrl: "https://www.brecorder.com",
  },
  {
    name: "Dawn Business",
    url: "https://www.dawn.com/feeds/business-finance",
    color: "#15803d",
    baseUrl: "https://www.dawn.com",
  },
  {
    name: "The News Business",
    url: "https://www.thenews.com.pk/rss/2/6",
    color: "#b45309",
    baseUrl: "https://www.thenews.com.pk",
  },
];

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(xml: string, tag: string): string {
  const patterns = [
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"),
  ];
  for (const p of patterns) {
    const m = xml.match(p);
    if (m?.[1]) return stripHtml(m[1].trim());
  }
  return "";
}

function extractImageUrl(item: string): string {
  // 1. <enclosure url="..." type="image/..."/>
  const enc = item.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image[^"']*["']/i)
           ?? item.match(/<enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/i);
  if (enc?.[1]) return enc[1];

  // 2. <media:content url="..." medium="image" .../>
  const mc = item.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*medium=["']image["']/i)
          ?? item.match(/<media:content[^>]+url=["']([^"']+\.(jpg|jpeg|png|webp)[^"']*)["']/i);
  if (mc?.[1]) return mc[1];

  // 3. <media:thumbnail url="..."/>
  const mt = item.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
  if (mt?.[1]) return mt[1];

  // 4. <og:image> or itemprop="image"
  const og = item.match(/<og:image[^>]*>([^<]+)<\/og:image>/i);
  if (og?.[1]) return og[1].trim();

  // 5. First <img src="..."> inside description CDATA
  const img = item.match(/<img[^>]+src=["']([^"']+\.(jpg|jpeg|png|webp)[^"']*)["']/i);
  if (img?.[1]) return img[1];

  return "";
}

function parseItems(xml: string, source: typeof SOURCES[0]): RawArticle[] {
  const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  return itemMatches.slice(0, 12).map(m => {
    const item = m[1];
    return {
      title: extractTag(item, "title"),
      link: extractTag(item, "link") || source.baseUrl,
      description: extractTag(item, "description"),
      pubDate: extractTag(item, "pubDate"),
      source: source.name,
      sourceUrl: source.baseUrl,
      sourceColor: source.color,
      imageUrl: extractImageUrl(item),
    };
  }).filter(a => a.title.length > 10);
}

const PSX_KEYWORDS = ["psx","kse","stock","share","market","equity","invest","dividend","karachi","pakistan","economy","rupee","pkr","sbp","inflation","gdp","trade","export","import","bank","cement","oil","gas","fertilizer","pharma","textile","sector"];

function isPsxRelevant(title: string, desc: string): boolean {
  const text = (title + " " + desc).toLowerCase();
  return PSX_KEYWORDS.some(k => text.includes(k));
}

export async function fetchAllNews(): Promise<RawArticle[]> {
  const allArticles: RawArticle[] = [];

  await Promise.allSettled(
    SOURCES.map(async source => {
      try {
        const res = await fetch(source.url, {
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "Stockifyy-News-Bot/1.0" },
          next: { revalidate: 0 },
        });
        if (!res.ok) return;
        const xml = await res.text();
        const items = parseItems(xml, source);
        allArticles.push(...items.filter(a => isPsxRelevant(a.title, a.description)));
      } catch {
        // individual source failure is acceptable
      }
    })
  );

  // Deduplicate by title similarity (first 50 chars)
  const seen = new Set<string>();
  return allArticles.filter(a => {
    const key = a.title.slice(0, 50).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
