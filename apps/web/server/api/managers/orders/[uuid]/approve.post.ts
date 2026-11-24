import { MAX_BONUS_DAYS, MIN_ADMIN_NOTE_LENGTH } from "@mindkid/config";
import { AdminNoteRequiredError } from "@mindkid/errors/account";
import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
import { z } from "zod";
import { approveManagerOrder } from "#server/services/order-review-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";
import { readRequestBody } from "#server/utils/request-body";

const approveOrderSchema = z.object({
  admin_note: z
    .string({
      error: (iss) =>
        iss.input === undefined ? "Ghi chú duyệt là bắt buộc." : undefined,
    })
    .min(
      MIN_ADMIN_NOTE_LENGTH,
      `Ghi chú duyệt bắt buộc tối thiểu ${MIN_ADMIN_NOTE_LENGTH} ký tự (BR-PAP-04).`
    ),
  checklist: z.object({
    amount_matches: z.literal(true, {
      error: "Phải xác nhận số tiền trên chứng từ khớp với đơn.",
    }),
    transfer_note_present: z.literal(true, {
      error: "Phải xác nhận nội dung chuyển khoản chứa mã đơn.",
    }),
    bank_ref_unused: z.literal(true, {
      error: "Phải xác nhận mã giao dịch chưa được dùng cho đơn khác.",
    }),
    transfer_time_valid: z.literal(true, {
      error: "Phải xác nhận thời gian chuyển khoản hợp lệ sau lúc tạo đơn.",
    }),
    proof_legible: z.literal(true, {
      error: "Phải xác nhận ảnh chứng từ rõ ràng, không bị che khuất.",
    }),
  }),
  bonus_days: z
    .number()
    .int()
    .min(0)
    .max(
      MAX_BONUS_DAYS,
      `Cấp bù ngày tối đa ${MAX_BONUS_DAYS} ngày (BR-PAP-06).`
    )
    .optional()
    .default(0),
  duration_days: z.number().optional(),
});

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  requireReauth(event);
  const orderUuid = getRouterParam(event, "uuid");
  if (!orderUuid) {
    throw new ValidationError("Order UUID is required");
  }

  const rawBody = await readRequestBody(event);
  const parsed = approveOrderSchema.safeParse(rawBody);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    if (fieldErrors.admin_note) {
      throw new AdminNoteRequiredError(fieldErrors.admin_note[0]);
    }
    throw new ValidationError({
      errors: fieldErrors,
    });
  }

  return await approveManagerOrder({
    managerId: session.manager_id,
    orderUuid,
    adminNote: parsed.data.admin_note,
    checklist: parsed.data.checklist,
    bonusDays: parsed.data.bonus_days,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") || null,
  });
});
