import { createHmac } from "node:crypto";
import { requireEnv } from "@mindkid/config";
import { ServiceUnavailableError } from "@mindkid/errors/common";

export interface RateLimitCoordinatorPort {
  /** Có ở engine local (dev/test) để reset bộ đếm; DO trên Cloudflare không khai báo. */
  readonly clearRateLimits?: () => void;
  consumeRateLimit(input: {
    readonly key: string;
    readonly limit: number;
    readonly windowSeconds: number;
  }): Promise<RateLimitCheckResult>;
}

let rateLimitPort: RateLimitCoordinatorPort | undefined;

export function registerRateLimitPort(
  port: RateLimitCoordinatorPort | undefined
): void {
  rateLimitPort = port;
}

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

/**
 * Xoá bộ đếm rate limit của port đang nối. Chỉ engine local (dev/test) khai
 * `clearRateLimits`; `AuthCoordinatorDO` trên Cloudflare thì không, nên là no-op.
 */
export function clearRateLimitBuckets(): Promise<void> {
  rateLimitPort?.clearRateLimits?.();
  return Promise.resolve();
}

/** Giữ tên cũ cho `beforeEach` của test: đồng bộ, xoá bộ đếm của engine local. */
export function clearInMemoryBuckets(): void {
  rateLimitPort?.clearRateLimits?.();
}

/**
 * Normalizes identifier (email/username) and hashes via HMAC-SHA256
 * so raw email/PII never enters engine keys or logs.
 */
export function hashRateLimitIdentifier(
  identifier: string,
  secret?: string
): string {
  const effectiveSecret =
    secret ||
    process.env.RATE_LIMIT_HMAC_SECRET ||
    process.env.NUXT_SESSION_PASSWORD ||
    (process.env.NODE_ENV === "test"
      ? "test_ratelimit_hmac_secret_32bytes!!"
      : requireEnv("NUXT_SESSION_PASSWORD"));
  const normalized = identifier.trim().toLowerCase();
  return createHmac("sha256", effectiveSecret)
    .update(normalized)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Domain Rate Limiter (Task 83 / T5-T6): một engine duy nhất qua port — `AuthCoordinatorDO` trên Cloudflare, `AuthCoordinatorEngine` trong tiến trình ở dev/test (D15).
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  failOpen = true
): Promise<RateLimitCheckResult> {
  const port = rateLimitPort;
  if (!port) {
    // BR-RTL-12: thiếu port là lỗi cấu hình — fail closed bất kể `failOpen`.
    throw new ServiceUnavailableError(
      "Rate limit coordinator port is not registered"
    );
  }
  try {
    return await port.consumeRateLimit({
      key,
      limit,
      windowSeconds,
    });
  } catch (err) {
    if (failOpen) {
      return {
        allowed: true,
        remaining: 1,
        resetSeconds: windowSeconds,
      };
    }
    throw err;
  }
}
