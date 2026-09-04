import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "../shared-render.js";
import { drawNestTarget } from "../shared-render-shapes.js";
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
    drawSceneBackground(ctx, rs);
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
