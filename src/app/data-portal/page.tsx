import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getMarketSummary } from "@/lib/market-data";
import PortalTitle from "./_components/PortalTitle";
import PageAnimations from "./_components/PageAnimations";
import GlobalSearch from "./_components/GlobalSearch";
import PublicNotice from "./_components/PublicNotice";

const DashboardClient      = dynamic(() => import("./_components/DashboardClient"), { ssr: false });
const AnnouncementsSection = dynamic(() => import("./_components/AnnouncementsSection"));

export const metadata: Metadata = { title: "Market Overview" };

export default async function DataPortalPage() {
  const data = await getMarketSummary().catch(() => null);

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
          <DashboardClient initialData={data} />
          <AnnouncementsSection />
        </div>
      </PageAnimations>
    </>
  );
}
