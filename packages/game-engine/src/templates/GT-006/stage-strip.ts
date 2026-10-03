import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";

/** Bề cao dải đường ray / trục số ở đáy sân khấu, logic px. */
const DECOR_STRIP_PX = 64;
/** Dải trang trí không được chiếm quá phần này của sân khấu thấp. */
const DECOR_STRIP_MAX_SHARE = 0.3;

export interface StageSplit {
  /** Phần dành cho dải ô. */
  readonly slots: ZoneRect;
  /** Dải đáy cho đường ray hoặc trục số, nằm trong `stage`. */
  readonly strip: ZoneRect;
}

/** Cắt `stage` thành vùng dải ô và dải trang trí ở đáy (`BR-PSZ-01`). */
export function splitStageForTrack(stage: ZoneRect): StageSplit {
  const stripH = Math.min(DECOR_STRIP_PX, stage.h * DECOR_STRIP_MAX_SHARE);
  return {
    slots: { x: stage.x, y: stage.y, w: stage.w, h: stage.h - stripH },
    strip: { x: stage.x, y: stage.y + stage.h - stripH, w: stage.w, h: stripH },
  };
}

/** Vùng chạm của mọi slot nằm trọn trong `stage`. */
export function slotsFitStage(
  slots: readonly Slot[],
  stage: ZoneRect
): boolean {
  return slots.every(
    (slot) =>
      slot.x - slot.hitW / 2 >= stage.x &&
      slot.x + slot.hitW / 2 <= stage.x + stage.w &&
      slot.y - slot.hitH / 2 >= stage.y &&
      slot.y + slot.hitH / 2 <= stage.y + stage.h
  );
}
