import type { Metadata } from "next";
import { Suspense } from "react";
import ResearchClient from "./PageClient";

export const metadata: Metadata = { title: "Research Reports" };

function LoadingFallback() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
        Loading research reports...
      </div>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResearchClient />
    </Suspense>
  );
}

