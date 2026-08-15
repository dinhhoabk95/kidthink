import { deleteCustomGame } from "@kidthink/db";
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

    const result = await deleteCustomGame(userId, uuid);
    return result;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
