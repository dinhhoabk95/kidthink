import { getOwnerDb, notificationReads, notifications } from "@mindkid/db";
import { and, desc, eq, getTableColumns, isNull, lte, sql } from "drizzle-orm";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";

import { requireWebUserSession } from "#server/utils/auth-runtime";

const UserNotificationsQuerySchema = z.object({
  limit: z.union([z.string(), z.number()]).optional(),
  unread_only: z.string().optional(),
  cursor: z.string().optional(),
});

const NotificationPayloadSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
  action_url: z.string().optional(),
});

interface InboxParams {
  limit: number;
  unreadOnly: boolean;
  cursor: string | undefined;
}

function sanitizeActionUrl(
  url: string | number | boolean | null | undefined
): string {
  if (typeof url === "string" && url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }
  return "/me";
}

function parseInboxParams(
  query: z.infer<typeof UserNotificationsQuerySchema>
): InboxParams {
  const rawLimit = Number.parseInt(String(query.limit || "20"), 10);
  const limit = Math.min(
    Math.max(Number.isNaN(rawLimit) ? 20 : rawLimit, 1),
    50
  );
  const unreadOnly = query.unread_only === "true" || query.unread_only === "1";
  const cursor = typeof query.cursor === "string" ? query.cursor : undefined;
  return { limit, unreadOnly, cursor };
}

export default defineEventHandler(async (event) => {
  const user = requireWebUserSession(event);
  const userId = Number(user.user_id);
  const db = getOwnerDb();

  const parsedQuery = UserNotificationsQuerySchema.safeParse(getQuery(event));
  const query = parsedQuery.success ? parsedQuery.data : {};
  const { limit, unreadOnly, cursor } = parseInboxParams(query);

  const snapshotAt = new Date().toISOString();
  const snapshotDate = new Date(Date.now() + 60_000);

  // Build base conditions
  const conditions = [
    eq(notifications.recipientType, "user"),
    eq(notifications.recipientId, userId),
    lte(notifications.createdAt, snapshotDate),
  ];

  if (cursor) {
    const cursorDate = new Date(cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      conditions.push(lte(notifications.createdAt, cursorDate));
    }
  }

  if (unreadOnly) {
    conditions.push(isNull(notificationReads.readAt));
  }

  const rows = await db
    .select({
      ...getTableColumns(notifications),
      readAt: notificationReads.readAt,
    })
    .from(notifications)
    .leftJoin(
      notificationReads,
      eq(notificationReads.notificationId, notifications.id)
    )
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  const nextCursor =
    hasMore && items.length > 0
      ? items.at(-1)?.createdAt.toISOString() || null
      : null;

  // Get unread count
  const [unreadCountResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .leftJoin(
      notificationReads,
      eq(notificationReads.notificationId, notifications.id)
    )
    .where(
      and(
        eq(notifications.recipientType, "user"),
        eq(notifications.recipientId, userId),
        isNull(notificationReads.readAt)
      )
    );

  const unreadCount = unreadCountResult?.count ?? 0;

  return {
    items: items.map((item) => {
      const parsedPayload = NotificationPayloadSchema.safeParse(item.payload);
      const payload = parsedPayload.success ? parsedPayload.data : {};
      return {
        uuid: item.uuid,
        code: item.templateCode,
        title: payload.title || "Thông báo",
        body: payload.body || "",
        action_url: sanitizeActionUrl(payload.action_url),
        occurred_at: item.createdAt.toISOString(),
        read_at: item.readAt ? item.readAt.toISOString() : null,
      };
    }),
    next_cursor: nextCursor,
    unread_count: unreadCount,
    snapshot_at: snapshotAt,
  };
});
