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
  drawProgressBadge,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
  type ItemVisualState,
  updateParticles,
} from "../shared-render.js";
import type { GT028Content, GT028Difficulty } from "./template.js";

export class GT028Session extends TemplateGameSession<
  GT028Content,
  GT028Difficulty
> {
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  selectedItemIds: string[] = [];
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  setupEntities(): void {
    this.isWon = false;
    this.selectedItemIds = [];
    this.renderItemStates.clear();

    this.recordEvent("game_started", {
      step: this.content.step,
      target_total: this.content.target_total,
      item_count: this.content.items.length,
    });
  }

  getCurrentCount(): number {
    return this.selectedItemIds.length * this.content.step;
  }

  validateAction(action: GameAction): ActionResult {
    switch (action.type) {
      case "tap_item":
      case "select_item": {
        const itemId =
          typeof action.data === "object" && action.data !== null
            ? (Reflect.get(action.data, "item_id") ??
              Reflect.get(action.data, "id"))
            : undefined;

        if (typeof itemId !== "string") {
          return ACTION_IGNORED;
        }

        return this.onTapItem(itemId);
      }
      case "submit_count":
      case "submit": {
        return this.onSubmitCount();
      }
      default:
        return ACTION_IGNORED;
    }
  }

  onTapItem(itemId: string): ActionResult {
    const itemExists = this.content.items.some((i) => i.item_id === itemId);
    if (!itemExists) {
      return ACTION_IGNORED;
    }

    const index = this.selectedItemIds.indexOf(itemId);
    if (index === -1) {
      // Chọn mới
      this.selectedItemIds.push(itemId);
      this.setRenderItemState(itemId, "selected");
      this.recordEvent("item_tapped", {
        item_id: itemId,
        current_total: this.getCurrentCount(),
        step: this.content.step,
      });
      return ACTION_CORRECT;
    }

    // Đã chọn trước đó -> kiểm tra quyền undo (BR-E028-03)
    if (this.difficulty.allow_undo) {
      this.selectedItemIds.splice(index, 1);
      this.setRenderItemState(itemId, "idle");
      this.recordEvent("count_undone", {
        item_id: itemId,
        current_total: this.getCurrentCount(),
        step: this.content.step,
      });
      return ACTION_CORRECT;
    }

    return ACTION_IGNORED;
  }

  onSubmitCount(): ActionResult {
    const currentTotal = this.getCurrentCount();
    const isCorrect = currentTotal === this.content.target_total;

    this.recordEvent("count_submitted", {
      submitted_total: currentTotal,
      target_total: this.content.target_total,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.isWon = true;
      this.recordEvent("game_completed", { score: 100 });
      this.winSession();
      return ACTION_CORRECT;
    }

    return ACTION_RETRY;
  }

  override checkWinCondition(): boolean {
    return this.isWon;
  }

  override destroy(): void {
    this.renderItemStates.clear();
    this.selectedItemIds = [];
  }

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("grid");
    this.slots = layoutFn({
      slotCount: this.content.items.length,
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
    drawProgressBadge(
      ctx,
      rs,
      this.getCurrentCount(),
      this.content.target_total
    );

    const subText = `Bước nhảy: +${this.content.step}  |  Đã đếm: ${this.getCurrentCount()} / Mục tiêu: ${this.content.target_total}`;
    drawSubPromptText(ctx, rs, subText);
    drawWoodenTokenDock(ctx, rs);

    this.content.items.forEach((item, i) => {
      const slot = this.slots[i];
      if (!slot) {
        return;
      }
      const selectedIndex = this.selectedItemIds.indexOf(item.item_id);
      const isSelected = selectedIndex !== -1;
      const label = isSelected
        ? `${(selectedIndex + 1) * this.content.step}`
        : undefined;
      const state = isSelected
        ? "selected"
        : this.getRenderItemState(item.item_id);

      drawSlotItem(ctx, rs, slot, {
        id: item.item_id,
        asset: item.asset,
        label,
        state,
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
