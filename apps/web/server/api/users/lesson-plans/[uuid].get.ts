import { LessonPlanNotFoundError } from "@mindkid/errors/content";
import { defineEventHandler, getRouterParam } from "h3";
import { getLessonPlanByUuid } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new LessonPlanNotFoundError();
  }

  const userId = Number(user.user_id);
  const plan = await getLessonPlanByUuid(userId, uuid);
  return plan;
});
