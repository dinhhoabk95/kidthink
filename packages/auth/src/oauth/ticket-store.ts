import crypto from "node:crypto";
import { isOAuthProvider, type NormalizedProfile } from "./types.js";

export const OAUTH_TICKET_COOKIE_NAME = "tm_oauth_ticket";
/** Vé đăng ký MXH sống 10 phút, cùng hạn với state OAuth (UC-028 BR-OAP-03). */
export const OAUTH_TICKET_TTL_SECONDS = 600;

export interface OAuthTicketPayload {
  readonly profile: NormalizedProfile;
  readonly created_at: number;
}

function sign(data: string, secretKey: string): string {
  return crypto
    .createHmac("sha256", secretKey)
    .update(data)
    .digest("base64url");
}

/** Vé = `base64url(JSON).HMAC-SHA256(JSON)`; không ký thì không ai tin được hồ sơ bên trong. */
export function encodeOAuthTicket(
  payload: OAuthTicketPayload,
  secretKey: string
): string {
  const data = JSON.stringify(payload);
  return `${Buffer.from(data, "utf8").toString("base64url")}.${sign(data, secretKey)}`;
}

interface RawOAuthTicket {
  readonly profile?: Partial<NormalizedProfile> | null;
  readonly created_at?: number;
}

function toNormalizedProfile(
  raw: Partial<NormalizedProfile> | null | undefined
): NormalizedProfile | null {
  if (
    !raw ||
    typeof raw.provider !== "string" ||
    !isOAuthProvider(raw.provider) ||
    typeof raw.provider_user_id !== "string" ||
    raw.provider_user_id.length === 0 ||
    (raw.email_at_provider !== null &&
      typeof raw.email_at_provider !== "string") ||
    typeof raw.email_verified_at_provider !== "boolean" ||
    typeof raw.display_name_at_provider !== "string"
  ) {
    return null;
  }
  return {
    provider: raw.provider,
    provider_user_id: raw.provider_user_id,
    email_at_provider: raw.email_at_provider,
    email_verified_at_provider: raw.email_verified_at_provider,
    display_name_at_provider: raw.display_name_at_provider,
  };
}

export function decodeOAuthTicket(
  token: string,
  secretKey: string,
  nowMs = Date.now()
): OAuthTicketPayload | null {
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

  const data = Buffer.from(b64Data, "base64url").toString("utf8");
  const expected = sign(data, secretKey);
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expected, "utf8")
    )
  ) {
    return null;
  }

  try {
    const parsed: RawOAuthTicket = JSON.parse(data);
    const profile = toNormalizedProfile(parsed.profile);
    if (!profile || typeof parsed.created_at !== "number") {
      return null;
    }
    const ageSeconds = (nowMs - parsed.created_at) / 1000;
    if (ageSeconds < 0 || ageSeconds > OAUTH_TICKET_TTL_SECONDS) {
      return null;
    }
    return { profile, created_at: parsed.created_at };
  } catch {
    return null;
  }
}
