import type { Metadata } from "next";
import OverviewClient from "./OverviewClient";

export const metadata: Metadata = { title: "Market Overview" };

export default function DataPortalPage() {
  return <OverviewClient />;
}
