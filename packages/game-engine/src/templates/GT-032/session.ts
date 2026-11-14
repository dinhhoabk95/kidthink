import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import {
  findHitSlotIndex,
  isPointInSlot,
  TAP_TOLERANCE_PX,
} from "#src/layout/hit-test";
import type { Slot } from "#src/layout/types";
import { spawnParticlesAtSlot, updateParticles } from "#src/render/index";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import {
  buildGT032View,
  computeGT032Slots,
  deleteGT032Clock,
  findGT032PourDemoPair,
  type GT032ActionPayload,
  type GT032LayoutHost,
  getGT032Clock,
  isGT032CupCorrect,
  narrowGT032Payload,
  renderGT032Frame,
  resetGT032Clock,
  resolveDisplayCups,
  resolveGT032HintDemoSequence,
  resolveGT032HintTargetForLevel,
  resolveGT032HintTargetIndex,
} from "./layout";
import type { GT032Content, GT032Cup, GT032Difficulty } from "./template";

export const GT032_COLUMNS_TWEEN_MS = 1400;
export const GT032_HAPPY_MS = 600;
export const GT032_POUR_DEMO_MS = 2000;
export const GT032_WONDER_MS = 1500;

const QUIET_OK: ActionResult = Object.freeze({
  valid: true,
  feedback: "none",
});

export const GT032_STORY_LINE_POUR =
  "Ngựa Con khát nước quá. Bé rót nước vào cốc tới vạch rồi bấm xong cho Ngựa Con uống nhé!";
export const GT032_STORY_LINE_PICK =
  "Ngựa Con khát nước quá. Bé nhìn kỹ các cốc nước rồi chọn đúng cốc cho Ngựa Con uống nhé!";

function readShowHintMarks(difficulty: GT032Difficulty): boolean {
  const val = Reflect.get(difficulty, "show_hint_marks");
  return typeof val === "boolean" ? val : false;
}

export class GT032Session
  extends TemplateGameSession<GT032Content, GT032Difficulty>
  implements GT032LayoutHost
{
  override readonly usesPromptZone = true;
  override readonly needsCommit: boolean;

  degradation: DegradationState | null = null;
  displayCups: GT032Cup[];
  selectedCupId: string | null = null;
  isWin = false;
  roundClosedOnWrong = false;
  showHintMarks = false;

  private readonly cupFills: Map<string, number> = new Map();
  private readonly mood = new MoodPulse();
  private gt032Round = -1;

  constructor(
    content: GT032Content,
    difficulty: GT032Difficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super(content, difficulty, layoutSeed, themeId);
    this.needsCommit = content.question_type === "pour_to_mark";
    this.displayCups = [...content.cups];
    for (const cup of this.displayCups) {
      this.cupFills.set(cup.cup_id, cup.fill_units);
    }
  }

  override storyLine(): string {
    return this.content.question_type === "pour_to_mark"
      ? GT032_STORY_LINE_POUR
      : GT032_STORY_LINE_PICK;
  }

  override mascotMood(): MascotPose | null {
    return this.isWin || this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    const clock = getGT032Clock(this);
    clock.logicMs += deltaMs;
    this.mood.tick(deltaMs);
    if (clock.pourElapsedMs < GT032_POUR_DEMO_MS) {
      clock.pourElapsedMs += deltaMs;
    }
    if (clock.particles.length > 0) {
      clock.particles = updateParticles(clock.particles);
    }
  }

  private isPourDemoActive(): boolean {
    const clock = getGT032Clock(this);
    return (
      !clock.reducedMotionSeen &&
      clock.pourElapsedMs < GT032_POUR_DEMO_MS &&
      findGT032PourDemoPair(this.content, this.displayCups) !== null
    );
  }

  override isAcceptingInput(): boolean {
    return !(
      this.isWin ||
      this.isWon ||
      this.roundClosedOnWrong ||
      this.isPourDemoActive()
    );
  }

  isRoundClosedOnWrong(): boolean {
    return this.roundClosedOnWrong;
  }

  getDisplayCups(): readonly GT032Cup[] {
    return this.displayCups;
  }

  setPointerOver(x: number, y: number): void {
    const clock = getGT032Clock(this);
    if (!this.isAcceptingInput()) {
      clock.hoveredCupId = null;
      return;
    }
    for (let i = 0; i < this.displayCups.length; i++) {
      const cup = this.displayCups[i];
      const slot = this.slots[i];
      if (
        cup &&
        slot &&
        isPointInSlot(slot, x, y, "square", TAP_TOLERANCE_PX)
      ) {
        clock.hoveredCupId = cup.cup_id;
        return;
      }
    }
    clock.hoveredCupId = null;
  }

  clearPointerOver(): void {
    getGT032Clock(this).hoveredCupId = null;
  }

  override destroy(): void {
    deleteGT032Clock(this);
    super.destroy();
  }

  setupEntities(): void {
    this.gt032Round += 1;
    this.displayCups = resolveDisplayCups(
      this.content.cups,
      this.displayCups,
      this.layoutSeed,
      this.gt032Round
    );
    const clock = resetGT032Clock(this);
    this.mood.clear();
    this.selectedCupId = null;
    this.isWin = false;
    this.isWon = false;
    this.roundClosedOnWrong = false;
    this.showHintMarks = readShowHintMarks(this.difficulty);
    this.cupFills.clear();
    for (const cup of this.displayCups) {
      this.cupFills.set(cup.cup_id, cup.fill_units);
      clock.fillRise.set(cup.cup_id, {
        from: cup.fill_units,
        to: cup.fill_units,
        startRenderMs: 0,
      });
    }
    this.recordEvent("game_started", {
      template_code: "GT-032",
      question_type: this.content.question_type,
      cup_count: this.displayCups.length,
    });
  }

  getCupFill(cupId: string): number {
    const tracked = this.cupFills.get(cupId);
    if (tracked !== undefined) {
      return tracked;
    }
    const cup = this.displayCups.find((c) => c.cup_id === cupId);
    return cup?.fill_units ?? 0;
  }

  getTargetFill(cup: GT032Cup): number {
    return cup.target_units ?? this.content.target_units ?? cup.capacity_units;
  }

  getShownHintLevel(): 0 | HintLevel {
    return getGT032Clock(this).hintLevel;
  }

  private setActiveHintLevel(level: HintLevel): void {
    const clock = getGT032Clock(this);
    if (this.checkWinCondition() || this.roundClosedOnWrong) {
      clock.hintLevel = 0;
      clock.columnsStartMs = null;
      return;
    }
    if (level !== clock.hintLevel) {
      clock.hintLevel = level;
      clock.columnsStartMs = null;
    }
  }

  override onScaffoldEscalated(level: HintLevel): void {
    this.setActiveHintLevel(level);
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    this.setActiveHintLevel(level);
    return resolveGT032HintTargetForLevel(this, level);
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    return resolveGT032HintDemoSequence(this, level);
  }

  override onHintCleared(): void {
    const clock = getGT032Clock(this);
    clock.hintLevel = 0;
    clock.columnsStartMs = null;
  }

  override getHintTargetIndex(): number | null {
    return resolveGT032HintTargetIndex(this);
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    return computeGT032Slots(this, band);
  }

  isCupCorrect(cup: GT032Cup): boolean {
    return isGT032CupCorrect(this, cup);
  }

  private resolvePourTargetCup(cupId?: string): GT032Cup | null {
    if (cupId) {
      return this.displayCups.find((c) => c.cup_id === cupId) ?? null;
    }
    if (this.selectedCupId) {
      const selected = this.displayCups.find(
        (c) => c.cup_id === this.selectedCupId
      );
      if (selected) {
        return selected;
      }
    }
    return (
      this.displayCups.find((c) => !this.isCupCorrect(c)) ??
      this.displayCups[0] ??
      null
    );
  }

  private computeNextPourFill(
    cup: GT032Cup,
    data: GT032ActionPayload
  ): number | null {
    const current = this.getCupFill(cup.cup_id);
    if (data.fill_units !== undefined) {
      if (
        !Number.isInteger(data.fill_units) ||
        data.fill_units < 0 ||
        data.fill_units > cup.capacity_units
      ) {
        return null;
      }
      return data.fill_units;
    }
    const delta = data.delta ?? 0;
    if (!Number.isFinite(delta) || delta === 0) {
      return null;
    }
    const stepDelta =
      delta > 0
        ? Math.max(1, Math.round(delta))
        : Math.min(-1, Math.round(delta));
    const next = Math.max(0, Math.min(cup.capacity_units, current + stepDelta));
    return next === current ? null : next;
  }

  private validateAdjustCup(data: GT032ActionPayload): ActionResult {
    if (this.content.question_type !== "pour_to_mark") {
      return ACTION_IGNORED;
    }
    const cup = this.resolvePourTargetCup(
      data.cup_id ?? data.id ?? data.option_id
    );
    if (!cup || this.computeNextPourFill(cup, data) === null) {
      return ACTION_IGNORED;
    }
    return QUIET_OK;
  }

  private validateConfirmPour(): ActionResult {
    if (this.content.question_type !== "pour_to_mark") {
      return ACTION_IGNORED;
    }
    const active = this.resolvePourTargetCup();
    return active && this.isPourGoalSatisfied(active)
      ? ACTION_CORRECT
      : ACTION_RETRY;
  }

  private validateSelectCup(cupId: string): ActionResult {
    const cup = this.displayCups.find((c) => c.cup_id === cupId);
    if (!cup) {
      return ACTION_IGNORED;
    }
    if (this.content.question_type === "pour_to_mark") {
      return QUIET_OK;
    }
    return this.isCupCorrect(cup) ? ACTION_CORRECT : ACTION_RETRY;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon || this.roundClosedOnWrong) {
      return ACTION_IGNORED;
    }
    const type = action.type;
    const data = narrowGT032Payload(action);
    if (
      type === "select_cup" ||
      type === "tap_cup" ||
      type === "choose_cup" ||
      type === "select_option"
    ) {
      return this.validateSelectCup(
        data.cup_id ?? data.id ?? data.option_id ?? ""
      );
    }
    if (type === "adjust_cup" || type === "pour_cup") {
      return this.validateAdjustCup(data);
    }
    if (type === "confirm_pour") {
      return this.validateConfirmPour();
    }
    if (type === "show_hint") {
      return ACTION_CORRECT;
    }
    return ACTION_IGNORED;
  }

  private isPourGoalSatisfied(activeCup: GT032Cup): boolean {
    const explicit = this.displayCups.filter(
      (c) => c.target_units !== undefined
    );
    if (explicit.length > 0) {
      return explicit.every((c) => this.isCupCorrect(c));
    }
    return this.isCupCorrect(activeCup);
  }

  private triggerWrongFeedback(cupId: string): void {
    const clock = getGT032Clock(this);
    clock.wrongCupId = cupId;
    clock.wrongFlash.trigger(clock.logicMs);
    this.mood.set("wonder", GT032_WONDER_MS);
    if (!this.difficulty.allow_retry) {
      this.roundClosedOnWrong = true;
      clock.columnsStartMs = null;
      this.recordEvent("game_completed", { score: 0 });
      this.completeSession();
    }
  }

  private triggerWinForCup(cupId: string): void {
    this.isWin = true;
    this.isWon = true;
    this.selectedCupId = cupId;
    const clock = getGT032Clock(this);
    if (this.degradation?.particles_enabled !== false) {
      const idx = this.displayCups.findIndex((c) => c.cup_id === cupId);
      const slot = this.slots[idx];
      if (slot) {
        clock.particles.push(...spawnParticlesAtSlot(slot, 16));
      }
    }
    this.recordEvent("game_completed", { score: 100 });
    this.winSession();
  }

  private commitAdjustCup(data: GT032ActionPayload): void {
    if (this.content.question_type !== "pour_to_mark") {
      return;
    }
    const cup = this.resolvePourTargetCup(
      data.cup_id ?? data.id ?? data.option_id
    );
    if (!cup) {
      return;
    }
    const nextFill = this.computeNextPourFill(cup, data);
    if (nextFill === null) {
      return;
    }
    const clock = getGT032Clock(this);
    const prevFill = this.getCupFill(cup.cup_id);
    clock.fillRise.set(cup.cup_id, {
      from: prevFill,
      to: nextFill,
      startRenderMs: null,
    });
    this.cupFills.set(cup.cup_id, nextFill);
    this.selectedCupId = cup.cup_id;
    this.queueSfx("water_pour");
    clock.lastPourAtMs = clock.lastRenderMs;
    this.mood.set("happy", GT032_HAPPY_MS);
    this.recordEvent("liquid_poured", {
      cup_id: cup.cup_id,
      fill_units: nextFill,
      target_units: this.getTargetFill(cup),
      is_correct: this.isCupCorrect(cup),
    });
  }

  private commitConfirmPour(): void {
    const active = this.resolvePourTargetCup();
    if (
      this.content.question_type !== "pour_to_mark" ||
      !active ||
      !this.isPourGoalSatisfied(active)
    ) {
      this.recordEvent("pour_confirm_wrong", {});
      this.triggerWrongFeedback(active?.cup_id ?? "");
      return;
    }
    this.triggerWinForCup(active.cup_id);
  }

  private commitSelectCup(cupId: string): void {
    const cup = this.displayCups.find((c) => c.cup_id === cupId);
    if (!cup) {
      return;
    }
    if (this.content.question_type === "pour_to_mark") {
      this.selectedCupId = cup.cup_id;
      return;
    }
    const correct = this.isCupCorrect(cup);
    this.recordEvent("cup_selected", {
      cup_id: cup.cup_id,
      fill_units: this.getCupFill(cup.cup_id),
      is_correct: correct,
    });
    if (correct) {
      this.triggerWinForCup(cup.cup_id);
    } else {
      this.triggerWrongFeedback(cup.cup_id);
    }
  }

  override commit(action: GameAction): void {
    if (this.isWin || this.isWon || this.roundClosedOnWrong) {
      return;
    }
    const type = action.type;
    if (type !== "show_hint") {
      this.onHintCleared();
    }
    const data = narrowGT032Payload(action);
    if (
      type === "select_cup" ||
      type === "tap_cup" ||
      type === "choose_cup" ||
      type === "select_option"
    ) {
      this.commitSelectCup(data.cup_id ?? data.id ?? data.option_id ?? "");
      return;
    }
    if (type === "adjust_cup" || type === "pour_cup") {
      this.commitAdjustCup(data);
      return;
    }
    if (type === "confirm_pour") {
      this.commitConfirmPour();
      return;
    }
    if (type === "show_hint") {
      this.showHintMarks = true;
    }
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    if (gesture.type === "commit") {
      return this.needsCommit ? { type: "confirm_pour", data: {} } : null;
    }
    if (gesture.type === "adjust") {
      if (this.content.question_type !== "pour_to_mark") {
        return null;
      }
      const targetCup = this.resolvePourTargetCup();
      if (
        !(targetCup && Number.isFinite(gesture.delta)) ||
        gesture.delta === 0
      ) {
        return null;
      }
      return {
        type: "adjust_cup",
        data: { cup_id: targetCup.cup_id, delta: gesture.delta },
      };
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture.x, gesture.y);
    }
    return null;
  }

  private toTapAction(x: number, y: number): GameAction | null {
    const cupSlots = this.slots.slice(0, this.displayCups.length);
    const index = findHitSlotIndex(cupSlots, x, y, "square", TAP_TOLERANCE_PX);
    const cup = this.displayCups[index];
    if (!cup) {
      return null;
    }
    if (this.content.question_type === "pour_to_mark") {
      const targetFill = this.getTargetFill(cup);
      const fill = this.getCupFill(cup.cup_id);
      if (fill === targetFill) {
        return { type: "select_cup", data: { cup_id: cup.cup_id } };
      }
      const delta = fill >= cup.capacity_units ? -fill : 1;
      return { type: "adjust_cup", data: { cup_id: cup.cup_id, delta } };
    }
    return { type: "select_cup", data: { cup_id: cup.cup_id } };
  }

  override getView(): EngineView {
    return buildGT032View(this);
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon;
  }

  getSelectedCupId(): string | null {
    return this.selectedCupId;
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    renderGT032Frame(this, ctx, rs, timeMs);
  }
}
