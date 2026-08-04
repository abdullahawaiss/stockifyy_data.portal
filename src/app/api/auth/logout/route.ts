import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, invalidateSession } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await invalidateSession(token);
  }
  const res = NextResponse.json({ success: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
