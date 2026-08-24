import { getOwnerDb, notificationEndpoints } from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  setResponseStatus,
} from "h3";

import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuidParam = getRouterParam(event, "uuid");

  if (!uuidParam) {
    throw createError({
      statusCode: 400,
      statusMessage: "ENDPOINT_UUID_REQUIRED",
      data: {
        code: "ENDPOINT_UUID_REQUIRED",
        message: "Thiếu endpoint UUID",
      },
    });
  }

  const db = getOwnerDb();

  const [existing] = await db
    .select()
    .from(notificationEndpoints)
    .where(
      and(
        eq(notificationEndpoints.uuid, uuidParam),
        eq(notificationEndpoints.userId, userId)
      )
    );

  if (!existing) {
    // 404 for missing or cross-user endpoint
    throw createError({
      statusCode: 404,
      statusMessage: "ENDPOINT_NOT_FOUND",
      data: { code: "ENDPOINT_NOT_FOUND", message: "Endpoint không tồn tại" },
    });
  }

  // Revoke endpoint (idempotent if already revoked)
  if (existing.status !== "revoked") {
    await db
      .update(notificationEndpoints)
      .set({
        status: "revoked",
        invalidatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notificationEndpoints.id, existing.id));
  }

  setResponseStatus(event, 204);
  return null;
});
