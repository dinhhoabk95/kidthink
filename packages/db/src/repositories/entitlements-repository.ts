import {
  and,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  or,
  sql,
} from "drizzle-orm";
import {
  ENTITLEMENT_SOURCE,
  ENTITLEMENT_STATUS,
  type EntitlementSource,
  type EntitlementStatus,
} from "#src/constants/billing-ops-enums";
import {
  BaseRepository,
  type CursorPaginatedResult,
} from "#src/repositories/base-repository";
import {
  PUBLIC_MANAGER_COLUMNS,
  PUBLIC_USER_COLUMNS,
  type PublicManager,
  type PublicUser,
} from "#src/repositories/sensitive";
import {
  andConditions,
  clampLimit,
  firstOrNull,
  requireFirst,
  runCursorPagination,
  toDate,
  toNullableDate,
  uniq,
} from "#src/repositories/utils";
import {
  type entitlementKeys,
  entitlements,
  quotaUsage,
} from "#src/schema/index";

export type EntitlementEntity = typeof entitlements.$inferSelect;
export type EntitlementKeyEntity = typeof entitlementKeys.$inferSelect;
export type QuotaUsageEntity = typeof quotaUsage.$inferSelect;

export type EntitlementWithKeyEntity = EntitlementEntity & {
  readonly keyDefinition: EntitlementKeyEntity;
};

export type EntitlementWithActorsEntity = EntitlementEntity & {
  readonly user: PublicUser;
  readonly grantedByManager: PublicManager | null;
};

export type EntitlementWithUserEntity = EntitlementEntity & {
  readonly user: PublicUser;
};

export interface GrantEntitlementInput {
  readonly userId: number;
  readonly entitlementKey: string;
  readonly source: EntitlementSource;
  readonly sourceRef?: string | null;
  readonly status?: EntitlementStatus;
  readonly grantedAt?: Date | string;
  readonly expiresAt?: Date | string | null;
  readonly grantedByManagerId?: number | null;
  readonly grantReason?: string | null;
}

export type UpdateEntitlementInput = Partial<
  Omit<
    typeof entitlements.$inferInsert,
    "id" | "userId" | "entitlementKey" | "createdAt"
  >
>;

export interface UpdateEntitlementsFilter {
  readonly source?: EntitlementSource;
  readonly currentStatuses: readonly EntitlementStatus[];
  readonly keys?: readonly string[];
  readonly maxPeriodEnd?: Date;
  readonly includeExpired?: boolean;
}

export interface UpdateEntitlementsNext {
  readonly status: EntitlementStatus;
  readonly expiresAt?: Date | null;
  readonly now?: Date;
}

export interface ExpiredEntitlementSummary {
  readonly id: number;
  readonly userId: number;
}

const COUNT_SQL = sql<number>`COUNT(*)`;

const ACTIVE_ENTITLEMENT_STATUSES: readonly EntitlementStatus[] = [
  ENTITLEMENT_STATUS.ACTIVE,
  ENTITLEMENT_STATUS.SOFT_UNLOCK,
  ENTITLEMENT_STATUS.GRACE_PERIOD,
];

export class EntitlementsRepository extends BaseRepository {
  private activeUserCondition(
    userId: number,
    now: Date,
    entitlementKey?: string
  ) {
    return andConditions([
      eq(entitlements.userId, userId),
      inArray(entitlements.status, [...ACTIVE_ENTITLEMENT_STATUSES]),
      or(isNull(entitlements.expiresAt), gte(entitlements.expiresAt, now)),
      entitlementKey ? eq(entitlements.entitlementKey, entitlementKey) : null,
    ]);
  }

  async findById(id: number): Promise<EntitlementEntity | null> {
    return (
      (await this.db.query.entitlements.findFirst({ where: { id } })) ?? null
    );
  }

  async findByUserAndKey(
    userId: number,
    entitlementKey: string
  ): Promise<EntitlementEntity | null> {
    return (
      (await this.db.query.entitlements.findFirst({
        where: { userId, entitlementKey },
        orderBy: { grantedAt: "desc", id: "desc" },
      })) ?? null
    );
  }

  async listActiveForUser(
    userId: number,
    now: Date = new Date()
  ): Promise<EntitlementEntity[]> {
    return await this.db.query.entitlements.findMany({
      where: {
        userId,
        status: { in: [...ACTIVE_ENTITLEMENT_STATUSES] },
        OR: [{ expiresAt: { isNull: true } }, { expiresAt: { gte: now } }],
      },
      orderBy: { grantedAt: "desc", id: "desc" },
    });
  }

  async listAllForUser(userId: number): Promise<EntitlementEntity[]> {
    return await this.db.query.entitlements.findMany({
      where: { userId },
      orderBy: { id: "desc" },
    });
  }

  async countActiveForUser(
    userId: number,
    now: Date = new Date()
  ): Promise<number> {
    const [row] = await this.db
      .select({ total: COUNT_SQL })
      .from(entitlements)
      .where(this.activeUserCondition(userId, now));
    return Number(row?.total ?? 0);
  }

  async countActiveAll(): Promise<number> {
    const [row] = await this.db
      .select({ total: COUNT_SQL })
      .from(entitlements)
      .where(eq(entitlements.status, ENTITLEMENT_STATUS.ACTIVE));
    return Number(row?.total ?? 0);
  }

  async hasEntitlement(
    userId: number,
    entitlementKey: string,
    now: Date = new Date()
  ): Promise<boolean> {
    const [row] = await this.db
      .select({ id: entitlements.id })
      .from(entitlements)
      .where(this.activeUserCondition(userId, now, entitlementKey))
      .limit(1);
    return row !== undefined;
  }

  async grantEntitlement(
    input: GrantEntitlementInput
  ): Promise<EntitlementEntity> {
    const grantedAt = input.grantedAt ? toDate(input.grantedAt) : new Date();
    return await requireFirst(
      this.db
        .insert(entitlements)
        .values({
          userId: input.userId,
          entitlementKey: input.entitlementKey,
          source: input.source,
          sourceRef: input.sourceRef ?? null,
          status: input.status ?? ENTITLEMENT_STATUS.ACTIVE,
          grantedAt,
          expiresAt: toNullableDate(input.expiresAt),
          grantedByManagerId: input.grantedByManagerId ?? null,
          grantReason: input.grantReason ?? null,
          createdAt: grantedAt,
          updatedAt: grantedAt,
        })
        .returning(),
      "Failed to grant entitlement"
    );
  }

  async updateEntitlementById(
    id: number,
    patch: UpdateEntitlementInput
  ): Promise<EntitlementEntity | null> {
    return await firstOrNull(
      this.db
        .update(entitlements)
        .set({ ...patch, updatedAt: patch.updatedAt ?? new Date() })
        .where(eq(entitlements.id, id))
        .returning()
    );
  }

  async updateStatusForUserKeys(
    userId: number,
    filter: UpdateEntitlementsFilter,
    next: UpdateEntitlementsNext
  ): Promise<number> {
    if (!filter.keys || filter.keys.length === 0) {
      return 0;
    }
    const uniqueKeys = uniq(filter.keys);
    if (uniqueKeys.length === 0) {
      return 0;
    }

    const targetStatuses = uniq([
      ...filter.currentStatuses,
      ...(filter.includeExpired ? [ENTITLEMENT_STATUS.EXPIRED] : []),
    ]);
    if (targetStatuses.length === 0) {
      return 0;
    }

    const whereClause = andConditions([
      eq(entitlements.userId, userId),
      filter.source === undefined
        ? null
        : eq(entitlements.source, filter.source),
      inArray(entitlements.status, targetStatuses),
      inArray(entitlements.entitlementKey, uniqueKeys),
      isNotNull(entitlements.expiresAt),
      filter.maxPeriodEnd === undefined
        ? null
        : lte(entitlements.expiresAt, filter.maxPeriodEnd),
    ]);

    const expiresAtPatch =
      next.expiresAt === undefined
        ? {}
        : {
            expiresAt:
              next.expiresAt === null
                ? null
                : sql`CASE WHEN ${entitlements.expiresAt} > ${next.expiresAt.getTime()} THEN ${entitlements.expiresAt} ELSE ${next.expiresAt.getTime()} END`,
          };

    const updated = await this.db
      .update(entitlements)
      .set({
        status: next.status,
        ...expiresAtPatch,
        updatedAt: next.now ?? new Date(),
      })
      .where(whereClause)
      .returning({ id: entitlements.id });
    return updated.length;
  }

  async expireDue(
    now: Date = new Date()
  ): Promise<ExpiredEntitlementSummary[]> {
    return await this.db
      .update(entitlements)
      .set({ status: ENTITLEMENT_STATUS.EXPIRED, updatedAt: now })
      .where(
        and(
          eq(entitlements.status, ENTITLEMENT_STATUS.ACTIVE),
          isNotNull(entitlements.expiresAt),
          lte(entitlements.expiresAt, now)
        )
      )
      .returning({ id: entitlements.id, userId: entitlements.userId });
  }

  async expireSoftUnlocks(
    now: Date = new Date(),
    limit = 500
  ): Promise<number[]> {
    const { userIds } = await this.expireSoftUnlocksDetailed(now, limit);
    return userIds;
  }

  async expireSoftUnlocksDetailed(
    now: Date = new Date(),
    limit = 500
  ): Promise<{ readonly expiredCount: number; readonly userIds: number[] }> {
    const capped = clampLimit(limit, 500, 1000);
    const candidates = await this.db
      .select({ id: entitlements.id })
      .from(entitlements)
      .where(
        and(
          eq(entitlements.status, ENTITLEMENT_STATUS.SOFT_UNLOCK),
          isNotNull(entitlements.expiresAt),
          lt(entitlements.expiresAt, now)
        )
      )
      .limit(capped);

    if (candidates.length === 0) {
      return { expiredCount: 0, userIds: [] };
    }
    const ids = candidates.map((row) => row.id);
    const updated = await this.db
      .update(entitlements)
      .set({ status: ENTITLEMENT_STATUS.EXPIRED, updatedAt: now })
      .where(inArray(entitlements.id, ids))
      .returning({ userId: entitlements.userId });
    return {
      expiredCount: updated.length,
      userIds: uniq(updated.map((row) => row.userId)),
    };
  }

  async listManualGrantsInWindow(
    startAt: Date,
    endAt: Date,
    limit = 1000
  ): Promise<EntitlementWithActorsEntity[]> {
    const capped = clampLimit(limit, 1000, 5000);
    return await this.db.query.entitlements.findMany({
      where: {
        source: ENTITLEMENT_SOURCE.MANUAL_GRANT,
        grantedAt: { gte: startAt, lt: endAt },
      },
      with: {
        user: { columns: PUBLIC_USER_COLUMNS },
        grantedByManager: { columns: PUBLIC_MANAGER_COLUMNS },
      },
      orderBy: { grantedAt: "desc", id: "desc" },
      limit: capped,
    });
  }

  async countActiveUsersByKeys(
    keys: readonly string[],
    now: Date = new Date()
  ): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }
    const [row] = await this.db
      .select({
        activeCount: sql<number>`COUNT(DISTINCT ${entitlements.userId})`,
      })
      .from(entitlements)
      .where(
        andConditions([
          eq(entitlements.status, ENTITLEMENT_STATUS.ACTIVE),
          or(isNull(entitlements.expiresAt), gte(entitlements.expiresAt, now)),
          inArray(entitlements.entitlementKey, [...keys]),
        ])
      );
    return Number(row?.activeCount ?? 0);
  }

  async listActiveSubscribersByKeys(
    keys: readonly string[],
    options: {
      readonly cursor?: number;
      readonly limit?: number;
      readonly now?: Date;
    } = {}
  ): Promise<CursorPaginatedResult<EntitlementWithUserEntity, number>> {
    const limit = clampLimit(options.limit, 50, 100);
    if (keys.length === 0) {
      return { items: [], nextCursor: null, hasMore: false, limit };
    }
    const now = options.now ?? new Date();

    return await runCursorPagination({
      limit,
      defaultLimit: 50,
      maxLimit: 100,
      rowsQuery: async (limitPlusOne) =>
        await this.db.query.entitlements.findMany({
          where: {
            status: ENTITLEMENT_STATUS.ACTIVE,
            OR: [{ expiresAt: { isNull: true } }, { expiresAt: { gte: now } }],
            entitlementKey: { in: [...keys] },
            ...(options.cursor !== undefined && options.cursor > 0
              ? { id: { lt: options.cursor } }
              : {}),
          },
          with: { user: { columns: PUBLIC_USER_COLUMNS } },
          orderBy: { id: "desc" },
          limit: limitPlusOne,
        }),
      getCursor: (last) => last.id,
    });
  }

  async mapFirstActiveKeyByUsers(
    userIds: readonly number[],
    now: Date = new Date()
  ): Promise<Map<number, string>> {
    const uniqueIds = uniq(userIds);
    const map = new Map<number, string>();
    if (uniqueIds.length === 0) {
      return map;
    }
    const rows = await this.db.query.entitlements.findMany({
      columns: { userId: true, entitlementKey: true },
      where: {
        status: ENTITLEMENT_STATUS.ACTIVE,
        OR: [{ expiresAt: { isNull: true } }, { expiresAt: { gte: now } }],
        userId: { in: uniqueIds },
      },
      orderBy: { id: "asc" },
    });

    for (const row of rows) {
      if (!map.has(row.userId)) {
        map.set(row.userId, row.entitlementKey);
      }
    }
    return map;
  }

  async listEntitlementKeys(): Promise<EntitlementKeyEntity[]> {
    return await this.db.query.entitlementKeys.findMany({
      orderBy: { key: "asc" },
    });
  }

  async listQuotaUsageByUser(userId: number): Promise<QuotaUsageEntity[]> {
    return await this.db.query.quotaUsage.findMany({
      where: { userId },
      orderBy: { periodStart: "desc" },
    });
  }

  async resetUserQuota(
    userId: number,
    quotaKey: string,
    now: Date = new Date()
  ): Promise<number> {
    const updated = await this.db
      .update(quotaUsage)
      .set({ used: 0, updatedAt: now })
      .where(
        and(eq(quotaUsage.userId, userId), eq(quotaUsage.quotaKey, quotaKey))
      )
      .returning({ id: quotaUsage.id });
    return updated.length;
  }

  async listWithKeysForUser(
    userId: number,
    statuses?: readonly EntitlementStatus[]
  ): Promise<EntitlementWithKeyEntity[]> {
    return await this.db.query.entitlements.findMany({
      where: {
        userId,
        ...(statuses && statuses.length > 0
          ? { status: { in: [...statuses] } }
          : {}),
      },
      with: { keyDefinition: true },
      orderBy: { id: "desc" },
    });
  }

  async revokeByUserAndSourceRef(
    userId: number,
    sourceRef: string,
    now: Date = new Date()
  ): Promise<string[]> {
    const rows = await this.db
      .update(entitlements)
      .set({ status: ENTITLEMENT_STATUS.CANCELLED, updatedAt: now })
      .where(
        and(
          eq(entitlements.userId, userId),
          eq(entitlements.sourceRef, sourceRef),
          eq(entitlements.status, ENTITLEMENT_STATUS.SOFT_UNLOCK)
        )
      )
      .returning({ entitlementKey: entitlements.entitlementKey });
    return rows.map((row) => row.entitlementKey);
  }
}
