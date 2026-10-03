import type { StageZones } from "#src/layout/stage-zones";

/**
 * Ca âm của `BR-PSZ-04`: vùng tính theo cách cũ — sàn chạm áp ở logic px
 * (96 cho band 3-4) — trên canvas portrait 390px có `cssPerLogic` 0,72. Loa và
 * nút hành động chỉ còn khoảng 69px thật, nên phép kiểm sàn phải báo vi phạm.
 */
export const LOGIC_PX_FLOOR_CSS_PER_LOGIC = 0.72;

export const LOGIC_PX_FLOOR_ZONES: StageZones = {
  orientation: "portrait",
  promptPlacement: "top",
  prompt: { x: 16, y: 16, w: 508, h: 112 },
  promptSpeaker: { x: 144, y: 24, w: 96, h: 96 },
  stage: { x: 16, y: 144, w: 508, h: 400 },
  tray: { x: 16, y: 560, w: 508, h: 136 },
  action: { x: 428, y: 712, w: 96, h: 96 },
};
