import { createPersonalCurriculumSchema } from "@mindkid/shared";
import { defineEventHandler, getRequestHeader, setResponseStatus } from "h3";
import { createPersonalCurriculum } from "#server/services/index.js";
import { throwValidationError } from "#server/utils/api-error";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { readRequestBody } from "#server/utils/request-body";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);

  const body = await readRequestBody(event);
  const parsed = createPersonalCurriculumSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const entitlements = await resolveUserActiveEntitlements(userId);
  const curriculum = await createPersonalCurriculum(
    {
      userId,
      entitlements,
      ip: getVerifiedRemoteIp(event),
      userAgent: getRequestHeader(event, "user-agent"),
    },
    parsed.data
  );

  setResponseStatus(event, 201);
  return curriculum;
});
