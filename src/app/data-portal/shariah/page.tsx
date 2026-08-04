import type { Metadata } from "next";
import ShariahClient from "./ShariahClient";

export const metadata: Metadata = { title: "Shariah Compliant Equities" };

export default function ShariahPage() {
  return <ShariahClient />;
}
