import {
  AppError,
  appError,
  CSRF_HEADER_NAME,
  generateCsrfToken,
  getAuthNamespaceConfig,
  requireUserAuth,
  validateCsrfToken,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import {
  createError,
  deleteCookie,
  getCookie,
  getHeader,
  type H3Event,
  setCookie,
  setResponseStatus,
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
  throw appError(statusCode === 429 ? "RATE_LIMITED" : "SERVICE_UNAVAILABLE");
}

export function assertSameOriginRequest(event: H3Event): void {
  const fetchSite = getHeader(event, "sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site") {
    throw appError("CSRF_INVALID");
  }

  const origin = getHeader(event, "origin");
  const host = getHeader(event, "host");
  if (!(origin && host)) {
    return;
  }
  try {
    if (!isAllowedApiOrigin(origin, host)) {
      throw appError("CSRF_INVALID");
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw appError("CSRF_INVALID");
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
    throw appError("PAYLOAD_TOO_LARGE");
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
    path: "/api/users/auth/restore",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearUserRememberCookie(event: H3Event): void {
  deleteCookie(event, USER_REMEMBER_COOKIE, {
    path: "/api/users/auth/restore",
  });
}

export function getUserRememberCookie(event: H3Event): string {
  const token = getCookie(event, USER_REMEMBER_COOKIE);
  if (!token) {
    throw appError("SESSION_REVOKED");
  }
  return token;
}

export function requireWebUserSession(event: H3Event) {
  validateUserCsrf(event);
  return requireUserAuth(event);
}

export function assertUnrestrictedUser(status: string): void {
  if (status === "pending_verification") {
    throw appError("RESTRICTED_MODE", {
      reason: "Tài khoản cần xác thực email để thực hiện thao tác này.",
    });
  }
}

export function getActiveChildUuid(event: H3Event): string {
  const cookieVal =
    getCookie(event, "active_child_id") ||
    getCookie(event, "active_child_uuid");
  const ctxVal =
    event.context?.user?.active_child_id ||
    event.context?.active_child_id ||
    event.context?.user?.activeChildUuid;
  const val = cookieVal || ctxVal;
  if (!val) {
    throw appError("NO_ACTIVE_CHILD", {
      reason: "Yêu cầu cần chọn hồ sơ trẻ đang hoạt động.",
    });
  }
  return String(val);
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

export function respondToUserAuthError(event: H3Event, error: unknown): never {
  if (
    error instanceof AppError ||
    (typeof error === "object" &&
      error !== null &&
      "isAppError" in error &&
      "status" in error &&
      "toResponse" in error)
  ) {
    const err = error as AppError;
    if (event?.node?.res) {
      setResponseStatus(event, err.status);
    }
    throw createError({
      statusCode: err.status,
      statusMessage: err.message,
      data: err.toResponse(),
    });
  }
  throw error as Error;
}
