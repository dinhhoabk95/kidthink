import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
import { getManagerOrderProofUrl } from "#server/services/order-review-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  const orderUuid = getRouterParam(event, "uuid");
  if (!orderUuid) {
    throw ValidationError.field("uuid", "Order UUID is required");
  }

  return await getManagerOrderProofUrl({
    managerId: session.manager_id,
    orderUuid,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") || null,
  });
});
