import { TOUCH_FLOORS } from "@mindkid/shared/touch-floors";
import type { AgeBand } from "#src/contracts/types";
import { JITTER_MAX_PX, type LogicSpace } from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry.js";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { GT037Content, GT037Symbol } from "./template.js";

export interface GT037Commission {
  readonly slotIndex: number;
  readonly symbolId: string;
  readonly timeMs: number;
}

export interface GT037OrderStep {
  readonly slotIndex: number;
  readonly symbolId: string;
  readonly isTarget: boolean;
  readonly timeMs: number;
}

export interface ProgressSnapshot {
  readonly found: readonly { index: number; symbolId: string }[];
  readonly order: readonly GT037OrderStep[];
  readonly commissions: readonly GT037Commission[];
}

export interface GT037SlotGridMeta {
  readonly row: number;
  readonly col: number;
  readonly gridRows: number;
  readonly gridCols: number;
}

export interface GT037HintRegionResult {
  readonly regionId: string;
  readonly ids: readonly string[];
  readonly regionBox: ZoneRect;
}

export const GT037_TOUCH_CSS_PX_4_5 = TOUCH_FLOORS.kidBand3_4;
export const GT037_TOUCH_CSS_PX_BY_BAND: Readonly<
  Partial<Record<AgeBand, number>>
> = {
  "4-5": GT037_TOUCH_CSS_PX_4_5,
};
export const GT037_MAX_TARGET_RATIO = 0.35;

export const SCATTER_BOARD_CAPACITY: Record<AgeBand, number> = {
  "3-4": 10,
  "4-5": 16,
  "5-6": 20,
};

export const CONFUSABLE_CAP_BY_BAND: Readonly<Record<AgeBand, number>> = {
  "3-4": 0,
  "4-5": 2,
  "5-6": 4,
};

const BROKEN_EMOJI_RE = /^EMJ-[a-z0-9-]+$/i;

export function isBrokenGT037Symbol(sym: GT037Symbol): boolean {
  if (sym.asset.kind === "text") {
    return sym.asset.text.trim().length === 0;
  }
  if (sym.asset.kind === "emoji") {
    const trimmed = sym.asset.ref.trim();
    return trimmed.length === 0 || BROKEN_EMOJI_RE.test(trimmed);
  }
  const path = sym.asset.path.trim();
  return path.length === 0 || path.toLowerCase().includes("broken");
}

function buildTargetSymbols(
  targetIds: readonly string[],
  targetCopies: number,
  symbolMap: ReadonlyMap<string, GT037Symbol>
): GT037Symbol[] {
  const result: GT037Symbol[] = [];
  if (targetIds.length === 1) {
    const sym = symbolMap.get(targetIds[0] ?? "");
    if (sym) {
      for (let i = 0; i < targetCopies; i++) {
        result.push(sym);
      }
    }
    return result;
  }
  const count1 = Math.ceil(targetCopies / 2);
  const count2 = targetCopies - count1;
  const sym1 = symbolMap.get(targetIds[0] ?? "");
  const sym2 = symbolMap.get(targetIds[1] ?? "");
  if (sym1 && sym2) {
    for (let i = 0; i < count1; i++) {
      result.push(sym1);
    }
    for (let i = 0; i < count2; i++) {
      result.push(sym2);
    }
  }
  return result;
}

function buildChosenDistractors(
  content: GT037Content,
  itemCount: number,
  targetCopies: number,
  targetSet: ReadonlySet<string>,
  symbolMap: ReadonlyMap<string, GT037Symbol>,
  seed: number,
  band: AgeBand
): GT037Symbol[] {
  const keptIds = content.confusable_ids.slice(0, CONFUSABLE_CAP_BY_BAND[band]);
  const droppedIds = new Set(content.confusable_ids.slice(keptIds.length));
  const confusableSymbols: GT037Symbol[] = [];
  for (const cId of keptIds) {
    const sym = symbolMap.get(cId);
    if (sym) {
      confusableSymbols.push(sym);
    }
  }
  const nonTargetAll = content.symbols.filter((s) => !targetSet.has(s.id));
  const withoutDropped = nonTargetAll.filter((s) => !droppedIds.has(s.id));
  const nonTargetSymbols =
    withoutDropped.length > 0 ? withoutDropped : nonTargetAll;
  const distractorsStream = deriveStream(seed, "distractors");
  const chosen = [...confusableSymbols];
  const remainingCount = itemCount - targetCopies - confusableSymbols.length;
  for (let i = 0; i < remainingCount; i++) {
    const idx = distractorsStream.nextInt(nonTargetSymbols.length);
    const sym = nonTargetSymbols[idx];
    if (sym) {
      chosen.push(sym);
    }
  }
  return chosen;
}

export function buildGT037Symbols(
  content: GT037Content,
  itemCount: number,
  targetCopies: number,
  targetSet: ReadonlySet<string>,
  seed: number,
  band: AgeBand
): GT037Symbol[] {
  const symbolMap = new Map<string, GT037Symbol>();
  for (const sym of content.symbols) {
    symbolMap.set(sym.id, sym);
  }
  const targetSymbols = buildTargetSymbols(
    content.target_ids,
    targetCopies,
    symbolMap
  );
  const chosenDistractors = buildChosenDistractors(
    content,
    itemCount,
    targetCopies,
    targetSet,
    symbolMap,
    seed,
    band
  );
  const assignStream = deriveStream(seed, "assign");
  return shuffle([...targetSymbols, ...chosenDistractors], assignStream);
}

export function trimGT037BoardSymbols(
  boardSymbols: readonly GT037Symbol[],
  targetSet: ReadonlySet<string>,
  targetCount: number,
  seed: number
): GT037Symbol[] {
  if (boardSymbols.length <= targetCount) {
    return [...boardSymbols];
  }
  const targets: GT037Symbol[] = [];
  const distractors: GT037Symbol[] = [];
  for (const sym of boardSymbols) {
    if (targetSet.has(sym.id)) {
      targets.push(sym);
    } else {
      distractors.push(sym);
    }
  }
  const neededDistractors = Math.max(0, targetCount - targets.length);
  const assignStream = deriveStream(seed, "assign");
  return shuffle(
    [...targets, ...distractors.slice(0, neededDistractors)],
    assignStream
  );
}

export function snapshotGT037Progress(
  foundTargets: ReadonlySet<number>,
  boardSymbols: readonly GT037Symbol[],
  order: readonly GT037OrderStep[],
  commissions: readonly GT037Commission[]
): ProgressSnapshot {
  return {
    found: [...foundTargets].map((i) => ({
      index: i,
      symbolId: boardSymbols[i]?.id ?? "",
    })),
    order: [...order],
    commissions: [...commissions],
  };
}

export function restoreGT037Progress(
  saved: ProgressSnapshot,
  boardSymbols: readonly GT037Symbol[],
  foundTargets: Set<number>,
  order: GT037OrderStep[],
  commissions: GT037Commission[]
): void {
  const claimed = new Map<number, number>();
  const taken = new Set<number>();
  for (const f of saved.found) {
    const next = boardSymbols.findIndex(
      (sym, i) => sym.id === f.symbolId && !taken.has(i)
    );
    if (next >= 0) {
      taken.add(next);
      claimed.set(f.index, next);
    }
  }
  foundTargets.clear();
  for (const next of claimed.values()) {
    foundTargets.add(next);
  }
  const remap = <T extends { slotIndex: number; symbolId: string }>(
    step: T
  ): T => {
    const mapped = claimed.get(step.slotIndex);
    if (mapped !== undefined && boardSymbols[mapped]?.id === step.symbolId) {
      return { ...step, slotIndex: mapped };
    }
    const anyIdx = boardSymbols.findIndex((sym) => sym.id === step.symbolId);
    return anyIdx >= 0 ? { ...step, slotIndex: anyIdx } : step;
  };
  order.splice(0, order.length, ...saved.order.map(remap));
  commissions.splice(0, commissions.length, ...saved.commissions.map(remap));
}

export function chooseGT037CandidateSlots(
  band: AgeBand,
  maxBandCapacity: number,
  itemCount: number,
  targetCopies: number,
  logicSpace: LogicSpace,
  stageRect: ZoneRect | undefined,
  cssPerLogic: number
): { slots: readonly Slot[]; count: number; usesOwnTouchFloor: boolean } {
  const layoutFn = resolveLayout("scatter-board");
  const layoutBoard = (
    slotCount: number,
    minTouchCssPx: number | undefined
  ): readonly Slot[] =>
    layoutFn({
      slotCount,
      ageBand: band,
      logic: logicSpace,
      stage: stageRect,
      cssPerLogic,
      minTouchCssPx,
    });
  const minCount = Math.max(1, targetCopies);
  const startCount = Math.min(itemCount, maxBandCapacity);
  const ownTouch = GT037_TOUCH_CSS_PX_BY_BAND[band];
  if (ownTouch !== undefined) {
    const ownMinCount = Math.min(
      startCount,
      Math.max(minCount, Math.ceil(targetCopies / GT037_MAX_TARGET_RATIO))
    );
    for (let n = startCount; n >= ownMinCount; n--) {
      try {
        return {
          slots: layoutBoard(n, ownTouch),
          count: n,
          usesOwnTouchFloor: true,
        };
      } catch {
        // Không vừa khung: hạ thêm một ô.
      }
    }
  }
  for (let n = startCount; n >= minCount; n--) {
    try {
      return {
        slots: layoutBoard(n, undefined),
        count: n,
        usesOwnTouchFloor: false,
      };
    } catch {
      // Không vừa khung: hạ thêm một ô.
    }
  }
  return {
    slots: layoutBoard(minCount, undefined),
    count: minCount,
    usesOwnTouchFloor: false,
  };
}

export function placeGT037Slots(
  candidateSlots: readonly Slot[],
  boardSymbols: readonly GT037Symbol[],
  itemCount: number,
  seed: number,
  rotationJitterEnabled: boolean
): {
  slots: Slot[];
  rotations: number[];
  gridMeta: GT037SlotGridMeta[];
} {
  const uniqueXs = [
    ...new Set(candidateSlots.map((s) => Math.round(s.x))),
  ].sort((a, b) => a - b);
  const uniqueYs = [
    ...new Set(candidateSlots.map((s) => Math.round(s.y))),
  ].sort((a, b) => a - b);
  const cellsStream = deriveStream(seed, "cells");
  const chosenSlots = shuffle(candidateSlots, cellsStream).slice(0, itemCount);
  const jitterStream = deriveStream(seed, "jitter");
  const placedSlots: Slot[] = [];
  const rotations: number[] = [];
  const gridMeta: GT037SlotGridMeta[] = [];

  for (let i = 0; i < itemCount; i++) {
    const candidate = chosenSlots[i];
    if (!candidate) {
      continue;
    }
    const symbol = boardSymbols[i];
    const dx = (jitterStream.next() * 2 - 1) * JITTER_MAX_PX;
    const dy = (jitterStream.next() * 2 - 1) * JITTER_MAX_PX;
    const rawRot = jitterStream.next() * 2 * Math.PI;
    rotations.push(
      rotationJitterEnabled && symbol?.orientation_free ? rawRot : 0
    );
    gridMeta.push({
      row: Math.max(0, uniqueYs.indexOf(Math.round(candidate.y))),
      col: Math.max(0, uniqueXs.indexOf(Math.round(candidate.x))),
      gridRows: Math.max(1, uniqueYs.length),
      gridCols: Math.max(1, uniqueXs.length),
    });
    placedSlots.push({
      index: i,
      x: Math.round(candidate.x + dx),
      y: Math.round(candidate.y + dy),
      w: candidate.w,
      h: candidate.h,
      hitW: candidate.hitW,
      hitH: candidate.hitH,
      page: 0,
      role: "neutral",
    });
  }
  return { slots: placedSlots, rotations, gridMeta };
}

export function computeGT037BoardBox(
  slots: readonly Slot[],
  stageRect: ZoneRect | undefined,
  logicSpace: LogicSpace
): ZoneRect {
  const bounds = stageRect ?? { x: 0, y: 0, w: logicSpace.w, h: logicSpace.h };
  if (slots.length === 0) {
    return bounds;
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const s of slots) {
    minX = Math.min(minX, s.x - s.w / 2);
    minY = Math.min(minY, s.y - s.h / 2);
    maxX = Math.max(maxX, s.x + s.w / 2);
    maxY = Math.max(maxY, s.y + s.h / 2);
  }
  const pad = 12;
  const x = Math.max(bounds.x + 2, minX - pad);
  const y = Math.max(bounds.y + 2, minY - pad);
  const right = Math.min(bounds.x + bounds.w - 2, maxX + pad);
  const bottom = Math.min(bounds.y + bounds.h - 2, maxY + pad);
  return { x, y, w: Math.max(0, right - x), h: Math.max(0, bottom - y) };
}

function computeQuadrantHint(
  targetSlot: Slot,
  boardBox: ZoneRect
): GT037HintRegionResult {
  const midX = boardBox.x + boardBox.w / 2;
  const midY = boardBox.y + boardBox.h / 2;
  const isLeft = targetSlot.x <= midX;
  const isTop = targetSlot.y <= midY;
  const qKey = `${isTop ? "t" : "b"}${isLeft ? "l" : "r"}`;
  return {
    regionId: `quadrant:${qKey}`,
    ids: [`quadrant:${qKey}`],
    regionBox: {
      x: isLeft ? boardBox.x + 8 : midX,
      y: isTop ? boardBox.y + 8 : midY,
      w: Math.max(0, boardBox.w / 2 - 8),
      h: Math.max(0, boardBox.h / 2 - 8),
    },
  };
}

function computeNeighborhoodHint(
  targetSlot: Slot,
  targetMeta: GT037SlotGridMeta,
  slots: readonly Slot[],
  gridMeta: readonly GT037SlotGridMeta[],
  boardSymbols: readonly GT037Symbol[],
  boardBox: ZoneRect
): GT037HintRegionResult {
  const quadrant = computeQuadrantHint(targetSlot, boardBox);
  const qBox = quadrant.regionBox;
  const qRight = qBox.x + qBox.w;
  const qBottom = qBox.y + qBox.h;
  const midX = boardBox.x + boardBox.w / 2;
  const midY = boardBox.y + boardBox.h / 2;
  const isLeft = targetSlot.x <= midX;
  const isTop = targetSlot.y <= midY;
  const qKey = `${isTop ? "t" : "b"}${isLeft ? "l" : "r"}`;

  const candidates: { dist: number; slot: Slot }[] = [];
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const m = gridMeta[i];
    const sym = boardSymbols[i];
    const sameQuadrant =
      s !== undefined && s.x <= midX === isLeft && s.y <= midY === isTop;
    const inRange =
      m &&
      Math.abs(m.row - targetMeta.row) <= 1 &&
      Math.abs(m.col - targetMeta.col) <= 1;
    if (s && sym && sameQuadrant && inRange) {
      const dx = s.x - targetSlot.x;
      const dy = s.y - targetSlot.y;
      candidates.push({ dist: dx * dx + dy * dy, slot: s });
    }
  }
  candidates.sort((a, b) => a.dist - b.dist);
  const maxKeep = Math.max(2, Math.min(4, Math.ceil(slots.length / 4)));
  const kept = candidates.slice(0, maxKeep);
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const item of kept) {
    minX = Math.min(minX, item.slot.x - item.slot.w / 2 - 4);
    minY = Math.min(minY, item.slot.y - item.slot.h / 2 - 4);
    maxX = Math.max(maxX, item.slot.x + item.slot.w / 2 + 4);
    maxY = Math.max(maxY, item.slot.y + item.slot.h / 2 + 4);
  }
  const clampedX = Math.max(qBox.x + 2, minX);
  const clampedY = Math.max(qBox.y + 2, minY);
  const clampedRight = Math.min(qRight - 2, maxX);
  const clampedBottom = Math.min(qBottom - 2, maxY);
  return {
    regionId: `neighborhood3x3:${qKey}:${targetMeta.row}:${targetMeta.col}`,
    ids: [`neighborhood3x3:${qKey}:${targetMeta.row}:${targetMeta.col}`],
    regionBox: {
      x: clampedX,
      y: clampedY,
      w: Math.max(0, clampedRight - clampedX),
      h: Math.max(0, clampedBottom - clampedY),
    },
  };
}

export function computeGT037HintRegion(
  level: 1 | 2,
  targetIdx: number,
  slots: readonly Slot[],
  gridMeta: readonly GT037SlotGridMeta[],
  boardSymbols: readonly GT037Symbol[],
  boardBox: ZoneRect
): GT037HintRegionResult | null {
  const targetSlot = slots[targetIdx];
  const targetMeta = gridMeta[targetIdx];
  if (!(targetSlot && targetMeta)) {
    return null;
  }
  if (level === 1) {
    return computeQuadrantHint(targetSlot, boardBox);
  }
  return computeNeighborhoodHint(
    targetSlot,
    targetMeta,
    slots,
    gridMeta,
    boardSymbols,
    boardBox
  );
}
