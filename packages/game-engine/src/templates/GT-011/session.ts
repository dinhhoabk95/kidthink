import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session.js";
import { SelectionMechanic } from "../../mechanics/selection-mechanic.js";
import { colMatches, findBlankCell, rowMatches } from "./matrix-rule.js";
import type { GT011Content, GT011Difficulty } from "./template.js";

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
}

export default GT011Session;
