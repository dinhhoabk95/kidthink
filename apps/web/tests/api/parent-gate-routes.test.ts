import { createWebUserToken } from "@kidthink/auth";
import { describe, expect, it } from "vitest";
import challengeHandler from "../../server/api/users/parent-gate/challenge.post";
import verifyHandler from "../../server/api/users/parent-gate/verify.post";

const JWT_SECRET =
  process.env.JWT_SECRET || "kidthink-dev-secret-kidthink-dev-secret-32bytes";

async function createAuthUserHeader(userId = 101) {
  const token = await createWebUserToken({
    payload: {
      user_id: userId,
      display_name: "Parent User",
      session_id: `sess_${userId}_${Date.now()}`,
      refresh_token_version: 0,
    },
    secret: JWT_SECRET,
  });
  return `Bearer ${token}`;
}

function mockEvent(
  method: string,
  headers: Record<string, string> = {},
  body: any = {}
) {
  const responseHeaders: Record<string, string> = {};
  return {
    method,
    node: {
      req: { headers, url: "/", originalUrl: "/" },
      res: {
        setHeader: (name: string, value: string) => {
          responseHeaders[name.toLowerCase()] = value;
        },
        getHeader: (name: string) => responseHeaders[name.toLowerCase()],
        statusCode: 200,
      },
    },
    context: {
      body,
    },
    _body: body,
  } as any;
}

describe("Parent Gate Server Routes (BR-PGT-01..07 & D-GO)", () => {
  it("POST /api/users/parent-gate/challenge generates single-digit challenge", async () => {
    const authHeader = await createAuthUserHeader(101);
    const event = mockEvent("POST", { authorization: authHeader });

    const res = await challengeHandler(event);
    expect(res.challenge_id).toBeDefined();
    expect(res.factor_a).toBeGreaterThanOrEqual(2);
    expect(res.factor_a).toBeLessThanOrEqual(9);
    expect(res.factor_b).toBeGreaterThanOrEqual(2);
    expect(res.factor_b).toBeLessThanOrEqual(9);
    expect(res.challenge_payload).toBeDefined();
  });

  it("POST /api/users/parent-gate/verify verifies challenge answer and returns gate_token", async () => {
    const authHeader = await createAuthUserHeader(101);
    const challengeEvent = mockEvent("POST", { authorization: authHeader });
    const challenge = await challengeHandler(challengeEvent);
    const correctAnswer = challenge.factor_a * challenge.factor_b;

    const verifyEvent = mockEvent(
      "POST",
      { authorization: authHeader },
      {
        challenge_payload: challenge.challenge_payload,
        answer: correctAnswer,
      }
    );

    const res = await verifyHandler(verifyEvent);
    expect(res.gate_token).toBeDefined();
    expect(res.expires_at).toBeGreaterThan(Date.now());
  });

  it("POST /api/users/parent-gate/verify throws PARENT_GATE_FAILED on wrong answer", async () => {
    const authHeader = await createAuthUserHeader(101);
    const challengeEvent = mockEvent("POST", { authorization: authHeader });
    const challenge = await challengeHandler(challengeEvent);
    const wrongAnswer = challenge.factor_a * challenge.factor_b + 5;

    const verifyEvent = mockEvent(
      "POST",
      { authorization: authHeader },
      {
        challenge_payload: challenge.challenge_payload,
        answer: wrongAnswer,
      }
    );

    try {
      await verifyHandler(verifyEvent);
      expect.fail("Should have thrown 403 PARENT_GATE_FAILED");
    } catch (err: any) {
      const status = err.statusCode || err.status;
      expect(status).toBe(403);
    }
  });
});
