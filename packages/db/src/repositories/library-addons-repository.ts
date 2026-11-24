import {
  and,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  lte,
  ne,
  sql,
} from "drizzle-orm";
import type { DbExecutor } from "#src/client";
import {
  AI_CREDIT_REASON,
  type AiCreditReason,
} from "#src/constants/billing-ops-enums";
import type { JsonRecord } from "#src/constants/json";
import {
  type ContentEntityType,
  CUSTOM_GAME_STATUS,
  type CustomGameStatus,
  EXPORT_JOB_STATUS,
  type ExportJobKind,
} from "#src/constants/learning-enums";
import { BaseRepository } from "#src/repositories/base-repository";
import {
  clampLimit,
  firstOrNull,
  type PaginatedResult,
  requireFirst,
  runOffsetPagination,
  toDate,
  uniq,
} from "#src/repositories/utils";
import {
  aiCreditBalance,
  aiCreditLedger,
  aiUsageLog,
  collections,
  customGames,
  exportJobs,
  libraryItems,
} from "#src/schema/index";

export type CollectionEntity = typeof collections.$inferSelect;
export type LibraryItemEntity = typeof libraryItems.$inferSelect;
export type CustomGameEntity = typeof customGames.$inferSelect;
export type AiCreditLedgerEntity = typeof aiCreditLedger.$inferSelect;
export type AiCreditBalanceEntity = typeof aiCreditBalance.$inferSelect;
export type AiUsageLogEntity = typeof aiUsageLog.$inferSelect;
export type ExportJobEntity = typeof exportJobs.$inferSelect;

export interface CreateCollectionInput {
  readonly userId: number;
  readonly name: string;
  readonly position: number;
  readonly createdAt?: Date;
}

export interface AddLibraryItemInput {
  readonly userId: number;
  readonly entityType: ContentEntityType;
  readonly entityId: number;
  readonly collectionId?: number | null;
  readonly note?: string | null;
  readonly createdAt?: Date;
}

export interface CreateCustomGameInput {
  readonly userId: number;
  readonly templateId: string;
  readonly title: string;
  readonly instruction: string;
  readonly contentPack: JsonRecord;
  readonly difficultyParams: JsonRecord;
  readonly themeId?: string;
  readonly ageMin?: number;
  readonly ageMax?: number;
  readonly skillIds?: number[] | null;
  readonly status?: CustomGameStatus;
  readonly createdAt?: Date;
}

export interface UpdateCustomGameInput {
  readonly title: string;
  readonly instruction: string;
  readonly contentPack: JsonRecord;
  readonly difficultyParams: JsonRecord;
  readonly themeId: string;
  readonly ageMin: number;
  readonly ageMax: number;
  readonly skillIds: number[] | null;
  readonly status: CustomGameStatus;
  readonly updatedAt?: Date;
}

export interface CreateAiCreditLedgerInput {
  readonly userId: number;
  readonly delta: number;
  readonly reason: AiCreditReason;
  readonly refType?: string | null;
  readonly refId?: string | null;
  readonly feature?: string | null;
  readonly grantedByManagerId?: number | null;
  readonly grantReason?: string | null;
  readonly idempotencyKey?: string | null;
  readonly createdAt?: Date;
}

export interface CreateAiUsageLogInput {
  readonly userId: number;
  readonly feature: string;
  readonly creditsSpent: number;
  readonly model: string;
  readonly promptVersion: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsdMicros: number;
  readonly moderationPassed: boolean;
  readonly createdAt?: Date;
}

export type AiDebitResult =
  | {
      readonly ok: true;
      readonly alreadyProcessed: boolean;
      readonly prevBalance: number;
      readonly newBalance: number;
      readonly totalGranted: number;
      readonly ledgerEntry: AiCreditLedgerEntity;
    }
  | { readonly ok: false; readonly currentBalance: number };

const COUNT_SQL = sql<number>`COUNT(*)`;

export class LibraryRepository extends BaseRepository {
  async listCollectionsByUser(userId: number): Promise<CollectionEntity[]> {
    return await this.db.query.collections.findMany({
      where: { userId },
      orderBy: { position: "asc", createdAt: "asc" },
    });
  }

  async findCollectionByIdForUser(
    collectionId: number,
    userId: number
  ): Promise<CollectionEntity | null> {
    return await firstOrNull(
      this.db
        .select()
        .from(collections)
        .where(
          and(eq(collections.id, collectionId), eq(collections.userId, userId))
        )
        .limit(1)
    );
  }

  async countCollectionsByUser(userId: number): Promise<number> {
    const [row] = await this.db
      .select({ total: COUNT_SQL })
      .from(collections)
      .where(eq(collections.userId, userId));
    return Number(row?.total ?? 0);
  }

  async countItemsByCollectionForUser(
    userId: number
  ): Promise<Map<number, number>> {
    const rows = await this.db
      .select({
        collectionId: libraryItems.collectionId,
        total: COUNT_SQL,
      })
      .from(libraryItems)
      .where(eq(libraryItems.userId, userId))
      .groupBy(libraryItems.collectionId);
    const result = new Map<number, number>();
    for (const row of rows) {
      if (row.collectionId !== null) {
        result.set(row.collectionId, Number(row.total));
      }
    }
    return result;
  }

  async createCollection(
    input: CreateCollectionInput
  ): Promise<CollectionEntity> {
    const now = input.createdAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(collections)
        .values({
          userId: input.userId,
          name: input.name.trim(),
          position: input.position,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Failed to create collection"
    );
  }

  async updateCollection(
    collectionId: number,
    userId: number,
    input: {
      readonly name?: string;
      readonly position?: number;
      readonly updatedAt?: Date;
    }
  ): Promise<CollectionEntity | null> {
    return await firstOrNull(
      this.db
        .update(collections)
        .set({
          ...(input.name === undefined ? {} : { name: input.name.trim() }),
          ...(input.position === undefined ? {} : { position: input.position }),
          updatedAt: input.updatedAt ?? new Date(),
        })
        .where(
          and(eq(collections.id, collectionId), eq(collections.userId, userId))
        )
        .returning()
    );
  }

  async deleteCollection(
    collectionId: number,
    userId: number
  ): Promise<boolean> {
    const rows = await this.db
      .delete(collections)
      .where(
        and(eq(collections.id, collectionId), eq(collections.userId, userId))
      )
      .returning({ id: collections.id });
    return rows.length > 0;
  }

  async addLibraryItem(input: AddLibraryItemInput): Promise<LibraryItemEntity> {
    const now = input.createdAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(libraryItems)
        .values({
          userId: input.userId,
          entityType: input.entityType,
          entityId: input.entityId,
          collectionId: input.collectionId ?? null,
          note: input.note?.trim() ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Failed to add library item"
    );
  }

  async removeLibraryItem(
    userId: number,
    entityType: ContentEntityType,
    entityId: number
  ): Promise<boolean> {
    const rows = await this.db
      .delete(libraryItems)
      .where(
        and(
          eq(libraryItems.userId, userId),
          eq(libraryItems.entityType, entityType),
          eq(libraryItems.entityId, entityId)
        )
      )
      .returning({ entityId: libraryItems.entityId });
    return rows.length > 0;
  }

  async listLibraryItems(filter: {
    readonly userId: number;
    readonly entityType?: ContentEntityType;
    readonly entityId?: number;
    readonly collectionId?: number;
    readonly limit?: number;
  }): Promise<LibraryItemEntity[]> {
    return await this.db.query.libraryItems.findMany({
      where: {
        userId: filter.userId,
        ...(filter.entityType === undefined
          ? {}
          : { entityType: filter.entityType }),
        ...(filter.entityId === undefined ? {} : { entityId: filter.entityId }),
        ...(filter.collectionId === undefined
          ? {}
          : { collectionId: filter.collectionId }),
      },
      orderBy: { createdAt: "desc" },
      limit: clampLimit(filter.limit, 100, 100),
    });
  }
}

export class CustomGamesRepository extends BaseRepository {
  async countByUser(userId: number): Promise<number> {
    const [row] = await this.db
      .select({ total: COUNT_SQL })
      .from(customGames)
      .where(eq(customGames.userId, userId));
    return Number(row?.total ?? 0);
  }

  async findByUuidForUser(
    uuid: string,
    userId: number
  ): Promise<CustomGameEntity | null> {
    return (
      (await this.db.query.customGames.findFirst({
        where: { uuid, userId },
      })) ?? null
    );
  }

  async listForUser(
    userId: number,
    filter: {
      readonly status?: CustomGameStatus;
      readonly templateId?: string;
    } = {}
  ): Promise<CustomGameEntity[]> {
    return await this.db.query.customGames.findMany({
      where: {
        userId,
        ...(filter.status === undefined ? {} : { status: filter.status }),
        ...(filter.templateId === undefined
          ? {}
          : { templateId: filter.templateId }),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(input: CreateCustomGameInput): Promise<CustomGameEntity> {
    const now = input.createdAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(customGames)
        .values({
          userId: input.userId,
          templateId: input.templateId,
          title: input.title,
          instruction: input.instruction,
          contentPack: input.contentPack,
          difficultyParams: input.difficultyParams,
          themeId: input.themeId ?? "farm",
          ageMin: input.ageMin ?? 3,
          ageMax: input.ageMax ?? 6,
          skillIds: input.skillIds ?? null,
          status: input.status ?? CUSTOM_GAME_STATUS.DRAFT,
          version: 1,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Failed to create custom game"
    );
  }

  async updateVersioned(
    id: number,
    userId: number,
    expectedVersion: number,
    input: UpdateCustomGameInput
  ): Promise<CustomGameEntity | null> {
    return await firstOrNull(
      this.db
        .update(customGames)
        .set({
          title: input.title,
          instruction: input.instruction,
          contentPack: input.contentPack,
          difficultyParams: input.difficultyParams,
          themeId: input.themeId,
          ageMin: input.ageMin,
          ageMax: input.ageMax,
          skillIds: input.skillIds,
          status: input.status,
          version: expectedVersion + 1,
          updatedAt: input.updatedAt ?? new Date(),
        })
        .where(
          and(
            eq(customGames.id, id),
            eq(customGames.userId, userId),
            eq(customGames.version, expectedVersion)
          )
        )
        .returning()
    );
  }

  async deleteForUser(id: number, userId: number): Promise<boolean> {
    const rows = await this.db
      .delete(customGames)
      .where(and(eq(customGames.id, id), eq(customGames.userId, userId)))
      .returning({ id: customGames.id });
    return rows.length > 0;
  }
}

export class AiCreditsRepository extends BaseRepository {
  async getBalance(userId: number): Promise<AiCreditBalanceEntity | null> {
    return (
      (await this.db.query.aiCreditBalance.findFirst({
        where: { userId },
      })) ?? null
    );
  }

  async sumLedgerDeltaForUser(userId: number): Promise<number> {
    const [row] = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${aiCreditLedger.delta}), 0)`,
      })
      .from(aiCreditLedger)
      .where(eq(aiCreditLedger.userId, userId));
    return Number(row?.total ?? 0);
  }

  async listLedgerByUser(
    userId: number,
    opts: {
      readonly page?: number;
      readonly limit?: number;
      readonly offset?: number;
    } = {}
  ): Promise<PaginatedResult<AiCreditLedgerEntity>> {
    const whereClause = eq(aiCreditLedger.userId, userId);
    const safeOffset =
      opts.offset === undefined
        ? undefined
        : Math.max(0, Math.trunc(opts.offset));
    return await runOffsetPagination({
      page: opts.page,
      limit: opts.limit,
      defaultLimit: 20,
      maxLimit: 100,
      countQuery: async () => {
        const [row] = await this.db
          .select({ total: COUNT_SQL })
          .from(aiCreditLedger)
          .where(whereClause);
        return Number(row?.total ?? 0);
      },
      rowsQuery: async (limit, offset) =>
        await this.db
          .select()
          .from(aiCreditLedger)
          .where(whereClause)
          .orderBy(desc(aiCreditLedger.createdAt), desc(aiCreditLedger.id))
          .limit(limit)
          .offset(safeOffset ?? offset),
    });
  }

  private async findSnap(
    tx: DbExecutor,
    userId: number,
    key?: string | null
  ): Promise<{
    readonly ledgerEntry: AiCreditLedgerEntity;
    readonly balance: number;
    readonly totalGranted: number;
  } | null> {
    if (!key) {
      return null;
    }
    const existing = await tx.query.aiCreditLedger.findFirst({
      where: { idempotencyKey: key },
    });
    if (!existing) {
      return null;
    }
    const bal = await tx.query.aiCreditBalance.findFirst({
      columns: { balance: true, totalGranted: true },
      where: { userId },
    });
    return {
      ledgerEntry: existing,
      balance: bal?.balance ?? 0,
      totalGranted: bal?.totalGranted ?? 0,
    };
  }

  private async insertLedgerInTx(
    tx: DbExecutor,
    input: CreateAiCreditLedgerInput,
    now: Date
  ): Promise<AiCreditLedgerEntity> {
    return await requireFirst(
      tx
        .insert(aiCreditLedger)
        .values({
          userId: input.userId,
          delta: input.delta,
          reason: input.reason,
          refType: input.refType ?? null,
          refId: input.refId ?? null,
          feature: input.feature ?? null,
          grantedByManagerId: input.grantedByManagerId ?? null,
          grantReason: input.grantReason ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Insert AI ledger failed"
    );
  }

  private async applyCreditAtomic(
    input: CreateAiCreditLedgerInput,
    grantedDelta: number,
    usedReduction: number,
    now: Date
  ): Promise<{
    readonly ledgerEntry: AiCreditLedgerEntity;
    readonly balance: number;
    readonly alreadyProcessed: boolean;
  }> {
    return await this.transaction(async (tx) => {
      const snap = await this.findSnap(tx, input.userId, input.idempotencyKey);
      if (snap) {
        return {
          ledgerEntry: snap.ledgerEntry,
          balance: snap.balance,
          alreadyProcessed: true,
        };
      }
      const totalUsedExpr =
        usedReduction > 0
          ? sql`CASE WHEN ${aiCreditBalance.totalUsed} >= ${usedReduction} THEN ${aiCreditBalance.totalUsed} - ${usedReduction} ELSE 0 END`
          : aiCreditBalance.totalUsed;
      const [updated] = await tx
        .update(aiCreditBalance)
        .set({
          balance: sql`${aiCreditBalance.balance} + ${input.delta}`,
          totalGranted: sql`${aiCreditBalance.totalGranted} + ${grantedDelta}`,
          totalUsed: totalUsedExpr,
          version: sql`${aiCreditBalance.version} + 1`,
          updatedAt: now,
        })
        .where(eq(aiCreditBalance.userId, input.userId))
        .returning();
      if (!updated) {
        await tx.insert(aiCreditBalance).values({
          userId: input.userId,
          balance: input.delta,
          totalGranted: grantedDelta,
          totalUsed: 0,
          version: 1,
          createdAt: now,
          updatedAt: now,
        });
      }
      return {
        balance: updated?.balance ?? input.delta,
        ledgerEntry: await this.insertLedgerInTx(tx, input, now),
        alreadyProcessed: false,
      };
    });
  }

  async grantCreditsAtomic(input: CreateAiCreditLedgerInput) {
    return await this.applyCreditAtomic(
      input,
      input.reason === AI_CREDIT_REASON.REFUND ? 0 : input.delta,
      0,
      input.createdAt ?? new Date()
    );
  }

  async refundCreditsAtomic(params: {
    readonly userId: number;
    readonly cost: number;
    readonly debitRefId?: string | null;
    readonly reason?: string | null;
    readonly idempotencyKey?: string | null;
    readonly now?: Date;
  }) {
    const entry: CreateAiCreditLedgerInput = {
      userId: params.userId,
      delta: params.cost,
      reason: AI_CREDIT_REASON.REFUND,
      refType: "refund",
      refId: params.debitRefId,
      grantReason: params.reason ?? "Hoàn trả do lỗi hệ thống AI",
      idempotencyKey: params.idempotencyKey,
    };
    const res = await this.applyCreditAtomic(
      entry,
      0,
      params.cost,
      params.now ?? new Date()
    );
    return {
      newBalance: res.balance,
      ledgerEntry: res.ledgerEntry,
      alreadyProcessed: res.alreadyProcessed,
    };
  }

  async debitCreditsAtomic(params: {
    readonly userId: number;
    readonly cost: number;
    readonly feature: string;
    readonly refType?: string | null;
    readonly refId?: string | null;
    readonly idempotencyKey?: string | null;
    readonly now?: Date;
  }): Promise<AiDebitResult> {
    const now = params.now ?? new Date();
    return await this.transaction(async (tx) => {
      const snap = await this.findSnap(
        tx,
        params.userId,
        params.idempotencyKey
      );
      if (snap) {
        return {
          ok: true,
          alreadyProcessed: true,
          prevBalance: snap.balance,
          newBalance: snap.balance,
          totalGranted: snap.totalGranted,
          ledgerEntry: snap.ledgerEntry,
        };
      }
      const [updated] = await tx
        .update(aiCreditBalance)
        .set({
          balance: sql`${aiCreditBalance.balance} - ${params.cost}`,
          totalUsed: sql`${aiCreditBalance.totalUsed} + ${params.cost}`,
          version: sql`${aiCreditBalance.version} + 1`,
          updatedAt: now,
        })
        .where(
          and(
            eq(aiCreditBalance.userId, params.userId),
            gte(aiCreditBalance.balance, params.cost)
          )
        )
        .returning();
      if (!updated) {
        const bal = await tx.query.aiCreditBalance.findFirst({
          columns: { balance: true },
          where: { userId: params.userId },
        });
        return { ok: false, currentBalance: bal?.balance ?? 0 };
      }
      const ledgerEntry = await this.insertLedgerInTx(
        tx,
        {
          userId: params.userId,
          feature: params.feature,
          refType: params.refType,
          refId: params.refId,
          idempotencyKey: params.idempotencyKey,
          delta: -params.cost,
          reason: AI_CREDIT_REASON.USAGE,
        },
        now
      );
      return {
        ok: true,
        alreadyProcessed: false,
        prevBalance: updated.balance + params.cost,
        newBalance: updated.balance,
        totalGranted: updated.totalGranted,
        ledgerEntry,
      };
    });
  }

  async insertUsageLog(
    input: CreateAiUsageLogInput
  ): Promise<AiUsageLogEntity> {
    const now = input.createdAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(aiUsageLog)
        .values({
          userId: input.userId,
          feature: input.feature,
          creditsSpent: input.creditsSpent,
          model: input.model,
          promptVersion: input.promptVersion,
          inputTokens: input.inputTokens,
          outputTokens: input.outputTokens,
          costUsdMicros: input.costUsdMicros,
          moderationPassed: input.moderationPassed,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Insert AI usage log failed"
    );
  }
}

export class ExportsRepository extends BaseRepository {
  async createJob(input: {
    readonly userId: number;
    readonly kind: ExportJobKind;
    readonly refId: string;
    readonly createdAt?: Date;
  }): Promise<ExportJobEntity> {
    const now = input.createdAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(exportJobs)
        .values({
          userId: input.userId,
          kind: input.kind,
          refId: input.refId,
          status: EXPORT_JOB_STATUS.QUEUED,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Create export job failed"
    );
  }

  async findByUuid(
    uuid: string,
    userId?: number
  ): Promise<ExportJobEntity | null> {
    return (
      (await this.db.query.exportJobs.findFirst({
        where: {
          uuid,
          ...(userId === undefined ? {} : { userId }),
        },
      })) ?? null
    );
  }

  async countMonthlyNonFailedByUser(
    userId: number,
    monthStart: Date | string
  ): Promise<number> {
    const [row] = await this.db
      .select({ total: COUNT_SQL })
      .from(exportJobs)
      .where(
        and(
          eq(exportJobs.userId, userId),
          ne(exportJobs.status, EXPORT_JOB_STATUS.FAILED),
          gte(exportJobs.createdAt, toDate(monthStart))
        )
      );
    return Number(row?.total ?? 0);
  }

  private async updateJob(
    id: number,
    patch: Partial<typeof exportJobs.$inferInsert>,
    updatedAt?: Date
  ): Promise<ExportJobEntity | null> {
    return await firstOrNull(
      this.db
        .update(exportJobs)
        .set({ ...patch, updatedAt: updatedAt ?? new Date() })
        .where(eq(exportJobs.id, id))
        .returning()
    );
  }

  async markProcessing(
    id: number,
    updatedAt?: Date
  ): Promise<ExportJobEntity | null> {
    return await this.updateJob(
      id,
      { status: EXPORT_JOB_STATUS.PROCESSING },
      updatedAt
    );
  }

  async markDone(
    id: number,
    input: {
      readonly filePath: string;
      readonly pageCount: number;
      readonly expiresAt: Date | string;
      readonly updatedAt?: Date;
    }
  ): Promise<ExportJobEntity | null> {
    return await this.updateJob(
      id,
      {
        status: EXPORT_JOB_STATUS.DONE,
        filePath: input.filePath,
        pageCount: input.pageCount,
        expiresAt: toDate(input.expiresAt),
      },
      input.updatedAt
    );
  }

  async markFailed(
    id: number,
    error: string,
    updatedAt?: Date
  ): Promise<ExportJobEntity | null> {
    return await this.updateJob(
      id,
      { status: EXPORT_JOB_STATUS.FAILED, error },
      updatedAt
    );
  }

  async listExpiredWithFiles(
    now: Date | string = new Date(),
    limit = 500
  ): Promise<ExportJobEntity[]> {
    const deadline = toDate(now);
    const rows = await this.db
      .select()
      .from(exportJobs)
      .where(
        and(
          lte(exportJobs.expiresAt, deadline),
          isNotNull(exportJobs.filePath),
          ne(exportJobs.filePath, "")
        )
      )
      .limit(clampLimit(limit, 500, 1000));
    return rows;
  }

  async clearFilePaths(
    ids: readonly number[],
    updatedAt?: Date
  ): Promise<number> {
    const uniqueIds = uniq(ids);
    if (uniqueIds.length === 0) {
      return 0;
    }
    const rows = await this.db
      .update(exportJobs)
      .set({ filePath: null, updatedAt: updatedAt ?? new Date() })
      .where(inArray(exportJobs.id, uniqueIds))
      .returning({ id: exportJobs.id });
    return rows.length;
  }
}
