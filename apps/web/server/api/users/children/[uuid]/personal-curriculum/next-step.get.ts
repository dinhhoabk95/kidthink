import { resolveChildPersonalCurriculumNextStep } from "@mindkid/db";
import { defineEventHandler, getRouterParam } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const childUuid = getRouterParam(event, "uuid") || "";

  const entitlements = await resolveUserActiveEntitlements(userId);
  const result = await resolveChildPersonalCurriculumNextStep(
    { userId, entitlements },
    childUuid
  );

  return result;
});
