import type {
  GameAction,
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { createRng } from "#src/rng/mulberry32";
import type { GT034Content, GT034Instrument } from "./template.js";

export const REST_GLYPH = "🤫";
export const TIMING_WAIVE_AFTER = 3;
export const TIMING_WIDEN_STEP = 0.5;
export const GT034_WRONG_FLASH_MS = 520;
export const GT034_TAP_RIPPLE_MS = 280;
export const GT034_VICTORY_WAVE_MS = 1600;
const BROKEN_EMOJI_RE = /^EMJ-[a-z0-9_-]+$/i;

export type GT034SequenceOutcome = "ok" | "wrong" | "timing";

export interface GT034BeatBall {
  readonly kind: "beat" | "tap";
  readonly phase: number;
  readonly step: number;
}

export interface GT034Clock {
  activeHintLevel: 0 | 1 | 2 | 3;
  elapsedMs: number;
  hoveredSlotIdx: number | null;
  lastTapMs: number | null;
  lastTappedSlotIdx: number | null;
  lastTappedSourceIdx: number | null;
  victoryStartMs: number | null;
  wrongFlashKind: "content" | "timing" | null;
  wrongFlashStartMs: number | null;
}

export interface GT034ParsedAction {
  readonly instrumentId: string | null;
  readonly timeMs: number | undefined;
}

export interface GT034BuildViewParams {
  readonly content: GT034Content;
  readonly hintTargetIndex: number | null;
  readonly hoveredSlotIdx: number | null;
  readonly isWon: boolean;
  readonly litStepIndex: number | null;
  readonly restPadSlot: Slot | undefined;
  readonly slots: readonly Slot[];
  readonly userSteps: readonly (string | null)[];
  readonly wrongActive: boolean;
}

const CLOCKS = new WeakMap<object, GT034Clock>();

export function getGT034Clock(host: object, reset = false): GT034Clock {
  let c = reset ? undefined : CLOCKS.get(host);
  if (!c) {
    c = {
      activeHintLevel: 0,
      elapsedMs: 0,
      hoveredSlotIdx: null,
      lastTapMs: null,
      lastTappedSlotIdx: null,
      lastTappedSourceIdx: null,
      victoryStartMs: null,
      wrongFlashKind: null,
      wrongFlashStartMs: null,
    };
    CLOCKS.set(host, c);
  }
  return c;
}

export function deleteGT034Clock(host: object): void {
  CLOCKS.delete(host);
}

export function isBrokenGT034Asset(
  asset: GT034Instrument["asset"] | undefined
): boolean {
  if (!asset) {
    return true;
  }
  if (asset.kind === "emoji") {
    const ref = asset.ref.trim();
    return ref.length === 0 || BROKEN_EMOJI_RE.test(ref);
  }
  const val = asset.kind === "image" ? asset.path : asset.text;
  return val.trim().length === 0;
}

export function parseGT034Action(action: GameAction): GT034ParsedAction {
  const data = action.data;
  if (typeof data !== "object" || data === null) {
    return { instrumentId: null, timeMs: undefined };
  }
  const rec: { instrument_id?: string; id?: string; time_ms?: number } = data;
  const rawId = rec.instrument_id ?? rec.id;
  const instrumentId =
    typeof rawId === "string" && rawId.length > 0 ? rawId : null;
  const timeMs =
    typeof rec.time_ms === "number" && Number.isFinite(rec.time_ms)
      ? rec.time_ms
      : undefined;
  return { instrumentId, timeMs };
}

export function deriveGT034RoundContent(
  raw: GT034Content,
  roundGen: number,
  seed: number
): GT034Content {
  if (roundGen <= 0 || raw.instruments.length < 2) {
    return raw;
  }
  const rng = createRng(seed + roundGen * 7919);
  const len = raw.target_pattern.length;
  const ids = raw.instruments.map((i) => i.instrument_id);
  const hasRest = raw.target_pattern.includes(null);
  const motifLen = len % 3 === 0 && ids.length >= 3 ? 3 : 2;
  const shifted = [...ids];
  const shift = 1 + rng.nextInt(Math.max(1, ids.length - 1));
  for (let i = 0; i < shift; i++) {
    const first = shifted.shift();
    if (first) {
      shifted.push(first);
    }
  }
  const buildPattern = (reverseMotif: boolean): (string | null)[] => {
    const motif: (string | null)[] = [];
    for (let m = 0; m < motifLen; m++) {
      if (hasRest && m === motifLen - 1) {
        motif.push(null);
      } else {
        motif.push(shifted[m % shifted.length] ?? ids[0] ?? null);
      }
    }
    if (reverseMotif) {
      motif.reverse();
    }
    const out: (string | null)[] = [];
    while (out.length < len) {
      out.push(motif[out.length % motif.length] ?? null);
    }
    return out;
  };
  let nextPattern = buildPattern(false);
  const sameAsRaw = nextPattern.every((v, i) => v === raw.target_pattern[i]);
  if (sameAsRaw) {
    nextPattern = buildPattern(true);
  }
  if (nextPattern.every((v, i) => v === raw.target_pattern[i])) {
    const alt =
      ids.find((id) => id !== raw.target_pattern[0]) ?? ids[0] ?? null;
    nextPattern = Array.from({ length: len }, (_, i) =>
      i % 2 === 0 ? alt : (raw.target_pattern[0] ?? null)
    );
  }
  return { ...raw, target_pattern: nextPattern };
}

export function verifyPatternMatched(
  steps: readonly (string | null)[],
  target: readonly (string | null)[]
): boolean {
  if (steps.length !== target.length) {
    return false;
  }
  for (let i = 0; i < target.length; i++) {
    if (steps[i] !== target[i]) {
      return false;
    }
  }
  return true;
}

export function judgeGT034Sequence(
  steps: readonly (string | null)[],
  times: readonly (number | null | undefined)[],
  target: readonly (string | null)[],
  beatMs: number,
  toleranceMs: number,
  timingMisses: number
): GT034SequenceOutcome {
  if (!verifyPatternMatched(steps, target)) {
    return "wrong";
  }
  if (timingMisses >= TIMING_WAIVE_AFTER) {
    return "ok";
  }
  for (let i = 1; i < times.length; i++) {
    const prev = times[i - 1];
    const cur = times[i];
    if (
      prev !== null &&
      prev !== undefined &&
      cur !== null &&
      cur !== undefined &&
      Math.abs(cur - prev - beatMs) > toleranceMs
    ) {
      return "timing";
    }
  }
  return "ok";
}

export function resolveHintTargetIndex(
  isWon: boolean,
  userSteps: readonly (string | null)[],
  targetPattern: readonly (string | null)[],
  instruments: readonly GT034Instrument[],
  hasRestPad: boolean
): number | null {
  if (isWon) {
    return null;
  }
  const patternLen = targetPattern.length;
  const hasWrongStep = userSteps.some((step, i) => step !== targetPattern[i]);
  if (hasWrongStep || userSteps.length >= patternLen) {
    return userSteps.length > 0 && hasWrongStep ? userSteps.length - 1 : null;
  }
  const nextInstId = targetPattern[userSteps.length];
  if (nextInstId === null && hasRestPad) {
    return patternLen + instruments.length;
  }
  if (nextInstId) {
    const instIdx = instruments.findIndex(
      (inst) => inst.instrument_id === nextInstId
    );
    if (instIdx >= 0) {
      return patternLen + instIdx;
    }
  }
  return null;
}

export function resolveHintForLevel(
  level: HintLevel,
  targetIdx: number | null,
  patternLen: number,
  userStepCount: number
): HintTarget | null {
  if (level !== 1) {
    return targetIdx === null ? null : { kind: "slot", index: targetIdx };
  }
  if (targetIdx === null) {
    return null;
  }
  const stepIdx = targetIdx < patternLen ? targetIdx : userStepCount;
  return { kind: "region", ids: [`step_${stepIdx}`] };
}

export function resolveHintDemoSequence(
  level: HintLevel,
  targetIdx: number | null
): readonly HintDemoStep[] | null {
  if (level !== 3 || targetIdx === null) {
    return null;
  }
  return [{ from: targetIdx }];
}

export function buildGT034StepEntity(
  index: number,
  slot: Slot,
  p: GT034BuildViewParams
): ViewEntity {
  let state: EntityVisual = "idle";
  if (p.isWon) {
    state = "correct";
  } else if (p.litStepIndex === index) {
    state = "selected";
  } else if (p.userSteps[index] !== undefined) {
    state = p.wrongActive ? "incorrect" : "active";
  }

  const userStep = p.userSteps[index];
  const matchedInst = userStep
    ? p.content.instruments.find((item) => item.instrument_id === userStep)
    : undefined;
  const assetLabels = matchedInst
    ? resolveAssetLabels(matchedInst.asset)
    : undefined;
  const stepName =
    matchedInst?.name_vi ??
    assetLabels?.spokenLabel ??
    (typeof userStep === "string" ? userStep : undefined);

  let spokenLabel = `Bước ${index + 1}`;
  let label = `${index + 1}`;
  if (stepName) {
    spokenLabel = `Bước ${index + 1}: ${stepName}`;
    label = stepName;
  } else if (userStep === null) {
    spokenLabel = `Bước ${index + 1}: nghỉ`;
    label = "Nghỉ";
  }

  return {
    id: `step_${index}`,
    slotIndex: index,
    role: "neutral",
    state,
    x: slot.x,
    y: slot.y,
    w: slot.w,
    h: slot.h,
    hitShape: "circle",
    glyph: assetLabels?.glyph,
    label,
    spokenLabel,
    spokenAudioPath: assetLabels?.spokenAudioPath,
  };
}

export function buildGT034View(p: GT034BuildViewParams): EngineView {
  const entities: ViewEntity[] = [];
  const patternLen = p.content.target_pattern.length;
  const instCount = p.content.instruments.length;

  for (let i = 0; i < patternLen; i++) {
    const slot = p.slots[i];
    if (slot) {
      entities.push(buildGT034StepEntity(i, slot, p));
    }
  }

  for (let i = 0; i < instCount; i++) {
    const inst = p.content.instruments[i];
    const slot = p.slots[patternLen + i];
    if (!(inst && slot)) {
      continue;
    }
    const { glyph, label, spokenLabel, spokenAudioPath } = resolveAssetLabels(
      inst.asset
    );
    const displayLabel = inst.name_vi ?? label ?? inst.instrument_id;
    const slotIdx = patternLen + i;
    entities.push({
      id: inst.instrument_id,
      slotIndex: slotIdx,
      role: "source",
      state: p.hoveredSlotIdx === slotIdx ? "active" : "idle",
      x: slot.x,
      y: slot.y,
      w: slot.hitW,
      h: slot.hitH,
      hitShape: "circle",
      glyph,
      label: displayLabel,
      spokenLabel: inst.name_vi ?? spokenLabel ?? displayLabel,
      spokenAudioPath,
    });
  }

  const restSlot = p.restPadSlot;
  if (restSlot) {
    const slotIdx = patternLen + instCount;
    entities.push({
      id: "pad_rest",
      slotIndex: slotIdx,
      role: "source",
      state: p.hoveredSlotIdx === slotIdx ? "active" : "idle",
      x: restSlot.x,
      y: restSlot.y,
      w: restSlot.hitW,
      h: restSlot.hitH,
      hitShape: "circle",
      glyph: REST_GLYPH,
      label: "Nghỉ",
      spokenLabel: "Nghỉ một nhịp",
    });
  }

  return {
    activePrompt: p.content.prompt,
    entities,
    focusIndex: p.hintTargetIndex ?? undefined,
  };
}

export function resolveGT034GestureAction(
  gesture: Gesture,
  slots: readonly Slot[],
  instruments: readonly GT034Instrument[],
  patternLen: number,
  userStepCount: number,
  restPadSlot: Slot | undefined
): GameAction | null {
  if (gesture.type === "commit") {
    return { type: "play_pattern", data: {} };
  }
  if (gesture.type !== "tap") {
    return null;
  }
  for (let i = 0; i < instruments.length; i++) {
    const inst = instruments[i];
    const slot = slots[patternLen + i];
    if (
      inst &&
      slot &&
      isPointInSlot(slot, gesture.x, gesture.y, "circle", TAP_TOLERANCE_PX)
    ) {
      return {
        type: "tap_instrument",
        data: { instrument_id: inst.instrument_id, time_ms: gesture.timeMs },
      };
    }
  }
  if (
    restPadSlot &&
    isPointInSlot(restPadSlot, gesture.x, gesture.y, "circle", TAP_TOLERANCE_PX)
  ) {
    return { type: "tap_rest", data: { time_ms: gesture.timeMs } };
  }
  if (userStepCount > 0) {
    const lastSlot = slots[userStepCount - 1];
    if (
      lastSlot &&
      isPointInSlot(lastSlot, gesture.x, gesture.y, "circle", TAP_TOLERANCE_PX)
    ) {
      return { type: "undo_beat", data: {} };
    }
  }
  return null;
}

export function findHoveredGT034Slot(
  x: number,
  y: number,
  slots: readonly Slot[],
  patternLen: number,
  userStepCount: number
): number | null {
  for (let i = patternLen; i < slots.length; i++) {
    const slot = slots[i];
    if (slot && isPointInSlot(slot, x, y, "circle", TAP_TOLERANCE_PX)) {
      return i;
    }
  }
  if (userStepCount > 0) {
    const lastSlot = slots[userStepCount - 1];
    if (lastSlot && isPointInSlot(lastSlot, x, y, "circle", TAP_TOLERANCE_PX)) {
      return userStepCount - 1;
    }
  }
  return null;
}

export interface GT034RowRail {
  readonly box: ZoneRect;
  readonly dividersX: readonly number[];
}

export function computeGT034SlotBounds(
  slots: readonly Slot[],
  padX: number,
  padY: number
): ZoneRect {
  let [minX, minY, maxX, maxY] = [1e9, 1e9, -1e9, -1e9];
  for (const slot of slots) {
    minX = Math.min(minX, slot.x - slot.w / 2);
    minY = Math.min(minY, slot.y - slot.h / 2);
    maxX = Math.max(maxX, slot.x + slot.w / 2);
    maxY = Math.max(maxY, slot.y + slot.h / 2);
  }
  return {
    x: minX - padX,
    y: minY - padY,
    w: maxX - minX + padX * 2,
    h: maxY - minY + padY * 2,
  };
}

export function buildGT034RowRails(
  stepSlots: readonly Slot[],
  patternLen: number
): readonly GT034RowRail[] {
  const rows: Slot[][] = [];
  for (const slot of stepSlots) {
    const existing = rows.find(
      (row) => Math.abs((row[0]?.y ?? 0) - slot.y) <= 8
    );
    if (existing) {
      existing.push(slot);
    } else {
      rows.push([slot]);
    }
  }
  const groupSize = patternLen === 6 ? 3 : 2;
  return rows.map((row) => {
    const box = computeGT034SlotBounds(row, 8, 6);
    const dividersX: number[] = [];
    for (let i = groupSize; i < row.length; i += groupSize) {
      const [prev, curr] = [row[i - 1], row[i]];
      if (prev && curr) {
        dividersX.push((prev.x + curr.x) / 2);
      }
    }
    return { box, dividersX };
  });
}
