import { getRedisClient } from "@/lib/redis";

export interface RateLimitOptions {
  limit: number;      // Maximum requests allowed in window
  windowMs: number;   // Window size in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// Local in-memory sliding window fallback for single-instance or dev mode
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const localRateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale in-memory records periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of localRateLimitStore.entries()) {
      if (now > record.resetTime) {
        localRateLimitStore.delete(key);
      }
    }
  }, 60000);
}

/**
 * Universal Rate Limiter
 * Checks rate limit via Upstash Redis distributed store first;
 * automatically falls back to in-memory sliding window on Redis connection failure.
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 100, windowMs: 60000 }
): Promise<RateLimitResult> {
  const windowSec = Math.max(1, Math.ceil(options.windowMs / 1000));
  const redis = getRedisClient();

  if (redis) {
    try {
      const key = `shopy:v1:ratelimit:${identifier}`;
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, windowSec);
      pipeline.ttl(key);

      const results = await pipeline.exec();
      const count = (results[0] as number) || 1;
      const ttl = (results[2] as number) > 0 ? (results[2] as number) : windowSec;

      return {
        success: count <= options.limit,
        limit: options.limit,
        remaining: Math.max(0, options.limit - count),
        reset: Math.ceil(Date.now() / 1000) + ttl,
      };
    } catch (err: any) {
      console.warn(`[RATE LIMIT REDIS FALLBACK] Key "${identifier}":`, err?.message || err);
      // Fallback to local memory limiter on transient Redis error
    }
  }

  // In-memory sliding window fallback
  const now = Date.now();
  const record = localRateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    localRateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: Math.ceil((now + options.windowMs) / 1000),
    };
  }

  if (record.count >= options.limit) {
    return {
      success: false,
      limit: options.limit,
      remaining: 0,
      reset: Math.ceil(record.resetTime / 1000),
    };
  }

  record.count += 1;
  return {
    success: true,
    limit: options.limit,
    remaining: options.limit - record.count,
    reset: Math.ceil(record.resetTime / 1000),
  };
}

/**
 * Extracts client IP from incoming request headers safely.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

// ============================================================================
// PRESET ROUTE-SPECIFIC RATE LIMIT GUARDS
// ============================================================================

/**
 * Login Rate Limit: 10 attempts per 15 minutes per IP
 */
export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(`login_${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
}

/**
 * Registration Rate Limit: 5 accounts per 30 minutes per IP
 */
export async function checkRegisterRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(`register_${ip}`, { limit: 5, windowMs: 30 * 60 * 1000 });
}

/**
 * Password Reset / Forgot Password Rate Limit: 3 requests per 15 minutes per IP
 */
export async function checkPasswordResetRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(`password_reset_${ip}`, { limit: 3, windowMs: 15 * 60 * 1000 });
}

/**
 * Order Creation / Checkout Rate Limit: 10 checkout attempts per 15 minutes per IP/User
 */
export async function checkOrderRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(`order_${identifier}`, { limit: 10, windowMs: 15 * 60 * 1000 });
}

/**
 * Review Submission Rate Limit: 5 reviews per hour per user/IP
 */
export async function checkReviewRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimit(`review_${identifier}`, { limit: 5, windowMs: 60 * 60 * 1000 });
}

/**
 * Contact Form Rate Limit: 5 inquiries per 30 minutes per IP
 */
export async function checkContactRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(`contact_${ip}`, { limit: 5, windowMs: 30 * 60 * 1000 });
}

/**
 * Admin Mutation Rate Limit: 60 operations per minute per admin session
 */
export async function checkAdminMutationRateLimit(adminId: string): Promise<RateLimitResult> {
  return checkRateLimit(`admin_mutation_${adminId}`, { limit: 60, windowMs: 60 * 1000 });
}
