import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture } from "#src/interaction";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  clampYarnThreadTip,
  spawnParticlesAtSlot,
  updateParticles,
  type YarnThread,
} from "#src/render/index.js";
import type { MascotPose } from "#src/render/mascot";
import type { DegradationState } from "#src/systems/degradation";
import type {
  HintDemoStep,
  HintLevel,
  HintTarget,
} from "#src/systems/hint-ladder.js";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import {
  buildGT033View,
  computeGT033Slots,
  extractGT033Payload,
  getGT033Clock,
  peekGT033Clock,
  renderGT033Frame,
  resetGT033Clock,
  resolveCellEntityId,
  resolveGT033HintDemoSequence,
  resolveGT033HintTarget,
  resolveGT033HintTargetForLevel,
  resolveVisualColorId,
} from "./layout.js";
import type {
  GT033Content,
  GT033Difficulty,
  GT033PaletteItem,
} from "./template.js";
import {
  buildReplayInitialCells,
  evaluateWeavePlacement,
  isWeaveBoardComplete,
  solveWeaveGrid,
} from "./weave-rules.js";

/** Khung chuyện đọc một lần ở vòng đầu (`BR-E033-05`, `BR-FBK-16`). */
export const GT033_STORY_LINE =
  "Bà đang dệt một chiếc khăn thổ cẩm nhiều màu. Bé chọn sợi len rồi dệt vào ô trống cho đẹp nhé!";

/** Mascot vui sau sợi đặt đúng. */
export const GT033_HAPPY_MS = 800;
/** Mascot nghiêng đầu sau sợi đặt chưa đúng. */
export const GT033_WONDER_MS = 1500;
/** Sợi co về cuộn khi nhả ngoài ô (`BR-E033-07`). */
export const GT033_THREAD_RETRACT_MS = 200;

interface PointXY {
  readonly x: number;
  readonly y: number;
}

interface ThreadState {
  readonly paletteIndex: number;
  readonly point: PointXY;
  retractedMs: number | null;
}

export class GT033Session extends TemplateGameSession<
  GT033Content,
  GT033Difficulty
> {
  override readonly needsTray = true;

  override get trayItemCount(): number {
    return this.content.palette.length;
  }

  override get stageRowCount(): number {
    return this.content.grid.rows;
  }

  override get trayHasLabels(): boolean {
    return true;
  }

  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;
  placedCells: (string | null)[] = [];
  selectedColorId: string | null = null;
  selectedCellIndex: number | null = null;
  brokenRowIndex: number | null = null;
  brokenColIndex: number | null = null;
  isWin = false;

  private activeInitialCells: (string | null)[] = [];
  private inferredSolution: readonly string[] | null = null;
  private replayGeneration = 0;
  private roundClosed = false;
  private readonly mood = new MoodPulse();
  private thread: ThreadState | null = null;

  override storyLine(): string {
    return GT033_STORY_LINE;
  }

  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  override isAcceptingInput(): boolean {
    return !(this.isWin || this.isWon || this.roundClosed);
  }

  private expectedSolutionCells(): readonly (string | null)[] {
    return this.inferredSolution ?? this.content.solution ?? [];
  }

  update(deltaMs: number): void {
    const clock = getGT033Clock(this);
    clock.simMs += deltaMs;
    if (clock.particles.length > 0) {
      clock.particles = updateParticles(clock.particles);
    }
    this.mood.tick(deltaMs);
    const t = this.thread;
    if (t && t.retractedMs !== null) {
      t.retractedMs += deltaMs;
      if (t.retractedMs >= GT033_THREAD_RETRACT_MS) {
        this.thread = null;
      }
    }
  }

  setPointerOver(x: number, y: number): void {
    const clock = getGT033Clock(this);
    if (!this.isAcceptingInput()) {
      clock.hoveredEntityId = null;
      return;
    }
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    const palItem = this.findTappedPalette(x, y, totalCells);
    const cellIdx = this.findTappedCellIndex(x, y, totalCells);
    if (palItem && cellIdx !== null) {
      const pSlot =
        this.slots[totalCells + this.content.palette.indexOf(palItem)];
      const cSlot = this.slots[cellIdx];
      const distP = pSlot
        ? Math.hypot(x - pSlot.x, y - pSlot.y)
        : Number.POSITIVE_INFINITY;
      const distC = cSlot
        ? Math.hypot(x - cSlot.x, y - cSlot.y)
        : Number.POSITIVE_INFINITY;
      if (distP <= distC) {
        clock.hoveredEntityId = palItem.color_id;
        return;
      }
    } else if (palItem) {
      clock.hoveredEntityId = palItem.color_id;
      return;
    }
    if (cellIdx === null) {
      clock.hoveredEntityId = null;
      return;
    }
    const paletteIds = new Set(this.content.palette.map((p) => p.color_id));
    clock.hoveredEntityId = resolveCellEntityId(cellIdx, paletteIds);
  }

  clearPointerOver(): void {
    const clock = peekGT033Clock(this);
    if (clock) {
      clock.hoveredEntityId = null;
    }
  }

  override destroy(): void {
    resetGT033Clock(this);
    super.destroy();
  }

  override onPointerMove(point: PointXY, origin: PointXY): void {
    if (!this.isAcceptingInput()) {
      this.thread = null;
      return;
    }
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    const item = this.findTappedPalette(origin.x, origin.y, totalCells);
    this.thread = item
      ? {
          paletteIndex: this.content.palette.indexOf(item),
          point: { x: point.x, y: point.y },
          retractedMs: null,
        }
      : null;
  }

  override onPointerRelease(): void {
    if (this.thread && this.thread.retractedMs === null) {
      this.thread.retractedMs = 0;
    }
  }

  getYarnThread(reducedMotion: boolean): YarnThread | null {
    const t = this.thread;
    if (!t || (reducedMotion && t.retractedMs !== null)) {
      return null;
    }
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    const item = this.content.palette[t.paletteIndex];
    const slot = this.slots[totalCells + t.paletteIndex];
    if (!(item && slot)) {
      return null;
    }
    const from = { x: slot.x, y: slot.y };
    const tip = clampYarnThreadTip(t.point, this.stageRect);
    const k =
      t.retractedMs === null
        ? 1
        : 1 - Math.min(1, t.retractedMs / GT033_THREAD_RETRACT_MS);
    return {
      from,
      to: {
        x: from.x + (tip.x - from.x) * k,
        y: from.y + (tip.y - from.y) * k,
      },
      colorId:
        resolveVisualColorId(this.content.palette, item.color_id) ??
        item.color_id,
      straight: reducedMotion,
      clip: [this.stageRect, this.trayRect].filter(
        (r): r is ZoneRect => r !== undefined
      ),
    };
  }

  setupEntities(): void {
    const clock = getGT033Clock(this);
    clock.winStamp = null;
    clock.activeHintLevel = 0;
    clock.hoveredEntityId = null;
    clock.wrongFlashes.clear();
    clock.particles = [];

    this.mood.clear();
    this.thread = null;
    this.selectedColorId = null;
    this.selectedCellIndex = null;
    this.brokenRowIndex = null;
    this.brokenColIndex = null;
    this.isWin = false;
    this.roundClosed = false;

    const paletteIds = this.content.palette.map((p) => p.color_id);
    const solved = solveWeaveGrid(
      this.content.grid.rows,
      this.content.grid.cols,
      paletteIds,
      this.content.cells,
      1
    );
    const solution = solved[0] ?? this.content.solution ?? null;
    this.inferredSolution = solution;

    const gen = Math.max(this.roundGeneration, this.replayGeneration);
    const initialCells =
      gen > 0 && solution
        ? buildReplayInitialCells(
            solution,
            this.content.cells,
            this.content.grid.rows,
            this.content.grid.cols,
            paletteIds,
            gen,
            this.layoutSeed
          )
        : [...this.content.cells];
    this.replayGeneration += 1;
    this.activeInitialCells = initialCells;
    this.placedCells = [...initialCells];

    this.recordEvent("game_started", {
      template_code: "GT-033",
      difficulty: this.difficulty.grid_size,
      age_band: "5-6",
      device: "tablet",
      reduced_motion: false,
      round_index: 0,
    });
  }

  override onScaffoldEscalated(
    level: HintLevel,
    _trigger: "timer" | "miss_streak"
  ): void {
    getGT033Clock(this).activeHintLevel = level;
  }

  override onHintCleared(): void {
    getGT033Clock(this).activeHintLevel = 0;
  }

  override getHintTargetIndex(): number | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const target = resolveGT033HintTarget(
      this.content,
      this.placedCells,
      this.expectedSolutionCells()
    );
    if (!target) {
      const blank = this.placedCells.indexOf(null);
      return blank >= 0 ? blank : null;
    }
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    if (this.selectedColorId !== target.colorId) {
      return totalCells + target.paletteIndex;
    }
    return target.cellIndex;
  }

  override getHintDestinationIndex(): number | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const target = resolveGT033HintTarget(
      this.content,
      this.placedCells,
      this.expectedSolutionCells()
    );
    if (!target || this.selectedColorId === target.colorId) {
      return null;
    }
    return target.cellIndex;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    return resolveGT033HintTargetForLevel(
      level,
      this.content,
      this.placedCells,
      this.expectedSolutionCells(),
      this.selectedColorId
    );
  }

  override getHintDemoSequence(
    level: HintLevel
  ): readonly HintDemoStep[] | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    return resolveGT033HintDemoSequence(
      level,
      this.content,
      this.placedCells,
      this.expectedSolutionCells(),
      this.selectedColorId
    );
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    return computeGT033Slots(
      this.content,
      band,
      this.cssPerLogic ?? 1,
      this.logicSpace,
      this.stageRect,
      this.trayRect
    );
  }

  private evaluatePlacement(cellIndex: number, colorId: string) {
    return evaluateWeavePlacement(
      this.placedCells,
      this.content.grid.rows,
      this.content.grid.cols,
      this.content.palette.length,
      cellIndex,
      colorId,
      this.getExpectedColorAt(cellIndex)
    );
  }

  private resolveSelectColorId(action: GameAction): string | null {
    const payload = extractGT033Payload(action);
    if (payload.colorId) {
      return payload.colorId;
    }
    if (action.data && typeof action.data === "object") {
      const id = Reflect.get(action.data, "id");
      return typeof id === "string" ? id : null;
    }
    return null;
  }

  private isSelectType(type: string): boolean {
    return (
      type === "select_palette" ||
      type === "select_color" ||
      type === "pick_yarn"
    );
  }

  private isPlaceType(type: string): boolean {
    return (
      type === "place_yarn" ||
      type === "tap_cell" ||
      type === "fill_cell" ||
      type === "drop_yarn"
    );
  }

  private isEditableCell(cellIndex: number | null): cellIndex is number {
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    return (
      cellIndex !== null &&
      cellIndex >= 0 &&
      cellIndex < totalCells &&
      this.activeInitialCells[cellIndex] === null
    );
  }

  private validatePlaceAction(
    cellIndex: number | null,
    colorId: string | null
  ): ActionResult {
    if (!(this.isEditableCell(cellIndex) && colorId)) {
      return ACTION_IGNORED;
    }
    return this.evaluatePlacement(cellIndex, colorId).isCorrect
      ? ACTION_CORRECT
      : ACTION_RETRY;
  }

  override validateAction(action: GameAction): ActionResult {
    if (!this.isAcceptingInput()) {
      return ACTION_IGNORED;
    }
    const { type } = action;
    const payload = extractGT033Payload(action);
    if (this.isSelectType(type)) {
      const id = this.resolveSelectColorId(action);
      return id && this.content.palette.some((p) => p.color_id === id)
        ? ACTION_CORRECT
        : ACTION_IGNORED;
    }
    if (this.isPlaceType(type)) {
      return this.validatePlaceAction(
        payload.cellIndex,
        payload.colorId ?? this.selectedColorId
      );
    }
    if (type === "remove_yarn" || type === "undo_yarn") {
      return this.isEditableCell(payload.cellIndex) &&
        this.placedCells[payload.cellIndex]
        ? ACTION_CORRECT
        : ACTION_IGNORED;
    }
    return ACTION_IGNORED;
  }

  private commitPlaceYarn(cellIndex: number, colorId: string): void {
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    if (
      cellIndex < 0 ||
      cellIndex >= totalCells ||
      this.activeInitialCells[cellIndex] !== null
    ) {
      return;
    }
    const row = Math.floor(cellIndex / this.content.grid.cols);
    const col = cellIndex % this.content.grid.cols;
    const check = this.evaluatePlacement(cellIndex, colorId);

    this.placedCells[cellIndex] = colorId;
    this.selectedCellIndex = cellIndex;
    this.selectedColorId = colorId;
    this.thread = null;
    this.queueSfx("yarn_pull");
    this.mood.set(
      check.isCorrect ? "happy" : "wonder",
      check.isCorrect ? GT033_HAPPY_MS : GT033_WONDER_MS
    );

    const clock = getGT033Clock(this);
    if (check.isCorrect) {
      this.brokenRowIndex = null;
      this.brokenColIndex = null;
      clock.activeHintLevel = 0;
      clock.wrongFlashes.delete(cellIndex);
    } else {
      this.brokenRowIndex = check.brokenRowIndex;
      this.brokenColIndex = check.brokenColIndex;
      clock.wrongFlashes.set(cellIndex, {
        simMs: clock.simMs,
        wallMs: clock.lastWallMs,
      });
      if (this.difficulty.allow_retry === false) {
        this.roundClosed = true;
      }
    }

    this.recordEvent("yarn_placed", {
      cell_index: cellIndex,
      color_id: colorId,
      is_correct: check.isCorrect,
      row,
      col,
    });

    if (this.verifyGridSolved()) {
      this.isWin = true;
      this.isWon = true;
      clock.activeHintLevel = 0;
      clock.winStamp = { simMs: clock.simMs, wallMs: clock.lastWallMs };
      this.recordEvent("game_completed", {
        duration_ms: 0,
        rounds_total: 1,
        rounds_correct: 1,
      });
      const slot = this.slots[cellIndex];
      if (slot) {
        clock.particles.push(...spawnParticlesAtSlot(slot, 20));
      }
      this.winSession();
    }
  }

  private commitRemoveYarn(cellIndex: number): void {
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    if (
      cellIndex < 0 ||
      cellIndex >= totalCells ||
      this.activeInitialCells[cellIndex] !== null
    ) {
      return;
    }
    const prevColor = this.placedCells[cellIndex];
    if (!prevColor) {
      return;
    }
    this.placedCells[cellIndex] = null;
    this.brokenRowIndex = null;
    this.brokenColIndex = null;
    getGT033Clock(this).wrongFlashes.delete(cellIndex);

    this.recordEvent("yarn_removed", {
      cell_index: cellIndex,
      color_id: prevColor,
      row: Math.floor(cellIndex / this.content.grid.cols),
      col: cellIndex % this.content.grid.cols,
    });
  }

  override commit(action: GameAction): void {
    if (!this.isAcceptingInput()) {
      return;
    }
    const { type } = action;
    const payload = extractGT033Payload(action);
    if (this.isSelectType(type)) {
      const rawId = this.resolveSelectColorId(action);
      if (rawId && this.content.palette.some((p) => p.color_id === rawId)) {
        this.selectedColorId = rawId;
      }
      return;
    }
    if (this.isPlaceType(type)) {
      const colorId = payload.colorId ?? this.selectedColorId;
      if (payload.cellIndex !== null && colorId) {
        this.commitPlaceYarn(payload.cellIndex, colorId);
      }
      return;
    }
    if (
      (type === "remove_yarn" || type === "undo_yarn") &&
      payload.cellIndex !== null
    ) {
      this.commitRemoveYarn(payload.cellIndex);
    }
  }

  private nearestIndex(
    slots: readonly Slot[],
    x: number,
    y: number,
    shape: "circle" | "square"
  ): number | null {
    const index = findHitSlotIndex(slots, x, y, shape, TAP_TOLERANCE_PX);
    return index < 0 ? null : index;
  }

  private findTappedPalette(
    gx: number,
    gy: number,
    totalCells: number
  ): GT033PaletteItem | null {
    const slots = this.slots.slice(
      totalCells,
      totalCells + this.content.palette.length
    );
    const index = this.nearestIndex(slots, gx, gy, "circle");
    return index === null ? null : (this.content.palette[index] ?? null);
  }

  private findTappedCellIndex(
    gx: number,
    gy: number,
    totalCells: number
  ): number | null {
    const editable = this.slots
      .slice(0, totalCells)
      .filter((_, i) => this.activeInitialCells[i] === null);
    const index = this.nearestIndex(editable, gx, gy, "square");
    return index === null ? null : (editable[index]?.index ?? null);
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    totalCells: number
  ): GameAction | null {
    const color = this.findTappedPalette(
      gesture.fromX,
      gesture.fromY,
      totalCells
    );
    const cell = this.findTappedCellIndex(gesture.toX, gesture.toY, totalCells);
    if (!color || cell === null || this.activeInitialCells[cell] !== null) {
      return null;
    }
    return {
      type: "place_yarn",
      data: { cell_index: cell, color_id: color.color_id },
    };
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>,
    totalCells: number
  ): GameAction | null {
    const paletteItem = this.findTappedPalette(
      gesture.x,
      gesture.y,
      totalCells
    );
    const cellIdx = this.findTappedCellIndex(gesture.x, gesture.y, totalCells);
    if (paletteItem && cellIdx !== null) {
      const pSlot =
        this.slots[totalCells + this.content.palette.indexOf(paletteItem)];
      const cSlot = this.slots[cellIdx];
      const distP = pSlot
        ? Math.hypot(gesture.x - pSlot.x, gesture.y - pSlot.y)
        : Number.POSITIVE_INFINITY;
      const distC = cSlot
        ? Math.hypot(gesture.x - cSlot.x, gesture.y - cSlot.y)
        : Number.POSITIVE_INFINITY;
      if (distP <= distC) {
        return {
          type: "select_color",
          data: { color_id: paletteItem.color_id },
        };
      }
    } else if (paletteItem) {
      return { type: "select_color", data: { color_id: paletteItem.color_id } };
    }
    if (cellIdx === null || this.activeInitialCells[cellIdx] !== null) {
      return null;
    }
    if (this.placedCells[cellIdx] === this.selectedColorId) {
      return { type: "remove_yarn", data: { cell_index: cellIdx } };
    }
    return this.selectedColorId
      ? {
          type: "place_yarn",
          data: { cell_index: cellIdx, color_id: this.selectedColorId },
        }
      : null;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (!this.isAcceptingInput()) {
      return null;
    }
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    if (gesture.type === "drop") {
      return this.toDropAction(gesture, totalCells);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture, totalCells);
    }
    return null;
  }

  override getView(): EngineView {
    return buildGT033View({
      content: this.content,
      placedCells: this.placedCells,
      selectedColorId: this.selectedColorId,
      slots: this.slots,
      hoveredEntityId: peekGT033Clock(this)?.hoveredEntityId ?? null,
      brokenRowIndex: this.brokenRowIndex,
      brokenColIndex: this.brokenColIndex,
      isWin: this.isWin,
    });
  }

  private verifyGridSolved(): boolean {
    return isWeaveBoardComplete(
      this.content.grid.rows,
      this.content.grid.cols,
      this.placedCells,
      this.content.palette.map((p) => p.color_id)
    );
  }

  override checkWinCondition(): boolean {
    return this.isWin || this.isWon || this.verifyGridSolved();
  }

  getSelectedColorId(): string | null {
    return this.selectedColorId;
  }

  getPlacedCells(): readonly (string | null)[] {
    return this.placedCells;
  }

  getExpectedColorAt(cellIndex: number): string | null {
    return (
      this.inferredSolution?.[cellIndex] ??
      this.content.solution?.[cellIndex] ??
      null
    );
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    renderGT033Frame(ctx, rs, timeMs, {
      clockKey: this,
      content: this.content,
      initialCells: this.activeInitialCells,
      placedCells: this.placedCells,
      expectedCells: this.expectedSolutionCells(),
      slots: this.slots,
      stageRect: this.stageRect,
      trayRect: this.trayRect,
      themeId: this.themeId,
      selectedColorId: this.selectedColorId,
      selectedCellIndex: this.selectedCellIndex,
      brokenRowIndex: this.brokenRowIndex,
      brokenColIndex: this.brokenColIndex,
      isWin: this.isWin,
      roundClosed: this.roundClosed,
      particlesEnabled: this.degradation?.particles_enabled !== false,
      thread: this.getYarnThread(rs.reducedMotion),
    });
  }
}
