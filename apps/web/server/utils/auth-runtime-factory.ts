import { requireEnv } from "@mindkid/config";
import { CsrfInvalidError } from "@mindkid/errors/auth";
import { isAppError } from "@mindkid/errors/base";
import {
  PayloadTooLargeError,
  RateLimitedError,
  ServiceUnavailableError,
} from "@mindkid/errors/common";
import { getHeader, type H3Event } from "h3";

export type AuthNamespace = "user" | "manager";
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
