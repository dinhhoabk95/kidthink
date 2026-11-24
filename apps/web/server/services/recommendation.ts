import {
  assembleRecommendations,
  formatRecommendationItem,
  generateDailySeed,
  type RawCandidateLevel,
  type RecommendationItem,
  type RecommendationsPayload,
  shuffleWithSeed,
} from "@mindkid/adaptive";
import {
  ACCESS_TIER,
  ACCESS_TIER_CODEC,
  CONTENT_ENTITY_TYPE,
  CONTENT_ENTITY_TYPE_CODEC,
  type DbExecutor,
  type GameLevelEntity,
} from "@mindkid/db";
import {
  createRepositories,
  type MindKidRepositories,
} from "@mindkid/db/repositories";
import {
  type AccessTier,
  type AgeBand,
  deriveAgeBand,
  getEffectiveTier,
  resolveNextStep,
} from "@mindkid/shared";
import { useRepositories } from "#server/utils/repositories";

export interface GetChildRecommendationsOptions {
  childId: number;
  allowedTiers: AccessTier[];
  limit?: number;
  now?: Date;
  seed?: number;
}

export interface GetGuestRecommendationsOptions {
  ageBand?: AgeBand;
  limit?: number;
  seed?: number;
}

export interface PlayedLevelCodes {
  totalPlaysCount: number;
  recentLevelCodes: string[];
  allPlayedLevelCodeSet: Set<string>;
}

const MAX_RECOMMENDATION_LEVEL_POOL = 2000;

function isRepositories(
  target: DbExecutor | MindKidRepositories
): target is MindKidRepositories {
  return "gameLevels" in target;
}

function toRepositories(
  target?: DbExecutor | MindKidRepositories
): MindKidRepositories {
  if (!target) {
    return useRepositories();
  }
  return isRepositories(target) ? target : createRepositories(target);
}

/**
 * Resolves thumbnail emoji to string with fallback. (Task #202 D-EE)
 */
export function resolveThumbnailEmoji(emoji?: string | null): string {
  return emoji || "🎮";
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

function mapLevelIdsToCandidates(
  entityIds: readonly number[],
  reasonCode: "skill_reinforce" | "skill_progression" | "revision",
  targetMin: number,
  targetMax: number,
  publishedByEntityId: Map<number, GameLevelEntity>
): RawCandidateLevel[] {
  const results: RawCandidateLevel[] = [];
  for (const entityId of entityIds) {
    const gl = publishedByEntityId.get(entityId);
    if (gl && isLevelAgeMatch(gl.ageMin, gl.ageMax, targetMin, targetMax)) {
      results.push({
        level_code: gl.code,
        title: gl.title,
        thumbnail_emoji: resolveThumbnailEmoji(gl.thumbnailEmoji),
        reason_code: reasonCode,
        access_tier: ACCESS_TIER_CODEC.toLabel(gl.accessTier),
        age_min: gl.ageMin,
        age_max: gl.ageMax,
        entity_id: gl.id,
      });
    }
  }
  return results;
}

async function resolveTier1CurriculumCandidate(
  repos: MindKidRepositories,
  childId: number,
  allowedTiers: AccessTier[],
  publishedByEntityId: Map<number, GameLevelEntity>,
  publishedByCode: Map<string, GameLevelEntity>
): Promise<RawCandidateLevel | null> {
  const activeEnrollment = await repos.curricula.findEnrollmentForChild(
    childId,
    true
  );
  if (!activeEnrollment) {
    return null;
  }

  const [rawItems, rawWeeks, progressRows] = await Promise.all([
    repos.curricula.listItems([activeEnrollment.curriculumId]),
    repos.curricula.listWeeks(activeEnrollment.curriculumId),
    repos.curricula.listCompletedProgress([activeEnrollment.id]),
  ]);

  const completedItemIds = new Set(progressRows.map((p) => p.curriculumItemId));
  const curriculumTier = ACCESS_TIER_CODEC.toLabel(
    activeEnrollment.curriculum.accessTier
  );

  const itemsRef = rawItems.map((item) => {
    const gl =
      item.entityType === CONTENT_ENTITY_TYPE.GAME_LEVEL
        ? publishedByEntityId.get(item.entityId)
        : null;
    const levelTier = gl ? ACCESS_TIER_CODEC.toLabel(gl.accessTier) : "premium";
    return {
      id: item.id,
      curriculum_id: item.curriculumId,
      week_no: item.weekNo,
      session_no: item.sessionNo,
      position: item.position,
      entity_type: "game_level" as const,
      entity_id: item.entityId,
      code:
        gl?.code ??
        `${CONTENT_ENTITY_TYPE_CODEC.toLabel(item.entityType)}_${item.entityId}`,
      title: gl?.title ?? "Trò chơi",
      is_required: item.isRequired,
      access_tier: getEffectiveTier(levelTier, curriculumTier),
    };
  });

  const weeksRef = rawWeeks.map((w) => ({
    week_no: w.weekNo,
    goal: w.goal,
  }));

  const nextStep = resolveNextStep({
    durationWeeks: activeEnrollment.curriculum.durationWeeks,
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
    access_tier: getEffectiveTier(
      ACCESS_TIER_CODEC.toLabel(matchedLevel.accessTier),
      curriculumTier
    ),
    age_min: matchedLevel.ageMin,
    age_max: matchedLevel.ageMax,
    entity_id: matchedLevel.id,
  };
}

async function resolveReinforceCandidates(
  repos: MindKidRepositories,
  skillIds: number[],
  targetMin: number,
  targetMax: number,
  publishedByEntityId: Map<number, GameLevelEntity>
): Promise<RawCandidateLevel[]> {
  if (skillIds.length === 0) {
    return [];
  }
  const entityIds = await repos.tagging.listLevelIdsBySkillIds(
    skillIds,
    CONTENT_ENTITY_TYPE.GAME_LEVEL
  );
  return mapLevelIdsToCandidates(
    entityIds,
    "skill_reinforce",
    targetMin,
    targetMax,
    publishedByEntityId
  );
}

async function resolveProgressionCandidates(
  repos: MindKidRepositories,
  masteredSkillIds: number[],
  targetMin: number,
  targetMax: number,
  publishedByEntityId: Map<number, GameLevelEntity>
): Promise<RawCandidateLevel[]> {
  if (masteredSkillIds.length === 0) {
    return [];
  }
  const targetSkillIds = await repos.taxonomy.listSuccessorSkillIds(
    masteredSkillIds,
    10
  );
  if (targetSkillIds.length === 0) {
    return [];
  }
  const entityIds = await repos.tagging.listLevelIdsBySkillIds(
    targetSkillIds,
    CONTENT_ENTITY_TYPE.GAME_LEVEL
  );
  return mapLevelIdsToCandidates(
    entityIds,
    "skill_progression",
    targetMin,
    targetMax,
    publishedByEntityId
  );
}

async function resolveRevisionCandidates(
  repos: MindKidRepositories,
  revisionSkillIds: number[],
  targetMin: number,
  targetMax: number,
  publishedByEntityId: Map<number, GameLevelEntity>
): Promise<RawCandidateLevel[]> {
  if (revisionSkillIds.length === 0) {
    return [];
  }
  const entityIds = await repos.tagging.listLevelIdsBySkillIds(
    revisionSkillIds,
    CONTENT_ENTITY_TYPE.GAME_LEVEL
  );
  return mapLevelIdsToCandidates(
    entityIds,
    "revision",
    targetMin,
    targetMax,
    publishedByEntityId
  );
}

async function resolveMasteryTiers2To4(
  repos: MindKidRepositories,
  childId: number,
  targetAgeMin: number,
  targetAgeMax: number,
  publishedByEntityId: Map<number, GameLevelEntity>,
  now: Date
): Promise<RawCandidateLevel[]> {
  const masteryRows = await repos.mastery.listForChild(childId);
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
      repos,
      reinforceSkillIds,
      targetAgeMin,
      targetAgeMax,
      publishedByEntityId
    ),
    resolveProgressionCandidates(
      repos,
      masteredSkillIds,
      targetAgeMin,
      targetAgeMax,
      publishedByEntityId
    ),
    resolveRevisionCandidates(
      repos,
      revisionSkillIds,
      targetAgeMin,
      targetAgeMax,
      publishedByEntityId
    ),
  ]);

  return [...t2, ...t3, ...t4];
}

async function resolvePopularCandidates(
  repos: MindKidRepositories,
  unplayedMatching: GameLevelEntity[]
): Promise<RawCandidateLevel[]> {
  const popularMap = await repos.analyticsRollup.sumPlaysByLevelCode();

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
    access_tier: ACCESS_TIER_CODEC.toLabel(gl.accessTier),
    age_min: gl.ageMin,
    age_max: gl.ageMax,
    plays_count: popularMap.get(gl.code) ?? 0,
    entity_id: gl.id,
  }));
}

/**
 * Level đã chơi, theo MÃ level (không theo `game_levels.id`): id đổi khi bản cũ
 * bị archive sau khi nâng content_version, mà level đã chơi ở bản cũ vẫn là đã chơi.
 */
export async function loadPlayedLevelCodes(
  childId: number
): Promise<PlayedLevelCodes>;
export async function loadPlayedLevelCodes(
  dbOrRepos: DbExecutor | MindKidRepositories,
  childId: number
): Promise<PlayedLevelCodes>;
export async function loadPlayedLevelCodes(
  first: DbExecutor | MindKidRepositories | number,
  maybeChildId?: number
): Promise<PlayedLevelCodes> {
  const isLegacyCall = typeof first !== "number";
  const repos = isLegacyCall ? toRepositories(first) : useRepositories();
  const childId = isLegacyCall ? (maybeChildId as number) : first;

  const playedCodes =
    await repos.playSessions.listPlayedLevelCodesForChild(childId);

  return {
    totalPlaysCount: playedCodes.length,
    recentLevelCodes: playedCodes.slice(0, 3),
    allPlayedLevelCodeSet: new Set(playedCodes),
  };
}

/**
 * P3.6 — Recommend Next Content for Enrolled Child (BR-REC-01..08, D-MQ..D-MX).
 */
export async function getRecommendationsForChild(
  options: GetChildRecommendationsOptions
): Promise<RecommendationsPayload>;
export async function getRecommendationsForChild(
  dbOrRepos: DbExecutor | MindKidRepositories,
  options: GetChildRecommendationsOptions
): Promise<RecommendationsPayload>;
export async function getRecommendationsForChild(
  first: DbExecutor | MindKidRepositories | GetChildRecommendationsOptions,
  maybeOptions?: GetChildRecommendationsOptions
): Promise<RecommendationsPayload> {
  const isLegacyCall = maybeOptions !== undefined;
  const repos = isLegacyCall
    ? toRepositories(first as DbExecutor | MindKidRepositories)
    : useRepositories();
  const options = isLegacyCall
    ? maybeOptions
    : (first as GetChildRecommendationsOptions);

  const { childId, allowedTiers, limit = 5, now = new Date() } = options;

  const child = await repos.childProfiles.findById(childId);
  if (!child) {
    throw new Error("CHILD_NOT_FOUND");
  }

  const currentYear = now.getFullYear();
  const ageBand = deriveAgeBand(child.birthYear, currentYear);
  const [targetAgeMin, targetAgeMax] = parseAgeBandRange(ageBand);

  const dateIct = now.toISOString().slice(0, 10);
  const seed = options.seed ?? generateDailySeed(childId, dateIct);

  const [
    { totalPlaysCount, recentLevelCodes, allPlayedLevelCodeSet },
    allPublishedLevels,
  ] = await Promise.all([
    loadPlayedLevelCodes(repos, childId),
    repos.gameLevels.listAllOrdered(MAX_RECOMMENDATION_LEVEL_POOL),
  ]);

  const publishedByEntityId = new Map<number, GameLevelEntity>();
  const publishedByCode = new Map<string, GameLevelEntity>();
  for (const lvl of allPublishedLevels) {
    publishedByEntityId.set(lvl.id, lvl);
    publishedByCode.set(lvl.code, lvl);
  }

  const candidatePool: RawCandidateLevel[] = [];

  // Tier 1
  const tier1 = await resolveTier1CurriculumCandidate(
    repos,
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
      repos,
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
      !allPlayedLevelCodeSet.has(gl.code) &&
      isLevelAgeMatch(gl.ageMin, gl.ageMax, targetAgeMin, targetAgeMax)
  );

  const shuffledExplore = shuffleWithSeed(unplayedMatching, seed);
  for (const gl of shuffledExplore) {
    candidatePool.push({
      level_code: gl.code,
      title: gl.title,
      thumbnail_emoji: resolveThumbnailEmoji(gl.thumbnailEmoji),
      reason_code: "explore",
      access_tier: ACCESS_TIER_CODEC.toLabel(gl.accessTier),
      age_min: gl.ageMin,
      age_max: gl.ageMax,
      entity_id: gl.id,
    });
  }

  // Tier 6: popular
  const popularCandidates = await resolvePopularCandidates(
    repos,
    unplayedMatching
  );
  candidatePool.push(...popularCandidates);

  // Tier 7: revision
  const playedMatching = allPublishedLevels.filter(
    (gl) =>
      allPlayedLevelCodeSet.has(gl.code) &&
      isLevelAgeMatch(gl.ageMin, gl.ageMax, targetAgeMin, targetAgeMax)
  );

  const shuffledRevision = shuffleWithSeed(playedMatching, seed + 1);
  for (const gl of shuffledRevision) {
    candidatePool.push({
      level_code: gl.code,
      title: gl.title,
      thumbnail_emoji: resolveThumbnailEmoji(gl.thumbnailEmoji),
      reason_code: "revision",
      access_tier: ACCESS_TIER_CODEC.toLabel(gl.accessTier),
      age_min: gl.ageMin,
      age_max: gl.ageMax,
      entity_id: gl.id,
    });
  }

  if (candidatePool.length === 0 && allPublishedLevels.length > 0) {
    for (const gl of allPublishedLevels) {
      candidatePool.push({
        level_code: gl.code,
        title: gl.title,
        thumbnail_emoji: resolveThumbnailEmoji(gl.thumbnailEmoji),
        reason_code: "revision",
        access_tier: ACCESS_TIER_CODEC.toLabel(gl.accessTier),
        age_min: gl.ageMin,
        age_max: gl.ageMax,
        entity_id: gl.id,
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
  const fallbackTier = ACCESS_TIER_CODEC.toLabel(fallbackLevel.accessTier);
  return {
    primary: formatRecommendationItem(
      {
        level_code: fallbackLevel.code,
        title: fallbackLevel.title,
        thumbnail_emoji: resolveThumbnailEmoji(fallbackLevel.thumbnailEmoji),
        reason_code: "revision",
        access_tier: fallbackTier,
      },
      !allowedTiers.includes(fallbackTier)
    ),
    alternatives: [],
  };
}

/**
 * P3.6 — Recommend Next Content for Guest (D-MW, BR-REC-04, BR-REC-06).
 */
export async function getGuestRecommendations(
  options?: GetGuestRecommendationsOptions
): Promise<RecommendationsPayload>;
export async function getGuestRecommendations(
  dbOrRepos: DbExecutor | MindKidRepositories,
  options?: GetGuestRecommendationsOptions
): Promise<RecommendationsPayload>;
export async function getGuestRecommendations(
  first?: DbExecutor | MindKidRepositories | GetGuestRecommendationsOptions,
  maybeOptions?: GetGuestRecommendationsOptions
): Promise<RecommendationsPayload> {
  const isDbCall =
    first !== undefined &&
    ("gameLevels" in first || ("select" in first && "transaction" in first));
  const repos = isDbCall ? toRepositories(first) : useRepositories();
  const options = isDbCall
    ? (maybeOptions ?? {})
    : ((first as GetGuestRecommendationsOptions | undefined) ?? {});

  const { ageBand, limit = 5, seed = 42 } = options;
  const [targetAgeMin, targetAgeMax] = parseAgeBandRange(ageBand);

  const [freeLevels, popularMap] = await Promise.all([
    repos.gameLevels.listPublished({
      accessTier: ACCESS_TIER.FREE,
      limit: MAX_RECOMMENDATION_LEVEL_POOL,
    }),
    repos.analyticsRollup.sumPlaysByLevelCode(),
  ]);

  const sortedFree = [...freeLevels].sort((a, b) =>
    a.code.localeCompare(b.code)
  );
  const matchingFree = sortedFree.filter((gl) =>
    isLevelAgeMatch(gl.ageMin, gl.ageMax, targetAgeMin, targetAgeMax)
  );

  const levelsToUse = matchingFree.length > 0 ? matchingFree : sortedFree;

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
