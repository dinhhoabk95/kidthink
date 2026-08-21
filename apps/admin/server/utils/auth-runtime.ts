import {
  AppError,
  type AuthErrorResponse,
  appError,
  CSRF_HEADER_NAME,
  generateCsrfToken,
  getAuthNamespaceConfig,
  type ManagerTokenPayload,
  validateCsrfToken,
} from "@mindkid/auth";
import {
  deleteCookie,
  getCookie,
  getHeader,
  type H3Event,
  setCookie,
  setResponseStatus,
} from "h3";

const MANAGER_REMEMBER_COOKIE = "tm_m_remember";

const config = getAuthNamespaceConfig("manager");
/** CSRF cookie sống cùng vòng đời remember-me dài nhất của manager. */
const CSRF_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;
const CSRF_TOKEN = /^[0-9a-f]{64}$/;

export function getManagerRemoteIp(event: H3Event): string {
  const request = event.node?.req as
    | { socket?: { remoteAddress?: string } }
    | undefined;
  return request?.socket?.remoteAddress?.trim() || "unknown";
}

export function ensureManagerCsrfCookie(event: H3Event): string {
  const current = getCookie(event, config.csrfCookieName);
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
  setCookie(event, config.csrfCookieName, token, {
    httpOnly: false,
    maxAge: CSRF_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "strict",
    secure: !import.meta.dev,
  });
  return token;
}

export function validateManagerCsrf(event: H3Event): void {
  validateCsrfToken({
    method: event.method,
    cookieToken: getCookie(event, config.csrfCookieName),
    headerToken: getHeader(event, CSRF_HEADER_NAME),
  });
}

export function assertManagerSession(
  session: ManagerTokenPayload | { readonly user_id: number }
): ManagerTokenPayload {
  if (!("manager_id" in session)) {
    throw appError("UNAUTHENTICATED");
  }
  return session;
}

export function respondToManagerAuthError(
  event: H3Event,
  error: unknown
): AuthErrorResponse {
  if (!(error instanceof AppError)) {
    throw error;
  }
  setResponseStatus(event, error.status);
  return error.toResponse();
}

export function clearManagerRememberCookie(event: H3Event): void {
  deleteCookie(event, MANAGER_REMEMBER_COOKIE, {
    path: "/api/managers/auth/restore",
  });
}
