import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  sceneBox,
  updateParticles,
} from "../shared-render.js";
import { drawLocomotive, drawTrainRailway } from "../shared-render-shapes.js";
import type { GT006Content, GT006Difficulty } from "./template.js";

export class GT006Session extends TemplateGameSession<
  GT006Content,
  GT006Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();
  private stagedIndex: number | null = null;

  private readonly mechanic = new OrderingMechanic();

  setupEntities(): void {
    const steps = this.content.sequence.map((s) => s.step_id);
    if (this.difficulty.shuffle_initial === false) {
      this.mechanic.setInitialSequence(steps);
    } else {
      const rng = deriveStream(this.layoutSeed, "initial");
      this.mechanic.setInitialSequence(shuffle(steps, rng));
    }
    this.isWon = false;
    this.stagedIndex = null;
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
    this.recordEvent("step_reordered", {
      from_index: fromIndex,
      to_index: toIndex,
      current_sequence: this.mechanic.getCurrentSequence(),
    });
  }

  validateAction(action: GameAction): ActionResult {
    const targetSequence = this.content.sequence
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => s.step_id);

    return this.mechanic.validate(action, targetSequence);
  }

  onSubmitSequence(): void {
    const { valid } = this.validateAction({
      type: "check_sequence",
      data: {},
    });
    this.recordEvent("sequence_submitted", { is_correct: valid });
    if (valid) {
      this.winSession();
    }
  }

  override checkWinCondition(): boolean {
    const targetSequence = this.content.sequence
      .slice()
      .sort((a, b) => a.order_index - b.order_index)
      .map((s) => s.step_id);

    return this.mechanic.isSequenceCorrect(targetSequence);
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("horizontal-track");
    return layoutFn({
      slotCount: this.content.sequence.length,
      ageBand,
    });
  }

  private toSlotIndex(x: number, y: number, hitTolerance: number): number {
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot) {
        continue;
      }
      const halfW = Math.max(slot.hitW, slot.w) / 2 + hitTolerance;
      const halfH = Math.max(slot.hitH, slot.h) / 2 + hitTolerance;
      if (Math.abs(x - slot.x) <= halfW && Math.abs(y - slot.y) <= halfH) {
        return i;
      }
    }
    return -1;
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
    const hitTolerance = 24;
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
    const entities: ViewEntity[] = [];

    for (let i = 0; i < order.length; i++) {
      const stepId = order[i];
      const slot = this.slots[i];
      if (!(stepId && slot)) {
        continue;
      }
      const rawState = this.getRenderItemState(stepId);
      const isStaged = this.stagedIndex === i;
      const state = this.toItemEntityState(isStaged, rawState);

      entities.push({
        id: stepId,
        slotIndex: i,
        role: "target",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }

    return {
      entities,
      activePrompt: this.content.prompt,
    };
  }

  setRenderItemState(itemId: string, state: ItemVisualState): void {
    this.renderItemStates.set(itemId, state);
  }

  getRenderItemState(itemId: string): ItemVisualState {
    return this.renderItemStates.get(itemId) ?? "idle";
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);
    drawTrainRailway(ctx, sceneBox(rs));
    const firstSlot = this.slots[0];
    if (firstSlot) {
      drawLocomotive(
        ctx,
        Math.max(80, firstSlot.x - firstSlot.w * 1.5),
        firstSlot.y,
        90,
        70
      );
    }
    const order = this.mechanic.getCurrentSequence();
    const byId = new Map(this.content.sequence.map((s) => [s.step_id, s]));

    order.forEach((stepId, i) => {
      const slot = this.slots[i];
      const step = byId.get(stepId);
      if (!(slot && step)) {
        return;
      }
      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: stepId,
          asset: step.asset,
          label: step.label ?? String(i + 1),
          state: this.getRenderItemState(stepId),
        },
        "square"
      );
    });
    this.drawRenderFeedback(rs, ctx);
  }

  private drawRenderFeedback(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D
  ): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    this.renderParticles = updateParticles(this.renderParticles);
    rs.drawParticles(ctx, this.renderParticles);
  }
}

export default GT006Session;
