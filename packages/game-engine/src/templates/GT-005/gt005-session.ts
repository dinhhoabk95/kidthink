import type {
  GT005Content,
  GT005Difficulty,
} from "../../contracts/templates/gt005.js";
import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session.js";
import { deriveStream } from "../../rng/mulberry32.js";
import { shuffle } from "../../rng/shuffle.js";

type LeftItem = GT005Content["pairs"][number]["left"];
type RightItem = GT005Content["pairs"][number]["right"];

export class GT005Session extends TemplateGameSession<
  GT005Content,
  GT005Difficulty
> {
  private readonly matchedPairIds: Set<string> = new Set();
  displayLeft: readonly LeftItem[] = [];
  displayRight: readonly RightItem[] = [];

  setupEntities(): void {
    this.matchedPairIds.clear();
    this.isWon = false;

    const lefts = this.content.pairs.map((p) => p.left);
    const rights = this.content.pairs.map((p) => p.right);

    if (this.difficulty.shuffle_sides === false) {
      this.displayLeft = [...lefts];
      this.displayRight = [...rights];
    } else {
      const rng = deriveStream(this.layoutSeed, "sides");
      this.displayLeft = shuffle(lefts, rng);
      this.displayRight = shuffle(rights, rng);
    }
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
