import { Suspense } from "react";
import ComparisonClient from "./ComparisonClient";

export const metadata = { title: "Stock Comparison — Stockifyy" };

export default function ComparisonPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "rgba(255,255,255,0.4)" }}>Loading...</div>}>
      <ComparisonClient />
    </Suspense>
  );
}
