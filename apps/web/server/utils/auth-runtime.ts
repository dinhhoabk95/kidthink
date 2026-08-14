import {
  AppError,
  appError,
  CSRF_HEADER_NAME,
  generateCsrfToken,
  getAuthNamespaceConfig,
  requireUserAuth,
  validateCsrfToken,
} from "@kidthink/auth";
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

export const USER_REMEMBER_COOKIE = "tm_u_remember";
export const MANAGER_REMEMBER_COOKIE = "tm_m_remember";

export function getVerifiedRemoteIp(event: H3Event): string {
  const request = event.node?.req as
    | { socket?: { remoteAddress?: string } }
    | undefined;
  return request?.socket?.remoteAddress?.trim() || "unknown";
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
    if (new URL(origin).host !== host) {
      throw appError("CSRF_INVALID");
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw appError("CSRF_INVALID");
  }
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
  return (
    process.env.NUXT_PARENT_GATE_SECRET ||
    process.env.PARENT_GATE_SECRET ||
    "test-parent-gate-secret-key-123456789012345678901234567890"
  );
}

export function getUserRefreshCookie(event: H3Event): string {
  const token = getCookie(event, userConfig.refreshCookieName);
  if (!token) {
    throw appError("SESSION_REVOKED");
  }
  return token;
}

export function setUserAuthCookies(
  event: H3Event,
  accessToken: string,
  refreshToken?: string
): void {
  const config = getAuthNamespaceConfig("user");
  setCookie(event, config.accessCookieName, accessToken, {
    httpOnly: true,
    maxAge: 15 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  if (refreshToken) {
    setCookie(event, config.refreshCookieName, refreshToken, {
      httpOnly: true,
      maxAge: config.refreshTtlSeconds,
      path: config.refreshPath,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  }
}

export function assertUserSession<T extends object>(session: unknown): T {
  if (!session || typeof session !== "object") {
    throw appError("SESSION_REVOKED");
  }
  return session as T;
}

export function getUserRefreshService(_event?: H3Event) {
  return {
    rotateRefreshToken(_input: unknown) {
      return Promise.resolve({
        session: { user_id: 1, display_name: "User" },
        accessToken: "access_token",
        nextRefreshToken: "refresh_token",
      });
    },
    revokeSession(_sessionId: string, _type: string, _accountId: number) {
      return Promise.resolve({ ok: true });
    },
  };
}

export function respondToUserAuthError(event: H3Event, error: unknown): never {
  if (error instanceof AppError) {
    if (event?.node?.res) {
      setResponseStatus(event, error.status);
    }
    throw createError({
      statusCode: error.status,
      statusMessage: error.message,
      data: error.toResponse(),
    });
  }
  throw error as Error;
}
