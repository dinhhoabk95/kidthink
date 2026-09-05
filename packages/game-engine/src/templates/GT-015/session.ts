import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import {
  drawEmptyTargetSlot,
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  type ItemVisualState,
  updateParticles,
} from "#src/render/index.js";
import {
  type ConstraintViolation,
  findConstraintViolations,
  isSudokuCompleteAndValid,
  type SudokuCell,
  type SudokuGrid,
} from "#src/systems/constraint-system";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
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

function isPointInSlot(slot: Slot, x: number, y: number): boolean {
  const hw = (slot.hitW ?? slot.w) / 2;
  const hh = (slot.hitH ?? slot.h) / 2;
  return (
    x >= slot.x - hw && x <= slot.x + hw && y >= slot.y - hh && y <= slot.y + hh
  );
}

function findHitPaletteIndex(
  slots: readonly Slot[],
  cellCount: number,
  symbolCount: number,
  x: number,
  y: number
): number {
  for (let i = 0; i < symbolCount; i++) {
    const slot = slots[cellCount + i];
    if (slot && isPointInSlot(slot, x, y)) {
      return i;
    }
  }
  return -1;
}

function findHitCellCoords(
  slots: readonly Slot[],
  size: number,
  x: number,
  y: number
): { row: number; col: number } | null {
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const slot = slots[r * size + c];
      if (slot && isPointInSlot(slot, x, y)) {
        return { row: r, col: c };
      }
    }
  }
  return null;
}

function resolveDropSymbolId(
  gesture: Extract<Gesture, { type: "drop" }>,
  selectedSymbolId: string | null,
  slots: readonly Slot[],
  cellCount: number,
  symbols: readonly { symbol_id: string }[]
): string | null {
  if (selectedSymbolId) {
    return selectedSymbolId;
  }
  const paletteIndex = findHitPaletteIndex(
    slots,
    cellCount,
    symbols.length,
    gesture.fromX,
    gesture.fromY
  );
  if (paletteIndex >= 0) {
    return symbols[paletteIndex]?.symbol_id ?? null;
  }
  return null;
}

function resolveCellVisualState(
  isWrong: boolean,
  hasValue: boolean
): EntityVisual {
  if (isWrong) {
    return "incorrect";
  }
  if (hasValue) {
    return "correct";
  }
  return "idle";
}

export class SudokuMiniSession extends TemplateGameSession<
  GT015Content,
  GT015Difficulty
> {
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

  private getSimulatedGrid(
    targetRow: number,
    targetCol: number,
    targetSymbolId: string | null
  ): SudokuGrid<string> {
    const cells: SudokuCell<string>[] = [];
    for (const state of this.cellStates.values()) {
      cells.push({
        row: state.row,
        col: state.col,
        value:
          state.row === targetRow && state.col === targetCol
            ? targetSymbolId
            : state.value,
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
      const state = this.cellStates.get(`${payload.row},${payload.col}`);
      if (!state || state.isInitial) {
        return ACTION_IGNORED;
      }
      const simGrid = this.getSimulatedGrid(
        payload.row,
        payload.col,
        payload.symbol_id
      );
      const violations = findConstraintViolations(simGrid);
      const hasConflict = violations.some(
        (v) => v.row === payload.row && v.col === payload.col
      );
      return hasConflict ? ACTION_RETRY : ACTION_CORRECT;
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

  getStagedItemId(): string | null {
    return this.selectedSymbolId;
  }

  override commit(action: GameAction): void {
    if (action.type === "fill_cell") {
      const payload = extractFillCellData(action.data);
      if (payload) {
        this.fillCell(payload.row, payload.col, payload.symbol_id);
        this.selectedSymbolId = null;
      }
    }
  }

  override toAction(gesture: Gesture): GameAction | null {
    const cellCount = this.content.grid_size * this.content.grid_size;
    if (gesture.type === "drop") {
      return this.toDropAction(gesture, cellCount);
    }
    if (gesture.type === "tap") {
      return this.toTapAction(gesture, cellCount);
    }
    return null;
  }

  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>,
    cellCount: number
  ): GameAction | null {
    const symbolId = resolveDropSymbolId(
      gesture,
      this.selectedSymbolId,
      this.slots,
      cellCount,
      this.content.symbols
    );
    if (!symbolId) {
      return null;
    }
    const targetCell = findHitCellCoords(
      this.slots,
      this.content.grid_size,
      gesture.toX,
      gesture.toY
    );
    if (!targetCell) {
      return null;
    }
    const state = this.cellStates.get(`${targetCell.row},${targetCell.col}`);
    if (!state || state.isInitial) {
      return null;
    }
    return {
      type: "fill_cell",
      data: {
        row: targetCell.row,
        col: targetCell.col,
        symbol_id: symbolId,
      },
    };
  }

  private toTapAction(
    gesture: Extract<Gesture, { type: "tap" }>,
    cellCount: number
  ): GameAction | null {
    const paletteIndex = findHitPaletteIndex(
      this.slots,
      cellCount,
      this.content.symbols.length,
      gesture.x,
      gesture.y
    );
    if (paletteIndex >= 0) {
      const sym = this.content.symbols[paletteIndex];
      this.selectedSymbolId = sym?.symbol_id ?? null;
      return null;
    }

    if (!this.selectedSymbolId) {
      return null;
    }

    const targetCell = findHitCellCoords(
      this.slots,
      this.content.grid_size,
      gesture.x,
      gesture.y
    );
    if (!targetCell) {
      return null;
    }
    const state = this.cellStates.get(`${targetCell.row},${targetCell.col}`);
    if (!state || state.isInitial) {
      return null;
    }
    return {
      type: "fill_cell",
      data: {
        row: targetCell.row,
        col: targetCell.col,
        symbol_id: this.selectedSymbolId,
      },
    };
  }

  override getView(): EngineView {
    const cellCount = this.content.grid_size * this.content.grid_size;
    const cellSlots = this.slots.slice(0, cellCount);
    const paletteSlots = this.slots.slice(cellCount);
    const size = this.content.grid_size;
    const entities: ViewEntity[] = [];

    this.content.symbols.forEach((sym, i) => {
      const slot = paletteSlots[i];
      if (slot) {
        entities.push({
          id: sym.symbol_id,
          slotIndex: cellCount + i,
          role: "source",
          state: this.selectedSymbolId === sym.symbol_id ? "selected" : "idle",
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
        });
      }
    });

    for (const cell of this.content.cells) {
      const slotIndex = cell.row * size + cell.col;
      const slot = cellSlots[slotIndex];
      if (slot) {
        const state = this.cellStates.get(`${cell.row},${cell.col}`);
        const isWrong = this.isConflicted(cell.row, cell.col);
        const entityState = resolveCellVisualState(
          isWrong,
          Boolean(state?.value)
        );
        entities.push({
          id: `cell-${cell.row}-${cell.col}`,
          slotIndex,
          role: "target",
          state: entityState,
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
        });
      }
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("matrix-slot-grid");
    return layoutFn({
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
