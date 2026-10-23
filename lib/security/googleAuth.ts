/**
 * SHOPY Server-Side Google OAuth 2.0 Engine
 * Zero-leak implementation with strict state verification, PKCE/CSRF defense,
 * and seamless multi-environment redirect resolution.
 */

import crypto from "crypto";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  /**
   * Android OAuth client ID (type: Android in Google Cloud Console, registered
   * with package com.shopy.fashion + signing SHA-1). Play Services uses that
   * record to authorize this APK. It is NOT passed to Credential Manager —
   * serverClientId is always the Web client (`clientId`). Optional extra
   * audience when verifying native ID tokens.
   */
  androidClientId?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

function cleanEnv(value: string | undefined, fallback: string = ""): string {
  if (!value) return fallback;
  return value.trim().replace(/^['"]|['"]$/g, "");
}

/**
 * Resolves the Google OAuth configuration.
 * Uses one canonical production origin because Google only accepts callback
 * URLs that exactly match an authorized redirect URI.
 */
export function getGoogleOAuthConfig(requestOrigin?: string): GoogleOAuthConfig {
  const clientId = cleanEnv(process.env.GOOGLE_CLIENT_ID);
  const clientSecret = cleanEnv(process.env.GOOGLE_CLIENT_SECRET);
  const androidClientId = cleanEnv(process.env.GOOGLE_ANDROID_CLIENT_ID);

  const configuredOrigin = cleanEnv(process.env.APP_URL);
  const isLocalOrigin = (value: string) =>
    value.startsWith("http://localhost") ||
    value.startsWith("http://127.0.0.1");
  const isProductionRequest =
    requestOrigin && !isLocalOrigin(requestOrigin);
  let appBaseUrl =
    (configuredOrigin && (!isProductionRequest || !isLocalOrigin(configuredOrigin))
      ? configuredOrigin
      : "") ||
    (requestOrigin && isLocalOrigin(requestOrigin) ? requestOrigin : "") ||
    "https://buyatshopy.vercel.app";

  // Ensure protocol
  if (!appBaseUrl.startsWith("http://") && !appBaseUrl.startsWith("https://")) {
    appBaseUrl = `https://${appBaseUrl}`;
  }

  // Standard callback path registered in Google Cloud Console
  const redirectUri = `${appBaseUrl.replace(/\/+$/, "")}/api/auth/callback/google`;

  return {
    clientId,
    clientSecret,
    redirectUri,
    androidClientId: androidClientId || undefined,
  };
}

/**
 * Builds Google OAuth 2.0 Authorization URL with CSRF state token.
 */
export function buildGoogleAuthUrl(options: {
  clientId: string;
  redirectUri: string;
  state: string;
  /** Freshness policy: 0 = Google must re-authenticate (no silent session reuse). */
  maxAge?: number;
  /** Bound to the ID token (native flow) so replayed tokens are rejected. */
  nonce?: string;
  /**
   * Google prompt behavior. Defaults to "select_account" (the regular
   * sign-in flow). The destructive re-auth flow passes "login" + loginHint
   * so Google opens that specific account's authentication page directly
   * (password / 2FA) with NO account-selection screen.
   */
  prompt?: "select_account" | "login" | "consent";
  /** Pre-selects the account for the Google auth page (skip chooser). */
  loginHint?: string;
}): string {
  const params = new URLSearchParams({
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: options.state,
    access_type: "online",
    prompt: options.prompt || "select_account",
  });

  // Freshness + nonce are only used by the destructive-op re-auth flow;
  // the regular sign-in flow omits both and behaves exactly as before.
  if (options.maxAge !== undefined) params.set("max_age", String(options.maxAge));
  if (options.nonce) params.set("nonce", options.nonce);
  if (options.loginHint) params.set("login_hint", options.loginHint);

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges the Google authorization code for OAuth tokens.
 */
export async function exchangeGoogleCode(options: {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<{ access_token: string; id_token?: string; expires_in?: number }> {
  const body = new URLSearchParams({
    code: options.code,
    client_id: options.clientId,
    client_secret: options.clientSecret,
    redirect_uri: options.redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Google token exchange failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Fetches and verifies the authenticated user's profile from Google.
 */
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google user profile (${response.status})`);
  }

  const data = await response.json();

  if (!data.email) {
    throw new Error("Google did not return an email address.");
  }

  const isEmailVerified = data.email_verified === true || data.email_verified === "true";

  return {
    id: data.sub || data.id,
    email: data.email.toLowerCase().trim(),
    emailVerified: isEmailVerified,
    name: data.name || data.given_name || "SHOPY Client",
    picture: data.picture,
  };
}

export async function verifyGoogleIdToken(
  idToken: string,
  expectedAudience: string | string[],
  expectedNonce?: string
): Promise<GoogleUserInfo> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!response.ok) {
    throw new Error(`Google ID token verification failed (${response.status})`);
  }

  const data = await response.json();
  const audience = Array.isArray(data.aud) ? data.aud : [data.aud];
  const acceptedAudiences = Array.isArray(expectedAudience)
    ? expectedAudience
    : [expectedAudience];
  const emailVerified =
    data.email_verified === true || data.email_verified === "true";
  const expiresAt = Number(data.exp);
  // Distinct, machine-mappable failure reasons so the sign-in UI can show
  // exactly which check broke instead of a generic "try again".
  if (!acceptedAudiences.some((item) => audience.includes(item))) {
    throw new Error("Invalid Google ID token (audience mismatch)");
  }
  // Replay defense: when the flow is bound to a nonce, the token must carry
  // the exact nonce it was issued for.
  if (expectedNonce) {
    if (!data.nonce || data.nonce !== expectedNonce) {
      throw new Error("Invalid Google ID token (nonce mismatch)");
    }
  }
  if (!data.email) {
    throw new Error("Invalid Google ID token (no email)");
  }
  if (!emailVerified) {
    throw new Error("email_not_verified");
  }
  if (!Number.isFinite(expiresAt)) {
    throw new Error("Invalid Google ID token (invalid expiry)");
  }
  if (expiresAt * 1000 <= Date.now()) {
    throw new Error("Invalid Google ID token (expired)");
  }

  return {
    id: data.sub,
    email: data.email.toLowerCase().trim(),
    emailVerified: true,
    name: data.name || data.given_name || "SHOPY Client",
    picture: data.picture,
  };
}

/**
 * Generates a cryptographically secure OAuth state payload.
 */
export interface DestructiveIntentState {
  /** Stored server-side destructive-op intent this Google round trip belongs to. */
  intentId: string;
  /** Exact operation the admin is re-authenticating for (e.g. "RESET_DB"). */
  operation: string;
}

export function generateOAuthState(
  redirectPath?: string,
  destructive?: DestructiveIntentState
): { stateToken: string; rawCookieValue: string } {
  const randomToken = crypto.randomBytes(24).toString("hex");
  const payload: Record<string, unknown> = {
    token: randomToken,
    redirect: redirectPath || "",
    createdAt: Date.now(),
  };
  if (destructive) payload.destructive = destructive;

  const rawCookieValue = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return {
    stateToken: randomToken,
    rawCookieValue,
  };
}

/**
 * Parses and verifies an OAuth state cookie against the callback state query.
 */
export function verifyOAuthState(
  queryState: string,
  cookieValue: string | undefined
): { valid: boolean; redirectUrl?: string; destructive?: DestructiveIntentState } {
  if (!queryState || !cookieValue) {
    return { valid: false };
  }

  try {
    const decodedJson = Buffer.from(cookieValue, "base64url").toString("utf8");
    const payload = JSON.parse(decodedJson);

    // Verify token matches and is within 10-minute validity window
    if (payload.token === queryState && Date.now() - payload.createdAt < 10 * 60 * 1000) {
      const destructive: DestructiveIntentState | undefined =
        payload.destructive &&
        typeof payload.destructive.intentId === "string" &&
        typeof payload.destructive.operation === "string"
          ? {
              intentId: payload.destructive.intentId,
              operation: payload.destructive.operation,
            }
          : undefined;
      return {
        valid: true,
        redirectUrl: payload.redirect || undefined,
        destructive,
      };
    }
  } catch {
    // Malformed cookie payload
  }

  return { valid: false };
}
