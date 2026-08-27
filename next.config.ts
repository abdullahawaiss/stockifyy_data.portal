import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// script-src: prod doesn't need 'unsafe-eval' (only needed for dev fast-refresh HMR)
const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline' https://s3.tradingview.com https://s3.tradingview.com"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",  value: "on" },
  { key: "X-Content-Type-Options",  value: "nosniff" },
  // X-Frame-Options covers older browsers; CSP frame-ancestors covers modern ones.
  // Using SAMEORIGIN on both keeps them consistent.
  { key: "X-Frame-Options",         value: "SAMEORIGIN" },
  { key: "X-XSS-Protection",        value: "1; mode=block" },
  { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
  // HSTS — only effective over HTTPS; browsers ignore it over HTTP.
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.tradingview.com",
      "font-src 'self' data: https://*.tradingview.com",
      "connect-src 'self' https://*.tradingview.com wss://*.tradingview.com",
      "frame-src https://www.tradingview.com https://s.tradingview.com",
      "frame-ancestors 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // Cache static assets aggressively
      {
        source: "/_next/static/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Cache public images/logos
      {
        source: "/logos/(.*)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/data-portal",           destination: "/dashboard",           permanent: true },
      { source: "/data-portal/:path*",    destination: "/dashboard/:path*",    permanent: true },
    ];
  },

  async rewrites() {
    return [
      { source: "/dashboard",             destination: "/data-portal"           },
      { source: "/dashboard/:path*",      destination: "/data-portal/:path*"    },
    ];
  },

  // Silence the "you loaded an Image without width/height" warning for SVGs
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'none'; script-src 'none'; sandbox;",
  },

  // Suppress the 401 "invalid credentials" fetch errors from showing as red text in
  // dev server logs (these are expected when a session is missing)
  logging: {
    fetches: { fullUrl: isProd },
  },
};

export default nextConfig;
