import { LessonPlanNotFoundError } from "@mindkid/errors/content";
import { UpdateLessonPlanMetaSchema } from "@mindkid/shared";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { updateLessonPlanMeta } from "#server/services/index.js";
import { throwValidationError } from "#server/utils/api-error";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new LessonPlanNotFoundError();
  }

  const eventBody =
    (event.context as { body?: Record<string, unknown> })?.body ||
    (event as { _body?: Record<string, unknown> })._body;
  const body = eventBody || (await readBody(event)) || {};
  const parsed = UpdateLessonPlanMetaSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const userId = Number(user.user_id);
  const updated = await updateLessonPlanMeta(userId, uuid, parsed.data);
  return updated;
});
