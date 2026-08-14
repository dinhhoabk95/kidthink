import { appError } from "@kidthink/auth";
import { auditLogs, getOwnerDb, users } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam, readBody } from "h3";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const session = await requireSuperAdminSession(event);
    const userUuid = getRouterParam(event, "uuid");
    if (!userUuid) {
      throw appError("NOT_FOUND");
    }

    const rawBody =
      event.context?.body ?? (await readBody(event).catch(() => ({}))) ?? {};
    const reason =
      typeof rawBody?.reason === "string" ? rawBody.reason.trim() : "";

    // BR-USM-03: reason must be >= 10 characters
    if (reason.length < 10) {
      throw appError("ADMIN_NOTE_REQUIRED");
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

    if (targetUser.status === "deleted") {
      throw appError("USER_ALREADY_DELETED");
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        status: "active",
        suspendedReason: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetUser.id))
      .returning();

    // Insert audit log
    await db.insert(auditLogs).values({
      actorType: "manager",
      actorId: session.manager_id,
      action: "manager.user.reactivated",
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
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
