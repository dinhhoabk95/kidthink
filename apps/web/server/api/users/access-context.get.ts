import { allowedTiers } from "@mindkid/shared";
import { defineEventHandler } from "h3";

import {
  getOptionalActiveChildUuid,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

/**
 * Ngữ cảnh quyền của người gọi, đủ để client dựng lại CTA cho cả một trang
 * danh mục — `BR-GCP-09`, mục 8 của
 * `docs/specs/02-public/game-catalog-public.md`.
 *
 * Một request cho cả trang, Cấm — NEVER một request mỗi thẻ: trần phân trang
 * là 60 (`BR-GCP-08`).
 *
 * Đây Cấm — NEVER là cổng quyền. Quyền vẫn kiểm ở handler trả nội dung
 * (`BR-GAT-01`); response này chỉ để chọn nhãn nút.
 */
export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const activeChildUuid = getOptionalActiveChildUuid(event);
  const activeKeys = await resolveUserActiveEntitlements(user.user_id);

  return {
    has_active_child: Boolean(activeChildUuid),
    active_keys: activeKeys,
    allowed_tiers: await allowedTiers(
      {
        kind: "user",
        user_id: String(user.user_id),
        active_child_id: activeChildUuid,
      },
      activeKeys
    ),
  };
});
