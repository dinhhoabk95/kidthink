import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import {
  drawGT006DirectionBanner,
  drawGT006SolutionStrip,
  drawGT006StepCard,
  drawGT006SwapPreviewArc,
  drawGT006TrackCouplers,
} from "#src/render/gt-006-shapes";
import {
  drawFilmFrameGlow,
  drawGrowingTree,
  drawLocomotive,
  drawMontessoriControlOfErrorPill,
  drawNumberLine,
  drawSceneBackground,
  drawTrackNumberLine,
  drawTrainRailway,
  filmPlayback,
  placeStoryCharacter,
  sceneBox,
  treeGrowth,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import { deriveStream } from "#src/rng/mulberry32";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import {
  areStepsVisuallyEquivalent,
  computeGT006HintDemoSteps,
  findFirstSequenceMismatch,
  findNearestSlotHitIndex,
  findNextSequenceMove,
  isSequenceEquivalentMatch,
  resolveGT006DropAction,
  shuffleSequenceWithDerangement,
} from "./layout.js";
import {
  buildGT006StepCardOptions,
  buildGT006ViewEntity,
  computeGT006LocomotiveSpot,
  createGT006StepParticles,
  extractReorderPayload,
  type GT006CardVisualState,
  type GT006StepItem,
  resolveGT006CardVisualState,
  slotsFitStage,
  splitStageForTrack,
  stepGT006Particles,
} from "./stage-strip.js";
import type { GT006Content, GT006Difficulty } from "./template.js";

export const GT006_STORY_LINE =
  "Rùa Con kể chuyện theo từng thẻ. Bé xếp các thẻ đúng thứ tự rồi bấm xong cho cuộn phim chạy nhé!";
export const GT006_HAPPY_MS = 700;
export const GT006_WONDER_MS = 1500;
const FILM_TREE_SIZE_PX = 64;
type C2D = CanvasRenderingContext2D;

interface GT006ClockState {
  frameMs: number;
  logicMs: number;
  winMs: number | null;
  stagedAtMs: number | null;
  readonly settledAtByStepId: Map<string, number>;
}

const SESSION_CLOCK = new WeakMap<GT006Session, GT006ClockState>();

export class GT006Session extends TemplateGameSession<
  GT006Content,
  GT006Difficulty
> {
  override readonly usesPromptZone = true;
  override readonly needsCommit = true;
  degradation: DegradationState | null = null;
  private stagedIndex: number | null = null;
  private touchingIndex: number | null = null;
  private pointerPoint: { readonly x: number; readonly y: number } | null =
    null;
  private hoveredTargetIndex: number | null = null;
  private isRoundClosed = false;
  private particles: Particle[] = [];
  private readonly wrongSubmitFlash = new WrongFlash();
  private readonly mood = new MoodPulse();
  private readonly mechanic = new OrderingMechanic();
  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });
  private stepById = new Map<string, GT006StepItem>();
  private targetSequence: readonly string[] = [];

  private clock(): GT006ClockState {
    let state = SESSION_CLOCK.get(this);
    if (!state) {
      state = {
        frameMs: 0,
        logicMs: 0,
        winMs: null,
        stagedAtMs: null,
        settledAtByStepId: new Map<string, number>(),
      };
      SESSION_CLOCK.set(this, state);
    }
    return state;
  }

  override takePillNarration(): string | null {
    return this.exploreTracker.takePillNarration();
  }

  setupEntities(): void {
    this.exploreTracker.reset(false);
    this.stepById = new Map(this.content.sequence.map((s) => [s.step_id, s]));
    this.targetSequence = this.content.sequence
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => s.step_id);
    const steps = this.content.sequence.map((s) => s.step_id);
    const seq =
      this.difficulty.shuffle_initial === false
        ? steps
        : shuffleSequenceWithDerangement(
            this.content.sequence,
            this.targetSequence,
            deriveStream(this.layoutSeed, "initial")
          );
    this.mechanic.setInitialSequence(seq);
    this.isWon = false;
    this.isRoundClosed = false;
    this.stagedIndex = null;
    this.touchingIndex = null;
    this.pointerPoint = null;
    this.hoveredTargetIndex = null;
    this.particles = [];
    this.wrongSubmitFlash.clear();
    this.mood.clear();
    const clk = this.clock();
    clk.frameMs = 0;
    clk.logicMs = 0;
    clk.winMs = null;
    clk.stagedAtMs = null;
    clk.settledAtByStepId.clear();
  }

  override isAcceptingInput(): boolean {
    return !(this.isWon || this.isRoundClosed);
  }
  override canCommit(): boolean {
    return this.isAcceptingInput();
  }
  isRoundLocked(): boolean {
    return this.isRoundClosed;
  }
  startExplorePhase(): void {
    this.exploreTracker.reset(true);
  }
  getExploreTracker(): MontessoriExploreTracker {
    return this.exploreTracker;
  }
  getControlOfError(): ControlOfErrorDiagnostics | null {
    return this.exploreTracker.getControlOfErrorDiagnostics();
  }
  isMicroSandboxActive(): boolean {
    return this.exploreTracker.isMicroSandboxActive();
  }
  getStepPitchIndex(stepId: string): number {
    const step = this.resolveStepById().get(stepId);
    if (step) {
      return ((step.order_index % 5) + 5) % 5;
    }
    const targetIdx = this.resolveTargetSequence().indexOf(stepId);
    return targetIdx >= 0 ? targetIdx % 5 : 0;
  }
  findFirstMismatchIndex(): number {
    return findFirstSequenceMismatch(
      this.getCurrentSequence(),
      this.resolveTargetSequence(),
      this.resolveStepById()
    );
  }
  private resolveTargetSequence(): readonly string[] {
    return this.targetSequence.length === this.content.sequence.length
      ? this.targetSequence
      : this.content.sequence
          .slice()
          .sort((a, b) => a.order_index - b.order_index)
          .map((s) => s.step_id);
  }
  private resolveTargetSteps(): readonly GT006StepItem[] {
    const byId = this.resolveStepById();
    return this.resolveTargetSequence().flatMap((id) => {
      const s = byId.get(id);
      return s ? [s] : [];
    });
  }
  private resolveStepById(): ReadonlyMap<string, GT006StepItem> {
    return this.stepById.size === this.content.sequence.length
      ? this.stepById
      : new Map(this.content.sequence.map((s) => [s.step_id, s]));
  }
  getCurrentSequence(): readonly string[] {
    return this.mechanic.getCurrentSequence();
  }
  getStagedIndex(): number | null {
    return this.stagedIndex;
  }
  setTouchingIndex(idx: number | null): void {
    const valid =
      this.isAcceptingInput() && idx !== null && this.mechanic.isInBounds(idx);
    this.touchingIndex = valid ? idx : null;
    if (valid) {
      this.wrongSubmitFlash.clear();
    }
  }
  getTouchingIndex(): number | null {
    return this.touchingIndex;
  }
  setPointerOver(x: number, y: number): void {
    if (!this.isAcceptingInput() || this.stagedIndex === null) {
      this.clearPointerOver();
      return;
    }
    this.pointerPoint = { x, y };
    const hit = findNearestSlotHitIndex(this.slots, x, y, TAP_TOLERANCE_PX);
    this.hoveredTargetIndex = hit >= 0 && hit !== this.stagedIndex ? hit : null;
  }
  clearPointerOver(): void {
    this.pointerPoint = null;
    this.hoveredTargetIndex = null;
  }
  getHoveredTargetIndex(): number | null {
    return this.hoveredTargetIndex;
  }

  reorderSteps(fromIndex: number, toIndex: number): void {
    if (
      !(this.isAcceptingInput() && this.mechanic.reorder(fromIndex, toIndex))
    ) {
      return;
    }
    this.wrongSubmitFlash.clear();
    this.touchingIndex = null;
    this.clearPointerOver();
    const clk = this.clock();
    const movedId = this.mechanic.getCurrentSequence()[toIndex];
    if (movedId) {
      clk.settledAtByStepId.set(movedId, clk.frameMs);
    }
    if (this.degradation?.particles_enabled !== false) {
      const col = designTokens.colors.montessori.amber;
      this.particles.push(
        ...createGT006StepParticles(this.slots[toIndex], col, this.stageRect)
      );
    }
    this.queueSfx("film_tick");
    this.mood.set("happy", GT006_HAPPY_MS);
    this.exploreTracker.recordExploreAction("train_car_reordered");
    this.recordEvent("step_reordered", {
      from_index: fromIndex,
      to_index: toIndex,
      current_sequence: this.mechanic.getCurrentSequence(),
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    const isMatch =
      action.type === "check_sequence"
        ? isSequenceEquivalentMatch(
            this.getCurrentSequence(),
            this.resolveTargetSequence(),
            this.resolveStepById()
          )
        : undefined;
    return this.mechanic.validate(
      action,
      this.resolveTargetSequence(),
      isMatch
    );
  }

  onSubmitSequence(): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    const { valid } = this.validateAction({ type: "check_sequence", data: {} });
    this.stagedIndex = null;
    this.touchingIndex = null;
    this.clearPointerOver();
    this.recordEvent("sequence_submitted", { is_correct: valid });
    const clk = this.clock();
    if (valid) {
      this.exploreTracker.recordCorrectAttempt();
      this.wrongSubmitFlash.clear();
      clk.winMs = clk.frameMs;
      this.isRoundClosed = true;
      if (this.degradation?.particles_enabled !== false) {
        const col = designTokens.colors.semantic.success[500];
        this.particles.push(
          ...createGT006StepParticles(this.slots[0], col, this.stageRect),
          ...createGT006StepParticles(this.slots.at(-1), col, this.stageRect)
        );
      }
      this.winSession();
      return;
    }
    this.wrongSubmitFlash.trigger(clk.logicMs);
    this.mood.set("wonder", GT006_WONDER_MS);
    const mismatchIdx = this.findFirstMismatchIndex();
    const reasonVi =
      mismatchIdx >= 0
        ? `Toa thứ ${mismatchIdx + 1} chưa đúng nhịp quy luật`
        : "Thứ tự các toa chưa khớp quy luật";
    const targetId =
      mismatchIdx >= 0 ? this.getCurrentSequence()[mismatchIdx] : undefined;
    this.exploreTracker.recordWrongAttempt({
      reasonVi,
      targetId,
      actualValue: mismatchIdx + 1,
    });
    this.recordEvent("control_of_error", {
      mismatch_index: mismatchIdx,
      micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
    });
    if (this.difficulty.allow_retry === false) {
      this.isRoundClosed = true;
      this.completeSession();
    }
  }

  override storyLine(): string {
    return GT006_STORY_LINE;
  }
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }
  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
    this.exploreTracker.tick(deltaMs);
    const clk = this.clock();
    clk.logicMs += deltaMs;
    clk.frameMs += deltaMs;
    if (this.wrongSubmitFlash.hasExpired(clk.logicMs)) {
      this.wrongSubmitFlash.clear();
    }
    this.particles = stepGT006Particles(
      this.particles,
      deltaMs,
      this.stageRect
    );
  }
  isWrongSubmitFlashing(): boolean {
    return this.wrongSubmitFlash.isActive(this.clock().logicMs);
  }
  private isStepOutOfOrder(stepId: string, idx: number): boolean {
    const tgtId = this.resolveTargetSequence()[idx];
    const byId = this.resolveStepById();
    return !(
      tgtId &&
      (tgtId === stepId ||
        areStepsVisuallyEquivalent(byId.get(stepId), byId.get(tgtId)))
    );
  }
  override checkWinCondition(): boolean {
    return this.isWon;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const base = {
      slotCount: this.content.sequence.length,
      ageBand,
      logic: this.logicSpace,
      stage: this.stageRect && splitStageForTrack(this.stageRect).slots,
      cssPerLogic: this.cssPerLogic,
    };
    const track = resolveLayout("horizontal-track")(base);
    return base.stage && !slotsFitStage(track, base.stage)
      ? resolveLayout("grid")(base)
      : track;
  }

  private toTapAction(x: number, y: number, tol: number): GameAction | null {
    const hitIndex = findNearestSlotHitIndex(this.slots, x, y, tol);
    if (hitIndex < 0) {
      return null;
    }
    const clk = this.clock();
    if (this.stagedIndex === null) {
      this.stagedIndex = hitIndex;
      clk.stagedAtMs = clk.frameMs;
      this.wrongSubmitFlash.clear();
      this.touchingIndex = null;
      return null;
    }
    if (this.stagedIndex === hitIndex) {
      this.stagedIndex = null;
      clk.stagedAtMs = null;
      this.clearPointerOver();
      return null;
    }
    return {
      type: "reorder_step",
      data: { from_index: this.stagedIndex, to_index: hitIndex },
    };
  }

  override toAction(g: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const tol = TAP_TOLERANCE_PX;
    if (g.type === "drop") {
      return resolveGT006DropAction(
        this.slots,
        g.fromX,
        g.fromY,
        g.toX,
        g.toY,
        tol
      );
    }
    if (g.type === "tap") {
      return this.toTapAction(g.x, g.y, tol);
    }
    return g.type === "commit" ? { type: "check_sequence", data: {} } : null;
  }

  private findNextMove(): {
    readonly from: number;
    readonly to: number;
  } | null {
    return findNextSequenceMove(
      this.getCurrentSequence(),
      this.resolveTargetSequence(),
      this.resolveStepById()
    );
  }

  override getHintTargetIndex(): number | null {
    return this.isAcceptingInput() ? (this.findNextMove()?.from ?? null) : null;
  }
  override getHintDestinationIndex(): number | null {
    return this.isAcceptingInput() ? (this.findNextMove()?.to ?? null) : null;
  }
  override getHintTarget(): HintTarget | null {
    return this.getHintTargetForLevel(2);
  }
  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const move = this.findNextMove();
    if (!move) {
      return { kind: "action" };
    }
    if (level === 1) {
      const cur = this.getCurrentSequence();
      const ids = Array.from(
        new Set(
          [cur[move.to], cur[move.from]].filter((id): id is string =>
            Boolean(id)
          )
        )
      );
      return ids.length > 0
        ? { kind: "region", ids }
        : { kind: "slot", index: move.from, toIndex: move.to };
    }
    return { kind: "slot", index: move.from, toIndex: move.to };
  }

  override getHintDemoSequence(
    level: HintLevel = 3
  ): readonly HintDemoStep[] | null {
    return this.isAcceptingInput() && level >= 3
      ? computeGT006HintDemoSteps(
          this.getCurrentSequence(),
          this.resolveTargetSequence(),
          this.resolveStepById()
        )
      : null;
  }

  override commit(action: GameAction): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    if (action.type === "reorder_step") {
      const payload = extractReorderPayload(action.data);
      if (payload) {
        this.reorderSteps(payload.fromIndex, payload.toIndex);
        this.stagedIndex = null;
        this.clock().stagedAtMs = null;
      }
    }
    if (action.type === "check_sequence") {
      this.onSubmitSequence();
    }
  }

  private resolveCardVisualState(
    stepId: string,
    idx: number,
    flashing: boolean
  ): GT006CardVisualState {
    return resolveGT006CardVisualState(
      idx,
      this.isWon,
      flashing && this.isStepOutOfOrder(stepId, idx),
      this.stagedIndex,
      this.touchingIndex,
      this.getRenderItemState(stepId)
    );
  }

  override getView(): EngineView {
    const order = this.mechanic.getCurrentSequence();
    const byId = this.resolveStepById();
    const flashing = this.isWrongSubmitFlashing();
    const entities: ViewEntity[] = [];
    for (let i = 0; i < order.length; i++) {
      const stepId = order[i];
      const slot = this.slots[i];
      if (stepId && slot) {
        entities.push(
          buildGT006ViewEntity(
            stepId,
            i,
            slot,
            byId.get(stepId),
            this.resolveCardVisualState(stepId, i, flashing),
            this.getRenderItemState(stepId)
          )
        );
      }
    }
    return { entities, activePrompt: this.content.prompt };
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const clk = this.clock();
    clk.frameMs = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    this.drawTrackDecor(ctx, rs);
    drawGT006DirectionBanner(ctx, this.slots, this.stageRect, this.isWon);
    drawGT006TrackCouplers(ctx, this.slots, this.isWon);
    const order = this.mechanic.getCurrentSequence();
    const byId = this.resolveStepById();
    const flashing = this.wrongSubmitFlash.isActive(clk.logicMs);
    const wrongProg = flashing
      ? this.wrongSubmitFlash.progress(clk.logicMs)
      : null;

    order.forEach((stepId, i) => {
      const slot = this.slots[i];
      const step = byId.get(stepId);
      if (slot && step) {
        const state = this.resolveCardVisualState(stepId, i, flashing);
        const settledAt = clk.settledAtByStepId.get(stepId) ?? null;
        const opt = buildGT006StepCardOptions(
          step,
          i,
          state,
          this.stagedIndex,
          this.hoveredTargetIndex,
          timeMs,
          clk.stagedAtMs,
          settledAt,
          wrongProg,
          this.stageRect
        );
        drawGT006StepCard(ctx, rs, slot, opt);
      }
    });

    if (this.stagedIndex !== null) {
      const fromSlot = this.slots[this.stagedIndex];
      const toPt =
        this.hoveredTargetIndex === null
          ? this.pointerPoint
          : (this.slots[this.hoveredTargetIndex] ?? this.pointerPoint);
      if (fromSlot && toPt) {
        const isHov = this.hoveredTargetIndex !== null;
        drawGT006SwapPreviewArc(ctx, fromSlot, toPt, this.stageRect, isHov);
      }
    }
    if (
      this.particles.length > 0 &&
      this.degradation?.particles_enabled !== false
    ) {
      rs.drawParticles(ctx, this.particles);
    }
    this.renderFilmPlayback(ctx, rs, timeMs);
    if (this.isRoundClosed && !this.isWon) {
      drawGT006SolutionStrip(
        ctx,
        this.resolveTargetSteps(),
        this.slots,
        this.stageRect
      );
    }
    drawMontessoriControlOfErrorPill(
      ctx,
      this.stageRect ?? sceneBox(rs),
      this.exploreTracker,
      rs.viewport?.scale
    );
  }

  private renderFilmPlayback(ctx: C2D, rs: RenderSystem, timeMs: number): void {
    const winMs = this.clock().winMs;
    if (!this.isWon || winMs === null) {
      return;
    }
    const count = this.mechanic.getCurrentSequence().length;
    const play = filmPlayback(
      count,
      Math.max(0, timeMs - winMs),
      rs.reducedMotion
    );
    for (let i = 0; i < play.lit; i++) {
      const slot = this.slots[i];
      if (slot) {
        drawFilmFrameGlow(ctx, slot, play.playhead === i);
      }
    }
    const spot = placeStoryCharacter(
      this.stageRect,
      this.slots,
      FILM_TREE_SIZE_PX
    );
    if (spot) {
      drawGrowingTree(
        ctx,
        spot.cx,
        spot.cy,
        FILM_TREE_SIZE_PX,
        treeGrowth(play.lit, count)
      );
    }
  }

  private drawTrackDecor(ctx: C2D, rs: RenderSystem): void {
    const strip = this.stageRect
      ? splitStageForTrack(this.stageRect).strip
      : null;
    if (this.content.representation === "number-line") {
      const current =
        this.stagedIndex === null ? undefined : this.stagedIndex + 1;
      if (strip) {
        drawNumberLine(ctx, strip, {
          min: 1,
          max: this.content.sequence.length,
          current,
          space: this.logicSpace,
          scale: rs.viewport?.scale,
        });
      } else {
        drawTrackNumberLine(ctx, rs, 1, this.content.sequence.length, current);
      }
      return;
    }
    const railBox = strip
      ? { x: strip.x, y: strip.y - strip.h / 3, w: strip.w, h: strip.h }
      : sceneBox(rs);
    drawTrainRailway(ctx, railBox);
    const loco = computeGT006LocomotiveSpot(this.slots[0], strip);
    if (loco) {
      drawLocomotive(ctx, loco.x, loco.y, loco.w, loco.h);
    }
  }
}
