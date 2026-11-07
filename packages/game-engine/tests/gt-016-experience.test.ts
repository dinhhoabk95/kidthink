import { describe, expect, it } from "vitest";
import { GT016_FIXTURES } from "#src/templates/GT-016/fixtures.js";
import { ClockHandsSession } from "#src/templates/GT-016/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const WONDER_MS = 1500;
const HAPPY_MS = 500;

function openMode(mode: "read" | "set" | "match"): ClockHandsSession {
  const fixture = GT016_FIXTURES.find((f) => f.content.mode === mode);
  if (!fixture) {
    throw new Error(`Thiếu fixture GT-016 mode ${mode}`);
  }
  const session = new ClockHandsSession(fixture.content, fixture.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

describe("GT-016: khung chuyện Bạn Mặt Trời, tiếng tích tắc khi xoay kim, mascot đáp lại (BR-E016-05)", () => {
  it("storyLine nhắc Mặt Trời và khớp từng mode, không nhắc Gấu Con", () => {
    const read = openMode("read").storyLine() ?? "";
    const set = openMode("set").storyLine() ?? "";
    const match = openMode("match").storyLine() ?? "";

    expect(read).toContain("Mặt Trời");
    expect(read).not.toContain("xoay");
    expect(set).toContain("xoay kim");
    expect(match).toContain("hoạt động");
    expect(match).toContain("xoay kim");
    expect(read + set + match).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const drawn = lettersOnly(
      collectRenderedText(openMode("set"), { prepare: false })
    );

    expect(drawn.join(" ")).not.toContain("Mặt Trời");
  });

  it("xoay kim: một cue clock_tick và mascot happy rồi null, như nhau dù giờ đúng hay sai", () => {
    const session = openMode("set");
    session.commit({ type: "adjust_time", data: { delta: 60 } });
    expect(session.takeSfxCues()).toEqual(["clock_tick"]);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();

    session.commit({ type: "adjust_time", data: { delta: -60 } });
    expect(session.takeSfxCues()).toEqual(["clock_tick"]);
  });

  it("nộp giờ chưa đúng: không cue, mascot wonder rồi null", () => {
    const session = openMode("set");
    expect(session.submitCurrentTime()).toBe(false);

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("read: chọn sai là wonder; chọn đúng thì thắng và mascot null", () => {
    const session = openMode("read");
    const wrong = session.getOptions().findIndex((o) => !o.is_correct);
    const right = session.getOptions().findIndex((o) => o.is_correct);
    session.selectOption(wrong);
    expect(session.mascotMood()).toBe("wonder");

    session.selectOption(right);
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
