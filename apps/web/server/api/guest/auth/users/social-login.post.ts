import {
  generateSecureToken,
  getBrowserSessionService,
  hashSecureToken,
  type NormalizedProfile,
} from "@mindkid/auth";
import {
  auditLogs,
  consentLogs,
  getAppDb,
  getAppSql,
  PostgresSessionStore,
  socialIdentities,
  users,
  verificationTokens,
} from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import {
  OauthStateInvalidError,
  SocialEmailConflictError,
  SocialIdentityAlreadyLinkedError,
} from "@mindkid/errors/social";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { enforceTwoAxisRateLimit } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import {
  defineEventHandler,
  getHeader,
  type H3Event,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import { buildAccountActionUrl } from "#server/utils/account-action-url";
import { throwValidationError } from "#server/utils/api-error";
import {
  assertRateLimitAllowed,
  ensureUserCsrfCookie,
  getVerifiedRemoteIp,
} from "#server/utils/auth-runtime";
import {
  clearOAuthTicketCookie,
  readOAuthTicketProfile,
} from "#server/utils/oauth-ticket";

const SocialRegisterSchema = z
  .object({
    provider: z.enum(["google", "facebook"]),
    display_name: z.string().trim().min(2).max(60).optional(),
    email: z.string().trim().email().max(255).optional(),
    accept_terms: z.boolean(),
    accept_privacy: z.boolean(),
  })
  .strict();

type SocialRegisterInput = z.infer<typeof SocialRegisterSchema>;

type RawSocialLoginBody =
  | Record<string, string | number | boolean | null | undefined>
  | null
  | undefined;

function parseRegistrationPayload(
  rawBody: RawSocialLoginBody
): SocialRegisterInput {
  const parsed = SocialRegisterSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  if (!(parsed.data.accept_terms && parsed.data.accept_privacy)) {
    throw ValidationError.field(
      "accept_terms",
      "Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư."
    );
  }

  return parsed.data;
}

function resolveProfileFromTicket(
  event: H3Event,
  expectedProvider: string
): NormalizedProfile {
  const profile = readOAuthTicketProfile(event);
  clearOAuthTicketCookie(event);
  if (!profile || profile.provider !== expectedProvider) {
    throw new OauthStateInvalidError(
      "Phiên đăng ký mạng xã hội đã hết hạn. Vui lòng thử lại."
    );
  }
  return profile;
}

async function assertNoRegistrationConflicts(
  email: string,
  profile: NormalizedProfile
) {
  const db = getAppDb();

  const [existingEmailUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existingEmailUser) {
    throw new SocialEmailConflictError({
      provider: profile.provider,
      masked_email: `${email[0]}***@${email.split("@")[1]}`,
    });
  }

  const [existingIdentity] = await db
    .select()
    .from(socialIdentities)
    .where(
      and(
        eq(socialIdentities.provider, profile.provider),
        eq(socialIdentities.providerUserId, profile.provider_user_id)
      )
    );

  if (existingIdentity) {
    throw new SocialIdentityAlreadyLinkedError();
  }
}

async function executeRegistrationTransaction(
  event: H3Event,
  email: string,
  displayName: string,
  profile: NormalizedProfile
) {
  const db = getAppDb();
  const remoteIp = getVerifiedRemoteIp(event);
  const userAgent = getHeader(event, "user-agent") || "unknown";
  const now = new Date();

  const userStatus =
    profile.provider === "google" && profile.email_verified_at_provider
      ? "active"
      : "pending_verification";

  return await db.transaction(async (tx) => {
    const [createdUser] = await tx
      .insert(users)
      .values({
        email,
        displayName,
        passwordHash: null,
        status: userStatus,
        emailVerifiedAt: userStatus === "active" ? now : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!createdUser) {
      throw new Error("Failed to insert user");
    }

    await tx.insert(socialIdentities).values({
      userId: createdUser.id,
      provider: profile.provider,
      providerUserId: profile.provider_user_id,
      emailAtProvider: profile.email_at_provider,
      emailVerifiedAtProvider: profile.email_verified_at_provider,
      displayNameAtProvider: profile.display_name_at_provider,
      linkedAt: now,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(consentLogs).values([
      {
        userId: createdUser.id,
        consentType: "terms",
        action: "accepted",
        ipAddress: remoteIp,
        userAgent,
        createdAt: now,
      },
      {
        userId: createdUser.id,
        consentType: "privacy",
        action: "accepted",
        ipAddress: remoteIp,
        userAgent,
        createdAt: now,
      },
    ]);

    await tx.insert(auditLogs).values({
      actorType: "user",
      actorId: createdUser.id,
      action: "user.registered_social",
      entityType: "user",
      entityId: String(createdUser.id),
      afterData: { provider: profile.provider },
      ipAddress: remoteIp,
      userAgent,
      createdAt: now,
    });

    return createdUser;
  });
}

async function establishRegistrationSession(
  event: H3Event,
  user: { id: number; displayName: string }
) {
  const remoteIp = getVerifiedRemoteIp(event);
  const userAgent = getHeader(event, "user-agent") || "unknown";

  const sessionService = getBrowserSessionService();
  const createdSession = await sessionService.create({
    namespace: "user",
    accountId: user.id,
    displayName: user.displayName,
    rememberMe: false,
    ipAddress: remoteIp,
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
      device_label: userAgent,
      ip_address: remoteIp,
      auth_method: "social",
      expires_at: createdSession.expiresAt,
    })
    .catch(() => null);
}

export async function handleSocialLogin(
  event: H3Event,
  testBody?: RawSocialLoginBody
) {
  const ipRateLimit = await enforceTwoAxisRateLimit({
    routeClass: "auth:social-login",
    remoteIp: getVerifiedRemoteIp(event),
  });
  assertRateLimitAllowed(ipRateLimit.statusCode);

  const rawBody: RawSocialLoginBody =
    testBody ??
    (event.context as { body?: RawSocialLoginBody })?.body ??
    (await readBody<RawSocialLoginBody>(event).catch(() => ({})));

  const input = parseRegistrationPayload(rawBody);
  const profile = resolveProfileFromTicket(event, input.provider);

  const finalEmail = (
    profile.email_at_provider ||
    input.email ||
    ""
  ).toLowerCase();

  if (!finalEmail) {
    throw ValidationError.field(
      "email",
      "Vui lòng nhập địa chỉ email để tiếp tục."
    );
  }

  const finalDisplayName = (
    input.display_name ||
    profile.display_name_at_provider ||
    finalEmail.split("@")[0] ||
    "User"
  ).slice(0, 60);

  await assertNoRegistrationConflicts(finalEmail, profile);

  const newUser = await executeRegistrationTransaction(
    event,
    finalEmail,
    finalDisplayName,
    profile
  );

  if (newUser.status === "pending_verification") {
    const rawToken = generateSecureToken();
    const tokenHash = hashSecureToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await getAppDb().insert(verificationTokens).values({
      accountType: "user",
      accountId: newUser.id,
      purpose: "email_verify",
      tokenHash,
      expiresAt,
    });

    await dispatchTransactionalEmail({
      recipientType: "user",
      recipientId: newUser.id,
      code: "email_verification",
      to: newUser.email,
      payload: {
        email: newUser.email,
        displayName: newUser.displayName,
      },
      secrets: {
        token: rawToken,
        url: buildAccountActionUrl("email_verify", rawToken),
      },
    });
  }

  await establishRegistrationSession(event, newUser);

  setResponseStatus(event, 201);
  return {
    user: {
      uuid: newUser.uuid,
      displayName: newUser.displayName,
      status: newUser.status,
    },
  };
}

export default defineEventHandler((event) => handleSocialLogin(event));
