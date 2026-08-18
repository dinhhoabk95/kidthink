import type {
  GT002Content,
  GT002Difficulty,
} from "../../contracts/templates/gt002";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session";

export class GT002Session extends TemplateGameSession<
  GT002Content,
  GT002Difficulty
> {
  private readonly selectedItemIds: Set<string> = new Set();

  setupEntities(): void {
    this.selectedItemIds.clear();
    this.isWon = false;
  }

  toggleItemSelection(itemId: string): void {
    if (this.selectedItemIds.has(itemId)) {
      this.selectedItemIds.delete(itemId);
    } else {
      this.selectedItemIds.add(itemId);
    }
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type !== "submit_selection") {
      return ACTION_IGNORED;
    }
    const correctTargetIds = new Set(
      this.content.items.filter((i) => i.is_correct).map((i) => i.item_id)
    );

    const isExactMatch =
      this.selectedItemIds.size === correctTargetIds.size &&
      [...this.selectedItemIds].every((id) => correctTargetIds.has(id));

    return isExactMatch ? ACTION_CORRECT : ACTION_RETRY;
  }

  onSubmitSelection(): void {
    const { valid } = this.validateAction({
      type: "submit_selection",
      data: {},
    });
    this.recordEvent("selection_submitted", { is_correct: valid });
    if (valid) {
      this.winSession();
    }
  }
}
