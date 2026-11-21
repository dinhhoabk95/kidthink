import { APIError, type getSessionFromCtx, isAPIError } from "better-auth/api";
import {
  type BoundedTtlMap,
  runBetterAuthCallback,
} from "./better-auth-error.js";
import type { AuthInstanceNamespace } from "./hmac-secret.js";
import type { MfaAttemptGuard } from "./mfa-lockout.js";
import { validatePasswordStrength, verifyPassword } from "./password.js";
import type { UserAuthCallbacks } from "./user-auth-types.js";

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

const DUMMY_ARGON2_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$Zmx0piJSIcdd2b8oaF8ZUg$U60ArJk0sNteiIdlfZyr7G0shEXA+IqCyWIKs1La4WE";

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
  status: string | undefined
): void {
  if (status === "suspended") {
    throw new APIError("FORBIDDEN", {
      code: "ACCOUNT_SUSPENDED",
      message:
        "Tài khoản đang tạm khoá. Vui lòng liên hệ bộ phận hỗ trợ MindKid.",
    });
  }
  if (status === "deleted") {
    throw new APIError("FORBIDDEN", {
      code: "ACCOUNT_DELETED",
      message:
        "Tài khoản đang trong thời gian chờ xoá 30 ngày. Bạn có thể huỷ yêu cầu xoá để khôi phục.",
    });
  }
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

export function resolveUserIsRemembered(
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
  return !hasDontRememberCookie(headers, "mindkid-user");
}

export async function handleUserSignInBefore(
  body: SignInBodyPayload,
  ipAddress: string,
  callbacks: UserAuthCallbacks | undefined,
  pending2faRemember: BoundedTtlMap<boolean>
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
      await verifyPassword(body.password ?? "", DUMMY_ARGON2_HASH);
      throw new APIError("UNAUTHORIZED", {
        code: "INVALID_CREDENTIALS",
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }
    assertActiveOrPendingUserStatus(snapshot.status);
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

export async function handleUserSignUpBefore(
  body: SignUpBodyPayload,
  ipAddress: string,
  userAgent: string,
  callbacks: UserAuthCallbacks | undefined,
  pendingConsentMeta: BoundedTtlMap<{ ipAddress: string; userAgent: string }>
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
    pendingConsentMeta.set(email, { ipAddress, userAgent });
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
  const userIdNum = Number(resolvedSession.user.id);
  const sessionIdStr = String(resolvedSession.session.id);
  const createdAt = new Date(resolvedSession.session.createdAt);
  const rawReauth = (
    resolvedSession.session as { reauthAt?: Date | string | null }
  ).reauthAt;
  const dbReauthAt = rawReauth ? new Date(rawReauth) : null;

  if (callbacks?.verifySessionReauth) {
    const verifyReauth = callbacks.verifySessionReauth;
    await runBetterAuthCallback(() =>
      verifyReauth({
        userId: userIdNum,
        sessionId: sessionIdStr,
        createdAt,
        dbReauthAt,
      })
    );
  } else {
    const effectiveReauth = dbReauthAt ?? createdAt;
    if (Date.now() - effectiveReauth.getTime() > freshAgeSeconds * 1000) {
      throw new APIError("PRECONDITION_REQUIRED", {
        code: "REAUTH_REQUIRED",
        message: "Vui lòng xác thực lại để tiếp tục thao tác nhạy cảm.",
      });
    }
  }

  if (path === "/unlink-account" && callbacks?.countUserLoginMethods) {
    const countMethods = callbacks.countUserLoginMethods;
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

export async function shouldInvalidateGetSessionUser(
  returned: { user?: { id?: string | number; status?: string } } | null,
  callbacks: UserAuthCallbacks | undefined
): Promise<boolean> {
  if (!returned || isAPIError(returned) || !returned.user) {
    return false;
  }
  let effectiveStatus = returned.user.status;
  if (callbacks?.getUserStatusById && returned.user.id !== undefined) {
    const getById = callbacks.getUserStatusById;
    const userIdNum = Number(returned.user.id);
    const live = await runBetterAuthCallback(() => getById(userIdNum));
    if (live) {
      effectiveStatus = live.status;
    }
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
  readonly pendingAccountByCookie: BoundedTtlMap<number>;
  readonly mfaGuard: MfaAttemptGuard;
}): Promise<void> {
  if (typeof input.signedTf !== "string" || input.signedTf.length === 0) {
    return;
  }
  const signedId = input.signedTf;
  const ver = await input.findVerificationValue(signedId);
  const targetAccountId = ver ? Number(ver.value) : Number.NaN;
  if (!Number.isInteger(targetAccountId) || targetAccountId <= 0) {
    return;
  }
  if (input.rawCookieVal) {
    input.pendingAccountByCookie.set(input.rawCookieVal, targetAccountId);
  }
  await runBetterAuthCallback(() =>
    input.mfaGuard.assertNotLocked(input.namespace, targetAccountId)
  );
}
