import type { Metadata } from "next";
import DashboardClient from "./_components/DashboardClient";
import AnnouncementsSection from "./_components/AnnouncementsSection";
import PortalTitle from "./_components/PortalTitle";
import PageAnimations from "./_components/PageAnimations";
import GlobalSearch from "./_components/GlobalSearch";
import PublicNotice from "./_components/PublicNotice";
import { getMarketSummary, getAnnouncements } from "@/lib/market-data";

export const metadata: Metadata = { title: "Market Overview" };

// How long to wait for warm-cache data before rendering the shell immediately.
// A cache hit returns in <5ms; a cache miss times out here and lets the
// client-side fetch handle it (shows skeletons, then live data).
const DEADLINE_MS = 300;

async function tryGet<T>(fn: () => Promise<T>): Promise<T | null> {
  return Promise.race([
    fn(),
    new Promise<null>(resolve => setTimeout(() => resolve(null), DEADLINE_MS)),
  ]);
}

export default async function DataPortalPage() {
  // Both run in parallel; each respects the 300ms deadline
  const [marketData, announcements] = await Promise.all([
    tryGet(getMarketSummary),
    tryGet(() => getAnnouncements(30)),
  ]);

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
          {/* initialData=null → skeleton + client-side fetch; non-null → instant live render */}
          <DashboardClient initialData={marketData} />
          <AnnouncementsSection initialData={announcements ?? undefined} />
        </div>
      </PageAnimations>
    </>
  );
}
