import { appError } from "@kidthink/auth";
import {
  allowedTiers,
  buildTierLockedResponse,
  type CallerIdentity,
  type LockedPreviewMetadata,
  TIER_ORDER,
  TIER_RANK,
  type TierLockedResponse,
} from "./access-ladder.js";
import { type EntitlementKey, PACKAGE_CATALOG } from "./entitlement-catalog.js";
import type { AccessTier } from "./taxonomy-types.js";

/**
 * BR-GAT-05: 5 caller statuses x 4 access tiers = 20 matrix cells
 */
export const CALLER_STATUSES = [
  "guest",
  "user_no_child",
  "user_child_no_pkg",
  "user_standard",
  "user_premium",
] as const;

export type CallerStatus = (typeof CALLER_STATUSES)[number];

export const GATING_MATRIX: Record<CallerStatus, Record<AccessTier, number>> = {
  guest: { free: 200, login: 403, standard: 403, premium: 403 },
  user_no_child: { free: 200, login: 428, standard: 428, premium: 428 },
  user_child_no_pkg: { free: 200, login: 200, standard: 403, premium: 403 },
  user_standard: { free: 200, login: 200, standard: 200, premium: 403 },
  user_premium: { free: 200, login: 200, standard: 200, premium: 200 },
};

export function getExpectedGatingStatus(
  callerStatus: CallerStatus,
  tier: AccessTier
): number {
  return GATING_MATRIX[callerStatus][tier];
}

export function getCallerStatus(
  caller: CallerIdentity,
  activeKeys: EntitlementKey[] = []
): CallerStatus {
  if (caller.kind === "guest") {
    return "guest";
  }

  if (!caller.active_child_id) {
    return "user_no_child";
  }

  if (activeKeys.includes("play_premium_games")) {
    return "user_premium";
  }

  if (activeKeys.includes("play_standard_games")) {
    return "user_standard";
  }

  return "user_child_no_pkg";
}

/**
 * Get package codes that grant the required entitlement dynamically from catalog
 */
export function getUpgradePackageCodes(requiredTier: AccessTier): string[] {
  let requiredKey: EntitlementKey = "play_login_games";
  if (requiredTier === "premium") {
    requiredKey = "play_premium_games";
  } else if (requiredTier === "standard") {
    requiredKey = "play_standard_games";
  }

  const matchingPackages = Object.values(PACKAGE_CATALOG).filter(
    (pkg) => pkg.status === "active" && pkg.entitlements.includes(requiredKey)
  );

  return matchingPackages.map((pkg) => pkg.code);
}

export interface ContentTarget {
  code: string;
  access_tier: AccessTier;
  status: "draft" | "published" | "archived";
  age_min: number;
  age_max: number;
  level_tier?: AccessTier | null;
  curriculum_tier?: AccessTier | null;
  title_vi?: string;
  competency?: string;
  thumbnail_emoji?: string;
}

export interface ContentAccessContext {
  caller: CallerIdentity;
  activeKeys?: EntitlementKey[];
  isManagerPreview?: boolean;
  managerAudience?: boolean;
  requiresChild?: boolean;
  callerChildAge?: number | null;
  verifyChildOwnership?: (
    userId: string,
    childId: string
  ) => Promise<boolean> | boolean;
  checkQuotaRemaining?: () => Promise<boolean> | boolean;
}

export interface ContentAccessResult {
  child_id: string | null;
  is_preview: boolean;
  age_mismatch: boolean;
}

function resolveEffectiveTier(content: ContentTarget): AccessTier {
  const levelTier = content.level_tier ?? content.access_tier ?? "premium";
  const curriculumTier = content.curriculum_tier ?? "free";
  const levelRank = TIER_RANK[levelTier as AccessTier] ?? TIER_RANK.premium;
  const curriculumRank =
    TIER_RANK[curriculumTier as AccessTier] ?? TIER_RANK.free;
  const maxRank = Math.max(levelRank, curriculumRank);

  return TIER_ORDER[maxRank] ?? "premium";
}

async function verifyChildOwnership(
  caller: CallerIdentity,
  ctx: ContentAccessContext
): Promise<void> {
  if (
    caller.kind === "user" &&
    caller.active_child_id &&
    ctx.verifyChildOwnership
  ) {
    const isOwner = await ctx.verifyChildOwnership(
      caller.user_id,
      caller.active_child_id
    );
    if (!isOwner) {
      throw appError("NOT_FOUND");
    }
  }
}

async function checkTierAccess(
  caller: CallerIdentity,
  effectiveTier: AccessTier,
  content: ContentTarget,
  ctx: ContentAccessContext
): Promise<void> {
  const allowed = await allowedTiers(caller, ctx.activeKeys ?? []);
  if (!allowed.includes(effectiveTier)) {
    const previewMeta: LockedPreviewMetadata = {
      title_vi: content.title_vi,
      competency: content.competency,
      age_min: content.age_min,
      age_max: content.age_max,
      thumbnail_emoji: content.thumbnail_emoji,
    };

    const lockedResponse: TierLockedResponse = buildTierLockedResponse(
      effectiveTier,
      previewMeta
    );

    throw appError(
      "TIER_LOCKED",
      lockedResponse as unknown as Record<string, unknown>
    );
  }
}

function validateManagerPreview(ctx: ContentAccessContext): boolean {
  if (!ctx.isManagerPreview) {
    return false;
  }
  if (!ctx.managerAudience) {
    throw appError("INSUFFICIENT_ROLE");
  }
  return true;
}

async function validateQuota(ctx: ContentAccessContext): Promise<void> {
  if (ctx.checkQuotaRemaining) {
    const hasQuota = await ctx.checkQuotaRemaining();
    if (!hasQuota) {
      throw appError("DAILY_PLAY_CAP_REACHED");
    }
  }
}

function calculateAgeMismatch(
  callerChildAge: number | null | undefined,
  content: ContentTarget
): boolean {
  if (callerChildAge === undefined || callerChildAge === null) {
    return false;
  }
  return callerChildAge < content.age_min || callerChildAge > content.age_max;
}

/**
 * BR-GAT-02: Seven steps in exact fixed order:
 * 1. Content exists and status = published -> 404 if not
 * 2. Effective tier = max(levelTier, curriculumTier) (BR-LAD-05)
 * 3. Caller identity & ownership (BR-GAT-04)
 * 4. Route requires child & child missing -> 428 (BEFORE tier check)
 * 5. allowedTiers(caller) >= effective tier -> 403 + metadata gate if not (BR-GAT-03)
 * 6. Quota remaining -> 402 if cap reached
 * 7. Age match -> 200 + age_mismatch flag if outside age_min..age_max
 */
export async function assertContentAccess(
  content: ContentTarget | null | undefined,
  ctx: ContentAccessContext
): Promise<ContentAccessResult> {
  if (!content || (content.status !== "published" && !ctx.isManagerPreview)) {
    throw appError("NOT_FOUND");
  }

  const effectiveTier = resolveEffectiveTier(content);
  const caller = ctx.caller;

  await verifyChildOwnership(caller, ctx);

  const isPreview = validateManagerPreview(ctx);

  if (!isPreview) {
    const needsChild = ctx.requiresChild ?? effectiveTier !== "free";
    if (caller.kind === "user" && needsChild && !caller.active_child_id) {
      throw appError("NO_ACTIVE_CHILD");
    }

    await checkTierAccess(caller, effectiveTier, content, ctx);
    await validateQuota(ctx);
  }

  const ageMismatch = calculateAgeMismatch(ctx.callerChildAge, content);

  return {
    child_id: caller.kind === "user" ? (caller.active_child_id ?? null) : null,
    is_preview: isPreview,
    age_mismatch: ageMismatch,
  };
}
