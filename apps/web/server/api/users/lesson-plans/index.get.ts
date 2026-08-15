import { listLessonPlans } from "@kidthink/db";
import { defineEventHandler } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const userId = Number(user.user_id);
    const plans = await listLessonPlans(userId);
    return {
      plans,
      total: plans.length,
    };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
