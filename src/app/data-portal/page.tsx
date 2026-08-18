import type { Metadata } from "next";
import DashboardClient from "./_components/DashboardClient";
import AnnouncementsSection from "./_components/AnnouncementsSection";
import PortalTitle from "./_components/PortalTitle";
import PageAnimations from "./_components/PageAnimations";
import GlobalSearch from "./_components/GlobalSearch";
import PublicNotice from "./_components/PublicNotice";
import { STATIC_MARKET, STATIC_ANNOUNCEMENTS } from "./_components/StaticDashboardData";
import type { AnnouncementItem } from "@/lib/market-data";

export const metadata: Metadata = { title: "Market Overview" };

// Pure static page — renders in <10ms, zero API calls, zero DB queries
export default function DataPortalPage() {
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
          <DashboardClient initialData={STATIC_MARKET} />
          <AnnouncementsSection initialData={STATIC_ANNOUNCEMENTS as AnnouncementItem[]} />
        </div>
      </PageAnimations>
    </>
  );
}
