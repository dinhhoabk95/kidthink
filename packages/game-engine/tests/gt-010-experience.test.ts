import { describe, expect, it } from "vitest";
import { GT010_FIXTURES } from "#src/templates/GT-010/fixtures.js";
import { SubstitutionSession } from "#src/templates/GT-010/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const WONDER_MS = 1500;
const FIXTURE = GT010_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-010");
}

function openSession(): SubstitutionSession {
  const session = new SubstitutionSession(
    FIXTURE.content,
    FIXTURE.difficulty,
    0
  );
  session.prepareRound("4-5");
  return session;
}

function pick(session: SubstitutionSession, correct: boolean): void {
  const option = FIXTURE.content.options.find((o) => o.is_correct === correct);
  session.commit({ type: "select_value", data: option?.value });
}

describe("GT-010: khung chuyện Cô Gà Mái bán hàng, tiếng chuông, mascot đáp lại kết quả (BR-E010-06)", () => {
  it("storyLine nhắc Cô Gà Mái và bảng giá, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Cô Gà Mái");
    expect(story).toContain("bảng giá");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.join(" ")).not.toContain("Gà Mái");
  });

  it("tra dòng luật không có cue, mascot null", () => {
    const session = openSession();
    const equation = FIXTURE.content.equations[0];
    session.commit({ type: "look_up_rule", data: equation?.equation_id });

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
  });

  it("chọn giá sai: wonder rồi null, không cue", () => {
    const session = openSession();
    pick(session, false);

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("chọn giá đúng: một cue price_bell, thắng, mascot null", () => {
    const session = openSession();
    pick(session, true);

    expect(session.takeSfxCues()).toEqual(["price_bell"]);
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
