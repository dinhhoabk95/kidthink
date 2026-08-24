import { updatePersonalCurriculumMeta } from "@mindkid/db";
import { updatePersonalCurriculumMetaSchema } from "@mindkid/shared";
import {
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  getRouterParam,
  readBody,
} from "h3";
import { throwValidationError } from "#server/utils/api-error";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuid = getRouterParam(event, "uuid") || "";

  const eventBody =
    (event.context as { body?: Record<string, unknown> })?.body ||
    (event as { _body?: Record<string, unknown> })._body;
  const body = eventBody || (await readBody(event)) || {};
  const parsed = updatePersonalCurriculumMetaSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const curriculum = await updatePersonalCurriculumMeta(
    {
      userId,
      ip: getRequestIP(event),
      userAgent: getRequestHeader(event, "user-agent"),
    },
    uuid,
    parsed.data
  );

  return curriculum;
});
