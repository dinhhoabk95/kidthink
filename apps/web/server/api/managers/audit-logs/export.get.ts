import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler, getQuery, setResponseHeader } from "h3";
import { z } from "zod";
import {
  exportAuditLogsCsv,
  MAX_AUDIT_EXPORT_ROWS,
} from "#server/services/audit-log-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

export const MAX_EXPORT_ROWS = MAX_AUDIT_EXPORT_ROWS;

const ExportAuditLogsQuerySchema = z.object({
  actor_type: z.enum(["user", "manager", "system"]).optional(),
  actorType: z.enum(["user", "manager", "system"]).optional(),
  actor_id: z.union([z.string(), z.number()]).optional(),
  actorId: z.union([z.string(), z.number()]).optional(),
  action: z.union([z.string(), z.array(z.string())]).optional(),
  entity_type: z.string().optional(),
  entityType: z.string().optional(),
  entity_id: z.string().optional(),
  entityId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).optional(),
  reason: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const session = requireSuperAdminSession(event);
  requireReauth(event);
  const parsed = ExportAuditLogsQuerySchema.safeParse(getQuery(event));
  if (!parsed.success) {
    throw new ValidationError("Tham số xuất nhật ký kiểm toán không hợp lệ.");
  }

  const result = await exportAuditLogsCsv(parsed.data, {
    managerId: session.manager_id,
    ipAddress: getVerifiedRemoteIp(event),
    reason: parsed.data.reason,
  });

  setResponseHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setResponseHeader(
    event,
    "Content-Disposition",
    `attachment; filename="${result.filename}"`
  );

  return result.csvContent;
});
