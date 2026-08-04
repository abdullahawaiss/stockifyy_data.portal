import type { Metadata } from "next";
import { Suspense } from "react";
import HistoricalDataClient from "./PageClient";

export const metadata: Metadata = { title: "Historical Data" };

function LoadingFallback() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
        Loading historical data...
      </div>
    </div>
  );
}

export default function HistoricalDataPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HistoricalDataClient />
    </Suspense>
  );
}

