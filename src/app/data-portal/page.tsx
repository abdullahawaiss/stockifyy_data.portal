import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getMarketSummary } from "@/lib/market-data";
import IndexCardsClient from "./_components/IndexCardsClient";
import SectorPanel from "./_components/SectorPanel";
import KseDetailPanel from "./_components/KseDetailPanel";
import PortalTitle from "./_components/PortalTitle";
import PageAnimations from "./_components/PageAnimations";
import GlobalSearch from "./_components/GlobalSearch";
import PublicNotice from "./_components/PublicNotice";

import GainersLosersSection from "./_components/GainersLosersSection";
import MarketPerformers from "./_components/MarketPerformers";
const AnnouncementsSection = dynamic(() => import("./_components/AnnouncementsSection"));

export const metadata: Metadata = { title: "Market Overview" };

export default async function DataPortalPage() {
  // Direct DB call — no HTTP round-trip, result shared with API route via in-memory cache
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
        <IndexCardsClient initialData={data ? { indices: data.indices } : undefined} />

        <KseDetailPanel initialIndices={data?.indices} />

        <SectorPanel initialData={data?.sectors} />

        <div style={{ display: "flex", gap: 12, alignItems: "stretch", width: "100%" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <GainersLosersSection gainersOnly initialData={data ? { gainers: data.gainers, losers: data.losers } : undefined} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <GainersLosersSection losersOnly initialData={data ? { gainers: data.gainers, losers: data.losers } : undefined} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            <MarketPerformers initialData={data} />
          </div>
        </div>

        <AnnouncementsSection />
      </div>
    </PageAnimations>
    </>
  );
}
