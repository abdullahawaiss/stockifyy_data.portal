import { NextResponse } from "next/server";
import { getMarketSummary, type MarketSummary } from "@/lib/market-data";

export const dynamic = "force-dynamic";
export type { MarketSummary };

export async function GET() {
  const t0 = Date.now();
  const data = await getMarketSummary();
  console.log(`[api/market-summary] ${Date.now() - t0}ms source=${data.source}`);
  return NextResponse.json(data);
}
