import { describe, expect, it } from "vitest";
import {
  createParentGateToken,
  generateParentGateChallenge,
  isValidParentGateToken,
  verifyParentGateChallenge,
} from "../src/parent-gate";

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

  it("verifyParentGateChallenge returns gate_token valid for 5 minutes on correct answer", () => {
    const { factorA, factorB, challengePayload } =
      generateParentGateChallenge(testSecret);
    const answer = factorA * factorB;
    const userId = 42;

    const res = verifyParentGateChallenge(
      challengePayload,
      answer,
      userId,
      testSecret
    );
    expect(res.gateToken).toBeDefined();
    expect(res.expiresAt).toBeGreaterThan(Date.now());
    expect(isValidParentGateToken(res.gateToken, userId, testSecret)).toBe(
      true
    );
  });

  it("BR-PGT-03: rejects incorrect answer with PARENT_GATE_FAILED error", () => {
    const { factorA, factorB, challengePayload } =
      generateParentGateChallenge(testSecret);
    const wrongAnswer = factorA * factorB + 1;

    try {
      verifyParentGateChallenge(challengePayload, wrongAnswer, 42, testSecret);
      expect.fail("Should have thrown");
    } catch (err: any) {
      expect(err.code).toBe("PARENT_GATE_FAILED");
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
