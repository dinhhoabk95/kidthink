import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { getUserNotificationsInbox } from "#server/services/notification-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

const UserNotificationsQuerySchema = z.object({
  limit: z.union([z.string(), z.number()]).optional(),
  unread_only: z.string().optional(),
  cursor: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const user = requireWebUserSession(event);
  const userId = Number(user.user_id);

  const parsedQuery = UserNotificationsQuerySchema.safeParse(getQuery(event));
  const query = parsedQuery.success ? parsedQuery.data : {};

  return await getUserNotificationsInbox(userId, query);
});
