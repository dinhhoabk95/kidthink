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
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveExactGridLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";

function toCellRole(
  isGoal: boolean,
  isRequired: boolean,
  isStart: boolean
): ViewEntity["role"] {
  if (isGoal || isRequired) {
    return "target";
  }
  if (isStart) {
    return "source";
  }
  return "neutral";
}

function toCellSpokenLabel(
  row: number,
  col: number,
  isStart: boolean,
  isGoal: boolean,
  isRequired: boolean
): string {
  const pos = `Hàng ${row + 1} cột ${col + 1}`;
  if (isStart) {
    return `Ô xuất phát, ${pos}`;
  }
  if (isGoal) {
    return `Ô đích, ${pos}`;
  }
  if (isRequired) {
    return `Ô phải đi qua, ${pos}`;
  }
  return pos;
}

import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import {
  boxFromSlots,
  drawMazeBoard,
  drawMazeFootprints,
  drawMazeGoalFlag,
  drawRequiredCells,
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
  isJunction,
  type MazeCell,
  type MazeGrid,
  MazePathTracker,
  type MazeSide,
  type MazeStepResult,
} from "#src/systems/maze-system";
import { MoodPulse } from "#src/systems/mood-pulse";
import type { RenderSystem } from "#src/systems/render-system";
import type { GT013Content, GT013Difficulty } from "./template.js";

interface MazeScaffoldHint {
  /** Ô mà gợi ý vẽ tới, tính từ đầu nét vẽ hiện tại. */
  readonly cells: readonly MazeCell[];
  readonly ghost_hand: boolean;
  readonly slow_repeat: boolean;
}

function extractMazeCell(data: GameActionValue): MazeCell | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "row" in data &&
    "col" in data
  ) {
    const r = Reflect.get(data, "row");
    const c = Reflect.get(data, "col");
    if (typeof r === "number" && typeof c === "number") {
      return { row: r, col: c };
    }
  }
  return null;
}

function extractMazeSide(data: GameActionValue): MazeSide | null {
  if (typeof data === "object" && data !== null && "side" in data) {
    const s = Reflect.get(data, "side");
    if (s === "n" || s === "e" || s === "s" || s === "w") {
      return s;
    }
  }
  return null;
}

function extractMazeCells(data: GameActionValue): MazeCell[] {
  if (typeof data === "object" && data !== null && "cells" in data) {
    const raw = Reflect.get(data, "cells");
    if (Array.isArray(raw)) {
      const result: MazeCell[] = [];
      for (const item of raw) {
        const cell = extractMazeCell(item);
        if (cell) {
          result.push(cell);
        }
      }
      return result;
    }
  }
  return [];
}

function neighborSide(from: MazeCell, to: MazeCell): MazeSide | null {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  if (dr === -1 && dc === 0) {
    return "n";
  }
  if (dr === 1 && dc === 0) {
    return "s";
  }
  if (dr === 0 && dc === 1) {
    return "e";
  }
  if (dr === 0 && dc === -1) {
    return "w";
  }
  return null;
}

const ARROW_GLYPHS: Record<MazeSide, string> = {
  n: "⬆️",
  e: "➡️",
  s: "⬇️",
  w: "⬅️",
};

/**
 * `GT-013` — tìm đường mê cung.
 */
/** Khung chuyện đọc một lần ở vòng đầu (`BR-E013-07`, `BR-FBK-16`). */
export const GT013_STORY_LINE =
  "Chuột Nhắt đi tìm đường về nhà. Bé dẫn Chuột đi, gặp tường thì thử lối khác nhé!";

/** Mascot nhún vai sau khi đụng tường (`BR-E013-07`). */
export const GT013_SHRUG_MS = 1200;

export class GT013Session extends TemplateGameSession<
  GT013Content,
  GT013Difficulty
> {
  override readonly usesPromptZone = true;
  degradation: DegradationState | null = null;

  private readonly ordering = new OrderingMechanic();
  private tracker: MazePathTracker = new MazePathTracker(this.content.grid);
  private blockedCell: MazeCell | null = null;
  private blockedTimestamp = 0;
  private lastFrameMs = 0;
  private readonly mood = new MoodPulse();

  setupEntities(): void {
    this.tracker = new MazePathTracker(this.content.grid);
    this.syncSequence();
    this.blockedCell = null;
    this.blockedTimestamp = 0;
    this.mood.clear();
    this.lastFrameMs = 0;
    this.isWon = false;
  }

  override storyLine(): string {
    return GT013_STORY_LINE;
  }

  /** Chuột nhún vai sau khi đụng tường (`BR-E013-07`). */
  override mascotMood(): MascotPose | null {
    return this.isWon ? null : this.mood.current();
  }

  update(deltaMs: number): void {
    this.mood.tick(deltaMs);
    this.lastFrameMs += deltaMs;
    if (this.blockedCell && this.lastFrameMs - this.blockedTimestamp >= 400) {
      this.blockedCell = null;
      this.blockedTimestamp = 0;
    }
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

  onPathStep(cell: MazeCell): MazeStepResult {
    const result = this.tracker.step(cell);
    this.syncSequence();
    if (result.status === "moved") {
      // Tiếng chân như nhau ở mọi nẻo: không lộ lối đúng (`BR-E013-07`).
      this.queueSfx("mouse_step");
      this.recordEvent("path_step", {
        row: cell.row,
        col: cell.col,
        step_index: this.tracker.getPath().length - 1,
      });
    }
    if (result.status === "blocked") {
      this.queueSfx("wall_boing");
      this.mood.set("wonder", GT013_SHRUG_MS);
      this.blockedCell = cell;
      this.blockedTimestamp = this.lastFrameMs;
      this.recordEvent("path_blocked", {
        row: cell.row,
        col: cell.col,
        reason: result.blocked_reason,
        // Engine không lùi hộ trẻ (BR-E013-04); trường giữ cho khớp lược đồ event.
        retreated: false,
      });
    }
    return result;
  }

  onArrowPressed(side: MazeSide): MazeStepResult {
    return this.onPathStep(cellTowards(this.tracker.getHead(), side));
  }

  onPathSubmitted(): boolean {
    const isCorrect = this.checkWinCondition();
    this.recordEvent("path_submitted", {
      is_correct: isCorrect,
      step_count: this.tracker.getPath().length - 1,
    });
    if (isCorrect) {
      this.winSession();
    }
    return isCorrect;
  }

  getScaffoldHint(level: 1 | 2 | 3): MazeScaffoldHint | null {
    const ahead = this.remainingRoute();
    if (ahead.length === 0) {
      return null;
    }
    return {
      cells: this.hintCells(ahead, level),
      ghost_hand: level >= 2,
      slow_repeat: level === 3,
    };
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "submit_path") {
      return this.checkWinCondition() ? ACTION_CORRECT : ACTION_RETRY;
    }
    if (action.type === "stroke_path") {
      const cells = extractMazeCells(action.data);
      const first = cells[0];
      if (!first) {
        return ACTION_IGNORED;
      }
      return this.isLegalStep(first) ? ACTION_CORRECT : ACTION_IGNORED;
    }
    const cell = this.actionCell(action);
    if (!cell) {
      return ACTION_IGNORED;
    }
    return this.isLegalStep(cell) ? ACTION_CORRECT : ACTION_IGNORED;
  }

  private isInsideStage(x: number, y: number): boolean {
    if (!this.stageRect) {
      return true;
    }
    const s = this.stageRect;
    return x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h;
  }

  private slotIndexToCell(i: number): MazeCell | null {
    const { rows, cols } = this.content.grid;
    const r = Math.floor(i / cols);
    const c = i % cols;
    return r < rows && c < cols ? { row: r, col: c } : null;
  }

  private findHitCell(x: number, y: number): MazeCell | null {
    if (!this.isInsideStage(x, y)) {
      return null;
    }
    const idx = findHitSlotIndex(this.slots, x, y, "square", TAP_TOLERANCE_PX);
    return idx >= 0 ? this.slotIndexToCell(idx) : null;
  }

  private toStrokeAction(
    gesture: Extract<Gesture, { type: "stroke" }>
  ): GameAction | null {
    const firstPt = gesture.points[0];
    if (!(firstPt && this.isInsideStage(firstPt.x, firstPt.y))) {
      return null;
    }

    const head = this.tracker.getHead();
    const cells: MazeCell[] = [];
    for (const pt of gesture.points) {
      const cell = this.findHitCell(pt.x, pt.y);
      if (!cell) {
        continue;
      }
      const prev = cells.at(-1) ?? head;
      if (cell.row === prev.row && cell.col === prev.col) {
        continue;
      }
      cells.push(cell);
    }

    if (cells.length === 0) {
      return null;
    }
    if (cells.length === 1) {
      return { type: "draw_step", data: cells[0] };
    }
    return { type: "stroke_path", data: { cells } };
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const endCell = this.findHitCell(gesture.toX, gesture.toY);
    if (endCell && this.isLegalStep(endCell)) {
      return { type: "draw_step", data: endCell };
    }
    const steps = 8;
    const points = Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      return {
        x: gesture.fromX + (gesture.toX - gesture.fromX) * t,
        y: gesture.fromY + (gesture.toY - gesture.fromY) * t,
      };
    });
    return this.toStrokeAction({
      type: "stroke",
      points,
      timeMs: gesture.timeMs,
    });
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "stroke") {
      return this.toStrokeAction(gesture);
    }
    if (gesture.type === "drop") {
      return this.toDropAction(gesture);
    }
    if (gesture.type !== "tap") {
      return null;
    }
    const cell = this.findHitCell(gesture.x, gesture.y);
    if (!cell) {
      return null;
    }
    if (this.content.input_mode === "arrows") {
      const side = neighborSide(this.tracker.getHead(), cell);
      if (side) {
        return {
          type: "move_arrow",
          data: { side },
        };
      }
    }
    return {
      type: "tap_cell",
      data: cell,
    };
  }

  override getHintTargetIndex(): number | null {
    if (this.checkWinCondition() || this.isWon) {
      return null;
    }
    const nextCell = this.remainingRoute()[0] ?? this.content.grid.goal;
    const idx = nextCell.row * this.content.grid.cols + nextCell.col;
    return idx >= 0 && idx < this.slots.length ? idx : null;
  }

  override commit(action: GameAction): void {
    if (action.type === "stroke_path") {
      const cells = extractMazeCells(action.data);
      for (const cell of cells) {
        const res = this.onPathStep(cell);
        if (res.status === "blocked") {
          break;
        }
        if (this.checkWinCondition()) {
          this.onPathSubmitted();
          break;
        }
      }
      return;
    }
    const cell = this.actionCell(action);
    if (cell) {
      this.onPathStep(cell);
      if (this.checkWinCondition()) {
        this.onPathSubmitted();
      }
    } else if (action.type === "submit_path") {
      this.onPathSubmitted();
    }
  }

  override getView(): EngineView {
    const { rows, cols, start, goal } = this.content.grid;
    const entities: ViewEntity[] = [];
    const pathKeys = new Set(this.tracker.getPath().map(cellKey));
    const head = this.tracker.getHead();

    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot) {
        continue;
      }
      const r = Math.floor(i / cols);
      const c = i % cols;
      if (r >= rows || c >= cols) {
        continue;
      }
      const isStart = r === start.row && c === start.col;
      const isGoal = r === goal.row && c === goal.col;
      const isRequired = this.content.required_cells.some(
        (rc) => rc.row === r && rc.col === c
      );
      const isInPath = pathKeys.has(cellKey({ row: r, col: c }));
      const role = toCellRole(isGoal, isRequired, isStart);
      const state: ViewEntity["state"] = isInPath ? "active" : "idle";
      const side =
        this.content.input_mode === "arrows"
          ? neighborSide(head, { row: r, col: c })
          : null;

      entities.push({
        id: `cell_${r}_${c}`,
        slotIndex: i,
        role,
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        hitShape: "square",
        spokenLabel: toCellSpokenLabel(r, c, isStart, isGoal, isRequired),
        ...(side ? { glyph: ARROW_GLYPHS[side] } : {}),
      });
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  override checkWinCondition(): boolean {
    return this.tracker.isComplete(this.content.required_cells);
  }

  private get grid(): MazeGrid {
    return this.content.grid;
  }

  private syncSequence(): void {
    this.ordering.setInitialSequence(this.tracker.getPath().map(cellKey));
  }

  private actionCell(action: GameAction): MazeCell | null {
    if (action.type === "draw_step" || action.type === "tap_cell") {
      return extractMazeCell(action.data);
    }
    if (action.type === "move_arrow") {
      const side = extractMazeSide(action.data);
      return side ? cellTowards(this.tracker.getHead(), side) : null;
    }
    return null;
  }

  private isLegalStep(cell: MazeCell): boolean {
    const current = this.tracker.getHead();
    return canMove(this.grid, current, cell);
  }

  private remainingRoute(): MazeCell[] {
    const current = this.tracker.getHead();
    const visitedKeys = new Set(this.tracker.getPath().map(cellKey));
    const unvisited = this.content.required_cells.filter(
      (rc) => !visitedKeys.has(cellKey(rc))
    );
    const full = findRouteThrough(this.grid, unvisited, current);
    const previous = this.tracker.getPath().at(-2);
    const first = full?.[1];
    if (previous && first && cellKey(first) === cellKey(previous)) {
      // Bước về ô vừa đi là lùi, xoá ô đó khỏi nét vẽ (BR-E013-02): nếu còn
      // đường khác thì chỉ đường đó, không dẫn trẻ vào vòng lặp tiến-lùi.
      const side = neighborSide(current, previous);
      if (side) {
        const detour = findRouteThrough(
          { ...this.grid, walls: [...this.grid.walls, { ...current, side }] },
          unvisited,
          current
        );
        if (detour && detour.length > 1) {
          return detour.slice(1);
        }
      }
    }
    return full && full.length > 1 ? full.slice(1) : [];
  }

  private hintCells(ahead: readonly MazeCell[], level: 1 | 2 | 3): MazeCell[] {
    if (level === 1) {
      return ahead.slice(0, 1);
    }
    if (level === 2) {
      return ahead.slice(0, Math.min(2, ahead.length));
    }
    let count = 0;
    while (count < ahead.length) {
      const cell = ahead[count];
      if (cell && isJunction(this.grid, cell)) {
        return ahead.slice(0, count + 1);
      }
      count++;
    }
    return [...ahead];
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const { rows, cols } = this.content.grid;
    return resolveExactGridLayout(
      cols,
      rows
    )({
      slotCount: rows * cols,
      ageBand,
      logic: this.logicSpace,
      stage: this.stageRect,
      cssPerLogic: this.cssPerLogic,
    });
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    if (this.blockedCell && timeMs - this.blockedTimestamp >= 400) {
      this.blockedCell = null;
      this.blockedTimestamp = 0;
    }
    drawSceneBackground(ctx, rs, this.themeId);
    // Chuột Nhắt ở góc trống, ngoài vùng chạm (`BR-E013-09`).
    drawStoryCharacterInStage(ctx, "mouse", this.stageRect, this.slots);
    const box = boxFromSlots(this.slots);
    if (!box) {
      return;
    }
    drawMazeBoard(ctx, this.content.grid, box, this.tracker.getPath());
    drawMazeGoalFlag(ctx, this.content.grid, box);
    drawMazeFootprints(ctx, this.content.grid, box, this.tracker.getPath());
    drawRequiredCells(ctx, this.content.grid, box, this.content.required_cells);

    if (this.blockedCell) {
      const idx =
        this.blockedCell.row * this.content.grid.cols + this.blockedCell.col;
      const slot = this.slots[idx];
      const elapsed = timeMs - this.blockedTimestamp;
      if (slot && elapsed < 400) {
        rs.drawRetryRing(
          ctx,
          slot.x,
          slot.y,
          Math.min(slot.hitW, slot.hitH) / 2 + 4,
          elapsed / 400
        );
      }
    }
  }
}
