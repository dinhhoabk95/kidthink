import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import {
  drawNestTarget,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT003Content, GT003Difficulty } from "./template.js";

type DraggableItem = GT003Content["items"][number];

export class GT003Session extends TemplateGameSession<
  GT003Content,
  GT003Difficulty
> {
  displayItems: readonly DraggableItem[] = [];
  private readonly mechanic = new PlacementMechanic();
  degradation: DegradationState | null = null;
  private particles: Particle[] = [];
  private itemStates: Map<string, ItemVisualState> = new Map();
  hoveredContainer = false;

  setupEntities(): void {
    this.mechanic.reset();
    this.isWon = false;
    this.particles = [];
    this.itemStates = new Map();
    this.displayItems = [...this.content.items];
    this.hoveredContainer = false;
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("top-source-bottom-target");
    // `slotCount` của bố cục lưỡng phân là số slot **nguồn**, còn `targetCount`
    // là số slot đích — layout tự cộng hai vế.
    return layoutFn({
      slotCount: this.displayItems.length,
      ageBand,
      targetCount: 1,
    });
  }

  setItemState(itemId: string, state: ItemVisualState): void {
    this.itemStates.set(itemId, state);
  }

  getItemState(itemId: string): ItemVisualState {
    const stagedId = this.mechanic.getStagedItemId();
    if (stagedId === itemId) {
      return "selected";
    }
    return this.itemStates.get(itemId) ?? "idle";
  }

  stageItem(itemId: string | null): void {
    this.mechanic.stageItem(itemId);
  }

  getStagedItemId(): string | null {
    return this.mechanic.getStagedItemId();
  }

  getContainerId(): string {
    return this.content.container.container_id;
  }

  getPlacements(): ReadonlyMap<string, string> {
    return this.mechanic.getPlacements();
  }

  private resolveDrop(itemId: string, containerId: string) {
    if (containerId !== this.content.container.container_id) {
      return;
    }
    return this.content.items.find((i) => i.item_id === itemId);
  }

  validateAction(action: GameAction): ActionResult {
    const items = this.content.items.map((i) => ({
      id: i.item_id,
      targetId: this.content.container.container_id,
      isCorrect: i.is_correct,
    }));
    return this.mechanic.validate(
      action,
      items,
      (cId) => cId === this.content.container.container_id
    );
  }

  onItemDropped(itemId: string, containerId: string): void {
    const item = this.resolveDrop(itemId, containerId);
    if (!item) {
      return;
    }

    this.recordEvent("item_dropped", {
      item_id: itemId,
      container_id: containerId,
      is_correct: item.is_correct,
    });

    if (item.is_correct) {
      this.mechanic.place(itemId, containerId);
      this.setItemState(itemId, "correct");
      const idx = this.displayItems.findIndex((i) => i.item_id === itemId);
      const slot = this.slots[idx];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 6));
      }
      const containerSlot = this.slots.at(-1);
      if (containerSlot) {
        this.particles.push(...spawnParticlesAtSlot(containerSlot, 8));
      }
      if (this.checkWinCondition()) {
        this.winSession();
      }
    } else {
      this.setItemState(itemId, "wrong");
    }
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const stateMap: Record<
      string,
      "idle" | "selected" | "correct" | "incorrect"
    > = {
      wrong: "incorrect",
      correct: "correct",
      selected: "selected",
    };

    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = this.slots[i];
      if (!(item && slot)) {
        continue;
      }
      const rawState = this.getItemState(item.item_id);
      const state = stateMap[rawState] ?? "idle";
      entities.push({
        id: item.item_id,
        slotIndex: i,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }

    const containerSlot = this.slots.at(-1);
    if (containerSlot) {
      entities.push({
        id: this.content.container.container_id,
        slotIndex: this.slots.length - 1,
        role: "target",
        state: "idle",
        x: containerSlot.x,
        y: containerSlot.y,
        w: containerSlot.w,
        h: containerSlot.h,
      });
    }

    return {
      entities,
      activePrompt: this.content.prompt,
    };
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    containerSlot: Slot,
    hitTolerance: number
  ): GameAction | null {
    let draggedItem: DraggableItem | null = null;
    for (let i = 0; i < this.displayItems.length; i++) {
      const slot = this.slots[i];
      const item = this.displayItems[i];
      if (!(slot && item)) {
        continue;
      }
      const halfW = Math.max(slot.hitW, slot.w) / 2 + hitTolerance;
      const halfH = Math.max(slot.hitH, slot.h) / 2 + hitTolerance;
      if (
        Math.abs(gesture.fromX - slot.x) <= halfW &&
        Math.abs(gesture.fromY - slot.y) <= halfH
      ) {
        draggedItem = item;
        break;
      }
    }

    if (!draggedItem) {
      return null;
    }

    const targetHalfW =
      Math.max(containerSlot.hitW, containerSlot.w, 240) / 2 + hitTolerance;
    const targetHalfH =
      Math.max(containerSlot.hitH, containerSlot.h, 120) / 2 + hitTolerance;

    if (
      Math.abs(gesture.toX - containerSlot.x) <= targetHalfW &&
      Math.abs(gesture.toY - containerSlot.y) <= targetHalfH
    ) {
      return {
        type: "drop_item",
        data: {
          item_id: draggedItem.item_id,
          container_id: this.content.container.container_id,
        },
      };
    }

    return null;
  }

  private handleTapContainer(
    gesture: Extract<Gesture, { type: "tap" }>,
    containerSlot: Slot | undefined,
    hitTolerance: number
  ): GameAction | null {
    if (!containerSlot) {
      return null;
    }
    const targetHalfW =
      Math.max(containerSlot.hitW, containerSlot.w, 240) / 2 + hitTolerance;
    const targetHalfH =
      Math.max(containerSlot.hitH, containerSlot.h, 120) / 2 + hitTolerance;
    if (
      Math.abs(gesture.x - containerSlot.x) <= targetHalfW &&
      Math.abs(gesture.y - containerSlot.y) <= targetHalfH
    ) {
      const stagedId = this.getStagedItemId();
      if (stagedId) {
        return {
          type: "tap_tap_item",
          data: {
            item_id: stagedId,
            container_id: this.content.container.container_id,
          },
        };
      }
    }
    return null;
  }

  private handleTapItem(
    gesture: Extract<Gesture, { type: "tap" }>,
    hitTolerance: number
  ): void {
    for (let i = 0; i < this.displayItems.length; i++) {
      const slot = this.slots[i];
      const item = this.displayItems[i];
      if (!(slot && item)) {
        continue;
      }
      const halfW = Math.max(slot.hitW, slot.w) / 2 + hitTolerance;
      const halfH = Math.max(slot.hitH, slot.h) / 2 + hitTolerance;
      if (
        Math.abs(gesture.x - slot.x) <= halfW &&
        Math.abs(gesture.y - slot.y) <= halfH
      ) {
        if (this.getStagedItemId() === item.item_id) {
          this.stageItem(null);
        } else {
          this.stageItem(item.item_id);
        }
        return;
      }
    }
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>,
    containerSlot: Slot | undefined,
    hitTolerance: number
  ): GameAction | null {
    const containerAction = this.handleTapContainer(
      gesture,
      containerSlot,
      hitTolerance
    );
    if (containerAction) {
      return containerAction;
    }
    this.handleTapItem(gesture, hitTolerance);
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    const hitTolerance = 24;
    const containerSlot = this.slots.at(-1);

    if (gesture.type === "drop") {
      if (!containerSlot) {
        return null;
      }
      return this.toDropAction(gesture, containerSlot, hitTolerance);
    }

    if (gesture.type === "tap") {
      return this.toTapAction(gesture, containerSlot, hitTolerance);
    }

    return null;
  }

  override commit(action: GameAction): void {
    if (
      (action.type === "drop_item" || action.type === "tap_tap_item") &&
      action.data &&
      typeof action.data === "object"
    ) {
      const data = action.data as {
        item_id?: string;
        container_id?: string;
      };
      if (data.item_id && data.container_id) {
        this.onItemDropped(data.item_id, data.container_id);
        this.stageItem(null);
      }
    }
  }

  override checkWinCondition(): boolean {
    const items = this.content.items
      .filter((i) => i.is_correct)
      .map((i) => ({
        id: i.item_id,
        targetId: this.content.container.container_id,
        isCorrect: true,
      }));
    return this.mechanic.isPlacementComplete(items);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const slots = this.slots;
    drawSceneBackground(ctx, rs, this.themeId);
    drawPromptText(ctx, rs, this.content.prompt);
    this.drawContainer(rs, ctx, slots);
    this.drawInteractive(rs, ctx, slots);
    this.drawFeedback(rs, ctx, timeMs);
  }

  private drawContainer(
    _rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    slots: readonly Slot[]
  ): void {
    const containerSlot = slots.at(-1);
    if (!containerSlot) {
      return;
    }
    const placements = this.mechanic.getPlacements();
    const placedItems = this.content.items.filter((i) =>
      placements.has(i.item_id)
    );
    const targetCount =
      this.difficulty.target_count ||
      this.content.items.filter((i) => i.is_correct).length;

    drawNestTarget(ctx, containerSlot, {
      label: this.content.container.label || "Chuồng gà",
      placedItems,
      targetCount,
      isHovered: this.hoveredContainer,
    });
  }

  private drawInteractive(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    slots: readonly Slot[]
  ): void {
    const sourceSlots = slots.slice(0, -1);
    const placements = this.mechanic.getPlacements();

    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = sourceSlots[i];
      if (!(slot && item)) {
        continue;
      }
      const isPlaced = placements.has(item.item_id);
      const state = isPlaced ? "locked" : this.getItemState(item.item_id);

      ctx.save();
      if (isPlaced) {
        ctx.globalAlpha = 0.35;
      }
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
      ctx.restore();
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

export default GT003Session;
