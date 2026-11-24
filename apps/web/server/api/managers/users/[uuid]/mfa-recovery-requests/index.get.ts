import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam } from "h3";
import { listUserMfaRecoveryRequests } from "#server/services/account-lifecycle-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireSuperAdminSession(event);
  const userUuid = getRouterParam(event, "uuid");
  if (!userUuid) {
    throw new NotFoundError();
  }

  return await listUserMfaRecoveryRequests(userUuid);
});
