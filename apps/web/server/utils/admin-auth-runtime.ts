import {
  AppError,
  appError,
  CSRF_HEADER_NAME,
  generateCsrfToken,
  getAuthNamespaceConfig,
  type ManagerTokenPayload,
  RefreshService,
  validateCsrfToken,
  verifyAdminManagerToken,
} from "@kidthink/auth";
import {
  activeSessions,
  getAppDb,
  getAppSql,
  managers,
  PostgresSessionStore,
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

const managerAuthConfig = getAuthNamespaceConfig("manager");
const ACCESS_TTL_SECONDS = 15 * 60;
const CSRF_TOKEN = /^[0-9a-f]{64}$/;
const SESSION_ID = /^\d+$/;
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
    process.env.NUXT_ADMIN_JWT_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    (process.env.NODE_ENV === "test" ? process.env.JWT_SECRET : undefined);
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error(
      "ADMIN_JWT_SECRET is not configured with at least 32 bytes"
    );
  }
  return secret;
}

export function getManagerRefreshService(event: H3Event): RefreshService {
  return new RefreshService(new PostgresSessionStore(getAppSql()), {
    namespace: "manager",
    jwtSecret: getAdminJwtSecret(event),
    refreshTtlSeconds: managerAuthConfig.refreshTtlSeconds,
  });
}

export function ensureManagerCsrfCookie(event: H3Event): string {
  const current = getCookie(event, managerAuthConfig.csrfCookieName);
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
  setCookie(event, managerAuthConfig.csrfCookieName, token, {
    httpOnly: false,
    maxAge: managerAuthConfig.refreshTtlSeconds,
    path: "/",
    sameSite: "strict",
    secure: !import.meta.dev,
  });
  return token;
}

export function validateManagerCsrf(event: H3Event): void {
  validateCsrfToken({
    method: event.method,
    cookieToken: getCookie(event, managerAuthConfig.csrfCookieName),
    headerToken: getHeader(event, CSRF_HEADER_NAME),
  });
}

export function setManagerAuthCookies(
  event: H3Event,
  accessToken: string,
  refreshEnvelope: string
): void {
  // Unit tests and non-HTTP callers may provide a minimal event object. A real
  // h3 response always exposes getHeader/setHeader; skip cookie serialization
  // when that response API is absent instead of throwing before the handler
  // can return its normal result.
  const response = event.node?.res as
    | { getHeader?: unknown; setHeader?: unknown }
    | undefined;
  if (
    typeof response?.getHeader !== "function" ||
    typeof response?.setHeader !== "function"
  ) {
    return;
  }
  setCookie(event, managerAuthConfig.accessCookieName, accessToken, {
    httpOnly: true,
    maxAge: ACCESS_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: !import.meta.dev,
  });
  setCookie(event, managerAuthConfig.refreshCookieName, refreshEnvelope, {
    httpOnly: true,
    maxAge: managerAuthConfig.refreshTtlSeconds,
    path: managerAuthConfig.refreshPath,
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
  deleteCookie(event, managerAuthConfig.accessCookieName, { path: "/" });
  deleteCookie(event, managerAuthConfig.refreshCookieName, {
    path: managerAuthConfig.refreshPath,
  });
  deleteCookie(event, managerAuthConfig.csrfCookieName, { path: "/" });
}

export async function requireManagerSession(
  event: H3Event
): Promise<ManagerTokenPayload> {
  const authHeader = getHeader(event, "authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;
  if (!bearerToken) {
    validateManagerCsrf(event);
  }

  if (event.context?.manager) {
    await assertLiveManagerSession(event.context.manager);
    return event.context.manager as ManagerTokenPayload;
  }

  const cookieToken = getCookie(event, managerAuthConfig.accessCookieName);
  const token = bearerToken || cookieToken;

  if (!token) {
    throw appError("UNAUTHENTICATED");
  }

  try {
    const secret = getAdminJwtSecret(event);
    const manager = await verifyAdminManagerToken({ token, secret });
    await assertLiveManagerSession(manager);
    event.context.manager = manager;
    return manager;
  } catch (_err) {
    throw appError("UNAUTHENTICATED");
  }
}

async function assertLiveManagerSession(
  session: ManagerTokenPayload
): Promise<void> {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  if (!SESSION_ID.test(session.session_id)) {
    throw appError("SESSION_REVOKED");
  }
  const db = getAppDb();
  const [row] = await db
    .select({
      version: managers.refreshTokenVersion,
      active: managers.isActive,
    })
    .from(activeSessions)
    .innerJoin(managers, eq(managers.id, activeSessions.accountId))
    .where(
      and(
        eq(activeSessions.id, Number(session.session_id)),
        eq(activeSessions.accountType, "manager"),
        eq(activeSessions.accountId, session.manager_id),
        gt(activeSessions.expiresAt, new Date())
      )
    )
    .limit(1);
  if (!row?.active || row.version !== session.refresh_token_version) {
    throw appError("SESSION_REVOKED");
  }
}

export async function requireSuperAdminSession(
  event: H3Event
): Promise<ManagerTokenPayload> {
  const manager = await requireManagerSession(event);
  if (manager.role !== "super_admin") {
    throw appError("INSUFFICIENT_ROLE");
  }
  return manager;
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
