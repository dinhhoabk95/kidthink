import { appError } from "@mindkid/auth";
import { auditLogs, getOwnerDb, mfaRecoveryRequests, users } from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, getHeader, getRouterParam } from "h3";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
} from "../../../../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
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

  if (
    recoveryReq.status !== "pending_verification" &&
    recoveryReq.status !== "waiting"
  ) {
    throw createError({
      statusCode: 409,
      statusMessage: "REQUEST_TERMINAL",
      message: "Yêu cầu khôi phục đã hoàn tất hoặc đã bị huỷ",
    });
  }

  const now = new Date();
  await db
    .update(mfaRecoveryRequests)
    .set({
      status: "cancelled",
      cancelledAt: now,
      updatedAt: now,
    })
    .where(eq(mfaRecoveryRequests.id, recoveryReq.id));

  await db.insert(auditLogs).values({
    actorType: "manager",
    actorId: session.manager_id,
    action: "mfa.recovery_cancelled",
    entityType: "user",
    entityId: targetUser.uuid,
    reason: recoveryReq.reason,
    ipAddress: getManagerRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? "unknown",
  });

  return {
    success: true,
    status: "cancelled",
  };
});
