import { describe, expect, it } from "vitest";
import { GT019_FIXTURES } from "#src/templates/GT-019/fixtures.js";
import { GT019Session } from "#src/templates/GT-019/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

function makeSession(): GT019Session {
  const fixture = GT019_FIXTURES.find((f) => f.difficulty.allow_flip);
  if (!fixture) {
    throw new Error("Thiếu fixture GT-019 có allow_flip");
  }
  return new GT019Session(fixture.content, fixture.difficulty);
}

describe("GT-019: không chữ phải đọc (BR-E019-06)", () => {
  it("canvas không vẽ chữ cái hay số độ", () => {
    const drawn = collectRenderedText(makeSession());
    expect(lettersOnly(drawn)).toEqual([]);
    expect(drawn.filter((t) => t.includes("°"))).toEqual([]);
  });

  it("view không có label, mọi entity có spokenLabel (kể cả nút lật)", () => {
    const session = makeSession();
    session.prepareRound("4-5");
    const { entities } = session.getView();
    expect(entities.some((e) => e.id === "btn_flip")).toBe(true);
    for (const entity of entities) {
      expect(entity.label).toBeUndefined();
      expect(entity.spokenLabel).toBeTruthy();
    }
  });
});
