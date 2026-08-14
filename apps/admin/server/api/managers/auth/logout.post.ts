import { getBrowserSessionService } from "@kidthink/auth";
import { defineEventHandler, type H3Event } from "h3";
import { clearUserSession, getUserSession } from "#imports";
import {
  clearManagerRememberCookie,
  respondToManagerAuthError,
  validateManagerCsrf,
} from "../../../../utils/admin-auth-runtime.js";

export async function handleLogout(event: H3Event) {
  try {
    validateManagerCsrf(event);
    const session = await getUserSession(event);
    const service = getBrowserSessionService();

    if (session?.manager?.manager_id && session.secure?.session_token) {
      await service
        .resolve("manager", session.secure.session_token)
        .then(async (authCtx) => {
          if (authCtx?.manager) {
            await service.revokeAll({
              account_type: "manager",
              account_id: authCtx.manager.manager_id,
            });
          }
        })
        .catch(() => null);
    }

    await clearUserSession(event);
    clearManagerRememberCookie(event);

    return { success: true };
  } catch (error) {
    return respondToManagerAuthError(event, error);
  }
}

export default defineEventHandler((event) => handleLogout(event));
