import { describe, expect, it } from "vitest";
import { GT028_FIXTURES } from "#src/templates/GT-028/fixtures.js";
import { GT028Session } from "#src/templates/GT-028/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

function makeSession(): GT028Session {
  const fixture = GT028_FIXTURES[0];
  if (!fixture) {
    throw new Error("Thiếu fixture GT-028");
  }
  return new GT028Session(fixture.content, fixture.difficulty);
}

describe("GT-028: dải phụ không chữ phải đọc (BR-E028-05)", () => {
  it("canvas chỉ vẽ ký hiệu +n và chữ số, không chữ cái", () => {
    const session = makeSession();
    const drawn = collectRenderedText(session);
    expect(lettersOnly(drawn)).toEqual([]);
    expect(drawn).toContain(`+${session.content.step}`);
  });

  it("vật chưa chọn không có label, vẫn có spokenLabel", () => {
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
