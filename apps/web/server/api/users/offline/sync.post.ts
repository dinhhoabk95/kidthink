import { appError } from "@kidthink/auth";
import { syncOfflinePlayEvents } from "@kidthink/db";
import { OfflineSyncRequestSchema } from "@kidthink/shared";
import { defineEventHandler, readBody } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const userId = Number(user.user_id);

    const eventBody =
      (event.context as { body?: Record<string, unknown> })?.body ||
      (event as { _body?: Record<string, unknown> })._body;
    const body = eventBody || (await readBody(event)) || {};

    const parsed = OfflineSyncRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw appError("VALIDATION_FAILED", {
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    const result = await syncOfflinePlayEvents({ userId }, parsed.data.events);

    return result;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
