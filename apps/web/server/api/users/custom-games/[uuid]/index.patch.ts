import { appError } from "@kidthink/auth";
import { updateCustomGame } from "@kidthink/db";
import { updateCustomGameSchema } from "@kidthink/shared";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const userId = Number(user.user_id);
    const uuid = getRouterParam(event, "uuid") || "";

    const eventBody =
      (event.context as { body?: Record<string, unknown> })?.body ||
      (event as { _body?: Record<string, unknown> })._body;
    const body = eventBody || (await readBody(event)) || {};
    const parsed = updateCustomGameSchema.safeParse(body);
    if (!parsed.success) {
      throw appError("VALIDATION_FAILED", {
        fields: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    const updated = await updateCustomGame(userId, uuid, parsed.data);
    return updated;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
