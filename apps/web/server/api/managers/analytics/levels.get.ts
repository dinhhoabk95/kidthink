import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { getManagerLevelAnalytics } from "#server/services/dashboard-service";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const AnalyticsLevelsQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().optional(),
});

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);
  const parsedQuery = AnalyticsLevelsQuerySchema.safeParse(getQuery(event));
  const query = parsedQuery.success ? parsedQuery.data : {};

  return await getManagerLevelAnalytics({
    from: typeof query.from === "string" ? query.from : undefined,
    to: typeof query.to === "string" ? query.to : undefined,
    limit: query.limit,
  });
});
