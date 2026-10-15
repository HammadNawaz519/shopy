import { NextResponse } from "next/server";
import { getGoogleOAuthConfig } from "@/lib/security/googleAuth";
import { completeNativeGoogleSignIn } from "@/lib/security/googleAuthFlow";
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from "@/lib/security/session";
import { isValidRedirectUrl } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idToken = typeof body?.idToken === "string" ? body.idToken : "";
    const redirect = typeof body?.redirect === "string" ? body.redirect : "";
    if (!idToken) {
      return NextResponse.json({ error: "missing_google_credential" }, { status: 400 });
    }

    const completed = await completeNativeGoogleSignIn(
      idToken,
      getGoogleOAuthConfig(new URL(req.url).origin),
      isValidRedirectUrl(redirect) ? redirect : undefined
    );
    const response = NextResponse.json({
      user: completed.user,
      destinationPath: completed.destinationPath,
    });
    response.cookies.set(
      SESSION_COOKIE_NAME,
      completed.session.id,
      getSessionCookieOptions()
    );
    response.cookies.set("shopy_client_auth", "1", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("[NATIVE GOOGLE CREDENTIAL ERROR]", error);
    return NextResponse.json({ error: "google_sign_in_failed" }, { status: 401 });
  }
}
