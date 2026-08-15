import {
  type NotificationCode,
  renderEmailTemplate,
  TEMPLATE_REGISTRY,
} from "@kidthink/notification";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const manager = await requireManagerSession(event);

    // BR-NTA-05: super_admin only
    if (manager.role !== "super_admin") {
      throw createError({
        statusCode: 403,
        statusMessage: "INSUFFICIENT_ROLE",
        message:
          "Chỉ super_admin mới có quyền xem trước mẫu thông báo (BR-NTA-05)",
      });
    }

    const code = getRouterParam(event, "code") as NotificationCode;
    if (!(code && TEMPLATE_REGISTRY[code])) {
      throw createError({
        statusCode: 404,
        statusMessage: "TEMPLATE_NOT_FOUND",
        message: `Không tìm thấy mẫu thông báo mã '${code}'`,
      });
    }

    const body =
      (event.context?.body as Record<string, unknown>) ||
      ((event as Record<string, unknown>)._body as Record<string, unknown>) ||
      (await readBody(event).catch(() => ({})));

    const sampleData =
      (body?.sample_data as Record<string, unknown>) ||
      (body as Record<string, unknown>) ||
      {};

    // Provide sensible defaults for preview if missing
    const templateDef = TEMPLATE_REGISTRY[code];
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
      throw createError({
        statusCode: 422,
        statusMessage: "TEMPLATE_RENDER_ERROR",
        message: `Lỗi khi biên dịch mẫu thông báo: ${msg}`,
      });
    }
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
