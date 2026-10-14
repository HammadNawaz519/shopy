import { NextResponse } from "next/server";
import {
  getGoogleOAuthConfig,
  buildGoogleAuthUrl,
  generateOAuthState,
  buildSignedNativeState,
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
    const wantsNative = url.searchParams.get("native") === "1";

    if (!config.clientId || !config.clientSecret) {
      console.error("[GOOGLE OAUTH CONFIG ERROR] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
      return NextResponse.redirect(new URL("/login?error=oauth_not_configured", origin));
    }

    // Classic web OAuth stores its CSRF state in a cookie. Start the flow on
    // the same canonical origin that receives the callback so that cookie is
    // available when Google redirects back.
    if (!wantsNative) {
      const callbackOrigin = new URL(config.redirectUri).origin;
      if (callbackOrigin !== origin) {
        const canonicalStart = new URL("/api/auth/google", callbackOrigin);
        if (sanitizedRedirect) {
          canonicalStart.searchParams.set("redirect", sanitizedRedirect);
        }
        return NextResponse.redirect(canonicalStart);
      }
    }

    const { stateToken, rawCookieValue } = generateOAuthState(sanitizedRedirect);
    const authUrl = buildGoogleAuthUrl({
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      state: stateToken,
    });

    // NATIVE (CAPACITOR) MODE: the app opens the auth URL in its in-app
    // browser tab. The sign-in tab and the app WebView have separate cookie
    // jars, so the state carries a random handoff id (signed in the URL) and
    // the app's own WebView later polls /api/auth/google/handoff to collect
    // the session that the tab sign-in produced.
    if (wantsNative) {
      const handoffId = url.searchParams.get("handoff") || "";
      if (!/^[0-9a-fA-F-]{8,64}$/.test(handoffId)) {
        console.error("[GOOGLE-SIGNIN] NATIVE START missing or invalid handoff id");
        return NextResponse.json({ error: "invalid_handoff" }, { status: 400 });
      }
      const state = buildSignedNativeState(sanitizedRedirect, handoffId);
      const nativeAuthUrl = buildGoogleAuthUrl({
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        state,
      });
      return NextResponse.json({ authUrl: nativeAuthUrl });
    }

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
