"use client";
import { useState, useEffect } from "react";

// Data pending DB connection
type FinancialResult = { symbol: string; period: string; eps?: string; payout?: string; announced: string };
type BoardMeeting    = { symbol: string; scheduledDate: string; time: string; purpose: string; periodEnded: string };
type DividendPayout  = { symbol: string; exDate: string; payDate: string; type: string; amount: string; yield: string };

const FINANCIAL_RESULTS: FinancialResult[] = [];
const BOARD_MEETINGS: BoardMeeting[] = [];
const DIVIDEND_PAYOUTS: DividendPayout[] = [];

// ── helpers ──
function parseDate(ddmmyyyy: string) {
  const [d, m, y] = ddmmyyyy.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function parseMeetingDateTime(date: string, time: string) {
  const dt = parseDate(date);
  const [h, min] = time.split(":").map(Number);
  // Board meeting times appear to be PKT (UTC+5) — treat as local for demo
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), h, min, 0);
}

function todayPKT() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
}

function getDateLabel(scheduledDate: string) {
  const meetingDay = parseDate(scheduledDate);
  const now = todayPKT();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((meetingDay.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return "Past";
  return `${diff}d`;
}

// ── Financial Results card ──
function FinancialResultsCard() {
  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm font-bold" style={{ color: "var(--navy)" }}>Latest Financial Results</h2>
        <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "#16A34A" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
          LIVE
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wide border-b"
        style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--light-bg)" }}>
        <div className="col-span-3">Symbol</div>
        <div className="col-span-3">Period</div>
        <div className="col-span-2 text-right">EPS</div>
        <div className="col-span-2 text-right">Payout</div>
        <div className="col-span-2 text-right">Date</div>
      </div>

      <div className="flex-1 divide-y" style={{ borderColor: "var(--border)" }}>
        {FINANCIAL_RESULTS.map((r) => (
          <div key={r.symbol + r.period}
            className="grid grid-cols-12 items-center px-3 py-2 hover:bg-green-50/10 transition-colors"
            style={{ borderColor: "var(--border)" }}>
            <div className="col-span-3">
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black text-white"
                style={{ background: "#16A34A" }}>{r.symbol}</span>
            </div>
            <div className="col-span-3 text-[9px] font-light tracking-wide" style={{ color: "var(--text-muted)" }}>{r.period}</div>
            <div className="col-span-2 text-right tabular-nums text-[10px] font-bold" style={{ color: "var(--gold)" }}>
              {r.eps ?? "—"}
            </div>
            <div className="col-span-2 text-right text-[9px] font-light" style={{ color: "#16A34A" }}>
              {r.payout ? r.payout : <span style={{ color: "var(--text-muted)" }}>—</span>}
            </div>
            <div className="col-span-2 text-right text-[8px] font-light tabular-nums" style={{ color: "var(--text-muted)" }}>{r.announced}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Board Meetings card with live countdown ──
function BoardMeetingsCard() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  function getCountdown(scheduledDate: string, time: string) {
    const label = getDateLabel(scheduledDate);
    if (label !== "Today") return null;
    const meetDt = parseMeetingDateTime(scheduledDate, time);
    const diff = meetDt.getTime() - Date.now();
    if (diff <= 0) return "Now / Live";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  }

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm font-bold" style={{ color: "var(--navy)" }}>Upcoming Board Meetings</h2>
        <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "var(--gold)" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: "var(--gold)" }} />
          SCHEDULED
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wide border-b"
        style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--light-bg)" }}>
        <div className="col-span-3">Symbol</div>
        <div className="col-span-4">Purpose</div>
        <div className="col-span-2 text-center">Time</div>
        <div className="col-span-3 text-right">When</div>
      </div>

      <div className="flex-1 divide-y" style={{ borderColor: "var(--border)" }}>
        {BOARD_MEETINGS.map((m) => {
          const dateLabel = getDateLabel(m.scheduledDate);
          const countdown = getCountdown(m.scheduledDate, m.time);
          const isToday = dateLabel === "Today";
          return (
            <div key={m.symbol + m.scheduledDate}
              className="grid grid-cols-12 items-start px-3 py-2.5 transition-colors"
              style={{
                borderColor: "var(--border)",
                background: isToday ? "rgba(212,175,55,0.04)" : undefined,
              }}>
              <div className="col-span-3">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black text-white"
                  style={{
                    background: isToday ? "var(--gold)" : "#16A34A",
                  }}>{m.symbol}</span>
              </div>
              <div className="col-span-4">
                <div className="text-[9px] font-light leading-tight" style={{ color: "var(--text-secondary)" }}>{m.purpose}</div>
                <div className="text-[8px] mt-0.5 font-light" style={{ color: "var(--text-muted)" }}>{m.periodEnded}</div>
              </div>
              <div className="col-span-2 text-center text-[9px] tabular-nums font-light" style={{ color: "var(--navy)" }}>
                {m.time}
              </div>
              <div className="col-span-3 text-right">
                {isToday ? (
                  <div>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ background: "rgba(212,175,55,0.12)", color: "var(--gold)" }}>Today</span>
                    {countdown && (
                      <div className="text-[8px] tabular-nums mt-0.5 font-light" style={{ color: "#16A34A" }}>{countdown}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-[9px] font-light" style={{ color: "var(--text-muted)" }}>{dateLabel}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Dividend Payout card ──
function DividendPayoutCard() {
  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm font-bold" style={{ color: "var(--navy)" }}>Dividend Payout</h2>
        <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "#16A34A" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
          LATEST
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wide border-b"
        style={{ color: "var(--text-muted)", borderColor: "var(--border)", background: "var(--light-bg)" }}>
        <div className="col-span-3">Symbol</div>
        <div className="col-span-2 text-center">Type</div>
        <div className="col-span-2 text-right">Amount</div>
        <div className="col-span-3 text-right">Ex-Date</div>
        <div className="col-span-2 text-right">Yield</div>
      </div>

      <div className="flex-1 divide-y" style={{ borderColor: "var(--border)" }}>
        {DIVIDEND_PAYOUTS.map((d) => (
          <div key={d.symbol + d.exDate}
            className="grid grid-cols-12 items-start px-3 py-2.5 hover:bg-green-50/20 transition-colors"
            style={{ borderColor: "var(--border)" }}>
            <div className="col-span-3">
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black text-white"
                style={{ background: "#16A34A" }}>{d.symbol}</span>
            </div>
            <div className="col-span-2 text-center">
              <span className="text-[9px] px-1 py-0.5 rounded font-light"
                style={{
                  background: d.type === "Final" ? "rgba(30,64,175,0.08)" : "rgba(212,175,55,0.1)",
                  color: d.type === "Final" ? "#1E40AF" : "var(--gold)",
                }}>{d.type}</span>
            </div>
            <div className="col-span-2 text-right text-[10px] font-bold tabular-nums" style={{ color: "var(--navy)" }}>
              {d.amount}
            </div>
            <div className="col-span-3 text-right">
              <div className="text-[9px] font-light" style={{ color: "var(--text-secondary)" }}>{d.exDate}</div>
              <div className="text-[8px] mt-0.5 font-light" style={{ color: "var(--text-muted)" }}>Pay: {d.payDate}</div>
            </div>
            <div className="col-span-2 text-right text-[9px] font-semibold tabular-nums" style={{ color: "#16A34A" }}>
              {d.yield}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Tab = "meetings" | "results" | "dividends";

const TABS: { key: Tab; label: string; badge: string; color: string }[] = [
  { key: "meetings",  label: "Upcoming Board Meetings",  badge: "SCHEDULED", color: "#D4AF37" },
  { key: "results",   label: "Latest Financial Results", badge: "LIVE",      color: "#16A34A" },
  { key: "dividends", label: "Dividend Payout",          badge: "LATEST",    color: "#16A34A" },
];

// ── Main export ──
export default function FinancialsSection() {
  const [active, setActive] = useState<Tab | null>(null);

  return (
    <div>
      {/* Section heading */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-base font-black" style={{ color: "var(--navy)" }}>Announcements</h2>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* Tab nav bar */}
      <div className="flex items-center gap-1 mb-4 p-1 rounded-xl"
        style={{ background: "var(--light-bg)", border: "1px solid var(--border)" }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActive(prev => prev === t.key ? null : t.key)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: active === t.key ? "var(--card-bg)" : "transparent",
              color:      active === t.key ? "var(--navy)"    : "var(--text-muted)",
              boxShadow:  active === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              border:     active === t.key ? "1px solid var(--border)" : "1px solid transparent",
            }}
          >
            {t.label}
            <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: active === t.key
                  ? (t.color === "#D4AF37" ? "rgba(212,175,55,0.1)" : "rgba(22,163,74,0.1)")
                  : "transparent",
                color: active === t.key ? t.color : "var(--text-muted)",
              }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
                style={{ background: t.color, opacity: active === t.key ? 1 : 0 }} />
              {t.badge}
            </span>
          </button>
        ))}
      </div>

      {/* Active card */}
      {active === "meetings"  && <BoardMeetingsCard />}
      {active === "results"   && <FinancialResultsCard />}
      {active === "dividends" && <DividendPayoutCard />}
    </div>
  );
}
