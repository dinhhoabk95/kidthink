import { createPersonalCurriculumSchema } from "@mindkid/shared";
import {
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  readBody,
  setResponseStatus,
} from "h3";
import { createPersonalCurriculum } from "#server/services/index.js";
import { throwValidationError } from "#server/utils/api-error";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);

  const eventBody =
    (event.context as { body?: Record<string, unknown> })?.body ||
    (event as { _body?: Record<string, unknown> })._body;
  const body = eventBody || (await readBody(event)) || {};
  const parsed = createPersonalCurriculumSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const entitlements = await resolveUserActiveEntitlements(userId);
  const curriculum = await createPersonalCurriculum(
    {
      userId,
      entitlements,
      ip: getRequestIP(event),
      userAgent: getRequestHeader(event, "user-agent"),
    },
    parsed.data
  );

  setResponseStatus(event, 201);
  return curriculum;
});
