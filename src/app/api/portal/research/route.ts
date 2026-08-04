import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { researchReports } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const type = sp.get("type") ?? "";
    const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(5, parseInt(sp.get("limit") ?? "20")));
    const offset = (page - 1) * limit;

    const conditions = [eq(researchReports.isPublic, true)];
    if (type) conditions.push(eq(researchReports.reportType, type));

    const [rows, [{ count }]] = await Promise.all([
      db.select().from(researchReports).where(and(...conditions))
        .orderBy(desc(researchReports.publicationDate)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(researchReports).where(and(...conditions)),
    ]);

    return NextResponse.json({
      data: rows,
      pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch research" }, { status: 500 });
  }
}
