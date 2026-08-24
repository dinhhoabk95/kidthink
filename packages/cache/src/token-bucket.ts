import { createHmac } from "node:crypto";
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { getClient } from "./client.js";

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
  failOpen?: boolean;
}

const memoryLimiters = new Map<string, RateLimiterMemory>();
const redisLimiters = new Map<string, RateLimiterRedis>();

export function clearInMemoryBuckets(): void {
  memoryLimiters.clear();
  redisLimiters.clear();
}

/**
 * Normalizes identifier (email/username) and hashes via HMAC-SHA256
 * so raw email/PII never enters Valkey/Redis keys or logs.
 */
export function hashRateLimitIdentifier(
  identifier: string,
  secret = "tinimath_ratelimit_salt"
): string {
  const normalized = identifier.trim().toLowerCase();
  return createHmac("sha256", secret)
    .update(normalized)
    .digest("hex")
    .slice(0, 32);
}

function getMemoryLimiter(points: number, duration: number): RateLimiterMemory {
  const mapKey = `${points}:${duration}`;
  let limiter = memoryLimiters.get(mapKey);
  if (!limiter) {
    limiter = new RateLimiterMemory({
      points,
      duration,
    });
    memoryLimiters.set(mapKey, limiter);
  }
  return limiter;
}

function getRedisLimiter(points: number, duration: number): RateLimiterRedis {
  const mapKey = `${points}:${duration}`;
  let limiter = redisLimiters.get(mapKey);
  if (!limiter) {
    const redisClient = getClient();
    limiter = new RateLimiterRedis({
      storeClient: redisClient,
      points,
      duration,
      keyPrefix: "rl",
    });
    redisLimiters.set(mapKey, limiter);
  }
  return limiter;
}

async function consumeMemoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitCheckResult> {
  const memoryLimiter = getMemoryLimiter(limit, windowSeconds);
  try {
    const res = await memoryLimiter.consume(key, 1);
    return {
      allowed: true,
      remaining: res.remainingPoints,
      resetSeconds: Math.ceil(res.msBeforeNext / 1000),
    };
  } catch (rej: unknown) {
    if (rej && typeof rej === "object" && "remainingPoints" in rej) {
      const msBeforeNext = (rej as { msBeforeNext?: number }).msBeforeNext;
      return {
        allowed: false,
        remaining: 0,
        resetSeconds: Math.ceil((msBeforeNext || windowSeconds * 1000) / 1000),
      };
    }
    throw rej;
  }
}

/**
 * Domain Rate Limiter powered by rate-limiter-flexible (Task 83 / T5-T6).
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  failOpen = true
): Promise<RateLimitCheckResult> {
  if (process.env.NODE_ENV === "test") {
    return consumeMemoryRateLimit(key, limit, windowSeconds);
  }

  try {
    const redisLimiter = getRedisLimiter(limit, windowSeconds);
    const res = await redisLimiter.consume(key, 1);
    return {
      allowed: true,
      remaining: res.remainingPoints,
      resetSeconds: Math.ceil(res.msBeforeNext / 1000),
    };
  } catch (err: unknown) {
    if (err && typeof err === "object" && "remainingPoints" in err) {
      const msBeforeNext = (err as { msBeforeNext?: number }).msBeforeNext;
      return {
        allowed: false,
        remaining: 0,
        resetSeconds: Math.ceil((msBeforeNext || windowSeconds * 1000) / 1000),
      };
    }

    if (failOpen) {
      return {
        allowed: true,
        remaining: 1,
        resetSeconds: windowSeconds,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetSeconds: windowSeconds,
    };
  }
}
