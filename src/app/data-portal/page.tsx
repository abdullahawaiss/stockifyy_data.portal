import type { Metadata } from "next";
import DashboardClient from "./_components/DashboardClient";
import AnnouncementsSection from "./_components/AnnouncementsSection";
import PortalTitle from "./_components/PortalTitle";
import PageAnimations from "./_components/PageAnimations";
import GlobalSearch from "./_components/GlobalSearch";
import PublicNotice from "./_components/PublicNotice";
import { getMarketSummary, getAnnouncements } from "@/lib/market-data";
import { STATIC_MARKET, STATIC_ANNOUNCEMENTS } from "./_components/StaticDashboardData";
import type { AnnouncementItem } from "@/lib/market-data";

export const metadata: Metadata = { title: "Market Overview" };

async function tryGet<T>(fn: () => Promise<T>, deadlineMs = 250): Promise<T | null> {
  return Promise.race([
    fn(),
    new Promise<null>(resolve => setTimeout(() => resolve(null), deadlineMs)),
  ]);
}

export default async function DataPortalPage() {
  // Both run in parallel; 250ms deadline keeps SSR fast.
  // Cache is warm within seconds of server start (see market-data.ts startup warm).
  // Warm cache → returns in <5ms → user sees live data with zero skeletons.
  // Cold cache → returns null → fall back to placeholder data while client fetches live.
  const [marketData, announcements] = await Promise.all([
    tryGet(getMarketSummary, 250),
    tryGet(() => getAnnouncements(30), 250),
  ]);

  // Use live data if available; placeholder data if not (client will refresh with live)
  const initialMarket     = marketData   ?? STATIC_MARKET;
  const initialAnnouncements = announcements ?? (STATIC_ANNOUNCEMENTS as AnnouncementItem[]);

  return (
    <>
      <PublicNotice />
      <PageAnimations>
        <div className="px-4 sm:px-5" style={{ paddingTop: 10, paddingBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <PortalTitle />
            <GlobalSearch />
          </div>
        </div>

        <div className="px-4 sm:px-5 pb-5 sm:pb-6 space-y-5 sm:space-y-6">
          {/* Always has data — zero skeletons on load */}
          <DashboardClient initialData={initialMarket} />
          <AnnouncementsSection initialData={initialAnnouncements} />
        </div>
      </PageAnimations>
    </>
  );
}
