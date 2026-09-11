import {
  CSRF_HEADER_NAME,
  generateCsrfToken,
  getAuthNamespaceConfig,
  validateCsrfToken,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import { CsrfInvalidError, SessionRevokedError } from "@mindkid/errors/auth";
import { isAppError } from "@mindkid/errors/base";
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

export type AuthNamespace = "user" | "manager";
const CSRF_TOKEN = /^[0-9a-f]{64}$/;
const INTEGER_TEXT = /^\d+$/;
const ORIGIN_TRAILING_SLASH = /\/$/;

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

export function createAuthRuntime(namespace: AuthNamespace) {
  const config = getAuthNamespaceConfig(namespace);
  const rememberCookieName =
    namespace === "manager" ? "tm_m_remember" : "tm_u_remember";

  function ensureCsrfCookie(event: H3Event): string {
    const current = getCookie(event, config.csrfCookieName);
    if (current && CSRF_TOKEN.test(current)) {
      return current;
    }

    const token = generateCsrfToken();
    const response = event.node?.res;
    if (typeof response?.setHeader !== "function") {
      return token;
    }
    setCookie(event, config.csrfCookieName, token, {
      httpOnly: false,
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    return token;
  }

  function validateCsrf(event: H3Event): void {
    validateCsrfToken({
      method: event.method,
      cookieToken: getCookie(event, config.csrfCookieName),
      headerToken: getHeader(event, CSRF_HEADER_NAME),
    });
  }

  const sameSite =
    namespace === "manager" ? ("strict" as const) : ("lax" as const);

  function setRememberCookie(event: H3Event, rememberToken: string): void {
    setCookie(event, rememberCookieName, rememberToken, {
      httpOnly: true,
      maxAge: 365 * 24 * 3600,
      path: "/",
      sameSite,
      secure: process.env.NODE_ENV === "production",
    });
  }

  function clearRememberCookie(event: H3Event): void {
    deleteCookie(event, rememberCookieName, {
      path: "/",
    });
  }

  function getRememberCookie(event: H3Event): string {
    const token = getCookie(event, rememberCookieName);
    if (!token) {
      throw new SessionRevokedError();
    }
    return token;
  }

  function respondToAuthError(_event: H3Event, error: unknown): never {
    throw error;
  }

  return {
    ensureCsrfCookie,
    validateCsrf,
    setRememberCookie,
    clearRememberCookie,
    getRememberCookie,
    respondToAuthError,
  };
}
