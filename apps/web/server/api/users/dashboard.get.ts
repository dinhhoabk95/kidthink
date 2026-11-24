import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import {
  getUserDashboard,
  type UserDashboardQuery,
} from "#server/services/dashboard-service";
import { requireWebUserSession } from "#server/utils/auth-runtime";

const DashboardQuerySchema = z.object({
  child_id: z.union([z.string(), z.number()]).optional(),
  child_uuid: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const parsedQuery = DashboardQuerySchema.safeParse(getQuery(event));
  const query: UserDashboardQuery = parsedQuery.success ? parsedQuery.data : {};

  return await getUserDashboard(event, Number(user.user_id), query);
});
