import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawProgressBadge,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "../shared-render.js";
import { drawWoodenPlate } from "../shared-render-shapes.js";
import type { GT002Content, GT002Difficulty } from "./template.js";

type TargetItem = GT002Content["items"][number];

export class GT002Session extends TemplateGameSession<
  GT002Content,
  GT002Difficulty
> {
  displayItems: readonly TargetItem[] = [];
  private readonly mechanic = new SelectionMechanic({ mode: "multi" });
  degradation: DegradationState | null = null;
  private particles: Particle[] = [];
  private itemStates: Map<string, ItemVisualState> = new Map();

  setupEntities(): void {
    this.mechanic.reset();
    this.isWon = false;
    this.particles = [];
    this.itemStates = new Map();
    this.displayItems = [...this.content.items];
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("grid-2x4");
    return layoutFn({
      slotCount: this.displayItems.length,
      ageBand,
    });
  }

  private getItemState(itemId: string): ItemVisualState {
    return this.itemStates.get(itemId) ?? "idle";
  }

  setItemState(itemId: string, state: ItemVisualState): void {
    this.itemStates.set(itemId, state);
  }

  toggleItemSelection(itemId: string): void {
    this.mechanic.toggle(itemId);
    const current = this.getItemState(itemId);
    this.setItemState(itemId, current === "selected" ? "idle" : "selected");
  }

  validateAction(action: GameAction): ActionResult {
    const items = this.content.items.map((i) => ({
      id: i.item_id,
      isCorrect: i.is_correct,
    }));
    return this.mechanic.validate(action, items);
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: game submit logic requires branching
  onSubmitSelection(): void {
    const { valid } = this.validateAction({
      type: "submit_selection",
      data: {},
    });
    this.recordEvent("selection_submitted", { is_correct: valid });
    if (valid) {
      for (const item of this.displayItems) {
        if (item.is_correct) {
          this.setItemState(item.item_id, "correct");
          const idx = this.displayItems.indexOf(item);
          const slot = this.slots[idx];
          if (slot) {
            this.particles.push(...spawnParticlesAtSlot(slot, 6));
          }
        }
      }
      this.winSession();
    } else {
      for (const item of this.displayItems) {
        const state = this.getItemState(item.item_id);
        if (state === "selected" && !item.is_correct) {
          this.setItemState(item.item_id, "wrong");
        }
      }
    }
  }

  override checkWinCondition(): boolean {
    const items = this.content.items.map((i) => ({
      id: i.item_id,
      isCorrect: i.is_correct,
    }));
    return this.mechanic.isSelectionComplete(items);
  }

  private getSelectedCount(): number {
    let count = 0;
    for (const [, state] of this.itemStates) {
      if (state === "selected" || state === "correct") {
        count++;
      }
    }
    return count;
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const slots = this.slots;
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);
    drawProgressBadge(
      ctx,
      rs,
      this.getSelectedCount(),
      this.difficulty.target_count
    );
    this.drawInteractive(rs, ctx, slots);
    this.drawFeedback(rs, ctx, timeMs);
  }

  private drawInteractive(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    slots: readonly Slot[]
  ): void {
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = slots[i];
      if (!(slot && item)) {
        continue;
      }
      const state = this.getItemState(item.item_id);
      const isSelected = state === "selected" || state === "correct";
      drawWoodenPlate(ctx, slot, isSelected);
      drawSlotItem(
        ctx,
        rs,
        slot,
        {
          id: item.item_id,
          asset: item.asset,
          state,
        },
        "circle"
      );
    }
  }

  private drawFeedback(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    _timeMs: number
  ): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    this.particles = updateParticles(this.particles);
    rs.drawParticles(ctx, this.particles);
  }
}

export default GT002Session;
