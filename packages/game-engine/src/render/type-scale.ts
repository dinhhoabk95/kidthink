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
export const REFERENCE_MOBILE_SCALE = 390 / 540;

export const CANVAS_TYPE_RATIOS: Readonly<Record<CanvasTypeRole, number>> = {
  number: 0.089,
  display: 0.081,
  label: 0.033, // 18px / 540
  hud: 0.044,
  caption: 0.036,
  prompt: 0.044, // 24px / 540
  badge: 0.03, // 16px / 540
  subPrompt: 0.033, // 18px / 540
  choiceText: 0.04, // 22px / 540
  targetGlyph: 0.12, // 65px / 540
};

/**
 * Quy đổi sàn 16 px CSS sang px logic theo tỷ lệ khung nhìn hiện tại.
 * Không bao giờ kiểm sàn bằng px logic trần — sàn 16 px CSS trên màn dọc 390px (scale ~0.72)
 * cần ít nhất 23 px logic để đảm bảo không dưới 16 px CSS (BR-ERC-12, BR-A11-08).
 */
export function minLegiblePx(space: LogicSpace, scale?: number): number {
  const currentScale =
    scale ?? (space.h > space.w ? REFERENCE_MOBILE_SCALE : 1);
  if (currentScale <= 0) {
    return MIN_LEGIBLE_CSS_PX;
  }
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
  const raw = Math.round(space.h * ratio);
  return Math.max(raw, minLegiblePx(space, scale));
}
