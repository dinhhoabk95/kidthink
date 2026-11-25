import { and, eq, gte, inArray, sql } from "drizzle-orm";
import type { JsonRecord } from "#src/constants/json";
import {
  type AccessTier,
  PLAY_COMPLETION_STATUS,
} from "#src/constants/learning-enums";
import { BaseRepository } from "#src/repositories/base-repository";
import {
  clampLimit,
  firstOrNull,
  requireFirst,
  toDate,
  toNullableDate,
  uniq,
} from "#src/repositories/utils";
import {
  childBadges,
  type gameLevels,
  masteryState,
  playSessions,
  type skills,
  telemetryEvents,
} from "#src/schema/index";

export type PlayAccessTier = AccessTier;

export type PlaySessionEntity = typeof playSessions.$inferSelect;
export type MasteryStateEntity = typeof masteryState.$inferSelect;
export type ChildBadgeEntity = typeof childBadges.$inferSelect;
export type TelemetryEventEntity = typeof telemetryEvents.$inferSelect;

type GameLevelEntity = typeof gameLevels.$inferSelect;
type SkillEntity = typeof skills.$inferSelect;

export type PlaySessionWithGameLevelEntity = PlaySessionEntity & {
  readonly gameLevel: GameLevelEntity;
};

export type MasteryWithSkillEntity = MasteryStateEntity & {
  readonly skill: SkillEntity;
};

export interface StartPlaySessionInput {
  readonly sessionUuid?: string;
  readonly childProfileId?: number | null;
  readonly guestDeviceId?: string | null;
  readonly gameLevelId: number;
  readonly templateCode: string;
  readonly isPreview?: boolean;
  readonly accessTierAtStart?: PlayAccessTier | null;
  readonly layoutSeed?: number | null;
  readonly startedAt?: Date;
}

export interface CompletePlaySessionInput {
  readonly completionStatus?:
    | typeof PLAY_COMPLETION_STATUS.COMPLETED
    | typeof PLAY_COMPLETION_STATUS.ABANDONED;
  readonly starsEarned?: number;
  readonly score?: number;
  readonly durationSeconds?: number;
  readonly completedAt?: Date;
}

export interface UpsertMasteryInput {
  readonly childProfileId: number;
  readonly skillId: number;
  readonly pLearn: number | string;
  readonly emaCorrect: number | string;
  readonly hintRate?: number | string;
  readonly attemptsTotal: number;
  readonly bestPLearn: number | string;
  readonly paramsVersion?: string;
  readonly lastSeenAt?: Date | string | null;
  readonly updatedAt?: Date;
}

export interface CreateTelemetryEventInput {
  readonly sessionUuid: string;
  readonly seq: number;
  readonly childUuid?: string | null;
  readonly gameLevelId?: number | null;
  readonly templateCode?: string | null;
  readonly eventName: string;
  readonly occurredAtMs?: number | null;
  readonly payload?: JsonRecord | null;
  readonly clientTimestamp?: Date | string | null;
  readonly ingestedAt?: Date;
}

export interface ChildLevelPlayStat {
  readonly bestStars: number;
  readonly playCount: number;
}

export interface ChildSessionAggregate {
  readonly totalSessions: number;
  readonly totalMinutes: number;
  readonly completedSessions: number;
}

const COUNT_SQL = sql<number>`COUNT(*)`;

function formatDecimal4(value: number | string): string {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num.toFixed(4) : "0.0000";
}

function resolveOwnerFilter(
  childId: number | null,
  guestId?: string
):
  | { readonly childProfileId: number }
  | { readonly guestDeviceId: string }
  | null {
  if (childId !== null) {
    return { childProfileId: childId };
  }
  return guestId ? { guestDeviceId: guestId } : null;
}

export class PlaySessionsRepository extends BaseRepository {
  async startSession(input: StartPlaySessionInput): Promise<PlaySessionEntity> {
    const now = input.startedAt ?? new Date();
    return await requireFirst(
      this.db
        .insert(playSessions)
        .values({
          ...(input.sessionUuid ? { sessionUuid: input.sessionUuid } : {}),
          childProfileId: input.childProfileId ?? null,
          guestDeviceId: input.guestDeviceId ?? null,
          gameLevelId: input.gameLevelId,
          templateCode: input.templateCode,
          isPreview: input.isPreview ?? false,
          completionStatus: PLAY_COMPLETION_STATUS.IN_PROGRESS,
          accessTierAtStart: input.accessTierAtStart ?? null,
          layoutSeed: input.layoutSeed ?? null,
          starsEarned: 0,
          score: 0,
          durationSeconds: 0,
          startedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      "Failed to start play session"
    );
  }

  private async updateSessionWhere(
    condition: ReturnType<typeof and>,
    patch: Partial<typeof playSessions.$inferInsert>,
    updatedAt?: Date
  ): Promise<PlaySessionEntity | null> {
    return await firstOrNull(
      this.db
        .update(playSessions)
        .set({ ...patch, updatedAt: updatedAt ?? new Date() })
        .where(condition)
        .returning()
    );
  }

  async completeSession(
    sessionUuid: string,
    input: CompletePlaySessionInput
  ): Promise<PlaySessionEntity | null> {
    const now = input.completedAt ?? new Date();
    return await this.updateSessionWhere(
      and(
        eq(playSessions.sessionUuid, sessionUuid),
        eq(playSessions.completionStatus, PLAY_COMPLETION_STATUS.IN_PROGRESS)
      ),
      {
        completionStatus:
          input.completionStatus ?? PLAY_COMPLETION_STATUS.COMPLETED,
        starsEarned: input.starsEarned ?? 0,
        score: input.score ?? 0,
        durationSeconds: input.durationSeconds ?? 0,
        completedAt: now,
      },
      now
    );
  }

  async abandonSession(
    sessionUuid: string,
    durationSeconds?: number,
    updatedAt?: Date
  ): Promise<PlaySessionEntity | null> {
    return await this.updateSessionWhere(
      and(
        eq(playSessions.sessionUuid, sessionUuid),
        eq(playSessions.completionStatus, PLAY_COMPLETION_STATUS.IN_PROGRESS)
      ),
      {
        completionStatus: PLAY_COMPLETION_STATUS.ABANDONED,
        ...(durationSeconds === undefined ? {} : { durationSeconds }),
      },
      updatedAt
    );
  }

  async abandonExpiredById(
    sessionId: number,
    durationSeconds: number,
    updatedAt?: Date
  ): Promise<PlaySessionEntity | null> {
    return await this.updateSessionWhere(
      and(
        eq(playSessions.id, sessionId),
        eq(playSessions.completionStatus, PLAY_COMPLETION_STATUS.IN_PROGRESS)
      ),
      {
        completionStatus: PLAY_COMPLETION_STATUS.ABANDONED,
        durationSeconds,
      },
      updatedAt
    );
  }

  async abandonActiveForChild(
    childProfileId: number,
    updatedAt?: Date
  ): Promise<number> {
    const now = updatedAt ?? new Date();
    const updated = await this.db
      .update(playSessions)
      .set({
        completionStatus: PLAY_COMPLETION_STATUS.ABANDONED,
        updatedAt: now,
      })
      .where(
        and(
          eq(playSessions.childProfileId, childProfileId),
          eq(playSessions.completionStatus, PLAY_COMPLETION_STATUS.IN_PROGRESS)
        )
      )
      .returning({ id: playSessions.id });
    return updated.length;
  }

  async updateSessionDuration(
    sessionUuid: string,
    durationSeconds: number,
    updatedAt?: Date
  ): Promise<PlaySessionEntity | null> {
    return await firstOrNull(
      this.db
        .update(playSessions)
        .set({ durationSeconds, updatedAt: updatedAt ?? new Date() })
        .where(eq(playSessions.sessionUuid, sessionUuid))
        .returning()
    );
  }

  async findByUuid(sessionUuid: string): Promise<PlaySessionEntity | null> {
    return (
      (await this.db.query.playSessions.findFirst({
        where: { sessionUuid },
      })) ?? null
    );
  }

  async findByUuids(
    sessionUuids: readonly string[]
  ): Promise<PlaySessionEntity[]> {
    const uniqueUuids = uniq(sessionUuids);
    if (uniqueUuids.length === 0) {
      return [];
    }
    return await this.db.query.playSessions.findMany({
      where: { sessionUuid: { in: uniqueUuids } },
    });
  }

  async findLatestInProgressForChild(
    childProfileId: number
  ): Promise<PlaySessionWithGameLevelEntity | null> {
    return (
      (await this.db.query.playSessions.findFirst({
        where: {
          childProfileId,
          completionStatus: PLAY_COMPLETION_STATUS.IN_PROGRESS,
        },
        with: { gameLevel: true },
        orderBy: { startedAt: "desc" },
      })) ?? null
    );
  }

  async listByChildSince(
    childProfileId: number,
    since: Date | string
  ): Promise<PlaySessionEntity[]> {
    return await this.db.query.playSessions.findMany({
      where: {
        childProfileId,
        startedAt: { gte: toDate(since) },
      },
      orderBy: { startedAt: "asc" },
    });
  }

  async listPlayedLevelCodesForChild(
    childProfileId: number
  ): Promise<string[]> {
    const rows = await this.db.query.playSessions.findMany({
      columns: { id: true },
      where: { childProfileId },
      with: { gameLevel: { columns: { code: true } } },
      orderBy: { startedAt: "desc" },
    });
    return rows.map((row) => row.gameLevel.code);
  }

  async listCompletedLevelCodes(
    childProfileId: number | null,
    guestDeviceId?: string,
    filterLevelCodes?: readonly string[]
  ): Promise<string[]> {
    const owner = resolveOwnerFilter(childProfileId, guestDeviceId);
    const filter = filterLevelCodes ? uniq(filterLevelCodes) : null;
    if (!owner || (filter && filter.length === 0)) {
      return [];
    }
    const rows = await this.db.query.playSessions.findMany({
      columns: { id: true },
      where: {
        completionStatus: PLAY_COMPLETION_STATUS.COMPLETED,
        isPreview: false,
        ...owner,
        ...(filter ? { gameLevel: { code: { in: filter } } } : {}),
      },
      with: { gameLevel: { columns: { code: true } } },
    });
    return uniq(rows.map((row) => row.gameLevel.code));
  }

  /**
   * Id phiên không-preview mới nhất của chủ thể trên một tập mã level
   * (`BR-CIG-16`: so thứ tự phiên bằng `id` tự tăng, không so đồng hồ).
   */
  async findLatestSessionIdForLevelCodes(
    childProfileId: number | null,
    guestDeviceId: string | undefined,
    levelCodes: readonly string[],
    options: { readonly completedOnly?: boolean } = {}
  ): Promise<number | null> {
    const owner = resolveOwnerFilter(childProfileId, guestDeviceId);
    const codes = uniq(levelCodes);
    if (!owner || codes.length === 0) {
      return null;
    }
    const row = await this.db.query.playSessions.findFirst({
      columns: { id: true },
      where: {
        isPreview: false,
        ...owner,
        ...(options.completedOnly
          ? { completionStatus: PLAY_COMPLETION_STATUS.COMPLETED }
          : {}),
        gameLevel: { code: { in: codes } },
      },
      orderBy: { id: "desc" },
    });
    return row?.id ?? null;
  }

  async listLevelStatusesForChild(
    childProfileId: number
  ): Promise<PlaySessionWithGameLevelEntity[]> {
    return await this.db.query.playSessions.findMany({
      where: { childProfileId, isPreview: false },
      with: { gameLevel: true },
    });
  }

  async mapLevelStatsForChild(
    childProfileId: number,
    levelIds: readonly number[]
  ): Promise<Map<number, ChildLevelPlayStat>> {
    const uniqueIds = uniq(levelIds);
    if (uniqueIds.length === 0) {
      return new Map();
    }
    const rows = await this.db
      .select({
        gameLevelId: playSessions.gameLevelId,
        bestStars: sql<number>`COALESCE(MAX(${playSessions.starsEarned}), 0)`,
        playCount: sql<number>`COUNT(${playSessions.id})`,
      })
      .from(playSessions)
      .where(
        and(
          eq(playSessions.childProfileId, childProfileId),
          inArray(playSessions.gameLevelId, uniqueIds)
        )
      )
      .groupBy(playSessions.gameLevelId);
    return new Map(
      rows.map((row) => [
        row.gameLevelId,
        { bestStars: Number(row.bestStars), playCount: Number(row.playCount) },
      ])
    );
  }

  async getChildAggregateSince(
    childProfileId: number,
    since: Date | string
  ): Promise<ChildSessionAggregate> {
    const [row] = await this.db
      .select({
        totalSessions: COUNT_SQL,
        totalSeconds: sql<number>`COALESCE(SUM(${playSessions.durationSeconds}), 0)`,
        completedSessions: sql<number>`COALESCE(SUM(CASE WHEN ${playSessions.completionStatus} = ${PLAY_COMPLETION_STATUS.COMPLETED} THEN 1 ELSE 0 END), 0)`,
      })
      .from(playSessions)
      .where(
        and(
          eq(playSessions.childProfileId, childProfileId),
          gte(playSessions.startedAt, toDate(since))
        )
      );
    return {
      totalSessions: Number(row?.totalSessions ?? 0),
      totalMinutes: Math.trunc(Number(row?.totalSeconds ?? 0) / 60),
      completedSessions: Number(row?.completedSessions ?? 0),
    };
  }

  async listStaleInProgress(
    beforeDate: Date | string,
    limit = 100
  ): Promise<PlaySessionEntity[]> {
    return await this.db.query.playSessions.findMany({
      where: {
        completionStatus: PLAY_COMPLETION_STATUS.IN_PROGRESS,
        startedAt: { lte: toDate(beforeDate) },
      },
      limit: clampLimit(limit, 100, 500),
    });
  }

  async listChildSessionsInWindow(
    startDate: Date | string,
    endDate: Date | string,
    childProfileId?: number
  ): Promise<PlaySessionEntity[]> {
    return await this.db.query.playSessions.findMany({
      where: {
        childProfileId:
          childProfileId === undefined ? { isNotNull: true } : childProfileId,
        startedAt: { gte: toDate(startDate), lt: toDate(endDate) },
      },
    });
  }

  async countRecentDistinctChildren(since: Date | string): Promise<number> {
    return (await this.getWindowActivitySummary(since)).activeChildren;
  }

  async getWindowActivitySummary(since: Date | string): Promise<{
    readonly activeChildren: number;
    readonly totalSessions: number;
  }> {
    const [row] = await this.db
      .select({
        activeChildren: sql<number>`COUNT(DISTINCT ${playSessions.childProfileId})`,
        totalSessions: COUNT_SQL,
      })
      .from(playSessions)
      .where(gte(playSessions.startedAt, toDate(since)));
    return {
      activeChildren: Number(row?.activeChildren ?? 0),
      totalSessions: Number(row?.totalSessions ?? 0),
    };
  }
}

export class MasteryRepository extends BaseRepository {
  async getForChildSkill(
    childProfileId: number,
    skillId: number
  ): Promise<MasteryStateEntity | null> {
    return (
      (await this.db.query.masteryState.findFirst({
        where: { childProfileId, skillId },
      })) ?? null
    );
  }

  async listForChild(childProfileId: number): Promise<MasteryStateEntity[]> {
    return await this.db.query.masteryState.findMany({
      where: { childProfileId },
      orderBy: { skillId: "asc" },
    });
  }

  async listForChildBySkills(
    childProfileId: number,
    skillIds: readonly number[]
  ): Promise<MasteryStateEntity[]> {
    const uniqueIds = uniq(skillIds);
    if (uniqueIds.length === 0) {
      return [];
    }
    return await this.db.query.masteryState.findMany({
      where: { childProfileId, skillId: { in: uniqueIds } },
      orderBy: { skillId: "asc" },
    });
  }

  async listForChildWithSkillInfo(
    childProfileId: number,
    limit = 5
  ): Promise<MasteryWithSkillEntity[]> {
    return await this.db.query.masteryState.findMany({
      where: { childProfileId },
      with: { skill: true },
      orderBy: { skillId: "asc" },
      limit: clampLimit(limit, 5, 100),
    });
  }

  async upsertMastery(input: UpsertMasteryInput): Promise<MasteryStateEntity> {
    const now = input.updatedAt ?? new Date();
    const shared = {
      pLearn: formatDecimal4(input.pLearn),
      emaCorrect: formatDecimal4(input.emaCorrect),
      hintRate: formatDecimal4(input.hintRate ?? "0.0000"),
      attemptsTotal: input.attemptsTotal,
      bestPLearn: formatDecimal4(input.bestPLearn),
      lastSeenAt: toNullableDate(input.lastSeenAt) ?? now,
      updatedAt: now,
    };
    return await requireFirst(
      this.db
        .insert(masteryState)
        .values({
          childProfileId: input.childProfileId,
          skillId: input.skillId,
          ...shared,
          paramsVersion: input.paramsVersion ?? "v1",
          createdAt: now,
        })
        .onConflictDoUpdate({
          target: [masteryState.childProfileId, masteryState.skillId],
          set: {
            ...shared,
            ...(input.paramsVersion === undefined
              ? {}
              : { paramsVersion: input.paramsVersion }),
          },
        })
        .returning(),
      "Failed to upsert mastery state"
    );
  }
}

export class BadgesRepository extends BaseRepository {
  async listForChild(childProfileId: number): Promise<ChildBadgeEntity[]> {
    return await this.db.query.childBadges.findMany({
      where: { childProfileId },
      orderBy: { awardedAt: "asc" },
    });
  }

  async listBadgeCodesForChild(childProfileId: number): Promise<string[]> {
    const rows = await this.db.query.childBadges.findMany({
      columns: { badgeCode: true },
      where: { childProfileId },
    });
    return rows.map((row) => row.badgeCode);
  }

  async awardBadges(
    childProfileId: number,
    badgeCodes: readonly string[],
    sourceRef: string | null,
    awardedAt?: Date
  ): Promise<number> {
    const uniqueCodes = uniq(badgeCodes);
    if (uniqueCodes.length === 0) {
      return 0;
    }
    const now = awardedAt ?? new Date();
    const inserted = await this.db
      .insert(childBadges)
      .values(
        uniqueCodes.map((badgeCode) => ({
          childProfileId,
          badgeCode,
          awardedAt: now,
          sourceRef,
          createdAt: now,
          updatedAt: now,
        }))
      )
      .onConflictDoNothing()
      .returning({ id: childBadges.id });
    return inserted.length;
  }
}

export class TelemetryRepository extends BaseRepository {
  async insertBatch(
    events: readonly CreateTelemetryEventInput[]
  ): Promise<number> {
    return (await this.insertBatchReturningSeqs(events)).length;
  }

  async insertBatchReturningSeqs(
    events: readonly CreateTelemetryEventInput[]
  ): Promise<number[]> {
    if (events.length === 0) {
      return [];
    }
    const defaultNow = new Date();
    const values = events.map((event) => {
      const now = event.ingestedAt ?? defaultNow;
      return {
        sessionUuid: event.sessionUuid,
        seq: event.seq,
        childUuid: event.childUuid ?? null,
        gameLevelId: event.gameLevelId ?? null,
        templateCode: event.templateCode ?? null,
        eventName: event.eventName,
        occurredAtMs: event.occurredAtMs ?? null,
        payload: event.payload ?? null,
        clientTimestamp: toNullableDate(event.clientTimestamp),
        ingestedAt: now,
        createdAt: now,
        updatedAt: now,
      };
    });
    const inserted = await this.db
      .insert(telemetryEvents)
      .values(values)
      .onConflictDoNothing({
        target: [telemetryEvents.sessionUuid, telemetryEvents.seq],
      })
      .returning({ seq: telemetryEvents.seq });
    return inserted.map((row) => row.seq);
  }

  async listBySession(sessionUuid: string): Promise<TelemetryEventEntity[]> {
    return await this.db.query.telemetryEvents.findMany({
      where: { sessionUuid },
      orderBy: { seq: "asc" },
    });
  }

  async listSeqsBySession(sessionUuid: string): Promise<number[]> {
    const rows = await this.db.query.telemetryEvents.findMany({
      columns: { seq: true },
      where: { sessionUuid },
      orderBy: { seq: "desc" },
    });
    return rows.map((row) => row.seq);
  }

  async listBySessions(
    sessionUuids: readonly string[],
    chunkSize = 200
  ): Promise<TelemetryEventEntity[]> {
    const uniqueIds = uniq(sessionUuids);
    const results: TelemetryEventEntity[] = [];
    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
      const rows = await this.db.query.telemetryEvents.findMany({
        where: { sessionUuid: { in: uniqueIds.slice(i, i + chunkSize) } },
        orderBy: { seq: "asc" },
      });
      results.push(...rows);
    }
    return results;
  }

  async listIntroSegmentEvents(
    levelCode: string,
    childProfileId: number | null,
    guestDeviceId?: string
  ): Promise<TelemetryEventEntity[]> {
    const owner = resolveOwnerFilter(childProfileId, guestDeviceId);
    if (!owner) {
      return [];
    }
    return await this.db.query.telemetryEvents.findMany({
      where: {
        eventName: "intro_segment_completed",
        playSession: {
          isPreview: false,
          completionStatus: {
            in: [
              PLAY_COMPLETION_STATUS.IN_PROGRESS,
              PLAY_COMPLETION_STATUS.ABANDONED,
            ],
          },
          ...owner,
          gameLevel: { code: levelCode },
        },
      },
    });
  }
}
