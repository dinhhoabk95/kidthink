import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
  type ItemVisualState,
  updateParticles,
} from "../shared-render.js";
import { drawGramophone } from "../shared-render-shapes.js";
import type { GT018Content, GT018Difficulty } from "./template.js";

function isPointInSlot(slot: Slot, x: number, y: number): boolean {
  const hw = (slot.hitW ?? slot.w) / 2;
  const hh = (slot.hitH ?? slot.h) / 2;
  return (
    x >= slot.x - hw && x <= slot.x + hw && y >= slot.y - hh && y <= slot.y + hh
  );
}

function findHitOptionId(
  slots: readonly Slot[],
  options: readonly { item_id: string }[],
  x: number,
  y: number
): string | null {
  for (let i = 0; i < options.length; i++) {
    const slot = slots[i];
    if (slot && isPointInSlot(slot, x, y)) {
      return options[i]?.item_id ?? null;
    }
  }
  return null;
}

export class GT018Session extends TemplateGameSession<
  GT018Content,
  GT018Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private readonly selectionMechanic = new SelectionMechanic({
    mode: "single",
  });
  private readonly orderingMechanic = new OrderingMechanic();
  selectedItemId: string | null = null;

  setupEntities(): void {
    this.isWon = false;
    this.selectedItemId = null;
    this.selectionMechanic.reset();

    if (this.content.response_mode === "sequence") {
      const initialSeq = this.content.options.map((opt) => opt.item_id);
      this.orderingMechanic.setInitialSequence(initialSeq);
    }

    this.recordEvent("round_started", {
      round_index: 0,
      mode: this.content.response_mode,
      item_count: this.content.options.length,
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (this.content.response_mode === "sequence") {
      const targetSeq = this.content.target_sequence ?? [];
      if (action.type === "reorder_step") {
        return this.orderingMechanic.validate(action, targetSeq);
      }
      if (
        action.type === "submit_order" ||
        action.type === "sequence_submitted"
      ) {
        return this.orderingMechanic.validate(action, targetSeq);
      }
      return ACTION_IGNORED;
    }

    const items = this.content.options.map((opt) => ({
      id: opt.item_id,
      isCorrect: opt.is_correct === true,
    }));

    if (action.type === "tap_option" || action.type === "select_item") {
      return this.selectionMechanic.validate(action, items);
    }

    return ACTION_IGNORED;
  }

  onItemSelect(itemId: string): ActionResult {
    if (this.content.response_mode !== "select") {
      return ACTION_IGNORED;
    }
    this.selectedItemId = itemId;
    this.selectionMechanic.select(itemId);
    const option = this.content.options.find((opt) => opt.item_id === itemId);
    const isCorrect = option?.is_correct === true;

    this.recordEvent("item_selected", {
      item_id: itemId,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return ACTION_CORRECT;
    }

    return ACTION_RETRY;
  }

  onReorderStep(fromIndex: number, toIndex: number): boolean {
    if (this.content.response_mode !== "sequence") {
      return false;
    }
    return this.orderingMechanic.reorder(fromIndex, toIndex);
  }

  onSubmitSequence(): ActionResult {
    if (this.content.response_mode !== "sequence") {
      return ACTION_IGNORED;
    }
    const targetSeq = this.content.target_sequence ?? [];
    const isMatch = this.orderingMechanic.isSequenceCorrect(targetSeq);

    this.recordEvent("sequence_submitted", {
      is_correct: isMatch,
      sequence: this.orderingMechanic.getCurrentSequence(),
    });

    if (isMatch) {
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return ACTION_CORRECT;
    }

    return ACTION_RETRY;
  }

  override checkWinCondition(): boolean {
    if (this.content.response_mode === "sequence") {
      const targetSeq = this.content.target_sequence ?? [];
      return this.orderingMechanic.isSequenceCorrect(targetSeq);
    }
    const items = this.content.options.map((opt) => ({
      id: opt.item_id,
      isCorrect: opt.is_correct === true,
    }));
    return this.selectionMechanic.isSelectionComplete(items);
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "tap") {
      const hitId = findHitOptionId(
        this.slots,
        this.content.options,
        gesture.x,
        gesture.y
      );
      if (hitId) {
        return { type: "tap_option", data: { item_id: hitId } };
      }
    }
    if (
      gesture.type === "commit" &&
      this.content.response_mode === "sequence"
    ) {
      return { type: "submit_order", data: null };
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (action.type === "tap_option" || action.type === "select_item") {
      const data = action.data;
      const itemId =
        typeof data === "object" && data !== null
          ? Reflect.get(data, "item_id")
          : undefined;
      if (typeof itemId === "string") {
        this.onItemSelect(itemId);
      }
    } else if (
      action.type === "submit_order" ||
      action.type === "sequence_submitted"
    ) {
      this.onSubmitSequence();
    }
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = this.content.options.map((opt, i) => {
      const slot = this.slots[i];
      const selected =
        this.selectedItemId === opt.item_id ||
        this.selectionMechanic.isSelected(opt.item_id);
      let state: EntityVisual = "idle";
      if (selected) {
        state = opt.is_correct ? "correct" : "incorrect";
      }
      return {
        id: opt.item_id,
        slotIndex: i,
        role: "source",
        state,
        x: slot?.x ?? 0,
        y: slot?.y ?? 0,
        w: slot?.w ?? 80,
        h: slot?.h ?? 80,
      };
    });
    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("grid");
    return layoutFn({
      slotCount: this.content.options.length,
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
    drawSubPromptText(ctx, rs, this.content.audio_prompt.text);

    const gramophoneSlot: Slot = {
      index: 0,
      x: rs.LOGIC_WIDTH / 2,
      y: rs.LOGIC_HEIGHT * 0.32,
      w: 130,
      h: 130,
      hitW: 130,
      hitH: 130,
      page: 0,
      role: "target",
    };
    drawGramophone(ctx, gramophoneSlot, false);
    drawWoodenTokenDock(ctx, rs);

    const chosenOrder =
      this.content.response_mode === "sequence"
        ? this.orderingMechanic.getCurrentSequence()
        : [];

    this.content.options.forEach((opt, i) => {
      const slot = this.slots[i];
      if (!slot) {
        return;
      }
      const orderIndex = chosenOrder.indexOf(opt.item_id);
      const selected =
        this.selectedItemId === opt.item_id ||
        this.selectionMechanic.isSelected(opt.item_id);
      drawSlotItem(ctx, rs, slot, {
        id: opt.item_id,
        asset: opt.asset,
        label: orderIndex >= 0 ? String(orderIndex + 1) : undefined,
        state: selected ? "selected" : this.getRenderItemState(opt.item_id),
      });
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

export default GT018Session;
