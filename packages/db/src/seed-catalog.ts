/**
 * Hàng dữ liệu nền suy ra từ catalog trong `@mindkid/shared`, đã đúng hình dạng
 * để `insert` bằng Drizzle.
 *
 * Tách khỏi `seed.ts` ngày 2026-09-03 (Task #208 giai đoạn 1). Lý do: `seed.ts`
 * nhập tĩnh `runSeedContent`, chuỗi đó kéo ~44.000 dòng kho nội dung vào **mọi**
 * nơi dùng `@mindkid/db`. Bốn hằng số dưới đây thì thuần — chỉ đọc catalog và
 * đổi tên trường sang `camelCase` của Drizzle — nên chúng ở lại bề mặt công khai
 * của package, còn `seed()` lui về lối vào riêng `@mindkid/db/seed`.
 *
 * `PACKAGE_CATALOG` là nguồn sự thật duy nhất cho giá và quyền lợi (`BR-PKG-01`);
 * file này ❌ NEVER khai lại giá trị nào của nó.
 */

import {
  ENTITLEMENT_KEYS,
  PACKAGE_CATALOG,
  PENDING_PRICE_VND as PENDING_PRICE,
} from "@mindkid/shared";

export const PENDING_PRICE_VND = PENDING_PRICE;

export const SEED_ENTITLEMENT_KEYS = ENTITLEMENT_KEYS.map((item) => ({
  key: item.key,
  group: item.group,
  label: item.label,
  isMvp: item.is_mvp,
}));

export const SEED_PACKAGES = Object.values(PACKAGE_CATALOG).map((pkg) => ({
  code: pkg.code,
  name: pkg.name,
  audience: pkg.audience,
  description: pkg.description,
  status: pkg.status,
  offers: pkg.offers,
  quotas: pkg.quotas,
  isPublic: pkg.is_public,
  isFeatured: pkg.is_featured,
}));

export const SEED_PACKAGE_ENTITLEMENTS = Object.values(PACKAGE_CATALOG).flatMap(
  (pkg) =>
    pkg.entitlements.map((key) => ({
      packageCode: pkg.code,
      entitlementKey: key,
    }))
);
