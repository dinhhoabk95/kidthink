import { InsufficientRoleError } from "@mindkid/errors/auth";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import {
  listManagerNotifications,
  type NotificationPayloadObject,
  sanitizeNotificationPayload as sanitizePayload,
} from "#server/services/notification-service";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export function sanitizeNotificationPayload(
  payload: NotificationPayloadObject | null,
  templateCode: string
): NotificationPayloadObject | null {
  return sanitizePayload(payload, templateCode);
}

const ManagerNotificationsQuerySchema = z.object({
  code: z.string().optional(),
  status: z.string().optional(),
  channel: z.string().optional(),
  recipient: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-NTA-05: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền xem lịch sử thông báo (BR-NTA-05)"
    );
  }

  const parsedQuery = ManagerNotificationsQuerySchema.safeParse(
    getQuery(event)
  );
  const query = parsedQuery.success ? parsedQuery.data : {};

  return await listManagerNotifications(query);
});
