import crypto from "crypto";
import { cookies } from "next/headers";
import { db, UserRecord } from "../db/store";

export const SESSION_COOKIE_NAME = "shopy_session_id";

export interface SessionData {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: number;
  expiresAt: number;
}

// Global server-side session registry
declare global {
  var __shopy_sessions: Map<string, SessionData> | undefined;
}

const sessionStore = global.__shopy_sessions || new Map<string, SessionData>();

if (process.env.NODE_ENV !== "production") {
  global.__shopy_sessions = sessionStore;
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createSession(user: UserRecord): SessionData {
  const sessionId = `sess_${crypto.randomBytes(32).toString("hex")}`;
  const now = Date.now();

  const session: SessionData = {
    id: sessionId,
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };

  sessionStore.set(sessionId, session);
  return session;
}

export function getSession(sessionId: string | undefined): SessionData | null {
  if (!sessionId) return null;
  const session = sessionStore.get(sessionId);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessionStore.delete(sessionId);
    return null;
  }

  return session;
}

export function revokeSession(sessionId: string | undefined): void {
  if (sessionId) {
    sessionStore.delete(sessionId);
  }
}

export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  };
}

export async function getCurrentUser(): Promise<SessionData | null> {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getSession(sessionId);
}
