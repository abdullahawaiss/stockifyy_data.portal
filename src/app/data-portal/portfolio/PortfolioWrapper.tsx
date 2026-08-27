"use client";
import dynamic from "next/dynamic";

const PortfolioLive = dynamic(() => import("./PortfolioLive"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
      Loading portfolio…
    </div>
  ),
});

export default function PortfolioWrapper() {
  return <PortfolioLive />;
}
