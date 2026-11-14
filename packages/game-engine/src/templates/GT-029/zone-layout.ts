import type { AgeBand } from "#src/contracts/types";
import {
  type LogicSpace,
  resolveTouchFloor,
  SLOT_GAP_PX,
} from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import {
  DOCK_PADDING_PX,
  DOCK_SLAB_ALLOWANCE_PX,
  dockRectAroundSlots,
  insetDrawSize,
  legacyStageArea,
  splitCaption,
} from "#src/layout/slot-fit";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type { SceneBox } from "#src/render/types";

/**
 * Chia sân khấu của GT-029 (`BR-PSZ-01`): tập vật ở một bên, dock chứa các
 * phương án đáp số ở bên kia. Cả hai cùng hiện khi bớt đủ, nên chúng không được
 * dùng chung chỗ. Portrait xếp tập trên, dock dưới (hoặc trái-phải khi quá cao);
 * ngang xếp tập trái, dock phải.
 */

const OPTIONS_CANDIDATE_SHARE = 0.5;
const PACKED_CELL_MAX_PX = 120;
const PACKED_CELL_STEP_PX = 4;
const BLOCK_PADDING_PX = SLOT_GAP_PX;
const MAX_PACKED_ITEM_COLS = 4;

export interface ItemsAndOptionsAreas {
  readonly items: ZoneRect;
  readonly options: ZoneRect;
}

export interface LayoutParams {
  readonly ageBand: AgeBand;
  readonly cssPerLogic?: number;
  readonly logic: LogicSpace;
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

interface PackedPlan {
  readonly cell: number;
  readonly isStacked: boolean;
  readonly itemCols: number;
  readonly optionCols: number;
}

function blockExtent(
  count: number,
  cols: number,
  cell: number
): { readonly w: number; readonly h: number } {
  const rows = Math.ceil(count / cols);
  return {
    w: cols * cell + (cols - 1) * SLOT_GAP_PX,
    h: rows * cell + (rows - 1) * SLOT_GAP_PX,
  };
}

function colsWithin(count: number, width: number, cell: number): number {
  return Math.max(
    0,
    Math.min(count, Math.floor((width + SLOT_GAP_PX) / (cell + SLOT_GAP_PX)))
  );
}

interface PackedSearch {
  readonly cell: number;
  readonly itemCount: number;
  readonly optionCount: number;
  readonly stage: ZoneRect;
}

function fitPacked(
  search: PackedSearch,
  isStacked: boolean
): PackedPlan | null {
  const { stage, itemCount, optionCount, cell } = search;
  const innerW = stage.w - 2 * BLOCK_PADDING_PX;
  const innerH = stage.h - 2 * BLOCK_PADDING_PX;
  const dockExtra = 2 * DOCK_PADDING_PX + DOCK_SLAB_ALLOWANCE_PX;
  for (
    let itemCols = Math.min(
      MAX_PACKED_ITEM_COLS,
      colsWithin(itemCount, innerW, cell)
    );
    itemCols >= 1;
    itemCols--
  ) {
    const items = blockExtent(itemCount, itemCols, cell);
    const optionW = isStacked
      ? innerW
      : stage.w - 2 * DOCK_PADDING_PX - items.w - SLOT_GAP_PX;
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

function planPacked(
  stage: ZoneRect,
  itemCount: number,
  optionCount: number,
  touchFloor: number
): PackedPlan | null {
  const isLandscape = stage.w > stage.h;
  const arrangements = isLandscape ? [false, true] : [true, false];
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

function fallbackPackedPlan(
  stage: ZoneRect,
  itemCount: number,
  optionCount: number,
  touchFloor: number
): PackedPlan {
  const innerW = Math.max(touchFloor, stage.w - 2 * BLOCK_PADDING_PX);
  const sItemCols = Math.max(1, colsWithin(itemCount, innerW, touchFloor));
  const sOptCols = Math.max(1, colsWithin(optionCount, innerW, touchFloor));
  const sRows =
    Math.ceil(itemCount / sItemCols) + Math.ceil(optionCount / sOptCols);

  for (
    let itemCols = colsWithin(itemCount, stage.w, touchFloor);
    itemCols >= 1;
    itemCols--
  ) {
    const items = blockExtent(itemCount, itemCols, touchFloor);
    const optW = stage.w - 2 * DOCK_PADDING_PX - items.w - SLOT_GAP_PX;
    const optionCols = colsWithin(optionCount, optW, touchFloor);
    if (optionCols >= 1) {
      const sideRows = Math.max(
        Math.ceil(itemCount / itemCols),
        Math.ceil(optionCount / optionCols)
      );
      if (sideRows < sRows) {
        return { cell: touchFloor, itemCols, optionCols, isStacked: false };
      }
    }
  }
  return {
    cell: touchFloor,
    itemCols: sItemCols,
    optionCols: sOptCols,
    isStacked: true,
  };
}

function buildSlotsFromPlan(
  stage: ZoneRect,
  itemCount: number,
  optionCount: number,
  touchFloor: number,
  plan: PackedPlan
): Slot[] {
  const cell = { w: plan.cell, h: plan.cell };
  const items = blockExtent(itemCount, plan.itemCols, plan.cell);
  const options = blockExtent(optionCount, plan.optionCols, plan.cell);
  const sideDockW = Math.max(
    options.w + 2 * DOCK_PADDING_PX,
    Math.round(options.w + (stage.w - items.w - options.w - SLOT_GAP_PX) * 0.5)
  );
  const sideItemsW = Math.max(items.w + DOCK_PADDING_PX, stage.w - sideDockW);
  const sideH = Math.max(
    stage.h,
    items.h + 2 * BLOCK_PADDING_PX,
    options.h + 2 * BLOCK_PADDING_PX
  );
  const itemsRect: ZoneRect = plan.isStacked
    ? { ...stage, h: items.h + 2 * BLOCK_PADDING_PX }
    : { ...stage, w: sideItemsW, h: sideH };
  const dockRect: ZoneRect = plan.isStacked
    ? {
        x: stage.x,
        y: itemsRect.y + itemsRect.h,
        w: stage.w,
        h: Math.max(
          stage.y + stage.h - itemsRect.y - itemsRect.h,
          options.h + 2 * BLOCK_PADDING_PX
        ),
      }
    : {
        x: itemsRect.x + itemsRect.w,
        y: stage.y,
        w: stage.x + stage.w - itemsRect.x - itemsRect.w,
        h: sideH,
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
    stage: dockRect,
    touchFloor,
    maxCell: cell,
    role: "neutral",
    firstIndex: itemCount,
  });
  return [...itemSlots, ...optionSlots];
}

export function computePackedItemsAndOptions(
  stage: ZoneRect,
  itemCount: number,
  optionCount: number,
  touchFloor: number
): Slot[] {
  const plan =
    planPacked(stage, itemCount, optionCount, touchFloor) ??
    fallbackPackedPlan(stage, itemCount, optionCount, touchFloor);
  return buildSlotsFromPlan(stage, itemCount, optionCount, touchFloor, plan);
}

export function computeGT029Slots(params: {
  readonly ageBand: AgeBand;
  readonly cssPerLogic?: number;
  readonly logic: LogicSpace;
  readonly optionCount: number;
  readonly stageRect?: ZoneRect;
  readonly totalItems: number;
}): readonly Slot[] {
  const { ageBand, cssPerLogic, logic, optionCount, stageRect, totalItems } =
    params;
  const body = stageRect ? splitCaption(stageRect).body : undefined;
  const layoutParams: LayoutParams = { ageBand, logic, cssPerLogic };
  const areas = splitItemsAndOptions(
    body ?? legacyStageArea(logic),
    optionCount,
    layoutParams
  );
  const gridFn = resolveLayout("grid");
  const itemSlots = gridFn({
    slotCount: totalItems,
    ageBand,
    logic,
    cssPerLogic,
    stage: areas.items,
  });
  const optionSlots = layoutOptionSlots(areas, optionCount, layoutParams).map(
    (slot, i) => ({ ...slot, index: totalItems + i })
  );

  if (body && itemSlots.some((slot) => slot.page !== 0)) {
    return insetDrawSize(
      computePackedItemsAndOptions(
        body,
        totalItems,
        optionCount,
        resolveTouchFloor(ageBand, cssPerLogic)
      ),
      body
    );
  }
  return insetDrawSize([...itemSlots, ...optionSlots], body);
}

interface Edges {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

function slotEdges(slot: Slot): Edges {
  const hw = Math.max(slot.w, slot.hitW) / 2;
  const hh = Math.max(slot.h, slot.hitH) / 2;
  return {
    left: slot.x - hw,
    right: slot.x + hw,
    top: slot.y - hh,
    bottom: slot.y + hh,
  };
}

function edgesOf(slots: readonly Slot[]): Edges {
  const all = slots.map(slotEdges);
  return {
    left: Math.min(...all.map((e) => e.left)),
    right: Math.max(...all.map((e) => e.right)),
    top: Math.min(...all.map((e) => e.top)),
    bottom: Math.max(...all.map((e) => e.bottom)),
  };
}

function rectEdges(rect: ZoneRect): Edges {
  return {
    left: rect.x,
    right: rect.x + rect.w,
    top: rect.y,
    bottom: rect.y + rect.h,
  };
}

const DOCK_TOUCH_TOLERANCE_PX = 4;

function edgesTouch(a: Edges, b: Edges): boolean {
  return (
    a.left <= b.right + DOCK_TOUCH_TOLERANCE_PX &&
    b.left <= a.right + DOCK_TOUCH_TOLERANCE_PX &&
    a.top <= b.bottom + DOCK_TOUCH_TOLERANCE_PX &&
    b.top <= a.bottom + DOCK_TOUCH_TOLERANCE_PX
  );
}

function trimDockAroundGroup(
  dock: ZoneRect,
  removed: readonly Slot[],
  groupSlots: readonly Slot[]
): ZoneRect {
  const inner = edgesOf(removed);
  const out = rectEdges(dock);
  for (const slot of groupSlots) {
    const g = slotEdges(slot);
    const sameRow = g.top < out.bottom && out.top < g.bottom;
    const sameColumn = g.left < out.right && out.left < g.right;
    if (sameRow && g.right <= inner.left) {
      out.left = Math.max(out.left, (g.right + inner.left) / 2);
    } else if (sameRow && g.left >= inner.right) {
      out.right = Math.min(out.right, (g.left + inner.right) / 2);
    } else if (sameColumn && g.bottom <= inner.top) {
      out.top = Math.max(out.top, (g.bottom + inner.top) / 2);
    } else if (sameColumn && g.top >= inner.bottom) {
      out.bottom = Math.min(out.bottom, (g.top + inner.bottom) / 2);
    }
  }
  const left = Math.ceil(out.left);
  const top = Math.ceil(out.top);
  return {
    x: left,
    y: top,
    w: Math.floor(out.right) - left,
    h: Math.floor(out.bottom) - top,
  };
}

export function computeRemovedDockRects(
  removedSlots: readonly Slot[],
  groupSlots: readonly Slot[],
  stageRect?: ZoneRect
): ZoneRect[] {
  const whole = dockRectAroundSlots(removedSlots, stageRect);
  if (!whole) {
    return [];
  }
  if (!groupSlots.some((g) => edgesTouch(rectEdges(whole), slotEdges(g)))) {
    return [whole];
  }
  const groupRows = new Set(groupSlots.map((g) => g.y));
  const shared = removedSlots.filter((r) => groupRows.has(r.y));
  const rest = removedSlots.filter((r) => !groupRows.has(r.y));
  const parts = [shared, rest].filter((p) => p.length > 0);
  const docks: ZoneRect[] = [];
  for (const [k, part] of parts.entries()) {
    const dock = dockRectAroundSlots(part, stageRect);
    if (!dock) {
      continue;
    }
    const other = parts[1 - k] ?? [];
    docks.push(trimDockAroundGroup(dock, part, [...groupSlots, ...other]));
  }
  return docks;
}

export function computeGroupTrayBounds(
  groupSlots: readonly Slot[],
  removedSlots: readonly Slot[],
  stageRect?: ZoneRect
): SceneBox | null {
  if (groupSlots.length === 0) {
    return null;
  }
  const raw = dockRectAroundSlots(groupSlots, stageRect);
  if (!raw) {
    return null;
  }
  if (removedSlots.length === 0) {
    return raw;
  }
  return trimDockAroundGroup(raw, groupSlots, removedSlots);
}
