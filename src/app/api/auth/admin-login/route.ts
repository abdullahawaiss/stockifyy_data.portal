import { NextResponse } from "next/server";

// Hardcoded admin authentication has been removed.
// All users — including admins — authenticate through POST /api/auth/login
// using their email and bcrypt-hashed password stored in the users table.
export async function POST() {
  return NextResponse.json({ error: "Endpoint removed" }, { status: 410 });
}
