import type { Metadata } from "next";
import HeatmapClient from "./_components/HeatmapClient";

export const metadata: Metadata = {
  title: "Market Heatmap",
  description: "PSX stock market heatmap — sector-wise performance with Shariah-compliant stock indicators.",
};

export default function HeatmapPage() {
  return <HeatmapClient />;
}
