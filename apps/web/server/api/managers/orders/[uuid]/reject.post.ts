import { MIN_ADMIN_NOTE_LENGTH } from "@mindkid/config";
import { AdminNoteRequiredError } from "@mindkid/errors/account";
import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
import { z } from "zod";
import { rejectManagerOrder } from "#server/services/order-review-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";
import { readRequestBody } from "#server/utils/request-body";

const rejectOrderSchema = z.object({
  admin_note: z
    .string({
      error: (iss) =>
        iss.input === undefined ? "Ghi chú từ chối là bắt buộc." : undefined,
    })
    .min(
      MIN_ADMIN_NOTE_LENGTH,
      `Ghi chú từ chối bắt buộc tối thiểu ${MIN_ADMIN_NOTE_LENGTH} ký tự (BR-PAP-04).`
    ),
});

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  requireReauth(event);
  const orderUuid = getRouterParam(event, "uuid");
  if (!orderUuid) {
    throw new ValidationError("Order UUID is required");
  }

  const rawBody = await readRequestBody(event);
  const parsed = rejectOrderSchema.safeParse(rawBody);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    if (fieldErrors.admin_note) {
      throw new AdminNoteRequiredError(fieldErrors.admin_note[0]);
    }
    throw new ValidationError({
      errors: fieldErrors,
    });
  }

  return await rejectManagerOrder({
    managerId: session.manager_id,
    orderUuid,
    adminNote: parsed.data.admin_note,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") || null,
  });
});
