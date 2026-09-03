import { NextResponse } from "next/server";
import { getMarketSummary, type MarketSummary } from "@/lib/market-data";

export const dynamic = "force-dynamic";
export type { MarketSummary };

export async function GET() {
  const t0 = Date.now();
  try {
    const data = await getMarketSummary();
    console.log(`[api/market-summary] ${Date.now() - t0}ms source=${data.source}`);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=55, stale-while-revalidate=120" },
    });
  } catch {
    const empty: MarketSummary = {
      indices: [], gainers: [], losers: [], volume: [],
      breadth: { advances: 0, declines: 0, unchanged: 0, total: 0 },
      sectors: [], updatedAt: new Date().toISOString(), source: "live",
    };
    return NextResponse.json(empty, { status: 200 });
  }
}
