import { ORDER_LIST_PAGE_LIMIT_MAX } from "@mindkid/config";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { listManagerOrdersQueue } from "#server/services/order-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";

const querySchema = z.object({
  status: z.string().optional().default("submitted,under_review"),
  package_code: z.string().optional(),
  amount_min: z.coerce.number().optional(),
  amount_max: z.coerce.number().optional(),
  submitted_from: z.string().optional(),
  submitted_to: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["oldest", "newest"]).optional().default("oldest"),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(ORDER_LIST_PAGE_LIMIT_MAX)
    .default(20),
});

export default defineEventHandler(async (event) => {
  requireSuperAdminSession(event);

  const rawQuery = getQuery(event);
  const parsed = querySchema.safeParse(rawQuery);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  return await listManagerOrdersQueue(parsed.data);
});
