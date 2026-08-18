"use client";
import { useEffect, useState } from "react";

export function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const check = () =>
      setDark(document.documentElement.getAttribute("data-theme") === "dark");
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return dark;
}

// Color tokens — use these instead of hardcoded hex values in components
export function useDarkTokens() {
  const dark = useDarkMode();
  return {
    dark,
    bg:         dark ? "#0E1F30" : "#ffffff",
    bgPage:     dark ? "#0B1622" : "#F8F6F1",
    bgLight:    dark ? "#0A1825" : "#F5F7FA",
    bgHover:    dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    text:       dark ? "#BDD0E8" : "#07111F",
    textSec:    dark ? "#7A9AB8" : "#4A5568",
    textMuted:  dark ? "#5C8099" : "#718096",
    border:     dark ? "rgba(255,255,255,0.09)" : "#E2E8F0",
    borderDark: dark ? "rgba(255,255,255,0.15)" : "#CBD5E0",
    cardBg:     dark ? "#0E1F30" : "#ffffff",
    cardShadow: dark ? "0 1px 4px rgba(0,0,0,0.55)" : "0 1px 3px rgba(0,0,0,0.08)",
    inputBg:    dark ? "#0A1825" : "#ffffff",
    tableTh:    dark ? "#0A1825" : "#F5F7FA",
    tableRow:   dark ? "#0E1F30" : "#ffffff",
    tableRowAlt:dark ? "#091520" : "#FAFAFA",
  };
}
