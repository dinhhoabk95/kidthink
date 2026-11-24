import { ValidationError } from "@mindkid/errors/common";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { listAuditLogs } from "#server/services/audit-log-service";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { readRequestQuery } from "#server/utils/request-body";

export type {
  AuditPayloadRecord,
  AuditPayloadValue,
  FormattedAuditItem,
} from "#server/services/audit-log-service";

const AuditQuerySchema = z.object({
  actor_type: z.enum(["user", "manager", "system"]).optional(),
  actorType: z.enum(["user", "manager", "system"]).optional(),
  actor_id: z.union([z.string().max(100), z.number()]).optional(),
  actorId: z.union([z.string().max(100), z.number()]).optional(),
  from: z.string().max(40).optional(),
  to: z.string().max(40).optional(),
  // Trần 200 do service ép (BR-ALV-03): vượt trần thì cắt, không từ chối.
  limit: z.coerce.number().int().min(1).optional(),
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
  // BR-ALV-02: super_admin only
  requireSuperAdminSession(event);

  const query = readRequestQuery(event);
  const validatedQuery = AuditQuerySchema.safeParse(query);
  if (!validatedQuery.success) {
    throw new ValidationError("Tham số tra cứu không hợp lệ");
  }

  return await listAuditLogs(validatedQuery.data);
});
