import { defineEventHandler } from "h3";
import { getUserAccessContext } from "#server/services/identity-service";
import {
  getOptionalActiveChildUuid,
  requireWebUserSession,
} from "#server/utils/auth-runtime";

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
  const candidateChildUuid = getOptionalActiveChildUuid(event);
  return await getUserAccessContext(user.user_id, candidateChildUuid);
});
