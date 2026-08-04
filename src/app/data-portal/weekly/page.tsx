import type { Metadata } from "next";
import { Suspense } from "react";
import WeeklyClient from "./PageClient";

export const metadata: Metadata = { title: "Weekly Market Data" };

function LoadingFallback() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
        Loading weekly market data...
      </div>
    </div>
  );
}

export default function WeeklyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WeeklyClient />
    </Suspense>
  );
}

