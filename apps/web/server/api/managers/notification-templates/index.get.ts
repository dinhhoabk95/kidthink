import { listNotificationTemplateStates } from "@mindkid/notification";
import { defineEventHandler } from "h3";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler((event) => {
  // BR-NTA-05: super_admin only
  requireSuperAdminSession(event);

  const templates = listNotificationTemplateStates();

  return {
    items: templates,
    total: templates.length,
  };
});
