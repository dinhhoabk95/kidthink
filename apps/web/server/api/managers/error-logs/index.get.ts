import { errorLogs, getOwnerDb } from "@mindkid/db";
import { and, desc, eq, gte, ilike, lte, or, type SQL, sql } from "drizzle-orm";
import { createError, defineEventHandler, getQuery } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export interface ErrorGroupItem {
  fingerprint: string;
  code: string;
  level: string;
  source: string;
  status: string;
  latest_message: string;
  total_occurrences: number;
  affected_users_count: number;
  first_seen_at: string;
  last_seen_at: string;
  resolved_notes: string | null;
}

function escapeLikeWildcards(text: string): string {
  return text.replace(/([%_\\])/g, "\\$1");
}

function buildErrorLogConditions(
  query: Record<string, unknown>
): SQL<unknown>[] {
  const conditions: SQL<unknown>[] = [];

  if (query.status) {
    conditions.push(
      eq(
        errorLogs.status,
        String(query.status) as typeof errorLogs.$inferSelect.status
      )
    );
  }
  if (query.source) {
    conditions.push(
      eq(
        errorLogs.source,
        String(query.source) as typeof errorLogs.$inferSelect.source
      )
    );
  }
  if (query.level) {
    conditions.push(
      eq(
        errorLogs.level,
        String(query.level) as typeof errorLogs.$inferSelect.level
      )
    );
  }
  if (query.from) {
    const fromDate = new Date(String(query.from));
    if (!Number.isNaN(fromDate.getTime())) {
      conditions.push(gte(errorLogs.createdAt, fromDate));
    }
  }
  if (query.to) {
    const toDate = new Date(String(query.to));
    if (!Number.isNaN(toDate.getTime())) {
      conditions.push(lte(errorLogs.createdAt, toDate));
    }
  }
  if (typeof query.q === "string" && query.q.trim()) {
    const escaped = escapeLikeWildcards(query.q.trim());
    const searchCond = or(
      ilike(errorLogs.code, `%${escaped}%`),
      ilike(errorLogs.message, `%${escaped}%`),
      ilike(errorLogs.fingerprint, `%${escaped}%`),
      ilike(errorLogs.requestId, `%${escaped}%`)
    );
    if (searchCond) {
      conditions.push(searchCond);
    }
  }

  return conditions;
}

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);

  // BR-ELV-06: super_admin only
  if (manager.role !== "super_admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "INSUFFICIENT_ROLE",
      message:
        "Chỉ super_admin mới có quyền xem nhật ký lỗi hệ thống (BR-ELV-06)",
    });
  }

  const query = getQuery(event);

  const limit = Math.min(Number(query.limit) || 50, 100);
  const conditions = buildErrorLogConditions(query);
  const db = getOwnerDb();
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const groupedRows = await db
    .select({
      fingerprint: errorLogs.fingerprint,
      code: sql<string>`MAX(${errorLogs.code})`,
      level: sql<string>`MAX(${errorLogs.level})`,
      source: sql<string>`MAX(${errorLogs.source})`,
      status: sql<string>`MAX(${errorLogs.status})`,
      latestMessage: sql<string>`MAX(${errorLogs.message})`,
      totalOccurrences: sql<number>`COUNT(*)::int`,
      affectedUsersCount: sql<number>`COUNT(DISTINCT ${errorLogs.userId})::int`,
      firstSeenAt: sql<Date>`MIN(${errorLogs.createdAt})`,
      lastSeenAt: sql<Date>`MAX(${errorLogs.createdAt})`,
      resolvedNotes: sql<string | null>`MAX(${errorLogs.resolvedNotes})`,
    })
    .from(errorLogs)
    .where(whereClause)
    .groupBy(errorLogs.fingerprint)
    .orderBy(desc(sql`MAX(${errorLogs.createdAt})`))
    .limit(limit);

  const groups: ErrorGroupItem[] = groupedRows.map((g) => ({
    fingerprint: g.fingerprint,
    code: g.code,
    level: g.level,
    source: g.source,
    status: g.status,
    latest_message: g.latestMessage,
    total_occurrences: g.totalOccurrences,
    affected_users_count: g.affectedUsersCount,
    first_seen_at: g.firstSeenAt
      ? new Date(g.firstSeenAt).toISOString()
      : new Date().toISOString(),
    last_seen_at: g.lastSeenAt
      ? new Date(g.lastSeenAt).toISOString()
      : new Date().toISOString(),
    resolved_notes: g.resolvedNotes,
  }));

  return {
    groups,
    total: groups.length,
  };
});
