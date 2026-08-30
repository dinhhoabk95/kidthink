import { highestAllowedTier, TIER_RANK } from "./access-ladder.js";
import type { EntitlementKey } from "./entitlement-catalog.js";
import type { AccessTier } from "./taxonomy-types.js";

/**
 * Từ vựng CTA — tập đóng năm hành động, `BR-GDP-09`, mục 7.4 của
 * `docs/specs/02-public/game-detail-public.md`.
 *
 * Module này Cấm — NEVER import `access-gating.js`: module đó chạm
 * `@mindkid/auth` nên không nằm trong barrel `./client`, mà CTA phải dựng được
 * cả ở máy chủ lẫn trình duyệt (`BR-GCP-09`, hai pha SSR rồi hydrate).
 */
export const CTA_ACTIONS = [
  "play",
  "login",
  "select_child",
  "upgrade_standard",
  "upgrade_premium",
] as const;

export type CtaAction = (typeof CTA_ACTIONS)[number];

export interface CtaViewer {
  readonly is_authenticated: boolean;
  readonly has_active_child: boolean;
  readonly active_keys: readonly EntitlementKey[];
}

export interface LevelCta {
  readonly action: CtaAction;
  readonly text: string;
  readonly href: string;
}

export const GUEST_CTA_VIEWER: CtaViewer = {
  is_authenticated: false,
  has_active_child: false,
  active_keys: [],
};

const CTA_TEXT: Record<CtaAction, string> = {
  play: "Cho bé chơi ngay",
  login: "Đăng nhập để chơi",
  select_child: "Chọn hồ sơ bé",
  upgrade_standard: "Nâng cấp Gói Tiêu chuẩn",
  upgrade_premium: "Nâng cấp Gói Premium",
};

function playHref(code: string): string {
  return `/play/${code}`;
}

function upgradeAction(tier: AccessTier): CtaAction {
  return tier === "standard" ? "upgrade_standard" : "upgrade_premium";
}

function buildCta(action: CtaAction, code: string): LevelCta {
  const text = CTA_TEXT[action];
  if (action === "play") {
    return { action, text, href: playHref(code) };
  }
  if (action === "login") {
    return {
      action,
      text,
      href: `/login?redirect=${encodeURIComponent(playHref(code))}`,
    };
  }
  if (action === "select_child") {
    return {
      action,
      text,
      href: `/me/children?redirect=${encodeURIComponent(playHref(code))}`,
    };
  }
  return { action, text, href: "/pricing" };
}

function resolveAction(tier: AccessTier, viewer: CtaViewer): CtaAction {
  if (!viewer.is_authenticated) {
    if (tier === "free") {
      return "play";
    }
    return tier === "login" ? "login" : upgradeAction(tier);
  }

  // Bậc mà entitlement của người này mở ra, giả định đã có hồ sơ bé. Tách hai
  // rào chắn: `highestAllowedTier` xét entitlement **trước** hồ sơ bé, nên nó
  // một mình không nói được người dùng còn thiếu gì.
  const unlockedByEntitlement = highestAllowedTier(
    { kind: "user", user_id: "cta", active_child_id: "cta-child" },
    viewer.active_keys
  );

  // Thiếu gói là rào chắn thắng: chọn bé xong vẫn bị chặn, nên mời chọn bé chỉ
  // đẩy người dùng đi một vòng vô ích (`BR-GAT-09`).
  if (TIER_RANK[tier] > TIER_RANK[unlockedByEntitlement]) {
    return upgradeAction(tier);
  }

  // Bước 4 của `assertContentAccess` đòi hồ sơ bé cho **mọi** bậc khác `free`,
  // độc lập với entitlement — đó là ô 428 của mục 7.1
  // `docs/specs/04-play/access-gating.md`.
  if (tier !== "free" && !viewer.has_active_child) {
    return "select_child";
  }

  return "play";
}

export function resolveLevelCta(
  code: string,
  tier: AccessTier,
  viewer: CtaViewer
): LevelCta {
  return buildCta(resolveAction(tier, viewer), code);
}
