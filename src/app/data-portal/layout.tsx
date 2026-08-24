import type { Metadata } from "next";
import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalFooter from "@/components/portal/PortalFooter";
import PortalTickerBar from "@/components/portal/PortalTickerBar";
import PortalConditionalShell from "@/components/portal/PortalConditionalShell";
import { getSession } from "@/lib/auth";
import ChatbotLoader from "@/components/chatbot/ChatbotLoader";
import BackToTop from "@/components/portal/BackToTop";

export const metadata: Metadata = {
  title: { default: "PSX Market Dashboard | Stockifyy", template: "%s | Stockifyy" },
  description: "Live KSE-100 index, stock prices, sector performance, financial results, board meeting announcements and Pakistan Stock Exchange market intelligence — powered by Stockifyy.",
  openGraph: {
    title: "Stockifyy PSX Data Portal",
    description: "Real-time Pakistan Stock Exchange data — KSE-100, gainers, losers, sectors, financials.",
    images: [{ url: "/stockifyy-logo-full.png" }],
  },
};

export default async function DataPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const isAdmin = session?.role === "admin" || session?.role === "super_admin" || session?.role === "data_manager";

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", overflowX: "hidden" }}>
      {/* Sidebar — fixed left, all pages */}
      <PortalSidebar isAdmin={isAdmin} />

      {/* Right content area — offset by sidebar on desktop, full-width on mobile */}
      <div
        className="flex flex-col min-h-screen transition-[margin] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ marginLeft: "var(--sidebar-w, 168px)", overflowX: "hidden", minWidth: 0 }}
        id="portal-main"
      >
        <PortalConditionalShell
          ticker={<PortalTickerBar />}
          footer={<PortalFooter />}
        >
          {children}
        </PortalConditionalShell>
      </div>

      <ChatbotLoader />
      <BackToTop />
    </div>
  );
}
