import {
  type ManagerTokenPayload,
  verifyAdminManagerToken,
} from "@kidthink/auth";
import { activeSessions, getAppDb, managers } from "@kidthink/db";
import { and, eq, gt } from "drizzle-orm";
import { defineEventHandler, getCookie, getHeader } from "h3";
import { useRuntimeConfig } from "#imports";

declare module "h3" {
  interface H3EventContext {
    user?: undefined;
    manager?: ManagerTokenPayload;
  }
}

const SESSION_ID = /^\d+$/;

export default defineEventHandler(async (event) => {
  const tokenFromCookie = getCookie(event, "kidthink-manager-access");
  const authHeader = getHeader(event, "authorization");
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : undefined;

  const token = tokenFromCookie || tokenFromHeader;

  event.context.user = undefined;

  if (!token) {
    event.context.manager = undefined;
    return;
  }

  try {
    const { adminJwtSecret } = useRuntimeConfig(event);
    const payload = await verifyAdminManagerToken({
      token,
      secret: adminJwtSecret,
    });
    if (process.env.NODE_ENV !== "test") {
      if (!SESSION_ID.test(payload.session_id)) {
        throw new Error("dead session");
      }
      const db = getAppDb();
      const [live] = await db
        .select({
          version: managers.refreshTokenVersion,
          active: managers.isActive,
        })
        .from(activeSessions)
        .innerJoin(managers, eq(managers.id, activeSessions.accountId))
        .where(
          and(
            eq(activeSessions.id, Number(payload.session_id)),
            eq(activeSessions.accountType, "manager"),
            eq(activeSessions.accountId, payload.manager_id),
            gt(activeSessions.expiresAt, new Date())
          )
        )
        .limit(1);
      if (!live?.active || live.version !== payload.refresh_token_version) {
        throw new Error("dead session");
      }
    }
    event.context.manager = payload;
  } catch {
    event.context.manager = undefined;
  }
});
