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
import { resolveTouchFloor } from "#src/layout/constants";
import { resolveLayout } from "#src/layout/registry";
import { insetDrawSize } from "#src/layout/slot-fit";
import { computeStageCellSlots } from "#src/layout/stage-targets";
import {
  computeTraySourceSlots,
  findNearestHitSlot,
  pickTrayZones,
} from "#src/layout/tray-layout";
import type { Slot } from "#src/layout/types";
import {
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWeaveCell,
  drawWoodenTokenDock,
  spawnParticlesAtSlot,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import type {
  GT033Content,
  GT033Difficulty,
  GT033PaletteItem,
} from "./template.js";

const HIT_TOLERANCE_PX = 24;

/** Cạnh ô dệt lớn nhất trong sân khấu. */
const WEAVE_CELL_MAX_PX = 68;

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
  private particles: Particle[] = [];

  setupEntities(): void {
    this.placedCells = [...this.content.cells];
    this.selectedColorId = this.content.palette[0]?.color_id ?? null;
    this.selectedCellIndex = null;
    this.brokenRowIndex = null;
    this.brokenColIndex = null;
    this.isWin = false;
    this.particles = [];

    this.recordEvent("game_started", {
      template_code: "GT-033",
      difficulty: this.difficulty.grid_size,
      age_band: "5-6",
      device: "tablet",
      reduced_motion: false,
      round_index: 0,
    });
  }

  override getHintTargetIndex(): number | null {
    if (this.isWin || this.isWon) {
      return null;
    }
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    const solution = this.content.solution;
    if (!solution) {
      const blank = this.placedCells.indexOf(null);
      return blank >= 0 ? blank : null;
    }
    for (let i = 0; i < totalCells; i++) {
      if (this.placedCells[i] !== solution[i]) {
        const expectedColor = solution[i];
        if (this.selectedColorId !== expectedColor) {
          const palIdx = this.content.palette.findIndex(
            (p) => p.color_id === expectedColor
          );
          if (palIdx >= 0) {
            return totalCells + palIdx;
          }
        }
        return i;
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

    const expectedColor = this.content.solution
      ? this.content.solution[cellIndex]
      : null;
    const isCellCorrect = expectedColor === null || expectedColor === colorId;

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

    this.placedCells[cellIndex] = colorId;
    this.selectedCellIndex = cellIndex;

    const row = Math.floor(cellIndex / this.content.grid.cols);
    const col = cellIndex % this.content.grid.cols;

    const expectedColor = this.content.solution
      ? this.content.solution[cellIndex]
      : null;
    const isCellCorrect = expectedColor === null || expectedColor === colorId;

    if (isCellCorrect) {
      this.brokenRowIndex = null;
      this.brokenColIndex = null;
    } else {
      this.brokenRowIndex = row;
      this.brokenColIndex = col;
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
    y: number
  ): number | null {
    const index = findNearestHitSlot(slots, x, y, HIT_TOLERANCE_PX);
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
    const index = this.nearestIndex(slots, gx, gy);
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
    const index = this.nearestIndex(editable, gx, gy);
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

  override getView(): EngineView {
    const entities: ViewEntity[] = [];
    const totalCells = this.content.grid.rows * this.content.grid.cols;

    for (let i = 0; i < totalCells; i++) {
      const slot = this.slots[i];
      if (!slot) {
        continue;
      }
      const isPlaced = this.placedCells[i] !== null;
      entities.push({
        id: `cell_${i}`,
        slotIndex: i,
        role: "target",
        state: isPlaced ? "selected" : "idle",
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
      });
    }

    for (let p = 0; p < this.content.palette.length; p++) {
      const item = this.content.palette[p];
      const slot = this.slots[totalCells + p];
      if (!(item && slot)) {
        continue;
      }
      const isSelected = this.selectedColorId === item.color_id;
      entities.push({
        id: item.color_id,
        slotIndex: totalCells + p,
        role: "source",
        state: isSelected ? "selected" : "idle",
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

  private verifyGridSolved(): boolean {
    if (this.content.solution) {
      return this.placedCells.every(
        (cell, idx) => cell === this.content.solution?.[idx]
      );
    }
    return this.placedCells.every((cell) => cell !== null);
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
      const colorId = this.placedCells[i] ?? null;

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
            label: item.name_vi ?? item.color_id,
            state: isSelected ? "selected" : "idle",
          },
          "circle"
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
