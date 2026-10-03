import type { LogicSpace } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";

/**
 * Ca âm của lỗi QA 844x390 (2026-10-03): sân khấu tính theo cách cũ — landscape
 * không khay thì sân khấu trọn ngang và dừng trên đỉnh nút hành động. Ở hộp
 * canvas 784x250, band 3-4, sàn 96 px CSS thành 208 logic px cho cả vùng lời
 * dẫn lẫn nút hành động, nên sân khấu chỉ còn 60 logic px. Thẻ mẫu của GT-001
 * (cao tối thiểu 100) không vừa và ô lựa chọn đè lên nó.
 */
export const LEGACY_LANDSCAPE_PHONE_SPACE: LogicSpace = { w: 1280, h: 540 };

export const LEGACY_LANDSCAPE_PHONE_STAGE: ZoneRect = {
  x: 16,
  y: 240,
  w: 1248,
  h: 60,
};
