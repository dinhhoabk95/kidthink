import {
  AppError,
  appError,
  CSRF_HEADER_NAME,
  generateCsrfToken,
  getAuthNamespaceConfig,
  requireManagerAuth,
  requireRole,
  validateCsrfToken,
} from "@mindkid/auth";

import {
  createError,
  deleteCookie,
  getCookie,
  getHeader,
  type H3Event,
  setCookie,
  setResponseStatus,
} from "h3";

import { MANAGER_REMEMBER_COOKIE } from "./auth-runtime.js";

const managerConfig = getAuthNamespaceConfig("manager");
const CSRF_TOKEN = /^[0-9a-f]{64}$/;
const INTEGER_TEXT = /^\d+$/;

export function getManagerRemoteIp(event: H3Event): string {
  const request = event.node?.req as
    | { socket?: { remoteAddress?: string } }
    | undefined;
  return request?.socket?.remoteAddress?.trim() || "unknown";
}

export function assertManagerRequestBodySize(
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

export function assertManagerRateLimitAllowed(statusCode: number): void {
  if (statusCode === 200) {
    return;
  }
  throw appError(statusCode === 429 ? "RATE_LIMITED" : "SERVICE_UNAVAILABLE");
}

export function assertManagerSameOriginRequest(event: H3Event): void {
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

export function getAdminJwtSecret(_event: H3Event): string {
  const secret =
    process.env.ADMIN_JWT_SECRET ||
    (process.env.NODE_ENV === "test" ? process.env.WEB_JWT_SECRET : undefined);
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error(
      "ADMIN_JWT_SECRET is not configured with at least 32 bytes"
    );
  }
  return secret;
}

export function ensureManagerCsrfCookie(event: H3Event): string {
  const current = getCookie(event, managerConfig.csrfCookieName);
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
  setCookie(event, managerConfig.csrfCookieName, token, {
    httpOnly: false,
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return token;
}

export function validateManagerCsrf(event: H3Event): void {
  validateCsrfToken({
    method: event.method,
    cookieToken: getCookie(event, managerConfig.csrfCookieName),
    headerToken: getHeader(event, CSRF_HEADER_NAME),
  });
}

export function setManagerRememberCookie(
  event: H3Event,
  rememberToken: string
): void {
  setCookie(event, MANAGER_REMEMBER_COOKIE, rememberToken, {
    httpOnly: true,
    maxAge: 365 * 24 * 3600,
    path: "/api/managers/auth/restore",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearManagerRememberCookie(event: H3Event): void {
  deleteCookie(event, MANAGER_REMEMBER_COOKIE, {
    path: "/api/managers/auth/restore",
  });
}

export function getManagerRememberCookie(event: H3Event): string {
  const token = getCookie(event, MANAGER_REMEMBER_COOKIE);
  if (!token) {
    throw appError("SESSION_REVOKED");
  }
  return token;
}

export function requireManagerSession(event: H3Event) {
  validateManagerCsrf(event);
  return requireManagerAuth(event);
}

export function requireSuperAdminSession(event: H3Event) {
  validateManagerCsrf(event);
  requireRole(event, "super_admin");
  return requireManagerAuth(event);
}

export function respondToManagerAuthError(
  event: H3Event,
  error: unknown
): never {
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
