import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveStageRect } from "#src/layout/stage-groups";
import type { Slot } from "#src/layout/types";
import {
  drawGT036Bead,
  drawGT036ClearButton,
  drawGT036MotifGroups,
  drawGT036RackAndTray,
} from "#src/render/gt-036-shapes";
import {
  beadStringSegments,
  drawBeadString,
  drawSceneBackground,
  drawStoryCharacterInStage,
  nightingaleSway,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  detectRule,
  type RuleDetectionResult,
} from "#src/systems/rule-detection-system";
import {
  computeBeadRackRows,
  computeGT036HintState,
  computeGT036Slots,
  computeMotifGroupSegments,
  computePaletteTrayBox,
  extractGT036Payload,
  type GT036ActionPayload,
  type GT036HintState,
  resolveGT036GestureAction,
} from "#src/templates/GT-036/layout";
import type {
  GT036Content,
  GT036Difficulty,
  GT036PaletteItem,
} from "#src/templates/GT-036/template";
import {
  buildGT036View,
  buildPaletteBeadRenderParams,
  buildTrackBeadRenderParams,
  computeBeadPopProgress,
  computeLitOrder,
  deleteGT036Clock,
  GT036_CLEAR_ASSET,
  getGT036Clock,
  isTrackCellLit,
  peekGT036Clock,
  GT036_LIGHT_STEP_MS as VIEW_LIGHT_STEP_MS,
} from "#src/templates/GT-036/view";

export const GT036_LIGHT_STEP_MS = VIEW_LIGHT_STEP_MS;

const QUIET_OK: ActionResult = Object.freeze({
  valid: true,
  feedback: "none",
});

export const GT036_STORY_LINE =
  "Họa Mi thích hát theo quy luật. Bé xâu các hạt thành một dãy lặp lại, rồi Họa Mi sẽ hát theo dãy của bé nhé!";
export const GT036_HAPPY_MS = 500;
export const GT036_INVITE_LINE = "Bé xâu thêm hạt cho dãy dài hơn nữa nhé!";
export const GT036_ENCOURAGE_MS = 1500;

export class GT036Session extends TemplateGameSession<
  GT036Content,
  GT036Difficulty
> {
  override readonly needsCommit = true;
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;

  placedItems: (string | null)[] = [];
  selectedPaletteId: string | null = null;
  submitted = false;
  detectedRule: RuleDetectionResult | null = null;
  isWin = false;
  sessionScore = 0;
  sessionStars = 0;

  private litElapsedMs = 0;
  private ageBand: AgeBand = "5-6";
  private pendingInvitation: string | null = null;
  private particles: Particle[] = [];
  private readonly mood = new MoodPulse();
  private readonly paletteMap: ReadonlyMap<string, GT036PaletteItem>;

  constructor(
    content: GT036Content,
    difficulty: GT036Difficulty,
    seedOrBand?: AgeBand | number,
    themeId?: string
  ) {
    super(
      content,
      difficulty,
      typeof seedOrBand === "number" ? seedOrBand : 0,
      themeId
    );
    this.paletteMap = new Map(content.palette.map((p) => [p.id, p]));
  }

  private get paletteBase(): number {
    return this.content.track_length;
  }

  private get clearSlotIndex(): number {
    return this.paletteBase + this.content.palette.length;
  }

  private get clearSlot(): Slot | undefined {
    return this.slots[this.clearSlotIndex];
  }

  private get hasPlaced(): boolean {
    return this.placedItems.some((item) => item !== null);
  }

  private get isClearVisible(): boolean {
    return (
      this.clearSlot !== undefined &&
      this.hasPlaced &&
      !(this.isWin || this.isWon)
    );
  }

  override canCommit(): boolean {
    return !(this.isWin || this.isWon) && this.hasPlaced;
  }

  override storyLine(): string {
    return GT036_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  setupEntities(): void {
    this.mood.clear();
    this.placedItems = new Array(this.content.track_length).fill(null);
    this.selectedPaletteId = this.content.palette[0]?.id ?? null;
    this.submitted = false;
    this.detectedRule = null;
    this.pendingInvitation = null;
    this.isWin = false;
    this.isWon = false;
    this.sessionScore = 0;
    this.sessionStars = 0;
    this.litElapsedMs = 0;
    this.particles = [];
    const clock = getGT036Clock(this);
    clock.activeHintLevel = 0;
    clock.hoveredSlotIndex = null;
    clock.lastPlacedSlotIndex = null;

    this.recordEvent("game_started", {
      template_code: "GT-036",
      difficulty: this.difficulty.track_length ?? 6,
      age_band: this.ageBand,
      device: "tablet",
      reduced_motion: false,
      round_index: 0,
    });
  }

  override destroy(): void {
    deleteGT036Clock(this);
    super.destroy();
  }

  private currentHintState(): GT036HintState {
    return computeGT036HintState({
      placedItems: this.placedItems,
      palette: this.content.palette,
      minRepetitions: this.content.min_repetitions,
      strictness: this.difficulty.strictness,
      selectedPaletteId: this.selectedPaletteId,
      paletteBase: this.paletteBase,
      slots: this.slots,
    });
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const hint = this.currentHintState();
    return hint.isReadyToCommit ? null : hint.singleTargetIndex;
  }

  override getHintDestinationIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const hint = this.currentHintState();
    return hint.isReadyToCommit ? null : hint.singleDestinationIndex;
  }

  override getHintTarget(): HintTarget | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const index = this.getHintTargetIndex();
    if (index !== null) {
      const toIndex = this.getHintDestinationIndex();
      return toIndex === null
        ? { kind: "slot", index }
        : { kind: "slot", index, toIndex };
    }
    if (
      this.placedItems.includes(null) === false ||
      this.currentHintState().isReadyToCommit
    ) {
      return { kind: "action" };
    }
    return super.getHintTarget();
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const hint = this.currentHintState();
    if (hint.isReadyToCommit) {
      return { kind: "action" };
    }
    if (level === 1) {
      return { kind: "region", ids: [...hint.l1Ids] };
    }
    if (level === 2) {
      return { kind: "region", ids: [...hint.l2Ids] };
    }
    const firstDemo = hint.demoSteps?.[0];
    if (firstDemo) {
      return { kind: "slot", index: firstDemo.from, toIndex: firstDemo.to };
    }
    return this.getHintTarget();
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    if (level !== 3 || this.isWin || this.isWon) {
      return null;
    }
    const hint = this.currentHintState();
    if (hint.isReadyToCommit) {
      return null;
    }
    return hint.demoSteps;
  }

  override onScaffoldEscalated(level: HintLevel): void {
    getGT036Clock(this).activeHintLevel = level;
  }

  override onHintCleared(): void {
    const clock = peekGT036Clock(this);
    if (clock) {
      clock.activeHintLevel = 0;
    }
  }

  setPointerOver(x: number, y: number): void {
    const clock = getGT036Clock(this);
    if (this.isClearVisible && this.clearSlot) {
      const clearHit = findHitSlotIndex(
        [this.clearSlot],
        x,
        y,
        "circle",
        TAP_TOLERANCE_PX
      );
      if (clearHit >= 0) {
        clock.hoveredSlotIndex = this.clearSlotIndex;
        return;
      }
    }
    const interactiveSlots = this.slots.slice(
      0,
      this.paletteBase + this.content.palette.length
    );
    const hitIdx = findHitSlotIndex(
      interactiveSlots,
      x,
      y,
      "circle",
      TAP_TOLERANCE_PX
    );
    clock.hoveredSlotIndex = hitIdx >= 0 ? hitIdx : null;
  }

  clearPointerOver(): void {
    const clock = peekGT036Clock(this);
    if (clock) {
      clock.hoveredSlotIndex = null;
    }
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    this.ageBand = band;
    return computeGT036Slots({
      logicSpace: this.logicSpace,
      stageRect: this.stageRect ?? null,
      band,
      cssPerLogic: this.cssPerLogic ?? 1,
      trackLength: this.content.track_length,
      paletteLength: this.content.palette.length,
    });
  }

  override validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }
    const data = extractGT036Payload(action.data);
    switch (action.type) {
      case "select_palette":
      case "palette":
        return this.validateSelectPalette(data);
      case "place_element":
      case "place":
        return this.validatePlaceElement(data);
      case "remove_element":
      case "remove":
        return this.validateRemoveElement(data);
      case "clear_track":
      case "clear":
        return this.hasPlaced ? ACTION_CORRECT : ACTION_IGNORED;
      case "submit_creation":
      case "submit":
        return this.validateSubmitCreation();
      default:
        return ACTION_IGNORED;
    }
  }

  private validateSelectPalette(data: GT036ActionPayload): ActionResult {
    const paletteId = data.paletteId ?? "";
    const exists = this.content.palette.some((p) => p.id === paletteId);
    return exists ? ACTION_CORRECT : ACTION_IGNORED;
  }

  private validatePlaceElement(data: GT036ActionPayload): ActionResult {
    const slotIdx = data.slotIndex ?? -1;
    if (slotIdx < 0 || slotIdx >= this.content.track_length) {
      return ACTION_IGNORED;
    }
    const elementId =
      typeof data.elementId === "string" && data.elementId !== ""
        ? data.elementId
        : this.selectedPaletteId;
    return elementId ? ACTION_CORRECT : ACTION_IGNORED;
  }

  private validateRemoveElement(data: GT036ActionPayload): ActionResult {
    const slotIdx = data.slotIndex ?? -1;
    return slotIdx >= 0 && slotIdx < this.content.track_length
      ? ACTION_CORRECT
      : ACTION_IGNORED;
  }

  private validateSubmitCreation(): ActionResult {
    const result = detectRule(this.placedItems, {
      minRepetitions: this.content.min_repetitions,
      strictness: this.difficulty.strictness,
      paletteSize: this.content.palette.length,
    });
    return result.isWin ? ACTION_CORRECT : QUIET_OK;
  }

  override commit(action: GameAction): void {
    const data = extractGT036Payload(action.data);
    switch (action.type) {
      case "select_palette":
      case "palette":
        this.commitSelectPalette(data);
        break;
      case "place_element":
      case "place":
        this.commitPlaceElement(data);
        break;
      case "remove_element":
      case "remove":
        this.commitRemoveElement(data);
        break;
      case "clear_track":
      case "clear":
        this.commitClearTrack();
        break;
      case "submit_creation":
      case "submit":
        this.commitSubmitCreation();
        break;
      default:
        break;
    }
  }

  private commitSelectPalette(data: GT036ActionPayload): void {
    const paletteId = data.paletteId ?? "";
    if (!this.content.palette.some((p) => p.id === paletteId)) {
      return;
    }
    this.selectedPaletteId = paletteId;
  }

  private commitPlaceElement(data: GT036ActionPayload): void {
    const slotIdx = data.slotIndex ?? -1;
    if (slotIdx < 0 || slotIdx >= this.content.track_length) {
      return;
    }
    const elementId =
      typeof data.elementId === "string" && data.elementId !== ""
        ? data.elementId
        : this.selectedPaletteId;
    if (!elementId) {
      return;
    }
    this.placedItems[slotIdx] = elementId;
    this.submitted = false;
    this.detectedRule = null;
    this.pendingInvitation = null;
    const clock = getGT036Clock(this);
    clock.activeHintLevel = 0;
    clock.lastPlacedSlotIndex = slotIdx;
    clock.lastPlacedAtMs = clock.simMs;
    this.queueSfx("bead_click");
    this.mood.set("happy", GT036_HAPPY_MS);

    this.recordEvent("element_placed", {
      slot_index: slotIdx,
      element_id: elementId,
      round_index: 0,
    });
  }

  private commitRemoveElement(data: GT036ActionPayload): void {
    const slotIdx = data.slotIndex ?? -1;
    if (slotIdx < 0 || slotIdx >= this.content.track_length) {
      return;
    }
    const removedId = this.placedItems[slotIdx];
    this.placedItems[slotIdx] = null;
    this.submitted = false;
    this.detectedRule = null;
    this.pendingInvitation = null;
    getGT036Clock(this).activeHintLevel = 0;

    this.recordEvent("element_removed", {
      slot_index: slotIdx,
      removed_id: removedId ?? undefined,
      round_index: 0,
    });
  }

  private commitClearTrack(): void {
    this.placedItems.forEach((removedId, slotIndex) => {
      if (removedId) {
        this.recordEvent("element_removed", {
          slot_index: slotIndex,
          removed_id: removedId,
          round_index: 0,
        });
      }
    });
    this.placedItems = new Array(this.content.track_length).fill(null);
    this.submitted = false;
    this.detectedRule = null;
    this.pendingInvitation = null;
    this.isWin = false;
    getGT036Clock(this).activeHintLevel = 0;
  }

  private commitSubmitCreation(): void {
    this.recordEvent("creation_submitted", {
      placed_items: this.placedItems,
      round_index: 0,
    });
    const result = detectRule(this.placedItems, {
      minRepetitions: this.content.min_repetitions,
      strictness: this.difficulty.strictness,
      paletteSize: this.content.palette.length,
    });
    this.submitted = true;
    this.litElapsedMs = 0;
    this.detectedRule = result;
    this.sessionScore = result.score;
    this.isWin = result.isWin;
    getGT036Clock(this).activeHintLevel = 0;

    this.recordEvent("rule_detected", {
      detected: result.detected,
      motif: result.motif,
      repetitions: result.repetitions,
      score: result.score,
      is_win: result.isWin,
      round_index: 0,
    });

    if (result.isWin) {
      this.isWon = true;
      if (result.score >= 100) {
        this.sessionStars = 3;
      } else if (result.score >= 80) {
        this.sessionStars = 2;
      } else {
        this.sessionStars = 1;
      }
      this.recordEvent("game_completed", {
        duration_ms: 10_000,
        rounds_total: 1,
        rounds_correct: 1,
      });
      const winSpan = result.motif.length * result.repetitions;
      const limit = Math.min(this.content.track_length, winSpan);
      for (let i = 0; i < limit; i++) {
        const slot = this.slots[i];
        if (this.placedItems[i] && slot) {
          this.particles.push(...spawnParticlesAtSlot(slot, 8));
        }
      }
      this.winSession();
      this.completeSession();
      return;
    }

    this.mood.set("encourage", GT036_ENCOURAGE_MS);
    this.pendingInvitation = GT036_INVITE_LINE;
  }

  override takeSpokenInvitation(): string | null {
    const line = this.pendingInvitation;
    this.pendingInvitation = null;
    return line;
  }

  update(deltaMs: number): void {
    getGT036Clock(this).simMs += deltaMs;
    this.mood.tick(deltaMs);
    if (this.submitted) {
      this.litElapsedMs += deltaMs;
    }
    if (this.particles.length > 0) {
      this.particles = updateParticles(this.particles);
    }
  }

  override toAction(gesture: Gesture): GameAction | null {
    return resolveGT036GestureAction({
      gesture,
      slots: this.slots,
      trackLength: this.content.track_length,
      paletteBase: this.paletteBase,
      palette: this.content.palette,
      placedItems: this.placedItems,
      selectedPaletteId: this.selectedPaletteId,
      clearSlot: this.clearSlot ?? null,
      isClearVisible: this.isClearVisible,
    });
  }

  override getView(): EngineView {
    return buildGT036View({
      content: this.content,
      paletteMap: this.paletteMap,
      slots: this.slots,
      placedItems: this.placedItems,
      selectedPaletteId: this.selectedPaletteId,
      submitted: this.submitted,
      detectedRule: this.detectedRule,
      litElapsedMs: this.litElapsedMs,
      clearSlotIndex: this.clearSlotIndex,
      isClearVisible: this.isClearVisible,
      focusIndex: this.getHintTargetIndex() ?? undefined,
    });
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem, timeMs = 0): void {
    drawSceneBackground(ctx, rs, this.themeId);
    const clock = peekGT036Clock(this);
    const softShadowsEnabled = this.degradation?.soft_shadows_enabled !== false;
    const stageBounds = resolveStageRect(
      this.logicSpace,
      this.ageBand,
      this.stageRect
    );
    const trackSlots = this.slots.slice(0, this.content.track_length);
    const paletteSlots = this.slots.slice(
      this.paletteBase,
      this.paletteBase + this.content.palette.length
    );
    const hintLevel = clock?.activeHintLevel ?? 0;
    const hint = hintLevel > 0 ? this.currentHintState() : null;
    const animMs = clock && clock.simMs > 0 ? clock.simMs : timeMs;

    drawGT036RackAndTray(ctx, rs, {
      rows: computeBeadRackRows(trackSlots, stageBounds),
      trayBox: computePaletteTrayBox(paletteSlots, stageBounds),
      hintL2Active: hintLevel === 2,
      softShadowsEnabled,
      timeMs: animMs,
    });

    drawBeadString(ctx, beadStringSegments(trackSlots));

    const litLen = this.submitted
      ? computeLitOrder(this.placedItems, this.detectedRule).length
      : 0;
    drawStoryCharacterInStage(
      ctx,
      "nightingale",
      this.stageRect,
      this.slots,
      nightingaleSway(
        this.litElapsedMs,
        GT036_LIGHT_STEP_MS,
        litLen,
        rs.reducedMotion
      )
    );

    if (this.submitted && this.detectedRule?.detected) {
      const showRepeatBadge = !(
        this.degradation?.particles_enabled === false &&
        this.degradation?.soft_shadows_enabled === false
      );
      drawGT036MotifGroups(ctx, rs, {
        segments: computeMotifGroupSegments(
          trackSlots,
          this.detectedRule.motif.length,
          this.detectedRule.repetitions,
          stageBounds
        ),
        showRepeatBadge,
      });
    }

    if (this.clearSlot && this.isClearVisible) {
      drawGT036ClearButton(ctx, rs, {
        slot: this.clearSlot,
        asset: GT036_CLEAR_ASSET,
        isHovered: clock?.hoveredSlotIndex === this.clearSlotIndex,
        softShadowsEnabled,
      });
    }

    this.renderTrackBeads(
      ctx,
      rs,
      trackSlots,
      clock,
      hintLevel,
      hint,
      softShadowsEnabled
    );
    this.renderPaletteBeads(
      ctx,
      rs,
      paletteSlots,
      clock,
      hintLevel,
      hint,
      softShadowsEnabled,
      animMs
    );

    if (
      this.particles.length > 0 &&
      this.degradation?.particles_enabled !== false
    ) {
      rs.drawParticles(ctx, this.particles);
    }
  }

  private renderTrackBeads(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    trackSlots: readonly Slot[],
    clock: ReturnType<typeof peekGT036Clock>,
    hintLevel: number,
    hint: GT036HintState | null,
    softShadowsEnabled: boolean
  ): void {
    const l1Set = new Set(hint?.l1Ids ?? []);
    for (let i = 0; i < trackSlots.length; i++) {
      const slot = trackSlots[i];
      if (!slot) {
        continue;
      }
      const lit = isTrackCellLit({
        placedItems: this.placedItems,
        submitted: this.submitted,
        detectedRule: this.detectedRule,
        litElapsedMs: this.litElapsedMs,
        index: i,
        instant: rs.reducedMotion,
      });
      drawGT036Bead(
        ctx,
        rs,
        buildTrackBeadRenderParams({
          slot,
          index: i,
          elementId: this.placedItems[i],
          palette: this.content.palette,
          paletteMap: this.paletteMap,
          lit,
          isHovered: clock?.hoveredSlotIndex === i,
          isHintL1: hintLevel === 1 && l1Set.has(`track_${i}`),
          popProgress: computeBeadPopProgress(clock, i, rs.reducedMotion),
          reducedMotion: rs.reducedMotion,
          softShadowsEnabled,
        })
      );
    }
  }

  private renderPaletteBeads(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    paletteSlots: readonly Slot[],
    clock: ReturnType<typeof peekGT036Clock>,
    hintLevel: number,
    hint: GT036HintState | null,
    softShadowsEnabled: boolean,
    animMs: number
  ): void {
    const l2Set = new Set(hint?.l2Ids ?? []);
    for (let i = 0; i < paletteSlots.length; i++) {
      const slot = paletteSlots[i];
      const item = this.content.palette[i];
      if (!(slot && item)) {
        continue;
      }
      drawGT036Bead(
        ctx,
        rs,
        buildPaletteBeadRenderParams({
          slot,
          item,
          paletteIndex: i,
          isSelected: this.selectedPaletteId === item.id,
          isHovered: clock?.hoveredSlotIndex === this.paletteBase + i,
          isHintL2: hintLevel === 2 && l2Set.has(`palette_${item.id}`),
          reducedMotion: rs.reducedMotion,
          softShadowsEnabled,
          animMs,
        })
      );
    }
  }

  ruleOverlayText(): string | null {
    if (!(this.submitted && this.detectedRule?.detected)) {
      return null;
    }
    return `Tuyệt vời! Quy luật của bé lặp lại ${this.detectedRule.repetitions} lần!`;
  }

  get score(): number {
    return this.sessionScore;
  }

  get stars(): number {
    return this.sessionStars;
  }

  get placedElements(): readonly (string | null)[] {
    return this.placedItems;
  }
}
