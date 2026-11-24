import { OfflineSyncRequestSchema } from "@mindkid/shared";
import { defineEventHandler, getRequestHeader } from "h3";
import { syncOfflinePlayEvents } from "#server/services/index.js";
import { throwValidationError } from "#server/utils/api-error";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { readJsonBodyWithLimit } from "#server/utils/request-body";

const MAX_OFFLINE_SYNC_BODY_BYTES = 64 * 1024;

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);

  const body = await readJsonBodyWithLimit(event, MAX_OFFLINE_SYNC_BODY_BYTES);

  const parsed = OfflineSyncRequestSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const result = await syncOfflinePlayEvents(
    {
      userId,
      ip: getVerifiedRemoteIp(event),
      userAgent: getRequestHeader(event, "user-agent"),
    },
    parsed.data.events
  );

  return result;
});
