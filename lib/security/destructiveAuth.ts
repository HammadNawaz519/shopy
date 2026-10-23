/**
 * Destructive-Operation Re-Authentication (Google-backed)
 *
 * Before a destructive database operation (today: full DB reset) may run,
 * the admin must complete a FRESH Google re-authentication (max_age=0,
 * prompt=select_account). On success the Google callback issues a
 * short-lived, SINGLE-USE authorization token bound to:
 *   - the exact admin session (userId + email),
 *   - the exact operation ("RESET_DB"),
 *   - a 10-minute expiry.
 *
 * The destructive endpoint (server-side only) consumes that token and
 * refuses expired, replayed, or mismatched authorizations. Nothing here
 * trusts the client: no flag, no "I already confirmed" state — only a
 * server-stored, bound, consumed token authorizes the operation.
 *
 * Storage: Upstash Redis when configured (canonical, cross-instance),
 * mirrored in memory for single-instance / local dev. Both are checked on
 * read; both are deleted on consume (single-use is enforced in both).
 */

import crypto from "crypto";
import { CACHE_VERSION, redisGet, redisSet, redisDel } from "../redis";

/** Designated destructive operations that require fresh Google re-auth. */
export type DestructiveOperation = "RESET_DB";

export const DESTRUCTIVE_OPERATIONS: DestructiveOperation[] = ["RESET_DB"];

/** Intent lifetime & issued-auth lifetime (seconds). */
export const DESTRUCTIVE_INTENT_TTL_S = 10 * 60;
export const DESTRUCTIVE_AUTH_TTL_S = 10 * 60;

export interface DestructiveIntent {
  intentId: string;
  operation: DestructiveOperation;
  adminUserId: string;
  adminEmail: string;
  /** Nonce sent to Google; returned inside the ID token (native flow). */
  googleNonce: string;
  createdAt: number;
  expiresAt: number;
}

export interface DestructiveAuth {
  token: string;
  operation: DestructiveOperation;
  adminUserId: string;
  adminEmail: string;
  intentId: string;
  createdAt: number;
  expiresAt: number;
}

const intentKey = (id: string) => `${CACHE_VERSION}:destructive_intent:${id}`;
const authKey = (token: string) => `${CACHE_VERSION}:destructive_auth:${token}`;
/** Latest issued authorization per admin (so the UI can surface "verified"). */
const authPtrKey = (adminUserId: string) => `${CACHE_VERSION}:destructive_auth_ptr:${adminUserId}`;

// ---------------------------------------------------------------------------
// In-memory mirror (single instance / local dev / Redis outage fail-safe)
// ---------------------------------------------------------------------------
declare global {
  var __shopy_destructive_intents: Map<string, DestructiveIntent> | undefined;
  var __shopy_destructive_auths: Map<string, DestructiveAuth> | undefined;
  var __shopy_destructive_ptrs: Map<string, DestructiveAuth> | undefined;
}

const memoryIntents = global.__shopy_destructive_intents || new Map<string, DestructiveIntent>();
const memoryAuths = global.__shopy_destructive_auths || new Map<string, DestructiveAuth>();
const memoryPtrs = global.__shopy_destructive_ptrs || new Map<string, DestructiveAuth>();

if (typeof global !== "undefined") {
  global.__shopy_destructive_intents = memoryIntents;
  global.__shopy_destructive_auths = memoryAuths;
  global.__shopy_destructive_ptrs = memoryPtrs;
}

// Periodically purge expired in-memory records (bounded memory)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memoryIntents.entries()) if (now > v.expiresAt) memoryIntents.delete(k);
    for (const [k, v] of memoryAuths.entries()) if (now > v.expiresAt) memoryAuths.delete(k);
    for (const [k, v] of memoryPtrs.entries()) if (now > v.expiresAt) memoryPtrs.delete(k);
  }, 5 * 60 * 1000);
}

function isExpired(record: { expiresAt: number }): boolean {
  return Date.now() > record.expiresAt;
}

// ---------------------------------------------------------------------------
// 1. INTENT — created by the admin's "Verify with Google" step
// ---------------------------------------------------------------------------

/**
 * Creates a fresh re-auth intent for the logged-in admin. Latest intent per
 * admin wins; the state cookie carries the intentId so the Google callback
 * can bind the result to exactly this request.
 */
export async function createDestructiveIntent(admin: {
  userId: string;
  email: string;
}, operation: DestructiveOperation = "RESET_DB"): Promise<DestructiveIntent> {
  const now = Date.now();
  const intent: DestructiveIntent = {
    intentId: crypto.randomBytes(16).toString("hex"),
    operation,
    adminUserId: admin.userId,
    adminEmail: admin.email.toLowerCase().trim(),
    googleNonce: crypto.randomBytes(16).toString("hex"),
    createdAt: now,
    expiresAt: now + DESTRUCTIVE_INTENT_TTL_S * 1000,
  };

  await redisSet(intentKey(intent.intentId), intent, DESTRUCTIVE_INTENT_TTL_S);
  memoryIntents.set(intent.intentId, intent);
  return intent;
}

/** Validates a stored intent. Returns null when unknown, expired, or stale. */
export async function getDestructiveIntent(
  intentId: string
): Promise<DestructiveIntent | null> {
  if (!intentId) return null;
  const fromRedis = await redisGet<DestructiveIntent>(intentKey(intentId));
  const record = fromRedis ?? memoryIntents.get(intentId) ?? null;
  if (!record || isExpired(record)) {
    memoryIntents.delete(intentId);
    await redisDel(intentKey(intentId));
    return null;
  }
  return record;
}

/** Consumes (deletes) an intent — single use. */
export async function consumeDestructiveIntent(intentId: string): Promise<void> {
  memoryIntents.delete(intentId);
  await redisDel(intentKey(intentId));
}

// ---------------------------------------------------------------------------
// 2. AUTHORIZATION — issued ONLY by the verified Google callback
// ---------------------------------------------------------------------------

/**
 * Issues a short-lived single-use authorization from a verified intent.
 * The token is bound to the admin's identity and the exact operation.
 */
export async function issueDestructiveAuth(
  intent: DestructiveIntent
): Promise<DestructiveAuth> {
  const now = Date.now();
  const auth: DestructiveAuth = {
    token: crypto.randomBytes(24).toString("hex"),
    operation: intent.operation,
    adminUserId: intent.adminUserId,
    adminEmail: intent.adminEmail,
    intentId: intent.intentId,
    createdAt: now,
    expiresAt: now + DESTRUCTIVE_AUTH_TTL_S * 1000,
  };

  await redisSet(authKey(auth.token), auth, DESTRUCTIVE_AUTH_TTL_S);
  // Latest pointer per admin so the UI can show "Google verified — confirm".
  await redisSet(authPtrKey(auth.adminUserId), auth, DESTRUCTIVE_AUTH_TTL_S);
  memoryAuths.set(auth.token, auth);
  memoryPtrs.set(auth.adminUserId, auth);

  // The intent that produced this authorization is now consumed (single use).
  await consumeDestructiveIntent(intent.intentId);
  return auth;
}

/**
 * The admin's currently pending authorization (post Google re-auth,
 * pre-consumption). Only readable by an authenticated admin session.
 */
export async function getPendingDestructiveAuth(
  adminUserId: string
): Promise<DestructiveAuth | null> {
  if (!adminUserId) return null;
  const ptr = await redisGet<DestructiveAuth>(authPtrKey(adminUserId));
  const record = ptr ?? memoryPtrs.get(adminUserId) ?? null;
  if (!record) return null;
  if (isExpired(record)) {
    memoryPtrs.delete(adminUserId);
    await redisDel(authPtrKey(adminUserId));
    return null;
  }
  // Confirm the auth record still exists (not yet consumed elsewhere).
  const auth = (await redisGet<DestructiveAuth>(authKey(record.token))) ?? memoryAuths.get(record.token);
  if (!auth || isExpired(auth)) {
    memoryPtrs.delete(adminUserId);
    await redisDel(authPtrKey(adminUserId));
    return null;
  }
  return auth;
}

// ---------------------------------------------------------------------------
// 3. CONSUMPTION — the destructive endpoint's server-side gate
// ---------------------------------------------------------------------------

export type ConsumeAuthResult =
  | { ok: true; auth: DestructiveAuth }
  | { ok: false; reason: "missing" | "expired" | "mismatch" | "replayed" };

/**
 * Verifies and CONSUMES a destructive authorization for the given admin
 * session + operation. Called server-side by the destructive endpoint:
 *
 *   - missing:  no such token was ever issued
 *   - expired:  token older than its lifetime
 *   - mismatch: token bound to a different admin / operation
 *   - replayed: token was already consumed (single use)
 */
export async function consumeDestructiveAuth(
  token: string | undefined,
  admin: { userId: string; email: string },
  operation: DestructiveOperation
): Promise<ConsumeAuthResult> {
  if (!token || !/^[a-f0-9]{32,64}$/.test(token)) {
    return { ok: false, reason: "missing" };
  }

  // Resolve from Redis first, then the in-memory mirror.
  let record = (await redisGet<DestructiveAuth>(authKey(token))) ?? memoryAuths.get(token);
  if (!record) {
    // Distinguish "expired" from "never issued/replayed": the pointer or the
    // memory mirror may still know about it.
    const ptr = (await redisGet<DestructiveAuth>(authPtrKey(admin.userId))) ?? memoryPtrs.get(admin.userId);
    if (ptr && ptr.token === token && isExpired(ptr)) return { ok: false, reason: "expired" };
    if (ptr && ptr.token === token) return { ok: false, reason: "replayed" };
    return { ok: false, reason: "missing" };
  }

  if (isExpired(record)) {
    await purgeAuth(record.token, admin.userId);
    return { ok: false, reason: "expired" };
  }

  // Identity + operation binding — the token is only valid for the exact
  // admin session it was issued to, and only for the exact operation.
  if (
    record.adminUserId !== admin.userId ||
    record.adminEmail !== admin.email.toLowerCase().trim() ||
    record.operation !== operation
  ) {
    return { ok: false, reason: "mismatch" };
  }

  // Single use: delete everywhere before the operation runs.
  await purgeAuth(record.token, admin.userId);
  return { ok: true, auth: record };
}

async function purgeAuth(token: string, adminUserId: string): Promise<void> {
  memoryAuths.delete(token);
  memoryPtrs.delete(adminUserId);
  await redisDel(authKey(token), authPtrKey(adminUserId));
}
