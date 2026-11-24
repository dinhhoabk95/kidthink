import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { listUsersForManager } from "#server/services/identity-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export const listUsersQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z
    .enum(["pending_verification", "active", "suspended", "deleted"])
    .optional(),
  package_code: z.string().trim().optional(),
  created_from: z.string().datetime().optional(),
  created_to: z.string().datetime().optional(),
  has_children: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  sort: z
    .enum(["newest", "last_active", "created_desc", "created_asc"])
    .default("created_desc"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  await requireSuperAdminSession(event);

  const rawQuery = getQuery(event);
  const parsedQuery = listUsersQuerySchema.safeParse(rawQuery);
  if (!parsedQuery.success) {
    throw parsedQuery.error;
  }

  return await listUsersForManager(parsedQuery.data);
});
