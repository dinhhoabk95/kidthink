import { auditLogs, getOwnerDb, users } from "@mindkid/db";
import { UserAlreadyDeletedError } from "@mindkid/errors/account";
import { NotFoundError } from "@mindkid/errors/common";
import { eq } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { getUserAuth } from "#server/utils/better-auth";

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
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

  await getUserAuth().api.requestPasswordReset({
    body: {
      email: targetUser.email,
      redirectTo: "/reset-password",
    },
  });

  await db.insert(auditLogs).values({
    actorType: "manager",
    actorId: session.manager_id,
    action: "manager.user.send_password_reset",
    entityType: "user",
    entityId: targetUser.uuid,
    reason: "Manager requested password reset link for user",
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? "unknown",
  });

  return {
    success: true,
    message: "Password reset link sent to user email",
  };
});
