import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getHeader, getRouterParam, setHeader } from "h3";
import { getManagerUserDetail } from "#server/services/identity-manager-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  if (!(userUuid && UUID_REGEX.test(userUuid))) {
    throw new NotFoundError();
  }

  setHeader(event, "Cache-Control", "no-store");

  return await getManagerUserDetail({
    userUuid,
    managerId: session.manager_id,
    ipAddress: getVerifiedRemoteIp(event),
    userAgent: getHeader(event, "user-agent") ?? "unknown",
  });
});
