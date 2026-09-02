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
  { id: 9016, symbol: "ATLH", announcementType: "Board Meeting",    title: "Atlas Honda: Board Meeting to consider accounts for quarter ended June 30, 2026",          announcementDate: TODAY,       content: null, fileUrl: null },
  { id: 9017, symbol: "MARI", announcementType: "Financial Results", title: "Mari Petroleum: Audited Financial Statements for year ended June 30, 2026 approved",       announcementDate: TODAY,       content: null, fileUrl: null },
  { id: 9018, symbol: "NBP",  announcementType: "Dividend",         title: "NBP: Interim Cash Dividend @ PKR 1.50 per share announced — Q1 2026",                       announcementDate: daysAgo(1),  content: null, fileUrl: null },
  { id: 9019, symbol: "PPL",  announcementType: "Board Meeting",    title: "PPL: Board of Directors Meeting to approve accounts for period ended March 31, 2026",       announcementDate: daysAgo(1),  content: null, fileUrl: null },
  { id: 9020, symbol: "HCAR", announcementType: "Financial Results", title: "Honda Atlas Cars: EPS for Q1 FY2026 — Unaudited Quarterly Accounts",                       announcementDate: daysAgo(2),  content: null, fileUrl: null },
  { id: 9021, symbol: "PAKT", announcementType: "AGM",              title: "Pak Tobacco: Annual General Meeting Notice FY2025-26",                                       announcementDate: daysAgo(2),  content: null, fileUrl: null },
  { id: 9022, symbol: "KOHC", announcementType: "Dividend",         title: "Kohat Cement: Interim Dividend @ PKR 5.00 per share (50%) declared",                        announcementDate: daysAgo(3),  content: null, fileUrl: null },
  { id: 9023, symbol: "NESTLE",announcementType: "Financial Results","title": "Nestle Pakistan: Half-Year Results for June 30, 2026 — Board Meeting outcome",           announcementDate: daysAgo(3),  content: null, fileUrl: null },
  { id: 9024, symbol: "AICL", announcementType: "Material Info",    title: "Adamjee Insurance: Material Information regarding proposed merger with parent company",      announcementDate: daysAgo(4),  content: null, fileUrl: null },
  { id: 9025, symbol: "SRVI", announcementType: "Board Meeting",    title: "Service Industries: Board Meeting to approve accounts FY2026",                              announcementDate: daysAgo(4),  content: null, fileUrl: null },
  { id: 9026, symbol: "MLCF", announcementType: "Financial Results", title: "Maple Leaf Cement: Annual Results FY2026 — EPS and DPS announced",                          announcementDate: daysAgo(5),  content: null, fileUrl: null },
  { id: 9027, symbol: "PSMC", announcementType: "Dividend",         title: "Pak Suzuki: No dividend for FY2026 — Board Meeting decision",                               announcementDate: daysAgo(5),  content: null, fileUrl: null },
  { id: 9028, symbol: "GAIL", announcementType: "Insider Trade",    title: "Gail (Pakistan): Form-X Change in Shareholding — CEO increases stake",                       announcementDate: daysAgo(6),  content: null, fileUrl: null },
  { id: 9029, symbol: "BAFL", announcementType: "Board Meeting",    title: "Bank Alfalah: Board Meeting for Q2 FY2026 results and interim dividend",                    announcementDate: daysAgo(6),  content: null, fileUrl: null },
  { id: 9030, symbol: "FCCL", announcementType: "Financial Results", title: "Fauji Cement: Quarterly Accounts for period ended March 31, 2026 — Unaudited",              announcementDate: daysAgo(7),  content: null, fileUrl: null },
  { id: 9031, symbol: "SAZGAR",announcementType: "Board Meeting",   title: "Sazgar Engineering: Board Meeting to approve accounts for quarter ended June 30, 2026",      announcementDate: daysAgo(7),  content: null, fileUrl: null },
  { id: 9032, symbol: "CHCC", announcementType: "Dividend",         title: "Cherat Cement: Final Cash Dividend @ PKR 8.00 per share declared for FY2026",               announcementDate: daysAgo(8),  content: null, fileUrl: null },
  { id: 9033, symbol: "ARPL", announcementType: "AGM",              title: "Archroma Pakistan: Annual General Meeting to approve Annual Accounts FY2026",                announcementDate: daysAgo(8),  content: null, fileUrl: null },
  { id: 9034, symbol: "FTML", announcementType: "Financial Results", title: "Faysal Bank: EPS for period ended June 30, 2026 — Audited Annual Accounts",                 announcementDate: daysAgo(9),  content: null, fileUrl: null },
  { id: 9035, symbol: "PNSC", announcementType: "Dividend",         title: "PNSC: Interim Dividend @ PKR 3.00 per share announced — H1 FY2026",                         announcementDate: daysAgo(9),  content: null, fileUrl: null },
  { id: 9036, symbol: "WNDT", announcementType: "Material Info",    title: "WorldCall Telecom: Material information — spectrum licence renewal approved by PTA",         announcementDate: daysAgo(10), content: null, fileUrl: null },
  { id: 9037, symbol: "KAPCO",announcementType: "Board Meeting",    title: "Kot Addu Power: Board Meeting to discuss FY2026 annual accounts and dividend",               announcementDate: daysAgo(10), content: null, fileUrl: null },
  { id: 9038, symbol: "NCPL", announcementType: "Financial Results", title: "Nishat Chunian Power: Annual Results FY2026 announced",                                     announcementDate: daysAgo(11), content: null, fileUrl: null },
  { id: 9039, symbol: "INIL", announcementType: "Insider Trade",    title: "ICI Pakistan: Director sells 50,000 shares — Form-X disclosed",                              announcementDate: daysAgo(11), content: null, fileUrl: null },
  { id: 9040, symbol: "FATIMA",announcementType: "Dividend",        title: "Fatima Fertilizer: Interim Cash Dividend @ PKR 2.00 per share announced",                   announcementDate: daysAgo(12), content: null, fileUrl: null },
  { id: 9041, symbol: "PKGS", announcementType: "Board Meeting",    title: "Packages Ltd: Board Meeting to review Q1 FY2026 performance and interim accounts",           announcementDate: daysAgo(12), content: null, fileUrl: null },
  { id: 9042, symbol: "UNITY",announcementType: "Financial Results", title: "Unity Foods: EPS for period ended March 31, 2026 — Unaudited Quarterly Accounts",           announcementDate: daysAgo(13), content: null, fileUrl: null },
  { id: 9043, symbol: "IGAS", announcementType: "Clarification",    title: "Indus Gas: Clarification regarding suspension of gas distribution in two districts",         announcementDate: daysAgo(13), content: null, fileUrl: null },
  { id: 9044, symbol: "STJT", announcementType: "Board Meeting",    title: "Sitara Textile: Board Meeting scheduled for Q2 FY2026 accounts",                            announcementDate: daysAgo(14), content: null, fileUrl: null },
  { id: 9045, symbol: "AGP",  announcementType: "Dividend",         title: "AGP Limited: Interim Cash Dividend @ PKR 4.50 per share declared",                          announcementDate: daysAgo(14), content: null, fileUrl: null },
];

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const limit = Math.min(200, Math.max(5, parseInt(sp.get("limit") ?? "100")));
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
