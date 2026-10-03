import { TOUCH_FLOORS } from "@mindkid/shared/touch-floors";
import type { AgeBand } from "#src/contracts/types";

export const LOGIC_WIDTH = 960;
export const LOGIC_HEIGHT = 540;
export const SLOT_GAP_PX = 16;
export const SAFE_MARGIN_PX = 32;

/**
 * Lề an toàn đỉnh màn hình dành riêng cho prompt pill và khoảng thở (Task #203 / #203.11).
 * Đáy pill hướng dẫn: 540 * 0.045 + 54 = 78.3px + 5.7px khoảng thở = 84px.
 */
export const CONTENT_TOP_PX = 84;

/**
 * Chiều cao tối thiểu vùng lời dẫn — mascot, loa, picto mục tiêu
 * (`play-stage-zones.md` mục 7.2). Loa cần cao hơn thì vùng cao theo loa.
 */
export const PROMPT_ZONE_H_PX = 112;

/** Chiều cao tối thiểu khay — bằng chiều cao dock gỗ đang vẽ (`drawWoodenTokenDock`). */
export const TRAY_ZONE_H_PX = 136;

/**
 * Sàn chạm tối thiểu theo band tuổi (BR-A11-04 & BR-ENG-05)
 * Nguồn sự thật: TOUCH_FLOORS (@mindkid/shared - BR-CFO-07)
 */
export function getTouchFloor(ageBand: AgeBand): number {
  switch (ageBand) {
    case "3-4":
      return TOUCH_FLOORS.kidBand3_4;
    case "4-5":
      return TOUCH_FLOORS.kidPrimary;
    case "5-6":
      return TOUCH_FLOORS.kidMin;
    default:
      return TOUCH_FLOORS.kidPrimary;
  }
}

/**
 * Sàn chạm quy ra logic px để đạt sàn trên **px CSS thật** (`BR-PSZ-04`).
 * Canvas thu nhỏ (`cssPerLogic` < 1) thì cạnh logic phải lớn hơn sàn.
 * `cssPerLogic` không hợp lệ (0, âm, NaN) coi như 1 — cấm — NEVER sinh `NaN`.
 */
export function getTouchFloorLogicPx(
  ageBand: AgeBand,
  cssPerLogic: number
): number {
  const scale =
    Number.isFinite(cssPerLogic) && cssPerLogic > 0 ? cssPerLogic : 1;
  return Math.ceil(getTouchFloor(ageBand) / scale);
}

/**
 * Không gian logic của một màn chơi (Task #203, quyết định A).
 *
 * Trước đây cố định 960x540. Trên màn dọc hẹp, tỉ lệ thu nhỏ khi đó là
 * 390/960 = 0,406 nên sàn chạm 96 px của band 3-4 chỉ còn **39 px CSS** — dưới cả
 * ngưỡng 44 px của WCAG, chưa nói tới ngưỡng riêng cho trẻ 3-6.
 *
 * Luật mới: **cạnh ngắn luôn là 540**, cạnh dài suy ra từ tỉ lệ khung nhìn. Nhờ đó
 * tỉ lệ thu nhỏ chỉ còn phụ thuộc cạnh ngắn, và màn ngang 16:9 vẫn ra đúng 960x540
 * như cũ — không có bước nhảy hành vi cho tablet và desktop.
 */
export interface LogicSpace {
  readonly h: number;
  readonly w: number;
}

export const LOGIC_SHORT_SIDE = 540;
/** Chặn trên cạnh dài: màn siêu dài không được kéo cảnh mỏng vô hạn. */
export const LOGIC_LONG_SIDE_MAX = 1280;

export const DEFAULT_LOGIC_SPACE: LogicSpace = {
  h: LOGIC_HEIGHT,
  w: LOGIC_WIDTH,
};

/**
 * Suy không gian logic từ kích thước hộp canvas theo pixel CSS.
 *
 * Khung nhìn không hợp lệ (0 hoặc âm) thì trả về không gian mặc định thay vì chia
 * cho 0 — cấm — NEVER để hình học sinh ra `NaN`, vì slot `NaN` không vẽ được mà
 * cũng không chạm được, và không cổng nào bắt.
 */
export function deriveLogicSpace(
  cssWidth: number,
  cssHeight: number
): LogicSpace {
  if (!(cssWidth > 0 && cssHeight > 0)) {
    return DEFAULT_LOGIC_SPACE;
  }
  const shortSide = Math.min(cssWidth, cssHeight);
  const longSide = Math.max(cssWidth, cssHeight);
  const derivedLong = Math.min(
    LOGIC_LONG_SIDE_MAX,
    Math.floor((LOGIC_SHORT_SIDE * longSide) / shortSide)
  );
  return cssWidth >= cssHeight
    ? { h: LOGIC_SHORT_SIDE, w: derivedLong }
    : { h: derivedLong, w: LOGIC_SHORT_SIDE };
}

/**
 * Sàn chạm một layout dùng: có `cssPerLogic` thì tính trên px CSS thật
 * (`BR-PSZ-04`), không có thì giữ sàn logic cũ (`BR-LAY-10`).
 */
export function resolveTouchFloor(
  ageBand: AgeBand,
  cssPerLogic?: number
): number {
  return cssPerLogic === undefined
    ? getTouchFloor(ageBand)
    : getTouchFloorLogicPx(ageBand, cssPerLogic);
}
