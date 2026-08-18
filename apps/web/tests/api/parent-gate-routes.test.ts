import { describe, expect, it } from "vitest";
import challengeHandler from "../../server/api/users/parent-gate/challenge.post";
import verifyHandler from "../../server/api/users/parent-gate/verify.post";

function mockEvent(method: string, userId = 101, body: any = {}) {
  const csrf =
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const responseHeaders: Record<string, string> = {};
  return {
    method,
    node: {
      req: {
        headers: {
          "x-csrf-token": csrf,
          cookie: `tm_u_csrf=${csrf}`,
        },
        url: "/",
        originalUrl: "/",
      },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        statusCode: 200,
      },
    },

    context: {
      user: {
        user_id: userId,
        display_name: "Parent User",
        session_id: `sess_${userId}`,
      },
      body,
    },
    _body: body,
  } as any;
}

describe("Parent Gate Server Routes (BR-PGT-01..07 & D-GO)", () => {
  it("POST /api/users/parent-gate/challenge generates single-digit challenge", async () => {
    const event = mockEvent("POST", 101);

    const res = await challengeHandler(event);
    expect(res.challenge_id).toBeDefined();
    expect(res.factor_a).toBeGreaterThanOrEqual(2);
    expect(res.factor_a).toBeLessThanOrEqual(9);
    expect(res.factor_b).toBeGreaterThanOrEqual(2);
    expect(res.factor_b).toBeLessThanOrEqual(9);
    expect(res.challenge_payload).toBeDefined();
  });

  it("POST /api/users/parent-gate/verify verifies challenge answer and returns gate_token", async () => {
    const challengeEvent = mockEvent("POST", 101);
    const challenge = await challengeHandler(challengeEvent);
    const correctAnswer = challenge.factor_a * challenge.factor_b;

    const verifyEvent = mockEvent("POST", 101, {
      challenge_payload: challenge.challenge_payload,
      answer: correctAnswer,
    });

    const res = await verifyHandler(verifyEvent);
    expect(res.gate_token).toBeDefined();
    expect(res.expires_at).toBeGreaterThan(Date.now());
  });

  it("POST /api/users/parent-gate/verify throws PARENT_GATE_FAILED on wrong answer", async () => {
    const challengeEvent = mockEvent("POST", 101);
    const challenge = await challengeHandler(challengeEvent);
    const wrongAnswer = challenge.factor_a * challenge.factor_b + 5;

    const verifyEvent = mockEvent("POST", 101, {
      challenge_payload: challenge.challenge_payload,
      answer: wrongAnswer,
    });

    try {
      await verifyHandler(verifyEvent);
      expect.fail("Should have thrown 403 PARENT_GATE_FAILED");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(403);
    }
  });
});
