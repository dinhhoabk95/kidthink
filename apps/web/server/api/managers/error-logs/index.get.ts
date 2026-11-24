import { InsufficientRoleError } from "@mindkid/errors/auth";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { listErrorGroups } from "#server/services/error-log-service";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

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
  const manager = await requireManagerSession(event);

  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền xem nhật ký lỗi hệ thống (BR-ELV-06)"
    );
  }

  const parsedQuery = ErrorLogsQuerySchema.safeParse(getQuery(event));
  const query = parsedQuery.success ? parsedQuery.data : {};

  return await listErrorGroups(query);
});
