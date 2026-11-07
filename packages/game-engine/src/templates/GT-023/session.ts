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
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import { resolveTouchFloor } from "#src/layout/constants";
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import {
  computeTraySourceSlots,
  findNearestHitSlot,
  pickTrayZones,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import {
  drawEmptyTargetSlot,
  drawSceneBackground,
  drawSlotItem,
  drawSlotLabel,
  drawWoodenTokenDock,
  slotAtPoint,
} from "#src/render/index.js";
import {
  type AssemblyPlacementResult,
  AssemblySystem,
} from "#src/systems/assembly-system";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT023Content, GT023Difficulty } from "./template.js";

interface HitSourcePart {
  readonly part: GT023Content["parts"][number];
  readonly slot: Slot;
}

/** Bán kính hút tối thiểu quanh mỏ neo, dù `snap_radius_px` nhỏ hơn. */
const MIN_SNAP_RADIUS_PX = 64;

/** Cạnh ô mỏ neo lớn nhất trên sân khấu. */
const ANCHOR_CELL_MAX_PX = 96;

/** Cỡ thực thể mỏ neo ở bố cục cũ, nơi mỏ neo đứng ở toạ độ của content. */
const LEGACY_ANCHOR_VIEW_PX = 80;

function findHitSourcePart(
  slots: readonly Slot[],
  parts: readonly GT023Content["parts"][number][],
  placements: ReadonlyMap<string, string>,
  x: number,
  y: number,
  tolerance = TAP_TOLERANCE_PX
): HitSourcePart | null {
  const sources = slots.filter((s) => s.role === "source");
  const placedPartIds = new Set(placements.values());
  const open = parts.flatMap((part, i) => {
    const slot = sources[i];
    return slot && !placedPartIds.has(part.part_id) ? [{ part, slot }] : [];
  });
  const hit = findNearestHitSlot(
    open.map((entry) => entry.slot),
    x,
    y,
    tolerance
  );
  return open[hit] ?? null;
}

export class GT023Session extends TemplateGameSession<
  GT023Content,
  GT023Difficulty
> {
  degradation: DegradationState | null = null;

  readonly assemblySystem = new AssemblySystem();
  private readonly placementMechanic = new PlacementMechanic();
  private partById: Map<string, GT023Content["parts"][number]> = new Map();
  private wrongPartId: string | null = null;
  private wrongTimestamp = 0;
  private lastFrameMs = 0;

  /** Mảnh nằm trong khay, mỏ neo đứng trên sân khấu (`BR-PSZ-01`). */
  override readonly needsTray = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return this.content.parts.length;
  }

  override get trayHasLabels(): boolean {
    return this.content.parts.some((part) => Boolean(part.name));
  }
  override readonly usesPromptZone = true;

  setupEntities(): void {
    this.isWon = false;
    this.wrongPartId = null;
    this.wrongTimestamp = 0;
    this.lastFrameMs = 0;
    this.placementMechanic.reset();
    this.partById = new Map(this.content.parts.map((p) => [p.part_id, p]));

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
    if (action.type === "stage_part") {
      return ACTION_IGNORED;
    }

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
      this.wrongPartId = null;
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
    } else {
      this.wrongPartId = partId;
      this.wrongTimestamp = this.lastFrameMs;
      this.setRenderItemState(partId, "wrong");
    }

    return result;
  }

  onSnapPart(
    partId: string,
    x: number,
    y: number
  ): AssemblyPlacementResult | null {
    // Cùng bán kính hút với `findHitAnchor`: hai đường thả không được lệch nhau.
    const snapRadius = Math.max(
      this.difficulty.snap_radius_px,
      MIN_SNAP_RADIUS_PX
    );
    const hitAnchor = this.findHitAnchor(x, y);
    const anchorId =
      hitAnchor?.anchor_id ??
      this.assemblySystem.findNearestAnchor(x, y, snapRadius)?.anchorId;
    if (!anchorId) {
      return null;
    }
    return this.onAssemblePart(partId, anchorId);
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

  /**
   * Slot của mỏ neo `index`. Trong khung năm vùng mỏ neo là ô đích xếp trên sân
   * khấu; ở bố cục cũ nó đứng ở toạ độ riêng của content.
   */
  private anchorSlot(index: number): Slot | null {
    if (pickTrayZones(this.stageRect, this.trayRect)) {
      return this.targetSlots[index] ?? null;
    }
    const anchor = this.content.anchors[index];
    return anchor ? slotAtPoint(anchor.x, anchor.y) : null;
  }

  /** Mỏ neo gần điểm thả nhất trong bán kính hút. */
  private findHitAnchor(
    x: number,
    y: number
  ): GT023Content["anchors"][number] | null {
    const maxDist =
      Math.max(this.difficulty.snap_radius_px, MIN_SNAP_RADIUS_PX) +
      TAP_TOLERANCE_PX;
    let best: GT023Content["anchors"][number] | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    this.content.anchors.forEach((anchor, i) => {
      const slot = this.anchorSlot(i);
      const dist = slot ? Math.hypot(slot.x - x, slot.y - y) : maxDist + 1;
      if (dist <= maxDist && dist < bestDist) {
        best = anchor;
        bestDist = dist;
      }
    });
    return best;
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
    const hitAnchor = this.findHitAnchor(gesture.toX, gesture.toY);
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
      const hitAnchor = this.findHitAnchor(gesture.x, gesture.y);
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
      const partId = hitSource.part.part_id;
      if (stagedId === partId) {
        this.placementMechanic.stageItem(null);
      } else {
        this.placementMechanic.stageItem(partId);
      }
      return null;
    }

    if (stagedId) {
      this.placementMechanic.stageItem(null);
      return null;
    }

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
    if (action.type === "stage_part") {
      const data = action.data as { part_id?: string | null } | undefined;
      const partId = data?.part_id ?? null;
      if (partId && this.placementMechanic.getStagedItemId() === partId) {
        this.placementMechanic.stageItem(null);
      } else {
        this.placementMechanic.stageItem(partId);
      }
      return;
    }

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

  /** Thực thể mỏ neo: ô đích trên sân khấu, hoặc điểm của content ở bố cục cũ. */
  private toAnchorEntity(
    anchor: GT023Content["anchors"][number],
    index: number,
    isPlaced: boolean,
    usedIds: Set<string>
  ): ViewEntity {
    const state: EntityVisual = isPlaced ? "correct" : "idle";
    const id = usedIds.has(anchor.anchor_id)
      ? `anchor:${anchor.anchor_id}`
      : anchor.anchor_id;
    usedIds.add(id);
    const labelProps = anchor.label
      ? resolveAssetLabels({ kind: "text", text: anchor.label })
      : {};
    const slot = pickTrayZones(this.stageRect, this.trayRect)
      ? this.targetSlots[index]
      : undefined;
    if (!slot) {
      return {
        id,
        slotIndex: index,
        role: "target",
        state,
        x: anchor.x,
        y: anchor.y,
        w: LEGACY_ANCHOR_VIEW_PX,
        h: LEGACY_ANCHOR_VIEW_PX,
        ...labelProps,
      };
    }
    return {
      id,
      slotIndex: this.slots.indexOf(slot),
      role: "target",
      state,
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      ...labelProps,
    };
  }

  override getView(): EngineView {
    const placements = this.assemblySystem.getPlacements();
    const sources = this.sourceSlots;
    const stagedId = this.placementMechanic.getStagedItemId();
    const placedPartIds = new Set(placements.values());
    const entities: ViewEntity[] = [];
    const usedIds = new Set<string>();

    this.content.anchors.forEach((anchor, i) => {
      entities.push(
        this.toAnchorEntity(
          anchor,
          i,
          placements.has(anchor.anchor_id),
          usedIds
        )
      );
    });

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
      const id = usedIds.has(part.part_id)
        ? `part:${part.part_id}`
        : part.part_id;
      usedIds.add(id);
      const assetLabels = resolveAssetLabels(part.asset);
      const nameLabels = part.name
        ? resolveAssetLabels({ kind: "text", text: part.name })
        : {};
      entities.push({
        id,
        slotIndex: slot.index,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        ...assetLabels,
        ...nameLabels,
      });
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon) {
      return null;
    }
    const placements = this.assemblySystem.getPlacements();
    const stagedId = this.placementMechanic.getStagedItemId();
    if (stagedId) {
      const anchorIdx = this.content.anchors.findIndex(
        (a) => !placements.has(a.anchor_id) && a.accepted_part_id === stagedId
      );
      const anchorSlot = this.targetSlots[anchorIdx];
      if (anchorSlot) {
        return this.slots.indexOf(anchorSlot);
      }
    }
    const placedPartIds = new Set(placements.values());
    const unplacedPartIdx = this.content.parts.findIndex(
      (p) => !placedPartIds.has(p.part_id)
    );
    if (unplacedPartIdx >= 0) {
      const slot = this.sourceSlots[unplacedPartIdx];
      return slot ? slot.index : null;
    }
    return null;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
      const parts = computeTraySourceSlots(
        this.content.parts.length,
        zones.tray,
        touchFloor,
        0,
        this.trayHasLabels
      );
      const anchors = computeStageCellSlots({
        count: this.content.anchors.length,
        stage: zones.stage,
        touchFloor,
        maxCell: { w: ANCHOR_CELL_MAX_PX, h: ANCHOR_CELL_MAX_PX },
        role: "target",
        hasLabels: this.content.anchors.some((anchor) => Boolean(anchor.label)),
        firstIndex: parts.length,
      });
      return [...parts, ...anchors];
    }
    const layoutFn = resolveLayout("top-source-bottom-target");
    return layoutFn({
      slotCount: this.content.parts.length,
      targetCount: this.content.anchors.length,
      ageBand,
      logic: this.logicSpace,
    });
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    if (this.wrongPartId && timeMs - this.wrongTimestamp >= 400) {
      this.setRenderItemState(this.wrongPartId, "idle");
      this.wrongPartId = null;
    }
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      // Lời dẫn do shell vẽ; mảnh nằm trên khay của khung năm vùng.
      drawWoodenTokenDock(ctx, rs, zones.tray);
    }
    const sources = this.sourceSlots;
    const placements = this.assemblySystem.getPlacements();
    const partById = this.partById;
    const placedPartIds = new Set(placements.values());

    // Mỏ neo có toạ độ riêng trong content — đó là hình dạng của mô hình đích.
    for (const [anchorIndex, anchor] of this.content.anchors.entries()) {
      const slot = this.anchorSlot(anchorIndex);
      if (!slot) {
        continue;
      }
      const partId = placements.get(anchor.anchor_id);
      const part = partId ? partById.get(partId) : undefined;
      if (!part) {
        drawEmptyTargetSlot(ctx, slot);
        if (anchor.label) {
          drawSlotLabel(ctx, anchor.label, slot, rs);
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
      const isWrong = part.part_id === this.wrongPartId;
      const elapsed = isWrong ? timeMs - this.wrongTimestamp : 0;
      const shakeX =
        isWrong && elapsed < 400 && !rs.reducedMotion
          ? Math.sin(elapsed * 0.05) * 4
          : 0;
      const drawSlot = shakeX === 0 ? slot : { ...slot, x: slot.x + shakeX };

      drawSlotItem(ctx, rs, drawSlot, {
        id: part.part_id,
        asset: part.asset,
        label: part.name,
        state: this.resolveSourcePartState(part.part_id),
      });

      if (isWrong && elapsed < 400) {
        rs.drawRetryRing(
          ctx,
          slot.x + shakeX,
          slot.y,
          Math.min(slot.hitW, slot.hitH) / 2 + 4,
          elapsed / 400
        );
      }
    });
  }

  private resolveSourcePartState(partId: string) {
    const rawState = this.getRenderItemState(partId);
    return this.placementMechanic.getStagedItemId() === partId &&
      rawState === "idle"
      ? "selected"
      : rawState;
  }
}
