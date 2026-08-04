import type { Metadata } from "next";
import { Suspense } from "react";
import ScreenerClient from "./PageClient";

export const metadata: Metadata = { title: "Stock Screener" };

function LoadingFallback() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
        Loading stock screener...
      </div>
    </div>
  );
}

export default function ScreenerPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ScreenerClient />
    </Suspense>
  );
}

