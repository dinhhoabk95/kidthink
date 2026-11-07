import { formatSpokenLabel } from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import {
  drawLocomotive,
  drawMontessoriControlOfErrorPill,
  drawNumberLine,
  drawSceneBackground,
  drawSlotItem,
  drawTrackNumberLine,
  drawTrainRailway,
  type ItemVisualState,
  sceneBox,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import type { RenderSystem } from "#src/systems/render-system";
import { slotsFitStage, splitStageForTrack } from "./stage-strip.js";
import type { GT006Content, GT006Difficulty } from "./template.js";

export class GT006Session extends TemplateGameSession<
  GT006Content,
  GT006Difficulty
> {
  override readonly usesPromptZone = true;
  /** Nút xong ở `zones.action` (`BR-PSZ-05`); `commit` → `check_sequence`. */
  override readonly needsCommit = true;
  degradation: DegradationState | null = null;
  private stagedIndex: number | null = null;
  private wrongSubmitTimerMs = 0;

  private readonly mechanic = new OrderingMechanic();
  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });
  private stepById = new Map<string, GT006Content["sequence"][number]>();
  private targetSequence: readonly string[] = [];

  setupEntities(): void {
    this.exploreTracker.reset(false);
    this.stepById = new Map(this.content.sequence.map((s) => [s.step_id, s]));
    this.targetSequence = this.content.sequence
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => s.step_id);
    const steps = this.content.sequence.map((s) => s.step_id);
    if (this.difficulty.shuffle_initial === false) {
      this.mechanic.setInitialSequence(steps);
    } else {
      const rng = deriveStream(this.layoutSeed, "initial");
      this.mechanic.setInitialSequence(shuffle(steps, rng));
    }
    this.isWon = false;
    this.stagedIndex = null;
    this.wrongSubmitTimerMs = 0;
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
    const current = this.getCurrentSequence();
    const target = this.resolveTargetSequence();
    const len = Math.max(current.length, target.length);
    for (let i = 0; i < len; i++) {
      if (current[i] !== target[i]) {
        return i;
      }
    }
    return -1;
  }

  private resolveTargetSequence(): readonly string[] {
    if (this.targetSequence.length === this.content.sequence.length) {
      return this.targetSequence;
    }
    return this.content.sequence
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => s.step_id);
  }

  private resolveStepById(): ReadonlyMap<
    string,
    GT006Content["sequence"][number]
  > {
    if (this.stepById.size === this.content.sequence.length) {
      return this.stepById;
    }
    return new Map(this.content.sequence.map((s) => [s.step_id, s]));
  }

  getCurrentSequence(): readonly string[] {
    return this.mechanic.getCurrentSequence();
  }

  getStagedIndex(): number | null {
    return this.stagedIndex;
  }

  private isInBounds(index: number): boolean {
    return this.mechanic.isInBounds(index);
  }

  reorderSteps(fromIndex: number, toIndex: number): void {
    if (!this.mechanic.reorder(fromIndex, toIndex)) {
      return;
    }
    this.exploreTracker.recordExploreAction("train_car_reordered");
    this.recordEvent("step_reordered", {
      from_index: fromIndex,
      to_index: toIndex,
      current_sequence: this.mechanic.getCurrentSequence(),
    });
  }

  validateAction(action: GameAction): ActionResult {
    return this.mechanic.validate(action, this.resolveTargetSequence());
  }

  onSubmitSequence(): void {
    const { valid } = this.validateAction({
      type: "check_sequence",
      data: {},
    });
    this.recordEvent("sequence_submitted", { is_correct: valid });
    if (valid) {
      this.exploreTracker.recordCorrectAttempt();
      this.wrongSubmitTimerMs = 0;
      this.winSession();
    } else {
      this.wrongSubmitTimerMs = 350;
      const mismatchIdx = this.findFirstMismatchIndex();
      const reasonVi =
        mismatchIdx >= 0
          ? `Toa thứ ${mismatchIdx + 1} chưa đúng nhịp quy luật`
          : "Thứ tự các toa chưa khớp quy luật";
      this.exploreTracker.recordWrongAttempt({
        reasonVi,
        targetId:
          mismatchIdx >= 0 ? this.getCurrentSequence()[mismatchIdx] : undefined,
        actualValue: mismatchIdx + 1,
      });
      this.recordEvent("control_of_error", {
        mismatch_index: mismatchIdx,
        micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
      });
    }
  }

  update(deltaMs: number): void {
    this.exploreTracker.tick(deltaMs);
    if (this.wrongSubmitTimerMs > 0) {
      this.wrongSubmitTimerMs = Math.max(0, this.wrongSubmitTimerMs - deltaMs);
    }
  }

  private isStepOutOfOrder(stepId: string, currentIndex: number): boolean {
    return this.resolveTargetSequence()[currentIndex] !== stepId;
  }

  /**
   * Thắng chỉ khi trẻ nộp (`commit` → `check_sequence`) và dãy khớp `sequence`
   * (GT-006 N6): xếp đúng mà chưa bấm nút xong thì chưa kết lượt.
   */
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
    // Một hàng không vừa sân khấu hẹp thì xếp dãy thành nhiều hàng, đọc trái → phải, trên → dưới.
    return base.stage && !slotsFitStage(track, base.stage)
      ? resolveLayout("grid")(base)
      : track;
  }

  private toSlotIndex(x: number, y: number, hitTolerance: number): number {
    return findHitSlotIndex(this.slots, x, y, "square", hitTolerance);
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    hitTolerance: number
  ): GameAction | null {
    const fromIndex = this.toSlotIndex(
      gesture.fromX,
      gesture.fromY,
      hitTolerance
    );
    const toIndex = this.toSlotIndex(gesture.toX, gesture.toY, hitTolerance);

    if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
      return {
        type: "reorder_step",
        data: {
          from_index: fromIndex,
          to_index: toIndex,
        },
      };
    }
    return null;
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>,
    hitTolerance: number
  ): GameAction | null {
    const hitIndex = this.toSlotIndex(gesture.x, gesture.y, hitTolerance);
    if (hitIndex < 0) {
      return null;
    }

    if (this.stagedIndex === null) {
      this.stagedIndex = hitIndex;
      return null;
    }

    if (this.stagedIndex === hitIndex) {
      this.stagedIndex = null;
      return null;
    }

    const fromIndex = this.stagedIndex;
    const toIndex = hitIndex;
    return {
      type: "reorder_step",
      data: {
        from_index: fromIndex,
        to_index: toIndex,
      },
    };
  }

  override toAction(gesture: Gesture): GameAction | null {
    const hitTolerance = TAP_TOLERANCE_PX;
    if (gesture.type === "drop") {
      return this.toDropAction(gesture, hitTolerance);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture, hitTolerance);
    }
    if (gesture.type === "commit") {
      return {
        type: "check_sequence",
        data: {},
      };
    }
    return null;
  }

  /** Vị trí đầu tiên lệch quy luật và toa đúng ra đang nằm ở đâu (nguồn → đích của một cú kéo). */
  private findNextMove(): {
    readonly from: number;
    readonly to: number;
  } | null {
    const targetSequence = this.resolveTargetSequence();
    const current = this.getCurrentSequence();
    for (let i = 0; i < targetSequence.length; i++) {
      const expectedStepId = targetSequence[i];
      if (expectedStepId !== undefined && current[i] !== expectedStepId) {
        const from = current.indexOf(expectedStepId);
        return from >= 0 ? { from, to: i } : null;
      }
    }
    return null;
  }

  override getHintTargetIndex(): number | null {
    return this.findNextMove()?.from ?? null;
  }

  /** Bước đúng là kéo toa tới vị trí đúng của nó trong dãy. */
  override getHintDestinationIndex(): number | null {
    return this.findNextMove()?.to ?? null;
  }

  override commit(action: GameAction): void {
    if (
      action.type === "reorder_step" &&
      action.data &&
      typeof action.data === "object"
    ) {
      const data = action.data as {
        from_index?: number;
        to_index?: number;
      };
      if (data.from_index !== undefined && data.to_index !== undefined) {
        this.reorderSteps(data.from_index, data.to_index);
        this.stagedIndex = null;
      }
    }
    if (action.type === "check_sequence") {
      this.onSubmitSequence();
    }
  }

  private toItemEntityState(
    isStaged: boolean,
    rawState: ItemVisualState
  ): ViewEntity["state"] {
    if (isStaged || rawState === "selected") {
      return "selected";
    }
    if (rawState === "correct") {
      return "correct";
    }
    if (rawState === "wrong") {
      return "incorrect";
    }
    return "idle";
  }

  override getView(): EngineView {
    const order = this.mechanic.getCurrentSequence();
    const byId = this.resolveStepById();
    const entities: ViewEntity[] = [];

    for (let i = 0; i < order.length; i++) {
      const stepId = order[i];
      const slot = this.slots[i];
      if (!(stepId && slot)) {
        continue;
      }
      const step = byId.get(stepId);
      const assetLabels = step ? resolveAssetLabels(step.asset) : {};
      const rawState = this.getRenderItemState(stepId);
      const isStaged = this.stagedIndex === i;
      const isOutOfOrder =
        this.wrongSubmitTimerMs > 0 && this.isStepOutOfOrder(stepId, i);
      let state = this.toItemEntityState(isStaged, rawState);
      if (isOutOfOrder) {
        state = "incorrect";
      }
      const correctOrder =
        (step as { correct_order?: number; order_index?: number })
          ?.correct_order ??
        step?.order_index ??
        i + 1;
      const label = step?.label ?? assetLabels.label ?? String(correctOrder);
      const spokenLabel = step?.label
        ? formatSpokenLabel(step.label)
        : (assetLabels.spokenLabel ?? formatSpokenLabel(String(correctOrder)));

      entities.push({
        id: stepId,
        slotIndex: i,
        role: "target",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "square",
        glyph: assetLabels.glyph,
        label,
        spokenLabel,
        spokenAudioPath: assetLabels.spokenAudioPath,
      });
    }

    return {
      entities,
      activePrompt: this.content.prompt,
    };
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    this.drawTrackDecor(ctx, rs);
    const order = this.mechanic.getCurrentSequence();
    const byId = this.resolveStepById();

    order.forEach((stepId, i) => {
      const slot = this.slots[i];
      const step = byId.get(stepId);
      if (!(slot && step)) {
        return;
      }
      const assetLabels = resolveAssetLabels(step.asset);
      const correctOrder =
        (step as { correct_order?: number; order_index?: number })
          .correct_order ?? step.order_index;
      let state = this.getRenderItemState(stepId);
      if (this.wrongSubmitTimerMs > 0 && this.isStepOutOfOrder(stepId, i)) {
        state = "wrong";
      } else if (this.stagedIndex === i && state === "idle") {
        state = "selected";
      }
      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: stepId,
          asset: step.asset,
          label: step.label ?? assetLabels.label ?? String(correctOrder),
          state,
        },
        "square"
      );
    });
    drawMontessoriControlOfErrorPill(
      ctx,
      this.stageRect ?? sceneBox(rs),
      this.exploreTracker,
      rs.viewport?.scale
    );
  }

  /** Trục số hoặc đường ray + đầu tàu; có stage thì nằm trong dải đáy của stage. */
  private drawTrackDecor(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const strip: ZoneRect | null = this.stageRect
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
    // Ray gỗ nằm ở 3/4 chiều cao hộp: dải đáy của stage đặt ray đúng giữa dải.
    drawTrainRailway(
      ctx,
      strip
        ? { x: strip.x, y: strip.y - strip.h / 3, w: strip.w, h: strip.h }
        : sceneBox(rs)
    );
    const firstSlot = this.slots[0];
    if (!firstSlot) {
      return;
    }
    const x = Math.max(80, firstSlot.x - firstSlot.w * 1.5);
    if (strip && x - 45 < strip.x) {
      return;
    }
    drawLocomotive(ctx, x, firstSlot.y, 90, 70);
  }
}
