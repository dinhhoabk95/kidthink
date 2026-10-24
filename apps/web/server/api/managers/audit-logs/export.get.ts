import { writeAudit } from "@mindkid/audit";
import { auditLogs, getOwnerDb } from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import { and, desc, eq, gte, ilike, inArray, lte, type SQL } from "drizzle-orm";
import { defineEventHandler, getQuery, setResponseHeader } from "h3";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { getVerifiedRemoteIp } from "#server/utils/auth-runtime";

type AuditActorType = typeof auditLogs.$inferSelect.actorType;
type AuditColumnValue =
  (typeof auditLogs.$inferSelect)[keyof typeof auditLogs.$inferSelect];

function escapeLikeWildcards(text: string): string {
  return text.replace(/([%_\\])/g, "\\$1");
}

function isAuditActorType(val: string): val is AuditActorType {
  return val === "user" || val === "manager" || val === "system";
}

function readQueryString(query: object, key: string): string | undefined {
  const val = Reflect.get(query, key);
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof val === "number" && Number.isFinite(val)) {
    return String(val);
  }
  return undefined;
}

const FORMULA_PREFIX_REGEX = /^[=+\-@\t\r]/;

function escapeCsvField(val: AuditColumnValue): string {
  if (val === null || val === undefined) {
    return "";
  }
  const rawStr = typeof val === "object" ? JSON.stringify(val) : String(val);
  const str = FORMULA_PREFIX_REGEX.test(rawStr) ? `'${rawStr}` : rawStr;
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r") ||
    str.startsWith("'")
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
      throw new ValidationError(
        "Khoảng thời gian tra cứu tối đa là 90 ngày (BR-ALV-03)"
      );
    }
  }
  return { fromDate, toDate };
}

function buildActionCondition(query: object): SQL | null {
  const action = Reflect.get(query, "action");
  if (!action) {
    return null;
  }
  if (Array.isArray(action)) {
    const actions = action.map((item) => String(item).trim()).filter(Boolean);
    return actions.length > 0 ? inArray(auditLogs.action, actions) : null;
  }
  if (typeof action === "string" && action.includes(",")) {
    const actions = action
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    return actions.length > 0 ? inArray(auditLogs.action, actions) : null;
  }
  if (typeof action === "string") {
    const trimmed = action.trim();
    return trimmed ? eq(auditLogs.action, trimmed) : null;
  }
  return null;
}

function buildAuditConditions(
  query: object,
  dates: { fromDate?: Date; toDate?: Date }
): SQL[] {
  const conditions: SQL[] = [];

  const actorType = readQueryString(query, "actor_type");
  const actorIdRaw = readQueryString(query, "actor_id");
  const entityType = readQueryString(query, "entity_type");
  const entityId = readQueryString(query, "entity_id");
  const searchQ = readQueryString(query, "q");

  if (actorType && isAuditActorType(actorType)) {
    conditions.push(eq(auditLogs.actorType, actorType));
  }
  if (actorIdRaw) {
    const parsedActorId = Number(actorIdRaw);
    if (Number.isInteger(parsedActorId)) {
      conditions.push(eq(auditLogs.actorId, parsedActorId));
    }
  }

  const actCond = buildActionCondition(query);
  if (actCond) {
    conditions.push(actCond);
  }

  if (entityType) {
    conditions.push(eq(auditLogs.entityType, entityType));
  }
  if (entityId) {
    conditions.push(eq(auditLogs.entityId, entityId));
  }
  if (dates.fromDate) {
    conditions.push(gte(auditLogs.createdAt, dates.fromDate));
  }
  if (dates.toDate) {
    conditions.push(lte(auditLogs.createdAt, dates.toDate));
  }
  if (searchQ) {
    conditions.push(
      ilike(auditLogs.reason, `%${escapeLikeWildcards(searchQ)}%`)
    );
  }

  return conditions;
}

export default defineEventHandler(async (event) => {
  const session = await requireSuperAdminSession(event);
  const query = getQuery(event);

  const rawLimit = Number(readQueryString(query, "limit"));
  const limit = Math.min(Math.max(rawLimit || 5000, 1), 10_000);
  const dates = validateAuditDateRange(
    readQueryString(query, "from"),
    readQueryString(query, "to")
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

  const filterAction = readQueryString(query, "action") ?? null;
  const filterEntityType = readQueryString(query, "entity_type") ?? null;
  const customReason = readQueryString(query, "reason");

  // BR-ALV-06: Log data_exported in audit_logs
  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: session.manager_id,
      action: "data_exported",
      reason: customReason || "Xuất dữ liệu kiểm toán CSV (BR-ALV-06)",
      entity_type: "audit_logs",
      entity_id: `export_${Date.now()}`,
      after_data: {
        exported_row_count: rows.length,
        filter_action: filterAction,
        filter_entity_type: filterEntityType,
      },
      ip_address: getVerifiedRemoteIp(event),
    });
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
