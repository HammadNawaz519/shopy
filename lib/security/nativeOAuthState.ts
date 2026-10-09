/**
 * One-time handoff bridge for NATIVE (Capacitor) Google sign-in.
 *
 * The in-app browser tab and the app WebView have SEPARATE cookie jars, so a
 * session cookie set during the tab sign-in never reaches the app. Instead:
 *
 *   1. The app generates a random handoff id and includes it in the signed
 *      native OAuth state (URL-carried, HMAC-signed, 10-min expiry).
 *   2. When the sign-in tab reaches /api/auth/callback/google the server
 *      completes the Google exchange and stores the issued session JWT under
 *      that handoff id (one-time, 5-min TTL).
 *   3. The app WebView polls /api/auth/google/handoff?handoffId=... until the
 *      record exists, then the server sets the session cookie in the APP's own
 *      cookie jar and marks the record consumed.
 *
 * Storage: Upstash Redis when configured (server-safe across instances),
 * in-memory Map otherwise (local dev).
 */

import { getRedisClient, buildCacheKey } from "../redis";

const HANDOFF_TTL_SECONDS = 5 * 60;

export interface NativeHandoffRecord {
  sessionJwt: string;
  destinationPath: string;
}

declare global {
  var __shopy_native_oauth_handoffs: Map<string, NativeHandoffRecord> | undefined;
}
const memStore =
  global.__shopy_native_oauth_handoffs || new Map<string, NativeHandoffRecord>();
global.__shopy_native_oauth_handoffs = memStore;

export function rememberNativeHandoff(
  handoffId: string,
  record: NativeHandoffRecord
): void {
  memStore.set(handoffId, record);
  getRedisClient()
    ?.set(
      buildCacheKey("oauth-native-handoff", handoffId),
      JSON.stringify(record),
      { ex: HANDOFF_TTL_SECONDS }
    )
    .catch(() => {});
}

/**
 * Atomically reads AND deletes the handoff record. Returns null when the id
 * is unknown, already consumed, expired, or storage is unavailable.
 */
export async function consumeNativeHandoff(
  handoffId: string
): Promise<NativeHandoffRecord | null> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const key = buildCacheKey("oauth-native-handoff", handoffId);
      const raw = await redis.get(key);
      if (raw === null || typeof raw !== "string") return null;
      await redis.del(key).catch(() => {});
      const parsed = JSON.parse(raw) as NativeHandoffRecord;
      if (typeof parsed?.sessionJwt === "string" && typeof parsed?.destinationPath === "string") {
        return parsed;
      }
      return null;
    } catch {
      // Redis hiccup: fall through to in-memory (single-instance safe).
    }
  }

  const record = memStore.get(handoffId);
  if (record) memStore.delete(handoffId);
  return record ?? null;
}

/**
 * Non-consuming check for the poll endpoint: has the sign-in finished yet?
 */
export async function peekNativeHandoff(handoffId: string): Promise<boolean> {
  const redis = getRedisClient();
  if (redis) {
    try {
      const val = await redis.get(buildCacheKey("oauth-native-handoff", handoffId));
      return val !== null;
    } catch {
      // fall through
    }
  }
  return memStore.has(handoffId);
}
