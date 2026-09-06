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
import {
  drawProgressBadge,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
  type ItemVisualState,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT028Content, GT028Difficulty } from "./template.js";

interface ItemActionPayload {
  item_id?: string;
  id?: string;
}

function getItemId(data: object | null | undefined): string | undefined {
  if (data && typeof data === "object") {
    const payload = data as ItemActionPayload;
    if (typeof payload.item_id === "string") {
      return payload.item_id;
    }
    if (typeof payload.id === "string") {
      return payload.id;
    }
  }
  return undefined;
}

export class GT028Session extends TemplateGameSession<
  GT028Content,
  GT028Difficulty
> {
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
        const itemId = getItemId(action.data as object | null | undefined);

        if (typeof itemId !== "string") {
          return ACTION_IGNORED;
        }

        const itemExists = this.content.items.some((i) => i.item_id === itemId);
        if (!itemExists) {
          return ACTION_IGNORED;
        }

        const isAlreadySelected = this.selectedItemIds.includes(itemId);
        if (isAlreadySelected && !this.difficulty.allow_undo) {
          return ACTION_IGNORED;
        }

        return ACTION_CORRECT;
      }
      case "submit_count":
      case "submit": {
        const currentTotal = this.getCurrentCount();
        const isCorrect = currentTotal === this.content.target_total;
        return isCorrect ? ACTION_CORRECT : ACTION_RETRY;
      }
      default:
        return ACTION_IGNORED;
    }
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "commit") {
      return {
        type: "submit_count",
        data: {},
      };
    }

    if (gesture.type === "tap") {
      const hitTolerance = 24;
      for (let i = 0; i < this.slots.length; i++) {
        const slot = this.slots[i];
        const item = this.content.items[i];
        if (!(slot && item)) {
          continue;
        }

        const halfW = Math.max(slot.hitW, slot.w) / 2 + hitTolerance;
        const halfH = Math.max(slot.hitH, slot.h) / 2 + hitTolerance;

        if (
          Math.abs(gesture.x - slot.x) <= halfW &&
          Math.abs(gesture.y - slot.y) <= halfH
        ) {
          return {
            type: "tap_item",
            data: { item_id: item.item_id },
          };
        }
      }
    }

    return null;
  }

  override commit(action: GameAction): void {
    switch (action.type) {
      case "tap_item":
      case "select_item": {
        const itemId = getItemId(action.data as object | null | undefined);
        if (typeof itemId === "string") {
          this.onTapItem(itemId);
        }
        break;
      }
      case "submit_count":
      case "submit": {
        this.onSubmitCount();
        break;
      }
      default:
        break;
    }
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = this.content.items.map((item, i) => {
      const slot = this.slots[i];
      const isSelected = this.selectedItemIds.includes(item.item_id);
      let state: EntityVisual = "idle";
      if (isSelected) {
        state = "selected";
      } else {
        const renderState = this.getRenderItemState(item.item_id);
        if (renderState === "correct") {
          state = "correct";
        } else if (renderState === "wrong") {
          state = "incorrect";
        }
      }
      return {
        id: item.item_id,
        slotIndex: slot?.index ?? i,
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

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("grid");
    return layoutFn({
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
    drawSceneBackground(ctx, rs, this.themeId);
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
