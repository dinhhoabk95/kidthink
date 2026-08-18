import { listLessonPlans } from "@mindkid/db";
import { defineEventHandler } from "h3";
import { requireWebUserSession } from "../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const plans = await listLessonPlans(userId);
  return {
    plans,
    total: plans.length,
  };
});
