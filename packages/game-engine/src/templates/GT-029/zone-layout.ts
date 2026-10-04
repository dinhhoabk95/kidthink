import type { AgeBand } from "#src/contracts/types";
import {
  type LogicSpace,
  resolveTouchFloor,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import { DOCK_PADDING_PX, DOCK_SLAB_ALLOWANCE_PX } from "#src/layout/slot-fit";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";

/**
 * Chia sân khấu của GT-029 (`BR-PSZ-01`): tập vật ở một bên, dock chứa các
 * phương án đáp số ở bên kia. Cả hai cùng hiện khi bớt đủ, nên chúng không được
 * dùng chung chỗ (trước đây cả hai gọi layout trên toàn canvas và đè lên nhau).
 * Portrait xếp tập trên, dock dưới; ngang xếp tập trái, dock phải.
 */

/** Phần sân khấu cho phép thử đặt dock — dock ôm sát slot nên thường nhỏ hơn. */
const OPTIONS_CANDIDATE_SHARE = 0.5;

export interface ItemsAndOptionsAreas {
  /** Vùng cho lưới vật. */
  readonly items: ZoneRect;
  /** Vùng cho hàng phương án (không gồm lề dock). */
  readonly options: ZoneRect;
}

interface LayoutParams {
  readonly ageBand: AgeBand;
  readonly logic: LogicSpace;
  readonly cssPerLogic?: number;
}

function layoutOptions(
  region: ZoneRect,
  count: number,
  params: LayoutParams
): Slot[] {
  return resolveLayout("flex-wrap")({
    slotCount: count,
    ageBand: params.ageBand,
    logic: params.logic,
    stage: region,
    cssPerLogic: params.cssPerLogic,
  });
}

function footprintOf(slots: readonly Slot[]): ZoneRect {
  const left = Math.min(...slots.map((s) => s.x - s.hitW / 2));
  const right = Math.max(...slots.map((s) => s.x + s.hitW / 2));
  const top = Math.min(...slots.map((s) => s.y - s.hitH / 2));
  const bottom = Math.max(...slots.map((s) => s.y + s.hitH / 2));
  return { x: left, y: top, w: right - left, h: bottom - top };
}

export function splitItemsAndOptions(
  stage: ZoneRect,
  optionCount: number,
  params: LayoutParams
): ItemsAndOptionsAreas {
  const isLandscape = stage.w > stage.h;
  // Ngang: dock chỉ rộng vừa một hàng ô ở sàn chạm — dock rộng hơn lấy chỗ của
  // tập vật, mà tập vật mới là thứ cần nhiều ô nhất.
  const oneRowW =
    optionCount *
      (resolveTouchFloor(params.ageBand, params.cssPerLogic) + SLOT_GAP_PX) -
    SLOT_GAP_PX;
  const candidateW = Math.min(
    Math.round(stage.w * OPTIONS_CANDIDATE_SHARE),
    oneRowW
  );
  const candidate: ZoneRect = isLandscape
    ? {
        x: stage.x + stage.w - candidateW,
        y: stage.y,
        w: candidateW,
        h: stage.h,
      }
    : {
        x: stage.x,
        y: stage.y + Math.round(stage.h * (1 - OPTIONS_CANDIDATE_SHARE)),
        w: stage.w,
        h: Math.round(stage.h * OPTIONS_CANDIDATE_SHARE),
      };
  const probe = layoutOptions(candidate, optionCount, params);
  if (probe.length === 0) {
    return { items: stage, options: candidate };
  }
  const foot = footprintOf(probe);
  const dockW = Math.round(foot.w + 2 * DOCK_PADDING_PX);
  const dockH = Math.round(
    foot.h + 2 * DOCK_PADDING_PX + DOCK_SLAB_ALLOWANCE_PX
  );
  const dock: ZoneRect = isLandscape
    ? { x: stage.x + stage.w - dockW, y: stage.y, w: dockW, h: stage.h }
    : { x: stage.x, y: stage.y + stage.h - dockH, w: stage.w, h: dockH };
  const options: ZoneRect = {
    x: dock.x + DOCK_PADDING_PX,
    y: dock.y + DOCK_PADDING_PX,
    w: dock.w - 2 * DOCK_PADDING_PX,
    h: dock.h - 2 * DOCK_PADDING_PX - DOCK_SLAB_ALLOWANCE_PX,
  };
  const items: ZoneRect = isLandscape
    ? { ...stage, w: Math.max(0, dock.x - SLOT_GAP_PX - stage.x) }
    : { ...stage, h: Math.max(0, dock.y - SLOT_GAP_PX - stage.y) };
  return { items, options };
}

export function layoutOptionSlots(
  areas: ItemsAndOptionsAreas,
  count: number,
  params: LayoutParams
): Slot[] {
  return layoutOptions(areas.options, count, params);
}

/** Cạnh ô lớn nhất khi xếp chặt — bằng ô lưới thường ở điện thoại. */
const PACKED_CELL_MAX_PX = 120;
/** Bước giảm cạnh ô khi tìm cỡ vừa. */
const PACKED_CELL_STEP_PX = 4;
/** Đệm trong của `computeStageCellSlots` quanh mỗi khối. */
const BLOCK_PADDING_PX = SLOT_GAP_PX;

interface PackedPlan {
  readonly cell: number;
  readonly itemCols: number;
  readonly optionCols: number;
  /** Vật trên, dock dưới; sai thì vật trái, dock phải. */
  readonly isStacked: boolean;
}

function blockExtent(count: number, cols: number, cell: number) {
  const rows = Math.ceil(count / cols);
  return {
    w: cols * cell + (cols - 1) * SLOT_GAP_PX,
    h: rows * cell + (rows - 1) * SLOT_GAP_PX,
  };
}

/** Cột tối đa của khối `count` ô cạnh `cell` trong bề ngang `width`. */
function colsWithin(count: number, width: number, cell: number): number {
  return Math.max(
    0,
    Math.min(count, Math.floor((width + SLOT_GAP_PX) / (cell + SLOT_GAP_PX)))
  );
}

interface PackedSearch {
  readonly stage: ZoneRect;
  readonly itemCount: number;
  readonly optionCount: number;
  readonly cell: number;
}

/** Cột vật cho một kiểu xếp ở cỡ ô `cell`; `null` nếu không kiểu nào vừa. */
function fitPacked(
  search: PackedSearch,
  isStacked: boolean
): PackedPlan | null {
  const { stage, itemCount, optionCount, cell } = search;
  const innerW = stage.w - 2 * BLOCK_PADDING_PX;
  const innerH = stage.h - 2 * BLOCK_PADDING_PX;
  const dockExtra = 2 * DOCK_PADDING_PX + DOCK_SLAB_ALLOWANCE_PX;
  for (
    let itemCols = colsWithin(itemCount, innerW, cell);
    itemCols >= 1;
    itemCols--
  ) {
    const items = blockExtent(itemCount, itemCols, cell);
    const optionW = isStacked
      ? innerW
      : innerW - items.w - 2 * BLOCK_PADDING_PX;
    const optionCols = colsWithin(optionCount, optionW, cell);
    if (optionCols < 1) {
      continue;
    }
    const options = blockExtent(optionCount, optionCols, cell);
    const isFitting = isStacked
      ? items.h + options.h + 2 * BLOCK_PADDING_PX + dockExtra <= innerH
      : items.h <= innerH && options.h + dockExtra <= innerH;
    if (isFitting) {
      return { cell, itemCols, optionCols, isStacked };
    }
  }
  return null;
}

/**
 * Tìm cỡ ô lớn nhất mà tập vật và dock đáp án cùng nằm gọn trong sân khấu,
 * không phân trang (`BR-PSZ-13`). Sân khấu ngang thử vật trái – dock phải trước,
 * rồi vật trên – dock dưới; portrait chỉ xếp trên – dưới. `null` khi ngay cả
 * sàn chạm cũng không vừa.
 */
function planPacked(
  stage: ZoneRect,
  itemCount: number,
  optionCount: number,
  touchFloor: number
): PackedPlan | null {
  const isLandscape = stage.w > stage.h;
  const arrangements = isLandscape ? [false, true] : [true];
  for (
    let cell = Math.max(PACKED_CELL_MAX_PX, touchFloor);
    cell >= touchFloor;
    cell -= PACKED_CELL_STEP_PX
  ) {
    for (const isStacked of arrangements) {
      const plan = fitPacked(
        { stage, itemCount, optionCount, cell },
        isStacked
      );
      if (plan) {
        return plan;
      }
    }
  }
  return null;
}

/**
 * Bố cục dự phòng khi lưới vật phân trang: mọi vật và mọi phương án hiện cùng
 * lúc ở cỡ lớn nhất còn vừa, không dưới sàn chạm. Không vừa cả ở sàn thì giữ sàn
 * và tràn sân khấu (số ca đo ở `tests/layout/stage-engines-b1.test.ts`).
 */
export function computePackedItemsAndOptions(
  stage: ZoneRect,
  itemCount: number,
  optionCount: number,
  touchFloor: number
): Slot[] {
  const plan = planPacked(stage, itemCount, optionCount, touchFloor) ?? {
    cell: touchFloor,
    itemCols: Math.max(1, colsWithin(itemCount, stage.w, touchFloor)),
    optionCols: Math.max(1, colsWithin(optionCount, stage.w, touchFloor)),
    isStacked: true,
  };
  const cell = { w: plan.cell, h: plan.cell };
  const items = blockExtent(itemCount, plan.itemCols, plan.cell);
  const options = blockExtent(optionCount, plan.optionCols, plan.cell);
  const itemsRect: ZoneRect = plan.isStacked
    ? { ...stage, h: items.h + 2 * BLOCK_PADDING_PX }
    : { ...stage, w: items.w + 2 * BLOCK_PADDING_PX };
  const dockRect: ZoneRect = plan.isStacked
    ? {
        x: stage.x,
        y: itemsRect.y + itemsRect.h,
        w: stage.w,
        h: stage.y + stage.h - itemsRect.y - itemsRect.h,
      }
    : {
        x: itemsRect.x + itemsRect.w,
        y: stage.y,
        w: stage.x + stage.w - itemsRect.x - itemsRect.w,
        h: stage.h,
      };
  const itemSlots = computeStageCellSlots({
    count: itemCount,
    cols: plan.itemCols,
    stage: itemsRect,
    touchFloor,
    maxCell: cell,
    role: "neutral",
  });
  const optionSlots = computeStageCellSlots({
    count: optionCount,
    cols: plan.optionCols,
    stage: {
      ...dockRect,
      h: Math.max(dockRect.h, options.h + 2 * BLOCK_PADDING_PX),
    },
    touchFloor,
    maxCell: cell,
    role: "neutral",
    firstIndex: itemCount,
  });
  return [...itemSlots, ...optionSlots];
}
