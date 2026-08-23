import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, revokeSession, getSessionCookieOptions } from "@/lib/security/session";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  revokeSession(sessionId);

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
