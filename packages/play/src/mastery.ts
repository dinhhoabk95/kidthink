import {
  computeUpdate,
  type MasteryState,
  selectNext,
} from "@mindkid/adaptive";
import { contentSkillMap, masteryState } from "@mindkid/db";
import type { computeSessionResult } from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { awardChildBadges } from "./badges.js";
import type { DbOrTx } from "./types.js";

export async function recordSkillMasteryUpdate(params: {
  readonly db: DbOrTx;
  readonly childId: number;
  readonly skillId: number;
  readonly weight: number;
  readonly correctRatio: number;
  readonly hintRate: number;
  readonly now: Date;
}): Promise<MasteryState> {
  const { db, childId, skillId, weight, correctRatio, hintRate, now } = params;
  const [existing] = await db
    .select()
    .from(masteryState)
    .where(
      and(
        eq(masteryState.childProfileId, childId),
        eq(masteryState.skillId, skillId)
      )
    )
    .limit(1);

  const prevState: MasteryState | null = existing
    ? {
        child_id: childId,
        skill_id: skillId,
        p_learn: Number(existing.pLearn),
        ema_correct: Number(existing.emaCorrect),
        hint_rate: Number(existing.hintRate),
        attempts_total: existing.attemptsTotal,
        best_p_learn: Number(existing.bestPLearn),
        last_seen_at: existing.lastSeenAt ? new Date(existing.lastSeenAt) : now,
        params_version: existing.paramsVersion,
      }
    : null;

  const update = computeUpdate({
    prev: prevState,
    result: {
      correct_ratio: correctRatio,
      hint_rate: hintRate,
    },
    weight,
    now,
  });

  await db
    .insert(masteryState)
    .values({
      childProfileId: childId,
      skillId,
      pLearn: update.p_learn.toFixed(4),
      emaCorrect: update.ema_correct.toFixed(4),
      hintRate: update.hint_rate.toFixed(4),
      attemptsTotal: update.attempts_total,
      bestPLearn: update.best_p_learn.toFixed(4),
      paramsVersion: update.params_version,
      lastSeenAt: update.last_seen_at,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [masteryState.childProfileId, masteryState.skillId],
      set: {
        pLearn: update.p_learn.toFixed(4),
        emaCorrect: update.ema_correct.toFixed(4),
        hintRate: update.hint_rate.toFixed(4),
        attemptsTotal: update.attempts_total,
        bestPLearn: update.best_p_learn.toFixed(4),
        paramsVersion: update.params_version,
        lastSeenAt: update.last_seen_at,
        updatedAt: now,
      },
    });

  return {
    child_id: childId,
    skill_id: skillId,
    ...update,
  };
}

export async function applySessionMasteryAndBadges(params: {
  readonly db: DbOrTx;
  readonly childId: number;
  readonly gameLevelId: number;
  readonly sessionUuid: string;
  readonly scoringResult: ReturnType<typeof computeSessionResult>;
  readonly now: Date;
}): Promise<ReturnType<typeof selectNext> | null> {
  const { db, childId, gameLevelId, sessionUuid, scoringResult, now } = params;
  const mappedSkills = await db
    .select()
    .from(contentSkillMap)
    .where(
      and(
        eq(contentSkillMap.entityType, "game_level"),
        eq(contentSkillMap.entityId, gameLevelId)
      )
    );

  if (mappedSkills.length === 0) {
    console.warn(
      `[completePlaySession] Level ${gameLevelId} has no attached skills, skipping mastery update`
    );
    return null;
  }

  const roundsTotal = scoringResult.metrics.rounds_total;
  const correctRatio =
    roundsTotal > 0 ? scoringResult.metrics.rounds_correct / roundsTotal : 0;
  const hintRate =
    roundsTotal > 0 ? (scoringResult.metrics.hint_count ?? 0) / roundsTotal : 0;

  const masteryMap = new Map<number, MasteryState>();

  for (const ms of mappedSkills) {
    const skillId = Number(ms.skillId);
    const updatedState = await recordSkillMasteryUpdate({
      db,
      childId,
      skillId,
      weight: Number(ms.weight),
      correctRatio,
      hintRate,
      now,
    });
    masteryMap.set(skillId, updatedState);
  }

  await awardChildBadges({ db, childId, sessionUuid, now });

  return selectNext({
    mastery: masteryMap,
    step: {
      week_no: 1,
      session_no: 1,
      position: 1,
      skill_ids: mappedSkills.map((ms: { skillId: number }) =>
        Number(ms.skillId)
      ),
    },
    now,
  });
}

export async function applyAbandonedSessionMastery(params: {
  readonly db: DbOrTx;
  readonly childId: number;
  readonly gameLevelId: number;
  readonly now: Date;
}): Promise<void> {
  const { db, childId, gameLevelId, now } = params;
  const mappedSkills = await db
    .select()
    .from(contentSkillMap)
    .where(
      and(
        eq(contentSkillMap.entityType, "game_level"),
        eq(contentSkillMap.entityId, gameLevelId)
      )
    );

  for (const ms of mappedSkills) {
    const skillId = Number(ms.skillId);
    await recordSkillMasteryUpdate({
      db,
      childId,
      skillId,
      weight: Number(ms.weight),
      correctRatio: 0,
      hintRate: 1,
      now,
    });
  }
}
