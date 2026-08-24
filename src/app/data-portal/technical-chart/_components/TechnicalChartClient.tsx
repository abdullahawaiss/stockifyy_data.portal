"use client";
import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TradingView: any;
  }
}

export default function TechnicalChartClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<unknown>(null);

  const initWidget = useCallback(() => {
    if (!containerRef.current || !window.TradingView) return;
    containerRef.current.innerHTML = "";

    const isDark =
      document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    widgetRef.current = new window.TradingView.widget({
      autosize: true,
      symbol: "PSX:KSE100",
      interval: "D",
      timezone: "Asia/Karachi",
      theme: isDark ? "dark" : "light",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      container_id: "tv_chart_container",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      studies: [],
      show_popup_button: false,
    });
  }, []);

  useEffect(() => {
    if (window.TradingView) {
      initWidget();
      return;
    }
    const script = document.createElement("script");
    script.id = "tv-script";
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = initWidget;
    document.head.appendChild(script);
    return () => {
      const s = document.getElementById("tv-script");
      if (s) s.remove();
    };
  }, [initWidget]);

  return (
    <div style={{ width: "100%", height: "100%", minHeight: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}>
      <div
        id="tv_chart_container"
        ref={containerRef}
        style={{ flex: 1, width: "100%", minHeight: 0 }}
      />
    </div>
  );
}
