import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import type { Slot } from "#src/layout/types";
import {
  SelectionMechanic,
  type SelectionValidationRule,
} from "#src/mechanics/selection-mechanic";
import {
  drawGT002ActionCornerPin,
  drawGT002CriterionHeader,
  drawGT002CriterionHintRegion,
  type GT002CollectedChip,
  inferFallbackCriterionAnchor,
} from "#src/render/gt-002-criterion";
import {
  drawGT002BoardFrame,
  drawGT002ChoicePlate,
  drawGT002WrongRing,
} from "#src/render/gt-002-shapes";
import {
  drawSceneBackground,
  type ItemVisualState,
  spawnParticlesAtSlot,
} from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import { deriveStream } from "#src/rng/mulberry32";
import { shuffle } from "#src/rng/shuffle";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import {
  GT002_DEFAULT_STORY_LINE,
  resolveGT002ThemeProfile,
} from "#src/templates/GT-002/gt002-story-lines";
import {
  computeGT002StageLayout,
  type GT002StageLayout,
  type GT002TokenAnimState,
  resolveGT002PlateShape,
  stepParticlesByDelta,
  toHitShape,
} from "#src/templates/GT-002/layout";
import type {
  GT002Content,
  GT002Difficulty,
} from "#src/templates/GT-002/template";

type TargetItem = GT002Content["items"][number];

interface SessionClockState {
  ms: number;
  winAtMs: number | null;
  selectedAtMs: Map<string, number>;
}

const SESSION_CLOCKS = new WeakMap<GT002Session, SessionClockState>();

function getClockState(session: GT002Session): SessionClockState {
  let state = SESSION_CLOCKS.get(session);
  if (!state) {
    state = { ms: 0, winAtMs: null, selectedAtMs: new Map() };
    SESSION_CLOCKS.set(session, state);
  }
  return state;
}

function resetClockState(session: GT002Session): void {
  const state = getClockState(session);
  state.ms = 0;
  state.winAtMs = null;
  state.selectedAtMs.clear();
}

function readClockMs(session: GT002Session): number {
  return getClockState(session).ms;
}

function writeClockMs(session: GT002Session, ms: number): void {
  getClockState(session).ms = ms;
}

function extractItemId(data: GameAction["data"]): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const raw = Reflect.get(data, "item_id");
  if (typeof raw === "string" && raw.length > 0) {
    return raw;
  }
  if (typeof raw === "number" || typeof raw === "boolean") {
    return String(raw);
  }
  return null;
}

function assetHasAudioPath(asset: TargetItem["asset"] | undefined): boolean {
  return (
    asset !== undefined &&
    "audio_path" in asset &&
    typeof asset.audio_path === "string" &&
    asset.audio_path.length > 0
  );
}

function hasSpokenWordPriority(item: TargetItem): boolean {
  return (
    assetHasAudioPath(item.asset) ||
    assetHasAudioPath(item.secondary_asset) ||
    item.asset.kind === "text"
  );
}

/** Hằng khung chuyện mặc định giữ tương thích ngược (`BR-E002-05`). */
export const GT002_STORY_LINE = GT002_DEFAULT_STORY_LINE;

/** Mascot reo ngắn sau mỗi lần chọn vật (`BR-E002-05`). */
export const GT002_CHEER_MS = 800;
/** Mascot nghiêng đầu sau lần xác nhận chưa đúng. */
export const GT002_WONDER_MS = 1500;

export class GT002Session extends TemplateGameSession<
  GT002Content,
  GT002Difficulty
> {
  displayItems: readonly TargetItem[] = [];
  private readonly mechanic = new SelectionMechanic({ mode: "multi" });
  degradation: DegradationState | null = null;
  private particles: Particle[] = [];
  private readonly wrongFlash = new WrongFlash();
  private readonly mood = new MoodPulse();
  private isRoundClosed = false;
  private pressedItemId: string | null = null;
  private activeAgeBand: AgeBand = "4-5";
  private activeHintLevel: 0 | HintLevel = 0;

  /** Nút Xong ở `zones.action` (`BR-PSZ-05`); chỉ sáng khi đã chọn ít nhất một vật. */
  override readonly needsCommit = true;
  override readonly usesPromptZone = true;

  setupEntities(): void {
    this.mechanic.reset();
    this.isWon = false;
    this.isRoundClosed = false;
    this.pressedItemId = null;
    this.particles = [];
    this.wrongFlash.clear();
    this.mood.clear();
    this.activeHintLevel = 0;
    resetClockState(this);

    if (this.content.preserve_order === true) {
      this.displayItems = [...this.content.items];
    } else {
      const rng = deriveStream(this.layoutSeed, "items");
      this.displayItems = shuffle(this.content.items, rng);
    }

    if (
      this.content.preselected_item_ids &&
      this.content.preselected_item_ids.length > 0
    ) {
      const validIds = new Set(this.content.items.map((it) => it.item_id));
      this.mechanic.setSelectedIds(
        this.content.preselected_item_ids.filter((id) => validIds.has(id))
      );
    }
  }

  private resolveStageLayout(ageBand = this.activeAgeBand): GT002StageLayout {
    return computeGT002StageLayout({
      itemCount: this.displayItems.length,
      ageBand,
      logicSpace: this.logicSpace,
      stageRect: this.stageRect,
      cssPerLogic: this.cssPerLogic,
    });
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    this.activeAgeBand = ageBand;
    return this.resolveStageLayout(ageBand).slots;
  }

  private getSelectionRule(): SelectionValidationRule {
    const mode = this.content.selection_mode ?? "all_matching";
    if (mode === "exact_count") {
      const correctTotal = this.content.items.filter(
        (it) => it.is_correct
      ).length;
      return {
        selectionRule: "exact_count",
        requiredSelectCount: this.content.required_select_count ?? correctTotal,
      };
    }
    return { selectionRule: "all_matching" };
  }

  override isAcceptingInput(): boolean {
    return !this.isRoundClosed;
  }

  override canCommit(): boolean {
    return !(this.isWon || this.isRoundClosed) && this.hasSelection();
  }

  private hasSelection(): boolean {
    return this.mechanic.getSelectedIds().length > 0;
  }

  override storyLine(): string {
    return resolveGT002ThemeProfile(this.themeId).storyLine;
  }

  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  override onScaffoldEscalated(level: HintLevel): void {
    this.activeHintLevel = level;
  }

  override onHintCleared(): void {
    this.activeHintLevel = 0;
  }

  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
    writeClockMs(this, readClockMs(this) + deltaMs);
    if (this.particles.length > 0) {
      this.particles = stepParticlesByDelta(this.particles, deltaMs);
    }
  }

  override destroy(): void {
    super.destroy();
    this.wrongFlash.clear();
    this.mood.clear();
    this.pressedItemId = null;
    this.isRoundClosed = false;
    this.activeHintLevel = 0;
    this.particles = [];
    resetClockState(this);
  }

  isWrongFlashing(): boolean {
    return this.wrongFlash.isActive(readClockMs(this));
  }

  setTouchingItem(itemId: string | null): void {
    if (this.isWon || this.isRoundClosed) {
      this.pressedItemId = null;
      return;
    }
    if (
      itemId !== null &&
      this.displayItems.some((it) => it.item_id === itemId)
    ) {
      this.pressedItemId = itemId;
      return;
    }
    this.pressedItemId = null;
  }

  private isRevealedAnswerOnClose(itemId: string): boolean {
    const mode = this.content.selection_mode ?? "all_matching";
    if (mode !== "exact_count") {
      return (
        this.content.items.find((it) => it.item_id === itemId)?.is_correct ===
        true
      );
    }
    const req =
      this.content.required_select_count ??
      this.content.items.filter((it) => it.is_correct).length;
    let seen = 0;
    for (const item of this.displayItems) {
      if (item.is_correct) {
        seen++;
        if (item.item_id === itemId) {
          return seen <= req;
        }
      }
    }
    return false;
  }

  getItemState(itemId: string): ItemVisualState {
    const item = this.content.items.find((it) => it.item_id === itemId);
    if (this.isWon) {
      const mode = this.content.selection_mode ?? "all_matching";
      if (mode === "exact_count") {
        return item?.is_correct && this.mechanic.isSelected(itemId)
          ? "correct"
          : "idle";
      }
      return item?.is_correct ? "correct" : "idle";
    }
    if (this.isRoundClosed) {
      return this.isRevealedAnswerOnClose(itemId) ? "selected" : "idle";
    }
    if (this.mechanic.isSelected(itemId)) {
      return "selected";
    }
    if (this.pressedItemId === itemId) {
      return "touching";
    }
    return "idle";
  }

  getRenderState(itemId: string): ItemVisualState {
    if (
      !this.isWon &&
      this.isWrongFlashing() &&
      this.mechanic.isSelected(itemId)
    ) {
      return "wrong";
    }
    return this.getItemState(itemId);
  }

  toggleItemSelection(itemId: string): void {
    if (this.isWon || this.isRoundClosed) {
      return;
    }
    const item = this.content.items.find((it) => it.item_id === itemId);
    if (!item) {
      return;
    }
    this.pressedItemId = null;
    this.wrongFlash.clear();
    const wasSelected = this.mechanic.isSelected(itemId);
    this.mechanic.toggle(itemId);
    const clock = getClockState(this);
    if (wasSelected) {
      clock.selectedAtMs.delete(itemId);
      return;
    }
    clock.selectedAtMs.set(itemId, clock.ms);
    this.recordEvent("item_selected", {
      item_id: item.item_id,
      is_correct: item.is_correct,
    });
    if (!hasSpokenWordPriority(item)) {
      this.queueSfx(resolveGT002ThemeProfile(this.themeId).selectSfx);
    }
    this.mood.set("cheer", GT002_CHEER_MS);
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "toggle_item") {
      const itemId = extractItemId(action.data);
      const exists =
        itemId !== null && this.content.items.some((i) => i.item_id === itemId);
      return exists ? { valid: true, feedback: "none" } : ACTION_IGNORED;
    }
    const items = this.content.items.map((i) => ({
      id: i.item_id,
      isCorrect: i.is_correct,
    }));
    return this.mechanic.validate(action, items, this.getSelectionRule());
  }

  private spawnVictoryParticles(): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    const mode = this.content.selection_mode ?? "all_matching";
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = this.slots[i];
      const shouldCelebrate =
        mode === "exact_count"
          ? Boolean(item?.is_correct && this.mechanic.isSelected(item.item_id))
          : Boolean(item?.is_correct);
      if (shouldCelebrate && slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 6));
      }
    }
  }

  onSubmitSelection(): void {
    if (this.isWon || this.isRoundClosed) {
      return;
    }
    this.pressedItemId = null;
    const result = this.validateAction({
      type: "submit_selection",
      data: {},
    });
    const nowMs = readClockMs(this);
    this.recordEvent("selection_submitted", { is_correct: result.valid });
    if (result.valid) {
      getClockState(this).winAtMs = nowMs;
      this.spawnVictoryParticles();
      this.winSession();
      return;
    }
    this.wrongFlash.trigger(nowMs);
    this.mood.set("wonder", GT002_WONDER_MS);
    if (this.difficulty.allow_retry === false) {
      this.isRoundClosed = true;
      this.completeSession();
    }
  }

  private toEntityState(rawState: ItemVisualState): ViewEntity["state"] {
    if (rawState === "correct") {
      return "correct";
    }
    if (rawState === "selected") {
      return "selected";
    }
    return "idle";
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];

    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = this.slots[i];
      if (!(item && slot)) {
        continue;
      }
      const rawState = this.getItemState(item.item_id);
      const state = this.toEntityState(rawState);
      const labels = resolveAssetLabels(item.asset);
      const secondaryLabels =
        !labels.spokenLabel && item.secondary_asset
          ? resolveAssetLabels(item.secondary_asset)
          : undefined;
      const hitShape = toHitShape(resolveGT002PlateShape(item));
      entities.push({
        id: item.item_id,
        slotIndex: i,
        role: "neutral",
        state,
        ...labels,
        label: item.label ?? labels.label,
        spokenLabel:
          labels.spokenLabel ?? secondaryLabels?.spokenLabel ?? item.label,
        spokenAudioPath:
          labels.spokenAudioPath ?? secondaryLabels?.spokenAudioPath,
        hitShape,
        x: slot.x,
        y: slot.y,
        w: slot.hitW,
        h: slot.hitH,
        hitW: slot.hitW,
        hitH: slot.hitH,
      });
    }
    return {
      entities,
      activePrompt: this.content.prompt,
    };
  }

  override dispatch(gesture: Gesture): ActionResult | undefined {
    if (this.isRoundClosed) {
      return ACTION_IGNORED;
    }
    return super.dispatch(gesture);
  }

  private findPolymorphicHitIndex(x: number, y: number): number {
    let bestIndex = -1;
    let minDistanceSq = Number.POSITIVE_INFINITY;
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const item = this.displayItems[i];
      if (!(slot && item)) {
        continue;
      }
      const shape = toHitShape(resolveGT002PlateShape(item));
      if (!isPointInSlot(slot, x, y, shape, TAP_TOLERANCE_PX)) {
        continue;
      }
      const dx = x - slot.x;
      const dy = y - slot.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    if (gesture.type === "commit") {
      return this.hasSelection()
        ? { type: "submit_selection", data: {} }
        : null;
    }
    if (gesture.type !== "tap") {
      return null;
    }
    const hitIndex = this.findPolymorphicHitIndex(gesture.x, gesture.y);
    const item = hitIndex >= 0 ? this.displayItems[hitIndex] : undefined;
    return item
      ? { type: "toggle_item", data: { item_id: item.item_id } }
      : null;
  }

  private computeRemainingHintIndices(): readonly number[] {
    const unselectedCorrect: number[] = [];
    const selectedCorrect: number[] = [];
    const selectedDistractor: number[] = [];

    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      if (!item) {
        continue;
      }
      const selected = this.mechanic.isSelected(item.item_id);
      if (item.is_correct) {
        if (selected) {
          selectedCorrect.push(i);
        } else {
          unselectedCorrect.push(i);
        }
      } else if (selected) {
        selectedDistractor.push(i);
      }
    }

    const mode = this.content.selection_mode ?? "all_matching";
    if (mode === "exact_count") {
      const req = Math.max(
        1,
        Math.min(
          selectedCorrect.length + unselectedCorrect.length,
          this.content.required_select_count ??
            selectedCorrect.length + unselectedCorrect.length
        )
      );
      const deficit = Math.max(0, req - selectedCorrect.length);
      const excessCorrect =
        selectedCorrect.length > req ? selectedCorrect.slice(req) : [];
      return [
        ...unselectedCorrect.slice(0, deficit),
        ...selectedDistractor,
        ...excessCorrect,
      ];
    }
    return [...unselectedCorrect, ...selectedDistractor];
  }

  override getHintTargetIndex(): number | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    const steps = this.computeRemainingHintIndices();
    return steps[0] ?? null;
  }

  override getHintTarget(): HintTarget | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    return super.getHintTarget();
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (this.isWon || this.isRoundClosed) {
      return null;
    }
    if (level === 1 && this.getHintTargetIndex() !== null) {
      return { kind: "region", ids: ["gt002-criterion-header"] };
    }
    return this.getHintTarget();
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    if (level !== 3 || this.isWon || this.isRoundClosed) {
      return null;
    }
    const steps = this.computeRemainingHintIndices();
    return steps.length >= 2 ? steps.map((idx) => ({ from: idx })) : null;
  }

  override commit(action: GameAction): void {
    if (action.type === "toggle_item") {
      const itemId = extractItemId(action.data);
      if (itemId !== null) {
        this.toggleItemSelection(itemId);
      }
    } else if (action.type === "submit_selection") {
      this.onSubmitSelection();
    }
  }

  private resolveL1SoftDimmedIds(): ReadonlySet<string> | null {
    if (this.activeHintLevel < 1 || this.isWon || this.isRoundClosed) {
      return null;
    }
    const unselectedDistractors = this.displayItems.filter(
      (it) => !(it.is_correct || this.mechanic.isSelected(it.item_id))
    );
    const cap = Math.floor(unselectedDistractors.length / 2);
    if (cap <= 0) {
      return null;
    }
    return new Set(unselectedDistractors.slice(0, cap).map((it) => it.item_id));
  }

  private collectSelectedChips(): readonly GT002CollectedChip[] {
    const chips: GT002CollectedChip[] = [];
    for (const item of this.displayItems) {
      if (this.mechanic.isSelected(item.item_id)) {
        chips.push({
          asset: item.secondary_asset ?? item.asset,
          colorToken: item.geometric_spec?.color_token,
        });
      }
    }
    return chips;
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    writeClockMs(this, timeMs);
    const slots = this.slots;
    const stageLayout = this.resolveStageLayout();
    const profile = resolveGT002ThemeProfile(this.themeId);
    const anchor = inferFallbackCriterionAnchor(this.content, this.themeId);
    const allowNegated = this.activeAgeBand === "5-6";
    const selectionMode = this.content.selection_mode ?? "all_matching";
    const requiredCount =
      this.content.required_select_count ??
      this.content.items.filter((it) => it.is_correct).length;

    drawSceneBackground(ctx, rs, this.themeId);
    drawGT002BoardFrame(ctx, rs, stageLayout.boardRect, profile.boardStyle);
    drawGT002CriterionHeader(ctx, rs, stageLayout, {
      anchor,
      allowNegated,
      selectionMode,
      requiredSelectCount: requiredCount,
      selectedChips: this.collectSelectedChips(),
      isWon: this.isWon,
      isWrongFlashing: this.wrongFlash.isActive(timeMs),
      hintLevel: this.activeHintLevel,
    });
    drawGT002ActionCornerPin(
      ctx,
      rs,
      stageLayout.actionPinRect,
      anchor,
      allowNegated
    );
    this.drawInteractive(rs, ctx, slots, timeMs);
    this.drawFeedback(rs, ctx, stageLayout, slots, timeMs);
  }

  private buildTokenAnim(itemId: string, timeMs: number): GT002TokenAnimState {
    const clock = getClockState(this);
    const selectedAt = clock.selectedAtMs.get(itemId);
    const selectElapsedMs =
      selectedAt === undefined ? 9999 : Math.max(0, timeMs - selectedAt);
    const winElapsedMs =
      clock.winAtMs === null ? 0 : Math.max(0, timeMs - clock.winAtMs);
    const isActiveWrong = this.wrongFlash.isActive(timeMs);
    const wrongProgress = isActiveWrong ? this.wrongFlash.progress(timeMs) : 0;
    return {
      timeMs,
      selectElapsedMs,
      winElapsedMs,
      wrongProgress,
      isActiveWrong,
      isHintActive: this.activeHintLevel >= 1 && !this.isWon,
    };
  }

  private drawInteractive(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    slots: readonly Slot[],
    timeMs: number
  ): void {
    const dimmedSet = this.resolveL1SoftDimmedIds();
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = slots[i];
      if (!(slot && item)) {
        continue;
      }
      const renderState = this.getRenderState(item.item_id);
      const anim = this.buildTokenAnim(item.item_id, timeMs);
      const plateVariant = resolveGT002PlateShape(item);
      drawGT002ChoicePlate(
        ctx,
        rs,
        slot,
        i,
        {
          id: item.item_id,
          asset: item.asset,
          secondaryAsset: item.secondary_asset,
          label: item.label,
          state: renderState,
          plateVariant,
          geometricSpec: item.geometric_spec,
          representation: item.representation
            ? {
                kind: item.representation.kind,
                count: item.representation.count,
                max: item.representation.max,
                min: item.representation.min,
              }
            : undefined,
          isSoftDimmed: dimmedSet?.has(item.item_id) === true,
          isSpeakingPulse:
            renderState === "selected" &&
            hasSpokenWordPriority(item) &&
            anim.selectElapsedMs < 520,
        },
        anim
      );
    }
  }

  private drawFeedback(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D,
    stageLayout: GT002StageLayout,
    slots: readonly Slot[],
    timeMs: number
  ): void {
    if (
      this.activeHintLevel === 1 &&
      !this.isWon &&
      !this.isRoundClosed &&
      this.getHintTargetIndex() !== null
    ) {
      drawGT002CriterionHintRegion(ctx, rs, stageLayout, timeMs);
    }
    for (let i = 0; i < this.displayItems.length; i++) {
      const item = this.displayItems[i];
      const slot = slots[i];
      if (!(slot && item)) {
        continue;
      }
      if (this.getRenderState(item.item_id) === "wrong") {
        const anim = this.buildTokenAnim(item.item_id, timeMs);
        drawGT002WrongRing(
          ctx,
          rs,
          slot,
          i,
          anim,
          resolveGT002PlateShape(item)
        );
      }
    }
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    if (this.particles.length === 0) {
      return;
    }
    rs.drawParticles(ctx, this.particles);
  }
}
