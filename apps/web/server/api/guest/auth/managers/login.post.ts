import {
  appError,
  getAuthRedisClient,
  MfaChallengeService,
  verifyPassword,
} from "@mindkid/auth";
import { getOwnerDb, managers, writeAudit } from "@mindkid/db";
import { enforceTwoAxisRateLimit } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import {
  assertManagerRateLimitAllowed,
  assertManagerRequestBodySize,
  assertManagerSameOriginRequest,
  getManagerRemoteIp,
} from "#server/utils/admin-auth-runtime";

const DUMMY_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$Zmx0piJSIcdd2b8oaF8ZUg$U60ArJk0sNteiIdlfZyr7G0shEXA+IqCyWIKs1La4WE";

const ManagerLoginSchema = z
  .object({
    email: z.string().trim().email().max(255),
    password: z.string().min(1).max(1024),
    rememberMe: z.boolean().default(false),
  })
  .strict();

export default defineEventHandler(async (event) => {
  assertManagerSameOriginRequest(event);
  assertManagerRequestBodySize(event, 16 * 1024);
  const body = (await readBody(event).catch(() => null)) || event._body || {};
  const parsed = ManagerLoginSchema.safeParse(body);
  if (!parsed.success) {
    throw appError("INVALID_CREDENTIALS");
  }
  const { email, password, rememberMe } = parsed.data;

  const rateLimit = await enforceTwoAxisRateLimit({
    routeClass: "auth:login",
    remoteIp: getManagerRemoteIp(event),
    accountIdentifier: email,
  });
  assertManagerRateLimitAllowed(rateLimit.statusCode);

  const db = getOwnerDb();
  const [manager] = await db
    .select()
    .from(managers)
    .where(eq(managers.email, email.trim().toLowerCase()));

  if (!manager?.passwordHash) {
    await verifyPassword(password, DUMMY_HASH).catch(() => false);
    await db.transaction(async (tx) => {
      await writeAudit(tx, {
        actor_type: "system",
        action: "manager_login_failed",
        entity_type: "manager",
        entity_id: "0",
        reason: "Unknown manager or invalid password",
      });
    });
    throw appError("INVALID_CREDENTIALS");
  }

  const isValid = await verifyPassword(password, manager.passwordHash);
  if (!isValid) {
    await db.transaction(async (tx) => {
      await writeAudit(tx, {
        actor_type: "manager",
        actor_id: manager.id,
        action: "manager_login_failed",
        entity_type: "manager",
        entity_id: manager.id.toString(),
        reason: "Invalid password",
      });
    });
    throw appError("INVALID_CREDENTIALS");
  }

  if (!manager.isActive) {
    throw appError("INSUFFICIENT_ROLE");
  }

  // Password valid! Create 5-minute opaque Redis MFA challenge token (BR-AUT-35)
  const mfaService = new MfaChallengeService(getAuthRedisClient());
  const createdChallenge = await mfaService.createChallenge({
    namespace: "manager",
    accountId: manager.id,
    displayName: manager.displayName,
    role: manager.role,
    rememberMe,
    ipAddress: getManagerRemoteIp(event),
  });

  if (
    event?.node?.res?.setHeader ||
    event?.node?.res?.statusCode !== undefined
  ) {
    setResponseStatus(event, 428);
  }

  return {
    status: "MFA_REQUIRED",
    challenge: createdChallenge.challengeToken,
    mfa_enabled: manager.mfaEnabled,
  };
});
