import { isAppError } from "@mindkid/errors/base";
import { ServiceUnavailableError } from "@mindkid/errors/common";
import type { GenericEndpointContext } from "better-auth";
import {
  APIError,
  getOAuthState,
  getSessionFromCtx,
  isAPIError,
} from "better-auth/api";
import { deleteSessionCookie } from "better-auth/cookies";
import { symmetricDecrypt } from "better-auth/crypto";
import {
  alignSessionCookieMaxAge,
  appErrorToBetterAuthError,
  runBetterAuthCallback,
} from "./better-auth-error.js";
import { decodeUserStatusValue } from "./enum-values.js";
import type { AuthInstanceNamespace } from "./hmac-secret.js";
import type { MfaAttemptGuard } from "./mfa-lockout.js";
import {
  getDummyPasswordHash,
  validatePasswordStrength,
  verifyPassword,
} from "./password.js";
import { sanitizeRedirectTarget } from "./redirect-target.js";
import {
  generateTokenHex,
  type MinimalRedisClient,
  sha256Hex,
} from "./redis-secondary-storage.js";
import { verifyBetterAuthTotp } from "./totp-verify.js";
import type { UserAuthCallbacks } from "./user-auth-types.js";

export const PENDING_AUTH_STATE_TTL_SECONDS = 600;
const SIX_DIGIT_TOTP_PATTERN = /^\d{6}$/;

export interface SignUpBodyPayload {
  email?: string;
  password?: string;
  name?: string;
  rememberMe?: boolean;
  accept_terms?: boolean;
  accept_privacy?: boolean;
  terms_requirement_at?: string | null;
  privacy_requirement_at?: string | null;
}

export interface SignInBodyPayload {
  email?: string;
  password?: string;
  rememberMe?: boolean;
  callbackURL?: string;
}

export interface PendingConsentMeta {
  readonly ipAddress: string;
  readonly userAgent: string;
}

export interface PasskeyVerifyRegistrationBody {
  response?: object;
  name?: string;
  createSession?: boolean;
}

interface TotpBodyPayload {
  totp?: string;
  code?: string;
}

interface TwoFactorTableRecord {
  id: string | number;
  userId: string | number;
  secret: string;
  verified?: boolean | null;
}

type ReauthVerifyFn = (params: {
  readonly accountId: number;
  readonly sessionId: string;
  readonly createdAt: Date;
  readonly dbReauthAt: Date | null;
}) => Promise<void>;

async function withFailClosedRedis<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (isAPIError(err)) {
      throw err;
    }
    if (isAppError(err)) {
      throw appErrorToBetterAuthError(err);
    }
    throw appErrorToBetterAuthError(new ServiceUnavailableError());
  }
}

function pendingRememberKey(
  namespace: AuthInstanceNamespace,
  userId: string
): string {
  return `ba:v1:${namespace}:pending_2fa_remember:${userId}`;
}

function pendingConsentMetaKey(email: string): string {
  return `ba:v1:user:pending_consent_meta:${sha256Hex(email.trim().toLowerCase())}`;
}

function pending2faCookieKey(
  namespace: AuthInstanceNamespace,
  rawCookieVal: string
): string {
  return `ba:v1:${namespace}:pending_2fa_cookie:${sha256Hex(rawCookieVal)}`;
}

export async function setPending2faRemember(
  redis: MinimalRedisClient,
  namespace: AuthInstanceNamespace,
  userId: string,
  rememberMe: boolean
): Promise<void> {
  await withFailClosedRedis(() =>
    redis.set(
      pendingRememberKey(namespace, userId),
      rememberMe ? "1" : "0",
      "EX",
      PENDING_AUTH_STATE_TTL_SECONDS
    )
  );
}

export async function consumePending2faRemember(
  redis: MinimalRedisClient,
  namespace: AuthInstanceNamespace,
  userId: string
): Promise<boolean | undefined> {
  const key = pendingRememberKey(namespace, userId);
  const raw = await withFailClosedRedis(async () => {
    if (typeof redis.getdel === "function") {
      return await redis.getdel(key);
    }
    const existing = await redis.get(key);
    if (existing !== null) {
      await redis.del(key);
    }
    return existing;
  });
  if (raw === null) {
    return undefined;
  }
  return raw === "1";
}

export async function setPendingConsentMeta(
  redis: MinimalRedisClient,
  email: string,
  meta: PendingConsentMeta
): Promise<void> {
  await withFailClosedRedis(() =>
    redis.set(
      pendingConsentMetaKey(email),
      JSON.stringify(meta),
      "EX",
      PENDING_AUTH_STATE_TTL_SECONDS
    )
  );
}

export async function consumePendingConsentMeta(
  redis: MinimalRedisClient,
  email: string
): Promise<PendingConsentMeta | null> {
  const key = pendingConsentMetaKey(email);
  const raw = await withFailClosedRedis(async () => {
    if (typeof redis.getdel === "function") {
      return await redis.getdel(key);
    }
    const existing = await redis.get(key);
    if (existing !== null) {
      await redis.del(key);
    }
    return existing;
  });
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PendingConsentMeta>;
    if (
      typeof parsed.ipAddress === "string" &&
      typeof parsed.userAgent === "string"
    ) {
      return {
        ipAddress: parsed.ipAddress,
        userAgent: parsed.userAgent,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setPending2faAccountByCookie(
  redis: MinimalRedisClient,
  namespace: AuthInstanceNamespace,
  rawCookieVal: string,
  accountId: number
): Promise<void> {
  await withFailClosedRedis(() =>
    redis.set(
      pending2faCookieKey(namespace, rawCookieVal),
      String(accountId),
      "EX",
      PENDING_AUTH_STATE_TTL_SECONDS
    )
  );
}

export async function readPending2faAccountByCookie(
  redis: MinimalRedisClient,
  namespace: AuthInstanceNamespace,
  rawCookieVal: string
): Promise<number | undefined> {
  const raw = await withFailClosedRedis(() =>
    redis.get(pending2faCookieKey(namespace, rawCookieVal))
  );
  if (raw === null) {
    return undefined;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export async function clearPending2faAccountByCookie(
  redis: MinimalRedisClient,
  namespace: AuthInstanceNamespace,
  rawCookieVal: string
): Promise<void> {
  await withFailClosedRedis(() =>
    redis.del(pending2faCookieKey(namespace, rawCookieVal))
  );
}

export function extractClientIp(headers: Headers | undefined): string {
  const realIp = headers?.get("x-real-ip")?.trim();
  return realIp && realIp.length > 0 ? realIp : "127.0.0.1";
}

export function extractUserAgent(headers: Headers | undefined): string {
  return headers?.get("user-agent")?.trim() || "MindKid Browser";
}

export function readCookieFromHeader(
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

export function hasDontRememberCookie(
  headers: Headers | undefined,
  cookiePrefix: string
): boolean {
  return Boolean(
    readCookieFromHeader(headers, `${cookiePrefix}.dont_remember`) ||
      readCookieFromHeader(headers, `__Secure-${cookiePrefix}.dont_remember`)
  );
}

export function assertActiveOrPendingUserStatus(
  status: string | number | undefined
): void {
  const normalized =
    status === undefined ? undefined : decodeUserStatusValue(status);
  if (normalized === "suspended") {
    throw new APIError("FORBIDDEN", {
      code: "ACCOUNT_SUSPENDED",
      message:
        "Tài khoản đang tạm khoá. Vui lòng liên hệ bộ phận hỗ trợ MindKid.",
    });
  }
  if (normalized === "deleted") {
    throw new APIError("FORBIDDEN", {
      code: "ACCOUNT_DELETED",
      message:
        "Tài khoản đang trong thời gian chờ xoá 30 ngày. Bạn có thể huỷ yêu cầu xoá để khôi phục.",
    });
  }
}

const INVALID_CREDENTIALS_MESSAGE = "Email hoặc mật khẩu không chính xác.";

function invalidCredentialsError(): APIError {
  return new APIError("UNAUTHORIZED", {
    code: "INVALID_CREDENTIALS",
    message: INVALID_CREDENTIALS_MESSAGE,
  });
}

/** Verify với hash thật, hoặc hash giả (giữ thời gian đều) rồi trả false khi không có hash. */
export async function proveSignInPassword(
  password: string,
  passwordHash: string | null | undefined
): Promise<boolean> {
  if (passwordHash) {
    return await verifyPassword(password, passwordHash);
  }
  await verifyPassword(password, getDummyPasswordHash());
  return false;
}

/**
 * BR-LGN-03: chỉ khi người gọi chứng minh được mật khẩu mới được biết tài khoản đang
 * suspended/deleted. Sai mật khẩu (hoặc không có hash) → lỗi chung như user không tồn tại.
 */
export async function assertStatusAfterPasswordProof(
  status: string | number | undefined,
  passwordHash: string | null | undefined,
  password: string
): Promise<void> {
  const normalized =
    status === undefined ? undefined : decodeUserStatusValue(status);
  if (
    (normalized === "suspended" || normalized === "deleted") &&
    !(await proveSignInPassword(password, passwordHash))
  ) {
    throw invalidCredentialsError();
  }
  assertActiveOrPendingUserStatus(status);
}

export function sanitizeAccountTokens<T extends object>(
  account: T,
  callbacks?: UserAuthCallbacks
): Promise<{ data: T }> {
  const sanitized = {
    ...account,
    accessToken: null as string | undefined | null,
    refreshToken: null as string | undefined | null,
    idToken: null as string | undefined | null,
    accessTokenExpiresAt: null as Date | undefined | null,
    refreshTokenExpiresAt: null as Date | undefined | null,
  };
  callbacks?.assertNoOAuthTokens?.({
    accessToken: sanitized.accessToken,
    refreshToken: sanitized.refreshToken,
    idToken: sanitized.idToken,
  });
  return Promise.resolve({ data: sanitized as T });
}

export async function resolveUserIsRemembered(
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
  const stored = await consumePending2faRemember(redis, "user", userId);
  if (stored !== undefined) {
    return stored;
  }
  if (typeof body?.rememberMe === "boolean") {
    return body.rememberMe;
  }
  return !hasDontRememberCookie(headers, "mindkid-user");
}

export async function handleUserSignInBefore(
  body: SignInBodyPayload,
  ipAddress: string,
  callbacks: UserAuthCallbacks | undefined,
  redis: MinimalRedisClient
) {
  const email = (body.email ?? "").trim().toLowerCase();
  await runBetterAuthCallback(async () => {
    await callbacks?.enforceRateLimit?.({
      routeClass: "auth:login",
      ipAddress,
      identifier: email || undefined,
    });
  });
  const normalizedRemember = body.rememberMe === true;

  if (email && callbacks?.getUserStatusByEmail) {
    const getStatusByEmail = callbacks.getUserStatusByEmail;
    const snapshot = await runBetterAuthCallback(() => getStatusByEmail(email));
    if (!snapshot?.hasPassword) {
      await verifyPassword(body.password ?? "", getDummyPasswordHash());
      throw new APIError("UNAUTHORIZED", {
        code: "INVALID_CREDENTIALS",
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }
    await assertStatusAfterPasswordProof(
      snapshot.status,
      snapshot.passwordHash,
      body.password ?? ""
    );
    await setPending2faRemember(
      redis,
      "user",
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

export async function handleUserSignUpBefore(
  body: SignUpBodyPayload,
  ipAddress: string,
  userAgent: string,
  callbacks: UserAuthCallbacks | undefined,
  redis: MinimalRedisClient
): Promise<void> {
  const email = (body.email ?? "").trim().toLowerCase();
  await runBetterAuthCallback(async () => {
    await callbacks?.enforceRateLimit?.({
      routeClass: "auth:register",
      ipAddress,
      identifier: email || undefined,
    });
  });

  const strength = validatePasswordStrength(body.password ?? "");
  if (!strength.valid) {
    throw new APIError("UNPROCESSABLE_ENTITY", {
      code: "VALIDATION_FAILED",
      message: strength.reason ?? "Mật khẩu chưa đủ mạnh.",
    });
  }

  if (!(body.accept_terms === true && body.accept_privacy === true)) {
    throw new APIError("UNPROCESSABLE_ENTITY", {
      code: "VALIDATION_FAILED",
      message: "Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.",
    });
  }

  await runBetterAuthCallback(async () => {
    await callbacks?.validateConsentMarkers?.({
      termsRequirementAt: body.terms_requirement_at ?? null,
      privacyRequirementAt: body.privacy_requirement_at ?? null,
    });
  });

  if (email) {
    await setPendingConsentMeta(redis, email, { ipAddress, userAgent });
  }
}

export async function enforceSessionReauthWindow(input: {
  readonly resolvedSession: Awaited<ReturnType<typeof getSessionFromCtx>>;
  readonly freshAgeSeconds: number;
  readonly customVerify?: ReauthVerifyFn;
}): Promise<void> {
  const { resolvedSession, freshAgeSeconds, customVerify } = input;
  if (!(resolvedSession?.session && resolvedSession.user?.id)) {
    throw new APIError("UNAUTHORIZED", {
      code: "UNAUTHORIZED",
      message: "Bạn cần đăng nhập để tiếp tục.",
    });
  }
  const accountId = Number(resolvedSession.user.id);
  const sessionId = String(resolvedSession.session.id);
  const createdAt = new Date(resolvedSession.session.createdAt);
  const rawReauth = (
    resolvedSession.session as { reauthAt?: Date | string | null }
  ).reauthAt;
  const dbReauthAt = rawReauth ? new Date(rawReauth) : null;

  if (customVerify) {
    await runBetterAuthCallback(() =>
      customVerify({
        accountId,
        sessionId,
        createdAt,
        dbReauthAt,
      })
    );
    return;
  }

  if (!dbReauthAt || Number.isNaN(dbReauthAt.getTime())) {
    throw new APIError("PRECONDITION_REQUIRED", {
      code: "REAUTH_REQUIRED",
      message: "Vui lòng xác thực lại để tiếp tục thao tác nhạy cảm.",
    });
  }
  const ageMs = Date.now() - dbReauthAt.getTime();
  if (ageMs < 0 || ageMs > freshAgeSeconds * 1000) {
    throw new APIError("PRECONDITION_REQUIRED", {
      code: "REAUTH_REQUIRED",
      message: "Vui lòng xác thực lại để tiếp tục thao tác nhạy cảm.",
    });
  }
}

export async function enforceUserLinkOrUnlinkRules(
  path: string,
  resolvedSession: Awaited<ReturnType<typeof getSessionFromCtx>>,
  callbacks: UserAuthCallbacks | undefined,
  freshAgeSeconds: number
): Promise<void> {
  if (!(resolvedSession?.session && resolvedSession.user?.id)) {
    return;
  }
  await enforceSessionReauthWindow({
    resolvedSession,
    freshAgeSeconds,
    customVerify: callbacks?.verifySessionReauth
      ? async (params) => {
          await callbacks.verifySessionReauth?.({
            userId: params.accountId,
            sessionId: params.sessionId,
            createdAt: params.createdAt,
            dbReauthAt: params.dbReauthAt,
          });
        }
      : undefined,
  });

  if (path === "/unlink-account" && callbacks?.countUserLoginMethods) {
    const countMethods = callbacks.countUserLoginMethods;
    const userIdNum = Number(resolvedSession.user.id);
    const methodCount = await runBetterAuthCallback(() =>
      countMethods(userIdNum)
    );
    if (methodCount <= 1) {
      throw new APIError("BAD_REQUEST", {
        code: "LAST_LOGIN_METHOD",
        message: "Không thể gỡ phương thức đăng nhập cuối cùng của tài khoản.",
      });
    }
  }
}

export async function enforcePasskeyMutationBeforeHook(input: {
  readonly path: string;
  readonly ctx: GenericEndpointContext;
  readonly freshAgeSeconds: number;
  readonly customVerify?: ReauthVerifyFn;
  readonly countUserLoginMethods?: (userId: number) => Promise<number>;
}): Promise<{ context: { body: PasskeyVerifyRegistrationBody } } | undefined> {
  const resolvedSession = await getSessionFromCtx(input.ctx, {
    disableCookieCache: true,
  });
  await enforceSessionReauthWindow({
    resolvedSession,
    freshAgeSeconds: input.freshAgeSeconds,
    customVerify: input.customVerify,
  });

  if (
    input.path === "/passkey/delete-passkey" &&
    input.countUserLoginMethods &&
    resolvedSession?.user?.id
  ) {
    const countMethods = input.countUserLoginMethods;
    const uid = Number(resolvedSession.user.id);
    const methodCount = await runBetterAuthCallback(() => countMethods(uid));
    if (methodCount <= 1) {
      throw new APIError("BAD_REQUEST", {
        code: "LAST_LOGIN_METHOD",
        message: "Không thể gỡ phương thức đăng nhập cuối cùng của tài khoản.",
      });
    }
  }

  if (input.path === "/passkey/verify-registration") {
    const currentBody = (input.ctx.body ?? {}) as PasskeyVerifyRegistrationBody;
    return {
      context: {
        body: {
          ...currentBody,
          createSession: false,
        },
      },
    };
  }
  return undefined;
}

export async function enforceTotpStepUpForSensitiveMfaAction(input: {
  readonly ctx: GenericEndpointContext;
  readonly resolvedSession: Awaited<ReturnType<typeof getSessionFromCtx>>;
  readonly namespace: AuthInstanceNamespace;
  readonly rootSecret: string;
  readonly freshAgeSeconds: number;
  readonly mfaGuard: MfaAttemptGuard;
  readonly verifySessionReauth?: ReauthVerifyFn;
}): Promise<void> {
  const {
    ctx,
    resolvedSession,
    namespace,
    rootSecret,
    freshAgeSeconds,
    mfaGuard,
    verifySessionReauth,
  } = input;

  await enforceSessionReauthWindow({
    resolvedSession,
    freshAgeSeconds,
    customVerify: verifySessionReauth,
  });

  if (!resolvedSession?.user?.id) {
    throw new APIError("UNAUTHORIZED", {
      code: "UNAUTHORIZED",
      message: "Bạn cần đăng nhập để tiếp tục.",
    });
  }

  const accountId = Number(resolvedSession.user.id);
  await runBetterAuthCallback(() =>
    mfaGuard.assertNotLocked(namespace, accountId)
  );

  const twoFactorRecord =
    await ctx.context.adapter.findOne<TwoFactorTableRecord>({
      model: "twoFactor",
      where: [
        {
          field: "userId",
          value: resolvedSession.user.id,
        },
      ],
    });
  if (
    !twoFactorRecord ||
    twoFactorRecord.verified === false ||
    !twoFactorRecord.secret
  ) {
    throw new APIError("BAD_REQUEST", {
      code: "TWO_FACTOR_NOT_ENABLED",
      message: "Xác thực hai yếu tố chưa được kích hoạt.",
    });
  }

  const headerCode = ctx.headers?.get("x-mindkid-totp")?.trim() ?? "";
  const bodyObj = (ctx.body ?? null) as TotpBodyPayload | null;
  const bodyCode = (bodyObj?.totp ?? bodyObj?.code ?? "").trim();
  const totpCode = headerCode || bodyCode;

  let candidateSecret = twoFactorRecord.secret;
  try {
    const decrypted = await symmetricDecrypt({
      key: ctx.context.secretConfig,
      data: twoFactorRecord.secret,
    });
    candidateSecret = decrypted.startsWith("base32:")
      ? decrypted.slice(7)
      : decrypted;
  } catch {
    candidateSecret = twoFactorRecord.secret.startsWith("base32:")
      ? twoFactorRecord.secret.slice(7)
      : twoFactorRecord.secret;
  }

  const isValid =
    SIX_DIGIT_TOTP_PATTERN.test(totpCode) &&
    (await verifyBetterAuthTotp({
      storedSecret: candidateSecret,
      rootSecret,
      namespace,
      code: totpCode,
    }));

  if (!isValid) {
    await runBetterAuthCallback(() =>
      mfaGuard.recordFailure(namespace, accountId)
    );
    throw new APIError("UNAUTHORIZED", {
      code: "MFA_INVALID_CODE",
      message: "Mã xác thực hai yếu tố không chính xác.",
    });
  }

  await runBetterAuthCallback(() => mfaGuard.reset(namespace, accountId));
}

export async function issueTwoFactorChallengeAndRevokeSession(input: {
  readonly ctx: GenericEndpointContext;
  readonly namespace: AuthInstanceNamespace;
  readonly redis: MinimalRedisClient;
  readonly rememberMe?: boolean;
}): Promise<void> {
  const { ctx, namespace, redis, rememberMe = false } = input;
  const newSession = ctx.context.newSession;
  if (!(newSession?.session && newSession.user?.id)) {
    return;
  }
  const userId = String(newSession.user.id);
  const sessionToken = newSession.session.token;

  await ctx.context.internalAdapter.deleteSession(sessionToken);
  deleteSessionCookie(ctx, true);
  ctx.context.setNewSession(null);

  const maxAgeSeconds = PENDING_AUTH_STATE_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);
  const identifier = `two-factor-${generateTokenHex(16)}`;

  await ctx.context.internalAdapter.createVerificationValue({
    identifier,
    value: userId,
    expiresAt,
  });
  await ctx.context.internalAdapter.createVerificationValue({
    identifier: `2fa-attempts-${identifier}`,
    value: "0",
    expiresAt,
  });

  const tfCookie = ctx.context.createAuthCookie("two_factor", {
    maxAge: maxAgeSeconds,
  });
  await ctx.setSignedCookie(
    tfCookie.name,
    identifier,
    ctx.context.secret,
    tfCookie.attributes
  );

  await setPending2faRemember(redis, namespace, userId, rememberMe);
}

export async function revokeOtherInstanceSessions(input: {
  readonly accountId: number;
  readonly keepSessionToken: string;
  readonly internalAdapter: GenericEndpointContext["context"]["internalAdapter"];
  readonly customRevokeOtherSessions?: (
    accountId: number,
    keepSessionToken: string
  ) => Promise<void>;
}): Promise<void> {
  const {
    accountId,
    keepSessionToken,
    internalAdapter,
    customRevokeOtherSessions,
  } = input;
  if (customRevokeOtherSessions) {
    await runBetterAuthCallback(() =>
      customRevokeOtherSessions(accountId, keepSessionToken)
    );
    return;
  }
  const sessions = await internalAdapter.listSessions(String(accountId));
  const others = sessions.filter((sess) => sess.token !== keepSessionToken);
  await Promise.all(
    others.map((sess) => internalAdapter.deleteSession(sess.token))
  );
}

export async function shouldInvalidateGetSessionUser(
  returned: {
    user?: {
      id?: string | number;
      status?: string | number;
      uuid?: string;
      sessionVersion?: number | string;
    };
  } | null,
  callbacks: UserAuthCallbacks | undefined
): Promise<boolean> {
  if (!returned || isAPIError(returned) || !returned.user) {
    return false;
  }
  let effectiveStatus =
    returned.user.status === undefined
      ? undefined
      : decodeUserStatusValue(returned.user.status);
  if (callbacks?.getUserStatusById && returned.user.id !== undefined) {
    const getById = callbacks.getUserStatusById;
    const userIdNum = Number(returned.user.id);
    const live = await runBetterAuthCallback(() => getById(userIdNum));
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
    effectiveStatus = decodeUserStatusValue(live.status);
  }
  return effectiveStatus === "suspended" || effectiveStatus === "deleted";
}

export async function enforcePendingTwoFactorGuard(input: {
  readonly namespace: AuthInstanceNamespace;
  readonly rawCookieVal: string | null;
  readonly signedTf: string | false | null | undefined;
  readonly findVerificationValue: (
    identifier: string
  ) => Promise<{ value: string } | null>;
  readonly redis: MinimalRedisClient;
  readonly mfaGuard: MfaAttemptGuard;
}): Promise<number | undefined> {
  if (typeof input.signedTf !== "string" || input.signedTf.length === 0) {
    return undefined;
  }
  const signedId = input.signedTf;
  const ver = await input.findVerificationValue(signedId);
  const targetAccountId = ver ? Number(ver.value) : Number.NaN;
  if (!Number.isInteger(targetAccountId) || targetAccountId <= 0) {
    if (input.rawCookieVal) {
      const cachedAccountId = await readPending2faAccountByCookie(
        input.redis,
        input.namespace,
        input.rawCookieVal
      );
      if (cachedAccountId !== undefined) {
        await runBetterAuthCallback(() =>
          input.mfaGuard.assertNotLocked(input.namespace, cachedAccountId)
        );
        return cachedAccountId;
      }
    }
    return undefined;
  }
  if (input.rawCookieVal) {
    await setPending2faAccountByCookie(
      input.redis,
      input.namespace,
      input.rawCookieVal,
      targetAccountId
    );
  }
  await runBetterAuthCallback(() =>
    input.mfaGuard.assertNotLocked(input.namespace, targetAccountId)
  );
  return targetAccountId;
}

export async function handleTwoFactorVerifyBeforeHook(input: {
  readonly ctx: GenericEndpointContext;
  readonly path: string;
  readonly namespace: AuthInstanceNamespace;
  readonly redis: MinimalRedisClient;
  readonly mfaGuard: MfaAttemptGuard;
  readonly pendingAuthAccountByCtx: WeakMap<object, number>;
  readonly pendingMfaActivationByCtx: WeakMap<object, number>;
  /**
   * Trục account của `auth:mfa` (BR-RTL-01): trục IP đã do middleware đếm, nhưng
   * một IP đổi liên tục vẫn dò được mã TOTP của một tài khoản.
   */
  readonly enforceAccountRateLimit?: (accountId: number) => Promise<void>;
}): Promise<void> {
  const {
    ctx,
    path,
    namespace,
    redis,
    mfaGuard,
    pendingAuthAccountByCtx,
    pendingMfaActivationByCtx,
    enforceAccountRateLimit,
  } = input;
  const tfCookie = ctx.context.createAuthCookie("two_factor");
  const signedTf = await ctx.getSignedCookie(tfCookie.name, ctx.context.secret);
  if (typeof signedTf === "string" && signedTf.length > 0) {
    const pendingAccountId = await enforcePendingTwoFactorGuard({
      namespace,
      rawCookieVal: readCookieFromHeader(ctx.headers, tfCookie.name),
      signedTf,
      findVerificationValue: (id) =>
        ctx.context.internalAdapter.findVerificationValue(id),
      redis,
      mfaGuard,
    });
    if (pendingAccountId !== undefined) {
      await enforceAccountRateLimit?.(pendingAccountId);
    }
    return;
  }

  const activeSession = await getSessionFromCtx(ctx, {
    disableCookieCache: true,
  });
  if (!(activeSession?.session && activeSession.user?.id)) {
    return;
  }
  const accountId = Number(activeSession.user.id);
  pendingAuthAccountByCtx.set(ctx.context, accountId);
  await runBetterAuthCallback(() =>
    mfaGuard.assertNotLocked(namespace, accountId)
  );
  await enforceAccountRateLimit?.(accountId);
  const userFlags = activeSession.user as {
    twoFactorEnabled?: boolean;
    mfaEnabled?: boolean;
  };
  if (
    path === "/two-factor/verify-totp" &&
    !userFlags.twoFactorEnabled &&
    !userFlags.mfaEnabled
  ) {
    pendingMfaActivationByCtx.set(ctx.context, accountId);
  }
}

export async function resolvePendingTwoFactorAccountId(input: {
  readonly ctx: GenericEndpointContext;
  readonly namespace: AuthInstanceNamespace;
  readonly redis: MinimalRedisClient;
  readonly rawTf: string | null;
  readonly tfCookieName: string;
  readonly pendingAuthAccountByCtx: WeakMap<object, number>;
}): Promise<number | undefined> {
  const {
    ctx,
    namespace,
    redis,
    rawTf,
    tfCookieName,
    pendingAuthAccountByCtx,
  } = input;
  if (rawTf) {
    const cached = await readPending2faAccountByCookie(redis, namespace, rawTf);
    if (cached !== undefined) {
      return cached;
    }
    const signedTf = await ctx.getSignedCookie(
      tfCookieName,
      ctx.context.secret
    );
    if (typeof signedTf === "string" && signedTf.length > 0) {
      const ver =
        await ctx.context.internalAdapter.findVerificationValue(signedTf);
      const parsed = ver ? Number(ver.value) : Number.NaN;
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  return pendingAuthAccountByCtx.get(ctx.context);
}

function getContextResponseHeaders(
  ctx: GenericEndpointContext
): Headers | undefined {
  if (
    "responseHeaders" in ctx.context &&
    ctx.context.responseHeaders instanceof Headers
  ) {
    return ctx.context.responseHeaders;
  }
  return undefined;
}

export async function handleOAuthSignInMfaAfter(input: {
  readonly ctx: GenericEndpointContext;
  readonly redis: MinimalRedisClient;
  readonly siteUrl: string;
}) {
  const { ctx, redis, siteUrl } = input;
  const userWith2fa = ctx.context.newSession?.user as
    | { twoFactorEnabled?: boolean }
    | undefined;
  if (userWith2fa?.twoFactorEnabled !== true) {
    return undefined;
  }
  const oauthState = await getOAuthState().catch(() => null);
  if (oauthState?.link) {
    return undefined;
  }

  await issueTwoFactorChallengeAndRevokeSession({
    ctx,
    namespace: "user",
    redis,
    rememberMe: false,
  });

  if (ctx.path?.startsWith("/callback/")) {
    const rawCallback =
      typeof oauthState?.callbackURL === "string"
        ? oauthState.callbackURL
        : (getContextResponseHeaders(ctx)?.get("location") ?? null);
    const safeRelative = sanitizeRedirectTarget(rawCallback, "");
    const redirectUrl = new URL("/login", siteUrl);
    redirectUrl.searchParams.set("mfa", "1");
    if (safeRelative) {
      redirectUrl.searchParams.set("callbackURL", safeRelative);
    }
    throw ctx.redirect(redirectUrl.toString());
  }

  return ctx.json({
    twoFactorRedirect: true,
    twoFactorMethods: ["totp"],
  });
}

export async function computeSessionReauthAt(input: {
  readonly pathStr: string;
  readonly userId: string | number;
  readonly snapshot2faEnabled: boolean;
  readonly ctx: GenericEndpointContext | null;
  readonly now: Date;
}): Promise<Date | null> {
  const { pathStr, userId, snapshot2faEnabled, ctx, now } = input;
  const isVerify2faPath =
    pathStr === "/two-factor/verify-totp" ||
    pathStr === "/two-factor/verify-backup-code";
  if (isVerify2faPath) {
    return now;
  }
  const isPre2faLoginPath =
    pathStr === "/sign-in/email" ||
    pathStr === "/sign-up/email" ||
    pathStr === "/passkey/verify-authentication" ||
    pathStr === "/sign-in/social" ||
    pathStr.startsWith("/callback/");
  if (!isPre2faLoginPath) {
    return null;
  }
  // BR-AUT-13: passkey (UV=required) là xác thực mạnh — fresh kể cả khi user bật 2FA.
  const isPasskeyPath = pathStr === "/passkey/verify-authentication";
  if (isPasskeyPath) {
    return now;
  }
  if (snapshot2faEnabled) {
    return null;
  }
  if (ctx?.context?.internalAdapter?.findUserById) {
    const dbUser = await ctx.context.internalAdapter
      .findUserById(String(userId))
      .catch(() => null);
    const userFlags = dbUser as {
      twoFactorEnabled?: boolean;
      mfaEnabled?: boolean;
    } | null;
    if (
      userFlags?.twoFactorEnabled === true ||
      userFlags?.mfaEnabled === true
    ) {
      return null;
    }
  }
  return now;
}

export function alignNewSessionCookies(
  ctx: GenericEndpointContext,
  cookiePrefix: string
): void {
  const newSession = ctx.context.newSession;
  if (!newSession?.session?.expiresAt) {
    return;
  }
  const ttlSeconds = Math.max(
    1,
    Math.round(
      (new Date(newSession.session.expiresAt).getTime() - Date.now()) / 1000
    )
  );
  alignSessionCookieMaxAge(
    getContextResponseHeaders(ctx),
    cookiePrefix,
    ttlSeconds
  );
  alignSessionCookieMaxAge(ctx.responseHeaders, cookiePrefix, ttlSeconds);
}
