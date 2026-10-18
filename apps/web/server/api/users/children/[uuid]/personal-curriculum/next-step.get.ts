import { defineEventHandler, getRouterParam } from "h3";
import { z } from "zod";
import { resolveChildPersonalCurriculumNextStep } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

const UuidParamSchema = z.string().trim().min(1);

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const parsedParam = UuidParamSchema.safeParse(getRouterParam(event, "uuid"));
  const childUuid = parsedParam.success ? parsedParam.data : "";

  const entitlements = await resolveUserActiveEntitlements(userId);
  const result = await resolveChildPersonalCurriculumNextStep(
    { userId, entitlements },
    childUuid
  );

  return result;
});
