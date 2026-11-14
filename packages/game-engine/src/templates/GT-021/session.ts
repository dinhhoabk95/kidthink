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
import { findNearestHitSlot } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import { PlacementMechanic } from "#src/mechanics/placement-mechanic";
import type { ItemVisualState } from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import type { HintLevel, HintTarget } from "#src/systems/hint-ladder";
import { MirrorSystem } from "#src/systems/mirror-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import { WRONG_FLASH_MS, WrongFlashMap } from "#src/systems/wrong-flash";
import {
  buildGT021ViewEntities,
  computeDisplayOptions,
  computeGT021Slots,
  type GT021BoardHost,
  type GT021DemoStep,
  type GT021Option,
  type GT021TargetDef,
  getSessionClock,
  INSPECT_HIGHLIGHT_MS,
  renderGT021,
  resetSessionClock,
  resolveGT021HintDemoSequence,
  resolveGT021HintDestinationIndex,
  resolveGT021HintTargetForLevel,
  resolveGT021HintTargetIndex,
  stampNow,
} from "./layout";
import type { GT021Content, GT021Difficulty } from "./template.js";

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E021-06`, `BR-FBK-16`). */
export const GT021_STORY_LINE =
  "Cô Tiên có một chiếc gương thần. Bé làm cho bên kia gương giống hệt bên này nhé!";
export const GT021_HAPPY_MS = 1000;
export const GT021_WONDER_MS = 1500;

function readPlacePayload(d: GameActionValue) {
  const o = typeof d === "object" && d !== null ? d : null;
  const itemId = o ? Reflect.get(o, "item_id") : null;
  const tRaw = o ? Reflect.get(o, "target_id") : null;
  const targetId = tRaw ?? (o ? Reflect.get(o, "target_slot_id") : null);
  const ok =
    typeof itemId === "string" &&
    Boolean(itemId) &&
    typeof targetId === "string" &&
    Boolean(targetId);
  return ok ? { itemId, targetId } : null;
}

const isPlaceAction = (t: string): boolean =>
  t === "place_item" || t === "drop_item" || t === "tap_tap_item";

export class GT021Session
  extends TemplateGameSession<GT021Content, GT021Difficulty>
  implements GT021BoardHost
{
  degradation: DegradationState | null = null;
  readonly mirrorSystem = new MirrorSystem();
  private readonly placementMechanic = new PlacementMechanic();
  private readonly wrongSlotItems = new Map<string, string>();
  readonly wrongFlashes = new WrongFlashMap(WRONG_FLASH_MS);
  readonly wrongSourceFlashes = new WrongFlashMap(WRONG_FLASH_MS);
  private readonly mood = new MoodPulse();
  neutralSlots: readonly Slot[] = [];
  private displayOptions: GT021Option[] = [];
  assetByRef = new Map<string, GT021Option["asset"]>();
  hoveredTargetIdx: number | null = null;
  hoveredSourceIdx: number | null = null;
  scaffoldLevel: 0 | HintLevel = 0;
  roundClosedOnWrong = false;
  override readonly needsTray = true;
  override readonly usesPromptZone = true;

  override get trayItemCount(): number {
    return this.content.options.length;
  }

  constructor(
    content: GT021Content,
    difficulty: GT021Difficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
    const opts = this.content.options;
    this.displayOptions = computeDisplayOptions(opts, this.layoutSeed, 0);
  }

  protected override computeRoundDerived(): void {
    this.neutralSlots = this.slots.filter((s) => s.role === "neutral");
  }

  override storyLine(): string {
    return GT021_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  override isAcceptingInput(): boolean {
    return !(this.isWon || this.roundClosedOnWrong);
  }

  getDisplayOptions(): readonly GT021Option[] {
    const d = this.displayOptions;
    return d.length > 0 ? d : this.content.options;
  }

  getScaffoldLevel(): 0 | HintLevel {
    return this.scaffoldLevel;
  }

  getBaseItemState(id: string): ItemVisualState {
    return this.getRenderItemState(id);
  }

  private clearWrongPlacements(): void {
    this.wrongSlotItems.clear();
    this.wrongFlashes.clearAll();
    this.wrongSourceFlashes.clearAll();
  }

  setupEntities(): void {
    this.mood.clear();
    resetSessionClock(this);
    this.isWon = false;
    this.roundClosedOnWrong = false;
    this.scaffoldLevel = 0;
    [this.hoveredTargetIdx, this.hoveredSourceIdx] = [null, null];
    this.clearWrongPlacements();
    this.placementMechanic.reset();
    const opts = this.content.options;
    const gen = this.roundGeneration;
    this.displayOptions = computeDisplayOptions(opts, this.layoutSeed, gen);
    this.assetByRef = new Map(opts.map((o) => [o.asset_ref, o.asset]));
    const refs = this.content.reference_pattern;
    this.mirrorSystem.init(
      this.content.target_slots.map((t, i) => ({
        referenceSlotId: refs[i]?.slot_id ?? `ref-${i}`,
        targetSlotId: t.slot_id,
        expectedAssetRef: t.expected_asset_ref,
      }))
    );
    this.recordEvent("round_started", {
      round_index: 0,
      axis: this.content.axis,
      target_count: this.content.target_slots.length,
      option_count: opts.length,
    });
  }

  private isTargetCorrectlyFilled(targetSlotId: string): boolean {
    const t = this.content.target_slots.find((s) => s.slot_id === targetSlotId);
    const cur = this.mirrorSystem.getPlacement(targetSlotId);
    return Boolean(t && cur === t.expected_asset_ref);
  }

  private resolveValidPlace(
    itemId: string,
    targetId: string
  ): { opt: GT021Option; target: GT021TargetDef } | null {
    if (!this.isAcceptingInput() || this.isTargetCorrectlyFilled(targetId)) {
      return null;
    }
    const opt = this.content.options.find((o) => o.item_id === itemId);
    const target = this.content.target_slots.find(
      (t) => t.slot_id === targetId
    );
    return opt && target ? { opt, target } : null;
  }

  validateAction(action: GameAction): ActionResult {
    const p = isPlaceAction(action.type) ? readPlacePayload(action.data) : null;
    const v = p ? this.resolveValidPlace(p.itemId, p.targetId) : null;
    if (!v) {
      return ACTION_IGNORED;
    }
    return v.opt.asset_ref === v.target.expected_asset_ref
      ? ACTION_CORRECT
      : ACTION_RETRY;
  }

  private removeWrongItemIfUnused(itemId: string): void {
    if (![...this.wrongSlotItems.values()].includes(itemId)) {
      this.placementMechanic.remove(itemId);
      this.wrongSourceFlashes.clear(itemId);
    }
  }

  onPlaceOption(itemId: string, targetSlotId: string): ActionResult {
    const v = this.resolveValidPlace(itemId, targetSlotId);
    if (!v) {
      return ACTION_IGNORED;
    }
    const prevWrong = this.wrongSlotItems.get(targetSlotId);
    if (prevWrong !== undefined) {
      this.wrongSlotItems.delete(targetSlotId);
      this.wrongFlashes.clear(targetSlotId);
      this.removeWrongItemIfUnused(prevWrong);
    }
    const clock = getSessionClock(this);
    const stamp = stampNow(clock);
    this.placementMechanic.place(itemId, targetSlotId);
    const isCorrect = this.mirrorSystem.place(targetSlotId, v.opt.asset_ref);
    clock.placedStamps.set(targetSlotId, stamp);
    this.recordEvent("item_placed", {
      item_id: itemId,
      target_slot_id: targetSlotId,
      asset_ref: v.opt.asset_ref,
      is_correct: isCorrect,
    });
    if (isCorrect) {
      clock.lastCorrectStamp = stamp;
      clock.inspectedPair = null;
      this.scaffoldLevel = 0;
      this.wrongSlotItems.delete(targetSlotId);
      this.wrongFlashes.clear(targetSlotId);
      this.wrongSourceFlashes.clear(itemId);
      this.queueSfx("mirror_chime");
      this.mood.set("happy", GT021_HAPPY_MS);
      if (this.checkWinCondition()) {
        this.clearWrongPlacements();
        this.recordEvent("round_completed", { round_index: 0 });
        this.winSession();
      }
      return ACTION_CORRECT;
    }
    this.mood.set("wonder", GT021_WONDER_MS);
    this.wrongSlotItems.set(targetSlotId, itemId);
    this.wrongFlashes.trigger(targetSlotId, clock.logicMs);
    this.wrongSourceFlashes.trigger(itemId, clock.logicMs);
    if (this.difficulty.allow_retry === false) {
      this.roundClosedOnWrong = true;
      this.placementMechanic.stageItem(null);
      this.completeSession();
    }
    return ACTION_RETRY;
  }

  override checkWinCondition(): boolean {
    return !this.roundClosedOnWrong && this.mirrorSystem.isComplete();
  }

  update(deltaMs: number): void {
    const dt = Math.max(0, deltaMs);
    this.mood.tick(dt);
    const clock = getSessionClock(this);
    clock.logicMs += dt;
    for (const slotId of this.wrongFlashes.drainExpired(clock.logicMs)) {
      const wrongItemId = this.wrongSlotItems.get(slotId);
      this.wrongSlotItems.delete(slotId);
      if (!this.isTargetCorrectlyFilled(slotId)) {
        this.mirrorSystem.remove(slotId);
        clock.placedStamps.delete(slotId);
      }
      if (wrongItemId !== undefined) {
        this.removeWrongItemIfUnused(wrongItemId);
      }
    }
    this.wrongSourceFlashes.drainExpired(clock.logicMs);
    const insp = clock.inspectedPair;
    if (insp && clock.logicMs - insp.stamp.logicAt >= INSPECT_HIGHLIGHT_MS) {
      clock.inspectedPair = null;
    }
  }

  override destroy(): void {
    super.destroy();
    this.clearWrongPlacements();
    [this.hoveredTargetIdx, this.hoveredSourceIdx] = [null, null];
  }

  getStagedItemId(): string | null {
    return this.placementMechanic.getStagedItemId();
  }

  getPlacements(): ReadonlyMap<string, string> {
    return this.placementMechanic.getPlacements();
  }

  setPointerOver(x: number, y: number): void {
    if (!this.isAcceptingInput()) {
      this.clearPointerOver();
      return;
    }
    const targets = this.targetSlots.slice(0, this.content.target_slots.length);
    const sources = this.sourceSlots.slice(0, this.getDisplayOptions().length);
    const tIdx = findNearestHitSlot(targets, x, y, TAP_TOLERANCE_PX);
    const t = this.content.target_slots[tIdx];
    const ok = tIdx >= 0 && t && !this.isTargetCorrectlyFilled(t.slot_id);
    this.hoveredTargetIdx = ok ? tIdx : null;
    const sIdx = findNearestHitSlot(sources, x, y, TAP_TOLERANCE_PX);
    this.hoveredSourceIdx = sIdx >= 0 ? sIdx : null;
  }

  clearPointerOver(): void {
    [this.hoveredTargetIdx, this.hoveredSourceIdx] = [null, null];
  }

  override onScaffoldEscalated(level: HintLevel): void {
    this.scaffoldLevel = level;
  }

  override onHintCleared(): void {
    this.scaffoldLevel = 0;
  }

  private handleTap(x: number, y: number): GameAction | null {
    const [opts, stgId] = [this.getDisplayOptions(), this.getStagedItemId()];
    const targets = this.targetSlots.slice(0, this.content.target_slots.length);
    const sources = this.sourceSlots.slice(0, opts.length);
    const hit = findNearestHitSlot(
      [...targets, ...sources],
      x,
      y,
      TAP_TOLERANCE_PX
    );
    const target = this.content.target_slots[hit];
    if (hit >= 0 && hit < targets.length && target) {
      const data = { item_id: stgId ?? "", target_id: target.slot_id };
      return stgId ? { type: "tap_tap_item", data } : null;
    }
    const opt = opts[hit - targets.length];
    if (hit >= targets.length && opt) {
      const next = stgId === opt.item_id ? null : opt.item_id;
      this.placementMechanic.stageItem(next);
      return null;
    }
    const nLen = this.content.reference_pattern.length;
    const neutrals = this.neutralSlots.slice(0, nLen);
    const refIdx = findNearestHitSlot(neutrals, x, y, TAP_TOLERANCE_PX);
    if (refIdx >= 0) {
      if (this.difficulty.show_axis_guide) {
        const clock = getSessionClock(this);
        clock.inspectedPair = { index: refIdx, stamp: stampNow(clock) };
      }
      return null;
    }
    this.placementMechanic.stageItem(null);
    return null;
  }

  override toAction(g: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    if (g.type === "drop") {
      const opts = this.getDisplayOptions();
      const sources = this.sourceSlots.slice(0, opts.length);
      const tLen = this.content.target_slots.length;
      const targets = this.targetSlots.slice(0, tLen);
      const sIdx = findNearestHitSlot(
        sources,
        g.fromX,
        g.fromY,
        TAP_TOLERANCE_PX
      );
      const tIdx = findNearestHitSlot(targets, g.toX, g.toY, TAP_TOLERANCE_PX);
      const [opt, tgt] = [opts[sIdx], this.content.target_slots[tIdx]];
      const data = {
        item_id: opt?.item_id ?? "",
        target_id: tgt?.slot_id ?? "",
      };
      return opt && tgt ? { type: "drop_item", data } : null;
    }
    return g.type === "tap" ? this.handleTap(g.x, g.y) : null;
  }

  override commit(action: GameAction): void {
    const p = isPlaceAction(action.type) ? readPlacePayload(action.data) : null;
    if (p) {
      this.onPlaceOption(p.itemId, p.targetId);
      if (this.placementMechanic.getStagedItemId() === p.itemId) {
        this.placementMechanic.stageItem(null);
      }
    }
  }

  override getView(): EngineView {
    return {
      activePrompt: this.content.prompt,
      entities: buildGT021ViewEntities(this),
    };
  }

  override getHintTargetIndex(): number | null {
    return resolveGT021HintTargetIndex(this);
  }

  override getHintDestinationIndex(): number | null {
    return resolveGT021HintDestinationIndex(this);
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    return resolveGT021HintTargetForLevel(this, level) ?? this.getHintTarget();
  }

  override getHintDemoSequence(
    level: HintLevel = 3
  ): readonly GT021DemoStep[] | null {
    return resolveGT021HintDemoSequence(this, level);
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    return computeGT021Slots(this, ageBand);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    const degraded =
      this.degradation?.particles_enabled === false || !rs.softShadowsEnabled;
    renderGT021(this, ctx, rs, timeMs, degraded);
  }
}
