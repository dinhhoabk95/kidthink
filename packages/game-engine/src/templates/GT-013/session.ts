import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session.js";
import { OrderingMechanic } from "../../mechanics/ordering-mechanic.js";
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
} from "../../systems/maze-system.js";
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
}

export default GT013Session;
