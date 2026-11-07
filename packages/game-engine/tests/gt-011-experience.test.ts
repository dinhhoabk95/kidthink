import { describe, expect, it } from "vitest";
import { GT011_FIXTURES } from "#src/templates/GT-011/fixtures.js";
import { GT011Session } from "#src/templates/GT-011/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const WONDER_MS = 1500;
const FIXTURE = GT011_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-011");
}

function openSession(): GT011Session {
  const session = new GT011Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5");
  return session;
}

function optionId(correct: boolean): string {
  return (
    FIXTURE.content.options.find((o) => o.is_correct === correct)?.option_id ??
    ""
  );
}

describe("GT-011: khung chuyện Bướm Nhỏ trồng luống hoa, tiếng hạt rơi, mascot đáp lại kết quả (BR-E011-05)", () => {
  it("storyLine nhắc Bướm Nhỏ và luống hoa, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Bướm Nhỏ");
    expect(story).toContain("luống hoa");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.join(" ")).not.toContain("Bướm");
  });

  it("xem trước một đáp án không có cue, mascot null", () => {
    const session = openSession();
    session.onOptionPreviewed(optionId(false));

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
  });

  it("chọn sai: wonder rồi null, không cue", () => {
    const session = openSession();
    session.commit({ type: "select_item", data: { item_id: optionId(false) } });

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("chọn đúng: một cue seed_plop, thắng, mascot null", () => {
    const session = openSession();
    session.commit({ type: "select_item", data: { item_id: optionId(true) } });

    expect(session.takeSfxCues()).toEqual(["seed_plop"]);
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
