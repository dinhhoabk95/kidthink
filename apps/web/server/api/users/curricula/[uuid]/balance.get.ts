import { defineEventHandler, getRouterParam } from "h3";
import { z } from "zod";
import { getPersonalCurriculumByUuid } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";

const UuidParamSchema = z.string().trim().min(1);

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const parsedParam = UuidParamSchema.safeParse(getRouterParam(event, "uuid"));
  const uuid = parsedParam.success ? parsedParam.data : "";

  const curriculum = await getPersonalCurriculumByUuid({ userId }, uuid);
  return {
    balance: curriculum.balance,
    warnings: curriculum.warnings,
    status: curriculum.status,
  };
});
