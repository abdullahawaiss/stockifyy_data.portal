import { NextRequest, NextResponse } from "next/server";
import { getAnnouncements } from "@/lib/market-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const limit = Math.min(50, Math.max(5, parseInt(sp.get("limit") ?? "30")));
    // Uses 120s in-memory cache — no DB round-trip on repeated calls
    const data = await getAnnouncements(limit);
    return NextResponse.json({ data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}
