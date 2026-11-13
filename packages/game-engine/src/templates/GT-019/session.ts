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
import type { EngineView, Gesture } from "#src/interaction";
import type { Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import type {
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "#src/systems/hint-ladder";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import {
  isPieceTransformMatch,
  type PieceTransform,
  rotatePiece90,
  togglePieceFlip,
} from "#src/systems/rotation-system";
import {
  buildGT019HintDemoSequence,
  buildGT019ViewEntities,
  computeGT019LayoutSlots,
  type GT019BoardState,
  type GT019HoverInput,
  type GT019Piece,
  getGT019Clock,
  readGT019ActionStr,
  recordGT019FlipAnim,
  recordGT019Placed,
  recordGT019RotateAnim,
  renderGT019Board,
  resolveGT019GestureAction,
  resolveGT019HintDestinationIndex,
  resolveGT019HintTargetIndex,
  resolveGT019HoverId,
  resolveGT019RoundSetup,
  stepGT019Clock,
  toFlipAxis,
  toRotationAngle,
} from "#src/templates/GT-019/layout";
import type {
  GT019Content,
  GT019Difficulty,
} from "#src/templates/GT-019/template";

export const GT019_STORY_LINE =
  "Dơi Con bật đèn pin chiếu bóng lên tường. Bé xoay hình cho khớp với cái bóng rồi đặt vào nhé!";
export const GT019_HAPPY_MS = 1000;
export const GT019_WONDER_MS = 1500;

export class GT019Session extends TemplateGameSession<
  GT019Content,
  GT019Difficulty
> {
  degradation: DegradationState | null = null;
  override readonly needsTray = true;
  override readonly usesPromptZone = true;

  override get trayHasLabels(): boolean {
    return false;
  }
  override get trayItemCount(): number {
    return this.content.pieces.length + (this.difficulty.allow_flip ? 1 : 0);
  }
  private readonly placementMechanic = new PlacementMechanic();
  private readonly pieceTransforms = new Map<string, PieceTransform>();
  private readonly pieceIdBySlotId = new Map<string, string>();
  private readonly placedPieceIds = new Set<string>();
  private displayPieces: GT019Piece[] = [];
  private readonly mood = new MoodPulse();
  private hoveredId: string | null = null;
  private activeHintLevel: 0 | HintLevel = 0;
  private roundClosedOnWrong = false;

  constructor(
    content: GT019Content,
    difficulty: GT019Difficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
    this.syncInitialRoundState();
  }
  private get activePieces(): readonly GT019Piece[] {
    return this.displayPieces.length > 0
      ? this.displayPieces
      : this.content.pieces;
  }
  private get flipButtonSlot(): Slot | undefined {
    return this.difficulty.allow_flip
      ? this.sourceSlots[this.content.pieces.length]
      : undefined;
  }
  private syncInitialRoundState(): void {
    this.pieceTransforms.clear();
    const setup = resolveGT019RoundSetup(
      this.content,
      this.layoutSeed,
      this.roundGeneration
    );
    this.displayPieces = setup.displayPieces;
    for (const [id, tf] of setup.transforms.entries()) {
      this.pieceTransforms.set(id, tf);
    }
  }
  override storyLine(): string {
    return GT019_STORY_LINE;
  }
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }
  override isAcceptingInput(): boolean {
    return !this.roundClosedOnWrong && super.isAcceptingInput();
  }
  override onScaffoldEscalated(
    level: HintLevel,
    _trigger?: "timer" | "miss_streak"
  ): void {
    this.activeHintLevel = level;
  }
  override onHintCleared(): void {
    this.activeHintLevel = 0;
  }
  setPointerOver(arg: GT019HoverInput, y?: number): void {
    this.hoveredId = resolveGT019HoverId(
      this.boardState(),
      this.isAcceptingInput(),
      arg,
      y
    );
  }
  clearPointerOver(): void {
    this.hoveredId = null;
  }
  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
    stepGT019Clock(this, deltaMs, this.roundClosedOnWrong);
  }

  setupEntities(): void {
    this.mood.clear();
    this.hoveredId = null;
    this.activeHintLevel = 0;
    this.roundClosedOnWrong = false;
    getGT019Clock(this, true);
    this.isWon = false;
    this.placementMechanic.reset();
    this.pieceIdBySlotId.clear();
    this.placedPieceIds.clear();
    this.syncInitialRoundState();
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
    if (
      this.isWon ||
      this.roundClosedOnWrong ||
      this.placedPieceIds.has(pieceId)
    ) {
      return undefined;
    }
    const current = this.pieceTransforms.get(pieceId);
    if (!current) {
      return undefined;
    }
    recordGT019RotateAnim(this, pieceId, current.rotation, direction);
    const updated: PieceTransform = {
      ...current,
      rotation: rotatePiece90(current.rotation, direction),
    };
    this.pieceTransforms.set(pieceId, updated);
    this.activeHintLevel = 0;
    this.queueSfx("torch_click");
    return updated;
  }

  onFlipPiece(
    pieceId: string,
    axis: "horizontal" | "vertical"
  ): PieceTransform | undefined {
    if (
      !this.difficulty.allow_flip ||
      this.isWon ||
      this.roundClosedOnWrong ||
      this.placedPieceIds.has(pieceId)
    ) {
      return undefined;
    }
    const current = this.pieceTransforms.get(pieceId);
    if (!current) {
      return undefined;
    }
    const nextFlip = togglePieceFlip(current.flip, axis);
    recordGT019FlipAnim(this, pieceId, current.flip, nextFlip);
    const updated: PieceTransform = { ...current, flip: nextFlip };
    this.pieceTransforms.set(pieceId, updated);
    this.activeHintLevel = 0;
    this.queueSfx("torch_click");
    return updated;
  }

  private validatePieceAction(data: GameActionValue): ActionResult {
    const pieceId = readGT019ActionStr(data, "piece_id");
    return pieceId &&
      this.pieceTransforms.has(pieceId) &&
      !this.placedPieceIds.has(pieceId)
      ? ACTION_CORRECT
      : ACTION_IGNORED;
  }

  private isPieceMatchingSlot(piece: GT019Piece): boolean {
    const slot = this.content.target_slots.find(
      (s) => s.slot_id === piece.target_slot_id
    );
    const transform = this.pieceTransforms.get(piece.piece_id) ?? {
      rotation: 0,
      flip: "none",
    };
    return (
      slot !== undefined &&
      isPieceTransformMatch(transform, {
        rotation: toRotationAngle(slot.target_rotation),
        flip: toFlipAxis(slot.target_flip),
      })
    );
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput() || this.isWon) {
      return ACTION_IGNORED;
    }
    if (action.type === "rotate_piece") {
      return this.validatePieceAction(action.data);
    }
    if (action.type === "flip_piece") {
      return this.difficulty.allow_flip
        ? this.validatePieceAction(action.data)
        : ACTION_IGNORED;
    }
    if (
      action.type === "place_item" ||
      action.type === "drop_item" ||
      action.type === "tap_tap_item"
    ) {
      const items = this.content.pieces.map((p) => ({
        id: p.piece_id,
        targetId: p.target_slot_id,
        isCorrect: this.isPieceMatchingSlot(p),
      }));
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
  override toAction(gesture: Gesture): GameAction | null {
    return this.isAcceptingInput() && !this.isWon
      ? resolveGT019GestureAction(this.boardState(), gesture, (id) =>
          this.placementMechanic.stageItem(id)
        )
      : null;
  }
  private firstUnplacedPiece(): GT019Piece | null {
    if (this.isWon || this.roundClosedOnWrong) {
      return null;
    }
    return (
      this.activePieces.find((p) => !this.placedPieceIds.has(p.piece_id)) ??
      null
    );
  }
  override getHintTargetIndex(): number | null {
    return resolveGT019HintTargetIndex(this.boardState());
  }
  override getHintDestinationIndex(): number | null {
    return resolveGT019HintDestinationIndex(this.boardState());
  }
  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    const first = this.firstUnplacedPiece();
    if (!first) {
      return null;
    }
    if (level === 1) {
      return { kind: "region", ids: [first.target_slot_id] };
    }
    if (level === 2) {
      return {
        kind: "region",
        ids: [first.piece_id, first.target_slot_id],
      };
    }
    return this.getHintTarget();
  }
  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    return buildGT019HintDemoSequence(this.boardState(), level);
  }

  private commitTransform(type: string, d: GameActionValue): void {
    const pieceId = readGT019ActionStr(d, "piece_id");
    if (!pieceId) {
      return;
    }
    if (type === "rotate_piece") {
      const dir = readGT019ActionStr(d, "direction") === "ccw" ? "ccw" : "cw";
      this.onRotatePiece(pieceId, dir);
    } else if (type === "flip_piece") {
      const axis =
        readGT019ActionStr(d, "axis") === "vertical"
          ? "vertical"
          : "horizontal";
      this.onFlipPiece(pieceId, axis);
    }
  }

  override commit(action: GameAction): void {
    const d = action.data;
    if (
      action.type === "place_item" ||
      action.type === "drop_item" ||
      action.type === "tap_tap_item"
    ) {
      const pieceId =
        readGT019ActionStr(d, "piece_id") ?? readGT019ActionStr(d, "item_id");
      const slotId =
        readGT019ActionStr(d, "target_slot_id") ??
        readGT019ActionStr(d, "target_id");
      if (pieceId && slotId) {
        this.onPlacePiece(pieceId, slotId);
      }
      return;
    }
    this.commitTransform(action.type, d);
  }

  private boardState(particlesEnabled = true): GT019BoardState {
    return {
      owner: this,
      content: this.content,
      difficulty: this.difficulty,
      displayPieces: this.activePieces,
      slots: this.slots,
      targetSlots: this.targetSlots,
      sourceSlots: this.sourceSlots,
      flipButtonSlot: this.flipButtonSlot,
      pieceTransforms: this.pieceTransforms,
      pieceIdBySlotId: this.pieceIdBySlotId,
      placedPieceIds: this.placedPieceIds,
      stagedId: this.placementMechanic.getStagedItemId(),
      hoveredId: this.hoveredId,
      activeHintLevel: this.activeHintLevel,
      isWon: this.isWon,
      roundClosedOnWrong: this.roundClosedOnWrong,
      particlesEnabled,
      firstPiece: this.firstUnplacedPiece(),
      themeId: this.themeId ?? "default",
      stageRect: this.stageRect,
      trayRect: this.trayRect,
      getBaseItemState: (pieceId: string) => this.getRenderItemState(pieceId),
    };
  }

  override getView(): EngineView {
    return {
      activePrompt: this.content.prompt,
      entities: buildGT019ViewEntities(this.boardState()),
    };
  }

  onPlacePiece(pieceId: string, slotId: string): ActionResult {
    if (this.isWon || this.roundClosedOnWrong) {
      return ACTION_IGNORED;
    }
    const piece = this.content.pieces.find((p) => p.piece_id === pieceId);
    const slot = this.content.target_slots.find((s) => s.slot_id === slotId);
    if (!(piece && slot) || this.placedPieceIds.has(pieceId)) {
      return ACTION_IGNORED;
    }
    const transform = this.pieceTransforms.get(pieceId) ?? {
      rotation: 0,
      flip: "none",
    };
    const isCorrect =
      piece.target_slot_id === slotId &&
      isPieceTransformMatch(transform, {
        rotation: toRotationAngle(slot.target_rotation),
        flip: toFlipAxis(slot.target_flip),
      });

    this.recordEvent("item_placed", {
      piece_id: pieceId,
      slot_id: slotId,
      rotation: transform.rotation,
      flip: transform.flip,
      is_correct: isCorrect,
    });

    if (!isCorrect) {
      this.mood.set("wonder", GT019_WONDER_MS);
      this.placementMechanic.stageItem(null);
      const clock = getGT019Clock(this);
      clock.pieceWrongFlashes.trigger(pieceId, clock.logicMs);
      clock.slotWrongFlashes.trigger(slotId, clock.logicMs);
      if (this.difficulty.allow_retry === false) {
        this.roundClosedOnWrong = true;
      }
      return ACTION_RETRY;
    }

    this.placementMechanic.place(pieceId, slotId);
    this.pieceIdBySlotId.set(slotId, pieceId);
    this.placedPieceIds.add(pieceId);
    recordGT019Placed(this, slotId);
    this.mood.set("happy", GT019_HAPPY_MS);
    this.activeHintLevel = 0;
    if (this.checkWinCondition()) {
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
    }
    return ACTION_CORRECT;
  }

  override checkWinCondition(): boolean {
    const items = this.content.pieces.map((p) => ({
      id: p.piece_id,
      targetId: p.target_slot_id,
    }));
    return (
      this.placementMechanic.isPlacementComplete(items) &&
      this.content.pieces.every((p) => this.isPieceMatchingSlot(p))
    );
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    return computeGT019LayoutSlots(
      this.boardState(),
      ageBand,
      this.cssPerLogic ?? 1,
      this.logicSpace
    );
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const pEnabled =
      (this.degradation?.particles_enabled ?? true) && !rs.reducedMotion;
    renderGT019Board(this.boardState(pEnabled), ctx, rs, timeMs);
  }
}
