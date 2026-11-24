import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { listErrorGroups } from "#server/services/error-log-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export type { ErrorGroupItem } from "#server/services/error-log-service";

const ErrorLogsQuerySchema = z.object({
  status: z.string().optional(),
  source: z.string().optional(),
  level: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().optional(),
});

export default defineEventHandler(async (event) => {
  // BR-ELV-06: super_admin only
  requireSuperAdminSession(event);

  const parsedQuery = ErrorLogsQuerySchema.safeParse(getQuery(event));
  const query = parsedQuery.success ? parsedQuery.data : {};

  return await listErrorGroups(query);
});
