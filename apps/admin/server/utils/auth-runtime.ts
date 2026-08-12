import {
  AppError,
  type AuthErrorResponse,
  appError,
  CSRF_HEADER_NAME,
  generateCsrfToken,
  getAuthNamespaceConfig,
  type ManagerTokenPayload,
  RefreshService,
  validateCsrfToken,
} from "@kidthink/auth";
import { getAppSql, PostgresSessionStore } from "@kidthink/db";
import { enforceTwoAxisRateLimit } from "@kidthink/shared";
import {
  deleteCookie,
  getCookie,
  getHeader,
  type H3Event,
  setCookie,
  setResponseStatus,
} from "h3";
import { useRuntimeConfig } from "#imports";

const config = getAuthNamespaceConfig("manager");
const ACCESS_TTL_SECONDS = 15 * 60;
const CSRF_TOKEN = /^[0-9a-f]{64}$/;

export function getManagerRemoteIp(event: H3Event): string {
  const request = event.node?.req as
    | { socket?: { remoteAddress?: string } }
    | undefined;
  return request?.socket?.remoteAddress?.trim() || "unknown";
}

export async function assertManagerRefreshRateLimit(
  event: H3Event
): Promise<void> {
  const result = await enforceTwoAxisRateLimit({
    routeClass: "auth:refresh",
    remoteIp: getManagerRemoteIp(event),
  });
  if (result.statusCode !== 200) {
    throw appError(
      result.statusCode === 429 ? "RATE_LIMITED" : "SERVICE_UNAVAILABLE"
    );
  }
}

export function getManagerRefreshService(event: H3Event): RefreshService {
  const { adminJwtSecret } = useRuntimeConfig(event);
  return new RefreshService(new PostgresSessionStore(getAppSql()), {
    namespace: "manager",
    jwtSecret: adminJwtSecret,
    refreshTtlSeconds: config.refreshTtlSeconds,
  });
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
    maxAge: config.refreshTtlSeconds,
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

export function setManagerAuthCookies(
  event: H3Event,
  accessJwt: string,
  refreshEnvelope: string
): void {
  const response = event.node?.res as
    | { getHeader?: unknown; setHeader?: unknown }
    | undefined;
  if (
    typeof response?.getHeader !== "function" ||
    typeof response?.setHeader !== "function"
  ) {
    return;
  }
  setCookie(event, config.accessCookieName, accessJwt, {
    httpOnly: true,
    maxAge: ACCESS_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: !import.meta.dev,
  });
  setCookie(event, config.refreshCookieName, refreshEnvelope, {
    httpOnly: true,
    maxAge: config.refreshTtlSeconds,
    path: config.refreshPath,
    sameSite: "strict",
    secure: !import.meta.dev,
  });
  ensureManagerCsrfCookie(event);
}

export function clearManagerAuthCookies(event: H3Event): void {
  const response = event.node?.res as
    | { getHeader?: unknown; setHeader?: unknown }
    | undefined;
  if (
    typeof response?.getHeader !== "function" ||
    typeof response?.setHeader !== "function"
  ) {
    return;
  }
  deleteCookie(event, config.accessCookieName, { path: "/" });
  deleteCookie(event, config.refreshCookieName, {
    path: config.refreshPath,
  });
  deleteCookie(event, config.csrfCookieName, { path: "/" });
}

export function getManagerRefreshCookie(event: H3Event): string {
  const token = getCookie(event, config.refreshCookieName);
  if (!token) {
    throw appError("SESSION_REVOKED");
  }
  return token;
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
