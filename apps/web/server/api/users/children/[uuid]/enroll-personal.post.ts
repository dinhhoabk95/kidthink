import { enrollPersonalCurriculumSchema } from "@mindkid/shared";
import {
  defineEventHandler,
  getRequestHeader,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import { enrollChildInPersonalCurriculum } from "#server/services/index.js";
import { throwValidationError } from "#server/utils/api-error";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const childUuid = getRouterParam(event, "uuid") || "";

  const eventBody =
    Reflect.get(event.context, "body") || Reflect.get(event, "_body");
  const body = eventBody || (await readBody(event)) || {};
  const parsed = enrollPersonalCurriculumSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const entitlements = await resolveUserActiveEntitlements(userId);
  const result = await enrollChildInPersonalCurriculum(
    {
      userId,
      entitlements,
      ip: getVerifiedRemoteIp(event),
      userAgent: getRequestHeader(event, "user-agent"),
    },
    childUuid,
    parsed.data.personal_curriculum_uuid
  );

  setResponseStatus(event, 201);
  return result;
});
