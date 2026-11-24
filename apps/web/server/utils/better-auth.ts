import {
  type AuthInstanceNamespace,
  createMindKidManagerAuth,
  createMindKidUserAuth,
  createRedisSecondaryStorage,
  decodeManagerRoleValue,
  decodeUserStatusValue,
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
  type DbExecutor,
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
import { UnauthenticatedError } from "@mindkid/errors/auth";
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
import { useOwnerRepositories } from "#server/utils/repositories";

const SITE_TRAILING_SLASH_PATTERN = /\/$/;

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
  return undefined;
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
      callbacks: buildUserAuthCallbacks(
        (sessionId, dbReauthAt) =>
          resolveReauthTimestamp("user", sessionId, dbReauthAt),
        {
          onPasswordReset: (userId) =>
            revokeAllBetterAuthSessions("user", userId),
          revokeOtherSessions: (userId, keepSessionToken) =>
            revokeOtherBetterAuthSessionsByToken(
              "user",
              userId,
              keepSessionToken
            ),
        }
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
      callbacks: buildManagerAuthCallbacks(
        (sessionId, dbReauthAt) =>
          resolveReauthTimestamp("manager", sessionId, dbReauthAt),
        {
          revokeOtherSessions: (managerId, keepSessionToken) =>
            revokeOtherBetterAuthSessionsByToken(
              "manager",
              managerId,
              keepSessionToken
            ),
        }
      ),
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
  if (!headers?.get("cookie")) {
    return null;
  }

  try {
    const result = await getUserAuth().api.getSession({ headers });
    if (!(result?.session && result.user)) {
      return null;
    }

    const repos = useOwnerRepositories();
    const liveUser = await repos.users.findForAuthById(Number(result.user.id));
    const cachedUuid = (result.user as { uuid?: string }).uuid;
    const cachedSessionVersion = (
      result.user as { sessionVersion?: number | string }
    ).sessionVersion;
    const liveStatus = liveUser ? decodeUserStatusValue(liveUser.status) : null;

    const isStaleOrInvalid =
      !liveUser ||
      (cachedUuid !== undefined && cachedUuid !== liveUser.uuid) ||
      (cachedSessionVersion !== undefined &&
        Number(cachedSessionVersion) !== liveUser.sessionVersion) ||
      liveStatus === "suspended" ||
      liveStatus === "deleted";

    if (isStaleOrInvalid) {
      const secondary = createRedisSecondaryStorage(
        getAuthRedisClient(),
        "user"
      );
      await secondary.delete(result.session.token);
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
      dbReauthAt
    );

    const payload: UserTokenPayload = {
      user_id: liveUser.id,
      uuid: liveUser.uuid,
      email: liveUser.email,
      status: liveStatus ?? "pending_verification",
      email_verified: Boolean(liveUser.emailVerified),
      two_factor_enabled: Boolean(liveUser.twoFactorEnabled),
      display_name: liveUser.displayName,
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
  if (!headers?.get("cookie")) {
    return null;
  }

  try {
    const result = await getManagerAuth().api.getSession({ headers });
    if (!(result?.session && result.user)) {
      return null;
    }

    const repos = useOwnerRepositories();
    const liveManager = await repos.managers.findStatusById(
      Number(result.user.id)
    );
    const cachedUuid = (result.user as { uuid?: string }).uuid;
    const cachedSessionVersion = (
      result.user as { sessionVersion?: number | string }
    ).sessionVersion;

    const isStaleOrInvalid =
      !liveManager ||
      (cachedUuid !== undefined && cachedUuid !== liveManager.uuid) ||
      (cachedSessionVersion !== undefined &&
        Number(cachedSessionVersion) !== liveManager.sessionVersion) ||
      !liveManager.isActive;

    if (isStaleOrInvalid) {
      const secondary = createRedisSecondaryStorage(
        getAuthRedisClient(),
        "manager"
      );
      await secondary.delete(result.session.token);
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
      dbReauthAt
    );
    const role: ManagerRole = decodeManagerRoleValue(liveManager.role);

    const payload: ManagerTokenPayload = {
      manager_id: liveManager.id,
      uuid: liveManager.uuid,
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

async function purgeSessionsFromStore(
  namespace: AuthInstanceNamespace,
  rows: readonly { readonly id: number; readonly token: string }[]
): Promise<void> {
  if (rows.length === 0) {
    return;
  }
  const redis = getAuthRedisClient();
  const secondary = createRedisSecondaryStorage(redis, namespace);
  for (const row of rows) {
    await secondary.delete(row.token);
    await withFailClosedRedis(() =>
      redis.del(buildReauthRedisKey(namespace, String(row.id)))
    );
  }
}

export async function revokeAllBetterAuthSessions(
  namespace: AuthInstanceNamespace,
  accountId: number,
  options?: {
    readonly tx?: DbExecutor;
    readonly incrementSessionVersion?: boolean;
  }
): Promise<void> {
  const shouldIncrement = options?.incrementSessionVersion !== false;
  const db = options?.tx ?? getOwnerDb();
  const secondary = createRedisSecondaryStorage(
    getAuthRedisClient(),
    namespace
  );

  if (namespace === "user") {
    const rows = await db
      .select({ id: userSessions.id, token: userSessions.token })
      .from(userSessions)
      .where(eq(userSessions.userId, accountId));
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
    await purgeSessionsFromStore("user", rows);
    await secondary.delete(`active-sessions-${accountId}`);
    return;
  }

  const rows = await db
    .select({ id: managerSessions.id, token: managerSessions.token })
    .from(managerSessions)
    .where(eq(managerSessions.userId, accountId));
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
  await purgeSessionsFromStore("manager", rows);
  await secondary.delete(`active-sessions-${accountId}`);
}

export async function revokeOtherBetterAuthSessions(
  namespace: AuthInstanceNamespace,
  accountId: number,
  keepSessionId: string
): Promise<void> {
  const db = getOwnerDb();
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
    await db.delete(userSessions).where(whereClause);
    await purgeSessionsFromStore("user", rows);
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
  await db.delete(managerSessions).where(whereClause);
  await purgeSessionsFromStore("manager", rows);
}

export async function revokeOtherBetterAuthSessionsByToken(
  namespace: AuthInstanceNamespace,
  accountId: number,
  keepSessionToken: string
): Promise<void> {
  const db = getOwnerDb();

  if (namespace === "user") {
    const whereClause = keepSessionToken
      ? and(
          eq(userSessions.userId, accountId),
          ne(userSessions.token, keepSessionToken)
        )
      : eq(userSessions.userId, accountId);
    const rows = await db
      .select({ id: userSessions.id, token: userSessions.token })
      .from(userSessions)
      .where(whereClause);
    await db.delete(userSessions).where(whereClause);
    await purgeSessionsFromStore("user", rows);
    return;
  }

  const whereClause = keepSessionToken
    ? and(
        eq(managerSessions.userId, accountId),
        ne(managerSessions.token, keepSessionToken)
      )
    : eq(managerSessions.userId, accountId);
  const rows = await db
    .select({ id: managerSessions.id, token: managerSessions.token })
    .from(managerSessions)
    .where(whereClause);
  await db.delete(managerSessions).where(whereClause);
  await purgeSessionsFromStore("manager", rows);
}
