import { describe, expect, it } from "vitest";
import { GT035_FIXTURES } from "#src/templates/GT-035/fixtures.js";
import { GT035Session } from "#src/templates/GT-035/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const DIGITS = /^\d+$/;

function makeSession(): GT035Session {
  const fixture = GT035_FIXTURES[0];
  if (!fixture) {
    throw new Error("Thiếu fixture GT-035");
  }
  const session = new GT035Session(fixture.content, fixture.difficulty);
  session.prepareRound("5-6");
  session.commit({ type: "add_command", data: { command: "forward" } });
  session.commit({ type: "add_command", data: { command: "turn_left" } });
  return session;
}

describe("GT-035: không chữ phải đọc (BR-E035-10)", () => {
  it("canvas không vẽ chữ cái nào (thẻ lệnh, ô đích)", () => {
    expect(
      lettersOnly(collectRenderedText(makeSession(), { prepare: false }))
    ).toEqual([]);
  });

  it("view không có label chữ, mọi entity có spokenLabel", () => {
    const { entities } = makeSession().getView();
    expect(entities.length).toBeGreaterThan(0);
    for (const entity of entities) {
      expect(entity.label ?? "0").toMatch(DIGITS);
      expect(entity.spokenLabel).toBeTruthy();
    }
  });

  it("lệnh trong hàng được đọc tên dù không vẽ chữ", () => {
    const queue = makeSession()
      .getView()
      .entities.filter((e) => e.id.startsWith("queue_"));
    expect(queue[0]?.spokenLabel).toContain("Tiến");
    expect(queue[1]?.spokenLabel).toContain("Xoay trái");
  });
});
