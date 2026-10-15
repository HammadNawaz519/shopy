import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getGoogleOAuthConfig,
  verifyOAuthState,
  verifySignedNativeState,
} from "@/lib/security/googleAuth";
import { completeGoogleSignIn } from "@/lib/security/googleAuthFlow";
import { rememberNativeHandoff } from "@/lib/security/nativeOAuthState";
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

    // 1. Handle user cancellation or provider error
    if (errorParam) {
      console.warn("[GOOGLE OAUTH CANCELLED / ERROR]", errorParam);
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

    // 2a. NATIVE (CAPACITOR) BRIDGE: signed URL-carried state. The sign-in
    //     happened in the system browser (separate cookie jar), so we
    //     complete the Google exchange HERE and hand the issued session to
    //     the app via a one-time handoff record that the app's own WebView
    //     polls at /api/auth/google/handoff and converts into its session.
    const nativeState = verifySignedNativeState(state);
    if (!nativeState.valid && /^[\w.-]+\.[\w.-]+$/.test(state ?? "")) {
      // Looks like a signed native state (body.hmac shape) that failed
      // verification — almost always the 10-minute TTL (user took too long
      // in the browser). Without this marker the fallthrough to the classic
      // branch below silently orphans the app (no handoff is stored) while
      // Chrome may end up logged in instead.
      console.warn(
        "[GOOGLE-SIGNIN] CALLBACK: native state FAILED verification (likely 10-min expiry or tampered) — no handoff will be stored; the user must start a fresh sign-in from the app"
      );
    }
    if (nativeState.valid) {
      // [DIAG] The sign-in browser reached the callback. No code/state/token is logged.
      console.log("[GOOGLE-SIGNIN] CALLBACK reached: native state valid", {
        handoffPresent: Boolean(nativeState.handoff),
        handoffLen: nativeState.handoff?.length ?? 0,
        hasRedirect: Boolean(nativeState.redirect),
      });

      const config = getGoogleOAuthConfig(origin);
      console.log(
        `NATIVE GOOGLE CALLBACK handoffId=${nativeState.handoff || "missing"}`
      );
      // .catch logs the exact exchange failure (no token/secret), then rethrows so
      // the existing outer catch returns oauth_failed and NO handoff is stored.
      const completed = await completeGoogleSignIn(code, config, nativeState.redirect).catch(
        (e) => {
          console.error(
            "[GOOGLE-SIGNIN] CALLBACK: completeGoogleSignIn threw → no handoff stored",
            (e as Error)?.message || e
          );
          throw e;
        }
      );
      console.log("[GOOGLE-SIGNIN] CALLBACK: google exchange + session OK", {
        role: completed.user.role,
        destinationPath: completed.destinationPath,
      });

      if (nativeState.handoff) {
        const storeResult = await rememberNativeHandoff(nativeState.handoff, {
          sessionJwt: completed.session.id,
          destinationPath: completed.destinationPath,
        });
        console.log("[GOOGLE-SIGNIN] CALLBACK: handoff stored", storeResult);
      } else {
        console.warn(
          "[GOOGLE-SIGNIN] CALLBACK: native state had NO handoff id — the app's poll can never complete"
        );
      }
      // Return through the app's registered custom scheme. Android dispatches
      // this URI to MainActivity, which closes the Custom Tab and lets the
      // WebView consume the one-time handoff. The HTTPS App Link remains in
      // AndroidManifest.xml as a secondary compatibility path.
      return new NextResponse(null, {
        status: 302,
        headers: { Location: "shopy://oauth/complete" },
      });
    }

    // 2b. CLASSIC WEB FLOW: Validate CSRF State Cookie
    const cookieStore = cookies();
    const stateCookie = cookieStore.get("shopy_oauth_state")?.value;
    const { valid: isStateValid, redirectUrl: savedRedirect } = verifyOAuthState(
      state,
      stateCookie
    );

    if (!isStateValid) {
      console.error("[GOOGLE OAUTH CSRF MISMATCH] Invalid or expired state token");
      return NextResponse.redirect(new URL("/login?error=invalid_state", origin));
    }

    // 3. Resolve OAuth Configuration & Callback URI
    const config = getGoogleOAuthConfig(origin);
    if (!config.clientId || !config.clientSecret) {
      console.error("[GOOGLE OAUTH CONFIG ERROR] Missing credentials in environment");
      return NextResponse.redirect(new URL("/login?error=oauth_not_configured", origin));
    }

    // 4-7. Exchange code, resolve/link user, issue session
    const completed = await completeGoogleSignIn(code, config, savedRedirect);

    const response = NextResponse.redirect(
      new URL(completed.destinationPath, origin)
    );

    // Attach signed session cookie
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

    // Invalidate single-use OAuth state cookie
    response.cookies.set("shopy_oauth_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error: any) {
    console.error("[GOOGLE OAUTH CALLBACK ERROR]", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", origin));
  }
}
