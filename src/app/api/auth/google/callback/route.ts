import { NextRequest, NextResponse } from "next/server";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { db } from "@/db";
import { users, oauthAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createSession, COOKIE_NAME } from "@/lib/auth";

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const ALLOWED_RETURN_PREFIX = "/data-portal";

function safeReturnTo(raw: string | null | undefined): string {
  if (!raw) return "/data-portal";
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith(ALLOWED_RETURN_PREFIX) && !decoded.startsWith("//")) return decoded;
  } catch {
    // ignore
  }
  return "/data-portal";
}

function clearOAuthCookies(res: NextResponse): void {
  for (const name of ["oauth_state", "oauth_nonce", "oauth_verifier", "oauth_return"]) {
    res.cookies.set(name, "", { httpOnly: true, maxAge: 0, path: "/" });
  }
}

function redirectWithError(code: string, base: string): NextResponse {
  const url = `/auth/login?error=${encodeURIComponent(code)}&returnTo=${encodeURIComponent(base)}`;
  const res = NextResponse.redirect(new URL(url, base));
  clearOAuthCookies(res);
  return res;
}

export async function GET(req: NextRequest) {
  const origin = new URL(req.url).origin;
  const { searchParams } = new URL(req.url);

  const code           = searchParams.get("code");
  const stateFromQuery = searchParams.get("state");

  // Read and immediately clear temp cookies.
  const storedState    = req.cookies.get("oauth_state")?.value;
  const storedNonce    = req.cookies.get("oauth_nonce")?.value;
  const codeVerifier   = req.cookies.get("oauth_verifier")?.value;
  const rawReturn      = req.cookies.get("oauth_return")?.value;
  const returnTo       = safeReturnTo(rawReturn);

  if (!code || !stateFromQuery || !storedState || !storedNonce || !codeVerifier) {
    return redirectWithError("google_failed", origin);
  }

  // CSRF: state must match.
  if (stateFromQuery !== storedState) {
    return redirectWithError("google_failed", origin);
  }

  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri  = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    return redirectWithError("google_failed", origin);
  }

  // Exchange authorization code for tokens using PKCE.
  let idToken: string;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    "authorization_code",
        code_verifier: codeVerifier,
      }),
    });
    const tokenData = await tokenRes.json() as Record<string, unknown>;
    if (!tokenRes.ok || typeof tokenData.id_token !== "string") {
      return redirectWithError("google_failed", origin);
    }
    idToken = tokenData.id_token;
    // Never log the id_token — it is sensitive.
  } catch {
    return redirectWithError("google_failed", origin);
  }

  // Verify ID token with Google JWKS.
  let payload: Record<string, unknown>;
  try {
    const { payload: p } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer:   "https://accounts.google.com",
      audience: clientId,
    });
    payload = p as Record<string, unknown>;
  } catch {
    return redirectWithError("google_failed", origin);
  }

  // Validate required claims.
  if (
    payload.nonce !== storedNonce ||
    payload.email_verified !== true ||
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string"
  ) {
    return redirectWithError("google_failed", origin);
  }

  const providerAccountId = payload.sub;
  const googleEmail       = (payload.email as string).toLowerCase();
  const googleName        = typeof payload.name === "string" ? payload.name : googleEmail.split("@")[0];

  const ip        = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? undefined;

  // 1. Check if an OAuth account already exists for this Google sub.
  const [existingOAuth] = await db
    .select({ userId: oauthAccounts.userId })
    .from(oauthAccounts)
    .where(and(
      eq(oauthAccounts.provider, "google"),
      eq(oauthAccounts.providerAccountId, providerAccountId),
    ));

  if (existingOAuth) {
    // Existing Google user — verify account is still active.
    const [existingUser] = await db.select().from(users).where(eq(users.id, existingOAuth.userId));
    if (!existingUser || !existingUser.isActive) {
      return redirectWithError("account_inactive", origin);
    }
    const token = await createSession(existingUser.id, 7, { ipAddress: ip, userAgent });
    const dest  = safeReturnTo(returnTo);
    const res   = NextResponse.redirect(new URL(dest, origin));
    clearOAuthCookies(res);
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   7 * 24 * 60 * 60,
      path:     "/",
    });
    return res;
  }

  // 2. Check if email matches a local password account — do NOT auto-link.
  const [localUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, googleEmail));
  if (localUser) {
    // Prompt the user to sign in with their password first — never silently link.
    const res = NextResponse.redirect(
      new URL(`/auth/login?error=email_exists&returnTo=${encodeURIComponent(returnTo)}`, origin),
    );
    clearOAuthCookies(res);
    return res;
  }

  // 3. New Google user — create account.
  try {
    const newUserId = await db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          email:         googleEmail,
          passwordHash:  null,           // OAuth-only — no password.
          fullName:      googleName,
          role:          "client",       // Public signup is always client.
          isActive:      true,
          emailVerified: true,           // Google verified the email.
        })
        .returning({ id: users.id });

      await tx.insert(oauthAccounts).values({
        userId:            newUser.id,
        provider:          "google",
        providerAccountId: providerAccountId,
      });

      return newUser.id;
    });

    const token = await createSession(newUserId, 7, { ipAddress: ip, userAgent });
    const dest  = safeReturnTo(returnTo);
    const res   = NextResponse.redirect(new URL(dest, origin));
    clearOAuthCookies(res);
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   7 * 24 * 60 * 60,
      path:     "/",
    });
    return res;
  } catch {
    return redirectWithError("google_failed", origin);
  }
}
