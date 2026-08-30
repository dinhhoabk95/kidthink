import {
  assembleRecommendations,
  formatRecommendationItem,
  generateDailySeed,
  type RawCandidateLevel,
  type RecommendationItem,
  type RecommendationsPayload,
  shuffleWithSeed,
} from "@mindkid/adaptive";
import { getByCode } from "@mindkid/emoji";
import {
  type AccessTier,
  deriveAgeBand,
  resolveNextStep,
} from "@mindkid/shared";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { masteryState } from "#src/schema/adaptive";
import { childProfiles } from "#src/schema/child";
import {
  curricula,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
  curriculumWeeks,
} from "#src/schema/curriculum";
import { gameLevels } from "#src/schema/game";
import { levelDailyStats, playSessions } from "#src/schema/play";
import { contentSkillMap } from "#src/schema/tagging";
import { skillPrerequisites } from "#src/schema/taxonomy";

export interface GetChildRecommendationsOptions {
  childId: number;
  allowedTiers: AccessTier[];
  limit?: number;
  now?: Date;
  seed?: number;
}

export interface GetGuestRecommendationsOptions {
  ageBand?: "3-4" | "4-5" | "5-6";
  limit?: number;
  seed?: number;
}

type PublishedGameLevel = typeof gameLevels.$inferSelect;

/**
 * Resolves thumbnail emoji code to string or fallback.
 */
export function resolveThumbnailEmoji(emojiCode?: string | null): string {
  if (!emojiCode) {
    return "⭐";
  }
  const entry = getByCode(emojiCode);
  return entry?.emoji || emojiCode;
}

function isLevelAgeMatch(
  levelAgeMin: number | null | undefined,
  levelAgeMax: number | null | undefined,
  targetMin: number,
  targetMax: number
): boolean {
  const min = levelAgeMin ?? 3;
  const max = levelAgeMax ?? 6;
  return min <= targetMax && max >= targetMin;
}

function parseAgeBandRange(ageBand?: string): [number, number] {
  if (ageBand === "3-4") {
    return [3, 4];
  }
  if (ageBand === "4-5") {
    return [4, 5];
  }
  if (ageBand === "5-6") {
    return [5, 6];
  }
  return [3, 6];
}

async function resolveTier1CurriculumCandidate(
  db: PostgresJsDatabase<Record<string, unknown>>,
  childId: number,
  allowedTiers: AccessTier[],
  publishedByEntityId: Map<number, PublishedGameLevel>,
  publishedByCode: Map<string, PublishedGameLevel>
): Promise<RawCandidateLevel | null> {
  const [activeEnrollment] = await db
    .select({
      id: curriculumEnrollments.id,
      curriculumId: curriculumEnrollments.curriculumId,
      durationWeeks: curricula.durationWeeks,
    })
    .from(curriculumEnrollments)
    .innerJoin(curricula, eq(curricula.id, curriculumEnrollments.curriculumId))
    .where(
      and(
        eq(curriculumEnrollments.childId, childId),
        eq(curriculumEnrollments.status, "active")
      )
    )
    .limit(1);

  if (!activeEnrollment) {
    return null;
  }

  const rawItems = await db
    .select()
    .from(curriculumItems)
    .where(eq(curriculumItems.curriculumId, activeEnrollment.curriculumId));

  const rawWeeks = await db
    .select()
    .from(curriculumWeeks)
    .where(eq(curriculumWeeks.curriculumId, activeEnrollment.curriculumId));

  const progressRows = await db
    .select({ curriculumItemId: curriculumItemProgress.curriculumItemId })
    .from(curriculumItemProgress)
    .where(
      and(
        eq(curriculumItemProgress.enrollmentId, activeEnrollment.id),
        eq(curriculumItemProgress.status, "completed")
      )
    );

  const completedItemIds = new Set(progressRows.map((p) => p.curriculumItemId));

  const itemsRef = rawItems.map((item) => {
    const gl =
      item.entityType === "game_level"
        ? publishedByEntityId.get(item.entityId)
        : null;
    return {
      id: item.id,
      curriculum_id: item.curriculumId,
      week_no: item.weekNo,
      session_no: item.sessionNo,
      position: item.position,
      entity_type: item.entityType as "lesson" | "game_level",
      entity_id: item.entityId,
      code: gl?.code ?? `${item.entityType}_${item.entityId}`,
      title: gl?.title ?? "Hoạt động",
      is_required: item.isRequired,
      access_tier: (gl?.accessTier as AccessTier) ?? "free",
    };
  });

  const weeksRef = rawWeeks.map((w) => ({
    week_no: w.weekNo,
    goal: w.goal,
  }));

  const nextStep = resolveNextStep({
    durationWeeks: activeEnrollment.durationWeeks,
    weeks: weeksRef,
    items: itemsRef,
    completedItemIds,
    allowedTiers,
  });

  if (nextStep.week_blocked_by_tier || !nextStep.item) {
    return null;
  }

  if (nextStep.item.entity_type !== "game_level") {
    return null;
  }

  const matchedLevel = publishedByCode.get(nextStep.item.entity_code);
  if (!matchedLevel) {
    return null;
  }

  return {
    level_code: matchedLevel.code,
    title: matchedLevel.title,
    thumbnail_emoji: resolveThumbnailEmoji(matchedLevel.thumbnailEmoji),
    reason_code: "curriculum_next",
    access_tier: matchedLevel.accessTier as AccessTier,
    age_min: matchedLevel.ageMin,
    age_max: matchedLevel.ageMax,
    entity_id: matchedLevel.entityId,
  };
}

async function resolveReinforceCandidates(
  db: PostgresJsDatabase<Record<string, unknown>>,
  skillIds: number[],
  targetMin: number,
  targetMax: number,
  publishedByEntityId: Map<number, PublishedGameLevel>
): Promise<RawCandidateLevel[]> {
  if (skillIds.length === 0) {
    return [];
  }
  const mapped = await db
    .select({ entityId: contentSkillMap.entityId })
    .from(contentSkillMap)
    .where(
      and(
        eq(contentSkillMap.entityType, "game_level"),
        inArray(contentSkillMap.skillId, skillIds)
      )
    );

  const results: RawCandidateLevel[] = [];
  for (const mapRow of mapped) {
    const gl = publishedByEntityId.get(mapRow.entityId);
    if (gl && isLevelAgeMatch(gl.ageMin, gl.ageMax, targetMin, targetMax)) {
      results.push({
        level_code: gl.code,
        title: gl.title,
        thumbnail_emoji: resolveThumbnailEmoji(gl.thumbnailEmoji),
        reason_code: "skill_reinforce",
        access_tier: gl.accessTier as AccessTier,
        age_min: gl.ageMin,
        age_max: gl.ageMax,
        entity_id: gl.entityId,
      });
    }
  }
  return results;
}

async function resolveProgressionCandidates(
  db: PostgresJsDatabase<Record<string, unknown>>,
  masteredSkillIds: number[],
  targetMin: number,
  targetMax: number,
  publishedByEntityId: Map<number, PublishedGameLevel>
): Promise<RawCandidateLevel[]> {
  if (masteredSkillIds.length === 0) {
    return [];
  }
  const nextSkills = await db
    .select({ targetSkillId: skillPrerequisites.skillId })
    .from(skillPrerequisites)
    .where(inArray(skillPrerequisites.prerequisiteId, masteredSkillIds))
    .limit(10);

  const targetSkillIds = nextSkills.map((s) => s.targetSkillId);
  if (targetSkillIds.length === 0) {
    return [];
  }

  const mapped = await db
    .select({ entityId: contentSkillMap.entityId })
    .from(contentSkillMap)
    .where(
      and(
        eq(contentSkillMap.entityType, "game_level"),
        inArray(contentSkillMap.skillId, targetSkillIds)
      )
    );

  const results: RawCandidateLevel[] = [];
  for (const mapRow of mapped) {
    const gl = publishedByEntityId.get(mapRow.entityId);
    if (gl && isLevelAgeMatch(gl.ageMin, gl.ageMax, targetMin, targetMax)) {
      results.push({
        level_code: gl.code,
        title: gl.title,
        thumbnail_emoji: resolveThumbnailEmoji(gl.thumbnailEmoji),
        reason_code: "skill_progression",
        access_tier: gl.accessTier as AccessTier,
        age_min: gl.ageMin,
        age_max: gl.ageMax,
        entity_id: gl.entityId,
      });
    }
  }
  return results;
}

async function resolveRevisionCandidates(
  db: PostgresJsDatabase<Record<string, unknown>>,
  revisionSkillIds: number[],
  targetMin: number,
  targetMax: number,
  publishedByEntityId: Map<number, PublishedGameLevel>
): Promise<RawCandidateLevel[]> {
  if (revisionSkillIds.length === 0) {
    return [];
  }
  const mapped = await db
    .select({ entityId: contentSkillMap.entityId })
    .from(contentSkillMap)
    .where(
      and(
        eq(contentSkillMap.entityType, "game_level"),
        inArray(contentSkillMap.skillId, revisionSkillIds)
      )
    );

  const results: RawCandidateLevel[] = [];
  for (const mapRow of mapped) {
    const gl = publishedByEntityId.get(mapRow.entityId);
    if (gl && isLevelAgeMatch(gl.ageMin, gl.ageMax, targetMin, targetMax)) {
      results.push({
        level_code: gl.code,
        title: gl.title,
        thumbnail_emoji: resolveThumbnailEmoji(gl.thumbnailEmoji),
        reason_code: "revision",
        access_tier: gl.accessTier as AccessTier,
        age_min: gl.ageMin,
        age_max: gl.ageMax,
        entity_id: gl.entityId,
      });
    }
  }
  return results;
}

async function resolveMasteryTiers2To4(
  db: PostgresJsDatabase<Record<string, unknown>>,
  childId: number,
  targetAgeMin: number,
  targetAgeMax: number,
  publishedByEntityId: Map<number, PublishedGameLevel>,
  now: Date
): Promise<RawCandidateLevel[]> {
  const masteryRows = await db
    .select({
      skillId: masteryState.skillId,
      pLearn: masteryState.pLearn,
      lastSeenAt: masteryState.lastSeenAt,
    })
    .from(masteryState)
    .where(eq(masteryState.childProfileId, childId));

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const reinforceSkillIds = masteryRows
    .filter((m) => {
      const p = Number(m.pLearn);
      const lastSeen = m.lastSeenAt ? new Date(m.lastSeenAt) : null;
      return p < 0.4 && lastSeen && lastSeen >= sevenDaysAgo;
    })
    .map((m) => m.skillId);

  const masteredSkillIds = masteryRows
    .filter((m) => Number(m.pLearn) >= 0.8)
    .map((m) => m.skillId);

  const revisionSkillIds = masteryRows
    .filter((m) => {
      const lastSeen = m.lastSeenAt ? new Date(m.lastSeenAt) : null;
      return lastSeen && lastSeen < sevenDaysAgo;
    })
    .map((m) => m.skillId);

  const [t2, t3, t4] = await Promise.all([
    resolveReinforceCandidates(
      db,
      reinforceSkillIds,
      targetAgeMin,
      targetAgeMax,
      publishedByEntityId
    ),
    resolveProgressionCandidates(
      db,
      masteredSkillIds,
      targetAgeMin,
      targetAgeMax,
      publishedByEntityId
    ),
    resolveRevisionCandidates(
      db,
      revisionSkillIds,
      targetAgeMin,
      targetAgeMax,
      publishedByEntityId
    ),
  ]);

  return [...t2, ...t3, ...t4];
}

async function resolvePopularCandidates(
  db: PostgresJsDatabase<Record<string, unknown>>,
  unplayedMatching: PublishedGameLevel[]
): Promise<RawCandidateLevel[]> {
  const popularStats = await db
    .select({
      levelCode: levelDailyStats.levelCode,
      totalPlays: sql<number>`SUM(${levelDailyStats.playsCount})::int`,
    })
    .from(levelDailyStats)
    .groupBy(levelDailyStats.levelCode);

  const popularMap = new Map<string, number>();
  for (const s of popularStats) {
    popularMap.set(s.levelCode, s.totalPlays || 0);
  }

  const unplayedForPopular = [...unplayedMatching].sort((a, b) => {
    const pA = popularMap.get(a.code) ?? 0;
    const pB = popularMap.get(b.code) ?? 0;
    return pB - pA;
  });

  return unplayedForPopular.map((gl) => ({
    level_code: gl.code,
    title: gl.title,
    thumbnail_emoji: resolveThumbnailEmoji(gl.thumbnailEmoji),
    reason_code: "popular" as const,
    access_tier: gl.accessTier as AccessTier,
    age_min: gl.ageMin,
    age_max: gl.ageMax,
    plays_count: popularMap.get(gl.code) ?? 0,
    entity_id: gl.entityId,
  }));
}

/**
 * P3.6 — Recommend Next Content for Enrolled Child (BR-REC-01..08, D-MQ..D-MX).
 */
export async function getRecommendationsForChild(
  db: PostgresJsDatabase<Record<string, unknown>>,
  options: GetChildRecommendationsOptions
): Promise<RecommendationsPayload> {
  const { childId, allowedTiers, limit = 5, now = new Date() } = options;

  const [child] = await db
    .select()
    .from(childProfiles)
    .where(eq(childProfiles.id, childId));

  if (!child) {
    throw new Error("CHILD_NOT_FOUND");
  }

  const currentYear = now.getFullYear();
  const ageBand = deriveAgeBand(child.birthYear, currentYear);
  const [targetAgeMin, targetAgeMax] = parseAgeBandRange(ageBand);

  const dateIct = now.toISOString().slice(0, 10);
  const seed = options.seed ?? generateDailySeed(childId, dateIct);

  const recentSessions = await db
    .select({
      gameLevelId: playSessions.gameLevelId,
      startedAt: playSessions.startedAt,
    })
    .from(playSessions)
    .where(eq(playSessions.childProfileId, childId))
    .orderBy(desc(playSessions.startedAt));

  const totalPlaysCount = recentSessions.length;
  const recentLevelIds = recentSessions.slice(0, 3).map((s) => s.gameLevelId);
  const allPlayedLevelIdSet = new Set(recentSessions.map((s) => s.gameLevelId));

  let recentLevelCodes: string[] = [];
  if (recentLevelIds.length > 0) {
    const recentLevels = await db
      .select({ code: gameLevels.code })
      .from(gameLevels)
      .where(inArray(gameLevels.id, recentLevelIds));
    recentLevelCodes = recentLevels.map((l) => l.code);
  }

  const allPublishedLevels = await db
    .select()
    .from(gameLevels)
    .where(eq(gameLevels.status, "published"))
    .orderBy(asc(gameLevels.code));

  const publishedByEntityId = new Map<number, PublishedGameLevel>();
  const publishedByCode = new Map<string, PublishedGameLevel>();
  for (const lvl of allPublishedLevels) {
    publishedByEntityId.set(lvl.entityId, lvl);
    publishedByCode.set(lvl.code, lvl);
  }

  const candidatePool: RawCandidateLevel[] = [];

  // Tier 1
  const tier1 = await resolveTier1CurriculumCandidate(
    db,
    childId,
    allowedTiers,
    publishedByEntityId,
    publishedByCode
  );
  if (tier1) {
    candidatePool.push(tier1);
  }

  // Tiers 2..4 (mastery, if played >= 3)
  if (totalPlaysCount >= 3) {
    const masteryCandidates = await resolveMasteryTiers2To4(
      db,
      childId,
      targetAgeMin,
      targetAgeMax,
      publishedByEntityId,
      now
    );
    candidatePool.push(...masteryCandidates);
  }

  // Tier 5: explore
  const unplayedMatching = allPublishedLevels.filter(
    (gl) =>
      !allPlayedLevelIdSet.has(gl.id) &&
      isLevelAgeMatch(gl.ageMin, gl.ageMax, targetAgeMin, targetAgeMax)
  );

  const shuffledExplore = shuffleWithSeed(unplayedMatching, seed);
  for (const gl of shuffledExplore) {
    candidatePool.push({
      level_code: gl.code,
      title: gl.title,
      thumbnail_emoji: resolveThumbnailEmoji(gl.thumbnailEmoji),
      reason_code: "explore",
      access_tier: gl.accessTier as AccessTier,
      age_min: gl.ageMin,
      age_max: gl.ageMax,
      entity_id: gl.entityId,
    });
  }

  // Tier 6: popular
  const popularCandidates = await resolvePopularCandidates(
    db,
    unplayedMatching
  );
  candidatePool.push(...popularCandidates);

  // Tier 7: revision
  const playedMatching = allPublishedLevels.filter(
    (gl) =>
      allPlayedLevelIdSet.has(gl.id) &&
      isLevelAgeMatch(gl.ageMin, gl.ageMax, targetAgeMin, targetAgeMax)
  );

  const shuffledRevision = shuffleWithSeed(playedMatching, seed + 1);
  for (const gl of shuffledRevision) {
    candidatePool.push({
      level_code: gl.code,
      title: gl.title,
      thumbnail_emoji: resolveThumbnailEmoji(gl.thumbnailEmoji),
      reason_code: "revision",
      access_tier: gl.accessTier as AccessTier,
      age_min: gl.ageMin,
      age_max: gl.ageMax,
      entity_id: gl.entityId,
    });
  }

  // Fallback if candidate pool is completely empty
  if (candidatePool.length === 0 && allPublishedLevels.length > 0) {
    for (const gl of allPublishedLevels) {
      candidatePool.push({
        level_code: gl.code,
        title: gl.title,
        thumbnail_emoji: resolveThumbnailEmoji(gl.thumbnailEmoji),
        reason_code: "revision",
        access_tier: gl.accessTier as AccessTier,
        age_min: gl.ageMin,
        age_max: gl.ageMax,
        entity_id: gl.entityId,
      });
    }
  }

  const assembled = assembleRecommendations({
    candidates: candidatePool,
    allowedTiers,
    recentLevelCodes,
    limit,
    seed,
  });

  if (assembled) {
    return assembled;
  }

  const fallbackLevel = allPublishedLevels[0];
  if (!fallbackLevel) {
    throw new Error("No published game levels available for recommendation");
  }
  return {
    primary: formatRecommendationItem(
      {
        level_code: fallbackLevel.code,
        title: fallbackLevel.title,
        thumbnail_emoji: resolveThumbnailEmoji(fallbackLevel.thumbnailEmoji),
        reason_code: "revision",
        access_tier: fallbackLevel.accessTier as AccessTier,
      },
      !allowedTiers.includes(fallbackLevel.accessTier as AccessTier)
    ),
    alternatives: [],
  };
}

/**
 * P3.6 — Recommend Next Content for Guest (D-MW, BR-REC-04, BR-REC-06).
 */
export async function getGuestRecommendations(
  db: PostgresJsDatabase<Record<string, unknown>>,
  options: GetGuestRecommendationsOptions = {}
): Promise<RecommendationsPayload> {
  const { ageBand, limit = 5, seed = 42 } = options;
  const [targetAgeMin, targetAgeMax] = parseAgeBandRange(ageBand);

  const freeLevels = await db
    .select()
    .from(gameLevels)
    .where(
      and(eq(gameLevels.status, "published"), eq(gameLevels.accessTier, "free"))
    )
    .orderBy(asc(gameLevels.code));

  const matchingFree = freeLevels.filter((gl) =>
    isLevelAgeMatch(gl.ageMin, gl.ageMax, targetAgeMin, targetAgeMax)
  );

  const levelsToUse = matchingFree.length > 0 ? matchingFree : freeLevels;

  const popularStats = await db
    .select({
      levelCode: levelDailyStats.levelCode,
      totalPlays: sql<number>`SUM(${levelDailyStats.playsCount})::int`,
    })
    .from(levelDailyStats)
    .groupBy(levelDailyStats.levelCode);

  const popularMap = new Map<string, number>();
  for (const s of popularStats) {
    popularMap.set(s.levelCode, s.totalPlays || 0);
  }

  const candidatePool: RawCandidateLevel[] = [];

  const shuffledExplore = shuffleWithSeed(levelsToUse, seed);
  for (const gl of shuffledExplore) {
    candidatePool.push({
      level_code: gl.code,
      title: gl.title,
      thumbnail_emoji: resolveThumbnailEmoji(gl.thumbnailEmoji),
      reason_code: "explore",
      access_tier: "free",
      age_min: gl.ageMin,
      age_max: gl.ageMax,
    });
  }

  const popularSorted = [...levelsToUse].sort((a, b) => {
    const pA = popularMap.get(a.code) ?? 0;
    const pB = popularMap.get(b.code) ?? 0;
    return pB - pA;
  });

  for (const gl of popularSorted) {
    candidatePool.push({
      level_code: gl.code,
      title: gl.title,
      thumbnail_emoji: resolveThumbnailEmoji(gl.thumbnailEmoji),
      reason_code: "popular",
      access_tier: "free",
      age_min: gl.ageMin,
      age_max: gl.ageMax,
    });
  }

  const assembled = assembleRecommendations({
    candidates: candidatePool,
    allowedTiers: ["free"],
    limit,
    seed,
  });

  if (assembled) {
    return assembled;
  }

  const fallbackItem: RecommendationItem = {
    level_code: "GL-C1-FREE-0001",
    title: "Trò chơi làm quen",
    thumbnail_emoji: "⭐",
    reason: "Thử một trò chơi mới",
    reason_code: "explore",
    locked: false,
    access_tier: "free",
  };

  return {
    primary: fallbackItem,
    alternatives: [],
  };
}
