import { auditLogs, getOwnerDb } from "@kidthink/db";
import { and, desc, eq, gte, ilike, lte } from "drizzle-orm";
import { createError, defineEventHandler, getQuery } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../utils/admin-auth-runtime.js";

export interface FormattedAuditItem {
  id: number;
  uuid: string;
  actor_type: string;
  actor_id: number | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  reason: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

import type { SQL } from "drizzle-orm";

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
  if (query.action) {
    conditions.push(eq(auditLogs.action, String(query.action)));
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
    conditions.push(ilike(auditLogs.reason, `%${query.q.trim()}%`));
  }

  return conditions;
}

export default defineEventHandler(async (event) => {
  try {
    const manager = await requireManagerSession(event);

    // BR-ALV-02: super_admin only
    if (manager.role !== "super_admin") {
      throw createError({
        statusCode: 403,
        statusMessage: "INSUFFICIENT_ROLE",
        message:
          "Chỉ super_admin mới có quyền xem nhật ký kiểm toán (BR-ALV-02)",
      });
    }

    const query =
      ((event as Record<string, unknown>)._query as Record<string, unknown>) ||
      getQuery(event);

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

    const formatted: FormattedAuditItem[] = rows.map((r) => ({
      id: r.id,
      uuid: r.uuid,
      actor_type: r.actorType,
      actor_id: r.actorId,
      actor_name: `${r.actorType} #${r.actorId || "0"}`,
      action: r.action,
      entity_type: r.entityType,
      entity_id: r.entityId,
      reason: r.reason,
      before_data: (r.beforeData as Record<string, unknown> | null) || null,
      after_data: (r.afterData as Record<string, unknown> | null) || null,
      ip: r.ipAddress ? `${r.ipAddress.slice(0, 7)}***` : null,
      user_agent: r.userAgent,
      created_at: r.createdAt.toISOString(),
    }));

    return {
      items: formatted,
      total: formatted.length,
      limit,
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
