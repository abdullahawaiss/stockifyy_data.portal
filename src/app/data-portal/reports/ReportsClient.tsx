"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";

/* ── Live PSX News ──────────────────────────────────────────────────────────── */
interface LiveNews {
  id: number;
  url: string;
  source: string;
  sourceColor: string;
  category: string;
  catColor: string;
  title: string;
  excerpt: string;
  date: string;
  time: string;
  imgGradient: string;
}

const LIVE_NEWS: LiveNews[] = [
  {
    id: 1,
    url: "https://www.brecorder.com/news/40437729/psx-stocks-rebound-up-over-900-points-in-early-trade",
    source: "BRecorder", sourceColor: "#dc2626",
    category: "Market Update", catColor: "#16a34a",
    title: "PSX stocks rebound, up over 900 points in early trade",
    excerpt: "The KSE-100 index opened sharply higher, gaining over 900 points in early morning trade as buying interest returned across major sectors including Banking, Cement and Technology.",
    date: "3 Sep 2026", time: "09:35 AM",
    imgGradient: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
  },
  {
    id: 2,
    url: "https://mettisglobal.news/PSX-Closing-Bell-Bulls-Miss-by-a-Whisker-63109",
    source: "Mettis Global", sourceColor: "#2563eb",
    category: "Closing Bell", catColor: "#2563eb",
    title: "PSX Closing Bell: Bulls Miss by a Whisker",
    excerpt: "Equity markets closed marginally lower after a late-session sell-off trimmed the day's earlier gains. KSE-100 settled near 132,000 as investors booked profits ahead of the long weekend.",
    date: "2 Sep 2026", time: "03:45 PM",
    imgGradient: "linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)",
  },
  {
    id: 3,
    url: "https://dunyanews.tv/en/Business/971096-psx-opens-higher-as-kse100-gains-over-900-points",
    source: "Dunya News", sourceColor: "#7c3aed",
    category: "PSX Open", catColor: "#7c3aed",
    title: "PSX opens higher as KSE-100 gains over 900 points",
    excerpt: "Pakistan Stock Exchange opened on a bullish note Wednesday with the KSE-100 surging 900+ points driven by foreign buying and strong SBP data on current account surplus widening.",
    date: "3 Sep 2026", time: "09:18 AM",
    imgGradient: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
  },
  {
    id: 4,
    url: "https://www.brecorder.com/",
    source: "BRecorder", sourceColor: "#dc2626",
    category: "Stocks", catColor: "#ea580c",
    title: "MEBL, MCB lead banking rally as rate-cut bets strengthen",
    excerpt: "Meezan Bank and MCB Bank were the top performers among large-cap stocks, with both gaining 3–4% as market expectations for a 100bps rate cut at September's MPC meeting solidified.",
    date: "2 Sep 2026", time: "02:30 PM",
    imgGradient: "linear-gradient(135deg, #c2410c 0%, #7c2d12 100%)",
  },
  {
    id: 5,
    url: "https://mettisglobal.news/",
    source: "Mettis Global", sourceColor: "#2563eb",
    category: "Trading", catColor: "#059669",
    title: "PSX volumes surge to 800mn shares — third consecutive high",
    excerpt: "Daily trading volumes on the Pakistan Stock Exchange reached 800 million shares, the third consecutive session of above-average activity, signaling growing retail and institutional participation.",
    date: "1 Sep 2026", time: "04:00 PM",
    imgGradient: "linear-gradient(135deg, #059669 0%, #065f46 100%)",
  },
  {
    id: 6,
    url: "https://dunyanews.tv/en/Business/",
    source: "Dunya News", sourceColor: "#7c3aed",
    category: "International", catColor: "#0284c7",
    title: "Pakistan equities catch emerging market tailwind as Fed signals pause",
    excerpt: "Global EM sentiment lifted as the US Federal Reserve signalled a prolonged pause in rate hikes. Frontier markets, including Pakistan, saw renewed foreign institutional buying interest.",
    date: "31 Aug 2026", time: "11:20 AM",
    imgGradient: "linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)",
  },
];

/* ── News Card ────────────────────────────────────────────────────────────── */
function NewsCard({ n }: { n: LiveNews }) {
  return (
    <div className="card" style={{ overflow: "hidden", cursor: "pointer", transition: "box-shadow 150ms, transform 150ms", display: "flex", flexDirection: "column" }}
      onClick={() => window.open(n.url, "_blank", "noopener,noreferrer")}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 8px 28px rgba(0,0,0,0.13)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = ""; }}>
      {/* Image / gradient hero */}
      <div style={{ height: 110, background: n.imgGradient, position: "relative", flexShrink: 0 }}>
        {/* Source badge */}
        <div style={{ position: "absolute", top: 10, left: 12, display: "flex", gap: 6 }}>
          <span style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 9.5, fontWeight: 800, backdropFilter: "blur(4px)" }}>{n.source}</span>
          <span style={{ padding: "3px 9px", borderRadius: 20, background: n.catColor + "dd", color: "#fff", fontSize: 9.5, fontWeight: 700 }}>{n.category}</span>
        </div>
        {/* Time badge */}
        <div style={{ position: "absolute", bottom: 10, right: 12, background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.85)", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, backdropFilter: "blur(4px)" }}>
          {n.time}
        </div>
        {/* Decorative chart line */}
        <svg style={{ position: "absolute", bottom: 0, left: 0, right: 0, width: "100%", height: 36, opacity: 0.25 }} viewBox="0 0 300 36" preserveAspectRatio="none">
          <polyline points="0,28 40,20 80,24 120,10 160,16 200,8 240,14 300,4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      {/* Content */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>📅 {n.date}</div>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--navy)", lineHeight: 1.4 }}>{n.title}</h3>
        <p style={{ margin: 0, fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.6, flex: 1 }}>{n.excerpt}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: n.sourceColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: "#fff" }}>{n.source[0]}</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: n.sourceColor }}>{n.source}</span>
          </div>
          <span style={{ fontSize: 11, color: "#C8860A", fontWeight: 700 }}>Read Article →</span>
        </div>
      </div>
    </div>
  );
}

type ReportType = "Research" | "Technical" | "Fundamental";
type FilterType = "All Reports" | ReportType;

interface Report {
  id: number;
  type: ReportType;
  featured: boolean;
  date: string;
  readMin: number;
  title: string;
  summary: string;
  tags: string[];
  symbol?: string;
  content?: string;
  analyst?: string;
  rating?: string;
  target?: string;
}

const REPORTS: Report[] = [
  /* ─── FEATURED ─────────────────────────────────────────── */
  {
    id: 1, type: "Research", featured: true, date: "28 Aug 2026", readMin: 14, analyst: "Stockifyy Research",
    title: "Pakistan Market Outlook — H2 2026: Turning the Corner",
    summary: "IMF programme on track, PKR stable at 278–282, SBP policy rate at 11%. KSE-100 at 132,000+ eyes 145,000 by December. In-depth sector rotation, macro risks, and our top 10 conviction picks for H2 2026.",
    tags: ["Macro", "H2 2026 Outlook", "KSE-100", "IMF", "SBP Policy"],
    content: `**Executive Summary**\n\nKSE-100 has delivered YTD returns of 22.4% as of August 2026, making Pakistan one of Asia's best-performing markets. The combination of a successful IMF programme review, FX stability, and falling rates has restored investor confidence. We maintain a constructive bias for H2 2026.\n\n**Macro Picture — August 2026**\n\n1. **SBP Rate**: Policy rate cut to 11% in July 2026 (down 900bps from the peak of 22%). Another 100bps cut expected in October.\n2. **Inflation**: CPI at 9.2% YoY — first single-digit print in 3 years.\n3. **PKR**: Stable at 278–282 vs USD. Current account swung to a surplus of $180M in Q1 FY27.\n4. **IMF**: 5th review completed successfully; $1.2Bn tranche disbursed in June 2026.\n5. **Remittances**: $3.1Bn in July 2026 — a record monthly inflow through official channels.\n\n**Sector Rotation Strategy H2 2026**\n\n- **Overweight**: Banking (MEBL, HBL, MCB), Cement (LUCK, MLCF), Technology (SYS, TRG)\n- **Neutral**: Energy (OGDC, PPL), Fertilizer (FFC, EFERT)\n- **Underweight**: Textiles (demand concerns), Auto (inventory build)\n\n**Top 10 Conviction Picks**: MEBL, LUCK, HBL, TRG, SYS, MCB, ENGRO, BAHL, MLCF, MARI\n\n**Risk Factors**: Geopolitical tensions, oil price spike, IMF programme derailment, monsoon impact on agriculture.`,
  },
  {
    id: 2, type: "Technical", featured: true, date: "27 Aug 2026", readMin: 6, analyst: "Technical Desk",
    title: "KSE-100 Weekly Technical: Breakout Confirmed at 132K",
    summary: "KSE-100 has confirmed a weekly close above the 131,500 neckline — a classic inverse head-and-shoulders breakout with measured target of 145,000. RSI healthy at 62. Key support/resistance and trade setups.",
    tags: ["KSE-100", "Inverse H&S", "Breakout", "RSI", "Support & Resistance"],
    content: `**Technical Picture — Week Ending 29 Aug 2026**\n\nKSE-100 closed at 132,240, confirming a breakout from a 16-week inverse head-and-shoulders pattern. Volume on breakout day was 45% above 20-DMA — a strong bullish signal.\n\n**Key Levels**\n- Breakout Level (now support): 131,500\n- Immediate Resistance: 134,200\n- H&S Measured Target: 145,000 (12-week view)\n- 50-DMA: 124,800 (rising fast)\n- 200-DMA: 111,600\n\n**Oscillators**\n- RSI (14): 62 — positive, room before overbought\n- MACD: Bullish crossover on daily, expanding histogram\n- Stochastic: 71 — watch for any short-term cooling\n\n**Trade Setups**\n1. **Primary**: Long on any retest of 131,500–132,000 zone. Target 140,000. Stop 129,800.\n2. **Momentum**: Add on breakout above 134,200 with volume. Target 138,000 in 3–4 weeks.\n\n**Sector Leaders**: Banking and Cement indices both at 52-week highs.`,
  },
  {
    id: 3, type: "Fundamental", featured: true, date: "26 Aug 2026", readMin: 13, analyst: "Equity Research", symbol: "MEBL", rating: "BUY", target: "Rs 285",
    title: "Meezan Bank — FY26 Results Review: Record Profitability",
    summary: "MEBL delivered FY26 EPS of Rs 24.8 (up 31% YoY), beating consensus by 9%. ROE hits 35% — highest in Pakistan's banking history. Revised PT of Rs 285 with BUY. Dividend of Rs 6.50/share announced.",
    tags: ["MEBL", "FY26 Results", "BUY", "Banking", "Islamic Finance"],
    content: `**Investment Thesis — MEBL: Pakistan's Premier Islamic Bank**\n\nWe reiterate our BUY rating on Meezan Bank with a revised 12-month price target of Rs 285 (upside: 38% from CMP of Rs 207). MEBL is our top pick in the banking sector.\n\n**FY26 Results Highlights**\n- EPS: Rs 24.8 vs consensus Rs 22.7 (+9.3% beat)\n- Net Income: Rs 52.8Bn (+31% YoY)\n- ROE: 35.1% — record high; best in sector\n- CASA Ratio: 68.2% (vs 64.5% FY25) — cheapest cost of funds in sector\n- NPL Ratio: 0.8% — lowest in Pakistan\n- DPS: Rs 6.50 final + Rs 4.00 interim = Rs 10.50 total FY26\n- Dividend Yield: 5.1% at CMP\n\n**Why MEBL Wins in Rate-Cut Cycle**\nContrary to conventional banks, MEBL's profit-sharing deposits re-price downward as rates fall, actually IMPROVING margins. The bank also benefits from rising demand for Islamic financing products.\n\n**FY27 Estimates**\n- EPS (Stockifyy): Rs 29.5 (+19% YoY)\n- ROE: 36%+\n- DPS estimate: Rs 12.00\n\n**Valuation**: 2.0× FY27 P/B → Rs 285 target. Current 1.45× P/B is undemanding for this quality.`,
  },

  /* ─── RESEARCH ──────────────────────────────────────────── */
  {
    id: 4, type: "Research", featured: true, date: "25 Aug 2026", readMin: 9, analyst: "Sector Research",
    title: "Banking Sector: NIM Dynamics in a Declining Rate Environment",
    summary: "SBP's 900bps rate cut cycle has compressed NIMs differently across banks. MEBL and MCB best positioned. Modelling NIM trajectories for FY27 for all PSX-listed commercial banks.",
    tags: ["Banking", "NIM", "Rate Cut", "FY27 Estimates"],
    content: `**Impact of Rate Cuts on NIM — FY26 vs FY27**\n\nThe SBP's cumulative 900bps rate cut from 22% to 11% has reshaped the banking sector's earnings structure. Average sector NIM declined from 6.2% to 5.1% — but quality banks with strong CASA are holding up far better.\n\n**NIM Rankings FY26 (Estimated)**\n- MEBL: 5.8% (stable — Islamic model)\n- MCB: 5.1%\n- HBL: 4.9%\n- UBL: 4.7%\n- NBP: 3.8% (worst — high investment portfolio)\n\n**FY27 Catalysts for Earnings Recovery**\n- Loan growth recovering: +18% industry advance growth expected\n- Fee income rising: trade finance, FX, and digital banking\n- NPL coverage solid: sector-wide 95%+\n\n**Top Picks**: MEBL (BUY, Rs 285), MCB (BUY, Rs 270), HBL (ACCUMULATE, Rs 215)`,
  },
  {
    id: 5, type: "Research", featured: false, date: "22 Aug 2026", readMin: 11, analyst: "Sector Research",
    title: "Cement Sector H2 2026: Volume Recovery & Pricing Power",
    summary: "Cement dispatches rose 14% YoY in July 2026 driven by infrastructure spending and CPEC Phase-II. Local retention prices up Rs 60–80/bag. Our updated model for LUCK, MLCF, DGKC with revised price targets.",
    tags: ["Cement", "LUCK", "MLCF", "Dispatches", "FY27"],
  },
  {
    id: 6, type: "Research", featured: false, date: "18 Aug 2026", readMin: 8, analyst: "Sector Research",
    title: "Technology Sector: IT Exports Hit $3.8Bn — New Record",
    summary: "Pakistan's IT exports reached $3.8Bn in FY26, growing 28% YoY. TRG, SYS, and AVN benefitting from global nearshoring trend. Regulatory tailwinds from SECP's new REIT-style tech listing framework.",
    tags: ["Technology", "TRG", "SYS", "IT Exports", "SECP"],
  },
  {
    id: 7, type: "Research", featured: false, date: "14 Aug 2026", readMin: 10, analyst: "Sector Research",
    title: "Fertilizer Sector: Urea Prices, Gas Allocation & FY27 Dividends",
    summary: "Urea prices stabilized at Rs 3,850/bag. FFC and EFERT remain cash cows with >10% dividend yields. Impact of revised SNGPL gas allocation on cost structure and DPS sustainability for next 3 years.",
    tags: ["Fertilizer", "FFC", "EFERT", "Urea", "Dividend Yield"],
  },
  {
    id: 8, type: "Research", featured: false, date: "10 Aug 2026", readMin: 7, analyst: "Sector Research",
    title: "Oil & Gas E&P: Pakistan's Exploration Renaissance",
    summary: "OGDC and MARI are drilling 12 new wells in FY27 — the highest exploration activity since 2018. Bullish on MARI (target Rs 2,700) given recent reserve upgrade; cautious on PPL given receivable build.",
    tags: ["OGDC", "MARI", "PPL", "Exploration", "E&P"],
  },

  /* ─── TECHNICAL ─────────────────────────────────────────── */
  {
    id: 9, type: "Technical", featured: false, date: "24 Aug 2026", readMin: 4, analyst: "Technical Desk", symbol: "LUCK",
    title: "LUCK — Weekly Bullish Flag Targets Rs 1,350",
    summary: "Lucky Cement is consolidating within a textbook 4-week bullish flag at Rs 1,180. Measured move targets Rs 1,350. Volume declining on flag — typical pattern. Entry, target and stop levels.",
    tags: ["LUCK", "Flag Pattern", "Breakout", "Chart Setup"],
  },
  {
    id: 10, type: "Technical", featured: false, date: "21 Aug 2026", readMin: 5, analyst: "Technical Desk", symbol: "TRG",
    title: "TRG — Base Breakout with 52-Week High Volume",
    summary: "TRG broke above its 14-month base at Rs 175 with volume 3× the 20-DMA — a major technical signal. Measured target Rs 240. Comparing this setup with TRG's 2020 and 2022 base breakouts.",
    tags: ["TRG", "Volume Breakout", "52-Week High", "Technology"],
  },
  {
    id: 11, type: "Technical", featured: false, date: "17 Aug 2026", readMin: 3, analyst: "Technical Desk", symbol: "HBL",
    title: "HBL — Golden Cross Confirms Uptrend; Target Rs 220",
    summary: "50-DMA crossed above 200-DMA on HBL for the first time in 18 months. RSI at 58 — clean momentum. Historical back-test of HBL golden cross setups shows average 30% gain over 6 months.",
    tags: ["HBL", "Golden Cross", "Moving Averages", "Banking"],
  },
  {
    id: 12, type: "Technical", featured: false, date: "12 Aug 2026", readMin: 6, analyst: "Technical Desk",
    title: "PSX Sector Relative Strength — August 2026 Update",
    summary: "Banking and Cement leading; Textile lagging. Relative strength rankings across all 10 PSX sectors with RS ratio charts vs KSE-100 benchmark. Actionable rotation signals for the next 4–6 weeks.",
    tags: ["Sector Rotation", "Relative Strength", "PSX Sectors"],
  },
  {
    id: 13, type: "Technical", featured: false, date: "8 Aug 2026", readMin: 4, analyst: "Technical Desk", symbol: "ENGRO",
    title: "ENGRO — Inverse H&S at Multi-Month Support Zone",
    summary: "ENGRO has formed a 9-week inverse head-and-shoulders at Rs 295–310 support. Neckline at Rs 340. A close above would signal a move to Rs 390+. Risk-reward at current levels is 3.8:1.",
    tags: ["ENGRO", "Inverse H&S", "Support Zone", "Chart Pattern"],
  },

  /* ─── FUNDAMENTAL ───────────────────────────────────────── */
  {
    id: 14, type: "Fundamental", featured: false, date: "23 Aug 2026", readMin: 12, analyst: "Equity Research", symbol: "MCB", rating: "BUY", target: "Rs 270",
    title: "MCB Bank FY26 Preview: EPS of Rs 35 Expected",
    summary: "MCB reports on September 5. We model EPS of Rs 35 — a 16% beat on consensus Rs 30.2. Strong CASA of 55%, improving advance quality, and a Rs 10 final dividend. Initiating with BUY target Rs 270.",
    tags: ["MCB", "FY26 Preview", "BUY", "EPS Estimate", "Banking"],
    content: `**MCB Bank — FY26 Preview & Initiation**\n\nWe initiate coverage on MCB Bank with a BUY rating and 12-month price target of Rs 270, representing 35% upside from CMP of Rs 200.\n\n**Our FY26 Estimates vs Consensus**\n- EPS (Stockifyy): Rs 35.0 vs consensus Rs 30.2 (+16% above)\n- Net Income: Rs 40.5Bn\n- ROE: 24.8%\n- DPS: Rs 10.0 final (Rs 16.0 total FY26)\n\n**Why MCB is Mispriced**\nMCB trades at 1.4× P/B vs peers at 1.8–2.0× despite being one of the most profitable private banks. The discount reflects historic skepticism around its conservative lending growth — but this conservatism is now an ASSET in a rate-cutting environment.\n\n**Catalyst Calendar**\n- Sept 5: FY26 results announcement\n- Dec 2026: SBP rate cut (expected -100bps)\n- March 2027: MSCI FM Index inclusion review\n\n**Valuation**: 1.9× FY27 P/B → Rs 270 target.`,
  },
  {
    id: 15, type: "Fundamental", featured: false, date: "20 Aug 2026", readMin: 10, analyst: "Equity Research", symbol: "OGDC", rating: "ACCUMULATE", target: "Rs 185",
    title: "OGDC — Receivable Recovery & Dividend Sustainability",
    summary: "Rs 380Bn in government receivables remain a key overhang. But FY26 cash recovery of Rs 65Bn signals progress. We model dividend of Rs 9/share for FY26 — 5.8% yield at CMP of Rs 155.",
    tags: ["OGDC", "Receivables", "Dividend", "E&P", "Government Policy"],
  },
  {
    id: 16, type: "Fundamental", featured: false, date: "16 Aug 2026", readMin: 8, analyst: "Equity Research", symbol: "SYS", rating: "BUY", target: "Rs 850",
    title: "Systems Limited — Record IT Exports; Raising PT to Rs 850",
    summary: "SYS delivered FY26 revenue of Rs 29Bn (+35% YoY) driven by North America and Gulf expansion. EPS Rs 72. Raising price target from Rs 730 to Rs 850. Pakistan's most compelling tech growth story.",
    tags: ["SYS", "IT Exports", "FY26 Results", "BUY", "Technology"],
  },
  {
    id: 17, type: "Fundamental", featured: false, date: "11 Aug 2026", readMin: 9, analyst: "Equity Research", symbol: "FFC", rating: "BUY", target: "Rs 145",
    title: "FFC — Initiating Coverage: 11.5% Dividend Yield, BUY",
    summary: "Fauji Fertilizers' high payout policy (Rs 16/share DPS expected FY26) and defensive earnings make it ideal for income investors. Urea demand structural story intact. BUY with Rs 145 target.",
    tags: ["FFC", "Fertilizer", "Dividend", "Initiation", "BUY"],
  },
  {
    id: 18, type: "Fundamental", featured: false, date: "5 Aug 2026", readMin: 11, analyst: "Equity Research", symbol: "MARI", rating: "BUY", target: "Rs 2,700",
    title: "MARI Gas — Reserve Upgrade Adds 18% to NAV; Raising PT",
    summary: "Newly certified 2P reserves of 3.8Tcf represent an 18% upside vs our prior estimate. Full NAV model updated with revised production profile, SRO pricing, and Kirthar well results. Raising PT to Rs 2,700.",
    tags: ["MARI", "NAV", "Reserve Upgrade", "Gas", "BUY"],
  },
];

const PAGE_SIZE = 3;

const TYPE_CONFIG: Record<ReportType, { color: string; bg: string; icon: string; desc: string }> = {
  Research:    { color: "#2563eb", bg: "rgba(37,99,235,0.10)",  icon: "🔍", desc: "Macro, sector & industry analysis" },
  Technical:   { color: "#16a34a", bg: "rgba(22,163,74,0.10)",  icon: "📈", desc: "Charts, patterns & price action" },
  Fundamental: { color: "#7c3aed", bg: "rgba(124,58,237,0.10)", icon: "📊", desc: "Earnings, valuations & company models" },
};

// ── Report Detail Modal ──────────────────────────────────────────────────────
function ReportModal({ r, onClose }: { r: Report; onClose: () => void }) {
  const cfg = TYPE_CONFIG[r.type];
  const lines = r.content?.split("\n") ?? [];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.50)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--card-bg,#fff)", borderRadius: 14, width: "min(760px, 100%)", maxHeight: "88vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.3)", overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>{cfg.icon} {r.type}</span>
              {r.featured && <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(200,134,10,0.12)", color: "#C8860A", fontSize: 11, fontWeight: 700 }}>⭐ Featured</span>}
              {r.rating && <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(22,163,74,0.10)", color: "#16a34a", fontSize: 11, fontWeight: 700 }}>● {r.rating}</span>}
              {r.target && <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(37,99,235,0.08)", color: "#2563eb", fontSize: 11, fontWeight: 700 }}>Target: {r.target}</span>}
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "var(--navy)", lineHeight: 1.35 }}>{r.title}</h2>
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
              {r.analyst && <span>✍️ {r.analyst}</span>}
              <span>📅 {r.date}</span>
              <span>⏱ {r.readMin} min read</span>
              {r.symbol && <Link href={`/data-portal/company/${r.symbol}`} style={{ color: "#C8860A", fontWeight: 700, textDecoration: "none" }}>View {r.symbol} →</Link>}
            </div>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "rgba(0,0,0,0.06)", borderRadius: 8, width: 32, height: 32, fontSize: 18, color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.7, borderLeft: "3px solid var(--border)", paddingLeft: 12 }}>{r.summary}</p>
          {r.content ? (
            <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.8 }}>
              {lines.map((line, i) => {
                if (line.startsWith("**") && line.endsWith("**")) return <h3 key={i} style={{ fontSize: 14, fontWeight: 800, color: "var(--navy)", margin: "16px 0 6px" }}>{line.slice(2, -2)}</h3>;
                if (line.startsWith("- ")) return <div key={i} style={{ paddingLeft: 16, color: "var(--text)", marginBottom: 3 }}>• {line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</div>;
                if (line.match(/^\d\./)) return <div key={i} style={{ paddingLeft: 16, color: "var(--text)", marginBottom: 3 }}>{line}</div>;
                if (!line.trim()) return <div key={i} style={{ height: 6 }} />;
                return <p key={i} style={{ margin: "0 0 8px", color: "var(--text)" }}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
              })}
            </div>
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📰</div>
              Full report available to Stockifyy Premium subscribers.
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            {r.tags.map(tag => <span key={tag} style={{ padding: "3px 10px", borderRadius: 20, background: "var(--border,#e2e8f0)", color: "var(--text-muted)", fontSize: 11, fontWeight: 600 }}>{tag}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Report Card ──────────────────────────────────────────────────────────────
function ReportCard({ r, onClick }: { r: Report; onClick: () => void }) {
  const cfg = TYPE_CONFIG[r.type];
  return (
    <div className="card" style={{ padding: "18px 20px", transition: "box-shadow 150ms, transform 150ms", cursor: "pointer" }}
      onClick={onClick}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = ""; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>{r.type}</span>
          {r.rating && <span style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(22,163,74,0.10)", color: "#16a34a", fontSize: 11, fontWeight: 700 }}>{r.rating}</span>}
        </div>
        <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
          <span>📅 {r.date}</span>
          <span>⏱ {r.readMin}m</span>
        </div>
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--navy)", margin: "0 0 6px", lineHeight: 1.4 }}>{r.title}</h3>
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 12px", lineHeight: 1.6 }}>{r.summary}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {r.tags.slice(0, 3).map(t => <span key={t} style={{ padding: "2px 8px", borderRadius: 20, background: "var(--border,#e2e8f0)", color: "var(--text-muted)", fontSize: 10, fontWeight: 600 }}>{t}</span>)}
        </div>
        <span style={{ fontSize: 12, color: "#C8860A", fontWeight: 700, whiteSpace: "nowrap", marginLeft: 8 }}>Read Report →</span>
      </div>
    </div>
  );
}

// ── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 28, paddingBottom: 8 }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        style={{ padding: "6px 13px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--card-bg)", color: page===1?"var(--text-muted)":"var(--text-primary)", cursor: page===1?"not-allowed":"pointer", fontSize: 13, fontWeight: 700 }}>‹</button>
      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)}
          style={{ width: 36, height: 36, borderRadius: 8, border: p===page?"2px solid #C8860A":"1.5px solid var(--border)", background: p===page?"#C8860A":"var(--card-bg)", color: p===page?"#fff":"var(--text-primary)", cursor: "pointer", fontSize: 13, fontWeight: p===page?800:600, transition: "all 0.12s" }}>
          {p}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page === total}
        style={{ padding: "6px 13px", borderRadius: 8, border: "1.5px solid var(--border)", background: "var(--card-bg)", color: page===total?"var(--text-muted)":"var(--text-primary)", cursor: page===total?"not-allowed":"pointer", fontSize: 13, fontWeight: 700 }}>›</button>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ReportsClient() {
  const [filter, setFilter]     = useState<FilterType>("All Reports");
  const [search, setSearch]     = useState("");
  const [openReport, setOpenReport] = useState<Report | null>(null);
  const [page, setPage]         = useState(1);
  const [showLiveNews, setShowLiveNews] = useState(false);

  // Reset to page 1 when filter or search changes
  useEffect(() => { setPage(1); }, [filter, search]);

  const filtered = useMemo(() => {
    let r = REPORTS;
    if (filter !== "All Reports") r = r.filter(x => x.type === filter);
    if (search) { const q = search.toLowerCase(); r = r.filter(x => x.title.toLowerCase().includes(q) || x.summary.toLowerCase().includes(q) || x.tags.some(t => t.toLowerCase().includes(q))); }
    return r;
  }, [filter, search]);

  const featured = useMemo(() => filtered.filter(r => r.featured), [filtered]);
  const rest     = useMemo(() => filtered.filter(r => !r.featured), [filtered]);

  const totalPages  = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const pageItems   = rest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => ({
    all: REPORTS.length,
    Research:    REPORTS.filter(r => r.type === "Research").length,
    Technical:   REPORTS.filter(r => r.type === "Technical").length,
    Fundamental: REPORTS.filter(r => r.type === "Fundamental").length,
  }), []);

  const allTags = useMemo(() => {
    const freq: Record<string, number> = {};
    REPORTS.forEach(r => r.tags.forEach(t => { freq[t] = (freq[t] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([t]) => t);
  }, []);

  const FILTERS: [FilterType, string, number][] = [
    ["All Reports", "📰", counts.all],
    ["Research",    "🔍", counts.Research],
    ["Technical",   "📈", counts.Technical],
    ["Fundamental", "📊", counts.Fundamental],
  ];

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: "var(--background)" }}>
      {openReport && <ReportModal r={openReport} onClose={() => setOpenReport(null)} />}

      {/* ── Page header ── */}
      <div style={{ background: "linear-gradient(135deg, var(--navy) 0%, #1a3560 100%)", padding: "28px 32px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(212,151,26,0.8)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>STOCKIFYY · RESEARCH DESK</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 6px", lineHeight: 1.1 }}>
              Market Reports <span style={{ color: "#D4971A" }}>&amp; Analysis</span>
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: 0 }}>In-depth research, technical and fundamental coverage by the Stockifyy team · Updated Aug 2026</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {FILTERS.slice(1).map(([type, icon, count]) => {
              const cfg = TYPE_CONFIG[type as ReportType];
              return (
                <div key={type} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 18px", borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", minWidth: 80 }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: cfg.color }}>{count}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{type}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 32px", display: "flex", gap: 28, alignItems: "flex-start" }}>

        {/* ── Left sidebar ── */}
        <div style={{ width: 210, flexShrink: 0, position: "sticky", top: 72 }}>
          {/* Live News button */}
          <button onClick={() => setShowLiveNews(!showLiveNews)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10,
            border: showLiveNews ? "2px solid #dc2626" : "1.5px solid var(--border)",
            background: showLiveNews ? "rgba(220,38,38,0.08)" : "var(--card-bg)",
            cursor: "pointer", marginBottom: 12, transition: "all 0.15s",
          }}>
            <span style={{ fontSize: 14 }}>📡</span>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: showLiveNews ? "#dc2626" : "var(--text-primary)" }}>Live PSX News</div>
              <div style={{ fontSize: 9.5, color: "var(--text-muted)", fontWeight: 500 }}>Real-time market updates</div>
            </div>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#dc2626", animation: "pulse 2s infinite", flexShrink: 0 }} />
          </button>
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

          <div className="card" style={{ padding: "16px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 10 }}>Filter By Type</div>
            {FILTERS.map(([f, icon, count]) => (
              <button key={f} onClick={() => setFilter(f as FilterType)} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "8px 10px", borderRadius: 8, border: "none",
                background: filter === f ? "rgba(200,134,10,0.12)" : "transparent",
                cursor: "pointer", marginBottom: 3,
                borderLeft: filter === f ? "3px solid #C8860A" : "3px solid transparent",
              }}>
                <span style={{ fontSize: 12, fontWeight: filter === f ? 700 : 500, color: filter === f ? "#C8860A" : "var(--text-muted)" }}>{icon} {f}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: filter === f ? "#C8860A" : "var(--border)", color: filter === f ? "#fff" : "var(--text-muted)" }}>{count}</span>
              </button>
            ))}
          </div>

          <div className="card" style={{ padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>Search</div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Report title, ticker…"
              style={{ width: "100%", padding: "8px 10px", border: "1.5px solid var(--border)", borderRadius: 7, fontSize: 12, background: "var(--background)", color: "var(--text)", outline: "none", boxSizing: "border-box" }} />
            {search && <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-muted)" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</div>}
          </div>

          <div className="card" style={{ padding: "14px" }}>
            {/* Sectors */}
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>Sectors</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 14 }}>
              {[
                { name: "Banking",    color: "#2563eb" },
                { name: "Cement",     color: "#ea580c" },
                { name: "Technology", color: "#7c3aed" },
                { name: "Fertilizer", color: "#059669" },
                { name: "Oil & Gas",  color: "#dc2626" },
              ].map(({ name, color }) => (
                <button key={name} onClick={() => setSearch(search === name ? "" : name)} style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "6px 9px", borderRadius: 8,
                  border: "none", cursor: "pointer", textAlign: "left",
                  background: search === name ? color + "14" : "transparent",
                  borderLeft: `3px solid ${search === name ? color : "transparent"}`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: search === name ? 700 : 500, color: search === name ? color : "var(--text-muted)" }}>{name}</span>
                </button>
              ))}
            </div>
            {/* Popular Tags */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 8 }}>Popular Tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {allTags.slice(0, 14).map(tag => (
                  <button key={tag} onClick={() => setSearch(search === tag ? "" : tag)} style={{
                    padding: "3px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, cursor: "pointer",
                    background: search === tag ? "#C8860A" : "var(--border)", color: search === tag ? "#fff" : "var(--text-muted)", border: "none",
                    transition: "all 0.12s",
                  }}>{tag}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ── Live PSX News Section ── */}
          {showLiveNews && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ height: 3, width: 24, borderRadius: 2, background: "#dc2626" }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.08em" }}>Live Market News</span>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#dc2626", animation: "pulse 2s infinite", display: "inline-block" }} />
                <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }}>Updated daily from top PSX sources</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
                {LIVE_NEWS.map(n => <NewsCard key={n.id} n={n} />)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20 }}>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Stockifyy Research Reports Below</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
            </div>
          )}

          {/* Featured — always shown at top, not paginated */}
          {featured.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ height: 3, width: 24, borderRadius: 2, background: "#C8860A" }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: "#C8860A", textTransform: "uppercase", letterSpacing: "0.08em" }}>Featured Reports</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
                {featured.map(r => (
                  <div key={r.id} onClick={() => setOpenReport(r)} className="card"
                    style={{ padding: "20px", cursor: "pointer", borderTop: `3px solid ${TYPE_CONFIG[r.type].color}`, transition: "transform 150ms, box-shadow 150ms" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "0 10px 30px rgba(0,0,0,0.12)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = ""; }}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
                      <span style={{ padding: "2px 9px", borderRadius: 20, background: TYPE_CONFIG[r.type].bg, color: TYPE_CONFIG[r.type].color, fontSize: 10, fontWeight: 700 }}>{TYPE_CONFIG[r.type].icon} {r.type}</span>
                      {r.rating && <span style={{ padding: "2px 9px", borderRadius: 20, background: "rgba(22,163,74,0.10)", color: "#16a34a", fontSize: 10, fontWeight: 700 }}>● {r.rating}</span>}
                      {r.target && <span style={{ padding: "2px 9px", borderRadius: 20, background: "rgba(37,99,235,0.08)", color: "#2563eb", fontSize: 10, fontWeight: 700 }}>🎯 {r.target}</span>}
                    </div>
                    <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "var(--navy)", lineHeight: 1.4 }}>{r.title}</h3>
                    <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{r.summary}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {r.tags.slice(0, 2).map(t => <span key={t} style={{ padding: "2px 7px", borderRadius: 10, background: "var(--border)", color: "var(--text-muted)", fontSize: 10, fontWeight: 600 }}>{t}</span>)}
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>📅 {r.date} · ⏱ {r.readMin}m</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {featured.length > 0 && rest.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                All Reports · Page {page} of {totalPages}
              </span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
          )}

          {/* Paginated report grid */}
          {pageItems.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
              {pageItems.map(r => <ReportCard key={r.id} r={r} onClick={() => setOpenReport(r)} />)}
            </div>
          )}

          {/* Pagination */}
          <Pagination page={page} total={totalPages} onChange={setPage} />

          {filtered.length === 0 && (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              No reports match your search. Try different keywords or clear the filter.
              {search && <button onClick={() => setSearch("")} style={{ display: "block", margin: "12px auto 0", padding: "7px 16px", border: "none", background: "#C8860A", color: "#fff", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Clear Search</button>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const PSX_NEWS = [
  { id: 1, icon: "📈", category: "Market Update", catBg: "rgba(34,197,94,0.10)", catColor: "#16a34a", date: "2 Sep 2026",
    title: "KSE-100 surges past 115,000 — new all-time high on SBP rate-cut optimism",
    body: "The benchmark KSE-100 index touched 115,420 intraday, its highest ever level, as investors priced in an expected 50bps rate cut at the September 2026 MPC meeting. Banking stocks led the rally with HBL, MCB and MEBL all gaining over 3%." },
  { id: 2, icon: "🏦", category: "Monetary Policy", catBg: "rgba(99,102,241,0.10)", catColor: "#6366f1", date: "29 Aug 2026",
    title: "SBP holds policy rate at 11.5% in August MPC — next meeting 22 September",
    body: "The State Bank of Pakistan maintained its policy rate at 11.5% in the August MPC meeting, citing easing but still-elevated core inflation. The next Monetary Policy Committee meeting is scheduled for 22 September 2026." },
  { id: 3, icon: "⚡", category: "Sector News", catBg: "rgba(234,179,8,0.10)", catColor: "#ca8a04", date: "28 Aug 2026",
    title: "Power sector circular debt drops to PKR 2.1 trillion — NEPRA",
    body: "NEPRA confirmed that the power sector circular debt has been reduced to PKR 2.1 trillion from a peak of PKR 2.9 trillion, following quarterly capacity payment renegotiations with IPPs. Analysts expect improved cash flows for HUBC and KAPCO." },
  { id: 4, icon: "🌾", category: "Fertilizer", catBg: "rgba(16,185,129,0.10)", catColor: "#059669", date: "26 Aug 2026",
    title: "Urea prices up 8% in Punjab ahead of Kharif season — FFC, EFERT to benefit",
    body: "Ex-factory urea prices increased by PKR 150/bag in Punjab ahead of the Kharif cropping season. FFC and Engro Fertilizers are expected to report stronger Q3 FY2026 margins as domestic urea demand peaks through September." },
  { id: 5, icon: "🏗️", category: "Cement", catBg: "rgba(249,115,22,0.10)", catColor: "#ea580c", date: "25 Aug 2026",
    title: "Cement despatches up 11% YoY in July 2026 — APCMA data",
    body: "All Pakistan Cement Manufacturers Association (APCMA) reported total cement despatches of 4.8 million tonnes in July 2026, up 11% year-on-year, driven by a surge in infrastructure spending. Lucky Cement and DGKC are top sector picks." },
  { id: 6, icon: "💵", category: "Currency", catBg: "rgba(59,130,246,0.10)", catColor: "#2563eb", date: "22 Aug 2026",
    title: "PKR stabilises at 278/USD as remittances hit record USD 3.5 bn in July",
    body: "The Pakistani Rupee held steady against the US Dollar at PKR 278, supported by record monthly remittances of USD 3.5 billion in July 2026 — the highest ever — and a narrowing current account deficit. SBP FX reserves rose to USD 10.2 billion." },
  { id: 7, icon: "🛢️", category: "Oil & Gas", catBg: "rgba(239,68,68,0.10)", catColor: "#dc2626", date: "20 Aug 2026",
    title: "OGDC & PPL announce major gas discovery in Khyber Pakhtunkhwa block",
    body: "OGDC and PPL, through their joint venture in the KP block, announced a significant natural gas discovery with estimated reserves of 50 BCF. The discovery is expected to add meaningfully to PPL's production from FY2027 onwards." },
  { id: 8, icon: "📦", category: "PSX Corporate", catBg: "rgba(168,85,247,0.10)", catColor: "#9333ea", date: "18 Aug 2026",
    title: "PSX launches new SME board — 12 companies to list in Q4 2026",
    body: "The Pakistan Stock Exchange officially launched its revamped SME board, with 12 companies expected to complete their initial public offerings by Q4 2026. The initiative is part of PSX's broader strategy to increase market capitalisation to USD 50 billion by 2028." },
];
