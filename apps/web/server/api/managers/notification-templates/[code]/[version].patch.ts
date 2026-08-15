import { getOwnerDb, writeAudit } from "@kidthink/db";
import {
  type NotificationCode,
  TEMPLATE_REGISTRY,
} from "@kidthink/notification";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";

const SCRIPT_TAG_REGEX = /<script/i;
const EXTERNAL_IMG_REGEX = /<img[^>]+src=["']http/i;

function validateTemplateSecurity(content: string): void {
  if (SCRIPT_TAG_REGEX.test(content)) {
    throw createError({
      statusCode: 422,
      statusMessage: "INVALID_TAG_SCRIPT",
      message: "Nội dung thông báo không được chứa thẻ script độc hại (D-KL)",
    });
  }
  if (EXTERNAL_IMG_REGEX.test(content)) {
    throw createError({
      statusCode: 422,
      statusMessage: "INVALID_EXTERNAL_IMAGE",
      message:
        "Nội dung thông báo không được chứa hình ảnh theo dõi bên ngoài (D-KL)",
    });
  }
}

function validateRequiredVariables(
  code: NotificationCode,
  content: string,
  providedVars: string[]
): void {
  const requiredVars = TEMPLATE_REGISTRY[code].requiredVars;
  const missingVars = requiredVars.filter(
    (v) => !(providedVars.includes(v) || content.includes(`{{${v}}}`))
  );

  if (missingVars.length > 0) {
    throw createError({
      statusCode: 422,
      statusMessage: "MISSING_REQUIRED_VARIABLES",
      message: `Mẫu thông báo thiếu các biến bắt buộc: ${missingVars.join(", ")} (BR-NTA-07)`,
      data: { missing_variables: missingVars },
    });
  }
}

export default defineEventHandler(async (event) => {
  try {
    const manager = await requireManagerSession(event);

    if (manager.role !== "super_admin") {
      throw createError({
        statusCode: 403,
        statusMessage: "INSUFFICIENT_ROLE",
        message:
          "Chỉ super_admin mới có quyền cập nhật mẫu thông báo (BR-NTA-05)",
      });
    }

    const code = getRouterParam(event, "code") as NotificationCode;
    const version = Number(getRouterParam(event, "version")) || 1;

    if (!(code && TEMPLATE_REGISTRY[code])) {
      throw createError({
        statusCode: 404,
        statusMessage: "TEMPLATE_NOT_FOUND",
        message: `Không tìm thấy mẫu thông báo mã '${code}'`,
      });
    }

    if (code.startsWith("child_")) {
      throw createError({
        statusCode: 422,
        statusMessage: "CHILD_RECIPIENT_FORBIDDEN",
        message:
          "Hệ thống nghiêm cấm tạo hoặc gửi mẫu thông báo trực tiếp tới trẻ em (BR-NTA-06, BR-NOT-02)",
      });
    }

    const body =
      (event.context?.body as Record<string, unknown>) ||
      ((event as Record<string, unknown>)._body as Record<string, unknown>) ||
      (await readBody(event).catch(() => ({})));

    const subject =
      typeof body?.subject === "string" ? body.subject.trim() : "";
    const content = typeof body?.body === "string" ? body.body : "";
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    if (!subject) {
      throw createError({
        statusCode: 422,
        statusMessage: "SUBJECT_REQUIRED",
        message: "Tiêu đề mẫu thông báo không được để trống",
      });
    }

    validateTemplateSecurity(content);

    const providedVars = Array.isArray(body?.provided_vars)
      ? (body.provided_vars as string[])
      : [];
    validateRequiredVariables(code, content, providedVars);

    const db = getOwnerDb();
    const managerId = manager.manager_id || manager.id || 1;
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

    await writeAudit(db, {
      actor_type: "manager",
      actor_id: managerId,
      action: "notification_template_updated",
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

    return {
      template: updatedTemplate,
      status: "draft",
      message:
        "Mẫu thông báo đã được lưu dưới dạng bản nháp (draft) và đưa vào hàng đợi kiểm duyệt (BR-NTA-03)",
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
