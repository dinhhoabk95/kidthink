import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getQuery, getRouterParam } from "h3";
import { z } from "zod";
import { listPackageSubscribers } from "#server/services/packages-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

const SubscribersQuerySchema = z.object({
  limit: z.coerce.number().optional(),
  cursor: z.coerce.number().optional(),
});

export default defineEventHandler(async (event) => {
  requireSuperAdminSession(event);

  const code = getRouterParam(event, "code");
  if (!code) {
    throw new ValidationError("Mã gói là bắt buộc.");
  }

  const parsedQuery = SubscribersQuerySchema.safeParse(getQuery(event) || {});
  const query = parsedQuery.success ? parsedQuery.data : {};
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
  const cursor = query.cursor ? Number(query.cursor) : undefined;

  return await listPackageSubscribers(code, { limit, cursor });
});
