import type { Metadata } from "next";
import { Suspense } from "react";
import SectorsClient from "./PageClient";

export const metadata: Metadata = { title: "Sector Summary" };

function LoadingFallback() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
        Loading sector summary...
      </div>
    </div>
  );
}

export default function SectorsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SectorsClient />
    </Suspense>
  );
}

