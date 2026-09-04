import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import { designTokens } from "#src/systems/designTokens";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawEmptyTargetSlot,
  drawGlyphInSlot,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  updateParticles,
} from "../shared-render.js";
import { drawBasketSlot } from "../shared-render-shapes.js";
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
