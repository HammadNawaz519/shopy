import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, revokeSession } from "@/lib/security/session";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  revokeSession(sessionId);
  cookieStore.delete(SESSION_COOKIE_NAME);

  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
