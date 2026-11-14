import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type GameActionValue,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import type { Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import type { MascotPose } from "#src/render/mascot";
import {
  type AssemblyPlacementResult,
  AssemblySystem,
} from "#src/systems/assembly-system";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import {
  buildGT023View,
  computeGT023Slots,
  findHitAnchorSlot,
  findHitSourcePart,
  type GT023Anchor,
  type GT023Part,
  getClock,
  MIN_SNAP_RADIUS_PX,
  renderGT023Frame,
  resetClock,
  resolveDemoSequence,
  resolveDisplayParts,
  resolveHintPair,
  resolveSteppedHint,
} from "./layout.js";
import type { GT023Content, GT023Difficulty } from "./template.js";

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E023-07`, `BR-FBK-16`). */
export const GT023_STORY_LINE =
  "Chim Gõ Kiến đang lắp một mô hình bằng gỗ. Bé giúp Chim Gõ Kiến ghép từng mảnh vào đúng chỗ nhé!";
/** Mascot vui sau mỗi mảnh khớp. */
export const GT023_HAPPY_MS = 1000;
/** Mascot nghiêng đầu sau mảnh chưa khớp neo. */
export const GT023_WONDER_MS = 1500;

function readStr(data: GameActionValue, key: string): string | null {
  const raw =
    typeof data === "object" && data !== null
      ? Reflect.get(data, key)
      : undefined;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

export class GT023Session extends TemplateGameSession<
  GT023Content,
  GT023Difficulty
> {
  degradation: DegradationState | null = null;
  roundClosedOnWrong = false;
  displayParts: readonly GT023Part[] = [];
  readonly assemblySystem = new AssemblySystem();
  private readonly placementMechanic = new PlacementMechanic();
  private partById: Map<string, GT023Part> = new Map();
  private readonly mood = new MoodPulse();

  /** Mảnh nằm trong khay, mỏ neo đứng trên sân khấu (`BR-PSZ-01`). */
  override readonly needsTray = true;
  override readonly usesPromptZone = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return this.content.parts.length;
  }

  /** Tên mảnh chỉ đọc thành tiếng, không vẽ chữ dưới mảnh (`BR-E023-06`). */
  override get trayHasLabels(): boolean {
    return false;
  }

  override storyLine(): string {
    return GT023_STORY_LINE;
  }

  /** Chỉ phản ứng sau khi thả mảnh, không báo trước (`BR-E023-07`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  override isAcceptingInput(): boolean {
    return !(this.isWon || this.roundClosedOnWrong);
  }

  private isPartPlaced(partId: string): boolean {
    for (const placedId of this.assemblySystem.getPlacements().values()) {
      if (placedId === partId) {
        return true;
      }
    }
    return false;
  }

  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
    const clock = getClock(this);
    clock.logicMs += deltaMs;
    clock.frameMs += deltaMs;
  }

  setupEntities(): void {
    this.mood.clear();
    this.isWon = false;
    this.roundClosedOnWrong = false;
    resetClock(this);
    this.placementMechanic.reset();
    this.displayParts = resolveDisplayParts(
      this.content.parts,
      this.layoutSeed,
      this.roundGeneration
    );
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
      shapeKey: JSON.stringify(p.asset),
    }));
    this.assemblySystem.init(anchors, parts);
    this.recordEvent("round_started", {
      round_index: 0,
      anchor_count: anchors.length,
      part_count: parts.length,
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput() || action.type === "stage_part") {
      return ACTION_IGNORED;
    }
    if (
      action.type === "place_item" ||
      action.type === "drop_item" ||
      action.type === "tap_tap_item"
    ) {
      const partId = readStr(action.data, "item_id");
      const anchorId = readStr(action.data, "target_id");
      if (!(partId && anchorId)) {
        return ACTION_IGNORED;
      }
      const anchor = this.assemblySystem.getAnchor(anchorId);
      const part = this.assemblySystem.getPart(partId);
      if (
        !(anchor && part) ||
        this.assemblySystem.getPlacements().has(anchorId) ||
        this.isPartPlaced(partId)
      ) {
        return ACTION_IGNORED;
      }
      return this.assemblySystem.acceptsPart(anchorId, partId)
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  onAssemblePart(partId: string, anchorId: string): AssemblyPlacementResult {
    if (
      !this.isAcceptingInput() ||
      this.assemblySystem.getPlacements().has(anchorId) ||
      this.isPartPlaced(partId)
    ) {
      return { valid: false, isAnchorMatch: false, isComplete: false };
    }
    const clock = getClock(this);
    const result = this.assemblySystem.assemblePart(partId, anchorId);
    if (result.valid) {
      if (result.isAnchorMatch) {
        clock.activeHintLevel = 0;
        clock.partWrongFlashes.clear(partId);
        clock.anchorWrongFlashes.clear(anchorId);
        clock.snappedAtMs.set(anchorId, clock.frameMs);
        this.queueSfx("piece_click");
        this.mood.set("happy", GT023_HAPPY_MS);
      } else {
        clock.partWrongFlashes.trigger(partId, clock.frameMs);
        clock.anchorWrongFlashes.trigger(anchorId, clock.frameMs);
        this.mood.set("wonder", GT023_WONDER_MS);
        if (this.difficulty.allow_retry === false) {
          this.roundClosedOnWrong = true;
          clock.autoSolveAtMs = clock.frameMs;
        }
      }
      this.placementMechanic.place(partId, anchorId);
      this.recordEvent("item_placed", {
        part_id: partId,
        anchor_id: anchorId,
        is_anchor_match: result.isAnchorMatch,
      });
      if (!this.isWon && this.checkWinCondition()) {
        clock.winAtMs = clock.frameMs;
        this.recordEvent("round_completed", { round_index: 0 });
        this.winSession();
      }
    } else {
      clock.partWrongFlashes.trigger(partId, clock.frameMs);
      clock.anchorWrongFlashes.trigger(anchorId, clock.frameMs);
      this.setRenderItemState(partId, "wrong");
    }
    return result;
  }

  onSnapPart(
    partId: string,
    x: number,
    y: number
  ): AssemblyPlacementResult | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    if (this.targetSlots.length > 0) {
      const hitAnchor = this.findHitAnchor(x, y);
      return hitAnchor
        ? this.onAssemblePart(partId, hitAnchor.anchor_id)
        : null;
    }
    const snapRadius = Math.max(
      this.difficulty.snap_radius_px,
      MIN_SNAP_RADIUS_PX
    );
    const placed = this.assemblySystem.getPlacements();
    let [bestId, bestD]: [string | null, number] = [null, snapRadius];
    for (const a of this.content.anchors) {
      const d = placed.has(a.anchor_id)
        ? snapRadius + 1
        : Math.hypot(a.x - x, a.y - y);
      if (d <= bestD) {
        [bestId, bestD] = [a.anchor_id, d];
      }
    }
    return bestId ? this.onAssemblePart(partId, bestId) : null;
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

  private findHitAnchor(x: number, y: number): GT023Anchor | null {
    return findHitAnchorSlot(this, [x, y]);
  }

  setPointerOver(x: number, y: number): void {
    const clock = getClock(this);
    if (!this.isAcceptingInput()) {
      [clock.hoveredAnchorId, clock.hoveredPartId, clock.hoveredModel] = [
        null,
        null,
        false,
      ];
      return;
    }
    const hitAnchor = this.findHitAnchor(x, y);
    clock.hoveredAnchorId =
      hitAnchor && !this.assemblySystem.getPlacements().has(hitAnchor.anchor_id)
        ? hitAnchor.anchor_id
        : null;
    const hitSource = findHitSourcePart(this, [x, y]);
    clock.hoveredPartId = hitSource?.part.part_id ?? null;
    const modelSlot = this.slots.find((s) => s.role === "neutral");
    clock.hoveredModel = Boolean(
      modelSlot && isPointInSlot(modelSlot, x, y, "square", TAP_TOLERANCE_PX)
    );
  }

  clearPointerOver(): void {
    const clock = getClock(this);
    [clock.hoveredAnchorId, clock.hoveredPartId, clock.hoveredModel] = [
      null,
      null,
      false,
    ];
  }

  override onScaffoldEscalated(
    level: HintLevel,
    _trigger: "timer" | "miss_streak"
  ): void {
    getClock(this).activeHintLevel = level;
  }

  override onHintCleared(): void {
    getClock(this).activeHintLevel = 0;
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const hitSource = findHitSourcePart(this, [gesture.fromX, gesture.fromY]);
    const hitAnchor = hitSource
      ? this.findHitAnchor(gesture.toX, gesture.toY)
      : null;
    if (!(hitSource && hitAnchor)) {
      return null;
    }
    return {
      type: "drop_item",
      data: { item_id: hitSource.part.part_id, target_id: hitAnchor.anchor_id },
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
          data: { item_id: stagedId, target_id: hitAnchor.anchor_id },
        };
      }
    }
    const hitSource = findHitSourcePart(this, [gesture.x, gesture.y]);
    if (hitSource) {
      return {
        type: "stage_part",
        data: { part_id: hitSource.part.part_id },
      };
    }
    const modelSlot = this.slots.find((s) => s.role === "neutral");
    if (
      modelSlot &&
      isPointInSlot(modelSlot, gesture.x, gesture.y, "square", TAP_TOLERANCE_PX)
    ) {
      return null;
    }
    return stagedId ? { type: "stage_part", data: {} } : null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    if (gesture.type === "drop") {
      return this.toDropAction(gesture);
    }
    return gesture.type === "tap" ? this.toTapAction(gesture) : null;
  }

  override commit(action: GameAction): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    if (action.type === "stage_part") {
      const partId = readStr(action.data, "part_id");
      this.placementMechanic.stageItem(
        partId && this.placementMechanic.getStagedItemId() === partId
          ? null
          : partId
      );
      return;
    }
    if (
      action.type === "place_item" ||
      action.type === "drop_item" ||
      action.type === "tap_tap_item"
    ) {
      const itemId = readStr(action.data, "item_id");
      const targetId = readStr(action.data, "target_id");
      if (itemId && targetId) {
        this.onAssemblePart(itemId, targetId);
        if (this.placementMechanic.getStagedItemId() === itemId) {
          this.placementMechanic.stageItem(null);
        }
      }
    }
  }

  override getView(): EngineView {
    return buildGT023View(this);
  }

  override getHintTargetIndex(): number | null {
    const pair = resolveHintPair(this);
    if (!pair) {
      return null;
    }
    return this.placementMechanic.getStagedItemId() === pair.part.part_id
      ? this.slots.indexOf(pair.anchorSlot)
      : pair.sourceSlot.index;
  }

  /** Chưa chọn mảnh thì bước đúng là kéo mảnh chưa đặt vào chốt nhận nó. */
  override getHintDestinationIndex(): number | null {
    if (this.placementMechanic.getStagedItemId()) {
      return null;
    }
    const pair = resolveHintPair(this);
    return pair ? this.slots.indexOf(pair.anchorSlot) : null;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    return resolveSteppedHint(this, level);
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    return resolveDemoSequence(this, level);
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    return computeGT023Slots(this, ageBand);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    renderGT023Frame(this, ctx, rs, timeMs, this.partById);
  }
}
