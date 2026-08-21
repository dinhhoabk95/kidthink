import {
  ACTION_CORRECT,
  ACTION_IGNORED,
  type ActionResult,
  type GameAction,
  TemplateGameSession,
} from "../../game-session.js";
import { PairingMechanic } from "../../mechanics/pairing-mechanic.js";
import { deriveStream } from "../../rng/mulberry32.js";
import { shuffle } from "../../rng/shuffle.js";
import {
  type CardItem,
  CardSystem,
  type FlipResult,
} from "../../systems/card-system.js";
import type { GT020Content, GT020Difficulty } from "./template.js";

export interface FlatCard {
  readonly cardId: string;
  readonly pairKey: string;
  readonly asset: GT020Content["pairs"][number]["card_a"]["asset"];
}

export class GT020Session extends TemplateGameSession<
  GT020Content,
  GT020Difficulty
> {
  readonly cardSystem = new CardSystem();
  private readonly pairingMechanic = new PairingMechanic();
  displayCards: readonly FlatCard[] = [];

  setupEntities(): void {
    this.isWon = false;
    const flat: FlatCard[] = this.content.pairs.flatMap((p) => [
      { cardId: p.card_a.card_id, pairKey: p.pair_key, asset: p.card_a.asset },
      { cardId: p.card_b.card_id, pairKey: p.pair_key, asset: p.card_b.asset },
    ]);

    const rng = deriveStream(this.layoutSeed, "items");
    this.displayCards = shuffle(flat, rng);

    const cardItems: CardItem[] = flat.map((c) => ({
      id: c.cardId,
      pairKey: c.pairKey,
    }));

    this.cardSystem.init(cardItems);
    this.pairingMechanic.reset();

    this.recordEvent("round_started", {
      round_index: 0,
      total_pairs: this.content.pairs.length,
      card_count: flat.length,
    });
  }

  validateAction(action: GameAction): ActionResult {
    if (action.type === "tap_card" || action.type === "flip_card") {
      const data = action.data;
      const cardId =
        typeof data === "object" && data !== null
          ? Reflect.get(data, "card_id")
          : undefined;
      if (typeof cardId !== "string" || cardId.length === 0) {
        return ACTION_IGNORED;
      }
      const card = this.cardSystem.getCard(cardId);
      if (card?.state !== "face_down") {
        return ACTION_IGNORED;
      }
      return ACTION_CORRECT;
    }

    return ACTION_IGNORED;
  }

  onTapCard(cardId: string): FlipResult | null {
    const result = this.cardSystem.flipCard(cardId);
    if (!result) {
      return null;
    }

    this.recordEvent("pair_selected", {
      card_id: cardId,
      state: result.state,
      is_second_flip: result.isSecondFlip,
    });

    if (result.isSecondFlip && result.isMatch) {
      const pair = this.content.pairs.find(
        (p) => p.pair_key === result.matchedPairKey
      );
      if (pair) {
        this.pairingMechanic.match(pair.card_a.card_id, pair.card_b.card_id);
      }
      this.recordEvent("pair_matched", {
        pair_key: result.matchedPairKey,
        matches_count: this.cardSystem.getMatchesCount(),
        total_pairs: this.cardSystem.getTotalPairs(),
      });

      if (this.cardSystem.isAllMatched()) {
        this.recordEvent("round_completed", { round_index: 0 });
        this.winSession();
      }
    }

    return result;
  }

  closeMismatch(): void {
    this.cardSystem.closeMismatch();
  }

  override checkWinCondition(): boolean {
    return this.cardSystem.isAllMatched();
  }
}

export default GT020Session;
