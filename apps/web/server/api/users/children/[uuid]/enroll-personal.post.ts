import { enrollChildInPersonalCurriculum } from "@mindkid/db";
import { enrollPersonalCurriculumSchema } from "@mindkid/shared";
import {
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import { throwValidationError } from "../../../../utils/api-error.js";
import { requireWebUserSession } from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const childUuid = getRouterParam(event, "uuid") || "";

  const eventBody =
    (event.context as { body?: Record<string, unknown> })?.body ||
    (event as { _body?: Record<string, unknown> })._body;
  const body = eventBody || (await readBody(event)) || {};
  const parsed = enrollPersonalCurriculumSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const result = await enrollChildInPersonalCurriculum(
    {
      userId,
      ip: getRequestIP(event),
      userAgent: getRequestHeader(event, "user-agent"),
    },
    childUuid,
    parsed.data.personal_curriculum_uuid
  );

  setResponseStatus(event, 201);
  return result;
});
