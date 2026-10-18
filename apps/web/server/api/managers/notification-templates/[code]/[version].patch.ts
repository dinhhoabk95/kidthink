import { writeAudit } from "@mindkid/audit";
import { getOwnerDb } from "@mindkid/db";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import {
  type EmailTemplateCode,
  getNotificationTemplateState,
  publishNotificationTemplate,
  saveNotificationTemplateDraft,
  TEMPLATE_REGISTRY,
} from "@mindkid/notification";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const SCRIPT_TAG_REGEX = /<script/i;
const EXTERNAL_IMG_REGEX = /<img[^>]+src=["']http/i;

function validateTemplateSecurity(subject: string, content: string): void {
  if (SCRIPT_TAG_REGEX.test(subject) || SCRIPT_TAG_REGEX.test(content)) {
    throw new ValidationError(
      "Nội dung thông báo không được chứa thẻ script độc hại (D-KL)"
    );
  }
  if (EXTERNAL_IMG_REGEX.test(subject) || EXTERNAL_IMG_REGEX.test(content)) {
    throw new ValidationError(
      "Nội dung thông báo không được chứa hình ảnh theo dõi bên ngoài (D-KL)"
    );
  }
}

function validateRequiredVariables(
  code: EmailTemplateCode,
  subject: string,
  content: string,
  providedVars: string[]
): void {
  const tDef = TEMPLATE_REGISTRY[code];
  if (!tDef) {
    return;
  }
  const requiredVars = tDef.requiredVars;
  const combinedSource = `${subject}\n${content}`;
  const missingVars = requiredVars.filter(
    (v: string) =>
      !(
        providedVars.includes(v) ||
        combinedSource.includes(`{{${v}}}`) ||
        combinedSource.includes(`{{ ${v} }}`)
      )
  );

  if (missingVars.length > 0) {
    throw new ValidationError(
      `Mẫu thông báo thiếu các biến bắt buộc: ${missingVars.join(", ")} (BR-NTA-07)`
    );
  }
}

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

  if (rawCode.startsWith("child_")) {
    throw new ValidationError(
      "Hệ thống nghiêm cấm tạo hoặc gửi mẫu thông báo trực tiếp tới trẻ em (BR-NTA-06)"
    );
  }

  if (!(rawCode && rawCode in TEMPLATE_REGISTRY)) {
    throw new NotFoundError(`Không tìm thấy mẫu thông báo mã '${rawCode}'`);
  }

  const code = rawCode as EmailTemplateCode;
  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const parsedResult = patchNotificationTemplateSchema.safeParse(raw);
  if (!parsedResult.success) {
    throw new ValidationError("Tiêu đề mẫu thông báo không được để trống");
  }

  const currentState = getNotificationTemplateState(code);
  const {
    subject: rawSubject,
    body: rawBody,
    reason: rawReason,
    provided_vars: providedVars,
    action,
  } = parsedResult.data;

  const subject =
    rawSubject === undefined ? currentState.subject : rawSubject.trim();
  if (!subject) {
    throw new ValidationError("Tiêu đề mẫu thông báo không được để trống");
  }
  const content = rawBody === undefined ? currentState.body : rawBody;
  const reason = rawReason ? rawReason.trim() : "";

  validateTemplateSecurity(subject, content);
  validateRequiredVariables(code, subject, content, providedVars);

  const db = getOwnerDb();
  const managerId = manager.manager_id;

  const updatedState =
    action === "publish"
      ? publishNotificationTemplate({
          code,
          subject,
          body: content,
          updatedByManagerId: managerId,
          baseVersion: version,
        })
      : saveNotificationTemplateDraft({
          code,
          subject,
          body: content,
          updatedByManagerId: managerId,
          baseVersion: version,
        });

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: managerId,
      action: action === "publish" ? "content_published" : "content_created",
      reason:
        reason ||
        (action === "publish"
          ? "Phê duyệt và phát hành mẫu thông báo"
          : "Cập nhật mẫu thông báo"),
      entity_type: "notification_template",
      entity_id: `${code}_v${updatedState.content_version}`,
      after_data: {
        code,
        version: updatedState.content_version,
        status: updatedState.status,
        subject: updatedState.subject,
      },
    });
  });

  return {
    template: updatedState,
    status: updatedState.status,
    message:
      updatedState.status === "published"
        ? "Mẫu thông báo đã được phê duyệt và phát hành chính thức (BR-NTA-03)"
        : "Mẫu thông báo đã được lưu dưới dạng bản nháp (draft) và đưa vào hàng đợi kiểm duyệt (BR-NTA-03)",
  };
});
