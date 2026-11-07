import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type GameActionValue,
  TemplateGameSession,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { resolveTouchFloor } from "#src/layout/constants";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import { computeTraySourceSlots, pickTrayZones } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import {
  drawAssetInSlot,
  drawCheckMark,
  drawEmptyTargetSlot,
  drawSceneBackground,
  drawSlotItem,
  drawSlotLabel,
  drawWoodenTokenDock,
  getColorsForState,
} from "#src/render/index";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
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

/** Ký hiệu nút lật trên canvas. */
const FLIP_GLYPH = "⇋";

/** Cạnh ô đích lớn nhất trên sân khấu. */
const TARGET_CELL_MAX_PX = 96;

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

function findHitSourcePiece(
  slots: readonly Slot[],
  pieces: readonly { piece_id: string }[],
  x: number,
  y: number
): { piece: { piece_id: string }; index: number } | null {
  const sourceSlots = slots
    .filter((s) => s.role === "source")
    .slice(0, pieces.length);
  const index = findHitSlotIndex(sourceSlots, x, y, "circle", TAP_TOLERANCE_PX);
  const piece = index >= 0 ? pieces[index] : undefined;
  return piece ? { piece, index } : null;
}

function findHitTargetSlot(
  slots: readonly Slot[],
  targets: readonly { slot_id: string }[],
  x: number,
  y: number
): { target: { slot_id: string }; index: number } | null {
  const targetSlots = slots
    .filter((s) => s.role === "target")
    .slice(0, targets.length);
  const index = findHitSlotIndex(targetSlots, x, y, "square", TAP_TOLERANCE_PX);
  const target = index >= 0 ? targets[index] : undefined;
  return target ? { target, index } : null;
}

function applySlotTransform(
  ctx: CanvasRenderingContext2D,
  slot: Slot,
  rotDeg: number,
  flip?: FlipAxis
): void {
  ctx.translate(slot.x, slot.y);
  const rotRad = (rotDeg * Math.PI) / 180;
  if (rotRad !== 0) {
    ctx.rotate(rotRad);
  }
  if (flip === "horizontal") {
    ctx.scale(-1, 1);
  } else if (flip === "vertical") {
    ctx.scale(1, -1);
  }
  ctx.translate(-slot.x, -slot.y);
}

export class GT019Session extends TemplateGameSession<
  GT019Content,
  GT019Difficulty
> {
  degradation: DegradationState | null = null;

  override readonly needsTray = true;

  override get trayHasLabels(): boolean {
    return true;
  }

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return this.content.pieces.length + (this.difficulty.allow_flip ? 1 : 0);
  }
  override readonly usesPromptZone = true;

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

  private validateRotateAction(data: GameActionValue): ActionResult {
    const pieceId =
      typeof data === "object" && data !== null
        ? Reflect.get(data, "piece_id")
        : undefined;
    if (typeof pieceId === "string" && this.pieceTransforms.has(pieceId)) {
      return ACTION_CORRECT;
    }
    return ACTION_IGNORED;
  }

  private validateFlipAction(data: GameActionValue): ActionResult {
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
    const hitSource = findHitSourcePiece(
      this.slots,
      this.content.pieces,
      gesture.x,
      gesture.y
    );
    const stagedId = this.placementMechanic.getStagedItemId();

    if (stagedId && hitTarget) {
      const targetSlot = this.targetSlots[hitTarget.index];
      const sourceSlot = hitSource
        ? this.sourceSlots[hitSource.index]
        : undefined;
      const targetCloser =
        !(sourceSlot && targetSlot) ||
        Math.hypot(gesture.x - targetSlot.x, gesture.y - targetSlot.y) <=
          Math.hypot(gesture.x - sourceSlot.x, gesture.y - sourceSlot.y);
      if (targetCloser) {
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
    }

    if (
      hitSource &&
      !this.placementMechanic.getPlacedContainer(hitSource.piece.piece_id)
    ) {
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

  /** Slot nút lật: slot nguồn thừa ngay sau các mảnh (chỉ có khi `allow_flip`). */
  private get flipButtonSlot(): Slot | undefined {
    return this.difficulty.allow_flip
      ? this.sourceSlots[this.content.pieces.length]
      : undefined;
  }

  /** Mảnh nút lật tác động: mảnh đang chọn, không có thì mảnh chưa đặt đầu tiên. */
  private flipTargetPiece(): GT019Piece | undefined {
    const stagedId = this.placementMechanic.getStagedItemId();
    return (
      this.content.pieces.find((p) => p.piece_id === stagedId) ??
      this.content.pieces.find(
        (p) => !this.placementMechanic.getPlacedContainer(p.piece_id)
      )
    );
  }

  private toFlipButtonAction(
    gesture: Extract<Gesture, { type: "tap" }>
  ): GameAction | null {
    const slot = this.flipButtonSlot;
    if (
      !(
        slot &&
        findHitSlotIndex(
          [slot],
          gesture.x,
          gesture.y,
          "circle",
          TAP_TOLERANCE_PX
        ) >= 0
      )
    ) {
      return null;
    }
    const piece = this.flipTargetPiece();
    if (!piece) {
      return null;
    }
    const targetFlip = toFlipAxis(
      this.content.target_slots.find((s) => s.slot_id === piece.target_slot_id)
        ?.target_flip
    );
    return {
      type: "flip_piece",
      data: {
        piece_id: piece.piece_id,
        axis: targetFlip === "vertical" ? "vertical" : "horizontal",
      },
    };
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
      return this.toFlipButtonAction(gesture) ?? this.toTapAction(gesture);
    }
    if (gesture.type === "adjust") {
      return this.toAdjustAction(gesture);
    }
    return null;
  }

  /** Chỉ số trong `this.slots` — ở stage, slot xếp đích trước rồi mới tới mảnh ghép. */
  override getHintTargetIndex(): number | null {
    const unplaced = this.content.pieces.findIndex(
      (p) => !this.placedPieceIds.has(p.piece_id)
    );
    const slot = unplaced >= 0 ? this.sourceSlots[unplaced] : undefined;
    return slot ? this.slots.indexOf(slot) : null;
  }

  /**
   * Bước đúng là kéo mảnh chưa đặt tới ô đích của nó. Mảnh còn phải xoay/lật
   * mới khớp thì chưa có cú kéo đúng nên không có đích (bước kế là chạm nút xoay).
   */
  override getHintDestinationIndex(): number | null {
    const piece = this.content.pieces.find(
      (p) => !this.placedPieceIds.has(p.piece_id)
    );
    if (!piece) {
      return null;
    }
    const targetIdx = this.content.target_slots.findIndex(
      (s) => s.slot_id === piece.target_slot_id
    );
    const target = this.content.target_slots[targetIdx];
    const transform = this.pieceTransforms.get(piece.piece_id) ?? {
      rotation: 0,
      flip: "none",
    };
    const matches = isPieceTransformMatch(transform, {
      rotation: toRotationAngle(target?.target_rotation),
      flip: toFlipAxis(target?.target_flip),
    });
    const slot = this.targetSlots[targetIdx];
    const index = matches && slot ? this.slots.indexOf(slot) : -1;
    return index >= 0 ? index : null;
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
        const placedPieceId = this.pieceIdBySlotId.get(target.slot_id);
        const placedPiece = placedPieceId
          ? this.pieceById.get(placedPieceId)
          : undefined;
        const refPiece =
          placedPiece ??
          this.content.pieces.find((p) => p.target_slot_id === target.slot_id);
        const assetLabels = refPiece
          ? resolveAssetLabels(refPiece.asset)
          : { spokenLabel: undefined };
        const rotDeg = target.target_rotation ?? 0;
        const spokenBase = assetLabels.spokenLabel ?? `Ô đích ${i + 1}`;
        entities.push({
          id: target.slot_id,
          slotIndex: i,
          role: "target",
          state: placedPiece ? "correct" : "idle",
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          hitShape: "square",
          ...assetLabels,
          label: `${rotDeg}°`,
          spokenLabel: `${spokenBase}, góc ${rotDeg} độ`,
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
        const assetLabels = resolveAssetLabels(piece.asset);
        const transform = this.pieceTransforms.get(piece.piece_id);
        const rotDeg = transform?.rotation ?? piece.initial_rotation ?? 0;
        entities.push({
          id: piece.piece_id,
          slotIndex: targets.length + i,
          role: "source",
          state,
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          ...assetLabels,
          label: assetLabels.label ?? `${rotDeg}°`,
          spokenLabel:
            assetLabels.spokenLabel ?? `Mảnh ${i + 1}, góc ${rotDeg} độ`,
        });
      }
    });

    const flipSlot = this.flipButtonSlot;
    if (flipSlot) {
      entities.push({
        id: "btn_flip",
        slotIndex: targets.length + this.content.pieces.length,
        role: "neutral",
        state: "idle",
        x: flipSlot.x,
        y: flipSlot.y,
        w: flipSlot.w,
        h: flipSlot.h,
        hitShape: "circle",
        glyph: FLIP_GLYPH,
        label: "Lật",
        spokenLabel: "Nút lật hình",
      });
    }

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

    if (!isCorrect) {
      this.placementMechanic.stageItem(null);
      return ACTION_RETRY;
    }

    this.placementMechanic.place(pieceId, slotId);
    this.pieceIdBySlotId.set(slotId, pieceId);
    this.placedPieceIds.add(pieceId);

    if (this.checkWinCondition()) {
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return ACTION_CORRECT;
    }

    return ACTION_CORRECT;
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

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
      const targets = computeStageCellSlots({
        count: this.content.target_slots.length,
        stage: zones.stage,
        touchFloor,
        maxCell: { w: TARGET_CELL_MAX_PX, h: TARGET_CELL_MAX_PX },
        role: "target",
        hasLabels: true,
      });
      const sources = computeTraySourceSlots(
        this.trayItemCount,
        zones.tray,
        touchFloor,
        targets.length,
        true
      );
      return [...targets, ...sources];
    }
    const layoutFn = resolveLayout("top-source-bottom-target");
    return layoutFn({
      slotCount: this.trayItemCount,
      targetCount: this.content.target_slots.length,
      ageBand,
      logic: this.logicSpace,
    });
  }

  private renderGhostTarget(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    target: GT019Content["target_slots"][number],
    slot: Slot
  ): void {
    drawEmptyTargetSlot(ctx, slot);
    ctx.save();
    ctx.globalAlpha = 0.28;
    applySlotTransform(ctx, slot, target.target_rotation, target.target_flip);
    drawAssetInSlot(ctx, target.asset, slot);
    ctx.restore();
    drawSlotLabel(ctx, `${target.target_rotation}°`, slot, rs);
  }

  private renderPlacedTarget(
    ctx: CanvasRenderingContext2D,
    target: GT019Content["target_slots"][number],
    slot: Slot,
    piece: GT019Piece
  ): void {
    const transform = this.pieceTransforms.get(piece.piece_id);
    const rot = transform?.rotation ?? target.target_rotation;
    const flip = transform?.flip ?? target.target_flip;

    drawEmptyTargetSlot(ctx, slot);
    ctx.save();
    applySlotTransform(ctx, slot, rot, flip);
    drawAssetInSlot(ctx, piece.asset, slot);
    ctx.restore();
    drawCheckMark(ctx, slot);
  }

  private renderTrayPiece(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    piece: GT019Content["pieces"][number],
    slot: Slot
  ): void {
    const transform = this.pieceTransforms.get(piece.piece_id);
    const rot = transform?.rotation ?? piece.initial_rotation;
    const flip = transform?.flip ?? piece.initial_flip;
    const state =
      this.placementMechanic.getStagedItemId() === piece.piece_id
        ? "selected"
        : this.getRenderItemState(piece.piece_id);
    const { fill, border } = getColorsForState(state);
    const radius = Math.min(slot.w, slot.h) / 2;

    rs.drawClayBody(ctx, slot.x, slot.y, radius, fill, border, "circle");

    ctx.save();
    applySlotTransform(ctx, slot, rot, flip);
    drawAssetInSlot(ctx, piece.asset, slot);
    ctx.restore();

    drawSlotLabel(ctx, `${rot}°`, slot, rs);
    if (state === "wrong") {
      rs.drawRetryRing(ctx, slot.x, slot.y, radius, 0);
    }
  }

  private renderTargets(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    targets: readonly Slot[]
  ): void {
    for (let i = 0; i < this.content.target_slots.length; i++) {
      const target = this.content.target_slots[i];
      const slot = targets[i];
      if (!(target && slot)) {
        continue;
      }
      const pieceId = this.pieceIdBySlotId.get(target.slot_id);
      const piece = pieceId ? this.pieceById.get(pieceId) : undefined;
      if (piece) {
        this.renderPlacedTarget(ctx, target, slot, piece);
      } else {
        this.renderGhostTarget(ctx, rs, target, slot);
      }
    }
  }

  private renderTrayPieces(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    sources: readonly Slot[]
  ): void {
    for (let i = 0; i < this.content.pieces.length; i++) {
      const piece = this.content.pieces[i];
      const slot = sources[i];
      if (!(piece && slot) || this.placedPieceIds.has(piece.piece_id)) {
        continue;
      }
      this.renderTrayPiece(ctx, rs, piece, slot);
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    const targets = this.targetSlots;
    const sources = this.sourceSlots;
    if (zones && sources.length > 0) {
      drawWoodenTokenDock(ctx, rs, zones.tray);
    }

    this.renderTargets(ctx, rs, targets);
    this.renderTrayPieces(ctx, rs, sources);
    this.renderFlipButton(ctx, rs);
  }

  private renderFlipButton(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const slot = this.flipButtonSlot;
    if (slot) {
      drawSlotItem(ctx, rs, slot, {
        id: "btn_flip",
        text: FLIP_GLYPH,
        label: "Lật",
        state: "idle",
      });
    }
  }
}
