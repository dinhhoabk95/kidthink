import { AppError, type ErrorDetails } from "@mindkid/errors/base";
import {
  allowedTiers,
  buildTierLockedResponse,
  type CallerIdentity,
  type LockedPreviewMetadata,
  TIER_ORDER,
  TIER_RANK,
  type TierLockedResponse,
  upgradePackageCodesForTier,
} from "./access-ladder.js";
import type { EntitlementKey } from "./entitlement-catalog.js";
import type { AccessTier } from "./taxonomy-types.js";

export class AccessGatingError extends AppError {
  constructor(
    code: string,
    status: number,
    message: string,
    details?: Record<string, unknown>
  ) {
    super({
      code,
      status,
      message,
      details: details as ErrorDetails,
      name: "AccessGatingError",
    });
  }
}

function gatingError(
  code: string,
  details?: Record<string, unknown>
): AccessGatingError {
  switch (code) {
    case "NOT_FOUND":
    case "CHILD_NOT_OWNED":
      return new AccessGatingError(
        code,
        404,
        "Không tìm thấy nội dung.",
        details
      );
    case "NO_ACTIVE_CHILD":
      return new AccessGatingError(
        code,
        428,
        "Hãy chọn hồ sơ bé trước khi tiếp tục.",
        details
      );
    case "INSUFFICIENT_ROLE":
      return new AccessGatingError(
        code,
        403,
        "Bạn không có quyền truy cập mục này.",
        details
      );
    case "TIER_LOCKED":
      return new AccessGatingError(
        code,
        403,
        "Cần nâng cấp gói học để tiếp tục.",
        details
      );
    case "DAILY_PLAY_CAP_REACHED":
      return new AccessGatingError(
        code,
        402,
        "Đã đạt giới hạn chơi trong ngày.",
        details
      );
    case "INTRO_REQUIRED":
      return new AccessGatingError(
        code,
        428,
        "Bé cần hoàn thành bài làm quen trước khi chơi.",
        details
      );
    default:
      return new AccessGatingError(
        code,
        500,
        "Đã xảy ra lỗi phân quyền.",
        details
      );
  }
}

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
  if (caller.kind === "manager") {
    return "user_premium";
  }

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
  return upgradePackageCodesForTier(requiredTier);
}

export interface ContentTarget {
  code: string;
  access_tier: AccessTier;
  status:
    | "draft"
    | "in_review"
    | "approved"
    | "published"
    | "rejected"
    | "archived"
    | string;
  age_min: number;
  age_max: number;
  level_tier?: AccessTier | null;
  curriculum_tier?: AccessTier | null;
  title?: string;
  competency?: string;
  thumbnail_emoji?: string;
  kind?: "assess" | "teach" | string | null;
  template_kind?: "assess" | "teach" | string | null;
  primary_skill_code?: string | null;
  strand_code?: string | null;
}

export interface IntroQueueItem {
  readonly intro_level_code: string;
  readonly skill_code: string;
  readonly title: string;
  readonly thumbnail_emoji?: string;
}

export interface IntroCheckResult {
  readonly intro_required: boolean;
  readonly intro_queue?: readonly IntroQueueItem[];
  readonly intro_remaining?: number;
  readonly return_level_code?: string;
  readonly primary_skill_code?: string;
  readonly intro_level_code?: string;
}

export interface ContentAccessContext {
  caller: CallerIdentity;
  activeKeys?: EntitlementKey[];
  isManagerPreview?: boolean;
  managerAudience?: boolean;
  requiresChild?: boolean;
  callerChildAge?: number | null;
  lessonRunId?: string | null;
  verifyChildOwnership?: (
    userId: string,
    childId: string
  ) => Promise<boolean> | boolean;
  checkQuotaRemaining?: () => Promise<boolean> | boolean;
  checkIntroRequired?: (
    content: ContentTarget
  ) => Promise<IntroCheckResult | null> | IntroCheckResult | null;
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
      throw gatingError("NOT_FOUND");
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
      title: content.title,
      competency: content.competency,
      age_min: content.age_min,
      age_max: content.age_max,
      thumbnail_emoji: content.thumbnail_emoji,
    };

    const lockedResponse: TierLockedResponse = buildTierLockedResponse(
      effectiveTier,
      previewMeta
    );

    throw gatingError(
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
    throw gatingError("INSUFFICIENT_ROLE");
  }
  return true;
}

async function validateQuota(ctx: ContentAccessContext): Promise<void> {
  if (ctx.checkQuotaRemaining) {
    const hasQuota = await ctx.checkQuotaRemaining();
    if (!hasQuota) {
      throw gatingError("DAILY_PLAY_CAP_REACHED");
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

async function checkConceptIntroGate(
  content: ContentTarget,
  ctx: ContentAccessContext,
  isPreview: boolean
): Promise<void> {
  const isTeach = content.kind === "teach" || content.template_kind === "teach";
  if (isPreview || isTeach || ctx.lessonRunId || !ctx.checkIntroRequired) {
    return;
  }

  const introCheck = await ctx.checkIntroRequired(content);
  if (!introCheck?.intro_required) {
    return;
  }

  const queue = introCheck.intro_queue ?? [];
  const introLevelCode =
    introCheck.intro_level_code ?? queue[0]?.intro_level_code ?? "";

  throw gatingError("INTRO_REQUIRED", {
    intro_queue: queue,
    intro_remaining: introCheck.intro_remaining ?? 0,
    return_level_code: introCheck.return_level_code ?? content.code,
    primary_skill_code:
      introCheck.primary_skill_code ?? content.primary_skill_code ?? "",
    intro_level_code: introLevelCode,
  });
}

/**
 * BR-GAT-02: Eight steps in exact fixed order:
 * 1. Content exists and status = published -> 404 if not
 * 2. Effective tier = max(levelTier, curriculumTier) (BR-LAD-05)
 * 3. Caller identity & ownership (BR-GAT-04)
 * 4. Route requires child & child missing -> 428 (BEFORE tier check)
 * 5. allowedTiers(caller) >= effective tier -> 403 + metadata gate if not (BR-GAT-03)
 * 6. Quota remaining -> 402 if cap reached
 * 7. Age match -> 200 + age_mismatch flag if outside age_min..age_max
 * 8. Concept intro completed? -> 428 INTRO_REQUIRED if intro_queue not empty (BR-CIG-01)
 */
export async function assertContentAccess(
  content: ContentTarget | null | undefined,
  ctx: ContentAccessContext
): Promise<ContentAccessResult> {
  if (!content || (content.status !== "published" && !ctx.isManagerPreview)) {
    throw gatingError("NOT_FOUND");
  }

  const effectiveTier = resolveEffectiveTier(content);
  const caller = ctx.caller;

  await verifyChildOwnership(caller, ctx);

  const isPreview = validateManagerPreview(ctx);

  if (!isPreview) {
    const needsChild = ctx.requiresChild ?? effectiveTier !== "free";
    if (caller.kind === "user" && needsChild && !caller.active_child_id) {
      throw gatingError("NO_ACTIVE_CHILD");
    }

    await checkTierAccess(caller, effectiveTier, content, ctx);
    await validateQuota(ctx);
  }

  const ageMismatch = calculateAgeMismatch(ctx.callerChildAge, content);

  // Step 8: Pedagogical check — Concept intro completed? (BR-CIG-01, BR-CIG-06, BR-CIG-07)
  await checkConceptIntroGate(content, ctx, isPreview);

  return {
    child_id: caller.kind === "user" ? (caller.active_child_id ?? null) : null,
    is_preview: isPreview,
    age_mismatch: ageMismatch,
  };
}
