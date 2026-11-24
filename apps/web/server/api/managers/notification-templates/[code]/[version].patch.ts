import { InsufficientRoleError } from "@mindkid/errors/auth";
import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam } from "h3";
import { z } from "zod";
import { patchManagerNotificationTemplate } from "#server/services/notification-service";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { readRequestBody } from "#server/utils/request-body";

const patchNotificationTemplateSchema = z.object({
  subject: z.string().min(1).optional(),
  body: z.string().optional(),
  reason: z.string().optional(),
  provided_vars: z.array(z.string()).optional().default([]),
  action: z.enum(["save_draft", "publish"]).optional().default("save_draft"),
});

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-NTA-05: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền cập nhật mẫu thông báo (BR-NTA-05)"
    );
  }

  const rawCode = getRouterParam(event, "code") ?? "";
  const version = Number(getRouterParam(event, "version")) || 1;
  const raw = await readRequestBody(event);

  const parsedResult = patchNotificationTemplateSchema.safeParse(raw);
  if (!parsedResult.success) {
    throw new ValidationError("Tiêu đề mẫu thông báo không được để trống");
  }

  return await patchManagerNotificationTemplate({
    managerId: manager.manager_id,
    rawCode,
    version,
    subject: parsedResult.data.subject,
    body: parsedResult.data.body,
    reason: parsedResult.data.reason,
    providedVars: parsedResult.data.provided_vars,
    action: parsedResult.data.action,
  });
});
