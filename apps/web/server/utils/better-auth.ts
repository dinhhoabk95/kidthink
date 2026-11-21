import {
  type AuthInstanceNamespace,
  createMindKidManagerAuth,
  createMindKidUserAuth,
  createRedisSecondaryStorage,
  getAuthRedisClient,
  type ManagerRole,
  type ManagerTokenPayload,
  type MindKidManagerAuth,
  type MindKidUserAuth,
  REAUTH_FRESH_AGE_SECONDS,
  type UserTokenPayload,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import {
  getOwnerDb,
  managerAccounts,
  managerPasskeys,
  managerSessions,
  managers,
  managerTwoFactors,
  managerVerifications,
  userAccounts,
  userPasskeys,
  userSessions,
  users,
  userTwoFactors,
  userVerifications,
} from "@mindkid/db";
import {
  InsufficientRoleError,
  UnauthenticatedError,
} from "@mindkid/errors/auth";
import { isAppError } from "@mindkid/errors/base";
import { ServiceUnavailableError } from "@mindkid/errors/common";
import { and, eq, ne, sql } from "drizzle-orm";
import type { H3Event } from "h3";
import { resolveAllowedOrigins } from "#server/utils/auth-runtime-factory";
import {
  buildManagerAuthCallbacks,
  buildUserAuthCallbacks,
  isServiceUnavailableErrorLike,
  validateSignupConsentMarkersImpl,
  withFailClosedRedis,
} from "#server/utils/better-auth-callbacks";

const SITE_TRAILING_SLASH_PATTERN = /\/$/;
const BEARER_AUTH_PATTERN = /^bearer\s+/i;

let userAuthInstance: MindKidUserAuth | undefined;
let managerAuthInstance: MindKidManagerAuth | undefined;

function getRootAuthSecret(): string {
  return requireEnv("NUXT_SESSION_PASSWORD");
}

function getSiteUrl(): string {
  return (process.env.SITE_URL?.trim() || "http://localhost:3000").replace(
    SITE_TRAILING_SLASH_PATTERN,
    ""
  );
}

function getTrustedOriginsList(): string[] {
  const origins = new Set<string>([getSiteUrl()]);
  for (const allowed of resolveAllowedOrigins()) {
    origins.add(allowed);
  }
  return Array.from(origins);
}

export function validateSignupConsentMarkers(input: {
  readonly termsRequirementAt: string | null;
  readonly privacyRequirementAt: string | null;
}): Promise<void> {
  return validateSignupConsentMarkersImpl(input);
}

function buildReauthRedisKey(
  namespace: AuthInstanceNamespace,
  sessionId: string
): string {
  return `ba:v1:${namespace}:reauth:${sessionId}`;
}

async function resolveReauthTimestamp(
  namespace: AuthInstanceNamespace,
  sessionId: string,
  createdAt: Date,
  dbReauthAt: Date | null | undefined
): Promise<Date | undefined> {
  const redisRaw = await withFailClosedRedis(() =>
    getAuthRedisClient().get(buildReauthRedisKey(namespace, sessionId))
  );
  if (redisRaw) {
    const parsed = new Date(redisRaw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  if (dbReauthAt && !Number.isNaN(dbReauthAt.getTime())) {
    return dbReauthAt;
  }
  return createdAt;
}

export function getUserAuth(): MindKidUserAuth {
  if (!userAuthInstance) {
    const db = getOwnerDb();
    const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
    const fbClientId = process.env.FACEBOOK_CLIENT_ID?.trim() ?? "";
    const fbClientSecret = process.env.FACEBOOK_CLIENT_SECRET?.trim() ?? "";

    userAuthInstance = createMindKidUserAuth({
      db,
      schema: {
        users,
        userAccounts,
        userSessions,
        userVerifications,
        userTwoFactors,
        userPasskeys,
      },
      redis: getAuthRedisClient(),
      rootSecret: getRootAuthSecret(),
      siteUrl: getSiteUrl(),
      trustedOrigins: getTrustedOriginsList(),
      isProduction: process.env.NODE_ENV === "production",
      oauth: {
        google:
          googleClientId && googleClientSecret
            ? { clientId: googleClientId, clientSecret: googleClientSecret }
            : undefined,
        facebook:
          fbClientId && fbClientSecret
            ? { clientId: fbClientId, clientSecret: fbClientSecret }
            : undefined,
      },
      callbacks: buildUserAuthCallbacks((sessionId, createdAt, dbReauthAt) =>
        resolveReauthTimestamp("user", sessionId, createdAt, dbReauthAt)
      ),
    });
  }
  return userAuthInstance;
}

export function getManagerAuth(): MindKidManagerAuth {
  if (!managerAuthInstance) {
    const db = getOwnerDb();
    managerAuthInstance = createMindKidManagerAuth({
      db,
      schema: {
        managers,
        managerAccounts,
        managerSessions,
        managerVerifications,
        managerTwoFactors,
        managerPasskeys,
      },
      redis: getAuthRedisClient(),
      rootSecret: getRootAuthSecret(),
      siteUrl: getSiteUrl(),
      trustedOrigins: getTrustedOriginsList(),
      isProduction: process.env.NODE_ENV === "production",
      callbacks: buildManagerAuthCallbacks(),
    });
  }
  return managerAuthInstance;
}

export function resetBetterAuthInstancesForTests(): void {
  userAuthInstance = undefined;
  managerAuthInstance = undefined;
}

export async function recordSessionReauthInStore(
  namespace: AuthInstanceNamespace,
  sessionId: string,
  now: Date
): Promise<void> {
  await withFailClosedRedis(() =>
    getAuthRedisClient().set(
      buildReauthRedisKey(namespace, sessionId),
      now.toISOString(),
      "EX",
      REAUTH_FRESH_AGE_SECONDS
    )
  );
  const numericSessionId = Number(sessionId);
  if (Number.isInteger(numericSessionId) && numericSessionId > 0) {
    const db = getOwnerDb();
    if (namespace === "user") {
      await db
        .update(userSessions)
        .set({ reauthAt: now, updatedAt: now })
        .where(eq(userSessions.id, numericSessionId));
    } else {
      await db
        .update(managerSessions)
        .set({ reauthAt: now, updatedAt: now })
        .where(eq(managerSessions.id, numericSessionId));
    }
  }
}

function extractRequestHeaders(event: H3Event): Headers | null {
  const candidate = (event as { headers?: Headers }).headers;
  if (candidate instanceof Headers) {
    return candidate;
  }
  const rawHeaders = event.node?.req?.headers;
  if (!rawHeaders) {
    return null;
  }
  const headers = new Headers();
  for (const [key, val] of Object.entries(rawHeaders)) {
    if (Array.isArray(val)) {
      headers.set(key, val.join("; "));
    } else if (typeof val === "string") {
      headers.set(key, val);
    }
  }
  return headers;
}

export async function resolveBetterAuthUserSession(
  event: H3Event
): Promise<UserTokenPayload | null> {
  if (event.context.manager) {
    return null;
  }
  if (event.context.user) {
    return event.context.user;
  }
  const headers = extractRequestHeaders(event);
  const authHeader = headers?.get("authorization");
  if (
    !headers?.get("cookie") ||
    (authHeader && BEARER_AUTH_PATTERN.test(authHeader))
  ) {
    return null;
  }

  try {
    const result = await getUserAuth().api.getSession({ headers });
    if (!(result?.session && result.user)) {
      return null;
    }
    const status = String(
      (result.user as { status?: string }).status ?? "active"
    );
    if (status === "suspended" || status === "deleted") {
      return null;
    }
    const sessionId = String(result.session.id);
    const createdAt = new Date(result.session.createdAt);
    const rawReauth = (result.session as { reauthAt?: Date | string | null })
      .reauthAt;
    const dbReauthAt = rawReauth ? new Date(rawReauth) : null;
    const reauthAt = await resolveReauthTimestamp(
      "user",
      sessionId,
      createdAt,
      dbReauthAt
    );

    const payload: UserTokenPayload = {
      user_id: Number(result.user.id),
      uuid: (result.user as { uuid?: string }).uuid,
      email: result.user.email,
      status,
      email_verified: Boolean(result.user.emailVerified),
      two_factor_enabled: Boolean(
        (result.user as { twoFactorEnabled?: boolean }).twoFactorEnabled
      ),
      display_name: result.user.name,
      session_id: sessionId,
      session_token: result.session.token,
      created_at: createdAt,
      reauth_at: reauthAt,
    };
    event.context.user = payload;
    return payload;
  } catch (err) {
    if (isServiceUnavailableErrorLike(err as Error)) {
      throw isAppError(err) ? err : new ServiceUnavailableError();
    }
    return null;
  }
}

export async function resolveBetterAuthManagerSession(
  event: H3Event
): Promise<ManagerTokenPayload | null> {
  if (event.context.user) {
    return null;
  }
  if (event.context.manager) {
    return event.context.manager;
  }
  const headers = extractRequestHeaders(event);
  const authHeader = headers?.get("authorization");
  if (
    !headers?.get("cookie") ||
    (authHeader && BEARER_AUTH_PATTERN.test(authHeader))
  ) {
    return null;
  }

  try {
    const result = await getManagerAuth().api.getSession({ headers });
    if (!(result?.session && result.user)) {
      return null;
    }
    const isActive = (result.user as { isActive?: boolean }).isActive ?? true;
    if (!isActive) {
      return null;
    }
    const sessionId = String(result.session.id);
    const createdAt = new Date(result.session.createdAt);
    const rawReauth = (result.session as { reauthAt?: Date | string | null })
      .reauthAt;
    const dbReauthAt = rawReauth ? new Date(rawReauth) : null;
    const reauthAt = await resolveReauthTimestamp(
      "manager",
      sessionId,
      createdAt,
      dbReauthAt
    );
    const rawRole = (result.user as { role?: string }).role;
    const role: ManagerRole =
      rawRole === "content_reviewer" ? "content_reviewer" : "super_admin";

    const payload: ManagerTokenPayload = {
      manager_id: Number(result.user.id),
      uuid: (result.user as { uuid?: string }).uuid,
      email: result.user.email,
      mfa_enabled: Boolean(
        (result.user as { twoFactorEnabled?: boolean }).twoFactorEnabled
      ),
      display_name: result.user.name,
      session_id: sessionId,
      session_token: result.session.token,
      role,
      created_at: createdAt,
      reauth_at: reauthAt,
    };
    event.context.manager = payload;
    return payload;
  } catch (err) {
    if (isServiceUnavailableErrorLike(err as Error)) {
      throw isAppError(err) ? err : new ServiceUnavailableError();
    }
    return null;
  }
}

export async function requireBetterAuthUser(
  event: H3Event
): Promise<UserTokenPayload> {
  if (event.context.manager) {
    throw new UnauthenticatedError();
  }
  const resolved = await resolveBetterAuthUserSession(event);
  if (!resolved) {
    throw new UnauthenticatedError();
  }
  return resolved;
}

export async function requireBetterAuthManager(
  event: H3Event
): Promise<ManagerTokenPayload> {
  if (event.context.user) {
    throw new UnauthenticatedError();
  }
  const resolved = await resolveBetterAuthManagerSession(event);
  if (!resolved) {
    throw new UnauthenticatedError();
  }
  return resolved;
}

export async function requireBetterAuthSuperAdmin(
  event: H3Event
): Promise<ManagerTokenPayload> {
  const manager = await requireBetterAuthManager(event);
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError();
  }
  return manager;
}

export async function revokeAllBetterAuthSessions(
  namespace: AuthInstanceNamespace,
  accountId: number,
  options?: { readonly incrementSessionVersion?: boolean }
): Promise<void> {
  const shouldIncrement = options?.incrementSessionVersion !== false;
  const db = getOwnerDb();
  const secondary = createRedisSecondaryStorage(
    getAuthRedisClient(),
    namespace
  );

  if (namespace === "user") {
    const rows = await db
      .select({ id: userSessions.id, token: userSessions.token })
      .from(userSessions)
      .where(eq(userSessions.userId, accountId));
    for (const row of rows) {
      await secondary.delete(row.token);
      await withFailClosedRedis(() =>
        getAuthRedisClient().del(buildReauthRedisKey("user", String(row.id)))
      );
    }
    await secondary.delete(`active-sessions-${accountId}`);
    await db.delete(userSessions).where(eq(userSessions.userId, accountId));
    if (shouldIncrement) {
      await db
        .update(users)
        .set({
          sessionVersion: sql`${users.sessionVersion} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, accountId));
    }
    return;
  }

  const rows = await db
    .select({ id: managerSessions.id, token: managerSessions.token })
    .from(managerSessions)
    .where(eq(managerSessions.userId, accountId));
  for (const row of rows) {
    await secondary.delete(row.token);
    await withFailClosedRedis(() =>
      getAuthRedisClient().del(buildReauthRedisKey("manager", String(row.id)))
    );
  }
  await secondary.delete(`active-sessions-${accountId}`);
  await db.delete(managerSessions).where(eq(managerSessions.userId, accountId));
  if (shouldIncrement) {
    await db
      .update(managers)
      .set({
        sessionVersion: sql`${managers.sessionVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(managers.id, accountId));
  }
}

export async function revokeOtherBetterAuthSessions(
  namespace: AuthInstanceNamespace,
  accountId: number,
  keepSessionId: string
): Promise<void> {
  const db = getOwnerDb();
  const secondary = createRedisSecondaryStorage(
    getAuthRedisClient(),
    namespace
  );
  const keepIdNum = Number(keepSessionId);

  if (namespace === "user") {
    const whereClause =
      Number.isInteger(keepIdNum) && keepIdNum > 0
        ? and(
            eq(userSessions.userId, accountId),
            ne(userSessions.id, keepIdNum)
          )
        : eq(userSessions.userId, accountId);
    const rows = await db
      .select({ id: userSessions.id, token: userSessions.token })
      .from(userSessions)
      .where(whereClause);
    for (const row of rows) {
      await secondary.delete(row.token);
      await withFailClosedRedis(() =>
        getAuthRedisClient().del(buildReauthRedisKey("user", String(row.id)))
      );
    }
    await db.delete(userSessions).where(whereClause);
    return;
  }

  const whereClause =
    Number.isInteger(keepIdNum) && keepIdNum > 0
      ? and(
          eq(managerSessions.userId, accountId),
          ne(managerSessions.id, keepIdNum)
        )
      : eq(managerSessions.userId, accountId);
  const rows = await db
    .select({ id: managerSessions.id, token: managerSessions.token })
    .from(managerSessions)
    .where(whereClause);
  for (const row of rows) {
    await secondary.delete(row.token);
    await withFailClosedRedis(() =>
      getAuthRedisClient().del(buildReauthRedisKey("manager", String(row.id)))
    );
  }
  await db.delete(managerSessions).where(whereClause);
}
