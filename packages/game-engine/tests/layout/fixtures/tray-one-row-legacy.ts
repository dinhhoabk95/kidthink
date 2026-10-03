import { SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";

/**
 * Fixture ca âm `BR-PSZ-13`: khay **một hàng** của trước #283 — mọi vật chia đều
 * bề ngang khay dù không đủ chỗ ở sàn chạm, nên vùng chạm kề nhau chồng nhau.
 * Test dùng nó để chứng minh phép kiểm vùng chạm đỏ khi bỏ khay nhiều hàng.
 */
export function legacyOneRowTraySlots(
  count: number,
  tray: ZoneRect,
  touchFloor: number
): Slot[] {
  const pad = SLOT_GAP_PX;
  const pitch = (tray.w - 2 * pad) / count;
  return Array.from({ length: count }, (_, index) => ({
    index,
    x: Math.round(tray.x + pad + pitch * (index + 0.5)),
    y: Math.round(tray.y + tray.h / 2),
    w: touchFloor,
    h: touchFloor,
    hitW: touchFloor,
    hitH: touchFloor,
    page: 0,
    role: "source" as const,
  }));
}
