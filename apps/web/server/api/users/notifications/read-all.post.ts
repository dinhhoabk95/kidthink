import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { markAllUserNotificationsRead } from "#server/services/notification-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { readRequestBody } from "#server/utils/request-body";

const readAllSchema = z.object({
  snapshot_at: z
    .string()
    .datetime({ message: "snapshot_at phải là ISO string hợp lệ" }),
});

export default defineEventHandler(async (event) => {
  const user = requireWebUserSession(event);
  const userId = Number(user.user_id);
  const body = await readRequestBody(event);
  const parsed = readAllSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message);
  }

  return await markAllUserNotificationsRead(userId, parsed.data.snapshot_at);
});
