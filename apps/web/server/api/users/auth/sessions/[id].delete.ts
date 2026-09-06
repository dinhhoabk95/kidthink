import { getBrowserSessionService } from "@mindkid/auth";
import { activeSessions, getAppDb } from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam, type H3Event } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export async function handleDeleteSession(event: H3Event) {
  const userSession = await requireWebUserSession(event);
  const sessionId = getRouterParam(event, "id") || event.context?.params?.id;

  if (!sessionId) {
    throw new ValidationError();
  }

  const idNum = Number(sessionId);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    throw new ValidationError();
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
}

export default defineEventHandler((event) => handleDeleteSession(event));
