import { writeAudit } from "@mindkid/audit";
import { getOwnerDb } from "@mindkid/db";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import {
  type NotificationCode,
  TEMPLATE_REGISTRY,
} from "@mindkid/notification";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const SCRIPT_TAG_REGEX = /<script/i;
const EXTERNAL_IMG_REGEX = /<img[^>]+src=["']http/i;

function validateTemplateSecurity(content: string): void {
  if (SCRIPT_TAG_REGEX.test(content)) {
    throw new ValidationError(
      "Nội dung thông báo không được chứa thẻ script độc hại (D-KL)"
    );
  }
  if (EXTERNAL_IMG_REGEX.test(content)) {
    throw new ValidationError(
      "Nội dung thông báo không được chứa hình ảnh theo dõi bên ngoài (D-KL)"
    );
  }
}

function validateRequiredVariables(
  code: NotificationCode,
  content: string,
  providedVars: string[]
): void {
  const tDef = TEMPLATE_REGISTRY[code];
  if (!tDef) {
    return;
  }
  const requiredVars = tDef.requiredVars;
  const missingVars = requiredVars.filter(
    (v: string) => !(providedVars.includes(v) || content.includes(`{{${v}}}`))
  );

  if (missingVars.length > 0) {
    throw new ValidationError(
      `Mẫu thông báo thiếu các biến bắt buộc: ${missingVars.join(", ")} (BR-NTA-07)`
    );
  }
}

import { z } from "zod";

const patchNotificationTemplateSchema = z.object({
  subject: z.string().min(1),
  body: z.string().optional().default(""),
  reason: z.string().optional(),
  provided_vars: z.array(z.string()).optional().default([]),
});

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-NTA-05: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền cập nhật mẫu thông báo (BR-NTA-05)"
    );
  }

  const code = getRouterParam(event, "code") as NotificationCode;
  const version = Number(getRouterParam(event, "version")) || 1;

  if (!(code && code in TEMPLATE_REGISTRY)) {
    throw new NotFoundError(`Không tìm thấy mẫu thông báo mã '${code}'`);
  }

  if (code.startsWith("child_")) {
    throw new ValidationError(
      "Hệ thống nghiêm cấm tạo hoặc gửi mẫu thông báo trực tiếp tới trẻ em (BR-NTA-06)"
    );
  }

  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const parsedResult = patchNotificationTemplateSchema.safeParse(raw);
  if (!parsedResult.success) {
    throw new ValidationError("Tiêu đề mẫu thông báo không được để trống");
  }

  const {
    subject,
    body: content,
    reason: rawReason,
    provided_vars: providedVars,
  } = parsedResult.data;
  const reason = rawReason ? rawReason.trim() : "";

  validateTemplateSecurity(content);
  validateRequiredVariables(code, content, providedVars);

  const db = getOwnerDb();
  const managerId = manager.manager_id;
  const newVersion = version + 1;

  const updatedTemplate = {
    code,
    subject,
    body: content,
    content_version: newVersion,
    status: "draft",
    updated_by_manager_id: managerId,
    updated_at: new Date().toISOString(),
  };

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: "content_created",
      reason: reason || "Cập nhật mẫu thông báo",
      entity_type: "notification_template",
      entity_id: `${code}_v${newVersion}`,
      after_data: {
        code,
        version: newVersion,
        status: "draft",
        subject,
      },
    });
  });

  return {
    template: updatedTemplate,
    status: "draft",
    message:
      "Mẫu thông báo đã được lưu dưới dạng bản nháp (draft) và đưa vào hàng đợi kiểm duyệt (BR-NTA-03)",
  };
});
