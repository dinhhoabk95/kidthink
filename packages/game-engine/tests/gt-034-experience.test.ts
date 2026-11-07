import { describe, expect, it } from "vitest";
import { GT034_FIXTURES } from "#src/templates/GT-034/fixtures.js";
import { GT034Session } from "#src/templates/GT-034/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 500;
const WONDER_MS = 1500;
const PLAIN = GT034_FIXTURES[0] ?? failMissingFixture();
const WITH_REST =
  GT034_FIXTURES.find((f) => f.content.target_pattern.includes(null)) ??
  failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-034");
}

function open(fixture: typeof PLAIN): GT034Session {
  const session = new GT034Session(fixture.content, fixture.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

describe("GT-034: khung chuyện Dế Mèn gõ trống phách mõ, tiếng mõ ở nhịp nghỉ, mascot đáp lại (BR-E034-09)", () => {
  it("storyLine nhắc Dế Mèn, trống và phách, không nhắc Gấu Con", () => {
    const story = open(PLAIN).storyLine() ?? "";

    expect(story).toContain("Dế Mèn");
    expect(story).toContain("trống");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const drawn = lettersOnly(
      collectRenderedText(open(PLAIN), { prepare: false })
    );

    expect(drawn.join(" ")).not.toContain("Dế Mèn");
  });

  it("gõ nhạc cụ giữa chừng: không cue mới, mascot happy rồi null, như nhau dù đúng hay sai nhạc cụ", () => {
    const session = open(PLAIN);
    const wrong = PLAIN.content.instruments.find(
      (i) => i.instrument_id !== PLAIN.content.target_pattern[0]
    );
    session.commit({
      type: "tap_instrument",
      data: { instrument_id: wrong?.instrument_id },
    });

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("gõ nghỉ: một cue wood_beat như nhau dù đúng hay sai chỗ nghỉ", () => {
    const session = open(WITH_REST);
    session.commit({ type: "tap_rest", data: {} });
    expect(session.takeSfxCues()).toEqual(["wood_beat"]);
    session.commit({ type: "tap_rest", data: {} });
    expect(session.takeSfxCues()).toEqual(["wood_beat"]);
  });

  it("nghe mẫu: mascot listen suốt lúc phát rồi null", () => {
    const session = open(PLAIN);
    expect(session.mascotMood()).toBeNull();
    session.commit({ type: "play_pattern", data: {} });
    expect(session.mascotMood()).toBe("listen");
    session.update(60_000);
    expect(session.mascotMood()).toBeNull();
  });

  it("đủ bước nhưng sai chuỗi: wonder rồi null", () => {
    const session = open(PLAIN);
    const wrong = PLAIN.content.instruments.find(
      (i) => i.instrument_id !== PLAIN.content.target_pattern[0]
    );
    for (const _step of PLAIN.content.target_pattern) {
      session.commit({
        type: "tap_instrument",
        data: { instrument_id: wrong?.instrument_id },
      });
    }
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 60_000);
    expect(session.mascotMood()).toBeNull();
  });
});
