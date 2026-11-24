import { and, desc, eq, inArray, type SQL, sql } from "drizzle-orm";
import {
  PAYMENT_ORDER_STATUS,
  type PaymentOrderStatus,
} from "#src/constants/billing-ops-enums";
import {
  BaseRepository,
  type CursorPaginatedResult,
  type PaginatedResult,
} from "#src/repositories/base-repository";
import {
  PUBLIC_USER_COLUMNS,
  type PublicUser,
} from "#src/repositories/sensitive";
import {
  andConditions,
  ciContains,
  ciSearchAny,
  clampLimit,
  dateRangeConditions,
  runCursorPagination,
  runOffsetPagination,
  toDate,
  toNullableDate,
  uniq,
} from "#src/repositories/utils";
import { paymentOrders, type users } from "#src/schema/index";

export type PaymentOrderEntity = typeof paymentOrders.$inferSelect;

export type PaymentOrderWithUserEntity = PaymentOrderEntity & {
  readonly user: PublicUser;
};

export interface CreatePaymentOrderInput {
  readonly uuid?: string;
  readonly userId: number;
  readonly packageCode: string;
  readonly offerCode: string;
  readonly amountVnd: number;
  readonly currency?: string;
  readonly status?: PaymentOrderStatus;
  readonly transferNote?: string | null;
  readonly expiresAt?: Date | string | null;
  readonly createdAt?: Date;
}

export interface SubmitOrderProofInput {
  readonly proofPath: string;
  readonly bankTxnRef?: string | null;
  readonly submittedAt?: Date;
}

export interface ListOrdersForManagerFilter {
  readonly q?: string;
  readonly status?: PaymentOrderStatus;
  readonly packageCode?: string;
  readonly userId?: number;
  readonly from?: Date | string;
  readonly to?: Date | string;
  readonly page?: number;
  readonly limit?: number;
}

export interface ListOrderQueueFilter {
  readonly statuses?: readonly PaymentOrderStatus[];
  readonly packageCode?: string;
  readonly amountMin?: number;
  readonly amountMax?: number;
  readonly submittedFrom?: Date | string;
  readonly submittedTo?: Date | string;
  readonly q?: string;
  readonly sort?: "oldest" | "newest";
  readonly limit?: number;
}

export interface OrderQueueStats {
  readonly pendingCount: number;
  readonly oldestWaitingHours: number;
}

export interface OrderPendingStats {
  readonly pending: number;
  readonly submitted: number;
  readonly underReview: number;
  readonly totalActionable: number;
}

const COUNT_SQL = sql<number>`COUNT(*)`;

const ACTIVE_PENDING_ORDER_STATUSES: readonly PaymentOrderStatus[] = [
  PAYMENT_ORDER_STATUS.DRAFT,
  PAYMENT_ORDER_STATUS.PENDING,
  PAYMENT_ORDER_STATUS.PENDING_PROOF,
  PAYMENT_ORDER_STATUS.SUBMITTED,
  PAYMENT_ORDER_STATUS.UNDER_REVIEW,
];

function buildOrderQueueSubmittedAtRange(
  submittedFrom: Date | null,
  submittedTo: Date | null
) {
  if (submittedFrom === null && submittedTo === null) {
    return undefined;
  }
  return {
    ...(submittedFrom ? { gte: submittedFrom } : {}),
    ...(submittedTo ? { lte: submittedTo } : {}),
  };
}

function buildOrderQueueWhere(
  filter: ListOrderQueueFilter,
  submittedFrom: Date | null,
  submittedTo: Date | null
) {
  const statuses = filter.statuses ?? [];
  const searchTerm = filter.q?.trim();
  const submittedAtRange = buildOrderQueueSubmittedAtRange(
    submittedFrom,
    submittedTo
  );
  const hasAmountFilter =
    filter.amountMin !== undefined || filter.amountMax !== undefined;

  return {
    ...(statuses.length > 0 ? { status: { in: [...statuses] } } : {}),
    ...(filter.packageCode ? { packageCode: filter.packageCode } : {}),
    ...(hasAmountFilter
      ? {
          amountVnd: {
            ...(filter.amountMin === undefined
              ? {}
              : { gte: filter.amountMin }),
            ...(filter.amountMax === undefined
              ? {}
              : { lte: filter.amountMax }),
          },
        }
      : {}),
    ...(submittedAtRange ? { submittedAt: submittedAtRange } : {}),
    ...(searchTerm
      ? {
          OR: [
            {
              RAW: (o: typeof paymentOrders) =>
                ciContains(o.bankTxnRef, searchTerm),
            },
            {
              RAW: (o: typeof paymentOrders) =>
                ciContains(o.transferNote, searchTerm),
            },
            {
              user: {
                RAW: (u: typeof users) => ciContains(u.email, searchTerm),
              },
            },
            {
              user: {
                RAW: (u: typeof users) => ciContains(u.displayName, searchTerm),
              },
            },
          ],
        }
      : {}),
  };
}

export class OrdersReadRepository extends BaseRepository {
  private async countWhere(condition: SQL | undefined): Promise<number> {
    const [row] = await this.db
      .select({ total: COUNT_SQL })
      .from(paymentOrders)
      .where(condition);
    return Number(row?.total ?? 0);
  }

  async findById(id: number): Promise<PaymentOrderEntity | null> {
    return (
      (await this.db.query.paymentOrders.findFirst({ where: { id } })) ?? null
    );
  }

  async findByUuid(uuid: string): Promise<PaymentOrderEntity | null> {
    return (
      (await this.db.query.paymentOrders.findFirst({ where: { uuid } })) ?? null
    );
  }

  async findByUuidForUser(
    uuid: string,
    userId: number
  ): Promise<PaymentOrderEntity | null> {
    return (
      (await this.db.query.paymentOrders.findFirst({
        where: { uuid, userId },
      })) ?? null
    );
  }

  async findByUuidForUpdate(uuid: string): Promise<PaymentOrderEntity | null> {
    return await this.findByUuid(uuid);
  }

  async findByUuidForUserForUpdate(
    uuid: string,
    userId: number
  ): Promise<PaymentOrderEntity | null> {
    return await this.findByUuidForUser(uuid, userId);
  }

  async findActivePendingForUserPackage(
    userId: number,
    packageCode: string
  ): Promise<PaymentOrderEntity | null> {
    return (
      (await this.db.query.paymentOrders.findFirst({
        where: {
          userId,
          packageCode,
          status: { in: [...ACTIVE_PENDING_ORDER_STATUSES] },
        },
        orderBy: { createdAt: "desc", id: "desc" },
      })) ?? null
    );
  }

  async listByUser(userId: number, limit = 50): Promise<PaymentOrderEntity[]> {
    return await this.db.query.paymentOrders.findMany({
      where: { userId },
      orderBy: { createdAt: "desc", id: "desc" },
      limit: clampLimit(limit, 50, 100),
    });
  }

  async listByUuids(uuids: readonly string[]): Promise<PaymentOrderEntity[]> {
    const uniqueUuids = uniq(uuids);
    if (uniqueUuids.length === 0) {
      return [];
    }
    return await this.db.query.paymentOrders.findMany({
      where: { uuid: { in: uniqueUuids } },
      orderBy: { createdAt: "desc", id: "desc" },
    });
  }

  async listPriorOrdersForUser(
    userId: number,
    excludeOrderId: number
  ): Promise<PaymentOrderEntity[]> {
    return await this.db.query.paymentOrders.findMany({
      where: { userId, id: { ne: excludeOrderId } },
      orderBy: { createdAt: "desc", id: "desc" },
    });
  }

  async hasPriorUnapprovedOrder(
    userId: number,
    excludeOrderId?: number
  ): Promise<boolean>;
  async hasPriorUnapprovedOrder(
    userId: number,
    legacyPackageCode: string,
    excludeOrderId?: number
  ): Promise<boolean>;
  async hasPriorUnapprovedOrder(
    userId: number,
    excludeOrPackageCode?: number | string,
    maybeExcludeOrderId?: number
  ): Promise<boolean> {
    const excludeOrderId =
      typeof excludeOrPackageCode === "number"
        ? excludeOrPackageCode
        : maybeExcludeOrderId;
    const row = await this.db.query.paymentOrders.findFirst({
      columns: { id: true },
      where: {
        userId,
        ...(excludeOrderId === undefined ? {} : { id: { ne: excludeOrderId } }),
        status: {
          in: [
            PAYMENT_ORDER_STATUS.REJECTED,
            PAYMENT_ORDER_STATUS.SUBMITTED,
            PAYMENT_ORDER_STATUS.UNDER_REVIEW,
          ],
        },
      },
    });
    return row !== undefined && row !== null;
  }

  async findDetailByUuid(
    uuid: string
  ): Promise<PaymentOrderWithUserEntity | null> {
    return (
      (await this.db.query.paymentOrders.findFirst({
        where: { uuid },
        with: { user: { columns: PUBLIC_USER_COLUMNS } },
      })) ?? null
    );
  }

  async listDuplicateBankTxnRefOrders(
    bankTxnRef: string,
    excludeOrderId: number
  ): Promise<PaymentOrderWithUserEntity[]> {
    return await this.db.query.paymentOrders.findMany({
      where: { bankTxnRef, id: { ne: excludeOrderId } },
      with: { user: { columns: PUBLIC_USER_COLUMNS } },
      orderBy: { createdAt: "desc" },
    });
  }

  private buildOrderFilterConditions(
    filter: ListOrdersForManagerFilter
  ): SQL | undefined {
    return andConditions([
      ciSearchAny(
        [
          paymentOrders.uuid,
          paymentOrders.transferNote,
          paymentOrders.bankTxnRef,
          paymentOrders.packageCode,
        ],
        filter.q
      ),
      filter.status === undefined
        ? null
        : eq(paymentOrders.status, filter.status),
      filter.packageCode
        ? eq(paymentOrders.packageCode, filter.packageCode)
        : null,
      filter.userId === undefined
        ? null
        : eq(paymentOrders.userId, filter.userId),
      ...dateRangeConditions(paymentOrders.createdAt, filter.from, filter.to),
    ]);
  }

  async listForManager(
    filter: ListOrdersForManagerFilter = {}
  ): Promise<PaginatedResult<PaymentOrderEntity>> {
    const whereClause = this.buildOrderFilterConditions(filter);
    return await runOffsetPagination({
      page: filter.page,
      limit: filter.limit,
      defaultLimit: 20,
      maxLimit: 100,
      countQuery: async () => await this.countWhere(whereClause),
      rowsQuery: async (limit, offset) =>
        await this.db
          .select()
          .from(paymentOrders)
          .where(whereClause)
          .orderBy(desc(paymentOrders.createdAt), desc(paymentOrders.id))
          .limit(limit)
          .offset(offset),
    });
  }

  async listQueueForManager(
    filter: ListOrderQueueFilter = {}
  ): Promise<CursorPaginatedResult<PaymentOrderWithUserEntity, string>> {
    const submittedFrom = toNullableDate(filter.submittedFrom);
    const submittedTo = toNullableDate(filter.submittedTo);
    const where = buildOrderQueueWhere(filter, submittedFrom, submittedTo);
    const orderBy: { submittedAt: "desc" | "asc"; id: "desc" | "asc" } =
      filter.sort === "newest"
        ? { submittedAt: "desc", id: "desc" }
        : { submittedAt: "asc", id: "asc" };

    return await runCursorPagination({
      limit: filter.limit,
      defaultLimit: 20,
      maxLimit: 100,
      rowsQuery: async (limitPlusOne) =>
        await this.db.query.paymentOrders.findMany({
          where,
          with: { user: { columns: PUBLIC_USER_COLUMNS } },
          orderBy,
          limit: limitPlusOne,
        }),
      getCursor: (last) => last.uuid,
    });
  }

  async getQueueStats(now: Date = new Date()): Promise<OrderQueueStats> {
    const [row] = await this.db
      .select({
        count: COUNT_SQL,
        oldestSubmittedAt: sql<
          number | null
        >`MIN(${paymentOrders.submittedAt})`,
      })
      .from(paymentOrders)
      .where(
        inArray(paymentOrders.status, [
          PAYMENT_ORDER_STATUS.SUBMITTED,
          PAYMENT_ORDER_STATUS.UNDER_REVIEW,
        ])
      );

    const pendingCount = Number(row?.count ?? 0);
    const oldestDate = toNullableDate(row?.oldestSubmittedAt);
    const oldestWaitingHours = oldestDate
      ? Math.max(
          0,
          Math.round(
            ((now.getTime() - oldestDate.getTime()) / 3_600_000) * 10
          ) / 10
        )
      : 0;
    return { pendingCount, oldestWaitingHours };
  }

  async listPriorRejectedUserIds(
    userIds: readonly number[]
  ): Promise<Set<number>> {
    const uniqueIds = uniq(userIds);
    if (uniqueIds.length === 0) {
      return new Set();
    }
    const rows = await this.db.query.paymentOrders.findMany({
      columns: { userId: true },
      where: {
        userId: { in: uniqueIds },
        status: PAYMENT_ORDER_STATUS.REJECTED,
      },
    });
    return new Set(rows.map((row) => row.userId));
  }

  async listDuplicateBankTxnRefs(
    refs: readonly string[]
  ): Promise<Set<string>> {
    const uniqueRefs = uniq(refs);
    if (uniqueRefs.length === 0) {
      return new Set();
    }
    const rows = await this.db
      .select({
        bankTxnRef: paymentOrders.bankTxnRef,
        total: COUNT_SQL,
      })
      .from(paymentOrders)
      .where(inArray(paymentOrders.bankTxnRef, uniqueRefs))
      .groupBy(paymentOrders.bankTxnRef);
    return new Set(
      rows.flatMap((row) =>
        row.bankTxnRef && Number(row.total) > 1 ? [row.bankTxnRef] : []
      )
    );
  }

  async countPendingStats(): Promise<OrderPendingStats> {
    const [row] = await this.db
      .select({
        pending: sql<number>`COALESCE(SUM(CASE WHEN ${paymentOrders.status} IN (${PAYMENT_ORDER_STATUS.PENDING}, ${PAYMENT_ORDER_STATUS.PENDING_PROOF}) THEN 1 ELSE 0 END), 0)`,
        submitted: sql<number>`COALESCE(SUM(CASE WHEN ${paymentOrders.status} = ${PAYMENT_ORDER_STATUS.SUBMITTED} THEN 1 ELSE 0 END), 0)`,
        underReview: sql<number>`COALESCE(SUM(CASE WHEN ${paymentOrders.status} = ${PAYMENT_ORDER_STATUS.UNDER_REVIEW} THEN 1 ELSE 0 END), 0)`,
      })
      .from(paymentOrders);
    const submitted = Number(row?.submitted ?? 0);
    const underReview = Number(row?.underReview ?? 0);
    return {
      pending: Number(row?.pending ?? 0),
      submitted,
      underReview,
      totalActionable: submitted + underReview,
    };
  }

  async sumApprovedRevenueByPackage(
    since: Date | string
  ): Promise<Record<string, number>> {
    const rows = await this.db
      .select({
        packageCode: paymentOrders.packageCode,
        totalRevenue: sql<number>`COALESCE(SUM(${paymentOrders.amountVnd}), 0)`,
      })
      .from(paymentOrders)
      .where(
        and(
          eq(paymentOrders.status, PAYMENT_ORDER_STATUS.APPROVED),
          sql`${paymentOrders.reviewedAt} >= ${toDate(since).getTime()}`
        )
      )
      .groupBy(paymentOrders.packageCode);
    return Object.fromEntries(
      rows.map((row) => [row.packageCode, Number(row.totalRevenue)])
    );
  }

  async countAll(
    filter: { readonly from?: Date | string; readonly to?: Date | string } = {}
  ): Promise<number> {
    return await this.countWhere(
      andConditions(
        dateRangeConditions(paymentOrders.createdAt, filter.from, filter.to)
      )
    );
  }

  async listForExport(
    filter: { readonly from?: Date | string; readonly to?: Date | string } = {},
    maxLimit = 100_000
  ): Promise<PaymentOrderWithUserEntity[]> {
    const limit = clampLimit(maxLimit, 100_000, 100_000);
    const fromDate = toNullableDate(filter.from);
    const toDateVal = toNullableDate(filter.to);
    return await this.db.query.paymentOrders.findMany({
      ...(fromDate !== null || toDateVal !== null
        ? {
            where: {
              createdAt: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDateVal ? { lte: toDateVal } : {}),
              },
            },
          }
        : {}),
      with: { user: { columns: PUBLIC_USER_COLUMNS } },
      orderBy: { createdAt: "desc", id: "desc" },
      limit,
    });
  }
}
