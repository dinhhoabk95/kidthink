import { writeAudit } from "@mindkid/audit";
import { getOwnerDb, requestUserDeletion, users } from "@mindkid/db";
import { UserAlreadyDeletedError } from "@mindkid/errors/account";
import { NotFoundError } from "@mindkid/errors/common";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { eq } from "drizzle-orm";
import { defineEventHandler, deleteCookie, getHeader } from "h3";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";
import { revokeAllUserSessions } from "#server/utils/session-revocation";

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  requireReauth(event);

  const userId = Number(userSession.user_id);
  const db = getOwnerDb();

  const [currentUser] = await db
    .select({ id: users.id, email: users.email, status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!currentUser) {
    throw new NotFoundError("NOT_FOUND");
  }

  if (currentUser.status === "deleted") {
    throw new UserAlreadyDeletedError("Tài khoản đã trong trạng thái chờ xoá.");
  }

  const now = new Date();
  const { scheduledPurgeAt } = await requestUserDeletion(db, userId, now);

  const ipAddress = getVerifiedRemoteIp(event);
  const userAgent = getHeader(event, "user-agent") ?? null;

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "user",
      actor_id: userId,
      action: "user_deleted",
      entity_type: "user",
      entity_id: String(userId),
      before_data: { status: currentUser.status },
      after_data: {
        status: "deleted",
        purge_at: scheduledPurgeAt.toISOString(),
      },
      reason: "Người dùng yêu cầu xoá tài khoản",
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  });

  await revokeAllUserSessions(userId);
  deleteCookie(event, "mindkid-user.session_token", { path: "/" });
  deleteCookie(event, "__Secure-mindkid-user.session_token", {
    path: "/",
    secure: true,
  });
  deleteCookie(event, "active_child_id", { path: "/" });

  await dispatchTransactionalEmail({
    recipientType: "user",
    recipientId: userId,
    code: "account_deletion_confirmation",
    to: currentUser.email,
    payload: {
      purge_at: scheduledPurgeAt.toISOString(),
      grace_period_days: 30,
      cancel_url: "/me/settings/delete/cancel",
    },
  });

  return {
    purge_at: scheduledPurgeAt.toISOString(),
    grace_period_days: 30,
    message:
      "Yêu cầu xoá tài khoản đã được ghi nhận. Toàn bộ phiên đăng nhập đã được thu hồi. Bạn có 30 ngày để huỷ yêu cầu này.",
  };
});
