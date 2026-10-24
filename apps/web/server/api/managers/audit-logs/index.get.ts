import { auditLogs, getOwnerDb } from "@mindkid/db";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { ValidationError } from "@mindkid/errors/common";
import { and, desc, eq, gte, ilike, inArray, lte, type SQL } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { readRequestQuery } from "#server/utils/request-body";

export type AuditPayloadValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | object;

export type AuditPayloadRecord = Record<string, AuditPayloadValue>;

type AuditActorType = typeof auditLogs.$inferSelect.actorType;

export interface FormattedAuditItem {
  id: number;
  uuid: string;
  actor_type: string;
  actor_id: number | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entityType?: string;
  entityId?: string;
  reason: string | null;
  before_data: AuditPayloadRecord | null;
  after_data: AuditPayloadRecord | null;
  ip: string | null;
  user_agent: string | null;
  request_id: string | null;
  created_at: string;
}

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

  const actorType =
    readQueryString(query, "actor_type") || readQueryString(query, "actorType");
  const actorIdRaw =
    readQueryString(query, "actor_id") || readQueryString(query, "actorId");
  const entityType =
    readQueryString(query, "entity_type") ||
    readQueryString(query, "entityType");
  const entityId =
    readQueryString(query, "entity_id") || readQueryString(query, "entityId");
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
  const manager = await requireManagerSession(event);

  // BR-ALV-02: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền xem nhật ký kiểm toán (BR-ALV-02)"
    );
  }

  const query = readRequestQuery(event);

  const rawLimit = Number(readQueryString(query, "limit"));
  const limit = Math.min(Math.max(rawLimit || 50, 1), 200);
  const dates = validateAuditDateRange(
    readQueryString(query, "from"),
    readQueryString(query, "to")
  );

  const conditions = buildAuditConditions(query, dates);
  const db = getOwnerDb();
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: auditLogs.id,
      uuid: auditLogs.uuid,
      actorType: auditLogs.actorType,
      actorId: auditLogs.actorId,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      reason: auditLogs.reason,
      beforeData: auditLogs.beforeData,
      afterData: auditLogs.afterData,
      ipAddress: auditLogs.ipAddress,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(whereClause)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  const formatted: FormattedAuditItem[] = rows.map((r) => {
    const beforeObj: AuditPayloadRecord | null =
      typeof r.beforeData === "object" &&
      r.beforeData !== null &&
      !Array.isArray(r.beforeData)
        ? (r.beforeData as AuditPayloadRecord)
        : null;
    const afterObj: AuditPayloadRecord | null =
      typeof r.afterData === "object" &&
      r.afterData !== null &&
      !Array.isArray(r.afterData)
        ? (r.afterData as AuditPayloadRecord)
        : null;
    const requestId =
      (beforeObj?.request_id ? String(beforeObj.request_id) : null) ||
      (afterObj?.request_id ? String(afterObj.request_id) : null) ||
      r.uuid;

    return {
      id: r.id,
      uuid: r.uuid,
      actor_type: r.actorType,
      actor_id: r.actorId,
      actor_name: `${r.actorType} #${r.actorId || "0"}`,
      action: r.action,
      entity_type: r.entityType,
      entity_id: r.entityId,
      entityType: r.entityType,
      entityId: r.entityId,
      reason: r.reason,
      before_data: beforeObj,
      after_data: afterObj,
      ip: r.ipAddress ? `${r.ipAddress.slice(0, 7)}***` : null,
      user_agent: r.userAgent,
      request_id: requestId,
      created_at: r.createdAt.toISOString(),
    };
  });

  return {
    items: formatted,
    total: formatted.length,
    limit,
  };
});
