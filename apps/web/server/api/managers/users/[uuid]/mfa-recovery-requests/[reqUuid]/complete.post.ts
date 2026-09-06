import {
  auditLogs,
  getOwnerDb,
  mfaRecoveryCodes,
  mfaRecoveryRequests,
  mfaSettings,
  users,
} from "@mindkid/db";
import { RestrictedModeError } from "@mindkid/errors/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { InvalidStatusTransitionError } from "@mindkid/errors/content";
import { and, eq, sql } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
} from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  const session = await requireSuperAdminSession(event);
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

  // Execute atomic complete: remove MFA, remove recovery codes, bump sessionVersion, mark complete
  await db.transaction(async (tx) => {
    // 1. Delete mfaSettings
    await tx
      .delete(mfaSettings)
      .where(
        and(
          eq(mfaSettings.accountType, "user"),
          eq(mfaSettings.accountId, targetUser.id)
        )
      );

    // 2. Delete mfaRecoveryCodes
    await tx
      .delete(mfaRecoveryCodes)
      .where(
        and(
          eq(mfaRecoveryCodes.accountType, "user"),
          eq(mfaRecoveryCodes.accountId, targetUser.id)
        )
      );

    // 3. Revoke all active sessions (bump sessionVersion)
    await tx
      .update(users)
      .set({
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(users.id, targetUser.id));

    // 4. Mark request completed
    await tx
      .update(mfaRecoveryRequests)
      .set({
        status: "completed",
        completedAt: now,
        completedByManagerId: session.manager_id,
        updatedAt: now,
      })
      .where(eq(mfaRecoveryRequests.id, recoveryReq.id));

    // 5. Insert audit log
    await tx.insert(auditLogs).values({
      actorType: "manager",
      actorId: session.manager_id,
      action: "mfa.recovery_completed",
      entityType: "user",
      entityId: targetUser.uuid,
      reason: recoveryReq.reason,
      ipAddress: getManagerRemoteIp(event),
      userAgent: getHeader(event, "user-agent") ?? "unknown",
    });
  });

  return {
    success: true,
    status: "completed",
  };
});
