import { getOwnerDb, notificationReads, notifications } from "@mindkid/db";
import { and, eq, isNull, lte } from "drizzle-orm";
import { createError, defineEventHandler, readBody } from "h3";
import { z } from "zod";

import { requireWebUserSession } from "../../../utils/auth-runtime.js";

const readAllSchema = z.object({
  snapshot_at: z
    .string()
    .datetime({ message: "snapshot_at phải là ISO string hợp lệ" }),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const body =
    (await readBody(event).catch(() => null)) ||
    event._body ||
    event.context?.body ||
    {};
  const parsed = readAllSchema.safeParse(body);

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "INVALID_READ_ALL_PAYLOAD",
      data: {
        code: "INVALID_READ_ALL_PAYLOAD",
        message: parsed.error.issues[0]?.message,
      },
    });
  }

  const snapshotDate = new Date(parsed.data.snapshot_at);
  const db = getOwnerDb();

  // Query unread notifications created <= snapshot_at
  const unreadNotifications = await db
    .select({ id: notifications.id })
    .from(notifications)
    .leftJoin(
      notificationReads,
      eq(notificationReads.notificationId, notifications.id)
    )
    .where(
      and(
        eq(notifications.recipientType, "user"),
        eq(notifications.recipientId, userId),
        lte(notifications.createdAt, snapshotDate),
        isNull(notificationReads.readAt)
      )
    );

  if (unreadNotifications.length === 0) {
    return {
      marked_count: 0,
      snapshot_at: parsed.data.snapshot_at,
    };
  }

  const now = new Date();
  const insertValues = unreadNotifications.map((n) => ({
    notificationId: n.id,
    readAt: now,
  }));

  await db.insert(notificationReads).values(insertValues).onConflictDoNothing();

  return {
    marked_count: unreadNotifications.length,
    snapshot_at: parsed.data.snapshot_at,
  };
});
