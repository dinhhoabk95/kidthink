import { describe, expect, it } from "vitest";
import { GT013_FIXTURES } from "#src/templates/GT-013/fixtures.js";
import { GT013Session } from "#src/templates/GT-013/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const SHRUG_MS = 1200;
const FIXTURE = GT013_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-013");
}

function openSession(): GT013Session {
  const session = new GT013Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5");
  return session;
}

describe("GT-013: khung chuyện Chuột Nhắt, tiếng chân, boing khi đụng tường (BR-E013-07)", () => {
  it("storyLine nhắc Chuột Nhắt và tường, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Chuột Nhắt");
    expect(story).toContain("tường");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.join(" ")).not.toContain("Chuột");
  });

  it("bước hợp lệ: một cue mouse_step, mascot null", () => {
    const session = openSession();
    expect(session.onPathStep({ row: 1, col: 0 }).status).toBe("moved");

    expect(session.takeSfxCues()).toEqual(["mouse_step"]);
    expect(session.mascotMood()).toBeNull();
  });

  it("đụng tường: một cue wall_boing, mascot wonder rồi null", () => {
    const session = openSession();
    expect(session.onPathStep({ row: 0, col: 1 }).status).toBe("blocked");

    expect(session.takeSfxCues()).toEqual(["wall_boing"]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(SHRUG_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("lùi lại không có cue", () => {
    const session = openSession();
    session.onPathStep({ row: 1, col: 0 });
    session.takeSfxCues();

    expect(session.onPathStep({ row: 0, col: 0 }).status).toBe("rewound");
    expect(session.takeSfxCues()).toEqual([]);
  });

  it("đi hết lối đúng thì thắng, mascot null", () => {
    const session = openSession();
    for (const cell of [
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ]) {
      session.commit({ type: "stroke_path", data: { cells: [cell] } });
    }
    session.onPathSubmitted();

    expect(session.mascotMood()).toBeNull();
  });
});
