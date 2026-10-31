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

let cachedAllowedOriginsRaw: string | undefined;
let cachedAllowedOriginsSet: Set<string> | undefined;

export function resolveAllowedOrigins(): Set<string> {
  const raw = process.env.NUXT_ALLOWED_ORIGINS ?? "";
  if (cachedAllowedOriginsSet && cachedAllowedOriginsRaw === raw) {
    return cachedAllowedOriginsSet;
  }
  const configured = requireEnv("NUXT_ALLOWED_ORIGINS")
    .split(",")
    .map((value) => value.trim().replace(ORIGIN_TRAILING_SLASH, ""))
    .filter(Boolean);
  cachedAllowedOriginsRaw = raw;
  cachedAllowedOriginsSet = new Set(configured);
  return cachedAllowedOriginsSet;
}

export function factoryIsAllowedApiOrigin(
  origin: string,
  requestHost: string
): boolean {
  const parsedOrigin = new URL(origin);
  if (parsedOrigin.host === requestHost) {
    return true;
  }

  const allowed = resolveAllowedOrigins();
  return allowed.has(parsedOrigin.origin);
}

export const DEFAULT_MAX_JSON_BODY_BYTES = 128 * 1024;

export function factoryAssertRequestBodySize(
  event: H3Event,
  maxBytes = DEFAULT_MAX_JSON_BODY_BYTES
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

export function factoryAssertPayloadSize(
  payload: object | string | number | boolean | null | undefined,
  maxBytes = DEFAULT_MAX_JSON_BODY_BYTES
): void {
  if (payload === null || payload === undefined) {
    return;
  }
  const size =
    typeof payload === "string"
      ? Buffer.byteLength(payload)
      : Buffer.byteLength(JSON.stringify(payload));
  if (size > maxBytes) {
    throw new PayloadTooLargeError();
  }
}

export function factoryAssertRateLimitAllowed(statusCode: number): void {
  if (statusCode === 200) {
    return;
  }
  throw statusCode === 429
    ? new RateLimitedError({ retry_after_s: 60 })
    : new ServiceUnavailableError();
}

export function factoryAssertSameOriginRequest(event: H3Event): void {
  const fetchSite = getHeader(event, "sec-fetch-site")?.toLowerCase();
  if (fetchSite === "cross-site") {
    throw new CsrfInvalidError();
  }

  const origin = getHeader(event, "origin");
  const host = getHeader(event, "host");
  if (
    process.env.NODE_ENV === "production" &&
    !(origin && host) &&
    fetchSite !== "same-origin" &&
    fetchSite !== "same-site"
  ) {
    throw new CsrfInvalidError();
  }
  if (!(origin && host)) {
    return;
  }
  try {
    if (!factoryIsAllowedApiOrigin(origin, host)) {
      throw new CsrfInvalidError();
    }
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw new CsrfInvalidError();
  }
}

type HeaderRawValue = number | string | readonly string[] | undefined;

function toHeaderList(value: HeaderRawValue): string[] {
  if (value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map(String);
  }
  return [String(value)];
}

function ensureResponseAppendHeader(response: {
  setHeader?: (name: string, value: string | string[]) => void;
  getHeader?: (name: string) => HeaderRawValue;
  appendHeader?: (name: string, value: string | readonly string[]) => void;
}): boolean {
  if (typeof response.setHeader !== "function") {
    return false;
  }
  if (typeof response.appendHeader === "function") {
    return true;
  }
  const setHeaderFn = response.setHeader.bind(response);
  const getHeaderFn = response.getHeader?.bind(response);
  response.appendHeader = (name: string, value: string | readonly string[]) => {
    const prev = getHeaderFn ? toHeaderList(getHeaderFn(name)) : [];
    const additions = toHeaderList(value);
    setHeaderFn(name, [...prev, ...additions]);
  };
  return true;
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
    const response = event.node?.res as
      | {
          setHeader?: (name: string, value: string | string[]) => void;
          getHeader?: (name: string) => HeaderRawValue;
          appendHeader?: (
            name: string,
            value: string | readonly string[]
          ) => void;
        }
      | undefined;
    if (!(response && ensureResponseAppendHeader(response))) {
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
    const response = event.node?.res as
      | {
          setHeader?: (name: string, value: string | string[]) => void;
          getHeader?: (name: string) => HeaderRawValue;
          appendHeader?: (
            name: string,
            value: string | readonly string[]
          ) => void;
        }
      | undefined;
    if (!(response && ensureResponseAppendHeader(response))) {
      return;
    }
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

  function respondToAuthError(_event: H3Event, error: Error): never {
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
