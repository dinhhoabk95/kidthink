import { resolveChildPersonalCurriculumNextStep } from "@mindkid/db";
import { defineEventHandler, getRouterParam } from "h3";
import { requireWebUserSession } from "../../../../../utils/auth-runtime.js";
import { resolveUserActiveEntitlements } from "../../../../../utils/entitlements-runtime.js";

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
