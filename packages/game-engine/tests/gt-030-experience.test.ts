import { describe, expect, it } from "vitest";
import { GT030_FIXTURES } from "#src/templates/GT-030/fixtures.js";
import { GT030Session } from "#src/templates/GT-030/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 700;
const WONDER_MS = 1500;
const FIXTURE = GT030_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-030");
}

function openSession(): GT030Session {
  const session = new GT030Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

describe("GT-030: khung chuyện Sâu Nhỏ muốn biết dài bao nhiêu, tiếng nối khớp từng đơn vị, mascot đáp lại (BR-E030-07)", () => {
  it("storyLine nhắc Sâu Nhỏ và đo, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Sâu Nhỏ");
    expect(story).toContain("đo");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const drawn = lettersOnly(
      collectRenderedText(openSession(), { prepare: false })
    );

    expect(drawn.join(" ")).not.toContain("Sâu Nhỏ");
  });

  it("đặt khít mép: một cue clip_link, mascot happy rồi null", () => {
    const session = openSession();
    session.commit({ type: "place_unit", data: {} });

    expect(session.takeSfxCues()).toEqual(["clip_link"]);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("đặt lệch quá dung sai (khe/chồng): không cue, mascot wonder rồi null", () => {
    const session = openSession();
    session.commit({ type: "place_unit", data: { offset_px: 999 } });

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("chọn số đo sai: không cue, mascot wonder; chọn đúng thì thắng, mascot null", () => {
    const session = openSession();
    for (let i = 0; i < FIXTURE.content.object.length_in_units; i++) {
      session.commit({ type: "place_unit", data: {} });
    }
    session.takeSfxCues();
    session.update(HAPPY_MS + 1);
    const wrong = FIXTURE.content.answer_options.find((o) => !o.is_correct);
    const right = FIXTURE.content.answer_options.find((o) => o.is_correct);
    session.commit({
      type: "select_option",
      data: { option_id: wrong?.option_id },
    });

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");

    session.commit({
      type: "select_option",
      data: { option_id: right?.option_id },
    });
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
