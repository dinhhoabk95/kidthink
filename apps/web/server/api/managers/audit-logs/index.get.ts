import { InsufficientRoleError } from "@mindkid/errors/auth";
import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { listAuditLogs } from "#server/services/audit-log-service";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { readRequestQuery } from "#server/utils/request-body";

export type {
  AuditPayloadRecord,
  AuditPayloadValue,
  FormattedAuditItem,
} from "#server/services/audit-log-service";

const AuditQuerySchema = z.object({
  q: z.string().max(100).optional(),
  entity_type: z.string().max(100).optional(),
  entityType: z.string().max(100).optional(),
  entity_id: z.string().max(100).optional(),
  entityId: z.string().max(100).optional(),
  action: z
    .union([z.string().max(500), z.array(z.string().max(64)).max(20)])
    .optional(),
});

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền xem nhật ký kiểm toán (BR-ALV-02)"
    );
  }

  const query = readRequestQuery(event);
  const validatedQuery = AuditQuerySchema.safeParse(query);
  if (!validatedQuery.success) {
    throw new ValidationError("Tham số tra cứu không hợp lệ");
  }

  return await listAuditLogs(query);
});
