import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE = process.env.SESSION_COOKIE_NAME ?? "stockifyy_session";
const LOGIN_PAGE = "/auth/login";

// Only these paths require authentication — everything else in /data-portal is public.
const PROTECTED_PREFIXES = [
  "/data-portal/admin",
  "/api/portal/import",
  "/api/portal/weekly/export",
  "/api/portal/daily/export",
];

async function verifyJwt(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret);
    // Must have a real DB sessionId — reject any directAdmin tokens that may still exist.
    return typeof payload.sessionId === "string" && payload.sessionId.length > 0;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only run on protected paths — public portal pages pass straight through.
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE)?.value;
  const authenticated = token ? await verifyJwt(token) : false;

  if (!authenticated) {
    // API routes → 401 JSON, never an HTML redirect.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const returnTo = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(new URL(`${LOGIN_PAGE}?returnTo=${returnTo}`, req.url));
  }

  // Role enforcement for admin pages is done inside the admin page/layout (DB check).
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/data-portal/admin/:path*",
    "/api/portal/import",
    "/api/portal/weekly/export",
    "/api/portal/daily/export",
  ],
};
