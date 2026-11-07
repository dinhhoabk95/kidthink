import { describe, expect, it } from "vitest";
import { GT005_FIXTURES } from "#src/templates/GT-005/fixtures.js";
import { GT005Session } from "#src/templates/GT-005/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const CHEER_MS = 1000;
const WONDER_MS = 1500;
const FIXTURE = GT005_FIXTURES[0] ?? failMissingFixture();
const PAIRS = FIXTURE.content.pairs;

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-005");
}

function openSession(): GT005Session {
  const session = new GT005Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5");
  return session;
}

function match(session: GT005Session, left: number, right: number): void {
  session.commit({
    type: "match_pair",
    data: {
      left_item_id: PAIRS[left]?.left.item_id,
      right_item_id: PAIRS[right]?.right.item_id,
    },
  });
}

describe("GT-005: khung chuyện Sóc Nâu, tiếng kẹp, mascot đáp lại kết quả (BR-E005-04)", () => {
  it("storyLine nhắc Sóc Nâu và đôi bạn, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Sóc Nâu");
    expect(story).toContain("đôi bạn");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const drawn = lettersOnly(
      collectRenderedText(openSession(), { prepare: false })
    );

    expect(drawn).toEqual([]);
  });

  it("cặp đúng xếp cue peg_clip và mascot cheer; cặp sai không có cue", () => {
    const session = openSession();
    match(session, 0, 0);
    expect(session.takeSfxCues()).toEqual(["peg_clip"]);
    expect(session.mascotMood()).toBe("cheer");
    session.update(CHEER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    match(session, 1, 0);
    expect(session.takeSfxCues()).toEqual([]);
  });

  it("cặp sai: wonder rồi null; ghép đúng cặp cuối thì thắng, mascot null", () => {
    const session = openSession();
    match(session, 0, 1);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    for (let i = 0; i < PAIRS.length; i++) {
      match(session, i, i);
    }
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
