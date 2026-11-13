import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
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
import { resolveLayout } from "#src/layout/registry";
import {
  dockRectAroundSlots,
  insetDrawSize,
  legacyStageArea,
} from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { drawSceneBackground, type SceneBox } from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import type { RenderSystem } from "#src/systems/render-system";
import { FlashTimer } from "#src/systems/timer-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import {
  buildGT012View,
  clockOf,
  renderGT012Scene,
  resetClock,
  TOUCH_PULSE_MS,
  tickGT012Clock,
} from "./layout.js";
import type { GT012Content, GT012Difficulty } from "./template.js";
import {
  computeFlashSlots,
  type GT012SessionVariant,
  plateSlot,
  type RecallAreas,
  resolveSessionVariant,
  splitRecallStage,
} from "./zone-layout.js";

export const GT012_STORY_LINE =
  "Đom đóm đang nháy sáng dưới nắp chuông. Bé bấm mở nắp, nhìn thật nhanh rồi cho biết có mấy chấm sáng nhé!";

export class FlashRecallSession extends TemplateGameSession<
  GT012Content,
  GT012Difficulty
> {
  override readonly usesPromptZone = true;
  readonly holdsClockWhileInputClosed = true;
  degradation: DegradationState | null = null;
  private readonly timer: FlashTimer;
  private selectedValue: number | null = null;
  private wasVisible = false;
  private awaitingStart = true;
  private isRoundClosed = false;
  private scaffoldHintLevel = 0;
  private readonly wrongFlash = new WrongFlash();
  private variant: GT012SessionVariant;
  private areas: RecallAreas | null = null;
  private flashSlots: readonly Slot[] = [];
  private cachedDockRect: SceneBox | null = null;

  constructor(c: GT012Content, d: GT012Difficulty, seed = 0) {
    super(c, d, seed);
    this.timer = new FlashTimer({
      flashMs: d.flash_ms,
      allowReplay: d.allow_replay,
    });
    this.variant = resolveSessionVariant(c, seed);
  }

  setupEntities(): void {
    resetClock(this);
    this.selectedValue = null;
    this.wrongFlash.clear();
    this.timer.reset();
    this.wasVisible = false;
    this.awaitingStart = true;
    this.isRoundClosed = false;
    this.isWon = false;
    this.scaffoldHintLevel = 0;
    this.variant = resolveSessionVariant(this.content, this.layoutSeed);
    this.recordEvent("game_started", {
      template_code: "GT-012",
      item_count: this.content.flash_items.length,
      flash_ms: this.timer.getDurationMs(),
    });
  }

  override isAcceptingInput(): boolean {
    return !(this.isWon || this.isRoundClosed);
  }
  isAwaitingStart(): boolean {
    return this.awaitingStart;
  }
  isRecapShown(): boolean {
    return this.checkWinCondition();
  }
  isRevealShown(): boolean {
    return this.checkWinCondition() || this.isRoundClosed;
  }
  getFlashSlots(): readonly Slot[] {
    return this.flashSlots;
  }
  getFlashItems(): GT012Content["flash_items"] {
    return this.content.flash_items;
  }
  getArrangement(): GT012Content["arrangement"] {
    return this.variant.effectiveArrangement;
  }
  getOptions(): GT012Content["options"] {
    return [...this.variant.displayOptions];
  }
  isFlashVisible(): boolean {
    return this.timer.isVisible();
  }
  isCovered(): boolean {
    return !(this.awaitingStart || this.timer.isVisible());
  }
  canReplay(): boolean {
    return this.timer.canReplay();
  }
  getSelectedValue(): number | null {
    return this.selectedValue;
  }
  override storyLine(): string {
    return GT012_STORY_LINE;
  }
  override mascotMood(): MascotPose | null {
    const done = this.awaitingStart || this.isWon || this.isRoundClosed;
    return done ? null : "wonder";
  }
  get plateRect(): ZoneRect | null {
    if (!this.areas) {
      return null;
    }
    const showList = this.isCovered() && !this.isRevealShown();
    return showList ? this.areas.plate : this.areas.plateAlone;
  }

  startFlash(originTimeMs = 0): boolean {
    if (!this.awaitingStart) {
      return false;
    }
    const clk = clockOf(this);
    this.awaitingStart = false;
    clk.flashStartLogicMs = clk.logicMs;
    clk.flashStartOriginMs = originTimeMs;
    this.queueSfx("bell_open");
    this.timer.start();
    this.wasVisible = true;
    this.recordEvent("flash_shown", {
      duration_ms: this.timer.getDurationMs(),
    });
    return true;
  }

  replayFlash(originTimeMs = 0): boolean {
    const ok = this.timer.replay();
    if (ok) {
      const clk = clockOf(this);
      clk.flashStartLogicMs = clk.logicMs;
      clk.flashStartOriginMs = originTimeMs;
      this.queueSfx("bell_open");
      this.wasVisible = true;
      this.recordEvent("flash_replayed", {});
      this.recordEvent("flash_shown", {
        duration_ms: this.timer.getDurationMs(),
      });
    }
    return ok;
  }

  update(deltaMs: number): void {
    const clk = clockOf(this);
    tickGT012Clock(clk, deltaMs);
    const active = !(this.isWon || this.isRoundClosed);
    if (
      active &&
      this.selectedValue !== null &&
      this.wrongFlash.hasExpired(clk.logicMs)
    ) {
      this.selectedValue = null;
      this.wrongFlash.clear();
    }
    const prev = this.timer.getState();
    this.timer.tick(deltaMs);
    if (
      prev === "running" &&
      this.timer.getState() === "expired" &&
      this.wasVisible
    ) {
      this.wasVisible = false;
      this.recordEvent("flash_hidden", {
        elapsed_ms: this.timer.getElapsedMs(),
      });
    }
  }

  selectValue(value: number): boolean {
    if (!this.isAcceptingInput()) {
      return false;
    }
    const clk = clockOf(this);
    this.selectedValue = value;
    const isCorrect = value === this.content.flash_items.length;
    if (isCorrect) {
      this.wrongFlash.clear();
      clk.winAtMs = clk.logicMs;
      this.scaffoldHintLevel = 0;
    } else {
      this.wrongFlash.trigger(clk.logicMs);
    }
    this.recordEvent("value_selected", { value, is_correct: isCorrect });
    if (this.checkWinCondition()) {
      this.winSession();
    } else if (!this.difficulty.allow_retry) {
      this.isRoundClosed = true;
      clk.closeAtMs = clk.logicMs;
      this.scaffoldHintLevel = 0;
      this.completeSession();
    }
    return isCorrect;
  }

  private canReplayNow(): boolean {
    return this.isCovered() && !this.isRevealShown() && this.timer.canReplay();
  }
  private hitPlate(x: number, y: number): boolean {
    const p = this.plateRect;
    return (
      p !== null &&
      isPointInSlot(plateSlot(p), x, y, "circle", TAP_TOLERANCE_PX)
    );
  }
  private findOptIndex(x: number, y: number): number {
    return findHitSlotIndex(this.slots, x, y, "circle", TAP_TOLERANCE_PX);
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    if (action.type === "start_flash") {
      return this.awaitingStart
        ? { valid: true, feedback: "none" }
        : ACTION_IGNORED;
    }
    if (this.awaitingStart) {
      return ACTION_IGNORED;
    }
    if (action.type === "replay_flash") {
      return this.canReplayNow()
        ? { valid: true, feedback: "none" }
        : ACTION_IGNORED;
    }
    if (action.type === "select_value" && !this.timer.isVisible()) {
      if (typeof action.data !== "number") {
        return ACTION_RETRY;
      }
      return action.data === this.content.flash_items.length
        ? ACTION_CORRECT
        : ACTION_RETRY;
    }
    return ACTION_IGNORED;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap" || !this.isAcceptingInput()) {
      return null;
    }
    if (this.awaitingStart) {
      return this.hitPlate(gesture.x, gesture.y)
        ? { type: "start_flash", data: gesture.timeMs }
        : null;
    }
    if (this.isRevealShown()) {
      return null;
    }
    if (this.canReplayNow() && this.hitPlate(gesture.x, gesture.y)) {
      return { type: "replay_flash", data: gesture.timeMs };
    }
    if (this.timer.isVisible()) {
      return null;
    }
    const idx = this.findOptIndex(gesture.x, gesture.y);
    const opt = idx >= 0 ? this.variant.displayOptions[idx] : undefined;
    return opt ? { type: "select_value", data: opt.value } : null;
  }

  onPointerDown(x: number, y: number): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    const clk = clockOf(this);
    if ((this.awaitingStart || this.canReplayNow()) && this.hitPlate(x, y)) {
      clk.touchingPlateUntilMs = clk.logicMs + TOUCH_PULSE_MS;
      return;
    }
    if (this.isCovered() && !this.isRevealShown()) {
      const idx = this.findOptIndex(x, y);
      if (idx >= 0) {
        clk.touchingOptIndex = idx;
        clk.touchingOptUntilMs = clk.logicMs + TOUCH_PULSE_MS;
      }
    }
  }

  setPointerOver(x: number, y: number): void {
    const clk = clockOf(this);
    if (!this.isAcceptingInput()) {
      clk.hoveredPlate = false;
      clk.hoveredOptIndex = null;
      return;
    }
    clk.hoveredPlate =
      (this.awaitingStart || this.canReplayNow()) && this.hitPlate(x, y);
    const idx =
      this.isCovered() && !this.isRevealShown() ? this.findOptIndex(x, y) : -1;
    clk.hoveredOptIndex = idx >= 0 ? idx : null;
  }

  override onScaffoldEscalated(
    level: HintLevel,
    _trigger?: "timer" | "miss_streak"
  ): void {
    this.scaffoldHintLevel = level;
  }
  override onHintCleared(): void {
    this.scaffoldHintLevel = 0;
  }

  override getHintTargetIndex(): number | null {
    if (this.awaitingStart || !this.isAcceptingInput()) {
      return null;
    }
    const idx = this.variant.displayOptions.findIndex((o) => o.is_correct);
    return idx >= 0 ? idx : null;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    if (this.awaitingStart) {
      return { kind: "region", ids: ["cloche-plate"] };
    }
    if (level === 1) {
      const allIds = this.variant.displayOptions.map((o) => `opt-${o.value}`);
      return {
        kind: "region",
        ids: this.timer.canReplay() ? ["cloche-plate"] : allIds,
      };
    }
    if (level === 2) {
      const nIds = this.variant.narrowedIds;
      return {
        kind: "region",
        ids: nIds.length > 0 ? [...nIds] : ["options-narrowed"],
      };
    }
    return this.getHintTarget();
  }

  override commit(action: GameAction): void {
    const originTimeMs = typeof action.data === "number" ? action.data : 0;
    if (action.type === "select_value" && typeof action.data === "number") {
      this.selectValue(action.data);
    } else if (action.type === "start_flash") {
      this.startFlash(originTimeMs);
    } else if (action.type === "replay_flash") {
      this.replayFlash(originTimeMs);
    }
  }

  override getView(): EngineView {
    const clk = clockOf(this);
    return buildGT012View({
      content: this.content,
      variant: this.variant,
      slots: this.slots,
      flashSlots: this.flashSlots,
      plateRect: this.plateRect,
      clk,
      awaitingStart: this.awaitingStart,
      isFlashVisible: this.timer.isVisible(),
      isWon: this.checkWinCondition(),
      isRoundClosed: this.isRoundClosed,
      canReplay: this.timer.canReplay(),
      selectedValue: this.selectedValue,
      wrongActive: this.wrongFlash.isActive(clk.logicMs),
    });
  }

  override checkWinCondition(): boolean {
    const exp = this.content.flash_items.length;
    return this.selectedValue !== null && this.selectedValue === exp;
  }

  override destroy(): void {
    super.destroy();
    resetClock(this);
    this.timer.reset();
    this.selectedValue = null;
    this.wasVisible = false;
    this.awaitingStart = true;
    this.isRoundClosed = false;
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const fallback = legacyStageArea(this.logicSpace);
    this.areas = splitRecallStage(this.stageRect ?? fallback);
    const layoutFn = resolveLayout("grid");
    const raw = layoutFn({
      slotCount: this.variant.displayOptions.length,
      ageBand,
      logic: this.logicSpace,
      stage: this.areas.options,
      cssPerLogic: this.cssPerLogic,
    });
    const slots = insetDrawSize(raw, this.stageRect);
    this.cachedDockRect = dockRectAroundSlots(slots, this.stageRect) ?? null;
    return slots;
  }

  protected override computeRoundDerived(): void {
    if (!this.areas) {
      return;
    }
    const n = this.content.flash_items.length;
    const arr = this.variant.effectiveArrangement;
    this.flashSlots = computeFlashSlots(this.areas.plateAlone, n, arr);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    const clk = clockOf(this);
    const wrongActive = this.wrongFlash.isActive(clk.logicMs);
    renderGT012Scene({
      ctx,
      rs,
      timeMs,
      plateRect: this.plateRect,
      stageRect: this.stageRect,
      cachedDockRect: this.cachedDockRect,
      content: this.content,
      variant: this.variant,
      slots: this.slots,
      flashSlots: this.flashSlots,
      clk,
      awaitingStart: this.awaitingStart,
      isFlashVisible: this.timer.isVisible(),
      isWon: this.checkWinCondition(),
      isRoundClosed: this.isRoundClosed,
      canReplay: this.timer.canReplay(),
      durationMs: this.timer.getDurationMs(),
      selectedValue: this.selectedValue,
      wrongActive,
      wrongProg: wrongActive ? this.wrongFlash.progress(clk.logicMs) : null,
      scaffoldHintLevel: this.scaffoldHintLevel,
      degraded: this.degradation?.particles_enabled === false,
    });
  }
}

export const GT012Session = FlashRecallSession;
export default FlashRecallSession;
