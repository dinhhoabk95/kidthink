import { getBrowserSessionService, requireUserAuth } from "@kidthink/auth";
import { getAppSql, PostgresSessionStore } from "@kidthink/db";
import { defineEventHandler, type H3Event } from "h3";
import { clearUserSession } from "#imports";
import {
  clearUserRememberCookie,
  respondToUserAuthError,
  validateUserCsrf,
} from "../../../utils/auth-runtime";

export async function handleLogoutAll(event: H3Event) {
  try {
    validateUserCsrf(event);
    const user = requireUserAuth(event);

    const service = getBrowserSessionService();
    await service.revokeAll({
      account_type: "user",
      account_id: user.user_id,
    });

    const pgStore = new PostgresSessionStore(getAppSql());
    await pgStore
      .markAllRevoked({
        account_type: "user",
        account_id: user.user_id,
      })
      .catch(() => null);

    await clearUserSession(event);
    clearUserRememberCookie(event);

    return { success: true };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
}

export default defineEventHandler((event) => handleLogoutAll(event));
