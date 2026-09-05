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
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  type FlipAxis,
  isPieceTransformMatch,
  type PieceTransform,
  type RotationAngle90,
  rotatePiece90,
  togglePieceFlip,
} from "#src/systems/rotation-system";
import type { GT019Content, GT019Difficulty } from "./template.js";

type GT019Piece = GT019Content["pieces"][number];

function toRotationAngle(val: number | undefined): RotationAngle90 {
  if (val === 90 || val === 180 || val === 270) {
    return val;
  }
  return 0;
}

function toFlipAxis(val: string | undefined): FlipAxis {
  if (val === "horizontal" || val === "vertical") {
    return val;
  }
  return "none";
}

function isPointInSlot(
  slot: Slot,
  x: number,
  y: number,
  tolerance = 24
): boolean {
  const hw = (slot.hitW ?? slot.w) / 2 + tolerance;
  const hh = (slot.hitH ?? slot.h) / 2 + tolerance;
  return Math.abs(x - slot.x) <= hw && Math.abs(y - slot.y) <= hh;
}

function findHitSourcePiece(
  slots: readonly Slot[],
  pieces: readonly { piece_id: string }[],
  x: number,
  y: number,
  tolerance = 24
): { piece: { piece_id: string }; index: number } | null {
  const sourceSlots = slots.filter((s) => s.role === "source");
  for (let i = 0; i < pieces.length; i++) {
    const slot = sourceSlots[i];
    const piece = pieces[i];
    if (slot && piece && isPointInSlot(slot, x, y, tolerance)) {
      return { piece, index: i };
    }
  }
  return null;
}

function findHitTargetSlot(
  slots: readonly Slot[],
  targets: readonly { slot_id: string }[],
  x: number,
  y: number,
  tolerance = 24
): { target: { slot_id: string }; index: number } | null {
  const targetSlots = slots.filter((s) => s.role === "target");
  for (let i = 0; i < targets.length; i++) {
    const slot = targetSlots[i];
    const target = targets[i];
    if (slot && target && isPointInSlot(slot, x, y, tolerance)) {
      return { target, index: i };
    }
  }
  return null;
}

export class GT019Session extends TemplateGameSession<
  GT019Content,
  GT019Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private readonly placementMechanic = new PlacementMechanic();
  private readonly pieceTransforms: Map<string, PieceTransform> = new Map();
  private pieceById: Map<string, GT019Piece> = new Map();
  private readonly pieceIdBySlotId: Map<string, string> = new Map();
  private readonly placedPieceIds: Set<string> = new Set();

  setupEntities(): void {
    this.isWon = false;
    this.placementMechanic.reset();
    this.pieceTransforms.clear();
    this.pieceById = new Map(this.content.pieces.map((p) => [p.piece_id, p]));
    this.pieceIdBySlotId.clear();
    this.placedPieceIds.clear();

    for (const p of this.content.pieces) {
      this.pieceTransforms.set(p.piece_id, {
        rotation: toRotationAngle(p.initial_rotation),
        flip: toFlipAxis(p.initial_flip),
      });
    }

    this.recordEvent("round_started", {
      round_index: 0,
      piece_count: this.content.pieces.length,
      target_count: this.content.target_slots.length,
    });
  }

  getPieceTransform(pieceId: string): PieceTransform | undefined {
    return this.pieceTransforms.get(pieceId);
  }

  onRotatePiece(
    pieceId: string,
    direction: "cw" | "ccw" = "cw"
  ): PieceTransform | undefined {
    const current = this.pieceTransforms.get(pieceId);
    if (!current) {
      return undefined;
    }
    const updated: PieceTransform = {
      ...current,
      rotation: rotatePiece90(current.rotation, direction),
    };
    this.pieceTransforms.set(pieceId, updated);
    return updated;
  }

  onFlipPiece(
    pieceId: string,
    axis: "horizontal" | "vertical"
  ): PieceTransform | undefined {
    if (!this.difficulty.allow_flip) {
      return undefined;
    }
    const current = this.pieceTransforms.get(pieceId);
    if (!current) {
      return undefined;
    }
    const updated: PieceTransform = {
      ...current,
      flip: togglePieceFlip(current.flip, axis),
    };
    this.pieceTransforms.set(pieceId, updated);
    return updated;
  }

  private validateRotateAction(data: unknown): ActionResult {
    const pieceId =
      typeof data === "object" && data !== null
        ? Reflect.get(data, "piece_id")
        : undefined;
    if (typeof pieceId === "string" && this.pieceTransforms.has(pieceId)) {
      return ACTION_CORRECT;
    }
    return ACTION_IGNORED;
  }

  private validateFlipAction(data: unknown): ActionResult {
    if (!this.difficulty.allow_flip) {
      return ACTION_IGNORED;
    }
    const pieceId =
      typeof data === "object" && data !== null
        ? Reflect.get(data, "piece_id")
        : undefined;
    if (typeof pieceId === "string" && this.pieceTransforms.has(pieceId)) {
      return ACTION_CORRECT;
    }
    return ACTION_IGNORED;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "rotate_piece") {
      return this.validateRotateAction(action.data);
    }

    if (action.type === "flip_piece") {
      return this.validateFlipAction(action.data);
    }

    if (
      action.type === "place_item" ||
      action.type === "drop_item" ||
      action.type === "tap_tap_item"
    ) {
      const items = this.content.pieces.map((p) => {
        const slot = this.content.target_slots.find(
          (s) => s.slot_id === p.target_slot_id
        );
        const transform = this.pieceTransforms.get(p.piece_id) ?? {
          rotation: 0,
          flip: "none",
        };
        const targetTransform: PieceTransform = {
          rotation: toRotationAngle(slot?.target_rotation),
          flip: toFlipAxis(slot?.target_flip),
        };
        const transformMatch = isPieceTransformMatch(
          transform,
          targetTransform
        );
        return {
          id: p.piece_id,
          targetId: p.target_slot_id,
          isCorrect: transformMatch,
        };
      });
      return this.placementMechanic.validate(action, items);
    }

    return ACTION_IGNORED;
  }

  getStagedItemId(): string | null {
    return this.placementMechanic.getStagedItemId();
  }

  stageItem(pieceId: string | null): void {
    this.placementMechanic.stageItem(pieceId);
  }

  getPlacements(): ReadonlyMap<string, string> {
    return this.placementMechanic.getPlacements();
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const hitSource = findHitSourcePiece(
      this.slots,
      this.content.pieces,
      gesture.fromX,
      gesture.fromY
    );
    if (
      !hitSource ||
      this.placementMechanic.getPlacedContainer(hitSource.piece.piece_id)
    ) {
      return null;
    }
    const hitTarget = findHitTargetSlot(
      this.slots,
      this.content.target_slots,
      gesture.toX,
      gesture.toY
    );
    if (!hitTarget) {
      return null;
    }
    return {
      type: "drop_item",
      data: {
        piece_id: hitSource.piece.piece_id,
        target_slot_id: hitTarget.target.slot_id,
        item_id: hitSource.piece.piece_id,
        target_id: hitTarget.target.slot_id,
      },
    };
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const hitTarget = findHitTargetSlot(
      this.slots,
      this.content.target_slots,
      gesture.x,
      gesture.y
    );
    if (hitTarget) {
      const stagedId = this.placementMechanic.getStagedItemId();
      if (stagedId) {
        return {
          type: "tap_tap_item",
          data: {
            piece_id: stagedId,
            target_slot_id: hitTarget.target.slot_id,
            item_id: stagedId,
            target_id: hitTarget.target.slot_id,
          },
        };
      }
      return null;
    }

    const hitSource = findHitSourcePiece(
      this.slots,
      this.content.pieces,
      gesture.x,
      gesture.y
    );
    if (
      hitSource &&
      !this.placementMechanic.getPlacedContainer(hitSource.piece.piece_id)
    ) {
      const stagedId = this.placementMechanic.getStagedItemId();
      if (stagedId === hitSource.piece.piece_id) {
        return {
          type: "rotate_piece",
          data: { piece_id: hitSource.piece.piece_id, direction: "cw" },
        };
      }
      this.placementMechanic.stageItem(hitSource.piece.piece_id);
      return null;
    }

    this.placementMechanic.stageItem(null);
    return null;
  }

  private toAdjustAction(
    gesture: Extract<Gesture, { type: "adjust" }>
  ): GameAction | null {
    const stagedId = this.placementMechanic.getStagedItemId();
    const targetPieceId =
      stagedId ??
      this.content.pieces.find(
        (p) => !this.placementMechanic.getPlacedContainer(p.piece_id)
      )?.piece_id;
    if (!targetPieceId) {
      return null;
    }
    return {
      type: "rotate_piece",
      data: {
        piece_id: targetPieceId,
        direction: gesture.delta >= 0 ? "cw" : "ccw",
      },
    };
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "drop") {
      return this.toDropAction(gesture);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture);
    }
    if (gesture.type === "adjust") {
      return this.toAdjustAction(gesture);
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
        | {
            piece_id?: string;
            target_slot_id?: string;
            item_id?: string;
            target_id?: string;
          }
        | undefined;
      const pieceId = data?.piece_id ?? data?.item_id;
      const slotId = data?.target_slot_id ?? data?.target_id;
      if (pieceId && slotId) {
        this.onPlacePiece(pieceId, slotId);
      }
    } else if (action.type === "rotate_piece") {
      const data = action.data as
        | { piece_id?: string; direction?: "cw" | "ccw" }
        | undefined;
      if (data?.piece_id) {
        this.onRotatePiece(data.piece_id, data.direction ?? "cw");
      }
    } else if (action.type === "flip_piece") {
      const data = action.data as
        | { piece_id?: string; axis?: "horizontal" | "vertical" }
        | undefined;
      if (data?.piece_id) {
        this.onFlipPiece(data.piece_id, data.axis ?? "horizontal");
      }
    }
  }

  override getView(): EngineView {
    const targets = this.targetSlots;
    const sources = this.sourceSlots;
    const placements = this.placementMechanic.getPlacements();
    const stagedId = this.placementMechanic.getStagedItemId();
    const entities: ViewEntity[] = [];

    targets.forEach((slot, i) => {
      const target = this.content.target_slots[i];
      if (target) {
        entities.push({
          id: target.slot_id,
          slotIndex: i,
          role: "target",
          state: "idle",
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
        });
      }
    });

    sources.forEach((slot, i) => {
      const piece = this.content.pieces[i];
      if (piece) {
        const isPlaced = placements.has(piece.piece_id);
        const isStaged = stagedId === piece.piece_id;
        let state: EntityVisual = "idle";
        if (isPlaced) {
          state = "correct";
        } else if (isStaged) {
          state = "selected";
        }
        entities.push({
          id: piece.piece_id,
          slotIndex: targets.length + i,
          role: "source",
          state,
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
        });
      }
    });

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  /**
   * Place piece onto slot (supports both drag-drop and tap-tap fallback — BR-GTC-06).
   */
  onPlacePiece(pieceId: string, slotId: string): ActionResult {
    const piece = this.content.pieces.find((p) => p.piece_id === pieceId);
    const slot = this.content.target_slots.find((s) => s.slot_id === slotId);

    if (!(piece && slot)) {
      return ACTION_IGNORED;
    }

    this.placementMechanic.place(pieceId, slotId);
    this.pieceIdBySlotId.set(slotId, pieceId);
    this.placedPieceIds.add(pieceId);
    const transform = this.pieceTransforms.get(pieceId) ?? {
      rotation: 0,
      flip: "none",
    };
    const targetTransform: PieceTransform = {
      rotation: toRotationAngle(slot.target_rotation),
      flip: toFlipAxis(slot.target_flip),
    };

    const isSlotMatch = piece.target_slot_id === slotId;
    const isTransformMatchResult = isPieceTransformMatch(
      transform,
      targetTransform
    );
    const isCorrect = isSlotMatch && isTransformMatchResult;

    this.recordEvent("item_placed", {
      piece_id: pieceId,
      slot_id: slotId,
      rotation: transform.rotation,
      flip: transform.flip,
      is_correct: isCorrect,
    });

    if (this.checkWinCondition()) {
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return ACTION_CORRECT;
    }

    return isCorrect ? ACTION_CORRECT : ACTION_RETRY;
  }

  override checkWinCondition(): boolean {
    const items = this.content.pieces.map((p) => ({
      id: p.piece_id,
      targetId: p.target_slot_id,
    }));
    const allPlaced = this.placementMechanic.isPlacementComplete(items);
    if (!allPlaced) {
      return false;
    }

    return this.content.pieces.every((piece) => {
      const slot = this.content.target_slots.find(
        (s) => s.slot_id === piece.target_slot_id
      );
      if (!slot) {
        return false;
      }
      const transform = this.pieceTransforms.get(piece.piece_id) ?? {
        rotation: 0,
        flip: "none",
      };
      const targetTransform: PieceTransform = {
        rotation: toRotationAngle(slot.target_rotation),
        flip: toFlipAxis(slot.target_flip),
      };
      return isPieceTransformMatch(transform, targetTransform);
    });
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("top-source-bottom-target");
    return layoutFn({
      slotCount: this.content.pieces.length,
      targetCount: this.content.target_slots.length,
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
    const targets = this.targetSlots;
    const sources = this.sourceSlots;

    this.content.target_slots.forEach((target, i) => {
      const slot = targets[i];
      if (!slot) {
        return;
      }
      const pieceId = this.pieceIdBySlotId.get(target.slot_id);
      const piece = pieceId ? this.pieceById.get(pieceId) : undefined;
      if (!piece) {
        drawEmptyTargetSlot(ctx, slot);
        drawSlotLabel(ctx, `${target.target_rotation}°`, slot);
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: piece.piece_id,
        asset: piece.asset,
        state: "correct",
      });
    });

    this.content.pieces.forEach((piece, i) => {
      const slot = sources[i];
      if (!slot || this.placedPieceIds.has(piece.piece_id)) {
        return;
      }
      const transform = this.pieceTransforms.get(piece.piece_id);
      drawSlotItem(ctx, rs, slot, {
        id: piece.piece_id,
        asset: piece.asset,
        label: `${transform?.rotation ?? piece.initial_rotation}°`,
        state: this.getRenderItemState(piece.piece_id),
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

export default GT019Session;
