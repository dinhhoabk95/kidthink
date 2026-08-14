import type {
  GT005Content,
  GT005Difficulty,
} from "../../contracts/templates/gt005";
import { BaseGameSession, type FeedbackKind } from "../../game-session";

export class GT005Session extends BaseGameSession {
  readonly content: GT005Content;
  readonly difficulty: GT005Difficulty;
  private readonly matchedPairIds: Set<string> = new Set();
  private isWon = false;

  constructor(content: GT005Content, difficulty: GT005Difficulty) {
    super();
    this.content = content;
    this.difficulty = difficulty;
  }

  setupEntities(): void {
    this.matchedPairIds.clear();
    this.isWon = false;
  }

  validateAction(action: { type: string; data: unknown }): {
    valid: boolean;
    feedback: FeedbackKind;
  } {
    if (action.type !== "match_pair") {
      return { valid: false, feedback: "none" };
    }
    const data = action.data as { left_item_id: string; right_item_id: string };
    const pair = this.content.pairs.find(
      (p) =>
        p.left.item_id === data.left_item_id &&
        p.right.item_id === data.right_item_id
    );

    if (pair) {
      return { valid: true, feedback: "pop_celebrate" };
    }
    return { valid: false, feedback: "amber_soft" };
  }

  onPairMatched(leftItemId: string, rightItemId: string): void {
    const pair = this.content.pairs.find(
      (p) => p.left.item_id === leftItemId && p.right.item_id === rightItemId
    );

    if (pair) {
      this.matchedPairIds.add(pair.pair_id);
      this.recordEvent("pair_matched", { pair_id: pair.pair_id });
      if (this.matchedPairIds.size === this.content.pairs.length) {
        this.isWon = true;
        this.completeSession();
      }
    } else {
      this.recordEvent("pair_selected", {
        left_item_id: leftItemId,
        right_item_id: rightItemId,
        is_correct: false,
      });
    }
  }

  checkWinCondition(): boolean {
    return this.isWon;
  }
}
