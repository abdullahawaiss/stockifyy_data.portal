"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDarkTokens } from "@/hooks/useDarkMode";

interface Result {
  symbol: string;
  companyName: string | null;
  sectorName: string | null;
  close: string | null;
  priceChange: string | null;
  percentageChange: string | null;
}

function flatten(s: string) { return s.toLowerCase().replace(/[^a-z0-9]/g, ""); }

// Module-level cache — shared across all instances, survives re-renders
let _cachedRows: Result[] = [];
let _fetchPromise: Promise<void> | null = null;

function prefetchRows(): Promise<void> {
  if (_cachedRows.length) return Promise.resolve();
  if (_fetchPromise) return _fetchPromise;
  _fetchPromise = fetch("/api/portal/stocks")
    .then(r => r.json())
    .then(d => { _cachedRows = d.rows ?? []; })
    .catch(() => {});
  return _fetchPromise;
}

// Start loading immediately when the module loads (not on click)
if (typeof window !== "undefined") prefetchRows();

export default function GlobalSearch() {
  const t = useDarkTokens();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [allRows, setAllRows] = useState<Result[]>(_cachedRows);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  // Load all stocks once — instant if already cached
  useEffect(() => {
    if (_cachedRows.length) { setAllRows(_cachedRows); return; }
    prefetchRows().then(() => setAllRows(_cachedRows));
  }, []);

  // Search
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) { setResults([]); setOpen(false); return; }
    const qFlat = flatten(q);
    const words = q.split(/\s+/).filter(Boolean);
    const matched = allRows.filter(r => {
      const sym  = r.symbol.toLowerCase();
      const name = (r.companyName ?? "").toLowerCase();
      const symF = flatten(r.symbol);
      const nmF  = flatten(r.companyName ?? "");
      if (sym.includes(q) || name.includes(q)) return true;
      if (symF.includes(qFlat) || nmF.includes(qFlat)) return true;
      if (words.length > 1 && words.every(w => sym.includes(w) || name.includes(w))) return true;
      return false;
    }).slice(0, 8);
    setResults(matched);
    setOpen(matched.length > 0);
    setSelected(0);
  }, [query, allRows]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setFocused(true);
      }
      if (e.key === "Escape") { setOpen(false); inputRef.current?.blur(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const navigate = useCallback((r: Result) => {
    router.push(`/data-portal/company/${r.symbol}`);
    setQuery(""); setOpen(false);
  }, [router]);

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) navigate(results[selected]);
  };

  const chg = (r: Result) => parseFloat(r.percentageChange ?? "0");

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", maxWidth: 420 }}>
      {/* Input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: focused ? t.bg : (t.dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
        border: `1px solid ${focused ? "var(--gold)" : t.border}`,
        borderRadius: 10, padding: "7px 12px",
        transition: "border-color 0.2s, background 0.2s",
        boxShadow: focused ? "0 0 0 3px rgba(212,175,55,0.12)" : "none",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); if (results.length) setOpen(true); }}
          onKeyDown={onKey}
          placeholder="Search stocks, companies… (Ctrl+K)"
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontSize: 13, color: t.text, fontFamily: "inherit",
          }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, fontSize: 14, lineHeight: 1, padding: 0 }}>✕</button>
        )}
        <span style={{ fontSize: 10, color: t.textMuted, background: t.dark ? "rgba(255,255,255,0.08)" : "#f0f0f0", borderRadius: 4, padding: "2px 5px", fontFamily: "monospace", flexShrink: 0 }}>⌘K</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 999,
          background: t.bg, border: `1px solid ${t.border}`,
          borderRadius: 10, boxShadow: t.cardShadow,
          overflow: "hidden",
        }}>
          {results.map((r, i) => {
            const pct = chg(r);
            const color = pct > 0 ? "#16a34a" : pct < 0 ? "#dc2626" : t.textMuted;
            return (
              <div
                key={r.symbol}
                onMouseDown={() => navigate(r)}
                onMouseEnter={() => setSelected(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 14px", cursor: "pointer",
                  background: i === selected ? (t.dark ? "rgba(212,175,55,0.08)" : "rgba(212,175,55,0.06)") : "transparent",
                  borderBottom: i < results.length - 1 ? `1px solid ${t.border}` : "none",
                  transition: "background 100ms",
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 7, flexShrink: 0,
                  background: t.dark ? "rgba(255,255,255,0.06)" : "#f5f5f5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: "var(--gold)", letterSpacing: "-0.02em",
                }}>
                  {r.symbol.slice(0, 3)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{r.symbol}</span>
                    <span style={{ fontSize: 11, color: t.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.companyName}</span>
                  </div>
                  <div style={{ fontSize: 10, color: t.textMuted, marginTop: 1 }}>{r.sectorName}</div>
                </div>
                {r.close && (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text, fontVariantNumeric: "tabular-nums" }}>
                      {parseFloat(r.close).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color }}>
                      {pct >= 0 ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ padding: "6px 14px", fontSize: 10, color: t.textMuted, borderTop: `1px solid ${t.border}` }}>
            ↑↓ navigate &nbsp;·&nbsp; Enter to open &nbsp;·&nbsp; Esc to close
          </div>
        </div>
      )}
    </div>
  );
}
