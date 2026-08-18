import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE = process.env.SESSION_COOKIE_NAME ?? "stockifyy_session";

export type SessionUser = {
  id: number;
  email: string;
  fullName: string;
  role: string;
};

export async function createSession(userId: number): Promise<string> {
  const sessionId = randomBytes(64).toString("hex");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ id: sessionId, userId, expiresAt: expires });
  const token = await new SignJWT({ sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);

    // Direct admin token (no DB session required)
    if (payload.directAdmin === true) {
      return {
        id: payload.id as number,
        email: payload.email as string,
        fullName: payload.fullName as string,
        role: payload.role as string,
      };
    }

    const sessionId = payload.sessionId as string;
    // Single JOIN query replaces the previous 2 sequential round-trips
    const [row] = await db
      .select({
        expiresAt: sessions.expiresAt,
        id:        users.id,
        email:     users.email,
        fullName:  users.fullName,
        role:      users.role,
        isActive:  users.isActive,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())));
    if (!row || !row.isActive) return null;
    return { id: row.id, email: row.email, fullName: row.fullName, role: row.role };
  } catch {
    return null;
  }
}

export function canAccess(user: SessionUser | null, minRole: string): boolean {
  const roles = ["public", "client", "advisor", "analyst", "data_manager", "admin", "super_admin"];
  const userIdx = roles.indexOf(user?.role ?? "public");
  const minIdx = roles.indexOf(minRole);
  return userIdx >= minIdx;
}

export const COOKIE_NAME = COOKIE;

export async function invalidateSession(token: string): Promise<void> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const sessionId = payload.sessionId as string;
    if (sessionId) {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    }
  } catch {
    // token already invalid — nothing to delete
  }
}
