import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  getJwtSecret,
} from "@/lib/security/session";
import { jwtVerifySafe } from "@/lib/security/googleAuth";
import {
  consumeNativeHandoff,
  peekNativeHandoff,
} from "@/lib/security/nativeOAuthState";

export const dynamic = "force-dynamic";

/**
 * NATIVE (CAPACITOR) Google sign-in handoff, polled by the app's own WebView.
 *
 * GET /api/auth/google/handoff?handoffId=<uuid>
 *
 *   - While the in-app sign-in tab hasn't finished: 202 { status: "pending" }
 *   - When it has: the one-time handoff record is CONSUMED, the session
 *     cookie is set in THIS WebView's jar, and: 200 { status: "complete",
 *     destinationPath } — the app then navigates there and is logged in.
 *
 * Security:
 *   - handoffId is an unpredictable client-generated UUID (122 bits)
 *   - the record is one-time (read + delete) with a 10-minute TTL
 *   - the session JWT is re-verified before the cookie is issued
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const handoffId = url.searchParams.get("handoffId") || "";
    console.log(`NATIVE GOOGLE POLL handoffId=${handoffId || "missing"} status=requested`);

    if (!/^[0-9a-fA-F-]{8,64}$/.test(handoffId)) {
      console.log(`NATIVE GOOGLE POLL handoffId=${handoffId || "missing"} status=400`);
      return NextResponse.json({ error: "invalid_handoff" }, { status: 400 });
    }

    // Not ready yet (user still signing in, or tab never completed)
    if (!(await peekNativeHandoff(handoffId))) {
      console.log(`NATIVE GOOGLE POLL handoffId=${handoffId} status=202`);
      return NextResponse.json({ status: "pending" }, { status: 202 });
    }

    // Consume exactly once and verify the stored session before issuing it
    const record = await consumeNativeHandoff(handoffId);
    if (!record) {
      // Lost the race: a previous poll already consumed it.
      console.log(`NATIVE GOOGLE POLL handoffId=${handoffId} status=409`);
      return NextResponse.json({ error: "handoff_consumed" }, { status: 409 });
    }

    const session = jwtVerifySafe(record.sessionJwt, getJwtSecret());
    if (!session) {
      console.log(`NATIVE GOOGLE POLL handoffId=${handoffId} status=400`);
      return NextResponse.json({ error: "handoff_invalid" }, { status: 400 });
    }

    const response = NextResponse.json({
      status: "complete",
      destinationPath: record.destinationPath,
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      record.sessionJwt,
      getSessionCookieOptions()
    );
    response.cookies.set("shopy_client_auth", "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    console.log(`NATIVE GOOGLE POLL handoffId=${handoffId} status=200`);
    return response;
  } catch (error: any) {
    console.error("[GOOGLE OAUTH NATIVE HANDOFF ERROR]", error?.message || error);
    return NextResponse.json({ error: "handoff_failed" }, { status: 500 });
  }
}
