import { writeAudit } from "@mindkid/audit";
import {
  type ManagerAuthCallbacks,
  type ReauthMethod,
  type UserAuthCallbacks,
  verifyReauthWindow,
} from "@mindkid/auth";
import {
  assertNoOAuthProviderTokens,
  consentLogs,
  consentRequirements,
  getOwnerDb,
  managers,
  userAccounts,
  userPasskeys,
  userSessions,
  users,
} from "@mindkid/db";
import { ConsentRequirementChangedError } from "@mindkid/errors/account";
import { isAppError } from "@mindkid/errors/base";
import { ServiceUnavailableError } from "@mindkid/errors/common";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { enforceTwoAxisRateLimit as sharedEnforceTwoAxisRateLimit } from "@mindkid/shared";
import { and, count, eq, inArray } from "drizzle-orm";
import { factoryAssertRateLimitAllowed as assertRateLimitAllowed } from "#server/utils/auth-runtime-factory";

function resolveRateLimitRouteClass(
  routeClass: string
): "auth:register" | "auth:forgot-password" | "auth:login" {
  if (routeClass === "auth:register") {
    return "auth:register";
  }
  if (
    routeClass === "auth:forgot-password" ||
    routeClass === "auth:password-reset"
  ) {
    return "auth:forgot-password";
  }
  return "auth:login";
}

export function isServiceUnavailableErrorLike(
  err: Error | object | string | null
): boolean {
  if (isAppError(err) && err.status === 503) {
    return true;
  }
  if (err && typeof err === "object") {
    const candidate = err as {
      statusCode?: number;
      status?: number | string;
    };
    if (
      candidate.statusCode === 503 ||
      candidate.status === 503 ||
      candidate.status === "SERVICE_UNAVAILABLE"
    ) {
      return true;
    }
  }
  return false;
}

export async function withFailClosedRedis<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isAppError(err)) {
      throw err;
    }
    throw new ServiceUnavailableError();
  }
}

export async function validateSignupConsentMarkersImpl(input: {
  readonly termsRequirementAt: string | null;
  readonly privacyRequirementAt: string | null;
}): Promise<void> {
  const db = getOwnerDb();
  const rows = await db
    .select()
    .from(consentRequirements)
    .where(inArray(consentRequirements.consentType, ["terms", "privacy"]));

  for (const row of rows) {
    const dbIso = row.reconsentRequiredAt
      ? row.reconsentRequiredAt.toISOString()
      : null;
    const clientIso =
      row.consentType === "terms"
        ? input.termsRequirementAt
        : input.privacyRequirementAt;

    if (dbIso !== (clientIso ?? null)) {
      throw new ConsentRequirementChangedError({
        consent_type: row.consentType,
        requirement_at: dbIso,
      });
    }
  }
}

async function resolveAvailableUserReauthMethods(
  userId: number
): Promise<ReauthMethod[]> {
  const db = getOwnerDb();
  const [userRow] = await db
    .select({
      passwordHash: users.passwordHash,
      twoFactorEnabled: users.twoFactorEnabled,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const accounts = await db
    .select({
      providerId: userAccounts.providerId,
      password: userAccounts.password,
    })
    .from(userAccounts)
    .where(eq(userAccounts.userId, userId));

  const methods: ReauthMethod[] = [];
  const hasCredential = Boolean(
    userRow?.passwordHash ||
      accounts.some(
        (acc) => acc.providerId === "credential" && Boolean(acc.password)
      )
  );
  if (hasCredential) {
    methods.push("password");
  }
  if (userRow?.twoFactorEnabled) {
    methods.push("totp");
  }
  if (accounts.some((acc) => acc.providerId !== "credential")) {
    methods.push("social");
  }
  return methods.length > 0 ? methods : ["password"];
}

export function buildUserAuthCallbacks(
  resolveReauth: (
    sessionId: string,
    createdAt: Date,
    dbReauthAt: Date | null | undefined
  ) => Promise<Date | undefined>
): UserAuthCallbacks {
  const db = getOwnerDb();
  return {
    sendVerificationEmail: async ({ user, url, token }) => {
      await dispatchTransactionalEmail({
        recipientType: "user",
        recipientId: Number(user.id),
        code: "email_verification",
        to: user.email,
        payload: { display_name: user.name, verify_url: url, token },
      });
    },
    sendResetPassword: async ({ user, url, token }) => {
      await dispatchTransactionalEmail({
        recipientType: "user",
        recipientId: Number(user.id),
        code: "password_reset",
        to: user.email,
        payload: { display_name: user.name, reset_url: url, token },
      });
    },
    sendChangeEmailVerification: async ({ user, newEmail, url, token }) => {
      await dispatchTransactionalEmail({
        recipientType: "user",
        recipientId: Number(user.id),
        code: "email_change_verification",
        to: newEmail,
        payload: { display_name: user.name, verify_url: url, token },
      });
    },
    onEmailVerified: async (userId) => {
      const now = new Date();
      await db
        .update(users)
        .set({
          status: "active",
          emailVerified: true,
          emailVerifiedAt: now,
          updatedAt: now,
        })
        .where(
          and(eq(users.id, userId), eq(users.status, "pending_verification"))
        );
    },
    getUserStatusByEmail: async (email) => {
      const [row] = await db
        .select({
          id: users.id,
          status: users.status,
          purgeAt: users.purgeAt,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (!row) {
        return null;
      }
      const [cred] = await db
        .select({ password: userAccounts.password })
        .from(userAccounts)
        .where(
          and(
            eq(userAccounts.userId, row.id),
            eq(userAccounts.providerId, "credential")
          )
        )
        .limit(1);
      return {
        id: row.id,
        status: row.status,
        purgeAt: row.purgeAt,
        hasPassword: Boolean(cred?.password || row.passwordHash),
      };
    },
    getUserStatusById: async (userId) => {
      const [row] = await db
        .select({
          id: users.id,
          status: users.status,
          purgeAt: users.purgeAt,
          passwordHash: users.passwordHash,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (!row) {
        return null;
      }
      return {
        id: row.id,
        status: row.status,
        purgeAt: row.purgeAt,
        hasPassword: Boolean(row.passwordHash),
      };
    },
    validateConsentMarkers: validateSignupConsentMarkersImpl,
    recordInitialConsents: async ({ userId, ipAddress, userAgent }) => {
      await db.insert(consentLogs).values([
        {
          userId,
          consentType: "terms",
          action: "accepted",
          ipAddress,
          userAgent,
        },
        {
          userId,
          consentType: "privacy",
          action: "accepted",
          ipAddress,
          userAgent,
        },
      ]);
    },
    mirrorCredentialPassword: async (userId, passwordHash) => {
      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, userId));
    },
    countUserLoginMethods: async (userId) => {
      const [accCountRow] = await db
        .select({ cnt: count(userAccounts.id) })
        .from(userAccounts)
        .where(eq(userAccounts.userId, userId));
      const [pkCountRow] = await db
        .select({ cnt: count(userPasskeys.id) })
        .from(userPasskeys)
        .where(eq(userPasskeys.userId, userId));
      return Number(accCountRow?.cnt ?? 0) + Number(pkCountRow?.cnt ?? 0);
    },
    verifySessionReauth: async ({
      userId,
      sessionId,
      createdAt,
      dbReauthAt,
    }) => {
      let resolvedDbReauth = dbReauthAt;
      const numericId = Number(sessionId);
      if (Number.isInteger(numericId) && numericId > 0) {
        const [sessRow] = await db
          .select({ reauthAt: userSessions.reauthAt })
          .from(userSessions)
          .where(eq(userSessions.id, numericId))
          .limit(1);
        if (sessRow?.reauthAt) {
          resolvedDbReauth = sessRow.reauthAt;
        }
      }
      const reauthAt = await resolveReauth(
        sessionId,
        createdAt,
        resolvedDbReauth
      );
      const methods = await resolveAvailableUserReauthMethods(userId);
      verifyReauthWindow(reauthAt, methods);
    },
    assertNoOAuthTokens: assertNoOAuthProviderTokens,
    enforceRateLimit: async ({ routeClass, ipAddress, identifier }) => {
      const res = await sharedEnforceTwoAxisRateLimit({
        routeClass: resolveRateLimitRouteClass(routeClass),
        remoteIp: ipAddress,
        accountIdentifier: identifier,
      });
      assertRateLimitAllowed(res.statusCode);
    },
  };
}

export function buildManagerAuthCallbacks(): ManagerAuthCallbacks {
  const db = getOwnerDb();
  return {
    getManagerStatusByEmail: async (email) => {
      const [row] = await db
        .select({
          id: managers.id,
          isActive: managers.isActive,
          role: managers.role,
        })
        .from(managers)
        .where(eq(managers.email, email))
        .limit(1);
      return row ?? null;
    },
    getManagerStatusById: async (managerId) => {
      const [row] = await db
        .select({
          id: managers.id,
          isActive: managers.isActive,
          role: managers.role,
        })
        .from(managers)
        .where(eq(managers.id, managerId))
        .limit(1);
      return row ?? null;
    },
    mirrorCredentialPassword: async (managerId, passwordHash) => {
      await db
        .update(managers)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(managers.id, managerId));
    },
    recordManagerAudit: async ({
      action,
      managerId,
      ipAddress,
      userAgent,
      metadata,
    }) => {
      await writeAudit(db, {
        actor_type: managerId ? "manager" : "system",
        actor_id: managerId ?? undefined,
        action,
        entity_type: "manager",
        entity_id: managerId
          ? String(managerId)
          : (metadata?.email ?? "unknown"),
        after_data: metadata ? { email: metadata.email } : undefined,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    },
    enforceRateLimit: async ({ ipAddress, identifier }) => {
      const res = await sharedEnforceTwoAxisRateLimit({
        routeClass: "auth:login",
        remoteIp: ipAddress,
        accountIdentifier: identifier,
      });
      assertRateLimitAllowed(res.statusCode);
    },
  };
}
