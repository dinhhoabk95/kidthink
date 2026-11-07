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
    const first = session.content.clues[0];
    if (!first) {
      throw new Error("Thiếu manh mối");
    }
    session.dispatch({
      type: "tap",
      x: session.slots[0]?.x ?? 0,
      y: session.slots[0]?.y ?? 0,
      timeMs: 0,
    });
    const drawn = collectRenderedText(session);
    expect(lettersOnly(drawn)).toEqual([]);
    expect(drawn).toContain("5");
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
