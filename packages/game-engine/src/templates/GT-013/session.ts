import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
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

import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import {
  boxFromSlots,
  drawMazeBoard,
  drawPromptText,
  drawRequiredCells,
  drawSceneBackground,
  type ItemVisualState,
  updateParticles,
} from "#src/render/index.js";
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
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type { GT013Content, GT013Difficulty } from "./template.js";

export interface MazeScaffoldHint {
  /** Ô mà gợi ý vẽ tới, tính từ đầu nét vẽ hiện tại. */
  readonly cells: readonly MazeCell[];
  readonly ghost_hand: boolean;
  readonly slow_repeat: boolean;
}

function extractMazeCell(data: unknown): MazeCell | null {
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

function extractMazeSide(data: unknown): MazeSide | null {
  if (typeof data === "object" && data !== null && "side" in data) {
    const s = Reflect.get(data, "side");
    if (s === "n" || s === "e" || s === "s" || s === "w") {
      return s;
    }
  }
  return null;
}

/**
 * `GT-013` — tìm đường mê cung.
 */
export class GT013Session extends TemplateGameSession<
  GT013Content,
  GT013Difficulty
> {
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private readonly ordering = new OrderingMechanic();
  private tracker: MazePathTracker = new MazePathTracker(this.content.grid);

  setupEntities(): void {
    this.tracker = new MazePathTracker(this.content.grid);
    this.syncSequence();
    this.isWon = false;
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
      this.recordEvent("path_step", {
        row: cell.row,
        col: cell.col,
        step_index: this.tracker.getPath().length - 1,
      });
    }
    if (result.status === "blocked") {
      this.recordEvent("path_blocked", {
        row: cell.row,
        col: cell.col,
        reason: result.blocked_reason,
        retreated: result.retreated_to !== undefined,
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
    const cell = this.actionCell(action);
    if (!cell) {
      return ACTION_IGNORED;
    }
    return this.isLegalStep(cell) ? ACTION_CORRECT : ACTION_IGNORED;
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type !== "tap") {
      return null;
    }
    const { rows, cols } = this.content.grid;
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (!slot) {
        continue;
      }
      const dx = Math.abs(gesture.x - slot.x);
      const dy = Math.abs(gesture.y - slot.y);
      const radius = Math.max(slot.hitW ?? slot.w, slot.hitH ?? slot.h) / 2;
      if (dx <= radius && dy <= radius) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        if (r < rows && c < cols) {
          return {
            type: "tap_cell",
            data: { row: r, col: c },
          };
        }
      }
    }
    return null;
  }

  override commit(action: GameAction): void {
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

      entities.push({
        id: `cell_${r}_${c}`,
        slotIndex: i,
        role,
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
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

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("grid");
    return layoutFn({
      slotCount: this.content.grid.rows * this.content.grid.cols,
      targetCount: this.content.grid.cols,
      ageBand,
    });
  }

  setRenderItemState(itemId: string, state: ItemVisualState): void {
    this.renderItemStates.set(itemId, state);
  }

  getRenderItemState(itemId: string): ItemVisualState {
    return this.renderItemStates.get(itemId) ?? "idle";
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    drawPromptText(ctx, rs, this.content.prompt);
    const box = boxFromSlots(this.slots);
    if (!box) {
      this.drawRenderFeedback(rs, ctx);
      return;
    }
    drawMazeBoard(ctx, this.content.grid, box, this.tracker.getPath());
    drawRequiredCells(ctx, this.content.grid, box, this.content.required_cells);
    this.drawRenderFeedback(rs, ctx);
  }

  private drawRenderFeedback(
    rs: RenderSystem,
    ctx: CanvasRenderingContext2D
  ): void {
    if (this.degradation?.particles_enabled === false) {
      return;
    }
    this.renderParticles = updateParticles(this.renderParticles);
    rs.drawParticles(ctx, this.renderParticles);
  }
}

export default GT013Session;
