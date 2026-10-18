import { InsufficientRoleError } from "@mindkid/errors/auth";
import { InternalError, NotFoundError } from "@mindkid/errors/common";
import {
  type EmailTemplateCode,
  renderEmailTemplate,
  TEMPLATE_REGISTRY,
  type TemplateVars,
} from "@mindkid/notification";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";

const templateScalarSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

const sampleDataSchema = z.record(z.string(), templateScalarSchema);

const previewTemplateSchema = z
  .object({
    sample_data: sampleDataSchema.optional(),
    use_draft: z.boolean().optional(),
  })
  .optional();

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-NTA-05: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền xem trước mẫu thông báo (BR-NTA-05)"
    );
  }

  const rawCode = getRouterParam(event, "code") ?? "";
  if (!(rawCode && rawCode in TEMPLATE_REGISTRY)) {
    throw new NotFoundError(`Không tìm thấy mẫu thông báo mã '${rawCode}'`);
  }
  const code = rawCode as EmailTemplateCode;

  const raw = event.context?.body ?? (await readBody(event).catch(() => ({})));

  const parsed = previewTemplateSchema.safeParse(raw);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const sampleData: TemplateVars = parsed.data?.sample_data
    ? { ...parsed.data.sample_data }
    : {};
  const useDraft = parsed.data?.use_draft ?? true;

  const templateDef = TEMPLATE_REGISTRY[code];
  if (!templateDef) {
    throw new NotFoundError(`Không tìm thấy mẫu thông báo mã '${code}'`);
  }
  const previewPayload: TemplateVars = { ...sampleData };
  for (const reqVar of templateDef.requiredVars) {
    if (previewPayload[reqVar] === undefined) {
      previewPayload[reqVar] = `[${reqVar}]`;
    }
  }

  try {
    const rendered = await renderEmailTemplate(code, previewPayload, {
      useDraft,
    });
    return {
      code,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new InternalError(`Lỗi khi biên dịch mẫu thông báo: ${msg}`);
  }
});
