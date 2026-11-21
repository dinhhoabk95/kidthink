import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import { type BetterAuthPlugin, betterAuth } from "better-auth";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
  isAPIError,
} from "better-auth/api";
import { expireCookie } from "better-auth/cookies";
import { twoFactor } from "better-auth/plugins";
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
  consumeSocialSignupConsentTicket,
  createRedisSecondaryStorage,
  type MinimalRedisClient,
  SOCIAL_SIGNUP_CONSENT_COOKIE,
  type SocialSignupConsentPayload,
} from "./redis-secondary-storage.js";
import {
  assertActiveOrPendingUserStatus,
  enforcePendingTwoFactorGuard,
  enforceUserLinkOrUnlinkRules,
  extractClientIp,
  extractUserAgent,
  handleUserSignInBefore,
  handleUserSignUpBefore,
  readCookieFromHeader,
  resolveUserIsRemembered,
  type SignInBodyPayload,
  type SignUpBodyPayload,
  sanitizeAccountTokens,
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
const PENDING_META_TTL_MS = 10 * 60 * 1000;

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

export function createMindKidUserAuth(deps: CreateMindKidUserAuthDeps) {
  const resolvedRpId = deps.rpId ?? new URL(deps.siteUrl).hostname;
  const secondaryStorage = wrapSecondaryStorageForBetterAuth(
    createRedisSecondaryStorage(deps.redis, "user")
  );
  const mfaGuard = new MfaAttemptGuard(deps.redis);

  const socialProviders: {
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

  if (deps.oauth?.google?.clientId && deps.oauth.google.clientSecret) {
    socialProviders.google = {
      clientId: deps.oauth.google.clientId,
      clientSecret: deps.oauth.google.clientSecret,
      disableImplicitSignUp: true,
    };
  }

  if (deps.oauth?.facebook?.clientId && deps.oauth.facebook.clientSecret) {
    socialProviders.facebook = {
      clientId: deps.oauth.facebook.clientId,
      clientSecret: deps.oauth.facebook.clientSecret,
      disableImplicitSignUp: true,
      mapProfileToUser: () => ({ emailVerified: false }),
    };
  }

  const pendingConsentMeta = new BoundedTtlMap<{
    ipAddress: string;
    userAgent: string;
  }>(PENDING_META_TTL_MS);
  const pending2faRemember = new BoundedTtlMap<boolean>(PENDING_META_TTL_MS);
  const pending2faUserByCookie = new BoundedTtlMap<number>(PENDING_META_TTL_MS);

  const cookieSyncPlugin: BetterAuthPlugin = {
    id: "mindkid-user-cookie-sync",
    hooks: {
      after: [
        {
          matcher: () => true,
          handler: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/get-session") {
              const returned = ctx.context.returned as {
                user?: { id?: string | number; status?: string };
              } | null;
              if (
                await shouldInvalidateGetSessionUser(returned, deps.callbacks)
              ) {
                expireCookie(ctx, ctx.context.authCookies.sessionToken);
                return ctx.json(null);
              }
            }

            if (
              ctx.path === "/two-factor/verify-totp" ||
              ctx.path === "/two-factor/verify-backup-code"
            ) {
              const tfCookie = ctx.context.createAuthCookie("two_factor");
              const rawTf = readCookieFromHeader(ctx.headers, tfCookie.name);
              const pendingUserId = rawTf
                ? pending2faUserByCookie.consume(rawTf)
                : undefined;
              const created = ctx.context.newSession;
              if (created?.user?.id) {
                await runBetterAuthCallback(() =>
                  mfaGuard.reset("user", Number(created.user.id))
                );
              } else if (
                isAPIError(ctx.context.returned) &&
                pendingUserId !== undefined
              ) {
                await runBetterAuthCallback(() =>
                  mfaGuard.recordFailure("user", pendingUserId)
                );
              }
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
                "mindkid-user",
                ttlSeconds
              );
              alignSessionCookieMaxAge(
                ctx.responseHeaders,
                "mindkid-user",
                ttlSeconds
              );
            }
          }),
        },
      ],
    },
  };

  return betterAuth({
    appName: "MindKid",
    baseURL: deps.siteUrl,
    basePath: "/api/auth/users",
    secret: deriveInstanceSecret(deps.rootSecret, "user"),
    trustedOrigins: [...deps.trustedOrigins],
    database: drizzleAdapter(deps.db, {
      provider: "pg",
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
          type: "string",
          required: false,
          defaultValue: "pending_verification",
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
          type: "string",
          required: false,
          defaultValue: "password",
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
    socialProviders,
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
        schema: { passkey: { modelName: "userPasskeys" } },
      }),
      cookieSyncPlugin,
    ],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        const ipAddress = extractClientIp(ctx.headers);
        const userAgent = extractUserAgent(ctx.headers);
        const path = ctx.path ?? "";

        if (path === "/sign-in/email") {
          return handleUserSignInBefore(
            (ctx.body ?? {}) as SignInBodyPayload,
            ipAddress,
            deps.callbacks,
            pending2faRemember
          );
        }

        if (path === "/sign-up/email") {
          await handleUserSignUpBefore(
            (ctx.body ?? {}) as SignUpBodyPayload,
            ipAddress,
            userAgent,
            deps.callbacks,
            pendingConsentMeta
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

        if (
          path === "/two-factor/verify-totp" ||
          path === "/two-factor/verify-backup-code"
        ) {
          const tfCookie = ctx.context.createAuthCookie("two_factor");
          await enforcePendingTwoFactorGuard({
            namespace: "user",
            rawCookieVal: readCookieFromHeader(ctx.headers, tfCookie.name),
            signedTf: await ctx.getSignedCookie(
              tfCookie.name,
              ctx.context.secret
            ),
            findVerificationValue: (id) =>
              ctx.context.internalAdapter.findVerificationValue(id),
            pendingAccountByCookie: pending2faUserByCookie,
            mfaGuard,
          });
          return;
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
          return;
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
              pendingConsentMeta.set(user.email.toLowerCase(), {
                ipAddress: ticket.ipAddress,
                userAgent: ticket.userAgent,
              });
            }

            const isVerified = Boolean(user.emailVerified);
            return {
              data: {
                ...user,
                image: null,
                status: isVerified ? "active" : "pending_verification",
                emailVerifiedAt: isVerified ? new Date() : null,
              },
            };
          },
          after: async (user, ctx) => {
            const meta = pendingConsentMeta.consume(user.email.toLowerCase());
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
            if (deps.callbacks?.getUserStatusById) {
              const getById = deps.callbacks.getUserStatusById;
              const snapshot = await runBetterAuthCallback(() =>
                getById(Number(session.userId))
              );
              assertActiveOrPendingUserStatus(snapshot?.status);
            }

            const now = new Date();
            const pathStr = ctx?.path ?? "";
            const body = (ctx?.body ?? null) as { rememberMe?: boolean } | null;
            const isRemembered = resolveUserIsRemembered(
              pathStr,
              String(session.userId),
              body,
              ctx?.headers,
              pending2faRemember
            );
            const ttlSeconds = isRemembered
              ? REMEMBER_MAX_TTL_SECONDS
              : SESSION_DEFAULT_TTL_SECONDS;
            let authMethod = "password";
            if (pathStr.includes("callback") || pathStr.includes("social")) {
              authMethod = "social";
            } else if (pathStr.includes("passkey")) {
              authMethod = "passkey";
            }

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

export type MindKidUserAuth = ReturnType<typeof createMindKidUserAuth>;
