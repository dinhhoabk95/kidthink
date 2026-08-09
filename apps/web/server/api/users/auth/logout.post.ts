import { requireUserAuth } from "@kidthink/auth";
import { defineEventHandler, setResponseStatus } from "h3";
import {
  clearUserAuthCookies,
  getUserRefreshService,
  respondToUserAuthError,
  validateUserCsrf,
} from "../../../utils/auth-runtime";

export default defineEventHandler(async (event) => {
  try {
    validateUserCsrf(event);
    const user = requireUserAuth(event);
    await getUserRefreshService(event).revokeSession(
      user.session_id,
      "user",
      user.user_id
    );
    clearUserAuthCookies(event);
    setResponseStatus(event, 204);
    return null;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
