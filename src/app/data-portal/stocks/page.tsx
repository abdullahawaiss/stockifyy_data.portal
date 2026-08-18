import type { Metadata } from "next";
import { Suspense } from "react";
import StocksClient from "./StocksClient";

export const metadata: Metadata = { title: "Stocks — PSX" };

export default function StocksPage() {
  return (
    <Suspense fallback={
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="skeleton h-8 w-48 rounded mb-4" />
        <div className="skeleton h-24 rounded mb-4" />
        <div className="skeleton h-96 rounded" />
      </div>
    }>
      <StocksClient />
    </Suspense>
  );
}
