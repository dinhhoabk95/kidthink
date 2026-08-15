import { appError } from "@kidthink/auth";
import { getLessonPlanByUuid } from "@kidthink/db";
import { defineEventHandler, getRouterParam } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      throw appError("NOT_FOUND", "Thiếu mã định danh giáo án.");
    }

    const userId = Number(user.user_id);
    const plan = await getLessonPlanByUuid(userId, uuid);
    return plan;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
