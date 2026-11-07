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
import type {
  EngineView,
  EntityVisual,
  Gesture,
  ViewEntity,
} from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { resolveTouchFloor } from "#src/layout/constants";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import { computeTraySourceSlots, pickTrayZones } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawEmptyTargetSlot,
  drawMontessoriControlOfErrorPill,
  drawSceneBackground,
  drawSlotItem,
  drawSudokuBoardFrame,
  drawWoodenTokenDock,
  sceneBox,
} from "#src/render/index.js";
import {
  type ConstraintViolation,
  countSudokuSolutions,
  findConstraintViolations,
  isSudokuCompleteAndValid,
  type SudokuCell,
  type SudokuGrid,
} from "#src/systems/constraint-system";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import type { RenderSystem } from "#src/systems/render-system";
import { WrongFlash } from "#src/systems/wrong-flash";
import type { GT015Content, GT015Difficulty } from "./template.js";

/** Cạnh ô lưới lớn nhất trên sân khấu — cùng cỡ ô của `matrix-slot-grid`. */
const GRID_CELL_MAX_PX = 96;

interface SudokuCellState {
  readonly row: number;
  readonly col: number;
  readonly value: string | null;
  readonly isInitial: boolean;
}

function extractFillCellData(
  data: GameActionValue
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

/** Lưới tràn sân khấu thì hàng cuối chồng lên khay; chọn theo tâm gần nhất. */
function findHitPaletteIndex(
  slots: readonly Slot[],
  cellCount: number,
  symbolCount: number,
  x: number,
  y: number
): number {
  return findHitSlotIndex(
    slots.slice(cellCount, cellCount + symbolCount),
    x,
    y,
    "circle",
    TAP_TOLERANCE_PX
  );
}

function findHitCellIndex(
  slots: readonly Slot[],
  cellCount: number,
  x: number,
  y: number
): number {
  return findHitSlotIndex(
    slots.slice(0, cellCount),
    x,
    y,
    "square",
    TAP_TOLERANCE_PX
  );
}

function findHitCellCoords(
  slots: readonly Slot[],
  size: number,
  x: number,
  y: number
): { row: number; col: number } | null {
  const index = findHitCellIndex(slots, size * size, x, y);
  return index >= 0
    ? { row: Math.floor(index / size), col: index % size }
    : null;
}

function resolveTapSlotIndex(
  slots: readonly Slot[],
  cellCount: number,
  symbolCount: number,
  x: number,
  y: number
): number {
  const cellIdx = findHitCellIndex(slots, cellCount, x, y);
  const palOffset = findHitPaletteIndex(slots, cellCount, symbolCount, x, y);
  const palIdx = palOffset >= 0 ? cellCount + palOffset : -1;
  if (cellIdx >= 0 && palIdx >= 0) {
    const cellSlot = slots[cellIdx];
    const palSlot = slots[palIdx];
    if (cellSlot && palSlot) {
      const cellDist = Math.hypot(x - cellSlot.x, y - cellSlot.y);
      const palDist = Math.hypot(x - palSlot.x, y - palSlot.y);
      return palDist < cellDist ? palIdx : cellIdx;
    }
  }
  return palIdx >= 0 ? palIdx : cellIdx;
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

  private readonly cellStates: Map<string, SudokuCellState> = new Map();
  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });

  override takePillNarration(): string | null {
    return this.exploreTracker.takePillNarration();
  }
  private symbolById = new Map<string, GT015Content["symbols"][number]>();
  private selectedSymbolId: string | null = null;
  private activeViolations: readonly ConstraintViolation[] = [];
  private readonly wrongFlash = new WrongFlash();
  private lastFrameMs = 0;

  /** Ký hiệu nằm trong khay, lưới đứng trên sân khấu (`BR-PSZ-01`). */
  override readonly needsTray = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return this.content.symbols.length;
  }

  /** Lưới `grid_size` hàng đứng trên sân khấu, không thu dưới sàn chạm. */
  override get stageRowCount(): number {
    return this.content.grid_size;
  }
  override readonly usesPromptZone = true;

  setupEntities(): void {
    this.exploreTracker.reset(false);
    this.cellStates.clear();
    this.symbolById = new Map(
      this.content.symbols.map((s) => [s.symbol_id, s])
    );
    this.activeViolations = [];
    this.selectedSymbolId = null;
    this.wrongFlash.clear();
    this.lastFrameMs = 0;
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
    this.exploreTracker.recordExploreAction("symbol_selected");
  }

  getViolations(): readonly ConstraintViolation[] {
    return this.activeViolations;
  }

  isConflicted(row: number, col: number): boolean {
    return this.activeViolations.some((v) => v.row === row && v.col === col);
  }

  private isCellMatchingSolution(
    row: number,
    col: number,
    symbolId: string
  ): boolean {
    const cells: SudokuCell<string>[] = this.content.cells.map((c) => ({
      row: c.row,
      col: c.col,
      value: c.row === row && c.col === col ? symbolId : c.symbol_id,
    }));
    const grid: SudokuGrid<string> = {
      size: this.content.grid_size,
      regions: this.content.regions,
      cells,
    };
    const possibleValues = this.content.symbols.map((s) => s.symbol_id);
    return countSudokuSolutions(grid, possibleValues, 1) > 0;
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
      const isWrongPlacement =
        hasConflict ||
        this.getViolations().length > 0 ||
        !this.isCellMatchingSolution(row, col, symbolId);
      this.recordEvent("cell_filled", {
        row,
        col,
        symbol_id: symbolId,
        is_valid: !hasConflict,
      });

      if (hasConflict) {
        this.wrongFlash.trigger(this.lastFrameMs);
        this.recordEvent("constraint_violated", {
          row,
          col,
          symbol_id: symbolId,
        });
      }

      if (isWrongPlacement) {
        const hasBoxViolation = this.activeViolations.some(
          (v) => v.row === row && v.col === col && v.kind === "box"
        );
        const reasonVi = hasBoxViolation
          ? `Trùng hình trong vùng 2×2, hàng ${row + 1} hoặc cột ${col + 1}`
          : `Trùng hình trên hàng ${row + 1} hoặc cột ${col + 1}`;
        this.exploreTracker.recordWrongAttempt({
          reasonVi,
          targetId: `${row}:${col}`,
          actualValue: symbolId,
        });
        this.recordEvent("control_of_error", {
          row,
          col,
          symbol_id: symbolId,
          micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
        });
      } else {
        this.exploreTracker.recordExploreAction("cell_filled");
      }
    }

    if (this.checkWinCondition()) {
      this.exploreTracker.recordCorrectAttempt();
      this.winSession();
    }

    return true;
  }

  update(deltaMs: number): void {
    this.exploreTracker.tick(deltaMs);
    this.lastFrameMs += deltaMs;
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

  override getHintTargetIndex(): number | null {
    const emptyCell = this.content.cells.find(
      (c) => this.cellStates.get(`${c.row},${c.col}`)?.value === null
    );
    return emptyCell
      ? emptyCell.row * this.content.grid_size + emptyCell.col
      : null;
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
    const symbolCount = this.content.symbols.length;
    const hit = resolveTapSlotIndex(
      this.slots,
      cellCount,
      symbolCount,
      gesture.x,
      gesture.y
    );
    if (hit >= cellCount) {
      this.selectSymbol(
        this.content.symbols[hit - cellCount]?.symbol_id ?? null
      );
      return null;
    }
    if (hit < 0 || !this.selectedSymbolId) {
      return null;
    }
    const size = this.content.grid_size;
    const row = Math.floor(hit / size);
    const col = hit % size;
    const state = this.cellStates.get(`${row},${col}`);
    if (!state || state.isInitial) {
      return null;
    }
    return {
      type: "fill_cell",
      data: { row, col, symbol_id: this.selectedSymbolId },
    };
  }

  private resolveSymbolById(): ReadonlyMap<
    string,
    GT015Content["symbols"][number]
  > {
    if (this.symbolById.size === this.content.symbols.length) {
      return this.symbolById;
    }
    return new Map(this.content.symbols.map((s) => [s.symbol_id, s]));
  }

  override getView(): EngineView {
    const cellCount = this.content.grid_size * this.content.grid_size;
    const cellSlots = this.slots.slice(0, cellCount);
    const paletteSlots = this.slots.slice(cellCount);
    const size = this.content.grid_size;
    const symbolMap = this.resolveSymbolById();
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
          ...resolveAssetLabels(sym.asset),
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
        const symbolId = state?.value ?? cell.symbol_id;
        const sym = symbolId ? symbolMap.get(symbolId) : undefined;
        const cellLabels = sym
          ? resolveAssetLabels(sym.asset)
          : {
              label: `H${cell.row + 1}C${cell.col + 1}`,
              spokenLabel: `Ô hàng ${cell.row + 1} cột ${cell.col + 1}`,
            };
        entities.push({
          id: `cell-${cell.row}-${cell.col}`,
          slotIndex,
          role: "target",
          state: entityState,
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          hitShape: "square",
          ...cellLabels,
        });
      }
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const touchFloor = resolveTouchFloor(ageBand, this.cssPerLogic);
      const size = this.content.grid_size;
      const cells = computeStageCellSlots({
        count: size * size,
        cols: size,
        stage: zones.stage,
        touchFloor,
        maxCell: { w: GRID_CELL_MAX_PX, h: GRID_CELL_MAX_PX },
        role: "target",
      });
      const palette = computeTraySourceSlots(
        this.content.symbols.length,
        zones.tray,
        touchFloor,
        cells.length
      );
      return [...cells, ...palette];
    }
    const layoutFn = resolveLayout("matrix-slot-grid");
    return layoutFn({
      slotCount: this.content.symbols.length,
      targetCount: this.content.grid_size,
      ageBand,
      logic: this.logicSpace,
    });
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      // Lời dẫn do shell vẽ; ký hiệu nằm trên khay của khung năm vùng.
      drawWoodenTokenDock(ctx, rs, zones.tray);
    }
    const cellCount = this.content.grid_size * this.content.grid_size;
    const cellSlots = this.slots.slice(0, cellCount);
    const paletteSlots = this.slots.slice(cellCount);
    const size = this.content.grid_size;
    drawSudokuBoardFrame(ctx, cellSlots, size, this.content.regions);
    const symbolMap = this.resolveSymbolById();
    const assetOf = (symbolId: string) => symbolMap.get(symbolId)?.asset;
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
      if (state === "wrong" && this.wrongFlash.isActive(timeMs)) {
        rs.drawRetryRing(
          ctx,
          slot.x,
          slot.y,
          Math.min(slot.hitW, slot.hitH) / 2 + 4,
          Math.min(1, Math.max(0, this.wrongFlash.elapsedMs(timeMs) / 400))
        );
      }
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
    drawMontessoriControlOfErrorPill(
      ctx,
      this.stageRect ?? sceneBox(rs),
      this.exploreTracker,
      rs.viewport?.scale
    );
  }
}

export const GT015Session = SudokuMiniSession;
