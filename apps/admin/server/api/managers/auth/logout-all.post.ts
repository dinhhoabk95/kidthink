import { getBrowserSessionService, requireManagerAuth } from "@mindkid/auth";
import { getAppSql, PostgresSessionStore } from "@mindkid/db";
import { defineEventHandler, type H3Event } from "h3";
import { clearUserSession } from "#imports";
import {
  clearManagerRememberCookie,
  validateManagerCsrf,
} from "../../../../utils/admin-auth-runtime.js";

export async function handleLogoutAll(event: H3Event) {
  validateManagerCsrf(event);
  const manager = requireManagerAuth(event);

  const service = getBrowserSessionService();
  await service.revokeAll({
    account_type: "manager",
    account_id: manager.manager_id,
  });

  const pgStore = new PostgresSessionStore(getAppSql());
  await pgStore
    .markAllRevoked({
      account_type: "manager",
      account_id: manager.manager_id,
    })
    .catch(() => null);

  await clearUserSession(event);
  clearManagerRememberCookie(event);

  return { success: true };
}

export default defineEventHandler((event) => handleLogoutAll(event));
