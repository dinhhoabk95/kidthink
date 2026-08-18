import { getBrowserSessionService, requireUserAuth } from "@mindkid/auth";
import { getAppSql, PostgresSessionStore } from "@mindkid/db";
import { defineEventHandler, type H3Event } from "h3";
import { clearUserSession } from "#imports";
import {
  clearUserRememberCookie,
  validateUserCsrf,
} from "../../../utils/auth-runtime";

export async function handleLogoutAll(event: H3Event) {
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
}

export default defineEventHandler((event) => handleLogoutAll(event));
