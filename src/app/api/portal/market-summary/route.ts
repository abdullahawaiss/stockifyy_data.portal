import { NextResponse } from "next/server";
import { getMarketSummary, type MarketSummary } from "@/lib/market-data";

export const dynamic = "force-dynamic";
export type { MarketSummary };

export async function GET() {
  const data = await getMarketSummary();
  return NextResponse.json(data);
}
