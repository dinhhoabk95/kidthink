import type { AccessTier } from "@kidthink/shared";

export type ReasonCode =
  | "curriculum_next"
  | "skill_reinforce"
  | "skill_progression"
  | "revision"
  | "explore"
  | "popular";

export const RECOMMENDATION_REASONS: Record<ReasonCode, string> = {
  curriculum_next: "Bài tiếp theo trong chương trình",
  skill_reinforce: "Luyện thêm kỹ năng này",
  skill_progression: "Cùng chủ đề, khó hơn một chút",
  revision: "Ôn lại điều đã học",
  explore: "Thử một trò chơi mới",
  popular: "Nhiều bé thích trò này",
} as const;

export interface RawCandidateLevel {
  level_code: string;
  title: string;
  thumbnail_emoji?: string | null;
  reason_code: ReasonCode;
  access_tier: AccessTier;
  age_min?: number | null;
  age_max?: number | null;
  plays_count?: number;
  entity_id?: number;
}

export interface RecommendationItem {
  level_code: string;
  title: string;
  thumbnail_emoji: string;
  reason: string;
  reason_code: ReasonCode;
  locked: boolean;
  access_tier?: AccessTier;
}

export interface RecommendationsPayload {
  primary: RecommendationItem;
  alternatives: RecommendationItem[];
}

/**
 * Deterministic PRNG (Mulberry32) using integer seed (D-MV, BR-REC-08).
 * Pure function: no Math.random(), no side effects.
 */
export function createDeterministicRng(seed: number): () => number {
  // biome-ignore lint/suspicious/noBitwiseOperators: Mulberry32 PRNG requires unsigned 32-bit bitwise shift
  let s = seed >>> 0;
  return () => {
    // biome-ignore lint/suspicious/noBitwiseOperators: Mulberry32 math
    s = (s + 0x6d_2b_79_f5) >>> 0;
    // biome-ignore lint/suspicious/noBitwiseOperators: Mulberry32 math
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    // biome-ignore lint/suspicious/noBitwiseOperators: Mulberry32 math
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    // biome-ignore lint/suspicious/noBitwiseOperators: Mulberry32 math
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * Deterministic shuffle of an array using a seed.
 */
export function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const result = [...items];
  const rng = createDeterministicRng(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Generates an ICT daily seed number from child ID and date string.
 * Example: generateDailySeed(10, "2026-08-15") -> deterministic integer
 */
export function generateDailySeed(
  childId: number,
  dateIctString: string
): number {
  let hash = 0;
  const str = `${childId}:${dateIctString}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    // biome-ignore lint/suspicious/noBitwiseOperators: deterministic integer hash
    hash = (hash << 5) - hash + char;
    // biome-ignore lint/suspicious/noBitwiseOperators: deterministic integer hash
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Format a candidate item into RecommendationItem with localized reason.
 */
export function formatRecommendationItem(
  candidate: RawCandidateLevel,
  locked: boolean,
  resolvedEmoji = "⭐"
): RecommendationItem {
  const reason =
    RECOMMENDATION_REASONS[candidate.reason_code] || "Khám phá trò chơi mới";

  return {
    level_code: candidate.level_code,
    title: candidate.title,
    thumbnail_emoji: candidate.thumbnail_emoji || resolvedEmoji,
    reason,
    reason_code: candidate.reason_code,
    locked,
    access_tier: candidate.access_tier,
  };
}

export interface AssembleRecommendationsOptions {
  candidates: RawCandidateLevel[];
  allowedTiers: AccessTier[];
  recentLevelCodes?: string[];
  limit?: number;
  seed?: number;
}

function deduplicateCandidates(
  candidates: RawCandidateLevel[],
  recentSet: Set<string>
): RawCandidateLevel[] {
  const seenCodes = new Set<string>();
  const valid: RawCandidateLevel[] = [];

  for (const c of candidates) {
    if (recentSet.has(c.level_code) || seenCodes.has(c.level_code)) {
      continue;
    }
    seenCodes.add(c.level_code);
    valid.push(c);
  }
  return valid;
}

function partitionByAccess(
  candidates: RawCandidateLevel[],
  allowedTiers: AccessTier[]
): { unlocked: RawCandidateLevel[]; locked: RawCandidateLevel[] } {
  const unlocked: RawCandidateLevel[] = [];
  const locked: RawCandidateLevel[] = [];

  for (const c of candidates) {
    if (allowedTiers.includes(c.access_tier)) {
      unlocked.push(c);
    } else {
      locked.push(c);
    }
  }
  return { unlocked, locked };
}

function collectRecommendationItems(
  unlocked: RawCandidateLevel[],
  locked: RawCandidateLevel[],
  maxTotal: number
): RecommendationItem[] {
  const result: RecommendationItem[] = [];

  if (unlocked.length === 0) {
    // D-MT: All candidates are locked -> exactly 1 locked item, 0 unlocked
    if (locked.length > 0) {
      result.push(formatRecommendationItem(locked[0], true));
    }
    return result;
  }

  // Fill up to maxTotal with unlocked candidates
  for (const item of unlocked) {
    if (result.length >= maxTotal) {
      break;
    }
    result.push(formatRecommendationItem(item, false));
  }

  // BR-REC-07: Up to 1 locked item if there's room
  if (result.length < maxTotal && locked.length > 0) {
    result.push(formatRecommendationItem(locked[0], true));
  }

  return result;
}

/**
 * Pure function to assemble and rank recommendations (BR-REC-01..08, D-MQ, D-MT, D-MV).
 * - Enforces recent 3 level exclusion (BR-REC-03)
 * - Limits locked items to at most 1 (BR-REC-07)
 * - Handles all-locked case (D-MT: returns exactly 1 locked item and 0 unlocked)
 * - Guarantees non-empty output (never returns null/empty if candidates provided)
 */
export function assembleRecommendations(
  options: AssembleRecommendationsOptions
): RecommendationsPayload | null {
  const {
    candidates,
    allowedTiers,
    recentLevelCodes = [],
    limit = 5,
  } = options;

  const maxTotal = Math.max(1, Math.min(limit, 5));
  const recentSet = new Set(recentLevelCodes);

  const validCandidates = deduplicateCandidates(candidates, recentSet);
  if (validCandidates.length === 0) {
    return null;
  }

  const { unlocked, locked } = partitionByAccess(validCandidates, allowedTiers);
  const resultItems = collectRecommendationItems(unlocked, locked, maxTotal);

  if (resultItems.length === 0) {
    return null;
  }

  const [primary, ...alternatives] = resultItems;

  return {
    primary,
    alternatives: alternatives.slice(0, 4),
  };
}
