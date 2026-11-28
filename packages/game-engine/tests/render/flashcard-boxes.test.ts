import { describe, expect, it } from "vitest";
import { flashcardBoxes } from "#src/render/flashcard.js";

/** Chiều cao thẻ tiêu biểu cho ba band tuổi (thấp → cao). */
const CARD_HEIGHTS = { "3-4": 120, "4-5": 180, "5-6": 260 } as const;
const LABEL_PX = 20;

describe("flashcardBoxes: hộp hình và hộp nhãn không giao nhau", () => {
  for (const [band, cardH] of Object.entries(CARD_HEIGHTS)) {
    it(`band ${band} (thẻ cao ${cardH}): hai hộp tách rời và nằm trong thẻ`, () => {
      const { visual, label } = flashcardBoxes(cardH, LABEL_PX);

      expect(visual.bottom).toBeLessThanOrEqual(label.top);
      expect(visual.top).toBeGreaterThanOrEqual(-cardH / 2);
      expect(label.bottom).toBeLessThanOrEqual(cardH / 2);
      expect(visual.size).toBeGreaterThan(0);
    });
  }

  it("thẻ thấp thì hình co lại", () => {
    const low = flashcardBoxes(CARD_HEIGHTS["3-4"], LABEL_PX).visual.size;
    const high = flashcardBoxes(CARD_HEIGHTS["5-6"], LABEL_PX).visual.size;

    expect(low).toBeLessThan(high);
  });
});
