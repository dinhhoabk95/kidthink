import { updatePersonalCurriculumMetaSchema } from "@mindkid/shared";
import {
  defineEventHandler,
  getRequestHeader,
  getRouterParam,
  readBody,
} from "h3";
import { updatePersonalCurriculumMeta } from "#server/services/index.js";
import { throwValidationError } from "#server/utils/api-error";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuid = getRouterParam(event, "uuid") || "";

  const eventBody =
    Reflect.get(event.context, "body") || Reflect.get(event, "_body");
  const body = eventBody || (await readBody(event)) || {};
  const parsed = updatePersonalCurriculumMetaSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const entitlements = await resolveUserActiveEntitlements(userId);
  const curriculum = await updatePersonalCurriculumMeta(
    {
      userId,
      entitlements,
      ip: getVerifiedRemoteIp(event),
      userAgent: getRequestHeader(event, "user-agent"),
    },
    uuid,
    parsed.data
  );

  return curriculum;
});
