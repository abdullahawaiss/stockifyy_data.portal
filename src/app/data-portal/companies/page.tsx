import type { Metadata } from "next";
import { Suspense } from "react";
import CompaniesClient from "./PageClient";

export const metadata: Metadata = { title: "Company Directory" };

function LoadingFallback() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
      <div className="card p-8 text-center" style={{ color: "var(--text-muted)" }}>
        Loading company directory...
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CompaniesClient />
    </Suspense>
  );
}

