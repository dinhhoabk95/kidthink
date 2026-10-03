/**
 * Bố cục GT-030 trong khung năm vùng (`play-stage-zones.md`, Task #283 B6):
 * vật đo, dải ô đặt đơn vị và hàng đáp án nằm trong `zones.stage`; đơn vị nguồn
 * nằm trong `zones.tray` (`BR-PSZ-01`). Hàm thuần: chỉ đọc rect, sàn chạm và số
 * ô (`BR-LAY-01`, `BR-PSZ-02`). Chỉ số slot giữ nguyên như layout `measure-strip`:
 * 0 vật đo · 1..N ô đặt · N+1 đơn vị nguồn · N+2.. đáp án.
 */

import { SLOT_GAP_PX } from "#src/layout/constants";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import { computeTraySourceSlots } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";

/** Cao thân vật đo trên dải. */
const OBJECT_H_PX = 80;
/** Cạnh lớn nhất của ô đặt đơn vị và ô đáp án. */
const CELL_MAX_PX = 96;

export interface MeasureZonesInput {
  readonly unitCount: number;
  readonly optionCount: number;
  readonly stage: ZoneRect;
  readonly tray: ZoneRect;
  readonly touchFloor: number;
}

function widthOf(slots: readonly Slot[]): number {
  if (slots.length === 0) {
    return 0;
  }
  const left = Math.min(...slots.map((s) => s.x - s.w / 2));
  const right = Math.max(...slots.map((s) => s.x + s.w / 2));
  return right - left;
}

function objectSlot(stage: ZoneRect, stripW: number, touchFloor: number): Slot {
  const w = Math.max(
    touchFloor,
    Math.min(Math.round(stripW), stage.w - 2 * SLOT_GAP_PX)
  );
  return {
    index: 0,
    x: Math.round(stage.x + stage.w / 2),
    y: Math.round(stage.y + SLOT_GAP_PX + OBJECT_H_PX / 2),
    w,
    h: OBJECT_H_PX,
    hitW: w,
    hitH: Math.max(touchFloor, OBJECT_H_PX),
    page: 0,
    role: "neutral",
  };
}

/** Số hàng một dải `count` ô cần ở bề ngang `width` khi mỗi ô không nhỏ hơn sàn chạm. */
function rowsFor(count: number, width: number, touchFloor: number): number {
  const fit = Math.floor(
    (width - 2 * SLOT_GAP_PX + SLOT_GAP_PX) / (touchFloor + SLOT_GAP_PX)
  );
  return Math.ceil(count / Math.max(1, Math.min(count, fit)));
}

function bandHeight(rows: number, cellH: number): number {
  return rows * cellH + (rows - 1) * SLOT_GAP_PX + 2 * SLOT_GAP_PX;
}

/**
 * Chia phần cao còn lại giữa dải ô đặt và hàng đáp án: mỗi dải được ít nhất
 * chiều cao đủ sàn chạm, phần dư chia theo mức mỗi dải muốn nở tới cỡ lớn nhất.
 * Không đủ cho cả hai thì mỗi dải giữ mức tối thiểu và tràn sân khấu — số ca
 * đo ở `tests/layout/stage-engines-b6.test.ts`.
 */
function splitBands(
  rest: number,
  strip: number,
  options: number,
  touchFloor: number,
  width: number
): { readonly stripH: number; readonly optionsH: number } {
  const stripRows = rowsFor(strip, width, touchFloor);
  const optionRows = rowsFor(options, width, touchFloor);
  const minStrip = bandHeight(stripRows, touchFloor);
  const minOptions = bandHeight(optionRows, touchFloor);
  const wantStrip = Math.max(minStrip, bandHeight(stripRows, CELL_MAX_PX));
  const wantOptions = Math.max(minOptions, bandHeight(optionRows, CELL_MAX_PX));
  const grow = wantStrip - minStrip + (wantOptions - minOptions);
  const share =
    grow === 0
      ? 0
      : Math.min(1, Math.max(0, rest - minStrip - minOptions) / grow);
  return {
    stripH: Math.round(minStrip + (wantStrip - minStrip) * share),
    optionsH: Math.round(minOptions + (wantOptions - minOptions) * share),
  };
}

export function computeMeasureStageSlots(input: MeasureZonesInput): Slot[] {
  const { stage, tray, touchFloor, unitCount, optionCount } = input;
  const objectBand = OBJECT_H_PX + 2 * SLOT_GAP_PX;
  const rest = Math.max(0, stage.h - objectBand);
  const { stripH, optionsH } = splitBands(
    rest,
    unitCount,
    optionCount,
    touchFloor,
    stage.w
  );
  const stripBand: ZoneRect = {
    x: stage.x,
    y: stage.y + objectBand,
    w: stage.w,
    h: stripH,
  };
  const optionsBand: ZoneRect = {
    x: stage.x,
    y: stripBand.y + stripH,
    w: stage.w,
    h: optionsH,
  };
  const cell = { w: CELL_MAX_PX, h: CELL_MAX_PX };
  const units = computeStageCellSlots({
    count: unitCount,
    stage: stripBand,
    touchFloor,
    maxCell: cell,
    role: "target",
    firstIndex: 1,
  });
  const source = computeTraySourceSlots(1, tray, touchFloor, 1 + unitCount);
  const options = computeStageCellSlots({
    count: optionCount,
    stage: optionsBand,
    touchFloor,
    maxCell: cell,
    role: "neutral",
    firstIndex: 2 + unitCount,
  });
  return [
    objectSlot(stage, widthOf(units), touchFloor),
    ...units,
    ...source,
    ...options,
  ];
}
