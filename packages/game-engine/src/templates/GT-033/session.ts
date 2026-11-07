import {
  formatNumberWord,
  formatSpokenLabel,
} from "@mindkid/shared/preschool-terminology";
import type { AgeBand } from "#src/contracts/types";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword.js";
import { resolveTouchFloor } from "#src/layout/constants";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test.js";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize } from "#src/layout/slot-fit";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import { computeTraySourceSlots, pickTrayZones } from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWeaveCell,
  drawWoodenTokenDock,
  drawYarnSwatch,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  areWeaveCellsValid,
  extractWeaveCol,
  extractWeaveRow,
  type GT033Content,
  type GT033Difficulty,
  type GT033PaletteItem,
  isWeaveLineValid,
  solveWeaveGrid,
} from "./template.js";

/** Cạnh ô dệt lớn nhất trong sân khấu. */
const WEAVE_CELL_MAX_PX = 68;

const KNOWN_WEAVE_COLOR_KEYS = new Set([
  "red",
  "đỏ",
  "berry",
  "blue",
  "xanh dương",
  "sky",
  "yellow",
  "vàng",
  "amber",
  "gold",
  "green",
  "xanh lá",
  "emerald",
  "mint",
  "purple",
  "tím",
  "lavender",
  "orange",
  "cam",
  "coral",
]);

const FALLBACK_WEAVE_COLORS = [
  "red",
  "blue",
  "yellow",
  "green",
  "purple",
  "orange",
] as const;

const WEAVE_COLOR_NAME_VI: Readonly<Record<string, string>> = {
  red: "Đỏ",
  đỏ: "Đỏ",
  berry: "Đỏ",
  blue: "Xanh dương",
  "xanh dương": "Xanh dương",
  sky: "Xanh dương",
  yellow: "Vàng",
  vàng: "Vàng",
  amber: "Vàng",
  gold: "Vàng",
  green: "Xanh lá",
  "xanh lá": "Xanh lá",
  emerald: "Xanh lá",
  mint: "Xanh lá",
  purple: "Tím",
  tím: "Tím",
  lavender: "Tím",
  orange: "Cam",
  cam: "Cam",
  coral: "Cam",
};

interface GT033ActionPayload {
  readonly color_id?: string;
  readonly id?: string;
  readonly cell_index?: number | string;
  readonly index?: number | string;
  readonly slot_index?: number | string;
}

export class GT033Session extends TemplateGameSession<
  GT033Content,
  GT033Difficulty
> {
  override readonly needsTray = true;

  /** Số vật nguồn trong khay của vòng — shell đo chiều cao khay (`BR-PSZ-13`). */
  override get trayItemCount(): number {
    return this.content.palette.length;
  }

  /** Lưới dệt `grid.rows` hàng đứng trên sân khấu, không thu dưới sàn chạm. */
  override get stageRowCount(): number {
    return this.content.grid.rows;
  }

  /** Giá xu / tên màu vẽ dưới thân vật: khay chừa dải nhãn (`BR-PSZ-13`). */
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
  private inferredSolution: readonly string[] | null = null;
  private particles: Particle[] = [];

  setupEntities(): void {
    this.placedCells = [...this.content.cells];
    this.selectedColorId = this.content.palette[0]?.color_id ?? null;
    this.selectedCellIndex = null;
    this.brokenRowIndex = null;
    this.brokenColIndex = null;
    this.isWin = false;
    this.particles = [];
    const paletteIds = this.content.palette.map((p) => p.color_id);
    const solved = solveWeaveGrid(
      this.content.grid.rows,
      this.content.grid.cols,
      paletteIds,
      this.content.cells,
      1
    );
    this.inferredSolution = solved[0] ?? this.content.solution ?? null;

    this.recordEvent("game_started", {
      template_code: "GT-033",
      difficulty: this.difficulty.grid_size,
      age_band: "5-6",
      device: "tablet",
      reduced_motion: false,
      round_index: 0,
    });
  }

  private resolveMismatchHintIndex(
    cellIndex: number,
    expectedColor: string | undefined,
    totalCells: number
  ): number {
    if (expectedColor && this.selectedColorId !== expectedColor) {
      const palIdx = this.content.palette.findIndex(
        (p) => p.color_id === expectedColor
      );
      if (palIdx >= 0) {
        return totalCells + palIdx;
      }
    }
    return cellIndex;
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    const solution = this.inferredSolution ?? this.content.solution;
    if (!solution) {
      const blank = this.placedCells.indexOf(null);
      return blank >= 0 ? blank : null;
    }
    for (let i = 0; i < totalCells; i++) {
      if (this.placedCells[i] !== solution[i]) {
        return this.resolveMismatchHintIndex(i, solution[i], totalCells);
      }
    }
    return null;
  }

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (zones) {
      const touchFloor = resolveTouchFloor(band, this.cssPerLogic);
      const cells = computeStageCellSlots({
        count: totalCells,
        cols: this.content.grid.cols,
        stage: zones.stage,
        touchFloor,
        maxCell: { w: WEAVE_CELL_MAX_PX, h: WEAVE_CELL_MAX_PX },
        role: "target",
      });
      const palette = computeTraySourceSlots(
        this.content.palette.length,
        zones.tray,
        touchFloor,
        totalCells,
        true
      );
      return insetDrawSize([...cells, ...palette], zones.stage);
    }
    const layoutFn = resolveLayout("weave-grid");
    return layoutFn({
      slotCount: this.content.palette.length,
      ageBand: band,
      targetCount: totalCells,
      logic: this.logicSpace,
    });
  }

  private validateSelectColor(colorId: string): ActionResult {
    const exists = this.content.palette.some((p) => p.color_id === colorId);
    if (!exists) {
      return ACTION_IGNORED;
    }
    return ACTION_CORRECT;
  }

  private evaluatePlacement(
    cellIndex: number,
    colorId: string
  ): { rowValid: boolean; colValid: boolean; isCellCorrect: boolean } {
    const { rows, cols } = this.content.grid;
    const period = this.content.palette.length;
    const row = Math.floor(cellIndex / cols);
    const col = cellIndex % cols;

    const candidate = [...this.placedCells];
    candidate[cellIndex] = colorId;

    const rowValid = isWeaveLineValid(
      extractWeaveRow(candidate, cols, row),
      period
    );
    const colValid = isWeaveLineValid(
      extractWeaveCol(candidate, rows, cols, col),
      period
    );

    if (!(rowValid && colValid)) {
      return { rowValid, colValid, isCellCorrect: false };
    }

    const expectedColor =
      this.inferredSolution?.[cellIndex] ??
      this.content.solution?.[cellIndex] ??
      null;
    const isCellCorrect = expectedColor === null || expectedColor === colorId;
    if (!isCellCorrect) {
      return { rowValid: false, colValid: false, isCellCorrect: false };
    }

    return { rowValid: true, colValid: true, isCellCorrect: true };
  }

  private validatePlaceYarn(
    cellIndex: number,
    colorId: string | null
  ): ActionResult {
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    if (
      Number.isNaN(cellIndex) ||
      cellIndex < 0 ||
      cellIndex >= totalCells ||
      !colorId
    ) {
      return ACTION_IGNORED;
    }

    if (this.content.cells[cellIndex] !== null) {
      return ACTION_IGNORED;
    }

    const { isCellCorrect } = this.evaluatePlacement(cellIndex, colorId);
    if (!isCellCorrect) {
      return ACTION_RETRY;
    }

    return ACTION_CORRECT;
  }

  private validateRemoveYarn(cellIndex: number): ActionResult {
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    if (Number.isNaN(cellIndex) || cellIndex < 0 || cellIndex >= totalCells) {
      return ACTION_IGNORED;
    }

    if (this.content.cells[cellIndex] !== null) {
      return ACTION_IGNORED;
    }

    if (!this.placedCells[cellIndex]) {
      return ACTION_IGNORED;
    }

    return ACTION_CORRECT;
  }

  validateAction(action: GameAction): ActionResult {
    if (this.isWin || this.isWon) {
      return ACTION_IGNORED;
    }

    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT033ActionPayload;

    if (
      type === "select_palette" ||
      type === "select_color" ||
      type === "pick_yarn"
    ) {
      const colorId = data.color_id ?? data.id ?? "";
      return this.validateSelectColor(colorId);
    }

    if (
      type === "place_yarn" ||
      type === "tap_cell" ||
      type === "fill_cell" ||
      type === "drop_yarn"
    ) {
      const cellIndex = Number(
        data.cell_index ?? data.index ?? data.slot_index
      );
      const colorId = data.color_id ?? this.selectedColorId;
      return this.validatePlaceYarn(cellIndex, colorId);
    }

    if (type === "remove_yarn" || type === "undo_yarn") {
      const cellIndex = Number(
        data.cell_index ?? data.index ?? data.slot_index
      );
      return this.validateRemoveYarn(cellIndex);
    }

    return ACTION_IGNORED;
  }

  private commitSelectColor(colorId: string): void {
    const exists = this.content.palette.some((p) => p.color_id === colorId);
    if (!exists) {
      return;
    }
    this.selectedColorId = colorId;
  }

  private commitPlaceYarn(cellIndex: number, colorId: string): void {
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    if (
      Number.isNaN(cellIndex) ||
      cellIndex < 0 ||
      cellIndex >= totalCells ||
      this.content.cells[cellIndex] !== null
    ) {
      return;
    }

    const row = Math.floor(cellIndex / this.content.grid.cols);
    const col = cellIndex % this.content.grid.cols;
    const { rowValid, colValid, isCellCorrect } = this.evaluatePlacement(
      cellIndex,
      colorId
    );

    this.placedCells[cellIndex] = colorId;
    this.selectedCellIndex = cellIndex;

    if (isCellCorrect) {
      this.brokenRowIndex = null;
      this.brokenColIndex = null;
    } else {
      this.brokenRowIndex = rowValid ? null : row;
      this.brokenColIndex = colValid ? null : col;
    }

    this.recordEvent("yarn_placed", {
      cell_index: cellIndex,
      color_id: colorId,
      is_correct: isCellCorrect,
      row,
      col,
    });

    const isAllFilled = this.placedCells.every((c) => c !== null);
    if (isAllFilled && this.verifyGridSolved()) {
      this.isWin = true;
      this.isWon = true;
      this.recordEvent("game_completed", {
        duration_ms: 0,
        rounds_total: 1,
        rounds_correct: 1,
      });

      const slot = this.slots[cellIndex];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 20));
      }
      this.winSession();
    }
  }

  private commitRemoveYarn(cellIndex: number): void {
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    if (
      Number.isNaN(cellIndex) ||
      cellIndex < 0 ||
      cellIndex >= totalCells ||
      this.content.cells[cellIndex] !== null
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

    const row = Math.floor(cellIndex / this.content.grid.cols);
    const col = cellIndex % this.content.grid.cols;

    this.recordEvent("yarn_removed", {
      cell_index: cellIndex,
      color_id: prevColor,
      row,
      col,
    });
  }

  override commit(action: GameAction): void {
    const type = action.type;
    const data = (
      typeof action.data === "object" && action.data !== null ? action.data : {}
    ) as GT033ActionPayload;

    if (
      type === "select_palette" ||
      type === "select_color" ||
      type === "pick_yarn"
    ) {
      const colorId = data.color_id ?? data.id ?? "";
      this.commitSelectColor(colorId);
      return;
    }

    if (
      type === "place_yarn" ||
      type === "tap_cell" ||
      type === "fill_cell" ||
      type === "drop_yarn"
    ) {
      const cellIndex = Number(
        data.cell_index ?? data.index ?? data.slot_index
      );
      const colorId = data.color_id ?? this.selectedColorId;
      if (colorId) {
        this.commitPlaceYarn(cellIndex, colorId);
      }
      return;
    }

    if (type === "remove_yarn" || type === "undo_yarn") {
      const cellIndex = Number(
        data.cell_index ?? data.index ?? data.slot_index
      );
      this.commitRemoveYarn(cellIndex);
    }
  }

  /** Chỉ số palette (hoặc ô) có tâm gần điểm chạm nhất (`BR-ENG-06`). */
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
      .filter((_, i) => this.content.cells[i] === null);
    const index = this.nearestIndex(editable, gx, gy, "square");
    return index === null ? null : (editable[index]?.index ?? null);
  }

  /** Kéo một màu từ khay thả vào ô trống (`BR-ENG-06`). */
  private toDropAction(
    gesture: Extract<Gesture, { type: "drop" }>
  ): GameAction | null {
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    const color = this.findTappedPalette(
      gesture.fromX,
      gesture.fromY,
      totalCells
    );
    const cell = this.findTappedCellIndex(gesture.toX, gesture.toY, totalCells);
    if (!color || cell === null || this.content.cells[cell] !== null) {
      return null;
    }
    return {
      type: "place_yarn",
      data: { cell_index: cell, color_id: color.color_id },
    };
  }

  override toAction(gesture: Gesture): GameAction | null {
    if (gesture.type === "drop") {
      return this.toDropAction(gesture);
    }
    if (gesture.type !== "tap") {
      return null;
    }

    const totalCells = this.content.grid.rows * this.content.grid.cols;
    const paletteItem = this.findTappedPalette(
      gesture.x,
      gesture.y,
      totalCells
    );
    const cellIdx = this.findTappedCellIndex(gesture.x, gesture.y, totalCells);
    if (paletteItem && cellIdx !== null) {
      return this.closerIsPalette(gesture, paletteItem, cellIdx, totalCells)
        ? this.selectColorAction(paletteItem)
        : this.cellAction(cellIdx);
    }
    if (paletteItem) {
      return this.selectColorAction(paletteItem);
    }
    return cellIdx === null ? null : this.cellAction(cellIdx);
  }

  private selectColorAction(item: GT033PaletteItem): GameAction {
    return { type: "select_color", data: { color_id: item.color_id } };
  }

  private closerIsPalette(
    gesture: Extract<Gesture, { type: "tap" }>,
    item: GT033PaletteItem,
    cellIdx: number,
    totalCells: number
  ): boolean {
    const paletteSlot =
      this.slots[totalCells + this.content.palette.indexOf(item)];
    const cellSlot = this.slots[cellIdx];
    if (!(paletteSlot && cellSlot)) {
      return Boolean(paletteSlot);
    }
    const distance = (slot: Slot): number =>
      Math.hypot(gesture.x - slot.x, gesture.y - slot.y);
    return distance(paletteSlot) <= distance(cellSlot);
  }

  private cellAction(cellIdx: number): GameAction | null {
    if (this.content.cells[cellIdx] !== null) {
      return null;
    }
    if (
      this.placedCells[cellIdx] !== null &&
      this.placedCells[cellIdx] === this.selectedColorId
    ) {
      return { type: "remove_yarn", data: { cell_index: cellIdx } };
    }
    if (!this.selectedColorId) {
      return null;
    }
    return {
      type: "place_yarn",
      data: { cell_index: cellIdx, color_id: this.selectedColorId },
    };
  }

  private resolveVisualColorId(colorId: string | null): string | null {
    if (!colorId) {
      return null;
    }
    const lower = colorId.toLowerCase();
    if (KNOWN_WEAVE_COLOR_KEYS.has(lower)) {
      return colorId;
    }
    const palIdx = this.content.palette.findIndex(
      (p) => p.color_id === colorId
    );
    const safeIdx = palIdx >= 0 ? palIdx : 0;
    return (
      FALLBACK_WEAVE_COLORS[safeIdx % FALLBACK_WEAVE_COLORS.length] ?? "red"
    );
  }

  private resolvePaletteDisplayLabel(
    item: GT033PaletteItem,
    index: number
  ): string {
    if (item.name_vi) {
      return item.name_vi;
    }
    const visualKey = (
      this.resolveVisualColorId(item.color_id) ?? "red"
    ).toLowerCase();
    return WEAVE_COLOR_NAME_VI[visualKey] ?? `Màu ${index + 1}`;
  }

  private buildCellEntity(
    i: number,
    slot: Slot,
    paletteColorIds: ReadonlySet<string>
  ): ViewEntity {
    const placedColorId = this.placedCells[i] ?? null;
    const isPlaced = placedColorId !== null;
    const rawCellId = `cell_${i}`;
    const cellEntityId = paletteColorIds.has(rawCellId)
      ? `grid:${rawCellId}`
      : rawCellId;
    const palIdx = placedColorId
      ? this.content.palette.findIndex((p) => p.color_id === placedColorId)
      : -1;
    const paletteItem = palIdx >= 0 ? this.content.palette[palIdx] : undefined;
    const itemLabels = paletteItem
      ? resolveAssetLabels(paletteItem.asset)
      : undefined;
    const displayLabel =
      paletteItem && palIdx >= 0
        ? this.resolvePaletteDisplayLabel(paletteItem, palIdx)
        : "?";
    const spokenLabel =
      paletteItem && palIdx >= 0
        ? (formatSpokenLabel(displayLabel) ??
          itemLabels?.spokenLabel ??
          formatSpokenLabel(`ô số ${formatNumberWord(i + 1)}`))
        : formatSpokenLabel(`ô trống số ${formatNumberWord(i + 1)}`);
    return {
      id: cellEntityId,
      slotIndex: i,
      role: "target",
      state: isPlaced ? "selected" : "idle",
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      hitShape: "square",
      glyph: itemLabels?.glyph,
      label: displayLabel,
      spokenLabel,
      spokenAudioPath: itemLabels?.spokenAudioPath,
    };
  }

  private buildPaletteEntity(
    p: number,
    item: GT033PaletteItem,
    slot: Slot,
    totalCells: number
  ): ViewEntity {
    const isSelected = this.selectedColorId === item.color_id;
    const itemLabels = resolveAssetLabels(item.asset);
    const displayLabel = this.resolvePaletteDisplayLabel(item, p);
    const spokenLabel =
      formatSpokenLabel(displayLabel) ??
      itemLabels.spokenLabel ??
      formatSpokenLabel(`màu số ${formatNumberWord(p + 1)}`);
    return {
      id: item.color_id,
      slotIndex: totalCells + p,
      role: "source",
      state: isSelected ? "selected" : "idle",
      x: slot.x,
      y: slot.y,
      w: slot.w,
      h: slot.h,
      hitShape: "circle",
      glyph: itemLabels.glyph,
      label: displayLabel,
      spokenLabel,
      spokenAudioPath: itemLabels.spokenAudioPath,
    };
  }

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    const paletteColorIds = new Set(
      this.content.palette.map((p) => p.color_id)
    );

    for (let i = 0; i < totalCells; i++) {
      const slot = this.slots[i];
      if (slot) {
        entities.push(this.buildCellEntity(i, slot, paletteColorIds));
      }
    }

    for (let p = 0; p < this.content.palette.length; p++) {
      const item = this.content.palette[p];
      const slot = this.slots[totalCells + p];
      if (item && slot) {
        entities.push(this.buildPaletteEntity(p, item, slot, totalCells));
      }
    }

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  private verifyGridSolved(): boolean {
    if (!this.placedCells.every((cell) => cell !== null)) {
      return false;
    }
    return areWeaveCellsValid(
      this.content.grid.rows,
      this.content.grid.cols,
      this.placedCells,
      this.content.palette.length
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

  private renderGridCells(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    for (let i = 0; i < totalCells; i++) {
      const slot = this.slots[i];
      if (!slot) {
        continue;
      }

      const row = Math.floor(i / this.content.grid.cols);
      const col = i % this.content.grid.cols;
      const isOriginal = this.content.cells[i] !== null;
      const rawColorId = this.placedCells[i] ?? null;
      const colorId = this.resolveVisualColorId(rawColorId);

      drawWeaveCell(ctx, rs, slot, {
        cellIndex: i,
        colorId,
        isOriginal,
        isSelected: this.selectedCellIndex === i,
        isBrokenRow: this.brokenRowIndex === row,
        isBrokenCol: this.brokenColIndex === col,
      });
    }
  }

  private renderPaletteDock(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    drawWoodenTokenDock(
      ctx,
      rs,
      pickTrayZones(this.stageRect, this.trayRect)?.tray
    );
    const totalCells = this.content.grid.rows * this.content.grid.cols;

    for (let p = 0; p < this.content.palette.length; p++) {
      const item: GT033PaletteItem | undefined = this.content.palette[p];
      const slot = this.slots[totalCells + p];
      if (item && slot) {
        const isSelected = this.selectedColorId === item.color_id;
        drawSlotItem(
          ctx,
          rs,
          slot,
          {
            id: item.color_id,
            asset: item.asset,
            label: this.resolvePaletteDisplayLabel(item, p),
            state: isSelected ? "selected" : "idle",
          },
          "circle"
        );
        // Mọi item bảng màu cùng asset 🧶 — chấm màu kèm hình mới phân biệt được.
        const swatchR = Math.min(slot.w, slot.h) * 0.2;
        const visualColorId =
          this.resolveVisualColorId(item.color_id) ?? item.color_id;
        drawYarnSwatch(
          ctx,
          visualColorId,
          slot.x + slot.w / 2 - swatchR,
          slot.y - slot.h / 2 + swatchR,
          swatchR
        );
      }
    }
  }

  private drawLegacySubPrompt(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem
  ): void {
    const subPrompt = this.isWin
      ? "Tuyệt vời! Tấm thảm hoa văn đã hoàn thành!"
      : "Chọn sợi màu và dệt vào ô trống nhé";
    drawSubPromptText(ctx, rs, subPrompt);
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs, this.themeId);
    const zones = pickTrayZones(this.stageRect, this.trayRect);
    if (!zones) {
      this.drawLegacySubPrompt(ctx, rs);
    }

    this.renderGridCells(ctx, rs);
    this.renderPaletteDock(ctx, rs);

    if (this.degradation?.particles_enabled !== false) {
      this.particles = updateParticles(this.particles);
      rs.drawParticles(ctx, this.particles);
    }
  }
}
