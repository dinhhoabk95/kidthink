import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "#src/game-session";
import { OrderingMechanic } from "#src/mechanics/ordering-mechanic";
import { SelectionMechanic } from "#src/mechanics/selection-mechanic";
import type { GT018Content, GT018Difficulty } from "./template.js";

export class GT018Session extends TemplateGameSession<
  GT018Content,
  GT018Difficulty
> {
  private readonly selectionMechanic = new SelectionMechanic({
    mode: "single",
  });
  private readonly orderingMechanic = new OrderingMechanic();
  selectedItemId: string | null = null;

  setupEntities(): void {
    this.isWon = false;
    this.selectedItemId = null;
    this.selectionMechanic.reset();

    if (this.content.response_mode === "sequence") {
      const initialSeq = this.content.options.map((opt) => opt.item_id);
      this.orderingMechanic.setInitialSequence(initialSeq);
    }

    this.recordEvent("round_started", {
      round_index: 0,
      mode: this.content.response_mode,
      item_count: this.content.options.length,
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (this.content.response_mode === "sequence") {
      const targetSeq = this.content.target_sequence ?? [];
      if (action.type === "reorder_step") {
        return this.orderingMechanic.validate(action, targetSeq);
      }
      if (
        action.type === "submit_order" ||
        action.type === "sequence_submitted"
      ) {
        return this.orderingMechanic.validate(action, targetSeq);
      }
      return ACTION_IGNORED;
    }

    const items = this.content.options.map((opt) => ({
      id: opt.item_id,
      isCorrect: opt.is_correct === true,
    }));

    if (action.type === "tap_option" || action.type === "select_item") {
      return this.selectionMechanic.validate(action, items);
    }

    return ACTION_IGNORED;
  }

  onItemSelect(itemId: string): ActionResult {
    if (this.content.response_mode !== "select") {
      return ACTION_IGNORED;
    }
    this.selectedItemId = itemId;
    this.selectionMechanic.select(itemId);
    const option = this.content.options.find((opt) => opt.item_id === itemId);
    const isCorrect = option?.is_correct === true;

    this.recordEvent("item_selected", {
      item_id: itemId,
      is_correct: isCorrect,
    });

    if (isCorrect) {
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return ACTION_CORRECT;
    }

    return ACTION_RETRY;
  }

  onReorderStep(fromIndex: number, toIndex: number): boolean {
    if (this.content.response_mode !== "sequence") {
      return false;
    }
    return this.orderingMechanic.reorder(fromIndex, toIndex);
  }

  onSubmitSequence(): ActionResult {
    if (this.content.response_mode !== "sequence") {
      return ACTION_IGNORED;
    }
    const targetSeq = this.content.target_sequence ?? [];
    const isMatch = this.orderingMechanic.isSequenceCorrect(targetSeq);

    this.recordEvent("sequence_submitted", {
      is_correct: isMatch,
      sequence: this.orderingMechanic.getCurrentSequence(),
    });

    if (isMatch) {
      this.recordEvent("round_completed", { round_index: 0 });
      this.winSession();
      return ACTION_CORRECT;
    }

    return ACTION_RETRY;
  }

  override checkWinCondition(): boolean {
    if (this.content.response_mode === "sequence") {
      const targetSeq = this.content.target_sequence ?? [];
      return this.orderingMechanic.isSequenceCorrect(targetSeq);
    }
    const items = this.content.options.map((opt) => ({
      id: opt.item_id,
      isCorrect: opt.is_correct === true,
    }));
    return this.selectionMechanic.isSelectionComplete(items);
  }
}

export default GT018Session;
