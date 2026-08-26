import { Redis } from "@upstash/redis";

/**
 * SHOPY Production Upstash Redis Layer
 *
 * ARCHITECTURAL PRINCIPLE:
 * Supabase PostgreSQL remains the SINGLE SOURCE OF TRUTH for all permanent data.
 * Redis operates strictly as an optimization, security, coordination, and caching layer.
 * All Redis operations are wrapped in safe error handlers — if Redis is down or unreachable,
 * the entire platform seamlessly degrades to PostgreSQL with zero user-facing errors.
 */

let redisInstance: Redis | null = null;
let redisAvailable: boolean | null = null;

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
      console.warn("[REDIS NOTICE] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured. Running in database-only mode.");
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
 * Safely invalidates all Redis keys matching a pattern (e.g. "shopy:products:*").
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
 * Distributed Lock Acquisition (Idempotency & Concurrency Guard)
 *
 * Attempts to set key with NX (only if not exists) and EX (auto expiration).
 * If acquired, returns { acquired: true, release: fn }.
 * If lock is held by another concurrent request, returns { acquired: false, release: noop }.
 * If Redis is down, gracefully allows execution ({ acquired: true, release: noop })
 * because PostgreSQL transactions enforce final consistency.
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

  const lockValue = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
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
            // Only release if lock value matches (safe release)
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
