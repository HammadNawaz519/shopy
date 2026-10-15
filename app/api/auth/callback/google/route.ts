import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getGoogleOAuthConfig,
  verifyOAuthState,
} from "@/lib/security/googleAuth";
import { completeGoogleSignIn } from "@/lib/security/googleAuthFlow";
import {
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from "@/lib/security/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;

  try {
    const searchParams = url.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      return NextResponse.redirect(
        new URL(
          errorParam === "access_denied"
            ? "/login?error=google_cancelled"
            : "/login?error=google_failed",
          origin
        )
      );
    }
    if (!code || !state) {
      return NextResponse.redirect(new URL("/login?error=missing_code", origin));
    }

    const cookieStore = cookies();
    const stateCookie = cookieStore.get("shopy_oauth_state")?.value;
    const { valid: isStateValid, redirectUrl: savedRedirect } = verifyOAuthState(
      state,
      stateCookie
    );
    if (!isStateValid) {
      return NextResponse.redirect(new URL("/login?error=invalid_state", origin));
    }

    const config = getGoogleOAuthConfig(origin);
    if (!config.clientId || !config.clientSecret) {
      return NextResponse.redirect(new URL("/login?error=oauth_not_configured", origin));
    }

    const completed = await completeGoogleSignIn(code, config, savedRedirect);
    const response = NextResponse.redirect(new URL(completed.destinationPath, origin));
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
    response.cookies.set("shopy_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("[GOOGLE OAUTH CALLBACK ERROR]", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", origin));
  }
}
