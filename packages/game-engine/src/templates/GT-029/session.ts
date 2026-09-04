import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "../shared-render.js";
import type { GT029Content, GT029Difficulty } from "./template.js";

export class GT029Session extends TemplateGameSession<
  GT029Content,
  GT029Difficulty
> {
  degradation: DegradationState | null = null;
  removedItemIds: Set<string> = new Set();
  selectedOptionId: string | null = null;
  isWin = false;

  private particles: Particle[] = [];

  setupEntities(): void {
    this.removedItemIds.clear();
    this.selectedOptionId = null;
    this.isWin = false;
    this.particles = [];
    this.recordEvent("game_started", {
      template_code: "GT-029",
      initial_count: this.content.initial_items.length,
      remove_count: this.content.remove_count,
    });
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const totalItems = this.content.initial_items.length;
    const optionCount = this.content.answer_options.length;

    const gridFn = resolveLayout("grid");
    const itemSlots = gridFn({ slotCount: totalItems, ageBand: band });

    const flexFn = resolveLayout("flex-wrap");
    const optionSlots = flexFn({ slotCount: optionCount, ageBand: band });

    return [...itemSlots, ...optionSlots];
  }

  private handleItemRemoval(itemId: string): ActionResult {
    const itemExists = this.content.initial_items.some(
      (it) => it.item_id === itemId
    );
    if (!itemExists) {
      return ACTION_IGNORED;
    }

    if (this.removedItemIds.has(itemId)) {
      this.removedItemIds.delete(itemId);
      this.selectedOptionId = null;
      this.recordEvent("item_restored", {
        item_id: itemId,
        removed_count: this.removedItemIds.size,
        remaining_needed: this.content.remove_count - this.removedItemIds.size,
      });
      return ACTION_CORRECT;
    }

    if (this.removedItemIds.size >= this.content.remove_count) {
      return ACTION_RETRY;
    }

    this.removedItemIds.add(itemId);
    this.recordEvent("item_removed", {
      item_id: itemId,
      removed_count: this.removedItemIds.size,
      target_remove_count: this.content.remove_count,
    });

    return ACTION_CORRECT;
  }

  private handleOptionSelection(data: Record<string, unknown>): ActionResult {
    const optionId =
      (data.option_id as string) ||
      (data.id as string) ||
      (data.value === undefined ? "" : `opt_${data.value}`);

    const option = this.content.answer_options.find(
      (o) =>
        o.option_id === optionId ||
        (data.value !== undefined && o.value === data.value)
    );

    if (!option) {
      return ACTION_IGNORED;
    }

    if (this.removedItemIds.size < this.content.remove_count) {
      return ACTION_RETRY;
    }

    this.selectedOptionId = option.option_id;
    this.recordEvent("answer_selected", {
      option_id: option.option_id,
      value: option.value,
      is_correct: option.is_correct,
    });

    if (option.is_correct) {
      this.isWin = true;
      const optIndex = this.content.answer_options.indexOf(option);
      const slot = this.slots[this.content.initial_items.length + optIndex];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 12));
      }
      return ACTION_CORRECT;
    }

    return ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = action.data as Record<string, unknown>;

    if (
      type === "remove_item" ||
      type === "tap_item" ||
      type === "select_item"
    ) {
      const itemId = (data.item_id as string) || (data.id as string);
      if (!itemId) {
        return ACTION_IGNORED;
      }
      return this.handleItemRemoval(itemId);
    }

    if (type === "select_option" || type === "choose_answer") {
      return this.handleOptionSelection(data);
    }

    return ACTION_IGNORED;
  }

  override checkWinCondition(): boolean {
    return this.isWin;
  }

  getRemovedCount(): number {
    return this.removedItemIds.size;
  }

  getRemainingCount(): number {
    return this.content.initial_items.length - this.removedItemIds.size;
  }

  private renderItems(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    for (let i = 0; i < this.content.initial_items.length; i++) {
      const it = this.content.initial_items[i];
      const slot = this.slots[i];
      if (!(it && slot)) {
        continue;
      }

      const isRemoved = this.removedItemIds.has(it.item_id);
      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: it.item_id,
          asset: it.asset,
          label: isRemoved ? "Đã bớt" : undefined,
          state: isRemoved ? "locked" : "idle",
        },
        "circle"
      );
    }
  }

  private renderOptions(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    if (this.removedItemIds.size < this.content.remove_count) {
      return;
    }

    drawWoodenTokenDock(ctx, rs);

    for (let i = 0; i < this.content.answer_options.length; i++) {
      const opt = this.content.answer_options[i];
      const slot = this.slots[this.content.initial_items.length + i];
      if (!(opt && slot)) {
        continue;
      }

      const isSelected = this.selectedOptionId === opt.option_id;
      let optState: ItemVisualState = "idle";
      if (isSelected) {
        optState = opt.is_correct ? "correct" : "wrong";
      }

      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: opt.option_id,
          text: String(opt.value),
          state: optState,
        },
        "square"
      );
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);

    const removedCount = this.removedItemIds.size;
    const targetRemove = this.content.remove_count;
    const subPrompt =
      removedCount < targetRemove
        ? `Đã bớt: ${removedCount}/${targetRemove}`
        : "Đã bớt đủ! Nhóm ban đầu còn lại bao nhiêu?";
    drawSubPromptText(ctx, rs, subPrompt);

    this.renderItems(ctx, rs);
    this.renderOptions(ctx, rs);

    if (this.degradation?.particles_enabled !== false) {
      this.particles = updateParticles(this.particles);
      rs.drawParticles(ctx, this.particles);
    }
  }
}
