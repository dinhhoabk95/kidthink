export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * In-memory token bucket store for local testing and fallback.
 */
const inMemoryBucket = new Map<string, { count: number; expiresAt: number }>();

export function clearInMemoryBuckets(): void {
  inMemoryBucket.clear();
}

/**
 * Atomic token bucket rate limiter (Task 7 / BR-RTL-01).
 * Supports in-memory atomic counting for tests and fallback.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitCheckResult> {
  await Promise.resolve();
  const now = Date.now();
  const existing = inMemoryBucket.get(key);

  if (!existing || now >= existing.expiresAt) {
    const expiresAt = now + windowSeconds * 1000;
    inMemoryBucket.set(key, { count: 1, expiresAt });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetSeconds: windowSeconds,
    };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  const resetSeconds = Math.ceil((existing.expiresAt - now) / 1000);

  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
    };
  }

  return {
    allowed: true,
    remaining,
    resetSeconds,
  };
}
