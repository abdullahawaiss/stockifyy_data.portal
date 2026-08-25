import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession, COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

// Constant-time dummy hash prevents timing-based email enumeration.
const DUMMY_HASH = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/oIRpaJkAq";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { allowed, retryAfter } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 1_000_000) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  try {
    const body = await req.json();
    const email: string    = typeof body.email    === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
    const password: string = typeof body.password === "string" ? body.password.slice(0, 72) : "";
    const rememberMe       = body.rememberMe === true;

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!email || !emailValid || !password || password.length < 1) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));

    // Always run bcrypt to prevent timing attacks revealing whether the email exists.
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const passwordValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !passwordValid) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "ACCOUNT_INACTIVE" }, { status: 403 });
    }

    const durationDays = rememberMe ? 30 : 7;
    const userAgent = req.headers.get("user-agent") ?? undefined;
    const token = await createSession(user.id, durationDays, { ipAddress: ip, userAgent });

    // Record last login — fire and forget, don't block the response.
    db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id))
      .catch(() => {});

    const res = NextResponse.json({
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: durationDays * 24 * 60 * 60,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
