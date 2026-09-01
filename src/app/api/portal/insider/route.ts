import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// PSX public Form-X disclosures (insider transactions)
// Fetched from PSX's publicly accessible announcements endpoint
const PSX_INSIDER_URL = "https://dps.psx.com.pk/announcements";

// Fallback demo data keyed by symbol
const DEMO_INSIDERS: Record<string, { date: string; name: string; position: string; action: string; quantity: number; rate: number }[]> = {
  HBL: [
    { date: "2026-08-11", name: "Muhammad Aurangzeb", position: "CEO / Managing Director", action: "Buy", quantity: 50000, rate: 295.50 },
    { date: "2026-07-22", name: "Sultan Ali Allana", position: "Chairman / Non-Executive", action: "Buy", quantity: 25000, rate: 282.00 },
    { date: "2026-07-01", name: "Moez Ahamed", position: "CFO / Executive Director", action: "Buy", quantity: 30000, rate: 271.40 },
    { date: "2026-06-15", name: "Sima Kamil", position: "Independent Director", action: "Sell", quantity: 10000, rate: 265.80 },
    { date: "2026-05-20", name: "Rizwan Khan", position: "Company Secretary", action: "Buy", quantity: 15000, rate: 258.30 },
  ],
  OGDC: [
    { date: "2026-08-05", name: "Dr. Raza Ali Kazimi", position: "CEO / Managing Director", action: "Buy", quantity: 100000, rate: 334.00 },
    { date: "2026-07-18", name: "Ahmed Hayat Lak", position: "Chairman / Non-Executive", action: "Buy", quantity: 75000, rate: 318.60 },
    { date: "2026-06-25", name: "Naveed Kamran Baloch", position: "Company Secretary", action: "Buy", quantity: 20000, rate: 308.90 },
    { date: "2026-05-10", name: "Rehana Aslam Khan", position: "Independent Director", action: "Sell", quantity: 50000, rate: 295.20 },
  ],
  LUCK: [
    { date: "2026-08-10", name: "Muhammad Ali Tabba", position: "CEO / Managing Director", action: "Buy", quantity: 20000, rate: 459.00 },
    { date: "2026-07-28", name: "Yunus Tabba", position: "Non-Executive Director", action: "Buy", quantity: 500000, rate: 440.50 },
    { date: "2026-06-12", name: "Umair Zaman Khan", position: "Company Secretary", action: "Buy", quantity: 5000, rate: 422.00 },
  ],
  MCB: [
    { date: "2026-08-08", name: "Imran Maqbool", position: "CEO / Managing Director", action: "Buy", quantity: 40000, rate: 400.00 },
    { date: "2026-07-15", name: "Mian Mohammad Mansha", position: "Chairman / Substantial Shareholder", action: "Buy", quantity: 1000000, rate: 385.00 },
    { date: "2026-06-20", name: "Syed Imran Ali Shah", position: "Company Secretary", action: "Sell", quantity: 8000, rate: 372.00 },
  ],
  ENGRO: [
    { date: "2026-08-12", name: "Shahzada Dawood", position: "CEO / Managing Director", action: "Buy", quantity: 35000, rate: 281.80 },
    { date: "2026-07-25", name: "Hussain Dawood", position: "Chairman / Non-Executive", action: "Buy", quantity: 200000, rate: 268.50 },
    { date: "2026-06-10", name: "Imran Saleem", position: "Company Secretary", action: "Buy", quantity: 12000, rate: 255.00 },
    { date: "2026-05-15", name: "Naz Khan", position: "Independent Director", action: "Sell", quantity: 15000, rate: 248.30 },
  ],
};

const DEFAULT_INSIDERS = [
  { date: "2026-08-11", name: "Saad Iqbal", position: "Independent Director", action: "Buy", quantity: 50000, rate: 0 },
  { date: "2026-07-22", name: "Abdul Rehman Warraich", position: "Non-Executive Director", action: "Buy", quantity: 25000, rate: 0 },
  { date: "2026-07-01", name: "Hamza Ahmad Khan", position: "Executive Director", action: "Sell", quantity: 100000, rate: 0 },
  { date: "2026-06-05", name: "Ms. Fehmida Amin", position: "Substantial Shareholder", action: "Buy", quantity: 500000, rate: 0 },
  { date: "2026-05-15", name: "Adil Bashir", position: "Executive Director", action: "Buy", quantity: 30000, rate: 0 },
];

export async function GET(req: NextRequest) {
  const sym = req.nextUrl.searchParams.get("symbol")?.toUpperCase();
  if (!sym) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  // Try PSX public API
  try {
    const res = await fetch(
      `${PSX_INSIDER_URL}?type=insider&symbol=${sym}&size=30`,
      { headers: { "Accept": "application/json" }, next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.length > 0) {
        return NextResponse.json({ source: "psx", data: json.data.slice(0, 30) });
      }
    }
  } catch {
    // fall through to static
  }

  // Fall back to curated static data
  const data = DEMO_INSIDERS[sym] ?? DEFAULT_INSIDERS.map(d => ({ ...d, rate: 0 }));
  return NextResponse.json({ source: "static", data });
}
