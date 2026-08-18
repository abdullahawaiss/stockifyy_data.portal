import type { Metadata } from "next";
import dynamic from "next/dynamic";
import IndexCardsClient from "./_components/IndexCardsClient";
import PortalTitle from "./_components/PortalTitle";
import PageAnimations from "./_components/PageAnimations";
import GlobalSearch from "./_components/GlobalSearch";
import PublicNotice from "./_components/PublicNotice";
import SectorPanel from "./_components/SectorPanel";
import KseDetailPanel from "./_components/KseDetailPanel";
import type { MarketSummary } from "@/app/api/portal/market-summary/route";

const GainersSection       = dynamic(() => import("./_components/GainersLosersSection"));
const LosersSection        = dynamic(() => import("./_components/GainersLosersSection"));
const MarketPerformers     = dynamic(() => import("./_components/MarketPerformers"));
const AnnouncementsSection = dynamic(() => import("./_components/AnnouncementsSection"));

export const metadata: Metadata = { title: "Market Overview" };

// Fetch market summary once on the server — all components receive initial data instantly
async function getMarketData(): Promise<MarketSummary | null> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/portal/market-summary`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function DataPortalPage() {
  const data = await getMarketData();

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
        <IndexCardsClient initialData={data ? { indices: data.indices } : undefined} />

        <KseDetailPanel initialIndices={data?.indices} />

        <SectorPanel initialData={data?.sectors} />

        {/* Gainers | Losers | Market Performers — 3 columns */}
        <div style={{ display: "flex", gap: 12, alignItems: "stretch", width: "100%" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <GainersSection gainersOnly initialData={data ? { gainers: data.gainers, losers: data.losers } : undefined} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <LosersSection losersOnly initialData={data ? { gainers: data.gainers, losers: data.losers } : undefined} />
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
