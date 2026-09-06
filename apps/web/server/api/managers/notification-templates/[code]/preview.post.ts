import { InsufficientRoleError } from "@mindkid/errors/auth";
import { InternalError, NotFoundError } from "@mindkid/errors/common";
import {
  type NotificationCode,
  renderEmailTemplate,
  TEMPLATE_REGISTRY,
} from "@mindkid/notification";
import { defineEventHandler, getRouterParam } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const previewTemplateSchema = z
  .object({
    sample_data: z.record(z.unknown()).optional(),
  })
  .passthrough()
  .optional();

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-NTA-05: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền xem trước mẫu thông báo (BR-NTA-05)"
    );
  }

  const code = getRouterParam(event, "code") as NotificationCode;
  if (!(code && code in TEMPLATE_REGISTRY)) {
    throw new NotFoundError(`Không tìm thấy mẫu thông báo mã '${code}'`);
  }

  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const parsed = previewTemplateSchema.parse(raw);
  const body = (parsed || {}) as Record<string, unknown>;

  const sampleData =
    (body?.sample_data as Record<string, unknown>) || body || {};

  // Provide sensible defaults for preview if missing
  const templateDef = TEMPLATE_REGISTRY[code];
  if (!templateDef) {
    throw new NotFoundError(`Không tìm thấy mẫu thông báo mã '${code}'`);
  }
  const previewPayload: Record<string, unknown> = { ...sampleData };
  for (const reqVar of templateDef.requiredVars) {
    if (previewPayload[reqVar] === undefined) {
      previewPayload[reqVar] = `[${reqVar}]`;
    }
  }

  try {
    const rendered = await renderEmailTemplate(code, previewPayload);
    return {
      code,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new InternalError(`Lỗi khi biên dịch mẫu thông báo: ${msg}`);
  }
});
