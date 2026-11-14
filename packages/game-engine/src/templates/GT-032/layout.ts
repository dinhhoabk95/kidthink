import {
  formatNumberWord,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import type {
  GameAction,
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "#src/game-session";
import type { EngineView, EntityVisual, ViewEntity } from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawGT032CupOverlay,
  drawGT032HintRegionOverlay,
  drawGT032QuestionBadge,
  drawGT032WaterBench,
  type GT032VisualState,
  withGT032StageClip,
} from "#src/render/gt-032-shapes";
import {
  canvasFontPx,
  drawDetachedWaterColumns,
  drawLabelText,
  drawLiquidCup,
  drawPourDemo,
  drawSceneBackground,
  drawStoryCharacterInStage,
  liquidCupRect,
  ponyDrinkMotion,
  waterRiseLevel,
} from "#src/render/index";
import type { SceneBox } from "#src/render/types";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import type { GT032Content, GT032Cup } from "./template";

export const GT032_HAPPY_MS = 600;
export const GT032_COLUMNS_TWEEN_MS = 1400;
export const GT032_POUR_DEMO_MS = 2000;
export const GT032_WONDER_MS = 1500;

export interface GT032ActionPayload {
  readonly cup_id?: string;
  readonly delta?: number;
  readonly fill_units?: number;
  readonly id?: string;
  readonly option_id?: string;
}

export interface FillRiseState {
  readonly from: number;
  readonly startRenderMs: number | null;
  readonly to: number;
}

export interface GT032Clock {
  columnsStartMs: number | null;
  readonly fillRise: Map<string, FillRiseState>;
  hintLevel: 0 | HintLevel;
  hoveredCupId: string | null;
  lastPourAtMs: number;
  lastRenderMs: number;
  logicMs: number;
  particles: Particle[];
  pourElapsedMs: number;
  reducedMotionSeen: boolean;
  wrongCupId: string | null;
  readonly wrongFlash: WrongFlash;
}

export interface GT032LayoutHost {
  readonly content: GT032Content;
  readonly cssPerLogic?: number;
  readonly degradation: DegradationState | null;
  readonly displayCups: readonly GT032Cup[];
  readonly isWin: boolean;
  readonly logicSpace: { readonly w: number; readonly h: number };
  readonly roundClosedOnWrong: boolean;
  readonly selectedCupId: string | null;
  readonly showHintMarks: boolean;
  readonly slots: readonly Slot[];
  readonly stageRect?: ZoneRect;
  readonly themeId?: string;
  checkWinCondition(): boolean;
  getCupFill(cupId: string): number;
  getTargetFill(cup: GT032Cup): number;
  isAcceptingInput(): boolean;
}

const CLOCK_MAP = new WeakMap<object, GT032Clock>();

function createGT032Clock(): GT032Clock {
  return {
    columnsStartMs: null,
    fillRise: new Map(),
    hintLevel: 0,
    hoveredCupId: null,
    lastPourAtMs: Number.NEGATIVE_INFINITY,
    lastRenderMs: 0,
    logicMs: 0,
    particles: [],
    pourElapsedMs: 0,
    reducedMotionSeen: false,
    wrongCupId: null,
    wrongFlash: new WrongFlash(),
  };
}

export function getGT032Clock(host: object): GT032Clock {
  let clock = CLOCK_MAP.get(host);
  if (!clock) {
    clock = createGT032Clock();
    CLOCK_MAP.set(host, clock);
  }
  return clock;
}

export function resetGT032Clock(host: object): GT032Clock {
  const next = createGT032Clock();
  CLOCK_MAP.set(host, next);
  return next;
}

export function deleteGT032Clock(host: object): void {
  CLOCK_MAP.delete(host);
}

function readStringField(obj: object, key: string): string | undefined {
  const v = Reflect.get(obj, key);
  return typeof v === "string" ? v : undefined;
}

function readNumberField(obj: object, key: string): number | undefined {
  const v = Reflect.get(obj, key);
  return typeof v === "number" ? v : undefined;
}

export function narrowGT032Payload(action: GameAction): GT032ActionPayload {
  const raw = Reflect.get(action, "data");
  if (typeof raw !== "object" || raw === null) {
    return {};
  }
  return {
    cup_id: readStringField(raw, "cup_id"),
    id: readStringField(raw, "id"),
    option_id: readStringField(raw, "option_id"),
    delta: readNumberField(raw, "delta"),
    fill_units: readNumberField(raw, "fill_units"),
  };
}

export function resolveDisplayCups(
  baseCups: readonly GT032Cup[],
  prevCups: readonly GT032Cup[],
  layoutSeed: number,
  roundGeneration: number
): GT032Cup[] {
  const copy = [...baseCups];
  if (roundGeneration <= 0 || layoutSeed <= 0 || copy.length <= 1) {
    return copy;
  }
  const rng = deriveStream(layoutSeed + roundGeneration * 7919, "assign");
  const out = shuffle(copy, rng);
  const prevRef = prevCups.length === copy.length ? prevCups : baseCups;
  if (out.every((c, idx) => c.cup_id === prevRef[idx]?.cup_id)) {
    const first = out[0];
    const second = out[1];
    if (first && second) {
      out[0] = second;
      out[1] = first;
    }
  }
  return out;
}

export function computeGT032Slots(
  host: GT032LayoutHost,
  band: AgeBand
): readonly Slot[] {
  const layoutFn = resolveLayout("grid");
  return layoutFn({
    slotCount: host.displayCups.length,
    ageBand: band,
    logic: host.logicSpace,
    stage: host.stageRect,
    cssPerLogic: host.cssPerLogic,
  });
}

export function isGT032CupCorrect(
  host: GT032LayoutHost,
  cup: GT032Cup
): boolean {
  const qType = host.content.question_type;
  const cups = host.displayCups;
  const fill = host.getCupFill(cup.cup_id);
  if (qType === "more") {
    const maxFill = Math.max(...cups.map((c) => host.getCupFill(c.cup_id)));
    return fill === maxFill;
  }
  if (qType === "less") {
    const minFill = Math.min(...cups.map((c) => host.getCupFill(c.cup_id)));
    return fill === minFill;
  }
  if (qType === "same") {
    return cups.filter((c) => host.getCupFill(c.cup_id) === fill).length >= 2;
  }
  return fill === host.getTargetFill(cup);
}

export function findGT032PourDemoPair(
  content: GT032Content,
  cups: readonly GT032Cup[]
): readonly [number, number] | null {
  if (!content.conservation_trap || content.question_type === "pour_to_mark") {
    return null;
  }
  let fallback: readonly [number, number] | null = null;
  for (let i = 0; i < cups.length; i++) {
    for (let j = i + 1; j < cups.length; j++) {
      const a = cups[i];
      const b = cups[j];
      if (!(a && b) || a.fill_units !== b.fill_units || a.shape === b.shape) {
        continue;
      }
      if (a.capacity_units === b.capacity_units) {
        return [i, j];
      }
      fallback = fallback ?? [i, j];
    }
  }
  return fallback;
}

export function buildGT032View(host: GT032LayoutHost): EngineView {
  const clock = getGT032Clock(host);
  const wrongActive = clock.wrongFlash.isActive(clock.logicMs);
  const entities: ViewEntity[] = [];
  for (let i = 0; i < host.displayCups.length; i++) {
    const cup = host.displayCups[i];
    const slot = host.slots[i];
    if (!(cup && slot)) {
      continue;
    }
    let state: EntityVisual = "idle";
    if (wrongActive && clock.wrongCupId === cup.cup_id) {
      state = "incorrect";
    } else if (host.selectedCupId === cup.cup_id) {
      state = isGT032CupCorrect(host, cup) ? "correct" : "selected";
    } else if (clock.hoveredCupId === cup.cup_id) {
      state = "selected";
    }
    const cupNumberWord = formatNumberWord(i + 1);
    entities.push({
      id: cup.cup_id,
      slotIndex: i,
      role: "target",
      state,
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      hitShape: "square",
      glyph: "🥛",
      spokenLabel: formatSpokenLabel(`cốc số ${cupNumberWord}`),
    });
  }
  return { activePrompt: host.content.prompt, entities };
}

export function resolveGT032HintTargetIndex(
  host: GT032LayoutHost
): number | null {
  if (host.checkWinCondition() || host.roundClosedOnWrong) {
    return null;
  }
  if (host.content.question_type === "pour_to_mark") {
    const idx = host.displayCups.findIndex((c) => !isGT032CupCorrect(host, c));
    return idx >= 0 ? idx : null;
  }
  const idx = host.displayCups.findIndex((c) => isGT032CupCorrect(host, c));
  return idx >= 0 ? idx : null;
}

function resolvePourHintTarget(
  host: GT032LayoutHost,
  level: HintLevel
): HintTarget | null {
  const idx = resolveGT032HintTargetIndex(host);
  if (idx === null) {
    return { kind: "action" };
  }
  const cup = host.displayCups[idx];
  if (!cup) {
    return null;
  }
  if (level === 1) {
    return {
      kind: "region",
      ids: ["cup-unit-ticks", ...host.displayCups.map((c) => c.cup_id)],
    };
  }
  if (level === 2) {
    return { kind: "region", ids: ["cup-target-mark", cup.cup_id] };
  }
  return { kind: "slot", index: idx };
}

export function resolveGT032HintTargetForLevel(
  host: GT032LayoutHost,
  level: HintLevel
): HintTarget | null {
  if (host.checkWinCondition() || host.roundClosedOnWrong) {
    return null;
  }
  if (host.content.question_type === "pour_to_mark") {
    return resolvePourHintTarget(host, level);
  }
  if (level === 1) {
    return {
      kind: "region",
      ids: ["cup-unit-ticks", ...host.displayCups.map((c) => c.cup_id)],
    };
  }
  if (level === 2) {
    return {
      kind: "region",
      ids: ["cup-unit-counts", ...host.displayCups.map((c) => c.cup_id)],
    };
  }
  const idx = resolveGT032HintTargetIndex(host);
  return idx === null ? null : { kind: "slot", index: idx };
}

export function resolveGT032HintDemoSequence(
  host: GT032LayoutHost,
  level: HintLevel
): readonly HintDemoStep[] | null {
  if (level < 3 || host.checkWinCondition() || host.roundClosedOnWrong) {
    return null;
  }
  const idx = resolveGT032HintTargetIndex(host);
  if (idx === null) {
    return null;
  }
  if (host.content.question_type !== "pour_to_mark") {
    return [{ from: idx }];
  }
  const cup = host.displayCups[idx];
  if (!cup) {
    return null;
  }
  const diff = Math.abs(host.getTargetFill(cup) - host.getCupFill(cup.cup_id));
  const steps: HintDemoStep[] = [];
  const count = Math.max(1, Math.min(4, diff));
  for (let i = 0; i < count; i++) {
    steps.push({ from: idx });
  }
  return steps;
}

function resolveDisplayedFill(
  host: GT032LayoutHost,
  clock: GT032Clock,
  cupId: string,
  timeMs: number,
  reducedMotion: boolean
): number {
  const target = host.getCupFill(cupId);
  const rise = clock.fillRise.get(cupId);
  if (!rise) {
    clock.fillRise.set(cupId, {
      from: target,
      to: target,
      startRenderMs: timeMs,
    });
    return target;
  }
  const startMs = rise.startRenderMs ?? timeMs;
  if (rise.startRenderMs === null) {
    clock.fillRise.set(cupId, {
      from: rise.from,
      to: rise.to,
      startRenderMs: timeMs,
    });
  }
  const current = waterRiseLevel(
    rise.from,
    rise.to,
    timeMs - startMs,
    reducedMotion
  );
  if (rise.to === target) {
    return current;
  }
  clock.fillRise.set(cupId, {
    from: current,
    to: target,
    startRenderMs: timeMs,
  });
  return waterRiseLevel(current, target, 0, reducedMotion);
}

interface GT032CupPassContext {
  readonly clock: GT032Clock;
  readonly ctx: CanvasRenderingContext2D;
  readonly detached: boolean;
  readonly fontPx: number;
  readonly hintTargetIndex: number | null;
  readonly host: GT032LayoutHost;
  readonly maxCap: number;
  readonly pourPair: readonly [number, number] | null;
  readonly pourProgress: number;
  readonly rs: RenderSystem;
  readonly stageZone: ZoneRect;
  readonly timeMs: number;
  readonly wrongActive: boolean;
  readonly wrongProgress: number | null;
}

function resolveCupVisualState(
  host: GT032LayoutHost,
  clock: GT032Clock,
  cup: GT032Cup,
  wrongActive: boolean,
  isHintTarget: boolean
): GT032VisualState {
  if (wrongActive && clock.wrongCupId === cup.cup_id) {
    return "wrong";
  }
  if (host.checkWinCondition() && isGT032CupCorrect(host, cup)) {
    return "correct";
  }
  if (isHintTarget) {
    return "hint";
  }
  if (host.selectedCupId === cup.cup_id) {
    return "selected";
  }
  if (clock.hoveredCupId === cup.cup_id) {
    return "hovered";
  }
  return "idle";
}

function drawSingleCup(
  pass: GT032CupPassContext,
  cup: GT032Cup,
  slot: Slot,
  index: number
): void {
  const { ctx, rs, host, clock, stageZone, maxCap, timeMs, detached } = pass;
  const isWon = host.checkWinCondition();
  const softShadowsEnabled = host.degradation?.soft_shadows_enabled !== false;
  const fillScale = pass.pourPair?.[1] === index ? pass.pourProgress : 1;
  const shownFill = detached
    ? 0
    : resolveDisplayedFill(host, clock, cup.cup_id, timeMs, rs.reducedMotion) *
      fillScale;
  drawLiquidCup(ctx, rs, slot, {
    cupId: cup.cup_id,
    shape: cup.shape,
    capacityUnits: cup.capacity_units,
    fillUnits: shownFill,
    color: cup.color,
    isSelected: host.selectedCupId === cup.cup_id,
    showHintMarks: host.showHintMarks || clock.hintLevel >= 1 || isWon,
    maxCapacityUnits: maxCap,
  });
  const rect = liquidCupRect(slot, cup.shape, cup.capacity_units, maxCap);
  const isHintTarget =
    clock.hintLevel === 3 && !detached && pass.hintTargetIndex === index;
  const visualState = resolveCupVisualState(
    host,
    clock,
    cup,
    pass.wrongActive,
    isHintTarget
  );
  drawGT032CupOverlay(ctx, rs, {
    stageZone,
    rect,
    shape: cup.shape,
    capacityUnits: cup.capacity_units,
    fillUnits: shownFill,
    targetUnits:
      host.content.question_type === "pour_to_mark"
        ? host.getTargetFill(cup)
        : null,
    state: visualState,
    elapsedMs: timeMs,
    wrongProgress: visualState === "wrong" ? pass.wrongProgress : null,
    isRoundClosed: host.roundClosedOnWrong,
    showTargetMark: host.content.question_type === "pour_to_mark",
    showRipple: softShadowsEnabled && !detached,
    reducedMotion: rs.reducedMotion,
  });
  if (clock.hintLevel >= 2 && !detached) {
    const labelY = Math.min(
      rect.y + rect.h + 18,
      stageZone.y + stageZone.h - pass.fontPx * 0.65
    );
    drawLabelText(
      ctx,
      String(host.getCupFill(cup.cup_id)),
      slot.x,
      labelY,
      pass.fontPx
    );
  }
}

function drawCupsPass(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  host: GT032LayoutHost,
  clock: GT032Clock,
  stageZone: ZoneRect,
  maxCap: number,
  timeMs: number,
  detached: boolean,
  pourPair: readonly [number, number] | null,
  pourProgress: number,
  wrongActive: boolean,
  wrongProgress: number | null
): void {
  const fontPx = Math.max(
    24,
    canvasFontPx(rs.logicSpace, "badge", rs.viewport?.scale ?? host.cssPerLogic)
  );
  const pass: GT032CupPassContext = {
    clock,
    ctx,
    detached,
    fontPx,
    hintTargetIndex:
      clock.hintLevel === 3 && !detached
        ? resolveGT032HintTargetIndex(host)
        : null,
    host,
    maxCap,
    pourPair,
    pourProgress,
    rs,
    stageZone,
    timeMs,
    wrongActive,
    wrongProgress,
  };
  for (let i = 0; i < host.displayCups.length; i++) {
    const cup = host.displayCups[i];
    const slot = host.slots[i];
    if (cup && slot) {
      drawSingleCup(pass, cup, slot, i);
    }
  }
}

function drawDetachedColumnsPass(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  host: GT032LayoutHost,
  clock: GT032Clock,
  maxCap: number,
  timeMs: number
): void {
  if (clock.columnsStartMs === null) {
    clock.columnsStartMs = timeMs;
  }
  const progress = rs.reducedMotion
    ? 1
    : (timeMs - clock.columnsStartMs) / GT032_COLUMNS_TWEEN_MS;
  const cols = host.displayCups.flatMap((cup, i) => {
    const slot = host.slots[i];
    return slot
      ? [
          {
            slot,
            shape: cup.shape,
            capacityUnits: cup.capacity_units,
            fillUnits: host.getCupFill(cup.cup_id),
            color: cup.color,
          },
        ]
      : [];
  });
  drawDetachedWaterColumns(ctx, cols, maxCap, progress);
}

function drawPourDemoPass(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  host: GT032LayoutHost,
  stageZone: ZoneRect,
  pourPair: readonly [number, number],
  maxCap: number,
  pourProgress: number
): void {
  const src = host.displayCups[pourPair[0]];
  const dst = host.displayCups[pourPair[1]];
  const srcSlot = host.slots[pourPair[0]];
  const dstSlot = host.slots[pourPair[1]];
  if (!(src && dst && srcSlot && dstSlot)) {
    return;
  }
  withGT032StageClip(ctx, stageZone, () => {
    drawPourDemo(
      ctx,
      rs,
      {
        slot: srcSlot,
        shape: src.shape,
        capacityUnits: src.capacity_units,
        fillUnits: src.fill_units,
        color: src.color,
      },
      {
        slot: dstSlot,
        shape: dst.shape,
        capacityUnits: dst.capacity_units,
        fillUnits: dst.fill_units,
        color: dst.color,
      },
      maxCap,
      pourProgress
    );
  });
}

function computeCupRects(host: GT032LayoutHost, maxCap: number): SceneBox[] {
  const cupRects: SceneBox[] = [];
  for (let i = 0; i < host.displayCups.length; i++) {
    const cup = host.displayCups[i];
    const slot = host.slots[i];
    if (cup && slot) {
      cupRects.push(liquidCupRect(slot, cup.shape, cup.capacity_units, maxCap));
    }
  }
  return cupRects;
}

export function renderGT032Frame(
  host: GT032LayoutHost,
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  timeMs: number
): void {
  const clock = getGT032Clock(host);
  clock.lastRenderMs = timeMs;
  clock.reducedMotionSeen = rs.reducedMotion;

  drawSceneBackground(ctx, rs, host.themeId);
  drawStoryCharacterInStage(
    ctx,
    "pony",
    host.stageRect,
    host.slots,
    ponyDrinkMotion(timeMs - clock.lastPourAtMs, rs.reducedMotion)
  );

  const stageZone: ZoneRect = host.stageRect ?? {
    x: 0,
    y: 0,
    w: rs.LOGIC_WIDTH,
    h: rs.LOGIC_HEIGHT,
  };
  const maxCap = Math.max(1, ...host.displayCups.map((c) => c.capacity_units));
  const cupRects = computeCupRects(host, maxCap);

  drawGT032WaterBench(ctx, rs, {
    stageZone,
    cupRects,
    isWon: host.checkWinCondition(),
    isRoundClosed: host.roundClosedOnWrong,
    softShadowsEnabled: host.degradation?.soft_shadows_enabled !== false,
  });

  const minTopY =
    cupRects.length > 0
      ? Math.min(...cupRects.map((r) => r.y))
      : stageZone.y + 40;
  drawGT032QuestionBadge(ctx, {
    stageZone,
    benchTopY: minTopY - 12,
    questionType: host.content.question_type,
    elapsedMs: timeMs,
    reducedMotion: rs.reducedMotion,
  });

  const detached =
    (clock.hintLevel === 3 || host.roundClosedOnWrong) &&
    host.content.question_type !== "pour_to_mark";
  const pourPair =
    !rs.reducedMotion && clock.pourElapsedMs < GT032_POUR_DEMO_MS
      ? findGT032PourDemoPair(host.content, host.displayCups)
      : null;
  const pourProgress = Math.min(1, clock.pourElapsedMs / GT032_POUR_DEMO_MS);
  const wrongActive = clock.wrongFlash.isActive(clock.logicMs);
  const wrongProgress = wrongActive
    ? clock.wrongFlash.progress(clock.logicMs)
    : null;

  drawCupsPass(
    ctx,
    rs,
    host,
    clock,
    stageZone,
    maxCap,
    timeMs,
    detached,
    pourPair,
    pourProgress,
    wrongActive,
    wrongProgress
  );

  if (detached) {
    drawDetachedColumnsPass(ctx, rs, host, clock, maxCap, timeMs);
  }
  if (pourPair) {
    drawPourDemoPass(ctx, rs, host, stageZone, pourPair, maxCap, pourProgress);
  }
  if (clock.hintLevel === 1 || clock.hintLevel === 2) {
    drawGT032HintRegionOverlay(ctx, {
      stageZone,
      cupRects,
      level: clock.hintLevel,
      elapsedMs: timeMs,
      reducedMotion: rs.reducedMotion,
    });
  }
  if (
    host.degradation?.particles_enabled !== false &&
    clock.particles.length > 0
  ) {
    rs.drawParticles(ctx, clock.particles);
  }
}
