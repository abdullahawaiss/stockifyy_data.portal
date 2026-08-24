"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const StockifyChatbot = dynamic(() => import("./StockifyChatbot"), { ssr: false });

export default function ChatbotLoader() {
  const pathname = usePathname();
  if (pathname?.includes("/technical-chart")) return null;
  return <StockifyChatbot />;
}
