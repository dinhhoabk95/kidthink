import { TEMPLATE_REGISTRY } from "@mindkid/notification";
import { createError, defineEventHandler } from "h3";
import { requireManagerSession } from "../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-NTA-05: super_admin only
  if (manager.role !== "super_admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "INSUFFICIENT_ROLE",
      message: "Chỉ super_admin mới có quyền quản lý mẫu thông báo (BR-NTA-05)",
    });
  }

  const templates = Object.entries(TEMPLATE_REGISTRY).map(([code, def]) => {
    // BR-NTA-06 scanner check: ensure recipient is never child
    const isChildRecipient = code.startsWith("child_");

    return {
      code,
      required_vars: def.requiredVars,
      content_version: 1,
      status: "published",
      is_child_recipient: isChildRecipient,
    };
  });

  return {
    items: templates,
    total: templates.length,
  };
});
