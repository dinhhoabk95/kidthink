/**
 * Thang cỡ chữ Canvas 2D suy từ LogicSpace (Task #268 / BR-ERC-12 / BR-A11-08).
 * Spec: `docs/design-system/05-motion-and-surface.md` §3 & `engine-render-contract.md` §7.7.
 *
 * Invariant: Strict TypeScript — CẤM any, CẤM unknown.
 * Sàn tối thiểu: 16 px CSS quy về px logic theo tỉ lệ khung nhìn.
 */

import type { LogicSpace } from "../layout/constants.js";

export type { LogicSpace } from "../layout/constants.js";

export type CanvasTypeRole =
  | "number"
  | "display"
  | "label"
  | "hud"
  | "caption"
  | "prompt"
  | "badge"
  | "subPrompt"
  | "choiceText"
  | "targetGlyph";

export const MIN_LEGIBLE_CSS_PX = 16;

/**
 * Tỉ lệ thu nhỏ xấu nhất mà bề mặt trẻ còn phải phục vụ: máy dọc 390 px CSS
 * trên cạnh ngắn logic 540. Dùng làm sàn **thận trọng** khi nơi gọi chưa dựng
 * khung nhìn (test, kết xuất ngoài màn hình). Vẽ to hơn cần thiết không vi phạm
 * `BR-A11-08`; vẽ nhỏ hơn thì có.
 */
export const REFERENCE_MOBILE_SCALE = 390 / 540;

/**
 * Thang tỷ lệ lấy nguyên từ mục 3 của `05-motion-and-surface.md`.
 * Cấm — NEVER sửa một con số ở đây mà không sửa bảng trong tài liệu thiết kế.
 */
export const CANVAS_TYPE_RATIOS: Readonly<Record<CanvasTypeRole, number>> = {
  number: 0.089,
  display: 0.081,
  label: 0.052,
  hud: 0.044,
  caption: 0.036,
  prompt: 0.044,
  badge: 0.03,
  subPrompt: 0.033,
  choiceText: 0.04,
  targetGlyph: 0.12,
};

/**
 * Chiều cao tham chiếu của thang chữ: **cạnh ngắn** của không gian logic.
 *
 * `deriveLogicSpace` ghim cạnh ngắn ở 540 và kéo dài cạnh dài theo tỉ lệ khung
 * nhìn, nên trên máy dọc `space.h` là 1168 chứ không phải 540. Nhân tỷ lệ với
 * `space.h` trần thì chữ trên máy dọc to gấp hơn hai lần desktop và khung yêu
 * cầu tràn xuống vùng nội dung. Tài liệu thiết kế nói "chiều cao logic chuẩn
 * 540 px" — 540 chính là cạnh ngắn.
 */
export function typeReferencePx(space: LogicSpace): number {
  return Math.min(space.w, space.h);
}

/**
 * Quy đổi sàn 16 px CSS sang px logic theo tỷ lệ khung nhìn hiện tại.
 *
 * Cấm — NEVER kiểm sàn bằng px logic trần: trên máy dọc 390 px tỉ lệ là ~0,72
 * nên 16 px logic chỉ ra ~11,5 px CSS. `scale` là `viewport.scale` của
 * `RenderSystem` (pixel CSS trên một đơn vị logic); thiếu nó thì lấy tỉ lệ máy
 * dọc tham chiếu làm sàn thận trọng.
 */
export function minLegiblePx(_space: LogicSpace, scale?: number): number {
  const currentScale =
    scale !== undefined && scale > 0 ? scale : REFERENCE_MOBILE_SCALE;
  return Math.ceil(MIN_LEGIBLE_CSS_PX / currentScale);
}

/**
 * Trả về cỡ chữ tính bằng px logic cho vai trò và khung nhìn logic tương ứng.
 * Đã kẹp sàn đảm bảo sau khi scale ra CSS luôn đạt ≥ 16 px CSS.
 */
export function canvasFontPx(
  space: LogicSpace,
  role: CanvasTypeRole,
  scale?: number
): number {
  const ratio = CANVAS_TYPE_RATIOS[role];
  const raw = Math.round(typeReferencePx(space) * ratio);
  return Math.max(raw, minLegiblePx(space, scale));
}
