import { describe, expect, it } from "vitest";
import { GT008_FIXTURES } from "#src/templates/GT-008/fixtures.js";
import { GT008Session } from "#src/templates/GT-008/session.js";
import { collectRenderedText, lettersOnly } from "./helpers/rendered-text.ts";

const CHEER_MS = 1000;
const WONDER_MS = 1500;
const FIXTURE = GT008_FIXTURES[0] ?? failMissingFixture();
const SLOTS = FIXTURE.content.slots;

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-008");
}

function openSession(): GT008Session {
  const session = new GT008Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("4-5");
  return session;
}

function drop(session: GT008Session, itemSlot: number, slot: number): void {
  session.commit({
    type: "place_item",
    data: {
      item_id: SLOTS[itemSlot]?.expected_item_id,
      slot_id: SLOTS[slot]?.slot_id,
    },
  });
}

describe("GT-008: khung chuyện Voi Con giữ bãi đỗ, tiếng cạch, mascot đáp lại kết quả (BR-E008-06)", () => {
  it("storyLine nhắc Voi Con và bãi đỗ, không nhắc Gấu Con", () => {
    const story = openSession().storyLine() ?? "";

    expect(story).toContain("Voi Con");
    expect(story).toContain("bãi đỗ");
    expect(story).not.toContain("Gấu Con");
  });

  it("khung chuyện không lên canvas", () => {
    const session = openSession();
    const drawn = lettersOnly(collectRenderedText(session, { prepare: false }));

    expect(drawn.join(" ")).not.toContain("Voi");
  });

  it("thả đúng ô: một cue park_thunk và mascot cheer rồi null", () => {
    const session = openSession();
    drop(session, 0, 0);

    expect(session.takeSfxCues()).toEqual(["park_thunk"]);
    expect(session.mascotMood()).toBe("cheer");
    session.update(CHEER_MS + 1);
    expect(session.mascotMood()).toBeNull();
  });

  it("thả sai ô: wonder rồi null, không cue; thả đủ đúng thì thắng, mascot null", () => {
    const session = openSession();
    drop(session, 0, 1);

    expect(session.takeSfxCues()).toEqual([]);
    expect(session.mascotMood()).toBe("wonder");
    session.update(WONDER_MS + 1);
    expect(session.mascotMood()).toBeNull();

    for (let i = 0; i < SLOTS.length; i++) {
      drop(session, i, i);
    }
    expect(session.checkWinCondition()).toBe(true);
    expect(session.mascotMood()).toBeNull();
  });
});
