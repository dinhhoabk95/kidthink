import { describe, expect, it } from "vitest";

import {
  CTA_ACTIONS,
  type CtaAction,
  type CtaViewer,
  GUEST_CTA_VIEWER,
  resolveLevelCta,
} from "#src/access-cta";
import { TIER_ORDER } from "#src/access-ladder";
import type { EntitlementKey } from "#src/entitlement-catalog";
import type { AccessTier } from "#src/taxonomy-types";

const CODE = "GL-C1-CNT-CARD-0001";

const STANDARD_KEYS: EntitlementKey[] = [
  "play_login_games",
  "play_standard_games",
];
const PREMIUM_KEYS: EntitlementKey[] = [
  "play_login_games",
  "play_standard_games",
  "play_premium_games",
];

const guest: CtaViewer = GUEST_CTA_VIEWER;
const userNoChild: CtaViewer = {
  is_authenticated: true,
  has_active_child: false,
  active_keys: [],
};
const userChildNoPkg: CtaViewer = {
  is_authenticated: true,
  has_active_child: true,
  active_keys: [],
};
const userStandard: CtaViewer = {
  is_authenticated: true,
  has_active_child: true,
  active_keys: STANDARD_KEYS,
};
const userPremium: CtaViewer = {
  is_authenticated: true,
  has_active_child: true,
  active_keys: PREMIUM_KEYS,
};

/**
 * Ma trận CTA của `BR-GDP-09` — mục 7.4 của
 * `docs/specs/02-public/game-detail-public.md`. Đây là bảng **nhãn nút**, cố ý
 * khác bảng mã HTTP ở mục 7.1 của `docs/specs/04-play/access-gating.md`
 * (`BR-GAT-09`).
 */
const MATRIX: ReadonlyArray<{
  readonly name: string;
  readonly viewer: CtaViewer;
  readonly expected: Record<AccessTier, CtaAction>;
}> = [
  {
    name: "guest",
    viewer: guest,
    expected: {
      free: "play",
      login: "login",
      standard: "upgrade_standard",
      premium: "upgrade_premium",
    },
  },
  {
    name: "user_no_child",
    viewer: userNoChild,
    expected: {
      free: "play",
      login: "select_child",
      standard: "upgrade_standard",
      premium: "upgrade_premium",
    },
  },
  {
    name: "user_child_no_pkg",
    viewer: userChildNoPkg,
    expected: {
      free: "play",
      login: "play",
      standard: "upgrade_standard",
      premium: "upgrade_premium",
    },
  },
  {
    name: "user_standard",
    viewer: userStandard,
    expected: {
      free: "play",
      login: "play",
      standard: "play",
      premium: "upgrade_premium",
    },
  },
  {
    name: "user_premium",
    viewer: userPremium,
    expected: {
      free: "play",
      login: "play",
      standard: "play",
      premium: "play",
    },
  },
];

describe("resolveLevelCta — BR-GDP-09 ma trận 20 ô", () => {
  for (const row of MATRIX) {
    for (const tier of TIER_ORDER) {
      it(`${row.name} × ${tier} cho ra ${row.expected[tier]}`, () => {
        const cta = resolveLevelCta(CODE, tier, row.viewer);

        expect(cta.action).toBe(row.expected[tier]);
      });
    }
  }
});

describe("resolveLevelCta — đích điều hướng", () => {
  it("play trỏ thẳng trang chơi", () => {
    const cta = resolveLevelCta(CODE, "free", guest);

    expect(cta.href).toBe(`/play/${CODE}`);
    expect(cta.text).toBe("Cho bé chơi ngay");
  });

  it("login mang theo đích trong tham số redirect", () => {
    const cta = resolveLevelCta(CODE, "login", guest);

    expect(cta.href).toBe(
      `/login?redirect=${encodeURIComponent(`/play/${CODE}`)}`
    );
    expect(cta.text).toBe("Đăng nhập để chơi");
  });

  it("select_child mang theo đích trong tham số redirect", () => {
    const cta = resolveLevelCta(CODE, "login", userNoChild);

    expect(cta.href).toBe(
      `/me/children?redirect=${encodeURIComponent(`/play/${CODE}`)}`
    );
    expect(cta.text).toBe("Chọn hồ sơ bé");
  });

  it("hai hành động nâng cấp cùng về trang giá", () => {
    expect(resolveLevelCta(CODE, "standard", guest).href).toBe("/pricing");
    expect(resolveLevelCta(CODE, "premium", guest).href).toBe("/pricing");
  });
});

describe("resolveLevelCta — BR-GAT-09 ưu tiên rào chắn tự gỡ được", () => {
  it("thiếu cả hồ sơ bé lẫn gói thì mời nâng cấp, không mời chọn bé", () => {
    const cta = resolveLevelCta(CODE, "standard", userNoChild);

    expect(cta.action).toBe("upgrade_standard");
  });

  it("có gói mà thiếu hồ sơ bé thì mời chọn bé", () => {
    const cta = resolveLevelCta(CODE, "standard", {
      is_authenticated: true,
      has_active_child: false,
      active_keys: STANDARD_KEYS,
    });

    expect(cta.action).toBe("select_child");
  });

  it("user standard xem bậc premium mà chưa chọn bé vẫn là thiếu gói", () => {
    const cta = resolveLevelCta(CODE, "premium", {
      is_authenticated: true,
      has_active_child: false,
      active_keys: STANDARD_KEYS,
    });

    expect(cta.action).toBe("upgrade_premium");
  });
});

describe("resolveLevelCta — tập đóng", () => {
  it("mọi tổ hợp chỉ sinh ra action trong tập đóng", () => {
    for (const row of MATRIX) {
      for (const tier of TIER_ORDER) {
        expect(CTA_ACTIONS).toContain(
          resolveLevelCta(CODE, tier, row.viewer).action
        );
      }
    }
  });

  it("mã level được escape khi ghép vào redirect", () => {
    const cta = resolveLevelCta("GL C1/../x", "login", guest);

    expect(cta.href).not.toContain("/../");
  });
});
