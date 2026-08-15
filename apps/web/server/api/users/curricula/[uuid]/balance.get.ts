import { getPersonalCurriculumByUuid } from "@kidthink/db";
import { defineEventHandler, getRouterParam } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const userId = Number(user.user_id);
    const uuid = getRouterParam(event, "uuid") || "";

    const curriculum = await getPersonalCurriculumByUuid({ userId }, uuid);
    return {
      balance: curriculum.balance,
      warnings: curriculum.warnings,
      status: curriculum.status,
    };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
