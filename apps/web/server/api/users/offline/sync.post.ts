import { OfflineSyncRequestSchema } from "@mindkid/shared";
import { defineEventHandler, readBody } from "h3";
import { syncOfflinePlayEvents } from "#server/services/index.js";
import { throwValidationError } from "#server/utils/api-error";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);

  const eventBody =
    (event.context as { body?: Record<string, unknown> })?.body ||
    (event as { _body?: Record<string, unknown> })._body;
  const body = eventBody || (await readBody(event)) || {};

  const parsed = OfflineSyncRequestSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const result = await syncOfflinePlayEvents({ userId }, parsed.data.events);

  return result;
});
