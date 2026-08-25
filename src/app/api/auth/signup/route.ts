import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { checkSignupRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { allowed, retryAfter } = checkSignupRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
  }
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 100_000) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract and normalize — never trust client-supplied role, isActive, admin fields.
  const fullName: string  = typeof body.fullName  === "string" ? body.fullName.trim().slice(0, 255)  : "";
  const email: string     = typeof body.email     === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  const password: string  = typeof body.password  === "string" ? body.password.slice(0, 72) : "";
  const confirm: string   = typeof body.confirmPassword === "string" ? body.confirmPassword.slice(0, 72) : "";

  // Validate full name
  if (!fullName || fullName.length < 2) {
    return NextResponse.json({ error: "VALIDATION", field: "fullName", message: "Full name is required (min 2 characters)." }, { status: 422 });
  }
  if (!/^[\p{L}\p{M}\s'\-\.]+$/u.test(fullName)) {
    return NextResponse.json({ error: "VALIDATION", field: "fullName", message: "Full name contains invalid characters." }, { status: 422 });
  }

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "VALIDATION", field: "email", message: "A valid email address is required." }, { status: 422 });
  }

  // Validate password strength
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "VALIDATION", field: "password", message: "Password must be at least 8 characters." }, { status: 422 });
  }
  const hasUpper  = /[A-Z]/.test(password);
  const hasLower  = /[a-z]/.test(password);
  const hasDigit  = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  if (!(hasUpper && hasLower && (hasDigit || hasSymbol))) {
    return NextResponse.json({
      error: "VALIDATION",
      field: "password",
      message: "Password must contain uppercase, lowercase, and a number or symbol.",
    }, { status: 422 });
  }

  // Server-side confirmation check
  if (password !== confirm) {
    return NextResponse.json({ error: "VALIDATION", field: "confirmPassword", message: "Passwords do not match." }, { status: 422 });
  }

  try {
    // Duplicate email check — generic error to prevent enumeration.
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing) {
      // Waste time with a bcrypt hash to make timing-based enumeration harder.
      await bcrypt.hash(password, 12);
      return NextResponse.json({ error: "SIGNUP_FAILED", message: "Unable to create account. Please try a different email or sign in." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Generate raw token (never stored), derive SHA-256 hash for storage.
    const rawToken  = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // DB transaction: create user + store verification token atomically.
    await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          email,
          passwordHash,
          fullName,
          role: "client",         // Hard-coded — public signup is always client.
          isActive: true,
          emailVerified: false,
        })
        .returning({ id: users.id });

      await tx.insert(emailVerificationTokens).values({
        userId: newUser.id,
        tokenHash,
        expiresAt,
      });
    });

    // No email provider — log the verification URL in development.
    // In production: wire RESEND_API_KEY / SES / Nodemailer here.
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth/verify-email?token=${rawToken}`;
    if (process.env.NODE_ENV !== "production") {
      console.log("[DEV] Email verification link for", email, "->", verifyUrl);
    }

    return NextResponse.json(
      { message: "Account created. Please check your email to verify your account before signing in." },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "SIGNUP_FAILED", message: "Unable to create account. Please try again." }, { status: 500 });
  }
}
