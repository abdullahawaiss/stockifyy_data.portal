import type { Metadata } from "next";
import TechnicalChartClient from "./_components/TechnicalChartClient";

export const metadata: Metadata = { title: "Technical Chart" };

export default function TechnicalChartPage() {
  return <TechnicalChartClient />;
}
