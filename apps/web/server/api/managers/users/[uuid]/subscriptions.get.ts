import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam } from "h3";
import { listManagerUserSubscriptions } from "#server/services/subscription-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  requireSuperAdminSession(event);

  const uuidParam =
    getRouterParam(event, "uuid") || getRouterParam(event, "id");
  if (!uuidParam) {
    throw ValidationError.field("uuid", "ID người dùng không hợp lệ");
  }

  return await listManagerUserSubscriptions(uuidParam);
});
