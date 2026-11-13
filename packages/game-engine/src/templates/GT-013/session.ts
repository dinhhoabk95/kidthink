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
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import type { Slot } from "#src/layout/types";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import {
  drawGT013BoardUnderlay,
  drawGT013HeadAndFeedback,
  drawGT013WaypointsAndWalls,
} from "#src/render/gt-013-shapes";
import {
  boxFromSlots,
  drawMazeFootprints,
  drawMazeGoalFlag,
  drawSceneBackground,
  drawStoryCharacterInStage,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import {
  canMove,
  cellKey,
  cellTowards,
  findRouteThrough,
  type MazeCell,
  type MazeGrid,
  MazePathTracker,
  type MazeSide,
  type MazeStepResult,
} from "#src/systems/maze-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import {
  buildGT013RenderView,
  buildGT013View,
  cellToSlotIndex,
  clockOf,
  computeGT013Slots,
  computeHintCells,
  computeRemainingRoute,
  deriveGT013DecorGrains,
  extractMazeCell,
  extractMazeCells,
  extractMazeSide,
  neighborSide,
  resetClock,
  resolvePointerCoords,
  sameCell,
  TOUCH_PULSE_MS,
  tickGT013Clock,
} from "./layout.js";
import type { GT013Content, GT013Difficulty } from "./template.js";

type PtInput = { readonly x: number; readonly y: number } | number;
type StrokeG = Extract<Gesture, { type: "stroke" }>;
type DropG = Extract<Gesture, { type: "drop" }>;

export interface MazeScaffoldHint {
  readonly cells: readonly MazeCell[];
  readonly ghost_hand: boolean;
  readonly slow_repeat: boolean;
}

export const GT013_STORY_LINE =
  "Chuột Nhắt đi tìm đường về nhà. Bé dẫn Chuột đi, gặp tường thì thử lối khác nhé!";
export const GT013_SHRUG_MS = 1200;

export class GT013Session extends TemplateGameSession<
  GT013Content,
  GT013Difficulty
> {
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;
  private readonly ordering = new OrderingMechanic();
  private tracker: MazePathTracker = new MazePathTracker(this.content.grid);
  private readonly mood = new MoodPulse();
  private isRoundClosed = false;
  private solutionRoute: readonly MazeCell[] = [];
  private decorGrains: readonly number[] = [];

  setupEntities(): void {
    resetClock(this);
    this.tracker = new MazePathTracker(this.content.grid);
    this.syncSequence();
    this.mood.clear();
    this.isWon = false;
    this.isRoundClosed = false;
    this.isCompleted = false;
    this.endTimeMs = undefined;
    const { grid, required_cells: req } = this.content;
    this.solutionRoute = findRouteThrough(grid, req) ?? [];
    const total = grid.rows * grid.cols;
    this.decorGrains = deriveGT013DecorGrains(this.layoutSeed, total);
  }

  override destroy(): void {
    super.destroy();
    resetClock(this);
    this.mood.clear();
    this.isWon = false;
    this.isRoundClosed = false;
  }

  override isAcceptingInput(): boolean {
    return super.isAcceptingInput() && !this.isWon && !this.isRoundClosed;
  }
  override dispatch(gesture: Gesture): ActionResult | undefined {
    return this.isAcceptingInput() ? super.dispatch(gesture) : ACTION_IGNORED;
  }
  isRoundClosedState(): boolean {
    return this.isRoundClosed;
  }
  getSolutionRoute(): readonly MazeCell[] {
    if (this.solutionRoute.length === 0) {
      const req = this.content.required_cells;
      this.solutionRoute = findRouteThrough(this.grid, req) ?? [];
    }
    return this.solutionRoute;
  }
  override storyLine(): string {
    return GT013_STORY_LINE;
  }
  override mascotMood(): MascotPose | null {
    return this.isWon || this.isRoundClosed ? null : this.mood.current();
  }
  update(deltaMs: number): void {
    tickGT013Clock(clockOf(this), deltaMs);
    this.mood.tick(Math.max(0, deltaMs));
  }
  getPath(): readonly MazeCell[] {
    return this.tracker.getPath();
  }
  getPathSequence(): readonly string[] {
    return this.ordering.getCurrentSequence();
  }
  getInputMode(): "draw" | "arrows" {
    return this.content.input_mode;
  }

  private closeFailedRound(): void {
    const clk = clockOf(this);
    this.isRoundClosed = true;
    clk.closeAtMs = clk.logicMs;
    clk.activeHintLevel = 0;
    this.mood.clear();
    this.getSolutionRoute();
    this.completeSession();
  }

  onPathStep(cell: MazeCell): MazeStepResult {
    if (this.isWon || this.isRoundClosed) {
      return { status: "blocked", path: this.tracker.getPath() };
    }
    const clk = clockOf(this);
    const sideAttempted = neighborSide(this.tracker.getHead(), cell);
    const res = this.tracker.step(cell);
    this.syncSequence();

    if (res.status === "moved") {
      clk.stepAtMs = clk.logicMs;
      clk.activeHintLevel = 0;
      clk.blockedCell = null;
      clk.blockedWallSide = null;
      this.queueSfx("mouse_step");
      const step_index = this.tracker.getPath().length - 1;
      this.recordEvent("path_step", { ...cell, step_index });
      const miss = sameCell(cell, this.grid.goal) && !this.checkWinCondition();
      clk.missingRequiredUntilMs = miss ? clk.logicMs + 900 : -9999;
    } else if (res.status === "rewound") {
      clk.backtrackAtMs = clk.logicMs;
      clk.missingRequiredUntilMs = -9999;
    } else if (res.status === "blocked") {
      this.queueSfx("wall_boing");
      this.mood.set("wonder", GT013_SHRUG_MS);
      const reason = res.blocked_reason;
      clk.blockedCell = cell;
      clk.blockedWallSide =
        reason === "wall" || reason === "outside" ? sideAttempted : null;
      clk.blockedAtMs = clk.logicMs;
      this.recordEvent("path_blocked", { ...cell, reason, retreated: false });
      if (this.difficulty.allow_retry === false && reason === "wall") {
        this.closeFailedRound();
      }
    }
    return res;
  }

  onArrowPressed(side: MazeSide): MazeStepResult {
    return this.onPathStep(cellTowards(this.tracker.getHead(), side));
  }

  onPathSubmitted(): boolean {
    if (this.isWon || this.isRoundClosed) {
      return this.isWon;
    }
    const clk = clockOf(this);
    const ok = this.checkWinCondition();
    const steps = this.tracker.getPath().length - 1;
    this.recordEvent("path_submitted", { is_correct: ok, step_count: steps });
    if (ok) {
      clk.winAtMs = clk.logicMs;
      clk.activeHintLevel = 0;
      clk.missingRequiredUntilMs = -9999;
      this.mood.clear();
      this.winSession();
    } else {
      clk.submitRetryUntilMs = clk.logicMs + 700;
      clk.missingRequiredUntilMs = clk.logicMs + 900;
      if (this.difficulty.allow_retry === false) {
        this.closeFailedRound();
      }
    }
    return ok;
  }

  getScaffoldHint(level: 1 | 2 | 3): MazeScaffoldHint | null {
    const ahead = this.remainingRoute();
    if (ahead.length === 0) {
      return null;
    }
    const cells = computeHintCells(this.grid, ahead, level);
    return { cells, ghost_hand: level >= 2, slow_repeat: level === 3 };
  }

  override onScaffoldEscalated(lv: HintLevel, _t?: string): void {
    clockOf(this).activeHintLevel = lv;
  }
  override onHintCleared(): void {
    clockOf(this).activeHintLevel = 0;
  }
  private isHintActive(): boolean {
    return this.isAcceptingInput() && !this.checkWinCondition();
  }

  override getHintTargetIndex(): number | null {
    if (!this.isHintActive()) {
      return null;
    }
    const nextCell = this.remainingRoute()[0] ?? this.grid.goal;
    return cellToSlotIndex(nextCell, this.grid.cols, this.slots.length);
  }

  override getHintTargetForLevel(lv: HintLevel): HintTarget | null {
    const ahead = this.remainingRoute();
    const n = this.slots.length;
    const cols = this.grid.cols;
    if (lv === 1) {
      const idx = ahead[0] ? cellToSlotIndex(ahead[0], cols, n) : null;
      return idx === null ? null : { kind: "slot", index: idx };
    }
    const h = computeHintCells(this.grid, ahead, lv);
    const tc = lv === 2 ? h.at(-1) : h[0];
    const toIndex = tc ? cellToSlotIndex(tc, cols, n) : null;
    const index = cellToSlotIndex(this.tracker.getHead(), cols, n) ?? toIndex;
    return toIndex === null || index === null
      ? null
      : { kind: "slot", index, toIndex };
  }

  override getHintDemoSequence(lv: HintLevel): readonly HintDemoStep[] | null {
    const c3 = lv === 3 ? (this.getScaffoldHint(3)?.cells ?? []) : [];
    const n = this.slots.length;
    const idx = [this.tracker.getHead(), ...c3].map((c) =>
      cellToSlotIndex(c, this.grid.cols, n)
    );
    const steps = idx
      .slice(0, -1)
      .map((from, i) => ({ from: from ?? -1, to: idx[i + 1] ?? -1 }))
      .filter((s) => s.from >= 0 && s.to >= 0);
    return steps.length >= 2 ? steps : null;
  }

  onPointerDown(ptOrX: PtInput, maybeY?: number): void {
    const pt = resolvePointerCoords(ptOrX, maybeY);
    if (pt && this.isAcceptingInput()) {
      const clk = clockOf(this);
      const idx = this.hitSlotAt(pt.x, pt.y);
      clk.touchingSlotIndex = idx >= 0 ? idx : null;
      clk.touchingUntilMs = idx >= 0 ? clk.logicMs + TOUCH_PULSE_MS : -9999;
    }
  }

  setPointerOver(ptOrX: PtInput | null, maybeY?: number): void {
    const clk = clockOf(this);
    const pt = resolvePointerCoords(ptOrX, maybeY);
    const idx = pt && this.isAcceptingInput() ? this.hitSlotAt(pt.x, pt.y) : -1;
    clk.hoveredSlotIndex = idx >= 0 ? idx : null;
  }

  validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    if (action.type === "submit_path") {
      return this.checkWinCondition() ? ACTION_CORRECT : ACTION_RETRY;
    }
    const sc = extractMazeCells(action.data)[0];
    const first = action.type === "stroke_path" ? sc : this.actionCell(action);
    return first && this.isLegalStep(first) ? ACTION_CORRECT : ACTION_IGNORED;
  }

  private isInsideStage(x: number, y: number): boolean {
    const s = this.stageRect;
    return !s || (x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
  }
  private hitSlotAt(x: number, y: number): number {
    return this.isInsideStage(x, y)
      ? findHitSlotIndex(this.slots, x, y, "square", TAP_TOLERANCE_PX)
      : -1;
  }
  private findHitCell(x: number, y: number): MazeCell | null {
    const i = this.hitSlotAt(x, y);
    const { rows, cols } = this.grid;
    const r = Math.floor(i / cols);
    const c = i % cols;
    return i >= 0 && r < rows && c < cols ? { row: r, col: c } : null;
  }

  private toStrokeAction(g: StrokeG): GameAction | null {
    const p0 = g.points[0];
    if (!(p0 && this.isInsideStage(p0.x, p0.y))) {
      return null;
    }
    const head = this.tracker.getHead();
    const cells: MazeCell[] = [];
    for (const pt of g.points) {
      const cell = this.findHitCell(pt.x, pt.y);
      if (cell && !sameCell(cell, cells.at(-1) ?? head)) {
        cells.push(cell);
      }
    }
    if (cells.length === 0) {
      return null;
    }
    return cells.length === 1
      ? { type: "draw_step", data: cells[0] }
      : { type: "stroke_path", data: { cells } };
  }

  private toDropAction(g: DropG): GameAction | null {
    const endCell = this.findHitCell(g.toX, g.toY);
    if (endCell && this.isLegalStep(endCell)) {
      return { type: "draw_step", data: endCell };
    }
    const points = Array.from({ length: 9 }, (_, i) => ({
      x: g.fromX + ((g.toX - g.fromX) * i) / 8,
      y: g.fromY + ((g.toY - g.fromY) * i) / 8,
    }));
    return this.toStrokeAction({ type: "stroke", points, timeMs: g.timeMs });
  }

  override toAction(g: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    if (g.type === "stroke" || g.type === "drop") {
      return g.type === "stroke"
        ? this.toStrokeAction(g)
        : this.toDropAction(g);
    }
    const cell = g.type === "tap" ? this.findHitCell(g.x, g.y) : null;
    if (!cell) {
      return null;
    }
    const isArrows = this.content.input_mode === "arrows";
    const side = isArrows ? neighborSide(this.tracker.getHead(), cell) : null;
    return side
      ? { type: "move_arrow", data: { side } }
      : { type: "tap_cell", data: cell };
  }

  private commitStrokeCells(cells: readonly MazeCell[]): void {
    for (const cell of cells) {
      const res = this.onPathStep(cell);
      if (res.status === "blocked" || this.isRoundClosed) {
        return;
      }
      if (this.checkWinCondition()) {
        this.onPathSubmitted();
        return;
      }
    }
  }

  override commit(action: GameAction): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    if (action.type === "stroke_path") {
      this.commitStrokeCells(extractMazeCells(action.data));
      return;
    }
    const cell = this.actionCell(action);
    if (cell) {
      this.onPathStep(cell);
      if (!this.isRoundClosed && this.checkWinCondition()) {
        this.onPathSubmitted();
      }
    } else if (action.type === "submit_path") {
      this.onPathSubmitted();
    }
  }

  override getView(): EngineView {
    const { content: ct, slots: sl, isWon: w, isRoundClosed: cl } = this;
    return buildGT013View(ct, sl, this.tracker.getPath(), clockOf(this), w, cl);
  }

  override checkWinCondition(): boolean {
    const req = this.content.required_cells;
    return !this.isRoundClosed && this.tracker.isComplete(req);
  }

  private get grid(): MazeGrid {
    return this.content.grid;
  }
  private syncSequence(): void {
    this.ordering.setInitialSequence(this.tracker.getPath().map(cellKey));
  }
  private actionCell(a: GameAction): MazeCell | null {
    if (a.type === "draw_step" || a.type === "tap_cell") {
      return extractMazeCell(a.data);
    }
    const s = a.type === "move_arrow" ? extractMazeSide(a.data) : null;
    return s ? cellTowards(this.tracker.getHead(), s) : null;
  }
  private isLegalStep(cell: MazeCell): boolean {
    return canMove(this.grid, this.tracker.getHead(), cell);
  }
  private remainingRoute(): MazeCell[] {
    if (!this.isHintActive()) {
      return [];
    }
    const req = this.content.required_cells;
    return computeRemainingRoute(this.grid, this.tracker.getPath(), req);
  }
  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const { grid, logicSpace: logic, stageRect: stage, cssPerLogic } = this;
    return computeGT013Slots({ grid, ageBand, logic, stage, cssPerLogic });
  }

  render(ctx: CanvasRenderingContext2D, rs: RenderSystem, tMs: number): void {
    drawSceneBackground(ctx, rs, this.themeId);
    drawStoryCharacterInStage(ctx, "mouse", this.stageRect, this.slots);
    const box = boxFromSlots(this.slots);
    if (!box) {
      return;
    }
    const path = this.tracker.getPath();
    const view = buildGT013RenderView({
      content: this.content,
      box,
      stageRect: this.stageRect,
      path,
      solutionRoute: this.getSolutionRoute(),
      decorGrains: this.decorGrains,
      clk: clockOf(this),
      isWon: this.isWon,
      isRoundClosed: this.isRoundClosed,
      degradation: this.degradation,
      timeMs: tMs,
    });
    drawGT013BoardUnderlay(ctx, rs, view);
    drawMazeFootprints(ctx, this.grid, box, path);
    drawGT013WaypointsAndWalls(ctx, rs, view);
    drawMazeGoalFlag(ctx, this.grid, box, this.content.goal_glyph);
    drawGT013HeadAndFeedback(ctx, rs, view);
  }
}

export const MazeRouteSession = GT013Session;
export default GT013Session;
