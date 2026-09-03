import type { Metadata } from "next";
import NewsPageClient from "./NewsPageClient";

export const metadata: Metadata = {
  title: "PSX Live News | Stockifyy",
  description: "Live Pakistan Stock Exchange news, company announcements, market updates and financial intelligence — powered by Stockifyy.",
};

export default function NewsPage() {
  return <NewsPageClient />;
}
