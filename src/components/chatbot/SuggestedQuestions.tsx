// Chips shown when chat is fresh (≤1 message). Context-aware per route.

const SUGGESTIONS: Record<string, string[]> = {
  "/dashboard":                ["KSE-100 ka trend kya hai?", "Aaj market kaise perform ki?", "Top gainers kaun hain?", "Portal features explain karo"],
  "/dashboard/daily":          ["Aaj ka market summary do", "High volume stocks kaun hain?", "OHLCV data kya hota hai?", "Daily data export kaise karein?"],
  "/dashboard/weekly":         ["Is hafte ki performance summarize karo", "Week-on-week changes explain karo", "Volatility kya dikhata hai?"],
  "/dashboard/indices":        ["KSE-100 aur KSE-30 ka farq kya hai?", "KMI-30 Shariah index hai?", "Index ka calculation kaise hota hai?"],
  "/dashboard/sectors":        ["Konsa sector best perform kar raha hai?", "Sector rotation kya hoti hai?", "Oil & Gas sector ka outlook"],
  "/dashboard/companies":      ["Company profile kaise dekhein?", "Financial statements kahan milenge?", "Dividend history kaise check karein?"],
  "/dashboard/screener":       ["Screener kaise use karein?", "P/E ratio se filter kaise lagayein?", "High dividend yield stocks dhundho"],
  "/dashboard/shariah":        ["Shariah compliance ka criteria kya hai?", "Halal stocks list dikhao", "KMI-30 mein kaun si companies hain?"],
  "/dashboard/historical-data":["Historical data download kaise karein?", "5 saal ka data available hai?", "Date range kaise select karein?"],
  "/dashboard/announcements":  ["Latest announcements dikhao", "Dividend announcement ka matlab kya hai?", "AGM kya hoti hai?"],
  "/dashboard/research":       ["Latest research report summarize karo", "E&P sector outlook kya hai?", "Banking sector performance"],
  "/dashboard/downloads":      ["CSV export kaise karein?", "Kaun se formats available hain?", "Bulk data download kar sakte hain?"],
  "/dashboard/admin":          ["Import data kaise karein?", "CSV format kya hona chahiye?", "Admin panel features explain karo"],
};

const DEFAULT = ["Portfolio performance explain karo", "Financial data samjhao", "KSE market ka overview do", "Portal use karne mein help karo"];

interface Props {
  route: string;
  onSelect: (q: string) => void;
  visible: boolean;
}

export default function SuggestedQuestions({ route, onSelect, visible }: Props) {
  if (!visible) return null;

  // Match exact route, or closest prefix
  const suggestions =
    SUGGESTIONS[route] ??
    Object.entries(SUGGESTIONS)
      .filter(([k]) => route.startsWith(k) && k !== "/dashboard")
      .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ??
    DEFAULT;

  return (
    <div className="px-3 pb-2 pt-1 flex flex-wrap gap-1.5 shrink-0" style={{ borderTop: "1px solid var(--border)", background: "white" }}>
      <p className="w-full text-[10px] font-semibold mb-0.5" style={{ color: "var(--text-muted)" }}>Suggested questions</p>
      {suggestions.map(q => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="text-[11px] px-2.5 py-1 rounded-full transition-colors hover:border-yellow-400"
          style={{
            background: "var(--light-bg)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            whiteSpace: "nowrap",
          }}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
