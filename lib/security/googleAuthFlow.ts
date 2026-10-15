/**
 * Shared Google sign-in completion: code exchange, user link/create,
 * session issuance. Used by BOTH the classic cookie-based callback route
 * and the Capacitor native bridge route so the two flows never diverge.
 */

import crypto from "crypto";
import { db, ADMIN_EMAIL, UserRecord } from "../db/store";
import {
  createSession,
  SessionData,
} from "./session";
import { hashPassword } from "./auth";
import {
  GoogleOAuthConfig,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  verifyGoogleIdToken,
} from "./googleAuth";
import { isValidRedirectUrl } from "./sanitize";

export interface CompletedGoogleSignIn {
  user: UserRecord;
  session: SessionData;
  destinationPath: string;
}

export async function completeGoogleSignIn(
  code: string,
  config: GoogleOAuthConfig,
  savedRedirect?: string
): Promise<CompletedGoogleSignIn> {
  // Exchange code for Google access token
  const tokenData = await exchangeGoogleCode({
    code,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
  });

  if (!tokenData.access_token) {
    throw new Error("No access_token returned from Google");
  }

  // Fetch verified Google user info
  const googleUser = await fetchGoogleUserInfo(tokenData.access_token);

  if (!googleUser.email) {
    throw new Error("No email provided by Google");
  }

  if (!googleUser.emailVerified) {
    console.warn("[GOOGLE OAUTH UNVERIFIED EMAIL]", googleUser.email);
    throw new Error("email_not_verified");
  }

  return completeGoogleUserSignIn(googleUser, savedRedirect);
}

export async function completeNativeGoogleSignIn(
  idToken: string,
  config: GoogleOAuthConfig,
  savedRedirect?: string
): Promise<CompletedGoogleSignIn> {
  return completeGoogleUserSignIn(
    await verifyGoogleIdToken(idToken, config.clientId),
    savedRedirect
  );
}

async function completeGoogleUserSignIn(
  googleUser: Awaited<ReturnType<typeof fetchGoogleUserInfo>>,
  savedRedirect?: string
): Promise<CompletedGoogleSignIn> {
  // Resolve / link in existing SHOPY user database
  const normalizedEmail = googleUser.email.toLowerCase().trim();
  const isSuperAdminEmail = normalizedEmail === ADMIN_EMAIL.toLowerCase().trim();
  let user = await db.findUserByEmail(normalizedEmail);

  if (user) {
    // Existing account found -> Link authentication cleanly
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
    // New user registering via Google -> Create account in existing database
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

  // Issue authenticated SHOPY session
  const session = createSession(user);

  // Determine clean post-authentication redirect destination
  let destinationPath = "/account";
  if (user.role === "admin" || isSuperAdminEmail) {
    destinationPath = "/admin";
  } else if (savedRedirect && isValidRedirectUrl(savedRedirect)) {
    destinationPath = savedRedirect;
  }

  return { user, session, destinationPath };
}
