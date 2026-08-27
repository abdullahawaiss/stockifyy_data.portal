import type { Metadata } from "next";
import ReportsClient from "./ReportsClient";

export const metadata: Metadata = { title: "Reports — Stockifyy" };

export default function ReportsPage() {
  return <ReportsClient />;
}
