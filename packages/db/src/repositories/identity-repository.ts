import {
  and,
  asc,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  type SQL,
  sql,
} from "drizzle-orm";
import {
  ENTITLEMENT_STATUS,
  PAYMENT_ORDER_STATUS,
} from "#src/constants/billing-ops-enums";
import {
  CHILD_STATUS,
  USER_STATUS,
  type UserStatus,
} from "#src/constants/identity-enums";
import { BaseRepository } from "#src/repositories/base-repository";
import {
  omitKeys,
  PUBLIC_USER_COLUMNS,
  type PublicUser,
  USER_SENSITIVE_KEYS,
} from "#src/repositories/sensitive";
import {
  andConditions,
  type CursorPaginatedResult,
  ciEquals,
  ciSearchAny,
  clampLimit,
  dateRangeConditions,
  escapeLike,
  type PaginatedResult,
  requireFirst,
  runCursorPagination,
  runOffsetPagination,
  toNullableDate,
} from "#src/repositories/utils";
import {
  childProfiles,
  userSessions,
  users,
  userTwoFactors,
} from "#src/schema/index";

export type UserEntity = PublicUser;
export type UserAuthEntity = typeof users.$inferSelect;

export interface CreateUserInput {
  readonly uuid?: string;
  readonly email: string;
  readonly passwordHash?: string | null;
  readonly displayName: string;
  readonly emailVerified?: boolean;
  readonly image?: string | null;
  readonly twoFactorEnabled?: boolean;
  readonly status?: UserStatus;
  readonly emailVerifiedAt?: Date | string | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export interface UpdateUserProfileInput {
  readonly displayName?: string;
  readonly image?: string | null;
  readonly emailVerified?: boolean;
  readonly emailVerifiedAt?: Date | string | null;
  readonly twoFactorEnabled?: boolean;
  readonly updatedAt?: Date;
}

export interface UpdateUserStatusInput {
  readonly status: UserStatus;
  readonly suspendedReason?: string | null;
  readonly purgeAt?: Date | string | null;
  readonly updatedAt?: Date;
}

export interface ListUsersFilter {
  readonly q?: string;
  readonly status?: UserStatus;
  readonly from?: Date | string;
  readonly to?: Date | string;
  readonly packageCode?: string;
  readonly page?: number;
  readonly limit?: number;
}

export type ManagerUserSort =
  | "newest"
  | "last_active"
  | "created_desc"
  | "created_asc";

export interface ListUsersCursorFilter {
  readonly q?: string;
  readonly status?: UserStatus;
  readonly packageCode?: string;
  readonly createdFrom?: Date | string;
  readonly createdTo?: Date | string;
  readonly cursor?: number;
  readonly sort?: ManagerUserSort;
  readonly limit?: number;
}

const MAX_USERS_PAGE_LIMIT = 100;
const DEFAULT_USERS_PAGE_LIMIT = 20;

function toPublicUser(row: UserAuthEntity): UserEntity {
  return omitKeys(row, USER_SENSITIVE_KEYS);
}

export class UsersRepository extends BaseRepository {
  async findById(id: number): Promise<UserEntity | null> {
    return (
      (await this.db.query.users.findFirst({
        columns: PUBLIC_USER_COLUMNS,
        where: { id },
      })) ?? null
    );
  }

  async findForAuthById(id: number): Promise<UserAuthEntity | null> {
    return (
      (await this.db.query.users.findFirst({
        where: { id },
      })) ?? null
    );
  }

  async findByIdForUpdate(id: number): Promise<UserEntity | null> {
    return await this.findById(id);
  }

  async findByUuid(uuid: string): Promise<UserEntity | null> {
    return (
      (await this.db.query.users.findFirst({
        columns: PUBLIC_USER_COLUMNS,
        where: { uuid },
      })) ?? null
    );
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return (
      (await this.db.query.users.findFirst({
        columns: PUBLIC_USER_COLUMNS,
        where: { RAW: (u) => ciEquals(u.email, email) },
      })) ?? null
    );
  }

  async findForAuthByEmail(email: string): Promise<UserAuthEntity | null> {
    return (
      (await this.db.query.users.findFirst({
        where: { RAW: (u) => ciEquals(u.email, email) },
      })) ?? null
    );
  }

  async create(input: CreateUserInput): Promise<UserEntity> {
    const now = input.createdAt ?? new Date();
    const row = await requireFirst(
      this.db
        .insert(users)
        .values({
          ...(input.uuid ? { uuid: input.uuid } : {}),
          email: input.email.trim(),
          passwordHash: input.passwordHash ?? null,
          displayName: input.displayName,
          emailVerified: input.emailVerified ?? false,
          image: input.image ?? null,
          twoFactorEnabled: input.twoFactorEnabled ?? false,
          status: input.status ?? USER_STATUS.PENDING_VERIFICATION,
          emailVerifiedAt: toNullableDate(input.emailVerifiedAt),
          createdAt: now,
          updatedAt: input.updatedAt ?? now,
        })
        .returning(),
      "Failed to insert user record"
    );
    return toPublicUser(row);
  }

  async updateProfile(
    userId: number,
    input: UpdateUserProfileInput
  ): Promise<UserEntity | null> {
    const [row] = await this.db
      .update(users)
      .set({
        ...(input.displayName === undefined
          ? {}
          : { displayName: input.displayName }),
        ...(input.image === undefined ? {} : { image: input.image }),
        ...(input.emailVerified === undefined
          ? {}
          : { emailVerified: input.emailVerified }),
        ...(input.emailVerifiedAt === undefined
          ? {}
          : { emailVerifiedAt: toNullableDate(input.emailVerifiedAt) }),
        ...(input.twoFactorEnabled === undefined
          ? {}
          : { twoFactorEnabled: input.twoFactorEnabled }),
        updatedAt: input.updatedAt ?? new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return row ? toPublicUser(row) : null;
  }

  async updateStatus(
    userId: number,
    input: UpdateUserStatusInput
  ): Promise<UserEntity | null> {
    const [row] = await this.db
      .update(users)
      .set({
        status: input.status,
        ...(input.suspendedReason === undefined
          ? {}
          : { suspendedReason: input.suspendedReason }),
        ...(input.purgeAt === undefined
          ? {}
          : { purgeAt: toNullableDate(input.purgeAt) }),
        updatedAt: input.updatedAt ?? new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return row ? toPublicUser(row) : null;
  }

  async updatePasswordHash(
    userId: number,
    passwordHash: string,
    updatedAt: Date = new Date()
  ): Promise<void> {
    await this.db
      .update(users)
      .set({ passwordHash, updatedAt })
      .where(eq(users.id, userId));
  }

  async markEmailVerifiedIfPending(
    userId: number,
    now: Date = new Date()
  ): Promise<void> {
    await this.db
      .update(users)
      .set({
        status: USER_STATUS.ACTIVE,
        emailVerified: true,
        emailVerifiedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(users.id, userId),
          eq(users.status, USER_STATUS.PENDING_VERIFICATION)
        )
      );
  }

  async incrementSessionVersion(userId: number): Promise<UserEntity | null> {
    const [row] = await this.db
      .update(users)
      .set({
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return row ? toPublicUser(row) : null;
  }

  async suspendUser(
    userId: number,
    reason: string,
    now: Date = new Date()
  ): Promise<UserEntity | null> {
    const [row] = await this.db
      .update(users)
      .set({
        status: USER_STATUS.SUSPENDED,
        suspendedReason: reason,
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(users.id, userId))
      .returning();
    return row ? toPublicUser(row) : null;
  }

  async reactivateUser(
    userId: number,
    targetStatus: UserStatus,
    now?: Date
  ): Promise<UserEntity | null>;
  async reactivateUser(userId: number, now?: Date): Promise<UserEntity | null>;
  async reactivateUser(
    userId: number,
    targetStatusOrNow: UserStatus | Date = USER_STATUS.ACTIVE,
    maybeNow?: Date
  ): Promise<UserEntity | null> {
    const targetStatus: UserStatus =
      targetStatusOrNow instanceof Date
        ? USER_STATUS.ACTIVE
        : targetStatusOrNow;
    const now =
      targetStatusOrNow instanceof Date
        ? targetStatusOrNow
        : (maybeNow ?? new Date());
    const [row] = await this.db
      .update(users)
      .set({
        status: targetStatus,
        suspendedReason: null,
        updatedAt: now,
      })
      .where(and(eq(users.id, userId), eq(users.status, USER_STATUS.SUSPENDED)))
      .returning();
    return row ? toPublicUser(row) : null;
  }

  async listDueForPurge(
    now: Date = new Date(),
    options: { readonly userId?: number; readonly limit?: number } = {}
  ): Promise<UserEntity[]> {
    const limit = clampLimit(options.limit, 200, 500);
    return await this.db.query.users.findMany({
      columns: PUBLIC_USER_COLUMNS,
      where: {
        status: USER_STATUS.DELETED,
        purgeAt: { lte: now },
        ...(options.userId === undefined ? {} : { id: options.userId }),
      },
      limit,
    });
  }

  async countAll(status?: UserStatus): Promise<number> {
    const whereClause =
      status === undefined ? undefined : eq(users.status, status);
    const [row] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(users)
      .where(whereClause);
    return Number(row?.total ?? 0);
  }

  async listPaginated(
    filter: ListUsersFilter = {}
  ): Promise<PaginatedResult<UserEntity>> {
    const pkg = filter.packageCode?.trim();
    const searchCond = ciSearchAny([users.email, users.displayName], filter.q);
    const rangeConds = dateRangeConditions(
      users.createdAt,
      filter.from,
      filter.to
    );
    const rawWhere = andConditions([searchCond, ...rangeConds]);

    const rqbWhere = {
      ...(filter.status === undefined ? {} : { status: filter.status }),
      ...(rawWhere
        ? {
            RAW: (u: typeof users) =>
              andConditions([
                ciSearchAny([u.email, u.displayName], filter.q),
                ...dateRangeConditions(u.createdAt, filter.from, filter.to),
              ]) ?? sql`1 = 1`,
          }
        : {}),
      ...(pkg
        ? {
            paymentOrders: {
              packageCode: pkg,
              status: PAYMENT_ORDER_STATUS.APPROVED,
            },
          }
        : {}),
    };

    const countWhere = andConditions([
      filter.status === undefined ? null : eq(users.status, filter.status),
      rawWhere,
      pkg
        ? sql`EXISTS (SELECT 1 FROM "payment_orders" po WHERE po."user_id" = ${users.id} AND po."package_code" = ${pkg} AND po."status" = ${PAYMENT_ORDER_STATUS.APPROVED})`
        : null,
    ]);

    return await runOffsetPagination({
      page: filter.page,
      limit: filter.limit,
      defaultLimit: DEFAULT_USERS_PAGE_LIMIT,
      maxLimit: MAX_USERS_PAGE_LIMIT,
      countQuery: async () => {
        const [countRow] = await this.db
          .select({ total: sql<number>`COUNT(*)` })
          .from(users)
          .where(countWhere);
        return Number(countRow?.total ?? 0);
      },
      rowsQuery: async (limit, offset) =>
        await this.db.query.users.findMany({
          columns: PUBLIC_USER_COLUMNS,
          ...(rqbWhere ? { where: rqbWhere } : {}),
          orderBy: { createdAt: "desc", id: "desc" },
          limit,
          offset,
        }),
    });
  }

  async listCursorForManager(
    filter: ListUsersCursorFilter = {}
  ): Promise<CursorPaginatedResult<UserEntity, number>> {
    const pkg = filter.packageCode?.trim();
    const escapedPkg = pkg ? escapeLike(pkg) : undefined;
    const now = new Date();
    const rawCond = andConditions([
      ciSearchAny([users.email, users.displayName], filter.q),
      ...dateRangeConditions(
        users.createdAt,
        filter.createdFrom,
        filter.createdTo
      ),
    ]);

    return await runCursorPagination({
      limit: filter.limit,
      defaultLimit: DEFAULT_USERS_PAGE_LIMIT,
      maxLimit: MAX_USERS_PAGE_LIMIT,
      rowsQuery: async (limitPlusOne) =>
        await this.db.query.users.findMany({
          columns: PUBLIC_USER_COLUMNS,
          where: {
            ...(filter.status === undefined ? {} : { status: filter.status }),
            ...(filter.cursor !== undefined && filter.cursor > 0
              ? { id: { lt: filter.cursor } }
              : {}),
            ...(rawCond
              ? {
                  RAW: (u: typeof users) =>
                    andConditions([
                      ciSearchAny([u.email, u.displayName], filter.q),
                      ...dateRangeConditions(
                        u.createdAt,
                        filter.createdFrom,
                        filter.createdTo
                      ),
                    ]) ?? sql`1 = 1`,
                }
              : {}),
            ...(pkg && escapedPkg
              ? {
                  entitlements: {
                    status: ENTITLEMENT_STATUS.ACTIVE,
                    AND: [
                      {
                        OR: [
                          { expiresAt: { isNull: true } },
                          { expiresAt: { gte: now } },
                        ],
                      },
                      {
                        OR: [
                          { entitlementKey: pkg },
                          {
                            RAW: (e) =>
                              sql`LOWER(CAST(${e.grantReason} AS TEXT)) LIKE LOWER(${`%${escapedPkg}%`}) ESCAPE '\\'`,
                          },
                        ],
                      },
                    ],
                  },
                }
              : {}),
          },
          orderBy:
            filter.sort === "created_asc" ? { id: "asc" } : { id: "desc" },
          limit: limitPlusOne,
        }),
      getCursor: (last) => last.id,
    });
  }

  async getSessionReauthAt(sessionId: number): Promise<Date | null> {
    const row = await this.db.query.userSessions.findFirst({
      columns: { reauthAt: true },
      where: { id: sessionId },
    });
    return row?.reauthAt ?? null;
  }

  async mapLastActiveByUsers(
    userIds: readonly number[]
  ): Promise<Map<number, Date>> {
    const result = new Map<number, Date>();
    if (userIds.length === 0) {
      return result;
    }
    const rows = await this.db.query.userSessions.findMany({
      columns: { userId: true, updatedAt: true },
      where: { userId: { in: [...userIds] } },
      orderBy: { updatedAt: "desc" },
    });

    for (const row of rows) {
      if (!result.has(row.userId)) {
        result.set(row.userId, row.updatedAt);
      }
    }
    return result;
  }

  async countActiveSessions(
    userId: number,
    now: Date = new Date()
  ): Promise<{
    readonly activeCount: number;
    readonly lastUsedAt: Date | null;
  }> {
    const [row] = await this.db
      .select({
        activeCount: sql<number>`COUNT(*)`,
        lastUsedAt: sql<number | null>`MAX(${userSessions.updatedAt})`,
      })
      .from(userSessions)
      .where(
        and(eq(userSessions.userId, userId), gt(userSessions.expiresAt, now))
      );
    return {
      activeCount: Number(row?.activeCount ?? 0),
      lastUsedAt:
        row?.lastUsedAt !== null && row?.lastUsedAt !== undefined
          ? new Date(Number(row.lastUsedAt))
          : null,
    };
  }

  async applyEmailChange(
    userId: number,
    newEmail: string,
    now: Date = new Date()
  ): Promise<UserEntity | null> {
    const [row] = await this.db
      .update(users)
      .set({
        email: newEmail.trim(),
        emailVerified: true,
        emailVerifiedAt: now,
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(users.id, userId))
      .returning();
    return row ? toPublicUser(row) : null;
  }

  async updatePasswordAndBumpSession(
    userId: number,
    passwordHash: string,
    now: Date = new Date()
  ): Promise<UserEntity | null> {
    const [row] = await this.db
      .update(users)
      .set({
        passwordHash,
        sessionVersion: sql`${users.sessionVersion} + 1`,
        updatedAt: now,
      })
      .where(eq(users.id, userId))
      .returning();
    return row ? toPublicUser(row) : null;
  }

  async disableTwoFactorAndBumpSession(
    userId: number,
    now: Date = new Date()
  ): Promise<UserEntity | null> {
    return await this.transaction(async (tx) => {
      await tx.delete(userTwoFactors).where(eq(userTwoFactors.userId, userId));
      const [row] = await tx
        .update(users)
        .set({
          twoFactorEnabled: false,
          sessionVersion: sql`${users.sessionVersion} + 1`,
          updatedAt: now,
        })
        .where(eq(users.id, userId))
        .returning();
      return row ? toPublicUser(row) : null;
    });
  }

  async requestDeletion(
    userId: number,
    now: Date = new Date()
  ): Promise<{ readonly scheduledPurgeAt: Date }> {
    const scheduledPurgeAt = new Date(now.getTime());
    scheduledPurgeAt.setDate(scheduledPurgeAt.getDate() + 30);
    await this.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          status: USER_STATUS.DELETED,
          purgeAt: scheduledPurgeAt,
          updatedAt: now,
        })
        .where(eq(users.id, userId));
      await tx
        .update(childProfiles)
        .set({ status: CHILD_STATUS.PENDING_DELETION, updatedAt: now })
        .where(
          and(
            eq(childProfiles.userId, userId),
            eq(childProfiles.status, CHILD_STATUS.ACTIVE)
          )
        );
    });
    return { scheduledPurgeAt };
  }

  async cancelDeletion(
    userId: number,
    now: Date = new Date(),
    maxActiveChildren?: number
  ): Promise<{ readonly status: UserStatus } | null> {
    return await this.transaction(async (tx) => {
      const account = await tx.query.users.findFirst({
        columns: { id: true, emailVerified: true, status: true },
        where: { id: userId },
      });
      if (!account || account.status !== USER_STATUS.DELETED) {
        return null;
      }

      const restoredUserStatus: UserStatus = account.emailVerified
        ? USER_STATUS.ACTIVE
        : USER_STATUS.PENDING_VERIFICATION;

      const [updatedUser] = await tx
        .update(users)
        .set({
          status: restoredUserStatus,
          purgeAt: null,
          updatedAt: now,
        })
        .where(and(eq(users.id, userId), eq(users.status, USER_STATUS.DELETED)))
        .returning({ id: users.id });
      if (!updatedUser) {
        return null;
      }

      if (maxActiveChildren === undefined) {
        await tx
          .update(childProfiles)
          .set({ status: CHILD_STATUS.ACTIVE, purgeAt: null, updatedAt: now })
          .where(
            and(
              eq(childProfiles.userId, userId),
              eq(childProfiles.status, CHILD_STATUS.PENDING_DELETION),
              isNull(childProfiles.purgeAt)
            )
          );
        return { status: restoredUserStatus };
      }

      const [activeCountRow] = await tx
        .select({ total: sql<number>`COUNT(*)` })
        .from(childProfiles)
        .where(
          and(
            eq(childProfiles.userId, userId),
            eq(childProfiles.status, CHILD_STATUS.ACTIVE)
          )
        );
      const existingActiveCount = Number(activeCountRow?.total ?? 0);
      const availableSlots = Math.max(
        0,
        maxActiveChildren - existingActiveCount
      );

      const pendingChildren = await tx
        .select({ id: childProfiles.id })
        .from(childProfiles)
        .where(
          and(
            eq(childProfiles.userId, userId),
            eq(childProfiles.status, CHILD_STATUS.PENDING_DELETION),
            isNull(childProfiles.purgeAt)
          )
        )
        .orderBy(asc(childProfiles.createdAt), asc(childProfiles.id));

      const toActivateIds = pendingChildren
        .slice(0, availableSlots)
        .map((c) => c.id);
      const toArchiveIds = pendingChildren
        .slice(availableSlots)
        .map((c) => c.id);

      if (toActivateIds.length > 0) {
        await tx
          .update(childProfiles)
          .set({
            status: CHILD_STATUS.ACTIVE,
            purgeAt: null,
            updatedAt: now,
          })
          .where(
            and(
              eq(childProfiles.userId, userId),
              eq(childProfiles.status, CHILD_STATUS.PENDING_DELETION),
              isNull(childProfiles.purgeAt),
              inArray(childProfiles.id, toActivateIds)
            )
          );
      }

      if (toArchiveIds.length > 0) {
        await tx
          .update(childProfiles)
          .set({
            status: CHILD_STATUS.ARCHIVED,
            purgeAt: null,
            updatedAt: now,
          })
          .where(
            and(
              eq(childProfiles.userId, userId),
              eq(childProfiles.status, CHILD_STATUS.PENDING_DELETION),
              isNull(childProfiles.purgeAt),
              inArray(childProfiles.id, toArchiveIds)
            )
          );
      }

      return { status: restoredUserStatus };
    });
  }

  async countCreatedInRange(
    filter: {
      readonly from?: Date | string;
      readonly to?: Date | string;
      readonly toExclusive?: boolean;
    } = {}
  ): Promise<number> {
    const fromDate = toNullableDate(filter.from);
    const toDate = toNullableDate(filter.to);
    let toClause: SQL | null = null;
    if (toDate) {
      toClause = filter.toExclusive
        ? lt(users.createdAt, toDate)
        : lte(users.createdAt, toDate);
    }
    const whereClause = andConditions([
      fromDate ? gte(users.createdAt, fromDate) : null,
      toClause,
    ]);
    const [row] = await this.db
      .select({ total: sql<number>`COUNT(*)` })
      .from(users)
      .where(whereClause);
    return Number(row?.total ?? 0);
  }

  async listForExport(
    filter: { readonly from?: Date | string; readonly to?: Date | string } = {},
    maxLimit = 100_000
  ): Promise<UserEntity[]> {
    const limit = clampLimit(maxLimit, 100_000, 100_000);
    const hasRange = Boolean(filter.from || filter.to);
    return await this.db.query.users.findMany({
      columns: PUBLIC_USER_COLUMNS,
      ...(hasRange
        ? {
            where: {
              RAW: (u) =>
                andConditions(
                  dateRangeConditions(u.createdAt, filter.from, filter.to)
                ) ?? sql`1 = 1`,
            },
          }
        : {}),
      orderBy: { createdAt: "desc", id: "desc" },
      limit,
    });
  }
}
