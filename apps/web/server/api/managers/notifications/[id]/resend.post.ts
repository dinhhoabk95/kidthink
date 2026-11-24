import { NotificationNotFoundError } from "@mindkid/errors/account";
import { defineEventHandler, getRouterParam } from "h3";
import { resendManagerNotification } from "#server/services/notification-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  // BR-NTA-05: super_admin only
  const manager = await requireSuperAdminSession(event);

  const id = Number(getRouterParam(event, "id"));
  if (!id || id <= 0) {
    throw new NotificationNotFoundError("NOTIFICATION_NOT_FOUND");
  }

  return await resendManagerNotification(manager.manager_id, id);
});
