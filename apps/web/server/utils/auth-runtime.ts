import {
  AppError,
  appError,
  CSRF_HEADER_NAME,
  generateCsrfToken,
  getAuthNamespaceConfig,
  RefreshService,
  type UserTokenPayload,
  validateCsrfToken,
} from "@kidthink/auth";
import { getAppSql, PostgresSessionStore } from "@kidthink/db";
import {
  createError,
  deleteCookie,
  getCookie,
  getHeader,
  type H3Event,
  setCookie,
  setResponseStatus,
} from "h3";

const config = getAuthNamespaceConfig("user");
const ACCESS_TTL_SECONDS = 15 * 60;
const CSRF_TOKEN = /^[0-9a-f]{64}$/;

export function getWebJwtSecret(event: H3Event): string {
  if (process.env.WEB_JWT_SECRET) {
    return process.env.WEB_JWT_SECRET;
  }
  try {
    // @ts-expect-error
    const cfg = globalThis.useRuntimeConfig
      ? globalThis.useRuntimeConfig(event)
      : null;
    if (cfg?.webJwtSecret) {
      return cfg.webJwtSecret;
    }
  } catch {
    // ignore
  }
  return "kidthink-dev-secret-kidthink-dev-secret-32bytes";
}

export function getUserRefreshService(event: H3Event): RefreshService {
  const webJwtSecret = getWebJwtSecret(event);
  return new RefreshService(new PostgresSessionStore(getAppSql()), {
    namespace: "user",
    jwtSecret: webJwtSecret,
    refreshTtlSeconds: config.refreshTtlSeconds,
  });
}

export function ensureUserCsrfCookie(event: H3Event): string {
  const current = getCookie(event, config.csrfCookieName);
  if (current && CSRF_TOKEN.test(current)) {
    return current;
  }

  const token = generateCsrfToken();
  setCookie(event, config.csrfCookieName, token, {
    httpOnly: false,
    maxAge: config.refreshTtlSeconds,
    path: "/",
    sameSite: "strict",
    secure: !import.meta.dev,
  });
  return token;
}

export function validateUserCsrf(event: H3Event): void {
  validateCsrfToken({
    method: event.method,
    cookieToken: getCookie(event, config.csrfCookieName),
    headerToken: getHeader(event, CSRF_HEADER_NAME),
  });
}

export function getActiveChildCandidate(event: H3Event): number | undefined {
  const raw = getCookie(event, "active_child_id");
  if (!raw) {
    return undefined;
  }
  const candidate = Number(raw);
  return Number.isInteger(candidate) && candidate > 0 ? candidate : undefined;
}

export function setUserAuthCookies(
  event: H3Event,
  accessJwt: string,
  refreshEnvelope: string
): void {
  if (event?.node?.res) {
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
    ensureUserCsrfCookie(event);
  }
}

export function clearUserAuthCookies(event: H3Event): void {
  deleteCookie(event, config.accessCookieName, { path: "/" });
  deleteCookie(event, config.refreshCookieName, {
    path: config.refreshPath,
  });
  deleteCookie(event, config.csrfCookieName, { path: "/" });
}

export function getUserRefreshCookie(event: H3Event): string {
  const token = getCookie(event, config.refreshCookieName);
  if (!token) {
    throw appError("SESSION_REVOKED");
  }
  return token;
}

export function assertUserSession(
  session: UserTokenPayload | { readonly manager_id: number }
): UserTokenPayload {
  if (!("user_id" in session)) {
    throw appError("UNAUTHENTICATED");
  }
  return session;
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
