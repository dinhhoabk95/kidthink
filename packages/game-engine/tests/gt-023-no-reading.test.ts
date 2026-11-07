import { describe, expect, it } from "vitest";
import { GT023_FIXTURES } from "#src/templates/GT-023/fixtures.js";
import { GT023Session } from "#src/templates/GT-023/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

function makeSession(): GT023Session {
  const fixture = GT023_FIXTURES.find(
    (f) =>
      f.content.anchors.some((a) => a.label) &&
      f.content.parts.some((p) => p.name)
  );
  if (!fixture) {
    throw new Error("Thiếu fixture GT-023 có nhãn neo và tên mảnh");
  }
  return new GT023Session(fixture.content, fixture.difficulty);
}

describe("GT-023: không chữ phải đọc (BR-E023-06)", () => {
  it("canvas không vẽ chuỗi chữ cái nào", () => {
    expect(lettersOnly(collectRenderedText(makeSession()))).toEqual([]);
  });

  it("view không có label, tên vẫn nằm trong spokenLabel", () => {
    const session = makeSession();
    session.prepareRound("4-5");
    const { entities } = session.getView();
    expect(entities.length).toBeGreaterThan(0);
    for (const entity of entities) {
      expect(entity.label).toBeUndefined();
    }
    expect(entities.some((e) => Boolean(e.spokenLabel))).toBe(true);
  });
});
