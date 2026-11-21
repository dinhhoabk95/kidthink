import { MfaLockedError } from "@mindkid/errors/auth";
import { describe, expect, it } from "vitest";
import {
  InMemoryRedisClient,
  MFA_MAX_FAILURES,
  MfaAttemptGuard,
} from "#src/index";

describe("MFA Brute-Force Lockout Guard (UC-052, BR-ADA-05)", () => {
  it("locks account for 15 minutes after 5 consecutive failures and resets on success", async () => {
    const redis = new InMemoryRedisClient();
    const guard = new MfaAttemptGuard(redis);
    const t0 = new Date("2026-11-21T10:00:00Z");

    for (let i = 1; i < MFA_MAX_FAILURES; i++) {
      const res = await guard.recordFailure("manager", 42, t0);
      expect(res.locked).toBe(false);
    }

    const fifth = await guard.recordFailure("manager", 42, t0);
    expect(fifth.locked).toBe(true);

    await expect(
      guard.assertNotLocked("manager", 42, t0)
    ).rejects.toBeInstanceOf(MfaLockedError);

    // Separate namespace is unaffected
    await expect(
      guard.assertNotLocked("user", 42, t0)
    ).resolves.toBeUndefined();
  });

  it("reset clears failure counter before lockout threshold", async () => {
    const redis = new InMemoryRedisClient();
    const guard = new MfaAttemptGuard(redis);

    await guard.recordFailure("user", 9);
    await guard.recordFailure("user", 9);
    await guard.reset("user", 9);

    for (let i = 1; i < MFA_MAX_FAILURES; i++) {
      const res = await guard.recordFailure("user", 9);
      expect(res.locked).toBe(false);
    }
  });
});
