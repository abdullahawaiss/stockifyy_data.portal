"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { NewsArticle } from "@/lib/news-store";

const IMPACT_CONFIG = {
  Positive: { color:"#16a34a", bg:"rgba(22,163,74,0.12)",  border:"rgba(22,163,74,0.25)", icon:"▲" },
  Negative: { color:"#dc2626", bg:"rgba(220,38,38,0.12)",  border:"rgba(220,38,38,0.25)", icon:"▼" },
  Neutral:  { color:"#6b7280", bg:"rgba(107,114,128,0.10)", border:"rgba(107,114,128,0.2)", icon:"●" },
};

const SOURCE_COLORS: Record<string, string> = {
  "Business Recorder": "#dc2626",
  "Dawn Business":     "#15803d",
  "The News Business": "#b45309",
};

// Curated financial/market Unsplash photos — always show a real image
const ARTICLE_IMAGES = [
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&q=80&auto=format&fit=crop", // stock charts
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80&auto=format&fit=crop", // trading screens
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=900&q=80&auto=format&fit=crop", // market data
  "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=900&q=80&auto=format&fit=crop", // finance/banking
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=900&q=80&auto=format&fit=crop", // accounting/tax
  "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=900&q=80&auto=format&fit=crop", // currency/money
  "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=900&q=80&auto=format&fit=crop", // oil/energy
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=80&auto=format&fit=crop", // construction/cement
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80&auto=format&fit=crop", // tech/IT
  "https://images.unsplash.com/photo-1543699936-7d185f4b3a78?w=900&q=80&auto=format&fit=crop", // economy/growth
  "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=900&q=80&auto=format&fit=crop", // investment
  "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=900&q=80&auto=format&fit=crop", // crypto/digital finance
];

function getArticleImage(article: NewsArticle): string {
  if (article.imageUrl) return article.imageUrl;
  // Pick deterministically by article id hash so each article always gets the same image
  let hash = 0;
  for (let i = 0; i < article.id.length; i++) hash = (hash * 31 + article.id.charCodeAt(i)) | 0;
  return ARTICLE_IMAGES[Math.abs(hash) % ARTICLE_IMAGES.length];
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── Skeleton ── */
function Skeleton({ h = 340 }: { h?: number }) {
  return (
    <div className="card" style={{ overflow:"hidden", height:h }}>
      <div style={{ height:h*0.38, background:"linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite" }} />
      <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:10 }}>
        <div style={{ height:10, borderRadius:6, background:"#e5e7eb", width:"35%" }} />
        <div style={{ height:16, borderRadius:6, background:"#e5e7eb", width:"92%" }} />
        <div style={{ height:11, borderRadius:6, background:"#e5e7eb", width:"80%" }} />
        <div style={{ height:11, borderRadius:6, background:"#e5e7eb", width:"70%" }} />
      </div>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );
}

/* ── Hero card (featured / first article) ── */
function HeroCard({ article }: { article: NewsArticle }) {
  const impact = IMPACT_CONFIG[article.impact];
  return (
    <div className="card" style={{ overflow:"hidden", cursor:"pointer", transition:"box-shadow 200ms, transform 200ms" }}
      onClick={() => window.open(article.sourceUrl, "_blank", "noopener,noreferrer")}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 16px 40px rgba(0,0,0,0.15)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform="none"; (e.currentTarget as HTMLElement).style.boxShadow=""; }}>

      {/* Banner */}
      <div style={{ height:220, background:article.imgGradient, position:"relative", overflow:"hidden" }}>
        <img src={getArticleImage(article)} alt="" loading="lazy"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center" }} />
        {/* Dark overlay so text stays readable over photo */}
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.45)" }} />
        {/* Decorative chart line */}
        <svg style={{ position:"absolute", bottom:0, left:0, right:0, width:"100%", height:60, opacity:0.2 }} viewBox="0 0 500 60" preserveAspectRatio="none">
          <polyline points="0,50 80,35 160,42 240,18 320,28 400,12 500,5" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <polygon points="0,50 80,35 160,42 240,18 320,28 400,12 500,5 500,60 0,60" fill="rgba(255,255,255,0.06)"/>
        </svg>

        {/* Badges */}
        <div style={{ position:"absolute", top:14, left:16, display:"flex", gap:6 }}>
          <span style={{ padding:"4px 12px", borderRadius:20, background:"rgba(0,0,0,0.55)", color:"#fff", fontSize:10.5, fontWeight:800, backdropFilter:"blur(6px)", letterSpacing:"0.04em" }}>{article.source}</span>
          <span style={{ padding:"4px 12px", borderRadius:20, background: SOURCE_COLORS[article.source]+"cc", color:"#fff", fontSize:10.5, fontWeight:700 }}>{article.category}</span>
        </div>
        <div style={{ position:"absolute", top:14, right:16, padding:"4px 11px", borderRadius:20, background: impact.bg, color: impact.color, fontSize:10.5, fontWeight:800, backdropFilter:"blur(6px)", border:`1px solid ${impact.border}` }}>
          {impact.icon} {article.impact}
        </div>

        {/* Time */}
        <div style={{ position:"absolute", bottom:14, right:16, background:"rgba(0,0,0,0.6)", color:"rgba(255,255,255,0.9)", fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:12, backdropFilter:"blur(4px)" }}>
          {timeAgo(article.publishedAt)}
        </div>

        {/* Headline overlay */}
        <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"70px 20px 20px", background:"linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)" }}>
          <h2 style={{ margin:0, fontSize:19, fontWeight:900, color:"#fff", lineHeight:1.35, textShadow:"0 2px 8px rgba(0,0,0,0.4)" }}>{article.headline}</h2>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"18px 20px" }}>
        <p style={{ margin:"0 0 14px", fontSize:13, color:"var(--text-muted)", lineHeight:1.7 }}>{article.summary}</p>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {article.stocks.length > 0 && (
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {article.stocks.map(s => (
                <span key={s} style={{ padding:"3px 9px", borderRadius:7, background:"rgba(200,134,10,0.12)", color:"#C8860A", fontSize:10, fontWeight:800 }}>{s}</span>
              ))}
            </div>
          )}
          <span style={{ fontSize:12, color:"#C8860A", fontWeight:700, flexShrink:0, marginLeft:"auto" }}>Read Full Story →</span>
        </div>
      </div>
    </div>
  );
}

/* ── Standard news card ── */
function NewsCard({ article, featured = false }: { article: NewsArticle; featured?: boolean }) {
  const impact = IMPACT_CONFIG[article.impact];
  const bannerH = featured ? 130 : 100;
  return (
    <div className="card" style={{ overflow:"hidden", cursor:"pointer", transition:"box-shadow 150ms, transform 150ms", display:"flex", flexDirection:"column" }}
      onClick={() => window.open(article.sourceUrl, "_blank", "noopener,noreferrer")}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow="0 8px 24px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform="none"; (e.currentTarget as HTMLElement).style.boxShadow=""; }}>

      <div style={{ height:bannerH, background:article.imgGradient, position:"relative", flexShrink:0, overflow:"hidden" }}>
        <img src={getArticleImage(article)} alt="" loading="lazy"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center" }} />
        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.38)" }} />
        <div style={{ position:"absolute", top:8, left:10, display:"flex", gap:5 }}>
          <span style={{ padding:"2px 8px", borderRadius:16, background:"rgba(0,0,0,0.55)", color:"#fff", fontSize:9, fontWeight:800, backdropFilter:"blur(4px)" }}>{article.source}</span>
        </div>
        <div style={{ position:"absolute", top:8, right:10, padding:"2px 8px", borderRadius:16, background: impact.bg, color: impact.color, fontSize:9, fontWeight:800, backdropFilter:"blur(4px)" }}>
          {impact.icon} {article.impact}
        </div>
        <div style={{ position:"absolute", bottom:8, right:10, fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.8)", background:"rgba(0,0,0,0.5)", padding:"1px 7px", borderRadius:10 }}>
          {timeAgo(article.publishedAt)}
        </div>
        <svg style={{ position:"absolute", bottom:0, left:0, right:0, width:"100%", height:30, opacity:0.2 }} viewBox="0 0 300 30" preserveAspectRatio="none">
          <polyline points="0,25 60,18 120,22 180,8 240,14 300,4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      <div style={{ padding:"12px 14px", flex:1, display:"flex", flexDirection:"column", gap:8 }}>
        <h3 style={{ margin:0, fontSize:12.5, fontWeight:800, color:"var(--navy)", lineHeight:1.4 }}>{article.headline}</h3>
        {featured && <p style={{ margin:0, fontSize:11.5, color:"var(--text-muted)", lineHeight:1.6, flex:1 }}>{article.summary}</p>}
        {article.stocks.length > 0 && (
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {article.stocks.map(s => <span key={s} style={{ padding:"2px 7px", borderRadius:6, background:"rgba(200,134,10,0.12)", color:"#C8860A", fontSize:9.5, fontWeight:800 }}>{s}</span>)}
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:16, height:16, borderRadius:4, background: SOURCE_COLORS[article.source] ?? "#888", display:"flex", alignItems:"center", justifyContent:"center", fontSize:7, fontWeight:900, color:"#fff" }}>{article.source[0]}</div>
            <span style={{ fontSize:10, fontWeight:700, color: SOURCE_COLORS[article.source] ?? "#888" }}>{article.source}</span>
          </div>
          <span style={{ fontSize:11, color:"#C8860A", fontWeight:700 }}>→</span>
        </div>
      </div>
    </div>
  );
}

/* ── Impact summary pill ── */
function ImpactPill({ type, count }: { type: "Positive"|"Negative"|"Neutral"; count: number }) {
  const cfg = IMPACT_CONFIG[type];
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", borderRadius:8, background:cfg.bg, border:`1px solid ${cfg.border}`, marginBottom:6 }}>
      <span style={{ fontSize:12, fontWeight:700, color:cfg.color }}>{cfg.icon} {type}</span>
      <span style={{ fontSize:13, fontWeight:900, color:cfg.color }}>{count}</span>
    </div>
  );
}

/* ── Main component ── */
export default function NewsPageClient() {
  const [articles, setArticles]     = useState<NewsArticle[]>([]);
  const [loading, setLoading]       = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string|null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState<"All"|"Positive"|"Negative"|"Neutral"|string>("All");
  const [search, setSearch]         = useState("");

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) return 0;
      const data = await res.json() as { articles: NewsArticle[]; lastRefreshed: string|null; refreshing?: boolean };
      setArticles(data.articles ?? []);
      setLastRefreshed(data.lastRefreshed);
      setRefreshing(data.refreshing ?? false);
      return (data.articles ?? []).length;
    } catch { return 0; }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let pollTimer: ReturnType<typeof setInterval>|null = null;
    let normalTimer: ReturnType<typeof setInterval>|null = null;
    fetchNews().then(n => {
      if (!n) {
        pollTimer = setInterval(async () => {
          const count = await fetchNews();
          if (count && count > 0 && pollTimer) { clearInterval(pollTimer); pollTimer = null; normalTimer = setInterval(fetchNews, 5*60*1000); }
        }, 5000);
      } else {
        normalTimer = setInterval(fetchNews, 5*60*1000);
      }
    });
    return () => { if (pollTimer) clearInterval(pollTimer); if (normalTimer) clearInterval(normalTimer); };
  }, [fetchNews]);

  const categories = useMemo(() => [...new Set(articles.map(a => a.category))], [articles]);

  const filtered = useMemo(() => {
    let r = articles;
    if (filter === "Positive" || filter === "Negative" || filter === "Neutral") r = r.filter(a => a.impact === filter);
    else if (filter !== "All") r = r.filter(a => a.category === filter);
    if (search) { const q = search.toLowerCase(); r = r.filter(a => a.headline.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) || a.stocks.some(s => s.toLowerCase().includes(q))); }
    return r;
  }, [articles, filter, search]);

  const counts = useMemo(() => ({
    Positive: articles.filter(a => a.impact==="Positive").length,
    Negative: articles.filter(a => a.impact==="Negative").length,
    Neutral:  articles.filter(a => a.impact==="Neutral").length,
  }), [articles]);

  const [hero, ...rest] = filtered;

  return (
    <div style={{ minHeight:"calc(100vh - 60px)", background:"var(--background)" }}>

      {/* ── Header ── */}
      <div style={{ background:"linear-gradient(135deg, var(--navy) 0%, #1a3560 100%)", padding:"24px 32px 20px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
            <div>
              <div style={{ fontSize:10, fontWeight:800, color:"rgba(212,151,26,0.8)", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:5 }}>STOCKIFYY · LIVE INTELLIGENCE</div>
              <h1 style={{ fontSize:24, fontWeight:900, color:"#fff", margin:"0 0 4px", lineHeight:1.1 }}>PSX Live Market <span style={{ color:"#D4971A" }}>News</span></h1>
              <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", margin:0 }}>Real-time Pakistan Stock Exchange news — keyword-filtered, automatically updated</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              {(["Positive","Negative","Neutral"] as const).map(t => {
                const cfg = IMPACT_CONFIG[t];
                return (
                  <div key={t} style={{ padding:"8px 16px", borderRadius:10, background:"rgba(255,255,255,0.08)", border:`1px solid ${cfg.border}`, textAlign:"center" }}>
                    <div style={{ fontSize:16, fontWeight:900, color:cfg.color }}>{counts[t]}</div>
                    <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.45)", textTransform:"uppercase" }}>{t}</div>
                  </div>
                );
              })}
              <div style={{ padding:"8px 16px", borderRadius:10, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(212,175,55,0.2)", textAlign:"center" }}>
                <div style={{ fontSize:16, fontWeight:900, color:"#D4971A" }}>{articles.length}</div>
                <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,0.45)", textTransform:"uppercase" }}>Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ticker bar ── */}
      <div style={{ background:"rgba(7,17,31,0.95)", borderBottom:"1px solid rgba(212,175,55,0.1)", padding:"7px 32px", display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          <span style={{ width:7, height:7, borderRadius:"50%", background:"#dc2626", animation:"pulse 1.5s infinite", display:"inline-block" }} />
          <span style={{ fontSize:10, fontWeight:800, color:"#dc2626", textTransform:"uppercase", letterSpacing:"0.06em" }}>LIVE</span>
        </div>
        <div style={{ flex:1, overflow:"hidden", whiteSpace:"nowrap" }}>
          <div style={{ display:"inline-flex", gap:24, animation:"marquee 30s linear infinite" }}>
            {articles.slice(0,6).map(a => (
              <span key={a.id} style={{ fontSize:11, color:"rgba(255,255,255,0.65)", fontWeight:600 }}>
                <span style={{ color: IMPACT_CONFIG[a.impact].color, marginRight:4 }}>{IMPACT_CONFIG[a.impact].icon}</span>
                {a.headline.slice(0,60)}…
              </span>
            ))}
          </div>
        </div>
        {lastRefreshed && <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", flexShrink:0 }}>Updated {timeAgo(lastRefreshed)}</span>}
        <style>{`@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"24px 32px", display:"flex", gap:24, alignItems:"flex-start" }}>

        {/* ── Left sidebar ── */}
        <div style={{ width:200, flexShrink:0, position:"sticky", top:72 }}>
          {/* Search */}
          <div className="card" style={{ padding:"12px 14px", marginBottom:12 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search news…"
              style={{ width:"100%", padding:"8px 10px", border:"1.5px solid var(--border)", borderRadius:7, fontSize:12, background:"var(--background)", color:"var(--text)", outline:"none", boxSizing:"border-box" }} />
          </div>

          {/* Impact filter */}
          <div className="card" style={{ padding:"14px", marginBottom:12 }}>
            <div style={{ fontSize:9.5, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:10 }}>Market Impact</div>
            {(["All","Positive","Negative","Neutral"] as const).map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%",
                padding:"7px 8px", borderRadius:7, border:"none", marginBottom:4, cursor:"pointer",
                background: filter===t ? (t==="All" ? "rgba(200,134,10,0.12)" : IMPACT_CONFIG[t as "Positive"]?.bg ?? "rgba(200,134,10,0.12)") : "transparent",
                borderLeft: filter===t ? `3px solid ${t==="All" ? "#C8860A" : IMPACT_CONFIG[t as "Positive"]?.color ?? "#C8860A"}` : "3px solid transparent",
              }}>
                <span style={{ fontSize:12, fontWeight:filter===t?700:500, color: t==="All" ? "#C8860A" : IMPACT_CONFIG[t as "Positive"]?.color ?? "#C8860A" }}>
                  {t==="All" ? "📰 All News" : `${IMPACT_CONFIG[t as "Positive"].icon} ${t}`}
                </span>
                <span style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)" }}>{t==="All" ? articles.length : counts[t as "Positive"]}</span>
              </button>
            ))}
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div className="card" style={{ padding:"14px", marginBottom:12 }}>
              <div style={{ fontSize:9.5, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.09em", marginBottom:10 }}>Category</div>
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilter(f => f===cat ? "All" : cat)} style={{
                  display:"block", width:"100%", textAlign:"left", padding:"6px 8px", borderRadius:6, border:"none", marginBottom:3, cursor:"pointer",
                  background: filter===cat ? "rgba(200,134,10,0.12)" : "transparent",
                  color: filter===cat ? "#C8860A" : "var(--text-muted)", fontSize:11.5, fontWeight:filter===cat?700:500,
                  borderLeft: filter===cat ? "3px solid #C8860A" : "3px solid transparent",
                }}>{cat}</button>
              ))}
            </div>
          )}

          {/* Auto-refresh status */}
          <div className="card" style={{ padding:"12px 14px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:refreshing?"#f59e0b":"#16a34a", animation:"pulse 2s infinite", display:"inline-block" }} />
              <span style={{ fontSize:11, fontWeight:700, color:refreshing?"#f59e0b":"#16a34a" }}>{refreshing?"Updating…":"Live"}</span>
            </div>
            <div style={{ fontSize:10, color:"var(--text-muted)", marginBottom:8, lineHeight:1.5 }}>RSS feeds updated hourly</div>
            <button onClick={() => { setRefreshing(true); fetchNews(); }}
              style={{ width:"100%", padding:"6px 8px", border:"1.5px solid var(--border)", borderRadius:7, background:"var(--card-bg)", color:"var(--text-muted)", fontSize:11, fontWeight:600, cursor:"pointer" }}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {/* ── Main feed ── */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Live label */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ height:3, width:20, borderRadius:2, background:"#dc2626" }} />
              <span style={{ fontSize:12, fontWeight:800, color:"#dc2626", textTransform:"uppercase", letterSpacing:"0.08em" }}>Live Feed</span>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#dc2626", animation:"pulse 1.5s infinite", display:"inline-block" }} />
            </div>
            <span style={{ fontSize:11, color:"var(--text-muted)" }}>
              {filtered.length} article{filtered.length!==1?"s":""}
              {search && ` for "${search}"`}
            </span>
          </div>

          {loading ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
              {Array.from({length:6}).map((_,i) => <Skeleton key={i} h={i===0?400:280} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:"60px 20px", textAlign:"center", color:"var(--text-muted)", border:"2px dashed var(--border)", borderRadius:14 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📡</div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>No articles found</div>
              <div style={{ fontSize:12 }}>{search ? "Try a different search term" : "No news matches this filter"}</div>
              {(search||filter!=="All") && <button onClick={() => { setSearch(""); setFilter("All"); }} style={{ marginTop:12, padding:"7px 16px", background:"#C8860A", color:"#fff", border:"none", borderRadius:7, fontSize:12, fontWeight:700, cursor:"pointer" }}>Clear Filters</button>}
            </div>
          ) : (
            <>
              {/* Hero */}
              {hero && <div style={{ marginBottom:18 }}><HeroCard article={hero} /></div>}

              {/* Impact summary bar */}
              {rest.length > 0 && (
                <div style={{ display:"flex", gap:8, marginBottom:16, padding:"10px 14px", borderRadius:10, background:"var(--card-bg)", border:"1px solid var(--border)" }}>
                  {(["Positive","Negative","Neutral"] as const).map(t => {
                    const cfg = IMPACT_CONFIG[t];
                    const c = rest.filter(a => a.impact===t).length;
                    if (!c) return null;
                    return <span key={t} style={{ padding:"3px 10px", borderRadius:16, background:cfg.bg, color:cfg.color, fontSize:11, fontWeight:700 }}>{cfg.icon} {c} {t}</span>;
                  })}
                  <span style={{ marginLeft:"auto", fontSize:11, color:"var(--text-muted)", alignSelf:"center" }}>More stories below</span>
                </div>
              )}

              {/* Top 3 featured */}
              {rest.length > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14, marginBottom:18 }}>
                  {rest.slice(0,3).map(a => <NewsCard key={a.id} article={a} featured />)}
                </div>
              )}

              {/* Divider */}
              {rest.length > 3 && (
                <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0 16px" }}>
                  <div style={{ flex:1, height:1, background:"var(--border)" }} />
                  <span style={{ fontSize:10, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.07em" }}>More Stories</span>
                  <div style={{ flex:1, height:1, background:"var(--border)" }} />
                </div>
              )}

              {/* Rest — compact grid */}
              {rest.length > 3 && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>
                  {rest.slice(3).map(a => <NewsCard key={a.id} article={a} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  );
}
