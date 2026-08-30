import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import {
  type ConstraintViolation,
  findConstraintViolations,
  isSudokuCompleteAndValid,
  type SudokuCell,
  type SudokuGrid,
} from "#src/systems/constraint-system";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawEmptyTargetSlot,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  updateParticles,
} from "../shared-render.js";
import type { GT015Content, GT015Difficulty } from "./template.js";

export interface SudokuCellState {
  readonly row: number;
  readonly col: number;
  readonly value: string | null;
  readonly isInitial: boolean;
}

function extractFillCellData(
  data: unknown
): { row: number; col: number; symbol_id: string } | null {
  if (
    typeof data === "object" &&
    data !== null &&
    "row" in data &&
    "col" in data &&
    "symbol_id" in data
  ) {
    const r = Reflect.get(data, "row");
    const c = Reflect.get(data, "col");
    const s = Reflect.get(data, "symbol_id");
    if (
      typeof r === "number" &&
      typeof c === "number" &&
      typeof s === "string"
    ) {
      return { row: r, col: c, symbol_id: s };
    }
  }
  return null;
}

export class SudokuMiniSession extends TemplateGameSession<
  GT015Content,
  GT015Difficulty
> {
  slots: readonly Slot[] = [];
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private readonly cellStates: Map<string, SudokuCellState> = new Map();
  private selectedSymbolId: string | null = null;
  private activeViolations: readonly ConstraintViolation[] = [];

  setupEntities(): void {
    this.cellStates.clear();
    this.activeViolations = [];
    this.selectedSymbolId = null;
    this.isWon = false;

    for (const c of this.content.cells) {
      const key = `${c.row},${c.col}`;
      this.cellStates.set(key, {
        row: c.row,
        col: c.col,
        value: c.symbol_id,
        isInitial: c.symbol_id !== null,
      });
    }

    this.recordEvent("game_started", {
      template_code: "GT-015",
      grid_size: this.content.grid_size,
    });
  }

  getGridSize(): number {
    return this.content.grid_size;
  }

  getSymbols(): GT015Content["symbols"] {
    return this.content.symbols;
  }

  getCellState(row: number, col: number): SudokuCellState | undefined {
    return this.cellStates.get(`${row},${col}`);
  }

  getAllCellStates(): readonly SudokuCellState[] {
    return Array.from(this.cellStates.values());
  }

  getSelectedSymbolId(): string | null {
    return this.selectedSymbolId;
  }

  selectSymbol(symbolId: string | null): void {
    this.selectedSymbolId = symbolId;
  }

  getViolations(): readonly ConstraintViolation[] {
    return this.activeViolations;
  }

  isConflicted(row: number, col: number): boolean {
    return this.activeViolations.some((v) => v.row === row && v.col === col);
  }

  fillCell(row: number, col: number, symbolId: string | null): boolean {
    const key = `${row},${col}`;
    const state = this.cellStates.get(key);
    if (!state) {
      return false;
    }

    if (state.isInitial) {
      return false;
    }

    this.cellStates.set(key, {
      ...state,
      value: symbolId,
    });

    const grid = this.getCurrentGrid();
    this.activeViolations = findConstraintViolations(grid);

    if (symbolId !== null) {
      const hasConflict = this.isConflicted(row, col);
      this.recordEvent("cell_filled", {
        row,
        col,
        symbol_id: symbolId,
        is_valid: !hasConflict,
      });

      if (hasConflict) {
        this.recordEvent("constraint_violated", {
          row,
          col,
          symbol_id: symbolId,
        });
      }
    }

    if (this.checkWinCondition()) {
      this.winSession();
    }

    return true;
  }

  clearCell(row: number, col: number): boolean {
    return this.fillCell(row, col, null);
  }

  getCurrentGrid(): SudokuGrid<string> {
    const cells: SudokuCell<string>[] = [];
    for (const state of this.cellStates.values()) {
      cells.push({
        row: state.row,
        col: state.col,
        value: state.value,
      });
    }
    return {
      size: this.content.grid_size,
      regions: this.content.regions,
      cells,
    };
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "fill_cell") {
      const payload = extractFillCellData(action.data);
      if (!payload) {
        return ACTION_RETRY;
      }
      this.fillCell(payload.row, payload.col, payload.symbol_id);
      return this.isConflicted(payload.row, payload.col)
        ? ACTION_RETRY
        : ACTION_CORRECT;
    }
    return ACTION_IGNORED;
  }

  override checkWinCondition(): boolean {
    return isSudokuCompleteAndValid(this.getCurrentGrid());
  }

  override destroy(): void {
    super.destroy();
    this.cellStates.clear();
    this.activeViolations = [];
    this.selectedSymbolId = null;
  }

  resolveSlots(ageBand: "3-4" | "4-5" | "5-6"): void {
    const layoutFn = resolveLayout("matrix-slot-grid");
    this.slots = layoutFn({
      slotCount: this.content.symbols.length,
      targetCount: this.content.grid_size,
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
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);
    const cellCount = this.content.grid_size * this.content.grid_size;
    const cellSlots = this.slots.slice(0, cellCount);
    const paletteSlots = this.slots.slice(cellCount);
    const size = this.content.grid_size;
    const assetOf = (symbolId: string) =>
      this.content.symbols.find((s) => s.symbol_id === symbolId)?.asset;
    // Một vi phạm nêu cả ô sai lẫn ô xung đột — tô đỏ cả hai thì trẻ thấy
    // ĐƯỢC quan hệ, thay vì chỉ thấy một ô bị chê.
    const violated = new Set(
      this.activeViolations.flatMap((v) => [
        `${v.row},${v.col}`,
        `${v.conflictingWith.row},${v.conflictingWith.col}`,
      ])
    );

    for (const cell of this.content.cells) {
      const slot = cellSlots[cell.row * size + cell.col];
      if (!slot) {
        continue;
      }
      const filled = this.cellStates.get(`${cell.row},${cell.col}`);
      const symbolId = filled?.value ?? cell.symbol_id;
      if (!symbolId) {
        drawEmptyTargetSlot(ctx, slot);
        continue;
      }
      let state: "wrong" | "locked" | "correct" = "correct";
      if (violated.has(`${cell.row},${cell.col}`)) {
        state = "wrong";
      } else if (cell.symbol_id) {
        state = "locked";
      }
      drawSlotItem(
        ctx,
        rs,
        slot,
        { id: `${cell.row},${cell.col}`, asset: assetOf(symbolId), state },
        "square"
      );
    }

    this.content.symbols.forEach((sym, i) => {
      const slot = paletteSlots[i];
      if (!slot) {
        return;
      }
      drawSlotItem(ctx, rs, slot, {
        id: sym.symbol_id,
        asset: sym.asset,
        state: this.selectedSymbolId === sym.symbol_id ? "selected" : "idle",
      });
    });
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

export const GT015Session = SudokuMiniSession;
export default SudokuMiniSession;
