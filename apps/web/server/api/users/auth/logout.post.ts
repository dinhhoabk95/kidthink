import { getBrowserSessionService, requireUserAuth } from "@mindkid/auth";
import { activeSessions, getOwnerDb } from "@mindkid/db";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler, type H3Event } from "h3";
import {
  clearUserRememberCookie,
  validateUserCsrf,
} from "#server/utils/auth-runtime";

export async function handleLogout(event: H3Event) {
  validateUserCsrf(event);
  const user = requireUserAuth(event);
  const deviceId = await getBrowserSessionService().revokeSession(
    "user",
    user.user_id,
    user.session_id
  );

  if (deviceId) {
    await getOwnerDb()
      .update(activeSessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(activeSessions.accountType, "user"),
          eq(activeSessions.accountId, user.user_id),
          eq(activeSessions.deviceId, deviceId),
          isNull(activeSessions.revokedAt)
        )
      )
      .catch(() => null);
  }

  await clearUserSession(event);
  clearUserRememberCookie(event);

  return { success: true };
}

export default defineEventHandler((event) => handleLogout(event));
