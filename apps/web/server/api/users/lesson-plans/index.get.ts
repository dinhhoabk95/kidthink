import { listLessonPlans } from "@mindkid/db";
import { defineEventHandler } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const result = await listLessonPlans(userId);
  return result;
});
