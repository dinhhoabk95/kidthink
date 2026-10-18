import { InvalidCancelReasonError } from "@mindkid/errors/billing";
import { ValidationError } from "@mindkid/errors/common";
import { AdminSubscriptionCancelRequestSchema } from "@mindkid/shared";
import { defineEventHandler, getRouterParam } from "h3";
import { z } from "zod";
import { adminCancelSubscription } from "#server/services/index.js";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { readRequestBody } from "#server/utils/request-body";

const RawCancelBodySchema = z.object({
  reason: z.string().optional(),
  admin_note: z.string().optional(),
  revoke_immediate: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const managerSession = requireSuperAdminSession(event);

  const idParam = getRouterParam(event, "id");
  const subscriptionId = Number(idParam);

  if (!idParam || Number.isNaN(subscriptionId) || subscriptionId <= 0) {
    throw new ValidationError("ID gói thuê bao định kỳ không hợp lệ");
  }

  const bodyParsed = RawCancelBodySchema.safeParse(
    await readRequestBody(event)
  );
  if (!bodyParsed.success) {
    throw new InvalidCancelReasonError(
      "INVALID_CANCEL_REASON: Lý do huỷ hoặc ghi chú quản trị không hợp lệ (BR-ASC-03)"
    );
  }

  const parseResult = AdminSubscriptionCancelRequestSchema.safeParse({
    subscription_id: subscriptionId,
    reason: bodyParsed.data.reason,
    admin_note: bodyParsed.data.admin_note,
    revoke_immediate: bodyParsed.data.revoke_immediate ?? false,
  });

  if (!parseResult.success) {
    const issueMsg =
      parseResult.error.issues[0]?.message ??
      "Lý do huỷ hoặc ghi chú quản trị không hợp lệ (BR-ASC-03)";
    throw new InvalidCancelReasonError(`INVALID_CANCEL_REASON: ${issueMsg}`);
  }

  const result = await adminCancelSubscription({
    managerId: managerSession.manager_id,
    subscriptionId: parseResult.data.subscription_id,
    reason: parseResult.data.reason,
    adminNote: parseResult.data.admin_note,
    revokeImmediate: parseResult.data.revoke_immediate,
  });

  return {
    ok: true,
    subscription_id: result.subscription_id,
    status: result.status,
    auto_renew: result.auto_renew,
    revoke_immediate: result.revoke_immediate,
    effective_until: result.effective_until,
  };
});
