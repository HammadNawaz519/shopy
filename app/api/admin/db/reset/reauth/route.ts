import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/security/session";
import {
  getGoogleOAuthConfig,
  buildGoogleAuthUrl,
  generateOAuthState,
} from "@/lib/security/googleAuth";
import {
  createDestructiveIntent,
  getPendingDestructiveAuth,
} from "@/lib/security/destructiveAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/db/reset/reauth
 *
 * Step 1 of the guarded destructive-reset flow (admin session required).
 *
 * - Reports whether this admin already holds a pending, server-issued
 *   authorization (Google re-auth completed, final confirmation available).
 * - Creates a FRESH re-auth intent and returns a Google authorization URL
 *   with `max_age=0` + `nonce` + `prompt=select_account` so Google forces a
 *   full re-authentication — a silently reused session can never authorize
 *   the destructive operation.
 * - Binds the intent to the shared `shopy_oauth_state` cookie so the
 *   existing Google callback can issue the short-lived single-use token.
 *
 * Nothing here authorizes the reset itself — only a verified callback can
 * mint the token the destructive endpoint requires.
 */
export async function GET(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized: Admin privileges required." },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const origin = url.origin;
  const config = getGoogleOAuthConfig(origin);

  if (!config.clientId || !config.clientSecret) {
    return NextResponse.json(
      {
        error:
          "Google sign-in is not configured. Database reset re-authentication is unavailable.",
      },
      { status: 503 }
    );
  }

  // Mirror /api/auth/google: run the flow on the origin that receives the
  // Google callback so the state cookie is available when Google redirects
  // back.
  const callbackOrigin = new URL(config.redirectUri).origin;
  if (callbackOrigin !== origin) {
    return NextResponse.redirect(new URL("/api/admin/db/reset/reauth", callbackOrigin));
  }

  // A pending authorization means the Google round trip already succeeded
  // for this admin — the UI can offer the explicit final confirmation.
  const pending = await getPendingDestructiveAuth(admin.userId);

  // Fresh intent (latest per admin wins) + state cookie + Google URL.
  const intent = await createDestructiveIntent(admin, "RESET_DB");
  const { stateToken, rawCookieValue } = generateOAuthState("/admin?reauth=1", {
    intentId: intent.intentId,
    operation: intent.operation,
  });
  const authUrl = buildGoogleAuthUrl({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    state: stateToken,
    maxAge: 0, // Freshness policy: Google must NOT silently reuse a session
    nonce: intent.googleNonce,
    // Open Google's authentication page for THIS admin's account directly —
    // password / 2FA — with no account-selection screen.
    prompt: "login",
    loginHint: admin.email,
  });

  const isProduction = process.env.NODE_ENV === "production";
  const response = NextResponse.json({
    pending: pending
      ? {
          operation: pending.operation,
          token: pending.token,
          expiresAt: pending.expiresAt,
          expiresInSec: Math.max(0, Math.floor((pending.expiresAt - Date.now()) / 1000)),
        }
      : null,
    authUrl,
  });

  // Reuse the existing OAuth state cookie mechanism (10-minute CSRF window).
  response.cookies.set("shopy_oauth_state", rawCookieValue, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
