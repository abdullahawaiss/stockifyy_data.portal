import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { createHash } from "crypto";
import { createSession, COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const rawToken = searchParams.get("token");

  if (!rawToken || typeof rawToken !== "string" || rawToken.length > 128) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid_token", origin));
  }

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const now       = new Date();

  try {
    const [record] = await db
      .select()
      .from(emailVerificationTokens)
      .where(and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        isNull(emailVerificationTokens.usedAt),
        gt(emailVerificationTokens.expiresAt, now),
      ));

    if (!record) {
      return NextResponse.redirect(new URL("/auth/login?error=invalid_token", origin));
    }

    const [user] = await db.select().from(users).where(eq(users.id, record.userId));
    if (!user || !user.isActive) {
      return NextResponse.redirect(new URL("/auth/login?error=invalid_token", origin));
    }

    // Mark token used and verify email atomically.
    await db.transaction(async (tx) => {
      await tx
        .update(emailVerificationTokens)
        .set({ usedAt: now })
        .where(eq(emailVerificationTokens.id, record.id));
      await tx
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, user.id));
    });

    const ip        = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const userAgent = req.headers.get("user-agent") ?? undefined;
    const token     = await createSession(user.id, 7, { ipAddress: ip, userAgent });

    const res = NextResponse.redirect(new URL("/data-portal", origin));
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   7 * 24 * 60 * 60,
      path:     "/",
    });
    return res;
  } catch {
    return NextResponse.redirect(new URL("/auth/login?error=verification_failed", origin));
  }
}
