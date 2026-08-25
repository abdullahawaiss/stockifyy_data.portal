import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";

// Only allowed returnTo prefix — prevents open redirect.
const ALLOWED_RETURN_PREFIX = "/data-portal";

function safeReturnTo(raw: string | null): string {
  if (!raw) return "/data-portal";
  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith(ALLOWED_RETURN_PREFIX) && !decoded.startsWith("//")) return decoded;
  } catch {
    // ignore decode error
  }
  return "/data-portal";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const returnTo = safeReturnTo(searchParams.get("returnTo"));

  // PKCE: code_verifier = 32 random bytes base64url, code_challenge = SHA-256(verifier) base64url
  const codeVerifier  = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");

  // state = CSRF protection, nonce = ID token replay protection
  const state = randomBytes(32).toString("hex");
  const nonce = randomBytes(32).toString("hex");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 503 });
  }

  const params = new URLSearchParams({
    client_id:             clientId,
    redirect_uri:          redirectUri,
    response_type:         "code",
    scope:                 "openid email profile",
    state,
    nonce,
    code_challenge:        codeChallenge,
    code_challenge_method: "S256",
    access_type:           "online",
    prompt:                "select_account",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  const res = NextResponse.redirect(authUrl);
  const cookieOpts = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge:   600, // 10 minutes
    path:     "/",
  };
  res.cookies.set("oauth_state",    state,        cookieOpts);
  res.cookies.set("oauth_nonce",    nonce,        cookieOpts);
  res.cookies.set("oauth_verifier", codeVerifier, cookieOpts);
  res.cookies.set("oauth_return",   returnTo,     cookieOpts);
  return res;
}
