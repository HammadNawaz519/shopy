export interface RateLimitOptions {
  limit: number;      // Maximum requests allowed in window
  windowMs: number;   // Window size in milliseconds
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// Local in-memory sliding window fallback for single-instance or dev mode
const localRateLimitStore = new Map<string, RateLimitRecord>();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of localRateLimitStore.entries()) {
    if (now > record.resetTime) {
      localRateLimitStore.delete(key);
    }
  }
}, 60000);

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60000 }
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // If distributed Upstash Redis credentials are provided, use distributed rate limiting
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const windowSec = Math.ceil(options.windowMs / 1000);
      const key = `ratelimit:${identifier}`;
      
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, windowSec],
          ["TTL", key],
        ]),
      });

      if (res.ok) {
        const results = await res.json();
        const count = results[0]?.result || 1;
        const ttl = results[2]?.result || windowSec;

        return {
          success: count <= options.limit,
          limit: options.limit,
          remaining: Math.max(0, options.limit - count),
          reset: Math.ceil(Date.now() / 1000) + ttl,
        };
      }
    } catch {
      // Fallback to local memory limiter on transient distributed store connection failure
    }
  }

  // Fallback to local sliding window store
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
