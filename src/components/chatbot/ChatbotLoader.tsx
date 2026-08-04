"use client";
import dynamic from "next/dynamic";

// Lazy-load the full chatbot only after hydration — zero SSR overhead
const StockifyChatbot = dynamic(() => import("./StockifyChatbot"), { ssr: false });

export default function ChatbotLoader() {
  return <StockifyChatbot />;
}
