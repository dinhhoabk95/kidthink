import { describe, expect, it } from "vitest";
import { GT029_FIXTURES } from "#src/templates/GT-029/fixtures.js";
import { GT029Session } from "#src/templates/GT-029/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

function makeSession(): GT029Session {
  const fixture = GT029_FIXTURES[0];
  if (!fixture) {
    throw new Error("Thiếu fixture GT-029");
  }
  return new GT029Session(fixture.content, fixture.difficulty);
}

describe("GT-029: dải phụ không chữ phải đọc (BR-E029-05)", () => {
  it("canvas chỉ vẽ ký hiệu -m và chữ số, không chữ cái", () => {
    const session = makeSession();
    const drawn = collectRenderedText(session);
    expect(lettersOnly(drawn)).toEqual([]);
    expect(drawn).toContain(`-${session.content.remove_count}`);
  });

  it("vẫn không chữ sau khi bớt đủ (hiện ô đáp án)", () => {
    const session = makeSession();
    session.prepareRound("4-5");
    for (const it of session.content.initial_items.slice(
      0,
      session.content.remove_count
    )) {
      session.commit({ type: "remove_item", data: { item_id: it.item_id } });
    }
    expect(session.getRemovedCount()).toBe(session.content.remove_count);
    expect(
      lettersOnly(collectRenderedText(session, { prepare: false }))
    ).toEqual([]);
  });

  it("vật trong nhóm không có label", () => {
    const session = makeSession();
    session.prepareRound("4-5");
    const { entities } = session.getView();
    expect(entities.length).toBeGreaterThan(0);
    for (const entity of entities.filter((e) => e.role === "source")) {
      expect(entity.label).toBeUndefined();
    }
  });
});
