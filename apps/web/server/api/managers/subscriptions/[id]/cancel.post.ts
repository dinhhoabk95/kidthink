import { appError } from "@mindkid/auth";
import { adminCancelSubscription } from "@mindkid/db";
import {
  type AdminSubscriptionCancelReason,
  AdminSubscriptionCancelRequestSchema,
} from "@mindkid/shared";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  const managerSession = requireSuperAdminSession(event);

  const idParam = getRouterParam(event, "id");
  const subscriptionId = Number(idParam);

  if (!idParam || Number.isNaN(subscriptionId) || subscriptionId <= 0) {
    throw appError("VALIDATION_FAILED", "ID gói thuê bao định kỳ không hợp lệ");
  }

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
  const parseResult = AdminSubscriptionCancelRequestSchema.safeParse({
    subscription_id: subscriptionId,
    reason: rawBody?.reason,
    admin_note: rawBody?.admin_note,
    revoke_immediate: rawBody?.revoke_immediate ?? false,
  });

  if (!parseResult.success) {
    throw appError(
      "VALIDATION_FAILED",
      parseResult.error.errors[0]?.message ??
        "Lý do huỷ hoặc ghi chú quản trị không hợp lệ (BR-ASC-03)"
    );
  }

  const result = await adminCancelSubscription({
    managerId: managerSession.manager_id,
    subscriptionId: parseResult.data.subscription_id,
    reason: parseResult.data.reason as AdminSubscriptionCancelReason,
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
