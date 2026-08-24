import { curricula, getOwnerDb } from "@mindkid/db";
import { and, desc, eq, type SQL, sql } from "drizzle-orm";
import { defineEventHandler, getQuery } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);
  const query = getQuery(event);

  const search = query.search ? String(query.search).trim() : "";
  const programType = query.program_type
    ? String(query.program_type)
    : undefined;
  const status = query.status ? String(query.status) : undefined;
  const accessTier = query.access_tier ? String(query.access_tier) : undefined;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));
  const offset = (page - 1) * limit;

  const db = getOwnerDb();
  const conditions: SQL[] = [];

  if (search) {
    conditions.push(
      sql`(${curricula.code} ILIKE ${`%${search}%`} OR ${curricula.title} ILIKE ${`%${search}%`})`
    );
  }
  if (
    programType &&
    (programType === "age_based" || programType === "journey")
  ) {
    conditions.push(eq(curricula.programType, programType));
  }
  if (status) {
    conditions.push(
      eq(curricula.status, status as typeof curricula.$inferSelect.status)
    );
  }
  if (accessTier) {
    conditions.push(
      eq(
        curricula.accessTier,
        accessTier as typeof curricula.$inferSelect.accessTier
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(curricula)
    .where(whereClause);

  const rows = await db
    .select()
    .from(curricula)
    .where(whereClause)
    .orderBy(desc(curricula.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    items: rows,
    total: countRow?.count ?? 0,
    page,
    limit,
  };
});
