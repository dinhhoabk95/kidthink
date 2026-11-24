import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
import { sendUserPasswordResetByManager } from "#server/services/identity-manager-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  if (!userUuid) {
    throw new NotFoundError();
  }

  return await sendUserPasswordResetByManager({
    userUuid,
    managerId: session.manager_id,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? "unknown",
  });
});
