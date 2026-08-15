import { resolveChildPersonalCurriculumNextStep } from "@kidthink/db";
import { defineEventHandler, getRouterParam } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../../utils/auth-runtime.js";
import { resolveUserActiveEntitlements } from "../../../../../utils/entitlements-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const userId = Number(user.user_id);
    const childUuid = getRouterParam(event, "uuid") || "";

    const entitlements = await resolveUserActiveEntitlements(userId);
    const result = await resolveChildPersonalCurriculumNextStep(
      { userId, entitlements },
      childUuid
    );

    return result;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
