import { TOUCH_FLOORS } from "@mindkid/shared/touch-floors";
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
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import type { Slot } from "#src/layout/types";
import {
  JAR_STAR_FLIGHT_MS,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import type {
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "#src/systems/hint-ladder";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  buildGT037Symbols,
  chooseGT037CandidateSlots,
  computeGT037BoardBox,
  computeGT037HintRegion,
  type GT037Commission,
  type GT037OrderStep,
  type GT037SlotGridMeta,
  isBrokenGT037Symbol,
  placeGT037Slots,
  restoreGT037Progress,
  SCATTER_BOARD_CAPACITY,
  snapshotGT037Progress,
  trimGT037BoardSymbols,
} from "./board-builder.js";
import {
  buildGT037View,
  captureGT037Stamp,
  deleteGT037Clock,
  GT037_WRONG_FLASH_MS,
  getGT037Clock,
  peekGT037Clock,
  renderGT037Frame,
  resetGT037ClockForRound,
} from "./layout.js";
import type { GT037Content, GT037Difficulty, GT037Symbol } from "./template.js";

export const GT037_TOUCH_CSS_PX_4_5 = TOUCH_FLOORS.kidBand3_4;

export const GT037_STORY_LINE =
  "Gấu Con đi nhặt đồ bỏ vào lọ, bé tìm giúp Gấu Con tất cả nhé!";

export const GT037_CHEER_MS = 1200;

interface TapSymbolPayload {
  readonly slotIndex: number;
  readonly symbolId: string;
}

function parseTapSymbolPayload(
  data: GameActionValue | undefined
): TapSymbolPayload | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const slotIndex = Reflect.get(data, "slotIndex");
  const symbolId = Reflect.get(data, "symbolId");
  if (typeof slotIndex !== "number" || !Number.isFinite(slotIndex)) {
    return null;
  }
  if (typeof symbolId !== "string") {
    return null;
  }
  return { slotIndex, symbolId };
}

export class GT037Session extends TemplateGameSession<
  GT037Content,
  GT037Difficulty
> {
  override readonly usesPromptZone = true;
  override readonly needsCommit: boolean;

  boardSymbols: GT037Symbol[] = [];
  rotations: number[] = [];
  slotGridMeta: GT037SlotGridMeta[] = [];
  readonly foundTargets = new Set<number>();
  readonly commissions: GT037Commission[] = [];
  readonly order: GT037OrderStep[] = [];
  private particles: Particle[] = [];
  degradation: DegradationState | null = null;
  wrongSlotIndex: number | null = null;
  itemCount = 0;
  targetCopies = 0;
  effectiveTargetCopies = 0;
  targetSet = new Set<string>();
  usesOwnTouchFloor = false;
  private pendingStartEvent = false;
  private roundClosedOnWrong = false;
  private setupCount = 0;
  private activeRoundSeed: number;
  private currentBand: AgeBand = "5-6";
  private boardBand: AgeBand | null = null;
  private cheerRemainingMs = 0;

  constructor(
    content: GT037Content,
    difficulty: GT037Difficulty = {},
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
    this.activeRoundSeed = layoutSeed;
    this.needsCommit = this.difficulty.finish_mode === "declare";
    this.targetSet = new Set(content.target_ids);
  }

  override isAcceptingInput(): boolean {
    return !(this.isWon || this.isCompleted || this.roundClosedOnWrong);
  }

  override canCommit(): boolean {
    return this.isAcceptingInput();
  }

  get finishMode(): "auto" | "declare" {
    return this.difficulty.finish_mode ?? "auto";
  }

  get targetSymbol(): GT037Symbol | undefined {
    const firstId = this.content.target_ids[0];
    return this.content.symbols.find((s) => s.id === firstId);
  }

  get showTargetCounter(): boolean {
    return this.difficulty.show_target_counter ?? this.finishMode === "auto";
  }

  getCounterText(): string {
    if (this.showTargetCounter) {
      return `Đã tìm: ${this.foundTargets.size}/${this.effectiveTargetCopies}`;
    }
    const targetSym = this.targetSymbol;
    const targetLabel = targetSym?.label ?? targetSym?.id ?? "ký hiệu";
    return `Tìm tất cả ${targetLabel}`;
  }

  private recomputeEffectiveTargetCopies(): void {
    let validTargets = 0;
    for (const sym of this.boardSymbols) {
      if (this.targetSet.has(sym.id) && !isBrokenGT037Symbol(sym)) {
        validTargets++;
      }
    }
    this.effectiveTargetCopies = validTargets;
  }

  setupEntities(): void {
    this.setupCount += 1;
    this.activeRoundSeed =
      this.setupCount <= 1
        ? this.layoutSeed
        : Math.abs(this.layoutSeed + (this.setupCount - 1) * 7919) %
          2_147_483_647;
    this.isWon = false;
    this.isCompleted = false;
    this.roundClosedOnWrong = false;
    this.foundTargets.clear();
    this.commissions.length = 0;
    this.order.length = 0;
    this.particles = [];
    this.wrongSlotIndex = null;
    this.cheerRemainingMs = 0;
    resetGT037ClockForRound(this);
    this.rebuildBoard();
    this.pendingStartEvent = true;
  }

  private flushStartEvent(): void {
    if (!this.pendingStartEvent) {
      return;
    }
    this.pendingStartEvent = false;
    this.recordEvent("game_started", {
      template_code: "GT-037",
      item_count: this.itemCount,
      target_copies: this.targetCopies,
      target_ids: this.content.target_ids,
      confusable_ids: this.content.confusable_ids,
    });
  }

  private rebuildBoard(): void {
    this.boardBand = this.currentBand;
    this.targetSet = new Set(this.content.target_ids);
    const maxBandCapacity = SCATTER_BOARD_CAPACITY[this.currentBand] ?? 20;
    const requestedCount =
      this.difficulty.item_count ?? this.content.item_count;
    this.itemCount = Math.min(requestedCount, maxBandCapacity);
    this.targetCopies = Math.min(
      this.difficulty.target_copies ?? this.content.target_copies,
      this.itemCount
    );
    this.boardSymbols = buildGT037Symbols(
      this.content,
      this.itemCount,
      this.targetCopies,
      this.targetSet,
      this.activeRoundSeed,
      this.currentBand
    );
    this.recomputeEffectiveTargetCopies();
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    this.currentBand = band;
    const saved = snapshotGT037Progress(
      this.foundTargets,
      this.boardSymbols,
      this.order,
      this.commissions
    );
    const maxBandCapacity = SCATTER_BOARD_CAPACITY[band] ?? 20;
    if (this.boardSymbols.length === 0) {
      this.setupEntities();
    } else if (this.itemCount > maxBandCapacity || this.boardBand !== band) {
      this.rebuildBoard();
    }

    const chosen = chooseGT037CandidateSlots(
      band,
      maxBandCapacity,
      this.itemCount,
      this.targetCopies,
      this.logicSpace,
      this.stageRect,
      this.cssPerLogic ?? 1
    );
    this.usesOwnTouchFloor = chosen.usesOwnTouchFloor;
    if (chosen.count !== this.itemCount) {
      this.itemCount = chosen.count;
      this.boardSymbols = trimGT037BoardSymbols(
        this.boardSymbols,
        this.targetSet,
        chosen.count,
        this.activeRoundSeed
      );
      this.recomputeEffectiveTargetCopies();
    }
    restoreGT037Progress(
      saved,
      this.boardSymbols,
      this.foundTargets,
      this.order,
      this.commissions
    );
    this.flushStartEvent();

    const placed = placeGT037Slots(
      chosen.slots,
      this.boardSymbols,
      this.itemCount,
      this.activeRoundSeed,
      this.difficulty.rotation_jitter !== false
    );
    this.rotations = placed.rotations;
    this.slotGridMeta = placed.gridMeta;
    return placed.slots;
  }

  override getHintTargetIndex(): number | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    for (let i = 0; i < this.boardSymbols.length; i++) {
      const sym = this.boardSymbols[i];
      if (
        sym &&
        this.targetSet.has(sym.id) &&
        !isBrokenGT037Symbol(sym) &&
        !this.foundTargets.has(i)
      ) {
        return i;
      }
    }
    return null;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const targetIdx = this.getHintTargetIndex();
    if (targetIdx === null) {
      return this.needsCommit && this.canCommit() ? { kind: "action" } : null;
    }
    if (level === 1 || level === 2) {
      const boardBox = computeGT037BoardBox(
        this.slots,
        this.stageRect,
        this.logicSpace
      );
      const region = computeGT037HintRegion(
        level,
        targetIdx,
        this.slots,
        this.slotGridMeta,
        this.boardSymbols,
        boardBox
      );
      return region ? { kind: "region", ids: region.ids } : null;
    }
    return { kind: "slot", index: targetIdx };
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    if (!this.isAcceptingInput() || level !== 3) {
      return null;
    }
    const unfoundTargets: number[] = [];
    for (let i = 0; i < this.boardSymbols.length; i++) {
      const sym = this.boardSymbols[i];
      if (
        sym &&
        this.targetSet.has(sym.id) &&
        !isBrokenGT037Symbol(sym) &&
        !this.foundTargets.has(i)
      ) {
        unfoundTargets.push(i);
      }
    }
    return unfoundTargets.length > 0
      ? unfoundTargets.slice(0, 3).map((from) => ({ from }))
      : null;
  }

  override onScaffoldEscalated(level: HintLevel): void {
    getGT037Clock(this).activeHintLevel = level;
  }

  override onHintCleared(): void {
    const clock = peekGT037Clock(this);
    if (clock) {
      clock.activeHintLevel = 0;
    }
  }

  override checkWinCondition(): boolean {
    return this.isWon;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    if (gesture.type === "commit" && this.needsCommit) {
      return { type: "commit_declare", data: {} };
    }
    if (gesture.type === "tap") {
      const hitIndex = findHitSlotIndex(
        this.slots,
        gesture.x,
        gesture.y,
        "circle",
        TAP_TOLERANCE_PX
      );
      if (hitIndex >= 0 && hitIndex < this.boardSymbols.length) {
        const sym = this.boardSymbols[hitIndex];
        if (sym && !isBrokenGT037Symbol(sym)) {
          return {
            type: "tap_symbol",
            data: { slotIndex: hitIndex, symbolId: sym.id },
          };
        }
      }
    }
    return null;
  }

  private validateTapSymbol(slotIndex: number): ActionResult {
    if (!this.isAcceptingInput() || this.foundTargets.has(slotIndex)) {
      return ACTION_IGNORED;
    }
    const symbol = this.boardSymbols[slotIndex];
    if (!symbol || isBrokenGT037Symbol(symbol)) {
      return ACTION_IGNORED;
    }
    if (this.targetSet.has(symbol.id)) {
      const willBeAllFound =
        this.foundTargets.size + 1 >= this.effectiveTargetCopies;
      if (willBeAllFound && this.finishMode === "auto") {
        return { valid: true, feedback: "level_celebrate" };
      }
      return ACTION_CORRECT;
    }
    return ACTION_RETRY;
  }

  override validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    if (action.type === "tap_symbol") {
      const payload = parseTapSymbolPayload(action.data);
      return payload
        ? this.validateTapSymbol(payload.slotIndex)
        : ACTION_IGNORED;
    }
    if (action.type === "commit_declare") {
      if (this.foundTargets.size >= this.effectiveTargetCopies) {
        return { valid: true, feedback: "level_celebrate" };
      }
      return ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  private commitTapSymbol(slotIndex: number): void {
    if (!this.isAcceptingInput() || this.foundTargets.has(slotIndex)) {
      return;
    }
    const symbol = this.boardSymbols[slotIndex];
    if (!symbol || isBrokenGT037Symbol(symbol)) {
      return;
    }
    const clock = getGT037Clock(this);
    const now = clock.hasSimAdvanced ? clock.simMs : clock.lastRenderTimeMs;
    const isTarget = this.targetSet.has(symbol.id);
    this.order.push({ slotIndex, symbolId: symbol.id, isTarget, timeMs: now });

    if (isTarget) {
      this.foundTargets.add(slotIndex);
      this.queueSfx("star_collect");
      this.cheerRemainingMs = GT037_CHEER_MS;
      this.wrongSlotIndex = null;
      clock.wrongStamp = null;
      clock.activeHintLevel = 0;
      const slot = this.slots[slotIndex];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 6));
        clock.starsInFlight.push({
          x: slot.x,
          y: slot.y,
          stamp: captureGT037Stamp(clock),
        });
      }
      this.recordEvent("item_selected", {
        item_id: symbol.id,
        is_correct: true,
        commission: false,
      });
      if (
        this.finishMode === "auto" &&
        this.foundTargets.size >= this.effectiveTargetCopies
      ) {
        clock.winStamp = captureGT037Stamp(clock);
        this.winSession();
      }
      return;
    }

    this.commissions.push({ slotIndex, symbolId: symbol.id, timeMs: now });
    this.wrongSlotIndex = slotIndex;
    clock.wrongStamp = captureGT037Stamp(clock);
    this.recordEvent("item_selected", {
      item_id: symbol.id,
      is_correct: false,
      commission: true,
    });
    if (this.difficulty.allow_retry === false) {
      this.roundClosedOnWrong = true;
      clock.roundClosedStamp = captureGT037Stamp(clock);
      this.completeSession();
    }
  }

  private commitDeclare(): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    const clock = getGT037Clock(this);
    const omissions = Math.max(
      0,
      this.effectiveTargetCopies - this.foundTargets.size
    );
    this.recordEvent("selection_submitted", { is_correct: omissions === 0 });
    if (omissions === 0) {
      clock.winStamp = captureGT037Stamp(clock);
      this.winSession();
    } else if (this.difficulty.allow_retry === false) {
      this.roundClosedOnWrong = true;
      clock.roundClosedStamp = captureGT037Stamp(clock);
      this.completeSession();
    }
  }

  override commit(action: GameAction): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    if (action.type === "tap_symbol") {
      const payload = parseTapSymbolPayload(action.data);
      if (payload) {
        this.commitTapSymbol(payload.slotIndex);
      }
    } else if (action.type === "commit_declare") {
      this.commitDeclare();
    }
  }

  override completeSession(): void {
    if (this.isCompleted) {
      return;
    }
    const omissions = Math.max(
      0,
      this.effectiveTargetCopies - this.foundTargets.size
    );
    this.recordEvent("round_completed", {
      round_index: 0,
      attempts: this.order.length,
      hints_used: 0,
      duration_ms: 0,
      omissions,
      commissions: this.commissions.length,
      order: this.order.map((o) => o.slotIndex),
    });
    super.completeSession();
  }

  override storyLine(): string {
    return GT037_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.cheerRemainingMs > 0 && !this.isWon ? "cheer" : null;
  }

  update(deltaMs: number): void {
    if (this.cheerRemainingMs > 0) {
      this.cheerRemainingMs = Math.max(0, this.cheerRemainingMs - deltaMs);
    }
    if (this.particles.length > 0) {
      this.particles = updateParticles(this.particles);
    }
    const clock = getGT037Clock(this);
    if (deltaMs > 0) {
      clock.simMs += deltaMs;
      clock.hasSimAdvanced = true;
    }
    if (
      clock.wrongStamp &&
      clock.hasSimAdvanced &&
      clock.simMs - clock.wrongStamp.simMs >= GT037_WRONG_FLASH_MS
    ) {
      clock.wrongStamp = null;
      this.wrongSlotIndex = null;
    }
    if (clock.hasSimAdvanced) {
      clock.starsInFlight = clock.starsInFlight.filter(
        (star) => clock.simMs - star.stamp.simMs < JAR_STAR_FLIGHT_MS
      );
    }
  }

  setPointerOver(x: number, y: number): void {
    const clock = getGT037Clock(this);
    if (!this.isAcceptingInput()) {
      clock.hoveredSlotIndex = null;
      return;
    }
    const hitIdx = findHitSlotIndex(this.slots, x, y, "circle", 0);
    if (hitIdx < 0 || this.foundTargets.has(hitIdx)) {
      clock.hoveredSlotIndex = null;
      return;
    }
    const sym = this.boardSymbols[hitIdx];
    clock.hoveredSlotIndex = sym && !isBrokenGT037Symbol(sym) ? hitIdx : null;
  }

  clearPointerOver(): void {
    const clock = peekGT037Clock(this);
    if (clock) {
      clock.hoveredSlotIndex = null;
    }
  }

  override destroy(): void {
    deleteGT037Clock(this);
    super.destroy();
  }

  override getView(): EngineView {
    const clock = peekGT037Clock(this);
    return buildGT037View({
      content: this.content,
      slots: this.slots,
      boardSymbols: this.boardSymbols,
      foundTargets: this.foundTargets,
      wrongSlotIndex: this.wrongSlotIndex,
      hoveredSlotIndex: clock?.hoveredSlotIndex ?? null,
      focusIndex: this.getHintTargetIndex() ?? undefined,
    });
  }

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem, timeMs = 0): void {
    renderGT037Frame({
      host: this,
      ctx,
      rs,
      timeMs,
      themeId: this.themeId,
      stageRect: this.stageRect,
      logicSpace: this.logicSpace,
      counterText: this.getCounterText(),
      slots: this.slots,
      rotations: this.rotations,
      gridMeta: this.slotGridMeta,
      boardSymbols: this.boardSymbols,
      targetSet: this.targetSet,
      foundTargets: this.foundTargets,
      order: this.order,
      wrongSlotIndex: this.wrongSlotIndex,
      hintTargetIndex: this.getHintTargetIndex(),
      isWon: this.isWon,
      roundClosedOnWrong: this.roundClosedOnWrong,
      particles: this.particles,
      particlesEnabled: this.degradation?.particles_enabled !== false,
      showTargetCounter: this.showTargetCounter,
      effectiveTargetCopies: this.effectiveTargetCopies,
    });
  }
}
