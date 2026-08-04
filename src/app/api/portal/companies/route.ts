import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companies, sectors } from "@/db/schema";
import { eq, like, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const search = sp.get("search") ?? "";
    const sectorCode = sp.get("sector") ?? "";
    const shariah = sp.get("shariah") ?? "";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(10, parseInt(sp.get("limit") ?? "50")));
    const offset = (page - 1) * limit;

    const conditions = [eq(companies.isActive, true)];
    if (search) {
      conditions.push(
        sql`(${companies.symbol} ILIKE ${`%${search}%`} OR ${companies.name} ILIKE ${`%${search}%`})`
      );
    }
    if (shariah) conditions.push(eq(companies.shariahStatus, shariah as "compliant" | "non_compliant" | "under_review" | "unknown"));

    const [rows, [{ count }]] = await Promise.all([
      db
        .select({
          id: companies.id,
          symbol: companies.symbol,
          name: companies.name,
          sectorId: companies.sectorId,
          sectorName: sectors.name,
          sectorCode: sectors.code,
          shariahStatus: companies.shariahStatus,
          listingDate: companies.listingDate,
          website: companies.website,
          freeFloat: companies.freeFloat,
          marketCapCategory: companies.marketCapCategory,
        })
        .from(companies)
        .leftJoin(sectors, eq(companies.sectorId, sectors.id))
        .where(and(...conditions))
        .orderBy(companies.symbol)
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(companies).where(and(...conditions)),
    ]);

    return NextResponse.json({
      data: rows,
      pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}
