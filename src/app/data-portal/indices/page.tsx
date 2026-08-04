import type { Metadata } from "next";
import { Suspense } from "react";
import IndicesClient from "./PageClient";

export const metadata: Metadata = { title: "Market Indices" };

function LoadingFallback() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
        Loading market indices...
      </div>
    </div>
  );
}

export default function IndicesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <IndicesClient />
    </Suspense>
  );
}

