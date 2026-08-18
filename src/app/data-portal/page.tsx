import type { Metadata } from "next";
import dynamic from "next/dynamic";
import IndexCardsClient from "./_components/IndexCardsClient";
import MarketBreadthBar from "./_components/MarketBreadthBar";
import PortalTitle from "./_components/PortalTitle";
import PageAnimations from "./_components/PageAnimations";
import GlobalSearch from "./_components/GlobalSearch";
import PublicNotice from "./_components/PublicNotice";

const KseDetailPanel       = dynamic(() => import("./_components/KseDetailPanel"));
const GainersSection       = dynamic(() => import("./_components/GainersLosersSection"));
const LosersSection        = dynamic(() => import("./_components/GainersLosersSection"));
const MarketPerformers     = dynamic(() => import("./_components/MarketPerformers"));
const SectorPanel          = dynamic(() => import("./_components/SectorPanel"));
const AnnouncementsSection = dynamic(() => import("./_components/AnnouncementsSection"));

export const metadata: Metadata = { title: "Market Overview" };

export default function DataPortalPage() {
  return (
    <>
    <PublicNotice />
    <PageAnimations>
      {/* ── Hero Title + Global Search ──────────────────────────────── */}
      <div className="px-4 sm:px-5" style={{ paddingTop: 10, paddingBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <PortalTitle />
          <GlobalSearch />
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 sm:px-5 pb-5 sm:pb-6 space-y-5 sm:space-y-6">
        <IndexCardsClient />

        {/* Chart full width */}
        <KseDetailPanel />

        <SectorPanel />

        {/* Gainers | Losers | Volume Leaders — 3 columns */}
        <div style={{ display: "flex", gap: 12, alignItems: "stretch", width: "100%" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <GainersSection gainersOnly />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <LosersSection losersOnly />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            <MarketPerformers />
          </div>
        </div>

        <AnnouncementsSection />
      </div>
    </PageAnimations>
    </>
  );
}
