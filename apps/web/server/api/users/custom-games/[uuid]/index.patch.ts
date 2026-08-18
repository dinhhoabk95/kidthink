import { updateCustomGame } from "@mindkid/db";
import { updateCustomGameSchema } from "@mindkid/shared";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { throwValidationError } from "../../../../utils/api-error.js";
import { requireWebUserSession } from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuid = getRouterParam(event, "uuid") || "";

  const eventBody =
    (event.context as { body?: Record<string, unknown> })?.body ||
    (event as { _body?: Record<string, unknown> })._body;
  const body = eventBody || (await readBody(event)) || {};
  const parsed = updateCustomGameSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const updated = await updateCustomGame(userId, uuid, parsed.data);
  return updated;
});
