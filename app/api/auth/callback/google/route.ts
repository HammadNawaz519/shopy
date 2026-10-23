import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getGoogleOAuthConfig,
  verifyOAuthState,
} from "@/lib/security/googleAuth";
import { completeGoogleSignIn } from "@/lib/security/googleAuthFlow";
import {
  getDestructiveIntent,
  issueDestructiveAuth,
  consumeDestructiveIntent,
} from "@/lib/security/destructiveAuth";
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
      // Cancellation / Google-side failure: no authorization is minted.
      // The destructive path simply never reaches its success gate.
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
    const { valid: isStateValid, redirectUrl: savedRedirect, destructive } =
      verifyOAuthState(state, stateCookie);
    if (!isStateValid) {
      return NextResponse.redirect(new URL("/login?error=invalid_state", origin));
    }

    const config = getGoogleOAuthConfig(origin);
    if (!config.clientId || !config.clientSecret) {
      return NextResponse.redirect(new URL("/login?error=oauth_not_configured", origin));
    }

    const completed = await completeGoogleSignIn(code, config, savedRedirect);

    // ------------------------------------------------------------------
    // Destructive re-auth branch (e.g. DB reset): the state payload came
    // from /api/admin/db/reset/reauth. Complete sign-in identity checks
    // have already run above (code exchange, verified email, audience).
    // Only when EVERY condition holds is a short-lived single-use token
    // minted — otherwise the intent is destroyed and the operation stays
    // unauthorized.
    // ------------------------------------------------------------------
    if (destructive) {
      const googleEmail = completed.user.email.toLowerCase().trim();
      const intent = await getDestructiveIntent(destructive.intentId);
      const authorized =
        !!intent &&
        intent.operation === destructive.operation &&
        // The Google account MUST be the same account as the logged-in
        // admin the intent belongs to.
        googleEmail === intent.adminEmail &&
        // The account must still hold admin privileges in the database.
        completed.user.role === "admin";

      if (authorized && intent) {
        await issueDestructiveAuth(intent);
      } else {
        // Expired / unknown intent, account mismatch, or lost admin role:
        // destroy the intent so it can never be reused.
        if (intent) await consumeDestructiveIntent(intent.intentId);
      }

      const dest = authorized ? "/admin?reauth=success" : "/admin?reauth=failed";
      const destructiveResponse = NextResponse.redirect(new URL(dest, origin));
      // Keep the session refresh from the sign-in; the destructive
      // authorization lives in the server store, never in the URL.
      destructiveResponse.cookies.set(
        SESSION_COOKIE_NAME,
        completed.session.id,
        getSessionCookieOptions()
      );
      destructiveResponse.cookies.set("shopy_client_auth", "1", {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
      destructiveResponse.cookies.set("shopy_oauth_state", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return destructiveResponse;
    }

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
