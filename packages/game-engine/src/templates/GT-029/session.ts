import type { AgeBand } from "#src/contracts/types";
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

interface GT029ActionPayload {
  item_id?: string;
  id?: string;
  option_id?: string;
  value?: number;
}

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

  private handleOptionSelection(data: GT029ActionPayload): ActionResult {
    const optionId =
      data.option_id ??
      data.id ??
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
      this.isWon = true;
      const optIndex = this.content.answer_options.indexOf(option);
      const slot = this.slots[this.content.initial_items.length + optIndex];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 12));
      }
      this.recordEvent("game_completed", { score: 100 });
      this.winSession();
      return ACTION_CORRECT;
    }

    return ACTION_RETRY;
  }

  private validateItemRemovalAction(data: GT029ActionPayload): ActionResult {
    const itemId = data.item_id ?? data.id;
    if (!itemId) {
      return ACTION_IGNORED;
    }
    const itemExists = this.content.initial_items.some(
      (it) => it.item_id === itemId
    );
    if (!itemExists) {
      return ACTION_IGNORED;
    }
    if (this.removedItemIds.has(itemId)) {
      return ACTION_CORRECT;
    }
    if (this.removedItemIds.size >= this.content.remove_count) {
      return ACTION_RETRY;
    }
    return ACTION_CORRECT;
  }

  private validateOptionSelectionAction(
    data: GT029ActionPayload
  ): ActionResult {
    const optionId =
      data.option_id ??
      data.id ??
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

    return option.is_correct ? ACTION_CORRECT : ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT029ActionPayload;

    if (
      type === "remove_item" ||
      type === "tap_item" ||
      type === "select_item"
    ) {
      return this.validateItemRemovalAction(data);
    }

    if (type === "select_option" || type === "choose_answer") {
      return this.validateOptionSelectionAction(data);
    }

    return ACTION_IGNORED;
  }

  private findTappedOption(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    if (this.removedItemIds.size < this.content.remove_count) {
      return null;
    }
    const hitTolerance = 24;
    const totalItems = this.content.initial_items.length;
    for (let i = 0; i < this.content.answer_options.length; i++) {
      const slot = this.slots[totalItems + i];
      const opt = this.content.answer_options[i];
      if (!(slot && opt)) {
        continue;
      }
      const hw = (slot.hitW ?? slot.w) / 2 + hitTolerance;
      const hh = (slot.hitH ?? slot.h) / 2 + hitTolerance;
      if (
        Math.abs(gesture.x - slot.x) <= hw &&
        Math.abs(gesture.y - slot.y) <= hh
      ) {
        return {
          type: "select_option",
          data: { option_id: opt.option_id, value: opt.value },
        };
      }
    }
    return null;
  }

  private findTappedItem(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const hitTolerance = 24;
    const totalItems = this.content.initial_items.length;
    for (let i = 0; i < totalItems; i++) {
      const slot = this.slots[i];
      const item = this.content.initial_items[i];
      if (!(slot && item)) {
        continue;
      }
      const hw = (slot.hitW ?? slot.w) / 2 + hitTolerance;
      const hh = (slot.hitH ?? slot.h) / 2 + hitTolerance;
      if (
        Math.abs(gesture.x - slot.x) <= hw &&
        Math.abs(gesture.y - slot.y) <= hh
      ) {
        return {
          type: "remove_item",
          data: { item_id: item.item_id },
        };
      }
    }
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap") {
      return null;
    }

    return this.findTappedOption(gesture) ?? this.findTappedItem(gesture);
  }

  override commit(action: GameAction): void {
    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT029ActionPayload;

    if (
      type === "remove_item" ||
      type === "tap_item" ||
      type === "select_item"
    ) {
      const itemId = data.item_id ?? data.id;
      if (typeof itemId === "string") {
        this.handleItemRemoval(itemId);
      }
      return;
    }

    if (type === "select_option" || type === "choose_answer") {
      this.handleOptionSelection(data);
    }
  }

  private getItemEntities(): ViewEntity[] {
    const totalItems = this.content.initial_items.length;
    const entities: ViewEntity[] = [];

    for (let i = 0; i < totalItems; i++) {
      const it = this.content.initial_items[i];
      const slot = this.slots[i];
      if (!(it && slot)) {
        continue;
      }
      const isRemoved = this.removedItemIds.has(it.item_id);
      entities.push({
        id: it.item_id,
        slotIndex: slot.index,
        role: "source",
        state: isRemoved ? "selected" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }
    return entities;
  }

  private getOptionEntities(): ViewEntity[] {
    if (this.removedItemIds.size < this.content.remove_count) {
      return [];
    }
    const totalItems = this.content.initial_items.length;
    const entities: ViewEntity[] = [];

    for (let i = 0; i < this.content.answer_options.length; i++) {
      const opt = this.content.answer_options[i];
      const slot = this.slots[totalItems + i];
      if (!(opt && slot)) {
        continue;
      }
      const isSelected = this.selectedOptionId === opt.option_id;
      let state: EntityVisual = "idle";
      if (isSelected) {
        state = opt.is_correct ? "correct" : "incorrect";
      }
      entities.push({
        id: opt.option_id,
        slotIndex: slot.index,
        role: "target",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }
    return entities;
  }

  override getView(): EngineView {
    return {
      activePrompt: this.content.prompt,
      entities: [...this.getItemEntities(), ...this.getOptionEntities()],
    };
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
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
