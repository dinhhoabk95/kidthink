import { createHmac, timingSafeEqual } from "node:crypto";
import { requireEnv } from "@mindkid/config";

const PREVIEW_SECRET = requireEnv("NUXT_SESSION_PASSWORD");

const PREVIEW_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface PreviewTokenPayload {
  entityType: string;
  id: number;
  version: number;
  managerId: number;
  timestamp: number;
}

/**
 * Issues a signed preview token verifying that the manager opened live preview (D-KG).
 */
export function issuePreviewToken(payload: {
  entityType: string;
  id: number;
  version: number;
  managerId: number;
}): string {
  const data: PreviewTokenPayload = {
    entityType: payload.entityType,
    id: payload.id,
    version: payload.version,
    managerId: payload.managerId,
    timestamp: Date.now(),
  };

  const json = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = createHmac("sha256", PREVIEW_SECRET)
    .update(json)
    .digest("base64url");

  return `${json}.${signature}`;
}

/**
 * Verifies a server-issued preview token matches the target content item and manager (D-KG, BR-CRQ-02).
 */
export function verifyPreviewToken(
  token: string | undefined | null,
  expected: {
    entityType: string;
    id: number;
    version: number;
    managerId: number;
  }
): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [json, signature] = parts;
  if (!(json && signature)) {
    return false;
  }

  const expectedSig = createHmac("sha256", PREVIEW_SECRET)
    .update(json)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSig);

  if (
    sigBuffer.length !== expectedSigBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedSigBuffer)
  ) {
    return false;
  }

  try {
    const data = JSON.parse(
      Buffer.from(json, "base64url").toString("utf8")
    ) as PreviewTokenPayload;

    if (Date.now() - data.timestamp > PREVIEW_TOKEN_TTL_MS) {
      return false; // Expired
    }

    return (
      data.entityType === expected.entityType &&
      data.id === expected.id &&
      data.version === expected.version &&
      data.managerId === expected.managerId
    );
  } catch {
    return false;
  }
}
