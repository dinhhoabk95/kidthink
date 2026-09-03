import { getOwnerDb, requestUserDeletion, users } from "@mindkid/db";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  deleteCookie,
  setResponseStatus,
} from "h3";

import { requireWebUserSession } from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

export default defineEventHandler(async (event) => {
  const userSession = await requireWebUserSession(event);
  // BR-ADL-03: Reauth required before deletion
  await requireReauth(event);

  const userId = Number(userSession.user_id);
  const db = getOwnerDb();

  const [currentUser] = await db
    .select({ id: users.id, email: users.email, status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!currentUser) {
    setResponseStatus(event, 404);
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  if (currentUser.status === "deleted") {
    setResponseStatus(event, 400);
    throw createError({
      statusCode: 400,
      statusMessage: "ALREADY_DELETED",
      data: {
        code: "ALREADY_DELETED",
        message: "Tài khoản đã trong trạng thái chờ xoá.",
      },
    });
  }

  const now = new Date();
  const { scheduledPurgeAt } = await requestUserDeletion(db, userId, now);

  // Clear active_child_id cookie
  deleteCookie(event, "active_child_id", { path: "/" });

  // Enqueue confirmation email with cancellation link (BR-ADL-01, BR-ADL-02)
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
