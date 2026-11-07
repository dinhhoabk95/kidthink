import { describe, expect, it } from "vitest";
import { GT032_FIXTURES } from "#src/templates/GT-032/fixtures.js";
import { GT032Session } from "#src/templates/GT-032/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

function makeSession(): GT032Session {
  const fixture = GT032_FIXTURES[0];
  if (!fixture) {
    throw new Error("Thiếu fixture GT-032");
  }
  return new GT032Session(fixture.content, fixture.difficulty);
}

describe("GT-032: không chữ phải đọc (BR-E032-08)", () => {
  it("canvas không vẽ chữ cái nào (kể cả dòng phụ bố cục cũ)", () => {
    expect(lettersOnly(collectRenderedText(makeSession()))).toEqual([]);
  });

  it("view không có label, tên cốc chỉ nằm trong spokenLabel", () => {
    const session = makeSession();
    session.prepareRound("4-5");
    const { entities } = session.getView();
    expect(entities.length).toBeGreaterThan(0);
    for (const entity of entities) {
      expect(entity.label).toBeUndefined();
      expect(entity.spokenLabel).toBeTruthy();
    }
  });
});
