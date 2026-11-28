import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_QUIET_OK,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  type HintDemoStep,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import { isPointInSlot, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import {
  InhibitionSystem,
  type TrialItem,
  type TrialOutcome,
  type TrialResult,
} from "#src/systems/inhibition-system";
import type { RenderSystem } from "#src/systems/render-system";
import {
  buildGT026View,
  computeGT026Slots,
  computeGT026StartSlot,
  type GT026ExitPhase,
  type GT026LayoutHost,
  getGT026Clock,
  renderGT026Frame,
  resetGT026Clock,
  resolveGT026HintDemo,
  resolveGT026HintTarget,
  resolveGT026HintTargetIndex,
  resolveRoundTrials,
} from "./layout.js";
import type { GT026Content, GT026Difficulty } from "./template.js";

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E026-11`, `BR-FBK-16`). */
export const GT026_STORY_LINE =
  "Gấu Con chơi trò đèn xanh, đèn đỏ: đèn xanh thì chạm, đèn đỏ thì đứng yên như Gấu Con nhé!";

/** Bội số nới ở bậc `L1` (cửa sổ) và `L2` (nhịp nghỉ); `L3` là không tính giờ. */
const LADDER_WIDEN_FACTOR = 1.5;

/** Độ dài pha thoát của pod sau lượt vừa xong (N4), kẹp theo `isi_ms`. */
const GT026_EXIT_MS = 360;

export class GT026Session
  extends TemplateGameSession<GT026Content, GT026Difficulty>
  implements GT026LayoutHost
{
  degradation: DegradationState | null = null;
  override readonly usesPromptZone = true;
  readonly holdsClockWhileInputClosed = true;

  private inhibitionSystem!: InhibitionSystem;
  private isInputOpen = true;
  private waitingForStart = true;
  private currentBand: AgeBand = "4-5";
  private appliedLadderLevel = 0;
  private outcomeMood: MascotPose | null = null;

  enableStartGate(): void {
    if (!this.isFinished()) {
      this.waitingForStart = true;
    }
  }

  isWaitingForStart(): boolean {
    return this.waitingForStart && !this.isFinished();
  }

  isInputOpenState(): boolean {
    return this.isInputOpen;
  }

  isUntimed(): boolean {
    return this.inhibitionSystem?.isUntimed() === true;
  }

  getWindowMs(): number {
    return this.inhibitionSystem?.getStimulusWindowMs() ?? 0;
  }

  getIsiMs(): number {
    return this.inhibitionSystem?.getIsiMs() ?? 0;
  }

  getAgeBand(): AgeBand {
    return this.currentBand;
  }

  getStageRect(): ZoneRect {
    if (this.stageRect) {
      return this.stageRect;
    }
    const w = Math.max(240, this.logicSpace.w - 32);
    const h = Math.max(180, this.logicSpace.h - 32);
    return { x: 16, y: 16, w, h };
  }

  getCurrentTrialIndex(): number {
    return this.inhibitionSystem?.getCurrentTrialIndex() ?? 0;
  }

  getTotalTrials(): number {
    return (
      this.inhibitionSystem?.getTotalTrials() ?? this.content.trials.length
    );
  }

  getExitPhase(): GT026ExitPhase | null {
    const sys = this.inhibitionSystem;
    if (
      !(sys && this.isInputOpen) ||
      this.waitingForStart ||
      sys.getState() !== "isi"
    ) {
      return null;
    }
    const duration = Math.min(GT026_EXIT_MS, sys.getIsiMs());
    const elapsed = sys.getTrialElapsedMs();
    const last = sys.getResults().at(-1);
    const trial = sys.getCurrentTrial();
    if (!(last && trial) || duration <= 0 || elapsed >= duration) {
      return null;
    }
    return { outcome: last.outcome, progress: elapsed / duration, trial };
  }

  getResults(): readonly TrialResult[] {
    return this.inhibitionSystem?.getResults() ?? [];
  }

  isFinished(): boolean {
    return this.inhibitionSystem?.isFinished() ?? false;
  }

  getTrialElapsedRatio(): number {
    if (
      !this.inhibitionSystem ||
      this.isUntimed() ||
      !this.isStimulusVisible()
    ) {
      return 0;
    }
    const winMs = Math.max(1, this.inhibitionSystem.getStimulusWindowMs());
    const ratio = this.inhibitionSystem.getTrialElapsedMs() / winMs;
    return Math.max(0, Math.min(1, ratio));
  }

  override onScaffoldEscalated(
    level: HintLevel,
    trigger: "timer" | "miss_streak"
  ): void {
    getGT026Clock(this).activeHintLevel = level;
    if (trigger !== "timer" || !this.inhibitionSystem) {
      return;
    }
    for (let step = this.appliedLadderLevel + 1; step <= level; step++) {
      if (step === 1) {
        this.inhibitionSystem.widenStimulusWindow(LADDER_WIDEN_FACTOR);
      } else if (step === 2) {
        this.inhibitionSystem.widenIsi(LADDER_WIDEN_FACTOR);
      } else {
        this.inhibitionSystem.makeUntimed();
      }
    }
    this.appliedLadderLevel = Math.max(this.appliedLadderLevel, level);
  }

  onHintTriggered(level: HintLevel): void {
    getGT026Clock(this).activeHintLevel = level;
  }

  override onHintCleared(): void {
    getGT026Clock(this).activeHintLevel = 0;
  }

  private noteOutcome(outcome: TrialOutcome): void {
    if (outcome === "hit") {
      this.queueSfx("go_chime");
      this.outcomeMood = "cheer";
    } else if (outcome === "correct_rejection") {
      this.queueSfx("stop_hum");
      this.outcomeMood = "freeze";
    } else {
      this.outcomeMood = null;
    }
  }

  override storyLine(): string {
    return GT026_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.inhibitionSystem?.getState() === "stimulus"
      ? null
      : this.outcomeMood;
  }

  setInputOpen(isOpen: boolean): void {
    this.isInputOpen = isOpen;
  }

  isStimulusVisible(): boolean {
    return (
      this.isInputOpen &&
      !this.waitingForStart &&
      this.inhibitionSystem?.getState() === "stimulus"
    );
  }

  override isTrialBased(): boolean {
    return true;
  }

  setupEntities(): void {
    this.isWon = false;
    this.waitingForStart = true;
    this.appliedLadderLevel = 0;
    this.outcomeMood = null;
    resetGT026Clock(this);

    const ordered = resolveRoundTrials(
      this.content.trials,
      this.layoutSeed,
      this.roundGeneration
    );
    const trials: TrialItem[] = ordered.map((t) => ({
      id: t.id,
      kind: t.kind,
    }));

    this.inhibitionSystem = new InhibitionSystem({
      trials,
      stimulusWindowMs: this.difficulty.stimulus_window_ms,
      isiMs: this.difficulty.isi_ms,
      untimed: this.difficulty.untimed,
    });

    this.recordEvent("round_started", {
      round_index: 0,
      total_trials: trials.length,
    });
  }

  getCurrentTrial(): TrialItem | null {
    return this.inhibitionSystem?.getCurrentTrial() ?? null;
  }

  getState(): "stimulus" | "isi" | "finished" {
    return this.inhibitionSystem?.getState() ?? "finished";
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.inhibitionSystem || this.inhibitionSystem.isFinished()) {
      return ACTION_IGNORED;
    }
    if (this.waitingForStart) {
      // Nút bắt đầu hợp lệ nhưng không phải câu trả lời (BR-EIC-10).
      return action.type === "start_trials" ? ACTION_QUIET_OK : ACTION_IGNORED;
    }
    if (this.inhibitionSystem.getState() !== "stimulus") {
      return ACTION_IGNORED;
    }
    const trial = this.inhibitionSystem.getCurrentTrial();
    if (!trial) {
      return ACTION_IGNORED;
    }
    if (
      action.type === "tap_stimulus" ||
      action.type === "tap_card" ||
      action.type === "select_item"
    ) {
      return trial.kind === "go" ? ACTION_CORRECT : ACTION_RETRY;
    }
    if (
      action.type === "pass" ||
      action.type === "skip" ||
      action.type === "confirm_nogo"
    ) {
      return trial.kind === "nogo" ? ACTION_CORRECT : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  private handleTrialAction(actionType: "tap" | "pass"): ActionResult {
    if (
      !this.inhibitionSystem ||
      this.inhibitionSystem.isFinished() ||
      this.waitingForStart
    ) {
      return ACTION_IGNORED;
    }
    const result = this.inhibitionSystem.handleAction(actionType);
    if (!result) {
      return ACTION_IGNORED;
    }

    const clock = getGT026Clock(this);
    clock.activeHintLevel = 0;
    clock.hoveredSlot = null;
    const slotIndex = actionType === "pass" ? 1 : 0;

    if (result.isCorrect) {
      const kind =
        result.outcome === "correct_rejection" ? "correct_rejection" : "hit";
      clock.outcomeFx = { kind, triggeredAtMs: clock.lastFrameMs, slotIndex };
    } else {
      clock.wrongFlash.trigger(clock.lastFrameMs);
      clock.outcomeFx = {
        kind: "retry",
        triggeredAtMs: clock.lastFrameMs,
        slotIndex,
      };
    }
    if (result.outcome === "hit") {
      this.appliedLadderLevel = 0;
    }
    this.noteOutcome(result.outcome);
    this.recordEvent("item_selected", {
      outcome: result.outcome,
      is_correct: result.isCorrect,
      action_type: actionType,
    });

    if (this.inhibitionSystem.isFinished()) {
      this.isWon = true;
      clock.winAtMs = clock.lastFrameMs;
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
    }
    return result.isCorrect ? ACTION_CORRECT : ACTION_RETRY;
  }

  onTapStimulus(): ActionResult {
    return this.handleTrialAction("tap");
  }

  onPass(): ActionResult {
    return this.handleTrialAction("pass");
  }

  // biome-ignore lint/suspicious/noConfusingVoidType: void needed for compatibility with update
  update(deltaMs: number): ActionResult | void | null {
    const clock = getGT026Clock(this);
    clock.lastFrameMs += deltaMs;
    if (
      !this.inhibitionSystem ||
      this.inhibitionSystem.isFinished() ||
      this.waitingForStart
    ) {
      return null;
    }

    const verdict = this.inhibitionSystem.tick(deltaMs);
    if (this.inhibitionSystem.isFinished() && !this.isWon) {
      this.isWon = true;
      clock.winAtMs = clock.lastFrameMs;
      this.recordEvent("round_completed", { round_index: 0 });
      this.completeSession();
    }

    if (verdict) {
      this.noteOutcome(verdict.outcome);
      this.recordEvent("item_selected", {
        outcome: verdict.outcome,
        is_correct: verdict.isCorrect,
        action_type: "timeout_no_tap",
      });
      if (verdict.outcome === "correct_rejection") {
        clock.outcomeFx = {
          kind: "correct_rejection",
          triggeredAtMs: clock.lastFrameMs,
          slotIndex: 0,
        };
      }
      if (verdict.outcome === "miss") {
        return ACTION_IGNORED;
      }
      return verdict.isCorrect ? ACTION_CORRECT : ACTION_RETRY;
    }
    return null;
  }

  override checkWinCondition(): boolean {
    return this.isWon;
  }

  setPointerOver(x: number, y: number): void {
    const clock = getGT026Clock(this);
    if (!this.isInputOpen || this.isFinished()) {
      clock.hoveredSlot = null;
      return;
    }
    if (this.waitingForStart) {
      const startSlot = computeGT026StartSlot(this);
      clock.hoveredSlot = isPointInSlot(
        startSlot,
        x,
        y,
        "circle",
        TAP_TOLERANCE_PX
      )
        ? 0
        : null;
      return;
    }
    const pad = this.slots[1];
    if (
      this.isUntimed() &&
      pad &&
      isPointInSlot(pad, x, y, "circle", TAP_TOLERANCE_PX)
    ) {
      clock.hoveredSlot = 1;
      return;
    }
    const stim = this.slots[0];
    clock.hoveredSlot =
      stim && isPointInSlot(stim, x, y, "square", TAP_TOLERANCE_PX) ? 0 : null;
  }

  clearPointerOver(): void {
    getGT026Clock(this).hoveredSlot = null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap" || !this.isInputOpen) {
      return null;
    }
    if (this.waitingForStart) {
      const startSlot = computeGT026StartSlot(this);
      const hitStart = isPointInSlot(
        startSlot,
        gesture.x,
        gesture.y,
        "circle",
        TAP_TOLERANCE_PX
      );
      return hitStart ? { type: "start_trials", data: {} } : null;
    }
    if (this.inhibitionSystem?.getState() !== "stimulus") {
      return null;
    }
    const pad = this.slots[1];
    if (
      this.isUntimed() &&
      pad &&
      isPointInSlot(pad, gesture.x, gesture.y, "circle", TAP_TOLERANCE_PX)
    ) {
      return { type: "pass", data: {} };
    }
    const slot0 = this.slots[0];
    if (
      slot0 &&
      isPointInSlot(slot0, gesture.x, gesture.y, "square", TAP_TOLERANCE_PX)
    ) {
      return { type: "tap_stimulus", data: {} };
    }
    return null;
  }

  override commit(action: GameAction): void {
    if (action.type === "start_trials") {
      this.waitingForStart = false;
      getGT026Clock(this).litTrialId = null;
      return;
    }
    if (
      action.type === "tap_stimulus" ||
      action.type === "tap_card" ||
      action.type === "select_item"
    ) {
      this.onTapStimulus();
    } else if (
      action.type === "pass" ||
      action.type === "skip" ||
      action.type === "confirm_nogo"
    ) {
      this.onPass();
    }
  }

  override getView(): EngineView {
    return buildGT026View(this);
  }

  override destroy(): void {
    resetGT026Clock(this);
    super.destroy();
  }

  override getHintTargetIndex(): number | null {
    return resolveGT026HintTargetIndex(this);
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    getGT026Clock(this).activeHintLevel = level;
    return resolveGT026HintTarget(this, level);
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    return resolveGT026HintDemo(this, level);
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    this.currentBand = ageBand;
    return computeGT026Slots(this, ageBand);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    renderGT026Frame(this, ctx, rs, timeMs);
  }
}
