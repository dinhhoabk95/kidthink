import { getBrowserSessionService } from "@mindkid/auth";
import { defineEventHandler, type H3Event } from "h3";
import { clearUserSession, getUserSession } from "#imports";
import {
  clearUserRememberCookie,
  validateUserCsrf,
} from "../../../utils/auth-runtime";

export async function handleLogout(event: H3Event) {
  validateUserCsrf(event);
  const session = await getUserSession(event);
  const service = getBrowserSessionService();

  if (session?.user?.user_id && session.secure?.session_token) {
    // Revoke session in Redis
    await service
      .resolve("user", session.secure.session_token)
      .then(async (authCtx) => {
        if (authCtx?.user) {
          await service.revokeAll({
            account_type: "user",
            account_id: authCtx.user.user_id,
          });
        }
      })
      .catch(() => null);
  }

  await clearUserSession(event);
  clearUserRememberCookie(event);

  return { success: true };
}

export default defineEventHandler((event) => handleLogout(event));
