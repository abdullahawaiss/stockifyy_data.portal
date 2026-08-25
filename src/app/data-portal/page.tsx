import type { Metadata } from "next";
import DashboardClient from "./_components/DashboardClient";
import AnnouncementsSection from "./_components/AnnouncementsSection";
import PortalTitle from "./_components/PortalTitle";
import PageAnimations from "./_components/PageAnimations";
import GlobalSearch from "./_components/GlobalSearch";
import PortalCTA, { PortalPhones } from "./_components/PortalCTA";
import PublicNotice from "./_components/PublicNotice";
import { getMarketSummary, getAnnouncements } from "@/lib/market-data";

export const metadata: Metadata = { title: "Market Overview" };

async function tryGet<T>(fn: () => Promise<T>, deadlineMs = 250): Promise<T | null> {
  try {
    return await Promise.race([
      fn(),
      new Promise<null>(resolve => setTimeout(() => resolve(null), deadlineMs)),
    ]);
  } catch {
    return null;
  }
}

export default async function DataPortalPage() {
  // Both run in parallel; 250ms deadline keeps SSR fast.
  // Warm cache → returns in <5ms → user sees real data with zero skeletons.
  // Cold cache → returns null → DashboardClient immediately fetches live data client-side.
  const [marketData, announcements] = await Promise.all([
    tryGet(getMarketSummary, 250),
    tryGet(() => getAnnouncements(30), 250),
  ]);

  // Pass null when data is unavailable — DashboardClient triggers immediate client fetch.
  // Never substitute fabricated placeholder values.
  return (
    <>
      <PublicNotice />
      <PageAnimations>
        <div className="px-4 sm:px-5" style={{ paddingTop: 8, paddingBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "stretch", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            {/* Left: Title + Search */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
              <PortalTitle />
              <GlobalSearch />
            </div>

            {/* Right: Phones + Buttons card */}
            <div className="portal-cta-card" style={{
              display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end", justifyContent: "center",
              borderRadius: 14, padding: "14px 20px",
              flexShrink: 0, position: "relative", overflow: "hidden",
              background: "linear-gradient(135deg, #fdf8f0 0%, #fef9f2 60%, #fff8ee 100%)",
            }}>
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 90" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ctaGoldBar" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.35" />
                    <stop offset="50%"  stopColor="#D4AF37" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
                  </linearGradient>
                  <radialGradient id="ctaNavyGlow" cx="5%" cy="100%" r="55%">
                    <stop offset="0%"   stopColor="#07111F" stopOpacity="0.09" />
                    <stop offset="100%" stopColor="#07111F" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="ctaGoldGlow" cx="95%" cy="0%" r="50%">
                    <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.13" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect width="500" height="90" fill="url(#ctaNavyGlow)" />
                <rect width="500" height="90" fill="url(#ctaGoldGlow)" />
                <rect x="0" y="0" width="500" height="2.5" fill="url(#ctaGoldBar)" />
                <line x1="0"   y1="90" x2="80"  y2="0"  stroke="rgba(7,17,31,0.06)"   strokeWidth="1" />
                <line x1="60"  y1="90" x2="160" y2="0"  stroke="rgba(7,17,31,0.04)"   strokeWidth="1" />
                <line x1="130" y1="90" x2="230" y2="0"  stroke="rgba(7,17,31,0.03)"   strokeWidth="1" />
                <line x1="200" y1="90" x2="300" y2="0"  stroke="rgba(7,17,31,0.025)"  strokeWidth="1" />
                <line x1="350" y1="0"  x2="500" y2="90" stroke="rgba(212,175,55,0.1)"  strokeWidth="1" />
                <line x1="410" y1="0"  x2="500" y2="55" stroke="rgba(212,175,55,0.07)" strokeWidth="1" />
                <line x1="460" y1="0"  x2="500" y2="25" stroke="rgba(212,175,55,0.05)" strokeWidth="1" />
                <polygon points="0,0 70,0 0,90"    fill="rgba(7,17,31,0.04)" />
                <polygon points="500,0 500,90 380,0" fill="rgba(212,175,55,0.05)" />
                {[80,160,240,320,400].map(x => [22,45,68].map(y => (
                  <circle key={`d${x}${y}`} cx={x} cy={y} r="1.3" fill="rgba(212,175,55,0.35)" />
                )))}
              </svg>
              <div style={{ position: "relative", zIndex: 1 }}><PortalPhones /></div>
              <div style={{ position: "relative", zIndex: 1 }}><PortalCTA /></div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-5 pb-5 sm:pb-6 space-y-5 sm:space-y-6">
          <DashboardClient initialData={marketData} />
          <AnnouncementsSection initialData={announcements ?? undefined} />
        </div>
      </PageAnimations>
    </>
  );
}
