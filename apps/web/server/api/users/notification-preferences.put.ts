import { TransactionalNotificationCannotBeDisabledError } from "@mindkid/errors/account";
import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler } from "h3";

import { requireWebUserSession } from "#server/utils/auth-runtime";
import {
  ALLOWED_PREFERENCE_KEYS,
  NotificationPreferencesPatchSchema,
  setUserNotificationPreferences,
} from "#server/utils/notification-preferences-runtime";
import { readBodyWithLimit } from "#server/utils/request-body";

export default defineEventHandler(async (event) => {
  const userSession = await requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  const rawBody = await readBodyWithLimit(event);

  // Check for disallowed / transactional keys (BR-ACS-06, BR-NOT-01)
  for (const key of Object.keys(rawBody)) {
    if (!ALLOWED_PREFERENCE_KEYS.has(key)) {
      throw new TransactionalNotificationCannotBeDisabledError();
    }
  }

  const parsed = NotificationPreferencesPatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Tuỳ chọn thông báo không hợp lệ.");
  }

  const updated = setUserNotificationPreferences(userId, parsed.data);

  return {
    weekly_progress: updated.weekly_progress,
    content_new: updated.content_new,
    message: "Cập nhật tuỳ chọn thông báo thành công.",
  };
});
