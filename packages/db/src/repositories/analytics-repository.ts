import { and, desc, eq, gt, gte, lt, lte, sql } from "drizzle-orm";
import { PLAY_COMPLETION_STATUS } from "#src/constants/learning-enums";
import { BaseRepository } from "#src/repositories/base-repository";
import {
  andConditions,
  clampLimit,
  requireFirst,
  toDate,
  toNullableDate,
} from "#src/repositories/utils";
import {
  childDailyStats,
  childSessionSummaries,
  type gameLevels,
  levelDailyStats,
  skillDailyStats,
} from "#src/schema/index";

export type RollupCompletionStatus =
  typeof childSessionSummaries.$inferSelect.completionStatus;

export type ChildSessionSummaryEntity =
  typeof childSessionSummaries.$inferSelect;
export type ChildDailyStatEntity = typeof childDailyStats.$inferSelect;
export type LevelDailyStatEntity = typeof levelDailyStats.$inferSelect;
export type SkillDailyStatEntity = typeof skillDailyStats.$inferSelect;

type GameLevelEntity = typeof gameLevels.$inferSelect;

export type ChildSessionSummaryWithLevelEntity = ChildSessionSummaryEntity & {
  readonly gameLevel: GameLevelEntity;
};

export interface UpsertChildSessionSummaryInput {
  readonly childProfileId: number;
  readonly sessionUuid: string;
  readonly gameLevelId: number;
  readonly templateCode: string;
  readonly completionStatus: RollupCompletionStatus;
  readonly score: number;
  readonly durationSeconds: number;
  readonly starsEarned: number;
  readonly hintsUsed: number;
  readonly retriesCount: number;
  readonly completedAt?: Date | string | null;
  readonly updatedAt?: Date;
}

export interface UpsertChildDailyStatInput {
  readonly childProfileId: number;
  readonly dateIct: string;
  readonly sessionsCount: number;
  readonly totalPlayTimeSeconds: number;
  readonly levelsAttempted: number;
  readonly levelsCompleted: number;
  readonly skillsTouched: number;
  readonly starsEarned: number;
  readonly extraTimeGrantedMinutes?: number;
  readonly updatedAt?: Date;
}

export interface UpsertLevelDailyStatInput {
  readonly levelCode: string;
  readonly dateIct: string;
  readonly playsCount: number;
  readonly completionsCount: number;
  readonly abandonedCount: number;
  readonly avgDurationSeconds: number;
  readonly avgHintsUsed: number;
  readonly updatedAt?: Date;
}

export interface UpsertSkillDailyStatInput {
  readonly skillId: number;
  readonly dateIct: string;
  readonly exposureCount: number;
  readonly avgAccuracyPercent: number;
  readonly updatedAt?: Date;
}

export interface LevelDailyAggregate {
  readonly levelCode: string;
  readonly playsCount: number;
  readonly completionsCount: number;
  readonly abandonedCount: number;
  readonly avgDurationSeconds: number;
}

export interface SkillDailyAggregate {
  readonly skillId: number;
  readonly exposureCount: number;
  readonly completions: number;
}

export class AnalyticsRollupRepository extends BaseRepository {
  async upsertSessionSummary(
    input: UpsertChildSessionSummaryInput
  ): Promise<ChildSessionSummaryEntity> {
    const now = input.updatedAt ?? new Date();
    const completedAt = toNullableDate(input.completedAt) ?? now;
    return await requireFirst(
      this.db
        .insert(childSessionSummaries)
        .values({
          childProfileId: input.childProfileId,
          sessionUuid: input.sessionUuid,
          gameLevelId: input.gameLevelId,
          templateCode: input.templateCode,
          completionStatus: input.completionStatus,
          score: input.score,
          durationSeconds: input.durationSeconds,
          starsEarned: input.starsEarned,
          hintsUsed: input.hintsUsed,
          retriesCount: input.retriesCount,
          completedAt,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            childSessionSummaries.childProfileId,
            childSessionSummaries.sessionUuid,
          ],
          set: {
            completionStatus: input.completionStatus,
            score: input.score,
            durationSeconds: input.durationSeconds,
            starsEarned: input.starsEarned,
            hintsUsed: input.hintsUsed,
            retriesCount: input.retriesCount,
            completedAt,
            updatedAt: now,
          },
        })
        .returning(),
      "Failed to upsert child session summary"
    );
  }

  async listSummariesForChildSince(
    childProfileId: number,
    since: Date | string
  ): Promise<ChildSessionSummaryEntity[]> {
    return await this.db.query.childSessionSummaries.findMany({
      where: {
        childProfileId,
        createdAt: { gte: toDate(since) },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findLatestSessionLevelForChild(
    childProfileId: number
  ): Promise<ChildSessionSummaryWithLevelEntity | null> {
    return (
      (await this.db.query.childSessionSummaries.findFirst({
        where: { childProfileId },
        with: { gameLevel: true },
        orderBy: { completedAt: "desc" },
      })) ?? null
    );
  }

  async getChildDailyStat(
    childProfileId: number,
    dateIct: string
  ): Promise<ChildDailyStatEntity | null> {
    return (
      (await this.db.query.childDailyStats.findFirst({
        where: { childProfileId, dateIct },
      })) ?? null
    );
  }

  async listChildDailyStatsRange(
    childProfileId: number,
    fromDateIct: string,
    toDateIct: string
  ): Promise<ChildDailyStatEntity[]> {
    return await this.db.query.childDailyStats.findMany({
      where: {
        childProfileId,
        dateIct: { gte: fromDateIct, lte: toDateIct },
      },
      orderBy: { dateIct: "asc" },
    });
  }

  async listChildDailyStatsSince(
    childProfileId: number,
    sinceDateIct: string
  ): Promise<ChildDailyStatEntity[]> {
    return await this.db.query.childDailyStats.findMany({
      where: {
        childProfileId,
        dateIct: { gte: sinceDateIct },
      },
      orderBy: { dateIct: "asc" },
    });
  }

  async listDistinctPlayDatesForChild(
    childProfileId: number
  ): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ dateIct: childDailyStats.dateIct })
      .from(childDailyStats)
      .where(eq(childDailyStats.childProfileId, childProfileId));
    return rows.map((row) => row.dateIct);
  }

  async upsertChildDailyStatsBatch(
    rows: readonly UpsertChildDailyStatInput[],
    batchSize = 500
  ): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    const defaultNow = new Date();
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const now = batch[0]?.updatedAt ?? defaultNow;
      await this.db
        .insert(childDailyStats)
        .values(
          batch.map((row) => ({
            childProfileId: row.childProfileId,
            dateIct: row.dateIct,
            sessionsCount: row.sessionsCount,
            totalPlayTimeSeconds: row.totalPlayTimeSeconds,
            levelsAttempted: row.levelsAttempted,
            levelsCompleted: row.levelsCompleted,
            skillsTouched: row.skillsTouched,
            starsEarned: row.starsEarned,
            extraTimeGrantedMinutes: row.extraTimeGrantedMinutes ?? 0,
            createdAt: row.updatedAt ?? now,
            updatedAt: row.updatedAt ?? now,
          }))
        )
        .onConflictDoUpdate({
          target: [childDailyStats.childProfileId, childDailyStats.dateIct],
          set: {
            sessionsCount: sql`excluded.sessions_count`,
            totalPlayTimeSeconds: sql`excluded.total_play_time_seconds`,
            levelsAttempted: sql`excluded.levels_attempted`,
            levelsCompleted: sql`excluded.levels_completed`,
            starsEarned: sql`excluded.stars_earned`,
            updatedAt: now,
          },
        });
    }
    return rows.length;
  }

  async incrementAbandonedPlayStats(
    childProfileId: number,
    dateIct: string,
    playTimeSec: number,
    updatedAt?: Date
  ): Promise<void> {
    const now = updatedAt ?? new Date();
    await this.db
      .insert(childDailyStats)
      .values({
        childProfileId,
        dateIct,
        totalPlayTimeSeconds: playTimeSec,
        levelsAttempted: 1,
        levelsCompleted: 0,
        starsEarned: 0,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [childDailyStats.childProfileId, childDailyStats.dateIct],
        set: {
          totalPlayTimeSeconds: sql`${childDailyStats.totalPlayTimeSeconds} + ${playTimeSec}`,
          levelsAttempted: sql`${childDailyStats.levelsAttempted} + 1`,
          updatedAt: now,
        },
      });
  }

  async grantExtraTimeMinutes(
    childProfileId: number,
    dateIct: string,
    minutes: number,
    updatedAt?: Date
  ): Promise<ChildDailyStatEntity> {
    const now = updatedAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(childDailyStats)
        .values({
          childProfileId,
          dateIct,
          totalPlayTimeSeconds: 0,
          extraTimeGrantedMinutes: minutes,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [childDailyStats.childProfileId, childDailyStats.dateIct],
          set: {
            extraTimeGrantedMinutes: sql`${childDailyStats.extraTimeGrantedMinutes} + ${minutes}`,
            updatedAt: now,
          },
        })
        .returning(),
      "Failed to grant extra play time"
    );
  }

  async countActiveChildrenBetween(
    fromDate: Date | string,
    toDateValue?: Date | string
  ): Promise<number> {
    const from = toDate(fromDate);
    const to = toNullableDate(toDateValue);
    const whereClause = andConditions([
      gte(childDailyStats.updatedAt, from),
      to === null ? null : lt(childDailyStats.updatedAt, to),
    ]);
    const [row] = await this.db
      .select({
        total: sql<number>`COUNT(DISTINCT ${childDailyStats.childProfileId})`,
      })
      .from(childDailyStats)
      .where(whereClause);
    return Number(row?.total ?? 0);
  }

  async findLatestChildStatUpdatedAt(): Promise<Date | null> {
    const row = await this.db.query.childDailyStats.findFirst({
      columns: { updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    return row?.updatedAt ?? null;
  }

  async listLevelDailyStats(
    filter: {
      readonly fromDateIct?: string;
      readonly toDateIct?: string;
      readonly limit?: number;
    } = {}
  ): Promise<LevelDailyStatEntity[]> {
    const whereClause = andConditions([
      filter.fromDateIct === undefined
        ? null
        : gte(levelDailyStats.dateIct, filter.fromDateIct),
      filter.toDateIct === undefined
        ? null
        : lte(levelDailyStats.dateIct, filter.toDateIct),
    ]);
    return await this.db
      .select()
      .from(levelDailyStats)
      .where(whereClause)
      .orderBy(desc(levelDailyStats.dateIct))
      .limit(clampLimit(filter.limit, 50, 100));
  }

  async sumPlaysByLevelCode(): Promise<Map<string, number>> {
    const rows = await this.db
      .select({
        levelCode: levelDailyStats.levelCode,
        totalPlays: sql<number>`COALESCE(SUM(${levelDailyStats.playsCount}), 0)`,
      })
      .from(levelDailyStats)
      .groupBy(levelDailyStats.levelCode);

    return new Map(rows.map((row) => [row.levelCode, Number(row.totalPlays)]));
  }

  async countHighDropLevels(threshold = 0.4): Promise<number> {
    const [row] = await this.db
      .select({
        total: sql<number>`COUNT(DISTINCT ${levelDailyStats.levelCode})`,
      })
      .from(levelDailyStats)
      .where(
        and(
          gt(levelDailyStats.playsCount, 0),
          sql`(${levelDailyStats.abandonedCount} * 1.0) / ${levelDailyStats.playsCount} > ${threshold}`
        )
      );
    return Number(row?.total ?? 0);
  }

  async findLatestLevelStatUpdatedAt(): Promise<Date | null> {
    const row = await this.db.query.levelDailyStats.findFirst({
      columns: { updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    return row?.updatedAt ?? null;
  }

  async computeLevelDailyAggregates(
    startDate: Date | string,
    endDate: Date | string
  ): Promise<LevelDailyAggregate[]> {
    const sessions = await this.db.query.playSessions.findMany({
      columns: {
        completionStatus: true,
        durationSeconds: true,
      },
      where: {
        startedAt: { gte: toDate(startDate), lt: toDate(endDate) },
      },
      with: {
        gameLevel: {
          columns: { code: true },
        },
      },
    });

    interface Accumulator {
      playsCount: number;
      completionsCount: number;
      abandonedCount: number;
      completedDurationSum: number;
    }

    const byCode = new Map<string, Accumulator>();
    for (const session of sessions) {
      const code = session.gameLevel.code;
      const acc = byCode.get(code) ?? {
        playsCount: 0,
        completionsCount: 0,
        abandonedCount: 0,
        completedDurationSum: 0,
      };
      acc.playsCount += 1;
      if (session.completionStatus === PLAY_COMPLETION_STATUS.COMPLETED) {
        acc.completionsCount += 1;
        acc.completedDurationSum += session.durationSeconds ?? 0;
      } else if (
        session.completionStatus === PLAY_COMPLETION_STATUS.ABANDONED
      ) {
        acc.abandonedCount += 1;
      }
      byCode.set(code, acc);
    }

    return Array.from(byCode.entries()).map(([levelCode, acc]) => ({
      levelCode,
      playsCount: acc.playsCount,
      completionsCount: acc.completionsCount,
      abandonedCount: acc.abandonedCount,
      avgDurationSeconds:
        acc.completionsCount > 0
          ? Math.round(acc.completedDurationSum / acc.completionsCount)
          : 0,
    }));
  }

  async upsertLevelDailyStatsBatch(
    rows: readonly UpsertLevelDailyStatInput[],
    batchSize = 500
  ): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    const defaultNow = new Date();
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const now = batch[0]?.updatedAt ?? defaultNow;
      await this.db
        .insert(levelDailyStats)
        .values(
          batch.map((row) => ({
            levelCode: row.levelCode,
            dateIct: row.dateIct,
            playsCount: row.playsCount,
            completionsCount: row.completionsCount,
            abandonedCount: row.abandonedCount,
            avgDurationSeconds: row.avgDurationSeconds,
            avgHintsUsed: row.avgHintsUsed,
            createdAt: row.updatedAt ?? now,
            updatedAt: row.updatedAt ?? now,
          }))
        )
        .onConflictDoUpdate({
          target: [levelDailyStats.levelCode, levelDailyStats.dateIct],
          set: {
            playsCount: sql`excluded.plays_count`,
            completionsCount: sql`excluded.completions_count`,
            abandonedCount: sql`excluded.abandoned_count`,
            avgDurationSeconds: sql`excluded.avg_duration_seconds`,
            updatedAt: now,
          },
        });
    }
    return rows.length;
  }

  async computeSkillDailyAggregates(
    startDate: Date | string,
    endDate: Date | string
  ): Promise<SkillDailyAggregate[]> {
    const sessions = await this.db.query.playSessions.findMany({
      columns: { completionStatus: true },
      where: {
        childProfileId: { isNotNull: true },
        startedAt: { gte: toDate(startDate), lt: toDate(endDate) },
      },
      with: {
        gameLevel: {
          columns: { id: true },
          with: {
            skillMaps: {
              columns: { skillId: true },
            },
          },
        },
      },
    });

    interface SkillAccumulator {
      exposureCount: number;
      completions: number;
    }

    const bySkill = new Map<number, SkillAccumulator>();
    for (const session of sessions) {
      const isCompleted =
        session.completionStatus === PLAY_COMPLETION_STATUS.COMPLETED;
      for (const skillMap of session.gameLevel.skillMaps) {
        const acc = bySkill.get(skillMap.skillId) ?? {
          exposureCount: 0,
          completions: 0,
        };
        acc.exposureCount += 1;
        if (isCompleted) {
          acc.completions += 1;
        }
        bySkill.set(skillMap.skillId, acc);
      }
    }

    return Array.from(bySkill.entries()).map(([skillId, acc]) => ({
      skillId,
      exposureCount: acc.exposureCount,
      completions: acc.completions,
    }));
  }

  async upsertSkillDailyStatsBatch(
    rows: readonly UpsertSkillDailyStatInput[],
    batchSize = 500
  ): Promise<number> {
    if (rows.length === 0) {
      return 0;
    }
    const defaultNow = new Date();
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const now = batch[0]?.updatedAt ?? defaultNow;
      await this.db
        .insert(skillDailyStats)
        .values(
          batch.map((row) => ({
            skillId: row.skillId,
            dateIct: row.dateIct,
            exposureCount: row.exposureCount,
            avgAccuracyPercent: row.avgAccuracyPercent,
            createdAt: row.updatedAt ?? now,
            updatedAt: row.updatedAt ?? now,
          }))
        )
        .onConflictDoUpdate({
          target: [skillDailyStats.skillId, skillDailyStats.dateIct],
          set: {
            exposureCount: sql`excluded.exposure_count`,
            avgAccuracyPercent: sql`excluded.avg_accuracy_percent`,
            updatedAt: now,
          },
        });
    }
    return rows.length;
  }
}
