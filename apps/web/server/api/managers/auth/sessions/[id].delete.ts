import { getBrowserSessionService, requireManagerAuth } from "@mindkid/auth";
import { activeSessions, getAppDb } from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { and, eq } from "drizzle-orm";
import { getRouterParam, type H3Event } from "h3";
import { z } from "zod";
import { validateManagerCsrf } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";
import { defineApiRoute } from "#server/utils/define-api-route";

const sessionIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function handleDeleteManagerSession(event: H3Event) {
  validateManagerCsrf(event);
  const managerSession = requireManagerAuth(event);
  const rawId = getRouterParam(event, "id") || event.context?.params?.id;

  const parsed = sessionIdParamSchema.safeParse({ id: rawId });
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }
  const idNum = parsed.data.id;

  const db = getAppDb();
  const [targetSession] = await db
    .select()
    .from(activeSessions)
    .where(
      and(
        eq(activeSessions.id, idNum),
        eq(activeSessions.accountType, "manager"),
        eq(activeSessions.accountId, managerSession.manager_id)
      )
    );

  if (!targetSession) {
    throw new NotFoundError();
  }

  const service = getBrowserSessionService();
  if (targetSession.deviceId) {
    await service
      .revokeDevice({
        namespace: "manager",
        accountId: managerSession.manager_id,
        deviceId: targetSession.deviceId,
      })
      .catch(() => null);
  }

  await db
    .delete(activeSessions)
    .where(
      and(
        eq(activeSessions.id, idNum),
        eq(activeSessions.accountType, "manager"),
        eq(activeSessions.accountId, managerSession.manager_id)
      )
    );

  return { ok: true };
}

export default defineApiRoute({
  auth: "manager",
  handler: ({ event }) => handleDeleteManagerSession(event),
});
