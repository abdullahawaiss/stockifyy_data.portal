import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// script-src: prod doesn't need 'unsafe-eval' (only needed for dev fast-refresh HMR)
const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

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
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
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
