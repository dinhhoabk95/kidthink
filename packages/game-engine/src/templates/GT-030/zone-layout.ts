/**
 * Bố cục GT-030 trong khung năm vùng: vật đo, **một dải đo liền** và hàng đáp án
 * nằm trong `zones.stage`; đơn vị nguồn nằm trong `zones.tray` (`BR-PSZ-01`).
 * Hàm thuần: chỉ đọc rect, sàn chạm và số ô (`BR-LAY-01`, `BR-PSZ-02`).
 *
 * Chỉ số slot: 0 vật đo · 1 dải đo · 2 đơn vị nguồn · 3.. đáp án. Dải đo là
 * **một** vùng chạm dài `length_in_units × cạnh đơn vị` — cạnh đơn vị co theo bề
 * ngang sân khấu để dải luôn nằm một hàng (`BR-E030-08`), không còn lưới ô xuống
 * nhiều hàng ở khung hẹp. Vật đo dài đúng bằng dải (`BR-E030-02`).
 */

import { SLOT_GAP_PX } from "#src/layout/constants";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import { computeTraySourceSlots } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";

/** Cao thân vật đo trên dải. */
const OBJECT_H_PX = 80;
/** Cao tối thiểu của vật đo khi sân khấu quá thấp cho bố cục rộng rãi. */
const MIN_OBJECT_H_PX = 40;
/** Vạch dóng của thước nhô ra mỗi đầu thân vật từng này px. */
const GUIDE_TICK_PX = 6;
/** Cạnh lớn nhất của một đơn vị trên dải đo. */
export const UNIT_MAX_PX = 96;
/** Cạnh nhỏ nhất của một đơn vị: dưới cỡ này hình đơn vị không còn nhận ra. */
export const UNIT_MIN_PX = 24;

/** Chỉ số các slot cố định của GT-030. */
export const OBJECT_SLOT = 0;
export const STRIP_SLOT = 1;
export const SOURCE_SLOT = 2;
export const FIRST_OPTION_SLOT = 3;

interface MeasureZonesInput {
  readonly unitCount: number;
  readonly optionCount: number;
  readonly stage: ZoneRect;
  readonly tray: ZoneRect;
  readonly touchFloor: number;
}

/**
 * Cạnh một đơn vị trên dải: chia đều bề ngang sân khấu cho `unitCount` đơn vị,
 * kẹp trong `[UNIT_MIN_PX, UNIT_MAX_PX]`, làm tròn xuống số chẵn để tâm các
 * cạnh là số nguyên.
 */
export function measureUnitSize(unitCount: number, stageW: number): number {
  const fit = Math.floor((stageW - 2 * SLOT_GAP_PX) / Math.max(1, unitCount));
  const clamped = Math.min(UNIT_MAX_PX, Math.max(UNIT_MIN_PX, fit));
  return Math.floor(clamped / 2) * 2;
}

/** Số hàng một dải `count` ô cần ở bề ngang `width` khi mỗi ô không nhỏ hơn sàn chạm. */
function rowsFor(count: number, width: number, touchFloor: number): number {
  const fit = Math.floor(
    (width - 2 * SLOT_GAP_PX + SLOT_GAP_PX) / (touchFloor + SLOT_GAP_PX)
  );
  return Math.ceil(count / Math.max(1, Math.min(count, fit)));
}

/** Cao nội dung `rows` hàng ô sàn chạm, không đệm. */
function packedHeight(rows: number, touchFloor: number): number {
  return rows * touchFloor + (rows - 1) * SLOT_GAP_PX;
}

function objectSlot(
  stage: ZoneRect,
  stripW: number,
  top: number,
  objectH: number,
  hitH: number
): Slot {
  return {
    index: OBJECT_SLOT,
    x: Math.round(stage.x + stage.w / 2),
    y: Math.round(top + hitH / 2),
    w: stripW,
    h: objectH,
    hitW: stripW,
    hitH,
    page: 0,
    role: "neutral",
  };
}

function stripSlot(
  stage: ZoneRect,
  unitCount: number,
  unit: number,
  centerY: number,
  touchFloor: number
): Slot {
  const w = unitCount * unit;
  return {
    index: STRIP_SLOT,
    x: Math.round(stage.x + stage.w / 2),
    y: Math.round(centerY),
    w,
    h: unit,
    hitW: Math.max(touchFloor, w),
    hitH: Math.max(touchFloor, unit),
    page: 0,
    role: "target",
  };
}

export function computeMeasureStageSlots(input: MeasureZonesInput): Slot[] {
  const { stage, tray, touchFloor, unitCount, optionCount } = input;
  const unit = measureUnitSize(unitCount, stage.w);
  const stripW = unitCount * unit;
  const stripHitH = Math.max(touchFloor, unit);
  const optionRows = rowsFor(optionCount, stage.w, touchFloor);
  const optionsH = packedHeight(optionRows, touchFloor);
  // Vật đo cao rộng rãi khi vừa, không thì co xuống tối thiểu (`BR-PSZ-04` cấm
  // thu ô dưới sàn chạm, nên co vật đo chứ không co dải hay đáp án).
  const room = stage.h - stripHitH - optionsH - 2 * SLOT_GAP_PX;
  const objectHitH = Math.min(
    Math.max(touchFloor, OBJECT_H_PX),
    Math.max(MIN_OBJECT_H_PX, room)
  );
  // Thân vật chừa 6 px mỗi đầu cho vạch dóng của thước (`drawMeasurementGuideBar`).
  const objectH = Math.min(OBJECT_H_PX, objectHitH - 2 * GUIDE_TICK_PX);
  const total = objectHitH + stripHitH + optionsH + 2 * SLOT_GAP_PX;
  const top = stage.y + Math.max(0, (stage.h - total) / 2);
  const stripTop = top + objectHitH + SLOT_GAP_PX;
  const optionsTop = stripTop + stripHitH + SLOT_GAP_PX;
  // Dải rộng thêm đúng phần đệm trong của `computeStageCellSlots`.
  const optionsBand: ZoneRect = {
    x: stage.x,
    y: optionsTop - SLOT_GAP_PX,
    w: stage.w,
    h: optionsH + 2 * SLOT_GAP_PX,
  };
  const source = computeTraySourceSlots(1, tray, touchFloor, SOURCE_SLOT, true);
  const options = computeStageCellSlots({
    count: optionCount,
    stage: optionsBand,
    touchFloor,
    maxCell: { w: touchFloor, h: touchFloor },
    role: "neutral",
    firstIndex: FIRST_OPTION_SLOT,
  });
  return [
    objectSlot(stage, stripW, top, objectH, objectHitH),
    stripSlot(stage, unitCount, unit, stripTop + stripHitH / 2, touchFloor),
    ...source,
    ...options,
  ];
}
