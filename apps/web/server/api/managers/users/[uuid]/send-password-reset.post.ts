import { generateSecureToken, hashSecureToken } from "@mindkid/auth";
import {
  auditLogs,
  getOwnerDb,
  notificationDeliveries,
  notifications,
  users,
  verificationTokens,
} from "@mindkid/db";
import { UserAlreadyDeletedError } from "@mindkid/errors/account";
import { NotFoundError } from "@mindkid/errors/common";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
} from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  const session = await requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  if (!userUuid) {
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

  if (targetUser.status === "deleted") {
    throw new UserAlreadyDeletedError();
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

  const [createdNotification] = await db
    .insert(notifications)
    .values({
      recipientType: "user",
      recipientId: targetUser.id,
      templateCode: "password_reset",
      payload: {
        token: rawToken,
        email: targetUser.email,
        displayName: targetUser.displayName,
      },
    })
    .returning();

  if (createdNotification) {
    await db.insert(notificationDeliveries).values({
      notificationId: createdNotification.id,
      channel: "email",
      status: "queued",
    });
  }

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
});
