import {
  appError,
  getBrowserSessionService,
  isOAuthProvider,
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
} from "@mindkid/db";
import { enforceTwoAxisRateLimit } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  deleteCookie,
  getCookie,
  getHeader,
  type H3Event,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import { setUserSession } from "#imports";
import {
  assertRateLimitAllowed,
  assertRequestBodySize,
  assertSameOriginRequest,
  ensureUserCsrfCookie,
  getVerifiedRemoteIp,
} from "../../../../utils/auth-runtime.js";
import { OAUTH_TICKET_COOKIE_NAME } from "../oauth/[provider]/callback.get.js";

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

function parseRegistrationPayload(rawBody: unknown): SocialRegisterInput {
  const parsed = SocialRegisterSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      data: {
        code: "VALIDATION_FAILED",
        message: "Dữ liệu đăng ký mạng xã hội không hợp lệ.",
      },
    });
  }

  if (!(parsed.data.accept_terms && parsed.data.accept_privacy)) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      data: {
        code: "VALIDATION_FAILED",
        message:
          "Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư.",
      },
    });
  }

  return parsed.data;
}

function resolveProfileFromTicket(
  event: H3Event,
  expectedProvider: string
): NormalizedProfile {
  const contextProfile = (
    event.context as { oauth_profile?: NormalizedProfile }
  )?.oauth_profile;

  if (contextProfile) {
    return contextProfile;
  }

  const ticketCookie = getCookie(event, OAUTH_TICKET_COOKIE_NAME);
  if (!ticketCookie) {
    throw createError({
      statusCode: 400,
      statusMessage: "OAUTH_STATE_INVALID",
      data: {
        code: "OAUTH_STATE_INVALID",
        message: "Phiên đăng ký mạng xã hội đã hết hạn. Vui lòng thử lại.",
      },
    });
  }

  try {
    const raw = Buffer.from(ticketCookie, "base64url").toString("utf8");
    const parsedTicket = JSON.parse(raw);
    const profile = parsedTicket?.profile;

    if (
      !(profile && isOAuthProvider(profile.provider)) ||
      profile.provider !== expectedProvider
    ) {
      throw new Error("Invalid ticket provider");
    }

    deleteCookie(event, OAUTH_TICKET_COOKIE_NAME, { path: "/" });
    return profile;
  } catch {
    deleteCookie(event, OAUTH_TICKET_COOKIE_NAME, { path: "/" });
    throw createError({
      statusCode: 400,
      statusMessage: "OAUTH_STATE_INVALID",
      data: {
        code: "OAUTH_STATE_INVALID",
        message: "Phiên đăng ký mạng xã hội đã hết hạn. Vui lòng thử lại.",
      },
    });
  }
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
    throw appError("SOCIAL_EMAIL_CONFLICT", {
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
    throw appError("SOCIAL_IDENTITY_ALREADY_LINKED");
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

export async function handleSocialLogin(event: H3Event, testBody?: unknown) {
  assertSameOriginRequest(event);
  assertRequestBodySize(event, 16 * 1024);

  const ipRateLimit = await enforceTwoAxisRateLimit({
    routeClass: "auth:social-login",
    remoteIp: getVerifiedRemoteIp(event),
  });
  assertRateLimitAllowed(ipRateLimit.statusCode);

  const rawBody =
    testBody ??
    (event.context as { body?: unknown })?.body ??
    (await readBody(event).catch(() => ({})));

  const input = parseRegistrationPayload(rawBody);
  const profile = resolveProfileFromTicket(event, input.provider);

  const finalEmail = (
    profile.email_at_provider ||
    input.email ||
    ""
  ).toLowerCase();

  if (!finalEmail) {
    setResponseStatus(event, 422);
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      data: {
        code: "VALIDATION_FAILED",
        message: "Vui lòng nhập địa chỉ email để tiếp tục.",
      },
    });
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
