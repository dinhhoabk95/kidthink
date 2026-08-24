import { getOwnerDb, notificationReads, notifications } from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";

import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuidParam = getRouterParam(event, "uuid");

  if (!uuidParam) {
    throw createError({
      statusCode: 400,
      statusMessage: "NOTIFICATION_UUID_REQUIRED",
      data: {
        code: "NOTIFICATION_UUID_REQUIRED",
        message: "Thiếu notification UUID",
      },
    });
  }

  const db = getOwnerDb();

  // Query notification belonging to user
  const [notif] = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.uuid, uuidParam),
        eq(notifications.recipientType, "user"),
        eq(notifications.recipientId, userId)
      )
    );

  if (!notif) {
    // BR-NIB-02: 404 for cross-user or missing notification to prevent IDOR
    throw createError({
      statusCode: 404,
      statusMessage: "NOTIFICATION_NOT_FOUND",
      data: {
        code: "NOTIFICATION_NOT_FOUND",
        message: "Thông báo không tồn tại",
      },
    });
  }

  // Check existing read row
  const [existingRead] = await db
    .select()
    .from(notificationReads)
    .where(eq(notificationReads.notificationId, notif.id));

  let readAt = existingRead?.readAt;

  if (!readAt) {
    readAt = new Date();
    await db
      .insert(notificationReads)
      .values({
        notificationId: notif.id,
        readAt,
      })
      .onConflictDoNothing();
  }

  return {
    uuid: notif.uuid,
    read_at: readAt.toISOString(),
  };
});
