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
import {
  runBetterAuthCallback,
  wrapSecondaryStorageForBetterAuth,
} from "./better-auth-error.js";
import { DB_AUTH_METHOD, DB_USER_STATUS } from "./enum-values.js";
import { deriveInstanceSecret } from "./hmac-secret.js";
import {
  MFA_LOCK_SECONDS,
  MFA_MAX_FAILURES,
  MfaAttemptGuard,
} from "./mfa-lockout.js";
import { hashPassword, verifyPassword } from "./password.js";
import {
  consumeSocialSignupConsentTicket,
  createRedisSecondaryStorage,
  type MinimalRedisClient,
  SOCIAL_SIGNUP_CONSENT_COOKIE,
  type SocialSignupConsentPayload,
} from "./redis-secondary-storage.js";
import {
  alignNewSessionCookies,
  assertActiveOrPendingUserStatus,
  clearPending2faAccountByCookie,
  computeSessionReauthAt,
  consumePendingConsentMeta,
  enforcePasskeyMutationBeforeHook,
  enforceTotpStepUpForSensitiveMfaAction,
  enforceUserLinkOrUnlinkRules,
  extractClientIp,
  extractUserAgent,
  handleOAuthSignInMfaAfter,
  handleTwoFactorVerifyBeforeHook,
  handleUserSignInBefore,
  handleUserSignUpBefore,
  issueTwoFactorChallengeAndRevokeSession,
  readCookieFromHeader,
  resolvePendingTwoFactorAccountId,
  resolveUserIsRemembered,
  revokeOtherInstanceSessions,
  type SignInBodyPayload,
  type SignUpBodyPayload,
  sanitizeAccountTokens,
  setPendingConsentMeta,
  shouldInvalidateGetSessionUser,
} from "./user-auth-helpers.js";
import type {
  OAuthClientCredentials,
  UserAuthCallbacks,
  UserAuthSchemaTables,
} from "./user-auth-types.js";

export const SESSION_DEFAULT_TTL_SECONDS = 3600;
export const REMEMBER_MAX_TTL_SECONDS = 365 * 24 * 60 * 60;
export const REAUTH_FRESH_AGE_SECONDS = 300;

export interface CreateMindKidUserAuthDeps {
  readonly db: Parameters<typeof drizzleAdapter>[0];
  readonly schema: UserAuthSchemaTables;
  readonly redis: MinimalRedisClient;
  readonly rootSecret: string;
  readonly siteUrl: string;
  readonly trustedOrigins: readonly string[];
  readonly isProduction: boolean;
  readonly rpId?: string;
  readonly oauth?: {
    readonly google?: OAuthClientCredentials;
    readonly facebook?: OAuthClientCredentials;
  };
  readonly callbacks?: UserAuthCallbacks;
}

export function getEnabledOAuthProviders(oauth?: {
  readonly google?: OAuthClientCredentials;
  readonly facebook?: OAuthClientCredentials;
}): { readonly google: boolean; readonly facebook: boolean } {
  return {
    google: Boolean(oauth?.google?.clientId && oauth?.google?.clientSecret),
    facebook: Boolean(
      oauth?.facebook?.clientId && oauth?.facebook?.clientSecret
    ),
  };
}

function buildSocialProviders(oauth: CreateMindKidUserAuthDeps["oauth"]) {
  const providers: {
    google?: {
      clientId: string;
      clientSecret: string;
      disableImplicitSignUp: boolean;
    };
    facebook?: {
      clientId: string;
      clientSecret: string;
      disableImplicitSignUp: boolean;
      mapProfileToUser: () => { emailVerified: boolean };
    };
  } = {};

  if (oauth?.google?.clientId && oauth.google.clientSecret) {
    providers.google = {
      clientId: oauth.google.clientId,
      clientSecret: oauth.google.clientSecret,
      disableImplicitSignUp: true,
    };
  }

  if (oauth?.facebook?.clientId && oauth.facebook.clientSecret) {
    providers.facebook = {
      clientId: oauth.facebook.clientId,
      clientSecret: oauth.facebook.clientSecret,
      disableImplicitSignUp: true,
      mapProfileToUser: () => ({ emailVerified: false }),
    };
  }
  return providers;
}

export function createMindKidUserAuth(deps: CreateMindKidUserAuthDeps) {
  const resolvedRpId = deps.rpId ?? new URL(deps.siteUrl).hostname;
  const secondaryStorage = wrapSecondaryStorageForBetterAuth(
    createRedisSecondaryStorage(deps.redis, "user")
  );
  const mfaGuard = new MfaAttemptGuard(deps.redis);
  const pendingAuth2faUserByCtx = new WeakMap<object, number>();
  const pendingMfaActivationByCtx = new WeakMap<object, number>();

  const handleUserVerify2faAfter = async (
    ctx: Parameters<Parameters<typeof createAuthMiddleware>[0]>[0]
  ) => {
    const tfCookie = ctx.context.createAuthCookie("two_factor");
    const rawTf = readCookieFromHeader(ctx.headers, tfCookie.name);
    const pendingUserId = await resolvePendingTwoFactorAccountId({
      ctx,
      namespace: "user",
      redis: deps.redis,
      rawTf,
      tfCookieName: tfCookie.name,
      pendingAuthAccountByCtx: pendingAuth2faUserByCtx,
    });
    const returnedIsError = isAPIError(ctx.context.returned);
    const activeSession = ctx.context.newSession ?? ctx.context.session;
    if (!returnedIsError && activeSession?.user?.id) {
      const uid = Number(activeSession.user.id);
      await runBetterAuthCallback(() => mfaGuard.reset("user", uid));
      if (rawTf) {
        await clearPending2faAccountByCookie(deps.redis, "user", rawTf);
      }
      if (pendingMfaActivationByCtx.get(ctx.context) !== undefined) {
        await revokeOtherInstanceSessions({
          accountId: uid,
          keepSessionToken: activeSession.session.token,
          internalAdapter: ctx.context.internalAdapter,
          customRevokeOtherSessions: deps.callbacks?.revokeOtherSessions,
        });
      }
      return;
    }
    if (returnedIsError && pendingUserId !== undefined) {
      await runBetterAuthCallback(() =>
        mfaGuard.recordFailure("user", pendingUserId)
      );
    }
  };

  const handleUserGetSessionAfter = async (
    ctx: Parameters<Parameters<typeof createAuthMiddleware>[0]>[0]
  ) => {
    const returned = ctx.context.returned as {
      user?: {
        id?: string | number;
        status?: string | number;
        uuid?: string;
        sessionVersion?: number | string;
      };
    } | null;
    if (await shouldInvalidateGetSessionUser(returned, deps.callbacks)) {
      deleteSessionCookie(ctx, true);
      return ctx.json(null);
    }
    return undefined;
  };

  const handleUserPostAuthMfaAfter = async (
    ctx: Parameters<Parameters<typeof createAuthMiddleware>[0]>[0]
  ) => {
    const newSession = ctx.context.newSession;
    const activeSession = newSession ?? ctx.context.session;
    if (
      ctx.path === "/two-factor/enable" &&
      !isAPIError(ctx.context.returned) &&
      activeSession?.session &&
      activeSession.user?.id
    ) {
      const updatedUser = (await ctx.context.internalAdapter
        .findUserById(String(activeSession.user.id))
        .catch(() => null)) as { twoFactorEnabled?: boolean } | null;
      if (updatedUser?.twoFactorEnabled === true) {
        await revokeOtherInstanceSessions({
          accountId: Number(activeSession.user.id),
          keepSessionToken: activeSession.session.token,
          internalAdapter: ctx.context.internalAdapter,
          customRevokeOtherSessions: deps.callbacks?.revokeOtherSessions,
        });
      }
      return undefined;
    }

    const userWith2fa = newSession?.user as
      | { twoFactorEnabled?: boolean }
      | undefined;
    if (
      ctx.path === "/passkey/verify-authentication" &&
      userWith2fa?.twoFactorEnabled === true
    ) {
      await issueTwoFactorChallengeAndRevokeSession({
        ctx,
        namespace: "user",
        redis: deps.redis,
        rememberMe: false,
      });
      return ctx.json({
        twoFactorRedirect: true,
        twoFactorMethods: ["totp"],
      });
    }

    if (
      (ctx.path === "/sign-in/social" || ctx.path?.startsWith("/callback/")) &&
      newSession?.user
    ) {
      return await handleOAuthSignInMfaAfter({
        ctx,
        redis: deps.redis,
        siteUrl: deps.siteUrl,
      });
    }

    return undefined;
  };

  const handleUserAfterHook = async (
    ctx: Parameters<Parameters<typeof createAuthMiddleware>[0]>[0]
  ) => {
    if (ctx.path === "/get-session") {
      const invalidated = await handleUserGetSessionAfter(ctx);
      if (invalidated !== undefined) {
        return invalidated;
      }
    }

    if (
      ctx.path === "/two-factor/verify-totp" ||
      ctx.path === "/two-factor/verify-backup-code"
    ) {
      await handleUserVerify2faAfter(ctx);
    }

    const mfaResult = await handleUserPostAuthMfaAfter(ctx);
    if (mfaResult !== undefined) {
      return mfaResult;
    }

    alignNewSessionCookies(ctx, "mindkid-user");
    return undefined;
  };

  const cookieSyncPlugin: BetterAuthPlugin = {
    id: "mindkid-user-cookie-sync",
    hooks: {
      after: [
        {
          matcher: () => true,
          handler: createAuthMiddleware(handleUserAfterHook),
        },
      ],
    },
  };

  const verifyUserReauth = deps.callbacks?.verifySessionReauth
    ? async (params: {
        readonly accountId: number;
        readonly sessionId: string;
        readonly createdAt: Date;
        readonly dbReauthAt: Date | null;
      }) => {
        await deps.callbacks?.verifySessionReauth?.({
          userId: params.accountId,
          sessionId: params.sessionId,
          createdAt: params.createdAt,
          dbReauthAt: params.dbReauthAt,
        });
      }
    : undefined;

  const handleUserProtectedBefore = async (
    path: string,
    ctx: Parameters<Parameters<typeof createAuthMiddleware>[0]>[0],
    ipAddress: string
  ) => {
    if (
      path === "/two-factor/verify-totp" ||
      path === "/two-factor/verify-backup-code"
    ) {
      await handleTwoFactorVerifyBeforeHook({
        ctx,
        path,
        namespace: "user",
        redis: deps.redis,
        mfaGuard,
        pendingAuthAccountByCtx: pendingAuth2faUserByCtx,
        pendingMfaActivationByCtx,
      });
      return undefined;
    }

    if (
      path === "/two-factor/disable" ||
      path === "/two-factor/generate-backup-codes"
    ) {
      const resolvedSession = await getSessionFromCtx(ctx, {
        disableCookieCache: true,
      });
      await enforceTotpStepUpForSensitiveMfaAction({
        ctx,
        resolvedSession,
        namespace: "user",
        rootSecret: deps.rootSecret,
        freshAgeSeconds: REAUTH_FRESH_AGE_SECONDS,
        mfaGuard,
        verifySessionReauth: verifyUserReauth,
      });
      return undefined;
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
        customVerify: verifyUserReauth,
        countUserLoginMethods: deps.callbacks?.countUserLoginMethods,
      });
    }

    if (path === "/request-password-reset") {
      const body = (ctx.body ?? {}) as { email?: string };
      await runBetterAuthCallback(async () => {
        await deps.callbacks?.enforceRateLimit?.({
          routeClass: "auth:forgot-password",
          ipAddress,
          identifier: body.email?.trim().toLowerCase(),
        });
      });
      return undefined;
    }

    if (path === "/link-social" || path === "/unlink-account") {
      const resolvedSession = await getSessionFromCtx(ctx, {
        disableCookieCache: true,
      });
      await enforceUserLinkOrUnlinkRules(
        path,
        resolvedSession,
        deps.callbacks,
        REAUTH_FRESH_AGE_SECONDS
      );
    }
    return undefined;
  };

  return betterAuth({
    appName: "MindKid",
    baseURL: deps.siteUrl,
    basePath: "/api/auth/users",
    secret: deriveInstanceSecret(deps.rootSecret, "user"),
    trustedOrigins: [...deps.trustedOrigins],
    disabledPaths: [
      "/change-password",
      "/verify-password",
      "/update-user",
      "/change-email",
      "/delete-user",
      "/delete-user/callback",
      "/two-factor/get-totp-uri",
      "/unlink-account",
      "/list-accounts",
      "/get-access-token",
      "/refresh-token",
      "/account-info",
    ],
    database: drizzleAdapter(deps.db, {
      provider: "sqlite",
      schema: {
        users: deps.schema.users,
        userAccounts: deps.schema.userAccounts,
        userSessions: deps.schema.userSessions,
        userVerifications: deps.schema.userVerifications,
        userTwoFactors: deps.schema.userTwoFactors,
        userPasskeys: deps.schema.userPasskeys,
      },
    }),
    secondaryStorage,
    advanced: {
      cookiePrefix: "mindkid-user",
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
      modelName: "users",
      fields: { name: "displayName" },
      additionalFields: {
        uuid: { type: "string", required: false, input: false },
        status: {
          type: "number",
          required: false,
          defaultValue: DB_USER_STATUS.PENDING_VERIFICATION,
          input: false,
        },
        emailVerifiedAt: { type: "date", required: false, input: false },
        sessionVersion: {
          type: "number",
          required: false,
          defaultValue: 0,
          input: false,
        },
        purgeAt: { type: "date", required: false, input: false },
      },
      changeEmail: { enabled: false },
    },
    session: {
      modelName: "userSessions",
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
    account: {
      modelName: "userAccounts",
      accountLinking: {
        enabled: true,
        disableImplicitLinking: true,
        allowDifferentEmails: true,
      },
    },
    verification: {
      modelName: "userVerifications",
      storeInDatabase: true,
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      requireEmailVerification: false,
      revokeSessionsOnPasswordReset: true,
      onPasswordReset: async ({ user }) => {
        await runBetterAuthCallback(async () => {
          await deps.callbacks?.onPasswordReset?.(Number(user.id));
        });
      },
      password: {
        hash: hashPassword,
        verify: ({ hash, password }) => verifyPassword(password, hash),
      },
      sendResetPassword: async ({ user, url, token }) => {
        await runBetterAuthCallback(async () => {
          await deps.callbacks?.sendResetPassword?.({
            user: { id: String(user.id), email: user.email, name: user.name },
            url,
            token,
          });
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url, token }) => {
        await runBetterAuthCallback(async () => {
          await deps.callbacks?.sendVerificationEmail?.({
            user: { id: String(user.id), email: user.email, name: user.name },
            url,
            token,
          });
        });
      },
      afterEmailVerification: async (user) => {
        await runBetterAuthCallback(async () => {
          await deps.callbacks?.onEmailVerified?.(Number(user.id), user.email);
        });
      },
    },
    socialProviders: buildSocialProviders(deps.oauth),
    plugins: [
      twoFactor({
        issuer: "MindKid",
        accountLockout: {
          enabled: true,
          maxFailedAttempts: MFA_MAX_FAILURES,
          durationSeconds: MFA_LOCK_SECONDS,
        },
        schema: {
          user: { fields: { twoFactorEnabled: "twoFactorEnabled" } },
          twoFactor: { modelName: "userTwoFactors" },
        },
      }),
      passkey({
        rpID: resolvedRpId,
        rpName: "MindKid",
        origin: [...deps.trustedOrigins],
        authenticatorSelection: { userVerification: "required" },
        schema: { passkey: { modelName: "userPasskeys" } },
      }),
      cookieSyncPlugin,
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        const ipAddress = extractClientIp(ctx.headers);
        const userAgent = extractUserAgent(ctx.headers);
        const path = ctx.path ?? "";

        if (path === "/two-factor/get-totp-uri") {
          throw new APIError("FORBIDDEN", {
            code: "FORBIDDEN",
            message: "Đường dẫn này đã bị vô hiệu hoá.",
          });
        }
        if (path === "/sign-in/email") {
          return handleUserSignInBefore(
            (ctx.body ?? {}) as SignInBodyPayload,
            ipAddress,
            deps.callbacks,
            deps.redis
          );
        }
        if (path === "/sign-up/email") {
          await handleUserSignUpBefore(
            (ctx.body ?? {}) as SignUpBodyPayload,
            ipAddress,
            userAgent,
            deps.callbacks,
            deps.redis
          );
          return;
        }

        const signedSessionToken = await ctx.getSignedCookie(
          ctx.context.authCookies.sessionToken.name,
          ctx.context.secret
        );
        if (signedSessionToken) {
          await secondaryStorage.get(signedSessionToken);
        }

        return await handleUserProtectedBefore(path, ctx, ipAddress);
      }),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user, ctx) => {
            const pathStr = ctx?.path ?? "";
            if (pathStr.includes("callback") || pathStr.includes("social")) {
              const consentToken = readCookieFromHeader(
                ctx?.headers,
                SOCIAL_SIGNUP_CONSENT_COOKIE
              );
              const ticket: SocialSignupConsentPayload | null =
                await runBetterAuthCallback(() =>
                  consumeSocialSignupConsentTicket(deps.redis, consentToken)
                );
              if (!ticket) {
                throw new APIError("UNPROCESSABLE_ENTITY", {
                  code: "CONSENT_REQUIRED",
                  message:
                    "Vui lòng xác nhận Điều khoản sử dụng và Chính sách bảo mật trước khi tạo tài khoản mới.",
                });
              }
              await runBetterAuthCallback(async () => {
                await deps.callbacks?.validateConsentMarkers?.({
                  termsRequirementAt: ticket.termsRequirementAt,
                  privacyRequirementAt: ticket.privacyRequirementAt,
                });
              });
              await setPendingConsentMeta(deps.redis, user.email, {
                ipAddress: ticket.ipAddress,
                userAgent: ticket.userAgent,
              });
            }

            const isVerified = Boolean(user.emailVerified);
            return {
              data: {
                ...user,
                image: null,
                status: isVerified
                  ? DB_USER_STATUS.ACTIVE
                  : DB_USER_STATUS.PENDING_VERIFICATION,
                emailVerifiedAt: isVerified ? new Date() : null,
              },
            };
          },
          after: async (user, ctx) => {
            const meta = await consumePendingConsentMeta(
              deps.redis,
              user.email
            );
            if (deps.callbacks?.recordInitialConsents) {
              const recordConsents = deps.callbacks.recordInitialConsents;
              await runBetterAuthCallback(() =>
                recordConsents({
                  userId: Number(user.id),
                  ipAddress: meta?.ipAddress ?? extractClientIp(ctx?.headers),
                  userAgent: meta?.userAgent ?? extractUserAgent(ctx?.headers),
                })
              );
            }
          },
        },
      },
      account: {
        create: {
          before: (account) => sanitizeAccountTokens(account, deps.callbacks),
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
          before: (account) => sanitizeAccountTokens(account, deps.callbacks),
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
            let snapshotTwoFactorEnabled = false;
            if (deps.callbacks?.getUserStatusById) {
              const getById = deps.callbacks.getUserStatusById;
              const snapshot = await runBetterAuthCallback(() =>
                getById(Number(session.userId))
              );
              if (snapshot === null) {
                throw new APIError("UNAUTHORIZED", {
                  code: "UNAUTHENTICATED",
                  message: "Tài khoản không tồn tại hoặc đã bị vô hiệu hoá.",
                });
              }
              assertActiveOrPendingUserStatus(snapshot.status);
              snapshotTwoFactorEnabled = snapshot.twoFactorEnabled === true;
            }

            const now = new Date();
            const pathStr = ctx?.path ?? "";
            const body = (ctx?.body ?? null) as { rememberMe?: boolean } | null;
            const isRemembered = await resolveUserIsRemembered(
              pathStr,
              String(session.userId),
              body,
              ctx?.headers,
              deps.redis
            );
            const ttlSeconds = isRemembered
              ? REMEMBER_MAX_TTL_SECONDS
              : SESSION_DEFAULT_TTL_SECONDS;
            let authMethod: number = DB_AUTH_METHOD.PASSWORD;
            if (pathStr.includes("callback") || pathStr.includes("social")) {
              authMethod = DB_AUTH_METHOD.SOCIAL;
            } else if (pathStr.includes("passkey")) {
              authMethod = DB_AUTH_METHOD.PASSKEY;
            }

            const reauthAt = await computeSessionReauthAt({
              pathStr,
              userId: session.userId,
              snapshot2faEnabled: snapshotTwoFactorEnabled,
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

export type MindKidUserAuth = ReturnType<typeof createMindKidUserAuth>;
