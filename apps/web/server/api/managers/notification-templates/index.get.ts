import { InsufficientRoleError } from "@mindkid/errors/auth";
import { listNotificationTemplateStates } from "@mindkid/notification";
import { defineEventHandler } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-NTA-05: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền quản lý mẫu thông báo (BR-NTA-05)"
    );
  }

  const templates = listNotificationTemplateStates();

  return {
    items: templates,
    total: templates.length,
  };
});
