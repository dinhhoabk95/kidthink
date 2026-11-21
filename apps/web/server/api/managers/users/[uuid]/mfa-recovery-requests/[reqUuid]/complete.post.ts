import {
  auditLogs,
  getOwnerDb,
  mfaRecoveryRequests,
  users,
  userTwoFactors,
} from "@mindkid/db";
import { RestrictedModeError } from "@mindkid/errors/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { InvalidStatusTransitionError } from "@mindkid/errors/content";
import { and, eq, sql } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { revokeAllBetterAuthSessions } from "#server/utils/better-auth";

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  const reqUuid = getRouterParam(event, "reqUuid");

  if (!(userUuid && reqUuid)) {
    throw new NotFoundError();
  }

  const db = getOwnerDb();
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.uuid, userUuid))
    .limit(1);

  if (!targetUser) {
    throw new NotFoundError();
  }

  const [recoveryReq] = await db
    .select()
    .from(mfaRecoveryRequests)
    .where(
      and(
        eq(mfaRecoveryRequests.uuid, reqUuid),
        eq(mfaRecoveryRequests.userId, targetUser.id)
      )
    )
    .limit(1);

  if (!recoveryReq) {
    throw new NotFoundError();
  }

  if (recoveryReq.status === "pending_verification") {
    throw new RestrictedModeError(
      "Người dùng chưa xác thực email cho yêu cầu khôi phục này"
    );
  }

  if (recoveryReq.status !== "waiting") {
    throw new InvalidStatusTransitionError(
      "Yêu cầu khôi phục đã hoàn tất hoặc đã bị huỷ"
    );
  }

  const now = new Date();
  if (now.getTime() < recoveryReq.eligibleAt.getTime()) {
    throw new ValidationError("Chưa đủ 48 giờ chờ kể từ thời điểm tạo yêu cầu");
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(userTwoFactors)
      .where(eq(userTwoFactors.userId, targetUser.id));

    await tx
      .update(users)
      .set({
        twoFactorEnabled: false,
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(users.id, targetUser.id));

    await tx
      .update(mfaRecoveryRequests)
      .set({
        status: "completed",
        completedAt: now,
        completedByManagerId: session.manager_id,
        updatedAt: now,
      })
      .where(eq(mfaRecoveryRequests.id, recoveryReq.id));

    await tx.insert(auditLogs).values({
      actorType: "manager",
      actorId: session.manager_id,
      action: "mfa.recovery_completed",
      entityType: "user",
      entityId: targetUser.uuid,
      reason: recoveryReq.reason,
      ipAddress: getVerifiedRemoteIp(event),
      userAgent: getHeader(event, "user-agent") ?? "unknown",
    });
  });

  await revokeAllBetterAuthSessions("user", targetUser.id).catch(() => null);

  return {
    success: true,
    status: "completed",
  };
});
