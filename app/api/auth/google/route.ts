import { NextResponse } from "next/server";
import {
  getGoogleOAuthConfig,
  buildGoogleAuthUrl,
  generateOAuthState,
} from "@/lib/security/googleAuth";
import { isValidRedirectUrl } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const redirectParam = url.searchParams.get("redirect") || "";
    const sanitizedRedirect = isValidRedirectUrl(redirectParam) ? redirectParam : "";

    const origin = url.origin;
    const config = getGoogleOAuthConfig(origin);
    if (!config.clientId || !config.clientSecret) {
      console.error("[GOOGLE OAUTH CONFIG ERROR] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
      return NextResponse.redirect(new URL("/login?error=oauth_not_configured", origin));
    }

    // Classic web OAuth stores its CSRF state in a cookie. Start the flow on
    // the same canonical origin that receives the callback so that cookie is
    // available when Google redirects back.
    const callbackOrigin = new URL(config.redirectUri).origin;
    if (callbackOrigin !== origin) {
      const canonicalStart = new URL("/api/auth/google", callbackOrigin);
      if (sanitizedRedirect) {
        canonicalStart.searchParams.set("redirect", sanitizedRedirect);
      }
      return NextResponse.redirect(canonicalStart);
    }

    const { stateToken, rawCookieValue } = generateOAuthState(sanitizedRedirect);
    const authUrl = buildGoogleAuthUrl({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      state: stateToken,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.redirect(authUrl);

    // Set short-lived state cookie for CSRF validation
    response.cookies.set("shopy_oauth_state", rawCookieValue, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60, // 10 minutes
    });

    return response;
  } catch (error: any) {
    console.error("[GOOGLE AUTH INITIATE ERROR]", error);
    const origin = new URL(req.url).origin;
    return NextResponse.redirect(new URL("/login?error=oauth_error", origin));
  }
}
