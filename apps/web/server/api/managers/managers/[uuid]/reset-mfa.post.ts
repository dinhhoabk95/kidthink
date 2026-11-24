import { NotFoundError } from "@mindkid/errors/common";
import { getHeader, getRouterParam } from "h3";
import { resetManagerMfa } from "#server/services/account-lifecycle-service";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";
import { requireReauth } from "#server/utils/reauth-runtime";

export default defineApiRoute({
  auth: "super_admin",
  handler: async ({ event, auth: session }) => {
    requireReauth(event);

    const targetUuid = getRouterParam(event, "uuid");
    if (!targetUuid) {
      throw new NotFoundError();
    }

    return await resetManagerMfa({
      targetUuid,
      actorManagerId: session.manager_id,
      ipAddress: getVerifiedRemoteIp(event),
      userAgent: getHeader(event, "user-agent") ?? "unknown",
    });
  },
});
