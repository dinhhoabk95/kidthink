/**
 * Bố cục, kẹp khung vùng vẽ, giải mã payload và giải thuật gợi ý cho GT-036.
 * Strict TypeScript: CẤM any, CẤM unknown, CẤM as T (ngoài as const).
 */

import type { AgeBand } from "#src/contracts/types";
import type { GameAction, HintDemoStep } from "#src/game-session";
import type { Gesture } from "#src/interaction";
import type { LogicSpace } from "#src/layout/constants";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import {
  computeStageGroupsLayout,
  hasSlotsOutsideStage,
  resolveStageRect,
} from "#src/layout/stage-groups";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type {
  GT036MotifGroupsParams,
  GT036RackTrayParams,
} from "#src/render/gt-036-shapes";
import { detectRule } from "#src/systems/rule-detection-system";
import type {
  GT036Difficulty,
  GT036PaletteItem,
} from "#src/templates/GT-036/template";

export interface GT036ActionPayload {
  readonly paletteId?: string;
  readonly slotIndex?: number;
  readonly elementId?: string;
}

export interface GT036HintStep {
  readonly slot: number;
  readonly elementId: string;
}

export interface GT036HintState {
  readonly isReadyToCommit: boolean;
  readonly step: GT036HintStep | null;
  readonly l1Ids: readonly string[];
  readonly l2Ids: readonly string[];
  readonly demoSteps: readonly HintDemoStep[] | null;
  readonly singleTargetIndex: number | null;
  readonly singleDestinationIndex: number | null;
}

export function extractGT036Payload(
  raw: GameAction["data"]
): GT036ActionPayload {
  if (typeof raw !== "object" || raw === null) {
    return {};
  }
  const map = new Map(Object.entries(raw));
  const paletteVal = map.get("paletteId");
  const slotVal = map.get("slotIndex");
  const elementVal = map.get("elementId");
  return {
    paletteId: typeof paletteVal === "string" ? paletteVal : undefined,
    slotIndex:
      typeof slotVal === "number" && Number.isFinite(slotVal)
        ? slotVal
        : undefined,
    elementId: typeof elementVal === "string" ? elementVal : undefined,
  };
}

function countOutsideStage(slots: readonly Slot[], stage: ZoneRect): number {
  return slots.filter((slot) => hasSlotsOutsideStage([slot], stage)).length;
}

function moveSlotToEnd(slots: readonly Slot[], from: number): Slot[] {
  const last = slots.length - 1;
  return slots
    .map((slot): Slot => {
      if (slot.index === from) {
        return { ...slot, index: last, role: "neutral" };
      }
      return slot.index > from ? { ...slot, index: slot.index - 1 } : slot;
    })
    .sort((a, b) => a.index - b.index);
}

export function computeGT036Slots(params: {
  readonly logicSpace: LogicSpace;
  readonly stageRect: ZoneRect | null;
  readonly band: AgeBand;
  readonly cssPerLogic: number;
  readonly trackLength: number;
  readonly paletteLength: number;
}): readonly Slot[] {
  const base = {
    stage: resolveStageRect(
      params.logicSpace,
      params.band,
      params.stageRect ?? undefined
    ),
    ageBand: params.band,
    cssPerLogic: params.cssPerLogic,
  };
  const track = { count: params.trackLength, role: "target" } as const;
  const palette = { count: params.paletteLength, role: "source" } as const;
  const plain = computeStageGroupsLayout({
    ...base,
    groups: [track, palette],
  });
  const plainOutside = countOutsideStage(plain, base.stage);
  const fits = (slots: readonly Slot[], clearIndex: number): boolean => {
    const clear = slots.find((slot) => slot.index === clearIndex);
    return (
      clear !== undefined &&
      !hasSlotsOutsideStage([clear], base.stage) &&
      countOutsideStage(slots, base.stage) <= plainOutside
    );
  };
  const onTop = computeStageGroupsLayout({
    ...base,
    groups: [{ count: 1, role: "neutral", cols: 1 }, track, palette],
  });
  if (fits(onTop, 0)) {
    return moveSlotToEnd(onTop, 0);
  }
  const merged = computeStageGroupsLayout({
    ...base,
    groups: [track, { count: palette.count + 1, role: "source" }],
  });
  if (fits(merged, track.count)) {
    return moveSlotToEnd(merged, track.count);
  }
  return plain;
}

function clampRectToBounds(rect: ZoneRect, bounds: ZoneRect): ZoneRect {
  const x = Math.max(bounds.x + 1, rect.x);
  const y = Math.max(bounds.y + 1, rect.y);
  return {
    x,
    y,
    w: Math.min(rect.w, Math.max(6, bounds.x + bounds.w - 1 - x)),
    h: Math.min(rect.h, Math.max(6, bounds.y + bounds.h - 1 - y)),
  };
}

export function groupSlotsByRow(slots: readonly Slot[]): Slot[][] {
  const rows: Slot[][] = [];
  for (const slot of slots) {
    const current = rows.at(-1);
    const anchor = current?.[0];
    if (
      current &&
      anchor &&
      Math.abs(slot.y - anchor.y) < Math.min(slot.h, anchor.h) * 0.5
    ) {
      current.push(slot);
    } else {
      rows.push([slot]);
    }
  }
  return rows;
}

export function computeBeadRackRows(
  trackSlots: readonly Slot[],
  stageBounds: ZoneRect
): GT036RackTrayParams["rows"] {
  const rows = groupSlotsByRow(trackSlots);
  return rows
    .map((row) => {
      const first = row[0];
      const last = row.at(-1);
      if (!(first && last)) {
        return null;
      }
      const minY = Math.min(...row.map((s) => s.y));
      const maxH = Math.max(...row.map((s) => s.h));
      const box = clampRectToBounds(
        {
          x: first.x - first.w * 0.56,
          y: minY + maxH * 0.24,
          w: last.x + last.w * 0.56 - (first.x - first.w * 0.56),
          h: Math.max(10, maxH * 0.24),
        },
        stageBounds
      );
      const pegR = Math.max(4, Math.min(8, box.h * 0.45));
      const pegY = Math.max(
        stageBounds.y + pegR + 1,
        Math.min(stageBounds.y + stageBounds.h - pegR - 1, first.y)
      );
      return {
        box,
        pegs: [
          { x: box.x + pegR, y: pegY, r: pegR },
          { x: box.x + box.w - pegR, y: pegY, r: pegR },
        ],
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

export function computePaletteTrayBox(
  paletteSlots: readonly Slot[],
  stageBounds: ZoneRect
): ZoneRect | null {
  if (paletteSlots.length === 0) {
    return null;
  }
  const minX = Math.min(...paletteSlots.map((s) => s.x - s.w * 0.5)) - 8;
  const minY = Math.min(...paletteSlots.map((s) => s.y - s.h * 0.5)) - 8;
  const maxX = Math.max(...paletteSlots.map((s) => s.x + s.w * 0.5)) + 8;
  const maxY = Math.max(...paletteSlots.map((s) => s.y + s.h * 0.5)) + 8;
  return clampRectToBounds(
    { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
    stageBounds
  );
}

export function computeMotifGroupSegments(
  trackSlots: readonly Slot[],
  motifLen: number,
  repetitions: number,
  stageBounds: ZoneRect
): GT036MotifGroupsParams["segments"] {
  if (motifLen <= 0 || repetitions <= 0) {
    return [];
  }
  const segments: {
    readonly box: ZoneRect;
    readonly badgeCenter: { readonly x: number; readonly y: number } | null;
    readonly repetitionNumber: number;
  }[] = [];
  for (let rep = 0; rep < repetitions; rep++) {
    const start = rep * motifLen;
    const repSlots = trackSlots.slice(start, start + motifLen);
    const rowGroups = groupSlotsByRow(repSlots);
    rowGroups.forEach((group, segIdx) => {
      if (group.length === 0) {
        return;
      }
      const pad = 5;
      const minX = Math.min(...group.map((s) => s.x - s.w * 0.48)) - pad;
      const minY = Math.min(...group.map((s) => s.y - s.h * 0.48)) - pad;
      const maxX = Math.max(...group.map((s) => s.x + s.w * 0.48)) + pad;
      const maxY = Math.max(...group.map((s) => s.y + s.h * 0.48)) + pad;
      const box = clampRectToBounds(
        { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
        stageBounds
      );
      const badgeR = 18;
      const badgeCenter =
        segIdx === 0
          ? {
              x: Math.max(
                stageBounds.x + badgeR + 2,
                Math.min(stageBounds.x + stageBounds.w - badgeR - 2, box.x + 12)
              ),
              y: Math.max(
                stageBounds.y + badgeR + 2,
                Math.min(stageBounds.y + stageBounds.h - badgeR - 2, box.y + 2)
              ),
            }
          : null;
      segments.push({ box, badgeCenter, repetitionNumber: rep + 1 });
    });
  }
  return segments;
}

function findPrefixMotifStep(
  placedItems: readonly (string | null)[],
  minRepetitions: number
): GT036HintStep | null {
  const trackLen = placedItems.length;
  let prefixLen = 0;
  while (prefixLen < trackLen && placedItems[prefixLen] !== null) {
    prefixLen++;
  }
  const prefixSlice = placedItems
    .slice(0, prefixLen)
    .filter((id): id is string => id !== null);
  if (new Set(prefixSlice).size < 2) {
    return null;
  }
  const maxMotifLen = Math.max(2, Math.floor(trackLen / minRepetitions));
  for (let len = 2; len <= maxMotifLen; len++) {
    const candidate = prefixSlice.slice(0, len);
    if (new Set(candidate).size < 2) {
      continue;
    }
    if (!prefixSlice.every((id, idx) => id === candidate[idx % len])) {
      continue;
    }
    for (let i = 0; i < trackLen; i++) {
      const want = candidate[i % len];
      if (want && placedItems[i] !== want) {
        return { slot: i, elementId: want };
      }
    }
  }
  return null;
}

function findNextStepByChildRule(
  placedItems: readonly (string | null)[],
  paletteIds: readonly string[],
  minRepetitions: number
): GT036HintStep | null {
  const prefixStep = findPrefixMotifStep(placedItems, minRepetitions);
  if (prefixStep) {
    return prefixStep;
  }
  const firstId = placedItems[0] ?? paletteIds[0];
  if (!firstId) {
    return null;
  }
  const secondFromPalette = paletteIds.find((id) => id !== firstId);
  if (!secondFromPalette) {
    return null;
  }
  const placedSecond = placedItems[1];
  const secondId =
    placedSecond && placedSecond !== firstId ? placedSecond : secondFromPalette;
  const fallbackMotif = [firstId, secondId];
  for (let i = 0; i < placedItems.length; i++) {
    const want = fallbackMotif[i % 2];
    if (want && placedItems[i] !== want) {
      return { slot: i, elementId: want };
    }
  }
  return null;
}

function resolveL1TrackIds(
  placedItems: readonly (string | null)[],
  step: GT036HintStep | null
): readonly string[] {
  const first = placedItems[0];
  const second = placedItems[1];
  if (!(first && second && first !== second)) {
    return ["track_0", "track_1"];
  }
  if (!step) {
    return ["track_0", "track_1"];
  }
  const ids = [`track_${step.slot}`];
  const nextEmpty = placedItems.findIndex(
    (item, idx) => idx > step.slot && item === null
  );
  if (nextEmpty >= 0) {
    ids.push(`track_${nextEmpty}`);
  }
  return ids;
}

function resolveL2PaletteIds(
  placedItems: readonly (string | null)[],
  palette: readonly GT036PaletteItem[],
  step: GT036HintStep | null
): readonly string[] {
  const used = new Set(
    placedItems.filter((item): item is string => item !== null)
  );
  const unused = palette
    .filter((p) => !used.has(p.id))
    .map((p) => `palette_${p.id}`);
  if (unused.length > 0) {
    return unused;
  }
  if (step) {
    return [`palette_${step.elementId}`];
  }
  const first = palette[0];
  return first ? [`palette_${first.id}`] : [];
}

export function computeGT036HintState(params: {
  readonly placedItems: readonly (string | null)[];
  readonly palette: readonly GT036PaletteItem[];
  readonly minRepetitions: number;
  readonly strictness: GT036Difficulty["strictness"];
  readonly selectedPaletteId: string | null;
  readonly paletteBase: number;
  readonly slots: readonly Slot[];
}): GT036HintState {
  const rule = detectRule(params.placedItems, {
    minRepetitions: params.minRepetitions,
    strictness: params.strictness,
    paletteSize: params.palette.length,
  });
  if (rule.isWin) {
    return {
      isReadyToCommit: true,
      step: null,
      l1Ids: [],
      l2Ids: [],
      demoSteps: null,
      singleTargetIndex: null,
      singleDestinationIndex: null,
    };
  }

  const paletteIds = params.palette.map((p) => p.id);
  const step = findNextStepByChildRule(
    params.placedItems,
    paletteIds,
    params.minRepetitions
  );
  const l1Ids = resolveL1TrackIds(params.placedItems, step);
  const l2Ids = resolveL2PaletteIds(params.placedItems, params.palette, step);

  let singleTargetIndex: number | null = null;
  let singleDestinationIndex: number | null = null;
  if (step) {
    const palIdx = params.palette.findIndex((p) => p.id === step.elementId);
    if (step.elementId !== params.selectedPaletteId && palIdx >= 0) {
      singleTargetIndex = params.paletteBase + palIdx;
      singleDestinationIndex = step.slot;
    } else {
      singleTargetIndex = step.slot;
    }
  }

  let demoSteps: readonly HintDemoStep[] | null = null;
  const firstEmpty = params.placedItems[0] === null;
  const firstId = params.palette[0]?.id;
  const secondIdx = params.palette.findIndex((p) => p.id !== firstId);
  const needSecondOpening =
    params.placedItems[1] === null || params.placedItems[1] === firstId;
  if (
    firstEmpty &&
    needSecondOpening &&
    firstId &&
    secondIdx >= 0 &&
    params.slots[1]
  ) {
    demoSteps = [
      { from: params.paletteBase, to: 0 },
      { from: params.paletteBase + secondIdx, to: 1 },
    ];
  }

  return {
    isReadyToCommit: false,
    step,
    l1Ids,
    l2Ids,
    demoSteps,
    singleTargetIndex,
    singleDestinationIndex,
  };
}

function resolveGT036DropAction(
  gesture: Extract<Gesture, { type: "drop" }>,
  palSlots: readonly Slot[],
  trackSlots: readonly Slot[],
  palette: readonly GT036PaletteItem[]
): GameAction | null {
  const palIdx = findHitSlotIndex(
    palSlots,
    gesture.fromX,
    gesture.fromY,
    "circle",
    TAP_TOLERANCE_PX
  );
  const draggedId = palIdx >= 0 ? (palette[palIdx]?.id ?? null) : null;
  if (!draggedId) {
    return null;
  }
  const trackIdx = findHitSlotIndex(
    trackSlots,
    gesture.toX,
    gesture.toY,
    "circle",
    TAP_TOLERANCE_PX
  );
  return trackIdx >= 0
    ? {
        type: "place_element",
        data: { slotIndex: trackIdx, elementId: draggedId },
      }
    : null;
}

function resolveGT036TapAction(
  x: number,
  y: number,
  palSlots: readonly Slot[],
  trackSlots: readonly Slot[],
  params: {
    readonly palette: readonly GT036PaletteItem[];
    readonly placedItems: readonly (string | null)[];
    readonly selectedPaletteId: string | null;
    readonly clearSlot: Slot | null;
    readonly isClearVisible: boolean;
  }
): GameAction | null {
  if (
    params.clearSlot &&
    params.isClearVisible &&
    findHitSlotIndex([params.clearSlot], x, y, "circle", TAP_TOLERANCE_PX) >= 0
  ) {
    return { type: "clear_track", data: {} };
  }
  const palHit = findHitSlotIndex(palSlots, x, y, "circle", TAP_TOLERANCE_PX);
  const palItem = palHit >= 0 ? params.palette[palHit] : undefined;
  if (palItem) {
    return { type: "select_palette", data: { paletteId: palItem.id } };
  }
  const trackHit = findHitSlotIndex(
    trackSlots,
    x,
    y,
    "circle",
    TAP_TOLERANCE_PX
  );
  if (trackHit < 0) {
    return null;
  }
  const placed = params.placedItems[trackHit];
  if (params.selectedPaletteId && placed !== params.selectedPaletteId) {
    return {
      type: "place_element",
      data: { slotIndex: trackHit, elementId: params.selectedPaletteId },
    };
  }
  return placed
    ? { type: "remove_element", data: { slotIndex: trackHit } }
    : null;
}

/** Chuyển gesture chạm/kéo thành GameAction cho GT-036. */
export function resolveGT036GestureAction(params: {
  readonly gesture: Gesture;
  readonly slots: readonly Slot[];
  readonly trackLength: number;
  readonly paletteBase: number;
  readonly palette: readonly GT036PaletteItem[];
  readonly placedItems: readonly (string | null)[];
  readonly selectedPaletteId: string | null;
  readonly clearSlot: Slot | null;
  readonly isClearVisible: boolean;
}): GameAction | null {
  const { gesture } = params;
  if (gesture.type === "commit") {
    return { type: "submit_creation", data: {} };
  }
  const palSlots = params.slots.slice(
    params.paletteBase,
    params.paletteBase + params.palette.length
  );
  const trackSlots = params.slots.slice(0, params.trackLength);
  if (gesture.type === "drop") {
    return resolveGT036DropAction(
      gesture,
      palSlots,
      trackSlots,
      params.palette
    );
  }
  if (gesture.type !== "tap") {
    return null;
  }
  return resolveGT036TapAction(
    gesture.x,
    gesture.y,
    palSlots,
    trackSlots,
    params
  );
}
