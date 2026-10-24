import { errorLogs, getOwnerDb } from "@mindkid/db";
import { InsufficientRoleError } from "@mindkid/errors/auth";
import { and, desc, eq, gte, ilike, lte, or, type SQL, sql } from "drizzle-orm";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const ErrorLogsQuerySchema = z.object({
  status: z.string().optional(),
  source: z.string().optional(),
  level: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().optional(),
});

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

type ErrorLogsQuery = z.infer<typeof ErrorLogsQuerySchema>;
type ErrorStatus = "open" | "ack" | "resolved";
type ErrorSource = "server" | "client";
type ErrorLevel = "warn" | "error" | "fatal";

function isErrorStatus(val: string | undefined): val is ErrorStatus {
  return val === "open" || val === "ack" || val === "resolved";
}

function isErrorSource(val: string | undefined): val is ErrorSource {
  return val === "server" || val === "client";
}

function isErrorLevel(val: string | undefined): val is ErrorLevel {
  return val === "warn" || val === "error" || val === "fatal";
}

function escapeLikeWildcards(text: string): string {
  return text.replace(/([%_\\])/g, "\\$1");
}

function buildErrorLogConditions(query: ErrorLogsQuery): SQL[] {
  const conditions: SQL[] = [];

  if (isErrorStatus(query.status)) {
    conditions.push(eq(errorLogs.status, query.status));
  }
  if (isErrorSource(query.source)) {
    conditions.push(eq(errorLogs.source, query.source));
  }
  if (isErrorLevel(query.level)) {
    conditions.push(eq(errorLogs.level, query.level));
  }
  if (query.from) {
    const fromDate = new Date(query.from);
    if (!Number.isNaN(fromDate.getTime())) {
      conditions.push(gte(errorLogs.createdAt, fromDate));
    }
  }
  if (query.to) {
    const toDate = new Date(query.to);
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
    throw new InsufficientRoleError(
      "Chỉ super_admin mới có quyền xem nhật ký lỗi hệ thống (BR-ELV-06)"
    );
  }

  const parsedQuery = ErrorLogsQuerySchema.safeParse(getQuery(event));
  const query = parsedQuery.success ? parsedQuery.data : {};

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
