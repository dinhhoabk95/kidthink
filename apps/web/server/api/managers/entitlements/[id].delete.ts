import { ValidationError } from "@mindkid/errors/common";

import { defineEventHandler, getHeader, getRouterParam } from "h3";
import { z } from "zod";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { revokeUserEntitlementById } from "#server/utils/entitlements-runtime";
import { readRequestBody } from "#server/utils/request-body";

const revokeEntitlementSchema = z.object({
  reason: z
    .string({
      error: (iss) =>
        iss.input === undefined ? "Lý do thu hồi là bắt buộc." : undefined,
    })
    .min(10, "Lý do thu hồi bắt buộc tối thiểu 10 ký tự."),
});

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  const idParam = getRouterParam(event, "id");
  const entitlementId = Number(idParam);
  if (!idParam || Number.isNaN(entitlementId) || entitlementId <= 0) {
    throw new ValidationError("Mã entitlement không hợp lệ.");
  }

  const rawBody = await readRequestBody(event);

  const parsed = revokeEntitlementSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const result = await revokeUserEntitlementById(
    entitlementId,
    parsed.data.reason,
    {
      type: "manager",
      id: session.manager_id,
      ip: getVerifiedRemoteIp(event),
      userAgent: getHeader(event, "user-agent") || null,
    }
  );

  return {
    status: "cancelled",
    id: result.id,
    key: result.key,
  };
});
