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
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { resolveTouchFloor } from "#src/layout/constants";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import {
  dockRectAroundSlots,
  insetDrawSize,
  legacyStageArea,
  splitCaption,
} from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWoodenTokenDock,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT029Content, GT029Difficulty } from "./template.js";
import {
  computePackedItemsAndOptions,
  layoutOptionSlots,
  splitItemsAndOptions,
} from "./zone-layout.js";

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
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;
  removedItemIds: Set<string> = new Set();
  selectedOptionId: string | null = null;
  isWin = false;

  private lastFrameMs = 0;
  private wrongOptionUntilMs = 0;
  private wrongItemId: string | null = null;
  private wrongItemUntilMs = 0;
  private particles: Particle[] = [];

  update(deltaMs: number): void {
    this.lastFrameMs += deltaMs;
    if (
      this.wrongOptionUntilMs > 0 &&
      this.lastFrameMs >= this.wrongOptionUntilMs
    ) {
      this.wrongOptionUntilMs = 0;
      this.selectedOptionId = null;
    }
    if (
      this.wrongItemUntilMs > 0 &&
      this.lastFrameMs >= this.wrongItemUntilMs
    ) {
      this.wrongItemUntilMs = 0;
      this.wrongItemId = null;
    }
  }

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

  /**
   * Ô lưới của vật `itemIndex` (`BR-E029-03`): vật còn trong nhóm dồn về đầu lưới
   * theo thứ tự gốc, vật đã bớt rời sang cuối lưới theo thứ tự bớt — nhóm co lại
   * thật và phần bớt nằm riêng, không đứng nguyên tại chỗ.
   */
  private itemCellIndex(itemIndex: number): number {
    const items = this.content.initial_items;
    const item = items[itemIndex];
    if (!item) {
      return itemIndex;
    }
    const removedOrder = [...this.removedItemIds];
    const removedRank = removedOrder.indexOf(item.item_id);
    if (removedRank >= 0) {
      return items.length - 1 - removedRank;
    }
    let remainingRank = 0;
    for (let i = 0; i < itemIndex; i++) {
      const other = items[i];
      if (other && !this.removedItemIds.has(other.item_id)) {
        remainingRank++;
      }
    }
    return remainingRank;
  }

  private itemSlotFor(itemIndex: number): Slot | undefined {
    return this.slots[this.itemCellIndex(itemIndex)];
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const totalItems = this.content.initial_items.length;
    if (this.removedItemIds.size < this.content.remove_count) {
      const unremovedIdx = this.content.initial_items.findIndex(
        (it) => !this.removedItemIds.has(it.item_id)
      );
      return unremovedIdx >= 0 ? this.itemCellIndex(unremovedIdx) : null;
    }
    const correctOptIdx = this.content.answer_options.findIndex(
      (opt) => opt.is_correct
    );
    if (correctOptIdx >= 0) {
      return totalItems + correctOptIdx;
    }
    return null;
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const totalItems = this.content.initial_items.length;
    const optionCount = this.content.answer_options.length;
    const params = {
      ageBand: band,
      logic: this.logicSpace,
      cssPerLogic: this.cssPerLogic,
    };
    const areas = splitItemsAndOptions(
      this.stageRect ?? legacyStageArea(this.logicSpace),
      optionCount,
      params
    );

    const gridFn = resolveLayout("grid");
    const itemSlots = gridFn({
      slotCount: totalItems,
      ageBand: band,
      logic: this.logicSpace,
      cssPerLogic: this.cssPerLogic,
      stage: areas.items,
    });
    const optionSlots = layoutOptionSlots(areas, optionCount, params).map(
      (slot, i) => ({ ...slot, index: totalItems + i })
    );

    if (this.stageRect && itemSlots.some((slot) => slot.page !== 0)) {
      return insetDrawSize(
        computePackedItemsAndOptions(
          this.stageRect,
          totalItems,
          optionCount,
          resolveTouchFloor(band, this.cssPerLogic)
        ),
        this.stageRect
      );
    }
    return insetDrawSize([...itemSlots, ...optionSlots], this.stageRect);
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
      this.wrongItemId = itemId;
      this.wrongItemUntilMs = this.lastFrameMs + 400;
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

    this.wrongOptionUntilMs = this.lastFrameMs + 400;
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
    const totalItems = this.content.initial_items.length;
    for (let i = 0; i < this.content.answer_options.length; i++) {
      const slot = this.slots[totalItems + i];
      const opt = this.content.answer_options[i];
      if (!(slot && opt)) {
        continue;
      }
      if (
        isPointInSlot(slot, gesture.x, gesture.y, "square", TAP_TOLERANCE_PX)
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
    const totalItems = this.content.initial_items.length;
    for (let i = 0; i < totalItems; i++) {
      const slot = this.itemSlotFor(i);
      const item = this.content.initial_items[i];
      if (!(slot && item)) {
        continue;
      }
      if (
        isPointInSlot(slot, gesture.x, gesture.y, "circle", TAP_TOLERANCE_PX)
      ) {
        return {
          type: "remove_item",
          data: { item_id: item.item_id },
        };
      }
    }
    return null;
  }

  private findDroppedItem(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const itemCount = this.content.initial_items.length;
    for (let i = 0; i < itemCount; i++) {
      const slot = this.itemSlotFor(i);
      const item = this.content.initial_items[i];
      if (!(slot && item)) {
        continue;
      }
      if (
        isPointInSlot(
          slot,
          gesture.fromX,
          gesture.fromY,
          "circle",
          TAP_TOLERANCE_PX
        )
      ) {
        const dragDist = Math.hypot(gesture.toX - slot.x, gesture.toY - slot.y);
        if (dragDist <= slot.w / 2) {
          return null;
        }
        return {
          type: "remove_item",
          data: { item_id: item.item_id },
        };
      }
    }
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "drop") {
      return this.findDroppedItem(gesture);
    }
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
      const slot = this.itemSlotFor(i);
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
        ...resolveAssetLabels(it.asset),
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
        hitShape: "square",
        ...resolveAssetLabels({ kind: "text", text: String(opt.value) }),
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

  /**
   * Vùng riêng của vật đã bớt: dock ôm các ô cuối lưới. Chỉ vẽ khi dock không
   * đè lên ô nào của nhóm còn lại (lưới ít cột, hàng cuối chia sẻ ô thì thôi —
   * vật bớt vẫn nằm sau nhóm và mờ đi).
   */
  private removedDockRect(): ZoneRect | undefined {
    const removedSlots: Slot[] = [];
    const groupSlots: Slot[] = [];
    this.content.initial_items.forEach((it, i) => {
      const slot = this.itemSlotFor(i);
      if (slot) {
        (this.removedItemIds.has(it.item_id) ? removedSlots : groupSlots).push(
          slot
        );
      }
    });
    const dock = dockRectAroundSlots(removedSlots, this.stageRect);
    if (!dock) {
      return undefined;
    }
    const overlapsGroup = groupSlots.some(
      (slot) =>
        Math.abs(slot.x - (dock.x + dock.w / 2)) < (slot.w + dock.w) / 2 &&
        Math.abs(slot.y - (dock.y + dock.h / 2)) < (slot.h + dock.h) / 2
    );
    return overlapsGroup ? undefined : dock;
  }

  private renderItems(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    const removedDock = this.removedDockRect();
    if (removedDock) {
      drawWoodenTokenDock(ctx, rs, removedDock);
    }
    for (let i = 0; i < this.content.initial_items.length; i++) {
      const it = this.content.initial_items[i];
      const slot = this.itemSlotFor(i);
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
          state: isRemoved ? "locked" : "idle",
        },
        "circle"
      );
    }
  }

  private renderOptions(ctx: CanvasRenderingContext2D, rs: RenderSystem): void {
    const isReady = this.removedItemIds.size >= this.content.remove_count;

    drawWoodenTokenDock(
      ctx,
      rs,
      dockRectAroundSlots(
        this.slots.slice(this.content.initial_items.length),
        this.stageRect
      )
    );

    for (let i = 0; i < this.content.answer_options.length; i++) {
      const opt = this.content.answer_options[i];
      const slot = this.slots[this.content.initial_items.length + i];
      if (!(opt && slot)) {
        continue;
      }

      if (!isReady) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        drawSlotItem(
          ctx,
          rs,
          slot,
          {
            id: opt.option_id,
            text: String(opt.value),
            state: "locked",
          },
          "square"
        );
        ctx.restore();
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

      if (isSelected && !opt.is_correct && this.wrongOptionUntilMs > 0) {
        const elapsed = 400 - (this.wrongOptionUntilMs - this.lastFrameMs);
        const progress = Math.min(1, Math.max(0, elapsed / 400));
        rs.drawRetryRing(
          ctx,
          slot.x,
          slot.y,
          Math.max(slot.w, slot.h) / 2 + 4,
          progress
        );
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    if (this.wrongOptionUntilMs > 0 && timeMs >= this.wrongOptionUntilMs) {
      this.wrongOptionUntilMs = 0;
      this.selectedOptionId = null;
    }
    if (this.wrongItemUntilMs > 0 && timeMs >= this.wrongItemUntilMs) {
      this.wrongItemUntilMs = 0;
      this.wrongItemId = null;
    }
    drawSceneBackground(ctx, rs, this.themeId);

    const removedCount = this.removedItemIds.size;
    const targetRemove = this.content.remove_count;
    const subPrompt =
      removedCount < targetRemove
        ? `Đã bớt: ${removedCount}/${targetRemove}`
        : "Đã bớt đủ! Nhóm ban đầu còn lại bao nhiêu?";
    drawSubPromptText(
      ctx,
      rs,
      subPrompt,
      this.stageRect ? splitCaption(this.stageRect).caption : undefined
    );

    this.renderItems(ctx, rs);

    if (this.wrongItemUntilMs > timeMs && this.wrongItemId) {
      const itemIdx = this.content.initial_items.findIndex(
        (it) => it.item_id === this.wrongItemId
      );
      const slot = this.itemSlotFor(itemIdx);
      if (slot) {
        const elapsed = 400 - (this.wrongItemUntilMs - timeMs);
        const progress = Math.min(1, Math.max(0, elapsed / 400));
        rs.drawRetryRing(
          ctx,
          slot.x,
          slot.y,
          Math.max(slot.w, slot.h) / 2 + 4,
          progress
        );
      }
    }

    this.renderOptions(ctx, rs);

    if (this.degradation?.particles_enabled !== false) {
      this.particles = updateParticles(this.particles);
      rs.drawParticles(ctx, this.particles);
    }
  }
}
