import { ServiceUnavailableError } from "@mindkid/errors/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkRateLimit,
  clearInMemoryBuckets,
  hashRateLimitIdentifier,
  registerCloudflareRateLimitPort,
} from "#src/token-bucket";

process.env.VALKEY_URL = "redis://localhost:6380";

describe("Token Bucket Rate Limiter (Task 7 / BR-RTL-01)", () => {
  beforeEach(() => {
    clearInMemoryBuckets();
  });

  it("allows requests under the limit and computes remaining count", async () => {
    const res1 = await checkRateLimit("ip_127.0.0.1", 5, 60);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(4);

    const res2 = await checkRateLimit("ip_127.0.0.1", 5, 60);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(3);
  });

  it("concurrency test: 100 parallel requests with limit 10 allows exactly 10 and rejects 90", async () => {
    const key = "ip_concurrent_test";
    const promises = Array.from({ length: 100 }, () =>
      checkRateLimit(key, 10, 60)
    );

    const results = await Promise.all(promises);
    const allowedCount = results.filter((r) => r.allowed).length;
    const rejectedCount = results.filter((r) => !r.allowed).length;

    expect(allowedCount).toBe(10);
    expect(rejectedCount).toBe(90);
  });

  it("resets limit after window expires", async () => {
    const key = "ip_window_reset";
    // windowSeconds = 1
    const res1 = await checkRateLimit(key, 1, 1);
    expect(res1.allowed).toBe(true);

    const res2 = await checkRateLimit(key, 1, 1);
    expect(res2.allowed).toBe(false);
  });

  it("Task #83 T6: hashRateLimitIdentifier normalizes and HMAC hashes account identifiers", () => {
    const hash1 = hashRateLimitIdentifier(" User@Example.COM ");
    const hash2 = hashRateLimitIdentifier("user@example.com");
    expect(hash1).toBe(hash2);
    expect(hash1).not.toContain("user@example.com");
    expect(hash1).toHaveLength(32);
  });
});

describe("Cloudflare không có port coordinator (BR-RTL-12)", () => {
  beforeEach(() => {
    vi.stubEnv("MINDKID_RUNTIME", "cloudflare");
    registerCloudflareRateLimitPort(undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    registerCloudflareRateLimitPort(undefined);
  });

  it("fail closed dù failOpen = true (mặc định)", async () => {
    await expect(checkRateLimit("ip_cf", 5, 60)).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );
  });

  it("fail closed khi failOpen = false", async () => {
    await expect(checkRateLimit("ip_cf", 5, 60, false)).rejects.toBeInstanceOf(
      ServiceUnavailableError
    );
  });

  it("có port thì dùng port", async () => {
    registerCloudflareRateLimitPort({
      consumeRateLimit: () =>
        Promise.resolve({ allowed: true, remaining: 3, resetSeconds: 9 }),
    });
    expect((await checkRateLimit("ip_cf", 5, 60)).remaining).toBe(3);
  });
});
