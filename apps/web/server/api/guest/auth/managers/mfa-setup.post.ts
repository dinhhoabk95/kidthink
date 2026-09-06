import {
  encryptTotpSecret,
  generateTotpSecret,
  generateTotpUri,
  getAuthRedisClient,
  MfaChallengeService,
} from "@mindkid/auth";
import { getOwnerDb, managers, mfaSettings } from "@mindkid/db";
import {
  InsufficientRoleError,
  InvalidCredentialsError,
  MfaAlreadyEnabledError,
} from "@mindkid/errors/auth";
import { enforceTwoAxisRateLimit } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { z } from "zod";
import {
  assertManagerRateLimitAllowed,
  assertManagerRequestBodySize,
  assertManagerSameOriginRequest,
  getManagerRemoteIp,
  getMfaEncryptionKey,
} from "#server/utils/admin-auth-runtime";
import { readRequestBody } from "#server/utils/request-body";

const MfaSetupSchema = z
  .object({
    challenge: z.string().min(1).max(4096),
  })
  .strict();

export default defineEventHandler(async (event) => {
  assertManagerSameOriginRequest(event);
  assertManagerRequestBodySize(event, 16 * 1024);
  const body = await readRequestBody(event);
  const parsed = MfaSetupSchema.safeParse(body);
  if (!parsed.success) {
    throw new InvalidCredentialsError();
  }
  const { challenge } = parsed.data;

  // Consume opaque Redis MFA challenge atomically (BR-AUT-35, BR-MME-03)
  const mfaChallengeService = new MfaChallengeService(getAuthRedisClient());
  const challengePayload = await mfaChallengeService
    .consumeChallenge("manager", challenge)
    .catch(() => {
      throw new InvalidCredentialsError();
    });

  const db = getOwnerDb();
  const [manager] = await db
    .select()
    .from(managers)
    .where(eq(managers.id, challengePayload.accountId));

  if (!manager) {
    throw new InvalidCredentialsError();
  }

  if (!manager.isActive) {
    throw new InsufficientRoleError();
  }

  // Check rate limit (BR-MME-07)
  const rateLimit = await enforceTwoAxisRateLimit({
    routeClass: "auth:mfa",
    remoteIp: getManagerRemoteIp(event),
    accountIdentifier: String(manager.id),
  });
  assertManagerRateLimitAllowed(rateLimit.statusCode);

  // BR-MME-01: Disallow enrollment if already confirmed or mfaEnabled
  const [existingSetting] = await db
    .select()
    .from(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "manager"),
        eq(mfaSettings.accountId, manager.id)
      )
    );

  if (
    manager.mfaEnabled ||
    (existingSetting && existingSetting.confirmedAt !== null)
  ) {
    throw new MfaAlreadyEnabledError();
  }

  // Generate TOTP secret and encrypt (BR-MFA-12, BR-MME-04)
  const totpSecret = generateTotpSecret();
  const secretEncrypted = encryptTotpSecret(totpSecret, getMfaEncryptionKey());

  if (existingSetting) {
    await db
      .update(mfaSettings)
      .set({
        secretEncrypted,
        confirmedAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(mfaSettings.accountType, "manager"),
          eq(mfaSettings.accountId, manager.id)
        )
      );
  } else {
    await db.insert(mfaSettings).values({
      accountType: "manager",
      accountId: manager.id,
      secretEncrypted,
      confirmedAt: null,
    });
  }

  // Issue next challenge (BR-MME-03)
  const nextChallenge = await mfaChallengeService.createChallenge({
    namespace: "manager",
    accountId: manager.id,
    displayName: manager.displayName,
    role: manager.role,
    rememberMe: challengePayload.rememberMe,
    ipAddress: getManagerRemoteIp(event),
  });

  const otpauthUri = generateTotpUri(
    totpSecret,
    manager.email,
    "MindKid Admin"
  );

  return {
    otpauth_uri: otpauthUri,
    challenge: nextChallenge.challengeToken,
  };
});
