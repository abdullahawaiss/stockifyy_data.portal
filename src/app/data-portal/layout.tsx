import type { Metadata } from "next";
import PortalNav from "@/components/portal/PortalNav";
import PortalFooter from "@/components/portal/PortalFooter";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Data Portal", template: "%s | Stockifyy Data Portal" },
  description: "Pakistan Stock Exchange market data, company information, and financial research by Stockifyy.",
};

export default async function DataPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const isAdmin = session?.role === "admin" || session?.role === "super_admin" || session?.role === "data_manager";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--light-bg)" }}>
      <PortalNav isAdmin={isAdmin} />
      <main className="flex-1">{children}</main>
      <PortalFooter />
    </div>
  );
}
