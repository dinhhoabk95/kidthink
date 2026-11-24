import { writeAudit } from "@mindkid/audit";
import {
  type ManagerAuthCallbacks,
  type ReauthMethod,
  type UserAuthCallbacks,
  verifyReauthWindow,
} from "@mindkid/auth";
import {
  assertNoOAuthProviderTokens,
  CONSENT_ACTION,
  CONSENT_TYPE,
  CONSENT_TYPE_CODEC,
  USER_STATUS_CODEC,
} from "@mindkid/db";
import { ConsentRequirementChangedError } from "@mindkid/errors/account";
import { isAppError } from "@mindkid/errors/base";
import { ServiceUnavailableError } from "@mindkid/errors/common";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { enforceTwoAxisRateLimit as sharedEnforceTwoAxisRateLimit } from "@mindkid/shared";
import { factoryAssertRateLimitAllowed as assertRateLimitAllowed } from "#server/utils/auth-runtime-factory";
import { useOwnerRepositories } from "#server/utils/repositories";

function resolveRateLimitRouteClass(
  routeClass: string
): "auth:register" | "auth:forgot-password" | "auth:login" | "auth:mfa" {
  if (routeClass === "auth:register") {
    return "auth:register";
  }
  if (routeClass === "auth:mfa") {
    return "auth:mfa";
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
  const repos = useOwnerRepositories();
  const rows = await repos.consents.getRequirements([
    CONSENT_TYPE.TERMS,
    CONSENT_TYPE.PRIVACY,
  ]);

  for (const row of rows) {
    const dbIso = row.reconsentRequiredAt
      ? row.reconsentRequiredAt.toISOString()
      : null;
    const clientIso =
      row.consentType === CONSENT_TYPE.TERMS
        ? input.termsRequirementAt
        : input.privacyRequirementAt;

    if (dbIso !== (clientIso ?? null)) {
      throw new ConsentRequirementChangedError({
        consent_type: CONSENT_TYPE_CODEC.toLabel(row.consentType),
        requirement_at: dbIso,
      });
    }
  }
}

async function resolveAvailableUserReauthMethods(
  userId: number
): Promise<ReauthMethod[]> {
  const repos = useOwnerRepositories();
  const [userRow, credAccount] = await Promise.all([
    repos.users.findForAuthById(userId),
    repos.authAccounts.findUserCredentialAccountForAuth(userId),
  ]);

  const methods: ReauthMethod[] = [];
  const hasCredential = Boolean(userRow?.passwordHash || credAccount?.password);
  if (hasCredential) {
    methods.push("password");
  }
  if (userRow?.twoFactorEnabled) {
    methods.push("totp");
  }
  return methods.length > 0 ? methods : ["password"];
}

async function resolveAvailableManagerReauthMethods(
  managerId: number
): Promise<ReauthMethod[]> {
  const repos = useOwnerRepositories();
  const managerRow = await repos.managers.findForAuthById(managerId);
  const methods: ReauthMethod[] = ["password"];
  if (managerRow?.mfaEnabled) {
    methods.push("totp");
  }
  return methods;
}

export type ResolveReauthTimestampFn = (
  sessionId: string,
  dbReauthAt: Date | null | undefined
) => Promise<Date | undefined>;

export interface UserAuthCallbackHandlers {
  readonly onPasswordReset?: (userId: number) => Promise<void>;
  readonly revokeOtherSessions?: (
    userId: number,
    keepSessionToken: string
  ) => Promise<void>;
}

export interface ManagerAuthCallbackHandlers {
  readonly revokeOtherSessions?: (
    managerId: number,
    keepSessionToken: string
  ) => Promise<void>;
}

export function buildUserAuthCallbacks(
  resolveReauth: ResolveReauthTimestampFn,
  handlers?: UserAuthCallbackHandlers
): UserAuthCallbacks {
  return {
    sendVerificationEmail: async ({ user, url, token }) => {
      await dispatchTransactionalEmail({
        recipientType: "user",
        recipientId: Number(user.id),
        code: "email_verification",
        to: user.email,
        payload: { display_name: user.name },
        secrets: { url, verify_url: url, token },
      });
    },
    sendResetPassword: async ({ user, url, token }) => {
      await dispatchTransactionalEmail({
        recipientType: "user",
        recipientId: Number(user.id),
        code: "password_reset",
        to: user.email,
        payload: { display_name: user.name },
        secrets: { url, reset_url: url, token },
      });
    },
    onEmailVerified: async (userId) => {
      const repos = useOwnerRepositories();
      await repos.users.markEmailVerifiedIfPending(userId, new Date());
    },
    getUserStatusByEmail: async (email) => {
      const repos = useOwnerRepositories();
      const row = await repos.users.findForAuthByEmail(email);
      if (!row) {
        return null;
      }
      const cred = await repos.authAccounts.findUserCredentialAccountForAuth(
        row.id
      );
      return {
        id: row.id,
        uuid: row.uuid,
        status: USER_STATUS_CODEC.toLabel(row.status),
        purgeAt: row.purgeAt,
        hasPassword: Boolean(cred?.password || row.passwordHash),
        sessionVersion: row.sessionVersion,
        twoFactorEnabled: row.twoFactorEnabled,
      };
    },
    getUserStatusById: async (userId) => {
      const repos = useOwnerRepositories();
      const row = await repos.users.findForAuthById(userId);
      if (!row) {
        return null;
      }
      return {
        id: row.id,
        uuid: row.uuid,
        status: USER_STATUS_CODEC.toLabel(row.status),
        purgeAt: row.purgeAt,
        hasPassword: Boolean(row.passwordHash),
        sessionVersion: row.sessionVersion,
        twoFactorEnabled: row.twoFactorEnabled,
      };
    },
    validateConsentMarkers: validateSignupConsentMarkersImpl,
    recordInitialConsents: async ({ userId, ipAddress, userAgent }) => {
      const repos = useOwnerRepositories();
      await repos.consents.recordBatchConsents([
        {
          userId,
          consentType: CONSENT_TYPE.TERMS,
          action: CONSENT_ACTION.ACCEPTED,
          ipAddress,
          userAgent,
        },
        {
          userId,
          consentType: CONSENT_TYPE.PRIVACY,
          action: CONSENT_ACTION.ACCEPTED,
          ipAddress,
          userAgent,
        },
      ]);
    },
    mirrorCredentialPassword: async (userId, passwordHash) => {
      const repos = useOwnerRepositories();
      await repos.users.updatePasswordHash(userId, passwordHash);
    },
    countUserLoginMethods: async (userId) => {
      const repos = useOwnerRepositories();
      return await repos.authAccounts.countUserLoginMethods(userId);
    },
    verifySessionReauth: async ({ userId, sessionId, dbReauthAt }) => {
      let resolvedDbReauth = dbReauthAt;
      const numericId = Number(sessionId);
      if (Number.isInteger(numericId) && numericId > 0) {
        const repos = useOwnerRepositories();
        const sessReauthAt = await repos.users.getSessionReauthAt(numericId);
        if (sessReauthAt) {
          resolvedDbReauth = sessReauthAt;
        }
      }
      const reauthAt = await resolveReauth(sessionId, resolvedDbReauth);
      const methods = await resolveAvailableUserReauthMethods(userId);
      verifyReauthWindow(reauthAt, methods);
    },
    assertNoOAuthTokens: assertNoOAuthProviderTokens,
    enforceRateLimit: async ({
      routeClass,
      ipAddress,
      identifier,
      skipIpCheck,
    }) => {
      const res = await sharedEnforceTwoAxisRateLimit({
        routeClass: resolveRateLimitRouteClass(routeClass),
        remoteIp: ipAddress,
        accountIdentifier: identifier,
        skipIpCheck,
      });
      assertRateLimitAllowed(res.statusCode);
    },
    revokeOtherSessions: handlers?.revokeOtherSessions,
    onPasswordReset: handlers?.onPasswordReset,
  };
}

export function buildManagerAuthCallbacks(
  resolveReauth: ResolveReauthTimestampFn,
  handlers?: ManagerAuthCallbackHandlers
): ManagerAuthCallbacks {
  return {
    getManagerStatusByEmail: async (email) => {
      const repos = useOwnerRepositories();
      const row = await repos.managers.findStatusByEmail(email);
      if (!row) {
        return null;
      }
      return {
        id: row.id,
        uuid: row.uuid,
        isActive: row.isActive,
        role: row.role,
        sessionVersion: row.sessionVersion,
      };
    },
    getManagerStatusById: async (managerId) => {
      const repos = useOwnerRepositories();
      const row = await repos.managers.findStatusById(managerId);
      if (!row) {
        return null;
      }
      return {
        id: row.id,
        uuid: row.uuid,
        isActive: row.isActive,
        role: row.role,
        sessionVersion: row.sessionVersion,
      };
    },
    mirrorCredentialPassword: async (managerId, passwordHash) => {
      const repos = useOwnerRepositories();
      await repos.managers.updatePasswordHash(managerId, passwordHash);
    },
    recordManagerAudit: async ({
      action,
      managerId,
      ipAddress,
      userAgent,
      metadata,
    }) => {
      const repos = useOwnerRepositories();
      await repos.auditLogs.transaction(async (tx) => {
        await writeAudit(tx, {
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
      });
    },
    enforceRateLimit: async ({
      routeClass,
      ipAddress,
      identifier,
      skipIpCheck,
    }) => {
      const res = await sharedEnforceTwoAxisRateLimit({
        routeClass: resolveRateLimitRouteClass(routeClass),
        remoteIp: ipAddress,
        accountIdentifier: identifier,
        skipIpCheck,
      });
      assertRateLimitAllowed(res.statusCode);
    },
    verifySessionReauth: async ({ managerId, sessionId, dbReauthAt }) => {
      let resolvedDbReauth = dbReauthAt;
      const numericId = Number(sessionId);
      if (Number.isInteger(numericId) && numericId > 0) {
        const repos = useOwnerRepositories();
        const sessReauthAt = await repos.managers.getSessionReauthAt(numericId);
        if (sessReauthAt) {
          resolvedDbReauth = sessReauthAt;
        }
      }
      const reauthAt = await resolveReauth(sessionId, resolvedDbReauth);
      const methods = await resolveAvailableManagerReauthMethods(managerId);
      verifyReauthWindow(reauthAt, methods);
    },
    revokeOtherSessions: handlers?.revokeOtherSessions,
  };
}
