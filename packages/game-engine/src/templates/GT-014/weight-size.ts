/**
 * GT-014: cỡ vật theo khối lượng (`BR-E014-03`) thay cho số in trên vật
 * (`BR-E014-06`), cùng các hàm vẽ vật/stage/khay của `GT-014`.
 */

import type { KeywordAsset } from "#src/labels/spoken-keyword";
import type { Slot } from "#src/layout/types";
import {
  drawGT014ClosedReveal,
  drawGT014FallbackWeight,
  drawGT014HintBoxes,
  drawGT014PanFeedback,
  drawGT014ScaleOrnament,
  drawGT014TrayPedestal,
} from "#src/render/gt-014-shapes";
import {
  drawBalanceScale,
  drawMontessoriControlOfErrorPill,
  drawReferenceScaleCard,
  drawSlotItem,
  drawStoryCharacterInStage,
  drawWoodenTokenDock,
  type ItemVisualState,
  type SceneBox,
  slotAtPoint,
} from "#src/render/index.js";
import type { WeightedItem } from "#src/systems/balance-system";
import type { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import {
  type GT014StateSnapshot,
  isGT014BrokenAsset,
  resolveGT014HintTargetForLevel,
  resolveGT014HintTargetIndex,
  resolvePickExpectedSide,
  solveGT014NextHintMove,
} from "./layout.js";
import type { PlacedPanItem, WeightedAssetItem } from "./template.js";
import {
  getGT014Clock,
  referenceScaleBoxesInStage,
  resolveGT014WrongElapsedMs,
  scaleBoxInStage,
} from "./zone-layout.js";

export type { PlacedPanItem, WeightedAssetItem } from "./template.js";

const MIN_SIZE_FRACTION = 0.4;
const HEAVIEST_PER_PAN_ROW = 3;
const ROW_FILL_RATIO = 0.94;
const ROW_GAP_PX = 2;
const MIN_PAN_ITEM_PX = 14;

export function weightSizeFraction(weight: number, maxWeight: number): number {
  if (maxWeight <= 0) {
    return 1;
  }
  const ratio = Math.sqrt(Math.max(0, weight) / maxWeight);
  return Math.min(1, Math.max(MIN_SIZE_FRACTION, ratio));
}

export function maxItemWeight(
  groups: readonly (readonly { readonly weight: number }[])[]
): number {
  return groups.reduce(
    (max, group) =>
      group.reduce((inner, item) => Math.max(inner, item.weight), max),
    0
  );
}

export function panUnitSize(pan: SceneBox): number {
  return Math.max(
    MIN_PAN_ITEM_PX,
    Math.min(pan.w / HEAVIEST_PER_PAN_ROW, pan.h * 2.5)
  );
}

export function layoutPanItems(
  pan: SceneBox,
  items: readonly WeightedAssetItem[],
  maxWeight: number,
  unit: number = panUnitSize(pan)
): PlacedPanItem[] {
  const sizes = items.map((item) =>
    Math.max(
      MIN_PAN_ITEM_PX,
      Math.round(unit * weightSizeFraction(item.weight, maxWeight))
    )
  );
  const capacity = pan.w * ROW_FILL_RATIO;
  const rows: { indices: number[]; width: number; height: number }[] = [];
  sizes.forEach((size, i) => {
    const row = rows.at(-1);
    if (row && row.width + size <= capacity) {
      row.indices.push(i);
      row.width += size;
      row.height = Math.max(row.height, size);
      return;
    }
    rows.push({ indices: [i], width: size, height: size });
  });
  const placed: PlacedPanItem[] = [];
  let bottom = pan.y;
  for (const row of rows) {
    let left = pan.x + (pan.w - row.width) / 2;
    for (const i of row.indices) {
      const item = items[i];
      const size = sizes[i];
      if (!item || size === undefined) {
        continue;
      }
      placed.push({ item, x: left + size / 2, y: bottom - size / 2, size });
      left += size;
    }
    bottom -= row.height + ROW_GAP_PX;
  }
  return placed;
}

export function drawWeightedPanItems(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  pan: SceneBox,
  items: readonly WeightedAssetItem[],
  maxWeight: number,
  unit?: number
): void {
  for (const placed of layoutPanItems(pan, items, maxWeight, unit)) {
    drawSlotItem(ctx, rs, slotAtPoint(placed.x, placed.y, placed.size), {
      id: placed.item.item_id,
      asset: placed.item.asset,
    });
  }
}

function drawPanItemsWithFallback(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  pan: SceneBox,
  items: readonly WeightedItem[],
  assetById: ReadonlyMap<string, KeywordAsset>,
  maxWeight: number,
  stageBounds: SceneBox
): void {
  const weighted: WeightedAssetItem[] = items.map((i) => ({
    item_id: i.item_id,
    weight: i.weight,
    asset: assetById.get(i.item_id),
  }));
  for (const p of layoutPanItems(pan, weighted, maxWeight)) {
    if (isGT014BrokenAsset(p.item.asset)) {
      drawGT014FallbackWeight(
        ctx,
        { x: p.x, y: p.y, w: p.size, h: p.size },
        stageBounds
      );
    } else {
      drawSlotItem(ctx, rs, slotAtPoint(p.x, p.y, p.size), {
        id: p.item.item_id,
        asset: p.item.asset,
      });
    }
  }
}

function resolvePanState(
  s: GT014StateSnapshot,
  side: "left" | "right",
  wrongProg: number | null,
  isTouch: boolean,
  isHov: boolean
): ItemVisualState {
  if (s.isWon && (s.content.goal === "balance" || s.selectedSide === side)) {
    return "correct";
  }
  if (
    wrongProg !== null &&
    s.wrongSide === side &&
    s.content.goal !== "balance"
  ) {
    return "wrong";
  }
  if (isTouch) {
    return "touching";
  }
  return s.selectedSide === side || (s.stagedItemId !== null && isHov)
    ? "selected"
    : "idle";
}

function renderSinglePanFeedback(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  s: GT014StateSnapshot,
  side: "left" | "right",
  pan: SceneBox,
  tSlot: Slot | undefined,
  wrongProg: number | null,
  timeMs: number
): void {
  const clk = getGT014Clock(s.session);
  const slotIdx = tSlot ? s.slots.indexOf(tSlot) : -1;
  const isHov = clk.hoveredSlotIndex === slotIdx && slotIdx >= 0;
  const isTouch = clk.touchingSlotIndex === slotIdx && slotIdx >= 0;
  drawGT014PanFeedback(ctx, rs, {
    pan,
    visualState: resolvePanState(s, side, wrongProg, isTouch, isHov),
    isInteractiveTarget:
      s.content.goal !== "balance" || s.stagedItemId !== null,
    isHovered: isHov,
    timeMs,
    wrongProgress: s.wrongSide === side ? wrongProg : null,
    stageBounds: s.stageBounds,
  });
}

function renderClosedReveal(
  ctx: CanvasRenderingContext2D,
  s: GT014StateSnapshot,
  leftPan: SceneBox,
  rightPan: SceneBox
): void {
  const isBal = s.content.goal === "balance";
  const move = isBal ? solveGT014NextHintMove(s.solverInput) : null;
  const side =
    move?.kind === "place"
      ? move.targetSide
      : resolvePickExpectedSide(s.content.goal, s.leftWeight, s.rightWeight);
  const pan = side === "left" ? leftPan : rightPan;
  const gw = move?.kind === "place" ? move.item.weight : 1;
  const ghost = isBal
    ? panUnitSize(pan) * weightSizeFraction(gw, s.maxWeight)
    : 0;
  drawGT014ClosedReveal(ctx, pan, ghost, s.stageBounds);
}

function renderHintOrClosed(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  s: GT014StateSnapshot,
  leftPan: SceneBox,
  rightPan: SceneBox,
  timeMs: number
): void {
  if (s.isRoundClosed && !s.isWon) {
    renderClosedReveal(ctx, s, leftPan, rightPan);
    return;
  }
  if (s.activeHintTier === 0 || !s.accepting) {
    return;
  }
  const hint = resolveGT014HintTargetForLevel(s, s.activeHintTier);
  if (hint?.kind === "region") {
    const boxes: SceneBox[] = [];
    if (hint.ids.includes("left_pan")) {
      boxes.push(leftPan);
    }
    if (hint.ids.includes("right_pan")) {
      boxes.push(rightPan);
    }
    const pulse = rs.reducedMotion ? 0 : 0.1 * Math.sin(timeMs / 220);
    drawGT014HintBoxes(ctx, boxes, s.stageBounds, pulse);
  }
}

function renderRefScales(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  s: GT014StateSnapshot
): void {
  const refScales = s.content.reference_scales ?? [];
  const refBoxes = referenceScaleBoxesInStage(s.stageBounds, refScales.length);
  refScales.forEach((ref, idx) => {
    const rb = refBoxes[idx];
    if (rb) {
      drawReferenceScaleCard(ctx, rb);
      const rp = drawBalanceScale(ctx, rb, ref.left_pan, ref.right_pan);
      drawPanItemsWithFallback(
        ctx,
        rs,
        rp.leftPan,
        ref.left_pan,
        s.assetById,
        s.maxWeight,
        s.stageBounds
      );
      drawPanItemsWithFallback(
        ctx,
        rs,
        rp.rightPan,
        ref.right_pan,
        s.assetById,
        s.maxWeight,
        s.stageBounds
      );
    }
  });
}

export function renderGT014Stage(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  s: GT014StateSnapshot,
  timeMs: number
): void {
  const clk = getGT014Clock(s.session);
  renderRefScales(ctx, rs, s);
  const refLen = s.content.reference_scales?.length ?? 0;
  const scaleBox =
    s.stageRect || refLen > 0
      ? scaleBoxInStage(s.stageBounds, refLen)
      : s.stageBounds;
  drawStoryCharacterInStage(ctx, "hippo", s.stageRect, s.slots);
  const { leftPan, rightPan } = drawBalanceScale(
    ctx,
    scaleBox,
    s.solverInput.leftItems,
    s.solverInput.rightItems,
    s.tiltDeg,
    s.sink
  );
  drawGT014ScaleOrnament(ctx, rs, {
    box: scaleBox,
    goal: s.content.goal,
    tiltDeg: s.tiltDeg,
    isBalanced: s.isBalanced,
    isWon: s.isWon,
  });

  const elapsed = s.wrongSide
    ? resolveGT014WrongElapsedMs(s.session, s.wrongFlash)
    : WRONG_FLASH_MS;
  const wrongProg = elapsed < WRONG_FLASH_MS ? elapsed / WRONG_FLASH_MS : null;
  renderSinglePanFeedback(
    ctx,
    rs,
    s,
    "left",
    leftPan,
    s.leftPanSlot,
    wrongProg,
    timeMs
  );
  renderSinglePanFeedback(
    ctx,
    rs,
    s,
    "right",
    rightPan,
    s.rightPanSlot,
    wrongProg,
    timeMs
  );

  drawPanItemsWithFallback(
    ctx,
    rs,
    leftPan,
    s.solverInput.leftItems,
    s.assetById,
    s.maxWeight,
    s.stageBounds
  );
  drawPanItemsWithFallback(
    ctx,
    rs,
    rightPan,
    s.solverInput.rightItems,
    s.assetById,
    s.maxWeight,
    s.stageBounds
  );

  if (s.wrongSide && wrongProg !== null) {
    const pan = s.wrongSide === "left" ? leftPan : rightPan;
    const r = Math.max(pan.w, pan.h) / 2 + 6;
    rs.drawRetryRing(ctx, pan.x + pan.w / 2, pan.y + pan.h / 2, r, wrongProg);
  }
  renderHintOrClosed(ctx, rs, s, leftPan, rightPan, timeMs);
  if (!rs.reducedMotion && clk.particles.length > 0) {
    rs.drawParticles(ctx, clk.particles);
  }
  drawMontessoriControlOfErrorPill(
    ctx,
    s.stageBounds,
    s.exploreTracker,
    rs.viewport?.scale
  );
}

export function renderGT014Tray(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  s: GT014StateSnapshot,
  trayBounds: SceneBox,
  timeMs: number
): void {
  const clk = getGT014Clock(s.session);
  if (s.stageRect && s.sourceSlots.length > 0) {
    drawWoodenTokenDock(ctx, rs, trayBounds);
  }
  s.solverInput.trayItems.forEach((item, i) => {
    const slot = s.sourceSlots[i];
    if (!slot) {
      return;
    }
    const slotIdx = s.slots.indexOf(slot);
    const isTouch = clk.touchingSlotIndex === slotIdx && slotIdx >= 0;
    const isHov = clk.hoveredSlotIndex === slotIdx && slotIdx >= 0;
    let visualState = s.getItemState(item.item_id);
    if (s.stagedItemId === item.item_id) {
      visualState = "selected";
    } else if (isTouch) {
      visualState = "touching";
    }
    drawGT014TrayPedestal(ctx, rs, slot, {
      visualState,
      isHovered: isHov,
      index: i,
      timeMs,
      trayBounds,
    });
    const frac = weightSizeFraction(item.weight, s.maxWeight);
    const side = Math.round(Math.min(slot.w, slot.h) * frac);
    const asset = s.assetById.get(item.item_id);
    if (isGT014BrokenAsset(asset)) {
      drawGT014FallbackWeight(
        ctx,
        { x: slot.x, y: slot.y, w: side, h: side },
        trayBounds
      );
    } else {
      drawSlotItem(
        ctx,
        rs,
        { ...slot, w: side, h: side },
        { id: item.item_id, asset, state: visualState }
      );
    }
  });
  if (s.activeHintTier >= 2 && s.accepting) {
    const srcIdx = resolveGT014HintTargetIndex(s);
    const srcSlot = srcIdx === null ? undefined : s.slots[srcIdx];
    if (srcSlot?.role === "source") {
      const pulse = rs.reducedMotion ? 0 : 0.1 * Math.sin(timeMs / 220);
      const d = Math.min(srcSlot.w, srcSlot.h) * 0.92;
      const box = { x: srcSlot.x - d / 2, y: srcSlot.y - d / 2, w: d, h: d };
      drawGT014HintBoxes(ctx, [box], trayBounds, pulse);
    }
  }
}
