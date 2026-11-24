import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam } from "h3";
import { markUserNotificationRead } from "#server/services/notification-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuidParam = getRouterParam(event, "uuid");

  if (!uuidParam) {
    throw new ValidationError("Thiếu notification UUID");
  }

  return await markUserNotificationRead(userId, uuidParam);
});
