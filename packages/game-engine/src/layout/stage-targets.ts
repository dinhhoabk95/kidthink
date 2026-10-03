/**
 * Đích trên sân khấu cho engine kéo-thả có khay (`play-stage-zones.md`, Task #283 B3):
 * vật nguồn nằm trong `zones.tray` (`computeTraySourceSlots`), đích nằm trong
 * `zones.stage` — rổ, ô, cây tách gộp, lưới, hai nửa đối xứng. Hàm thuần
 * (`BR-LAY-01`, `BR-PSZ-02`): chỉ đọc rect, sàn chạm và số ô, không đọc nội dung
 * (`BR-LAY-06`). Mọi ô không nhỏ hơn sàn chạm (`BR-LAY-04`); không cỡ nào vừa thì
 * giữ sàn và tràn sân khấu, đo ở `tests/layout/stage-engines-b3.test.ts`.
 */

import { SLOT_GAP_PX } from "#src/layout/constants";
import { STAGE_LABEL_ROW_PX } from "#src/layout/stage-groups";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot, SlotRole } from "#src/layout/types";

/** Đệm trong của sân khấu quanh khối đích — cùng cỡ khe giữa hai ô. */
const STAGE_PADDING_PX = SLOT_GAP_PX;

/** Khoảng giữa hai tầng của cây tách gộp: đủ chỗ cho đường nối vẽ giữa. */
const TREE_LEVEL_GAP_PX = 2 * SLOT_GAP_PX;

/** Bước giảm cạnh ô khi tìm cỡ vừa sân khấu. */
const CELL_STEP_PX = 4;

export interface Size {
  readonly w: number;
  readonly h: number;
}

export interface StageCellsSpec {
  readonly count: number;
  readonly stage: ZoneRect;
  readonly touchFloor: number;
  /** Cỡ ô lớn nhất; ô nhỏ hơn thì chỉ vì sân khấu chật, không bao giờ dưới sàn chạm. */
  readonly maxCell: Size;
  readonly role: SlotRole;
  /** Số cột cố định (lưới). Bỏ trống thì chọn nhiều cột nhất vừa sân khấu. */
  readonly cols?: number;
  /** Chỉ số slot đầu tiên. */
  readonly firstIndex?: number;
  /** Ô có nhãn vẽ dưới thân — chừa dải `STAGE_LABEL_ROW_PX` dưới mỗi hàng. */
  readonly hasLabels?: boolean;
}

interface CellPlan {
  readonly cols: number;
  readonly rows: number;
  readonly w: number;
  readonly h: number;
  readonly labelRowH: number;
}

function innerArea(stage: ZoneRect): ZoneRect {
  return {
    x: stage.x + STAGE_PADDING_PX,
    y: stage.y + STAGE_PADDING_PX,
    w: Math.max(0, stage.w - 2 * STAGE_PADDING_PX),
    h: Math.max(0, stage.h - 2 * STAGE_PADDING_PX),
  };
}

function toSlot(
  spec: StageCellsSpec,
  plan: CellPlan,
  index: number,
  center: { readonly x: number; readonly y: number }
): Slot {
  return {
    index: (spec.firstIndex ?? 0) + index,
    x: Math.round(center.x),
    y: Math.round(center.y),
    w: plan.w,
    h: plan.h,
    hitW: Math.max(spec.touchFloor, plan.w),
    hitH: Math.max(spec.touchFloor, plan.h),
    page: 0,
    role: spec.role,
  };
}

/** Cỡ ô vừa `cols` cột; `null` nếu dưới sàn chạm. */
function fitCols(
  spec: StageCellsSpec,
  area: ZoneRect,
  cols: number
): CellPlan | null {
  const rows = Math.ceil(spec.count / cols);
  const labelRowH = spec.hasLabels ? STAGE_LABEL_ROW_PX : 0;
  const byWidth = Math.floor((area.w - (cols - 1) * SLOT_GAP_PX) / cols);
  const byHeight = Math.floor(
    (area.h - (rows - 1) * SLOT_GAP_PX - rows * labelRowH) / rows
  );
  const w = Math.min(spec.maxCell.w, byWidth);
  const h = Math.min(spec.maxCell.h, byHeight);
  if (w < spec.touchFloor || h < spec.touchFloor) {
    return null;
  }
  return { cols, rows, w, h, labelRowH };
}

/** Không cỡ nào vừa: giữ sàn chạm, tràn sân khấu (`BR-LAY-04` cấm thu nhỏ). */
function floorPlan(spec: StageCellsSpec, area: ZoneRect): CellPlan {
  const fit = Math.floor(
    (area.w + SLOT_GAP_PX) / (spec.touchFloor + SLOT_GAP_PX)
  );
  const cols = Math.max(1, Math.min(spec.count, spec.cols ?? fit));
  return {
    cols,
    rows: Math.ceil(spec.count / cols),
    w: spec.touchFloor,
    h: spec.touchFloor,
    labelRowH: spec.hasLabels ? STAGE_LABEL_ROW_PX : 0,
  };
}

function planCells(spec: StageCellsSpec, area: ZoneRect): CellPlan {
  const fixedCols = spec.cols;
  if (fixedCols !== undefined) {
    const cols = Math.max(1, Math.min(spec.count, fixedCols));
    return fitCols(spec, area, cols) ?? floorPlan(spec, area);
  }
  // Nhiều cột nhất trước: ít hàng nhất, cao khay thấp nhất.
  for (let cols = spec.count; cols >= 1; cols--) {
    const plan = fitCols(spec, area, cols);
    if (plan) {
      return plan;
    }
  }
  return floorPlan(spec, area);
}

/**
 * Lưới ô trong sân khấu: chia hàng theo cột, hàng cuối căn giữa, cả khối căn
 * giữa sân khấu. Dùng cho rổ (GT-004), dãy ô đích (GT-008), lưới sudoku (GT-015)
 * và mỏ neo (GT-023).
 */
export function computeStageCellSlots(spec: StageCellsSpec): Slot[] {
  if (spec.count <= 0) {
    return [];
  }
  const area = innerArea(spec.stage);
  const plan = planCells(spec, area);
  const rowH = plan.h + plan.labelRowH;
  const blockH = plan.rows * rowH + (plan.rows - 1) * SLOT_GAP_PX;
  const top = area.y + Math.max(0, (area.h - blockH) / 2);
  const slots: Slot[] = [];
  for (let i = 0; i < spec.count; i++) {
    const row = Math.floor(i / plan.cols);
    const col = i % plan.cols;
    const inRow = Math.min(plan.cols, spec.count - row * plan.cols);
    const rowW = inRow * plan.w + (inRow - 1) * SLOT_GAP_PX;
    const left = area.x + (area.w - rowW) / 2;
    slots.push(
      toSlot(spec, plan, i, {
        x: left + col * (plan.w + SLOT_GAP_PX) + plan.w / 2,
        y: top + row * (rowH + SLOT_GAP_PX) + plan.h / 2,
      })
    );
  }
  return slots;
}

export interface StageTreeSpec {
  readonly partCount: number;
  readonly stage: ZoneRect;
  readonly touchFloor: number;
  /** Cạnh ô lớn nhất. */
  readonly maxCell: number;
  readonly firstIndex?: number;
}

interface TreePlan {
  readonly cell: number;
  readonly isStacked: boolean;
}

function treeExtent(partCount: number, cell: number, isStacked: boolean): Size {
  const partsW = partCount * cell + (partCount - 1) * SLOT_GAP_PX;
  if (isStacked) {
    return { w: partsW, h: 2 * cell + TREE_LEVEL_GAP_PX };
  }
  return { w: cell + TREE_LEVEL_GAP_PX + partsW, h: cell };
}

function planTree(spec: StageTreeSpec, area: ZoneRect): TreePlan {
  for (let cell = spec.maxCell; cell >= spec.touchFloor; cell -= CELL_STEP_PX) {
    // Tầng trên–dưới trước (đúng hình cây); sân khấu thấp thì tổng bên trái.
    for (const isStacked of [true, false]) {
      const extent = treeExtent(spec.partCount, cell, isStacked);
      if (extent.w <= area.w && extent.h <= area.h) {
        return { cell, isStacked };
      }
    }
  }
  return { cell: spec.touchFloor, isStacked: area.h >= area.w };
}

function treeSlot(
  spec: StageTreeSpec,
  cell: number,
  index: number,
  center: { readonly x: number; readonly y: number }
): Slot {
  const hit = Math.max(spec.touchFloor, cell);
  return {
    index: (spec.firstIndex ?? 0) + index,
    x: Math.round(center.x),
    y: Math.round(center.y),
    w: cell,
    h: cell,
    hitW: hit,
    hitH: hit,
    page: 0,
    role: "target",
  };
}

/**
 * Cây tách gộp (GT-007): ô tổng đứng trên hoặc bên trái, các ô phần xếp một hàng
 * kế đó. Slot đầu là ô tổng, các slot sau là ô phần, theo thứ tự `number-bond-tree`.
 */
export function computeStageTreeSlots(spec: StageTreeSpec): Slot[] {
  const area = innerArea(spec.stage);
  const { cell, isStacked } = planTree(spec, area);
  const extent = treeExtent(spec.partCount, cell, isStacked);
  const left = area.x + Math.max(0, (area.w - extent.w) / 2);
  const top = area.y + Math.max(0, (area.h - extent.h) / 2);
  const whole = isStacked
    ? { x: left + extent.w / 2, y: top + cell / 2 }
    : { x: left + cell / 2, y: top + cell / 2 };
  const partsLeft = isStacked ? left : left + cell + TREE_LEVEL_GAP_PX;
  const partsTop = isStacked ? top + cell + TREE_LEVEL_GAP_PX : top;
  const slots: Slot[] = [treeSlot(spec, cell, 0, whole)];
  for (let p = 0; p < spec.partCount; p++) {
    slots.push(
      treeSlot(spec, cell, 1 + p, {
        x: partsLeft + p * (cell + SLOT_GAP_PX) + cell / 2,
        y: partsTop + cell / 2,
      })
    );
  }
  return slots;
}

export type MirrorAxis = "vertical" | "horizontal";

export interface StageMirrorSpec {
  readonly count: number;
  readonly axis: MirrorAxis;
  readonly stage: ZoneRect;
  readonly touchFloor: number;
  readonly maxCell: Size;
  readonly firstIndex?: number;
}

export interface StageMirror {
  /** Mẫu tham chiếu, vai `neutral`. */
  readonly reference: readonly Slot[];
  /** Ô đích đối xứng qua trục với mẫu cùng chỉ số, vai `target`. */
  readonly targets: readonly Slot[];
  /** Đường trục, hai đầu nằm trong sân khấu. */
  readonly axisLine: {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
  };
}

function halfOf(
  stage: ZoneRect,
  axis: MirrorAxis,
  isSecond: boolean
): ZoneRect {
  const halfGap = SLOT_GAP_PX / 2;
  if (axis === "vertical") {
    const half = Math.floor(stage.w / 2);
    return {
      x: isSecond ? stage.x + half + halfGap : stage.x,
      y: stage.y,
      w: half - halfGap,
      h: stage.h,
    };
  }
  const half = Math.floor(stage.h / 2);
  return {
    x: stage.x,
    y: isSecond ? stage.y + half + halfGap : stage.y,
    w: stage.w,
    h: half - halfGap,
  };
}

function mirrorSlot(
  slot: Slot,
  stage: ZoneRect,
  axis: MirrorAxis,
  index: number
): Slot {
  const x = axis === "vertical" ? 2 * (stage.x + stage.w / 2) - slot.x : slot.x;
  const y =
    axis === "horizontal" ? 2 * (stage.y + stage.h / 2) - slot.y : slot.y;
  return { ...slot, index, x: Math.round(x), y: Math.round(y), role: "target" };
}

/**
 * Hai nửa đối xứng của GT-021: nửa đầu (trái hoặc trên) mang mẫu tham chiếu, nửa
 * sau mang ô đích đặt đúng vị trí gương của mẫu cùng chỉ số — trẻ nhìn gương
 * bằng mắt, không đếm toạ độ.
 */
export function computeStageMirror(spec: StageMirrorSpec): StageMirror {
  const first = halfOf(spec.stage, spec.axis, false);
  const reference = computeStageCellSlots({
    count: spec.count,
    stage: first,
    touchFloor: spec.touchFloor,
    maxCell: spec.maxCell,
    role: "neutral",
    firstIndex: spec.firstIndex,
  });
  const targetStart = (spec.firstIndex ?? 0) + reference.length;
  const targets = reference.map((slot, i) =>
    mirrorSlot(slot, spec.stage, spec.axis, targetStart + i)
  );
  const cx = spec.stage.x + spec.stage.w / 2;
  const cy = spec.stage.y + spec.stage.h / 2;
  const axisLine =
    spec.axis === "vertical"
      ? { x1: cx, y1: spec.stage.y, x2: cx, y2: spec.stage.y + spec.stage.h }
      : { x1: spec.stage.x, y1: cy, x2: spec.stage.x + spec.stage.w, y2: cy };
  return { reference, targets, axisLine };
}

/** Đánh lại `index` theo thứ tự trong mảng — slot đánh số liên tục. */
export function reindexSlots(slots: readonly Slot[]): Slot[] {
  return slots.map((slot, index) => ({ ...slot, index }));
}
