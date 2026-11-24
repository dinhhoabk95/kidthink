import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
import { cancelUserMfaRecoveryRequest } from "#server/services/account-lifecycle-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const session = await requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  const reqUuid = getRouterParam(event, "reqUuid");

  if (!(userUuid && reqUuid)) {
    throw new NotFoundError();
  }

  return await cancelUserMfaRecoveryRequest({
    userUuid,
    reqUuid,
    managerId: session.manager_id,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? "unknown",
  });
});
