import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import {
  getGoogleOAuthConfig,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  verifyOAuthState,
} from "@/lib/security/googleAuth";
import { db, ADMIN_EMAIL } from "@/lib/db/store";
import {
  createSession,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
} from "@/lib/security/session";
import { hashPassword } from "@/lib/security/auth";
import { isValidRedirectUrl } from "@/lib/security/sanitize";

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

    // 2. Validate CSRF State Cookie
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

    // 4. Exchange code for Google access token
    const tokenData = await exchangeGoogleCode({
      code,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri,
    });

    if (!tokenData.access_token) {
      throw new Error("No access_token returned by Google");
    }

    // 5. Fetch verified Google user info
    const googleUser = await fetchGoogleUserInfo(tokenData.access_token);

    if (!googleUser.email) {
      return NextResponse.redirect(new URL("/login?error=no_email_provided", origin));
    }

    if (!googleUser.emailVerified) {
      console.warn("[GOOGLE OAUTH UNVERIFIED EMAIL]", googleUser.email);
      return NextResponse.redirect(new URL("/login?error=email_not_verified", origin));
    }

    const normalizedEmail = googleUser.email.toLowerCase().trim();
    const isSuperAdminEmail = normalizedEmail === ADMIN_EMAIL.toLowerCase().trim();

    // 6. Resolve / Link in Existing SHOPY User Database
    let user = await db.findUserByEmail(normalizedEmail);

    if (user) {
      // CASE A & C: Existing account found -> Link authentication cleanly
      const isSuperAdmin = isSuperAdminEmail || user.role === "admin";
      if (isSuperAdmin && user.role !== "admin") {
        await db.updateUser(user.id, { role: "admin" });
        user.role = "admin";
      }

      // If user had a placeholder name, upgrade it from Google profile
      if (
        googleUser.name &&
        (user.name === "Client" || user.name === "SHOPY Client" || !user.name)
      ) {
        await db.updateUser(user.id, { name: googleUser.name });
        user.name = googleUser.name;
      }
    } else {
      // CASE B: New user registering via Google -> Create account in existing database
      const randomSecureHash = await hashPassword(
        crypto.randomBytes(32).toString("hex")
      );

      user = await db.createUser({
        name: googleUser.name || "SHOPY Client",
        email: normalizedEmail,
        passwordHash: randomSecureHash,
        role: isSuperAdminEmail ? "admin" : "user",
      });
    }

    // 7. Issue Authenticated SHOPY Session
    const session = createSession(user);

    // 8. Determine Clean Post-Authentication Redirect Destination
    let destinationPath = "/account";

    if (user.role === "admin" || isSuperAdminEmail) {
      destinationPath = "/admin";
    } else if (savedRedirect && isValidRedirectUrl(savedRedirect)) {
      destinationPath = savedRedirect;
    }

    const response = NextResponse.redirect(new URL(destinationPath, origin));

    // Attach signed session cookie
    response.cookies.set(
      SESSION_COOKIE_NAME,
      session.id,
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
