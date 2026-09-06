import { auditLogs, getOwnerDb } from "@mindkid/db";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { ValidationError } from "@mindkid/errors/common";
import { and, desc, eq, gte, ilike, inArray, lte, type SQL } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { readRequestQuery } from "#server/utils/request-body";

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
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  request_id: string | null;
  created_at: string;
}

function escapeLikeWildcards(text: string): string {
  return text.replace(/([%_\\])/g, "\\$1");
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

  const actorType = (query.actor_type || query.actorType) as string | undefined;
  const actorId = (query.actor_id || query.actorId) as
    | string
    | number
    | undefined;
  const entityType = (query.entity_type || query.entityType) as
    | string
    | undefined;
  const entityId = (query.entity_id || query.entityId) as string | undefined;

  if (actorType) {
    conditions.push(
      eq(
        auditLogs.actorType,
        actorType as typeof auditLogs.$inferSelect.actorType
      )
    );
  }
  if (actorId) {
    conditions.push(eq(auditLogs.actorId, Number(actorId)));
  }

  const actCond = buildActionCondition(query.action);
  if (actCond) {
    conditions.push(actCond);
  }

  if (entityType) {
    conditions.push(eq(auditLogs.entityType, String(entityType)));
  }
  if (entityId) {
    conditions.push(eq(auditLogs.entityId, String(entityId)));
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
  const manager = await requireManagerSession(event);

  // BR-ALV-02: super_admin only
  if (manager.role !== "super_admin") {
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền xem nhật ký kiểm toán (BR-ALV-02)"
    );
  }

  const query = readRequestQuery(event);

  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
  const dates = validateAuditDateRange(
    query.from ? String(query.from) : undefined,
    query.to ? String(query.to) : undefined
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
    const beforeObj = (r.beforeData as Record<string, unknown> | null) || null;
    const afterObj = (r.afterData as Record<string, unknown> | null) || null;
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
