import { ValidationError } from "@mindkid/errors/common";

import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { userCancelRecurringSubscription } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";

const cancelSubscriptionSchema = z.object({
  subscription_id: z.number().int().positive({
    message: "subscription_id phải là số nguyên dương hợp lệ",
  }),
});

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);

  const rawBody =
    ((event.context as { body?: unknown })?.body as Record<string, unknown>) ??
    ((await readBody(event).catch(() => undefined)) as Record<
      string,
      unknown
    >) ??
    ((event as unknown as { _body?: unknown })._body as Record<
      string,
      unknown
    >);
  const parsed = cancelSubscriptionSchema.safeParse(rawBody);

  if (!parsed.success) {
    // `appError(status, code, message)` không phải chữ ký của hàm: tham số đầu
    // là `AuthErrorCode`. Truyền `422` vào làm `AUTH_ERROR_DEFINITIONS[422]`
    // undefined → `status` undefined → Nitro trả 500. `VALIDATION_ERROR` cũng
    // chưa đăng ký; mã 422 đã có là `VALIDATION_FAILED`.
    throw new ValidationError(
      parsed.error.errors[0]?.message ?? "Dữ liệu yêu cầu huỷ không hợp lệ"
    );
  }

  const result = await userCancelRecurringSubscription(
    session.user_id,
    parsed.data.subscription_id
  );

  return {
    ok: true,
    subscription_id: result.subscription_id,
    status: result.status,
    auto_renew: result.auto_renew,
    effective_until: result.effective_until,
  };
});
