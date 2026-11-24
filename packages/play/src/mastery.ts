import {
  computeUpdate,
  type MasteryState,
  selectNext,
} from "@mindkid/adaptive";
import { CONTENT_ENTITY_TYPE, type MasteryStateEntity } from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import type { computeSessionResult } from "@mindkid/shared";
import { awardChildBadges } from "#src/badges";
import type { DbOrTx } from "#src/types";

export async function recordSkillMasteryUpdate(params: {
  readonly db: DbOrTx;
  readonly childId: number;
  readonly skillId: number;
  readonly weight: number;
  readonly correctRatio: number;
  readonly hintRate: number;
  readonly now: Date;
  readonly existingRow?: MasteryStateEntity | null;
}): Promise<MasteryState> {
  const { db, childId, skillId, weight, correctRatio, hintRate, now } = params;
  const repos = createRepositories(db);
  let existing = params.existingRow;
  if (existing === undefined) {
    existing = await repos.mastery.getForChildSkill(childId, skillId);
  }

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

  await repos.mastery.upsertMastery({
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
  const repos = createRepositories(db);
  const mappedSkills = await repos.tagging.listSkillMaps(
    CONTENT_ENTITY_TYPE.GAME_LEVEL,
    gameLevelId
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
  const skillIds = mappedSkills.map((ms) => Number(ms.skillId));
  const existingRows = await repos.mastery.listForChildBySkills(
    childId,
    skillIds
  );
  const existingBySkillId = new Map<number, MasteryStateEntity>(
    existingRows.map((row) => [Number(row.skillId), row])
  );

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
      existingRow: existingBySkillId.get(skillId) ?? null,
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
      skill_ids: skillIds,
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
  const repos = createRepositories(db);
  const mappedSkills = await repos.tagging.listSkillMaps(
    CONTENT_ENTITY_TYPE.GAME_LEVEL,
    gameLevelId
  );

  if (mappedSkills.length === 0) {
    return;
  }

  const skillIds = mappedSkills.map((ms) => Number(ms.skillId));
  const existingRows = await repos.mastery.listForChildBySkills(
    childId,
    skillIds
  );
  const existingBySkillId = new Map<number, MasteryStateEntity>(
    existingRows.map((row) => [Number(row.skillId), row])
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
      existingRow: existingBySkillId.get(skillId) ?? null,
    });
  }
}
