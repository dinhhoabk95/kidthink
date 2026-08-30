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
import {
  drawEmptyTargetSlot,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSlotLabel,
  type ItemVisualState,
  updateParticles,
} from "../shared-render.js";
import type { GT019Content, GT019Difficulty } from "./template.js";

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

export class GT019Session extends TemplateGameSession<
  GT019Content,
  GT019Difficulty
> {
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private readonly placementMechanic = new PlacementMechanic();
  private readonly pieceTransforms: Map<string, PieceTransform> = new Map();

  setupEntities(): void {
    this.isWon = false;
    this.placementMechanic.reset();
    this.pieceTransforms.clear();

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
      const items = this.content.pieces.map((p) => ({
        id: p.piece_id,
        targetId: p.target_slot_id,
      }));
      return this.placementMechanic.validate(action, items);
    }

    return ACTION_IGNORED;
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

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("grid");
    this.slots = layoutFn({
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
    const targets = this.slots.filter((s) => s.role === "target");
    const sources = this.slots.filter((s) => s.role === "source");
    const placements = this.placementMechanic.getPlacements();
    const pieceById = new Map(this.content.pieces.map((p) => [p.piece_id, p]));
    const placedPieceIds = new Set(placements.keys());

    this.content.target_slots.forEach((target, i) => {
      const slot = targets[i];
      if (!slot) {
        return;
      }
      const pieceId = [...placements.entries()].find(
        ([, slotId]) => slotId === target.slot_id
      )?.[0];
      const piece = pieceId ? pieceById.get(pieceId) : undefined;
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
      if (!slot || placedPieceIds.has(piece.piece_id)) {
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
