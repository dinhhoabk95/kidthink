import { appError } from "@mindkid/auth";
import { getLessonPlanByUuid } from "@mindkid/db";
import { defineEventHandler, getRouterParam } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw appError("NOT_FOUND", "Thiếu mã định danh giáo án.");
  }

  const userId = Number(user.user_id);
  const plan = await getLessonPlanByUuid(userId, uuid);
  return plan;
});
