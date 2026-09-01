"use client";
import { useState, useMemo } from "react";

type Category = "Board Meetings" | "Payouts" | "Insider Transactions" | "Result Announcements";

const ALL_ANNOUNCEMENTS: {
  symbol: string; title: string; heldDate: string; postingDate: string; cat: Category;
}[] = [
  { symbol: "ISL",   title: "Board Meeting",                                              heldDate: "19-08-2026", postingDate: "11-08-2026", cat: "Board Meetings" },
  { symbol: "TRIPF", title: "Board Meeting and Announcement of Closed Period",            heldDate: "18-08-2026", postingDate: "11-08-2026", cat: "Board Meetings" },
  { symbol: "SLGL",  title: "Board Meeting in Progress",                                  heldDate: "11-08-2026", postingDate: "11-08-2026", cat: "Board Meetings" },
  { symbol: "PICT",  title: "Board Meeting",                                              heldDate: "19-08-2026", postingDate: "11-08-2026", cat: "Board Meetings" },
  { symbol: "DKTM",  title: "Board Meeting — Financial Results (Dec 31, 2024)",           heldDate: "11-08-2026", postingDate: "11-08-2026", cat: "Board Meetings" },
  { symbol: "DMTM",  title: "Board Meeting — Financial Results (Dec 31, 2024)",           heldDate: "11-08-2026", postingDate: "11-08-2026", cat: "Board Meetings" },
  { symbol: "CEPB",  title: "Board Meeting — Annual Results (Jun 30, 2026)",              heldDate: "12-08-2026", postingDate: "11-08-2026", cat: "Board Meetings" },
  { symbol: "JSGCL", title: "Board Meeting — Annual Results (Jun 30, 2026)",              heldDate: "13-08-2026", postingDate: "11-08-2026", cat: "Board Meetings" },
  { symbol: "PRL",   title: "Board Meeting — Annual Results + Dividend",                  heldDate: "13-08-2026", postingDate: "11-08-2026", cat: "Board Meetings" },
  { symbol: "EFERT", title: "Board Meeting — Half-Year Results (Jun 30, 2026)",           heldDate: "14-08-2026", postingDate: "11-08-2026", cat: "Board Meetings" },
  { symbol: "MCB",   title: "Board Meeting — H1 FY26 Financial Results",                  heldDate: "08-08-2026", postingDate: "08-08-2026", cat: "Board Meetings" },
  { symbol: "OGDC",  title: "Board Meeting — Q4 FY26 Results & Dividend Declaration",    heldDate: "11-08-2026", postingDate: "11-08-2026", cat: "Board Meetings" },

  { symbol: "OGDC",  title: "Cash Dividend — Rs.6.00 per share (Interim)",               heldDate: "12-08-2026", postingDate: "11-08-2026", cat: "Payouts" },
  { symbol: "MARI",  title: "Cash Dividend — Rs.18.70 per share (Final)",                heldDate: "11-08-2026", postingDate: "09-08-2026", cat: "Payouts" },
  { symbol: "LUCK",  title: "Cash Dividend — Rs.5.00 per share (Final)",                 heldDate: "10-08-2026", postingDate: "10-08-2026", cat: "Payouts" },
  { symbol: "MCB",   title: "Cash Dividend — Rs.8.00 per share (Interim)",               heldDate: "14-08-2026", postingDate: "08-08-2026", cat: "Payouts" },
  { symbol: "ENGRO", title: "Cash Dividend — Rs.12.50 per share (Interim)",              heldDate: "16-08-2026", postingDate: "07-08-2026", cat: "Payouts" },
  { symbol: "PSO",   title: "Cash Dividend — Rs.9.00 per share (Final)",                 heldDate: "18-08-2026", postingDate: "06-08-2026", cat: "Payouts" },

  { symbol: "ENGRO", title: "Change in Shareholding — Director Disclosure",              heldDate: "10-08-2026", postingDate: "10-08-2026", cat: "Insider Transactions" },
  { symbol: "LUCK",  title: "Insider Transaction — Purchase by CEO",                     heldDate: "09-08-2026", postingDate: "09-08-2026", cat: "Insider Transactions" },
  { symbol: "TRG",   title: "Change in Shareholding — Sponsor / Director",               heldDate: "08-08-2026", postingDate: "08-08-2026", cat: "Insider Transactions" },
  { symbol: "MARI",  title: "Insider Transaction — Sale by Non-Executive Director",      heldDate: "07-08-2026", postingDate: "07-08-2026", cat: "Insider Transactions" },
  { symbol: "PSO",   title: "Change in Shareholding — CEO Acquisition",                  heldDate: "06-08-2026", postingDate: "06-08-2026", cat: "Insider Transactions" },

  { symbol: "OGDC",  title: "Financial Results — Q4 FY26 (EPS: Rs.8.42, Div: Rs.6.00)", heldDate: "11-08-2026", postingDate: "11-08-2026", cat: "Result Announcements" },
  { symbol: "LUCK",  title: "Financial Results — FY26 (EPS: Rs.31.83, Div: Rs.5.00)",   heldDate: "10-08-2026", postingDate: "10-08-2026", cat: "Result Announcements" },
  { symbol: "MARI",  title: "Financial Results — FY26 (EPS: Rs.72.52, Div: Rs.18.70)",  heldDate: "09-08-2026", postingDate: "09-08-2026", cat: "Result Announcements" },
  { symbol: "MCB",   title: "Financial Results — H1 FY26 (EPS: Rs.19.40, Div: Rs.8.00)",heldDate: "08-08-2026", postingDate: "08-08-2026", cat: "Result Announcements" },
  { symbol: "ENGRO", title: "Financial Results — H1 FY26 (EPS: Rs.24.10, Div: Rs.12.50)",heldDate:"07-08-2026", postingDate: "07-08-2026", cat: "Result Announcements" },
  { symbol: "ACPL",  title: "Financial Results — FY26 (EPS: Rs.24.86, No Dividend)",    heldDate: "06-08-2026", postingDate: "06-08-2026", cat: "Result Announcements" },
];

const CATS: Category[] = ["Board Meetings", "Payouts", "Insider Transactions", "Result Announcements"];

// Coloured initials avatar
function SymbolAvatar({ symbol }: { symbol: string }) {
  const colors = ["#07111F","#1E40AF","#065F46","#92400E","#6B21A8","#9F1239","#164E63"];
  const idx = symbol.charCodeAt(0) % colors.length;
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
      style={{ background: colors[idx] }}>
      {symbol.slice(0, 2)}
    </div>
  );
}

export default function AnnouncementsPage() {
  const [cat, setCat]       = useState<Category>("Board Meetings");
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);
  const PER_PAGE = 12;

  const filtered = useMemo(() =>
    ALL_ANNOUNCEMENTS
      .filter(a => a.cat === cat)
      .filter(a => !search ||
        a.symbol.toLowerCase().includes(search.toLowerCase()) ||
        a.title.toLowerCase().includes(search.toLowerCase())),
    [cat, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const handleCat = (c: Category) => { setCat(c); setPage(1); setSearch(""); };

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">

      {/* ── Page title ── */}
      <h1 className="text-2xl font-black mb-5">
        <span style={{ color: "var(--text-primary)" }}>Announce</span><span style={{ color: "#D4971A" }}>ments</span>
      </h1>

      {/* ── Tabs + Search row ── */}
      <div className="flex flex-wrap items-center gap-0 mb-5 border-b" style={{ borderColor: "var(--border)" }}>
        {/* Tabs */}
        <div className="flex items-center gap-0 flex-1 flex-wrap">
          {CATS.map(c => (
            <button
              key={c}
              onClick={() => handleCat(c)}
              className="relative px-5 py-3 text-sm font-semibold transition-all whitespace-nowrap"
              style={{
                color: cat === c ? "var(--navy)" : "var(--text-muted)",
                background: "transparent",
                borderBottom: cat === c ? "2px solid var(--navy)" : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search bar — right side */}
        <div className="relative mb-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" viewBox="0 0 20 20" fill="none">
            <circle cx="8.5" cy="8.5" r="5.75" stroke="var(--text-muted)" strokeWidth="1.8"/>
            <path d="M13.5 13.5L17.5 17.5" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-3 py-2 rounded-lg text-sm outline-none w-48"
            style={{
              background: "var(--light-bg)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ background: "var(--light-bg)", borderBottom: "1px solid var(--border)" }}>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide cursor-pointer select-none"
                style={{ color: "var(--text-muted)", width: 140 }}>
                Symbol <span className="text-[9px]">⇅</span>
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide cursor-pointer select-none"
                style={{ color: "var(--text-muted)" }}>
                Announcement Title <span className="text-[9px]">⇅</span>
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide cursor-pointer select-none"
                style={{ color: "var(--text-muted)", width: 130 }}>
                Held Date <span className="text-[9px]">⇅</span>
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide"
                style={{ color: "var(--text-muted)", width: 130 }}>
                Posting Date
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  No announcements found
                </td>
              </tr>
            ) : rows.map((a, i) => (
              <tr
                key={i}
                className="border-t transition-colors cursor-pointer"
                style={{ borderColor: "var(--border)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--light-bg)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
              >
                {/* Symbol */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <SymbolAvatar symbol={a.symbol} />
                    <span className="font-black text-[12px]" style={{ color: "var(--navy)" }}>{a.symbol}</span>
                  </div>
                </td>

                {/* Title */}
                <td className="px-4 py-3">
                  <span className="text-[13px] font-normal leading-snug" style={{ color: "var(--text-primary)" }}>
                    {a.title}
                  </span>
                </td>

                {/* Held Date */}
                <td className="px-4 py-3 text-right tabular-nums text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  {a.heldDate}
                </td>

                {/* Posting Date */}
                <td className="px-4 py-3 text-right tabular-nums text-[11px] font-light" style={{ color: "var(--text-muted)" }}>
                  {a.postingDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Pagination footer ── */}
        <div className="flex items-center justify-between px-4 py-3 border-t"
          style={{ borderColor: "var(--border)", background: "var(--light-bg)" }}>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {filtered.length === 0
              ? "No results"
              : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length}`}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold transition-all disabled:opacity-30"
              style={{ background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--navy)" }}
            >‹</button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className="w-7 h-7 rounded text-[11px] font-bold transition-all"
                style={{
                  background: page === n ? "var(--navy)" : "transparent",
                  color: page === n ? "#fff" : "var(--text-muted)",
                  border: `1px solid ${page === n ? "var(--navy)" : "var(--border)"}`,
                }}>
                {n}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-7 h-7 rounded flex items-center justify-center text-sm font-bold transition-all disabled:opacity-30"
              style={{ background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--navy)" }}
            >›</button>
          </div>
        </div>
      </div>

    </div>
  );
}
