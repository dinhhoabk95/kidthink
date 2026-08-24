import {
  getOwnerDb,
  notificationDeliveries,
  notifications,
  users,
  writeAudit,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-NTA-05: super_admin only
  if (manager.role !== "super_admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "INSUFFICIENT_ROLE",
      message: "Chỉ super_admin mới có quyền gửi lại thông báo (BR-NTA-05)",
    });
  }

  const id = Number(getRouterParam(event, "id"));
  if (!id || id <= 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "NOTIFICATION_NOT_FOUND",
    });
  }

  const db = getOwnerDb();
  const [original] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id));

  if (!original) {
    throw createError({
      statusCode: 404,
      statusMessage: "NOTIFICATION_NOT_FOUND",
    });
  }

  // Check if recipient user still exists
  if (original.recipientType === "user") {
    const [user] = await db
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(eq(users.id, original.recipientId));

    if (!user || user.status === "deleted") {
      throw createError({
        statusCode: 409,
        statusMessage: "RECIPIENT_DELETED",
        message: "Người nhận đã bị vô hiệu hoá hoặc xoá tài khoản",
      });
    }
  }

  // BR-NTA-01: Create NEW row, NEVER mutate old row
  const [newNotification] = await db
    .insert(notifications)
    .values({
      recipientType: original.recipientType,
      recipientId: original.recipientId,
      templateCode: original.templateCode,
      payload: original.payload,
    })
    .returning();

  await db.insert(notificationDeliveries).values({
    notificationId: newNotification.id,
    channel: "email",
    status: "queued",
  });

  const managerId = manager.manager_id || manager.id || 1;
  await writeAudit(db, {
    actor_type: "manager",
    actor_id: managerId,
    action: "notification_resent",
    reason: "Gửi lại thông báo giao dịch theo yêu cầu quản trị viên",
    entity_type: "notification",
    entity_id: newNotification.id.toString(),
    after_data: {
      original_notification_id: id,
      new_notification_id: newNotification.id,
      template_code: original.templateCode,
    },
  });

  return {
    success: true,
    original_notification_id: id,
    new_notification_id: newNotification.id,
  };
});
