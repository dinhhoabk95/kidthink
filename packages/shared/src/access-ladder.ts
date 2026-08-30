import { type EntitlementKey, PACKAGE_CATALOG } from "./entitlement-catalog.js";
import type { AccessTier } from "./taxonomy-types.js";

export const TIER_ORDER = ["free", "login", "standard", "premium"] as const;

export const TIER_RANK: Record<AccessTier, number> = {
  free: 0,
  login: 1,
  standard: 2,
  premium: 3,
};

/**
 * Bậc cần entitlement nào — mục 7.2 của
 * `docs/specs/00-foundation/access-ladder.md`. Bậc `free` không đòi key nào,
 * nên nó không có mặt ở đây và mọi chỗ dùng phải xử lý riêng.
 */
export const TIER_ENTITLEMENT: Record<AccessTier, EntitlementKey> = {
  free: "play_free_games",
  login: "play_login_games",
  standard: "play_standard_games",
  premium: "play_premium_games",
};

/**
 * Gói nào cấp entitlement mà bậc này đòi — suy từ `PACKAGE_CATALOG` chứ Cấm —
 * NEVER viết tay danh sách mã gói: `BR-PKG-01` nói catalog là nguồn sự thật
 * duy nhất, và mảng viết tay sẽ nói sai ngay lần đầu đổi gói.
 */
export function upgradePackageCodesForTier(tier: AccessTier): string[] {
  const requiredKey = TIER_ENTITLEMENT[tier];
  return Object.values(PACKAGE_CATALOG)
    .filter(
      (pkg) => pkg.status === "active" && pkg.entitlements.includes(requiredKey)
    )
    .map((pkg) => pkg.code);
}

export type CallerIdentity =
  | { kind: "guest" }
  | { kind: "user"; user_id: string; active_child_id?: string | null }
  | { kind: "manager"; manager_id: string; role?: string };

/**
 * Lõi đồng bộ của ánh xạ entitlement sang bậc — mục 7.2 của
 * `docs/specs/00-foundation/access-ladder.md`. `allowedTiers` và bộ dựng CTA
 * (`access-cta.ts`) cùng gọi hàm này, nên vẫn chỉ có **một** chỗ ánh xạ.
 */
export function highestAllowedTier(
  caller: CallerIdentity,
  activeKeys: readonly EntitlementKey[] = []
): AccessTier {
  if (caller.kind === "manager") {
    return "premium";
  }
  if (caller.kind === "guest") {
    return "free";
  }
  if (activeKeys.includes("play_premium_games")) {
    return "premium";
  }
  if (activeKeys.includes("play_standard_games")) {
    return "standard";
  }
  return caller.active_child_id ? "login" : "free";
}

export function tiersUpTo(highest: AccessTier): AccessTier[] {
  return TIER_ORDER.filter((tier) => TIER_RANK[tier] <= TIER_RANK[highest]);
}

export function allowedTiers(
  caller: CallerIdentity,
  activeKeys: EntitlementKey[] = []
): Promise<AccessTier[]> {
  if (caller.kind === "guest") {
    return Promise.resolve(["free"]);
  }
  return Promise.resolve(tiersUpTo(highestAllowedTier(caller, activeKeys)));
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
  return {
    code: "TIER_LOCKED",
    access_tier: requiredTier,
    required_entitlement: TIER_ENTITLEMENT[requiredTier],
    upgrade_package_codes: upgradePackageCodesForTier(requiredTier),
    preview,
  };
}

/**
 * Cấm — NEVER dùng cho luồng chơi game. Dùng `allowedTiers` hoặc
 * `highestAllowedTier`, là nơi duy nhất ánh xạ entitlement sang bậc theo mục
 * 7.2 của `docs/specs/00-foundation/access-ladder.md`.
 *
 * Hàm này lệch spec ở nhánh `login`: nó trả `true` chỉ vì người gọi đã đăng
 * nhập, trong khi bậc `login` đòi **đã đăng nhập VÀ có `active_child_id` hợp
 * lệ**. Chín call site còn lại nằm ở giáo án và worksheet
 * (`packages/db/src/services/lesson-plan.ts`,
 * `apps/web/server/api/users/worksheets/[code]/pdf.get.ts`); sửa nhánh này là
 * đổi phân quyền của hai bề mặt đó nên phải đi bằng task riêng có review.
 */
export function canAccessTier(
  tier: string,
  activeKeys: string[] = []
): boolean {
  if (tier === "free") {
    return true;
  }
  if (tier === "login") {
    return true;
  }
  if (tier === "standard") {
    return (
      activeKeys.includes("play_standard_games") ||
      activeKeys.includes("play_premium_games")
    );
  }
  if (tier === "premium") {
    return activeKeys.includes("play_premium_games");
  }
  return false;
}
