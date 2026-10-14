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
    //     happened in the in-app browser tab (separate cookie jar), so we
    //     complete the Google exchange HERE and hand the issued session to
    //     the app via a one-time handoff record that the app's own WebView
    //     polls at /api/auth/google/handoff and converts into its session.
    const nativeState = verifySignedNativeState(state);
    if (nativeState.valid) {
      // [DIAG] The sign-in tab reached the callback. No code/state/token is logged.
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
      // Bring the Capacitor app to the foreground so the pending session
      // completes on its own. The app's global auth-resume picks up the stored
      // handoff and establishes the logged-in state. Auto-redirect to the custom
      // scheme (shipped via the APK's manifest); a tap target covers browsers
      // that block automatic custom-scheme navigation.
      // Render a page that:
      //  1. Immediately (t=0) attempts the shopy:// redirect for fast CCT impl.
      //  2. At t=800ms retries in case the immediate attempt was blocked by the
      //     tab's about:blank-or-redirect guard.
      //  3. At t=1200ms tries window.close(); by then Android should have
      //     dispatched the intent and the app should be in the foreground.
      // The "Open in SHOPY app" link is a safe manual fallback (required by the
      // spec) but the automatic path above handles the normal case.
      const html = `<!doctype html><html><head><meta charset="utf-8"/><title>SHOPY — Sign In</title></head>
<body style="margin:0;background:#F4F4F2;font-family:Georgia,serif;color:#495464;display:flex;align-items:center;justify-content:center;height:100vh">
<div style="text-align:center;padding:2rem;max-width:320px">
<h1 style="font-weight:300;letter-spacing:.3em">SHOPY</h1>
<p style="font-size:14px;letter-spacing:.1em;margin-top:1rem">Sign-in complete&hellip;</p>
<p style="font-size:11px;margin-top:1.5rem">Returning to SHOPY&hellip;</p>
<a href="shopy://oauth/complete"
   style="display:inline-block;margin-top:1.5rem;padding:.7rem 1.4rem;background:#495464;color:#F4F4F2;font-size:11px;letter-spacing:.15em;text-transform:uppercase;text-decoration:none;border-radius:2px">
  Open SHOPY app
</a>
<script>
(function(){
  // Attempt 1 \u2014 immediate (handles fast Chrome Custom Tab impls)
  try { window.location.href = "shopy://oauth/complete"; } catch(e){}
  // Attempt 2 \u2014 delayed retry (handles tabs that block synchronous scheme nav)
  setTimeout(function(){
    try { window.location.href = "shopy://oauth/complete"; } catch(e){}
  }, 800);
  // Close the tab AFTER the intent has had time to be dispatched
  setTimeout(function(){
    try { window.close(); } catch(e){}
  }, 1200);
})();
</script>
</div></body></html>`;
      return new NextResponse(html, { status: 200, headers: { "Content-Type": "text/html" } });
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
