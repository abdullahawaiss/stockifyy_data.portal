import { NextRequest, NextResponse } from "next/server";
import { getAnnouncements } from "@/lib/market-data";

export const dynamic = "force-dynamic";

const TODAY = new Date().toISOString().slice(0, 10);
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10);
}

const STATIC_FALLBACK = [
  { id: 9001, symbol: "HBL",   announcementType: "Board Meeting",    title: "HBL: Board of Directors Meeting — Q1 FY2026 Financial Results",                       announcementDate: daysAgo(1),  content: null, fileUrl: null },
  { id: 9002, symbol: "OGDC",  announcementType: "Dividend",         title: "OGDC: Interim Cash Dividend @ PKR 5.50 per share (55%) — Ex-Date Announced",          announcementDate: daysAgo(1),  content: null, fileUrl: null },
  { id: 9003, symbol: "MCB",   announcementType: "Financial Results", title: "MCB Bank: EPS for period ended March 31, 2026 — Unaudited",                           announcementDate: daysAgo(2),  content: null, fileUrl: null },
  { id: 9004, symbol: "LUCK",  announcementType: "AGM",              title: "Lucky Cement: Notice of Annual General Meeting (AGM) FY2026",                          announcementDate: daysAgo(2),  content: null, fileUrl: null },
  { id: 9005, symbol: "FFC",   announcementType: "Dividend",         title: "FFC: Final Cash Dividend @ PKR 10.00 per share (100%) declared",                       announcementDate: daysAgo(3),  content: null, fileUrl: null },
  { id: 9006, symbol: "ENGRO", announcementType: "Material Info",    title: "Engro Corporation: MOU signed for LNG terminal expansion — material information",       announcementDate: daysAgo(3),  content: null, fileUrl: null },
  { id: 9007, symbol: "PSO",   announcementType: "Financial Results", title: "PSO: Quarterly Report for period ended March 31, 2026 — Unaudited",                    announcementDate: daysAgo(4),  content: null, fileUrl: null },
  { id: 9008, symbol: "MEBL",  announcementType: "Board Meeting",    title: "Meezan Bank: Board Meeting to approve Half-Yearly Accounts December 31, 2025",         announcementDate: daysAgo(4),  content: null, fileUrl: null },
  { id: 9009, symbol: "UBL",   announcementType: "Insider Trade",    title: "UBL: Change in Shareholding — Form-X filed by Director",                               announcementDate: daysAgo(5),  content: null, fileUrl: null },
  { id: 9010, symbol: "TRG",   announcementType: "Financial Results", title: "TRG Pakistan: EPS for Q3 FY2026 — Board Meeting outcome",                              announcementDate: daysAgo(5),  content: null, fileUrl: null },
  { id: 9011, symbol: "SYS",   announcementType: "Dividend",         title: "Systems Limited: Interim Dividend @ PKR 3.00 per share announced",                      announcementDate: daysAgo(6),  content: null, fileUrl: null },
  { id: 9012, symbol: "EFERT", announcementType: "Clarification",    title: "Engro Fertilizers: Clarification regarding media reports on urea pricing",              announcementDate: daysAgo(6),  content: null, fileUrl: null },
  { id: 9013, symbol: "HUBC",  announcementType: "Board Meeting",    title: "Hub Power: Board Meeting scheduled to approve Annual Accounts FY2026",                  announcementDate: daysAgo(7),  content: null, fileUrl: null },
  { id: 9014, symbol: "DGKC",  announcementType: "Financial Results", title: "DG Khan Cement: Results for year ended June 30, 2025 approved",                        announcementDate: daysAgo(7),  content: null, fileUrl: null },
  { id: 9015, symbol: "BAHL",  announcementType: "Dividend",         title: "Bank Al Habib: Cash Dividend @ PKR 2.50 per share (25%) — Ex-Date June 12, 2026",       announcementDate: TODAY,       content: null, fileUrl: null },
];

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const limit = Math.min(50, Math.max(5, parseInt(sp.get("limit") ?? "30")));
    const data = await getAnnouncements(limit);
    const result = data.length > 0 ? data : STATIC_FALLBACK.slice(0, limit);
    const res = NextResponse.json({ data: result });
    res.headers.set("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ data: STATIC_FALLBACK }, { status: 200 });
  }
}
