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
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import {
  type AssemblyPlacementResult,
  AssemblySystem,
} from "#src/systems/assembly-system";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawEmptyTargetSlot,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSlotLabel,
  type ItemVisualState,
  updateParticles,
} from "../shared-render.js";
import { slotAtPoint } from "../shared-render-shapes.js";
import type { GT023Content, GT023Difficulty } from "./template.js";

export class GT023Session extends TemplateGameSession<
  GT023Content,
  GT023Difficulty
> {
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  readonly assemblySystem = new AssemblySystem();
  private readonly placementMechanic = new PlacementMechanic();

  setupEntities(): void {
    this.isWon = false;
    this.placementMechanic.reset();

    const anchors = this.content.anchors.map((a) => ({
      anchorId: a.anchor_id,
      x: a.x,
      y: a.y,
      acceptedPartId: a.accepted_part_id,
      label: a.label,
    }));

    const parts = this.content.parts.map((p) => ({
      partId: p.part_id,
      targetAnchorId: p.target_anchor_id,
      name: p.name,
    }));

    this.assemblySystem.init(anchors, parts);

    this.recordEvent("round_started", {
      round_index: 0,
      anchor_count: anchors.length,
      part_count: parts.length,
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (
      action.type === "place_item" ||
      action.type === "drop_item" ||
      action.type === "tap_tap_item"
    ) {
      const data = action.data as
        | { item_id?: string; target_id?: string }
        | undefined;
      const partId = data?.item_id;
      const anchorId = data?.target_id;

      if (!(partId && anchorId)) {
        return ACTION_IGNORED;
      }

      const anchor = this.assemblySystem.getAnchor(anchorId);
      const part = this.assemblySystem.getPart(partId);

      if (!(anchor && part)) {
        return ACTION_IGNORED;
      }

      return anchor.acceptedPartId === partId ? ACTION_CORRECT : ACTION_RETRY;
    }

    return ACTION_IGNORED;
  }

  onAssemblePart(partId: string, anchorId: string): AssemblyPlacementResult {
    const result = this.assemblySystem.assemblePart(partId, anchorId);

    if (result.valid) {
      this.placementMechanic.place(partId, anchorId);

      this.recordEvent("item_placed", {
        part_id: partId,
        anchor_id: anchorId,
        is_anchor_match: result.isAnchorMatch,
      });

      if (this.checkWinCondition()) {
        this.recordEvent("round_completed", { round_index: 0 });
        this.winSession();
      }
    }

    return result;
  }

  onSnapPart(
    partId: string,
    x: number,
    y: number
  ): AssemblyPlacementResult | null {
    const snapRadius = this.difficulty.snap_radius_px;
    const nearest = this.assemblySystem.findNearestAnchor(x, y, snapRadius);
    if (!nearest) {
      return null;
    }
    return this.onAssemblePart(partId, nearest.anchorId);
  }

  override checkWinCondition(): boolean {
    return this.assemblySystem.isAllAssembled();
  }

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("top-source-bottom-target");
    this.slots = layoutFn({
      slotCount: this.content.parts.length,
      targetCount: this.content.anchors.length,
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
    const sources = this.slots.filter((s) => s.role === "source");
    const placements = this.assemblySystem.getPlacements();
    const partById = new Map(this.content.parts.map((p) => [p.part_id, p]));
    const placedPartIds = new Set(placements.values());

    // Mỏ neo có toạ độ riêng trong content — đó là hình dạng của mô hình đích.
    for (const anchor of this.content.anchors) {
      const slot = slotAtPoint(anchor.x, anchor.y);
      const partId = placements.get(anchor.anchor_id);
      const part = partId ? partById.get(partId) : undefined;
      if (!part) {
        drawEmptyTargetSlot(ctx, slot);
        if (anchor.label) {
          drawSlotLabel(ctx, anchor.label, slot);
        }
        continue;
      }
      drawSlotItem(ctx, rs, slot, {
        id: part.part_id,
        asset: part.asset,
        state: "correct",
      });
    }

    this.content.parts.forEach((part, i) => {
      const slot = sources[i];
      if (!slot || placedPartIds.has(part.part_id)) {
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: part.part_id,
        asset: part.asset,
        label: part.name,
        state: this.getRenderItemState(part.part_id),
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

export default GT023Session;
