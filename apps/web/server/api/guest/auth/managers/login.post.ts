import { writeAudit } from "@mindkid/audit";
import {
  getAuthRedisClient,
  MfaChallengeService,
  verifyPassword,
} from "@mindkid/auth";
import { getOwnerDb, managers } from "@mindkid/db";
import {
  InsufficientRoleError,
  InvalidCredentialsError,
} from "@mindkid/errors/auth";
import { enforceTwoAxisRateLimit } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { z } from "zod";
import { assertManagerRateLimitAllowed } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

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
  const body = (await readBody(event).catch(() => null)) ?? {};
  const parsed = ManagerLoginSchema.safeParse(body);
  if (!parsed.success) {
    throw new InvalidCredentialsError();
  }
  const { email, password, rememberMe } = parsed.data;

  const rateLimit = await enforceTwoAxisRateLimit({
    routeClass: "auth:login",
    remoteIp: getVerifiedRemoteIp(event),
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
    throw new InvalidCredentialsError();
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
    throw new InvalidCredentialsError();
  }

  if (!manager.isActive) {
    throw new InsufficientRoleError();
  }

  // UC-009 BR-001/BR-002 + A3: mật khẩu chưa bao giờ đủ để cấp phiên. Manager chưa bật
  // MFA nhận cùng loại yêu cầu xác thực tạm (mfa_enabled=false) để đi tiếp luồng thiết
  // lập lần đầu ở /mfa-setup; vẫn chưa có phiên, cookie hay khả năng ghi nhớ nào.
  // Yêu cầu xác thực tạm: opaque, một lần, 5 phút (BR-AUT-35)
  const mfaService = new MfaChallengeService(getAuthRedisClient());
  const createdChallenge = await mfaService.createChallenge({
    namespace: "manager",
    accountId: manager.id,
    displayName: manager.displayName,
    role: manager.role,
    rememberMe,
    ipAddress: getVerifiedRemoteIp(event),
  });

  setResponseStatus(event, 428);

  return {
    status: "MFA_REQUIRED",
    challenge: createdChallenge.challengeToken,
    mfa_enabled: manager.mfaEnabled,
  };
});
