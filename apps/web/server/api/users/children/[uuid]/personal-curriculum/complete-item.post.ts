import { defineEventHandler, getRequestHeader, getRouterParam } from "h3";
import { z } from "zod";
import { completeChildPersonalCurriculumItem } from "#server/services/index.js";
import { throwValidationError } from "#server/utils/api-error";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { readRequestBody } from "#server/utils/request-body";

const completeItemSchema = z.object({
  personal_curriculum_item_id: z.number().int().positive(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const childUuid = getRouterParam(event, "uuid") || "";

  const body = await readRequestBody(event);
  const parsed = completeItemSchema.safeParse(body);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const entitlements = await resolveUserActiveEntitlements(userId);
  const result = await completeChildPersonalCurriculumItem(
    {
      userId,
      entitlements,
      ip: getVerifiedRemoteIp(event),
      userAgent: getRequestHeader(event, "user-agent"),
    },
    childUuid,
    parsed.data.personal_curriculum_item_id
  );

  return result;
});
