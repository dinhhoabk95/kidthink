import crypto from "node:crypto";
import {
  auditLogs,
  getOwnerDb,
  mfaRecoveryRequests,
  users,
  userTwoFactors,
} from "@mindkid/db";
import {
  AdminNoteRequiredError,
  UserAlreadyDeletedError,
} from "@mindkid/errors/account";
import { MfaRequiredError } from "@mindkid/errors/auth";
import {
  InternalError,
  NotFoundError,
  ValidationError,
} from "@mindkid/errors/common";
import { and, eq, inArray } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

const createMfaRecoverySchema = z.object({
  reason: z.string().min(10),
});

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  if (!userUuid) {
    throw new NotFoundError();
  }

  const rawBody =
    event.context?.body ?? (await readBody(event).catch(() => ({}))) ?? {};
  const parsed = createMfaRecoverySchema.safeParse(rawBody);

  if (!parsed.success) {
    throw new AdminNoteRequiredError(
      "Lý do khôi phục MFA bắt buộc tối thiểu 10 ký tự"
    );
  }
  const reason = parsed.data.reason.trim();

  const db = getOwnerDb();
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.uuid, userUuid))
    .limit(1);

  if (!targetUser) {
    throw new NotFoundError();
  }

  if (targetUser.status === "deleted") {
    throw new UserAlreadyDeletedError();
  }

  const [mfa] = await db
    .select({ id: userTwoFactors.id })
    .from(userTwoFactors)
    .where(eq(userTwoFactors.userId, targetUser.id))
    .limit(1);

  if (!(targetUser.twoFactorEnabled || mfa)) {
    throw new MfaRequiredError(
      "Tài khoản người dùng này chưa bật xác thực hai lớp"
    );
  }

  const [activeReq] = await db
    .select()
    .from(mfaRecoveryRequests)
    .where(
      and(
        eq(mfaRecoveryRequests.userId, targetUser.id),
        inArray(mfaRecoveryRequests.status, ["pending_verification", "waiting"])
      )
    );

  if (activeReq) {
    throw new ValidationError(
      "Đang có một yêu cầu khôi phục MFA đang chờ xử lý"
    );
  }

  const now = new Date();
  const eligibleAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const tokenExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const [createdRequest] = await db
    .insert(mfaRecoveryRequests)
    .values({
      userId: targetUser.id,
      status: "pending_verification",
      requestedByManagerId: session.manager_id,
      reason,
      verificationTokenHash: tokenHash,
      verificationTokenExpiresAt: tokenExpiresAt,
      eligibleAt,
    })
    .returning();

  if (!createdRequest) {
    throw new InternalError("Tạo yêu cầu khôi phục thất bại");
  }

  await db.insert(auditLogs).values({
    actorType: "manager",
    actorId: session.manager_id,
    action: "mfa.recovery_requested",
    entityType: "user",
    entityId: targetUser.uuid,
    reason,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? "unknown",
  });

  return {
    success: true,
    request: {
      uuid: createdRequest.uuid,
      status: createdRequest.status,
      eligible_at: createdRequest.eligibleAt.toISOString(),
      requested_at: createdRequest.createdAt.toISOString(),
    },
    ...(process.env.NODE_ENV === "test"
      ? { verification_token: rawToken }
      : {}),
  };
});
