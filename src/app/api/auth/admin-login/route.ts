import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET required");
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username: string = typeof body.username === "string" ? body.username.trim() : "";
    const password: string = typeof body.password === "string" ? body.password : "";

    if (username !== "stockify" || password !== "stockifyy") {
      await new Promise(r => setTimeout(r, 400)); // timing-safe delay
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Mint a self-contained admin JWT — no DB insert needed
    const token = await new SignJWT({
      directAdmin: true,
      id: 1,
      email: "admin@stockifyy.com",
      fullName: "Awais",
      role: "admin",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
