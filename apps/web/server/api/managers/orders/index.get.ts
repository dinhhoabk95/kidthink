import { ORDER_LIST_PAGE_LIMIT_MAX } from "@mindkid/config";
import { childProfiles, getDb, paymentOrders, users } from "@mindkid/db";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";

const querySchema = z.object({
  status: z.string().optional().default("submitted,under_review"),
  package_code: z.string().optional(),
  amount_min: z.coerce.number().optional(),
  amount_max: z.coerce.number().optional(),
  submitted_from: z.string().optional(),
  submitted_to: z.string().optional(),
  q: z.string().optional(),
  sort: z.enum(["oldest", "newest"]).optional().default("oldest"),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(ORDER_LIST_PAGE_LIMIT_MAX)
    .default(20),
});

type QueryFilter = z.infer<typeof querySchema>;

function buildFilterConditions(filter: QueryFilter): SQL[] {
  const conditions: SQL[] = [];

  const statusList = filter.status
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as (
    | "draft"
    | "pending"
    | "pending_proof"
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "expired"
    | "cancelled"
  )[];

  if (statusList.length > 0) {
    conditions.push(inArray(paymentOrders.status, statusList));
  }

  if (filter.package_code) {
    conditions.push(eq(paymentOrders.packageCode, filter.package_code));
  }

  if (filter.amount_min !== undefined) {
    conditions.push(gte(paymentOrders.amountVnd, filter.amount_min));
  }

  if (filter.amount_max !== undefined) {
    conditions.push(lte(paymentOrders.amountVnd, filter.amount_max));
  }

  if (filter.submitted_from) {
    const fromDate = new Date(filter.submitted_from);
    if (!Number.isNaN(fromDate.getTime())) {
      conditions.push(gte(paymentOrders.submittedAt, fromDate));
    }
  }

  if (filter.submitted_to) {
    const toDate = new Date(filter.submitted_to);
    if (!Number.isNaN(toDate.getTime())) {
      conditions.push(lte(paymentOrders.submittedAt, toDate));
    }
  }

  if (filter.q && filter.q.trim().length > 0) {
    const term = `%${filter.q.trim()}%`;
    conditions.push(
      or(
        ilike(users.email, term),
        ilike(users.displayName, term),
        ilike(paymentOrders.bankTxnRef, term),
        ilike(paymentOrders.transferNote, term)
      ) as SQL
    );
  }

  return conditions;
}

async function fetchPendingStats(db: ReturnType<typeof getDb>) {
  const statsQuery = await db
    .select({
      count: count(),
      oldestSubmittedAt: sql<string>`min(${paymentOrders.submittedAt})`,
    })
    .from(paymentOrders)
    .where(inArray(paymentOrders.status, ["submitted", "under_review"]));

  const pendingCount = Number(statsQuery[0]?.count || 0);
  let oldestWaitingHours = 0;
  if (statsQuery[0]?.oldestSubmittedAt) {
    const oldestDate = new Date(statsQuery[0].oldestSubmittedAt);
    const diffMs = Date.now() - oldestDate.getTime();
    oldestWaitingHours = Math.max(
      0,
      Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10
    );
  }

  return { pendingCount, oldestWaitingHours };
}

async function fetchEnrichmentData(
  db: ReturnType<typeof getDb>,
  userIds: number[],
  bankTxnRefs: string[]
) {
  const childCountsMap = new Map<number, number>();
  const priorRejectedUsersSet = new Set<number>();
  const duplicateRefsSet = new Set<string>();

  if (userIds.length > 0) {
    const [childCountRows, rejectedRows] = await Promise.all([
      db
        .select({
          userId: childProfiles.userId,
          childCount: count(),
        })
        .from(childProfiles)
        .where(inArray(childProfiles.userId, userIds))
        .groupBy(childProfiles.userId),
      db
        .select({ userId: paymentOrders.userId })
        .from(paymentOrders)
        .where(
          and(
            inArray(paymentOrders.userId, userIds),
            eq(paymentOrders.status, "rejected")
          )
        ),
    ]);

    for (const c of childCountRows) {
      childCountsMap.set(c.userId, Number(c.childCount));
    }
    for (const r of rejectedRows) {
      priorRejectedUsersSet.add(r.userId);
    }
  }

  if (bankTxnRefs.length > 0) {
    const duplicateRows = await db
      .select({
        bankTxnRef: paymentOrders.bankTxnRef,
        total: count(),
      })
      .from(paymentOrders)
      .where(inArray(paymentOrders.bankTxnRef, bankTxnRefs))
      .groupBy(paymentOrders.bankTxnRef);

    for (const d of duplicateRows) {
      if (d.bankTxnRef && Number(d.total) > 1) {
        duplicateRefsSet.add(d.bankTxnRef);
      }
    }
  }

  return { childCountsMap, priorRejectedUsersSet, duplicateRefsSet };
}

export default defineEventHandler(async (event) => {
  requireSuperAdminSession(event);
  const db = getDb();

  const rawQuery = getQuery(event);
  const parsed = querySchema.safeParse(rawQuery);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const filter = parsed.data;
  const conditions = buildFilterConditions(filter);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy =
    filter.sort === "oldest"
      ? [asc(paymentOrders.submittedAt), asc(paymentOrders.id)]
      : [desc(paymentOrders.submittedAt), desc(paymentOrders.id)];

  const [rows, stats] = await Promise.all([
    db
      .select({
        order: paymentOrders,
        userEmail: users.email,
        userDisplayName: users.displayName,
        userCreatedAt: users.createdAt,
      })
      .from(paymentOrders)
      .innerJoin(users, eq(paymentOrders.userId, users.id))
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(filter.limit + 1),
    fetchPendingStats(db),
  ]);

  const hasNextPage = rows.length > filter.limit;
  const itemsToReturn = hasNextPage ? rows.slice(0, filter.limit) : rows;
  const nextCursor = hasNextPage
    ? (itemsToReturn.at(-1)?.order.uuid ?? null)
    : null;

  const userIds = [...new Set(itemsToReturn.map((r) => r.order.userId))];
  const bankTxnRefs = [
    ...new Set(
      itemsToReturn
        .map((r) => r.order.bankTxnRef)
        .filter((ref): ref is string => Boolean(ref && ref.length > 0))
    ),
  ];

  const { childCountsMap, priorRejectedUsersSet, duplicateRefsSet } =
    await fetchEnrichmentData(db, userIds, bankTxnRefs);

  const items = itemsToReturn.map((r) => {
    const order = r.order;
    const childCount = childCountsMap.get(order.userId) || 0;
    const isDuplicateBankRef = Boolean(
      order.bankTxnRef && duplicateRefsSet.has(order.bankTxnRef)
    );
    const userHasPriorRejection = priorRejectedUsersSet.has(order.userId);

    return {
      uuid: order.uuid,
      user: {
        id: order.userId,
        email: r.userEmail,
        display_name: r.userDisplayName,
        child_profiles_count: childCount,
      },
      package_code: order.packageCode,
      offer_code: order.offerCode,
      amount_vnd: order.amountVnd,
      currency: order.currency,
      status: order.status,
      transfer_note: order.transferNote,
      bank_txn_ref: order.bankTxnRef,
      has_proof: Boolean(order.proofPath),
      submitted_at: order.submittedAt,
      reviewed_at: order.reviewedAt,
      created_at: order.createdAt,
      expires_at: order.expiresAt,
      flags: {
        duplicate_bank_txn_ref: isDuplicateBankRef,
        user_has_prior_rejected_order: userHasPriorRejection,
      },
    };
  });

  return {
    items,
    next_cursor: nextCursor,
    stats: {
      pending_count: stats.pendingCount,
      oldest_waiting_hours: stats.oldestWaitingHours,
    },
  };
});
