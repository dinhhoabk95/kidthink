import crypto from "node:crypto";
import { appError } from "./errors";

export interface ParentGateChallenge {
  challengeId: string;
  factorA: number;
  factorB: number;
  expiresAt: number;
}

export interface ParentGateTokenPayload {
  userId: number;
  issuedAt: number;
  expiresAt: number;
}

// A challenge is intentionally one-shot. This process-local replay guard is
// supplementary to the HMAC; deployments with multiple Nitro instances must
// back it with the shared cache used by the rest of auth throttling.
const consumedChallenges = new Map<string, number>();

/**
 * Creates a single-digit multiplication challenge (e.g. 7 x 8 = 56).
 * Single digit integers 2..9, result two digits 10..81.
 */
export function generateParentGateChallenge(secret: string): {
  challengeId: string;
  factorA: number;
  factorB: number;
  challengePayload: string;
} {
  const factorA = Math.floor(Math.random() * 8) + 2; // 2..9
  const factorB = Math.floor(Math.random() * 8) + 2; // 2..9
  const challengeId = crypto.randomUUID();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min challenge TTL

  const data = JSON.stringify({
    challengeId,
    factorA,
    factorB,
    expiresAt,
  });

  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
  const challengePayload = `${Buffer.from(data).toString("base64url")}.${hmac}`;

  return { challengeId, factorA, factorB, challengePayload };
}

function decodeChallenge(
  dataB64: string,
  hmac: string,
  secret: string
): ParentGateChallenge {
  const dataJson = Buffer.from(dataB64, "base64url").toString("utf-8");
  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(dataJson)
    .digest("hex");
  if (
    hmac.length !== expectedHmac.length ||
    !crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))
  ) {
    throw appError("PARENT_GATE_INVALID");
  }
  const payload = JSON.parse(dataJson) as ParentGateChallenge;
  const validShape =
    Boolean(payload.challengeId) &&
    Number.isInteger(payload.factorA) &&
    Number.isInteger(payload.factorB) &&
    payload.factorA >= 2 &&
    payload.factorA <= 9 &&
    payload.factorB >= 2 &&
    payload.factorB <= 9 &&
    Number.isSafeInteger(payload.expiresAt);
  if (!validShape) {
    throw appError("PARENT_GATE_INVALID");
  }
  return payload;
}

/**
 * Verifies single-digit multiplication answer and returns gate_token (5 min TTL) on success.
 */
export function verifyParentGateChallenge(
  challengePayload: string,
  answer: number,
  userId: number,
  secret: string
): { gateToken: string; expiresAt: number } {
  const [dataB64, hmac] = challengePayload.split(".");
  if (!(dataB64 && hmac)) {
    throw appError("PARENT_GATE_INVALID");
  }

  try {
    const payload = decodeChallenge(dataB64, hmac, secret);

    if (Date.now() > payload.expiresAt) {
      throw appError("PARENT_GATE_EXPIRED");
    }

    const consumedAt = consumedChallenges.get(payload.challengeId);
    if (consumedAt && consumedAt > Date.now()) {
      throw appError("PARENT_GATE_INVALID");
    }

    if (Number(answer) !== payload.factorA * payload.factorB) {
      throw appError("PARENT_GATE_FAILED");
    }

    consumedChallenges.set(payload.challengeId, payload.expiresAt);
    for (const [id, expiry] of consumedChallenges) {
      if (expiry <= Date.now()) {
        consumedChallenges.delete(id);
      }
    }

    // Create gate_token valid for 5 minutes (300s)
    const tokenExpiresAt = Date.now() + 5 * 60 * 1000;
    const gateToken = createParentGateToken(userId, tokenExpiresAt, secret);

    return { gateToken, expiresAt: tokenExpiresAt };
  } catch (err) {
    if (err instanceof Error && err.name === "AppError") {
      throw err;
    }
    throw appError("PARENT_GATE_INVALID");
  }
}

/**
 * Generates a signed parent gate_token.
 */
export function createParentGateToken(
  userId: number,
  expiresAt: number,
  secret: string
): string {
  const payload: ParentGateTokenPayload = {
    userId,
    issuedAt: Date.now(),
    expiresAt,
  };
  const data = JSON.stringify(payload);
  const dataB64 = Buffer.from(data).toString("base64url");
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(dataB64)
    .digest("hex");
  return `${dataB64}.${hmac}`;
}

/**
 * Validates a signed parent gate_token.
 */
export function isValidParentGateToken(
  gateToken: string,
  userId: number,
  secret: string
): boolean {
  if (!gateToken || typeof gateToken !== "string") {
    return false;
  }
  const parts = gateToken.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [dataB64, hmac] = parts;
  if (!(dataB64 && hmac)) {
    return false;
  }

  try {
    const expectedHmac = crypto
      .createHmac("sha256", secret)
      .update(dataB64)
      .digest("hex");
    if (
      hmac.length !== expectedHmac.length ||
      !crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))
    ) {
      return false;
    }

    const payload = JSON.parse(
      Buffer.from(dataB64, "base64url").toString("utf-8")
    ) as ParentGateTokenPayload;

    if (payload.userId !== userId) {
      return false;
    }

    if (Date.now() > payload.expiresAt) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
