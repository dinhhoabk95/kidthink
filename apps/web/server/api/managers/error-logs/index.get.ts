import { errorLogs, getOwnerDb } from "@kidthink/db";
import { and, desc, eq, type SQL, sql } from "drizzle-orm";
import { createError, defineEventHandler, getQuery } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../utils/admin-auth-runtime.js";

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

export default defineEventHandler(async (event) => {
  try {
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

    const query =
      ((event as Record<string, unknown>)._query as Record<string, unknown>) ||
      getQuery(event);

    const statusFilter = query.status ? String(query.status) : undefined;
    const sourceFilter = query.source ? String(query.source) : undefined;
    const limit = Math.min(Number(query.limit) || 50, 100);

    const db = getOwnerDb();

    // Query grouped error logs by fingerprint (BR-ELV-01, BR-ELV-02)
    const conditions: SQL<unknown>[] = [];
    if (statusFilter) {
      conditions.push(
        eq(
          errorLogs.status,
          statusFilter as typeof errorLogs.$inferSelect.status
        )
      );
    }
    if (sourceFilter) {
      conditions.push(
        eq(
          errorLogs.source,
          sourceFilter as typeof errorLogs.$inferSelect.source
        )
      );
    }

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
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
