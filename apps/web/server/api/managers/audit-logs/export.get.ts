import { auditLogs, getOwnerDb, writeAudit } from "@mindkid/db";
import { and, desc, eq, gte, ilike, inArray, lte, type SQL } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getQuery,
  setResponseHeader,
} from "h3";
import {
  getManagerRemoteIp,
  requireSuperAdminSession,
} from "../../../utils/admin-auth-runtime.js";

function escapeLikeWildcards(text: string): string {
  return text.replace(/([%_\\])/g, "\\$1");
}

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }
  const str = typeof val === "object" ? JSON.stringify(val) : String(val);
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function validateAuditDateRange(
  fromStr?: string,
  toStr?: string
): { fromDate?: Date; toDate?: Date } {
  const fromDate = fromStr ? new Date(fromStr) : undefined;
  const toDate = toStr ? new Date(toStr) : undefined;

  if (fromDate && toDate) {
    const diffDays =
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 90) {
      throw createError({
        statusCode: 422,
        statusMessage: "TIME_RANGE_TOO_LARGE",
        message: "Khoảng thời gian tra cứu tối đa là 90 ngày (BR-ALV-03)",
      });
    }
  }
  return { fromDate, toDate };
}

function buildActionCondition(action: unknown): SQL<unknown> | null {
  if (!action) {
    return null;
  }
  if (Array.isArray(action)) {
    return inArray(auditLogs.action, action.map(String));
  }
  if (typeof action === "string" && action.includes(",")) {
    const actions = action
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    return actions.length > 0 ? inArray(auditLogs.action, actions) : null;
  }
  return eq(auditLogs.action, String(action));
}

function buildAuditConditions(
  query: Record<string, unknown>,
  dates: { fromDate?: Date; toDate?: Date }
): SQL<unknown>[] {
  const conditions: SQL<unknown>[] = [];

  if (query.actor_type) {
    conditions.push(
      eq(
        auditLogs.actorType,
        query.actor_type as typeof auditLogs.$inferSelect.actorType
      )
    );
  }
  if (query.actor_id) {
    conditions.push(eq(auditLogs.actorId, Number(query.actor_id)));
  }

  const actCond = buildActionCondition(query.action);
  if (actCond) {
    conditions.push(actCond);
  }

  if (query.entity_type) {
    conditions.push(eq(auditLogs.entityType, String(query.entity_type)));
  }
  if (query.entity_id) {
    conditions.push(eq(auditLogs.entityId, String(query.entity_id)));
  }
  if (dates.fromDate) {
    conditions.push(gte(auditLogs.createdAt, dates.fromDate));
  }
  if (dates.toDate) {
    conditions.push(lte(auditLogs.createdAt, dates.toDate));
  }
  if (typeof query.q === "string" && query.q.trim()) {
    conditions.push(
      ilike(auditLogs.reason, `%${escapeLikeWildcards(query.q.trim())}%`)
    );
  }

  return conditions;
}

export default defineEventHandler(async (event) => {
  const session = await requireSuperAdminSession(event);
  const query =
    ((event as Record<string, unknown>)._query as Record<string, unknown>) ||
    getQuery(event);

  const limit = Math.min(Math.max(Number(query.limit) || 5000, 1), 10_000);
  const dates = validateAuditDateRange(
    query.from ? String(query.from) : undefined,
    query.to ? String(query.to) : undefined
  );

  const conditions = buildAuditConditions(query, dates);
  const db = getOwnerDb();
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  // BR-ALV-06: Log data_exported in audit_logs
  await writeAudit(db, {
    actor_type: "manager",
    actor_id: session.manager_id,
    action: "data_exported",
    reason:
      typeof query.reason === "string" && query.reason.trim()
        ? query.reason.trim()
        : "Xuất dữ liệu kiểm toán CSV (BR-ALV-06)",
    entity_type: "audit_logs",
    entity_id: `export_${Date.now()}`,
    after_data: {
      exported_row_count: rows.length,
      filter_action: query.action || null,
      filter_entity_type: query.entity_type || null,
    },
    ip_address: getManagerRemoteIp(event),
  });

  // Generate UTF-8 BOM CSV
  const headers = [
    "ID",
    "UUID",
    "Thời gian",
    "Loại tác nhân",
    "Mã tác nhân",
    "Hành động",
    "Loại Entity",
    "Mã Entity",
    "Lý do",
    "Dữ liệu trước",
    "Dữ liệu sau",
    "IP Address",
    "User Agent",
  ];

  const lines: string[] = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        escapeCsvField(r.uuid),
        escapeCsvField(r.createdAt.toISOString()),
        escapeCsvField(r.actorType),
        escapeCsvField(r.actorId),
        escapeCsvField(r.action),
        escapeCsvField(r.entityType),
        escapeCsvField(r.entityId),
        escapeCsvField(r.reason),
        escapeCsvField(r.beforeData),
        escapeCsvField(r.afterData),
        escapeCsvField(r.ipAddress),
        escapeCsvField(r.userAgent),
      ].join(",")
    );
  }

  const bom = "\uFEFF";
  const csvContent = bom + lines.join("\r\n");

  setResponseHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setResponseHeader(
    event,
    "Content-Disposition",
    `attachment; filename="audit_logs_${new Date().toISOString().slice(0, 10)}.csv"`
  );

  return csvContent;
});
