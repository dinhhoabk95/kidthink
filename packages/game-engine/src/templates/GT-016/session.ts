import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import type { Slot } from "#src/layout/types";
import {
  drawClippedToZone,
  drawSceneBackground,
  sceneBox,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import {
  type ClockAngles,
  type ClockTime,
  formatClockTime,
  isSameTime,
  timeToAngles,
} from "#src/systems/rotation-system";
import {
  buildGT016View,
  checkGT016Win,
  computeGT016SlotsForBand,
  extractAdjustDelta,
  GT016_CELEB_MS,
  GT016_TICK_MS,
  GT016_WRONG_MS,
  type GT016DayLabel,
  type GT016Point,
  type GT016ViewInput,
  renderGT016StageContent,
  resolveDayPeriodLabel,
  resolveGT016BaseHintTarget,
  resolveGT016HintDestPoint,
  resolveGT016HintLevelTarget,
  resolveGT016HintTargetIndex,
  resolveGT016HoverSlot,
  resolveGT016ToAction,
  validateGT016Action,
} from "./clock-view.js";
import {
  createGT016AnimState,
  extractSetClockTimeData,
  type GT016AnimState,
  resolveGT016RoundOrder,
  stepClockTime,
  stepGT016AnimState,
} from "./layout.js";
import type { GT016Content, GT016Difficulty } from "./template.js";

type C = GT016Content;
type D = GT016Difficulty;
type Mode = C["mode"];
type RS = RenderSystem;

/** Khung chuyện theo mode, đọc một lần ở vòng đầu (`BR-E016-05`, `BR-FBK-16`). */
export const GT016_STORY_LINES: Record<Mode, string> = {
  read: "Bạn Mặt Trời và Mặt Trăng cùng bé xem đồng hồ. Bé đọc xem kim đang chỉ mấy giờ nhé!",
  set: "Bạn Mặt Trời và Mặt Trăng cùng bé chỉnh đồng hồ. Bé xoay kim cho đồng hồ chỉ đúng giờ nhé!",
  match:
    "Bạn Mặt Trời và Mặt Trăng cùng bé kể chuyện một ngày. Bé xoay kim rồi chọn hoạt động đúng giờ nhé!",
};

export const GT016_HAPPY_MS = 500;
export const GT016_WONDER_MS = 1500;
export const GT016_SKY_RISE_MS = 1200;

export class ClockHandsSession extends TemplateGameSession<C, D> {
  override readonly usesPromptZone = true;
  override readonly needsCommit: boolean;
  degradation: DegradationState | null = null;

  private currentTime: ClockTime;
  private resolvedOptions: C["options"] = [];
  private resolvedActivityCards: C["activity_cards"] = [];
  private hasSubmittedTime = false;
  private roundClosedOnWrong = false;
  private selectedOptionIndex: number | null = null;
  private activeHintLevel: 0 | 1 | 2 | 3 = 0;
  private currentTouchFloor = 64;
  private skyElapsedMs = 0;
  private anim: GT016AnimState;
  private readonly matchedCardIds: Set<string> = new Set();
  private readonly mood = new MoodPulse();
  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });

  constructor(content: C, difficulty: D, layoutSeed = 0) {
    super(content, difficulty, layoutSeed);
    this.needsCommit = content.mode === "set";
    const r = resolveGT016RoundOrder(content, difficulty, this.layoutSeed);
    this.currentTime = r.initialTime;
    this.resolvedOptions = r.options;
    this.resolvedActivityCards = r.activityCards;
    this.anim = createGT016AnimState(this.currentTime);
  }

  override storyLine(): string {
    return GT016_STORY_LINES[this.content.mode];
  }
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }
  override isAcceptingInput(): boolean {
    return !(this.isWon || this.roundClosedOnWrong);
  }
  override canCommit(): boolean {
    return this.needsCommit && this.isAcceptingInput();
  }
  override takePillNarration(): string | null {
    return this.exploreTracker.takePillNarration();
  }
  override onScaffoldEscalated(level: HintLevel): void {
    this.activeHintLevel = level;
  }
  override onHintCleared(): void {
    this.activeHintLevel = 0;
  }
  startExplorePhase(): void {
    this.exploreTracker.reset(true);
  }
  getExploreTracker(): MontessoriExploreTracker {
    return this.exploreTracker;
  }
  getControlOfError(): ControlOfErrorDiagnostics | null {
    return this.exploreTracker.getControlOfErrorDiagnostics();
  }
  isMicroSandboxActive(): boolean {
    return this.exploreTracker.isMicroSandboxActive();
  }
  getCurrentTime(): ClockTime {
    return this.currentTime;
  }
  getAngles(): ClockAngles {
    return timeToAngles(this.currentTime);
  }
  getMode(): Mode {
    return this.content.mode;
  }
  getOptions(): C["options"] {
    return this.resolvedOptions;
  }
  getActivityCards(): C["activity_cards"] {
    return this.resolvedActivityCards;
  }
  getDayPeriodLabel(): GT016DayLabel {
    return resolveDayPeriodLabel(this.currentTime.hour);
  }

  private finishAttempt(ok: boolean): boolean {
    if (this.checkWinCondition()) {
      this.anim.celebrateMs = GT016_CELEB_MS;
      this.winSession();
    }
    return ok;
  }

  private onWrongAttempt(
    actualValue: string,
    expectedValue: string,
    payload: Record<string, string | boolean>,
    targetId?: string
  ): void {
    this.mood.set("wonder", GT016_WONDER_MS);
    const curStr = formatClockTime(this.currentTime);
    const targetStr = formatClockTime(this.content.target_time);
    this.exploreTracker.recordWrongAttempt({
      reasonVi: `Đồng hồ chỉ ${curStr}, mục tiêu là ${targetStr}`,
      targetId,
      actualValue,
      expectedValue,
    });
    this.recordEvent("control_of_error", {
      mode: this.content.mode,
      ...payload,
      micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
    });
    if (this.difficulty.allow_retry === false) {
      this.roundClosedOnWrong = true;
    }
  }

  setPointerOver(xOrPt: number | GT016Point | null, y?: number): void {
    this.anim.hoveredSlotIndex = this.isAcceptingInput()
      ? resolveGT016HoverSlot(this.viewInput(), xOrPt, y)
      : null;
  }

  clearPointerOver(): void {
    this.anim.hoveredSlotIndex = null;
  }

  setupEntities(): void {
    const r = resolveGT016RoundOrder(
      this.content,
      this.difficulty,
      this.layoutSeed
    );
    this.currentTime = r.initialTime;
    this.resolvedOptions = r.options;
    this.resolvedActivityCards = r.activityCards;
    this.selectedOptionIndex = null;
    this.hasSubmittedTime = false;
    this.roundClosedOnWrong = false;
    this.activeHintLevel = 0;
    this.matchedCardIds.clear();
    this.mood.clear();
    this.skyElapsedMs = 0;
    this.isWon = false;
    this.anim = createGT016AnimState(this.currentTime);
    this.exploreTracker.reset(false);
    this.recordEvent("game_started", {
      template_code: "GT-016",
      mode: this.content.mode,
      target_time: formatClockTime(this.content.target_time),
    });
  }

  setHour(hour: number): void {
    this.currentTime = {
      ...this.currentTime,
      hour: Math.max(1, Math.min(12, Math.round(hour))),
    };
    this.anim.displayAngles = timeToAngles(this.currentTime);
    this.onClockAdjusted("hour", false);
  }

  setMinute(minute: 0 | 30): void {
    this.currentTime = { ...this.currentTime, minute };
    this.anim.displayAngles = timeToAngles(this.currentTime);
    this.onClockAdjusted("minute", false);
  }

  selectOption(index: number): boolean {
    if (!this.isAcceptingInput()) {
      return false;
    }
    const opt = this.resolvedOptions[index];
    if (!opt) {
      return false;
    }
    this.selectedOptionIndex = index;
    this.activeHintLevel = 0;
    const chosenStr = formatClockTime(opt);
    if (opt.is_correct) {
      this.anim.wrongChoiceTimerMs = 0;
      this.exploreTracker.recordCorrectAttempt();
    } else {
      this.anim.wrongChoiceTimerMs = GT016_WRONG_MS;
      const targetStr = formatClockTime(this.content.target_time);
      this.onWrongAttempt(
        chosenStr,
        targetStr,
        { chosen_time: chosenStr, target_time: targetStr },
        `opt-${index}`
      );
    }
    this.recordEvent("time_submitted", {
      time: chosenStr,
      is_correct: opt.is_correct,
    });
    return this.finishAttempt(opt.is_correct);
  }

  submitTime(): boolean {
    return this.submitCurrentTime();
  }

  submitCurrentTime(): boolean {
    if (!this.isAcceptingInput()) {
      return false;
    }
    this.hasSubmittedTime = true;
    this.activeHintLevel = 0;
    const ok = isSameTime(this.currentTime, this.content.target_time);
    const curStr = formatClockTime(this.currentTime);
    if (ok) {
      this.anim.wrongClockTimerMs = 0;
      this.exploreTracker.recordCorrectAttempt();
    } else {
      this.anim.wrongClockTimerMs = GT016_WRONG_MS;
      const targetStr = formatClockTime(this.content.target_time);
      this.onWrongAttempt(curStr, targetStr, {
        current_time: curStr,
        target_time: targetStr,
      });
    }
    this.recordEvent("time_submitted", { time: curStr, is_correct: ok });
    if (this.roundClosedOnWrong) {
      this.hasSubmittedTime = false;
      this.currentTime = { ...this.content.target_time };
      return false;
    }
    return this.finishAttempt(ok);
  }

  matchCard(cardId: string): boolean {
    if (!this.isAcceptingInput()) {
      return false;
    }
    const card = this.resolvedActivityCards.find((c) => c.card_id === cardId);
    if (!card) {
      return false;
    }
    this.activeHintLevel = 0;
    const cardTime: ClockTime = { hour: card.hour, minute: card.minute };
    if (isSameTime(this.currentTime, cardTime)) {
      this.matchedCardIds.add(cardId);
      this.anim.wrongCardId = null;
      this.anim.wrongChoiceTimerMs = 0;
      this.exploreTracker.recordCorrectAttempt();
      this.recordEvent("time_submitted", { card_id: cardId, is_correct: true });
      return this.finishAttempt(true);
    }
    this.anim.wrongCardId = cardId;
    this.anim.wrongChoiceTimerMs = GT016_WRONG_MS;
    const curStr = formatClockTime(this.currentTime);
    const cardStr = formatClockTime(cardTime);
    this.onWrongAttempt(
      cardStr,
      curStr,
      { card_id: cardId, card_time: cardStr, expected_time: curStr },
      cardId
    );
    return false;
  }

  adjustTime(delta: number): void {
    this.applyTimeDelta(delta);
  }

  applyTimeDelta(delta: number): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    this.currentTime = stepClockTime(
      this.currentTime,
      delta,
      this.difficulty.minute_step
    );
    this.onClockAdjusted("minute", true);
  }

  private onClockAdjusted(hand: "hour" | "minute", explore: boolean): void {
    this.hasSubmittedTime = false;
    this.activeHintLevel = 0;
    this.queueSfx("clock_tick");
    this.mood.set("happy", GT016_HAPPY_MS);
    if (explore) {
      this.anim.tickPulseMs = GT016_TICK_MS;
      this.exploreTracker.recordExploreAction("clock_adjusted");
    }
    this.recordEvent("hand_rotated", {
      hand,
      time: formatClockTime(this.currentTime),
    });
  }

  override getHintTargetIndex(): number | null {
    return this.isAcceptingInput()
      ? resolveGT016HintTargetIndex(this.viewInput())
      : null;
  }

  override getHintDestinationIndex(): number | null {
    const isSet = this.content.mode === "set" && this.isAcceptingInput();
    return isSet && !isSameTime(this.currentTime, this.content.target_time)
      ? 0
      : null;
  }

  override getHintDestinationPoint(): GT016Point | null {
    return this.getHintDestinationIndex() === null
      ? null
      : resolveGT016HintDestPoint(this.viewInput());
  }

  override getHintTarget(): HintTarget | null {
    return this.isAcceptingInput()
      ? resolveGT016BaseHintTarget(this.viewInput(), super.getHintTarget())
      : null;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    return this.isAcceptingInput()
      ? resolveGT016HintLevelTarget(
          level,
          this.viewInput(),
          this.getHintTarget()
        )
      : null;
  }

  override commit(action: GameAction): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    if (action.type === "select_option" && typeof action.data === "number") {
      this.selectOption(action.data);
    } else if (
      action.type === "match_card" &&
      typeof action.data === "string"
    ) {
      this.matchCard(action.data);
    } else if (action.type === "set_clock_time") {
      const p = extractSetClockTimeData(action.data);
      if (p) {
        this.currentTime = { hour: p.hour, minute: p.minute };
        this.onClockAdjusted(p.hand, true);
      }
    } else if (action.type === "adjust_time") {
      this.applyTimeDelta(extractAdjustDelta(action.data));
    } else if (action.type === "submit_time") {
      this.submitCurrentTime();
    }
  }

  override toAction(g: Gesture): GameAction | null {
    return this.isAcceptingInput()
      ? resolveGT016ToAction(g, this.viewInput())
      : null;
  }

  private viewInput(): GT016ViewInput {
    return {
      content: this.content,
      difficulty: this.difficulty,
      currentTime: this.currentTime,
      options: this.resolvedOptions,
      activityCards: this.resolvedActivityCards,
      slots: this.slots,
      stageRect: this.stageRect,
      logicSpace: this.logicSpace,
      touchFloor: this.currentTouchFloor,
      selectedOptionIndex: this.selectedOptionIndex,
      matchedCardIds: this.matchedCardIds,
      anim: this.anim,
      roundClosedOnWrong: this.roundClosedOnWrong,
      hasSubmittedTime: this.hasSubmittedTime,
      activeHintLevel: this.activeHintLevel,
      isWon: this.isWon,
      skyProgress: this.skyElapsedMs / GT016_SKY_RISE_MS,
      degradation: this.degradation,
      exploreTracker: this.exploreTracker,
    };
  }

  override getView(): EngineView {
    return buildGT016View(this.viewInput());
  }

  validateAction(action: GameAction): ActionResult {
    return this.isAcceptingInput()
      ? validateGT016Action(action, this.viewInput())
      : ACTION_IGNORED;
  }

  override checkWinCondition(): boolean {
    return checkGT016Win(this.viewInput());
  }

  update(deltaMs: number): void {
    this.skyElapsedMs += deltaMs;
    this.mood.tick(deltaMs);
    this.exploreTracker.tick(deltaMs);
    if (
      stepGT016AnimState(this.anim, this.currentTime, deltaMs) &&
      !this.roundClosedOnWrong
    ) {
      this.selectedOptionIndex = null;
    }
  }

  override destroy(): void {
    super.destroy();
    this.selectedOptionIndex = null;
    this.matchedCardIds.clear();
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const res = computeGT016SlotsForBand(
      this.viewInput(),
      ageBand,
      this.cssPerLogic ?? 1
    );
    this.currentTouchFloor = res.touchFloor;
    return res.slots;
  }

  render(ctx: CanvasRenderingContext2D, rs: RS, _timeMs: number): void {
    drawSceneBackground(ctx, rs, this.themeId);
    const sb = this.stageRect ?? sceneBox(rs);
    const draw = (): void =>
      renderGT016StageContent(ctx, rs, sb, this.viewInput());
    if (this.stageRect) {
      drawClippedToZone(ctx, this.stageRect, draw);
    } else {
      draw();
    }
  }
}

export const GT016Session = ClockHandsSession;
