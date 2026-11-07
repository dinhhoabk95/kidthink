import { describe, expect, it } from "vitest";
import { GT025_FIXTURES } from "#src/templates/GT-025/fixtures.js";
import { GT025Session } from "#src/templates/GT-025/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

/** Level hai điểm khác (`target_count: 2`) — đủ để có trạng thái "đang tìm". */
const FIXTURE = GT025_FIXTURES[1] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-025");
}

function openSession(): GT025Session {
  const session = new GT025Session(FIXTURE.content, FIXTURE.difficulty);
  session.prepareRound("4-5");
  return session;
}

describe("GT-025: khung chuyện, tiếng lấp lánh, mascot ngó nghiêng (BR-E025-05)", () => {
  it("storyLine nhắc Gấu Con và việc tìm chỗ khác nhau", () => {
    const story = openSession().storyLine();

    expect(story).toContain("Gấu Con");
    expect(story).toContain("khác nhau");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.some((t) => t.includes("Gấu Con"))).toBe(false);
  });

  it("điểm khác mới tìm ra xếp một cue sparkle_find", () => {
    const session = openSession();
    session.onTapObject("l-flower-2");

    expect(session.takeSfxCues()).toEqual(["sparkle_find"]);
  });

  it("chạm sai hoặc chạm lại điểm đã tìm không có cue", () => {
    const session = openSession();
    session.onTapObject("l-flower-2");
    session.takeSfxCues();

    session.onTapObject("l-flower-2");
    session.onTapObject("l-flower-1");

    expect(session.takeSfxCues()).toEqual([]);
  });

  it("mascot: null → wonder sau điểm đầu → null khi tìm đủ", () => {
    const session = openSession();
    expect(session.mascotMood()).toBeNull();

    session.onTapObject("l-flower-2");
    expect(session.mascotMood()).toBe("wonder");

    session.onTapObject("l-bird");
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
