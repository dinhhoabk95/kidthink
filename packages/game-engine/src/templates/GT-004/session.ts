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
  drawBasketSlot,
  drawEmptyTargetSlot,
  drawGlyphInSlot,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  updateParticles,
} from "#src/render/index.js";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT004Content, GT004Difficulty } from "./template.js";

type SortItem = GT004Content["items"][number];

export class GT004Session extends TemplateGameSession<
  GT004Content,
  GT004Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  displayItems: readonly SortItem[] = [];
  private readonly mechanic = new PlacementMechanic();

  setupEntities(): void {
    this.mechanic.reset();
    this.isWon = false;
    if (this.difficulty.shuffle_items === false) {
      this.displayItems = [...this.content.items];
    } else {
      const rng = deriveStream(this.layoutSeed, "items");
      this.displayItems = shuffle(this.content.items, rng);
    }
  }

  private findItem(itemId: string) {
    return this.content.items.find((i) => i.item_id === itemId);
  }

  validateAction(action: GameAction): ActionResult {
    const items = this.content.items.map((i) => ({
      id: i.item_id,
      targetId: i.correct_group_id,
      isCorrect: true,
    }));
    return this.mechanic.validate(action, items, (gId) =>
      this.content.groups.some((g) => g.group_id === gId)
    );
  }

  onItemSorted(itemId: string, groupId: string): void {
    const item = this.findItem(itemId);
    if (!item) {
      return;
    }

    const isCorrect = item.correct_group_id === groupId;
    this.recordEvent("item_sorted", {
      item_id: itemId,
      group_id: groupId,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.mechanic.place(itemId, groupId);
      if (this.checkWinCondition()) {
        this.winSession();
      }
    }
  }

  override checkWinCondition(): boolean {
    const items = this.content.items.map((i) => ({
      id: i.item_id,
      targetId: i.correct_group_id,
      isCorrect: true,
    }));
    return this.mechanic.isPlacementComplete(items);
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("multi-bucket-bottom");
    return layoutFn({
      slotCount: this.displayItems.length,
      targetCount: this.content.groups.length,
      ageBand,
    });
  }

  private toItemEntityState(
    stagedItemId: string | null,
    itemId: string,
    rawState: ItemVisualState
  ): ViewEntity["state"] {
    if (stagedItemId === itemId || rawState === "selected") {
      return "selected";
    }
    if (rawState === "correct") {
      return "correct";
    }
    if (rawState === "wrong") {
      return "incorrect";
    }
    return "idle";
  }

  private buildSourceEntities(sources: readonly Slot[]): ViewEntity[] {
    const stagedId = this.mechanic.getStagedItemId();
    const result: ViewEntity[] = [];
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = sources[i];
      if (!(item && slot)) {
        continue;
      }
      result.push({
        id: item.item_id,
        slotIndex: this.slots.indexOf(slot),
        role: "source",
        state: this.toItemEntityState(
          stagedId,
          item.item_id,
          this.getRenderItemState(item.item_id)
        ),
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }
    return result;
  }

  private buildTargetEntities(targets: readonly Slot[]): ViewEntity[] {
    const result: ViewEntity[] = [];
    for (let i = 0; i < this.content.groups.length; i++) {
      const group = this.content.groups[i];
      const slot = targets[i];
      if (!(group && slot)) {
        continue;
      }
      result.push({
        id: group.group_id,
        slotIndex: this.slots.indexOf(slot),
        role: "target",
        state: "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }
    return result;
  }

  override getView(): EngineView {
    const sources = this.slots.filter((s) => s.role === "source");
    const targets = this.slots.filter((s) => s.role === "target");

    return {
      entities: [
        ...this.buildSourceEntities(sources),
        ...this.buildTargetEntities(targets),
      ],
      activePrompt: this.content.prompt,
    };
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    let draggedItem: SortItem | null = null;
    for (let i = 0; i < this.displayItems.length; i++) {
      const slot = sources[i];
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

    for (let i = 0; i < this.content.groups.length; i++) {
      const slot = targets[i];
      const group = this.content.groups[i];
      if (!(slot && group)) {
        continue;
      }
      const halfW = Math.max(slot.hitW, slot.w, 140) / 2 + hitTolerance;
      const halfH = Math.max(slot.hitH, slot.h, 100) / 2 + hitTolerance;
      if (
        Math.abs(gesture.toX - slot.x) <= halfW &&
        Math.abs(gesture.toY - slot.y) <= halfH
      ) {
        return {
          type: "sort_item",
          data: {
            item_id: draggedItem.item_id,
            group_id: group.group_id,
          },
        };
      }
    }

    return null;
  }

  private handleTapTarget(
    gesture: Extract<Gesture, { type: "tap" }>,
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const stagedId = this.mechanic.getStagedItemId();
    if (!stagedId) {
      return null;
    }

    for (let i = 0; i < this.content.groups.length; i++) {
      const slot = targets[i];
      const group = this.content.groups[i];
      if (!(slot && group)) {
        continue;
      }
      const halfW = Math.max(slot.hitW, slot.w, 140) / 2 + hitTolerance;
      const halfH = Math.max(slot.hitH, slot.h, 100) / 2 + hitTolerance;
      if (
        Math.abs(gesture.x - slot.x) <= halfW &&
        Math.abs(gesture.y - slot.y) <= halfH
      ) {
        return {
          type: "sort_item",
          data: {
            item_id: stagedId,
            group_id: group.group_id,
          },
        };
      }
    }
    return null;
  }

  private handleTapSource(
    gesture: Extract<Gesture, { type: "tap" }>,
    sources: readonly Slot[],
    hitTolerance: number
  ): void {
    for (let i = 0; i < this.displayItems.length; i++) {
      const slot = sources[i];
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
        if (this.mechanic.getStagedItemId() === item.item_id) {
          this.mechanic.stageItem(null);
        } else {
          this.mechanic.stageItem(item.item_id);
        }
        return;
      }
    }
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>,
    sources: readonly Slot[],
    targets: readonly Slot[],
    hitTolerance: number
  ): GameAction | null {
    const targetAction = this.handleTapTarget(gesture, targets, hitTolerance);
    if (targetAction) {
      return targetAction;
    }
    this.handleTapSource(gesture, sources, hitTolerance);
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
    if (
      action.type === "sort_item" &&
      action.data &&
      typeof action.data === "object"
    ) {
      const data = action.data as { item_id?: string; group_id?: string };
      if (data.item_id && data.group_id) {
        this.onItemSorted(data.item_id, data.group_id);
        this.mechanic.stageItem(null);
      }
    }
  }

  setRenderItemState(itemId: string, state: ItemVisualState): void {
    this.renderItemStates.set(itemId, state);
  }

  getPlacements(): ReadonlyMap<string, string> {
    return this.mechanic.getPlacements();
  }

  getStagedItemId(): string | null {
    return this.mechanic.getStagedItemId();
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
    const targets = this.slots.filter((s) => s.role === "target");
    const sources = this.slots.filter((s) => s.role === "source");
    const placements = this.mechanic.getPlacements();

    this.content.groups.forEach((group, i) => {
      const slot = targets[i];
      if (!slot) {
        return;
      }
      const rimColor =
        i === 0
          ? designTokens.colors.montessori.coral
          : designTokens.colors.montessori.amber;
      drawBasketSlot(ctx, slot, group.label, rimColor);
      drawGlyphInSlot(ctx, group.label_emoji, slot);
    });

    this.displayItems.forEach((item, i) => {
      const slot = sources[i];
      if (!slot) {
        return;
      }
      const placedIn = placements.get(item.item_id);
      if (placedIn) {
        drawEmptyTargetSlot(ctx, slot);
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: item.item_id,
        asset: item.asset,
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

export default GT004Session;
