import type { EngineView, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import type { LogicSpace } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawGT037BoardFrame,
  drawGT037BrokenPlaceholder,
  drawGT037FoundHalo,
  drawGT037HintRegion,
  drawGT037SymbolToken,
  drawGT037TargetSlotHint,
  type GT037TokenState,
} from "#src/render/gt-037-shapes";
import {
  collectJarBox,
  drawAssetInSlot,
  drawCollectJar,
  drawFlyingStar,
  drawSceneBackground,
  drawSubPromptText,
  jarFillLevel,
  jarMouth,
  type StarFlightPose,
  starFlightPose,
} from "#src/render/index.js";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS } from "#src/systems/wrong-flash";
import {
  computeGT037BoardBox,
  computeGT037HintRegion,
  type GT037OrderStep,
  type GT037SlotGridMeta,
  isBrokenGT037Symbol,
} from "./board-builder.js";
import type { GT037Content, GT037Symbol } from "./template.js";

export const GT037_WRONG_FLASH_MS = WRONG_FLASH_MS;
const STAR_RADIUS_RATIO = 0.22;
const REVEAL_STEP_MS = 180;
const WIN_SWEEP_STEP_MS = 140;
const WIN_SWEEP_WINDOW_MS = 380;

export interface GT037DualStamp {
  readonly simMs: number;
  readonly renderBaselineMs: number;
}

export interface GT037StarFlight {
  readonly x: number;
  readonly y: number;
  readonly stamp: GT037DualStamp;
}

export interface GT037Clock {
  simMs: number;
  hasSimAdvanced: boolean;
  lastRenderTimeMs: number;
  activeHintLevel: 0 | 1 | 2 | 3;
  hoveredSlotIndex: number | null;
  wrongStamp: GT037DualStamp | null;
  winStamp: GT037DualStamp | null;
  roundClosedStamp: GT037DualStamp | null;
  starsInFlight: GT037StarFlight[];
}

const clockMap = new WeakMap<object, GT037Clock>();

function createEmptyClock(): GT037Clock {
  return {
    simMs: 0,
    hasSimAdvanced: false,
    lastRenderTimeMs: 0,
    activeHintLevel: 0,
    hoveredSlotIndex: null,
    wrongStamp: null,
    winStamp: null,
    roundClosedStamp: null,
    starsInFlight: [],
  };
}

export function getGT037Clock(host: object): GT037Clock {
  let clock = clockMap.get(host);
  if (!clock) {
    clock = createEmptyClock();
    clockMap.set(host, clock);
  }
  return clock;
}

export function peekGT037Clock(host: object): GT037Clock | undefined {
  return clockMap.get(host);
}

export function deleteGT037Clock(host: object): void {
  clockMap.delete(host);
}

export function resetGT037ClockForRound(host: object): GT037Clock {
  const clock = createEmptyClock();
  clockMap.set(host, clock);
  return clock;
}

export function captureGT037Stamp(clock: GT037Clock): GT037DualStamp {
  return { simMs: clock.simMs, renderBaselineMs: clock.lastRenderTimeMs };
}

export function elapsedGT037Dual(
  stamp: GT037DualStamp,
  clock: GT037Clock | undefined,
  timeMs: number
): number {
  if (!clock) {
    return Math.max(0, timeMs - stamp.renderBaselineMs);
  }
  if (clock.hasSimAdvanced) {
    return Math.max(0, clock.simMs - stamp.simMs);
  }
  return Math.max(0, timeMs - stamp.renderBaselineMs);
}

export interface GT037ViewInput {
  readonly content: GT037Content;
  readonly slots: readonly Slot[];
  readonly boardSymbols: readonly GT037Symbol[];
  readonly foundTargets: ReadonlySet<number>;
  readonly wrongSlotIndex: number | null;
  readonly hoveredSlotIndex: number | null;
  readonly focusIndex: number | undefined;
}

function resolveEntityState(
  isFound: boolean,
  isWrong: boolean,
  isHovered: boolean
): ViewEntity["state"] {
  if (isFound) {
    return "correct";
  }
  if (isWrong) {
    return "incorrect";
  }
  return isHovered ? "active" : "idle";
}

export function buildGT037View(input: GT037ViewInput): EngineView {
  const {
    content,
    slots,
    boardSymbols,
    foundTargets,
    wrongSlotIndex,
    hoveredSlotIndex,
    focusIndex,
  } = input;
  const entities: ViewEntity[] = [];
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const symbol = boardSymbols[i];
    if (!(slot && symbol)) {
      continue;
    }
    const isFound = foundTargets.has(i);
    const isWrong = wrongSlotIndex === i;
    const isHovered = hoveredSlotIndex === i;
    const { glyph, label, spokenLabel, spokenAudioPath } = resolveAssetLabels(
      symbol.asset
    );
    const displayLabel = symbol.label ?? label ?? symbol.id;
    entities.push({
      id: `${symbol.id}_${i}`,
      slotIndex: i,
      role: "neutral",
      state: resolveEntityState(isFound, isWrong, isHovered),
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      hitW: slot.hitW,
      hitH: slot.hitH,
      hitShape: "circle",
      glyph,
      label: displayLabel,
      spokenLabel: spokenLabel ?? symbol.label ?? displayLabel,
      spokenAudioPath,
    });
  }
  return {
    entities,
    activePrompt: content.prompt,
    focusIndex,
  };
}

export interface GT037RenderInput {
  readonly host: object;
  readonly ctx: CanvasRenderingContext2D;
  readonly rs: RenderSystem;
  readonly timeMs: number;
  readonly themeId: string | undefined;
  readonly stageRect: ZoneRect | undefined;
  readonly logicSpace: LogicSpace;
  readonly counterText: string;
  readonly slots: readonly Slot[];
  readonly rotations: readonly number[];
  readonly gridMeta: readonly GT037SlotGridMeta[];
  readonly boardSymbols: readonly GT037Symbol[];
  readonly targetSet: ReadonlySet<string>;
  readonly foundTargets: ReadonlySet<number>;
  readonly order: readonly GT037OrderStep[];
  readonly wrongSlotIndex: number | null;
  readonly hintTargetIndex: number | null;
  readonly isWon: boolean;
  readonly roundClosedOnWrong: boolean;
  readonly particles: readonly Particle[];
  readonly particlesEnabled: boolean;
  readonly showTargetCounter: boolean;
  readonly effectiveTargetCopies: number;
}

function computeWinPulse(
  slotIndex: number,
  winOrderMap: ReadonlyMap<number, number>,
  winStamp: GT037DualStamp | null,
  clock: GT037Clock | undefined,
  timeMs: number,
  reducedMotion: boolean
): number {
  if (!winStamp) {
    return 0;
  }
  const orderIdx = winOrderMap.get(slotIndex);
  if (orderIdx === undefined) {
    return 0;
  }
  if (reducedMotion) {
    return 0.4;
  }
  const elapsed = elapsedGT037Dual(winStamp, clock, timeMs);
  const local = elapsed - orderIdx * WIN_SWEEP_STEP_MS;
  if (local < 0 || local > WIN_SWEEP_WINDOW_MS) {
    return 0;
  }
  return Math.sin((local / WIN_SWEEP_WINDOW_MS) * Math.PI);
}

function isWrongActive(
  wrongSlotIndex: number | null,
  index: number,
  clock: GT037Clock | undefined,
  timeMs: number
): boolean {
  if (wrongSlotIndex !== index) {
    return false;
  }
  if (!clock?.wrongStamp) {
    return true;
  }
  return (
    elapsedGT037Dual(clock.wrongStamp, clock, timeMs) < GT037_WRONG_FLASH_MS
  );
}

function isSlotRevealActive(
  roundClosedOnWrong: boolean,
  revealIdx: number | undefined,
  reducedMotion: boolean,
  clock: GT037Clock | undefined,
  timeMs: number
): boolean {
  if (!roundClosedOnWrong || revealIdx === undefined) {
    return false;
  }
  if (reducedMotion || !clock?.roundClosedStamp) {
    return true;
  }
  return (
    elapsedGT037Dual(clock.roundClosedStamp, clock, timeMs) >=
    revealIdx * REVEAL_STEP_MS
  );
}

function resolveTokenVisualState(
  isFound: boolean,
  wrongActive: boolean,
  isRevealActive: boolean,
  isHovered: boolean
): GT037TokenState {
  if (isFound) {
    return "found";
  }
  if (wrongActive) {
    return "wrong";
  }
  if (isRevealActive) {
    return "reveal";
  }
  return isHovered ? "hovered" : "idle";
}

function drawSlotGlyph(
  ctx: CanvasRenderingContext2D,
  drawSlot: Slot,
  symbol: GT037Symbol,
  rot: number
): void {
  if (rot === 0) {
    drawAssetInSlot(ctx, symbol.asset, drawSlot);
    return;
  }
  ctx.save();
  ctx.translate(drawSlot.x, drawSlot.y);
  ctx.rotate(rot);
  drawAssetInSlot(ctx, symbol.asset, { ...drawSlot, x: 0, y: 0 });
  ctx.restore();
}

function computeShakenSlot(
  slot: Slot,
  wrongActive: boolean,
  reducedMotion: boolean,
  timeMs: number,
  stageRect: ZoneRect | undefined
): Slot {
  if (!wrongActive || reducedMotion) {
    return slot;
  }
  const rawX = slot.x + Math.sin(timeMs * 0.05) * 4;
  const clampedX = stageRect
    ? Math.max(
        stageRect.x + slot.w / 2,
        Math.min(stageRect.x + stageRect.w - slot.w / 2, rawX)
      )
    : rawX;
  return clampedX === slot.x ? slot : { ...slot, x: clampedX };
}

function drawSlotEntry(
  input: GT037RenderInput,
  slot: Slot,
  symbol: GT037Symbol,
  index: number,
  clock: GT037Clock | undefined,
  revealOrderMap: ReadonlyMap<number, number>,
  winOrderMap: ReadonlyMap<number, number>
): void {
  const { ctx, rs, timeMs, stageRect, foundTargets, roundClosedOnWrong } =
    input;
  const stageClip = stageRect ?? undefined;
  const isFound = foundTargets.has(index);
  const wrongActive = isWrongActive(input.wrongSlotIndex, index, clock, timeMs);
  const isHovered =
    !(isFound || wrongActive) && clock?.hoveredSlotIndex === index;
  const isRevealActive = isSlotRevealActive(
    roundClosedOnWrong,
    revealOrderMap.get(index),
    rs.reducedMotion,
    clock,
    timeMs
  );
  const tokenState = resolveTokenVisualState(
    isFound,
    wrongActive,
    isRevealActive,
    isHovered
  );
  const drawSlot = computeShakenSlot(
    slot,
    wrongActive,
    rs.reducedMotion,
    timeMs,
    stageRect
  );

  drawGT037SymbolToken(ctx, rs, {
    slot: drawSlot,
    stageClip,
    state: tokenState,
  });

  if (isBrokenGT037Symbol(symbol)) {
    drawGT037BrokenPlaceholder(ctx, rs, { slot: drawSlot, stageClip });
    return;
  }

  drawSlotGlyph(ctx, drawSlot, symbol, input.rotations[index] ?? 0);

  if (isFound) {
    const pulseIntensity = input.isWon
      ? computeWinPulse(
          index,
          winOrderMap,
          clock?.winStamp ?? null,
          clock,
          timeMs,
          rs.reducedMotion
        )
      : 0;
    drawGT037FoundHalo(ctx, rs, {
      slot: drawSlot,
      stageClip,
      timeMs,
      pulseIntensity,
    });
  } else if (isRevealActive) {
    drawGT037FoundHalo(ctx, rs, {
      slot: drawSlot,
      stageClip,
      timeMs,
      isReveal: true,
    });
  }

  if (clock?.activeHintLevel === 3 && input.hintTargetIndex === index) {
    drawGT037TargetSlotHint(ctx, rs, { slot: drawSlot, stageClip, timeMs });
  }
}

function buildWinOrderMap(
  order: readonly GT037OrderStep[]
): Map<number, number> {
  const winOrderMap = new Map<number, number>();
  let orderCounter = 0;
  for (const step of order) {
    if (step.isTarget && !winOrderMap.has(step.slotIndex)) {
      winOrderMap.set(step.slotIndex, orderCounter);
      orderCounter++;
    }
  }
  return winOrderMap;
}

function buildRevealOrderMap(input: GT037RenderInput): Map<number, number> {
  const revealOrderMap = new Map<number, number>();
  if (!input.roundClosedOnWrong) {
    return revealOrderMap;
  }
  let revCounter = 0;
  for (let i = 0; i < input.boardSymbols.length; i++) {
    const sym = input.boardSymbols[i];
    if (
      sym &&
      input.targetSet.has(sym.id) &&
      !input.foundTargets.has(i) &&
      !isBrokenGT037Symbol(sym)
    ) {
      revealOrderMap.set(i, revCounter);
      revCounter++;
    }
  }
  return revealOrderMap;
}

function renderHintOverlay(
  input: GT037RenderInput,
  clock: GT037Clock | undefined,
  boardBox: ZoneRect
): void {
  if (
    !clock ||
    (clock.activeHintLevel !== 1 && clock.activeHintLevel !== 2) ||
    input.hintTargetIndex === null
  ) {
    return;
  }
  const region = computeGT037HintRegion(
    clock.activeHintLevel,
    input.hintTargetIndex,
    input.slots,
    input.gridMeta,
    input.boardSymbols,
    boardBox
  );
  if (region) {
    drawGT037HintRegion(input.ctx, input.rs, {
      regionBox: region.regionBox,
      stageClip: input.stageRect ?? undefined,
      hintLevel: clock.activeHintLevel,
      timeMs: input.timeMs,
    });
  }
}

function renderJarSection(
  input: GT037RenderInput,
  clock: GT037Clock | undefined
): void {
  const { stageRect, rs, ctx, timeMs, slots } = input;
  if (!stageRect) {
    return;
  }
  const box = collectJarBox(stageRect, rs.LOGIC_WIDTH, rs.LOGIC_HEIGHT);
  if (!box) {
    return;
  }
  const mouth = jarMouth(box);
  const flying: StarFlightPose[] = [];
  for (const star of clock?.starsInFlight ?? []) {
    const elapsed = elapsedGT037Dual(star.stamp, clock, timeMs);
    const pose = starFlightPose(star, mouth, elapsed, rs.reducedMotion);
    if (pose) {
      flying.push(pose);
    }
  }
  const landed = Math.max(0, input.foundTargets.size - flying.length);
  drawCollectJar(
    ctx,
    box,
    jarFillLevel(
      landed,
      input.showTargetCounter ? input.effectiveTargetCopies : null
    )
  );
  const edge = slots[0]?.w ?? box.w;
  const starR = edge * STAR_RADIUS_RATIO;
  for (const pose of flying) {
    const clampedPose = {
      ...pose,
      x: Math.max(
        stageRect.x + starR + 2,
        Math.min(stageRect.x + stageRect.w - starR - 2, pose.x)
      ),
      y: Math.max(
        stageRect.y + starR + 2,
        Math.min(stageRect.y + stageRect.h - starR - 2, pose.y)
      ),
    };
    drawFlyingStar(ctx, clampedPose, starR);
  }
}

export function renderGT037Frame(input: GT037RenderInput): void {
  const { ctx, rs, stageRect, slots, boardSymbols } = input;
  const clock = peekGT037Clock(input.host);
  drawSceneBackground(ctx, rs, input.themeId);
  if (!stageRect) {
    drawSubPromptText(ctx, rs, input.counterText);
  }

  const stageClip = stageRect ?? undefined;
  const boardBox = computeGT037BoardBox(slots, stageRect, input.logicSpace);
  drawGT037BoardFrame(ctx, rs, { boardBox, stageClip });
  renderHintOverlay(input, clock, boardBox);

  const winOrderMap = buildWinOrderMap(input.order);
  const revealOrderMap = buildRevealOrderMap(input);
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const symbol = boardSymbols[i];
    if (slot && symbol) {
      drawSlotEntry(input, slot, symbol, i, clock, revealOrderMap, winOrderMap);
    }
  }

  if (input.particles.length > 0 && input.particlesEnabled) {
    const visibleParticles = stageRect
      ? input.particles.filter(
          (p) =>
            p.x - p.size >= stageRect.x + 2 &&
            p.x + p.size <= stageRect.x + stageRect.w - 2 &&
            p.y - p.size >= stageRect.y + 2 &&
            p.y + p.size <= stageRect.y + stageRect.h - 2
        )
      : input.particles;
    if (visibleParticles.length > 0) {
      rs.drawParticles(ctx, [...visibleParticles]);
    }
  }
  renderJarSection(input, clock);
}
