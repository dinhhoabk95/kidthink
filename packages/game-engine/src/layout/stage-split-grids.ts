/**
 * Hai khối ô cạnh nhau trong `zones.stage` (`play-stage-zones.md`, Task #283):
 * khối trái và khối phải mỗi bên một nửa sân khấu, mỗi khối tự chia hàng cột
 * như `computeStageCellSlots` — không phân trang, không dưới sàn chạm
 * (`BR-PSZ-13`, `BR-PSZ-04`). Dùng khi cột đơn của layout hai cột không đủ chỗ
 * ở canvas thấp: bốn ô một cột cần 4 hàng, hai khối 2×2 chỉ cần 2.
 */

import { SLOT_GAP_PX } from "#src/layout/constants";
import { computeStageCellSlots, type Size } from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot, SlotRole } from "#src/layout/types";

export interface SplitGridsSpec {
  readonly leftCount: number;
  readonly rightCount: number;
  readonly stage: ZoneRect;
  readonly touchFloor: number;
  readonly maxCell: Size;
  readonly leftRole: SlotRole;
  readonly rightRole: SlotRole;
}

/** Mọi vùng chạm của `slots` nằm trong `stage`. */
export function slotsFitStage(
  slots: readonly Slot[],
  stage: ZoneRect
): boolean {
  return slots.every(
    (slot) =>
      slot.page === 0 &&
      slot.x - slot.hitW / 2 >= stage.x &&
      slot.x + slot.hitW / 2 <= stage.x + stage.w &&
      slot.y - slot.hitH / 2 >= stage.y &&
      slot.y + slot.hitH / 2 <= stage.y + stage.h
  );
}

export function computeSplitGridSlots(spec: SplitGridsSpec): Slot[] {
  const { stage } = spec;
  const halfW = Math.floor((stage.w - SLOT_GAP_PX) / 2);
  const left: ZoneRect = { ...stage, w: halfW };
  const right: ZoneRect = { ...stage, x: stage.x + stage.w - halfW, w: halfW };
  const common = {
    touchFloor: spec.touchFloor,
    maxCell: spec.maxCell,
  };
  return [
    ...computeStageCellSlots({
      ...common,
      count: spec.leftCount,
      stage: left,
      role: spec.leftRole,
    }),
    ...computeStageCellSlots({
      ...common,
      count: spec.rightCount,
      stage: right,
      role: spec.rightRole,
      firstIndex: spec.leftCount,
    }),
  ];
}
