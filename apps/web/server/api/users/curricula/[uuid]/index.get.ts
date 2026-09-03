import { defineEventHandler, getRouterParam } from "h3";
import { getPersonalCurriculumByUuid } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuid = getRouterParam(event, "uuid") || "";

  const curriculum = await getPersonalCurriculumByUuid({ userId }, uuid);
  return curriculum;
});
