import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import { revokeUserNotificationEndpoint } from "#server/services/notification-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuidParam = getRouterParam(event, "uuid");

  if (!uuidParam) {
    throw new ValidationError("Thiếu endpoint UUID");
  }

  await revokeUserNotificationEndpoint(userId, uuidParam);
  setResponseStatus(event, 204);
  return null;
});
