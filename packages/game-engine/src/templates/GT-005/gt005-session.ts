import type {
  GT005Content,
  GT005Difficulty,
} from "../../contracts/templates/gt005";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session";

export class GT005Session extends TemplateGameSession<
  GT005Content,
  GT005Difficulty
> {
  private readonly matchedPairIds: Set<string> = new Set();

  setupEntities(): void {
    this.matchedPairIds.clear();
    this.isWon = false;
  }

  private findPair(leftItemId: string, rightItemId: string) {
    return this.content.pairs.find(
      (p) => p.left.item_id === leftItemId && p.right.item_id === rightItemId
    );
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type !== "match_pair") {
      return ACTION_IGNORED;
    }
    const { left_item_id, right_item_id } = action.data as {
      left_item_id: string;
      right_item_id: string;
    };
    return this.findPair(left_item_id, right_item_id)
      ? ACTION_CORRECT
      : ACTION_RETRY;
  }

  onPairMatched(leftItemId: string, rightItemId: string): void {
    const pair = this.findPair(leftItemId, rightItemId);
    if (!pair) {
      this.recordEvent("pair_selected", {
        left_item_id: leftItemId,
        right_item_id: rightItemId,
        is_correct: false,
      });
      return;
    }

    this.matchedPairIds.add(pair.pair_id);
    this.recordEvent("pair_matched", { pair_id: pair.pair_id });
    if (this.matchedPairIds.size === this.content.pairs.length) {
      this.winSession();
    }
  }
}
