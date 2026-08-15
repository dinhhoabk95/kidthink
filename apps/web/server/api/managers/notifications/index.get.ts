import {
  getOwnerDb,
  notificationDeliveries,
  notifications,
  users,
} from "@kidthink/db";
import { desc, eq } from "drizzle-orm";
import { createError, defineEventHandler, getQuery } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const manager = await requireManagerSession(event);

    // BR-NTA-05: super_admin only
    if (manager.role !== "super_admin") {
      throw createError({
        statusCode: 403,
        statusMessage: "INSUFFICIENT_ROLE",
        message:
          "Chỉ super_admin mới có quyền xem lịch sử thông báo (BR-NTA-05)",
      });
    }

    const query = getQuery(event);
    const limit = Math.min(Number(query.limit) || 50, 100);

    const db = getOwnerDb();
    const rows = await db
      .select({
        id: notificationDeliveries.id,
        uuid: notificationDeliveries.uuid,
        notificationId: notificationDeliveries.notificationId,
        channel: notificationDeliveries.channel,
        status: notificationDeliveries.status,
        providerMessageId: notificationDeliveries.providerMessageId,
        error: notificationDeliveries.error,
        suppressedReason: notificationDeliveries.suppressedReason,
        dispatchedAt: notificationDeliveries.dispatchedAt,
        createdAt: notificationDeliveries.createdAt,
        templateCode: notifications.templateCode,
        recipientType: notifications.recipientType,
        recipientId: notifications.recipientId,
        recipientEmail: users.email,
      })
      .from(notificationDeliveries)
      .innerJoin(
        notifications,
        eq(notificationDeliveries.notificationId, notifications.id)
      )
      .leftJoin(users, eq(notifications.recipientId, users.id))
      .orderBy(desc(notificationDeliveries.createdAt))
      .limit(limit);

    return {
      items: rows,
      total: rows.length,
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
