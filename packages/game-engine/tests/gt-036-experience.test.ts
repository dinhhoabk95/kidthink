import { describe, expect, it } from "vitest";
import { GT036_FIXTURES } from "#src/templates/GT-036/fixtures.js";
import { GT036Session } from "#src/templates/GT-036/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const HAPPY_MS = 500;
const ENCOURAGE_MS = 1500;
const FIXTURE = GT036_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-036");
}

function openSession(): GT036Session {
  const session = new GT036Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

function place(session: GT036Session, slotIndex: number, id: string): void {
  session.commit({
    type: "place_element",
    data: { slotIndex, elementId: id },
  });
}

describe("GT-036: khung chuyện Họa Mi hát theo quy luật, tiếng xâu hạt, mascot đáp lại (BR-E036-10)", () => {
  it("storyLine nhắc Họa Mi và xâu hạt, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Họa Mi");
    expect(story).toContain("xâu");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const drawn = lettersOnly(
      collectRenderedText(openSession(), { prepare: false })
    );

    expect(drawn.join(" ")).not.toContain("Họa Mi");
  });

  it("đặt hạt: mỗi lần một cue bead_click và mascot happy rồi null, giống nhau mọi hạt", () => {
    const session = openSession();
    place(session, 0, "star");
    expect(session.takeSfxCues()).toEqual(["bead_click"]);
    expect(session.mascotMood()).toBe("happy");
    session.update(HAPPY_MS + 1);
    expect(session.mascotMood()).toBeNull();

    place(session, 1, "star");
    expect(session.takeSfxCues()).toEqual(["bead_click"]);
  });

  it("nộp khi chưa thành quy luật: không cue, mascot encourage rồi null", () => {
    const session = openSession();
    place(session, 0, "star");
    place(session, 1, "star");
    session.takeSfxCues();
    session.commit({ type: "submit_creation", data: {} });

    expect(session.checkWinCondition()).toBe(false);
    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("encourage");
    session.update(ENCOURAGE_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("nộp quy luật đủ lặp: thắng, mascot null", () => {
    const session = openSession();
    ["star", "moon", "star", "moon", "star", "moon"].forEach((id, i) => {
      place(session, i, id);
    });
    session.commit({ type: "submit_creation", data: {} });

    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
