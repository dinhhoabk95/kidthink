import { writeAudit } from "@mindkid/audit";
import {
  getOwnerDb,
  notificationDeliveries,
  notifications,
  users,
} from "@mindkid/db";
import {
  NotificationNotFoundError,
  UserAlreadyDeletedError,
} from "@mindkid/errors/account";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { InternalError } from "@mindkid/errors/common";
import { eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-NTA-05: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền gửi lại thông báo (BR-NTA-05)"
    );
  }

  const id = Number(getRouterParam(event, "id"));
  if (!id || id <= 0) {
    throw new NotificationNotFoundError("NOTIFICATION_NOT_FOUND");
  }

  const db = getOwnerDb();
  const [original] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, id));

  if (!original) {
    throw new NotificationNotFoundError("NOTIFICATION_NOT_FOUND");
  }

  // Check if recipient user still exists
  if (original.recipientType === "user") {
    const [user] = await db
      .select({ id: users.id, status: users.status })
      .from(users)
      .where(eq(users.id, original.recipientId));

    if (!user || user.status === "deleted") {
      throw new UserAlreadyDeletedError(
        "Người nhận đã bị vô hiệu hoá hoặc xoá tài khoản"
      );
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

  if (!newNotification) {
    throw new InternalError("Tạo bản ghi thông báo mới thất bại");
  }

  await db.insert(notificationDeliveries).values({
    notificationId: newNotification.id,
    channel: "email",
    status: "queued",
  });

  const managerId = manager.manager_id;
  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "content_created",
      reason: "Gửi lại thông báo giao dịch theo yêu cầu quản trị viên",
      entity_type: "notification",
      entity_id: newNotification.id.toString(),
      after_data: {
        original_notification_id: id,
        new_notification_id: newNotification.id,
        template_code: original.templateCode,
      },
    });
  });

  return {
    success: true,
    original_notification_id: id,
    new_notification_id: newNotification.id,
  };
});
