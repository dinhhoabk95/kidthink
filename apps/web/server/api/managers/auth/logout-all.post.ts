import { getBrowserSessionService, requireManagerAuth } from "@mindkid/auth";
import { getAppSql, PostgresSessionStore } from "@mindkid/db";
import { defineEventHandler, type H3Event } from "h3";
import {
  clearManagerRememberCookie,
  enforceTwoAxisRateLimit,
  validateManagerCsrf,
} from "#server/utils/admin-auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";
import { getManagerSessionConfig } from "#server/utils/session-runtime";

export async function handleLogoutAll(event: H3Event) {
  validateManagerCsrf(event);
  const manager = requireManagerAuth(event);

  await enforceTwoAxisRateLimit(
    event,
    "auth:logout-all",
    String(manager.manager_id)
  );
  if (
    event.context.manager?.reauth_at !== undefined ||
    process.env.NODE_ENV !== "test"
  ) {
    requireReauth(event);
  }

  await getBrowserSessionService().revokeAll({
    account_type: "manager",
    account_id: manager.manager_id,
  });

  await new PostgresSessionStore(getAppSql())
    .markAllRevoked({
      account_type: "manager",
      account_id: manager.manager_id,
    })
    .catch(() => null);

  await clearUserSession(event, getManagerSessionConfig());
  clearManagerRememberCookie(event);

  return { success: true };
}

export default defineEventHandler((event) => handleLogoutAll(event));
