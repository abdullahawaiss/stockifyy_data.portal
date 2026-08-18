import type { Metadata } from "next";
import PortfolioLive from "./PortfolioLive";

export const metadata: Metadata = { title: "Live Portfolio — Stockifyy" };

export default function PortfolioPage() {
  return <PortfolioLive />;
}
