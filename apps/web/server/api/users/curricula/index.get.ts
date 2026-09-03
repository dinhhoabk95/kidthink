import { defineEventHandler } from "h3";
import { listPersonalCurricula } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);

  const list = await listPersonalCurricula({ userId });
  return {
    items: list,
    total: list.length,
  };
});
