import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawEmptyTargetSlot,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSlotLabel,
  drawWoodenTokenDock,
  type ItemVisualState,
  spawnParticlesAtSlot,
  updateParticles,
} from "../shared-render.js";
import { boxFromSlots, drawShapeTray } from "../shared-render-shapes.js";
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
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  placedSlots: Map<string, string> = new Map(); // slot_id -> item_id

  setupEntities(): void {
    this.placedSlots.clear();
    this.isWon = false;
    this.renderParticles = [];
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

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("horizontal-slot-track");
    this.slots = layoutFn({
      slotCount: this.content.items.length,
      targetCount: this.content.slots.length,
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
