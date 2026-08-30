import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawEmojiContent,
  drawPlaceholderBox,
  drawPromptText,
  drawSceneBackground,
  getColorsForState,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "../shared-render.js";
import type { GT003Content, GT003Difficulty } from "./template.js";

type DraggableItem = GT003Content["items"][number];

export class GT003Session extends TemplateGameSession<
  GT003Content,
  GT003Difficulty
> {
  displayItems: readonly DraggableItem[] = [];
  private readonly mechanic = new PlacementMechanic();
  slots: readonly Slot[] = [];
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

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("top-source-bottom-target");
    // `slotCount` của bố cục lưỡng phân là số slot **nguồn**, còn `targetCount`
    // là số slot đích — layout tự cộng hai vế. Cộng thêm 1 vào `slotCount` như
    // bản trước sinh dư một slot nguồn không có vật nào để đặt vào.
    this.slots = layoutFn({
      slotCount: this.displayItems.length,
      ageBand,
      targetCount: 1,
    });
  }

  setItemState(itemId: string, state: ItemVisualState): void {
    this.itemStates.set(itemId, state);
  }

  private getItemState(itemId: string): ItemVisualState {
    return this.itemStates.get(itemId) ?? "idle";
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
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    slots: readonly Slot[]
  ): void {
    const containerSlot = slots.at(-1);
    if (!containerSlot) {
      return;
    }
    rs.drawClayContainer(
      ctx,
      containerSlot.x,
      containerSlot.y,
      containerSlot.hitW,
      containerSlot.hitH,
      designTokens.colors.surface[100],
      designTokens.colors.surface[300]
    );
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
      if (state === "correct") {
        continue;
      }
      const { fill, border } = getColorsForState(state);
      const r = Math.min(slot.hitW, slot.hitH) / 2;
      rs.drawClayBody(ctx, slot.x, slot.y, r, fill, border);

      if (item.asset.kind === "emoji") {
        drawEmojiContent(ctx, item.asset.ref, slot);
      } else {
        drawPlaceholderBox(ctx, slot);
      }
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
