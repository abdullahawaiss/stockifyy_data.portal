import type { Metadata } from "next";
import { getMarketSummary, getAnnouncements } from "@/lib/market-data";
import DashboardClient from "./_components/DashboardClient";
import AnnouncementsSection from "./_components/AnnouncementsSection";
import PortalTitle from "./_components/PortalTitle";
import PageAnimations from "./_components/PageAnimations";
import GlobalSearch from "./_components/GlobalSearch";
import PublicNotice from "./_components/PublicNotice";

export const metadata: Metadata = { title: "Market Overview" };

// Try to get data within deadline — if cached (60s TTL) it's instant,
// if a cold start / PSX scrape is needed we fall through and let the
// client fetch instead, so the page always paints immediately.
const DEADLINE = 400; // ms

async function tryFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => setTimeout(() => reject("timeout"), DEADLINE)),
    ]);
  } catch {
    return fallback;
  }
}

export default async function DataPortalPage() {
  const [data, announcements] = await Promise.all([
    tryFetch(() => getMarketSummary(), null),
    tryFetch(() => getAnnouncements(30), []),
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
          <DashboardClient initialData={data} />
          <AnnouncementsSection initialData={announcements.length ? announcements : undefined} />
        </div>
      </PageAnimations>
    </>
  );
}
