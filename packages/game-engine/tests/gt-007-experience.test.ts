import { describe, expect, it } from "vitest";
import { GT007_FIXTURES } from "#src/templates/GT-007/fixtures.js";
import { GT007Session } from "#src/templates/GT-007/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const WONDER_MS = 1500;
const FIXTURE = GT007_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-007");
}

function openSession(): GT007Session {
  const session = new GT007Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5");
  return session;
}

function fill(session: GT007Session, correct: boolean): void {
  const option = FIXTURE.content.options.find((o) => o.is_correct === correct);
  session.commit({ type: "fill_part", data: { option_id: option?.id } });
}

describe("GT-007: khung chuyện Khỉ Nhỏ chia kẹo, tiếng kẹo rơi, mascot đáp lại kết quả (BR-E007-05)", () => {
  it("storyLine nhắc Khỉ Nhỏ và kẹo, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Khỉ Nhỏ");
    expect(story).toContain("kẹo");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.join(" ")).not.toContain("Khỉ");
  });

  it("xem trước một lựa chọn không có cue, mascot null", () => {
    const session = openSession();
    session.previewOption(FIXTURE.content.options[0]?.id ?? "");

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBeNull();
  });

  it("thả phần sai: wonder rồi null, không cue", () => {
    const session = openSession();
    fill(session, false);

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("thả phần đúng: một cue candy_drop, thắng, mascot null", () => {
    const session = openSession();
    fill(session, true);

    expect(session.takeSfxCues()).toEqual(["candy_drop"]);
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
