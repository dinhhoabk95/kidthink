import { UserNotFoundError } from "@mindkid/errors/account";
import {
  defineEventHandler,
  getHeader,
  getRouterParam,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import { grantManagerUserEntitlements } from "#server/services/subscription-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { readRequestBody } from "#server/utils/request-body";

/**
 * D-JN: Schema receives ONLY package_code, duration_days, grant_reason, notify_user.
 * Rejects extra properties (like entitlement_key) with 422.
 */
const grantEntitlementSchema = z
  .object({
    package_code: z.string({
      error: (iss) =>
        iss.input === undefined ? "Mã gói là bắt buộc." : undefined,
    }),
    duration_days: z
      .number({
        error: (iss) =>
          iss.input === undefined ? "Thời hạn là bắt buộc." : undefined,
      })
      .int("Thời hạn phải là số nguyên ngày.")
      .min(1, "Thời hạn tối thiểu là 1 ngày.")
      .max(365, "Thời hạn tối đa là 365 ngày một lần cấp (BR-EGR-04)."),
    grant_reason: z
      .string({
        error: (iss) =>
          iss.input === undefined ? "Lý do cấp là bắt buộc." : undefined,
      })
      .min(20, "Lý do cấp bắt buộc tối thiểu 20 ký tự (BR-EGR-02)."),
    notify_user: z.boolean().optional().default(true),
  })
  .strict();

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  if (!userUuid) {
    throw new UserNotFoundError();
  }

  const rawBody = await readRequestBody(event);
  const parsed = grantEntitlementSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const result = await grantManagerUserEntitlements({
    managerId: session.manager_id,
    userUuid,
    packageCode: parsed.data.package_code,
    durationDays: parsed.data.duration_days,
    grantReason: parsed.data.grant_reason,
    notifyUser: parsed.data.notify_user,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") || null,
  });

  setResponseStatus(event, 201);
  return result;
});
