"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Routes that should show the full-viewport chart layout
// (no ticker, no footer, content fills 100vh)
const CHART_ROUTES = new Set(["/dashboard/technical-chart"]);

interface Props {
  children: ReactNode;
  ticker: ReactNode;
  footer: ReactNode;
}

export default function PortalConditionalShell({ children, ticker, footer }: Props) {
  const pathname = usePathname();
  const isChartRoute = CHART_ROUTES.has(pathname);

  if (isChartRoute) {
    return (
      <div
        style={{
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <>
      <div className="portal-fade-down" style={{ animationDelay: "80ms" }}>
        {ticker}
      </div>
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
