import { appError } from "@mindkid/auth";
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";

import {
  assertRequestBodySize,
  requireWebUserSession,
} from "../../utils/auth-runtime.js";

const ALLOWED_PREFERENCE_KEYS = new Set(["weekly_progress", "content_new"]);

const NotificationPreferencesSchema = z
  .object({
    weekly_progress: z.boolean().optional(),
    content_new: z.boolean().optional(),
  })
  .strict();

export default defineEventHandler(async (event) => {
  assertRequestBodySize(event, 8 * 1024);
  await requireWebUserSession(event);

  const eventBody = (event.context as { body?: Record<string, unknown> })?.body;
  const rawBody =
    eventBody || ((await readBody(event)) as Record<string, unknown>) || {};

  // Check for disallowed / transactional keys (BR-ACS-06)
  for (const key of Object.keys(rawBody)) {
    if (!ALLOWED_PREFERENCE_KEYS.has(key)) {
      throw appError("TRANSACTIONAL_NOTIFICATION_CANNOT_BE_DISABLED");
    }
  }

  const parsed = NotificationPreferencesSchema.safeParse(rawBody);
  if (!parsed.success) {
    setResponseStatus(event, 422);
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      data: {
        code: "VALIDATION_FAILED",
        message: "Tuỳ chọn thông báo không hợp lệ.",
      },
    });
  }

  const weeklyProgress = parsed.data.weekly_progress ?? true;
  const contentNew = parsed.data.content_new ?? true;

  return {
    weekly_progress: weeklyProgress,
    content_new: contentNew,
    message: "Cập nhật tuỳ chọn thông báo thành công.",
  };
});
