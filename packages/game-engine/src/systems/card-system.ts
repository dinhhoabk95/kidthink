/**
 * cardSystem — Quản lý trạng thái lật thẻ, ghép cặp, và luật kiểm tra cho memory-flip (GT-020).
 * Độc lập hoàn toàn với template (BR-LVB-12, BR-MTB-15).
 */

export type CardState = "face_down" | "face_up" | "matched";

export interface CardItem {
  readonly id: string;
  readonly pairKey: string;
}

export interface CardStateItem {
  readonly id: string;
  readonly pairKey: string;
  state: CardState;
}

export interface FlipResult {
  readonly cardId: string;
  readonly state: CardState;
  readonly isSecondFlip: boolean;
  readonly isMatch?: boolean;
  readonly matchedPairKey?: string;
  readonly mismatchCardIds?: [string, string];
}

export class CardSystem {
  private readonly cards: Map<string, CardStateItem> = new Map();
  private openCardIds: string[] = [];
  private matchesCount = 0;
  private totalPairs = 0;
  private flipCount = 0;

  init(cards: readonly CardItem[]): void {
    this.cards.clear();
    this.openCardIds = [];
    this.matchesCount = 0;
    this.flipCount = 0;
    const pairKeys = new Set<string>();
    for (const c of cards) {
      this.cards.set(c.id, {
        id: c.id,
        pairKey: c.pairKey,
        state: "face_down",
      });
      pairKeys.add(c.pairKey);
    }
    this.totalPairs = pairKeys.size;
  }

  getCard(id: string): CardStateItem | undefined {
    return this.cards.get(id);
  }

  getAllCards(): readonly CardStateItem[] {
    return Array.from(this.cards.values());
  }

  getFlipCount(): number {
    return this.flipCount;
  }

  getMatchesCount(): number {
    return this.matchesCount;
  }

  getTotalPairs(): number {
    return this.totalPairs;
  }

  isAllMatched(): boolean {
    return this.totalPairs > 0 && this.matchesCount === this.totalPairs;
  }

  flipCard(id: string): FlipResult | null {
    const card = this.cards.get(id);
    if (card?.state !== "face_down" || this.openCardIds.length >= 2) {
      return null;
    }

    card.state = "face_up";
    this.flipCount++;
    this.openCardIds.push(id);

    if (this.openCardIds.length === 1) {
      return {
        cardId: id,
        state: "face_up",
        isSecondFlip: false,
      };
    }

    // Second flip
    const [firstId, secondId] = this.openCardIds as [string, string];
    const firstCard = this.cards.get(firstId);
    const secondCard = this.cards.get(secondId);

    if (!(firstCard && secondCard)) {
      return null;
    }

    const isMatch = firstCard.pairKey === secondCard.pairKey;
    if (isMatch) {
      firstCard.state = "matched";
      secondCard.state = "matched";
      this.matchesCount++;
      this.openCardIds = [];
      return {
        cardId: id,
        state: "matched",
        isSecondFlip: true,
        isMatch: true,
        matchedPairKey: firstCard.pairKey,
      };
    }

    return {
      cardId: id,
      state: "face_up",
      isSecondFlip: true,
      isMatch: false,
      mismatchCardIds: [firstId, secondId],
    };
  }

  closeMismatch(): void {
    for (const id of this.openCardIds) {
      const card = this.cards.get(id);
      if (card && card.state === "face_up") {
        card.state = "face_down";
      }
    }
    this.openCardIds = [];
  }
}
