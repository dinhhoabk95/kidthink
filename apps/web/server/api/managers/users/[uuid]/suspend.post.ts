import { appError } from "@mindkid/auth";
import { auditLogs, getOwnerDb, users } from "@mindkid/db";
import { eq, sql } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam, readBody } from "h3";
import { z } from "zod";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
} from "#server/utils/admin-auth-runtime";

const suspendBodySchema = z.object({
  reason: z.string().min(10),
});

export default defineEventHandler(async (event) => {
  const session = await requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  if (!userUuid) {
    throw appError("NOT_FOUND");
  }

  const rawBody =
    event.context?.body ?? (await readBody(event).catch(() => ({}))) ?? {};
  const parsed = suspendBodySchema.safeParse(rawBody);

  // BR-USM-03: reason must be >= 10 characters
  if (!parsed.success) {
    throw appError("ADMIN_NOTE_REQUIRED");
  }
  const reason = parsed.data.reason.trim();

  const db = getOwnerDb();
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.uuid, userUuid))
    .limit(1);

  if (!targetUser) {
    throw appError("NOT_FOUND");
  }

  if (targetUser.status === "deleted") {
    throw appError("USER_ALREADY_DELETED");
  }

  // BR-USM-05: Increment session_version to revoke all active sessions immediately
  // BR-USM-04: Do NOT touch entitlements table
  const [updatedUser] = await db
    .update(users)
    .set({
      status: "suspended",
      suspendedReason: reason,
      sessionVersion: sql`${users.sessionVersion} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, targetUser.id))
    .returning();

  if (!updatedUser) {
    throw createError({
      statusCode: 500,
      statusMessage: "USER_UPDATE_FAILED",
      message: "Đình chỉ tài khoản thất bại",
    });
  }

  // Insert audit log
  await db.insert(auditLogs).values({
    actorType: "manager",
    actorId: session.manager_id,
    action: "manager.user.suspended",
    entityType: "user",
    entityId: targetUser.uuid,
    reason,
    ipAddress: getManagerRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? "unknown",
  });

  return {
    success: true,
    status: updatedUser.status,
  };
});
