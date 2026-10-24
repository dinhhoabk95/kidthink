import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { listCustomGames } from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";

const ListCustomGamesQuerySchema = z.object({
  status: z.enum(["draft", "ready"]).optional().catch(undefined),
  template_id: z.string().trim().min(1).optional().catch(undefined),
});

export default defineEventHandler(async (event) => {
  const user = requireWebUserSession(event);
  const userId = Number(user.user_id);
  const parsedQuery = ListCustomGamesQuerySchema.safeParse(getQuery(event));
  const filters = parsedQuery.success ? parsedQuery.data : {};

  const result = await listCustomGames(userId, {
    status: filters.status,
    template_id: filters.template_id,
  });
  return result;
});
