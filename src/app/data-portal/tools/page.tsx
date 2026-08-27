import type { Metadata } from "next";
import ToolsClient from "./ToolsClient";

export const metadata: Metadata = { title: "Financial Tools — Stockifyy" };

export default function ToolsPage() {
  return <ToolsClient />;
}
