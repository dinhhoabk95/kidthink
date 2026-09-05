import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import type { EngineView, Gesture, ViewEntity } from "#src/interaction";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import {
  boxFromSlots,
  drawEmptyTargetSlot,
  drawPromptText,
  drawSceneBackground,
  drawShapeTray,
  drawSlotItem,
  drawWoodenTokenDock,
  type ItemVisualState,
  updateParticles,
} from "#src/render/index.js";
import type { DegradationState } from "#src/systems/degradation";
import type { Particle, RenderSystem } from "#src/systems/render-system";
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
  degradation: DegradationState | null = null;
  private renderParticles: Particle[] = [];
  private readonly renderItemStates: Map<string, ItemVisualState> = new Map();

  private readonly mechanic = new SelectionMechanic({ mode: "single" });
  private preview: MatrixPreview | null = null;

  setupEntities(): void {
    this.mechanic.reset();
    this.preview = null;
    this.isWon = false;
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
    if (gesture.type !== "tap") {
      return null;
    }
    const cellCount = this.content.matrix.rows * this.content.matrix.cols;
    const optionSlots = this.slots.slice(cellCount);
    for (let i = 0; i < this.content.options.length; i++) {
      const slot = optionSlots[i];
      const option = this.content.options[i];
      if (!(slot && option)) {
        continue;
      }
      const dx = Math.abs(gesture.x - slot.x);
      const dy = Math.abs(gesture.y - slot.y);
      const radius = Math.max(slot.hitW ?? slot.w, slot.hitH ?? slot.h) / 2;
      if (dx <= radius && dy <= radius) {
        return {
          type: "select_item",
          data: { item_id: option.option_id },
        };
      }
    }
    return null;
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
          role: "target",
          state: this.preview === null ? "idle" : "active",
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
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

  protected computeSlots(ageBand: "3-4" | "4-5" | "5-6"): readonly Slot[] {
    const layoutFn = resolveLayout("matrix-3x3");
    return layoutFn({
      slotCount: this.content.options.length,
      targetCount: this.content.matrix.rows * this.content.matrix.cols,
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
    const cellCount = this.content.matrix.rows * this.content.matrix.cols;
    const cellSlots = this.slots.slice(0, cellCount);
    const optionSlots = this.slots.slice(cellCount);
    const matrixBox = boxFromSlots(cellSlots);
    if (matrixBox) {
      drawShapeTray(ctx, matrixBox);
    }
    drawWoodenTokenDock(ctx, rs);
    const { cols } = this.content.matrix;

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

export default GT011Session;
