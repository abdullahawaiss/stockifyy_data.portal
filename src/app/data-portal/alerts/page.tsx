import type { Metadata } from "next";
import AlertsClient from "./AlertsClient";

export const metadata: Metadata = { title: "Alerts — Stockifyy" };

export default function AlertsPage() {
  return <AlertsClient />;
}
