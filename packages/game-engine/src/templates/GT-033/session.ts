import type { AgeBand } from "#src/contracts/types";
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
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
import {
  drawPromptText,
  drawSceneBackground,
  drawSlotItem,
  drawSubPromptText,
  drawWeaveCell,
  drawWoodenTokenDock,
  spawnParticlesAtSlot,
  updateParticles,
} from "../shared-render.js";
import type {
  GT033Content,
  GT033Difficulty,
  GT033PaletteItem,
} from "./template.js";

export class GT033Session extends TemplateGameSession<
  GT033Content,
  GT033Difficulty
> {
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

  protected computeSlots(band: AgeBand): readonly Slot[] {
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    const layoutFn = resolveLayout("weave-grid");
    return layoutFn({
      slotCount: this.content.palette.length,
      ageBand: band,
      targetCount: totalCells,
    });
  }

  validateAction(action: GameAction): ActionResult {
    const type = action.type;
    const data = (action.data as Record<string, unknown>) ?? {};

    if (
      type === "select_palette" ||
      type === "select_color" ||
      type === "pick_yarn"
    ) {
      const colorId = (data.color_id as string) || (data.id as string) || "";
      return this.handleSelectColor(colorId);
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
      const colorId = (data.color_id as string) || this.selectedColorId;
      return this.handlePlaceYarn(cellIndex, colorId);
    }

    if (type === "remove_yarn" || type === "undo_yarn") {
      const cellIndex = Number(
        data.cell_index ?? data.index ?? data.slot_index
      );
      return this.handleRemoveYarn(cellIndex);
    }

    return ACTION_IGNORED;
  }

  private handleSelectColor(colorId: string): ActionResult {
    const exists = this.content.palette.some((p) => p.color_id === colorId);
    if (!exists) {
      return ACTION_IGNORED;
    }
    this.selectedColorId = colorId;
    return ACTION_CORRECT;
  }

  private handlePlaceYarn(
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

    // Original non-null cells from content cannot be changed
    if (this.content.cells[cellIndex] !== null) {
      return ACTION_IGNORED;
    }

    this.placedCells[cellIndex] = colorId;
    this.selectedCellIndex = cellIndex;

    const row = Math.floor(cellIndex / this.content.grid.cols);
    const col = cellIndex % this.content.grid.cols;

    // Check solution match (or rule verification)
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
      this.recordEvent("game_completed", {
        duration_ms: 0,
        rounds_total: 1,
        rounds_correct: 1,
      });

      const slot = this.slots[cellIndex];
      if (slot) {
        this.particles.push(...spawnParticlesAtSlot(slot, 20));
      }
      return ACTION_CORRECT;
    }

    if (!isCellCorrect) {
      return ACTION_RETRY;
    }

    return ACTION_CORRECT;
  }

  private handleRemoveYarn(cellIndex: number): ActionResult {
    const totalCells = this.content.grid.rows * this.content.grid.cols;
    if (Number.isNaN(cellIndex) || cellIndex < 0 || cellIndex >= totalCells) {
      return ACTION_IGNORED;
    }

    // Cannot remove original fixed cells
    if (this.content.cells[cellIndex] !== null) {
      return ACTION_IGNORED;
    }

    const prevColor = this.placedCells[cellIndex];
    if (!prevColor) {
      return ACTION_IGNORED;
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

    return ACTION_CORRECT;
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
    if (this.content.solution) {
      return this.placedCells.every(
        (cell, idx) => cell === this.content.solution?.[idx]
      );
    }
    return this.isWin;
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
    drawWoodenTokenDock(ctx, rs);
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

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    _timeMs: number
  ): void {
    drawSceneBackground(ctx, rs);
    drawPromptText(ctx, rs, this.content.prompt);

    const subPrompt = this.isWin
      ? "Tuyệt vời! Tấm thảm hoa văn đã hoàn thành!"
      : "Chọn sợi màu và dệt vào ô trống nhé";
    drawSubPromptText(ctx, rs, subPrompt);

    this.renderGridCells(ctx, rs);
    this.renderPaletteDock(ctx, rs);

    if (this.degradation?.particles_enabled !== false) {
      this.particles = updateParticles(this.particles);
      rs.drawParticles(ctx, this.particles);
    }
  }
}
