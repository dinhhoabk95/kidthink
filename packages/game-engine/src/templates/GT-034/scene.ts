import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  type BallPoint,
  beatBallPose,
  beatBallRadius,
} from "#src/render/beat-ball";
import {
  drawGT034ConcertStage,
  drawGT034FallbackInstrumentGlyph,
  drawGT034ScaffoldOverlay,
  drawGT034SlotFeedback,
} from "#src/render/gt-034-shapes";
import {
  cricketArm,
  drawBeatBall,
  drawInstrumentGlyph,
  drawSceneBackground,
  drawSlotItem,
  drawStoryCharacterInStage,
  drawSubPromptText,
  instrumentGlyphKind,
} from "#src/render/index.js";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  buildGT034RowRails,
  computeGT034SlotBounds,
  GT034_TAP_RIPPLE_MS,
  GT034_VICTORY_WAVE_MS,
  GT034_WRONG_FLASH_MS,
  type GT034BeatBall,
  type GT034Clock,
  isBrokenGT034Asset,
  REST_GLYPH,
} from "./layout.js";
import type { GT034Content, GT034Instrument } from "./template.js";

type StepVisualState = "idle" | "hovered" | "selected" | "correct" | "wrong";

export interface GT034SceneParams {
  readonly ball: GT034BeatBall | null;
  readonly clock: GT034Clock;
  readonly content: GT034Content;
  readonly hintTargetIndex: number | null;
  readonly isWon: boolean;
  readonly litStepIndex: number | null;
  readonly logicSpace: { readonly w: number; readonly h: number };
  readonly particles: readonly Particle[];
  readonly particlesEnabled: boolean;
  readonly replayLimit: number;
  readonly replaysUsed: number;
  readonly restPadSlot: Slot | undefined;
  readonly showVisualPattern: boolean;
  readonly slots: readonly Slot[];
  readonly stageRect: ZoneRect | undefined;
  readonly tempoBpm: number;
  readonly themeId: string | undefined;
  readonly userSteps: readonly (string | null)[];
}

function resolveStepVisualState(
  idx: number,
  isWon: boolean,
  litStepIndex: number | null,
  wrongProgress: number | null,
  hoveredIdx: number | null
): StepVisualState {
  if (isWon) {
    return "correct";
  }
  if (litStepIndex === idx) {
    return "selected";
  }
  if (wrongProgress !== null) {
    return "wrong";
  }
  return hoveredIdx === idx ? "hovered" : "idle";
}

function drawInstrumentFace(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  slot: Slot,
  inst: GT034Instrument | undefined,
  instrumentId: string,
  stageBounds: ZoneRect,
  face: { readonly label?: string; readonly state: "idle" | "selected" }
): void {
  const glyph = instrumentGlyphKind(instrumentId);
  if (glyph) {
    drawSlotItem(ctx, rs, slot, { id: instrumentId, text: "", ...face });
    drawInstrumentGlyph(
      ctx,
      glyph,
      slot.x,
      slot.y,
      Math.min(slot.w, slot.h) * 0.5
    );
    return;
  }
  if (inst && isBrokenGT034Asset(inst.asset)) {
    drawSlotItem(ctx, rs, slot, { id: instrumentId, text: "", ...face });
    drawGT034FallbackInstrumentGlyph(ctx, { instrumentId, slot, stageBounds });
    return;
  }
  drawSlotItem(ctx, rs, slot, {
    id: instrumentId,
    asset: inst?.asset,
    ...face,
  });
}

function renderSingleStep(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  p: GT034SceneParams,
  slot: Slot,
  index: number,
  stageBounds: ZoneRect
): void {
  const isActive = p.litStepIndex === index;
  const slotState: "idle" | "selected" = isActive ? "selected" : "idle";
  const userStep = p.userSteps[index];

  if (typeof userStep === "string") {
    const inst = p.content.instruments.find(
      (i) => i.instrument_id === userStep
    );
    drawInstrumentFace(ctx, rs, slot, inst, userStep, stageBounds, {
      label: inst?.name_vi ?? userStep,
      state: slotState,
    });
    return;
  }
  if (userStep === null) {
    drawSlotItem(ctx, rs, slot, {
      id: `step-rest-${index}`,
      label: "Nghỉ",
      state: slotState,
    });
    return;
  }
  if (p.showVisualPattern || isActive) {
    const targetId = p.content.target_pattern[index];
    const inst = p.content.instruments.find(
      (i) => i.instrument_id === targetId
    );
    drawInstrumentFace(
      ctx,
      rs,
      slot,
      inst,
      targetId ?? `step-target-${index}`,
      stageBounds,
      {
        label: inst?.name_vi ?? targetId ?? undefined,
        state: slotState,
      }
    );
    return;
  }
  drawSlotItem(ctx, rs, slot, {
    id: `step-empty-${index}`,
    text: `${index + 1}`,
    state: slotState,
  });
}

function renderStepFeedbacks(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  p: GT034SceneParams,
  stepSlots: readonly Slot[],
  stageBounds: ZoneRect,
  wrongProgress: number | null,
  victoryProgress: number | null
): void {
  const { clock } = p;
  for (let i = 0; i < stepSlots.length; i++) {
    const slot = stepSlots[i];
    if (!slot) {
      continue;
    }
    const tapProgress =
      clock.lastTapMs !== null &&
      clock.lastTappedSlotIdx === i &&
      clock.elapsedMs - clock.lastTapMs < GT034_TAP_RIPPLE_MS
        ? (clock.elapsedMs - clock.lastTapMs) / GT034_TAP_RIPPLE_MS
        : null;
    drawGT034SlotFeedback(ctx, rs, {
      isLastFilled:
        p.userSteps[i] !== undefined && i === p.userSteps.length - 1,
      isStep: true,
      particlesEnabled: p.particlesEnabled,
      slot,
      stageBounds,
      state: resolveStepVisualState(
        i,
        p.isWon,
        p.litStepIndex,
        wrongProgress,
        clock.hoveredSlotIdx
      ),
      stepIndex: i,
      tapProgress,
      timeMs: clock.elapsedMs,
      victoryProgress,
    });
    renderSingleStep(ctx, rs, p, slot, i, stageBounds);
  }
}

function dockTapProgress(clock: GT034Clock, slotIdx: number): number | null {
  if (clock.lastTapMs === null || clock.lastTappedSourceIdx !== slotIdx) {
    return null;
  }
  const progress = (clock.elapsedMs - clock.lastTapMs) / GT034_TAP_RIPPLE_MS;
  return progress < 1 ? Math.max(0, progress) : null;
}

function renderDockSlots(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  p: GT034SceneParams,
  dockSlots: readonly Slot[],
  stageBounds: ZoneRect
): void {
  const { clock } = p;
  const patternLen = p.content.target_pattern.length;
  if (p.restPadSlot) {
    const restSlotIdx = patternLen + p.content.instruments.length;
    const hovered = clock.hoveredSlotIdx === restSlotIdx;
    drawSlotItem(ctx, rs, p.restPadSlot, {
      id: "pad_rest",
      text: REST_GLYPH,
      label: "Nghỉ",
      state: hovered ? "selected" : "idle",
    });
    drawGT034SlotFeedback(ctx, rs, {
      isLastFilled: false,
      isStep: false,
      particlesEnabled: p.particlesEnabled,
      slot: p.restPadSlot,
      stageBounds,
      state: hovered ? "hovered" : "idle",
      stepIndex: restSlotIdx,
      tapProgress: dockTapProgress(clock, restSlotIdx),
      timeMs: clock.elapsedMs,
      victoryProgress: null,
    });
  }
  for (let i = 0; i < dockSlots.length; i++) {
    const [slot, inst] = [dockSlots[i], p.content.instruments[i]];
    if (!(slot && inst)) {
      continue;
    }
    const slotIdx = patternLen + i;
    const hovered = clock.hoveredSlotIdx === slotIdx;
    drawInstrumentFace(ctx, rs, slot, inst, inst.instrument_id, stageBounds, {
      label: inst.name_vi ?? inst.instrument_id,
      state: hovered ? "selected" : "idle",
    });
    drawGT034SlotFeedback(ctx, rs, {
      isLastFilled: false,
      isStep: false,
      particlesEnabled: p.particlesEnabled,
      slot,
      stageBounds,
      state: hovered ? "hovered" : "idle",
      stepIndex: slotIdx,
      tapProgress: dockTapProgress(clock, slotIdx),
      timeMs: clock.elapsedMs,
      victoryProgress: null,
    });
  }
}

function renderBeatBallOnly(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  p: GT034SceneParams,
  stepSlots: readonly Slot[],
  stageBounds: ZoneRect
): void {
  const { ball } = p;
  if (!ball || (ball.kind === "tap" && rs.reducedMotion)) {
    return;
  }
  const slot = stepSlots[ball.step];
  if (!slot) {
    return;
  }
  const nextSlot =
    ball.kind === "beat" && ball.step + 1 < p.content.target_pattern.length
      ? stepSlots[ball.step + 1]
      : undefined;
  const next = nextSlot && nextSlot.y === slot.y ? nextSlot : undefined;
  const radius = beatBallRadius(slot.w, slot.h);
  const floorY = slot.y - slot.h / 2 - radius - 2;
  const hopPx = Math.max(
    0,
    Math.min(slot.h * 0.9, floorY - radius - stageBounds.y)
  );
  const to: BallPoint | null = next ? { x: next.x, y: next.y } : null;
  const pose = beatBallPose({
    phase: ball.phase,
    from: { x: slot.x, y: slot.y },
    to,
    floorY,
    hopPx,
    reducedMotion: rs.reducedMotion,
  });
  drawBeatBall(ctx, pose, radius);
}

function renderScaffoldLayer(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  p: GT034SceneParams,
  stepSlots: readonly Slot[],
  stageBounds: ZoneRect
): void {
  const { clock } = p;
  if (clock.activeHintLevel === 0 || p.isWon) {
    return;
  }
  const patternLen = p.content.target_pattern.length;
  const targetSlot =
    p.hintTargetIndex === null ? null : (p.slots[p.hintTargetIndex] ?? null);
  let stepIdx: number | null = null;
  if (p.hintTargetIndex !== null && p.hintTargetIndex < patternLen) {
    stepIdx = p.hintTargetIndex;
  } else if (p.userSteps.length < patternLen) {
    stepIdx = p.userSteps.length;
  }
  const targetStepSlot = stepIdx === null ? null : (stepSlots[stepIdx] ?? null);
  const litSlot =
    p.litStepIndex === null ? null : (stepSlots[p.litStepIndex] ?? null);
  drawGT034ScaffoldOverlay(ctx, rs, {
    elapsedMs: clock.elapsedMs,
    level: clock.activeHintLevel,
    litStepSlot: litSlot,
    stageBounds,
    targetSlot,
    targetStepSlot,
  });
}

export function renderGT034Scene(
  ctx: CanvasRenderingContext2D,
  rs: RenderSystem,
  p: GT034SceneParams
): void {
  drawSceneBackground(ctx, rs, p.themeId);
  if (!p.stageRect) {
    drawSubPromptText(
      ctx,
      rs,
      `Đã nghe: ${p.replaysUsed}/${p.replayLimit} | Nhịp: ${p.tempoBpm} BPM`
    );
  }
  const stageBounds: ZoneRect = p.stageRect ?? {
    x: 0,
    y: 0,
    w: p.logicSpace.w,
    h: p.logicSpace.h,
  };
  const patternLen = p.content.target_pattern.length;
  const stepSlots = p.slots.slice(0, patternLen);
  const dockSlots = p.slots.slice(
    patternLen,
    patternLen + p.content.instruments.length
  );
  const sourceSlots = p.restPadSlot ? [...dockSlots, p.restPadSlot] : dockSlots;
  const { clock } = p;

  const wrongProgress =
    clock.wrongFlashStartMs === null
      ? null
      : Math.min(
          1,
          (clock.elapsedMs - clock.wrongFlashStartMs) / GT034_WRONG_FLASH_MS
        );
  const victoryProgress =
    clock.victoryStartMs === null
      ? null
      : Math.min(
          1,
          (clock.elapsedMs - clock.victoryStartMs) / GT034_VICTORY_WAVE_MS
        );

  drawGT034ConcertStage(ctx, rs, {
    allStepsBounds:
      stepSlots.length > 0
        ? computeGT034SlotBounds(stepSlots, 8, 6)
        : stageBounds,
    dockBounds:
      sourceSlots.length > 0
        ? computeGT034SlotBounds(sourceSlots, 12, 8)
        : null,
    elapsedMs: clock.elapsedMs,
    replayLimit: p.replayLimit,
    replaysUsed: p.replaysUsed,
    rowRails: buildGT034RowRails(stepSlots, patternLen),
    stageBounds,
    wrongKind: clock.wrongFlashKind,
    wrongProgress,
  });
  const arm =
    !rs.reducedMotion &&
    p.ball &&
    p.ball.kind === "beat" &&
    p.content.target_pattern[p.ball.step] !== null
      ? cricketArm(p.ball.phase)
      : 0;
  drawStoryCharacterInStage(ctx, "cricket", p.stageRect, p.slots, { arm });

  renderStepFeedbacks(
    ctx,
    rs,
    p,
    stepSlots,
    stageBounds,
    wrongProgress,
    victoryProgress
  );
  renderDockSlots(ctx, rs, p, dockSlots, stageBounds);
  renderBeatBallOnly(ctx, rs, p, stepSlots, stageBounds);
  renderScaffoldLayer(ctx, rs, p, stepSlots, stageBounds);

  if (p.particles.length > 0 && p.particlesEnabled) {
    rs.drawParticles(ctx, [...p.particles]);
  }
}
