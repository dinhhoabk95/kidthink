import { appError, getBrowserSessionService } from "@kidthink/auth";
import { activeSessions, getAppDb } from "@kidthink/db";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam, type H3Event } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";

export async function handleDeleteSession(event: H3Event) {
  try {
    const userSession = await requireWebUserSession(event);
    const sessionId = getRouterParam(event, "id") || event.context?.params?.id;

    if (!sessionId) {
      throw appError("VALIDATION_FAILED");
    }

    const idNum = Number(sessionId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      throw appError("VALIDATION_FAILED");
    }

    const db = getAppDb();
    const [targetSession] = await db
      .select()
      .from(activeSessions)
      .where(
        and(
          eq(activeSessions.id, idNum),
          eq(activeSessions.accountType, "user"),
          eq(activeSessions.accountId, userSession.user_id)
        )
      );

    if (targetSession) {
      const service = getBrowserSessionService();
      if (targetSession.deviceId) {
        await service
          .revokeDevice({
            namespace: "user",
            accountId: userSession.user_id,
            deviceId: targetSession.deviceId,
          })
          .catch(() => null);
      }
      await db
        .delete(activeSessions)
        .where(
          and(
            eq(activeSessions.id, idNum),
            eq(activeSessions.accountType, "user"),
            eq(activeSessions.accountId, userSession.user_id)
          )
        );
    }

    return { ok: true };
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
}

export default defineEventHandler((event) => handleDeleteSession(event));
