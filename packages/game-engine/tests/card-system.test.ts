import { describe, expect, it } from "vitest";
import { type CardItem, CardSystem } from "#src/systems/card-system";

describe("cardSystem (BR-LVB-12 — independent test suite)", () => {
  const sampleCards: CardItem[] = [
    { id: "c1", pairKey: "apple" },
    { id: "c2", pairKey: "banana" },
    { id: "c3", pairKey: "apple" },
    { id: "c4", pairKey: "banana" },
  ];

  it("initializes cards in face_down state with total pair count", () => {
    const sys = new CardSystem();
    sys.init(sampleCards);

    expect(sys.getTotalPairs()).toBe(2);
    expect(sys.getMatchesCount()).toBe(0);
    expect(sys.getFlipCount()).toBe(0);
    expect(sys.isAllMatched()).toBe(false);

    for (const card of sys.getAllCards()) {
      expect(card.state).toBe("face_down");
    }
  });

  it("flips single card face up", () => {
    const sys = new CardSystem();
    sys.init(sampleCards);

    const res = sys.flipCard("c1");
    expect(res).toEqual({
      cardId: "c1",
      state: "face_up",
      isSecondFlip: false,
    });
    expect(sys.getCard("c1")?.state).toBe("face_up");
    expect(sys.getFlipCount()).toBe(1);
  });

  it("flips matching second card and marks both matched", () => {
    const sys = new CardSystem();
    sys.init(sampleCards);

    sys.flipCard("c1"); // apple
    const res = sys.flipCard("c3"); // apple match

    expect(res).toEqual({
      cardId: "c3",
      state: "matched",
      isSecondFlip: true,
      isMatch: true,
      matchedPairKey: "apple",
    });
    expect(sys.getCard("c1")?.state).toBe("matched");
    expect(sys.getCard("c3")?.state).toBe("matched");
    expect(sys.getMatchesCount()).toBe(1);
  });

  it("flips mismatching second card and allows closing mismatch", () => {
    const sys = new CardSystem();
    sys.init(sampleCards);

    sys.flipCard("c1"); // apple
    const res = sys.flipCard("c2"); // banana mismatch

    expect(res).toEqual({
      cardId: "c2",
      state: "face_up",
      isSecondFlip: true,
      isMatch: false,
      mismatchCardIds: ["c1", "c2"],
    });

    sys.closeMismatch();
    expect(sys.getCard("c1")?.state).toBe("face_down");
    expect(sys.getCard("c2")?.state).toBe("face_down");
  });

  it("reaches isAllMatched when all pairs are matched", () => {
    const sys = new CardSystem();
    sys.init(sampleCards);

    sys.flipCard("c1");
    sys.flipCard("c3"); // apple matched
    expect(sys.isAllMatched()).toBe(false);

    sys.flipCard("c2");
    sys.flipCard("c4"); // banana matched
    expect(sys.isAllMatched()).toBe(true);
    expect(sys.getMatchesCount()).toBe(2);
  });
});
