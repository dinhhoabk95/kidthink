import { AppError } from "@kidthink/auth";
import { getOwnerDb, notificationReads, notifications } from "@kidthink/db";
import { and, desc, eq, getTableColumns, isNull, lte, sql } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getQuery,
  setResponseStatus,
} from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";

function sanitizeActionUrl(url: unknown): string {
  if (typeof url === "string" && url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }
  return "/me";
}

function parseInboxParams(query: Record<string, unknown>) {
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
  try {
    const user = await requireWebUserSession(event);
    const userId = Number(user.user_id);
    const db = getOwnerDb();

    const query = getQuery(event);
    const { limit, unreadOnly, cursor } = parseInboxParams(query);

    const snapshotAt = new Date().toISOString();
    const snapshotDate = new Date(snapshotAt);

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
        const payload = (item.payload as Record<string, unknown>) || {};
        return {
          uuid: item.uuid,
          code: item.templateCode,
          title: String(payload.title || "Thông báo"),
          body: String(payload.body || ""),
          action_url: sanitizeActionUrl(payload.action_url),
          occurred_at: item.createdAt.toISOString(),
          read_at: item.readAt ? item.readAt.toISOString() : null,
        };
      }),
      next_cursor: nextCursor,
      unread_count: unreadCount,
      snapshot_at: snapshotAt,
    };
  } catch (err) {
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: { code: err.code, message: err.message },
      });
    }
    return respondToUserAuthError(event, err);
  }
});
