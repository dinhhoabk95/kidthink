import type { AgeBand } from "#src/contracts/types";
import {
  type ActionResult,
  type GameAction,
  type HintLevel,
  type HintTarget,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveAssetLabels } from "#src/labels/spoken-keyword";
import { findHitSlotIndex, TAP_TOLERANCE_PX } from "#src/layout/hit-test";
import { resolveLayout } from "#src/layout/registry";
import {
  dockRectAroundSlots,
  insetDrawSize,
  insetRect,
  TRAY_DECOR_PAD_X_PX,
  TRAY_DECOR_PAD_Y_PX,
  trayBoxWithin,
} from "#src/layout/slot-fit";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import {
  boxFromSlots,
  drawEmptyTargetSlot,
  drawMontessoriControlOfErrorPill,
  drawRoundedBoxOutline,
  drawSceneBackground,
  drawShapeTray,
  drawSlotItem,
  drawWoodenTokenDock,
  sceneBox,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import {
  type ControlOfErrorDiagnostics,
  MontessoriExploreTracker,
} from "#src/systems/montessori-explore-system";
import type { RenderSystem } from "#src/systems/render-system";
import { colMatches, findBlankCell, rowMatches } from "./matrix-rule.js";
import type { GT011Content, GT011Difficulty } from "./template.js";

function toOptionViewState(
  isSelected: boolean,
  isCorrect: boolean,
  isPreviewed: boolean
): ViewEntity["state"] {
  if (isSelected) {
    return isCorrect ? "correct" : "incorrect";
  }
  if (isPreviewed) {
    return "selected";
  }
  return "idle";
}

export interface MatrixPreview {
  /** Option đang được đặt thử vào ô trống. */
  readonly option_id: string;
  /** Hàng của ô trống sáng lên khi quy luật khớp. */
  readonly row_matches: boolean;
  /** Cột của ô trống sáng lên khi quy luật khớp. */
  readonly col_matches: boolean;
}

/**
 * `GT-011` — ma trận chọn hình.
 *
 * Kiểm soát lỗi tự thân (`BR-MTB-14`): chạm một option **đặt thử** nó vào ô trống;
 * hàng và cột chứa ô đó sáng lên khi quy luật khớp, tắt khi không. Trẻ thử và tự
 * thấy, thay vì đoán rồi bị chấm.
 */
export class GT011Session extends TemplateGameSession<
  GT011Content,
  GT011Difficulty
> {
  override readonly usesPromptZone = true;

  degradation: DegradationState | null = null;

  private readonly mechanic = new SelectionMechanic({ mode: "single" });
  private readonly exploreTracker = new MontessoriExploreTracker({
    milestoneTarget: 2,
  });
  private preview: MatrixPreview | null = null;
  private wrongOptionId: string | null = null;
  private wrongTimestamp = 0;
  private lastFrameMs = 0;

  setupEntities(): void {
    this.mechanic.reset();
    this.exploreTracker.reset(false);
    this.preview = null;
    this.wrongOptionId = null;
    this.wrongTimestamp = 0;
    this.lastFrameMs = 0;
    this.isWon = false;
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

  update(deltaMs: number): void {
    this.lastFrameMs += deltaMs;
    this.exploreTracker.tick(deltaMs);
    if (this.wrongOptionId && this.lastFrameMs - this.wrongTimestamp >= 400) {
      this.setRenderItemState(this.wrongOptionId, "idle");
      this.mechanic.reset();
      this.preview = null;
      this.wrongOptionId = null;
      this.wrongTimestamp = 0;
    }
  }

  /** Ô trống của ma trận — đúng một ô, `content_contract` đã ép điều đó. */
  getBlankCell(): { row: number; col: number } {
    const blank = findBlankCell(this.content.matrix);
    return { row: blank?.row ?? 0, col: blank?.col ?? 0 };
  }

  getPreview(): MatrixPreview | null {
    return this.preview;
  }

  /**
   * Trẻ chạm một option: đặt thử vào ô trống và soi hàng, cột. Không chấm đúng sai.
   */
  onOptionPreviewed(optionId: string): MatrixPreview | null {
    const option = this.content.options.find((o) => o.option_id === optionId);
    if (!option) {
      return null;
    }
    this.exploreTracker.recordExploreAction("matrix_previewed");
    this.preview = {
      option_id: optionId,
      row_matches: rowMatches(this.content.matrix, option.asset),
      col_matches: colMatches(this.content.matrix, option.asset),
    };
    this.recordEvent("option_previewed", {
      option_id: optionId,
      row_matches: this.preview.row_matches,
      col_matches: this.preview.col_matches,
    });
    return this.preview;
  }

  validateAction(action: GameAction): ActionResult {
    return this.mechanic.validate(action, this.selectionItems());
  }

  override toAction(gesture: Gesture): GameAction | null {
    const cellCount = this.content.matrix.rows * this.content.matrix.cols;
    const optionSlots = this.slots.slice(cellCount);
    if (gesture.type === "drop") {
      const fromIdx = findHitSlotIndex(
        optionSlots,
        gesture.fromX,
        gesture.fromY,
        "circle",
        TAP_TOLERANCE_PX
      );
      const cellSlots = this.slots.slice(0, cellCount);
      const toCellIdx = findHitSlotIndex(
        cellSlots,
        gesture.toX,
        gesture.toY,
        "square",
        TAP_TOLERANCE_PX
      );
      const option = fromIdx >= 0 ? this.content.options[fromIdx] : undefined;
      if (option && toCellIdx >= 0) {
        return {
          type: "select_item",
          data: { item_id: option.option_id },
        };
      }
      return null;
    }
    if (gesture.type !== "tap") {
      return null;
    }
    const idx = findHitSlotIndex(
      optionSlots,
      gesture.x,
      gesture.y,
      "circle",
      TAP_TOLERANCE_PX
    );
    const option = idx >= 0 ? this.content.options[idx] : undefined;
    if (!option) {
      return null;
    }
    return {
      type: "select_item",
      data: { item_id: option.option_id },
    };
  }

  override getHintTargetIndex(): number | null {
    const idx = this.content.options.findIndex((o) => o.is_correct);
    if (idx < 0) {
      return null;
    }
    const cellCount = this.content.matrix.rows * this.content.matrix.cols;
    return this.slots.length > cellCount ? cellCount + idx : idx;
  }

  override getHintTargetForLevel(level: HintLevel): HintTarget | null {
    if (this.checkWinCondition()) {
      return null;
    }
    const blank = this.getBlankCell();
    const rowCellIds = this.content.matrix.cells
      .filter((c) => c.row === blank.row)
      .map((c) => (c.asset === null ? "matrix_blank" : `c${c.row}-${c.col}`));
    if (level === 1) {
      return {
        kind: "region",
        ids: [`matrix-row-${blank.row}`, ...rowCellIds],
      };
    }
    if (level === 2) {
      const colCellIds = this.content.matrix.cells
        .filter((c) => c.col === blank.col && c.row !== blank.row)
        .map((c) => (c.asset === null ? "matrix_blank" : `c${c.row}-${c.col}`));
      return {
        kind: "region",
        ids: [
          `matrix-row-${blank.row}`,
          `matrix-col-${blank.col}`,
          ...rowCellIds,
          ...colCellIds,
        ],
      };
    }
    return this.getHintTarget();
  }

  override commit(action: GameAction): void {
    const data = action.data;
    const itemId =
      typeof data === "object" && data !== null
        ? Reflect.get(data, "item_id")
        : undefined;
    if (typeof itemId === "string" && itemId.length > 0) {
      this.onOptionPreviewed(itemId);
      this.onOptionSelected(itemId);
    }
  }

  override getView(): EngineView {
    const cellCount = this.content.matrix.rows * this.content.matrix.cols;
    const cellSlots = this.slots.slice(0, cellCount);
    const optionSlots = this.slots.slice(cellCount);
    const { cols } = this.content.matrix;
    const entities: ViewEntity[] = [];

    for (const cell of this.content.matrix.cells) {
      const slotIndex = cell.row * cols + cell.col;
      const slot = cellSlots[slotIndex];
      if (!slot) {
        continue;
      }
      if (cell.asset === null) {
        entities.push({
          id: "matrix_blank",
          slotIndex,
          role: "neutral",
          state: this.preview === null ? "idle" : "active",
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          hitShape: "square",
          label: "Ô trống",
          spokenLabel: "Ô trống",
        });
      } else {
        entities.push({
          id: `c${cell.row}-${cell.col}`,
          slotIndex,
          role: "neutral",
          state: "idle",
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          hitShape: "square",
          ...resolveAssetLabels(cell.asset),
        });
      }
    }

    this.content.options.forEach((opt, i) => {
      const slot = optionSlots[i];
      if (!slot) {
        return;
      }
      const isSelected = this.mechanic.isSelected(opt.option_id);
      const isPreviewed = this.preview?.option_id === opt.option_id;
      const state = toOptionViewState(isSelected, opt.is_correct, isPreviewed);

      entities.push({
        id: opt.option_id,
        slotIndex: cellCount + i,
        role: "source",
        state,
        x: slot.x,
        y: slot.y,
        w: slot.w,
        h: slot.h,
        ...resolveAssetLabels(opt.asset),
      });
    });

    return {
      activePrompt: this.content.prompt,
      entities,
    };
  }

  onOptionSelected(optionId: string): void {
    const option = this.content.options.find((o) => o.option_id === optionId);
    if (!option) {
      return;
    }
    this.mechanic.select(optionId);
    if (option.is_correct) {
      this.wrongOptionId = null;
      this.wrongTimestamp = 0;
      this.exploreTracker.recordCorrectAttempt();
    } else {
      this.wrongOptionId = optionId;
      this.wrongTimestamp = this.lastFrameMs;
      this.setRenderItemState(optionId, "wrong");
      const rMatch = rowMatches(this.content.matrix, option.asset);
      const cMatch = colMatches(this.content.matrix, option.asset);
      let reasonVi = "Chưa khớp quy luật hai chiều của bảng";
      if (rMatch && !cMatch) {
        reasonVi = "Khớp hàng ngang nhưng chưa khớp cột dọc";
      } else if (!rMatch && cMatch) {
        reasonVi = "Khớp cột dọc nhưng chưa khớp hàng ngang";
      } else if (!(rMatch || cMatch)) {
        reasonVi = "Chưa khớp quy luật hàng ngang và cột dọc";
      }
      this.exploreTracker.recordWrongAttempt({
        reasonVi,
        targetId: optionId,
        actualValue: optionId,
      });
      this.recordEvent("control_of_error", {
        option_id: optionId,
        row_matches: rMatch,
        col_matches: cMatch,
        micro_sandbox: this.exploreTracker.isMicroSandboxActive(),
      });
    }
    this.recordEvent("option_selected", {
      option_id: optionId,
      is_correct: option.is_correct,
    });
    if (this.checkWinCondition()) {
      this.winSession();
    }
  }

  override checkWinCondition(): boolean {
    return this.mechanic.isSelectionComplete(this.selectionItems());
  }

  private selectionItems(): { id: string; isCorrect: boolean }[] {
    return this.content.options.map((o) => ({
      id: o.option_id,
      isCorrect: o.is_correct,
    }));
  }

  protected computeSlots(ageBand: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("matrix-3x3");
    return insetDrawSize(
      layoutFn({
        slotCount: this.content.options.length,
        targetCount: this.content.matrix.rows * this.content.matrix.cols,
        ageBand,
        logic: this.logicSpace,
        stage: this.stageRect
          ? insetRect(this.stageRect, TRAY_DECOR_PAD_X_PX, TRAY_DECOR_PAD_Y_PX)
          : undefined,
        cssPerLogic: this.cssPerLogic,
      }),
      this.stageRect
    );
  }

  render(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void {
    this.lastFrameMs = timeMs;
    if (this.wrongOptionId && timeMs - this.wrongTimestamp >= 400) {
      this.setRenderItemState(this.wrongOptionId, "idle");
      this.mechanic.reset();
      this.preview = null;
      this.wrongOptionId = null;
      this.wrongTimestamp = 0;
    }

    drawSceneBackground(ctx, rs, this.themeId);
    const cellCount = this.content.matrix.rows * this.content.matrix.cols;
    const cellSlots = this.slots.slice(0, cellCount);
    const optionSlots = this.slots.slice(cellCount);
    const matrixBox = boxFromSlots(cellSlots);
    if (matrixBox) {
      drawShapeTray(ctx, trayBoxWithin(matrixBox, this.stageRect));
    }
    drawWoodenTokenDock(
      ctx,
      rs,
      dockRectAroundSlots(optionSlots, this.stageRect)
    );
    const { cols } = this.content.matrix;

    this.renderMatrixPreviewHighlight(ctx, rs, cellSlots, cols);

    for (const cell of this.content.matrix.cells) {
      const slot = cellSlots[cell.row * cols + cell.col];
      if (!slot) {
        continue;
      }
      if (cell.asset === null) {
        drawEmptyTargetSlot(ctx, slot);
        // Ô trống hiện thử phương án trẻ đang cân nhắc.
        const previewAsset = this.content.options.find(
          (o) => o.option_id === this.preview?.option_id
        )?.asset;
        if (previewAsset) {
          drawSlotItem(
            ctx,
            rs,
            slot,
            { id: "preview", asset: previewAsset, state: "selected" },
            "square"
          );
        }
        continue;
      }
      drawSlotItem(
        ctx,
        rs,
        slot,
        { id: `c${cell.row}-${cell.col}`, asset: cell.asset, state: "locked" },
        "square"
      );
    }

    this.content.options.forEach((opt, i) => {
      const slot = optionSlots[i];
      if (!slot) {
        return;
      }
      let state = this.getRenderItemState(opt.option_id);
      if (this.mechanic.isSelected(opt.option_id)) {
        state = opt.is_correct ? "correct" : "wrong";
      }
      drawSlotItem(ctx, rs, slot, {
        id: opt.option_id,
        asset: opt.asset,
        state,
      });

      if (opt.option_id === this.wrongOptionId && this.wrongTimestamp > 0) {
        const elapsed = timeMs - this.wrongTimestamp;
        if (elapsed < 400) {
          rs.drawRetryRing(
            ctx,
            slot.x,
            slot.y,
            Math.min(slot.hitW, slot.hitH) / 2 + 4,
            elapsed / 400
          );
        }
      }
    });

    drawMontessoriControlOfErrorPill(
      ctx,
      this.stageRect ?? sceneBox(rs),
      this.exploreTracker,
      rs.viewport?.scale
    );
  }

  private renderMatrixPreviewHighlight(
    ctx: CanvasRenderingContext2D,
    _rs: RenderSystem,
    cellSlots: readonly Slot[],
    cols: number
  ): void {
    if (!this.preview) {
      return;
    }
    const blank = this.getBlankCell();
    if (this.preview.row_matches) {
      const rowSlots = cellSlots.filter(
        (_, idx) => Math.floor(idx / cols) === blank.row
      );
      const rowBox = boxFromSlots(rowSlots);
      if (rowBox) {
        drawRoundedBoxOutline(ctx, rowBox);
      }
    }
    if (this.preview.col_matches) {
      const colSlots = cellSlots.filter((_, idx) => idx % cols === blank.col);
      const colBox = boxFromSlots(colSlots);
      if (colBox) {
        drawRoundedBoxOutline(ctx, colBox);
      }
    }
  }
}

export default GT011Session;
