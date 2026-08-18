import type { Metadata } from "next";

export const metadata: Metadata = { title: "News — Stockifyy" };

const NEWS = [
  {
    icon: "📉",
    tag: "Market",
    title: "KSE-100 loses over 1,250 points amid broad-based selling pressure",
    excerpt: "The Pakistan Stock Exchange KSE-100 index dropped over 1,250 points as selling pressure intensified across cement, energy and banking sectors. Analysts attribute the fall to profit-taking ahead of monetary policy review.",
    source: "The News",
    time: "11 Aug 2026, 4:30 PM",
  },
  {
    icon: "🏦",
    tag: "Banking",
    title: "MCB Bank posts strong H1 FY26 results with EPS of Rs.19.40",
    excerpt: "MCB Bank Limited announced its half-year financial results for FY26 with earnings per share of Rs.19.40, up 18% year-on-year. The board also announced an interim cash dividend of Rs.8 per share.",
    source: "Business Recorder",
    time: "08 Aug 2026, 2:15 PM",
  },
  {
    icon: "⛽",
    tag: "Energy",
    title: "OGDC declares Rs.6 per share interim dividend for Q4 FY26",
    excerpt: "Oil & Gas Development Company Limited (OGDC) has announced an interim cash dividend of Rs.6 per share for the fourth quarter of FY26, following strong quarterly earnings of Rs.8.42 EPS.",
    source: "Dawn Business",
    time: "11 Aug 2026, 11:00 AM",
  },
  {
    icon: "📰",
    tag: "Economy",
    title: "Malik Riaz appeals to top Pakistani personalities for help over asset seizures",
    excerpt: "Property developer Malik Riaz Hussain appeals to prominent personalities as Rs238.6bn assets remain frozen in ongoing legal proceedings. The Supreme Court has scheduled next hearing for late August.",
    source: "GEO News",
    time: "10 Aug 2026, 9:45 AM",
  },
  {
    icon: "⚖️",
    tag: "Policy",
    title: "President Zardari approves appointment of several high court additional judges",
    excerpt: "President Asif Ali Zardari approved the appointment of additional judges and confirmation of existing judges in high courts across Pakistan, strengthening judicial capacity.",
    source: "Business Recorder",
    time: "09 Aug 2026, 3:20 PM",
  },
  {
    icon: "🤝",
    tag: "Trade",
    title: "Pakistan, Japan ink $2.2mn grant agreement",
    excerpt: "The Government of Pakistan and Japan signed a grant agreement worth JPY 350 million ($2.2 million) to bolster the Human Resource Development Scholarship Program, strengthening bilateral ties.",
    source: "GEO News",
    time: "08 Aug 2026, 10:00 AM",
  },
  {
    icon: "🚂",
    tag: "Trade",
    title: "Russia, Pakistan to launch first freight rail service connecting Moscow to Karachi",
    excerpt: "Russia and Pakistan are working to launch their first freight rail services connecting Moscow with Karachi and Faisalabad, with Belarus also being considered as a transit corridor.",
    source: "Business Recorder",
    time: "07 Aug 2026, 1:30 PM",
  },
  {
    icon: "🏗️",
    tag: "Cement",
    title: "Maple Leaf Cement reports loss as dispatch volumes decline",
    excerpt: "Maple Leaf Cement Factory Limited posted a net loss in Q4 FY26 as domestic cement dispatches fell amid higher energy costs and weak construction activity. The stock fell 3.22% on the news.",
    source: "The News",
    time: "07 Aug 2026, 11:15 AM",
  },
  {
    icon: "💹",
    tag: "Fertilizer",
    title: "Engro Fertilizers H1 FY26 earnings up 22% on higher urea prices",
    excerpt: "Engro Fertilizers Limited reported a 22% increase in half-year earnings driven by higher domestic urea prices and improved offtake. EPS clocked at Rs.24.10 for the period.",
    source: "Dawn Business",
    time: "07 Aug 2026, 9:00 AM",
  },
];

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  Market:    { bg: "rgba(220,38,38,0.1)",   color: "#DC2626" },
  Banking:   { bg: "rgba(30,64,175,0.1)",   color: "#1E40AF" },
  Energy:    { bg: "rgba(212,175,55,0.12)", color: "#B8860B" },
  Economy:   { bg: "rgba(107,114,128,0.1)", color: "#4B5563" },
  Policy:    { bg: "rgba(91,33,182,0.1)",   color: "#5B21B6" },
  Trade:     { bg: "rgba(22,163,74,0.1)",   color: "#166534" },
  Cement:    { bg: "rgba(180,83,9,0.1)",    color: "#92400E" },
  Fertilizer:{ bg: "rgba(6,95,70,0.1)",     color: "#065F46" },
};

export default function NewsPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-xl font-black" style={{ color: "var(--navy)" }}>Market News</h1>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span className="text-[10px] font-semibold px-2 py-1 rounded" style={{ background: "var(--navy-tint)", color: "var(--text-muted)" }}>
          PSX · Business · Economy
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {NEWS.map((n, i) => {
          const tc = TAG_COLORS[n.tag] ?? { bg: "rgba(0,0,0,0.06)", color: "var(--text-muted)" };
          return (
            <div key={i} className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ background: "var(--light-bg)", border: "1px solid var(--border)" }}>
                  {n.icon}
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: tc.bg, color: tc.color }}>
                  {n.tag}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold leading-snug mb-1.5" style={{ color: "var(--navy)" }}>{n.title}</p>
                <p className="text-[11px] leading-relaxed line-clamp-3" style={{ color: "var(--text-muted)" }}>{n.excerpt}</p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>{n.source}</span>
                <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>{n.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
