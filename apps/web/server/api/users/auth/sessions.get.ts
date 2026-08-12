import { activeSessions, getAppDb } from "@kidthink/db";
import { and, eq, gte } from "drizzle-orm";
import { defineEventHandler, type H3Event } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime";

export async function handleGetSessions(event: H3Event) {
  try {
    const userSession = await requireWebUserSession(event);
    const db = getAppDb();

    const rows = await db
      .select()
      .from(activeSessions)
      .where(
        and(
          eq(activeSessions.accountType, "user"),
          eq(activeSessions.accountId, userSession.user_id),
          gte(activeSessions.expiresAt, new Date())
        )
      );

    return {
      sessions: rows.map((r) => ({
        id: String(r.id),
        deviceLabel: r.deviceLabel,
        ipAddress: r.ipAddress,
        authMethod: r.authMethod,
        lastUsedAt: r.lastUsedAt,
        createdAt: r.createdAt,
        isCurrent: String(r.id) === userSession.session_id,
      })),
    };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
}

export default defineEventHandler((event) => handleGetSessions(event));
