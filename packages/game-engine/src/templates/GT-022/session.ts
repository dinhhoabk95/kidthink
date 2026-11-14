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
import { TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import type { MascotPose } from "#src/render/mascot";
import type { RenderAsset } from "#src/render/types";
import type { DegradationState } from "#src/systems/degradation";
import type {
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "#src/systems/hint-ladder";
import type { RenderSystem } from "#src/systems/render-system";
import {
  type FindResult,
  type SceneObject,
  SceneSystem,
} from "#src/systems/scene-system";
import type { PlacedLayer } from "./layered-scene.js";
import {
  buildGT022View,
  buildResolvedObjects,
  computeGT022Layout,
  computeGT022QuadrantBox,
  computeGT022SceneBounds,
  findHitSceneObject,
  type GT022SessionView,
  getGT022Clock,
  renderGT022Scene,
  resetGT022Clock,
} from "./layout.js";
import type { GT022Content, GT022Difficulty } from "./template.js";

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E022-07`, `BR-FBK-16`). */
export const GT022_STORY_LINE =
  "Vịt Con làm lạc đồ chơi rồi, bé cầm kính lúp giúp Vịt Con tìm nhé!";

/** Mascot nhảy hoặc động viên ngắn sau mỗi lần chạm (`BR-E022-07`). */
export const GT022_REACTION_MS = 1000;

/** Kính lúp của Vịt Con soi vật vừa chạm trong ngần này ms (`BR-E022-10`). */
export const GT022_LENS_MS = 900;

function extractItemId(data: GameActionValue): string | null {
  const raw =
    typeof data === "object" && data !== null
      ? Reflect.get(data, "item_id")
      : undefined;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

export class GT022Session
  extends TemplateGameSession<GT022Content, GT022Difficulty>
  implements GT022SessionView
{
  override readonly usesPromptZone = true;
  referenceSlots: readonly Slot[] = [];
  layers: readonly PlacedLayer[] | null = null;
  degradation: DegradationState | null = null;
  readonly sceneSystem = new SceneSystem();
  private readonly selectionMechanic = new SelectionMechanic();
  resolvedObjects: SceneObject[] = [];
  private assetById = new Map<string, RenderAsset>();
  private reactionPose: MascotPose | null = null;
  private reactionRemainingMs = 0;
  roundClosedOnWrong = false;

  setupEntities(): void {
    this.isWon = false;
    this.roundClosedOnWrong = false;
    this.reactionPose = null;
    this.reactionRemainingMs = 0;
    this.selectionMechanic.reset();
    resetGT022Clock(this);
    this.assetById = new Map(
      this.content.scene_objects.map((o) => [o.id, o.asset])
    );
    this.resolvedObjects = buildResolvedObjects(
      this.content,
      this.layoutSeed,
      this.roundGeneration
    );
    this.sceneSystem.init(this.resolvedObjects);
    this.recordEvent("round_started", {
      round_index: 0,
      total_targets: this.sceneSystem.getTotalTargets(),
      total_objects: this.resolvedObjects.length,
    });
  }

  override isAcceptingInput(): boolean {
    return !(this.isWon || this.roundClosedOnWrong);
  }

  private validateTapObject(data: GameActionValue): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    const itemId = extractItemId(data);
    if (!itemId || this.sceneSystem.getObjectState(itemId)?.isFound === true) {
      return ACTION_IGNORED;
    }
    const obj = this.resolvedObjects.find((o) => o.id === itemId);
    if (!obj) {
      return ACTION_IGNORED;
    }
    return obj.isTarget ? ACTION_CORRECT : ACTION_RETRY;
  }

  private validateRevealObject(data: GameActionValue): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    const itemId = extractItemId(data);
    if (!itemId) {
      return ACTION_IGNORED;
    }
    const obj = this.resolvedObjects.find((o) => o.id === itemId);
    const state = this.sceneSystem.getObjectState(itemId);
    return obj?.isHidden && state?.isRevealed !== true
      ? ACTION_CORRECT
      : ACTION_IGNORED;
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "tap_object" || action.type === "select_item") {
      return this.validateTapObject(action.data);
    }
    if (action.type === "reveal_object") {
      return this.validateRevealObject(action.data);
    }
    return ACTION_IGNORED;
  }

  onRevealObject(itemId: string): boolean {
    if (this.roundClosedOnWrong) {
      return false;
    }
    const revealed = this.sceneSystem.revealObject(itemId);
    if (revealed) {
      getGT022Clock(this).activeHintLevel = 0;
      this.recordEvent("item_revealed", { item_id: itemId });
    }
    return revealed;
  }

  onTapObject(itemId: string): FindResult {
    if (this.roundClosedOnWrong) {
      return { valid: false, isTarget: false, isNewFind: false };
    }
    const clock = getGT022Clock(this);
    const result = this.sceneSystem.findTarget(itemId);
    clock.lensObjectId = itemId;
    clock.lensStartedMs = clock.lastRenderMs;

    this.recordEvent("item_selected", {
      item_id: itemId,
      is_target: result.isTarget,
      is_new_find: result.isNewFind,
      found_count: this.sceneSystem.getFoundCount(),
      total_targets: this.sceneSystem.getTotalTargets(),
    });

    if (result.isNewFind) {
      this.selectionMechanic.select(itemId);
      clock.foundAtMs.set(itemId, clock.logicMs);
      clock.activeHintLevel = 0;
      this.queueSfx("lens_pop");
      this.react("happy");
    } else if (!result.isTarget) {
      clock.wrongFlashes.trigger(itemId, clock.logicMs);
      this.react("encourage");
      if (this.difficulty.allow_retry === false) {
        this.roundClosedOnWrong = true;
        clock.autoRevealElapsedMs = 0;
      }
    }

    if (!this.isWon && this.checkWinCondition()) {
      clock.winAtMs = clock.logicMs;
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
    }
    return result;
  }

  override checkWinCondition(): boolean {
    return !this.roundClosedOnWrong && this.sceneSystem.isAllFound();
  }

  private react(pose: MascotPose): void {
    this.reactionPose = pose;
    this.reactionRemainingMs = GT022_REACTION_MS;
  }

  override storyLine(): string {
    return GT022_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.reactionRemainingMs > 0 && !this.isWon
      ? this.reactionPose
      : null;
  }

  update(deltaMs: number): void {
    if (deltaMs <= 0) {
      return;
    }
    const clock = getGT022Clock(this);
    clock.logicMs += deltaMs;
    clock.wrongFlashes.drainExpired(clock.logicMs);
    if (this.roundClosedOnWrong) {
      clock.autoRevealElapsedMs += deltaMs;
    }
    if (this.reactionRemainingMs > 0) {
      this.reactionRemainingMs = Math.max(
        0,
        this.reactionRemainingMs - deltaMs
      );
    }
  }

  setPointerOver(x: number, y: number): void {
    const clock = getGT022Clock(this);
    if (!this.isAcceptingInput()) {
      clock.hoveredId = null;
      return;
    }
    const hit = findHitSceneObject(
      this.resolvedObjects,
      this.sceneSystem,
      x,
      y,
      TAP_TOLERANCE_PX
    );
    clock.hoveredId = hit ? hit.id : null;
  }

  clearPointerOver(): void {
    getGT022Clock(this).hoveredId = null;
  }

  override onScaffoldEscalated(
    level: HintLevel,
    _trigger: "timer" | "miss_streak"
  ): void {
    getGT022Clock(this).activeHintLevel = level;
  }

  override onHintCleared(): void {
    getGT022Clock(this).activeHintLevel = 0;
  }

  protected override computeRoundDerived(): void {
    if (!this.stageRect) {
      return;
    }
    this.resolvedObjects = this.resolvedObjects.map((obj, i) => {
      const slot = this.slots[i];
      return slot
        ? { ...obj, x: slot.x, y: slot.y, width: slot.hitW, height: slot.hitH }
        : obj;
    });
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (!this.isAcceptingInput() || gesture.type !== "tap") {
      return null;
    }
    const hitObj = findHitSceneObject(
      this.resolvedObjects,
      this.sceneSystem,
      gesture.x,
      gesture.y,
      TAP_TOLERANCE_PX
    );
    if (!hitObj) {
      return null;
    }
    const state = this.sceneSystem.getObjectState(hitObj.id);
    return hitObj.isHidden && state?.isRevealed !== true
      ? { type: "reveal_object", data: { item_id: hitObj.id } }
      : { type: "tap_object", data: { item_id: hitObj.id } };
  }

  override commit(action: GameAction): void {
    const itemId = extractItemId(action.data);
    if (!itemId) {
      return;
    }
    if (action.type === "tap_object" || action.type === "select_item") {
      this.onTapObject(itemId);
    } else if (action.type === "reveal_object") {
      this.onRevealObject(itemId);
    }
  }

  resolveAssetById(): ReadonlyMap<string, RenderAsset> {
    if (this.assetById.size === this.content.scene_objects.length) {
      return this.assetById;
    }
    return new Map(this.content.scene_objects.map((o) => [o.id, o.asset]));
  }

  override getView(): EngineView {
    return buildGT022View(this);
  }

  override getHintTargetIndex(): number | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const idx = this.resolvedObjects.findIndex((obj) => {
      const state = this.sceneSystem.getObjectState(obj.id);
      return obj.isTarget && !state?.isFound;
    });
    return idx >= 0 ? idx : null;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const idx = this.getHintTargetIndex();
    const t = idx === null ? undefined : this.resolvedObjects[idx];
    if (!t || idx === null) {
      return null;
    }
    if (level === 1) {
      const q = computeGT022QuadrantBox(computeGT022SceneBounds(this), t);
      const inQ = this.resolvedObjects
        .filter(
          (o) =>
            o.x >= q.x - 4 &&
            o.x <= q.x + q.w + 4 &&
            o.y >= q.y - 4 &&
            o.y <= q.y + q.h + 4
        )
        .map((o) => o.id);
      return { kind: "region", ids: inQ.length > 0 ? inQ : [t.id] };
    }
    return level === 2
      ? { kind: "region", ids: [t.id] }
      : { kind: "slot", index: idx };
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    if (level !== 3 || !this.isAcceptingInput()) {
      return null;
    }
    const idx = this.getHintTargetIndex();
    const obj = idx === null ? undefined : this.resolvedObjects[idx];
    if (!obj || idx === null) {
      return null;
    }
    const state = this.sceneSystem.getObjectState(obj.id);
    return obj.isHidden && state?.isRevealed !== true
      ? [{ from: idx }, { from: idx }]
      : [{ from: idx }];
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const res = computeGT022Layout(this, ageBand);
    this.referenceSlots = res.referenceSlots;
    this.layers = res.layers;
    return res.slots;
  }

  getLayerDrawIds(): readonly string[] {
    return this.layerDrawOrder().map(
      (layer) => this.content.scene_objects[layer.index]?.id ?? ""
    );
  }

  layerDrawOrder(): readonly PlacedLayer[] {
    const rank = (layer: PlacedLayer): number => {
      const id = this.content.scene_objects[layer.index]?.id ?? "";
      const found = this.sceneSystem.getObjectState(id)?.isFound === true;
      return layer.layer === 0 && found ? 2 : layer.layer;
    };
    return [...(this.layers ?? [])].sort(
      (a, b) => rank(a) - rank(b) || a.index - b.index
    );
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    renderGT022Scene(this, ctx, rs, timeMs, GT022_LENS_MS);
  }
}
