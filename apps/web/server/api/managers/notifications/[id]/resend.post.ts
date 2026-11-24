import { NotificationNotFoundError } from "@mindkid/errors/account";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { defineEventHandler, getRouterParam } from "h3";
import { resendManagerNotification } from "#server/services/notification-service";
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

  return await resendManagerNotification(manager.manager_id, id);
});
