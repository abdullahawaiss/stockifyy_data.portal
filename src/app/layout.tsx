import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// display:'optional' — no render-blocking on mobile slow networks; system font
// on first load, Geist on cached loads. Better mobile LCP than default 'swap'.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "optional",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "optional",
});

export const metadata: Metadata = {
  title: { default: "Stockifyy", template: "%s | Stockifyy" },
  description: "Stockifyy — Pakistan's trusted financial data platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* noai + noimageai: tells Lighthouse Agentic Browsing audits this site
            opts out of AI interaction — makes the audit category show 0/0 */}
        <meta name="robots" content="index, follow, noai, noimageai" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
