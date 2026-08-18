import type {
  GT004Content,
  GT004Difficulty,
} from "../../contracts/templates/gt004";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session";

export class GT004Session extends TemplateGameSession<
  GT004Content,
  GT004Difficulty
> {
  /** item_id -> group_id, correctly sorted items only */
  private readonly sortedItems: Map<string, string> = new Map();

  setupEntities(): void {
    this.sortedItems.clear();
    this.isWon = false;
  }

  private findItem(itemId: string) {
    return this.content.items.find((i) => i.item_id === itemId);
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type !== "sort_item") {
      return ACTION_IGNORED;
    }
    const { item_id, group_id } = action.data as {
      item_id: string;
      group_id: string;
    };
    const item = this.findItem(item_id);
    if (!item) {
      return ACTION_IGNORED;
    }
    return item.correct_group_id === group_id ? ACTION_CORRECT : ACTION_RETRY;
  }

  onItemSorted(itemId: string, groupId: string): void {
    const item = this.findItem(itemId);
    if (!item) {
      return;
    }

    const isCorrect = item.correct_group_id === groupId;
    this.recordEvent("item_sorted", {
      item_id: itemId,
      group_id: groupId,
      is_correct: isCorrect,
    });
    if (!isCorrect) {
      return;
    }

    this.sortedItems.set(itemId, groupId);
    if (this.sortedItems.size === this.content.items.length) {
      this.winSession();
    }
  }
}
