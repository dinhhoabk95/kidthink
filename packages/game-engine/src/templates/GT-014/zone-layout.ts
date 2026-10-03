/**
 * Đặt cân và hai vùng chạm đĩa cân vào `zones.stage` (`BR-PSZ-01`, Task #283 B5).
 * Hàm thuần: chỉ đọc rect và sàn chạm (`BR-LAY-01`). Vật nguồn nằm ở `zones.tray`
 * (`computeTraySourceSlots`), không ở đây.
 */

import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { balanceScaleGeometry, type SceneBox } from "#src/render/index.js";

/** Lề hộp cân trong stage: vành đĩa và vật xếp trên đĩa không chạm mép. */
const SCALE_INSET_SIDE_PX = 12;
const SCALE_INSET_TOP_PX = 12;
/** Đế gỗ của cân vẽ tràn 8 px dưới đáy hộp. */
const SCALE_INSET_BOTTOM_PX = 16;

/** Cân không rộng quá từng này lần chiều cao: stage ngang thấp thì cân co lại, không tràn. */
const SCALE_MAX_ASPECT = 2.2;

export function scaleBoxInStage(stage: ZoneRect): SceneBox {
  const h = Math.max(0, stage.h - SCALE_INSET_TOP_PX - SCALE_INSET_BOTTOM_PX);
  const availW = Math.max(0, stage.w - 2 * SCALE_INSET_SIDE_PX);
  const w = Math.min(availW, Math.floor(h * SCALE_MAX_ASPECT));
  return {
    x: stage.x + (stage.w - w) / 2,
    y: stage.y + SCALE_INSET_TOP_PX,
    w,
    h,
  };
}

/** Vùng chạm hai đĩa ở tư thế cân bằng: trái rồi phải. */
export function panTargetSlots(box: SceneBox, touchFloor: number): Slot[] {
  const { pivotX, pivotY, beamHalf, panW, panH } = balanceScaleGeometry(box);
  const hitW = Math.max(touchFloor, panW);
  const hitH = Math.max(touchFloor, panH);
  return [-1, 1].map((side, index) => ({
    index,
    x: Math.round(pivotX + side * beamHalf),
    y: Math.round(pivotY + panH / 2),
    w: Math.round(panW),
    h: Math.round(panH),
    hitW,
    hitH,
    page: 0,
    role: "target" as const,
  }));
}
