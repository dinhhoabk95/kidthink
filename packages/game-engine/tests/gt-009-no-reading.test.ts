import { describe, expect, it } from "vitest";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures.js";
import { GT009Session } from "#src/templates/GT-009/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

function makeSession(index: number): GT009Session {
  const fixture = GT009_FIXTURES[index];
  if (!fixture) {
    throw new Error("Thiếu fixture GT-009");
  }
  return new GT009Session(fixture.content, fixture.difficulty);
}

describe("GT-009: thẻ manh mối không chữ phải đọc (BR-E009-06)", () => {
  it("manh mối chưa mở không vẽ chữ cái nào", () => {
    expect(lettersOnly(collectRenderedText(makeSession(0)))).toEqual([]);
  });

  it("manh mối đã mở vẽ ký hiệu số, không vẽ câu chữ", () => {
    const session = makeSession(1);
    session.prepareRound("4-5");
    // Manh mối thứ ba là "lớn hơn 3"; không ứng viên nào mang số 3.
    const slot = session.slots[2];
    if (!slot) {
      throw new Error("Thiếu ô manh mối");
    }
    session.dispatch({ type: "tap", x: slot.x, y: slot.y, timeMs: 0 });
    const drawn = collectRenderedText(session, { prepare: false });
    expect(lettersOnly(drawn)).toEqual([]);
    expect(drawn).toContain("3");
  });

  it("view không đặt label chữ cho manh mối, vẫn có spokenLabel", () => {
    const session = makeSession(1);
    session.prepareRound("4-5");
    const clues = session.getView().entities.filter((e) => e.role === "target");
    expect(clues.length).toBe(session.content.clues.length);
    for (const clue of clues) {
      expect(clue.label).toBeUndefined();
      expect(clue.spokenLabel).toBeTruthy();
    }
  });
});
