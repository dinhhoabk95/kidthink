import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import { type BetterAuthPlugin, betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, isAPIError } from "better-auth/api";
import { expireCookie } from "better-auth/cookies";
import { twoFactor } from "better-auth/plugins";
import type { PgTable } from "drizzle-orm/pg-core";
import {
  alignSessionCookieMaxAge,
  BoundedTtlMap,
  runBetterAuthCallback,
  wrapSecondaryStorageForBetterAuth,
} from "./better-auth-error.js";
import { deriveInstanceSecret } from "./hmac-secret.js";
import {
  MFA_LOCK_SECONDS,
  MFA_MAX_FAILURES,
  MfaAttemptGuard,
} from "./mfa-lockout.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  createRedisSecondaryStorage,
  type MinimalRedisClient,
} from "./redis-secondary-storage.js";
import { enforcePendingTwoFactorGuard } from "./user-auth-helpers.js";
import {
  REMEMBER_MAX_TTL_SECONDS,
  SESSION_DEFAULT_TTL_SECONDS,
} from "./user-better-auth.js";

const PENDING_MANAGER_META_TTL_MS = 10 * 60 * 1000;

export interface ManagerAuthSchemaTables {
  readonly managers: PgTable;
  readonly managerAccounts: PgTable;
  readonly managerSessions: PgTable;
  readonly managerVerifications: PgTable;
  readonly managerTwoFactors: PgTable;
  readonly managerPasskeys: PgTable;
}

export interface ManagerStatusSnapshot {
  readonly id: number;
  readonly isActive: boolean;
  readonly role: string;
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

const DUMMY_MANAGER_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$Zmx0piJSIcdd2b8oaF8ZUg$U60ArJk0sNteiIdlfZyr7G0shEXA+IqCyWIKs1La4WE";

function extractIp(headers: Headers | undefined): string {
  const realIp = headers?.get("x-real-ip")?.trim();
  return realIp && realIp.length > 0 ? realIp : "127.0.0.1";
}

function extractUa(headers: Headers | undefined): string {
  return headers?.get("user-agent")?.trim() || "MindKid Admin Browser";
}

function readCookie(
  headers: Headers | undefined,
  cookieName: string
): string | null {
  const cookieHeader = headers?.get("cookie");
  if (!cookieHeader) {
    return null;
  }
  for (const pair of cookieHeader.split(";")) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx > 0 && pair.slice(0, eqIdx).trim() === cookieName) {
      return decodeURIComponent(pair.slice(eqIdx + 1).trim());
    }
  }
  return null;
}

function hasDontRememberManagerCookie(headers: Headers | undefined): boolean {
  return Boolean(
    readCookie(headers, "mindkid-manager.dont_remember") ||
      readCookie(headers, "__Secure-mindkid-manager.dont_remember")
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

function resolveManagerIsRemembered(
  pathStr: string,
  userId: string,
  body: { rememberMe?: boolean } | null,
  headers: Headers | undefined,
  pending2faRemember: BoundedTtlMap<boolean>
): boolean {
  if (pathStr === "/sign-in/email") {
    return body?.rememberMe === true;
  }
  if (!pathStr.startsWith("/two-factor/")) {
    return false;
  }
  const stored = pending2faRemember.consume(userId);
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
  pending2faRemember: BoundedTtlMap<boolean>
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
      await verifyPassword(body.password ?? "", DUMMY_MANAGER_HASH);
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
    pending2faRemember.set(String(snapshot.id), normalizedRemember);
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
  returned: { user?: { id?: string | number; isActive?: boolean } } | null,
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
    if (live) {
      activeFlag = live.isActive;
    }
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
  const pending2faRemember = new BoundedTtlMap<boolean>(
    PENDING_MANAGER_META_TTL_MS
  );
  const pending2faManagerByCookie = new BoundedTtlMap<number>(
    PENDING_MANAGER_META_TTL_MS
  );

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
              const returned = ctx.context.returned as {
                user?: { id?: string | number; isActive?: boolean };
              } | null;
              if (
                await shouldInvalidateManagerGetSession(
                  returned,
                  deps.callbacks
                )
              ) {
                expireCookie(ctx, ctx.context.authCookies.sessionToken);
                return ctx.json(null);
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
              const tfCookie = ctx.context.createAuthCookie("two_factor");
              const rawTf = readCookie(ctx.headers, tfCookie.name);
              const pendingMgrId = rawTf
                ? pending2faManagerByCookie.consume(rawTf)
                : undefined;
              await handleManagerTwoFactorAfter(
                pendingMgrId,
                ctx.context.newSession?.user?.id,
                isAPIError(ctx.context.returned),
                ipAddress,
                userAgent,
                mfaGuard,
                deps.callbacks
              );
            }

            const newSession = ctx.context.newSession;
            if (newSession?.session?.expiresAt) {
              const ttlSeconds = Math.max(
                1,
                Math.round(
                  (new Date(newSession.session.expiresAt).getTime() -
                    Date.now()) /
                    1000
                )
              );
              alignSessionCookieMaxAge(
                ctx.context.responseHeaders,
                "mindkid-manager",
                ttlSeconds
              );
              alignSessionCookieMaxAge(
                ctx.responseHeaders,
                "mindkid-manager",
                ttlSeconds
              );
            }
          }),
        },
      ],
    },
  };

  return betterAuth({
    appName: "MindKid Admin",
    baseURL: deps.siteUrl,
    basePath: "/api/auth/managers",
    secret: deriveInstanceSecret(deps.rootSecret, "manager"),
    trustedOrigins: [...deps.trustedOrigins],
    database: drizzleAdapter(deps.db, {
      provider: "pg",
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
          type: "string",
          required: true,
          defaultValue: "super_admin",
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
          type: "string",
          required: false,
          defaultValue: "password",
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

        if (path === "/sign-in/email") {
          return handleManagerSignInBefore(
            (ctx.body ?? {}) as ManagerSignInBody,
            ipAddress,
            userAgent,
            deps.callbacks,
            pending2faRemember
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
          const tfCookie = ctx.context.createAuthCookie("two_factor");
          await enforcePendingTwoFactorGuard({
            namespace: "manager",
            rawCookieVal: readCookie(ctx.headers, tfCookie.name),
            signedTf: await ctx.getSignedCookie(
              tfCookie.name,
              ctx.context.secret
            ),
            findVerificationValue: (id) =>
              ctx.context.internalAdapter.findVerificationValue(id),
            pendingAccountByCookie: pending2faManagerByCookie,
            mfaGuard,
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
            if (deps.callbacks?.getManagerStatusById) {
              const getById = deps.callbacks.getManagerStatusById;
              const snapshot = await runBetterAuthCallback(() =>
                getById(Number(session.userId))
              );
              if (snapshot && !snapshot.isActive) {
                throw new APIError("FORBIDDEN", {
                  code: "ACCOUNT_SUSPENDED",
                  message: "Tài khoản quản trị đang ngừng hoạt động.",
                });
              }
            }

            const now = new Date();
            const pathStr = ctx?.path ?? "";
            const body = (ctx?.body ?? null) as { rememberMe?: boolean } | null;
            const isRemembered = resolveManagerIsRemembered(
              pathStr,
              String(session.userId),
              body,
              ctx?.headers,
              pending2faRemember
            );
            const ttlSeconds = isRemembered
              ? REMEMBER_MAX_TTL_SECONDS
              : SESSION_DEFAULT_TTL_SECONDS;
            const authMethod = pathStr.includes("passkey")
              ? "passkey"
              : "password";

            return {
              data: {
                ...session,
                expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
                authMethod,
                reauthAt: now,
              },
            };
          },
        },
      },
    },
  });
}

export type MindKidManagerAuth = ReturnType<typeof createMindKidManagerAuth>;
