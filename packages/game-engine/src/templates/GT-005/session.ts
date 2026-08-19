import {
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session.js";
import { PairingMechanic } from "../../mechanics/pairing-mechanic.js";
import { deriveStream } from "../../rng/mulberry32.js";
import { shuffle } from "../../rng/shuffle.js";
import type { GT005Content, GT005Difficulty } from "./template.js";

type LeftItem = GT005Content["pairs"][number]["left"];
type RightItem = GT005Content["pairs"][number]["right"];

export class GT005Session extends TemplateGameSession<
  GT005Content,
  GT005Difficulty
> {
  displayLeft: readonly LeftItem[] = [];
  displayRight: readonly RightItem[] = [];
  private readonly mechanic = new PairingMechanic();

  setupEntities(): void {
    this.mechanic.reset();
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
    const validPairs = this.content.pairs.map((p) => ({
      leftId: p.left.item_id,
      rightId: p.right.item_id,
    }));
    return this.mechanic.validate(action, validPairs);
  }

  onPairMatched(leftItemId: string, rightItemId: string): void {
    const pair = this.findPair(leftItemId, rightItemId);
    if (!pair) {
      return;
    }

    this.mechanic.match(leftItemId, rightItemId);
    this.recordEvent("pair_matched", {
      pair_id: pair.pair_id,
      left_item_id: leftItemId,
      right_item_id: rightItemId,
    });

    if (this.checkWinCondition()) {
      this.winSession();
    }
  }

  override checkWinCondition(): boolean {
    const validPairs = this.content.pairs.map((p) => ({
      leftId: p.left.item_id,
      rightId: p.right.item_id,
    }));
    return this.mechanic.isPairingComplete(validPairs);
  }
}

export default GT005Session;
