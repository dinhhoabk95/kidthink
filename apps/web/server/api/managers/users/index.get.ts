import {
  activeSessions,
  childProfiles,
  entitlements,
  getOwnerDb,
  users,
} from "@kidthink/db";
import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import {
  requireSuperAdminSession,
  respondToManagerAuthError,
} from "../../../utils/admin-auth-runtime.js";

/**
 * Escapes PostgreSQL LIKE wildcard characters (% and _)
 */
function escapeLikeWildcards(text: string): string {
  return text.replace(/([%_\\])/g, "\\$1");
}

export const listUsersQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["active", "suspended", "deleted"]).optional(),
  package_code: z.string().trim().optional(),
  created_from: z.string().datetime().optional(),
  created_to: z.string().datetime().optional(),
  has_children: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  sort: z.enum(["created_desc", "created_asc"]).default("created_desc"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

type ParsedQuery = z.infer<typeof listUsersQuerySchema>;
type OwnerDb = ReturnType<typeof getOwnerDb>;

function buildSearchFilter(q?: string): SQL | undefined {
  if (!q || q.length === 0) {
    return undefined;
  }
  const escaped = escapeLikeWildcards(q);
  const prefixPattern = `${escaped}%`;
  const orCondition = or(
    ilike(users.email, prefixPattern),
    ilike(users.displayName, prefixPattern)
  );
  return orCondition ?? undefined;
}

function buildDateAndCursorFilter(query: ParsedQuery): SQL[] {
  const { created_from, created_to, cursor } = query;
  const conditions: SQL[] = [];

  if (created_from) {
    const fromDate = new Date(created_from);
    if (!Number.isNaN(fromDate.getTime())) {
      conditions.push(gte(users.createdAt, fromDate));
    }
  }

  if (created_to) {
    const toDate = new Date(created_to);
    if (!Number.isNaN(toDate.getTime())) {
      conditions.push(lte(users.createdAt, toDate));
    }
  }

  if (cursor) {
    const cursorId = Number(cursor);
    if (Number.isInteger(cursorId) && cursorId > 0) {
      conditions.push(lt(users.id, cursorId));
    }
  }

  return conditions;
}

function buildUserConditions(db: OwnerDb, query: ParsedQuery): SQL[] {
  const conditions: SQL[] = [];

  const searchCondition = buildSearchFilter(query.q);
  if (searchCondition) {
    conditions.push(searchCondition);
  }

  if (query.status) {
    conditions.push(eq(users.status, query.status));
  }

  const dateAndCursor = buildDateAndCursorFilter(query);
  conditions.push(...dateAndCursor);

  if (query.package_code) {
    const usersWithPkg = db
      .select({ userId: entitlements.userId })
      .from(entitlements)
      .where(
        and(
          eq(entitlements.status, "active"),
          or(
            eq(entitlements.entitlementKey, query.package_code),
            gte(entitlements.expiresAt, new Date())
          )
        )
      );
    conditions.push(inArray(users.id, usersWithPkg));
  }

  return conditions;
}

async function fetchChildCountMap(
  db: OwnerDb,
  userIds: number[]
): Promise<Map<number, number>> {
  const childCountRows = await db
    .select({
      userId: childProfiles.userId,
      count: count(childProfiles.id),
    })
    .from(childProfiles)
    .where(inArray(childProfiles.userId, userIds))
    .groupBy(childProfiles.userId);

  const childCountMap = new Map<number, number>();
  for (const row of childCountRows) {
    childCountMap.set(row.userId, Number(row.count));
  }
  return childCountMap;
}

async function fetchActivePackageMap(
  db: OwnerDb,
  userIds: number[]
): Promise<Map<number, string>> {
  const now = new Date();
  const entitlementRows = await db
    .select({
      userId: entitlements.userId,
      entitlementKey: entitlements.entitlementKey,
    })
    .from(entitlements)
    .where(
      and(
        inArray(entitlements.userId, userIds),
        eq(entitlements.status, "active"),
        or(
          gte(entitlements.expiresAt, now),
          sql`${entitlements.expiresAt} IS NULL`
        )
      )
    );

  const activePackageMap = new Map<number, string>();
  for (const row of entitlementRows) {
    if (!activePackageMap.has(row.userId)) {
      activePackageMap.set(row.userId, row.entitlementKey);
    }
  }
  return activePackageMap;
}

async function fetchLastActiveMap(
  db: OwnerDb,
  userIds: number[]
): Promise<Map<number, Date>> {
  const sessionRows = await db
    .select({
      accountId: activeSessions.accountId,
      lastUsedAt: sql<Date>`max(${activeSessions.lastUsedAt})`.as(
        "last_used_at"
      ),
    })
    .from(activeSessions)
    .where(
      and(
        eq(activeSessions.accountType, "user"),
        inArray(activeSessions.accountId, userIds)
      )
    )
    .groupBy(activeSessions.accountId);

  const lastActiveMap = new Map<number, Date>();
  for (const row of sessionRows) {
    if (row.lastUsedAt) {
      lastActiveMap.set(row.accountId, new Date(row.lastUsedAt));
    }
  }
  return lastActiveMap;
}

export default defineEventHandler(async (event) => {
  try {
    await requireSuperAdminSession(event);

    const rawQuery = getQuery(event);
    const parsedQuery = listUsersQuerySchema.safeParse(rawQuery);
    if (!parsedQuery.success) {
      throw parsedQuery.error;
    }

    const { limit, has_children } = parsedQuery.data;
    const db = getOwnerDb();
    const conditions = buildUserConditions(db, parsedQuery.data);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const userRows = await db
      .select({
        id: users.id,
        uuid: users.uuid,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(desc(users.id))
      .limit(limit + 1);

    let nextCursor: string | null = null;
    if (userRows.length > limit) {
      const nextItem = userRows.pop();
      nextCursor = nextItem?.id.toString() ?? null;
    }

    if (userRows.length === 0) {
      return { items: [], next_cursor: null };
    }

    const userIds = userRows.map((u) => u.id);
    const [childCountMap, activePackageMap, lastActiveMap] = await Promise.all([
      fetchChildCountMap(db, userIds),
      fetchActivePackageMap(db, userIds),
      fetchLastActiveMap(db, userIds),
    ]);

    let items = userRows.map((u) => {
      const childCount = childCountMap.get(u.id) ?? 0;
      const activePackage = activePackageMap.get(u.id) ?? null;
      const lastActive = lastActiveMap.get(u.id) ?? u.updatedAt;

      return {
        id: u.id,
        uuid: u.uuid,
        email: u.email,
        display_name: u.displayName,
        status: u.status,
        child_count: childCount,
        active_package: activePackage,
        created_at: u.createdAt.toISOString(),
        last_active_at: lastActive ? lastActive.toISOString() : null,
      };
    });

    if (has_children !== undefined) {
      items = items.filter((item) =>
        has_children ? item.child_count > 0 : item.child_count === 0
      );
    }

    return {
      items,
      next_cursor: nextCursor,
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
