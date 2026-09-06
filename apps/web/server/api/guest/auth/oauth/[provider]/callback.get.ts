import {
  decodeOAuthStatePayload,
  getBrowserSessionService,
  getOAuthRegistry,
  isOAuthProvider,
  type NormalizedProfile,
  OAUTH_COOKIE_NAME,
  type OAuthProvider,
  type OAuthStatePayload,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import {
  auditLogs,
  getAppDb,
  getAppSql,
  mfaSettings,
  PostgresSessionStore,
  socialIdentities,
  users,
} from "@mindkid/db";
import {
  AccountDeletedError,
  AccountSuspendedError,
} from "@mindkid/errors/account";
import { MfaRequiredError, UnauthenticatedError } from "@mindkid/errors/auth";
import { NotFoundError } from "@mindkid/errors/common";
import {
  OauthProviderDisabledError,
  OauthStateInvalidError,
  SocialIdentityAlreadyLinkedError,
  SocialProviderAlreadyLinkedError,
} from "@mindkid/errors/social";
import { enforceTwoAxisRateLimit } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import {
  defineEventHandler,
  deleteCookie,
  getCookie,
  getHeader,
  getQuery,
  getRequestURL,
  getRouterParam,
  type H3Event,
  sendRedirect,
  setCookie,
} from "h3";
import {
  assertRateLimitAllowed,
  ensureUserCsrfCookie,
  getVerifiedRemoteIp,
} from "#server/utils/auth-runtime";

function getOAuthStateSecret(): string {
  return requireEnv("NUXT_SESSION_PASSWORD");
}

export function maskEmail(email: string | null): string {
  if (!email?.includes("@")) {
    return "******";
  }
  const [name, domain] = email.split("@");
  const firstChar = name?.[0] || "*";
  return `${firstChar}***@${domain}`;
}

export const OAUTH_TICKET_COOKIE_NAME = "tm_oauth_ticket";

function validateOAuthProvider(
  _event: H3Event,
  rawProvider: string
): OAuthProvider {
  if (!isOAuthProvider(rawProvider)) {
    throw new OauthProviderDisabledError();
  }

  const registry = getOAuthRegistry();
  if (!registry.isProviderEnabled(rawProvider)) {
    throw new OauthProviderDisabledError();
  }

  return rawProvider;
}

function parseAndValidateState(
  event: H3Event,
  rawProvider: OAuthProvider,
  queryState: unknown
): OAuthStatePayload {
  const stateCookie = getCookie(event, OAUTH_COOKIE_NAME);
  if (!stateCookie) {
    throw new OauthStateInvalidError();
  }

  const statePayload = decodeOAuthStatePayload(
    stateCookie,
    getOAuthStateSecret()
  );

  deleteCookie(event, OAUTH_COOKIE_NAME, { path: "/" });

  if (
    !statePayload ||
    statePayload.provider !== rawProvider ||
    statePayload.state !== queryState
  ) {
    throw new OauthStateInvalidError();
  }

  return statePayload;
}

async function handleOAuthLinkFlow(
  event: H3Event,
  currentUserId: number | undefined,
  rawProvider: OAuthProvider,
  profile: NormalizedProfile,
  returnTo: string
) {
  if (!currentUserId) {
    throw new UnauthenticatedError();
  }

  const db = getAppDb();
  const now = new Date();

  // Check BR-SLK-02: UNIQUE (user_id, provider)
  const [existingUserProvider] = await db
    .select()
    .from(socialIdentities)
    .where(
      and(
        eq(socialIdentities.userId, currentUserId),
        eq(socialIdentities.provider, rawProvider)
      )
    );

  if (existingUserProvider) {
    throw new SocialProviderAlreadyLinkedError();
  }

  // Check BR-SLK-06: UNIQUE (provider, provider_user_id) attached to another user
  const [existingIdentity] = await db
    .select()
    .from(socialIdentities)
    .where(
      and(
        eq(socialIdentities.provider, rawProvider),
        eq(socialIdentities.providerUserId, profile.provider_user_id)
      )
    );

  if (existingIdentity) {
    throw new SocialIdentityAlreadyLinkedError();
  }

  // Insert social identity (BR-SLK-03: NEVER overwrite users.email)
  await db.insert(socialIdentities).values({
    userId: currentUserId,
    provider: rawProvider,
    providerUserId: profile.provider_user_id,
    emailAtProvider: profile.email_at_provider,
    emailVerifiedAtProvider: profile.email_verified_at_provider,
    displayNameAtProvider: profile.display_name_at_provider,
    linkedAt: now,
    lastLoginAt: now,
  });

  // Audit log (BR-SLK-05, §7.3)
  await db.insert(auditLogs).values({
    actorType: "user",
    actorId: currentUserId,
    action: "social_identity.linked",
    entityType: "social_identity",
    entityId: String(currentUserId),
    afterData: { provider: rawProvider },
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") || "unknown",
  });

  return sendRedirect(event, `${returnTo}?linked=${rawProvider}`, 302);
}

async function establishUserSession(
  event: H3Event,
  user: { id: number; displayName: string },
  identityId: number
) {
  const now = new Date();
  const db = getAppDb();

  const sessionService = getBrowserSessionService();
  const createdSession = await sessionService.create({
    namespace: "user",
    accountId: user.id,
    displayName: user.displayName,
    rememberMe: false,
    ipAddress: getVerifiedRemoteIp(event),
  });

  await setUserSession(event, {
    secure: { session_token: createdSession.sessionToken },
  });

  ensureUserCsrfCookie(event);

  const pgStore = new PostgresSessionStore(getAppSql());
  await pgStore
    .recordSession({
      account_type: "user",
      account_id: user.id,
      device_id: createdSession.deviceId,
      remembered: false,
      device_label: getHeader(event, "user-agent") || "unknown",
      ip_address: getVerifiedRemoteIp(event),
      auth_method: "social",
      expires_at: createdSession.expiresAt,
    })
    .catch(() => null);

  await db
    .update(socialIdentities)
    .set({ lastLoginAt: now, updatedAt: now })
    .where(eq(socialIdentities.id, identityId));

  await db.update(users).set({ updatedAt: now }).where(eq(users.id, user.id));
}

async function handleOAuthLoginFlow(
  event: H3Event,
  rawProvider: OAuthProvider,
  profile: NormalizedProfile,
  returnTo: string
) {
  const db = getAppDb();

  // D-IO: Tra cứu danh tính theo (provider, provider_user_id) DUY NHẤT
  const [existingIdentity] = await db
    .select()
    .from(socialIdentities)
    .where(
      and(
        eq(socialIdentities.provider, rawProvider),
        eq(socialIdentities.providerUserId, profile.provider_user_id)
      )
    );

  // Nhánh A: Đã liên kết
  if (existingIdentity) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, existingIdentity.userId));

    if (!user) {
      throw new NotFoundError();
    }

    if (user.status === "suspended") {
      throw new AccountSuspendedError();
    }
    if (user.status === "deleted") {
      throw new AccountDeletedError({
        cancel_url: "/me/settings/delete/cancel",
        purge_at: user.purgeAt?.toISOString(),
      });
    }

    // D-IN & BR-SCL-07: Check MFA settings
    const [mfa] = await db
      .select()
      .from(mfaSettings)
      .where(
        and(
          eq(mfaSettings.accountType, "user"),
          eq(mfaSettings.accountId, user.id)
        )
      );

    if (mfa?.confirmedAt) {
      throw new MfaRequiredError(
        "Vui lòng hoàn tất xác thực đa yếu tố để tiếp tục.",
        { user_id: user.id }
      );
    }

    await establishUserSession(event, user, existingIdentity.id);

    const target = returnTo === "/play" ? "/me" : returnTo;
    return sendRedirect(event, target, 302);
  }

  // Nhánh C: Email Conflict
  if (profile.email_at_provider) {
    const [conflictUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, profile.email_at_provider.toLowerCase()));

    if (conflictUser) {
      const masked = maskEmail(profile.email_at_provider);
      return sendRedirect(
        event,
        `/dang-nhap?error=social_email_conflict&provider=${rawProvider}&masked_email=${encodeURIComponent(masked)}`,
        302
      );
    }
  }

  // Nhánh B: Registration Ticket
  const ticketPayload = { profile, created_at: Date.now() };
  const ticketToken = Buffer.from(
    JSON.stringify(ticketPayload),
    "utf8"
  ).toString("base64url");

  setCookie(event, OAUTH_TICKET_COOKIE_NAME, ticketToken, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return sendRedirect(event, `/dang-ky/dong-y?provider=${rawProvider}`, 302);
}

export default defineEventHandler(async (event) => {
  const rawParam = getRouterParam(event, "provider") || "";
  const provider = validateOAuthProvider(event, rawParam);
  const query = getQuery(event);

  if (query.error === "access_denied") {
    deleteCookie(event, OAUTH_COOKIE_NAME, { path: "/" });
    return sendRedirect(event, "/dang-nhap?cancelled=true", 302);
  }

  const statePayload = parseAndValidateState(event, provider, query.state);

  const ipRateLimit = await enforceTwoAxisRateLimit({
    routeClass: "auth:oauth:callback",
    remoteIp: getVerifiedRemoteIp(event),
  });
  assertRateLimitAllowed(ipRateLimit.statusCode);

  const registry = getOAuthRegistry();
  const requestUrl = getRequestURL(event);
  const profile = await registry.handleCallback(
    provider,
    requestUrl,
    statePayload.code_verifier
  );

  if (statePayload.intent === "link") {
    return await handleOAuthLinkFlow(
      event,
      statePayload.user_id,
      provider,
      profile,
      statePayload.return_to
    );
  }

  return await handleOAuthLoginFlow(
    event,
    provider,
    profile,
    statePayload.return_to
  );
});
