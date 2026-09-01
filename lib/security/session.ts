import crypto from "crypto";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { UserRecord, ADMIN_EMAIL } from "../db/store";

export const SESSION_COOKIE_NAME = "shopy_session_id";

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim() || process.env.SESSION_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    console.error("[SECURITY ALERT] JWT_SECRET or SESSION_SECRET is missing in production!");
    throw new Error("FATAL: JWT_SECRET or SESSION_SECRET environment variable is required in production.");
  }
  return "shopy_dev_local_secret_key_never_in_production";
}

export interface SessionData {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: number;
  expiresAt: number;
}

// In-memory fallback registry for local dev / same-instance caching
declare global {
  var __shopy_sessions: Map<string, SessionData> | undefined;
}

const sessionStore = global.__shopy_sessions || new Map<string, SessionData>();

if (process.env.NODE_ENV !== "production") {
  global.__shopy_sessions = sessionStore;
}

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

/**
 * Creates a cryptographically signed, stateless session token.
 * This guarantees session persistence across all Vercel serverless lambdas,
 * edge workers, and background API routes without relying on instance memory.
 */
export function createSession(user: UserRecord): SessionData {
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  // Server-side strict authority: hammadnawaz276@gmail.com is unconditionally granted admin role
  const isSuperAdmin = user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
  const effectiveRole: "user" | "admin" = isSuperAdmin ? "admin" : (user.role === "admin" ? "admin" : "user");

  const sessionPayload = {
    userId: user.id,
    email: user.email.toLowerCase().trim(),
    name: user.name,
    role: effectiveRole,
    createdAt: now,
    expiresAt,
  };

  // Sign JWT token for cross-instance serverless resilience
  const secret = getJwtSecret();
  const token = jwt.sign(sessionPayload, secret, { expiresIn: `${SESSION_TTL_SECONDS}s` });

  const sessionData: SessionData = {
    id: token,
    userId: user.id,
    email: user.email.toLowerCase().trim(),
    name: user.name,
    role: effectiveRole,
    createdAt: now,
    expiresAt,
  };

  sessionStore.set(token, sessionData);
  return sessionData;
}

/**
 * Validates and decodes a session token.
 * Supports both stateless signed JWT tokens and in-memory fallback session IDs.
 */
export function getSession(sessionToken: string | undefined): SessionData | null {
  if (!sessionToken) return null;

  // 1. Try decoding as cryptographically signed JWT token
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(sessionToken, secret) as any;
    if (decoded && decoded.userId && decoded.email) {
      const now = Date.now();
      const expiresAt = decoded.expiresAt || (decoded.exp ? decoded.exp * 1000 : now + SESSION_TTL_MS);

      if (now > expiresAt) {
        return null;
      }

      const isSuperAdmin = decoded.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
      const effectiveRole: "user" | "admin" = isSuperAdmin ? "admin" : (decoded.role === "admin" ? "admin" : "user");

      return {
        id: sessionToken,
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name || "Client",
        role: effectiveRole,
        createdAt: decoded.createdAt || now,
        expiresAt,
      };
    }
  } catch {
    // If not a JWT, fall through to in-memory check
  }

  // 2. Fallback: check in-memory Map
  const inMemory = sessionStore.get(sessionToken);
  if (inMemory) {
    if (Date.now() > inMemory.expiresAt) {
      sessionStore.delete(sessionToken);
      return null;
    }
    const isSuperAdmin = inMemory.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
    if (isSuperAdmin) {
      inMemory.role = "admin";
    }
    return inMemory;
  }

  return null;
}

export function revokeSession(sessionToken: string | undefined): void {
  if (sessionToken) {
    sessionStore.delete(sessionToken);
  }
}

export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const, // Lax ensures cookies are reliably attached on redirects
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function getCurrentUser(): Promise<SessionData | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getSession(sessionToken);
}

export async function requireAdmin(): Promise<SessionData | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}

/**
 * Single-call admin authorization for API routes.
 * Calls getCurrentUser() exactly ONCE per request — eliminates the triple
 * getCurrentUser() anti-pattern that previously existed across admin routes.
 *
 * AUTHORIZATION RULES (server-side only — never trusts client-provided role):
 *
 * Production (NODE_ENV=production):
 *   → User MUST have role==="admin" in the signed JWT. No exceptions.
 *
 * Vercel preview deployments (VERCEL=1, NODE_ENV=production):
 *   → NODE_ENV is "production" on ALL Vercel deployments (preview + production),
 *     so the dev bypass below cannot activate on any Vercel environment.
 *
 * Local development (NODE_ENV=development, VERCEL is unset):
 *   → Dev bypass: any authenticated user can access admin APIs.
 *     This preserves the existing intentional development behavior.
 *
 * Guard: process.env.VERCEL is set to "1" by Vercel on ALL deployed instances
 * (preview and production alike). The double-guard (!VERCEL AND !production)
 * ensures the bypass is strictly limited to local `next dev` only.
 */
export async function getAdminUser(): Promise<SessionData | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role === "admin") return user;

  // Dev bypass: ONLY active when running locally via `next dev`.
  // Cannot activate on Vercel preview, Vercel production, or any VERCEL=1 environment.
  const isLocalDev =
    process.env.NODE_ENV !== "production" &&
    !process.env.VERCEL; // Vercel sets VERCEL=1 on all deployed environments
  if (isLocalDev) return user;

  return null;
}
