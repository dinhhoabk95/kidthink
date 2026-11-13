/**
 * Đặt cân, hai vùng chạm đĩa cân, trạng thái nhịp khung hình và quy đổi cử chỉ
 * cho `GT-014` (`BR-PSZ-01`).
 */

import type { GameAction } from "#src/game-session";
import type { Gesture } from "#src/interaction";
import {
  findHitSlotIndex,
  isPointInSlot,
  TAP_TOLERANCE_PX,
} from "#src/layout/hit-test";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  balanceScaleGeometry,
  insetBox,
  panSinkPx,
  prefersReducedMotion,
  type SceneBox,
  slotAtPoint,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { WeightedItem } from "#src/systems/balance-system";
import type { Particle } from "#src/systems/render-system";
import { WRONG_FLASH_MS, type WrongFlash } from "#src/systems/wrong-flash";
import type { GT014StateSnapshot } from "./layout.js";

const SCALE_INSET_SIDE_PX = 12;
const SCALE_INSET_TOP_PX = 12;
const SCALE_INSET_BOTTOM_PX = 16;
const SCALE_MAX_ASPECT = 2.2;
const REF_SCALE_HEIGHT_RATIO = 0.34;
const REF_SCALE_GAP_PX = 8;

export function referenceScaleBoxesInStage(
  stage: SceneBox,
  referenceCount = 0
): SceneBox[] {
  if (referenceCount <= 0) {
    return [];
  }
  const count = Math.min(2, referenceCount);
  const totalH = Math.max(
    0,
    stage.h - SCALE_INSET_TOP_PX - SCALE_INSET_BOTTOM_PX
  );
  const refH = Math.floor(totalH * REF_SCALE_HEIGHT_RATIO);
  const availW = Math.max(0, stage.w - 2 * SCALE_INSET_SIDE_PX);
  const slotW = Math.floor((availW - (count - 1) * REF_SCALE_GAP_PX) / count);
  const boxW = Math.min(slotW, Math.floor(refH * SCALE_MAX_ASPECT));
  const rowW = count * boxW + (count - 1) * REF_SCALE_GAP_PX;
  const startX = stage.x + (stage.w - rowW) / 2;
  const y = stage.y + SCALE_INSET_TOP_PX;
  return Array.from({ length: count }, (_, i) => ({
    x: startX + i * (boxW + REF_SCALE_GAP_PX),
    y,
    w: boxW,
    h: refH,
  }));
}

export function scaleBoxInStage(
  stage: ZoneRect | SceneBox,
  referenceCount = 0
): SceneBox {
  const totalH = Math.max(
    0,
    stage.h - SCALE_INSET_TOP_PX - SCALE_INSET_BOTTOM_PX
  );
  const refOffset =
    referenceCount > 0
      ? Math.floor(totalH * REF_SCALE_HEIGHT_RATIO) + REF_SCALE_GAP_PX
      : 0;
  const h = Math.max(0, totalH - refOffset);
  const availW = Math.max(0, stage.w - 2 * SCALE_INSET_SIDE_PX);
  const w = Math.min(availW, Math.floor(h * SCALE_MAX_ASPECT));
  return {
    x: stage.x + (stage.w - w) / 2,
    y: stage.y + SCALE_INSET_TOP_PX + refOffset,
    w,
    h,
  };
}

export function panTargetSlots(
  box: SceneBox,
  touchFloor: number,
  tiltDeg = 0,
  sink: { readonly left: number; readonly right: number } = {
    left: 0,
    right: 0,
  },
  stageBounds: SceneBox = box
): Slot[] {
  const { pivotX, pivotY, beamHalf, panW, panH } = balanceScaleGeometry(box);
  const clampedTilt = Math.max(-14, Math.min(14, -tiltDeg));
  const rad = (clampedTilt * Math.PI) / 180;
  const dx = Math.cos(rad) * beamHalf;
  const dy = Math.sin(rad) * beamHalf;
  const rawHitW = Math.max(touchFloor, Math.round(panW));
  const maxSepW = Math.floor(2 * dx - 10);
  const hitW = maxSepW >= touchFloor ? Math.min(rawHitW, maxSepW) : rawHitW;
  const hitH = Math.min(
    Math.floor(stageBounds.h),
    Math.max(touchFloor, Math.round(panH))
  );
  const minX = stageBounds.x + hitW / 2;
  const maxX = stageBounds.x + stageBounds.w - hitW / 2;
  const topCornerReserve = stageBounds.h >= 200 ? 60 : 0;
  const minY = stageBounds.y + topCornerReserve + hitH / 2;
  const maxY = stageBounds.y + stageBounds.h - hitH / 2;
  return ([-1, 1] as const).map((side, index) => {
    const sinkSide = side < 0 ? sink.left : sink.right;
    const rawX = pivotX + side * dx;
    const shiftY = (-side * dy + panSinkPx(sinkSide, panH)) * 0.35;
    const rawY = pivotY + panH / 2 + shiftY;
    const x = Math.round(
      minX <= maxX ? Math.min(maxX, Math.max(minX, rawX)) : rawX
    );
    const y = Math.round(
      minY <= maxY ? Math.min(maxY, Math.max(minY, rawY)) : rawY
    );
    return {
      index,
      x,
      y,
      w: Math.round(panW),
      h: Math.round(panH),
      hitW,
      hitH,
      page: 0,
      role: "target" as const,
    };
  });
}

export function computeGT014PanBoxes(params: {
  readonly stageRect: ZoneRect | undefined;
  readonly logicSpace: { readonly w: number; readonly h: number };
  readonly referenceCount: number;
  readonly smoothTiltDeg: number;
  readonly smoothSink: { readonly left: number; readonly right: number };
}): {
  readonly stageBounds: SceneBox;
  readonly leftPan: SceneBox;
  readonly rightPan: SceneBox;
  readonly refBoxes: readonly SceneBox[];
} {
  const fullBox = {
    x: 0,
    y: 0,
    w: params.logicSpace.w,
    h: params.logicSpace.h,
  };
  const baseStageBox = params.stageRect ?? insetBox(fullBox, 0.12);
  const refBoxes = referenceScaleBoxesInStage(
    baseStageBox,
    params.referenceCount
  );
  const scaleBox =
    params.stageRect || params.referenceCount > 0
      ? scaleBoxInStage(baseStageBox, params.referenceCount)
      : baseStageBox;
  const { pivotX, pivotY, beamHalf, panW, panH } =
    balanceScaleGeometry(scaleBox);
  const clampedTilt = Math.max(-14, Math.min(14, -params.smoothTiltDeg));
  const rad = (clampedTilt * Math.PI) / 180;
  const dx = Math.cos(rad) * beamHalf;
  const dy = Math.sin(rad) * beamHalf;
  const leftSink = panSinkPx(params.smoothSink.left, panH);
  const rightSink = panSinkPx(params.smoothSink.right, panH);
  return {
    stageBounds: baseStageBox,
    refBoxes,
    leftPan: {
      x: pivotX - dx - panW / 2,
      y: pivotY + dy + leftSink,
      w: panW,
      h: panH,
    },
    rightPan: {
      x: pivotX + dx - panW / 2,
      y: pivotY - dy + rightSink,
      w: panW,
      h: panH,
    },
  };
}

export interface GT014ClockState {
  logicMs: number;
  hoveredSlotIndex: number | null;
  touchingSlotIndex: number | null;
  particles: Particle[];
}

const SESSION_CLOCKS = new WeakMap<object, GT014ClockState>();

function createEmptyClock(): GT014ClockState {
  return {
    logicMs: 0,
    hoveredSlotIndex: null,
    touchingSlotIndex: null,
    particles: [],
  };
}

export function getGT014Clock(session: object): GT014ClockState {
  let state = SESSION_CLOCKS.get(session);
  if (!state) {
    state = createEmptyClock();
    SESSION_CLOCKS.set(session, state);
  }
  return state;
}

export function resetGT014Clock(session: object): GT014ClockState {
  const fresh = createEmptyClock();
  SESSION_CLOCKS.set(session, fresh);
  return fresh;
}

export function resolveGT014WrongElapsedMs(
  session: object,
  wrongFlash: WrongFlash
): number {
  return wrongFlash.started
    ? Math.max(0, wrongFlash.elapsedMs(getGT014Clock(session).logicMs))
    : WRONG_FLASH_MS;
}

function clampParticles(pts: Particle[], b: SceneBox, pad: number): void {
  for (const p of pts) {
    p.x = Math.min(b.x + b.w - pad, Math.max(b.x + pad, p.x));
    p.y = Math.min(b.y + b.h - pad, Math.max(b.y + pad, p.y));
  }
}

export function spawnGT014CelebrateParticles(
  pans: readonly SceneBox[],
  stageBounds: SceneBox,
  enabled: boolean
): Particle[] {
  if (!enabled || prefersReducedMotion()) {
    return [];
  }
  const out: Particle[] = [];
  for (const pan of pans) {
    const slot = slotAtPoint(
      pan.x + pan.w / 2,
      pan.y + pan.h / 2,
      Math.min(pan.w, pan.h)
    );
    out.push(...spawnParticlesAtSlot(slot, 8));
  }
  clampParticles(out, stageBounds, 6);
  return out;
}

export function stepGT014Particles(
  pts: Particle[],
  stageBounds: SceneBox
): void {
  if (pts.length > 0) {
    updateParticles(pts);
    clampParticles(pts, stageBounds, 4);
  }
}

function findTrayItemAt(
  g: GT014StateSnapshot,
  x: number,
  y: number
): WeightedItem | null {
  const tr = g.solverInput.trayItems;
  const idx = findHitSlotIndex(
    g.sourceSlots.slice(0, tr.length),
    x,
    y,
    "circle",
    TAP_TOLERANCE_PX
  );
  return idx >= 0 ? (tr[idx] ?? null) : null;
}

function isNear(x: number, y: number, b: SceneBox): boolean {
  const p = TAP_TOLERANCE_PX;
  return (
    x >= b.x - p && x <= b.x + b.w + p && y >= b.y - p && y <= b.y + b.h + p
  );
}

function findTargetPanAt(
  g: GT014StateSnapshot,
  x: number,
  y: number
): "left" | "right" | null {
  if (
    (g.leftPanSlot &&
      isPointInSlot(g.leftPanSlot, x, y, "square", TAP_TOLERANCE_PX)) ||
    isNear(x, y, g.leftPanBox)
  ) {
    return "left";
  }
  if (
    (g.rightPanSlot &&
      isPointInSlot(g.rightPanSlot, x, y, "square", TAP_TOLERANCE_PX)) ||
    isNear(x, y, g.rightPanBox)
  ) {
    return "right";
  }
  return null;
}

function findPlacedItemInPanAt(
  g: GT014StateSnapshot,
  side: "left" | "right",
  x: number,
  y: number
): string | null {
  const s = g.solverInput;
  const placed = side === "left" ? g.leftPlaced : g.rightPlaced;
  const initIds = side === "left" ? s.initialLeftIds : s.initialRightIds;
  for (let i = placed.length - 1; i >= 0; i--) {
    const p = placed[i];
    if (
      p &&
      !initIds.has(p.item.item_id) &&
      Math.hypot(x - p.x, y - p.y) <= p.size / 2 + TAP_TOLERANCE_PX
    ) {
      return p.item.item_id;
    }
  }
  return null;
}

function findReturnFromPanAt(
  g: GT014StateSnapshot,
  x: number,
  y: number
): { itemId: string; fromPan: "left" | "right" } | null {
  for (const side of ["left", "right"] as const) {
    const itemId = findPlacedItemInPanAt(g, side, x, y);
    if (itemId) {
      return { itemId, fromPan: side };
    }
  }
  const hitPan = findTargetPanAt(g, x, y);
  if (!hitPan) {
    return null;
  }
  const s = g.solverInput;
  const initIds = hitPan === "left" ? s.initialLeftIds : s.initialRightIds;
  const items = hitPan === "left" ? s.leftItems : s.rightItems;
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    if (item && !initIds.has(item.item_id)) {
      return { itemId: item.item_id, fromPan: hitPan };
    }
  }
  return null;
}

function isDropToTrayArea(
  g: GT014StateSnapshot,
  x: number,
  y: number
): boolean {
  if (findHitSlotIndex(g.sourceSlots, x, y, "circle", TAP_TOLERANCE_PX) >= 0) {
    return true;
  }
  if (g.stageRect) {
    return y >= g.stageRect.y + g.stageRect.h - 16;
  }
  const maxPanY = Math.max(g.leftPanSlot?.y ?? 0, g.rightPanSlot?.y ?? 0);
  return maxPanY > 0 && y > maxPanY + 32;
}

function resolveDropGesture(
  g: GT014StateSnapshot,
  gesture: Extract<Gesture, { type: "drop" }>
): GameAction | null {
  const dragged = findTrayItemAt(g, gesture.fromX, gesture.fromY);
  const targetPan = findTargetPanAt(g, gesture.toX, gesture.toY);
  if (dragged && targetPan) {
    return {
      type: "place_item",
      data: { item_id: dragged.item_id, target_pan: targetPan },
    };
  }
  if (g.content.goal !== "balance") {
    return null;
  }
  const ret = findReturnFromPanAt(g, gesture.fromX, gesture.fromY);
  return ret && isDropToTrayArea(g, gesture.toX, gesture.toY)
    ? {
        type: "return_item",
        data: { item_id: ret.itemId, from_pan: ret.fromPan },
      }
    : null;
}

function resolveTapGesture(
  g: GT014StateSnapshot,
  gesture: Extract<Gesture, { type: "tap" }>
): { action: GameAction | null; nextStagedItemId: string | null } {
  const targetPan = findTargetPanAt(g, gesture.x, gesture.y);
  if (g.content.goal !== "balance") {
    return {
      action: targetPan ? { type: "select_side", data: targetPan } : null,
      nextStagedItemId: g.stagedItemId,
    };
  }
  if (g.stagedItemId && targetPan) {
    return {
      action: {
        type: "place_item",
        data: { item_id: g.stagedItemId, target_pan: targetPan },
      },
      nextStagedItemId: g.stagedItemId,
    };
  }
  const ret = findReturnFromPanAt(g, gesture.x, gesture.y);
  if (ret) {
    return {
      action: {
        type: "return_item",
        data: { item_id: ret.itemId, from_pan: ret.fromPan },
      },
      nextStagedItemId: g.stagedItemId,
    };
  }
  const tapped = findTrayItemAt(g, gesture.x, gesture.y);
  if (!tapped) {
    return { action: null, nextStagedItemId: g.stagedItemId };
  }
  const nextStaged = g.stagedItemId === tapped.item_id ? null : tapped.item_id;
  return { action: null, nextStagedItemId: nextStaged };
}

export function resolveGT014GestureAction(
  g: GT014StateSnapshot,
  gesture: Gesture
): { action: GameAction | null; nextStagedItemId: string | null } {
  if (gesture.type === "drop") {
    return {
      action: resolveDropGesture(g, gesture),
      nextStagedItemId: g.stagedItemId,
    };
  }
  if (gesture.type === "tap") {
    return resolveTapGesture(g, gesture);
  }
  return { action: null, nextStagedItemId: g.stagedItemId };
}
