import { describe, expect, it } from "vitest";
import { GT008_FIXTURES } from "#src/templates/GT-008/fixtures.js";
import { GT008Session } from "#src/templates/GT-008/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

function makeSession(): GT008Session {
  const fixture = GT008_FIXTURES[0];
  if (!fixture) {
    throw new Error("Thiếu fixture GT-008");
  }
  return new GT008Session(fixture.content, fixture.difficulty);
}

describe("GT-008: không chữ phải đọc (BR-E008-05)", () => {
  it("canvas không vẽ chuỗi chữ cái nào", () => {
    expect(lettersOnly(collectRenderedText(makeSession()))).toEqual([]);
  });

  it("view không có label, mọi entity có spokenLabel", () => {
    const session = makeSession();
    session.prepareRound("4-5");
    const { entities } = session.getView();
    expect(entities.length).toBeGreaterThan(0);
    for (const entity of entities) {
      expect(entity.label).toBeUndefined();
      expect(entity.spokenLabel).toBeTruthy();
    }
  });

  it("ô đích rỗng nói tên vật nó nhận khi chạm", () => {
    const session = makeSession();
    session.prepareRound("4-5");
    const target = session.getView().entities.find((e) => e.role === "target");
    expect(target?.spokenLabel).toContain("Toa 1");
  });
});
