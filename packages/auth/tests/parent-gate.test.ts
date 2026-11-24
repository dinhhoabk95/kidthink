import { ServiceUnavailableError } from "@mindkid/errors/common";
import { describe, expect, it } from "vitest";
import {
  createParentGateToken,
  generateParentGateChallenge,
  isValidParentGateToken,
  verifyParentGateChallenge,
} from "#src/parent-gate";
import { setAuthRedisClient } from "#src/redis-client";
import { InMemoryRedisClient } from "#src/redis-secondary-storage";

describe("ParentGate Utilities (BR-PGT-01..07 & D-GO)", () => {
  const testSecret = "test-parent-gate-secret-key-123456";

  it("BR-PGT-02 & D-GO: generates single-digit multiplication challenge (factors 2..9)", () => {
    const { challengeId, factorA, factorB, challengePayload } =
      generateParentGateChallenge(testSecret);
    expect(challengeId).toBeDefined();
    expect(factorA).toBeGreaterThanOrEqual(2);
    expect(factorA).toBeLessThanOrEqual(9);
    expect(factorB).toBeGreaterThanOrEqual(2);
    expect(factorB).toBeLessThanOrEqual(9);
    expect(challengePayload).toContain(".");
  });

  it("verifyParentGateChallenge returns gate_token valid for 5 minutes on correct answer and blocks replay", async () => {
    const store = new InMemoryRedisClient();
    const { factorA, factorB, challengePayload } =
      generateParentGateChallenge(testSecret);
    const answer = factorA * factorB;
    const userId = 42;

    const res = await verifyParentGateChallenge(
      challengePayload,
      answer,
      userId,
      testSecret,
      store
    );
    expect(res.gateToken).toBeDefined();
    expect(res.expiresAt).toBeGreaterThan(Date.now());
    expect(isValidParentGateToken(res.gateToken, userId, testSecret)).toBe(
      true
    );

    await expect(
      verifyParentGateChallenge(
        challengePayload,
        answer,
        userId,
        testSecret,
        store
      )
    ).rejects.toMatchObject({ code: "PARENT_GATE_INVALID" });
  });

  it("BR-PGT-03: rejects incorrect answer with PARENT_GATE_FAILED error and still consumes challenge", async () => {
    const store = new InMemoryRedisClient();
    const { factorA, factorB, challengePayload } =
      generateParentGateChallenge(testSecret);
    const wrongAnswer = factorA * factorB + 1;

    await expect(
      verifyParentGateChallenge(
        challengePayload,
        wrongAnswer,
        42,
        testSecret,
        store
      )
    ).rejects.toMatchObject({ code: "PARENT_GATE_FAILED" });

    await expect(
      verifyParentGateChallenge(
        challengePayload,
        factorA * factorB,
        42,
        testSecret,
        store
      )
    ).rejects.toMatchObject({ code: "PARENT_GATE_INVALID" });
  });

  it("fails closed with 503 SERVICE_UNAVAILABLE when shared store fails", async () => {
    const store = new InMemoryRedisClient();
    store.setFailMode(true);
    setAuthRedisClient(store);
    try {
      const { factorA, factorB, challengePayload } =
        generateParentGateChallenge(testSecret);
      await expect(
        verifyParentGateChallenge(
          challengePayload,
          factorA * factorB,
          42,
          testSecret
        )
      ).rejects.toBeInstanceOf(ServiceUnavailableError);
    } finally {
      setAuthRedisClient(undefined);
    }
  });

  it("BR-PGT-04 & BR-PGT-06: gate_token expires after 5 minutes and rejects mismatched userId", () => {
    const userId = 42;
    const now = Date.now();
    const token = createParentGateToken(userId, now + 300_000, testSecret);

    expect(isValidParentGateToken(token, userId, testSecret)).toBe(true);

    // Mismatched user
    expect(isValidParentGateToken(token, 999, testSecret)).toBe(false);

    // Expired token
    const expiredToken = createParentGateToken(userId, now - 1000, testSecret);
    expect(isValidParentGateToken(expiredToken, userId, testSecret)).toBe(
      false
    );
  });
});
