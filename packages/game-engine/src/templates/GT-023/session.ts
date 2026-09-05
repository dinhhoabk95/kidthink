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
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import {
  drawEmptyTargetSlot,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSlotLabel,
  type ItemVisualState,
  slotAtPoint,
  updateParticles,
} from "#src/render/index.js";
import {
  type AssemblyPlacementResult,
  AssemblySystem,
} from "#src/systems/assembly-system";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT023Content, GT023Difficulty } from "./template.js";

interface HitSourcePart {
  readonly part: GT023Content["parts"][number];
  readonly slot: Slot;
}

function findHitSourcePart(
  slots: readonly Slot[],
  parts: readonly GT023Content["parts"][number][],
  placements: ReadonlyMap<string, string>,
  x: number,
  y: number,
  tolerance = 24
): HitSourcePart | null {
  const sources = slots.filter((s) => s.role === "source");
  const placedPartIds = new Set(placements.values());
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const slot = sources[i];
    if (!(part && slot) || placedPartIds.has(part.part_id)) {
      continue;
    }
    const hw = Math.max(slot.hitW, slot.w) / 2 + tolerance;
    const hh = Math.max(slot.hitH, slot.h) / 2 + tolerance;
    if (Math.abs(x - slot.x) <= hw && Math.abs(y - slot.y) <= hh) {
      return { part, slot };
    }
  }
  return null;
}

function findHitAnchor(
  anchors: readonly GT023Content["anchors"][number][],
  x: number,
  y: number,
  snapRadius = 60,
  tolerance = 24
): GT023Content["anchors"][number] | null {
  const maxDist = Math.max(snapRadius, 64) + tolerance;
  for (const anchor of anchors) {
    if (!anchor) {
      continue;
    }
    const dist = Math.hypot(anchor.x - x, anchor.y - y);
    if (dist <= maxDist) {
      return anchor;
    }
  }
  return null;
}

export class GT023Session extends TemplateGameSession<
  GT023Content,
  GT023Difficulty
> {
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

  getStagedItemId(): string | null {
    return this.placementMechanic.getStagedItemId();
  }

  getPlacements(): ReadonlyMap<string, string> {
    return this.assemblySystem.getPlacements();
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const hitSource = findHitSourcePart(
      this.slots,
      this.content.parts,
      this.assemblySystem.getPlacements(),
      gesture.fromX,
      gesture.fromY
    );
    if (!hitSource) {
      return null;
    }
    const hitAnchor = findHitAnchor(
      this.content.anchors,
      gesture.toX,
      gesture.toY,
      this.difficulty.snap_radius_px
    );
    if (!hitAnchor) {
      return null;
    }
    return {
      type: "drop_item",
      data: {
        item_id: hitSource.part.part_id,
        target_id: hitAnchor.anchor_id,
      },
    };
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const stagedId = this.placementMechanic.getStagedItemId();

    if (stagedId) {
      const hitAnchor = findHitAnchor(
        this.content.anchors,
        gesture.x,
        gesture.y,
        this.difficulty.snap_radius_px
      );
      if (hitAnchor) {
        return {
          type: "tap_tap_item",
          data: {
            item_id: stagedId,
            target_id: hitAnchor.anchor_id,
          },
        };
      }
    }

    const hitSource = findHitSourcePart(
      this.slots,
      this.content.parts,
      this.assemblySystem.getPlacements(),
      gesture.x,
      gesture.y
    );
    if (hitSource) {
      if (stagedId === hitSource.part.part_id) {
        this.placementMechanic.stageItem(null);
      } else {
        this.placementMechanic.stageItem(hitSource.part.part_id);
      }
      return null;
    }

    this.placementMechanic.stageItem(null);
    return null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "drop") {
      return this.toDropAction(gesture);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture);
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (
      action.type === "place_item" ||
      action.type === "drop_item" ||
      action.type === "tap_tap_item"
    ) {
      const data = action.data as
        | { item_id?: string; target_id?: string }
        | undefined;
      const itemId = data?.item_id;
      const targetId = data?.target_id;
      if (itemId && targetId) {
        this.onAssemblePart(itemId, targetId);
        if (this.placementMechanic.getStagedItemId() === itemId) {
          this.placementMechanic.stageItem(null);
        }
      }
    }
  }

  override getView(): EngineView {
    const placements = this.assemblySystem.getPlacements();
    const sources = this.slots.filter((s) => s.role === "source");
    const stagedId = this.placementMechanic.getStagedItemId();
    const placedPartIds = new Set(placements.values());
    const entities: ViewEntity[] = [];

    for (let i = 0; i < this.content.anchors.length; i++) {
      const anchor = this.content.anchors[i];
      if (!anchor) {
        continue;
      }
      const isPlaced = placements.has(anchor.anchor_id);
      entities.push({
        id: anchor.anchor_id,
        slotIndex: i,
        role: "target",
        state: isPlaced ? "correct" : "idle",
        x: anchor.x,
        y: anchor.y,
        w: 80,
        h: 80,
      });
    }

    for (let i = 0; i < this.content.parts.length; i++) {
      const part = this.content.parts[i];
      const slot = sources[i];
      if (!(part && slot)) {
        continue;
      }
      const isPlaced = placedPartIds.has(part.part_id);
      let state: EntityVisual = "idle";
      if (isPlaced) {
        state = "correct";
      } else if (part.part_id === stagedId) {
        state = "selected";
      }
      entities.push({
        id: part.part_id,
        slotIndex: slot.index,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("top-source-bottom-target");
    return layoutFn({
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
