import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
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
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

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
  }

  getCurrentSequence(): readonly string[] {
    return this.mechanic.getCurrentSequence();
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

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("horizontal-track");
    this.slots = layoutFn({
      slotCount: this.content.sequence.length,
      ageBand,
    });
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
