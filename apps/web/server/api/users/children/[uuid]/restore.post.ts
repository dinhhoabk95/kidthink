import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam } from "h3";
import { restoreChildProfileForUser } from "#server/services/child-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError("NOT_FOUND");
  }

  return await restoreChildProfileForUser({
    userId: Number(user.user_id),
    childUuid: uuid,
  });
});
