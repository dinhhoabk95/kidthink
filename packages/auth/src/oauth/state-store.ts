import crypto from "node:crypto";
import type { RedirectTargetInput } from "@mindkid/shared";
import { sanitizeRedirectTarget } from "../redirect-target.js";
import { isOAuthProvider, type OAuthStatePayload } from "./types.js";

export const OAUTH_COOKIE_NAME = "tm_oauth";
export const OAUTH_STATE_TTL_SECONDS = 600; // 10 minutes (BR-OAP-03)

/**
 * Giữ tên cũ cho luồng OAuth. Thân hàm sống ở `../redirect-target.js` — module
 * lá dùng chung với `redirect` của luồng email/mật khẩu (`BR-LGN-12`).
 */
export function sanitizeReturnTo(returnTo: RedirectTargetInput): string {
  return sanitizeRedirectTarget(returnTo);
}

/**
 * Generates cryptographically secure state string >= 32 bytes (BR-OAP-03).
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function encodeOAuthStatePayload(
  payload: OAuthStatePayload,
  secretKey: string
): string {
  const data = JSON.stringify(payload);
  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(data)
    .digest("base64url");
  const b64Data = Buffer.from(data, "utf8").toString("base64url");
  return `${b64Data}.${hmac}`;
}

export function decodeOAuthStatePayload(
  token: string,
  secretKey: string,
  nowMs = Date.now()
): OAuthStatePayload | null {
  if (!token || typeof token !== "string") {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [b64Data, signature] = parts;
  if (!(b64Data && signature)) {
    return null;
  }

  const expectedHmac = crypto
    .createHmac("sha256", secretKey)
    .update(Buffer.from(b64Data, "base64url").toString("utf8"))
    .digest("base64url");

  // Constant-time compare
  if (
    signature.length !== expectedHmac.length ||
    !crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expectedHmac, "utf8")
    )
  ) {
    return null;
  }

  try {
    const raw = Buffer.from(b64Data, "base64url").toString("utf8");
    const parsed = JSON.parse(raw);

    if (
      !parsed.state ||
      typeof parsed.state !== "string" ||
      !parsed.code_verifier ||
      typeof parsed.code_verifier !== "string" ||
      !isOAuthProvider(parsed.provider) ||
      (parsed.intent !== "login" && parsed.intent !== "link") ||
      typeof parsed.created_at !== "number"
    ) {
      return null;
    }

    // Check 10-minute expiration
    const ageSeconds = (nowMs - parsed.created_at) / 1000;
    if (ageSeconds < 0 || ageSeconds > OAUTH_STATE_TTL_SECONDS) {
      return null;
    }

    return {
      state: parsed.state,
      code_verifier: parsed.code_verifier,
      intent: parsed.intent,
      return_to: sanitizeReturnTo(parsed.return_to),
      provider: parsed.provider,
      user_id: typeof parsed.user_id === "number" ? parsed.user_id : undefined,
      created_at: parsed.created_at,
    };
  } catch {
    return null;
  }
}
