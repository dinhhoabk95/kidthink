import type {
  GT001Content,
  GT001Difficulty,
} from "../../contracts/templates/gt001";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session";

export class GT001Session extends TemplateGameSession<
  GT001Content,
  GT001Difficulty
> {
  selectedItemId: string | null = null;

  setupEntities(): void {
    this.selectedItemId = null;
    this.isWon = false;
  }

  private findOption(itemId: string) {
    return this.content.options.find((opt) => opt.item_id === itemId);
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type !== "tap_option") {
      return ACTION_IGNORED;
    }
    const { item_id } = action.data as { item_id: string };
    const option = this.findOption(item_id);
    if (!option) {
      return ACTION_IGNORED;
    }
    return option.is_correct ? ACTION_CORRECT : ACTION_RETRY;
  }

  onItemLocked(itemId: string): void {
    this.selectedItemId = itemId;
    const isCorrect = this.findOption(itemId)?.is_correct === true;
    this.recordEvent("item_selected", {
      item_id: itemId,
      is_correct: isCorrect,
    });
    if (isCorrect) {
      this.winSession();
    }
  }
}
