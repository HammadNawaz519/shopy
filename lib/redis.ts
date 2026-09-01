import { Redis } from "@upstash/redis";
import crypto from "crypto";

/**
 * SHOPY Production Upstash Redis Architecture
 *
 * ARCHITECTURAL PRINCIPLES:
 * 1. SUPABASE POSTGRESQL IS THE SINGLE SOURCE OF TRUTH.
 *    Permanent business records (orders, payments, users, inventory, reviews, settings)
 *    remain strictly in PostgreSQL.
 * 2. REDIS IS ONLY AN OPTIMIZATION & COORDINATION LAYER.
 *    Used exclusively for:
 *      - Versioned caching (shopy:v1:*)
 *      - Distributed rate limiting
 *      - Request-level checkout idempotency
 *      - Short-lived distributed coordination locks
 *      - Cache stampede single-flight mutex protection
 * 3. ZERO-THROW FAIL-SAFE DEGRADATION:
 *    If Redis is unavailable, disconnected, or throttled, all operations fail safely
 *    to Supabase PostgreSQL without crashing, throwing 500 errors, or corrupting state.
 * 4. SECURE SERVER-ONLY USAGE:
 *    Never exposed to client bundles (no NEXT_PUBLIC_ prefixes).
 *    Never logs customer credentials, OTPs, or API secrets.
 */

export const CACHE_VERSION = "shopy:v3";

export const CACHE_TTL = {
  PRODUCTS_LIST: 600,      // 10 minutes
  PRODUCT_DETAIL: 900,     // 15 minutes
  CATEGORIES: 1800,        // 30 minutes
  STORE_SETTINGS: 3600,    // 1 hour
  HOMEPAGE_CONFIG: 1800,   // 30 minutes
  ORDER_IDEMPOTENCY: 86400 // 24 hours
} as const;

let redisInstance: Redis | null = null;
let redisAvailable: boolean | null = null;

/**
 * Generates a standard versioned cache key.
 */
export function buildCacheKey(namespace: string, identifier?: string): string {
  if (!identifier) {
    return `${CACHE_VERSION}:${namespace}`;
  }
  return `${CACHE_VERSION}:${namespace}:${identifier}`;
}

/**
 * Retrieves or initializes the singleton Upstash Redis client.
 * Returns null if credentials are not configured.
 */
export function getRedisClient(): Redis | null {
  if (redisInstance) {
    return redisInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    if (redisAvailable !== false) {
      console.warn("[REDIS NOTICE] Upstash Redis credentials not configured. Running in PostgreSQL authoritative mode.");
      redisAvailable = false;
    }
    return null;
  }

  try {
    redisInstance = new Redis({
      url,
      token,
      retry: {
        retries: 2,
        backoff: (retryCount) => Math.exp(retryCount) * 50,
      },
    });
    redisAvailable = true;
    return redisInstance;
  } catch (err: any) {
    console.error("[REDIS INIT ERROR] Failed to instantiate Upstash Redis client:", err?.message || err);
    redisAvailable = false;
    return null;
  }
}

/**
 * Safely fetches a value from Redis cache.
 * Returns null on cache miss, unconfigured Redis, or network failure.
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const data = await redis.get<T>(key);
    return data ?? null;
  } catch (err: any) {
    console.warn(`[REDIS GET ERROR] Key "${key}":`, err?.message || err);
    return null;
  }
}

/**
 * Safely writes a JSON-serializable value to Redis with optional TTL in seconds.
 * Returns true if successful, false otherwise.
 */
export async function redisSet(
  key: string,
  value: any,
  ttlSeconds?: number
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch (err: any) {
    console.warn(`[REDIS SET ERROR] Key "${key}":`, err?.message || err);
    return false;
  }
}

/**
 * Safely deletes one or more keys from Redis.
 */
export async function redisDel(...keys: string[]): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis || keys.length === 0) return false;

  try {
    const validKeys = keys.filter(Boolean);
    if (validKeys.length === 0) return false;
    await redis.del(...validKeys);
    return true;
  } catch (err: any) {
    console.warn(`[REDIS DEL ERROR] Keys [${keys.join(", ")}]:`, err?.message || err);
    return false;
  }
}

/**
 * Safely invalidates all Redis keys matching a pattern (e.g. "shopy:v1:products:*").
 * Uses SCAN in batches to avoid blocking Redis.
 */
export async function redisDelPattern(pattern: string): Promise<number> {
  const redis = getRedisClient();
  if (!redis || !pattern) return 0;

  try {
    let cursor = 0;
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: pattern,
        count: 50,
      });
      cursor = typeof nextCursor === "string" ? parseInt(nextCursor, 10) : nextCursor;

      if (Array.isArray(keys) && keys.length > 0) {
        await redis.del(...keys);
        deletedCount += keys.length;
      }
    } while (cursor !== 0);

    return deletedCount;
  } catch (err: any) {
    console.warn(`[REDIS DEL PATTERN ERROR] Pattern "${pattern}":`, err?.message || err);
    return 0;
  }
}

/**
 * Distributed Lock with Verified Ownership Release
 *
 * Implements atomic SET NX EX with cryptographically unique token.
 * Prevents race conditions and guarantees locks are only released by their original owner.
 * If Redis is unavailable, returns acquired: true to prevent blocking legitimate checkout,
 * relying on PostgreSQL ACID transaction constraints.
 */
export async function acquireDistributedLock(
  lockKey: string,
  ttlSeconds: number = 10
): Promise<{ acquired: boolean; release: () => Promise<void> }> {
  const redis = getRedisClient();
  const noopRelease = async () => {};

  if (!redis) {
    // If Redis is unavailable, allow execution and rely on PostgreSQL ACID
    return { acquired: true, release: noopRelease };
  }

  const lockValue = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  const key = `lock:${lockKey}`;

  try {
    const result = await redis.set(key, lockValue, {
      nx: true,
      ex: ttlSeconds,
    });

    if (result === "OK") {
      return {
        acquired: true,
        release: async () => {
          try {
            // Verified ownership release: Only release if lock value matches token
            const currentValue = await redis.get<string>(key);
            if (currentValue === lockValue) {
              await redis.del(key);
            }
          } catch {
            // Ignore release errors; TTL will expire the lock safely
          }
        },
      };
    }

    return { acquired: false, release: noopRelease };
  } catch (err: any) {
    console.warn(`[REDIS LOCK ERROR] Key "${key}":`, err?.message || err);
    // Graceful degradation: allow PostgreSQL to handle transaction
    return { acquired: true, release: noopRelease };
  }
}

/**
 * Cache Stampede Protection (Mutex / Single Flight Pattern)
 *
 * When a high-traffic cache entry expires, this ensures only one request queries PostgreSQL
 * to re-populate the cache, while concurrent requests wait briefly and read the freshly cached value.
 * If Redis fails, falls back immediately to calling the fetcher directly.
 */
export async function fetchWithStampedeProtection<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // 1. Try reading from cache
  const cached = await redisGet<T>(cacheKey);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  // 2. Cache Miss: Acquire short mutex lock for single-flight database fetch
  const lockKey = `stampede:${cacheKey}`;
  const lock = await acquireDistributedLock(lockKey, 5);

  if (lock.acquired) {
    try {
      // Re-check cache in case another worker just finished while acquiring lock
      const doubleCheck = await redisGet<T>(cacheKey);
      if (doubleCheck !== null && doubleCheck !== undefined) {
        return doubleCheck;
      }

      // Authoritative PostgreSQL query
      const freshData = await fetcher();
      if (freshData !== null && freshData !== undefined) {
        await redisSet(cacheKey, freshData, ttlSeconds);
      }
      return freshData;
    } finally {
      await lock.release();
    }
  } else {
    // Another worker is populating the cache; wait briefly and check cache again
    await new Promise((resolve) => setTimeout(resolve, 80));
    const awaitedCache = await redisGet<T>(cacheKey);
    if (awaitedCache !== null && awaitedCache !== undefined) {
      return awaitedCache;
    }
    // Fallback: direct database query if cache population took longer than wait
    return fetcher();
  }
}
