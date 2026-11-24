import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import { type BetterAuthPlugin, betterAuth } from "better-auth";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
  isAPIError,
} from "better-auth/api";
import { deleteSessionCookie } from "better-auth/cookies";
import { twoFactor } from "better-auth/plugins";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import {
  runBetterAuthCallback,
  wrapSecondaryStorageForBetterAuth,
} from "./better-auth-error.js";
import { DB_AUTH_METHOD, DB_MANAGER_ROLE } from "./enum-values.js";
import { deriveInstanceSecret } from "./hmac-secret.js";
import {
  MFA_LOCK_SECONDS,
  MFA_MAX_FAILURES,
  MfaAttemptGuard,
} from "./mfa-lockout.js";
import {
  getDummyPasswordHash,
  hashPassword,
  verifyPassword,
} from "./password.js";
import {
  createRedisSecondaryStorage,
  type MinimalRedisClient,
} from "./redis-secondary-storage.js";
import {
  alignNewSessionCookies,
  clearPending2faAccountByCookie,
  computeSessionReauthAt,
  consumePending2faRemember,
  enforcePasskeyMutationBeforeHook,
  enforceTotpStepUpForSensitiveMfaAction,
  handleTwoFactorVerifyBeforeHook,
  issueTwoFactorChallengeAndRevokeSession,
  readCookieFromHeader,
  resolvePendingTwoFactorAccountId,
  revokeOtherInstanceSessions,
  setPending2faRemember,
} from "./user-auth-helpers.js";
import {
  REAUTH_FRESH_AGE_SECONDS,
  REMEMBER_MAX_TTL_SECONDS,
  SESSION_DEFAULT_TTL_SECONDS,
} from "./user-better-auth.js";

export interface ManagerAuthSchemaTables {
  readonly managers: SQLiteTable;
  readonly managerAccounts: SQLiteTable;
  readonly managerSessions: SQLiteTable;
  readonly managerVerifications: SQLiteTable;
  readonly managerTwoFactors: SQLiteTable;
  readonly managerPasskeys: SQLiteTable;
}

export interface ManagerStatusSnapshot {
  readonly id: number;
  readonly uuid?: string;
  readonly isActive: boolean;
  readonly role: string | number;
  readonly sessionVersion?: number;
  readonly mfaEnabled?: boolean;
}

export type ManagerAuditAction =
  | "manager_login"
  | "manager_login_failed"
  | "manager_mfa_failed";

export interface ManagerAuthCallbacks {
  readonly getManagerStatusByEmail?: (
    email: string
  ) => Promise<ManagerStatusSnapshot | null>;
  readonly getManagerStatusById?: (
    managerId: number
  ) => Promise<ManagerStatusSnapshot | null>;
  readonly mirrorCredentialPassword?: (
    managerId: number,
    passwordHash: string
  ) => Promise<void>;
  readonly recordManagerAudit?: (input: {
    readonly action: ManagerAuditAction;
    readonly managerId: number | null;
    readonly ipAddress: string;
    readonly userAgent: string;
    readonly metadata?: { readonly email?: string };
  }) => Promise<void>;
  readonly enforceRateLimit?: (input: {
    readonly routeClass: string;
    readonly ipAddress: string;
    readonly identifier?: string;
  }) => Promise<void>;
  readonly verifySessionReauth?: (input: {
    readonly managerId: number;
    readonly sessionId: string;
    readonly createdAt: Date;
    readonly dbReauthAt: Date | null;
  }) => Promise<void>;
  readonly revokeOtherSessions?: (
    managerId: number,
    keepSessionToken: string
  ) => Promise<void>;
}

export interface CreateMindKidManagerAuthDeps {
  readonly db: Parameters<typeof drizzleAdapter>[0];
  readonly schema: ManagerAuthSchemaTables;
  readonly redis: MinimalRedisClient;
  readonly rootSecret: string;
  readonly siteUrl: string;
  readonly trustedOrigins: readonly string[];
  readonly isProduction: boolean;
  readonly rpId?: string;
  readonly callbacks?: ManagerAuthCallbacks;
}

interface ManagerSignInBody {
  email?: string;
  password?: string;
  rememberMe?: boolean;
  callbackURL?: string;
}

function extractIp(headers: Headers | undefined): string {
  const realIp = headers?.get("x-real-ip")?.trim();
  return realIp && realIp.length > 0 ? realIp : "127.0.0.1";
}

function extractUa(headers: Headers | undefined): string {
  return headers?.get("user-agent")?.trim() || "MindKid Admin Browser";
}

function hasDontRememberManagerCookie(headers: Headers | undefined): boolean {
  return Boolean(
    readCookieFromHeader(headers, "mindkid-manager.dont_remember") ||
      readCookieFromHeader(headers, "__Secure-mindkid-manager.dont_remember")
  );
}

function sanitizeManagerAccountTokens<T extends object>(
  account: T
): Promise<{ data: T }> {
  const sanitized = {
    ...account,
    accessToken: null as string | undefined | null,
    refreshToken: null as string | undefined | null,
    idToken: null as string | undefined | null,
    accessTokenExpiresAt: null as Date | undefined | null,
    refreshTokenExpiresAt: null as Date | undefined | null,
  };
  return Promise.resolve({ data: sanitized as T });
}

async function resolveManagerIsRemembered(
  pathStr: string,
  userId: string,
  body: { rememberMe?: boolean } | null,
  headers: Headers | undefined,
  redis: MinimalRedisClient
): Promise<boolean> {
  if (pathStr === "/sign-in/email") {
    return body?.rememberMe === true;
  }
  if (!pathStr.startsWith("/two-factor/")) {
    return false;
  }
  const stored = await consumePending2faRemember(redis, "manager", userId);
  if (stored !== undefined) {
    return stored;
  }
  if (typeof body?.rememberMe === "boolean") {
    return body.rememberMe;
  }
  return !hasDontRememberManagerCookie(headers);
}

async function handleManagerSignInBefore(
  body: ManagerSignInBody,
  ipAddress: string,
  userAgent: string,
  callbacks: ManagerAuthCallbacks | undefined,
  redis: MinimalRedisClient
) {
  const email = (body.email ?? "").trim().toLowerCase();
  await runBetterAuthCallback(async () => {
    await callbacks?.enforceRateLimit?.({
      routeClass: "auth:login",
      ipAddress,
      identifier: email ? `manager:${email}` : undefined,
    });
  });
  const normalizedRemember = body.rememberMe === true;

  if (email && callbacks?.getManagerStatusByEmail) {
    const getByEmail = callbacks.getManagerStatusByEmail;
    const snapshot = await runBetterAuthCallback(() => getByEmail(email));
    if (!snapshot) {
      await verifyPassword(body.password ?? "", getDummyPasswordHash());
      await runBetterAuthCallback(async () => {
        await callbacks.recordManagerAudit?.({
          action: "manager_login_failed",
          managerId: null,
          ipAddress,
          userAgent,
          metadata: { email },
        });
      });
      throw new APIError("UNAUTHORIZED", {
        code: "INVALID_CREDENTIALS",
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }
    if (!snapshot.isActive) {
      throw new APIError("FORBIDDEN", {
        code: "ACCOUNT_SUSPENDED",
        message: "Tài khoản quản trị đang ngừng hoạt động.",
      });
    }
    await setPending2faRemember(
      redis,
      "manager",
      String(snapshot.id),
      normalizedRemember
    );
  }

  return {
    context: {
      body: {
        ...body,
        rememberMe: normalizedRemember,
      },
    },
  };
}

async function shouldInvalidateManagerGetSession(
  returned: {
    user?: {
      id?: string | number;
      isActive?: boolean;
      uuid?: string;
      sessionVersion?: number | string;
    };
  } | null,
  callbacks: ManagerAuthCallbacks | undefined
): Promise<boolean> {
  if (!returned || isAPIError(returned) || !returned.user) {
    return false;
  }
  let activeFlag = returned.user.isActive !== false;
  if (callbacks?.getManagerStatusById && returned.user.id !== undefined) {
    const getById = callbacks.getManagerStatusById;
    const mgrIdNum = Number(returned.user.id);
    const live = await runBetterAuthCallback(() => getById(mgrIdNum));
    if (live === null) {
      return true;
    }
    if (returned.user.uuid && live.uuid && returned.user.uuid !== live.uuid) {
      return true;
    }
    if (
      returned.user.sessionVersion !== undefined &&
      live.sessionVersion !== undefined &&
      Number(returned.user.sessionVersion) !== Number(live.sessionVersion)
    ) {
      return true;
    }
    activeFlag = live.isActive;
  }
  return !activeFlag;
}

async function handleManagerTwoFactorAfter(
  pendingMgrId: number | undefined,
  newSessionUserId: string | number | undefined,
  returnedIsError: boolean,
  ipAddress: string,
  userAgent: string,
  mfaGuard: MfaAttemptGuard,
  callbacks: ManagerAuthCallbacks | undefined
): Promise<void> {
  if (newSessionUserId !== undefined) {
    const mgrId = Number(newSessionUserId);
    await runBetterAuthCallback(() => mfaGuard.reset("manager", mgrId));
    await runBetterAuthCallback(async () => {
      await callbacks?.recordManagerAudit?.({
        action: "manager_login",
        managerId: mgrId,
        ipAddress,
        userAgent,
      });
    });
    return;
  }
  if (!returnedIsError) {
    return;
  }
  if (pendingMgrId !== undefined) {
    await runBetterAuthCallback(() =>
      mfaGuard.recordFailure("manager", pendingMgrId)
    );
  }
  await runBetterAuthCallback(async () => {
    await callbacks?.recordManagerAudit?.({
      action: "manager_mfa_failed",
      managerId: pendingMgrId ?? null,
      ipAddress,
      userAgent,
    });
  });
}

export function createMindKidManagerAuth(deps: CreateMindKidManagerAuthDeps) {
  const resolvedRpId = deps.rpId ?? new URL(deps.siteUrl).hostname;
  const secondaryStorage = wrapSecondaryStorageForBetterAuth(
    createRedisSecondaryStorage(deps.redis, "manager")
  );
  const mfaGuard = new MfaAttemptGuard(deps.redis);
  const pendingAuth2faManagerByCtx = new WeakMap<object, number>();
  const pendingMfaActivationByCtx = new WeakMap<object, number>();

  const handleManagerVerify2faAfter = async (
    ctx: Parameters<Parameters<typeof createAuthMiddleware>[0]>[0],
    ipAddress: string,
    userAgent: string
  ) => {
    const tfCookie = ctx.context.createAuthCookie("two_factor");
    const rawTf = readCookieFromHeader(ctx.headers, tfCookie.name);
    const pendingMgrId = await resolvePendingTwoFactorAccountId({
      ctx,
      namespace: "manager",
      redis: deps.redis,
      rawTf,
      tfCookieName: tfCookie.name,
      pendingAuthAccountByCtx: pendingAuth2faManagerByCtx,
    });
    const returnedIsError = isAPIError(ctx.context.returned);
    const activeSession = ctx.context.newSession ?? ctx.context.session;
    const verifiedMgrId =
      !returnedIsError && activeSession?.user?.id
        ? activeSession.user.id
        : undefined;
    await handleManagerTwoFactorAfter(
      pendingMgrId,
      verifiedMgrId,
      returnedIsError,
      ipAddress,
      userAgent,
      mfaGuard,
      deps.callbacks
    );

    if (returnedIsError || !activeSession?.user?.id) {
      return;
    }
    if (rawTf) {
      await clearPending2faAccountByCookie(deps.redis, "manager", rawTf);
    }
    if (pendingMfaActivationByCtx.get(ctx.context) !== undefined) {
      await revokeOtherInstanceSessions({
        accountId: Number(activeSession.user.id),
        keepSessionToken: activeSession.session.token,
        internalAdapter: ctx.context.internalAdapter,
        customRevokeOtherSessions: deps.callbacks?.revokeOtherSessions,
      });
    }
  };

  const handleManagerGetSessionAfter = async (
    ctx: Parameters<Parameters<typeof createAuthMiddleware>[0]>[0]
  ) => {
    const returned = ctx.context.returned as {
      user?: {
        id?: string | number;
        isActive?: boolean;
        uuid?: string;
        sessionVersion?: number | string;
      };
    } | null;
    if (await shouldInvalidateManagerGetSession(returned, deps.callbacks)) {
      deleteSessionCookie(ctx, true);
      return ctx.json(null);
    }
    return undefined;
  };

  const handleManagerPostAuthMfaAfter = async (
    ctx: Parameters<Parameters<typeof createAuthMiddleware>[0]>[0]
  ) => {
    const activeSession = ctx.context.newSession ?? ctx.context.session;
    if (
      ctx.path === "/two-factor/enable" &&
      !isAPIError(ctx.context.returned) &&
      activeSession?.session &&
      activeSession.user?.id
    ) {
      const updatedMgr = (await ctx.context.internalAdapter
        .findUserById(String(activeSession.user.id))
        .catch(() => null)) as {
        mfaEnabled?: boolean;
        twoFactorEnabled?: boolean;
      } | null;
      if (
        updatedMgr?.mfaEnabled === true ||
        updatedMgr?.twoFactorEnabled === true
      ) {
        await revokeOtherInstanceSessions({
          accountId: Number(activeSession.user.id),
          keepSessionToken: activeSession.session.token,
          internalAdapter: ctx.context.internalAdapter,
          customRevokeOtherSessions: deps.callbacks?.revokeOtherSessions,
        });
      }
      return undefined;
    }

    if (ctx.path === "/passkey/verify-authentication") {
      const mgrFlags = ctx.context.newSession?.user as
        | { mfaEnabled?: boolean; twoFactorEnabled?: boolean }
        | undefined;
      if (
        mgrFlags?.mfaEnabled === true ||
        mgrFlags?.twoFactorEnabled === true
      ) {
        await issueTwoFactorChallengeAndRevokeSession({
          ctx,
          namespace: "manager",
          redis: deps.redis,
          rememberMe: false,
        });
        return ctx.json({
          twoFactorRedirect: true,
          twoFactorMethods: ["totp"],
        });
      }
    }
    return undefined;
  };

  const cookieAndAuditPlugin: BetterAuthPlugin = {
    id: "mindkid-manager-cookie-sync",
    hooks: {
      after: [
        {
          matcher: () => true,
          handler: createAuthMiddleware(async (ctx) => {
            const ipAddress = extractIp(ctx.headers);
            const userAgent = extractUa(ctx.headers);

            if (ctx.path === "/get-session") {
              const invalidated = await handleManagerGetSessionAfter(ctx);
              if (invalidated !== undefined) {
                return invalidated;
              }
            }

            if (
              ctx.path === "/sign-in/email" &&
              ctx.context.newSession?.user?.id
            ) {
              const mgrId = Number(ctx.context.newSession.user.id);
              await runBetterAuthCallback(async () => {
                await deps.callbacks?.recordManagerAudit?.({
                  action: "manager_login",
                  managerId: mgrId,
                  ipAddress,
                  userAgent,
                });
              });
            }

            if (
              ctx.path === "/two-factor/verify-totp" ||
              ctx.path === "/two-factor/verify-backup-code"
            ) {
              await handleManagerVerify2faAfter(ctx, ipAddress, userAgent);
            }

            const mfaRes = await handleManagerPostAuthMfaAfter(ctx);
            if (mfaRes !== undefined) {
              return mfaRes;
            }

            alignNewSessionCookies(ctx, "mindkid-manager");
          }),
        },
      ],
    },
  };

  const verifyManagerReauth = deps.callbacks?.verifySessionReauth
    ? async (params: {
        readonly accountId: number;
        readonly sessionId: string;
        readonly createdAt: Date;
        readonly dbReauthAt: Date | null;
      }) => {
        await deps.callbacks?.verifySessionReauth?.({
          managerId: params.accountId,
          sessionId: params.sessionId,
          createdAt: params.createdAt,
          dbReauthAt: params.dbReauthAt,
        });
      }
    : undefined;

  return betterAuth({
    appName: "MindKid Admin",
    baseURL: deps.siteUrl,
    basePath: "/api/auth/managers",
    secret: deriveInstanceSecret(deps.rootSecret, "manager"),
    trustedOrigins: [...deps.trustedOrigins],
    disabledPaths: [
      "/change-password",
      "/verify-password",
      "/update-user",
      "/change-email",
      "/delete-user",
      "/delete-user/callback",
      "/two-factor/get-totp-uri",
      "/two-factor/disable",
    ],
    database: drizzleAdapter(deps.db, {
      provider: "sqlite",
      schema: {
        managers: deps.schema.managers,
        managerAccounts: deps.schema.managerAccounts,
        managerSessions: deps.schema.managerSessions,
        managerVerifications: deps.schema.managerVerifications,
        managerTwoFactors: deps.schema.managerTwoFactors,
        managerPasskeys: deps.schema.managerPasskeys,
      },
    }),
    secondaryStorage,
    advanced: {
      cookiePrefix: "mindkid-manager",
      ipAddress: { ipAddressHeaders: ["x-real-ip"] },
      database: { generateId: "serial" },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: deps.isProduction,
        path: "/",
      },
    },
    user: {
      modelName: "managers",
      fields: { name: "displayName" },
      additionalFields: {
        uuid: { type: "string", required: false, input: false },
        passwordHash: {
          type: "string",
          required: false,
          defaultValue: "",
          input: false,
        },
        role: {
          type: "number",
          required: true,
          defaultValue: DB_MANAGER_ROLE.CONTENT_REVIEWER,
          input: false,
        },
        isActive: {
          type: "boolean",
          required: false,
          defaultValue: true,
          input: false,
        },
        sessionVersion: {
          type: "number",
          required: false,
          defaultValue: 0,
          input: false,
        },
      },
    },
    session: {
      modelName: "managerSessions",
      expiresIn: REMEMBER_MAX_TTL_SECONDS,
      disableSessionRefresh: true,
      freshAge: 0,
      storeSessionInDatabase: true,
      additionalFields: {
        authMethod: {
          type: "number",
          required: false,
          defaultValue: DB_AUTH_METHOD.PASSWORD,
          input: false,
        },
        reauthAt: { type: "date", required: false, input: false },
      },
    },
    account: { modelName: "managerAccounts" },
    verification: {
      modelName: "managerVerifications",
      storeInDatabase: true,
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: false,
      password: {
        hash: hashPassword,
        verify: ({ hash, password }) => verifyPassword(password, hash),
      },
    },
    plugins: [
      twoFactor({
        issuer: "MindKid Admin",
        accountLockout: {
          enabled: true,
          maxFailedAttempts: MFA_MAX_FAILURES,
          durationSeconds: MFA_LOCK_SECONDS,
        },
        schema: {
          user: { fields: { twoFactorEnabled: "mfaEnabled" } },
          twoFactor: { modelName: "managerTwoFactors" },
        },
      }),
      passkey({
        rpID: resolvedRpId,
        rpName: "MindKid Admin",
        origin: [...deps.trustedOrigins],
        authenticatorSelection: { userVerification: "required" },
        schema: { passkey: { modelName: "managerPasskeys" } },
      }),
      cookieAndAuditPlugin,
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        const ipAddress = extractIp(ctx.headers);
        const userAgent = extractUa(ctx.headers);
        const path = ctx.path ?? "";

        if (path === "/sign-up/email") {
          throw new APIError("FORBIDDEN", {
            code: "FORBIDDEN",
            message: "Tài khoản quản trị không cho phép đăng ký công khai.",
          });
        }
        if (
          path === "/two-factor/get-totp-uri" ||
          path === "/two-factor/disable"
        ) {
          throw new APIError("FORBIDDEN", {
            code: "FORBIDDEN",
            message: "Đường dẫn này đã bị vô hiệu hoá cho tài khoản quản trị.",
          });
        }
        if (path === "/sign-in/email") {
          return handleManagerSignInBefore(
            (ctx.body ?? {}) as ManagerSignInBody,
            ipAddress,
            userAgent,
            deps.callbacks,
            deps.redis
          );
        }

        const signedSessionToken = await ctx.getSignedCookie(
          ctx.context.authCookies.sessionToken.name,
          ctx.context.secret
        );
        if (signedSessionToken) {
          await secondaryStorage.get(signedSessionToken);
        }

        if (
          path === "/two-factor/verify-totp" ||
          path === "/two-factor/verify-backup-code"
        ) {
          await handleTwoFactorVerifyBeforeHook({
            ctx,
            path,
            namespace: "manager",
            redis: deps.redis,
            mfaGuard,
            pendingAuthAccountByCtx: pendingAuth2faManagerByCtx,
            pendingMfaActivationByCtx,
          });
          return;
        }

        if (path === "/two-factor/generate-backup-codes") {
          const resolvedSession = await getSessionFromCtx(ctx, {
            disableCookieCache: true,
          });
          await enforceTotpStepUpForSensitiveMfaAction({
            ctx,
            resolvedSession,
            namespace: "manager",
            rootSecret: deps.rootSecret,
            freshAgeSeconds: REAUTH_FRESH_AGE_SECONDS,
            mfaGuard,
            verifySessionReauth: verifyManagerReauth,
          });
          return;
        }

        if (
          path === "/passkey/generate-register-options" ||
          path === "/passkey/verify-registration" ||
          path === "/passkey/delete-passkey"
        ) {
          return await enforcePasskeyMutationBeforeHook({
            path,
            ctx,
            freshAgeSeconds: REAUTH_FRESH_AGE_SECONDS,
            customVerify: verifyManagerReauth,
          });
        }
      }),
    },
    databaseHooks: {
      account: {
        create: {
          before: sanitizeManagerAccountTokens,
          after: async (account) => {
            if (
              account.providerId === "credential" &&
              typeof account.password === "string" &&
              deps.callbacks?.mirrorCredentialPassword
            ) {
              const mirrorPwd = deps.callbacks.mirrorCredentialPassword;
              const pwd = account.password;
              await runBetterAuthCallback(() =>
                mirrorPwd(Number(account.userId), pwd)
              );
            }
          },
        },
        update: {
          before: sanitizeManagerAccountTokens,
          after: async (account) => {
            if (
              account.providerId === "credential" &&
              typeof account.password === "string" &&
              deps.callbacks?.mirrorCredentialPassword
            ) {
              const mirrorPwd = deps.callbacks.mirrorCredentialPassword;
              const pwd = account.password;
              await runBetterAuthCallback(() =>
                mirrorPwd(Number(account.userId), pwd)
              );
            }
          },
        },
      },
      session: {
        create: {
          before: async (session, ctx) => {
            let snapshotMfaEnabled = false;
            if (deps.callbacks?.getManagerStatusById) {
              const getById = deps.callbacks.getManagerStatusById;
              const snapshot = await runBetterAuthCallback(() =>
                getById(Number(session.userId))
              );
              if (snapshot === null) {
                throw new APIError("UNAUTHORIZED", {
                  code: "UNAUTHENTICATED",
                  message:
                    "Tài khoản quản trị không tồn tại hoặc đã bị vô hiệu hoá.",
                });
              }
              if (!snapshot.isActive) {
                throw new APIError("FORBIDDEN", {
                  code: "ACCOUNT_SUSPENDED",
                  message: "Tài khoản quản trị đang ngừng hoạt động.",
                });
              }
              snapshotMfaEnabled = snapshot.mfaEnabled === true;
            }

            const now = new Date();
            const pathStr = ctx?.path ?? "";
            const body = (ctx?.body ?? null) as { rememberMe?: boolean } | null;
            const isRemembered = await resolveManagerIsRemembered(
              pathStr,
              String(session.userId),
              body,
              ctx?.headers,
              deps.redis
            );
            const ttlSeconds = isRemembered
              ? REMEMBER_MAX_TTL_SECONDS
              : SESSION_DEFAULT_TTL_SECONDS;
            const authMethod = pathStr.includes("passkey")
              ? DB_AUTH_METHOD.PASSKEY
              : DB_AUTH_METHOD.PASSWORD;

            const reauthAt = await computeSessionReauthAt({
              pathStr,
              userId: session.userId,
              snapshot2faEnabled: snapshotMfaEnabled,
              ctx,
              now,
            });

            return {
              data: {
                ...session,
                expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
                authMethod,
                reauthAt,
              },
            };
          },
        },
      },
    },
  });
}

export type MindKidManagerAuth = ReturnType<typeof createMindKidManagerAuth>;
