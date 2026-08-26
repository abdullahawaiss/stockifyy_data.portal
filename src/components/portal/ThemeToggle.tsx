"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // Sync with whatever the ThemeProvider applied on mount
  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try { localStorage.setItem("stockifyy-theme", next ? "dark" : "light"); } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="flex items-center justify-center rounded-lg transition-all hover:scale-105 active:scale-95"
      style={{
        width: 34,
        height: 34,
        background: dark ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.08)",
        border: `1px solid ${dark ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.12)"}`,
        color: dark ? "#D4971A" : "rgba(255,255,255,0.7)",
        fontSize: 16,
      }}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
