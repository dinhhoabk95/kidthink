import { defineEventHandler, deleteCookie } from "h3";
import {
  assertSameOriginRequest,
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    await requireWebUserSession(event);
    assertSameOriginRequest(event);
    deleteCookie(event, "active_child_id", { path: "/" });
    return { success: true };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
