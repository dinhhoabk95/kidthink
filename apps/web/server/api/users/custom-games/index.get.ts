import { defineEventHandler, getQuery } from "h3";
import { listCustomGames } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const query = getQuery(event);

  const status =
    query.status === "draft" || query.status === "ready"
      ? query.status
      : undefined;
  const templateId =
    typeof query.template_id === "string" ? query.template_id : undefined;

  const result = await listCustomGames(userId, {
    status,
    template_id: templateId,
  });
  return result;
});
