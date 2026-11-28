import type { AgeBand } from "#src/contracts/types";
import type { HintDemoStep, HintLevel, HintTarget } from "#src/game-session";
import type { EngineView, ViewEntity } from "#src/interaction";
import {
  resolveAssetLabels,
  spokenKeywordForAsset,
} from "#src/labels/spoken-keyword";
import { resolveTouchFloor, SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  trafficLampGlow,
  trafficStimulusSlot,
} from "#src/render/container-shapes";
import {
  drawGT026OutcomeFeedback,
  drawGT026StageHeader,
  drawGT026StimulusPod,
  drawGT026StopPad,
  drawGT026WindowFrame,
} from "#src/render/gt-026-shapes";
import { drawSceneBackground } from "#src/render/shared-render";
import type { GT026DotStatus, RenderAsset, SceneBox } from "#src/render/types";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import type {
  TrialItem,
  TrialOutcome,
  TrialResult,
} from "#src/systems/inhibition-system";
import type { RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import type { GT026Content } from "./template.js";

export const STOP_PAD_ID = "stop-pad";
export const START_BTN_ID = "start-btn";
export const STOP_PAD_ASSET: RenderAsset = { kind: "emoji", ref: "✋" };
const STOP_PAD_MIN_PX = 68;
const OUTCOME_FX_DURATION_MS = 420;

export interface GT026OutcomeFx {
  readonly kind: "hit" | "correct_rejection" | "retry";
  readonly slotIndex: number;
  readonly triggeredAtMs: number;
}

export interface GT026ClockState {
  activeHintLevel: HintLevel | 0;
  hoveredSlot: number | null;
  lastFrameMs: number;
  litSinceMs: number;
  litTrialId: string | null;
  outcomeFx: GT026OutcomeFx | null;
  winAtMs: number | null;
  wrongFlash: WrongFlash;
}

const CLOCK_MAP = new WeakMap<object, GT026ClockState>();

function createClockState(): GT026ClockState {
  return {
    activeHintLevel: 0,
    hoveredSlot: null,
    lastFrameMs: 0,
    litSinceMs: 0,
    litTrialId: null,
    outcomeFx: null,
    winAtMs: null,
    wrongFlash: new WrongFlash(),
  };
}

export function getGT026Clock(host: object): GT026ClockState {
  let state = CLOCK_MAP.get(host);
  if (!state) {
    state = createClockState();
    CLOCK_MAP.set(host, state);
  }
  return state;
}

export function resetGT026Clock(host: object): void {
  CLOCK_MAP.set(host, createClockState());
}

export function syncGT026Clock(host: object, timeMs: number): GT026ClockState {
  const clock = getGT026Clock(host);
  if (Number.isFinite(timeMs) && timeMs >= 0) {
    clock.lastFrameMs = timeMs;
  }
  return clock;
}

export interface GT026Geometry {
  readonly headerRect: ZoneRect;
  readonly startSlot: Slot;
  readonly stimulusSlot: Slot;
  readonly stopPadSlot: Slot;
  readonly windowRect: ZoneRect;
}

/** Pha thoát sau lượt vừa xong (N4): pod còn vẽ nhưng không nhận chạm, không đèn. */
export interface GT026ExitPhase {
  readonly outcome: TrialOutcome;
  readonly progress: number;
  readonly trial: TrialItem;
}

export interface GT026LayoutHost {
  readonly content: GT026Content;
  readonly cssPerLogic?: number;
  readonly degradation: DegradationState | null;
  readonly slots: readonly Slot[];
  readonly themeId?: string;
  checkWinCondition(): boolean;
  getAgeBand(): AgeBand;
  getCurrentTrial(): TrialItem | null;
  getCurrentTrialIndex(): number;
  getExitPhase(): GT026ExitPhase | null;
  getResults(): readonly TrialResult[];
  getStageRect(): ZoneRect;
  getTotalTrials(): number;
  getTrialElapsedRatio(): number;
  isFinished(): boolean;
  isInputOpenState(): boolean;
  isStimulusVisible(): boolean;
  isUntimed(): boolean;
  isWaitingForStart(): boolean;
}

const cl = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

function swapAt<T>(arr: T[], i: number, j: number): void {
  const a = arr[i];
  const b = arr[j];
  if (a !== undefined && b !== undefined) {
    arr[i] = b;
    arr[j] = a;
  }
}

function ensureDistinctRoundOrder<
  T extends { readonly id: string; readonly kind: "go" | "nogo" },
>(out: T[], baseTrials: readonly T[]): void {
  const sameKinds = out.every(
    (item, idx) => item.kind === baseTrials[idx]?.kind
  );
  if (sameKinds) {
    const goIdx = out.findIndex((t, i) => i >= 1 && t.kind === "go");
    const nogoIdx = out.findIndex((t, i) => i >= 1 && t.kind === "nogo");
    if (goIdx > 0 && nogoIdx > 0) {
      swapAt(out, goIdx, nogoIdx);
      return;
    }
  }
  if (out.every((item, idx) => item.id === baseTrials[idx]?.id)) {
    swapAt(out, out.length >= 3 ? 1 : 0, out.length >= 3 ? 2 : 1);
  }
}

export function resolveRoundTrials<
  T extends { readonly id: string; readonly kind: "go" | "nogo" },
>(baseTrials: readonly T[], layoutSeed: number, roundGeneration: number): T[] {
  const copy = [...baseTrials];
  if (roundGeneration <= 0 || layoutSeed <= 0 || copy.length <= 1) {
    return copy;
  }
  const rng = deriveStream(layoutSeed + roundGeneration * 7919, "items");
  const out = shuffle(copy, rng);
  if (out[0]?.kind !== "go") {
    const goIdx = out.findIndex((t) => t.kind === "go");
    if (goIdx > 0) {
      swapAt(out, 0, goIdx);
    }
  }
  ensureDistinctRoundOrder(out, baseTrials);
  return out;
}

function mkSlot(
  index: number,
  x: number,
  y: number,
  w: number,
  h: number
): Slot {
  return { index, page: 0, role: "source", x, y, w, h, hitW: w, hitH: h };
}

export function computeGT026Geometry(params: {
  readonly ageBand: AgeBand;
  readonly cssPerLogic?: number;
  readonly stage: ZoneRect;
}): GT026Geometry {
  const { stage, ageBand, cssPerLogic } = params;
  const floorPx = Math.max(
    resolveTouchFloor(ageBand, cssPerLogic),
    STOP_PAD_MIN_PX
  );
  const headerH = cl(Math.round(stage.h * 0.16), 32, 50);
  const headerRect: ZoneRect = {
    x: stage.x + 6,
    y: stage.y + 4,
    w: Math.max(120, stage.w - 12),
    h: headerH,
  };
  const [workX, workY] = [stage.x + 8, headerRect.y + headerRect.h + 6];
  const workW = Math.max(120, stage.w - 16);
  const workH = Math.max(84, stage.y + stage.h - workY - 6);
  const gap = Math.max(SLOT_GAP_PX + 10, 22);

  if (workW >= workH * 1.15) {
    const maxPad = Math.max(48, Math.min(workH - 8, Math.round(workW * 0.26)));
    const padTarget = Math.round(Math.min(workH * 0.58, workW * 0.22));
    const padSize = cl(
      padTarget,
      Math.min(floorPx, maxPad),
      Math.min(104, maxPad)
    );
    const availW = Math.max(96, workW - padSize - gap - 8);
    const winW = cl(Math.round(workW * 0.62), Math.min(140, availW), availW);
    const winH = cl(
      Math.round(workH * 0.92),
      Math.min(80, workH - 4),
      workH - 4
    );
    const startX = Math.round(workX + (workW - (winW + gap + padSize)) / 2);
    const windowRect: ZoneRect = {
      x: startX,
      y: Math.round(workY + (workH - winH) / 2),
      w: winW,
      h: winH,
    };
    const stimH = cl(winH - 16, Math.min(floorPx, winH - 8), winH - 8);
    const stimW = cl(
      Math.round(stimH * 1.42),
      Math.min(floorPx, winW - 12),
      winW - 12
    );
    const [cx, cy] = [
      Math.round(windowRect.x + winW / 2),
      Math.round(windowRect.y + winH / 2),
    ];
    const stimulusSlot = mkSlot(0, cx, cy, stimW, stimH);
    const stopX = Math.round(windowRect.x + winW + gap + padSize / 2);
    const stopPadSlot = mkSlot(
      1,
      stopX,
      Math.round(workY + workH / 2),
      padSize,
      padSize
    );
    const sSz = cl(Math.min(stimW, stimH), Math.min(floorPx, stimH), 108);
    return {
      headerRect,
      windowRect,
      stimulusSlot,
      stopPadSlot,
      startSlot: mkSlot(0, cx, cy, sSz, sSz),
    };
  }

  const maxPad = Math.max(48, Math.min(workW - 12, Math.round(workH * 0.28)));
  const padTarget = Math.round(Math.min(workW * 0.34, workH * 0.22));
  const padSize = cl(
    padTarget,
    Math.min(floorPx, maxPad),
    Math.min(104, maxPad)
  );
  const availH = Math.max(80, workH - padSize - gap - 8);
  const winH = cl(Math.round(workH * 0.6), Math.min(96, availH), availH);
  const winW = cl(Math.round(workW * 0.9), Math.min(140, workW - 8), workW - 8);
  const startY = Math.round(workY + (workH - (winH + gap + padSize)) / 2);
  const windowRect: ZoneRect = {
    x: Math.round(workX + (workW - winW) / 2),
    y: startY,
    w: winW,
    h: winH,
  };
  const stimH = cl(winH - 18, Math.min(floorPx, winH - 8), winH - 8);
  const stimW = cl(
    Math.round(stimH * 1.38),
    Math.min(floorPx, winW - 12),
    winW - 12
  );
  const [cx, cy] = [
    Math.round(windowRect.x + winW / 2),
    Math.round(windowRect.y + winH / 2),
  ];
  const stimulusSlot = mkSlot(0, cx, cy, stimW, stimH);
  const stopY = Math.round(windowRect.y + winH + gap + padSize / 2);
  const stopPadSlot = mkSlot(
    1,
    Math.round(workX + workW / 2),
    stopY,
    padSize,
    padSize
  );
  const sSz = cl(Math.min(stimW, stimH), Math.min(floorPx, stimH), 108);
  return {
    headerRect,
    windowRect,
    stimulusSlot,
    stopPadSlot,
    startSlot: mkSlot(0, cx, cy, sSz, sSz),
  };
}

export function computeGT026Slots(
  host: GT026LayoutHost,
  ageBand: AgeBand
): readonly Slot[] {
  const geo = computeGT026Geometry({
    stage: host.getStageRect(),
    ageBand,
    cssPerLogic: host.cssPerLogic,
  });
  return [geo.stimulusSlot, geo.stopPadSlot];
}

export function computeGT026StartSlot(host: GT026LayoutHost): Slot {
  return computeGT026Geometry({
    stage: host.getStageRect(),
    ageBand: host.getAgeBand(),
    cssPerLogic: host.cssPerLogic,
  }).startSlot;
}

export function buildGT026View(host: GT026LayoutHost): EngineView {
  const clock = getGT026Clock(host);
  const slot = host.slots[0];
  const trial = host.getCurrentTrial();
  const visible = host.isStimulusVisible();
  const isWrong = clock.wrongFlash.isActive(clock.lastFrameMs);
  const entities: ViewEntity[] = [];

  if (host.isWaitingForStart() && host.isInputOpenState()) {
    const startSlot = computeGT026StartSlot(host);
    entities.push({
      id: START_BTN_ID,
      slotIndex: 0,
      role: "source",
      state: "idle",
      x: startSlot.x,
      y: startSlot.y,
      w: startSlot.w,
      h: startSlot.h,
      hitW: startSlot.hitW,
      hitH: startSlot.hitH,
      hitShape: "circle",
      label: "Bắt đầu",
      spokenLabel: "Bắt đầu",
    });
  } else if (slot && trial && visible) {
    const stim =
      trial.kind === "go"
        ? host.content.go_stimulus
        : host.content.nogo_stimulus;
    const labels = resolveAssetLabels(stim.asset);
    const spokenLabel =
      labels.spokenLabel ??
      spokenKeywordForAsset({ kind: "text", text: stim.label });
    entities.push({
      id: trial.id,
      slotIndex: 0,
      role: "source",
      state: isWrong ? "incorrect" : "idle",
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      hitW: slot.hitW,
      hitH: slot.hitH,
      hitShape: "square",
      ...labels,
      label: stim.label,
      ...(spokenLabel ? { spokenLabel } : {}),
    });

    const pad = host.slots[1];
    if (pad && host.isUntimed()) {
      entities.push({
        id: STOP_PAD_ID,
        slotIndex: 1,
        role: "source",
        state: "idle",
        x: pad.x,
        y: pad.y,
        w: pad.w,
        h: pad.h,
        hitW: pad.hitW,
        hitH: pad.hitH,
        hitShape: "circle",
        ...resolveAssetLabels(STOP_PAD_ASSET),
        spokenLabel: "Dừng lại",
      });
    }
  }

  return { activePrompt: host.content.prompt, entities };
}

export function resolveGT026HintTargetIndex(
  host: GT026LayoutHost
): number | null {
  if (host.checkWinCondition() || !host.isInputOpenState()) {
    return null;
  }
  if (host.isWaitingForStart()) {
    return 0;
  }
  if (!host.isStimulusVisible()) {
    return null;
  }
  const trial = host.getCurrentTrial();
  if (!trial) {
    return null;
  }
  if (trial.kind === "go") {
    return 0;
  }
  return host.isUntimed() && host.slots[1] ? 1 : null;
}

export function resolveGT026HintTarget(
  host: GT026LayoutHost,
  level: HintLevel
): HintTarget | null {
  if (level < 1) {
    return null;
  }
  const index = resolveGT026HintTargetIndex(host);
  return index === null ? null : { kind: "slot", index };
}

export function resolveGT026HintDemo(
  host: GT026LayoutHost,
  level: HintLevel
): readonly HintDemoStep[] | null {
  if (level < 3) {
    return null;
  }
  const index = resolveGT026HintTargetIndex(host);
  return index === null ? null : [{ from: index }];
}

function buildDotStatuses(host: GT026LayoutHost): GT026DotStatus[] {
  const total = host.getTotalTrials();
  const results = host.getResults();
  const currentIdx = host.getCurrentTrialIndex();
  const active = !(host.isFinished() || host.isWaitingForStart());
  const dots: GT026DotStatus[] = [];
  for (let i = 0; i < total; i++) {
    const res = results[i];
    if (res) {
      dots.push(res.isCorrect ? "correct" : "passed");
    } else {
      dots.push(active && i === currentIdx ? "current" : "upcoming");
    }
  }
  return dots;
}

function renderExitPod(
  host: GT026LayoutHost,
  clock: GT026ClockState,
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  s0: Slot,
  stageBounds: SceneBox,
  phase: GT026ExitPhase
): void {
  const { trial, outcome, progress } = phase;
  const stim =
    trial.kind === "go" ? host.content.go_stimulus : host.content.nogo_stimulus;
  let kind: "pop" | "fade" | "shake" = "fade";
  if (outcome === "hit") {
    kind = "pop";
  } else if (outcome === "false_alarm") {
    kind = "shake";
  }
  const shaking = kind === "shake";
  const wrongActive = shaking && clock.wrongFlash.isActive(clock.lastFrameMs);
  drawGT026StimulusPod(ctx, rs, {
    slot: s0,
    stageBounds,
    kind: trial.kind,
    asset: stim.asset,
    glow: 0,
    shakeX:
      wrongActive && !rs.reducedMotion
        ? Math.sin(clock.wrongFlash.elapsedMs(clock.lastFrameMs) / 30) * 4
        : 0,
    wrongProgress: wrongActive
      ? clock.wrongFlash.progress(clock.lastFrameMs)
      : null,
    isHovered: false,
    isHinted: false,
    timeMs: clock.lastFrameMs,
    disableShadows: host.degradation
      ? !host.degradation.soft_shadows_enabled
      : false,
    exit: { kind, progress: cl(progress, 0, 1) },
  });
}

function renderActiveStimulus(
  host: GT026LayoutHost,
  clock: GT026ClockState,
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  s0: Slot,
  s1: Slot,
  stageBounds: SceneBox
): void {
  const trial = host.getCurrentTrial();
  const exitPhase = host.getExitPhase();
  if (exitPhase) {
    clock.litTrialId = null;
    renderExitPod(host, clock, ctx, rs, s0, stageBounds, exitPhase);
    return;
  }
  if (!(host.isStimulusVisible() && trial)) {
    clock.litTrialId = null;
    return;
  }
  if (clock.litTrialId !== trial.id) {
    clock.litTrialId = trial.id;
    clock.litSinceMs = clock.lastFrameMs;
  }
  const glow = trafficLampGlow(
    clock.lastFrameMs - clock.litSinceMs,
    rs.reducedMotion
  );
  const wrongActive = clock.wrongFlash.isActive(clock.lastFrameMs);
  const wrongProgress = wrongActive
    ? clock.wrongFlash.progress(clock.lastFrameMs)
    : null;
  const shakeX =
    wrongActive && !rs.reducedMotion
      ? Math.sin(clock.wrongFlash.elapsedMs(clock.lastFrameMs) / 30) * 4
      : 0;
  const disableShadows = host.degradation
    ? !host.degradation.soft_shadows_enabled
    : false;
  const stim =
    trial.kind === "go" ? host.content.go_stimulus : host.content.nogo_stimulus;

  drawGT026StimulusPod(ctx, rs, {
    slot: s0,
    stageBounds,
    kind: trial.kind,
    asset: stim.asset,
    glow,
    shakeX,
    wrongProgress,
    isHovered: clock.hoveredSlot === 0,
    isHinted: clock.activeHintLevel >= 2 && trial.kind === "go",
    timeMs: clock.lastFrameMs,
    disableShadows,
  });

  if (host.isUntimed()) {
    drawGT026StopPad(ctx, rs, {
      slot: s1,
      stageBounds,
      asset: STOP_PAD_ASSET,
      isHovered: clock.hoveredSlot === 1,
      isHinted: clock.activeHintLevel >= 2 && trial.kind === "nogo",
      timeMs: clock.lastFrameMs,
      disableShadows,
    });
  }
}

export function renderGT026Frame(
  host: GT026LayoutHost,
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  timeMs: number
): void {
  const clock = syncGT026Clock(host, timeMs);
  drawSceneBackground(ctx, rs, host.themeId);

  const stage = host.getStageRect();
  const stageBounds: SceneBox = {
    x: stage.x,
    y: stage.y,
    w: stage.w,
    h: stage.h,
  };
  const geo = computeGT026Geometry({
    stage,
    ageBand: host.getAgeBand(),
    cssPerLogic: host.cssPerLogic,
  });
  const s0 = host.slots[0] ?? geo.stimulusSlot;
  const s1 = host.slots[1] ?? geo.stopPadSlot;
  const disableShadows = host.degradation
    ? !host.degradation.soft_shadows_enabled
    : false;
  const disableParticles = host.degradation
    ? !host.degradation.particles_enabled
    : false;
  const visible = host.isStimulusVisible();
  const trial = host.getCurrentTrial();
  const isWon = host.checkWinCondition();

  drawGT026StageHeader(ctx, rs, {
    rect: geo.headerRect,
    stageBounds,
    goAsset: host.content.go_stimulus.asset,
    nogoAsset: host.content.nogo_stimulus.asset,
    highlightedRule:
      visible && trial && clock.activeHintLevel >= 1 ? trial.kind : null,
    dots: buildDotStatuses(host),
    isWon,
    timeMs: clock.lastFrameMs,
    disableShadows,
  });

  drawGT026WindowFrame(ctx, rs, {
    rect: geo.windowRect,
    stageBounds,
    remainingRatio: cl(1 - host.getTrialElapsedRatio(), 0, 1),
    showTimerBar: !host.isUntimed() && visible && Boolean(trial),
    isWaitingForStart: host.isWaitingForStart() && host.isInputOpenState(),
    startSlot: geo.startSlot,
    isStartHovered: clock.hoveredSlot === 0,
    isWon,
    timeMs: clock.lastFrameMs,
    disableShadows,
  });

  renderActiveStimulus(host, clock, ctx, rs, s0, s1, stageBounds);

  const fx = clock.outcomeFx;
  if (fx) {
    const fxElapsed = Math.max(0, clock.lastFrameMs - fx.triggeredAtMs);
    if (fxElapsed <= OUTCOME_FX_DURATION_MS) {
      const centerSlot = fx.slotIndex === 1 ? s1 : trafficStimulusSlot(s0);
      drawGT026OutcomeFeedback(ctx, rs, {
        center: { x: centerSlot.x, y: centerSlot.y },
        stageBounds,
        kind: fx.kind,
        progress: cl(fxElapsed / OUTCOME_FX_DURATION_MS, 0, 1),
        disableParticles,
      });
    }
  }
}
