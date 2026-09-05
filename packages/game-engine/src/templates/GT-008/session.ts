import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import {
  boxFromSlots,
  drawEmptyTargetSlot,
  drawPromptText,
  drawSceneBackground,
  drawShapeTray,
  drawSlotItem,
  drawSlotLabel,
  drawWoodenTokenDock,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT008Content, GT008Difficulty } from "./template.js";

function extractSlotData(
  data: unknown
): { item_id: string; slot_id: string } | undefined {
  if (
    typeof data === "object" &&
    data !== null &&
    "item_id" in data &&
    "slot_id" in data
  ) {
    const itemId = Reflect.get(data, "item_id");
    const slotId = Reflect.get(data, "slot_id");
    if (typeof itemId === "string" && typeof slotId === "string") {
      return { item_id: itemId, slot_id: slotId };
    }
  }
  return undefined;
}

export class GT008Session extends TemplateGameSession<
  GT008Content,
  GT008Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();
  private stagedItemId: string | null = null;

  placedSlots: Map<string, string> = new Map(); // slot_id -> item_id

  setupEntities(): void {
    this.placedSlots.clear();
    this.stagedItemId = null;
    this.isWon = false;
    this.renderParticles = [];
  }

  getStagedItemId(): string | null {
    return this.stagedItemId;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "place_item" || action.type === "drop_to_slot") {
      const data = extractSlotData(action.data);
      if (!data) {
        return ACTION_RETRY;
      }
      const slot = this.content.slots.find((s) => s.slot_id === data.slot_id);

      if (!slot) {
        return ACTION_RETRY;
      }

      if (slot.expected_item_id === data.item_id) {
        return ACTION_CORRECT;
      }

      return ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  onItemPlaced(itemId: string, slotId: string): void {
    const slotDef = this.content.slots.find((s) => s.slot_id === slotId);
    if (!slotDef) {
      return;
    }

    const isCorrect = slotDef.expected_item_id === itemId;

    this.recordEvent("item_placed", {
      item_id: itemId,
      slot_id: slotId,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.placedSlots.set(slotId, itemId);
      const slotDefIdx = this.content.slots.findIndex(
        (s) => s.slot_id === slotId
      );
      const targets = this.slots.filter((s) => s.role === "target");
      const targetSlot = targets[slotDefIdx];
      if (targetSlot) {
        this.renderParticles.push(...spawnParticlesAtSlot(targetSlot, 12));
      }
      if (this.checkWinCondition()) {
        this.winSession();
      }
    }
  }

  override checkWinCondition(): boolean {
    if (this.content.slots.length === 0) {
      return true;
    }

    return this.content.slots.every((s) => {
      const placed = this.placedSlots.get(s.slot_id);
      return placed === s.expected_item_id;
    });
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("horizontal-slot-track");
    return layoutFn({
      slotCount: this.content.items.length,
      targetCount: this.content.slots.length,
      ageBand,
    });
  }

  private findDraggedItem(
    x: number,
    y: number,
    sources: readonly Slot[],
    hitTolerance: number
  ): GT008Content["items"][number] | null {
    const placedItemIds = new Set(this.placedSlots.values());
    for (let i = 0; i < this.content.items.length; i++) {
      const item = this.content.items[i];
      const slot = sources[i];
      if (!(item && slot) || placedItemIds.has(item.item_id)) {
        continue;
      }
      const halfW = Math.max(slot.hitW, slot.w) / 2 + hitTolerance;
      const halfH = Math.max(slot.hitH, slot.h) / 2 + hitTolerance;
      if (Math.abs(x - slot.x) <= halfW && Math.abs(y - slot.y) <= halfH) {
        return item;
      }
    }
    return null;
  }

  private findTargetSlot(
    x: number,
    y: number,
    targets: readonly Slot[],
    hitTolerance: number
  ): GT008Content["slots"][number] | null {
    for (let i = 0; i < this.content.slots.length; i++) {
      const slotDef = this.content.slots[i];
      const slot = targets[i];
      if (!(slotDef && slot) || this.placedSlots.has(slotDef.slot_id)) {
        continue;
      }
      const halfW = Math.max(slot.hitW, slot.w) / 2 + hitTolerance;
      const halfH = Math.max(slot.hitH, slot.h) / 2 + hitTolerance;
      if (Math.abs(x - slot.x) <= halfW && Math.abs(y - slot.y) <= halfH) {
        return slotDef;
      }
    }
    return null;
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const item = this.findDraggedItem(
      gesture.fromX,
      gesture.fromY,
      sources,
      hitTolerance
    );
    if (!item) {
      return null;
    }
    const target = this.findTargetSlot(
      gesture.toX,
      gesture.toY,
      targets,
      hitTolerance
    );
    if (!target) {
      return null;
    }
    return {
      type: "place_item",
      data: { item_id: item.item_id, slot_id: target.slot_id },
    };
  }

  private handleTapTarget(
    target: GT008Content["slots"][number]
  ): GameAction | null {
    if (!this.stagedItemId) {
      return null;
    }
    return {
      type: "place_item",
      data: { item_id: this.stagedItemId, slot_id: target.slot_id },
    };
  }

  private handleTapSource(item: GT008Content["items"][number]): null {
    if (this.stagedItemId === item.item_id) {
      this.stagedItemId = null;
    } else {
      this.stagedItemId = item.item_id;
    }
    return null;
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const target = this.findTargetSlot(
      gesture.x,
      gesture.y,
      targets,
      hitTolerance
    );
    if (target && this.stagedItemId) {
      return this.handleTapTarget(target);
    }
    const item = this.findDraggedItem(
      gesture.x,
      gesture.y,
      sources,
      hitTolerance
    );
    if (item) {
      return this.handleTapSource(item);
    }
    this.stagedItemId = null;
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    const hitTolerance = 24;
    const sources = this.slots.filter((s) => s.role === "source");
    const targets = this.slots.filter((s) => s.role === "target");

    if (gesture.type === "drop") {
      return this.toDropAction(gesture, sources, targets, hitTolerance);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture, sources, targets, hitTolerance);
    }
    return null;
  }

  override commit(action: GameAction): void {
    const result = this.validateAction(action);
    const data = extractSlotData(action.data);

    if (result.valid && data) {
      this.onItemPlaced(data.item_id, data.slot_id);
      this.stagedItemId = null;
      return;
    }

    if (data) {
      this.recordEvent("item_placed", {
        item_id: data.item_id,
        slot_id: data.slot_id,
        is_correct: false,
      });
    }
  }

  override getView(): EngineView {
    const targets = this.slots.filter((s) => s.role === "target");
    const sources = this.slots.filter((s) => s.role === "source");
    const placedItemIds = new Set(this.placedSlots.values());
    const entities: ViewEntity[] = [];

    this.content.slots.forEach((defSlot, i) => {
      const slot = targets[i];
      if (!slot) {
        return;
      }
      const isPlaced = this.placedSlots.has(defSlot.slot_id);
      entities.push({
        id: defSlot.slot_id,
        slotIndex: this.slots.indexOf(slot),
        role: "target",
        state: isPlaced ? "correct" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    });

    this.content.items.forEach((item, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      const isPlaced = placedItemIds.has(item.item_id);
      const isStaged = this.stagedItemId === item.item_id;
      entities.push({
        id: item.item_id,
        slotIndex: this.slots.indexOf(slot),
        role: "source",
        state: this.toSourceEntityState(isPlaced, isStaged),
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    });

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  private toSourceEntityState(
    isPlaced: boolean,
    isStaged: boolean
  ): ViewEntity["state"] {
    if (isPlaced) {
      return "correct";
    }
    if (isStaged) {
      return "selected";
    }
    return "idle";
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
    const targets = this.slots.filter((s) => s.role === "target");
    const sources = this.slots.filter((s) => s.role === "source");
    const targetBox = boxFromSlots(targets);
    if (targetBox) {
      drawShapeTray(ctx, targetBox);
    }
    if (sources.length > 0) {
      drawWoodenTokenDock(ctx, rs);
    }
    const itemById = new Map(this.content.items.map((i) => [i.item_id, i]));
    const placedItemIds = new Set(this.placedSlots.values());

    this.content.slots.forEach((defSlot, i) => {
      const slot = targets[i];
      if (!slot) {
        return;
      }
      const placedId = this.placedSlots.get(defSlot.slot_id);
      const placed = placedId ? itemById.get(placedId) : undefined;
      if (!placed) {
        drawEmptyTargetSlot(ctx, slot);
        if (defSlot.label) {
          drawSlotLabel(ctx, defSlot.label, slot);
        }
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: placed.item_id,
        asset: placed.asset,
        label: defSlot.label,
        state: "correct",
      });
    });

    this.content.items.forEach((item, i) => {
      const slot = sources[i];
      if (!slot || placedItemIds.has(item.item_id)) {
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: item.item_id,
        asset: item.asset,
        label: item.label,
        state: this.getRenderItemState(item.item_id),
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

export default GT008Session;
