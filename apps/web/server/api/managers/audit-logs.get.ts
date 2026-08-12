import { auditLogs, getOwnerDb } from "@kidthink/db";
import { and, desc, eq, gte, lt, lte, type SQL } from "drizzle-orm";

import { defineEventHandler, getQuery } from "h3";
import {
  requireSuperAdminSession,
  respondToManagerAuthError,
} from "../../utils/admin-auth-runtime.js";

function buildAuditConditions(query: Record<string, unknown>): SQL[] {
  const conditions: SQL[] = [];
  const actorType = query.actor_type as string | undefined;
  const action = query.action as string | undefined;
  const entityType = query.entity_type as string | undefined;
  const entityId = query.entity_id as string | undefined;
  const fromStr = query.from as string | undefined;
  const toStr = query.to as string | undefined;
  const cursor = query.cursor as string | undefined;

  if (actorType && ["user", "manager", "system"].includes(actorType)) {
    conditions.push(
      eq(auditLogs.actorType, actorType as "user" | "manager" | "system")
    );
  }
  if (action) {
    conditions.push(eq(auditLogs.action, action));
  }
  if (entityType) {
    conditions.push(eq(auditLogs.entityType, entityType));
  }
  if (entityId) {
    conditions.push(eq(auditLogs.entityId, entityId));
  }
  if (fromStr) {
    const fromDate = new Date(fromStr);
    if (!Number.isNaN(fromDate.getTime())) {
      conditions.push(gte(auditLogs.createdAt, fromDate));
    }
  }
  if (toStr) {
    const toDate = new Date(toStr);
    if (!Number.isNaN(toDate.getTime())) {
      conditions.push(lte(auditLogs.createdAt, toDate));
    }
  }
  if (cursor) {
    const cursorId = Number(cursor);
    if (Number.isInteger(cursorId) && cursorId > 0) {
      conditions.push(lt(auditLogs.id, cursorId));
    }
  }

  return conditions;
}

export default defineEventHandler(async (event) => {
  try {
    await requireSuperAdminSession(event);

    const query = getQuery(event);
    const rawLimit = Number(query.limit);
    const limit = Math.min(
      Math.max(1, Number.isInteger(rawLimit) ? rawLimit : 50),
      200
    );

    const conditions = buildAuditConditions(query);
    const db = getOwnerDb();
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.id))
      .limit(limit + 1);

    let nextCursor: string | null = null;
    if (rows.length > limit) {
      const nextItem = rows.pop();
      nextCursor = nextItem?.id.toString() ?? null;
    }

    return {
      items: rows,
      next_cursor: nextCursor,
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
