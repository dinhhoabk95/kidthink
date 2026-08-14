import { appError, generateSecureToken, hashSecureToken } from "@kidthink/auth";
import {
  auditLogs,
  getOwnerDb,
  notifications,
  users,
  verificationTokens,
} from "@kidthink/db";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
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

    const now = new Date();

    // Invalidate previous unused password_reset tokens
    await db
      .update(verificationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(verificationTokens.accountId, targetUser.id),
          eq(verificationTokens.accountType, "user"),
          eq(verificationTokens.purpose, "password_reset"),
          isNull(verificationTokens.usedAt)
        )
      );

    const rawToken = generateSecureToken();
    const tokenHash = hashSecureToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h expiry

    await db.insert(verificationTokens).values({
      accountType: "user",
      accountId: targetUser.id,
      purpose: "password_reset",
      tokenHash,
      expiresAt,
    });

    await db.insert(notifications).values({
      recipientType: "user",
      recipientId: targetUser.id,
      channel: "email",
      templateCode: "password_reset",
      payload: {
        token: rawToken,
        email: targetUser.email,
        displayName: targetUser.displayName,
      },
      status: "queued",
    });

    // Record audit log
    await db.insert(auditLogs).values({
      actorType: "manager",
      actorId: session.manager_id,
      action: "manager.user.send_password_reset",
      entityType: "user",
      entityId: targetUser.uuid,
      reason: "Manager requested password reset link for user",
      ipAddress: getManagerRemoteIp(event),
      userAgent: getHeader(event, "user-agent") ?? "unknown",
    });

    // BR-USM-08: Response strictly does NOT contain raw token
    return {
      success: true,
      message: "Password reset link sent to user email",
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
