import { getBrowserSessionService, requireUserAuth } from "@mindkid/auth";
import { defineEventHandler, type H3Event } from "h3";
import {
  clearUserRememberCookie,
  validateUserCsrf,
} from "#server/utils/auth-runtime";

export async function handleLogout(event: H3Event) {
  validateUserCsrf(event);
  const user = requireUserAuth(event);
  await getBrowserSessionService().revokeAll({
    account_type: "user",
    account_id: user.user_id,
  });

  await clearUserSession(event);
  clearUserRememberCookie(event);

  return { success: true };
}

export default defineEventHandler((event) => handleLogout(event));
