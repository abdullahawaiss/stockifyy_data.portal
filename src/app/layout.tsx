import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "optional" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "optional" });

export const metadata: Metadata = {
  title: { default: "Stockifyy — Pakistan Stock Exchange Data Portal", template: "%s | Stockifyy" },
  description: "Stockifyy is Pakistan's leading PSX data portal — real-time KSE-100 index, stock prices, financials, sector performance, announcements and market intelligence.",
  keywords: ["PSX", "KSE-100", "Pakistan stock exchange", "stock prices", "market data", "Stockifyy", "financial data"],
  authors: [{ name: "Stockifyy Advisory Private Limited" }],
  creator: "Stockifyy",
  publisher: "Stockifyy",
  metadataBase: new URL("https://stockifyy.com"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://stockifyy.com",
    siteName: "Stockifyy",
    title: "Stockifyy — Pakistan Stock Exchange Data Portal",
    description: "Real-time KSE-100, stock prices, financial results, sector analysis and PSX market intelligence.",
    images: [{ url: "/stockifyy-logo-full.png", width: 1200, height: 630, alt: "Stockifyy Data Portal" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stockifyy — PSX Data Portal",
    description: "Real-time Pakistan Stock Exchange market data and financial intelligence.",
    images: ["/stockifyy-logo-full.png"],
    creator: "@stockifyypsx",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: {
    icon: "/stockifyy-logo.svg",
    shortcut: "/stockifyy-logo.svg",
  },
  verification: {},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <meta name="robots" content="index, follow, noai, noimageai" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
