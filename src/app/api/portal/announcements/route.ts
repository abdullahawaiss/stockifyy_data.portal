import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companyAnnouncements } from "@/db/schema";
import { desc, eq, and, like, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(5, parseInt(sp.get("limit") ?? "20")));
    const offset = (page - 1) * limit;
    const type = sp.get("type") ?? "";
    const symbol = sp.get("symbol") ?? "";

    const conditions = [eq(companyAnnouncements.isPublic, true)];
    if (type) conditions.push(eq(companyAnnouncements.announcementType, type));
    if (symbol) conditions.push(like(companyAnnouncements.symbol, `%${symbol.toUpperCase()}%`));

    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(companyAnnouncements)
        .where(and(...conditions))
        .orderBy(desc(companyAnnouncements.announcementDate))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(companyAnnouncements).where(and(...conditions)),
    ]);

    return NextResponse.json({
      data: rows,
      pagination: { page, limit, total: Number(count), pages: Math.ceil(Number(count) / limit) },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}
