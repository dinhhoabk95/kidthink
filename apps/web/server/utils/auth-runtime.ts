import {
  CSRF_HEADER_NAME,
  generateCsrfToken,
  getAuthNamespaceConfig,
  requireUserAuth,
  validateCsrfToken,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import {
  CsrfInvalidError,
  RestrictedModeError,
  SessionRevokedError,
} from "@mindkid/errors/auth";
import { isAppError } from "@mindkid/errors/base";
import { NoActiveChildError } from "@mindkid/errors/child";
import {
  PayloadTooLargeError,
  RateLimitedError,
  ServiceUnavailableError,
} from "@mindkid/errors/common";
import {
  deleteCookie,
  getCookie,
  getHeader,
  type H3Event,
  setCookie,
} from "h3";

const userConfig = getAuthNamespaceConfig("user");
const CSRF_TOKEN = /^[0-9a-f]{64}$/;
const INTEGER_TEXT = /^\d+$/;
const GUEST_DEVICE_ID_REGEX = /^[0-9a-fA-F-]{16,64}$/;
const ORIGIN_TRAILING_SLASH = /\/$/;

export const USER_REMEMBER_COOKIE = "tm_u_remember";
export const MANAGER_REMEMBER_COOKIE = "tm_m_remember";

const DEFAULT_TRUSTED_PROXY_IPS = "127.0.0.1,::1";
const IPV4_MAPPED_PREFIX = "::ffff:";

let trustedProxyCache: { raw: string; ips: ReadonlySet<string> } | null = null;

/** Node báo IPv4 qua socket IPv6 dưới dạng `::ffff:127.0.0.1`. */
function normalizeIp(value: string | undefined): string {
  const trimmed = (value ?? "").trim().toLowerCase();
  return trimmed.startsWith(IPV4_MAPPED_PREFIX)
    ? trimmed.slice(IPV4_MAPPED_PREFIX.length)
    : trimmed;
}

function getTrustedProxyIps(): ReadonlySet<string> {
  const raw =
    process.env.TRUSTED_PROXY_IPS?.trim() || DEFAULT_TRUSTED_PROXY_IPS;
  if (trustedProxyCache?.raw === raw) {
    return trustedProxyCache.ips;
  }
  const ips = new Set(
    raw
      .split(",")
      .map((item) => normalizeIp(item))
      .filter((item) => item.length > 0)
  );
  trustedProxyCache = { raw, ips };
  return ips;
}

/**
 * BR-RTL-11 — IP dùng cho giới hạn tần suất.
 *
 * nginx là edge và proxy tới loopback, đặt `X-Real-IP $remote_addr`
 * (`infra/nginx/mindkid-proxy.conf:8`). Nếu chỉ đọc địa chỉ socket thì mọi
 * request trong production đều là `127.0.0.1` và trục IP sụp thành một bucket
 * toàn cục. Nhưng header chỉ đáng tin khi **peer là proxy đã cấu hình** — đọc
 * nó vô điều kiện là để client tự khai IP.
 *
 * Cấm — NEVER đọc `X-Forwarded-For`: nó nối thêm được từ phía client.
 */
export function getVerifiedRemoteIp(event: H3Event): string {
  const request = event.node?.req as
    | { socket?: { remoteAddress?: string } }
    | undefined;
  const socketIp = normalizeIp(request?.socket?.remoteAddress);
  if (!socketIp) {
    return "unknown";
  }
  if (!getTrustedProxyIps().has(socketIp)) {
    return socketIp;
  }
  return normalizeIp(getHeader(event, "x-real-ip")) || socketIp;
}

export function assertRateLimitAllowed(statusCode: number): void {
  if (statusCode === 200) {
    return;
  }
  throw statusCode === 429
    ? new RateLimitedError({ retry_after_s: 60 })
    : new ServiceUnavailableError();
}

export function assertSameOriginRequest(event: H3Event): void {
  const fetchSite = getHeader(event, "sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site") {
    throw new CsrfInvalidError();
  }

  const origin = getHeader(event, "origin");
  const host = getHeader(event, "host");
  if (!(origin && host)) {
    return;
  }
  try {
    if (!isAllowedApiOrigin(origin, host)) {
      throw new CsrfInvalidError();
    }
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw new CsrfInvalidError();
  }
}

export function isAllowedApiOrigin(
  origin: string,
  requestHost: string
): boolean {
  const parsedOrigin = new URL(origin);
  if (parsedOrigin.host === requestHost) {
    return true;
  }

  const configuredOrigins = requireEnv("NUXT_ALLOWED_ORIGINS")
    .split(",")
    .map((value) => value.trim().replace(ORIGIN_TRAILING_SLASH, ""))
    .filter(Boolean);

  return configuredOrigins.includes(parsedOrigin.origin);
}

export function assertRequestBodySize(
  event: H3Event,
  maxBytes = 128 * 1024
): void {
  const rawLength = getHeader(event, "content-length");
  if (
    rawLength &&
    INTEGER_TEXT.test(rawLength) &&
    Number(rawLength) > maxBytes
  ) {
    throw new PayloadTooLargeError();
  }
}

export function ensureUserCsrfCookie(event: H3Event): string {
  const current = getCookie(event, userConfig.csrfCookieName);
  if (current && CSRF_TOKEN.test(current)) {
    return current;
  }

  const token = generateCsrfToken();
  const response = event.node?.res as
    | { getHeader?: unknown; setHeader?: unknown }
    | undefined;
  if (
    typeof response?.getHeader !== "function" ||
    typeof response?.setHeader !== "function"
  ) {
    return token;
  }
  setCookie(event, userConfig.csrfCookieName, token, {
    httpOnly: false,
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return token;
}

export function validateUserCsrf(event: H3Event): void {
  validateCsrfToken({
    method: event.method,
    cookieToken: getCookie(event, userConfig.csrfCookieName),
    headerToken: getHeader(event, CSRF_HEADER_NAME),
  });
}

export function setUserRememberCookie(
  event: H3Event,
  rememberToken: string
): void {
  setCookie(event, USER_REMEMBER_COOKIE, rememberToken, {
    httpOnly: true,
    maxAge: 365 * 24 * 3600,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearUserRememberCookie(event: H3Event): void {
  deleteCookie(event, USER_REMEMBER_COOKIE, {
    path: "/",
  });
}

export function getUserRememberCookie(event: H3Event): string {
  const token = getCookie(event, USER_REMEMBER_COOKIE);
  if (!token) {
    throw new SessionRevokedError();
  }
  return token;
}

export function requireWebUserSession(event: H3Event) {
  validateUserCsrf(event);
  return requireUserAuth(event);
}

export function assertUnrestrictedUser(status: string): void {
  if (status === "pending_verification") {
    throw new RestrictedModeError();
  }
}

/**
 * Cookie `active_child_id` mang **UUID** của hồ sơ trẻ, không phải khoá chính.
 * Mọi consumer tra bằng `childProfiles.uuid` (`game-config-runtime.ts`).
 *
 * Cấm — NEVER lấy lại giá trị này từ `event.context`: `UserTokenPayload` mang
 * `active_child_db_id` kiểu số, và không route nào ghi nó. Nhánh fallback cũ
 * `String()` một id số vào ô chờ UUID, làm mọi level bậc ≥ login trả 404.
 */
export function getOptionalActiveChildUuid(event: H3Event): string | null {
  const cookieVal =
    getCookie(event, "active_child_id") ||
    getCookie(event, "active_child_uuid");
  return cookieVal ? String(cookieVal) : null;
}

export function getActiveChildUuid(event: H3Event): string {
  const val = getOptionalActiveChildUuid(event);
  if (!val) {
    throw new NoActiveChildError();
  }
  return val;
}

export function getOrSetGuestDeviceId(event: H3Event): string {
  const current = getCookie(event, "guest_device_id");
  if (current && GUEST_DEVICE_ID_REGEX.test(current)) {
    return current;
  }

  const id = crypto.randomUUID();
  setCookie(event, "guest_device_id", id, {
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return id;
}

export function getParentGateSecret(_event?: H3Event): string {
  return requireEnv("PARENT_GATE_SECRET");
}

export function respondToUserAuthError(_event: H3Event, error: unknown): never {
  if (isAppError(error)) {
    throw error;
  }
  throw error as Error;
}
