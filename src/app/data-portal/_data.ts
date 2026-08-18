// ── Formatting utilities ────────────────────────────────────────────────────
export function fmtNum(n: number, d = 2) {
  return n.toLocaleString("en-PK", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function fmtVol(v: number) {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000)     return (v / 1_000).toFixed(0) + "K";
  return v.toLocaleString();
}

export function getMarketStatus() {
  const pkt  = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const d    = pkt.getDay();
  const mins = pkt.getHours() * 60 + pkt.getMinutes();
  const open = d >= 1 && d <= 5 && mins >= 570 && mins < 930;
  return { open, label: open ? "Market Open" : "Market Closed" };
}

// Announcement badge colors
export const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  Dividend:   { bg: "#D1FAE5", color: "#065F46" },
  Results:    { bg: "#DBEAFE", color: "#1E40AF" },
  Disclosure: { bg: "#FEF3C7", color: "#92400E" },
  AGM:        { bg: "#EDE9FE", color: "#5B21B6" },
};
