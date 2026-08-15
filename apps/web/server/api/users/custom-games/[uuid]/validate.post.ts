import { validateCustomGameRecord } from "@kidthink/db";
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

    const report = await validateCustomGameRecord(userId, uuid);
    return report;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
