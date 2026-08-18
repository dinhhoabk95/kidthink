import { getDateIct } from "@mindkid/shared";
import { and, count, eq, gte, isNotNull, lt, sql } from "drizzle-orm";
import { getOwnerDb } from "../client.ts";
import { entitlements } from "../schema/billing.ts";
import { gameLevels } from "../schema/game.ts";
import {
  childDailyStats,
  levelDailyStats,
  playSessions,
  skillDailyStats,
} from "../schema/play.ts";
import { contentSkillMap } from "../schema/tagging.ts";

export interface RollupDailyResult {
  dateIct: string;
  childStatsCount: number;
  levelStatsCount: number;
  skillStatsCount: number;
}

/**
 * BR-TLM-02 & BR-TLM-05 & BR-TLM-08:
 * Executes daily rollup for date_ict (UTC+7).
 * Idempotent — running multiple times produces identical results.
 * Ignores guest sessions (child_profile_id IS NULL) for child KPI.
 */
export async function runDailyRollup(
  targetDateIct?: string
): Promise<RollupDailyResult> {
  const db = getOwnerDb();
  const dateIct = targetDateIct || getDateIct();

  // Define date window in UTC corresponding to 00:00 to 23:59:59 ICT
  const startIctIso = `${dateIct}T00:00:00.000+07:00`;
  const endIctIso = `${dateIct}T23:59:59.999+07:00`;
  const startDate = new Date(startIctIso);
  const endDate = new Date(endIctIso);

  // 1. Rollup child_daily_stats (ignoring NULL child_profile_id per BR-TLM-05)
  const childAggregates = await db
    .select({
      childProfileId: playSessions.childProfileId,
      sessionsCount: count(playSessions.id),
      totalPlayTimeSeconds: sql<number>`COALESCE(SUM(${playSessions.durationSeconds}), 0)::int`,
      levelsAttempted: sql<number>`COUNT(DISTINCT ${playSessions.gameLevelId})::int`,
      levelsCompleted: sql<number>`COUNT(CASE WHEN ${playSessions.completionStatus} = 'completed' THEN 1 END)::int`,
      starsEarned: sql<number>`COALESCE(SUM(${playSessions.starsEarned}), 0)::int`,
    })
    .from(playSessions)
    .where(
      and(
        isNotNull(playSessions.childProfileId),
        gte(playSessions.startedAt, startDate),
        lt(playSessions.startedAt, endDate)
      )
    )
    .groupBy(playSessions.childProfileId);

  let childStatsCount = 0;
  for (const agg of childAggregates) {
    if (agg.childProfileId === null) {
      continue;
    }

    await db
      .insert(childDailyStats)
      .values({
        childProfileId: agg.childProfileId,
        dateIct,
        sessionsCount: agg.sessionsCount,
        totalPlayTimeSeconds: agg.totalPlayTimeSeconds,
        levelsAttempted: agg.levelsAttempted,
        levelsCompleted: agg.levelsCompleted,
        skillsTouched: 0,
        starsEarned: agg.starsEarned,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [childDailyStats.childProfileId, childDailyStats.dateIct],
        set: {
          sessionsCount: agg.sessionsCount,
          totalPlayTimeSeconds: agg.totalPlayTimeSeconds,
          levelsAttempted: agg.levelsAttempted,
          levelsCompleted: agg.levelsCompleted,
          starsEarned: agg.starsEarned,
          updatedAt: new Date(),
        },
      });
    childStatsCount++;
  }

  // 2. Rollup level_daily_stats (by level_code, content_version, date_ict)
  const levelAggregates = await db
    .select({
      levelCode: gameLevels.code,
      contentVersion: playSessions.contentVersion,
      playsCount: count(playSessions.id),
      completionsCount: sql<number>`COUNT(CASE WHEN ${playSessions.completionStatus} = 'completed' THEN 1 END)::int`,
      abandonedCount: sql<number>`COUNT(CASE WHEN ${playSessions.completionStatus} = 'abandoned' THEN 1 END)::int`,
      avgDurationSeconds: sql<number>`COALESCE(AVG(CASE WHEN ${playSessions.completionStatus} = 'completed' THEN ${playSessions.durationSeconds} END), 0)::int`,
    })
    .from(playSessions)
    .innerJoin(gameLevels, eq(playSessions.gameLevelId, gameLevels.id))
    .where(
      and(
        gte(playSessions.startedAt, startDate),
        lt(playSessions.startedAt, endDate)
      )
    )
    .groupBy(gameLevels.code, playSessions.contentVersion);

  let levelStatsCount = 0;
  for (const agg of levelAggregates) {
    await db
      .insert(levelDailyStats)
      .values({
        levelCode: agg.levelCode,
        contentVersion: agg.contentVersion,
        dateIct,
        playsCount: agg.playsCount,
        completionsCount: agg.completionsCount,
        abandonedCount: agg.abandonedCount,
        avgDurationSeconds: agg.avgDurationSeconds,
        avgHintsUsed: 0,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          levelDailyStats.levelCode,
          levelDailyStats.contentVersion,
          levelDailyStats.dateIct,
        ],
        set: {
          playsCount: agg.playsCount,
          completionsCount: agg.completionsCount,
          abandonedCount: agg.abandonedCount,
          avgDurationSeconds: agg.avgDurationSeconds,
          updatedAt: new Date(),
        },
      });
    levelStatsCount++;
  }

  // 3. Rollup skill_daily_stats (by skill_id, date_ict)
  const skillAggregates = await db
    .select({
      skillId: contentSkillMap.skillId,
      exposureCount: count(playSessions.id),
      completions: sql<number>`COUNT(CASE WHEN ${playSessions.completionStatus} = 'completed' THEN 1 END)::int`,
    })
    .from(playSessions)
    .innerJoin(
      contentSkillMap,
      and(
        eq(contentSkillMap.entityType, "level"),
        eq(playSessions.gameLevelId, contentSkillMap.entityId)
      )
    )
    .where(
      and(
        gte(playSessions.startedAt, startDate),
        lt(playSessions.startedAt, endDate)
      )
    )
    .groupBy(contentSkillMap.skillId);

  let skillStatsCount = 0;
  for (const agg of skillAggregates) {
    const accuracy =
      agg.exposureCount > 0
        ? Math.round((agg.completions / agg.exposureCount) * 100)
        : 0;

    await db
      .insert(skillDailyStats)
      .values({
        skillId: agg.skillId,
        dateIct,
        exposureCount: agg.exposureCount,
        avgAccuracyPercent: accuracy,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [skillDailyStats.skillId, skillDailyStats.dateIct],
        set: {
          exposureCount: agg.exposureCount,
          avgAccuracyPercent: accuracy,
          updatedAt: new Date(),
        },
      });
    skillStatsCount++;
  }

  return {
    dateIct,
    childStatsCount,
    levelStatsCount,
    skillStatsCount,
  };
}

/**
 * Sweeps expired entitlements and transitions active -> expired.
 */
export async function runExpireEntitlements(
  targetDateIct?: string
): Promise<{ expiredCount: number }> {
  const db = getOwnerDb();
  const _dateIct = targetDateIct || getDateIct();
  const now = new Date();

  const updated = await db
    .update(entitlements)
    .set({
      status: "expired",
      updatedAt: now,
    })
    .where(
      and(
        eq(entitlements.status, "active"),
        isNotNull(entitlements.expiresAt),
        lt(entitlements.expiresAt, now)
      )
    )
    .returning();

  return { expiredCount: updated.length };
}
