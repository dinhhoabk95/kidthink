import { randomUUID } from "node:crypto";
import {
  AppError,
  appError,
  CSRF_HEADER_NAME,
  generateCsrfToken,
  getAuthNamespaceConfig,
  RefreshService,
  type UserTokenPayload,
  validateCsrfToken,
  verifyWebUserToken,
} from "@kidthink/auth";
import {
  activeSessions,
  getAppDb,
  getAppSql,
  PostgresSessionStore,
  users,
} from "@kidthink/db";
import { and, eq, gt } from "drizzle-orm";
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
const SESSION_ID = /^\d+$/;
const INTEGER_TEXT = /^\d+$/;
const CHILD_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getWebJwtSecret(_event: H3Event): string {
  // Nuxt exposes private runtimeConfig values through NUXT_* environment
  // variables in production. Keep the legacy name only for local tooling;
  // never fall back to a predictable source-controlled secret.
  const secret =
    process.env.NUXT_WEB_JWT_SECRET ||
    process.env.WEB_JWT_SECRET ||
    (process.env.NODE_ENV === "test" ? process.env.JWT_SECRET : undefined);
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error("WEB_JWT_SECRET is not configured with at least 32 bytes");
  }
  return secret;
}

export function getParentGateSecret(_event: H3Event): string {
  const secret =
    process.env.NUXT_PARENT_GATE_SECRET ||
    process.env.PARENT_GATE_SECRET ||
    (process.env.NODE_ENV === "test"
      ? process.env.PARENT_GATE_SECRET_TEST ||
        "kidthink-parent-gate-secret-key-default-2026"
      : undefined);
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error(
      "PARENT_GATE_SECRET is not configured with at least 32 bytes"
    );
  }
  return secret;
}

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

/** Reject browser cross-site requests before an auth cookie is issued. */
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

const DEVICE_ID = CHILD_UUID;

export function getOrSetGuestDeviceId(event: H3Event): string {
  const current = getCookie(event, "tm_did");
  if (current && DEVICE_ID.test(current)) {
    return current;
  }
  const deviceId = randomUUID();
  const response = event.node?.res as
    | { getHeader?: unknown; setHeader?: unknown }
    | undefined;
  if (
    typeof response?.getHeader !== "function" ||
    typeof response?.setHeader !== "function"
  ) {
    return deviceId;
  }
  setCookie(event, "tm_did", deviceId, {
    httpOnly: false,
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: !import.meta.dev,
  });
  return deviceId;
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

export function validateUserCsrf(event: H3Event): void {
  validateCsrfToken({
    method: event.method,
    cookieToken: getCookie(event, config.csrfCookieName),
    headerToken: getHeader(event, CSRF_HEADER_NAME),
  });
}

/** The cookie is a client-controlled UUID context, never a database id. */
export function getActiveChildUuid(event: H3Event): string | undefined {
  const raw = getCookie(event, "active_child_id");
  return raw && CHILD_UUID.test(raw) ? raw : undefined;
}

export function setUserAuthCookies(
  event: H3Event,
  accessJwt: string,
  refreshEnvelope: string
): void {
  const response = event.node?.res as
    | { getHeader?: unknown; setHeader?: unknown }
    | undefined;
  if (
    typeof response?.getHeader === "function" &&
    typeof response?.setHeader === "function"
  ) {
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
  const response = event.node?.res as
    | { getHeader?: unknown; setHeader?: unknown }
    | undefined;
  if (
    typeof response?.getHeader === "function" &&
    typeof response?.setHeader === "function"
  ) {
    deleteCookie(event, config.accessCookieName, { path: "/" });
    deleteCookie(event, config.refreshCookieName, {
      path: config.refreshPath,
    });
    deleteCookie(event, config.csrfCookieName, { path: "/" });
  }
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

export function assertUnrestrictedUser(userStatus: string): void {
  if (userStatus === "pending_verification") {
    throw appError("RESTRICTED_MODE");
  }
}

export async function requireWebUserSession(
  event: H3Event
): Promise<UserTokenPayload> {
  const authHeader = getHeader(event, "authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;
  // Bearer callers are not ambient-cookie callers. Cookie-authenticated
  // mutations must satisfy the double-submit CSRF check.
  if (!bearerToken) {
    validateUserCsrf(event);
  }

  if (event.context?.user) {
    await assertLiveWebSession(event.context.user);
    return event.context.user;
  }

  const cookieToken = getCookie(event, config.accessCookieName);
  const token = bearerToken || cookieToken;

  if (!token) {
    throw appError("UNAUTHENTICATED");
  }

  const secret = getWebJwtSecret(event);
  const session = await verifyWebUserToken({ token, secret });
  await assertLiveWebSession(session);
  return session;
}

async function assertLiveWebSession(session: UserTokenPayload): Promise<void> {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  if (!SESSION_ID.test(session.session_id)) {
    throw appError("SESSION_REVOKED");
  }
  const db = getAppDb();
  const [row] = await db
    .select({
      sessionId: activeSessions.id,
      version: users.refreshTokenVersion,
      status: users.status,
    })
    .from(activeSessions)
    .innerJoin(users, eq(users.id, activeSessions.accountId))
    .where(
      and(
        eq(activeSessions.id, Number(session.session_id)),
        eq(activeSessions.accountType, "user"),
        eq(activeSessions.accountId, session.user_id),
        gt(activeSessions.expiresAt, new Date())
      )
    )
    .limit(1);
  if (
    row?.status !== "active" ||
    row.version !== session.refresh_token_version
  ) {
    throw appError("SESSION_REVOKED");
  }
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
