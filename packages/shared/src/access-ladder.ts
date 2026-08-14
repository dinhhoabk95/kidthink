import type { EntitlementKey } from "./entitlement-catalog.js";
import type { AccessTier } from "./taxonomy-types.js";

export const TIER_ORDER = ["free", "login", "standard", "premium"] as const;

export const TIER_RANK: Record<AccessTier, number> = {
  free: 0,
  login: 1,
  standard: 2,
  premium: 3,
};

export type CallerIdentity =
  | { kind: "guest" }
  | { kind: "user"; user_id: string; active_child_id?: string | null };

export function allowedTiers(
  caller: CallerIdentity,
  activeKeys: EntitlementKey[] = []
): Promise<AccessTier[]> {
  if (caller.kind === "guest") {
    return Promise.resolve(["free"]);
  }

  let highestTier: AccessTier = "free";
  if (activeKeys.includes("play_premium_games")) {
    highestTier = "premium";
  } else if (activeKeys.includes("play_standard_games")) {
    highestTier = "standard";
  } else if (caller.active_child_id) {
    highestTier = "login";
  }

  return Promise.resolve(
    TIER_ORDER.filter((tier) => TIER_RANK[tier] <= TIER_RANK[highestTier])
  );
}

/**
 * BR-LAD-02: Content missing access_tier resolves to premium, not free.
 * BR-LAD-05: Effective tier = max(levelTier, curriculumTier).
 */
export function getEffectiveTier(
  levelTier?: AccessTier | null,
  curriculumTier?: AccessTier | null
): AccessTier {
  const resolvedLevelTier = levelTier ?? "premium";
  const resolvedCurriculumTier = curriculumTier ?? "free";

  const levelRank = TIER_RANK[resolvedLevelTier] ?? TIER_RANK.premium;
  const curriculumRank = TIER_RANK[resolvedCurriculumTier] ?? TIER_RANK.free;

  const maxRank = Math.max(levelRank, curriculumRank);

  return TIER_ORDER.find((t) => TIER_RANK[t] === maxRank) ?? "premium";
}

export interface LockedPreviewMetadata {
  title?: string;
  competency?: string;
  age_min?: number;
  age_max?: number;
  thumbnail_emoji?: string;
}

export interface TierLockedResponse {
  code: "TIER_LOCKED";
  access_tier: AccessTier;
  required_entitlement: EntitlementKey;
  upgrade_package_codes: string[];
  preview: LockedPreviewMetadata;
}

/**
 * Task 7: Generate fixed shape response when access is blocked (403 TIER_LOCKED).
 * BR-LAD-04: Strip content_pack, difficulty_params, and answers.
 */
export function buildTierLockedResponse(
  requiredTier: AccessTier,
  preview: LockedPreviewMetadata = {}
): TierLockedResponse {
  let requiredEntitlement: EntitlementKey = "play_login_games";
  if (requiredTier === "premium") {
    requiredEntitlement = "play_premium_games";
  } else if (requiredTier === "standard") {
    requiredEntitlement = "play_standard_games";
  }

  const upgradePackageCodes =
    requiredTier === "premium"
      ? ["PKG-premium"]
      : ["PKG-standard", "PKG-premium"];

  return {
    code: "TIER_LOCKED",
    access_tier: requiredTier,
    required_entitlement: requiredEntitlement,
    upgrade_package_codes: upgradePackageCodes,
    preview,
  };
}
