import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam } from "h3";
import { getChildPlayBudget } from "#server/services/child-report-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new NotFoundError();
  }

  return await getChildPlayBudget({
    userId: Number(user.user_id),
    childUuid: uuid,
  });
});
