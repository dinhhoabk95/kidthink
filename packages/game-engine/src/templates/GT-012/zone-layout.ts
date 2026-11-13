import { SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { computeDiceSlots } from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { GT012Content } from "./template.js";

const PLATE_MAX_PX = 220;
const FLASH_ITEM_PX = 64;
const FLASH_ITEM_MIN_PX = 24;
const FLASH_ITEM_STEP_PX = 4;
const FLASH_ITEM_GAP_PX = 8;

export const FLASH_DISH_INNER_FRACTION = 0.72;

export type GT012StagePhase =
  | "awaiting_start"
  | "flashing"
  | "answering"
  | "reveal_win"
  | "reveal_closed";

export type GT012OptionVisualState =
  | "idle"
  | "touching"
  | "selected"
  | "correct"
  | "wrong";

export interface GT012OptionTokenProps {
  readonly value: number;
  readonly state: GT012OptionVisualState;
  readonly dimmed: boolean;
  readonly wrongProgress: number | null;
  readonly winPop01: number;
  readonly degraded: boolean;
  readonly stageRect?: ZoneRect | null;
}

export interface RecallAreas {
  readonly plate: ZoneRect;
  readonly plateAlone: ZoneRect;
  readonly options: ZoneRect;
}

export interface GT012SessionVariant {
  readonly displayOptions: readonly GT012Content["options"][number][];
  readonly effectiveArrangement: GT012Content["arrangement"];
  readonly narrowedValues: ReadonlySet<number>;
  readonly narrowedIds: readonly string[];
}

function centeredPlate(stage: ZoneRect, side: number): ZoneRect {
  return {
    x: stage.x + Math.round((stage.w - side) / 2),
    y: stage.y + Math.round((stage.h - side) / 2),
    w: side,
    h: side,
  };
}

export function splitRecallStage(stage: ZoneRect): RecallAreas {
  if (stage.w >= stage.h) {
    const side = Math.min(PLATE_MAX_PX, stage.h);
    return {
      plate: {
        x: stage.x,
        y: stage.y + Math.round((stage.h - side) / 2),
        w: side,
        h: side,
      },
      plateAlone: centeredPlate(stage, side),
      options: {
        x: stage.x + side + SLOT_GAP_PX,
        y: stage.y,
        w: stage.w - side - SLOT_GAP_PX,
        h: stage.h,
      },
    };
  }
  const side = Math.min(PLATE_MAX_PX, stage.w);
  return {
    plate: {
      x: stage.x + Math.round((stage.w - side) / 2),
      y: stage.y,
      w: side,
      h: side,
    },
    plateAlone: centeredPlate(stage, side),
    options: {
      x: stage.x,
      y: stage.y + side + SLOT_GAP_PX,
      w: stage.w,
      h: stage.h - side - SLOT_GAP_PX,
    },
  };
}

export function plateSlot(plate: ZoneRect): Slot {
  return {
    index: 0,
    x: Math.round(plate.x + plate.w / 2),
    y: Math.round(plate.y + plate.h / 2),
    w: plate.w,
    h: plate.h,
    hitW: plate.w,
    hitH: plate.h,
    page: 0,
    role: "target",
  };
}

export function clampRetryRadiusToStage(
  slot: Slot,
  stageRect?: ZoneRect | null
): number {
  const raw = Math.min(slot.hitW, slot.hitH) / 2 + 2;
  if (!stageRect) {
    return raw;
  }
  const avail = Math.min(
    slot.x - stageRect.x - 2,
    stageRect.x + stageRect.w - slot.x - 2,
    slot.y - stageRect.y - 2,
    stageRect.y + stageRect.h - slot.y - 2
  );
  return Math.max(8, Math.min(raw, avail));
}

interface Point {
  readonly x: number;
  readonly y: number;
}

function recenterPoints(pts: readonly Point[]): Point[] {
  if (pts.length === 0) {
    return [];
  }
  const mx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const my = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  return pts.map((p) => ({ x: p.x - mx, y: p.y - my }));
}

function lineOffsets(count: number, pitch: number): Point[] {
  if (count <= 4) {
    return Array.from({ length: count }, (_, i) => ({
      x: (i - (count - 1) / 2) * pitch,
      y: 0,
    }));
  }
  const top = Math.ceil(count / 2);
  const bot = count - top;
  return Array.from({ length: count }, (_, i) =>
    i < top
      ? { x: (i - (top - 1) / 2) * pitch, y: -pitch / 2 }
      : { x: (i - top - (bot - 1) / 2) * pitch, y: pitch / 2 }
  );
}

const TRI_ROWS: readonly (readonly number[])[] = [
  [],
  [1],
  [1, 1],
  [1, 2],
  [1, 3],
  [2, 3],
  [1, 2, 3],
];

function triangleOffsets(count: number, pitch: number): Point[] {
  if (count === 2) {
    return [
      { x: -pitch * 0.28, y: -pitch * 0.5 },
      { x: pitch * 0.28, y: pitch * 0.5 },
    ];
  }
  const rows = TRI_ROWS[count] ?? [Math.ceil(count / 2), Math.floor(count / 2)];
  const pts: Point[] = [];
  rows.forEach((n, r) => {
    for (let c = 0; c < n; c++) {
      pts.push({
        x: (c - (n - 1) / 2) * pitch,
        y: (r - (rows.length - 1) / 2) * pitch,
      });
    }
  });
  return recenterPoints(pts);
}

const HAND_UNIT: readonly (readonly Point[])[] = [
  [],
  [{ x: 0, y: 0 }],
  [
    { x: -0.55, y: -0.2 },
    { x: 0.55, y: 0.2 },
  ],
  [
    { x: -0.88, y: 0.35 },
    { x: 0, y: -0.68 },
    { x: 0.88, y: 0.35 },
  ],
  [
    { x: -1.04, y: 0.48 },
    { x: -0.52, y: -0.55 },
    { x: 0.52, y: -0.55 },
    { x: 1.04, y: 0.48 },
  ],
  [
    { x: -1, y: 0.55 },
    { x: -1, y: -0.48 },
    { x: 0, y: -0.82 },
    { x: 1, y: -0.48 },
    { x: 1, y: 0.55 },
  ],
  [
    { x: -1, y: 0.55 },
    { x: -1, y: -0.48 },
    { x: 0, y: -0.82 },
    { x: 1, y: -0.48 },
    { x: 1, y: 0.55 },
    { x: 0, y: 0.55 },
  ],
];

function handOffsets(count: number, pitch: number): Point[] {
  const unit = HAND_UNIT[count] ?? HAND_UNIT[6] ?? [];
  return recenterPoints(unit.map((p) => ({ x: p.x * pitch, y: p.y * pitch })));
}

function randomOffsets(count: number, pitch: number): Point[] {
  if (count <= 1) {
    return [{ x: 0, y: 0 }];
  }
  const pts = Array.from({ length: count }, (_, i) => {
    const angle = i * 2.399_96 + 0.55;
    const r = Math.sqrt(i + 0.6) * pitch * 0.85;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  });
  return recenterPoints(pts);
}

function arrangementOffsets(
  arrangement: GT012Content["arrangement"],
  parent: Slot,
  count: number,
  size: number
): Point[] {
  const pitch = size + FLASH_ITEM_GAP_PX;
  if (arrangement === "dice") {
    return computeDiceSlots(parent, count, size).map((slot) => ({
      x: slot.x - parent.x,
      y: slot.y - parent.y,
    }));
  }
  if (arrangement === "line") {
    return lineOffsets(count, pitch);
  }
  if (arrangement === "triangle") {
    return triangleOffsets(count, pitch);
  }
  if (arrangement === "hand") {
    return handOffsets(count, pitch);
  }
  return randomOffsets(count, pitch);
}

function reachOf(offsets: readonly Point[], size: number): number {
  return Math.max(...offsets.map((o) => Math.hypot(o.x, o.y))) + size / 2;
}

function isSeparated(offsets: readonly Point[], size: number): boolean {
  return offsets.every((a, i) =>
    offsets
      .slice(i + 1)
      .every((b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) >= size)
  );
}

interface FlashFit {
  readonly size: number;
  readonly offsets: readonly Point[];
}

function fitInsideDish(
  plate: ZoneRect,
  offsetsAt: (size: number) => Point[]
): FlashFit {
  const inner = (Math.min(plate.w, plate.h) / 2) * FLASH_DISH_INNER_FRACTION;
  let last: FlashFit = {
    size: FLASH_ITEM_MIN_PX,
    offsets: offsetsAt(FLASH_ITEM_MIN_PX),
  };
  for (
    let size = FLASH_ITEM_PX;
    size >= FLASH_ITEM_MIN_PX;
    size -= FLASH_ITEM_STEP_PX
  ) {
    const raw = offsetsAt(size);
    const reach = reachOf(raw, size);
    const k =
      reach > inner ? Math.max(0, (inner - size / 2) / (reach - size / 2)) : 1;
    const offsets = raw.map((o) => ({ x: o.x * k, y: o.y * k }));
    last = { size, offsets };
    if (reachOf(offsets, size) <= inner + 0.001 && isSeparated(offsets, size)) {
      return last;
    }
  }
  return last;
}

export function computeFlashSlots(
  plate: ZoneRect,
  count: number,
  arrangement: GT012Content["arrangement"]
): Slot[] {
  const parent = plateSlot(plate);
  const fit = fitInsideDish(plate, (size) =>
    arrangementOffsets(arrangement, parent, count, size)
  );
  return fit.offsets.map((o, index) => ({
    ...parent,
    index,
    x: Math.round(parent.x + o.x),
    y: Math.round(parent.y + o.y),
    w: fit.size,
    h: fit.size,
    hitW: fit.size,
    hitH: fit.size,
    role: "neutral" as const,
  }));
}

const ALL_ARRANGEMENTS: readonly GT012Content["arrangement"][] = [
  "dice",
  "line",
  "triangle",
  "random",
  "hand",
];

function resolveShuffledOptions(
  options: readonly GT012Content["options"][number][],
  layoutSeed: number
): readonly GT012Content["options"][number][] {
  if (layoutSeed === 0 || options.length < 2) {
    return [...options];
  }
  const shuffled = shuffle(options, deriveStream(layoutSeed, "distractors"));
  const unchanged = shuffled.every((o, i) => o.value === options[i]?.value);
  return unchanged && shuffled[0]
    ? [...shuffled.slice(1), shuffled[0]]
    : shuffled;
}

function resolveEffectiveArrangement(
  base: GT012Content["arrangement"],
  layoutSeed: number
): GT012Content["arrangement"] {
  if (layoutSeed === 0) {
    return base;
  }
  const candidates = ALL_ARRANGEMENTS.filter((a) => a !== base);
  const rng = deriveStream(layoutSeed, "assign");
  return candidates[rng.nextInt(candidates.length)] ?? base;
}

export function computeNarrowedOptionValues(
  options: readonly GT012Content["options"][number][]
): ReadonlySet<number> {
  const correctOpt = options.find((o) => o.is_correct);
  if (!correctOpt) {
    return new Set(options.slice(0, 2).map((o) => o.value));
  }
  let closestDistractor: GT012Content["options"][number] | null = null;
  let minDiff = Number.POSITIVE_INFINITY;
  for (const opt of options) {
    if (opt.is_correct) {
      continue;
    }
    const diff = Math.abs(opt.value - correctOpt.value);
    if (diff < minDiff) {
      minDiff = diff;
      closestDistractor = opt;
    }
  }
  const values = [correctOpt.value];
  if (closestDistractor) {
    values.push(closestDistractor.value);
  }
  return new Set(values);
}

export function resolveSessionVariant(
  content: GT012Content,
  layoutSeed: number
): GT012SessionVariant {
  const displayOptions = resolveShuffledOptions(content.options, layoutSeed);
  const effectiveArrangement = resolveEffectiveArrangement(
    content.arrangement,
    layoutSeed
  );
  const narrowedValues = computeNarrowedOptionValues(displayOptions);
  const narrowedIds = displayOptions
    .filter((o) => narrowedValues.has(o.value))
    .map((o) => `opt-${o.value}`);
  return {
    displayOptions,
    effectiveArrangement,
    narrowedValues,
    narrowedIds,
  };
}
