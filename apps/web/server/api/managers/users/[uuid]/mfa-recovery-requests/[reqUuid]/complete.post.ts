import { appError } from "@kidthink/auth";
import {
  auditLogs,
  getOwnerDb,
  mfaRecoveryCodes,
  mfaRecoveryRequests,
  mfaSettings,
  users,
} from "@kidthink/db";
import { and, eq, sql } from "drizzle-orm";
import { createError, defineEventHandler, getHeader, getRouterParam } from "h3";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
  respondToManagerAuthError,
} from "../../../../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const session = await requireSuperAdminSession(event);
    const userUuid = getRouterParam(event, "uuid");
    const reqUuid = getRouterParam(event, "reqUuid");

    if (!(userUuid && reqUuid)) {
      throw appError("NOT_FOUND");
    }

    const db = getOwnerDb();
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.uuid, userUuid))
      .limit(1);

    if (!targetUser) {
      throw appError("NOT_FOUND");
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
      throw appError("NOT_FOUND");
    }

    if (recoveryReq.status === "pending_verification") {
      throw createError({
        statusCode: 400,
        statusMessage: "EMAIL_NOT_VERIFIED",
        message: "Người dùng chưa xác thực email cho yêu cầu khôi phục này",
      });
    }

    if (recoveryReq.status !== "waiting") {
      throw createError({
        statusCode: 409,
        statusMessage: "REQUEST_TERMINAL",
        message: "Yêu cầu khôi phục đã hoàn tất hoặc đã bị huỷ",
      });
    }

    const now = new Date();
    if (now.getTime() < recoveryReq.eligibleAt.getTime()) {
      throw createError({
        statusCode: 400,
        statusMessage: "WAITING_PERIOD_NOT_ELAPSED",
        message: "Chưa đủ 48 giờ chờ kể từ thời điểm tạo yêu cầu",
        data: {
          eligible_at: recoveryReq.eligibleAt.toISOString(),
        },
      });
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
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
